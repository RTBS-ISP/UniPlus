from ninja import Schema
from pydantic import BaseModel, validator
from typing import Optional, Dict, Any, List
from datetime import datetime

class UserTicketSchema(Schema):
    ticket_id: int
    qr_code: str
    event_id: Optional[int]
    event_title: str
    event_description: Optional[str]
    event_image: Optional[str]
    organizer_name: Optional[str]
    organizer_id: Optional[int]
    date: Optional[str]
    time: Optional[str]
    location: Optional[str]
    is_online: bool
    event_meeting_link: Optional[str]
    event_dates: List[dict]
    approval_status: str
    purchase_date: Optional[str]
    checked_in_at: Optional[str]
    status: str

class UserTicketsResponse(Schema):
    tickets: List[UserTicketSchema]
    total_count: int
    pending_count: int
    approved_count: int
    rejected_count: int


# ============================================================================
# USER SCHEMAS
# ============================================================================

class AboutMeSchema(BaseModel):
    """Structured about me data - stored as JSON in database"""
    year: str  # e.g., "1", "2", "3", "4"
    faculty: str  # e.g., "Engineering", "Economics", "Science"
    bio: Optional[str] = None  # Optional bio text
    organization_name: Optional[str] = None  # For organizers


class RegisterSchema(BaseModel):
    username: str
    email: str
    password: str
    first_name: str
    last_name: str
    phone_number: str
    about_me: Dict[str, Any]  # Will be validated as AboutMeSchema
    role: str  # "student", "professor", "organizer"


class LoginSchema(Schema):
    email: str
    password: str


class UserSchema(Schema):
    """Basic user data returned in API responses"""
    username: str
    email: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    aboutMe: Optional[Dict[str, Any]] = None
    profilePic: Optional[str] = None


class PublicProfileSchema(Schema):
    """Public profile view for organizers (clickable from event pages)"""
    username: str
    first_name: str
    last_name: str
    role: str
    about_me: Optional[Dict[str, Any]] = None
    profile_pic: Optional[str] = None
    # Stats
    events_organized: int = 0
    total_attendees: int = 0
    avg_rating: Optional[float] = None


class UpdateUserSchema(Schema):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    phone: Optional[str] = None
    aboutMe: Optional[Dict[str, Any]] = None
    profilePic: Optional[str] = None


# ============================================================================
# EVENT SCHEMAS
# ============================================================================

class EventDateSchema(Schema):
    """Single day within a multi-day event"""
    date: str  # ISO format: "2025-11-06"
    time: str  # "14:00"
    endTime: Optional[str] = None  # "16:00"
    location: str
    is_online: bool
    meeting_link: Optional[str] = None


# Standard success response schema
class SuccessSchema(Schema):
    success: bool
    message: str = None
    user: UserSchema = None
    event_id: Optional[int] = None
    tickets_count: Optional[int] = None
    ticket_numbers: Optional[List[str]] = None


# Event Schema for event creation with validators for optional fields
class EventCreateSchema(Schema):
    """Schema for creating new events"""
    event_title: str
    event_description: str
    category: Optional[str] = None
    start_date_register: datetime
    end_date_register: datetime
    schedule_days: List[Dict[str, Any]]  
    max_attendee: Optional[int] = None
    event_address: Optional[str] = None 
    is_online: bool = False
    event_meeting_link: Optional[str] = None
    tags: Optional[List[str]] = None
    event_email: Optional[str] = None
    event_phone_number: Optional[str] = None
    event_website_url: Optional[str] = None
    terms_and_conditions: Optional[str] = None
    
    # Validators to handle empty strings as None
    @validator('event_email', 'event_phone_number', 'event_website_url', 'event_address', 'event_meeting_link', 'terms_and_conditions', pre=True)
    def empty_str_to_none(cls, v):
        if v == '':
            return None
        return v

class EventSchema(Schema):
    """Basic event listing schema"""
    id: int
    event_title: str
    event_description: str
    organizer_username: str
    event_create_date: datetime
    start_date_register: datetime
    end_date_register: datetime
    event_start_date: datetime 
    event_end_date: datetime   
    max_attendee: Optional[int] = None
    current_attendees: int
    event_address: Optional[str] = None
    is_online: bool
    status_registration: str
    attendee: list
    tags: list
    event_image: Optional[str] = None
    schedule: Optional[List[Dict[str, Any]]] = None


class EventDetailSchema(Schema):
    """Detailed event information for event detail page"""
    id: int
    title: str  # Alias for event_title
    event_title: str
    event_description: str
    excerpt: str  # Short description
    organizer_username: str
    host: List[str]  # Array with organizer username
    start_date_register: datetime
    end_date_register: datetime
    event_start_date: datetime
    event_end_date: datetime
    max_attendee: Optional[int] = None
    capacity: Optional[int] = None  # Alias for max_attendee
    current_attendees: int
    available: int  # max_attendee - current_attendees
    event_address: Optional[str] = None
    location: Optional[str] = None  # Alias for event_address
    is_online: bool
    event_meeting_link: Optional[str] = None
    tags: list
    event_image: Optional[str] = None
    image: Optional[str] = None  # Alias for event_image
    is_registered: bool  # Whether current user is registered
    schedule: Optional[List[Dict[str, Any]]] = []
    
    # Organizer info
    organizer_role: Optional[str] = None
    organizer_profile: Optional[PublicProfileSchema] = None


class EventFilterSchema(Schema):
    """Filtering options for event list"""
    tags: Optional[List[str]] = None
    is_online: Optional[bool] = None
    start_date_from: Optional[datetime] = None
    start_date_to: Optional[datetime] = None
    organizer: Optional[str] = None
    status: Optional[str] = None  # OPEN/CLOSED


# ============================================================================
# TICKET SCHEMAS
# ============================================================================

class TicketInfoSchema(Schema):
    """Basic ticket information embedded in user profile"""
    date: Optional[str] = None  # Deprecated - use event_dates
    time: Optional[str] = None
    location: Optional[str] = None
    organizer: Optional[str] = None
    user_information: Optional[Dict[str, str]] = None
    event_title: Optional[str] = None
    event_description: Optional[str] = None
    ticket_number: Optional[str] = None
    event_id: Optional[int] = None
    is_online: bool = False
    event_meeting_link: Optional[str] = None
    event_dates: List[EventDateSchema] = []  # All days for multi-day events
    approval_status: str = "pending"  # pending/approved/rejected
    purchase_date: Optional[datetime] = None


class TicketSchema(Schema):
    """Base ticket representation"""
    id: int
    ticket_number: str
    qr_code: str
    status: str  # active/cancelled/used
    approval_status: str  # pending/approved/rejected
    purchase_date: datetime
    checked_in_at: Optional[datetime] = None


class TicketWithEventSchema(TicketSchema):
    """Ticket with embedded event info (for My Tickets page)"""
    event_id: int
    event_title: str
    event_description: str
    organizer_username: str
    is_online: bool
    event_dates: List[EventDateSchema]  # All days for this event


class TicketDetailSchema(Schema):
    """Full ticket detail for QR code scanning page"""
    ticket_number: str
    qr_code: str
    event_title: str
    event_description: str
    start_date: datetime
    location: str
    event_date: str  
    meeting_link: Optional[str] = None
    is_online: bool
    organizer: str
    user_name: str
    user_email: str
    event_dates: List[EventDateSchema] = []  
    approval_status: str
    checked_in_at: Optional[datetime] = None


class UserEventSchema(Schema):
    """User's registered events (legacy - consider deprecating in favor of TicketWithEventSchema)"""
    id: int
    event_title: str
    event_description: str
    event_address: Optional[str]
    is_online: bool
    event_meeting_link: Optional[str]
    start_date_register: datetime
    end_date_register: datetime
    organizer_username: str
    registration_date: datetime
    ticket_number: str


# ============================================================================
# APPROVAL & DASHBOARD SCHEMAS
# ============================================================================

class AttendeeSchema(Schema):
    """Attendee information for organizer dashboard"""
    ticketId: str
    displayTicketId: Optional[str] = None
    name: str
    email: str
    status: str  # 'present', 'pending', 'absent'
    approvalStatus: str  # 'approved', 'pending', 'rejected'
    registered: str  # ISO datetime string
    approvedAt: Optional[str] = None   
    rejectedAt: Optional[str] = None 
    checkedIn: str  # ISO datetime string or empty
    eventDate: str  # Which day they're registered for (multi-day support)
    # User profile info
    phone: Optional[str] = None
    role: Optional[str] = None
    about_me: Optional[Dict[str, Any]] = None
    checkedInDates: Dict[str, str] = {}


class ApprovalRequestSchema(Schema):
    """Request to approve/reject registrations"""
    ticket_ids: List[str]  # Support bulk actions
    action: str  # 'approve' or 'reject'
    reason: Optional[str] = None  # Optional reason for rejection


class ApprovalResponseSchema(Schema):
    """Response after approval/rejection action"""
    success: bool
    message: str
    ticket_id: str
    status: str  # 'approved' or 'rejected'
    processed_count: Optional[int] = None  # For bulk actions


class ScheduleDaySchema(Schema):
    """Single day in event schedule"""
    date: str
    label: str  # e.g., "Day 1", "Day 2"
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    location: str
    is_online: bool
    meeting_link: Optional[str] = None


class DashboardEventSchema(Schema):
    """Event summary for dashboard"""
    id: int
    title: str
    description: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    max_attendee: Optional[int] = None


class DashboardStatisticsSchema(Schema):
    """Statistics for event dashboard"""
    total_registered: int
    checked_in: int
    pending: int
    approved: int
    pending_approval: int
    rejected: int
    attendance_rate: Optional[float] = None  # checked_in / approved


class EventDashboardSchema(Schema):
    """Complete event dashboard data for organizers"""
    event: DashboardEventSchema
    schedule_days: List[ScheduleDaySchema]
    attendees: List[AttendeeSchema]
    statistics: DashboardStatisticsSchema


class OrganizerDashboardSchema(Schema):
    """Organizer's main dashboard overview"""
    total_events: int
    upcoming_events: int
    past_events: int
    total_registrations: int
    pending_approvals: int  # Total pending across all events
    events_with_pending: List[Dict[str, Any]]  # [{event_id, event_title, pending_count}, ...]


# ============================================================================
# CHECK-IN SCHEMAS
# ============================================================================

class CheckInRequestSchema(Schema):
    """Request to check in an attendee"""
    qr_code: str
    event_date: Optional[str] = None  # Which day for multi-day events


class CheckInResponseSchema(Schema):
    """Response after check-in attempt"""
    success: bool
    message: str
    ticket_id: str
    attendee_name: str
    event_title: str
    event_date: Optional[str] = None
    already_checked_in: bool = False
    checked_in_at: Optional[str] = None
    approval_status: str


# ============================================================================
# GENERIC RESPONSE SCHEMAS
# ============================================================================

class MessageSchema(Schema):
    message: str


class ErrorSchema(Schema):
    error: str


class SuccessSchema(Schema):
    success: bool
    message: Optional[str] = None
    user: Optional[UserSchema] = None
    event_id: Optional[int] = None
    tickets_count: Optional[int] = None
    ticket_numbers: Optional[List[str]] = None


class PaginationSchema(Schema):
    """Pagination metadata"""
    page: int = 1
    page_size: int = 20
    total_items: int
    total_pages: int


class PaginatedEventsSchema(Schema):
    """Paginated event list response"""
    events: List[EventSchema]
    pagination: PaginationSchema


# ============================================================================
# STATISTICS SCHEMAS
# ============================================================================

class EventStatisticsSchema(Schema):
    """Detailed statistics for a single event"""
    event_id: int
    total_registered: int
    checked_in_count: int
    pending_approval_count: int
    approved_count: int
    rejected_count: int
    attendance_rate: Optional[float] = None  # checked_in / approved
    daily_stats: Optional[List[Dict[str, Any]]] = None  # Per-day breakdown


class UserStatisticsSchema(Schema):
    """User statistics for profile page"""
    total_events_attended: int
    upcoming_events: int
    past_events: int
    pending_registrations: int
    # For organizers:
    events_organized: Optional[int] = None
    total_attendees: Optional[int] = None


class CommentCreateSchema(Schema):
    content: str

class RatingCreateSchema(Schema):
    rates: int

class CommentResponseSchema(Schema):
    id: int
    event_id: int          
    user_id: int
    organizer_id: int
    content: str
    content_created_at: datetime
    content_updated_at: datetime
    user_name: str
    user_profile_pic: Optional[str] = None

class RatingResponseSchema(Schema):
    id: int
    event_id: int          
    organizer_id: int
    user_id: Optional[int] = None
    rates: int
    liked_date: datetime
    user_name: str

class EventCommentsResponse(Schema):
    comments: List[CommentResponseSchema]
    average_rating: float
    total_ratings: int

class ExportSuccessSchema(Schema):
    success: bool
    google_sheet: str
    total_count: int


class AdminEventSchema(Schema):
    id: int
    title: str
    event_title: str
    event_description: str
    event_create_date: str
    organizer_name: str
    organizer_id: int
    status_registration: str
    verification_status: str
      
      
class NotificationSchema(Schema):
    id: int
    notification_type: str
    title: str
    message: str
    event_id: Optional[int] = None
    event_title: Optional[str] = None
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None


class NotificationListResponse(Schema):
    """List of notifications with counts"""
    notifications: List[NotificationSchema]
    total_count: int
    unread_count: int


class MarkAsReadRequest(Schema):
    """Request to mark notifications as read"""
    notification_ids: List[int]


class MarkAsReadResponse(Schema):
    """Response after marking as read"""
    success: bool
    message: str
    marked_count: int

class NotificationOut(Schema):
    id: int
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime
    related_ticket_id: Optional[int] = None
    related_event_id: Optional[int] = None
    event_title: Optional[str] = None

class NotificationMarkReadIn(Schema):
    notification_id: int

class NotificationBulkMarkReadIn(Schema):
    notification_ids: list[int]
