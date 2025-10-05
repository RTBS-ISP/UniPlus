"""
UniPlus API - Event Management System
This module handles user authentication and authorization for the UniPlus platform.
It provides endpoints for user registration, login, logout, and profile management.
"""

from ninja import NinjaAPI, Form
from ninja.files import UploadedFile
from ninja.security import django_auth
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.db import IntegrityError
from api.model.user import AttendeeUser
from api.model.event import Event
from api.model.ticket import Ticket
from api import schemas
from typing import List
from ninja import File, Form
from ninja.files import UploadedFile
from typing import Optional



from django.utils import timezone
from django.shortcuts import get_object_or_404


DEFAULT_PROFILE_PIC = "/images/logo.png" 

# Initialize the NinjaAPI instance with CSRF protection enabled
# This ensures all POST/PUT/DELETE requests require a valid CSRF token
api = NinjaAPI(csrf=True)

@api.get("/", response=schemas.MessageSchema)
def home(request):
    """
    Home endpoint - API health check and welcome message
    
    This endpoint serves as a simple health check to verify the API is running.
    It requires no authentication and returns a welcome message.
    
    Args:
        request: The Django HTTP request object
        
    Returns:
        dict: A welcome message confirming the API is operational
    """
    return {"message": "Welcome to UniPlus API"}


@api.get("/set-csrf-token")
def get_csrf_token(request):
    """
    Generate and return a CSRF token for the current session
    
    CSRF tokens are required for all state-changing operations (POST, PUT, DELETE)
    to prevent Cross-Site Request Forgery attacks. The frontend should call this
    endpoint before making any authenticated requests and include the token in
    the 'X-CSRFToken' header.
    
    Args:
        request: The Django HTTP request object
        
    Returns:
        dict: Contains the CSRF token to be used in subsequent requests
        
    Example:
        Response: {"csrftoken": "abc123xyz..."}
        Usage: Headers: {"X-CSRFToken": "abc123xyz..."}
    """
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

        # Convert about_me dict to string if it exists
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
        
        # Set role if provided
        if hasattr(payload, 'role') and payload.role:
            user.role = payload.role
            user.save()
        
        # Parse about_me back for response
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
    """
    Authenticate and login a user
    
    Validates user credentials and creates a session for authenticated users.
    Uses email as the primary authentication field (not username).
    
    Args:
        request: The Django HTTP request object
        payload: LoginSchema containing:
            - email (str): User's email address
            - password (str): User's password
    
    Returns:
        200: Success response with user data if login successful
        401: Unauthorized response if credentials are invalid
        
    Session:
        Creates a Django session cookie upon successful authentication,
        which will be used for subsequent authenticated requests.
        
    Security:
        - Passwords are never stored or transmitted in plain text
        - Failed login attempts return generic error messages to prevent
          user enumeration attacks
        - CSRF token required for this endpoint
    """
    try:
        # Validate that both email and password are provided
        if not payload.email or not payload.password:
            return 401, {"error": "Email and password are required"}
        
        try:
            # First, verify that a user with this email exists
            # This is needed because we use email as the USERNAME_FIELD
            user_obj = AttendeeUser.objects.get(email=payload.email)
            
            # Authenticate using Django's built-in authentication system
            # Note: We pass email to the username parameter because
            # AttendeeUser.USERNAME_FIELD = 'email'
            user = authenticate(request, username=payload.email, password=payload.password)
        except AttendeeUser.DoesNotExist:
            # Return generic error message to prevent user enumeration
            return 401, {"error": "Invalid credentials"}
        
        # Check if authentication was successful
        if user is not None:
            # Create a session for the authenticated user
            # This sets a session cookie that will be sent with subsequent requests
            login(request, user)
            
            # Return success response with basic user information
            return 200, {
                "success": True,
                "message": "Logged in successfully",
                "user": {
                    "username": user.username,
                    "email": user.email
                }
            }
        else:
            # Authentication failed - password was incorrect
            return 401, {"error": "Invalid credentials"}
            
    except Exception as e:
        # Handle any unexpected errors during login
        # In production, log these errors for debugging
        return 401, {"error": str(e)}
    

@api.post("/logout", auth=django_auth, response=schemas.MessageSchema)
def logout_view(request):
    """
    Logout the current authenticated user
    
    Terminates the user's session and clears authentication cookies.
    Requires the user to be authenticated (enforced by django_auth decorator).
    
    Args:
        request: The Django HTTP request object with authenticated user
        
    Returns:
        dict: Confirmation message that logout was successful
        
    Security:
        - Requires valid authentication (django_auth)
        - CSRF token required for this endpoint
        - Clears all session data for the user
    """
    # Django's logout function handles clearing the session and cookies
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
            "profilePic": request.user.profile_picture.url if request.user.profile_picture else DEFAULT_PROFILE_PIC,  # Fixed typo here
            "tickets": tickets
        }
    return 401, {"error": "Not authenticated"}


@api.get("/check-auth")
def check_auth(request):
    """
    Check authentication status without requiring authentication
    
    This endpoint allows the frontend to check if a user is currently
    authenticated without triggering an authentication error. Useful for
    conditionally rendering UI elements based on auth status.
    
    Args:
        request: The Django HTTP request object
        
    Returns:
        dict: Authentication status and username (if authenticated)
            - authenticated (bool): True if user is logged in
            - username (str|None): Username if authenticated, None otherwise
            
    Note:
        This endpoint does NOT require authentication, making it safe
        to call from any context without handling auth errors.
    """
    return {
        "authenticated": request.user.is_authenticated,
        # Return username only if authenticated, otherwise None
        "username": request.user.username if request.user.is_authenticated else None
    }

@api.post("/events/create", auth=django_auth, response={200: schemas.SuccessSchema, 400: schemas.ErrorSchema})
def create_event(
    request,
    event_title: str = Form(...),
    event_description: str = Form(...),
    start_date_register: str = Form(...),
    end_date_register: str = Form(...),
    is_online: str = Form("false"),
    max_attendee: Optional[str] = Form(None),
    event_address: Optional[str] = Form(None),
    event_meeting_link: Optional[str] = Form(None),
    event_category: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    event_email: Optional[str] = Form(None),
    event_phone_number: Optional[str] = Form(None),
    event_website_url: Optional[str] = Form(None),
    terms_and_conditions: Optional[str] = Form(None),
    event_image: Optional[UploadedFile] = File(None),
):
    """Create a new event with file upload support"""
    try:
        from datetime import datetime
        
        event = Event.objects.create(
            organizer=request.user,
            event_title=event_title,
            event_description=event_description,
            start_date_register=datetime.fromisoformat(start_date_register.replace('Z', '+00:00')),
            end_date_register=datetime.fromisoformat(end_date_register.replace('Z', '+00:00')),
            max_attendee=int(max_attendee) if max_attendee else None,
            event_address=event_address,
            is_online=(is_online.lower() == 'true'),
            event_meeting_link=event_meeting_link,
            event_category=event_category,
            tags=tags,
            event_email=event_email,
            event_phone_number=event_phone_number,
            event_website_url=event_website_url,
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
    """Get all events"""
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
            "max_attendee": e.max_attendee,
            "current_attendees": len(e.attendee) if e.attendee else 0,
            "event_address": e.event_address,
            "is_online": e.is_online,
            "status_registration": e.status_registration,
            "attendee": e.attendee,
            "tags": tags_list,
            "event_category": e.event_category or "",
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
        # Save uploaded file to user.profile_picture field
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
        from django.utils import timezone
        import uuid

        # Get event & user
        event = get_object_or_404(Event, id=event_id)
        user = request.user

        # Already registered?
        if Ticket.objects.filter(event=event, attendee=user).exists():
            return 400, {"error": "You are already registered for this event"}

        # Registration period check
        if timezone.now() > event.end_date_register:
            return 400, {"error": "Event registration has closed"}

        # Max attendee check
        if event.max_attendee and Ticket.objects.filter(event=event).count() >= event.max_attendee:
            return 400, {"error": "Event has reached maximum attendees"}

        # Status check
        if event.status_registration != "OPEN":
            return 400, {"error": "Event registration is not open"}

        # Create ticket
        qr_code_value = str(uuid.uuid4())
        ticket = Ticket.objects.create(
            event=event,
            attendee=user,
            qr_code=qr_code_value,
            is_online=event.is_online,
            meeting_link=event.event_meeting_link if event.is_online else None,
            user_name=f"{user.first_name} {user.last_name}",
            user_email=user.email,
            event_title=event.event_title,
            start_date=event.start_date_register,
            location=event.event_address if not event.is_online else "Online",
        )

        attendees = event.attendee if isinstance(event.attendee, list) else []
        if user.id not in attendees:
            attendees.append(user.id)
        event.attendee = attendees
        event.save()

        return 200, {
            "success": True,
            "message": "Successfully registered for the event",
            "ticket_number": qr_code_value
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
    
    return {
        "id": event.id,
        "event_title": event.event_title,
        "event_description": event.event_description,
        "organizer_username": event.organizer.username if event.organizer else "Unknown",
        "start_date_register": event.start_date_register,
        "end_date_register": event.end_date_register,
        "max_attendee": event.max_attendee or 0,
        "current_attendees": len(event.attendee) if event.attendee else 0,
        "event_address": event.event_address or "",
        "is_online": event.is_online,
        "event_meeting_link": event.event_meeting_link or "",
        "tags": tags_list if tags_list else [],
        "event_category": event.event_category or "",
        "event_image": event.event_image.url if event.event_image else None,
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