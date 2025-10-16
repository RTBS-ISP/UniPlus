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
from api import schemas
from typing import List, Optional

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
            import json
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
            import json
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
        import json
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
                    ticket_data = {
                        "date": event.start_date_register.strftime("%Y-%m-%d") if event and event.start_date_register else None,
                        "time": event.start_date_register.strftime("%H:%M:%S") if event and event.start_date_register else None,
                        "location": event.event_address if event else None,
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
                        "event_meeting_link": ticket.meeting_link
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


@api.get("/check-auth")
def check_auth(request):
    return {
        "authenticated": request.user.is_authenticated,
        "username": request.user.username if request.user.is_authenticated else None
    }


@api.post("/events/create", auth=django_auth, response={200: schemas.SuccessSchema, 400: schemas.ErrorSchema})
def create_event(
    request,
    event_title: str = Form(...),
    event_description: str = Form(...),
    start_date_register: str = Form(...),
    end_date_register: str = Form(...),
    event_start_date: str = Form(...),
    event_end_date: str = Form(...),
    is_online: str = Form(default="false"),
    max_attendee: Optional[str] = Form(default=None),
    event_address: Optional[str] = Form(default=None),
    event_meeting_link: Optional[str] = Form(default=None),
    tags: Optional[str] = Form(default=None),
    event_email: Optional[str] = Form(default=None),
    event_phone_number: Optional[str] = Form(default=None),
    event_website_url: Optional[str] = Form(default=None),
    terms_and_conditions: Optional[str] = Form(default=None),
    event_image: Optional[UploadedFile] = File(default=None),
):
    try:
        from datetime import datetime
        
        event = Event.objects.create(
            organizer=request.user,
            event_title=event_title,
            event_description=event_description,
            start_date_register=datetime.fromisoformat(start_date_register.replace('Z', '+00:00')),
            end_date_register=datetime.fromisoformat(end_date_register.replace('Z', '+00:00')),
            event_start_date=datetime.fromisoformat(event_start_date.replace('Z', '+00:00')),
            event_end_date=datetime.fromisoformat(event_end_date.replace('Z', '+00:00')),
            max_attendee=int(max_attendee) if max_attendee else None,
            event_address=event_address,
            is_online=(is_online.lower() == 'true'),
            event_meeting_link=event_meeting_link if event_meeting_link else None,
            tags=tags,
            event_email=event_email if event_email else None,
            event_phone_number=event_phone_number if event_phone_number else None,
            event_website_url=event_website_url if event_website_url else None,
            terms_and_conditions=terms_and_conditions,
            event_image=event_image if event_image else None,
        )
        
        return 200, {
            "success": True,
            "message": "Event created successfully",
        }
        
    except Exception as e:
        return 400, {"error": str(e)}


@api.get("/events", response=List[schemas.EventSchema])
def get_list_events(request):
    import json
    events = Event.objects.all().select_related('organizer')
    
    result = []
    for e in events:
        tags_list = e.tags
        if isinstance(e.tags, str):
            try:
                tags_list = json.loads(e.tags)
            except:
                tags_list = []
        elif not isinstance(e.tags, list):
            tags_list = []
        
        result.append({
            "id": e.id,
            "event_title": e.event_title,
            "event_description": e.event_description,
            "organizer_username": e.organizer.username if e.organizer else "Unknown",
            "event_create_date": e.event_create_date,
            "start_date_register": e.start_date_register,
            "end_date_register": e.end_date_register,
            "event_start_date": e.event_start_date or e.start_date_register,
            "event_end_date": e.event_end_date or e.end_date_register,
            "max_attendee": e.max_attendee,
            "current_attendees": len(e.attendee) if e.attendee else 0,
            "event_address": e.event_address,
            "is_online": e.is_online,
            "status_registration": e.status_registration,
            "attendee": e.attendee,
            "tags": tags_list,
            "event_image": e.event_image.url if e.event_image else None,
        })
    
    return result

    
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
        import json
        user.about_me = aboutMe 

    if profilePic:
        user.profile_picture.save(profilePic.name, profilePic, save=True)

    user.save()

    import json
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
        from datetime import timedelta
        import uuid

        event = get_object_or_404(Event, id=event_id)
        user = request.user

        if Ticket.objects.filter(event=event, attendee=user).exists():
            return 400, {"error": "You are already registered for this event"}

        if timezone.now() > event.end_date_register:
            return 400, {"error": "Event registration has closed"}

        unique_attendees = Ticket.objects.filter(event=event).values('attendee').distinct().count()
        if event.max_attendee and unique_attendees >= event.max_attendee:
            return 400, {"error": "Event has reached maximum attendees"}

        if event.status_registration != "OPEN":
            return 400, {"error": "Event registration is not open"}

        event_start = event.event_start_date.date()
        event_end = event.event_end_date.date()  
        num_days = (event_end - event_start).days + 1  

        tickets_created = []
        for day_offset in range(num_days):
            ticket_date = event_start + timedelta(days=day_offset)
            
            qr_code_value = str(uuid.uuid4())
            
            ticket = Ticket.objects.create(
                event=event,
                attendee=user,
                qr_code=qr_code_value,
                event_date=ticket_date,  
                is_online=event.is_online,
                meeting_link=event.event_meeting_link if event.is_online else None,
                user_name=f"{user.first_name} {user.last_name}",
                user_email=user.email,
                event_title=event.event_title,
                start_date=event.event_start_date,  
                location=event.event_address if not event.is_online else "Online",
            )
            tickets_created.append(qr_code_value)

        attendees = event.attendee if isinstance(event.attendee, list) else []
        if user.id not in attendees:
            attendees.append(user.id)
        event.attendee = attendees
        event.save()

        if num_days == 1:
            message = "Successfully registered for the event"
        else:
            message = f"Successfully registered! You received {num_days} tickets (one for each day)"

        return 200, {
            "success": True,
            "message": message,
            "tickets_count": num_days,
            "ticket_numbers": tickets_created
        }

    except Event.DoesNotExist:
        return 400, {"error": "Event not found"}
    except Exception as e:
        return 400, {"error": str(e)}


@api.get("/events/{event_id}", response=schemas.EventDetailSchema)
def get_event_detail(request, event_id: int):
    event = get_object_or_404(Event, id=event_id)
    
    tags_list = event.tags
    if isinstance(event.tags, str):
        import json
        try:
            tags_list = json.loads(event.tags)
        except:
            tags_list = []
    
    is_registered = False
    if request.user.is_authenticated:
        is_registered = Ticket.objects.filter(
            event=event, 
            attendee=request.user
        ).exists()
    
    return {
        "id": event.id,
        "event_title": event.event_title,
        "event_description": event.event_description,
        "organizer_username": event.organizer.username if event.organizer else "Unknown",
        "start_date_register": event.start_date_register,
        "end_date_register": event.end_date_register,
        "event_start_date": event.event_start_date or event.start_date_register,
        "event_end_date": event.event_end_date or event.end_date_register,
        "max_attendee": event.max_attendee or 0,
        "current_attendees": len(event.attendee) if event.attendee else 0,
        "event_address": event.event_address or "",
        "is_online": event.is_online,
        "event_meeting_link": event.event_meeting_link or "",
        "tags": tags_list if tags_list else [],
        "event_image": event.event_image.url if event.event_image else None,
        "is_registered": is_registered,
    }


@api.get("/tickets/{ticket_id}", auth=django_auth, response=schemas.TicketDetailSchema)
def get_ticket_detail(request, ticket_id: int):
    ticket = get_object_or_404(Ticket, id=ticket_id, attendee=request.user)
    return {
        "qr_code": ticket.qr_code,
        "event_title": ticket.event.event_title,
        "event_description": ticket.event.event_description,
        "start_date": ticket.event.start_date_register,
        "location": ticket.event.event_address if not ticket.is_online else "Online",
        "meeting_link": ticket.meeting_link,
        "is_online": ticket.is_online,
        "organizer": ticket.event.organizer.username,
        "user_name": f"{request.user.first_name} {request.user.last_name}",
        "user_email": request.user.email,
    }