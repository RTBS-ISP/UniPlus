"""
UniPlus API - Event Management System
"""

from ninja import NinjaAPI

from api.views import (
    auth,
    users,
    events,
    tickets,
    dashboard,
    approval,
    feedback,
    notifications,
    public_profile,
    verification,
)

api = NinjaAPI()

api.add_router("", auth.router)
api.add_router("", tickets.router)
api.add_router("", users.router)
api.add_router("", events.router)
api.add_router("", dashboard.router)
api.add_router("", approval.router)
api.add_router("", feedback.router)
api.add_router("", notifications.router)
api.add_router("", public_profile.router)
api.add_router("", verification.router)
