"""
UniPlus API - Event Management System
Updated with Approval System and Dashboard Endpoints
"""

from ninja import NinjaAPI, Form, File
from ninja.files import UploadedFile
from ninja.security import django_auth
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.db import IntegrityError
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Avg
from api.model.user import AttendeeUser
from api.model.event import Event
from api.model.ticket import Ticket
from api.model.event_schedule import EventSchedule
from api.model.rating import Rating  # Import Rating for avg_rating calculation
from api import schemas
from typing import List, Optional, Union
import json
from datetime import datetime
import uuid 

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

        # Handle about_me as JSON now (after migration)
        about_me_dict = payload.about_me if isinstance(payload.about_me, dict) else {}

        user = AttendeeUser.objects.create_user(
            email=payload.email,
            username=payload.username,
            password=payload.password,
            first_name=payload.first_name,
            last_name=payload.last_name,
            phone_number=payload.phone_number,
            about_me=about_me_dict  # Store as dict (JSONField)
        )
        
        if hasattr(payload, 'role') and payload.role:
            user.role = payload.role
            user.save()
        
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
                "about_me": user.about_me,  # Already a dict
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
        # about_me is now JSONField, no need to parse
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
                        "approval_status": ticket.approval_status,  # Add approval status
                    }
                    tickets.append(ticket_data)
                except Exception as e:
                    print(f"Error processing ticket: {e}")
                    continue

        # FIX: Make sure to include tickets in the return statement!
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
    schedule_days: str = Form(...),
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
    """
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
        
        is_online = first_day.get('is_online', False)
        
        event_address = None if is_online else clean_empty_string(first_day.get('location'))
        event_meeting_link = clean_empty_string(first_day.get('meeting_link')) if is_online else None
        
        start_reg = datetime.fromisoformat(start_date_register.replace('Z', '+00:00'))
        end_reg = datetime.fromisoformat(end_date_register.replace('Z', '+00:00'))
        
        event_start = datetime.fromisoformat(first_day['start_iso'].replace('Z', '+00:00'))
        event_end = datetime.fromisoformat(last_day['end_iso'].replace('Z', '+00:00'))
        
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
        )
        
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

        # Create ticket with approval_status='pending' (new default)
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
            event_dates=schedule,  # Store as list directly (JSONField)
            # approval_status='pending' is now the default in the model
        )

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
    
    # event_dates is now a JSONField list
    event_dates = ticket.event_dates if isinstance(ticket.event_dates, list) else []
    
    return {
        "qr_code": ticket.qr_code,
        "ticket_number": ticket.ticket_number,
        "event_title": ticket.event.event_title,
        "event_description": ticket.event.event_description,
        "start_date": ticket.event.start_date_register,
        "event_date": event_dates[0]['date'] if event_dates else "",
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

@api.get("/user/event-history", auth=django_auth, response={200: dict, 401: schemas.ErrorSchema})
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
            
            # Get first date from event_dates
            event_date_str = event.event_start_date.isoformat() if event.event_start_date else None
            if ticket.event_dates and isinstance(ticket.event_dates, list) and len(ticket.event_dates) > 0:
                event_date_str = ticket.event_dates[0].get('date', event_date_str)
            
            events_data.append({
                "event_id": event.id,
                "event_title": event.event_title,
                "event_description": event.event_description,
                "event_date": event_date_str,
                "location": ticket.location,
                "organizer": event.organizer.username,
                "status": ticket.status,
                "approval_status": ticket.approval_status,
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


@api.get("/user/created-events", auth=django_auth, response={200: dict, 401: schemas.ErrorSchema, 400: schemas.ErrorSchema})
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
            
            # Get pending approvals count for this event
            pending_approvals = Ticket.objects.filter(
                event=event,
                approval_status='pending'
            ).count()
            
            events_data.append({
                "id": event.id,
                "event_title": event.event_title,
                "event_description": event.event_description,
                "event_start_date": event.event_start_date.isoformat() if event.event_start_date else None,
                "event_end_date": event.event_end_date.isoformat() if event.event_end_date else None,
                "max_attendee": event.max_attendee,
                "current_attendees": attendee_count,
                "available_spots": (event.max_attendee - attendee_count) if event.max_attendee else 0,
                "status_registration": event.status_registration,
                "event_image": event.event_image.url if event.event_image else None,
                "event_create_date": event.event_create_date.isoformat(),
                "pending_approvals": pending_approvals,
            })
        
        return 200, {
            "events": events_data,
            "total_created": len(events_data),
        }
    except Exception as e:
        print(f"Error fetching created events: {e}")
        return 400, {"error": str(e)}
    

@api.get("/events/{event_id}/dashboard", auth=django_auth, response={200: schemas.EventDashboardSchema, 403: schemas.ErrorSchema, 404: schemas.ErrorSchema, 400: schemas.ErrorSchema})
def get_event_dashboard(request, event_id: int):
    """Get dashboard data for event organizer - UPDATED VERSION"""
    try:
        event = get_object_or_404(Event, id=event_id)
        
        # Check if user is the organizer
        if event.organizer != request.user:
            return 403, {"error": "You are not authorized to view this dashboard"}
        
        # Get all tickets for this event
        tickets = Ticket.objects.filter(event=event).select_related('attendee')
        
        # Get event schedule days
        schedules = EventSchedule.objects.filter(event=event).order_by('event_date', 'start_time_event')
        
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
            
            # Determine status based on check-in and approval
            if ticket.checked_in_at:
                status = 'present'
            elif ticket.approval_status == 'pending':
                status = 'pending'
            else:
                status = 'absent'
            
            # Get event date (first date if multi-day)
            event_date_str = ""
            if ticket.event_dates and isinstance(ticket.event_dates, list) and len(ticket.event_dates) > 0:
                event_date_str = ticket.event_dates[0].get('date', '')
            
            if not event_date_str and event.event_start_date:
                event_date_str = event.event_start_date.date().isoformat()
            
            # Get user's about_me (now JSONField)
            about_me = user.about_me if isinstance(user.about_me, dict) else {}
            
            attendees.append({
                "ticketId": ticket.ticket_number or ticket.qr_code,
                "name": f"{user.first_name} {user.last_name}",
                "email": user.email,
                "status": status,
                "approvalStatus": ticket.approval_status,
                "registered": ticket.purchase_date.isoformat(),
                "checkedIn": ticket.checked_in_at.isoformat() if ticket.checked_in_at else "",
                "eventDate": event_date_str,
                "phone": user.phone_number,
                "role": user.role,
                "about_me": about_me,
            })
        
        # Calculate statistics
        total_registered = tickets.count()
        checked_in = tickets.filter(checked_in_at__isnull=False).count()
        approved = tickets.filter(approval_status='approved').count()
        pending = tickets.filter(approval_status='pending').count()
        rejected = tickets.filter(approval_status='rejected').count()
        
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
            }
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
        )
        
        # Also try QR codes if no tickets found
        if tickets.count() == 0:
            tickets = Ticket.objects.filter(
                event=event,
                qr_code__in=payload.ticket_ids
            )
        
        if tickets.count() == 0:
            return 400, {"error": "No tickets found"}
        
        # Update all tickets
        new_status = 'approved' if payload.action == 'approve' else 'rejected'
        updated_count = tickets.update(approval_status=new_status)
        
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
            ticket = Ticket.objects.get(ticket_number=ticket_id, event=event)
        except Ticket.DoesNotExist:
            ticket = Ticket.objects.get(qr_code=ticket_id, event=event)
        
        ticket.approval_status = 'approved'
        ticket.save()
        
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
            ticket = Ticket.objects.get(ticket_number=ticket_id, event=event)
        except Ticket.DoesNotExist:
            ticket = Ticket.objects.get(qr_code=ticket_id, event=event)
        
        ticket.approval_status = 'rejected'
        ticket.save()
        
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


# ============================================================================
# NEW: CHECK-IN ENDPOINT
# ============================================================================

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


# ============================================================================
# LEGACY ENDPOINTS (Keep for backwards compatibility, but deprecated)
# ============================================================================

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


@api.post("/events/{event_id}/check-in", auth=django_auth, response={200: dict, 403: schemas.ErrorSchema, 400: schemas.ErrorSchema})
def check_in_attendee_legacy(request, event_id: int, ticket_id: str):
    """
    DEPRECATED: Use /checkin endpoint instead
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
        
        ticket.status = 'present'
        from django.utils import timezone
        ticket.checked_in_at = timezone.now()
        ticket.save()
        
        return 200, {
            "success": True,
            "message": f"Attendee checked in",
            "ticket_id": ticket_id,
            "status": "present"
        }
    except Exception as e:
        print(f"Error checking in: {e}")
        return 400, {"error": str(e)}