from django.contrib.auth.models import AbstractUser
from django.db import models
from user import AttendeeUser
from event import Event
from organizer import OrganizerUser

class Rating(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="ratings")
    organizer = models.ForeignKey(OrganizerUser, on_delete=models.CASCADE, related_name="ratings")
    user = models.ForeignKey(AttendeeUser, on_delete=models.CASCADE, related_name="ratings")
    rates = models.PositiveIntegerField()
    liked_datetime = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.rates} by {self.user.email} for {self.event.event_title}"