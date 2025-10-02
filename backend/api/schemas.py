from ninja import Schema

# For user registration input
class RegisterSchema(Schema):
    username: str
    email: str
    password: str
    role: str
    firstName: str    
    lastName: str     
    phone: str 

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
