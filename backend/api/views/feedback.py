import json
import traceback
from typing import List

from ninja import Router
from ninja.security import django_auth
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Avg, Count

from api import schemas
from api.model.event import Event
from api.model.comment import Comment
from api.model.rating import Rating
from api.model.ticket import Ticket
from api.model.event_feedback import EventFeedback

router = Router(tags=["feedback"])


@router.post(
    "/events/{event_id}/comments",
    auth=django_auth,
    response={200: schemas.SuccessSchema, 400: schemas.ErrorSchema},
)
def add_comment(request, event_id: int, payload: schemas.CommentCreateSchema):
    """Add or update a comment for an event."""
    try:
        event = get_object_or_404(Event, id=event_id)
        user = request.user

        has_ticket = Ticket.objects.filter(event=event, attendee=user).exists()
        if not has_ticket:
            return 400, {"error": "You must have attended this event to leave a comment"}

        if not payload.content or not payload.content.strip():
            return 400, {"error": "Comment content cannot be empty"}

        existing_comment = Comment.objects.filter(event_id=event, author_id=user).first()
        if existing_comment:
            existing_comment.content = payload.content.strip()
            existing_comment.save()
            message = "Comment updated successfully"
            comment_id = existing_comment.id
        else:
            comment = Comment.objects.create(
                event_id=event,
                author_id=user,
                content=payload.content.strip(),
            )
            message = "Comment added successfully"
            comment_id = comment.id

        return 200, {"success": True, "message": message, "comment_id": comment_id}
    except Event.DoesNotExist:
        return 400, {"error": "Event not found"}
    except Exception as e:
        print(f"Error adding comment: {str(e)}")
        return 400, {"error": str(e)}


@router.post(
    "/events/{event_id}/ratings",
    auth=django_auth,
    response={200: schemas.SuccessSchema, 400: schemas.ErrorSchema},
)
def add_rating(request, event_id: int, payload: schemas.RatingCreateSchema):
    """Add or update a rating for an event."""
    try:
        event = get_object_or_404(Event, id=event_id)
        user = request.user

        has_ticket = Ticket.objects.filter(event=event, attendee=user).exists()
        if not has_ticket:
            return 400, {"error": "You must have attended this event to leave a rating"}

        existing_rating = Rating.objects.filter(event_id=event, reviewer_id=user).first()

        if existing_rating:
            existing_rating.rates = payload.rates
            existing_rating.save()
            message = "Rating updated successfully"
        else:
            Rating.objects.create(
                event_id=event,
                reviewer_id=user,
                rates=payload.rates,
            )
            message = "Rating added successfully"

        return 200, {"success": True, "message": message}

    except Event.DoesNotExist:
        return 400, {"error": "Event not found"}
    except Exception as e:
        print(f"Error adding rating: {str(e)}")
        return 400, {"error": str(e)}


@router.get(
    "/events/{event_id}/comments",
    response=schemas.EventCommentsResponse,
)
def get_event_comments(request, event_id: int):
    """Get all comments and ratings for an event."""
    try:
        event = get_object_or_404(Event, id=event_id)

        comments = Comment.objects.filter(event_id=event).select_related("author_id").order_by(
            "-content_created_at"
        )

        comments_data = []
        for comment in comments:
            user_name = f"{comment.author_id.first_name} {comment.author_id.last_name}".strip()
            if not user_name:
                user_name = comment.author_id.username or comment.author_id.email

            comments_data.append(
                {
                    "id": comment.id,
                    "event_id": comment.event_id.id,
                    "user_id": comment.author_id.id,
                    "organizer_id": event.organizer.id,
                    "content": comment.content,
                    "content_created_at": comment.content_created_at.isoformat()
                    if comment.content_created_at
                    else None,
                    "content_updated_at": comment.content_updated_at.isoformat()
                    if comment.content_updated_at
                    else None,
                    "user_name": user_name,
                    "user_profile_pic": comment.author_id.profile_picture.url
                    if comment.author_id.profile_picture
                    else "/images/logo.png",
                }
            )

        ratings_agg = Rating.objects.filter(event_id=event).aggregate(
            average_rating=Avg("rates"),
            total_ratings=Count("id"),
        )

        average_rating = ratings_agg["average_rating"]
        if average_rating is not None:
            average_rating = round(average_rating, 1)
        else:
            average_rating = 0.0

        total_ratings = ratings_agg["total_ratings"] or 0

        return {
            "comments": comments_data,
            "average_rating": average_rating,
            "total_ratings": total_ratings,
        }

    except Event.DoesNotExist:
        return {"error": "Event not found"}
    except Exception as e:
        print(f"Error fetching comments for event {event_id}: {str(e)}")
        traceback.print_exc()
        return {"error": str(e)}


# ===== New EventFeedback endpoints =====


@router.post(
    "/events/{event_id}/feedback",
    auth=django_auth,
    response={200: schemas.EventFeedbackOutSchema, 400: schemas.ErrorSchema},
)
def submit_event_feedback(request, event_id: int, payload: schemas.EventFeedbackCreateSchema):
    """
    One feedback per user per event.
    Only after the event has ended and user has a ticket.
    """
    try:
        event = get_object_or_404(Event, id=event_id)
        user = request.user

        has_ticket = Ticket.objects.filter(event=event, attendee=user).exists()
        if not has_ticket:
            return 400, {"error": "You must have attended this event to leave feedback"}

        if not event.event_end_date or event.event_end_date > timezone.now():
            return 400, {"error": "You can only leave feedback after the event has ended"}

        existing = EventFeedback.objects.filter(event=event, user=user).first()
        if existing:
            return 400, {"error": "You have already submitted feedback for this event"}

        if payload.rating < 1 or payload.rating > 5:
            return 400, {"error": "Rating must be between 1 and 5"}

        fb = EventFeedback.objects.create(
            event=event,
            user=user,
            rating=payload.rating,
            comment=(payload.comment or "").strip(),
            anonymous=bool(payload.anonymous or False),
        )

        return 200, {
            "id": fb.id,
            "rating": fb.rating,
            "comment": fb.comment,
            "created_at": fb.created_at,
            "updated_at": fb.updated_at,
            "anonymous": fb.anonymous,
        }

    except Exception as e:
        print(f"Error submitting feedback: {e}")
        return 400, {"error": str(e)}


@router.get(
    "/events/{event_id}/feedback/me",
    auth=django_auth,
    response={200: schemas.EventFeedbackOutSchema, 404: schemas.ErrorSchema},
)
def get_my_event_feedback(request, event_id: int):
    """Get current user's feedback for this event."""
    try:
        event = get_object_or_404(Event, id=event_id)
        user = request.user

        fb = EventFeedback.objects.filter(event=event, user=user).first()
        if not fb:
            return 404, {"error": "No feedback found"}

        user_obj = fb.user
        full_name = f"{user_obj.first_name} {user_obj.last_name}".strip()
        if not full_name:
            full_name = user_obj.username or user_obj.email

        return 200, {
            "id": fb.id,
            "rating": fb.rating,
            "comment": fb.comment or "",
            "created_at": fb.created_at,
            "updated_at": fb.updated_at,
            "user_name": full_name,
            "user_email": user_obj.email,
            "anonymous": fb.anonymous,
        }

    except Exception as e:
        print(f"Error loading feedback: {e}")
        return 404, {"error": "No feedback found"}


@router.get(
    "/events/{event_id}/feedback/all",
    auth=django_auth,
    response={200: List[schemas.EventFeedbackOutSchema], 403: schemas.ErrorSchema, 404: schemas.ErrorSchema},
)
def get_event_feedback_list(request, event_id: int):
    """Get all feedback entries for an event (organizer/admin only)."""
    event = get_object_or_404(Event, id=event_id)

    if event.organizer != request.user and getattr(request.user, "role", None) != "admin":
        return 403, {"error": "You are not authorized to view feedback for this event"}

    feedback_qs = (
        EventFeedback.objects.filter(event=event)
        .select_related("user")
        .order_by("-created_at")
    )

    result = []
    for fb in feedback_qs:
        user = fb.user

        if fb.anonymous:
            full_name = "Anonymous"
            email = None
        else:
            full_name = f"{user.first_name} {user.last_name}".strip()
            if not full_name:
                full_name = user.username or user.email
            email = user.email

        result.append(
            {
                "id": fb.id,
                "rating": fb.rating,
                "comment": fb.comment or "",
                "created_at": fb.created_at,
                "updated_at": fb.updated_at,
                "user_name": full_name,
                "user_email": email,
                "anonymous": fb.anonymous,
            }
        )

    return 200, result


@router.get(
    "/events/{event_id}/feedback/report",
    auth=django_auth,
    response={200: schemas.EventFeedbackReportSchema, 403: schemas.ErrorSchema, 400: schemas.ErrorSchema},
)
def get_event_feedback_report(request, event_id: int):
    """
    Full feedback report for an event (organizer/admin only).
    Includes aggregates + all feedback + optional AI summary via n8n.
    """
    try:
        event = get_object_or_404(Event, id=event_id)

        if event.organizer != request.user and getattr(request.user, "role", None) != "admin":
            return 403, {"error": "You are not authorized to view feedback for this event"}

        qs = (
            EventFeedback.objects.filter(event=event)
            .select_related("user")
            .order_by("-created_at")
        )

        total = qs.count()
        rating_counts = {i: qs.filter(rating=i).count() for i in range(1, 6)}
        avg_rating = float(qs.aggregate(avg=Avg("rating"))["avg"] or 0.0)
        anonymous_count = qs.filter(anonymous=True).count()

        feedback_list = []
        comments_exist = False

        for fb in qs:
            user = fb.user

            full_name = f"{user.first_name} {user.last_name}".strip()
            if not full_name:
                full_name = user.username or user.email

            comment = fb.comment or ""
            if comment.strip():
                comments_exist = True

            feedback_list.append(
                {
                    "id": fb.id,
                    "rating": fb.rating,
                    "comment": comment,
                    "created_at": fb.created_at,
                    "updated_at": fb.updated_at,
                    "user_name": "Anonymous" if fb.anonymous else full_name,
                    "user_email": None if fb.anonymous else user.email,
                    "anonymous": fb.anonymous,
                }
            )

        ai_summary = ""
        try:
            from django.conf import settings
            import requests

            n8n_url = getattr(settings, "N8N_FEEDBACK_SUMMARY_URL", None)

            if n8n_url and comments_exist:
                payload = {
                    "event_title": event.event_title,
                    "feedback": [
                        {"rating": fb.rating, "comment": fb.comment or ""} for fb in qs
                    ],
                }

                resp = requests.post(n8n_url, json=payload, timeout=20)
                resp.raise_for_status()

                data = resp.json()

                if isinstance(data, dict):
                    ai_summary = (data.get("output") or "").strip()
                elif isinstance(data, list) and data and isinstance(data[0], dict):
                    ai_summary = (data[0].get("output") or "").strip()
        except Exception:
            ai_summary = ""

        return 200, {
            "aggregates": {
                "total": total,
                "average_rating": avg_rating,
                "rating_counts": rating_counts,
                "anonymous_count": anonymous_count,
            },
            "ai_summary": ai_summary,
            "feedback": feedback_list,
        }

    except Exception:
        return 400, {"error": "Failed to build feedback report"}
