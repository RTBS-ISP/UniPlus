from django.db import models
from django.contrib.auth.models import AbstractUser


# model for diffrent social medias of both users and organizers
class Social(models.Model):
    instagram = models.URLField(blank=True, null=True)
    facebook = models.URLField(blank=True, null=True)
    tiktok = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"Social {self.id}"