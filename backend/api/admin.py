from django.contrib import admin

from api.models.event import Event

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('event_name', 'start_date_event', 'end_date_event', 'category', 'is_online')