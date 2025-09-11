from ninja import NinjaAPI
# from ninja.security import django_auth
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from .models import CustomUser as User
from . import schemas

api = NinjaAPI(csrf=True)
 
@api.get("/set-csrf-token")
def get_csrf_token(request):
    return {"csrftoken": get_token(request)}
 
@api.post("/login")
def login_view(request, payload: schemas.LoginSchema):
    user = authenticate(request, username=payload.username, password=payload.password)
    if user is not None:
        login(request, user)
        return {"success": True, "message": "Login successful"}
    return {"success": False, "message": "Invalid credentials"}
 
@api.post("/logout")
def logout_view(request):
    logout(request)
    return {"success": True, "message": "Logged out"}


@api.get("/user")
def user_view(request):
    if request.user.is_authenticated:
        return {
            "username": request.user.username,
            "email": request.user.email,
            "first_name": request.user.first_name,
            "last_name": request.user.last_name,
            "phone_number": request.user.phone_number,
            "role": request.user.role.capitalize(),
        }
    return {"success": False, "message": "No user information"}

VALID_ROLES = ["student", "organizer"]

@api.post("/register")
def register_view(request, payload: schemas.RegisterSchema):
    if payload.password != payload.confirm_password:
        return {"success": False, "message": "Passwords do not match"}

    role_lower = payload.role.lower()
    if role_lower not in VALID_ROLES:
        return {"success": False, "message": "Invalid role selected"}

    try:
        User.objects.create_user(
            username=payload.username,
            first_name=payload.first_name,
            last_name=payload.last_name,
            email=payload.email,
            phone_number=payload.phone_number,
            role=role_lower,
            password=payload.password,
        )
        return {"success": True, "message": "User registered successfully"}
    except Exception as e:
        return {"success": False, "message": str(e)}
 
