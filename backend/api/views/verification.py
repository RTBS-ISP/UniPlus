from ninja import Router
from ninja.security import django_auth
from django.shortcuts import get_object_or_404

from api import schemas
from api.model.event import Event
from api.model.notification import (
    send_event_approval_notification,
    send_event_rejection_notification,
)

router = Router(tags=["verification"])


@router.post(
    "/events/{event_id}/verify",
    auth=django_auth,
    response={200: schemas.SuccessSchema, 403: schemas.ErrorSchema, 400: schemas.ErrorSchema},
)
def verify_event(request, event_id: int):
    """Verify/approve an event (admin only)."""
    try:
        event = get_object_or_404(Event, id=event_id)

        if request.user.role != "admin":
            return 403, {"error": "You are not authorized to verify events"}

        event.verification_status = "approved"
        event.save()
        send_event_approval_notification(event)
        return 200, {
            "success": True,
            "message": "Event approved successfully",
            "event_id": event_id,
            "verification_status": "approved",
        }
    except Exception as e:
        print(f"Error verifying event: {e}")
        return 400, {"error": str(e)}


@router.post(
    "/events/{event_id}/reject",
    auth=django_auth,
    response={200: schemas.SuccessSchema, 403: schemas.ErrorSchema, 400: schemas.ErrorSchema},
)
def reject_event(request, event_id: int):
    """Reject an event (admin only)."""
    try:
        event = get_object_or_404(Event, id=event_id)

        if request.user.role != "admin":
            return 403, {"error": "You are not authorized to reject events"}

        event.verification_status = "rejected"
        event.save()

        send_event_rejection_notification(event)

        return 200, {
            "success": True,
            "message": "Event rejected successfully",
            "event_id": event_id,
            "verification_status": "rejected",
        }
    except Exception as e:
        print(f"Error rejecting event: {e}")
        return 400, {"error": str(e)}


@router.get(
    "/admin/statistics",
    auth=django_auth,
    response={200: dict, 403: schemas.ErrorSchema},
)
def get_admin_statistics(request):
    """Get admin dashboard statistics: total / approved / pending / rejected."""
    try:
        if request.user.role != "admin":
            return 403, {"error": "Admin privileges required"}

        total_events = Event.objects.count()
        approved_events = Event.objects.filter(verification_status="approved").count()
        rejected_events = Event.objects.filter(verification_status="rejected").count()
        pending_events = Event.objects.exclude(
            verification_status__in=["approved", "rejected"]
        ).count()

        return 200, {
            "total_events": total_events,
            "approved_events": approved_events,
            "pending_events": pending_events,
            "rejected_events": rejected_events,
        }
    except Exception as e:
        print(f"Error fetching admin statistics: {e}")
        return 400, {"error": str(e)}


@router.get(
    "/admin/events",
    auth=django_auth,
    response={200: list[schemas.AdminEventSchema], 403: schemas.ErrorSchema},
)
def get_admin_events(request):
    """Get all events for admin dashboard with verification status."""
    try:
        if request.user.role != "admin":
            return 403, {"error": "Admin privileges required"}

        events = (
            Event.objects.select_related("organizer")
            .all()
            .order_by("-event_create_date")
        )

        events_data = []
        for event in events:
            organizer_name = f"{event.organizer.first_name} {event.organizer.last_name}".strip()
            if not organizer_name:
                organizer_name = event.organizer.username or event.organizer.email

            verification_status = getattr(event, "verification_status", None) or "pending"

            events_data.append(
                {
                    "id": event.id,
                    "title": event.event_title,
                    "event_title": event.event_title,
                    "event_description": event.event_description,
                    "event_create_date": event.event_create_date.isoformat(),
                    "organizer_name": organizer_name,
                    "organizer_username": event.organizer.username,
                    "organizer_id": event.organizer.id,
                    "status_registration": event.status_registration,
                    "verification_status": verification_status,
                }
            )

        return 200, events_data
    except Exception as e:
        print(f"Error fetching admin events: {e}")
        return 400, {"error": str(e)}
