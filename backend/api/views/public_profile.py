import json
import traceback

from ninja import Router
from django.shortcuts import get_object_or_404
from django.utils import timezone

from api import schemas
from api.model.user import AttendeeUser
from api.model.event import Event
from api.model.ticket import Ticket
from api.model.rating import Rating
from django.db.models import Avg, Count


from .utils import DEFAULT_PROFILE_PIC

router = Router(tags=["public-profile"])


@router.get(
    "/user/{username}/event-history",
    response={200: dict, 404: schemas.ErrorSchema, 400: schemas.ErrorSchema},
)
def get_public_user_event_history(request, username: str):
    """Get public event history for a specific user (only approved events)."""
    try:
        user = get_object_or_404(AttendeeUser, username=username)

        tickets = (
            Ticket.objects.filter(attendee=user, approval_status="approved")
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
                    "event_start_date": event.event_start_date.isoformat() if event.event_start_date else event_date_str,
                    "event_end_date": event.event_end_date.isoformat() if event.event_end_date else event_date_str,
                    "location": event.event_address or ("Online" if event.is_online else "TBA"),
                    "organizer": event.organizer.username,
                    "status": ticket.status,
                    "approval_status": ticket.approval_status,
                    "purchase_date": ticket.purchase_date.isoformat(),
                    "event_tags": event_tags,
                    "organizer_role": event.organizer.role if event.organizer else "organizer",
                    "is_online": event.is_online,
                    "qr_code": ticket.qr_code,
                    "meeting_link": ticket.meeting_link,
                    "user_name": f"{user.first_name} {user.last_name}".strip()
                    or user.username,
                    "user_email": user.email,
                }
            )

        return 200, {"events": events_data, "total_count": len(events_data)}

    except AttendeeUser.DoesNotExist:
        return 404, {"error": f"User with username '{username}' not found"}
    except Exception as e:
        print(f"Error fetching public event history: {e}")
        return 400, {"error": str(e)}


@router.get(
    "/user/{username}/created-events",
    response={200: dict, 404: schemas.ErrorSchema, 400: schemas.ErrorSchema},
)
def get_public_user_created_events(request, username: str):
    """Get public created events for a specific user (only approved events)."""
    try:
        user = get_object_or_404(AttendeeUser, username=username)

        created_events = (
            Event.objects.filter(organizer=user, verification_status="approved")
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
                    "event_start_date": event.event_start_date.isoformat() if event.event_start_date else event_date_str,
                    "event_end_date": event.event_end_date.isoformat() if event.event_end_date else event_date_str,
                    "location": event.event_address,
                    "is_online": event.is_online,
                    "meeting_link": event.event_meeting_link,
                    "status": status,
                    "organizer": event.organizer.username,
                    "organizer_role": getattr(event.organizer, "role", "organizer"),
                    "event_tags": event_tags,
                    "user_name": user.username,
                    "user_email": "",
                    "purchase_date": None,
                    "qr_code": None,
                    "attendee_count": attendee_count,
                }
            )

        return 200, {"events": events_data, "total_count": len(events_data)}

    except AttendeeUser.DoesNotExist:
        return 404, {"error": f"User with username '{username}' not found"}
    except Exception as e:
        print("Error fetching public created events:")
        traceback.print_exc()
        return 400, {"error": str(e)}


@router.get(
    "/user/{username}/statistics",
    response={200: dict, 404: schemas.ErrorSchema, 400: schemas.ErrorSchema},
)
def get_public_user_statistics(request, username: str):
    """Get public statistics for a specific user."""
    try:
        user = get_object_or_404(AttendeeUser, username=username)

        approved_tickets = Ticket.objects.filter(attendee=user, approval_status="approved")

        approved_events_ids = (
            approved_tickets.filter(event__verification_status="approved")
            .values_list("event_id", flat=True)
            .distinct()
        )
        total_events = len(approved_events_ids)

        upcoming_count = (
            approved_tickets.filter(
                event__verification_status="approved",
                event__event_end_date__gt=timezone.now(),
            )
            .values("event")
            .distinct()
            .count()
        )

        attended_count = (
            approved_tickets.filter(
                event__verification_status="approved",
                event__event_end_date__lte=timezone.now(),
            )
            .values("event")
            .distinct()
            .count()
        )

        created_events_count = Event.objects.filter(
            organizer=user,
            verification_status="approved",
        ).count()

        return 200, {
            "total_events": total_events,
            "upcoming_events": upcoming_count,
            "attended_events": attended_count,
            "created_events": created_events_count,
            "total_registrations": approved_tickets.count(),
            "user_info": {
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
            },
        }

    except AttendeeUser.DoesNotExist:
        return 404, {"error": f"User with username '{username}' not found"}
    except Exception as e:
        print(f"Error calculating public statistics: {e}")
        return 400, {"error": str(e)}


@router.get(
    "/user/{username}/profile",
    response={200: schemas.PublicProfileSchema, 404: schemas.ErrorSchema},
)
def get_public_profile(request, username: str):
    """Get public profile of a user."""
    try:
        user = get_object_or_404(AttendeeUser, username=username)

        about_me_data = {}
        if user.about_me:
            if isinstance(user.about_me, dict):
                about_me_data = user.about_me
            elif isinstance(user.about_me, str):
                try:
                    about_me_str = user.about_me.strip()
                    if about_me_str.startswith('"') and about_me_str.endswith('"'):
                        about_me_str = about_me_str[1:-1]
                    about_me_data = json.loads(about_me_str)
                except json.JSONDecodeError:
                    print(
                        f"Failed to parse about_me for user {username}: {user.about_me}"
                    )
                    about_me_data = {}

        events_organized = Event.objects.filter(
            organizer=user,
            verification_status="approved",
        ).count()

        total_attendees = Ticket.objects.filter(
            event__organizer=user,
            event__verification_status="approved",
            approval_status="approved",
        ).count()

        avg_rating = Rating.objects.filter(
            event_id__organizer=user,
            event_id__verification_status="approved",
        ).aggregate(Avg("rates"))["rates__avg"]

        user_tickets = Ticket.objects.filter(
            attendee=user,
            approval_status="approved",
            event__verification_status="approved",
        )
        user_total_events = user_tickets.values("event").distinct().count()

        return 200, {
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone_number": user.phone_number,
            "role": user.role,
            "about_me": about_me_data,
            "profile_pic": user.profile_picture.url
            if user.profile_picture
            else DEFAULT_PROFILE_PIC,
            "events_organized": events_organized,
            "total_attendees": total_attendees,
            "user_total_events": user_total_events,
            "avg_rating": round(avg_rating, 1) if avg_rating else None,
        }
    except AttendeeUser.DoesNotExist:
        return 404, {"error": f"User with username '{username}' not found"}
    except Exception as e:
        print(f"Error in public profile: {e}")
        traceback.print_exc()
        return 404, {"error": f"Error loading profile: {str(e)}"}
