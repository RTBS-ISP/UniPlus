from django.contrib import admin
from django.urls import path
from api.api import api

# url map
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api.urls),
]