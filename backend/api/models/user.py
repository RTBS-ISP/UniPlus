from django.db import models
from django.contrib.auth.models import AbstractUser


class AttendeeUser(AbstractUser):

    username = models.CharField(max_length=150, unique=True, null=True, blank=True)  # Optional field
    first_name = models.CharField(max_length=100, null=False, blank=False)
    last_name = models.CharField(max_length=100, null=False, blank=False)
    birth_date = models.DateField('Birth Date', null=True, blank=True)
    phone_number = models.CharField(max_length=50, null=True, blank=False, ) # Max number
    status = models.CharField(max_length=50, null=True, blank=True, default='Attendee')
    email = models.EmailField(unique=True, null=False, blank=False) 
    address = models.CharField(max_length=500, null = True, blank = True, default= " ")
