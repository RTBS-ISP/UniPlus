from django.contrib.auth.models import AbstractUser
from django.db import models    
from .user import AttendeeUser
from .event import Event

# class for leaving ratings like stars to events
class Rating(models.Model):
    event_id = models.ForeignKey(Event,on_delete=models.CASCADE, related_name="ratings", db_column='event_id',null=True,blank=True)
    reviewer_id = models.ForeignKey(AttendeeUser, on_delete=models.CASCADE, related_name="ratings", db_column='reviewer_id',null=True,blank=True)
    rates = models.PositiveIntegerField()
    liked_datetime = models.DateTimeField(auto_now_add=True, db_column='liked_datetime')

    class Meta:
        db_table = 'api_rating'

    def __str__(self):
        return f"{self.rates} stars by {self.reviewer_id.email} for {self.event_id.event_title}"