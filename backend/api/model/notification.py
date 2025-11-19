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
        ('event_reminder', 'Event Reminder'),  
        ('event_update', 'Event Update'),
        ('check_in', 'Check-in Confirmation'),
        ('event_pending_approval', 'Event Pending Approval'),  
        ('event_approved', 'Event Approved'),  
        ('event_rejected', 'Event Rejected'),  
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

def send_reminder_notification(ticket: Ticket, hours_until: float):
    """Send reminder notification before event starts"""
    event = ticket.event
    
    # Format the time message based on hours
    if hours_until < 1:
        time_msg = f"{int(hours_until * 60)} minutes"
        notif_type = 'reminder_1h'
    elif hours_until < 2:
        time_msg = "1 hour"
        notif_type = 'reminder_1h'
    elif hours_until < 24:
        time_msg = f"{int(hours_until)} hours"
        notif_type = 'reminder_24h'
    elif hours_until < 48:
        time_msg = "tomorrow"
        notif_type = 'reminder_24h'
    else:
        days = int(hours_until / 24)
        time_msg = f"{days} days"
        notif_type = 'reminder_24h'
    
    message = f"Reminder: '{event.event_title}' starts in {time_msg}!"
    
    create_notification(
        user=ticket.attendee,
        message=message,
        notification_type=notif_type,
        related_ticket=ticket,
        related_event=event
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

def send_event_creation_notification_to_admins(event):
    """
    Send notification to all admins when a new event is created
    """
    from api.model.user import AttendeeUser
    
    # Get all admin users
    admins = AttendeeUser.objects.filter(role='admin')
    
    for admin in admins:
        try:
            notification = Notification.objects.create(
                user=admin,
                message=f"New event '{event.event_title}' created by {event.organizer.username} requires approval.",
                notification_type='event_pending_approval',
                related_event=event
            )
            print(f"✅ Admin notification sent to {admin.username} for event {event.id}")
        except Exception as e:
            print(f"❌ Failed to send admin notification to {admin.username}: {e}")


def send_event_approval_notification(event):
    """
    Send notification to organizer when their event is approved
    """
    try:
        notification = Notification.objects.create(
            user=event.organizer,
            message=f"Great news! Your event '{event.event_title}' has been approved and is now live.",
            notification_type='event_approved',
            related_event=event
        )
        print(f"✅ Event approval notification sent to {event.organizer.username}")
    except Exception as e:
        print(f"❌ Failed to send event approval notification: {e}")


def send_event_rejection_notification(event):
    """
    Send notification to organizer when their event is rejected
    """
    try:
        notification = Notification.objects.create(
            user=event.organizer,
            message=f"Your event '{event.event_title}' was not approved. Please contact support for more information.",
            notification_type='event_rejected',
            related_event=event
        )
        print(f"✅ Event rejection notification sent to {event.organizer.username}")
    except Exception as e:
        print(f"❌ Failed to send event rejection notification: {e}")