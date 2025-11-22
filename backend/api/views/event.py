"""
Events API endpoints
"""

from ninja import Router
from ninja.security import django_auth
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Count
from api.model.user import AttendeeUser
from api.model.event import Event
from api.model.ticket import Ticket
from api.model.event_schedule import EventSchedule
from api import schemas
import json
from datetime import datetime

# Create a router for events endpoints
events_router = Router()

@events_router.get("/my-events/pending-approvals", auth=django_auth, response={200: schemas.OrganizerDashboardSchema, 401: schemas.ErrorSchema})
def get_organizer_dashboard(request):
    """
    Get organizer's main dashboard with pending approvals summary
    """
    if not request.user.is_authenticated:
        return 401, {"error": "Not authenticated"}
    
    user = request.user
    
    # Get all user's events
    events = Event.objects.filter(organizer=user)
    
    total_events = events.count()
    upcoming_events = events.filter(event_end_date__gte=datetime.now()).count()
    past_events = events.filter(event_end_date__lt=datetime.now()).count()
    
    # Total registrations across all events
    total_registrations = Ticket.objects.filter(event__organizer=user).count()
    
    # Total pending approvals across all events
    pending_approvals = Ticket.objects.filter(
        event__organizer=user,
        approval_status='pending'
    ).count()
    
    # Events with pending approvals
    events_with_pending = []
    for event in events:
        pending_count = Ticket.objects.filter(
            event=event,
            approval_status='pending'
        ).count()
        
        if pending_count > 0:
            events_with_pending.append({
                "event_id": event.id,
                "event_title": event.event_title,
                "pending_count": pending_count,
                "event_date": event.event_start_date.isoformat() if event.event_start_date else None,
            })
    
    return 200, {
        "total_events": total_events,
        "upcoming_events": upcoming_events,
        "past_events": past_events,
        "total_registrations": total_registrations,
        "pending_approvals": pending_approvals,
        "events_with_pending": events_with_pending,
    }

@events_router.get("/")
def get_events_list(request):
    """
    Get all events with organizer information
    Returns only verified events to regular users
    Returns events sorted by creation date (newest first)
    """
    try:
        events = Event.objects.select_related('organizer').filter(verification_status="approved").order_by('-event_create_date')
        
        events_data = []
        for event in events:
            organizer_name = f"{event.organizer.first_name} {event.organizer.last_name}".strip()
            if not organizer_name:
                organizer_name = event.organizer.username or event.organizer.email
            tags_list = []
            if event.tags:
                try:
                    tags_list = json.loads(event.tags) if isinstance(event.tags, str) else event.tags
                except:
                    tags_list = [event.tags] if event.tags else []
            
            attendee_count = len(event.attendee) if event.attendee else 0
            
            schedule = []
            if hasattr(event, 'schedule') and event.schedule:
                try:
                    schedule = json.loads(event.schedule)
                except:
                    pass
            
            events_data.append({
                "id": event.id,
                "event_title": event.event_title,
                "event_description": event.event_description,
                "event_create_date": event.event_create_date.isoformat(),
                "start_date_register": event.start_date_register.isoformat(),
                "end_date_register": event.end_date_register.isoformat(),
                "event_start_date": event.event_start_date.isoformat() if event.event_start_date else None,
                "event_end_date": event.event_end_date.isoformat() if event.event_end_date else None,
                "schedule": schedule,
                "max_attendee": event.max_attendee,
                "event_address": event.event_address,
                "event_image": event.event_image.url if event.event_image else None,
                "is_online": event.is_online,
                "event_meeting_link": event.event_meeting_link,
                "tags": tags_list,
                "status_registration": event.status_registration,
                "event_email": event.event_email,
                "event_phone_number": event.event_phone_number,
                "event_website_url": event.event_website_url,
                "organizer_name": organizer_name,
                "organizer_role": event.organizer.role or "Organizer",
                "organizer_id": event.organizer.id,
                "attendee": event.attendee,
                "attendee_count": attendee_count,
                "verification_status": event.verification_status or "pending",
            })
        
        return events_data
        
    except Exception as e:
        print(f"Error fetching events: {str(e)}")
        return {"error": str(e)}