from ninja import NinjaAPI
from ninja.security import django_auth
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.db import IntegrityError
from django.core.files.base import ContentFile
import uuid
import base64

from api.model.user import AttendeeUser
from api.model.event import Event  
from api import schemas
from django.shortcuts import get_object_or_404
from typing import List

# Create API instance with CSRF protection enabled
api = NinjaAPI(csrf=True)

@api.get("/", response=schemas.MessageSchema)
def home(request):
    """Home endpoint"""
    return {"message": "Welcome to UniPlus API"}

@api.get("/set-csrf-token")
def get_csrf_token(request):
    """Get CSRF token for subsequent requests"""
    return {"csrftoken": get_token(request)}

@api.post("/register", response={200: schemas.SuccessSchema, 400: schemas.ErrorSchema})
def register(request, payload: schemas.RegisterSchema):
    """Register a new user"""
    try:
        # Validation
        if not payload.username or not payload.email or not payload.password:
            return 400, {"error": "Username, email, and password are required"}
        
        # Check if user already exists
        if AttendeeUser.objects.filter(email=payload.email).exists():
            return 400, {"error": "User with this email already exists"}
        
        if AttendeeUser.objects.filter(username=payload.username).exists():
            return 400, {"error": "Username already taken"}
        


        # Create user (]]
        user = AttendeeUser.objects.create_user(
            email=payload.email,
            username=payload.username,
            password=payload.password,
            first_name=payload.first_name,
            last_name=payload.last_name
        )
        
        # Set role if provided (assuming your AttendeeUser model has a role field)
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
                "about_me": user.about_me,
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
    """Login user"""
    try:
        if not payload.email or not payload.password:
            return 401, {"error": "Email and password are required"}
        
        # Get user by email first
        try:
            user_obj = AttendeeUser.objects.get(email=payload.email)
            # Authenticate using email (since USERNAME_FIELD is 'email')
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
                    "email": user.email,
                    "first_name": user.first_name, 
                    "last_name": user.last_name,
                    "role": user.role,
                    "phone_number": user.phone_number,
                    "about_me": user.about_me,
                    "verification_status": user.verification_status,
                    "creation_date": user.creation_date.isoformat() if user.creation_date else None
                }
            }
        else:
            return 401, {"error": "Invalid credentials"}
            
    except Exception as e:
        return 401, {"error": str(e)}

@api.post("/logout", auth=django_auth, response=schemas.MessageSchema)
def logout_view(request):
    """Logout user (requires authentication)"""
    logout(request)
    return {"message": "Logged out successfully"}


@api.get("/check-auth")
def check_auth(request):
    """Check if user is authenticated"""
    return {
        "authenticated": request.user.is_authenticated,
        "username": request.user.username if request.user.is_authenticated else None,
        "first_name": request.user.first_name if request.user.is_authenticated else None,
        "last_name": request.user.last_name if request.user.is_authenticated else None
    }


@api.get("/user", auth=django_auth, response={200: schemas.UserSchema, 401: schemas.ErrorSchema})
def get_user_profile(request):
    """Get detailed profile of current authenticated user including first and last name"""
    if request.user.is_authenticated:
        return 200, {
            "username": request.user.username,
            "email": request.user.email,
            "first_name": request.user.first_name,
            "last_name": request.user.last_name,
            "role": request.user.role,
            "phone_number": request.user.phone_number,
            "about_me": request.user.about_me,
            "verification_status": request.user.verification_status,
            "creation_date": request.user.creation_date.isoformat() if request.user.creation_date else None
        }
    return 401, {"error": "Not authenticated"}


# Event related endpoints 
# Create Event
@api.post("/events", auth=django_auth, response={201: schemas.EventResponseSchema, 400: schemas.ErrorSchema, 401: schemas.ErrorSchema})
def create_event(request, payload: schemas.EventCreateSchema):
    """
    Create a new event (requires authentication)
    Accepts picture as base64 string or file path
    """
    try:
        if not request.user.is_authenticated:
            return 401, {"error": "Authentication required"}
        
        if not payload.event_name:
            return 400, {"error": "Event name is required"}
        
        if not payload.faculty:
            return 400, {"error": "Faculty is required"}
        
        if payload.number_of_students <= 0:
            return 400, {"error": "Number of students must be greater than 0"}
        
        if not payload.years:
            return 400, {"error": "Years field is required"}
        
        if not payload.descriptions:
            return 400, {"error": "Description is required"}
        
        if not payload.host or len(payload.host) == 0:
            return 400, {"error": "At least one host must be specified"}
        
        # Handle picture if provided
        picture_file = None
        if payload.picture:
            # Check if picture is base64 encoded
            if payload.picture.startswith('data:image'):
                try:
                    format, imgstr = payload.picture.split(';base64,')
                    ext = format.split('/')[-1]
                    
                    filename = f"event_{uuid.uuid4().hex[:10]}.{ext}"
                    
                    data = ContentFile(base64.b64decode(imgstr), name=filename)
                    picture_file = data
                except Exception as e:
                    return 400, {"error": f"Invalid base64 image data: {str(e)}"}
        
        event_data = {
            "event_name": payload.event_name,
            "number_of_students": payload.number_of_students,
            "faculty": payload.faculty,
            "years": payload.years,  
            "descriptions": payload.descriptions,
            "host": payload.host,
            "attendees": payload.attendees if payload.attendees else []
        }
        
        event = Event(**event_data)
        
        if picture_file:
            event.picture.save(picture_file.name, picture_file, save=False)
        
        event.save()
        
        return 201, {
            "id": event.id,
            "event_name": event.event_name,
            "number_of_students": event.number_of_students,
            "faculty": event.faculty,
            "years": event.years, 
            "descriptions": event.descriptions,
            "host": event.host,
            "attendees": event.attendees,
            "picture": event.picture.url if event.picture else None,
            "created_at": event.created_at,
            "updated_at": event.updated_at
        }
        
    except IntegrityError as e:
        return 400, {"error": "Registration failed. Please try again."}
    except Exception as e:
        return 400, {"error": f"Failed to create event: {str(e)}"}
    
# Get all events
@api.get("/events", response={200: List[schemas.EventResponseSchema], 400: schemas.ErrorSchema})
def get_events(request):
    """Get all events"""
    try:
        events = Event.objects.all().order_by('-created_at')
        return 200, [
            {
                "id": event.id,
                "event_name": event.event_name,
                "number_of_students": event.number_of_students,
                "faculty": event.faculty,
                "years": event.years,
                "descriptions": event.descriptions,
                "host": event.host,
                "attendees": event.attendees,
                "picture": event.picture.url if event.picture else None,
                "created_at": event.created_at,
                "updated_at": event.updated_at
            }
            for event in events
        ]
    except Exception as e:
        return 400, {"error": f"Failed to fetch events: {str(e)}"}
    
# Get event by ID
@api.get("/events/{event_id}", response={200: schemas.EventResponseSchema, 404: schemas.ErrorSchema})
def get_event(request, event_id: int):
    """Get a specific event by ID"""
    try:
        event = get_object_or_404(Event, id=event_id)
        return 200, {
            "id": event.id,
            "event_name": event.event_name,
            "number_of_students": event.number_of_students,
            "faculty": event.faculty,
            "years": event.years,
            "descriptions": event.descriptions,
            "host": event.host,
            "attendees": event.attendees,
            "picture": event.picture.url if event.picture else None,
            "created_at": event.created_at,
            "updated_at": event.updated_at
        }
    except Exception as e:
        return 404, {"error": f"Event not found: {str(e)}"}
    
# register for an event
@api.post("/events/{event_id}/register", auth=django_auth, response={200: schemas.SuccessSchema, 400: schemas.ErrorSchema, 401: schemas.ErrorSchema, 404: schemas.ErrorSchema})
def register_for_event(request, event_id: int):
    """Register current user for an event (Students only)"""
    try:
        if not request.user.is_authenticated:
            return 401, {"error": "Authentication required"}
        
        if request.user.role != 'student':
            return 400, {"error": "Only students can register for events"}
        
        event = get_object_or_404(Event, id=event_id)
        user_email = request.user.email
        
        if user_email in event.attendees:
            return 400, {"error": "You are already registered for this event"}
        
        if len(event.attendees) >= event.number_of_students:
            return 400, {"error": "Event is full"}
        
        event.attendees.append(user_email)
        event.save()    
        return 200, {
            "success": True,
            "message": f"Successfully registered for {event.event_name}",
            "event": {
                "id": event.id,
                "event_name": event.event_name,
                "current_attendees": len(event.attendees),
                "max_attendees": event.number_of_students
            }
        }
        
    except Exception as e:
        return 400, {"error": f"Failed to register for event: {str(e)}"}