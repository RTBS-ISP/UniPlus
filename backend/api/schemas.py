from ninja import Schema
from pydantic import BaseModel
from typing import Optional, Dict, Any,List
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
    event_address: Optional[str] = None 
    is_online: bool = False
    event_meeting_link: Optional[str] = None
    event_category: Optional[str] = None
    tags: Optional[str] = None
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
    event_title: str
    event_description: str
    organizer_username: str
    start_date_register: datetime
    end_date_register: datetime
    max_attendee: Optional[int] = None
    current_attendees: int
    event_address: str
    is_online: bool
    event_meeting_link: Optional[str] = None
    tags: list[str]
    event_category: str
    event_image: Optional[str] = None

class TicketDetailSchema(Schema):
    qr_code: str
    event_title: str
    event_description: str
    start_date: datetime
    location: str
    meeting_link: Optional[str] = None
    is_online: bool
    organizer: str
    user_name: str
    user_email: str