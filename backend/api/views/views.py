from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.middleware.csrf import get_token
import json

@csrf_exempt
def register(request):
    if request.method == "POST":
        data = json.loads(request.body)
        email = data.get("email")
        password = data.get("password")
        return JsonResponse({"message": f"User {email} registered successfully."})
    return JsonResponse({"error": "Invalid method"}, status=400)

@csrf_exempt
def login(request):
    if request.method == "POST":
        data = json.loads(request.body)
        email = data.get("email")
        password = data.get("password")
        # Check credentials here
        return JsonResponse({"message": f"User {email} logged in successfully."})
    return JsonResponse({"error": "Invalid method"}, status=400)

def home(request):
    return JsonResponse({"message": "Welcome to UniPlus API"})

def set_csrf_token(request):
    token = get_token(request)
    return JsonResponse({"csrfToken": token})
