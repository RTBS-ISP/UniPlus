from django.db import models
from .socials import Social
from .user import AttendeeUser

class Event(models.Model):
    schedule = models.JSONField(default=list, blank=True)
    organizer = models.ForeignKey(AttendeeUser, on_delete=models.CASCADE, related_name="events")
    social = models.ForeignKey(Social, on_delete=models.SET_NULL, null=True, blank=True, related_name="events")
    event_title = models.CharField(max_length=200)
    event_description = models.TextField()
    event_create_date = models.DateTimeField(auto_now_add=True)
    start_date_register = models.DateTimeField(blank=True, null=True)
    end_date_register = models.DateTimeField(blank=True, null=True)
    event_start_date = models.DateTimeField(blank=True, null=True)
    event_end_date = models.DateTimeField(blank=True, null=True)
    max_attendee = models.PositiveIntegerField(blank=True, null=True)
    available_spots = models.PositiveIntegerField(blank=True, null=True)  
    event_address = models.CharField(max_length=300, blank=True, null=True)
    event_image = models.ImageField(upload_to="event_images/", blank=True, null=True)
    is_online = models.BooleanField(default=False)
    event_meeting_link = models.URLField(blank=True, null=True)
    tags = models.CharField(max_length=200, blank=True, null=True)
    whitelisted_emails = models.TextField(blank=True, null=True)
    blacklisted_emails = models.TextField(blank=True, null=True)
    status_registration = models.CharField(max_length=50, default="OPEN")
    event_email = models.EmailField(blank=True, null=True)
    event_phone_number = models.CharField(max_length=20, blank=True, null=True)
    event_website_url = models.URLField(blank=True, null=True)
    verification_status = models.CharField(max_length=50, blank=True, null=True)
    terms_and_conditions = models.TextField(blank=True, null=True)
    event_updated_at = models.DateTimeField(auto_now=True)
    attendee = models.JSONField(default=list, blank=True)

    def save(self, *args, **kwargs):
        """
        Override save to auto-set available_spots
        """
        # ✅ FIX: Auto-set available_spots if not set
        if self.available_spots is None or self.available_spots == 0:
            if self.max_attendee is not None and self.max_attendee > 0:
                self.available_spots = self.max_attendee
            else:
                self.available_spots = 100  # Default fallback
        
        # ✅ FIX: Ensure verification_status is never None for new events
        if self.pk is None and not self.verification_status:
            # New event - set to pending
            self.verification_status = "pending"
        
        super().save(*args, **kwargs)
    
    def get_current_capacity(self):
        """
        Calculate real-time capacity based on approved tickets
        Returns: (registered_count, available_spots, max_attendee)
        """
        from .ticket import Ticket
        registered = Ticket.objects.filter(
            event=self,
            approval_status='approved'
        ).count()
        
        available = self.max_attendee - registered if self.max_attendee else 0
        
        return registered, available, self.max_attendee

    def __str__(self):
        return self.event_title
    
    class Meta:
        ordering = ['-event_create_date']