from django.db import models
from django.contrib.auth.models import AbstractUser
from .user import AttendeeUser

class AdminUser(models.Model):
    user = models.OneToOneField(AttendeeUser, on_delete=models.CASCADE, related_name="admin")
    is_active = models.BooleanField(default=True)
    is_superadmin = models.BooleanField(default=False)
    creation_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Admin: {self.user.email}"
