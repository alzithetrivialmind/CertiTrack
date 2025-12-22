"""
User Schemas
"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: Optional[str] = None


class UserCreate(UserBase):
    """Schema for creating a new user"""
    password: str = Field(..., min_length=8)
    role: UserRole = UserRole.VIEWER
    company_id: Optional[UUID] = None


class UserUpdate(BaseModel):
    """Schema for updating a user"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    """Schema for user response"""
    id: UUID
    role: UserRole
    company_id: Optional[UUID]
    is_active: bool
    is_verified: bool
    last_login_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """Schema for login request"""
    email: EmailStr
    password: str


class Token(BaseModel):
    """JWT Token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """JWT Token payload"""
    sub: str  # User ID
    exp: datetime
    role: UserRole
    company_id: Optional[str] = None


class CompanyBase(BaseModel):
    """Base company schema"""
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None


class CompanyCreate(CompanyBase):
    """Schema for creating a company"""
    slug: str = Field(..., min_length=2, max_length=100)


class CompanyUpdate(BaseModel):
    """Schema for updating a company"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None


class CompanyResponse(CompanyBase):
    """Schema for company response"""
    id: UUID
    slug: str
    logo_url: Optional[str]
    subscription_tier: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

