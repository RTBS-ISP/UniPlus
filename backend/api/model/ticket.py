from django.db import models
from django.contrib.auth.models import AbstractUser
from .user import AttendeeUser
from .event import Event

# class for making a ticket for events
class Ticket(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="tickets")
    organizer = models.ForeignKey(AttendeeUser, on_delete=models.CASCADE, related_name="tickets")
    attendee_user = models.ForeignKey(AttendeeUser, on_delete=models.CASCADE, related_name="tickets")

    ticket_title = models.CharField(max_length=100)
    ticket_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_online = models.BooleanField(default=False)
    meeting_link = models.URLField(blank=True, null=True)
    qr_code = models.CharField(max_length=200, blank=True, null=True)
    status = models.CharField(max_length=50, default="ACTIVE")

    def __str__(self):
        return f"Ticket: {self.ticket_title} ({self.event.event_title})"
