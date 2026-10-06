import uuid
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class UserRegister(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = "Analyst"


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    role: str
    is_active: bool
    created_at: datetime

    @field_validator('id', mode='before')
    def convert_uuid(cls, v):
        if v is not None:
            return str(v)
        return v

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
