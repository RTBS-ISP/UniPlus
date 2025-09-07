from django.db import models
from django.utils import timezone
# from api.models.organizer import Organizer


class Event(models.Model):

    EVENT_CATEGORIES = [
        ('CONFERENCE', 'Conference'),
    ]

    DRESS_CODES = [
        ('CASUAL', 'Casual')
    ]

    STATUS_OF_REGISTRATION = [
        ('OPEN', 'Open'),
        ('CLOSED', 'Closed'),
        ('FULL', 'Full'),
    ]

    # Basic fields
    event_name = models.CharField(max_length=100)
    # organizer = models.ForeignKey(Organizer, on_delete=models.CASCADE, related_name='events')
    start_date_event = models.DateTimeField('Event Start Date')
    end_date_event = models.DateTimeField('Event End Date')
    description = models.TextField(max_length=400)
    max_attendee = models.PositiveIntegerField(null=True, blank=True)

    # Location
    address = models.CharField(max_length=500, null=True, blank=True)
    is_online = models.BooleanField(default=False)
    meeting_link = models.URLField(max_length=300, null=True, blank=True)

    # Category / dress code
    category = models.CharField(max_length=50, choices=EVENT_CATEGORIES, default='OTHER')
    dress_code = models.CharField(max_length=20, choices=DRESS_CODES, default='CASUAL')

    # Tickets / pricing
    is_free = models.BooleanField(default=True)
    ticket_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    # Contact info
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)

    # Time
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    status_registeration = models.CharField(
        max_length=20,
        choices=STATUS_OF_REGISTRATION,
        default='OPEN'
    )

    def __str__(self):
        return self.event_name