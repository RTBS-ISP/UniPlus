from django.db import models
from django.contrib.auth.models import AbstractUser
from event import Event

class EventSchedule(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="schedules")
    event_date = models.DateField()
    start_time_event = models.TimeField()
    end_time_event = models.TimeField()

    def __str__(self):
        return f"{self.event.event_title} on {self.event_date}"
