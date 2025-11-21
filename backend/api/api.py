"""
UniPlus API - Event Management System
"""

from ninja import NinjaAPI, Form, File
from ninja.files import UploadedFile
from ninja.security import django_auth
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.db import IntegrityError
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Avg, Count
from api.model.user import AttendeeUser
from api.model.event import Event
from api.model.ticket import Ticket
from api.model.event_schedule import EventSchedule
from api.model.comment import Comment
from api.model.rating import Rating
from api.model.notification import (
    Notification, 
    create_notification, 
    send_registration_notification, 
    send_approval_notification, 
    send_rejection_notification, 
    send_reminder_notification,
    send_event_creation_notification_to_admins,
    send_event_approval_notification,
    send_event_rejection_notification
)
from api import schemas
from typing import List, Optional, Union
import json
from datetime import datetime
import uuid 
import traceback
import pytz
from django.http import HttpResponse
import csv
from api.schemas import NotificationOut, NotificationMarkReadIn, NotificationBulkMarkReadIn



def convert_to_bangkok_time(dt):
    """
    Convert a datetime object to Bangkok timezone
    Returns a timezone-aware datetime in Asia/Bangkok
    """
    bangkok_tz = pytz.timezone('Asia/Bangkok')
    
    if dt is None:
        return None
    
    if dt.tzinfo is None:
        dt = pytz.UTC.localize(dt)
    
    # Convert to Bangkok timezone
    return dt.astimezone(bangkok_tz)


DEFAULT_PROFILE_PIC = "/images/logo.png" 

api = NinjaAPI()

@api.get("/")
def home(request):
    return {"message": "Welcome to UniPlus API"}


@api.get("/set-csrf-token")
def get_csrf_token(request):
    return {"csrftoken": get_token(request)}


@api.post("/register", response={200: schemas.SuccessSchema, 400: schemas.ErrorSchema})
def register(request, payload: schemas.RegisterSchema):
    try:
        if not payload.username or not payload.email or not payload.password:
            return 400, {"error": "Username, email, and password are required"}
        
        if AttendeeUser.objects.filter(email=payload.email).exists():
            return 400, {"error": "User with this email already exists"}
        
        if AttendeeUser.objects.filter(username=payload.username).exists():
            return 400, {"error": "Username already taken"}

        about_me_str = None
        if payload.about_me:
            about_me_str = json.dumps(payload.about_me)

        user = AttendeeUser.objects.create_user(
            email=payload.email,
            username=payload.username,
            password=payload.password,
            first_name=payload.first_name,
            last_name=payload.last_name,
            phone_number=payload.phone_number,
            about_me=about_me_str  
        )
        
        if hasattr(payload, 'role') and payload.role:
            user.role = payload.role
            user.save()
        
        about_me_response = None
        if about_me_str:
            about_me_response = json.loads(about_me_str)
        
        return 200, {
            "success": True,
            "message": "User registered successfully",
            "user": {
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name, 
                "last_name": user.last_name,
                "role": user.role,
                "phone_number": user.phone_number,
                "about_me": about_me_response,  
                "verification_status": user.verification_status,
                "creation_date": user.creation_date.isoformat() if user.creation_date else None
            }
        }
        
    except IntegrityError as e:
        return 400, {"error": "Registration failed. Please try again."}
    except Exception as e:
        return 400, {"error": str(e)}


@api.post("/login", response={200: schemas.SuccessSchema, 401: schemas.ErrorSchema})
def login_view(request, payload: schemas.LoginSchema):
    try:
        if not payload.email or not payload.password:
            return 401, {"error": "Email and password are required"}
        
        try:
            user_obj = AttendeeUser.objects.get(email=payload.email)
            user = authenticate(request, username=payload.email, password=payload.password)
        except AttendeeUser.DoesNotExist:
            return 401, {"error": "Invalid credentials"}
        
        if user is not None:
            login(request, user)
            return 200, {
                "success": True,
                "message": "Logged in successfully",
                "user": {
                    "username": user.username,
                    "email": user.email
                }
            }
        else:
            return 401, {"error": "Invalid credentials"}
            
    except Exception as e:
        return 401, {"error": str(e)}
    

@api.post("/logout", auth=django_auth, response=schemas.MessageSchema)
def logout_view(request):
    logout(request)
    return {"message": "Logged out successfully"}


@api.get("/user", auth=django_auth, response={200: schemas.UserSchema, 401: schemas.ErrorSchema})
def get_user(request):
    if request.user.is_authenticated:
        about_me_data = request.user.about_me if isinstance(request.user.about_me, dict) else {}

        tickets = []
        
        if hasattr(request.user, 'my_tickets') and request.user.my_tickets.exists():
            for ticket in request.user.my_tickets.all().select_related('event', 'event__organizer'):
                try:
                    event = ticket.event
                    
                    # event_dates is now JSONField, no need to parse
                    event_dates = ticket.event_dates if isinstance(ticket.event_dates, list) else []
                    
                    if not event_dates:
                        schedules = EventSchedule.objects.filter(event=event).order_by("event_date", "start_time_event")
                        for s in schedules:
                            # Combine date and time, then convert to Bangkok
                            start_dt = datetime.combine(s.event_date, s.start_time_event)
                            end_dt = datetime.combine(s.event_date, s.end_time_event) if s.end_time_event else None
                            
                            start_bangkok = convert_to_bangkok_time(start_dt)
                            end_bangkok = convert_to_bangkok_time(end_dt) if end_dt else None
                            
                            event_dates.append({
                                "date": start_bangkok.date().isoformat(),
                                "time": start_bangkok.time().isoformat(),
                                "endTime": end_bangkok.time().isoformat() if end_bangkok else None,
                                "location": event.event_address or "TBA",
                                "is_online": event.is_online,
                                "meeting_link": event.event_meeting_link or "",
                            })
                    else:
                        # Convert existing event_dates to Bangkok time
                        converted_dates = []
                        for ed in event_dates:
                            try:
                                date_str = ed.get('date')
                                time_str = ed.get('time')
                                
                                if date_str and time_str:
                                    dt = datetime.fromisoformat(f"{date_str}T{time_str}")
                                    bangkok_dt = convert_to_bangkok_time(dt)
                                    
                                    end_time_str = ed.get('endTime')
                                    end_bangkok = None
                                    if end_time_str:
                                        end_dt = datetime.fromisoformat(f"{date_str}T{end_time_str}")
                                        end_bangkok = convert_to_bangkok_time(end_dt)
                                    
                                    converted_dates.append({
                                        "date": bangkok_dt.date().isoformat(),
                                        "time": bangkok_dt.time().isoformat(),
                                        "endTime": end_bangkok.time().isoformat() if end_bangkok else None,
                                        "location": ed.get('location', event.event_address or "TBA"),
                                        "is_online": ed.get('is_online', event.is_online),
                                        "meeting_link": ed.get('meeting_link', event.event_meeting_link or ""),
                                    })
                            except Exception as e:
                                print(f"Error converting event date: {e}")
                                converted_dates.append(ed)
                        
                        event_dates = converted_dates
                    
                    # Fallback if still no dates
                    if not event_dates and event.event_start_date:
                        bangkok_start = convert_to_bangkok_time(event.event_start_date)
                        event_dates = [{
                            'date': bangkok_start.date().isoformat(),
                            'time': bangkok_start.time().isoformat(),
                            'location': event.event_address or 'TBA',
                            'is_online': event.is_online,
                            'meeting_link': event.event_meeting_link
                        }]
                    
                    display_date = event_dates[0]['date'] if event_dates else None
                    display_time = event_dates[0]['time'] if event_dates else '00:00:00'
                    
                    ticket_data = {
                        "date": display_date,
                        "time": display_time,
                        "location": event_dates[0]['location'] if event_dates else (event.event_address or 'TBA'),
                        "organizer": event.organizer.username if event and event.organizer else None,
                        "user_information": {
                            "name": f"{request.user.first_name} {request.user.last_name}",
                            "firstName": request.user.first_name,
                            "lastName": request.user.last_name,
                            "email": request.user.email,
                            "phone": request.user.phone_number
                        },
                        "event_title": event.event_title if event else None,
                        "event_description": event.event_description if event else None,
                        "ticket_number": ticket.qr_code,
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
            "profilePic": request.user.profile_picture.url if request.user.profile_picture else DEFAULT_PROFILE_PIC,
            "tickets": tickets
        }
    return 401, {"error": "Not authenticated"}

# ============================================================================
# NEW: PUBLIC PROFILE ENDPOINT
# ============================================================================

@api.get("/users/{username}/profile", response={200: schemas.PublicProfileSchema, 404: schemas.ErrorSchema})
def get_public_profile(request, username: str):
    """
    Get public profile of a user (for clicking on organizer names)
    """
    try:
        user = get_object_or_404(AttendeeUser, username=username)
        
        # Calculate stats
        events_organized = Event.objects.filter(organizer=user).count()
        
        # Total attendees across all events
        total_attendees = Ticket.objects.filter(
            event__organizer=user,
            approval_status='approved'
        ).count()
        
        # Average rating
        avg_rating = Rating.objects.filter(
            event__organizer=user
        ).aggregate(Avg('rates'))['rates__avg']
        
        return 200, {
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
            "about_me": user.about_me if isinstance(user.about_me, dict) else {},
            "profile_pic": user.profile_picture.url if user.profile_picture else DEFAULT_PROFILE_PIC,
            "events_organized": events_organized,
            "total_attendees": total_attendees,
            "avg_rating": round(avg_rating, 1) if avg_rating else None,
        }
    except Exception as e:
        return 404, {"error": f"User not found: {str(e)}"}


# ============================================================================
# NEW: ORGANIZER DASHBOARD ENDPOINTS
# ============================================================================

@api.get("/events/my-events/pending-approvals", auth=django_auth, response={200: schemas.OrganizerDashboardSchema, 401: schemas.ErrorSchema})
def get_organizer_dashboard(request):
    """
    Get organizer's main dashboard with pending approvals summary
    """
    if not request.user.is_authenticated:
        return 401, {"error": "Not authenticated"}
    
    user = request.user
    
    # Get all user's events
    events = Event.objects.filter(organizer=user)
    
    total_events = events.count()
    upcoming_events = events.filter(event_end_date__gte=datetime.now()).count()
    past_events = events.filter(event_end_date__lt=datetime.now()).count()
    
    # Total registrations across all events
    total_registrations = Ticket.objects.filter(event__organizer=user).count()
    
    # Total pending approvals across all events
    pending_approvals = Ticket.objects.filter(
        event__organizer=user,
        approval_status='pending'
    ).count()
    
    # Events with pending approvals
    events_with_pending = []
    for event in events:
        pending_count = Ticket.objects.filter(
            event=event,
            approval_status='pending'
        ).count()
        
        if pending_count > 0:
            events_with_pending.append({
                "event_id": event.id,
                "event_title": event.event_title,
                "pending_count": pending_count,
                "event_date": event.event_start_date.isoformat() if event.event_start_date else None,
            })
    
    return 200, {
        "total_events": total_events,
        "upcoming_events": upcoming_events,
        "past_events": past_events,
        "total_registrations": total_registrations,
        "pending_approvals": pending_approvals,
        "events_with_pending": events_with_pending,
    }
    
@api.get("/events")
def get_events_list(request):
    """
    Get all events with organizer information
    Returns only verified events to regular users
    Returns events sorted by creation date (newest first)
    """
    try:
        events = Event.objects.select_related('organizer').filter(verification_status="approved").order_by('-event_create_date')
        
        events_data = []
        for event in events:
            organizer_name = f"{event.organizer.first_name} {event.organizer.last_name}".strip()
            if not organizer_name:
                organizer_name = event.organizer.username or event.organizer.email
            tags_list = []
            if event.tags:
                try:
                    tags_list = json.loads(event.tags) if isinstance(event.tags, str) else event.tags
                except:
                    tags_list = [event.tags] if event.tags else []
            
            attendee_count = len(event.attendee) if event.attendee else 0
            
            schedule = []
            if hasattr(event, 'schedule') and event.schedule:
                try:
                    schedule = json.loads(event.schedule)
                except:
                    pass
            
            events_data.append({
                "id": event.id,
                "event_title": event.event_title,
                "event_description": event.event_description,
                "event_create_date": event.event_create_date.isoformat(),
                "start_date_register": event.start_date_register.isoformat(),
                "end_date_register": event.end_date_register.isoformat(),
                "event_start_date": event.event_start_date.isoformat() if event.event_start_date else None,
                "event_end_date": event.event_end_date.isoformat() if event.event_end_date else None,
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
            })
        
        return events_data
        
    except Exception as e:
        print(f"Error fetching events: {str(e)}")
        return {"error": str(e)}



@api.post("/events/create", auth=django_auth, response={200: schemas.SuccessSchema, 400: schemas.ErrorSchema})
def create_event(
    request,
    event_title: str = Form(...),
    event_description: str = Form(...),
    category: str = Form(default=""),
    start_date_register: str = Form(...),
    end_date_register: str = Form(...),
    schedule_days: str = Form(...),  # JSON string: [{"date":"2025-11-05", "time":"06:47", "endTime":"08:47", "location":"starz", "is_online":false}, ...]
    max_attendee: str = Form(default=""),
    tags: str = Form(default=""),
    event_email: str = Form(default=""),
    event_phone_number: str = Form(default=""),
    event_website_url: str = Form(default=""),
    terms_and_conditions: str = Form(default=""),
    event_image: UploadedFile = File(default=None),
):
    """
    Create a new event with multiple schedule days.
    
    Frontend sends schedule_days as a JSON array:
    [
        {
            "date": "2025-11-05",
            "time": "06:47",
            "endTime": "08:47",
            "location": "starz",
            "is_online": false,
            "meeting_link": null,
            "start_iso": "2025-11-05T06:47:00.000Z",
            "end_iso": "2025-11-05T08:47:00.000Z"
        },
        {
            "date": "2025-11-06",
            "time": "06:47",
            "endTime": "08:47",
            "location": "galaxy theater",
            "is_online": false,
            "meeting_link": null,
            "start_iso": "2025-11-06T06:47:00.000Z",
            "end_iso": "2025-11-06T08:47:00.000Z"
        }
    ]
    """
    try:
        # Parse the schedule days from the frontend
        schedule = json.loads(schedule_days)
        
        if not schedule or len(schedule) == 0:
            return 400, {"error": "At least one event date is required"}
        
        # Helper function to clean empty strings
        def clean_empty_string(value):
            if value and isinstance(value, str) and value.strip():
                return value.strip()
            return None
        
        # Get the first day's info to determine overall event settings
        first_day = schedule[0]
        last_day = schedule[-1]
        
        # Determine if event is online (use first day's setting)
        is_online = first_day.get('is_online', False)
        
        # Get location info from first day
        event_address = None if is_online else clean_empty_string(first_day.get('location'))
        event_meeting_link = clean_empty_string(first_day.get('meeting_link')) if is_online else None
        
        # Parse registration dates
        start_reg = datetime.fromisoformat(start_date_register.replace('Z', '+00:00'))
        end_reg = datetime.fromisoformat(end_date_register.replace('Z', '+00:00'))
        
        # Get event start and end dates from the schedule
        event_start = datetime.fromisoformat(first_day['start_iso'].replace('Z', '+00:00'))
        event_end = datetime.fromisoformat(last_day['end_iso'].replace('Z', '+00:00'))
        
        # Parse tags - ensure category is included
        tags_list = json.loads(tags) if tags and tags.strip() else []
        if category and category.strip() and category not in tags_list:
            tags_list.insert(0, category)
        
        # Clean optional fields
        event_email_clean = clean_empty_string(event_email)
        event_phone_clean = clean_empty_string(event_phone_number)
        event_website_clean = clean_empty_string(event_website_url)
        terms_clean = clean_empty_string(terms_and_conditions)
        
        # Create the Event
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
        
        # Store schedule as JSON for backwards compatibility (optional)
        event.schedule = json.dumps(schedule)
        event.save()
        
        print(f"DEBUG: Created event {event.id} - {event_title}")
        
        # CREATE EventSchedule ENTRIES
        created_schedules = []
        for day_info in schedule:
            try:
                start_datetime = datetime.fromisoformat(day_info['start_iso'].replace('Z', '+00:00'))
                end_datetime = datetime.fromisoformat(day_info['end_iso'].replace('Z', '+00:00'))
                
                event_schedule = EventSchedule.objects.create(
                    event=event,
                    event_date=start_datetime.date(),
                    start_time_event=start_datetime.time(),
                    end_time_event=end_datetime.time()
                )
                
                created_schedules.append({
                    'date': event_schedule.event_date.isoformat(),
                    'start_time': event_schedule.start_time_event.isoformat(),
                    'end_time': event_schedule.end_time_event.isoformat()
                })
                
                print(f"DEBUG: Created EventSchedule for {event_schedule.event_date}")
                
            except Exception as e:
                print(f"ERROR: Failed to create EventSchedule for day {day_info}: {e}")
                continue
        
        print(f"DEBUG: Created {len(created_schedules)} EventSchedule entries for event {event.id}")
        
        if len(created_schedules) == 0:
            print(f"WARNING: No EventSchedule entries were created!")
        send_event_creation_notification_to_admins(event)
        return 200, {
            "success": True,
            "message": f"Event created successfully with {len(created_schedules)} schedule entries",
            "event_id": event.id,
            "schedule_count": len(created_schedules),
            "verification_status": "pending"
        }
        
    except json.JSONDecodeError as e:
        print(f"ERROR: Invalid JSON in schedule_days: {e}")
        return 400, {"error": "Invalid schedule data format"}
    except Exception as e:
        print(f"ERROR: Failed to create event: {str(e)}")
        import traceback
        traceback.print_exc()
        return 400, {"error": str(e)}
    
@api.patch("/user", auth=django_auth, response={200: schemas.UserSchema, 400: schemas.ErrorSchema})
def update_user(
    request,
    firstName: str = Form(None),
    lastName: str = Form(None),
    phone: str = Form(None),
    aboutMe: str = Form(None),
    profilePic: UploadedFile = None
):
    user = request.user
    if firstName:
        user.first_name = firstName
    if lastName:
        user.last_name = lastName
    if phone:
        user.phone_number = phone
    if aboutMe:
        # Parse aboutMe as JSON and store it
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


@api.post("/events/{event_id}/register", auth=django_auth, response={200: schemas.SuccessSchema, 400: schemas.ErrorSchema})
def register_for_event(request, event_id: int):
    try:
        event = get_object_or_404(Event, id=event_id)
        user = request.user

        if Ticket.objects.filter(event=event, attendee=user).exists():
            return 400, {"error": "You are already registered for this event"}

        event_schedules = EventSchedule.objects.filter(event=event).order_by('event_date', 'start_time_event')
        
        schedule = []
        for sched in event_schedules:
            schedule.append({
                'date': sched.event_date.isoformat(),
                'time': sched.start_time_event.isoformat(),
                'endTime': sched.end_time_event.isoformat(),
                'location': event.event_address or 'TBA',
                'is_online': event.is_online,
                'meeting_link': event.event_meeting_link
            })
        
        print(f"DEBUG: Event {event_id} has {len(schedule)} EventSchedule entries")
        
        if not schedule:
            print(f"DEBUG: No EventSchedule entries found, creating fallback")
            schedule = [{
                'date': event.event_start_date.date().isoformat() if event.event_start_date else timezone.now().date().isoformat(),
                'time': event.event_start_date.time().isoformat() if event.event_start_date else '00:00:00',
                'endTime': '23:59:59',
                'location': event.event_address or 'TBA',
                'is_online': event.is_online,
                'meeting_link': event.event_meeting_link
            }]

        # Create ticket
        ticket = Ticket.objects.create(
            event=event,
            attendee=user,
            qr_code=str(uuid.uuid4()),
            user_name=f"{user.first_name} {user.last_name}".strip() or user.username,
            user_email=user.email,
            event_title=event.event_title,
            start_date=event.event_start_date,
            location=event.event_address or 'TBA',
            is_online=event.is_online,
            meeting_link=event.event_meeting_link,
            event_dates=schedule,
        )

        # 🔔 SEND REGISTRATION NOTIFICATION
        send_registration_notification(ticket)

        attendees = event.attendee if isinstance(event.attendee, list) else []
        if user.id not in attendees:
            attendees.append(user.id)
        event.attendee = attendees
        event.save()

        print(f"DEBUG: Ticket {ticket.qr_code} created with {len(schedule)} dates, status: {ticket.approval_status}")

        return 200, {
            "success": True,
            "message": "Successfully registered for the event. Awaiting organizer approval.",
            "tickets_count": 1,
            "ticket_number": ticket.qr_code
        }

    except Exception as e:
        print(f"Error registering for event: {str(e)}")
        import traceback
        traceback.print_exc()
        return 400, {"error": str(e)}


@api.get("/events/{event_id}")
def get_event_detail(request, event_id: int):
    """
    Get detailed event information including schedule
    Used for event detail page and duplication
    """
    try:
        event = get_object_or_404(Event, id=event_id)
        
        # Parse tags
        tags_list = []
        if event.tags:
            try:
                tags_list = json.loads(event.tags) if isinstance(event.tags, str) else event.tags
            except:
                tags_list = [event.tags] if event.tags else []
        
        # Get schedule from EventSchedule model
        event_schedules = EventSchedule.objects.filter(event=event).order_by('event_date', 'start_time_event')
        
        schedule_data = []
        for schedule in event_schedules:
            schedule_data.append({
                'date': schedule.event_date.isoformat() if schedule.event_date else None,
                'startTime': schedule.start_time_event.isoformat() if schedule.start_time_event else None,
                'start_time': schedule.start_time_event.isoformat() if schedule.start_time_event else None,
                'endTime': schedule.end_time_event.isoformat() if schedule.end_time_event else None,
                'end_time': schedule.end_time_event.isoformat() if schedule.end_time_event else None,
                'is_online': event.is_online,
                'location': event.event_address or "",
                'address': event.event_address or "",
                'meeting_link': event.event_meeting_link or "",
            })
        
        # Fallback: if no EventSchedule exists, use event.schedule JSON field
        if not schedule_data and event.schedule:
            try:
                schedule_data = json.loads(event.schedule) if isinstance(event.schedule, str) else event.schedule
            except:
                schedule_data = []
        
        # Get organizer info
        organizer_name = f"{event.organizer.first_name} {event.organizer.last_name}".strip()
        if not organizer_name:
            organizer_name = event.organizer.username or event.organizer.email
        
        # Count attendees
        attendee_count = len(event.attendee) if event.attendee else 0
        
        return {
            "id": event.id,
            "event_title": event.event_title,
            "event_description": event.event_description,
            "event_create_date": event.event_create_date.isoformat() if event.event_create_date else None,
            "start_date_register": event.start_date_register.isoformat() if event.start_date_register else None,
            "end_date_register": event.end_date_register.isoformat() if event.end_date_register else None,
            "event_start_date": event.event_start_date.isoformat() if event.event_start_date else None,
            "event_end_date": event.event_end_date.isoformat() if event.event_end_date else None,
            "max_attendee": event.max_attendee,
            "event_address": event.event_address or "",
            "is_online": event.is_online,
            "event_meeting_link": event.event_meeting_link or "",
            "tags": tags_list,
            "event_email": event.event_email or "",
            "event_phone_number": event.event_phone_number or "",
            "event_website_url": event.event_website_url or "",
            "terms_and_conditions": event.terms_and_conditions or "",
            "event_image": event.event_image.url if event.event_image else None,
            "image": event.event_image.url if event.event_image else None,
            "schedule": schedule_data,  
            "status_registration": event.status_registration,
            "organizer_name": organizer_name,
            "organizer_role": event.organizer.role or "Organizer",
            "organizer_id": event.organizer.id,
            "attendee": event.attendee,
            "attendee_count": attendee_count,
            "verification_status": event.verification_status or "pending",
        }
        
    except Exception as e:
        print(f"Error fetching event detail: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}



@api.get("/tickets/{ticket_id}", auth=django_auth, response=schemas.TicketDetailSchema)
def get_ticket_detail(request, ticket_id: int):
    ticket = get_object_or_404(Ticket, id=ticket_id, attendee=request.user)
    
    # Add this line to define event_dates:
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



#Comments and Ratings Endpoints

@api.post("/events/{event_id}/comments", auth=django_auth, response={200: schemas.SuccessSchema, 400: schemas.ErrorSchema})
def add_comment(request, event_id: int, payload: schemas.CommentCreateSchema):
    """
    Add a comment to an event
    """
    try:
        event = get_object_or_404(Event, id=event_id)
        user = request.user

        # Check if user has attended the event 
        has_ticket = Ticket.objects.filter(event=event, attendee=user).exists()
        if not has_ticket:
            return 400, {"error": "You must have attended this event to leave a comment"}

        # Content is not empty
        if not payload.content or not payload.content.strip():
            return 400, {"error": "Comment content cannot be empty"}
        
        existing_comment = Comment.objects.filter(event_id=event, author_id=user).first()
        if existing_comment:
            # Update existing comment
            existing_comment.content = payload.content.strip()
            existing_comment.save()
            message = "Comment updated successfully"
            comment_id = existing_comment.id  
        else:
            # Create new comment
            comment = Comment.objects.create(
                event_id=event,      
                author_id=user,      
                content=payload.content.strip()
            )
            message = "Comment added successfully"
            comment_id = comment.id  

        return 200, {
            "success": True,
            "message": message,
            "comment_id": comment_id  
        }
    except Event.DoesNotExist:
        return 400, {"error": "Event not found"}
    except Exception as e:
        print(f"Error adding comment: {str(e)}")
        return 400, {"error": str(e)}


@api.post("/events/{event_id}/ratings", auth=django_auth, response={200: schemas.SuccessSchema, 400: schemas.ErrorSchema})
def add_rating(request, event_id: int, payload: schemas.RatingCreateSchema):
    """
    Add or update a rating for an event
    """
    try:
        event = get_object_or_404(Event, id=event_id)
        user = request.user


        # Check if user has attended the event 
        has_ticket = Ticket.objects.filter(event=event, attendee=user).exists()
        if not has_ticket:
            return 400, {"error": "You must have attended this event to leave a rating"}

        # Check if user already rated this event
        existing_rating = Rating.objects.filter(event_id=event, reviewer_id=user).first()
        
        if existing_rating:
            # Update existing rating
            existing_rating.rates = payload.rates
            existing_rating.save()
            message = "Rating updated successfully"
        else:
            rating = Rating.objects.create(
                event_id=event,      
                reviewer_id=user,    
                rates=payload.rates
            )
            message = "Rating added successfully"

        return 200, {
            "success": True,
            "message": message
        }

    except Event.DoesNotExist:
        return 400, {"error": "Event not found"}
    except Exception as e:
        print(f"Error adding rating: {str(e)}")
        return 400, {"error": str(e)}
    
@api.get("/events/{event_id}/comments", response=schemas.EventCommentsResponse)
def get_event_comments(request, event_id: int):
    """
    Get all comments and ratings for an event
    """
    try:
        event = get_object_or_404(Event, id=event_id)
        
        # Get comments with user information
        comments = Comment.objects.filter(event_id=event).select_related('author_id').order_by('-content_created_at')
        
        comments_data = []
        for comment in comments:
            user_name = f"{comment.author_id.first_name} {comment.author_id.last_name}".strip()
            if not user_name:
                user_name = comment.author_id.username or comment.author_id.email
                
            comments_data.append({
                "id": comment.id,
                "event_id": comment.event_id.id,
                "user_id": comment.author_id.id,
                "organizer_id": event.organizer.id,
                "content": comment.content,
                "content_created_at": comment.content_created_at.isoformat() if comment.content_created_at else None,
                "content_updated_at": comment.content_updated_at.isoformat() if comment.content_updated_at else None,
                "user_name": user_name,
                "user_profile_pic": comment.author_id.profile_picture.url if comment.author_id.profile_picture else DEFAULT_PROFILE_PIC,
            })

        ratings_agg = Rating.objects.filter(event_id=event).aggregate(
            average_rating=Avg('rates'),
            total_ratings=Count('id')
        )
        
        average_rating = ratings_agg['average_rating']
        if average_rating is not None:
            average_rating = round(average_rating, 1)
        else:
            average_rating = 0.0 

        total_ratings = ratings_agg['total_ratings'] or 0  

        return {
            "comments": comments_data,
            "average_rating": average_rating, 
            "total_ratings": total_ratings
        }

    except Event.DoesNotExist:
        return {"error": "Event not found"}
    except Exception as e:
        print(f"Error fetching comments for event {event_id}: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return {"error": str(e)}
      
@api.get("/user/event-history", auth=django_auth)
def get_user_event_history(request):
    """Get user's registered events - APPROVED ONLY"""
    if not request.user.is_authenticated:
        return 401, {"error": "Not authenticated"}
    
    try:
        tickets = Ticket.objects.filter(
            attendee=request.user,
            approval_status='approved'
        ).select_related('event', 'event__organizer').order_by('-purchase_date')
        
        events_data = []
        for ticket in tickets:
            event_obj = ticket.event
            
            if not event_obj:
                continue
            
            # Parse event tags
            event_tags = []
            if event_obj.tags:
                try:
                    event_tags = json.loads(event_obj.tags) if isinstance(event_obj.tags, str) else event_obj.tags
                except:
                    event_tags = [event_obj.tags] if event_obj.tags else []
            
            # Get event date
            event_date_str = None
            if ticket.event_dates and isinstance(ticket.event_dates, list) and len(ticket.event_dates) > 0:
                event_date_str = ticket.event_dates[0].get('date')
            elif event_obj.event_start_date:
                event_date_str = event_obj.event_start_date.date().isoformat() if hasattr(event_obj.event_start_date, 'date') else event_obj.event_start_date.isoformat()
            
            # Determine status
            status = "upcoming"
            if event_obj.event_start_date:
                status = "upcoming" if event_obj.event_start_date > timezone.now() else "past"
            
            events_data.append({
                "ticket_id": ticket.id,
                "event_id": event_obj.id,
                "event_title": event_obj.event_title,
                "event_description": event_obj.event_description,
                "event_date": event_date_str,
                "event_start_date": event_obj.event_start_date.isoformat() if event_obj.event_start_date else None,
                "event_end_date": event_obj.event_end_date.isoformat() if event_obj.event_end_date else None,
                "location": ticket.location or event_obj.event_address or ("Online" if event_obj.is_online else "TBA"),
                "is_online": ticket.is_online if hasattr(ticket, 'is_online') else event_obj.is_online,
                "meeting_link": ticket.meeting_link if hasattr(ticket, 'meeting_link') else event_obj.event_meeting_link,
                "status": status,
                "approval_status": ticket.approval_status,
                "organizer": event_obj.organizer.username if event_obj.organizer else "Unknown",
                "organizer_role": event_obj.organizer.role if event_obj.organizer else "organizer",
                "event_tags": event_tags,
                "event_create_date": event_obj.event_create_date.isoformat() if event_obj.event_create_date else None,
                "event_image": event_obj.event_image.url if event_obj.event_image else None,
                "user_name": ticket.user_name,
                "user_email": ticket.user_email,
                "purchase_date": ticket.purchase_date.isoformat() if ticket.purchase_date else None,
                "qr_code": ticket.qr_code,
            })
        
        return 200, {
            "events": events_data,
            "total_count": len(events_data)
        }
        
    except Exception as e:
        print("Error fetching event history:")
        print(str(e))
        import traceback
        traceback.print_exc()
        return 400, {"error": str(e)}


@api.get("/user/statistics", auth=django_auth, response={200: dict, 401: schemas.ErrorSchema})
def get_user_statistics(request):
    """Get user's event statistics"""
    if not request.user.is_authenticated:
        return 401, {"error": "Not authenticated"}
    
    try:
        from django.utils import timezone
        all_tickets = Ticket.objects.filter(attendee=request.user)
        total_events = all_tickets.values('event').distinct().count()
        upcoming_tickets = all_tickets.filter(
            event__event_end_date__gt=timezone.now()
        ).values('event').distinct()
        upcoming_count = upcoming_tickets.count()
        past_tickets = all_tickets.filter(
            event__event_end_date__lte=timezone.now()
        ).values('event').distinct()
        attended_count = past_tickets.count()
        
        # Add pending count
        pending_count = all_tickets.filter(approval_status='pending').count()
        
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


@api.get(
    "/events/{event_id}/dashboard",
    auth=django_auth,
    response={200: schemas.EventDashboardSchema, 403: schemas.ErrorSchema, 404: schemas.ErrorSchema, 400: schemas.ErrorSchema},
)
def get_event_dashboard(request, event_id: int):
    """Get dashboard data for event organizer - UPDATED VERSION"""
    try:
        event = get_object_or_404(Event, id=event_id)
        
        # Check if user is the organizer
        if event.organizer != request.user:
            return 403, {"error": "You are not authorized to view this dashboard"}
        
        # Get all tickets for this event
        tickets = Ticket.objects.filter(event=event).select_related("attendee")
        
        # Get event schedule days
        schedules = EventSchedule.objects.filter(event=event).order_by("event_date", "start_time_event")
        
        schedule_days = []
        for idx, schedule in enumerate(schedules, 1):
            schedule_days.append({
                "date": schedule.event_date.isoformat(),
                "label": f"Day {idx}",
                "start_time": schedule.start_time_event.isoformat() if schedule.start_time_event else None,
                "end_time": schedule.end_time_event.isoformat() if schedule.end_time_event else None,
                "location": event.event_address or "TBA",
                "is_online": event.is_online,
                "meeting_link": event.event_meeting_link,
            })
        
        # Build attendees list
        attendees = []
        for ticket in tickets:
            user = ticket.attendee
            
            # Determine status based on check-in and approval (event-wide)
            if ticket.checked_in_at:
                status = "present"
            elif ticket.approval_status == "pending":
                status = "pending"
            else:
                status = "absent"
            
            # Get event date (first date if multi-day)
            event_date_str = ""
            if ticket.event_dates and isinstance(ticket.event_dates, list) and len(ticket.event_dates) > 0:
                first = ticket.event_dates[0]
                if isinstance(first, dict):
                    event_date_str = str(first.get("date") or "")
                else:
                    event_date_str = str(first)
                # normalise to just YYYY-MM-DD
                if len(event_date_str) >= 10:
                    event_date_str = event_date_str[:10]
            
            if not event_date_str and event.event_start_date:
                event_date_str = event.event_start_date.date().isoformat()
            
            # Get user's about_me (now JSONField)
            about_me = user.about_me if isinstance(user.about_me, dict) else {}
            
            checked_in_dates_dict = {}
            if isinstance(ticket.checked_in_dates, dict):
                checked_in_dates_dict = ticket.checked_in_dates
            elif isinstance(ticket.checked_in_dates, list):
                # Convert old list format to dict format
                for date_str in ticket.checked_in_dates:
                    if isinstance(date_str, str) and len(date_str) >= 10:
                        checked_in_dates_dict[date_str[:10]] = ticket.checked_in_at.isoformat() if ticket.checked_in_at else timezone.now().isoformat()
            
            attendees.append({
                "ticketId": ticket.ticket_number or ticket.qr_code,
                "name": f"{user.first_name} {user.last_name}",
                "email": user.email,
                "status": status,
                "approvalStatus": ticket.approval_status,
                "registered": ticket.purchase_date.isoformat(),
                "approvedAt": ticket.approved_at.isoformat() if ticket.approved_at else "",
                "rejectedAt": ticket.rejected_at.isoformat() if ticket.rejected_at else "",
                "checkedIn": ticket.checked_in_at.isoformat() if ticket.checked_in_at else "",
                "eventDate": event_date_str,
                "phone": user.phone_number,
                "role": user.role,
                "about_me": about_me,
                "checkedInDates": checked_in_dates_dict,
            })
        
        # Calculate statistics
        total_registered = tickets.count()
        checked_in = tickets.filter(checked_in_at__isnull=False).count()
        approved = tickets.filter(approval_status="approved").count()
        pending = tickets.filter(approval_status="pending").count()
        rejected = tickets.filter(approval_status="rejected").count()
        
        # Attendance rate (checked in / approved)
        attendance_rate = (checked_in / approved * 100) if approved > 0 else 0
        
        return 200, {
            "event": {
                "id": event.id,
                "title": event.event_title,
                "description": event.event_description,
                "start_date": event.event_start_date.isoformat() if event.event_start_date else None,
                "end_date": event.event_end_date.isoformat() if event.event_end_date else None,
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
        import traceback
        traceback.print_exc()
        return 400, {"error": str(e)}



# ============================================================================
# NEW: APPROVAL ENDPOINTS
# ============================================================================

@api.post("/events/{event_id}/registrations/bulk-action", auth=django_auth, response={200: schemas.ApprovalResponseSchema, 403: schemas.ErrorSchema, 400: schemas.ErrorSchema})
def bulk_approve_reject(request, event_id: int, payload: schemas.ApprovalRequestSchema):
    """
    Approve or reject multiple registrations at once
    Supports bulk actions with select all
    """
    try:
        event = get_object_or_404(Event, id=event_id)
        
        # Security check: Only organizer can approve/reject
        if event.organizer != request.user:
            return 403, {"error": "You are not authorized to perform this action"}
        
        # Validate action
        if payload.action not in ['approve', 'reject']:
            return 400, {"error": "Invalid action. Must be 'approve' or 'reject'"}
        
        # Get tickets by ticket_number or qr_code
        tickets = Ticket.objects.filter(
            event=event,
            ticket_number__in=payload.ticket_ids
        ).select_related('attendee', 'event')  
        
        # Also try QR codes if no tickets found
        if tickets.count() == 0:
            tickets = Ticket.objects.filter(
                event=event,
                qr_code__in=payload.ticket_ids
            ).select_related('attendee', 'event')  
        
        if tickets.count() == 0:
            return 400, {"error": "No tickets found"}
        
        # Process each ticket individually
        new_status = 'approved' if payload.action == 'approve' else 'rejected'
        updated_count = 0
        
        for ticket in tickets:
            # ✅ Handle rejection: ALWAYS remove from attendee list
            if new_status == 'rejected':
                if ticket.attendee.id in event.attendee:
                    event.attendee.remove(ticket.attendee.id)
            
            # Update ticket status
            ticket.approval_status = new_status
            if new_status == 'approved':
                ticket.approved_at = timezone.now()
            else:
                ticket.rejected_at = timezone.now()
            ticket.save()
            
            # 🔔 Send notification
            if new_status == 'approved':
                send_approval_notification(ticket)
            else:
                send_rejection_notification(ticket)
            
            updated_count += 1
        
        # ✅ Save event once after all modifications
        event.save()

        # Return response
        return 200, {
            "success": True,
            "message": f"{updated_count} registration(s) {new_status}",
            "ticket_id": payload.ticket_ids[0] if payload.ticket_ids else "",
            "status": new_status,
            "processed_count": updated_count,
        }
    except Exception as e:
        print(f"Error in bulk action: {e}")
        import traceback
        traceback.print_exc()
        return 400, {"error": str(e)}


@api.post("/events/{event_id}/registrations/{ticket_id}/approve", auth=django_auth, response={200: schemas.ApprovalResponseSchema, 403: schemas.ErrorSchema, 400: schemas.ErrorSchema})
def approve_registration(request, event_id: int, ticket_id: str):
    """
    Approve a single registration
    """
    try:
        event = get_object_or_404(Event, id=event_id)
        
        # Security check
        if event.organizer != request.user:
            return 403, {"error": "You are not authorized to perform this action"}
        
        # Find ticket
        ticket = None
        try:
            ticket = Ticket.objects.select_related('attendee', 'event').get(ticket_number=ticket_id, event=event)
        except Ticket.DoesNotExist:
            ticket = Ticket.objects.select_related('attendee', 'event').get(qr_code=ticket_id, event=event)
        
        ticket.approval_status = 'approved'
        ticket.save()
        
        # 🔔 Send notification
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


@api.post("/events/{event_id}/registrations/{ticket_id}/reject", auth=django_auth, response={200: schemas.ApprovalResponseSchema, 403: schemas.ErrorSchema, 400: schemas.ErrorSchema})
def reject_registration(request, event_id: int, ticket_id: str):
    """
    Reject a single registration
    """
    try:
        event = get_object_or_404(Event, id=event_id)
        
        # Security check
        if event.organizer != request.user:
            return 403, {"error": "You are not authorized to perform this action"}
        
        # Find ticket
        ticket = None
        try:
            ticket = Ticket.objects.select_related('attendee', 'event').get(ticket_number=ticket_id, event=event)
        except Ticket.DoesNotExist:
            ticket = Ticket.objects.select_related('attendee', 'event').get(qr_code=ticket_id, event=event)
        
        # ✅ ALWAYS remove from attendee list when rejecting (regardless of previous status)
        if ticket.attendee.id in event.attendee:
            event.attendee.remove(ticket.attendee.id)
            event.save()
        
        # Update ticket status
        ticket.approval_status = 'rejected'
        ticket.rejected_at = timezone.now()
        ticket.save()
        
        # Send notification
        send_rejection_notification(ticket)
            
        return 200, {
            "success": True,
            "message": "Registration rejected",
            "ticket_id": ticket_id,
            "status": "rejected",
        }
    except Ticket.DoesNotExist:
        return 400, {"error": "Ticket not found"}
    except Exception as e:
        print(f"Error rejecting ticket: {e}")
        return 400, {"error": str(e)}

@api.post("/checkin", auth=django_auth, response={200: schemas.CheckInResponseSchema, 400: schemas.ErrorSchema, 403: schemas.ErrorSchema})
def check_in_attendee(request, payload: schemas.CheckInRequestSchema):
    """
    Check in an attendee using QR code
    Only organizers can check in attendees for their events
    """
    try:
        # Find ticket by QR code
        try:
            ticket = Ticket.objects.select_related('event', 'attendee').get(
                qr_code=payload.qr_code
            )
        except Ticket.DoesNotExist:
            return 400, {"error": "Invalid QR code"}
        
        # Security check: Only event organizer can check in
        if ticket.event.organizer != request.user:
            return 403, {"error": "You are not authorized to check in attendees for this event"}
        
        # Check if ticket is approved
        if ticket.approval_status != 'approved':
            return 400, {
                "error": f"Ticket is {ticket.approval_status}. Only approved tickets can be checked in."
            }
        
        # Check if already checked in
        if ticket.checked_in_at:
            return 200, {
                "success": False,
                "message": "Attendee already checked in",
                "ticket_id": ticket.id,
                "attendee_name": ticket.user_name,
                "event_title": ticket.event_title,
                "event_date": payload.event_date,
                "already_checked_in": True,
                "checked_in_at": ticket.checked_in_at,
                "approval_status": ticket.approval_status,
            }
        
        # Check in
        from django.utils import timezone
        ticket.checked_in_at = timezone.now()
        ticket.status = 'present'
        ticket.save()
        
        return 200, {
            "success": True,
            "message": "Check-in successful",
            "ticket_id": ticket.id,
            "attendee_name": ticket.user_name,
            "event_title": ticket.event_title,
            "event_date": payload.event_date,
            "already_checked_in": False,
            "checked_in_at": ticket.checked_in_at,
            "approval_status": ticket.approval_status,
        }
    except Exception as e:
        print(f"Error during check-in: {e}")
        import traceback
        traceback.print_exc()
        return 400, {"error": str(e)}

@api.post("/events/{event_id}/approve-ticket", auth=django_auth, response={200: dict, 403: schemas.ErrorSchema, 400: schemas.ErrorSchema})
def approve_ticket(request, event_id: int, ticket_id: str, approval_status: str):
    """
    DEPRECATED: Use /events/{event_id}/registrations/{ticket_id}/approve or /reject instead
    """
    try:
        event = get_object_or_404(Event, id=event_id)
        
        if event.organizer != request.user:
            return 403, {"error": "You are not authorized to perform this action"}
        
        try:
            ticket = Ticket.objects.get(ticket_number=ticket_id, event=event)
        except Ticket.DoesNotExist:
            ticket_id_num = int(ticket_id.replace('T', '')) if ticket_id.startswith('T') else int(ticket_id)
            ticket = get_object_or_404(Ticket, id=ticket_id_num, event=event)
        
        ticket.approval_status = approval_status
        ticket.save()
        
        return 200, {
            "success": True,
            "message": f"Ticket {ticket_id} {approval_status}",
            "ticket_id": ticket_id,
            "status": approval_status
        }
    except Exception as e:
        print(f"Error approving ticket: {e}")
        return 400, {"error": str(e)}


@api.post(
    "/events/{event_id}/check-in",
    auth=django_auth,
    response={200: dict, 403: schemas.ErrorSchema, 400: schemas.ErrorSchema},
)
def check_in_attendee_legacy(request, event_id: int, ticket_id: str, checkin_date: str):
    """
    Check in an attendee for a specific schedule date (YYYY-MM-DD).

    DEPRECATED: Use /checkin endpoint instead, but kept for backwards compatibility.
    """
    try:
        event = get_object_or_404(Event, id=event_id)

        if event.organizer != request.user:
            return 403, {"error": "You are not authorized to perform this action"}

        # Resolve ticket by ticket_number first, then fallback to numeric ID
        try:
            ticket = Ticket.objects.get(ticket_number=ticket_id, event=event)
        except Ticket.DoesNotExist:
            ticket_id_num = int(ticket_id.replace("T", "")) if ticket_id.startswith("T") else int(ticket_id)
            ticket = get_object_or_404(Ticket, id=ticket_id_num, event=event)

        # Parse date string from query param
        try:
            parsed_date = datetime.strptime(checkin_date, "%Y-%m-%d").date()
        except ValueError:
            return 400, {"error": "Invalid date format. Use YYYY-MM-DD."}

        # Normalised date string (YYYY-MM-DD)
        date_str = parsed_date.isoformat()
        
        # Normalise ticket.event_dates into 'YYYY-MM-DD' strings
        valid_dates: list[str] = []
        for d in ticket.event_dates or []:
            if isinstance(d, str):
                try:
                    dt = datetime.fromisoformat(d)
                    valid_dates.append(dt.date().isoformat())
                except ValueError:
                    if len(d) >= 10:
                        valid_dates.append(d[:10])
            else:
                try:
                    if hasattr(d, "date"):  # datetime
                        valid_dates.append(d.date().isoformat())
                    elif hasattr(d, "isoformat"):  # date
                        valid_dates.append(d.isoformat())
                except Exception:
                    pass

        # Validate that this date is in the ticket's event_dates (if event_dates is set)
        if valid_dates and date_str not in valid_dates:
            return 400, {"error": "This ticket is not valid for the selected date."}

        # Initialize checked_in_dates as dict if it's a list or None
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

        # Store check-in timestamp for this date
        ticket.checked_in_dates[date_str] = timezone.now().isoformat()
        
        # keep last check-in timestamp + overall status
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


    

@api.get("/user/tickets", auth=django_auth, response={200: schemas.UserTicketsResponse, 401: schemas.ErrorSchema})
def get_user_tickets(request, status: str = None):
    """
    Get all tickets for the authenticated user
    Optional query parameter: status (pending/approved/rejected)
    """
    if not request.user.is_authenticated:
        return 401, {"error": "Not authenticated"}
    
    try:
        # Base query
        tickets_query = Ticket.objects.filter(attendee=request.user).select_related('event', 'event__organizer')
        
        # Filter by status if provided
        if status and status in ['pending', 'approved', 'rejected']:
            tickets_query = tickets_query.filter(approval_status=status)
        
        tickets_data = []
        
        for ticket in tickets_query.order_by('-purchase_date'):
            try:
                event = ticket.event
                
                # Get event dates from ticket or event schedule
                event_dates = ticket.event_dates if isinstance(ticket.event_dates, list) else []
                
                if not event_dates and event:
                    schedules = EventSchedule.objects.filter(event=event).order_by("event_date", "start_time_event")
                    for s in schedules:
                        start_dt = datetime.combine(s.event_date, s.start_time_event)
                        end_dt = datetime.combine(s.event_date, s.end_time_event) if s.end_time_event else None
                        
                        start_bangkok = convert_to_bangkok_time(start_dt)
                        end_bangkok = convert_to_bangkok_time(end_dt) if end_dt else None
                        
                        event_dates.append({
                            "date": start_bangkok.date().isoformat(),
                            "time": start_bangkok.time().isoformat(),
                            "endTime": end_bangkok.time().isoformat() if end_bangkok else None,
                            "location": event.event_address or "TBA",
                            "is_online": event.is_online,
                            "meeting_link": event.event_meeting_link or "",
                        })
                else:
                    # Convert existing event_dates
                    converted_dates = []
                    for ed in event_dates:
                        try:
                            date_str = ed.get('date')
                            time_str = ed.get('time')
                            
                            if date_str and time_str:
                                dt = datetime.fromisoformat(f"{date_str}T{time_str}")
                                bangkok_dt = convert_to_bangkok_time(dt)
                                
                                end_time_str = ed.get('endTime')
                                end_bangkok = None
                                if end_time_str:
                                    end_dt = datetime.fromisoformat(f"{date_str}T{end_time_str}")
                                    end_bangkok = convert_to_bangkok_time(end_dt)
                                
                                converted_dates.append({
                                    "date": bangkok_dt.date().isoformat(),
                                    "time": bangkok_dt.time().isoformat(),
                                    "endTime": end_bangkok.time().isoformat() if end_bangkok else None,
                                    "location": ed.get('location', event.event_address or "TBA"),
                                    "is_online": ed.get('is_online', event.is_online),
                                    "meeting_link": ed.get('meeting_link', event.event_meeting_link or ""),
                                })
                        except Exception as e:
                            print(f"Error converting date: {e}")
                            converted_dates.append(ed)
                    
                    event_dates = converted_dates
                
                # Fallback
                if not event_dates and event and event.event_start_date:
                    bangkok_start = convert_to_bangkok_time(event.event_start_date)
                    event_dates = [{
                        'date': bangkok_start.date().isoformat(),
                        'time': bangkok_start.time().isoformat(),
                        'location': event.event_address or 'TBA',
                        'is_online': event.is_online,
                        'meeting_link': event.event_meeting_link
                    }]
                
                display_date = event_dates[0]['date'] if event_dates else None
                display_time = event_dates[0]['time'] if event_dates else '00:00:00'
                
                ticket_data = {
                    "ticket_id": ticket.id,
                    "qr_code": ticket.qr_code,
                    "event_id": event.id if event else None,
                    "event_title": event.event_title if event else "Event not found",
                    "event_description": event.event_description if event else None,
                    "event_image": event.event_image.url if event and event.event_image else None,
                    "organizer_name": event.organizer.username if event and event.organizer else None,
                    "organizer_id": event.organizer.id if event and event.organizer else None,
                    "date": display_date,
                    "time": display_time,
                    "location": event_dates[0]['location'] if event_dates else (event.event_address if event else 'TBA'),
                    "is_online": ticket.is_online,
                    "event_meeting_link": ticket.meeting_link,
                    "event_dates": event_dates,
                    "approval_status": ticket.approval_status,
                    "purchase_date": ticket.purchase_date.isoformat() if ticket.purchase_date else None,
                    "checked_in_at": ticket.checked_in_at.isoformat() if ticket.checked_in_at else None,
                    "status": ticket.status,
                }
                tickets_data.append(ticket_data)
                
            except Exception as e:
                print(f"Error processing ticket {ticket.id}: {e}")
                continue

        return 200, {
            "tickets": tickets_data,
            "total_count": len(tickets_data),
            "pending_count": tickets_query.filter(approval_status='pending').count(),
            "approved_count": tickets_query.filter(approval_status='approved').count(),
            "rejected_count": tickets_query.filter(approval_status='rejected').count(),
        }
        
    except Exception as e:
        print(f"Error fetching user tickets: {e}")
        return 400, {"error": str(e)}
        
@api.get("/user/created-events", auth=django_auth, response={200: dict, 401: schemas.ErrorSchema, 400: schemas.ErrorSchema})
def get_user_created_events(request):
    """Return events created by the logged-in user"""
    if not request.user.is_authenticated:
        return 401, {"error": "Not authenticated"}
    try:
        created_events = (
            Event.objects.filter(organizer=request.user)
            .select_related("organizer")
            .order_by("-event_start_date")
        )
        events_data = []
        for event in created_events:
            # Determine status (upcoming/past)
            status = "upcoming" if (
                event.event_start_date and event.event_start_date > timezone.now()
            ) else "past"

            # Parse tags safely
            event_tags = []
            if event.tags:
                try:
                    event_tags = json.loads(event.tags) if isinstance(event.tags, str) else event.tags
                except:
                    event_tags = [event.tags] if event.tags else []

            event_date_str = (
                event.event_start_date.strftime("%Y-%m-%d")
                if event.event_start_date
                else None
            )
            events_data.append({
                "event_id": event.id,
                "event_title": event.event_title,
                "event_description": event.event_description,
                "event_date": event_date_str,
                "location": event.event_address, 
                "is_online": event.is_online,
                "meeting_link": event.event_meeting_link,  
                "status": status,
                "organizer": event.organizer.username if event.organizer else None,
                "organizer_role": getattr(event.organizer, "role", "organizer") if event.organizer else "organizer",
                "event_tags": event_tags,
                "user_name": request.user.username,
                "user_email": request.user.email,
                "purchase_date": None,
                "qr_code": None,
            })
        return 200, {
            "events": events_data,
            "total_count": len(events_data),
        }
    except Exception as e:
        import traceback
        print("Error fetching created events:")
        traceback.print_exc()
        return 400, {"error": str(e)}


# exported into csv


@api.post("/events/{event_id}/export", auth=django_auth)
def export_event_registrations(request, event_id: int):
    try:
        event = get_object_or_404(Event, id=event_id)
        
        # Proper authorization check
        if event.organizer != request.user:
            return HttpResponse("Unauthorized", status=403)
        
        # Get tickets with related data
        tickets = Ticket.objects.filter(event=event).select_related('attendee')
        
        if not tickets.exists():
            return HttpResponse("No registrations found", status=404)

        # Create CSV with better filename
        response = HttpResponse(content_type='text/csv')
        filename = f"{event.event_title}_registrations_{timezone.now().date()}.csv"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        writer = csv.writer(response)
        
        # Enhanced headers
        writer.writerow([
            'Ticket ID', 'Attendee Name', 'Attendee Email', 
            'Phone', 'Registration Date', 'Status', 'QR Code'
        ])
        
        for ticket in tickets:
            attendee = ticket.attendee
            attendee_name = f"{attendee.first_name} {attendee.last_name}".strip()
            if not attendee_name:
                attendee_name = attendee.username
                
            writer.writerow([
                ticket.id,
                attendee_name,
                attendee.email,
                attendee.phone_number or 'N/A',
                ticket.purchase_date.strftime('%Y-%m-%d %H:%M:%S') if ticket.purchase_date else 'N/A',
                ticket.approval_status,  # Include approval status
                ticket.qr_code
            ])
        
        return response
        
    except Event.DoesNotExist:
        return HttpResponse("Event not found", status=404)
    except Exception as e:
        print(f"Export error: {str(e)}")
        return HttpResponse("Export failed", status=500)
    


# ============================================================================
# EVENT VERIFICATION ENDPOINTS
# ============================================================================

@api.post("/events/{event_id}/verify", auth=django_auth, response={200: schemas.SuccessSchema, 403: schemas.ErrorSchema, 400: schemas.ErrorSchema})
def verify_event(request, event_id: int):
    """
    Verify an event 
    """
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
            "verification_status": "approved"
        }
    except Exception as e:
        print(f"Error verifying event: {e}")
        return 400, {"error": str(e)}

@api.post("/events/{event_id}/reject", auth=django_auth, response={200: schemas.SuccessSchema, 403: schemas.ErrorSchema, 400: schemas.ErrorSchema})
def reject_event(request, event_id: int):
    """
    Reject an event (admin only)
    """
    try:
        event = get_object_or_404(Event, id=event_id)
        
        # Security check: Only admin users can reject events
        if request.user.role != "admin":
            return 403, {"error": "You are not authorized to reject events"}
        
        event.verification_status = "rejected"
        event.save()
        
        # 🔔 Send notification to organizer
        send_event_rejection_notification(event)
        
        return 200, {
            "success": True,
            "message": "Event rejected successfully",
            "event_id": event_id,
            "verification_status": "rejected"
        }
    except Exception as e:
        print(f"Error rejecting event: {e}")
        return 400, {"error": str(e)}
    

@api.get("/admin/statistics", auth=django_auth, response={200: dict, 403: schemas.ErrorSchema})
def get_admin_statistics(request):
    """
    Get admin dashboard statistics 
    Returns counts of total, approved, pending, and rejected events
    """
    try:
        # Security check: Only admin users can access this endpoint
        if request.user.role != "admin":
            return 403, {"error": "Admin privileges required"}
        
        # Get counts directly from database
        total_events = Event.objects.count()
        
        approved_events = Event.objects.filter(
            verification_status="approved"
        ).count()
        
        rejected_events = Event.objects.filter(
            verification_status="rejected"
        ).count()
        
        # Pending events: everything that's not approved or rejected
        pending_events = Event.objects.exclude(
            verification_status__in=["approved", "rejected"]
        ).count()
        
        # Alternative way to calculate pending (handles null/empty values)
        # pending_events = total_events - approved_events - rejected_events

        return 200, {
            "total_events": total_events,
            "approved_events": approved_events,
            "pending_events": pending_events,
            "rejected_events": rejected_events
        }
        
    except Exception as e:
        print(f"Error fetching admin statistics: {e}")
        return 400, {"error": str(e)}
    


@api.get("/admin/events", auth=django_auth, response={200: List[schemas.AdminEventSchema], 403: schemas.ErrorSchema})
def get_admin_events(request):
    """
    Get all events for admin dashboard with verification status
    """
    try:
        # Security check: Only admin users can access this endpoint
        if request.user.role != "admin":
            return 403, {"error": "Admin privileges required"}
        
        events = Event.objects.select_related('organizer').all().order_by('-event_create_date')
        
        events_data = []
        for event in events:
            organizer_name = f"{event.organizer.first_name} {event.organizer.last_name}".strip()
            if not organizer_name:
                organizer_name = event.organizer.username or event.organizer.email
            
            # Get verification status - handle both string and None
            verification_status = getattr(event, 'verification_status', None)
            if verification_status is None:
                verification_status = "pending"
            
            events_data.append({
                "id": event.id,
                "title": event.event_title,
                "event_title": event.event_title,
                "event_description": event.event_description,
                "event_create_date": event.event_create_date.isoformat(),
                "organizer_name": organizer_name,
                "organizer_id": event.organizer.id,
                "status_registration": event.status_registration,
                "verification_status": verification_status,
            })
        
        return events_data
        
    except Exception as e:
        print(f"Error fetching admin events: {e}")
        return 400, {"error": str(e)}
      
      
@api.get("/notifications", response=List[NotificationOut], auth=django_auth)
def get_notifications(request):
    """Get all notifications for the logged-in user"""
    user = request.user  # Change from request.auth to request.user
    
    try:
        notifications = Notification.objects.filter(user=user).select_related(
            'related_ticket', 
            'related_event'
        )[:50]
        
        result = []
        for notif in notifications:
            event_title = None
            
            if notif.related_event:
                event_title = notif.related_event.event_title
            
            result.append(NotificationOut(
                id=notif.id,
                message=notif.message,
                notification_type=notif.notification_type,
                is_read=notif.is_read,
                created_at=notif.created_at,
                related_ticket_id=notif.related_ticket_id,
                related_event_id=notif.related_event_id,
                event_title=event_title
            ))
        
        return result
    except Exception as e:
        return []

@api.get("/notifications/unread-count", auth=django_auth)
def get_unread_count(request):
    """Get count of unread notifications"""
    user = request.user  # Change from request.auth to request.user
    count = Notification.objects.filter(user=user, is_read=False).count()
    return {"count": count}

@api.post("/notifications/mark-read", auth=django_auth)
def mark_notification_read(request, data: NotificationMarkReadIn):
    """Mark a single notification as read"""
    user = request.user  # Change from request.auth to request.user
    
    try:
        notification = Notification.objects.get(id=data.notification_id, user=user)
        notification.mark_as_read()
        return {"success": True, "message": "Notification marked as read"}
    except Notification.DoesNotExist:
        return {"success": False, "error": "Notification not found"}

@api.post("/notifications/mark-all-read", auth=django_auth)
def mark_all_notifications_read(request):
    """Mark all notifications as read for the user"""
    user = request.user  # Change from request.auth to request.user
    Notification.objects.filter(user=user, is_read=False).update(is_read=True)
    return {"success": True, "message": "All notifications marked as read"}

@api.delete("/notifications/{notification_id}", auth=django_auth)
def delete_notification(request, notification_id: int):
    """Delete a specific notification"""
    user = request.user  # Change from request.auth to request.user
    
    try:
        notification = Notification.objects.get(id=notification_id, user=user)
        notification.delete()
        return {"success": True, "message": "Notification deleted"}
    except Notification.DoesNotExist:
        return {"success": False, "error": "Notification not found"}

@api.delete("/notifications/clear-all", auth=django_auth)
def clear_all_notifications(request):
    """Delete all notifications for the user"""
    user = request.user  # Change from request.auth to request.user
    count = Notification.objects.filter(user=user).count()
    Notification.objects.filter(user=user).delete()
    return {"success": True, "message": f"{count} notifications cleared"}

@api.post("/admin/send-reminders", auth=django_auth, response={200: dict, 403: schemas.ErrorSchema})
def send_event_reminders_endpoint(request, hours: int = 24):
    """
    Send reminder notifications for upcoming events
    Can be called manually or via a simple cron job
    
    Usage: POST /api/admin/send-reminders?hours=24
    """
    try:
        # Security: Only admins or organizers can trigger reminders
        if request.user.role not in ['admin', 'organizer']:
            return 403, {"error": "Admin or organizer privileges required"}
        
        now = timezone.now()
        reminder_window = now + timezone.timedelta(hours=hours)
        
        # Find events starting soon
        upcoming_events = Event.objects.filter(
            event_start_date__gte=now,
            event_start_date__lte=reminder_window,
            verification_status='approved'
        ).select_related('organizer')
        
        if not upcoming_events.exists():
            return 200, {
                "success": True,
                "message": f"No events found starting within {hours} hours",
                "events_checked": 0,
                "notifications_sent": 0,
                "reminders": []
            }
        
        total_notifications = 0
        reminders_sent = []
        
        for event in upcoming_events:
            hours_until = (event.event_start_date - now).total_seconds() / 3600
            
            # Get approved tickets for this event
            approved_tickets = Ticket.objects.filter(
                event=event,
                approval_status='approved'
            ).select_related('attendee')
            
            if not approved_tickets.exists():
                continue
            
            # Check if we already sent reminders recently
            event_reminders_sent = 0
            
            for ticket in approved_tickets:
                # Check if reminder was already sent in last 12 hours
                already_sent = Notification.objects.filter(
                    user=ticket.attendee,
                    related_event=event,
                    notification_type__in=['event_reminder', 'reminder_24h', 'reminder_1h'],
                    created_at__gte=now - timezone.timedelta(hours=12)
                ).exists()
                
                if not already_sent:
                    try:
                        send_reminder_notification(ticket, hours_until)
                        event_reminders_sent += 1
                        total_notifications += 1
                    except Exception as e:
                        print(f"Failed to send reminder to {ticket.attendee.email}: {e}")
            
            if event_reminders_sent > 0:
                reminders_sent.append({
                    "event_id": event.id,
                    "event_title": event.event_title,
                    "starts_in_hours": round(hours_until, 1),
                    "reminders_sent": event_reminders_sent
                })
        
        return 200, {
            "success": True,
            "message": f"Sent {total_notifications} reminder(s) for {len(reminders_sent)} event(s)",
            "events_checked": upcoming_events.count(),
            "notifications_sent": total_notifications,
            "reminders": reminders_sent
        }
        
    except Exception as e:
        print(f"Error sending reminders: {e}")
        import traceback
        traceback.print_exc()
        return 400, {"error": str(e)}


@api.get("/admin/send-reminders", auth=django_auth, response={200: dict, 403: schemas.ErrorSchema})
def send_event_reminders_get(request, hours: int = 24):
    """
    GET version for easy browser/curl testing
    Just visit: http://localhost:8000/api/admin/send-reminders?hours=24
    """
    # Call the POST version
    return send_event_reminders_endpoint(request, hours)

@api.post("/events/{event_id}/duplicate", auth=django_auth, response={200: schemas.SuccessSchema, 403: schemas.ErrorSchema, 400: schemas.ErrorSchema})
def duplicate_event(request, event_id: int):
    """
    Duplicate an existing event
    Creates a copy of the event with all settings but without attendees
    """
    try:
        # Get the original event
        original_event = get_object_or_404(Event, id=event_id)
        
        # Security check: Only the organizer can duplicate their own events
        if original_event.organizer != request.user:
            return 403, {"error": "You can only duplicate your own events"}
        
        # Get original schedule
        original_schedules = EventSchedule.objects.filter(event=original_event).order_by('event_date', 'start_time_event')
        
        # Create the duplicate event
        duplicate = Event.objects.create(
            organizer=request.user,
            event_title=f"{original_event.event_title} (Copy)",
            event_description=original_event.event_description,
            start_date_register=timezone.now(),  # Reset to now
            end_date_register=original_event.end_date_register,
            event_start_date=original_event.event_start_date,
            event_end_date=original_event.event_end_date,
            max_attendee=original_event.max_attendee,
            event_address=original_event.event_address,
            is_online=original_event.is_online,
            event_meeting_link=original_event.event_meeting_link,
            tags=original_event.tags,
            event_email=original_event.event_email,
            event_phone_number=original_event.event_phone_number,
            event_website_url=original_event.event_website_url,
            terms_and_conditions=original_event.terms_and_conditions,
            event_image=original_event.event_image,  # Reference same image
            verification_status=None,  # Reset verification (needs re-approval)
            attendee=[],  # Empty attendee list
            schedule=original_event.schedule,  # Copy schedule JSON
        )
        
        # Duplicate EventSchedule entries
        schedule_count = 0
        for original_schedule in original_schedules:
            EventSchedule.objects.create(
                event=duplicate,
                event_date=original_schedule.event_date,
                start_time_event=original_schedule.start_time_event,
                end_time_event=original_schedule.end_time_event
            )
            schedule_count += 1
        
        # Notify admins about new event
        send_event_creation_notification_to_admins(duplicate)
        
        return 200, {
            "success": True,
            "message": f"Event duplicated successfully as '{duplicate.event_title}'",
            "event_id": duplicate.id,
            "original_id": original_event.id,
            "schedule_count": schedule_count,
            "verification_status": "pending"
        }
        
    except Exception as e:
        print(f"Error duplicating event: {e}")
        import traceback
        traceback.print_exc()
        return 400, {"error": str(e)}