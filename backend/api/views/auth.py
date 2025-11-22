"""
UniPlus API - Authentication Endpoints
"""

from ninja import Router, Form
from ninja.security import django_auth
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.db import IntegrityError
from django.utils import timezone
from django.shortcuts import get_object_or_404
from api.model.user import AttendeeUser
from api.model.ticket import Ticket
from api.model.event import Event
from api.model.event_schedule import EventSchedule
from api import schemas
from typing import List, Optional
import json
import pytz
from datetime import datetime
from ninja.files import UploadedFile

# Create a router for auth endpoints
router = Router()

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

@router.get("/", response=schemas.MessageSchema)
def home(request):
    return {"message": "Welcome to UniPlus API"}

@router.get("/set-csrf-token")
def get_csrf_token(request):
    return {"csrftoken": get_token(request)}

@router.post("/register", response={200: schemas.SuccessSchema, 400: schemas.ErrorSchema})
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

@router.post("/login", response={200: schemas.SuccessSchema, 401: schemas.ErrorSchema})
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

@router.post("/logout", auth=django_auth, response=schemas.MessageSchema)
def logout_view(request):
    logout(request)
    return {"message": "Logged out successfully"}

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
            "aboutMe": about_me_data,  # Now properly parsed
            "profilePic": request.user.profile_picture.url if request.user.profile_picture else DEFAULT_PROFILE_PIC,
            "tickets": tickets
        }
    return 401, {"error": "Not authenticated"}

@router.patch("/user", auth=django_auth, response={200: schemas.UserSchema, 400: schemas.ErrorSchema})
def update_user(
    request,
    firstName: str = Form(None),
    lastName: str = Form(None),
    phone: str = Form(None),
    aboutMe: str = Form(None),
    profilePic = None
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

    if profilePic and isinstance(profilePic, UploadedFile):
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

@router.get("/user/{email}", response={200: schemas.UserByEmailSchema, 404: schemas.ErrorSchema})
def get_user_by_email(request, email: str):
    """
    Get user information by email address
    Useful for finding usernames when only emails are available
    """
    try:
        user = get_object_or_404(AttendeeUser, email=email)
        
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