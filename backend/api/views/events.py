import json
from datetime import datetime, timedelta

from ninja import Router, Form, File
from ninja.files import UploadedFile
from ninja.security import django_auth

from django.shortcuts import get_object_or_404
from django.utils import timezone

from api import schemas
from api.model.ticket import Ticket
from api.model.event import Event
from api.model.event_schedule import EventSchedule
from api.model.notification import send_event_creation_notification_to_admins

router = Router(tags=["events"])


@router.get("/events")
def get_events_list(request):
    """
    Get all events with organizer information
    Returns only verified events to regular users
    Returns events sorted by creation date (newest first)
    """
    try:
        events = (
            Event.objects.select_related("organizer")
            .filter(verification_status="approved")
            .order_by("-event_create_date")
        )

        events_data = []
        for event in events:
            organizer_name = f"{event.organizer.first_name} {event.organizer.last_name}".strip()
            if not organizer_name:
                organizer_name = event.organizer.username or event.organizer.email
            tags_list = []
            if event.tags:
                try:
                    tags_list = json.loads(event.tags) if isinstance(event.tags, str) else event.tags
                except Exception:
                    tags_list = [event.tags] if event.tags else []

            attendee_count = len(event.attendee) if event.attendee else 0

            schedule = []
            if hasattr(event, "schedule") and event.schedule:
                try:
                    schedule = json.loads(event.schedule)
                except Exception:
                    pass

            events_data.append(
                {
                    "id": event.id,
                    "event_title": event.event_title,
                    "event_description": event.event_description,
                    "event_create_date": event.event_create_date.isoformat(),
                    "start_date_register": event.start_date_register.isoformat(),
                    "end_date_register": event.end_date_register.isoformat(),
                    "event_start_date": event.event_start_date.isoformat()
                    if event.event_start_date
                    else None,
                    "event_end_date": event.event_end_date.isoformat()
                    if event.event_end_date
                    else None,
                    "schedule": schedule,
                    "max_attendee": event.max_attendee,
                    "event_address": event.event_address,
                    "event_image": event.event_image.url if event.event_image else None,
                    "is_online": event.is_online,
                    "event_meeting_link": event.event_meeting_link,
                    "tags": tags_list,
                    "status_registration": event.status_registration,
                    "event_email": event.event_email,
                    "event_phone_number": event.event_phone_number,
                    "event_website_url": event.event_website_url,
                    "organizer_name": organizer_name,
                    "organizer_role": event.organizer.role or "Organizer",
                    "organizer_id": event.organizer.id,
                    "attendee": event.attendee,
                    "attendee_count": attendee_count,
                    "verification_status": event.verification_status or "pending",
                }
            )

        return events_data

    except Exception as e:
        print(f"Error fetching events: {str(e)}")
        return {"error": str(e)}


@router.post(
    "/events/create",
    auth=django_auth,
    response={200: schemas.SuccessSchema, 400: schemas.ErrorSchema},
)
def create_event(
    request,
    event_title: str = Form(...),
    event_description: str = Form(...),
    category: str = Form(default=""),
    start_date_register: str = Form(...),
    end_date_register: str = Form(...),
    schedule_days: str = Form(...),
    max_attendee: str = Form(default=""),
    tags: str = Form(default=""),
    event_email: str = Form(default=""),
    event_phone_number: str = Form(default=""),
    event_website_url: str = Form(default=""),
    terms_and_conditions: str = Form(default=""),
    event_image: UploadedFile = File(default=None),
):
    try:
        schedule = json.loads(schedule_days)

        if not schedule or len(schedule) == 0:
            return 400, {"error": "At least one event date is required"}

        def clean_empty_string(value):
            if value and isinstance(value, str) and value.strip():
                return value.strip()
            return None

        first_day = schedule[0]
        last_day = schedule[-1]

        is_online = first_day.get("is_online", False)

        event_address = None if is_online else clean_empty_string(first_day.get("location"))
        event_meeting_link = clean_empty_string(first_day.get("meeting_link")) if is_online else None

        start_reg = datetime.fromisoformat(start_date_register.replace("Z", "+00:00"))
        end_reg = datetime.fromisoformat(end_date_register.replace("Z", "+00:00"))

        event_start = datetime.fromisoformat(first_day["start_iso"].replace("Z", "+00:00"))
        event_end = datetime.fromisoformat(last_day["end_iso"].replace("Z", "+00:00"))

        tags_list = json.loads(tags) if tags and tags.strip() else []
        if category and category.strip() and category not in tags_list:
            tags_list.insert(0, category)

        event_email_clean = clean_empty_string(event_email)
        event_phone_clean = clean_empty_string(event_phone_number)
        event_website_clean = clean_empty_string(event_website_url)
        terms_clean = clean_empty_string(terms_and_conditions)

        event = Event.objects.create(
            organizer=request.user,
            event_title=event_title,
            event_description=event_description,
            start_date_register=start_reg,
            end_date_register=end_reg,
            event_start_date=event_start,
            event_end_date=event_end,
            max_attendee=int(max_attendee) if max_attendee and max_attendee.strip() else None,
            event_address=event_address,
            is_online=is_online,
            event_meeting_link=event_meeting_link,
            tags=json.dumps(tags_list),
            event_email=event_email_clean,
            event_phone_number=event_phone_clean,
            event_website_url=event_website_clean,
            terms_and_conditions=terms_clean,
            event_image=event_image if event_image else None,
            verification_status=None,
        )

        event.schedule = json.dumps(schedule)
        event.save()

        print(f"DEBUG: Created event {event.id} - {event_title}")

        created_schedules = []
        for day_info in schedule:
            try:
                start_datetime = datetime.fromisoformat(day_info["start_iso"].replace("Z", "+00:00"))
                end_datetime = datetime.fromisoformat(day_info["end_iso"].replace("Z", "+00:00"))

                event_schedule = EventSchedule.objects.create(
                    event=event,
                    event_date=start_datetime.date(),
                    start_time_event=start_datetime.time(),
                    end_time_event=end_datetime.time(),
                )

                created_schedules.append(
                    {
                        "date": event_schedule.event_date.isoformat(),
                        "start_time": event_schedule.start_time_event.isoformat(),
                        "end_time": event_schedule.end_time_event.isoformat(),
                    }
                )

                print(f"DEBUG: Created EventSchedule for {event_schedule.event_date}")

            except Exception as e:
                print(f"ERROR: Failed to create EventSchedule for day {day_info}: {e}")
                continue

        print(f"DEBUG: Created {len(created_schedules)} EventSchedule entries for event {event.id}")

        if len(created_schedules) == 0:
            print("WARNING: No EventSchedule entries were created!")

        send_event_creation_notification_to_admins(event)
        return 200, {
            "success": True,
            "message": f"Event created successfully with {len(created_schedules)} schedule entries",
            "event_id": event.id,
            "schedule_count": len(created_schedules),
            "verification_status": "pending",
        }

    except json.JSONDecodeError as e:
        print(f"ERROR: Invalid JSON in schedule_days: {e}")
        return 400, {"error": "Invalid schedule data format"}
    except Exception as e:
        print(f"ERROR: Failed to create event: {str(e)}")
        import traceback

        traceback.print_exc()
        return 400, {"error": str(e)}


@router.get("/events/{event_id}", response=schemas.EventDetailSchema)
def get_event_detail(request, event_id: int):
    """
    Get complete event details including all optional fields
    """
    event = get_object_or_404(Event, id=event_id)

    tags_list = []
    if event.tags:
        try:
            tags_list = json.loads(event.tags) if isinstance(event.tags, str) else event.tags
        except Exception:
            tags_list = [event.tags] if event.tags else []

    category = ""
    if tags_list and len(tags_list) > 0:
        category = tags_list[0]

    def iso_to_local_hhmm(iso_str):
        if not iso_str:
            return "00:00"
        try:
            if iso_str.endswith("Z"):
                iso_str = iso_str[:-1] + "+00:00"
            dt = datetime.fromisoformat(iso_str)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            local_tz = timezone.get_current_timezone()
            local_dt = dt.astimezone(local_tz)
            return local_dt.strftime("%H:%M")
        except Exception:
            try:
                return (
                    iso_str.split("T")[1].split(":")[0]
                    + ":"
                    + iso_str.split("T")[1].split(":")[1]
                )
            except Exception:
                return "00:00"

    schedule = []
    if hasattr(event, "schedule") and event.schedule:
        try:
            schedule_data = json.loads(event.schedule)

            for day in schedule_data:
                date_str = day.get("date", "")
                start_iso = day.get("start_iso", "")
                end_iso = day.get("end_iso", "")
                location = day.get("address", "") or day.get("location", "")
                start_time = iso_to_local_hhmm(start_iso)
                end_time = iso_to_local_hhmm(end_iso)

                schedule.append(
                    {
                        "date": date_str,
                        "startTime": start_time,
                        "endTime": end_time,
                        "start_time": start_time,
                        "end_time": end_time,
                        "location": location,
                        "address": location,
                        "is_online": day.get("is_online", event.is_online),
                        "meeting_link": day.get("meeting_link", event.event_meeting_link),
                    }
                )
        except Exception as e:
            print(f"Error parsing schedule: {e}")

    is_registered = False
    if request.user.is_authenticated:
        is_registered = Ticket.objects.filter(event=event, attendee=request.user).exists()

    attendee_count = len(event.attendee) if event.attendee else 0
    available = (event.max_attendee - attendee_count) if event.max_attendee else 100

    image_url = None
    if event.event_image:
        try:
            image_url = event.event_image.url
        except Exception:
            image_url = None

    return {
        "id": event.id,
        "title": event.event_title,
        "event_title": event.event_title,
        "event_description": event.event_description,
        "excerpt": event.event_description[:150] + "..."
        if len(event.event_description) > 150
        else event.event_description,
        "category": category,
        "organizer_username": event.organizer.username if event.organizer else "Unknown",
        "organizer_role": event.organizer.role or "Organizer",
        "host": [
            f"{event.organizer.first_name} {event.organizer.last_name}".strip()
            or event.organizer.username
        ]
        if event.organizer
        else ["Unknown"],
        "start_date_register": event.start_date_register,
        "end_date_register": event.end_date_register,
        "event_start_date": event.event_start_date or event.start_date_register,
        "event_end_date": event.event_end_date or event.end_date_register,
        "max_attendee": event.max_attendee or 0,
        "capacity": event.max_attendee or 100,
        "current_attendees": attendee_count,
        "available": available,
        "event_address": event.event_address or "",
        "location": event.event_address or ("Online" if event.is_online else "TBA"),
        "address2": getattr(event, "address2", "") or "",
        "is_online": event.is_online,
        "event_meeting_link": event.event_meeting_link or "",
        "event_email": event.event_email if event.event_email else "",
        "event_phone_number": event.event_phone_number if event.event_phone_number else "",
        "event_website_url": event.event_website_url if event.event_website_url else "",
        "terms_and_conditions": event.terms_and_conditions if event.terms_and_conditions else "",
        "tags": tags_list,
        "event_image": image_url,
        "image": image_url,
        "is_registered": is_registered,
        "schedule": schedule,
    }


@router.post(
    "/events/{event_id}/duplicate",
    auth=django_auth,
    response={200: schemas.SuccessSchema, 400: schemas.ErrorSchema},
)
def duplicate_event(request, event_id: int):
    try:
        original_event = get_object_or_404(Event, id=event_id)

        if original_event.organizer != request.user:
            return 403, {"error": "You can only duplicate your own events"}

        date_offset = timedelta(days=7)

        original_schedules = EventSchedule.objects.filter(event=original_event).order_by(
            "event_date", "start_time_event"
        )

        if not original_schedules.exists():
            return 400, {"error": "Event has no schedule to duplicate"}

        max_attendee_value = original_event.max_attendee
        if not max_attendee_value or max_attendee_value == 0:
            max_attendee_value = 100

        duplicate = Event.objects.create(
            organizer=request.user,
            event_title=f"{original_event.event_title} (Copy)",
            event_description=original_event.event_description,
            start_date_register=original_event.start_date_register + date_offset
            if original_event.start_date_register
            else None,
            end_date_register=original_event.end_date_register + date_offset
            if original_event.end_date_register
            else None,
            event_start_date=original_event.event_start_date + date_offset
            if original_event.event_start_date
            else None,
            event_end_date=original_event.event_end_date + date_offset
            if original_event.event_end_date
            else None,
            max_attendee=max_attendee_value,
            event_address=original_event.event_address,
            is_online=original_event.is_online,
            event_meeting_link=original_event.event_meeting_link
            if original_event.is_online
            else None,
            tags=original_event.tags,
            event_email=original_event.event_email,
            event_phone_number=original_event.event_phone_number,
            event_website_url=original_event.event_website_url,
            terms_and_conditions=original_event.terms_and_conditions,
            event_image=original_event.event_image,
            verification_status="pending",
            status_registration="OPEN",
            attendee=[],
            schedule=original_event.schedule,
        )

        created_schedules = []
        for original_schedule in original_schedules:
            new_event_date = (
                original_schedule.event_date + date_offset if original_schedule.event_date else None
            )

            new_schedule = EventSchedule.objects.create(
                event=duplicate,
                event_date=new_event_date,
                start_time_event=original_schedule.start_time_event,
                end_time_event=original_schedule.end_time_event,
            )

            created_schedules.append(
                {
                    "date": new_event_date.isoformat() if new_event_date else None,
                    "start_time": new_schedule.start_time_event.isoformat(),
                    "end_time": new_schedule.end_time_event.isoformat(),
                }
            )

            print(f"DEBUG: Created EventSchedule {new_schedule.id} for date {new_event_date}")

        send_event_creation_notification_to_admins(duplicate)

        print(
            f"DEBUG: Event {original_event.id} duplicated as {duplicate.id} with {len(created_schedules)} schedules"
        )

        return 200, {
            "success": True,
            "message": f"Event '{duplicate.event_title}' created. Review and update dates as needed.",
            "event_id": duplicate.id,
            "original_event_id": original_event.id,
            "max_attendee": duplicate.max_attendee,
            "location": duplicate.event_address or ("Online" if duplicate.is_online else "TBA"),
            "is_online": duplicate.is_online,
            "schedule_count": len(created_schedules),
            "created_schedules": created_schedules,
            "verification_status": duplicate.verification_status,
        }

    except Event.DoesNotExist:
        return 400, {"error": "Original event not found"}
    except Exception as e:
        print(f"ERROR: Failed to duplicate event: {e}")
        import traceback

        traceback.print_exc()
        return 400, {"error": str(e)}


@router.get("/events/{event_id}/duplicate", response=schemas.EventDetailSchema)
def get_event_for_duplication(request, event_id: int):
    try:
        event = get_object_or_404(Event, id=event_id)

        schedules = EventSchedule.objects.filter(event=event).order_by(
            "event_date", "start_time_event"
        )

        schedule_data = []
        for sched in schedules:
            schedule_data.append(
                {
                    "date": sched.event_date.isoformat(),
                    "start_time": sched.start_time_event.isoformat(),
                    "end_time": sched.end_time_event.isoformat(),
                    "startTime": sched.start_time_event.isoformat(),
                    "endTime": sched.end_time_event.isoformat(),
                    "address": event.event_address or "",
                    "location": event.event_address or "TBA",
                    "is_online": event.is_online,
                    "meeting_link": event.event_meeting_link or "",
                    "start_iso": f"{sched.event_date.isoformat()}T{sched.start_time_event.isoformat()}Z",
                    "end_iso": f"{sched.event_date.isoformat()}T{sched.end_time_event.isoformat()}Z",
                }
            )

        tags_list = []
        if event.tags:
            try:
                tags_list = json.loads(event.tags) if isinstance(event.tags, str) else event.tags
            except Exception:
                tags_list = [event.tags] if event.tags else []

        category = ""
        if tags_list and len(tags_list) > 0:
            category = tags_list[0]

        return {
            "id": event.id,
            "title": event.event_title,
            "event_title": event.event_title,
            "event_description": event.event_description,
            "excerpt": event.event_description[:150] + "..."
            if len(event.event_description) > 150
            else event.event_description,
            "category": category,
            "organizer_username": event.organizer.username if event.organizer else "Unknown",
            "organizer_role": event.organizer.role or "Organizer",
            "host": [
                f"{event.organizer.first_name} {event.organizer.last_name}".strip()
                or event.organizer.username
            ]
            if event.organizer
            else ["Unknown"],
            "start_date_register": event.start_date_register,
            "end_date_register": event.end_date_register,
            "event_start_date": event.event_start_date,
            "event_end_date": event.event_end_date,
            "max_attendee": event.max_attendee or 100,
            "capacity": event.max_attendee or 100,
            "current_attendees": len(event.attendee) if event.attendee else 0,
            "available": (event.max_attendee or 100)
            - (len(event.attendee) if event.attendee else 0),
            "event_address": event.event_address or "",
            "location": event.event_address or ("Online" if event.is_online else "TBA"),
            "address2": getattr(event, "address2", "") or "",
            "is_online": event.is_online,
            "event_meeting_link": event.event_meeting_link or "",
            "event_email": event.event_email or "",
            "event_phone_number": event.event_phone_number or "",
            "event_website_url": event.event_website_url or "",
            "terms_and_conditions": event.terms_and_conditions or "",
            "tags": tags_list,
            "event_image": event.event_image.url if event.event_image else None,
            "image": event.event_image.url if event.event_image else None,
            "is_registered": False,
            "schedule": schedule_data,
        }

    except Event.DoesNotExist:
        return 404, {"error": "Event not found"}
    except Exception as e:
        print(f"Error fetching event for duplication: {e}")
        import traceback

        traceback.print_exc()
        return 400, {"error": str(e)}
