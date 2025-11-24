from datetime import datetime

import csv
import json
import traceback
import pytz
import uuid

from ninja import Router
from ninja.security import django_auth
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.http import HttpResponse

from api import schemas
from api.model.event import Event
from api.model.event_schedule import EventSchedule
from api.model.ticket import Ticket
from api.model.notification import send_registration_notification

from .utils import convert_to_bangkok_time

router = Router(tags=["tickets"])


@router.post(
    "/events/{event_id}/register",
    auth=django_auth,
    response={200: schemas.SuccessSchema, 400: schemas.ErrorSchema},
)
def register_for_event(request, event_id: int):
    try:
        event = get_object_or_404(Event, id=event_id)
        user = request.user

        if Ticket.objects.filter(event=event, attendee=user).exists():
            return 400, {"error": "You are already registered for this event"}

        event_schedules = EventSchedule.objects.filter(event=event).order_by(
            "event_date", "start_time_event"
        )

        schedule = []
        for sched in event_schedules:
            schedule.append(
                {
                    "date": sched.event_date.isoformat(),
                    "time": sched.start_time_event.isoformat(),
                    "endTime": sched.end_time_event.isoformat(),
                    "location": event.event_address or "TBA",
                    "is_online": event.is_online,
                    "meeting_link": event.event_meeting_link,
                }
            )

        print(f"DEBUG: Event {event_id} has {len(schedule)} EventSchedule entries")

        if not schedule:
            print("DEBUG: No EventSchedule entries found, creating fallback")
            schedule = [
                {
                    "date": event.event_start_date.date().isoformat()
                    if event.event_start_date
                    else timezone.now().date().isoformat(),
                    "time": event.event_start_date.time().isoformat()
                    if event.event_start_date
                    else "00:00:00",
                    "endTime": "23:59:59",
                    "location": event.event_address or "TBA",
                    "is_online": event.is_online,
                    "meeting_link": event.event_meeting_link,
                }
            ]

        ticket = Ticket.objects.create(
            event=event,
            attendee=user,
            qr_code=str(uuid.uuid4()),
            user_name=f"{user.first_name} {user.last_name}".strip() or user.username,
            user_email=user.email,
            event_title=event.event_title,
            start_date=event.event_start_date,
            location=event.event_address or "TBA",
            is_online=event.is_online,
            meeting_link=event.event_meeting_link,
            event_dates=schedule,
        )

        send_registration_notification(ticket)

        attendees = event.attendee if isinstance(event.attendee, list) else []
        if user.id not in attendees:
            attendees.append(user.id)
        event.attendee = attendees
        event.save()

        print(
            f"DEBUG: Ticket {ticket.qr_code} created with {len(schedule)} dates, "
            f"status: {ticket.approval_status}"
        )

        return 200, {
            "success": True,
            "message": "Successfully registered for the event. Awaiting organizer approval.",
            "tickets_count": 1,
            "ticket_number": ticket.qr_code,
        }

    except Exception as e:
        print(f"Error registering for event: {str(e)}")
        traceback.print_exc()
        return 400, {"error": str(e)}


@router.get(
    "/tickets/{ticket_id}",
    auth=django_auth,
    response=schemas.TicketDetailSchema,
)
def get_ticket_detail(request, ticket_id: int):
    ticket = get_object_or_404(Ticket, id=ticket_id, attendee=request.user)

    event_dates = ticket.event_dates if ticket.event_dates else []

    return {
        "qr_code": ticket.qr_code,
        "event_title": ticket.event.event_title,
        "event_description": ticket.event.event_description,
        "start_date": ticket.event.start_date_register,
        "event_date": ticket.event_date.isoformat() if ticket.event_date else "",
        "location": ticket.event.event_address if not ticket.is_online else "Online",
        "meeting_link": ticket.meeting_link,
        "is_online": ticket.is_online,
        "organizer": ticket.event.organizer.username,
        "user_name": f"{request.user.first_name} {request.user.last_name}",
        "user_email": request.user.email,
        "event_dates": event_dates,
        "approval_status": ticket.approval_status,
        "checked_in_at": ticket.checked_in_at,
    }


@router.get(
    "/user/event-history",
    auth=django_auth,
    response={200: dict, 401: schemas.ErrorSchema, 400: schemas.ErrorSchema},
)
def get_user_event_history(request):
    """
    Get user's registered events and attendance history.
    Only approved events & tickets.
    """
    if not request.user.is_authenticated:
        return 401, {"error": "Not authenticated"}

    try:
        tickets = (
            Ticket.objects.filter(
                attendee=request.user,
                approval_status="approved",
                event__verification_status="approved",
            )
            .select_related("event")
            .order_by("-purchase_date")
        )

        events_data = []
        for ticket in tickets:
            event = ticket.event

            if event.verification_status != "approved":
                continue

            event_date_str = (
                event.event_start_date.isoformat() if event.event_start_date else None
            )
            if ticket.event_dates and isinstance(ticket.event_dates, list) and len(ticket.event_dates) > 0:
                event_date_str = ticket.event_dates[0].get("date", event_date_str)

            event_tags = []
            if event.tags:
                try:
                    event_tags = json.loads(event.tags) if isinstance(event.tags, str) else event.tags
                except Exception:
                    event_tags = [event.tags] if event.tags else []

            events_data.append(
                {
                    "event_id": event.id,
                    "event_title": event.event_title,
                    "event_description": event.event_description,
                    "event_date": event_date_str,
                    "location": ticket.location,
                    "organizer": event.organizer.username,
                    "status": ticket.status,
                    "approval_status": ticket.approval_status,
                    "purchase_date": ticket.purchase_date.isoformat(),
                    "event_tags": event_tags,
                    "organizer_role": event.organizer.role if event.organizer else "organizer",
                    "is_online": event.is_online,
                    "location": event.event_address or ("Online" if event.is_online else "TBA"),
                    "qr_code": ticket.qr_code,
                    "meeting_link": ticket.meeting_link,
                    "user_name": f"{request.user.first_name} {request.user.last_name}".strip()
                    or request.user.username,
                    "user_email": request.user.email,
                }
            )

        return 200, {"events": events_data, "total_count": len(events_data)}

    except Exception as e:
        print(f"Error fetching event history: {e}")
        traceback.print_exc()
        # Fallback: safer path copied from original
        tickets = (
            Ticket.objects.filter(
                attendee=request.user,
                approval_status="approved",
                event__verification_status="approved",
            )
            .select_related("event", "event__organizer")
            .order_by("-purchase_date")
        )
        events_data = []
        for ticket in tickets:
            event_obj = ticket.event

            if event_obj.verification_status != "approved":
                continue

            status = (
                "upcoming"
                if (
                    (
                        ticket.event_date
                        or ticket.start_date
                        or (event_obj and getattr(event_obj, "event_start_date", None))
                    )
                    and (
                        ticket.event_date
                        or ticket.start_date
                        or event_obj.event_start_date
                    )
                    > timezone.now()
                )
                else "past"
            )

            event_tags = []
            if event_obj and event_obj.tags:
                try:
                    event_tags = (
                        json.loads(event_obj.tags)
                        if isinstance(event_obj.tags, str)
                        else event_obj.tags
                    )
                except Exception:
                    event_tags = [event_obj.tags] if event_obj.tags else []

            event_date_str = None
            if ticket.event_date:
                event_date_str = ticket.event_date.strftime("%Y-%m-%d")
            elif ticket.start_date:
                event_date_str = (
                    ticket.start_date.date().strftime("%Y-%m-%d")
                    if hasattr(ticket.start_date, "date")
                    else ticket.start_date.strftime("%Y-%m-%d")
                )
            elif event_obj and event_obj.event_start_date:
                event_date_str = (
                    event_obj.event_start_date.date().strftime("%Y-%m-%d")
                    if hasattr(event_obj.event_start_date, "date")
                    else event_obj.event_start_date.strftime("%Y-%m-%d")
                )

            events_data.append(
                {
                    "ticket_id": ticket.id,
                    "event_id": event_obj.id if event_obj else None,
                    "event_title": ticket.event_title,
                    "event_description": event_obj.event_description if event_obj else None,
                    "event_date": event_date_str,
                    "location": ticket.location,
                    "is_online": ticket.is_online,
                    "meeting_link": ticket.meeting_link,
                    "status": status,
                    "organizer": event_obj.organizer.username
                    if event_obj and event_obj.organizer
                    else None,
                    "organizer_role": event_obj.organizer.role
                    if event_obj and event_obj.organizer
                    else "organizer",
                    "event_tags": event_tags,
                    "user_name": ticket.user_name,
                    "user_email": ticket.user_email,
                    "purchase_date": ticket.purchase_date.isoformat()
                    if ticket.purchase_date
                    else None,
                    "qr_code": ticket.qr_code,
                }
            )
        return 200, {"events": events_data, "total_count": len(events_data)}


@router.get(
    "/user/tickets",
    auth=django_auth,
    response={200: schemas.UserTicketsResponse, 401: schemas.ErrorSchema},
)
def get_user_tickets(request, status: str = None):
    """
    Get all tickets for the authenticated user
    Optional query parameter: status (pending/approved/rejected)
    """
    if not request.user.is_authenticated:
        return 401, {"error": "Not authenticated"}

    try:
        tickets_query = Ticket.objects.filter(attendee=request.user).select_related(
            "event", "event__organizer"
        )

        if status and status in ["pending", "approved", "rejected"]:
            tickets_query = tickets_query.filter(approval_status=status)

        tickets_data = []

        for ticket in tickets_query.order_by("-purchase_date"):
            try:
                event = ticket.event

                event_dates = ticket.event_dates if isinstance(ticket.event_dates, list) else []

                if not event_dates and event:
                    schedules = EventSchedule.objects.filter(event=event).order_by(
                        "event_date", "start_time_event"
                    )
                    for s in schedules:
                        start_dt = datetime.combine(s.event_date, s.start_time_event)
                        end_dt = (
                            datetime.combine(s.event_date, s.end_time_event)
                            if s.end_time_event
                            else None
                        )

                        start_bangkok = convert_to_bangkok_time(start_dt)
                        end_bangkok = convert_to_bangkok_time(end_dt) if end_dt else None

                        event_dates.append(
                            {
                                "date": start_bangkok.date().isoformat(),
                                "time": start_bangkok.time().isoformat(),
                                "endTime": end_bangkok.time().isoformat()
                                if end_bangkok
                                else None,
                                "location": event.event_address or "TBA",
                                "is_online": event.is_online,
                                "meeting_link": event.event_meeting_link or "",
                            }
                        )
                else:
                    converted_dates = []
                    for ed in event_dates:
                        try:
                            date_str = ed.get("date")
                            time_str = ed.get("time")

                            if date_str and time_str:
                                dt = datetime.fromisoformat(f"{date_str}T{time_str}")
                                bangkok_dt = convert_to_bangkok_time(dt)

                                end_time_str = ed.get("endTime")
                                end_bangkok = None
                                if end_time_str:
                                    end_dt = datetime.fromisoformat(
                                        f"{date_str}T{end_time_str}"
                                    )
                                    end_bangkok = convert_to_bangkok_time(end_dt)

                                converted_dates.append(
                                    {
                                        "date": bangkok_dt.date().isoformat(),
                                        "time": bangkok_dt.time().isoformat(),
                                        "endTime": end_bangkok.time().isoformat()
                                        if end_bangkok
                                        else None,
                                        "location": ed.get("location", event.event_address or "TBA"),
                                        "is_online": ed.get("is_online", event.is_online),
                                        "meeting_link": ed.get(
                                            "meeting_link", event.event_meeting_link or ""
                                        ),
                                    }
                                )
                        except Exception as e:
                            print(f"Error converting date: {e}")
                            converted_dates.append(ed)

                    event_dates = converted_dates

                if not event_dates and event and event.event_start_date:
                    bangkok_start = convert_to_bangkok_time(event.event_start_date)
                    event_dates = [
                        {
                            "date": bangkok_start.date().isoformat(),
                            "time": bangkok_start.time().isoformat(),
                            "location": event.event_address or "TBA",
                            "is_online": event.is_online,
                            "meeting_link": event.event_meeting_link,
                        }
                    ]

                display_date = event_dates[0]["date"] if event_dates else None
                display_time = event_dates[0]["time"] if event_dates else "00:00:00"

                ticket_data = {
                    "ticket_id": ticket.id,
                    "qr_code": ticket.qr_code,
                    "ticket_number": ticket.ticket_number,
                    "event_id": event.id if event else None,
                    "event_title": event.event_title if event else "Event not found",
                    "event_description": event.event_description if event else None,
                    "event_image": event.event_image.url if event and event.event_image else None,
                    "organizer_name": event.organizer.username
                    if event and event.organizer
                    else None,
                    "organizer_id": event.organizer.id if event and event.organizer else None,
                    "date": display_date,
                    "time": display_time,
                    "location": event_dates[0]["location"]
                    if event_dates
                    else (event.event_address if event else "TBA"),
                    "is_online": ticket.is_online,
                    "event_meeting_link": ticket.meeting_link,
                    "event_dates": event_dates,
                    "approval_status": ticket.approval_status,
                    "purchase_date": ticket.purchase_date.isoformat()
                    if ticket.purchase_date
                    else None,
                    "checked_in_at": ticket.checked_in_at.isoformat()
                    if ticket.checked_in_at
                    else None,
                    "status": ticket.status,
                }
                tickets_data.append(ticket_data)

            except Exception as e:
                print(f"Error processing ticket {ticket.id}: {e}")
                continue

        return 200, {
            "tickets": tickets_data,
            "total_count": len(tickets_data),
            "pending_count": tickets_query.filter(approval_status="pending").count(),
            "approved_count": tickets_query.filter(approval_status="approved").count(),
            "rejected_count": tickets_query.filter(approval_status="rejected").count(),
        }

    except Exception as e:
        print(f"Error fetching user tickets: {e}")
        return 400, {"error": str(e)}


@router.get("/events/{event_id}/export", auth=django_auth)
def export_event_registrations(request, event_id: int):
    try:
        event = get_object_or_404(Event, id=event_id)

        if event.organizer != request.user:
            return HttpResponse("Unauthorized", status=403)

        tickets = Ticket.objects.filter(event=event).select_related("attendee")

        if not tickets.exists():
            return HttpResponse("No registrations found", status=404)

        response = HttpResponse(content_type="text/csv")
        filename = f"{event.event_title}_registrations_{timezone.now().date()}.csv"
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        writer = csv.writer(response)

        writer.writerow(
            [
                "Ticket ID",
                "Username",
                "Attendee Name",
                "Attendee Email",
                "Phone",
                "Registration Date",
                "Status",
                "Checked In Dates",
            ]
        )

        for ticket in tickets:
            attendee = ticket.attendee
            attendee_name = f"{attendee.first_name} {attendee.last_name}".strip()
            if not attendee_name:
                attendee_name = attendee.username

            checked_in_dates = "Didn't check in yet"

            if ticket.checked_in_dates:
                raw_dates = ticket.checked_in_dates
                formatted_dates = []

                if isinstance(raw_dates, dict):
                    iterable = raw_dates.values()
                elif isinstance(raw_dates, list):
                    iterable = raw_dates
                else:
                    iterable = [raw_dates]

                for date_str in iterable:
                    try:
                        date_str = str(date_str)
                        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                        bangkok_dt = convert_to_bangkok_time(dt)
                        formatted_dates.append(
                            bangkok_dt.strftime("%Y-%m-%d %H:%M:%S")
                        )
                    except Exception:
                        formatted_dates.append(date_str)

                checked_in_dates = ", ".join(formatted_dates)

            writer.writerow(
                [
                    ticket.ticket_number,
                    attendee.username,
                    attendee_name,
                    attendee.email,
                    attendee.phone_number or "N/A",
                    ticket.purchase_date.strftime("%Y-%m-%d %H:%M:%S")
                    if ticket.purchase_date
                    else "N/A",
                    ticket.approval_status,
                    checked_in_dates,
                ]
            )

        return response

    except Event.DoesNotExist:
        return HttpResponse("Event not found", status=404)
    except Exception:
        traceback.print_exc()
        return HttpResponse("Export failed", status=500)
