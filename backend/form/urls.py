from django.urls import path
from django.contrib import admin

from form.api import api
from . import views

# URL config
urlpatterns = [
    path("hi", views.index),
    path('admin/', admin.site.urls),
    path('api/', api.urls),
]