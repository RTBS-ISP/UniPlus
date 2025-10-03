from django.db import models
from django.contrib.auth.models import AbstractUser
from .user import AttendeeUser
from .event import Event


# this class is used for the comment table for event feedback
class Comment(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(AttendeeUser, on_delete=models.CASCADE, related_name='comments', null=True, blank=True)
    content = models.TextField()
    content_created_at = models.DateTimeField(auto_now_add=True)
    content_updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Comment by {self.user.email} on {self.event.event_title}"