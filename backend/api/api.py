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
            last_name=payload.last_name,
            phone_number=payload.phone_number,
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
        return 401, {"error": f"Login failed: {str(e)}"}

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
@api.post("/creat_events", auth=django_auth, response={201: schemas.EventSchema, 400: schemas.ErrorSchema})
def create_event(request, payload: schemas.EventCreateSchema):
    """Create a new event (requires authentication)"""
    try:
        if payload.end_date_register <= payload.start_date_register:
            return 400, {"error": "End date must be after start date"}
        
        # Create event
        event = Event.objects.create(
            event_title=payload.event_title,
            event_description=payload.event_description,
            start_date_register=payload.start_date_register,
            end_date_register=payload.end_date_register,
            max_attendee=payload.max_attendee,
            is_online=getattr(payload, 'is_online', False),  
        )
        
        return 201, {
            "id": event.id,  
            "event_title": event.event_title,
            "event_description": event.event_description,
            "event_create_date": event.event_create_date.isoformat  () if event.event_create_date else None,
            "max_attendee": event.max_attendee,
            "start_date_register": event.start_date_register.isoformat() if event.start_date_register else None, 
            "end_date_register": event.end_date_register.isoformat() if event.end_date_register else None,  
            "is_online": event.is_online,
        }
        
    except IntegrityError as e:
        return 400, {"error": f"Event creation failed due to database error: {str(e)}"}
    except Exception as e:
        return 400, {"error": f"Event creation failed: {str(e)}"}
    
# get all events
@api.get("/events", response=List[schemas.EventSchema])
def get_all_events(request):
    """Get all events"""
    events = Event.objects.all().order_by('-event_create_date')
    return [
        {
            "id": event.id,
            "event_title": event.event_title,
            "event_description": event.event_description,
            "event_create_date": event.event_create_date.isoformat() if event.event_create_date else None,
            "max_attendee": event.max_attendee,
            "start_date_register": event.start_date_register.isoformat() if event.start_date_register else None,
            "end_date_register": event.end_date_register.isoformat() if event.end_date_register else None,
            "is_online": event.is_online,
        }
        for event in events
    ]

# get specific event by id
@api.get("/events/{event_id}", response={200: schemas.EventSchema, 404: schemas.ErrorSchema})
def get_event(request, event_id: int):
    """Get a specific event by ID"""
    event = get_object_or_404(Event, id=event_id)
    return 200, {
        "id": event.id,
        "event_title": event.event_title,
        "event_description": event.event_description,
        "event_create_date": event.event_create_date.isoformat() if event.event_create_date else None,
        "max_attendee": event.max_attendee,
        "start_date_register": event.start_date_register.isoformat() if event.start_date_register else None,
        "end_date_register": event.end_date_register.isoformat() if event.end_date_register else None,
        "is_online": event.is_online,
    }