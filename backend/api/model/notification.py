from django.db import models
from .user import AttendeeUser  
from .ticket import Ticket
from .event import Event
from typing import Optional

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('registration', 'Registration Confirmation'),
        ('approval', 'Ticket Approved'),
        ('rejection', 'Ticket Rejected'),
        ('reminder_24h', '24 Hour Reminder'),
        ('reminder_1h', '1 Hour Reminder'),
        ('event_update', 'Event Update'),
        ('check_in', 'Check-in Confirmation'),
    ]

    user = models.ForeignKey(
        AttendeeUser, 
        on_delete=models.CASCADE, 
        related_name='notifications'
    )
    message = models.TextField()
    notification_type = models.CharField(
        max_length=50, 
        choices=NOTIFICATION_TYPES
    )
    related_ticket = models.ForeignKey(
        Ticket, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True
    )
    related_event = models.ForeignKey(
        Event, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.notification_type} - {self.created_at}"

    def mark_as_read(self):
        """Mark notification as read"""
        self.is_read = True
        self.save()


def create_notification(
    user: AttendeeUser,
    message: str,
    notification_type: str,
    related_ticket: Optional[Ticket] = None,
    related_event: Optional[Event] = None
) -> Notification:
    """Create a notification for a user"""
    notification = Notification.objects.create(
        user=user,
        message=message,
        notification_type=notification_type,
        related_ticket=related_ticket,
        related_event=related_event
    )
    return notification

def send_registration_notification(ticket: Ticket):
    """Send notification when user registers for an event"""
    message = f"Successfully registered for '{ticket.event.event_title}'. Your ticket is pending approval."
    create_notification(
        user=ticket.attendee,
        message=message,
        notification_type='registration',
        related_ticket=ticket,
        related_event=ticket.event
    )

def send_approval_notification(ticket: Ticket):
    """Send notification when ticket is approved"""
    message = f"Great news! Your ticket for '{ticket.event.event_title}' has been approved."
    create_notification(
        user=ticket.attendee,
        message=message,
        notification_type='approval',
        related_ticket=ticket,
        related_event=ticket.event
    )

def send_rejection_notification(ticket: Ticket, reason: str = ""):
    """Send notification when ticket is rejected"""
    message = f"Your ticket for '{ticket.event.event_title}' was not approved."
    if reason:
        message += f" Reason: {reason}"
    create_notification(
        user=ticket.attendee,
        message=message,
        notification_type='rejection',
        related_ticket=ticket,
        related_event=ticket.event
    )

def send_reminder_notification(ticket: Ticket, hours_until: int):
    """Send reminder notification before event starts"""
    if hours_until == 24:
        message = f"Reminder: '{ticket.event.event_title}' starts in 24 hours!"
        notif_type = 'reminder_24h'
    elif hours_until == 1:
        message = f"Reminder: '{ticket.event.event_title}' starts in 1 hour!"
        notif_type = 'reminder_1h'
    else:
        message = f"Reminder: '{ticket.event.event_title}' is coming up soon!"
        notif_type = 'reminder_24h'
    
    create_notification(
        user=ticket.attendee,
        message=message,
        notification_type=notif_type,
        related_ticket=ticket,
        related_event=ticket.event
    )

def send_checkin_notification(ticket: Ticket):
    """Send notification when user is checked in"""
    message = f"You've been checked in to '{ticket.event.event_title}'. Enjoy the event!"
    create_notification(
        user=ticket.attendee,
        message=message,
        notification_type='check_in',
        related_ticket=ticket,
        related_event=ticket.event
    )