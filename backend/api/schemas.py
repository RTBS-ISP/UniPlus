from ninja import Schema
from pydantic import BaseModel
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

# For returning user data (no password)
class UserSchema(Schema):
    username: str
    email: str

# Generic success/failure messages
class MessageSchema(Schema):
    message: str

class ErrorSchema(Schema):
    error: str

# Standard success response (optionally with user info)
class SuccessSchema(Schema):
    success: bool
    message: str = None
    user: UserSchema = None


# Event Schema for event creation
class EventCreateSchema(Schema):
    event_title: str
    event_description: str
    start_date_register: datetime
    end_date_register: datetime
    max_attendee: Optional[int] = None
    event_address: str
    is_online: bool = False
    event_meeting_link: Optional[str] = None
    event_category: Optional[str] = None
    tags: Optional[List[str]] 
    event_email: Optional[str] = None
    event_phone_number: Optional[str] = None
    event_website_url: Optional[str] = None
    terms_and_conditions: Optional[str] = None

class EventSchema(Schema):
    id: int
    event_title: str
    event_description: str
    organizer_username: str
    event_create_date: datetime
    start_date_register: datetime
    end_date_register: datetime
    max_attendee: Optional[int]
    event_address: Optional[str]
    is_online: bool
    status_registration: str

class EventUpdateSchema(Schema):
    event_title: Optional[str]  = None
    event_description: Optional[str] = None
    start_date_register: Optional[datetime] = None
    end_date_register: Optional[datetime] = None
    max_attendee: Optional[int]  = None
    event_address: Optional[str]  = None
    is_online: Optional[bool]  = None
    event_meeting_link: Optional[str] = None 
    event_category: Optional[str] = None
    tags: Optional[List[str]]  = None
    event_email: Optional[str] = None 
    event_phone_number: Optional[str] = None 
    event_website_url: Optional[str] = None 
    terms_and_conditions: Optional[str] = None 