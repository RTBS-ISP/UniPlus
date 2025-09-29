from django.contrib import admin
from django.urls import path
from api.views.views import register, login, home, set_csrf_token

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home, name='home'),
    path("api/register/", register),
    path("api/login/", login),
    path("api/set-csrf-token/", set_csrf_token),
]