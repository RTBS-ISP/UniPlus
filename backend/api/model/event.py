from django.db import models
from django.contrib.auth.models import User

class Event(models.Model):
    event_title = models.CharField(max_length=200) 
    event_description = models.TextField()          
    event_create_date = models.DateTimeField(auto_now_add=True)
    start_date_register = models.DateTimeField(null=True, blank=True)
    end_date_register = models.DateTimeField(null=True, blank=True)
    max_attendee = models.IntegerField(default=100)
    is_online = models.BooleanField(default=False, null=True, blank=True)
    event_image = models.CharField(max_length=100, null=True, blank=True)
    
    # New fields - all nullable with defaults
    event_address = models.CharField(max_length=300, null=True, blank=True)
    event_meeting_link = models.CharField(max_length=200, null=True, blank=True)
    event_category = models.CharField(max_length=100, null=True, blank=True)
    tags = models.CharField(max_length=200, null=True, blank=True)
    whitelisted_emails = models.TextField(null=True, blank=True)
    blacklisted_emails = models.TextField(null=True, blank=True)
    status_registration = models.CharField(max_length=50, null=True, blank=True, default='open')
    event_email = models.EmailField(max_length=254, null=True, blank=True)
    event_phone_number = models.CharField(max_length=20, null=True, blank=True)
    event_website_url = models.URLField(max_length=200, null=True, blank=True)
    verification_status = models.CharField(max_length=50, null=True, blank=True)
    terms_and_conditions = models.TextField(null=True, blank=True)
    event_updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)


    def __str__(self):
        return self.event_title