from ninja import Schema
from pydantic import BaseModel, validator
from typing import Optional, Dict, Any, List
from datetime import datetime


class AboutMeSchema(BaseModel):
    faculty: str
    year: str
    organization_name: str

class RegisterSchema(BaseModel):
    username: str
    email: str
    password: str
    first_name: str
    last_name: str
    phone_number: str
    about_me: Dict[str, Any]
    role: str

# For login input
class LoginSchema(Schema):
    email: str
    password: str   
    
class TicketInfoSchema(Schema):
    date: Optional[str] = None
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
     
# For returning user data (no password)
class UserSchema(Schema):
    username: str
    email: str
    firstName: str = None
    lastName: str = None
    phone: str = None
    role: str = None
    aboutMe: Optional[Dict[str, Any]] = None
    profilePic: Optional[str] = None
    tickets: List[TicketInfoSchema] = [] 

class UpdateUserSchema(Schema):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    phone: Optional[str] = None
    aboutMe: Optional[Dict[str, Any]] = None
    profilePic: Optional[str] = None
    
# Generic success/failure messages
class MessageSchema(Schema):
    message: str

class ErrorSchema(Schema):
    error: str

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


class UserEventSchema(Schema):
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

class EventDetailSchema(Schema):
    id: int
    title: str  
    event_title: str
    event_description: str
    excerpt: str  
    organizer_username: str
    host: List[str]  
    start_date_register: datetime
    end_date_register: datetime
    event_start_date: datetime  
    event_end_date: datetime   
    max_attendee: int
    capacity: int  
    current_attendees: int
    available: int  
    event_address: str
    location: str  
    is_online: bool
    event_meeting_link: str
    tags: list
    event_image: Optional[str] = None
    image: Optional[str] = None  
    is_registered: bool
    schedule: Optional[List[Dict[str, Any]]] = []

class TicketDetailSchema(Schema):
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
