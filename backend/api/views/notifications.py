from ninja import Router
from ninja.security import django_auth

from api.schemas import (
    NotificationOut,
    NotificationMarkReadIn,
)
from api.model.notification import Notification

router = Router(tags=["notifications"])


@router.get("/notifications", response=list[NotificationOut], auth=django_auth)
def get_notifications(request):
    """Get all notifications for the logged-in user."""
    user = request.user

    try:
        notifications = Notification.objects.filter(user=user).select_related(
            "related_ticket",
            "related_event",
        )[:50]

        result: list[NotificationOut] = []
        for notif in notifications:
            event_title = None
            if notif.related_event:
                event_title = notif.related_event.event_title

            result.append(
                NotificationOut(
                    id=notif.id,
                    message=notif.message,
                    notification_type=notif.notification_type,
                    is_read=notif.is_read,
                    created_at=notif.created_at,
                    related_ticket_id=notif.related_ticket_id,
                    related_event_id=notif.related_event_id,
                    event_title=event_title,
                )
            )

        return result
    except Exception as e:
        print(f"Error loading notifications: {e}")
        return []


@router.get("/notifications/unread-count", auth=django_auth)
def get_unread_count(request):
    """Get count of unread notifications."""
    user = request.user
    count = Notification.objects.filter(user=user, is_read=False).count()
    return {"count": count}


@router.post("/notifications/mark-read", auth=django_auth)
def mark_notification_read(request, data: NotificationMarkReadIn):
    """Mark a single notification as read."""
    user = request.user

    try:
        notification = Notification.objects.get(id=data.notification_id, user=user)
        notification.mark_as_read()
        return {"success": True, "message": "Notification marked as read"}
    except Notification.DoesNotExist:
        return {"success": False, "error": "Notification not found"}


@router.post("/notifications/mark-all-read", auth=django_auth)
def mark_all_notifications_read(request):
    """Mark all notifications as read for the user."""
    user = request.user
    Notification.objects.filter(user=user, is_read=False).update(is_read=True)
    return {"success": True, "message": "All notifications marked as read"}


@router.delete("/notifications/{notification_id}", auth=django_auth)
def delete_notification(request, notification_id: int):
    """Delete a specific notification."""
    user = request.user

    try:
        notification = Notification.objects.get(id=notification_id, user=user)
        notification.delete()
        return {"success": True, "message": "Notification deleted"}
    except Notification.DoesNotExist:
        return {"success": False, "error": "Notification not found"}


@router.delete("/notifications/clear-all", auth=django_auth)
def clear_all_notifications(request):
    """Delete all notifications for the user."""
    user = request.user
    count = Notification.objects.filter(user=user).count()
    Notification.objects.filter(user=user).delete()
    return {"success": True, "message": f"{count} notifications cleared"}
