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
from api.model.user import AttendeeUser
from api.model.event import Event
from api.model.ticket import Ticket
from api.model.event_schedule import EventSchedule
from api import schemas
from typing import List, Optional, Union
import json
from datetime import datetime
import uuid 
import traceback

DEFAULT_PROFILE_PIC = "/images/logo.png" 

api = NinjaAPI(csrf=True)

@api.get("/", response=schemas.MessageSchema)
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
        about_me_data = None
        if request.user.about_me:
            try:
                about_me_data = json.loads(request.user.about_me)
            except:
                about_me_data = {}

        tickets = []
        
        if hasattr(request.user, 'my_tickets') and request.user.my_tickets.exists():
            for ticket in request.user.my_tickets.all().select_related('event', 'event__organizer'):
                try:
                    event = ticket.event
                    
                    event_dates = []
                    if ticket.event_dates:
                        try:
                            event_dates = json.loads(ticket.event_dates) if isinstance(ticket.event_dates, str) else ticket.event_dates
                        except:
                            event_dates = []
                    if not event_dates:
                        schedules = EventSchedule.objects.filter(event=event).order_by("event_date", "start_time_event")

                        # And when building the event_dates array:
                        for s in schedules:
                            event_dates.append({
                                "date": s.event_date.isoformat(), 
                                "time": s.start_time_event.isoformat(),  
                                "endTime": s.end_time_event.isoformat() if s.end_time_event else None,  
                                "location": event.event_address or "TBA",
                                "is_online": event.is_online,
                                "meeting_link": event.event_meeting_link or "",
                            })
                    if not event_dates and event.event_start_date:
                        event_dates = [{
                            'date': event.event_start_date.date().isoformat(),
                            'time': event.event_start_date.time().isoformat(),
                            'location': event.event_address or 'TBA',
                            'is_online': event.is_online,
                            'meeting_link': event.event_meeting_link
                        }]
                    display_date = event_dates[0]['date'] if event_dates else (event.event_start_date.date().isoformat() if event.event_start_date else None)
                    display_time = event_dates[0]['time'] if event_dates else (event.event_start_date.time().isoformat() if event.event_start_date else '00:00:00')
                    
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
                    }
                    tickets.append(ticket_data)
                except Exception as e:
                    print(f"Error processing ticket: {e}")
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


@api.get("/events")
def get_events_list(request):
    """
    Get all events with organizer information
    Returns events sorted by creation date (newest first)
    """
    try:
        events = Event.objects.select_related('organizer').all().order_by('-event_create_date')
        
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
        )
        
        # Store schedule as JSON for backwards compatibility (optional)
        event.schedule = json.dumps(schedule)
        event.save()
        
        print(f"DEBUG: Created event {event.id} - {event_title}")
        
        # ========== CRITICAL: CREATE EventSchedule ENTRIES ==========
        # This is what was missing! We need to create EventSchedule rows
        # for each day so that when users register, we can fetch them.
        
        created_schedules = []
        for day_info in schedule:
            try:
                # Parse the ISO datetime strings
                start_datetime = datetime.fromisoformat(day_info['start_iso'].replace('Z', '+00:00'))
                end_datetime = datetime.fromisoformat(day_info['end_iso'].replace('Z', '+00:00'))
                
                # Create EventSchedule entry for this day
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
                # Continue creating other days even if one fails
                continue
        
        print(f"DEBUG: Created {len(created_schedules)} EventSchedule entries for event {event.id}")
        
        if len(created_schedules) == 0:
            print(f"WARNING: No EventSchedule entries were created!")
        
        return 200, {
            "success": True,
            "message": f"Event created successfully with {len(created_schedules)} schedule entries",
            "event_id": event.id,
            "schedule_count": len(created_schedules)
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
        user.about_me = aboutMe 

    if profilePic:
        user.profile_picture.save(profilePic.name, profilePic, save=True)

    user.save()

    about_me_data = json.loads(user.about_me) if user.about_me else None

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

        # Check if already registered
        if Ticket.objects.filter(event=event, attendee=user).exists():
            return 400, {"error": "You are already registered for this event"}

        # Fetch ALL EventSchedule entries
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
        
        # Fallback if no EventSchedule entries
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
            event_dates=schedule,  # ← CHANGED: No json.dumps()! Just pass the list!
        )

        # Update attendee list
        attendees = event.attendee if isinstance(event.attendee, list) else []
        if user.id not in attendees:
            attendees.append(user.id)
        event.attendee = attendees
        event.save()

        print(f"DEBUG: Ticket {ticket.qr_code} created with {len(schedule)} dates")

        return 200, {
            "success": True,
            "message": "Successfully registered for the event",
            "tickets_count": 1,
            "ticket_number": ticket.qr_code
        }

    except Exception as e:
        print(f"Error registering for event: {str(e)}")
        import traceback
        traceback.print_exc()
        return 400, {"error": str(e)}


@api.get("/events/{event_id}", response=schemas.EventDetailSchema)
def get_event_detail(request, event_id: int):
    event = get_object_or_404(Event, id=event_id)
    
    tags_list = []
    if event.tags:
        try:
            tags_list = json.loads(event.tags) if isinstance(event.tags, str) else event.tags
        except:
            tags_list = [event.tags] if event.tags else []
    
    schedule = []
    if hasattr(event, 'schedule') and event.schedule:
        try:
            schedule_data = json.loads(event.schedule)
            
            for day in schedule_data:
                date_str = day.get('date', '')
                start_iso = day.get('start_iso', '')
                end_iso = day.get('end_iso', '')
                location = day.get('address', '') or day.get('location', '')
                start_time = '00:00'
                end_time = '00:00'
                
                if start_iso:
                    try:
                        start_time = start_iso.split('T')[1].split(':')[0] + ':' + start_iso.split('T')[1].split(':')[1]
                    except:
                        pass
                
                if end_iso:
                    try:
                        end_time = end_iso.split('T')[1].split(':')[0] + ':' + end_iso.split('T')[1].split(':')[1]
                    except:
                        pass
                
                schedule.append({
                    "date": date_str,
                    "startTime": start_time,
                    "endTime": end_time,
                    "location": location,
                })
        except Exception as e:
            print(f"Error parsing schedule: {e}")
            pass
    
    is_registered = False
    if request.user.is_authenticated:
        is_registered = Ticket.objects.filter(
            event=event, 
            attendee=request.user
        ).exists()
    
    attendee_count = len(event.attendee) if event.attendee else 0
    available = (event.max_attendee - attendee_count) if event.max_attendee else 100
    
    return {
        "id": event.id,
        "title": event.event_title,
        "event_title": event.event_title,
        "event_description": event.event_description,
        "excerpt": event.event_description[:150] + "..." if len(event.event_description) > 150 else event.event_description,
        "organizer_username": event.organizer.username if event.organizer else "Unknown",
        "organizer_role": event.organizer.role or "Organizer",
        "host": [f"{event.organizer.first_name} {event.organizer.last_name}".strip() or event.organizer.username] if event.organizer else ["Unknown"],
        "start_date_register": event.start_date_register,
        "end_date_register": event.end_date_register,
        "event_start_date": event.event_start_date or event.start_date_register,
        "event_end_date": event.event_end_date or event.end_date_register,
        "max_attendee": event.max_attendee or 0,
        "capacity": event.max_attendee or 100,
        "current_attendees": attendee_count,
        "available": available,
        "event_address": event.event_address or "",
        "location": event.event_address or "Online" if event.is_online else "TBA",
        "address2": getattr(event, 'address2', "") or "", 
        "is_online": event.is_online,
        "event_meeting_link": event.event_meeting_link or "",
        "tags": tags_list,
        "event_image": event.event_image.url if event.event_image else None,
        "image": event.event_image.url if event.event_image else None,
        "is_registered": is_registered,
        "schedule": schedule,
    }


@api.get("/tickets/{ticket_id}", auth=django_auth, response=schemas.TicketDetailSchema)
def get_ticket_detail(request, ticket_id: int):
    ticket = get_object_or_404(Ticket, id=ticket_id, attendee=request.user)
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
    }

@api.get("/user/event-history", auth=django_auth, response={200: dict, 401: schemas.ErrorSchema, 400: schemas.ErrorSchema})
def get_user_event_history(request):
    """Get user's registered events and attendance history"""
    if not request.user.is_authenticated:
        return 401, {"error": "Not authenticated"}
    
    try:
        tickets = Ticket.objects.filter(
            attendee=request.user
        ).select_related('event').order_by('-purchase_date')
        
        events_data = []
        for ticket in tickets:
            event = ticket.event
            events_data.append({
                "event_id": event.id,
                "event_title": event.event_title,
                "event_description": event.event_description,
                "event_date": ticket.event_date.isoformat() if ticket.event_date else event.event_start_date.isoformat(),
                "location": ticket.location,
                "organizer": event.organizer.username,
                "status": ticket.status,  
                "purchase_date": ticket.purchase_date.isoformat(),
                "qr_code": ticket.qr_code,
                "is_online": ticket.is_online,
                "meeting_link": ticket.meeting_link,
            })
        
        return 200, {
            "events": events_data,
            "total_count": len(events_data)
        }
    except Exception as e:
        print(f"Error fetching event history: {e}")
        tickets = (
            Ticket.objects.filter(attendee=request.user)
            .select_related("event", "event__organizer")
            .order_by("-purchase_date")
        )
        events_data = []
        for ticket in tickets:
            event_obj = ticket.event
            status = "upcoming" if (
                (ticket.event_date or ticket.start_date or (event_obj and getattr(event_obj, "event_start_date", None)))
                and (ticket.event_date or ticket.start_date or event_obj.event_start_date) > timezone.now()
            ) else "past"

            # Parse event tags
            event_tags = []
            if event_obj and event_obj.tags:
                try:
                    event_tags = json.loads(event_obj.tags) if isinstance(event_obj.tags, str) else event_obj.tags
                except:
                    event_tags = [event_obj.tags] if event_obj.tags else []

            event_date_str = None
            if ticket.event_date:
                event_date_str = ticket.event_date.strftime("%Y-%m-%d")
            elif ticket.start_date:
                event_date_str = ticket.start_date.date().strftime("%Y-%m-%d") if hasattr(ticket.start_date, 'date') else ticket.start_date.strftime("%Y-%m-%d")
            elif event_obj and event_obj.event_start_date:
                event_date_str = event_obj.event_start_date.date().strftime("%Y-%m-%d") if hasattr(event_obj.event_start_date, 'date') else event_obj.event_start_date.strftime("%Y-%m-%d")

            events_data.append({
                "ticket_id": ticket.id,
                "event_id": event_obj.id if event_obj else None,
                "event_title": ticket.event_title,
                "event_description": event_obj.event_description if event_obj else None,
                "event_date": event_date_str,  # Now returns YYYY-MM-DD format
                "location": ticket.location,
                "is_online": ticket.is_online,
                "meeting_link": ticket.meeting_link,
                "status": ticket.status,
                "organizer": event_obj.organizer.username if event_obj and event_obj.organizer else None,
                "organizer_role": event_obj.organizer.role if event_obj and event_obj.organizer else "organizer",
                "event_tags": event_tags,
                "user_name": ticket.user_name,
                "user_email": ticket.user_email,
                "purchase_date": ticket.purchase_date.isoformat() if ticket.purchase_date else None,
                "qr_code": ticket.qr_code,
            })
        return 200, {
            "events": events_data,
            "total_count": len(events_data),
        }
    except Exception as e:
        print("Error fetching event history:")
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
        
        return 200, {
            "total_events": total_events,
            "upcoming_events": upcoming_count,
            "attended_events": attended_count,
            "total_registrations": all_tickets.count(),  
        }
    except Exception as e:
        print(f"Error calculating statistics: {e}")
        return 400, {"error": str(e)}


@api.get("/user/created-events", auth=django_auth, response={200: dict, 401: schemas.ErrorSchema})
def get_user_created_events(request):
    """Get events created by the user (for organizers)"""
    if not request.user.is_authenticated:
        return 401, {"error": "Not authenticated"}
    
    try:
        created_events = Event.objects.filter(
            organizer=request.user
        ).order_by('-event_create_date')
        
        events_data = []
        for event in created_events:
            attendee_count = len(event.attendee) if event.attendee else 0
            
            events_data.append({
                "id": event.id,
                "event_title": event.event_title,
                "event_description": event.event_description,
                "event_start_date": event.event_start_date.isoformat(),
                "event_end_date": event.event_end_date.isoformat(),
                "max_attendee": event.max_attendee,
                "current_attendees": attendee_count,
                "available_spots": (event.max_attendee - attendee_count) if event.max_attendee else 0,
                "status_registration": event.status_registration,
                "event_image": event.event_image.url if event.event_image else None,
                "is_approved": event.is_approved,
                "event_create_date": event.event_create_date.isoformat(),
            })
        
        return 200, {
            "events": events_data,
            "total_created": len(events_data),
        }
    except Exception as e:
        print(f"Error fetching created events: {e}")
        
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