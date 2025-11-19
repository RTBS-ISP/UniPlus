"""
Run this script to send event reminders
Usage: python send_reminders.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'uniplus.settings')
django.setup()

from django.utils import timezone
from api.model.event import Event
from api.model.ticket import Ticket
from api.model.notification import Notification, send_reminder_notification

def send_reminders(hours=24):
    now = timezone.now()
    reminder_window = now + timezone.timedelta(hours=hours)
    
    upcoming_events = Event.objects.filter(
        event_start_date__gte=now,
        event_start_date__lte=reminder_window,
        verification_status='approved'
    ).select_related('organizer')
    
    total_sent = 0
    
    for event in upcoming_events:
        hours_until = (event.event_start_date - now).total_seconds() / 3600
        
        approved_tickets = Ticket.objects.filter(
            event=event,
            approval_status='approved'
        ).select_related('attendee')
        
        for ticket in approved_tickets:
            # Check if reminder already sent
            already_sent = Notification.objects.filter(
                user=ticket.attendee,
                related_event=event,
                notification_type__in=['event_reminder', 'reminder_24h', 'reminder_1h'],
                created_at__gte=now - timezone.timedelta(hours=12)
            ).exists()
            
            if not already_sent:
                send_reminder_notification(ticket, hours_until)
                total_sent += 1
                print(f"✅ Reminder sent to {ticket.attendee.email} for {event.event_title}")
    
    print(f"\n✅ Total reminders sent: {total_sent}")
    return total_sent

if __name__ == "__main__":
    send_reminders(24)