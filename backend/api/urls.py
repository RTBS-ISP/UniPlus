from django.urls import path

from .views import views
# URL config
urlpatterns = [
    path("hi", views.register),
    # path('events/', event_views.event_list, name='event_list'),
    # path('events/<int:event_id>/', event_views.event_detail, name='event_detail'),
]