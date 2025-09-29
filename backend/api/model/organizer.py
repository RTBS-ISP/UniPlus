from django.db import models
from django.contrib.auth.models import AbstractUser
from .user import AttendeeUser

class OrganizerUser(models.Model):
    user = models.OneToOneField(AttendeeUser, on_delete=models.CASCADE, related_name="organizer")
    organization_category = models.CharField(max_length=100)
    organization_logo = models.ImageField(upload_to="org_logos/", blank=True, null=True)
    organization_description = models.TextField(blank=True, null=True)
    verification_status = models.CharField(max_length=50, blank=True, null=True)
    creation_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Organizer: {self.user.email}"