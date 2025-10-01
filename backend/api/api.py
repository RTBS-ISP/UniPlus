"""
UniPlus API - Event Management System
This module handles user authentication and authorization for the UniPlus platform.
It provides endpoints for user registration, login, logout, and profile management.
"""

from ninja import NinjaAPI
from ninja.security import django_auth
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.db import IntegrityError
from api.model.user import AttendeeUser
from api import schemas

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
    """
    Register a new user account
    
    Creates a new AttendeeUser account with the provided credentials.
    Performs validation to ensure unique email and username, and optionally
    sets the user's role if provided.
    
    Args:
        request: The Django HTTP request object
        payload: RegisterSchema containing:
            - username (str): Unique username for the account
            - email (str): Unique email address (used as primary login)
            - password (str): User's password (will be hashed)
            - role (str, optional): User role (Attendee/Student/Instructor)
    
    Returns:
        200: Success response with user data if registration successful
        400: Error response with specific error message if validation fails
        
    Raises:
        IntegrityError: If database constraints are violated
        Exception: For any other unexpected errors
        
    Security:
        - Passwords are automatically hashed using Django's password system
        - Email uniqueness is enforced at the database level
        - CSRF token required for this endpoint
    """
    try:
        # Validate that all required fields are provided
        # This provides a clear error message for missing fields
        if not payload.username or not payload.email or not payload.password:
            return 400, {"error": "Username, email, and password are required"}
        
        # Check if a user with this email already exists
        # Email is used as the primary authentication field
        if AttendeeUser.objects.filter(email=payload.email).exists():
            return 400, {"error": "User with this email already exists"}
        
        # Check if the username is already taken
        # Usernames must be unique even though email is the login field
        if AttendeeUser.objects.filter(username=payload.username).exists():
            return 400, {"error": "Username already taken"}
        
        # Create the new user account
        # create_user() method automatically hashes the password
        user = AttendeeUser.objects.create_user(
            email=payload.email,    # Primary authentication field
            username=payload.username,  # Display name/handle
            password=payload.password   # Will be hashed automatically
        )
        
        # Optional: Set user role if provided in the registration payload
        # Default role is 'Attendee' if not specified
        if hasattr(payload, 'role') and payload.role:
            user.role = payload.role
            user.save()
        
        # Return success response with basic user information
        # Note: Never return sensitive data like passwords
        return 200, {
            "success": True,
            "message": "User registered successfully",
            "user": {
                "username": user.username,
                "email": user.email
            }
        }
        
    except IntegrityError as e:
        # Handle database constraint violations
        # This might occur if there's a race condition with duplicate emails
        return 400, {"error": f"Database error: {str(e)}"}
    except Exception as e:
        # Catch-all for any unexpected errors
        # In production, you might want to log these for debugging
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
    """
    Get current authenticated user's basic information
    
    Returns the username and email of the currently logged-in user.
    This endpoint requires authentication and is typically used by the
    frontend to verify the user's session and display user info.
    
    Args:
        request: The Django HTTP request object with authenticated user
        
    Returns:
        200: User information if authenticated
        401: Error message if not authenticated
        
    Security:
        - Requires valid authentication (django_auth)
        - Only returns non-sensitive user information
    """
    # Check if the user is authenticated
    # This should always be true due to django_auth decorator,
    # but we check as a safety measure
    if request.user.is_authenticated:
        return 200, {
            "username": request.user.username,
            "email": request.user.email
        }
    # This should not be reached due to django_auth decorator
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