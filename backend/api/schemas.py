from ninja import Schema
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, validator

class RegisterSchema(Schema):
    username: str
    email: str
    password: str
    role: str
    first_name: str
    last_name: str
    phone_number: str

class LoginSchema(Schema):
    email: str
    password: str

class UserSchema(Schema):
    username: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    phone_number: Optional[str] = None
    about_me: Optional[str] = None
    verification_status: Optional[str] = None
    creation_date: Optional[str] = None

class MessageSchema(Schema):
    message: str

class ErrorSchema(Schema):
    error: str

class SuccessSchema(Schema):
    success: bool
    message: str = None
    user: UserSchema = None



class EventCreateSchema(BaseModel):
    event_title: str
    event_description: str
    start_date_register: datetime
    end_date_register: datetime
    max_attendee: int
    is_online: bool = False  
    
class EventSchema(BaseModel):
    id: int 
    event_title: str
    event_description: str
    event_create_date: str | None = None
    max_attendee: int
    start_date_register: str | None = None
    end_date_register: str | None = None
    is_online: bool = False  
