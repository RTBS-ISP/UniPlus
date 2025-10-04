from django.db import models
from .socials import Social
from .user import AttendeeUser

class Event(models.Model):
    organizer = models.ForeignKey(AttendeeUser, on_delete=models.CASCADE, related_name="events")
    social = models.ForeignKey(Social, on_delete=models.SET_NULL, null=True, blank=True, related_name="events")
    event_title = models.CharField(max_length=200)
    event_description = models.TextField()
    event_create_date = models.DateTimeField(auto_now_add=True)
    start_date_register = models.DateTimeField()
    end_date_register = models.DateTimeField()
    max_attendee = models.PositiveIntegerField(blank=True, null=True)
    event_address = models.CharField(max_length=300, blank=True, null=True)
    event_image = models.ImageField(upload_to="event_images/", blank=True, null=True)
    is_online = models.BooleanField(default=False)
    event_meeting_link = models.URLField(blank=True, null=True)
    event_category = models.CharField(max_length=100, blank=True, null=True)
    tags = models.CharField(max_length=200, blank=True, null=True)
    whitelisted_emails = models.TextField(blank=True, null=True)
    blacklisted_emails = models.TextField(blank=True, null=True)
    status_registration = models.CharField(max_length=50, default="OPEN")
    event_email = models.EmailField(blank=True, null=True)
    event_phone_number = models.CharField(max_length=20, blank=True, null=True)
    event_website_url = models.URLField(blank=True, null=True)
    verification_status = models.CharField(max_length=50, blank=True, null=True)
    terms_and_conditions = models.TextField(blank=True, null=True)
    event_updated_at = models.DateTimeField(auto_now=True)
    attendee = models.JSONField(default=list, blank=True)

    def __str__(self):
        return self.event_title
