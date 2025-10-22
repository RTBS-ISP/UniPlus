from django.db import models
from .user import AttendeeUser
from .event import Event

class Comment(models.Model):
    event_id = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="comments", db_column='event_id')
    author_id = models.ForeignKey(AttendeeUser, on_delete=models.CASCADE, related_name="comments", db_column='author_id')
    content = models.TextField()
    content_created_at = models.DateTimeField(auto_now_add=True)
    content_updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'api_comment'

    def __str__(self):
        return f"Comment by {self.author_id.email} on {self.event_id.event_title}"