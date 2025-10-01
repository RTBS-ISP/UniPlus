from django.db import models
from django.contrib.auth.models import User

class Event(models.Model):
    event_name = models.CharField(max_length=200)
    number_of_students = models.IntegerField()
    faculty = models.CharField(max_length=100)
    years = models.JSONField()  # Store list of years as JSON
    descriptions = models.TextField()
    host = models.CharField(max_length=100)
    attendees = models.JSONField()  # Store list of attendees as JSON
    picture = models.ImageField(upload_to='events/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.event_name
    
