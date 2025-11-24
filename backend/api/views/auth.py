from ninja import Router
from ninja.security import django_auth
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.db import IntegrityError
from api.model.user import AttendeeUser
from api import schemas
import json

router = Router(tags=["auth"])


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
            about_me=about_me_str,
        )

        if hasattr(payload, "role") and payload.role:
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
                "creation_date": user.creation_date.isoformat() if user.creation_date else None,
            },
        }

    except IntegrityError:
        return 400, {"error": "Registration failed. Please try again."}
    except Exception as e:
        return 400, {"error": str(e)}


@router.post("/login", response={200: schemas.SuccessSchema, 401: schemas.ErrorSchema})
def login_view(request, payload: schemas.LoginSchema):
    try:
        if not payload.email or not payload.password:
            return 401, {"error": "Email and password are required"}

        try:
            AttendeeUser.objects.get(email=payload.email)
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
                },
            }
        else:
            return 401, {"error": "Invalid credentials"}

    except Exception as e:
        return 401, {"error": str(e)}


@router.post("/logout", auth=django_auth, response=schemas.MessageSchema)
def logout_view(request):
    logout(request)
    return {"message": "Logged out successfully"}
