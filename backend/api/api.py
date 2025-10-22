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
from api.model.comment import Comment
from api.model.rating import Rating
from api import schemas
from typing import List, Optional
import json
from datetime import datetime
from django.db.models import Count

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
    category: Optional[str] = Form(default=""),
    start_date_register: str = Form(...),
    end_date_register: str = Form(...),
    schedule_days: str = Form(...),  # Changed from event_dates
    max_attendee: Optional[str] = Form(default=""),
    tags: Optional[str] = Form(default=""),
    event_email: Optional[str] = Form(default=""),
    event_phone_number: Optional[str] = Form(default=""),
    event_website_url: Optional[str] = Form(default=""),
    terms_and_conditions: Optional[str] = Form(default=""),
    event_image: Optional[UploadedFile] = File(default=None),
):
    try:
        # Parse schedule days from frontend
        schedule = json.loads(schedule_days)
        
        # Helper function to clean empty strings
        def clean_empty_string(value):
            if value and isinstance(value, str) and value.strip():
                return value.strip()
            return None
        
        # Determine overall online status and location
        first_day = schedule[0] if schedule else {}
        is_online = first_day.get('is_online', False)
        event_address = None if is_online else clean_empty_string(first_day.get('address'))
        event_meeting_link = clean_empty_string(first_day.get('meeting_link')) if is_online else None
        
        # Parse registration dates
        start_reg = datetime.fromisoformat(start_date_register.replace('Z', '+00:00'))
        end_reg = datetime.fromisoformat(end_date_register.replace('Z', '+00:00'))
        
        # Get event start and end dates from schedule
        event_start = datetime.fromisoformat(schedule[0]['start_iso'].replace('Z', '+00:00'))
        event_end = datetime.fromisoformat(schedule[-1]['end_iso'].replace('Z', '+00:00'))
        
        # Parse tags - ensure they include category
        tags_list = json.loads(tags) if tags and tags.strip() else []
        if category and category.strip() and category not in tags_list:
            tags_list.insert(0, category)
        
        # Clean optional fields
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
            tags=json.dumps(tags_list),  # Store as JSON
            event_email=event_email_clean,
            event_phone_number=event_phone_clean,
            event_website_url=event_website_clean,
            terms_and_conditions=terms_clean,
            event_image=event_image if event_image else None,
        )
        
        # Store schedule information in a new field or related model if needed
        # For now, we'll store it in the event model as JSON
        event.schedule = json.dumps(schedule)
        event.save()
        
        return 200, {
            "success": True,
            "message": "Event created successfully",
            "event_id": event.id
        }
        
    except Exception as e:
        print(f"Error creating event: {str(e)}")
        return 400, {"error": str(e)}


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
            # Get organizer info
            organizer_name = f"{event.organizer.first_name} {event.organizer.last_name}".strip()
            if not organizer_name:
                organizer_name = event.organizer.username or event.organizer.email
            
            # Parse tags
            tags_list = []
            if event.tags:
                try:
                    tags_list = json.loads(event.tags) if isinstance(event.tags, str) else event.tags
                except:
                    tags_list = [event.tags] if event.tags else []
            
            # Calculate attendee count
            attendee_count = len(event.attendee) if event.attendee else 0
            
            # Parse schedule if available
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

        # Parse schedule to determine number of days
        schedule = []
        if hasattr(event, 'schedule') and event.schedule:
            try:
                schedule = json.loads(event.schedule)
            except:
                pass
        
        # If no schedule, create single ticket
        if not schedule:
            schedule = [{
                'date': event.event_start_date.date().isoformat() if event.event_start_date else timezone.now().date().isoformat(),
                'is_online': event.is_online,
                'address': event.event_address,
                'meeting_link': event.event_meeting_link
            }]
        
        tickets_created = []
        for day_info in schedule:
            qr_code_value = str(uuid.uuid4())
            
            ticket = Ticket.objects.create(
                event=event,
                attendee=user,
                qr_code=qr_code_value,
                event_date=datetime.fromisoformat(day_info['date']) if isinstance(day_info.get('date'), str) else event.event_start_date,
                is_online=day_info.get('is_online', event.is_online),
                meeting_link=day_info.get('meeting_link', event.event_meeting_link) if day_info.get('is_online', event.is_online) else None,
                user_name=f"{user.first_name} {user.last_name}",
                user_email=user.email,
                event_title=event.event_title,
                start_date=event.event_start_date,
                location=day_info.get('address', event.event_address) if not day_info.get('is_online', event.is_online) else "Online",
            )
            tickets_created.append(qr_code_value)

        # Update attendee list
        attendees = event.attendee if isinstance(event.attendee, list) else []
        if user.id not in attendees:
            attendees.append(user.id)
        event.attendee = attendees
        event.save()

        num_tickets = len(tickets_created)
        if num_tickets == 1:
            message = "Successfully registered for the event"
        else:
            message = f"Successfully registered! You received {num_tickets} tickets (one for each day)"

        return 200, {
            "success": True,
            "message": message,
            "tickets_count": num_tickets,
            "ticket_numbers": tickets_created
        }

    except Event.DoesNotExist:
        return 400, {"error": "Event not found"}
    except Exception as e:
        print(f"Error registering for event: {str(e)}")
        return 400, {"error": str(e)}


@api.get("/events/{event_id}", response=schemas.EventDetailSchema)
def get_event_detail(request, event_id: int):
    event = get_object_or_404(Event, id=event_id)
    
    # Parse tags
    tags_list = []
    if event.tags:
        try:
            tags_list = json.loads(event.tags) if isinstance(event.tags, str) else event.tags
        except:
            tags_list = [event.tags] if event.tags else []
    
    # Parse and transform schedule to frontend format
    schedule = []
    if hasattr(event, 'schedule') and event.schedule:
        try:
            schedule_data = json.loads(event.schedule)
            
            # Transform backend schedule format to frontend format
            for day in schedule_data:
                # Extract date and times from the schedule
                date_str = day.get('date', '')
                
                # Try to extract time from start_iso if available
                start_iso = day.get('start_iso', '')
                end_iso = day.get('end_iso', '')
                
                start_time = '00:00'
                end_time = '00:00'
                
                if start_iso:
                    try:
                        # Extract time from ISO format: "2025-10-07T14:00:00Z" -> "14:00"
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
    
    # Check if user is registered
    is_registered = False
    if request.user.is_authenticated:
        is_registered = Ticket.objects.filter(
            event=event, 
            attendee=request.user
        ).exists()
    
    # Calculate available spots
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
        "address2": getattr(event, 'address2', "") or "",  # Add this field - add to Event model too
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

        # Validate content is not empty
        if not payload.content or not payload.content.strip():
            return 400, {"error": "Comment content cannot be empty"}

        comment = Comment.objects.create(
            event_id=event,      
            author_id=user,      
            content=payload.content.strip()
        )

        return 200, {
            "success": True,
            "message": "Comment added successfully",
            "comment_id": comment.id
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