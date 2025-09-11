from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from api.models.event import Event

# List all events
def event_list(request):
    events = Event.objects.all().values('id', 'event_name', 'start_date_event', 'end_date_event', 'category')
    return JsonResponse(list(events), safe=False)

# Get details for one event
def event_detail(request, event_id):
    event = get_object_or_404(Event, id=event_id)
    data = {
        "id": event.id,
        "event_name": event.event_name,
        "description": event.description,
        "start_date": event.start_date_event,
        "end_date": event.end_date_event,
        "category": event.category,
        "is_online": event.is_online,
        "ticket_price": float(event.ticket_price),
    }
    return JsonResponse(data)