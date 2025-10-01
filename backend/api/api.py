from ninja import NinjaAPI
from ninja.security import django_auth
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.db import IntegrityError
from api.model.user import AttendeeUser
from api import schemas

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
        
        # Create user (password is automatically hashed by create_user)
        user = AttendeeUser.objects.create_user(
            email=payload.email,
            username=payload.username,
            password=payload.password
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
                "email": user.email
            }
        }
        
    except IntegrityError as e:
        return 400, {"error": f"Database error: {str(e)}"}
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
                    "email": user.email
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

@api.get("/user", auth=django_auth, response={200: schemas.UserSchema, 401: schemas.ErrorSchema})
def get_user(request):
    """Get current authenticated user"""
    if request.user.is_authenticated:
        return 200, {
            "username": request.user.username,
            "email": request.user.email
        }
    return 401, {"error": "Not authenticated"}

@api.get("/check-auth")
def check_auth(request):
    """Check if user is authenticated"""
    return {
        "authenticated": request.user.is_authenticated,
        "username": request.user.username if request.user.is_authenticated else None
    }