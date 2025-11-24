from datetime import datetime
import traceback

import pytz
from ninja import Router
from ninja.security import django_auth
from django.shortcuts import get_object_or_404
from django.utils import timezone

from api import schemas
from api.model.event import Event
from api.model.event_schedule import EventSchedule
from api.model.ticket import Ticket

from .utils import convert_to_bangkok_time

router = Router(tags=["dashboard"])


@router.get(
    "/events/my-events/pending-approvals",
    auth=django_auth,
    response={200: schemas.OrganizerDashboardSchema, 401: schemas.ErrorSchema},
)
def get_organizer_dashboard(request):
    """
    Organizer main dashboard summary (pending approvals etc.)
    """
    if not request.user.is_authenticated:
        return 401, {"error": "Not authenticated"}

    user = request.user

    events = Event.objects.filter(organizer=user)

    total_events = events.count()
    upcoming_events = events.filter(event_end_date__gte=datetime.now()).count()
    past_events = events.filter(event_end_date__lt=datetime.now()).count()

    total_registrations = Ticket.objects.filter(event__organizer=user).count()

    pending_approvals = Ticket.objects.filter(
        event__organizer=user,
        approval_status="pending",
    ).count()

    events_with_pending = []
    for event in events:
        pending_count = Ticket.objects.filter(
            event=event,
            approval_status="pending",
        ).count()

        if pending_count > 0:
            events_with_pending.append(
                {
                    "event_id": event.id,
                    "event_title": event.event_title,
                    "pending_count": pending_count,
                    "event_date": event.event_start_date.isoformat()
                    if event.event_start_date
                    else None,
                }
            )

    return 200, {
        "total_events": total_events,
        "upcoming_events": upcoming_events,
        "past_events": past_events,
        "total_registrations": total_registrations,
        "pending_approvals": pending_approvals,
        "events_with_pending": events_with_pending,
    }


@router.get(
    "/events/{event_id}/dashboard",
    auth=django_auth,
    response={
        200: schemas.EventDashboardSchema,
        403: schemas.ErrorSchema,
        404: schemas.ErrorSchema,
        400: schemas.ErrorSchema,
    },
)
def get_event_dashboard(request, event_id: int):
    """Get dashboard data for event organizer"""
    try:
        event = get_object_or_404(Event, id=event_id)

        if event.organizer != request.user:
            return 403, {"error": "You are not authorized to view this dashboard"}

        tickets = Ticket.objects.filter(event=event).select_related("attendee")

        schedules = EventSchedule.objects.filter(event=event).order_by(
            "event_date", "start_time_event"
        )

        schedule_days = []
        for idx, schedule in enumerate(schedules, 1):
            schedule_days.append(
                {
                    "date": schedule.event_date.isoformat(),
                    "label": f"Day {idx}",
                    "start_time": schedule.start_time_event.isoformat()
                    if schedule.start_time_event
                    else None,
                    "end_time": schedule.end_time_event.isoformat()
                    if schedule.end_time_event
                    else None,
                    "location": event.event_address or "TBA",
                    "is_online": event.is_online,
                    "meeting_link": event.event_meeting_link,
                }
            )

        attendees = []
        for ticket in tickets:
            user = ticket.attendee

            if ticket.checked_in_at:
                status = "present"
            elif ticket.approval_status == "pending":
                status = "pending"
            else:
                status = "absent"

            event_date_str = ""
            if ticket.event_dates and isinstance(ticket.event_dates, list) and len(ticket.event_dates) > 0:
                first = ticket.event_dates[0]
                if isinstance(first, dict):
                    event_date_str = str(first.get("date") or "")
                else:
                    event_date_str = str(first)
                if len(event_date_str) >= 10:
                    event_date_str = event_date_str[:10]

            if not event_date_str and event.event_start_date:
                event_date_str = event.event_start_date.date().isoformat()

            about_me = user.about_me if isinstance(user.about_me, dict) else {}

            checked_in_dates_dict = {}
            if isinstance(ticket.checked_in_dates, dict):
                checked_in_dates_dict = ticket.checked_in_dates
            elif isinstance(ticket.checked_in_dates, list):
                for date_str in ticket.checked_in_dates:
                    if isinstance(date_str, str) and len(date_str) >= 10:
                        checked_in_dates_dict[date_str[:10]] = (
                            ticket.checked_in_at.isoformat()
                            if ticket.checked_in_at
                            else timezone.now().isoformat()
                        )

            attendees.append(
                {
                    "ticketId": ticket.qr_code,
                    "displayTicketId": ticket.ticket_number or f"T{ticket.id}",
                    "name": f"{user.first_name} {user.last_name}",
                    "email": user.email,
                    "username": user.username,
                    "status": status,
                    "approvalStatus": ticket.approval_status,
                    "registered": ticket.purchase_date.isoformat(),
                    "approvedAt": ticket.approved_at.isoformat()
                    if ticket.approved_at
                    else "",
                    "rejectedAt": ticket.rejected_at.isoformat()
                    if ticket.rejected_at
                    else "",
                    "checkedIn": ticket.checked_in_at.isoformat()
                    if ticket.checked_in_at
                    else "",
                    "eventDate": event_date_str,
                    "phone": user.phone_number,
                    "role": user.role,
                    "about_me": about_me,
                    "checkedInDates": checked_in_dates_dict,
                }
            )

        total_registered = tickets.count()
        checked_in = tickets.filter(checked_in_at__isnull=False).count()
        approved = tickets.filter(approval_status="approved").count()
        pending = tickets.filter(approval_status="pending").count()
        rejected = tickets.filter(approval_status="rejected").count()

        attendance_rate = (checked_in / approved * 100) if approved > 0 else 0

        return 200, {
            "event": {
                "id": event.id,
                "title": event.event_title,
                "description": event.event_description,
                "start_date": event.event_start_date.isoformat()
                if event.event_start_date
                else None,
                "end_date": event.event_end_date.isoformat()
                if event.event_end_date
                else None,
                "max_attendee": event.max_attendee,
            },
            "schedule_days": schedule_days,
            "attendees": attendees,
            "statistics": {
                "total_registered": total_registered,
                "checked_in": checked_in,
                "pending": pending,
                "approved": approved,
                "pending_approval": pending,
                "rejected": rejected,
                "attendance_rate": round(attendance_rate, 1),
            },
        }
    except Exception as e:
        print(f"Error fetching dashboard: {e}")
        traceback.print_exc()
        return 400, {"error": str(e)}


@router.post(
    "/checkin",
    auth=django_auth,
    response={200: schemas.CheckInResponseSchema, 400: schemas.ErrorSchema, 403: schemas.ErrorSchema},
)
def check_in_attendee(request, payload: schemas.CheckInRequestSchema):
    """
    Check in an attendee using QR code or ticket number.
    Only organizers can check in attendees for their events.
    """
    try:
        ticket_identifier = payload.qr_code.strip()

        ticket = None
        if len(ticket_identifier) > 20 and "-" in ticket_identifier:
            try:
                ticket = Ticket.objects.select_related("event", "attendee").get(
                    qr_code=ticket_identifier
                )
            except Ticket.DoesNotExist:
                pass

        if not ticket:
            try:
                ticket = Ticket.objects.select_related("event", "attendee").get(
                    ticket_number=ticket_identifier
                )
            except Ticket.DoesNotExist:
                pass

        if not ticket:
            try:
                ticket_id_num = (
                    int(ticket_identifier.replace("T", ""))
                    if ticket_identifier.startswith("T")
                    else int(ticket_identifier)
                )
                ticket = Ticket.objects.select_related("event", "attendee").get(
                    id=ticket_id_num
                )
            except (Ticket.DoesNotExist, ValueError):
                pass

        if not ticket:
            return 400, {"error": f"Ticket '{ticket_identifier}' not found"}

        expected_event_id = getattr(payload, "event_id", None)

        if expected_event_id and ticket.event.id != expected_event_id:
            return 400, {
                "error": (
                    f"This ticket belongs to '{ticket.event.event_title}', not the current "
                    "event. Please scan the ticket from the correct event"
                )
            }

        if ticket.event.organizer != request.user:
            return 403, {"error": "You are not authorized to check in attendees for this event"}

        if ticket.approval_status != "approved":
            return 400, {
                "error": f"Ticket is {ticket.approval_status}. Only approved tickets can be checked in."
            }

        event_date_str = None
        if payload.event_date:
            try:
                parsed_date = datetime.strptime(payload.event_date, "%Y-%m-%d").date()
                event_date_str = parsed_date.isoformat()
            except ValueError:
                return 400, {"error": "Invalid date format. Use YYYY-MM-DD."}

        if event_date_str:
            valid_dates = []
            for d in ticket.event_dates or []:
                if isinstance(d, dict):
                    date_val = d.get("date")
                    if date_val:
                        if len(str(date_val)) >= 10:
                            valid_dates.append(str(date_val)[:10])
                elif isinstance(d, str):
                    try:
                        dt = datetime.fromisoformat(d)
                        valid_dates.append(dt.date().isoformat())
                    except ValueError:
                        if len(d) >= 10:
                            valid_dates.append(d[:10])

            if valid_dates and event_date_str not in valid_dates:
                return 400, {
                    "error": f"This ticket is not valid for {event_date_str}. "
                    f"Valid dates: {', '.join(valid_dates)}"
                }

        if not isinstance(ticket.checked_in_dates, dict):
            ticket.checked_in_dates = {}

        if event_date_str and event_date_str in ticket.checked_in_dates:
            checked_time = ticket.checked_in_dates[event_date_str]
            try:
                if isinstance(checked_time, str):
                    checked_time_str = checked_time.replace("Z", "+00:00")
                    dt = datetime.fromisoformat(checked_time_str)
                else:
                    dt = checked_time

                if dt.tzinfo is None:
                    dt = pytz.UTC.localize(dt)

                bangkok_dt = convert_to_bangkok_time(dt)
                formatted_time = bangkok_dt.strftime("%d/%m/%Y %H:%M")
            except Exception:
                formatted_time = str(checked_time)

            return 200, {
                "success": False,
                "message": f"Already checked in for {event_date_str} at {formatted_time}",
                "ticket_id": ticket.qr_code,
                "attendee_name": ticket.user_name or ticket.attendee.username,
                "event_title": ticket.event_title or ticket.event.event_title,
                "event_date": event_date_str,
                "already_checked_in": True,
                "checked_in_at": checked_time,
                "approval_status": ticket.approval_status,
            }

        now = timezone.now()

        if event_date_str:
            ticket.checked_in_dates[event_date_str] = now.isoformat()

        ticket.checked_in_at = now
        ticket.status = "present"
        ticket.save()

        return 200, {
            "success": True,
            "message": f"Check-in successful for {event_date_str or 'event'}",
            "ticket_id": ticket.qr_code,
            "attendee_name": ticket.user_name or ticket.attendee.username,
            "event_title": ticket.event_title or ticket.event.event_title,
            "event_date": event_date_str,
            "already_checked_in": False,
            "checked_in_at": now.isoformat(),
            "approval_status": ticket.approval_status,
        }
    except Exception as e:
        print(f"Error during check-in: {e}")
        traceback.print_exc()
        return 400, {"error": str(e)}


@router.post(
    "/events/{event_id}/check-in",
    auth=django_auth,
    response={200: dict, 403: schemas.ErrorSchema, 400: schemas.ErrorSchema},
)
def check_in_attendee_legacy(request, event_id: int, ticket_id: str, checkin_date: str):
    """
    Legacy check-in by date string (YYYY-MM-DD).
    """
    print(f"[CHECKIN] event_id={event_id}, ticket_id={ticket_id!r}, checkin_date={checkin_date!r}")
    try:
        event = get_object_or_404(Event, id=event_id)

        if event.organizer != request.user:
            return 403, {"error": "You are not authorized to perform this action"}

        ticket = None

        if len(ticket_id) > 20 and "-" in ticket_id:
            try:
                ticket = Ticket.objects.get(qr_code=ticket_id, event=event)
            except Ticket.DoesNotExist:
                pass

        if not ticket:
            try:
                ticket = Ticket.objects.get(ticket_number=ticket_id, event=event)
            except Ticket.DoesNotExist:
                pass

        if not ticket:
            try:
                ticket_id_num = (
                    int(ticket_id.replace("T", "")) if ticket_id.startswith("T") else int(ticket_id)
                )
                ticket = Ticket.objects.get(id=ticket_id_num, event=event)
            except (ValueError, Ticket.DoesNotExist):
                pass

        if not ticket:
            return 400, {"error": "Ticket '{ticket_id}' not found for this event."}

        try:
            parsed_date = datetime.strptime(checkin_date, "%Y-%m-%d").date()
        except ValueError:
            return 400, {"error": "Invalid date format. Use YYYY-MM-DD."}

        date_str = parsed_date.isoformat()

        valid_dates: list[str] = []
        for d in ticket.event_dates or []:
            if isinstance(d, dict):
                date_val = d.get("date")
                if date_val and len(str(date_val)) >= 10:
                    valid_dates.append(str(date_val)[:10])
            elif isinstance(d, str):
                try:
                    dt = datetime.fromisoformat(d)
                    valid_dates.append(dt.date().isoformat())
                except ValueError:
                    if len(d) >= 10:
                        valid_dates.append(d[:10])
            else:
                try:
                    if hasattr(d, "date"):
                        valid_dates.append(d.date().isoformat())
                    elif hasattr(d, "isoformat"):
                        valid_dates.append(d.isoformat())
                except Exception:
                    pass

        if valid_dates and date_str not in valid_dates:
            return 400, {"error": f"Ticket '{ticket_id}' not found for this event."}

        if not isinstance(ticket.checked_in_dates, dict):
            ticket.checked_in_dates = {}

        if date_str in ticket.checked_in_dates:
            return 200, {
                "success": True,
                "message": "Attendee already checked in for this date",
                "ticket_id": ticket_id,
                "status": "present",
                "checked_in_dates": ticket.checked_in_dates,
            }

        ticket.checked_in_dates[date_str] = timezone.now().isoformat()
        ticket.checked_in_at = timezone.now()
        ticket.status = "present"
        ticket.save()

        return 200, {
            "success": True,
            "message": "Attendee checked in",
            "ticket_id": ticket_id,
            "status": "present",
            "checked_in_dates": ticket.checked_in_dates,
        }

    except Exception as e:
        print(f"Error checking in: {e}")
        return 400, {"error": str(e)}
