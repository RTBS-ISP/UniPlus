from datetime import datetime

from ninja import Router
from ninja.security import django_auth
from django.shortcuts import get_object_or_404
from django.utils import timezone

from api import schemas
from api.model.event import Event
from api.model.ticket import Ticket
from api.model.notification import (
    send_approval_notification,
    send_rejection_notification,
)

router = Router(tags=["approval"])


@router.post(
    "/events/{event_id}/registrations/bulk-action",
    auth=django_auth,
    response={200: schemas.ApprovalResponseSchema, 403: schemas.ErrorSchema, 400: schemas.ErrorSchema},
)
def bulk_approve_reject(request, event_id: int, payload: schemas.ApprovalRequestSchema):
    """
    Approve or reject multiple registrations at once.
    When rejecting: remove from attendee list to free up spots.
    """
    try:
        event = get_object_or_404(Event, id=event_id)

        if event.organizer != request.user:
            return 403, {"error": "You are not authorized to perform this action"}

        if payload.action not in ["approve", "reject"]:
            return 400, {"error": "Invalid action. Must be 'approve' or 'reject'"}

        tickets = Ticket.objects.filter(
            event=event,
            ticket_number__in=payload.ticket_ids,
        ).select_related("attendee", "event")

        if tickets.count() == 0:
            tickets = Ticket.objects.filter(
                event=event,
                qr_code__in=payload.ticket_ids,
            ).select_related("attendee", "event")

        if tickets.count() == 0:
            return 400, {"error": "No tickets found"}

        new_status = "approved" if payload.action == "approve" else "rejected"

        if payload.action == "reject":
            removed_count = 0
            if isinstance(event.attendee, list):
                for ticket in tickets:
                    if ticket.attendee and ticket.attendee.id in event.attendee:
                        event.attendee.remove(ticket.attendee.id)
                        removed_count += 1
                        print(
                            f"DEBUG: Removed attendee {ticket.attendee.id} from event {event.id}"
                        )

            if removed_count > 0:
                event.save()
                print(f"DEBUG: Freed up {removed_count} spots for event {event.id}")

        updated_count = 0
        for ticket in tickets:
            ticket.approval_status = new_status
            if new_status == "approved":
                ticket.approved_at = timezone.now()
            else:
                ticket.rejected_at = timezone.now()
            ticket.save()

            if new_status == "approved":
                send_approval_notification(ticket)
            else:
                send_rejection_notification(ticket)

            updated_count += 1

        return 200, {
            "success": True,
            "message": f"{updated_count} registration(s) {new_status}",
            "ticket_ids": payload.ticket_ids,
            "status": new_status,
            "processed_count": updated_count,
        }
    except Exception as e:
        print(f"Error in bulk action: {e}")
        import traceback

        traceback.print_exc()
        return 400, {"error": str(e)}


@router.post(
    "/events/{event_id}/registrations/{ticket_id}/approve",
    auth=django_auth,
    response={200: schemas.ApprovalResponseSchema, 403: schemas.ErrorSchema, 400: schemas.ErrorSchema},
)
def approve_registration(request, event_id: int, ticket_id: str):
    """Approve a single registration."""
    try:
        event = get_object_or_404(Event, id=event_id)

        if event.organizer != request.user:
            return 403, {"error": "You are not authorized to perform this action"}

        try:
            ticket = Ticket.objects.select_related("attendee", "event").get(
                ticket_number=ticket_id, event=event
            )
        except Ticket.DoesNotExist:
            ticket = Ticket.objects.select_related("attendee", "event").get(
                qr_code=ticket_id, event=event
            )

        ticket.approval_status = "approved"
        ticket.approved_at = timezone.now()
        ticket.save()

        send_approval_notification(ticket)

        return 200, {
            "success": True,
            "message": "Registration approved",
            "ticket_id": ticket_id,
            "status": "approved",
        }
    except Ticket.DoesNotExist:
        return 400, {"error": "Ticket not found"}
    except Exception as e:
        print(f"Error approving ticket: {e}")
        return 400, {"error": str(e)}


@router.post(
    "/events/{event_id}/registrations/{ticket_id}/reject",
    auth=django_auth,
    response={200: schemas.ApprovalResponseSchema, 403: schemas.ErrorSchema, 400: schemas.ErrorSchema},
)
def reject_registration(request, event_id: int, ticket_id: str):
    """Reject a single registration and free up the spot."""
    try:
        event = get_object_or_404(Event, id=event_id)

        if event.organizer != request.user:
            return 403, {"error": "You are not authorized to perform this action"}

        try:
            ticket = Ticket.objects.select_related("attendee", "event").get(
                ticket_number=ticket_id, event=event
            )
        except Ticket.DoesNotExist:
            ticket = Ticket.objects.select_related("attendee", "event").get(
                qr_code=ticket_id, event=event
            )

        if ticket.attendee and isinstance(event.attendee, list):
            if ticket.attendee.id in event.attendee:
                event.attendee.remove(ticket.attendee.id)
                event.save()
                print(f"DEBUG: Removed attendee {ticket.attendee.id} from event {event.id}")

        ticket.approval_status = "rejected"
        ticket.rejected_at = timezone.now()
        ticket.save()

        send_rejection_notification(ticket)

        return 200, {
            "success": True,
            "message": "Registration rejected and spot freed",
            "ticket_id": ticket_id,
            "status": "rejected",
        }
    except Ticket.DoesNotExist:
        return 400, {"error": "Ticket not found"}
    except Exception as e:
        print(f"Error rejecting ticket: {e}")
        import traceback

        traceback.print_exc()
        return 400, {"error": str(e)}


@router.post(
    "/events/{event_id}/approve-ticket",
    auth=django_auth,
    response={200: dict, 403: schemas.ErrorSchema, 400: schemas.ErrorSchema},
)
def approve_ticket(request, event_id: int, ticket_id: str, approval_status: str):
    """
    DEPRECATED single approval endpoint kept for backwards compatibility.
    """
    try:
        event = get_object_or_404(Event, id=event_id)

        if event.organizer != request.user:
            return 403, {"error": "You are not authorized to perform this action"}

        try:
            ticket = Ticket.objects.get(ticket_number=ticket_id, event=event)
        except Ticket.DoesNotExist:
            ticket_id_num = (
                int(ticket_id.replace("T", "")) if ticket_id.startswith("T") else int(ticket_id)
            )
            ticket = get_object_or_404(Ticket, id=ticket_id_num, event=event)

        ticket.approval_status = approval_status
        ticket.save()

        return 200, {
            "success": True,
            "message": f"Ticket {ticket_id} {approval_status}",
            "ticket_id": ticket_id,
            "status": approval_status,
        }
    except Exception as e:
        print(f"Error approving ticket: {e}")
        return 400, {"error": str(e)}
