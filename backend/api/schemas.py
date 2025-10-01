
from ninja import Schema
from typing import Optional

class RegisterSchema(Schema):
    username: str
    email: str
    password: str
    role: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

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