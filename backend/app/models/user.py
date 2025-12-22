"""
User and Company Models
"""
import uuid
from datetime import datetime
from enum import Enum as PyEnum
from typing import Optional, List
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class UserRole(str, PyEnum):
    """User role enumeration"""
    SUPER_ADMIN = "super_admin"  # Platform admin
    COMPANY_ADMIN = "company_admin"  # Company owner/admin
    INSPECTOR = "inspector"  # Field inspector
    VIEWER = "viewer"  # Read-only access


class Company(Base):
    """Company/Organization model for multi-tenant SaaS"""
    __tablename__ = "companies"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50))
    address: Mapped[Optional[str]] = mapped_column(Text)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500))
    
    # Subscription
    subscription_tier: Mapped[str] = mapped_column(
        String(50), 
        default="free"
    )  # free, starter, pro, enterprise
    subscription_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Settings
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    settings: Mapped[Optional[str]] = mapped_column(Text)  # JSON settings
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow
    )
    
    # Relationships
    users: Mapped[List["User"]] = relationship("User", back_populates="company")
    assets: Mapped[List["Asset"]] = relationship("Asset", back_populates="company")
    
    def __repr__(self) -> str:
        return f"<Company {self.name}>"


class User(Base):
    """User model"""
    __tablename__ = "users"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Profile
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50))
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500))
    
    # Role & Company
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole), 
        default=UserRole.VIEWER
    )
    company_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("companies.id", ondelete="CASCADE")
    )
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow
    )
    
    # Relationships
    company: Mapped[Optional["Company"]] = relationship("Company", back_populates="users")
    tests_conducted: Mapped[List["Test"]] = relationship("Test", back_populates="inspector")
    
    def __repr__(self) -> str:
        return f"<User {self.email}>"


# Import at bottom to avoid circular imports
from app.models.asset import Asset
from app.models.test import Test

