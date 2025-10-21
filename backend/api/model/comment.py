from django.db import models
from .user import AttendeeUser
from .event import Event

class Comment(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey(AttendeeUser,on_delete=models.CASCADE,related_name="user_id")
    organizer = models.ForeignKey(AttendeeUser,on_delete=models.CASCADE,related_name="organizer_id")

    content = models.TextField()
    content_created_at = models.DateTimeField(auto_now_add=True)
    content_updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Comment by {self.user.email if self.user else 'Anonymous'} on {self.event.event_title}"
