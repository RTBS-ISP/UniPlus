
from ninja import Schema

class RegisterSchema(Schema):
    username: str
    email: str
    password: str
    role: str

class LoginSchema(Schema):
    email: str
    password: str

class UserSchema(Schema):
    username: str
    email: str

class MessageSchema(Schema):
    message: str

class ErrorSchema(Schema):
    error: str

class SuccessSchema(Schema):
    success: bool
    message: str = None
    user: UserSchema = None