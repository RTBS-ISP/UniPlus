# from django.contrib.auth.models import AbstractUser
# from django.db import models
 
# class CustomUser(AbstractUser):
#     email = models.EmailField(unique=True)
 
#     USERNAME_FIELD = 'email'
#     REQUIRED_FIELDS = ['username']
 
#     def __str__(self):
#         return self.email
    

from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)

    ROLE_CHOICES = [
    ("student", "Student"),
    ("organizer", "Organizer"),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="student")

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return f"{self.username} ({self.role})"