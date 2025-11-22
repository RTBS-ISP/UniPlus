from django.db import models
from .event import Event
from .user import AttendeeUser


class EventFeedback(models.Model):
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="feedbacks",
    )
    user = models.ForeignKey(
        AttendeeUser,
        on_delete=models.CASCADE,
        related_name="event_feedbacks",
    )
    rating = models.PositiveSmallIntegerField()  # 1–5
    comment = models.TextField(blank=True)
    anonymous = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("event", "user")  # one feedback per user per event
        ordering = ["-created_at"]

    def __str__(self):
        return f"Feedback(event={self.event_id}, user={self.user_id}, rating={self.rating})"
