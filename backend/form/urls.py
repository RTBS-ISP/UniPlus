from django.urls import path

from . import views
# URL config
urlpatterns = [
    path("hi", views.index),
]