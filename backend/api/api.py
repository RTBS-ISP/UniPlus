from ninja import NinjaAPI
from ninja.security import django_auth
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from .models import CustomUser as User
from . import schemas

api = NinjaAPI(csrf=True)
 
@api.get("/set-csrf-token")
def get_csrf_token(request):
    return {"csrftoken": get_token(request)}
 
@api.post("/login")
def login_view(request, payload: schemas.SignInSchema):
    user = authenticate(request, username=payload.email, password=payload.password)
    if user is not None:
        login(request, user)
        return {"success": True}
    return {"success": False, "message": "Invalid credentials"}
 
@api.post("/logout", auth=django_auth)
def logout_view(request):
    logout(request)
    return {"message": "Logged out"}

@api.get("/user", auth=django_auth)
def user(request):
    return {
        "username": request.user.username,
        "email": request.user.email,
    }
 
@api.post("/register")
def register(request, payload: schemas.SignInSchema):
    try:
        User.objects.create_user(username=payload.email, email=payload.email, password=payload.password)
        return {"success": "User registered successfully"}
    except Exception as e:
        return {"error": str(e)}
 