from datetime import datetime

import json
from ninja import Router, Form
from ninja.files import UploadedFile
from ninja.security import django_auth

from api import schemas
from api.model.user import AttendeeUser
from api.model.ticket import Ticket
from api.model.event import Event
from api.model.event_schedule import EventSchedule
from django.utils import timezone

from .utils import DEFAULT_PROFILE_PIC, convert_to_bangkok_time

router = Router(tags=["users"])


@router.get("/user", auth=django_auth, response={200: schemas.UserSchema, 401: schemas.ErrorSchema})
def get_user(request):
    if request.user.is_authenticated:
        about_me_data = {}
        if request.user.about_me:
            if isinstance(request.user.about_me, dict):
                about_me_data = request.user.about_me
            elif isinstance(request.user.about_me, str):
                try:
                    about_me_str = request.user.about_me.strip()
                    if about_me_str.startswith('"') and about_me_str.endswith('"'):
                        about_me_str = about_me_str[1:-1]
                    about_me_data = json.loads(about_me_str)
                except json.JSONDecodeError:
                    print(f"Failed to parse about_me: {request.user.about_me}")
                    about_me_data = {}

        tickets = []

        if hasattr(request.user, "my_tickets") and request.user.my_tickets.exists():
            for ticket in request.user.my_tickets.all().select_related("event", "event__organizer"):
                try:
                    event = ticket.event

                    event_dates = ticket.event_dates if isinstance(ticket.event_dates, list) else []

                    if not event_dates:
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
                                    "endTime": end_bangkok.time().isoformat() if end_bangkok else None,
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
                                        end_dt = datetime.fromisoformat(f"{date_str}T{end_time_str}")
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
                                print(f"Error converting event date: {e}")
                                converted_dates.append(ed)

                        event_dates = converted_dates

                    if not event_dates and event.event_start_date:
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
                        "date": display_date,
                        "time": display_time,
                        "location": event_dates[0]["location"]
                        if event_dates
                        else (event.event_address or "TBA"),
                        "organizer": event.organizer.username if event and event.organizer else None,
                        "user_information": {
                            "name": f"{request.user.first_name} {request.user.last_name}",
                            "firstName": request.user.first_name,
                            "lastName": request.user.last_name,
                            "email": request.user.email,
                            "phone": request.user.phone_number,
                        },
                        "event_title": event.event_title if event else None,
                        "event_description": event.event_description if event else None,
                        "qr_code": ticket.qr_code,
                        "ticket_number": ticket.ticket_number,
                        "event_id": event.id if event else None,
                        "is_online": ticket.is_online,
                        "event_meeting_link": ticket.meeting_link,
                        "event_image": event.event_image.url if event and event.event_image else None,
                        "event_dates": event_dates,
                        "approval_status": ticket.approval_status,
                    }
                    tickets.append(ticket_data)
                except Exception as e:
                    print(f"Error processing ticket: {e}")
                    import traceback

                    traceback.print_exc()
                    continue

        return 200, {
            "username": request.user.username,
            "email": request.user.email,
            "firstName": request.user.first_name,
            "lastName": request.user.last_name,
            "phone": request.user.phone_number,
            "role": request.user.role,
            "aboutMe": about_me_data,
            "profilePic": request.user.profile_picture.url
            if request.user.profile_picture
            else DEFAULT_PROFILE_PIC,
            "tickets": tickets,
        }
    return 401, {"error": "Not authenticated"}


@router.patch("/user", auth=django_auth, response={200: schemas.UserSchema, 400: schemas.ErrorSchema})
def update_user(
    request,
    firstName: str = Form(None),
    lastName: str = Form(None),
    phone: str = Form(None),
    aboutMe: str = Form(None),
    profilePic: UploadedFile = None,
):
    user = request.user
    if firstName:
        user.first_name = firstName
    if lastName:
        user.last_name = lastName
    if phone:
        user.phone_number = phone
    if aboutMe:
        try:
            about_me_dict = json.loads(aboutMe)
            user.about_me = about_me_dict
        except json.JSONDecodeError:
            return 400, {"error": "Invalid aboutMe format"}

    if profilePic:
        user.profile_picture.save(profilePic.name, profilePic, save=True)

    user.save()

    about_me_data = user.about_me if isinstance(user.about_me, dict) else {}

    return 200, {
        "username": user.username,
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "phone": user.phone_number,
        "role": user.role,
        "aboutMe": about_me_data,
        "profilePic": user.profile_picture.url if user.profile_picture else DEFAULT_PROFILE_PIC,
    }


@router.get("/user/statistics", auth=django_auth, response={200: dict, 401: schemas.ErrorSchema})
def get_user_statistics(request):
    """Get user's event statistics"""
    if not request.user.is_authenticated:
        return 401, {"error": "Not authenticated"}

    try:
        all_tickets = Ticket.objects.filter(attendee=request.user, approval_status="approved")
        total_events = all_tickets.values("event").distinct().count()
        upcoming_tickets = (
            all_tickets.filter(event__event_end_date__gt=timezone.now())
            .values("event")
            .distinct()
        )
        upcoming_count = upcoming_tickets.count()
        past_tickets = (
            all_tickets.filter(event__event_end_date__lte=timezone.now())
            .values("event")
            .distinct()
        )
        attended_count = past_tickets.count()
        pending_count = Ticket.objects.filter(attendee=request.user, approval_status="pending").count()

        return 200, {
            "total_events": total_events,
            "upcoming_events": upcoming_count,
            "attended_events": attended_count,
            "total_registrations": all_tickets.count(),
            "pending_registrations": pending_count,
        }
    except Exception as e:
        print(f"Error calculating statistics: {e}")
        return 400, {"error": str(e)}


@router.get(
    "/user/created-events",
    auth=django_auth,
    response={200: dict, 401: schemas.ErrorSchema, 400: schemas.ErrorSchema},
)
def get_my_created_events(request):
    """
    Get events created by the logged-in user (for /profile page).
    Mirrors the shape of the public created-events endpoint.
    """
    if not request.user.is_authenticated:
        return 401, {"error": "Not authenticated"}

    try:
        created_events = (
            Event.objects.filter(organizer=request.user, verification_status="approved")
            .select_related("organizer")
            .order_by("-event_start_date")
        )

        events_data = []
        for event in created_events:
            status = (
                "upcoming"
                if event.event_start_date and event.event_start_date > timezone.now()
                else "past"
            )

            event_tags = []
            if event.tags:
                try:
                    event_tags = (
                        json.loads(event.tags) if isinstance(event.tags, str) else event.tags
                    )
                except Exception:
                    event_tags = [event.tags] if event.tags else []

            event_date_str = event.event_start_date.isoformat() if event.event_start_date else None

            attendee_count = Ticket.objects.filter(
                event=event,
                approval_status="approved",
            ).count()

            events_data.append(
                {
                    "event_id": event.id,
                    "event_title": event.event_title,
                    "event_description": event.event_description,
                    "event_date": event_date_str,
                    "location": event.event_address,
                    "is_online": event.is_online,
                    "meeting_link": event.event_meeting_link,
                    "status": status,
                    "organizer": event.organizer.username,
                    "organizer_role": getattr(event.organizer, "role", "organizer"),
                    "event_tags": event_tags,
                    "user_name": request.user.username,
                    "user_email": "",
                    "purchase_date": None,
                    "qr_code": None,
                    "attendee_count": attendee_count,
                }
            )

        return 200, {"events": events_data, "total_count": len(events_data)}

    except Exception as e:
        print("Error fetching my created events:")
        import traceback
        traceback.print_exc()
        return 400, {"error": str(e)}


@router.get("/user/{email}", response={200: schemas.UserByEmailSchema, 404: schemas.ErrorSchema})
def get_user_by_email(request, email: str):
    """
    Get user information by email address
    Useful for finding usernames when only emails are available
    """
    try:
        user = AttendeeUser.objects.get(email=email)

        return 200, {
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
        }
    except AttendeeUser.DoesNotExist:
        return 404, {"error": f"User with email '{email}' not found"}
    except Exception as e:
        print(f"Error fetching user by email: {e}")
        return 400, {"error": str(e)}
