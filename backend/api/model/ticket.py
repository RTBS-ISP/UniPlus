from django.db import models
from .user import AttendeeUser
from .event import Event


class Ticket(models.Model):
    attendee = models.ForeignKey(
        AttendeeUser, 
        on_delete=models.CASCADE, 
        related_name='my_tickets',
        null=True,
        blank=True
    )
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='event_tickets')
    qr_code = models.CharField(max_length=255, unique=True)
    purchase_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='active')
    event_date = models.DateTimeField(null=True, blank=True)
    user_name = models.CharField(max_length=255, default='Unknown') 
    user_email = models.EmailField(default='no-email@example.com') 
    event_title = models.CharField(max_length=255, default='Untitled Event')  
    start_date = models.DateTimeField(null=True, blank=True)  
    location = models.CharField(max_length=255, default='TBA')  
    is_online = models.BooleanField(default=False)
    meeting_link = models.URLField(blank=True, null=True)
    ticket_number = models.CharField(max_length=50, blank=True, null=True)
    event_dates = models.JSONField(default=list, blank=True)

    approval_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('approved', 'Approved'),
            ('rejected', 'Rejected')
        ],
        default='pending'
    )
    checked_in_at = models.DateTimeField(null=True, blank=True)
    checked_in_dates = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"Ticket: {self.event_title} ({self.event.event_title})"
    
    def save(self, *args, **kwargs):
        if not self.ticket_number:
            import random
            self.ticket_number = f"T{random.randint(100000, 999999)}"
        super().save(*args, **kwargs)
