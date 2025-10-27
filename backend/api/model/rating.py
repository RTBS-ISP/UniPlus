from django.contrib.auth.models import AbstractUser
from django.db import models
from .user import AttendeeUser
from .event import Event

# class for leaving ratings like stars to events
class Rating(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="ratings")
    reviewer = models.ForeignKey(AttendeeUser, on_delete=models.CASCADE, related_name='ratings_given', null=True, blank=True)
    rates = models.PositiveIntegerField()
    liked_datetime = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.rates} by {self.user.email} for {self.event.event_title}"