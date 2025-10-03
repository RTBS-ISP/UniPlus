from ninja import Schema
from pydantic import BaseModel
from typing import Optional, Dict, Any

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
    firstName: str = None
    lastName: str = None
    phone: str = None
    role: str = None
    
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
