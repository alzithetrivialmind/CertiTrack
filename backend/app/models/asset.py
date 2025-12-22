"""
Asset Models - Equipment Registry
Crane, Load Cell, Shackle, Wire Rope, etc.
"""
import uuid
from datetime import datetime, date
from enum import Enum as PyEnum
from typing import Optional, List
from sqlalchemy import String, Boolean, DateTime, Date, ForeignKey, Text, Enum, Float, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database import Base


class AssetCategory(str, PyEnum):
    """Asset category enumeration"""
    LIFTING = "lifting"  # Cranes, Hoists
    RIGGING = "rigging"  # Shackles, Slings, Wire Rope
    MEASURING = "measuring"  # Load Cells, Weighing Scales
    TRANSPORT = "transport"  # Forklifts, Trucks
    OTHER = "other"


class AssetType(str, PyEnum):
    """Asset type enumeration"""
    # Lifting Equipment
    CRANE = "crane"
    OVERHEAD_CRANE = "overhead_crane"
    MOBILE_CRANE = "mobile_crane"
    TOWER_CRANE = "tower_crane"
    GANTRY_CRANE = "gantry_crane"
    HOIST = "hoist"
    
    # Rigging Equipment
    SHACKLE = "shackle"
    WIRE_ROPE = "wire_rope"
    CHAIN_SLING = "chain_sling"
    WEB_SLING = "web_sling"
    SPREADER_BAR = "spreader_bar"
    LIFTING_BEAM = "lifting_beam"
    
    # Measuring Equipment
    LOAD_CELL = "load_cell"
    WEIGHING_SCALE = "weighing_scale"
    DYNAMOMETER = "dynamometer"
    
    # Transport
    FORKLIFT = "forklift"
    REACH_STACKER = "reach_stacker"
    
    OTHER = "other"


class AssetStatus(str, PyEnum):
    """Asset operational status"""
    ACTIVE = "active"  # In service
    INACTIVE = "inactive"  # Not in use
    UNDER_MAINTENANCE = "under_maintenance"
    RETIRED = "retired"
    PENDING_CERTIFICATION = "pending_certification"


class Asset(Base):
    """Asset/Equipment model"""
    __tablename__ = "assets"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    
    # Company (Multi-tenant)
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False
    )
    
    # Basic Info
    asset_code: Mapped[str] = mapped_column(String(100), nullable=False)  # Internal ID
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    
    # Classification
    category: Mapped[AssetCategory] = mapped_column(
        Enum(AssetCategory), 
        default=AssetCategory.LIFTING
    )
    asset_type: Mapped[AssetType] = mapped_column(
        Enum(AssetType), 
        default=AssetType.OTHER
    )
    
    # Specifications
    manufacturer: Mapped[Optional[str]] = mapped_column(String(255))
    model: Mapped[Optional[str]] = mapped_column(String(255))
    serial_number: Mapped[Optional[str]] = mapped_column(String(255))
    year_manufactured: Mapped[Optional[int]] = mapped_column(Integer)
    
    # Capacity
    safe_working_load: Mapped[Optional[float]] = mapped_column(Float)  # SWL in tons/kg
    swl_unit: Mapped[str] = mapped_column(String(20), default="ton")
    max_capacity: Mapped[Optional[float]] = mapped_column(Float)
    capacity_unit: Mapped[str] = mapped_column(String(20), default="ton")
    
    # Location
    location: Mapped[Optional[str]] = mapped_column(String(255))
    site: Mapped[Optional[str]] = mapped_column(String(255))
    department: Mapped[Optional[str]] = mapped_column(String(255))
    
    # QR Code
    qr_code: Mapped[Optional[str]] = mapped_column(String(500))  # QR code image URL
    qr_data: Mapped[Optional[str]] = mapped_column(String(255))  # Encoded data
    
    # Status
    status: Mapped[AssetStatus] = mapped_column(
        Enum(AssetStatus), 
        default=AssetStatus.ACTIVE
    )
    
    # Certification Dates
    last_inspection_date: Mapped[Optional[date]] = mapped_column(Date)
    next_inspection_date: Mapped[Optional[date]] = mapped_column(Date)
    certificate_expiry_date: Mapped[Optional[date]] = mapped_column(Date)
    
    # Additional Data (flexible JSON field)
    metadata: Mapped[Optional[dict]] = mapped_column(JSONB, default=dict)
    
    # Photo
    photo_url: Mapped[Optional[str]] = mapped_column(String(500))
    
    # Soft delete
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
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
    company: Mapped["Company"] = relationship("Company", back_populates="assets")
    certificates: Mapped[List["Certificate"]] = relationship(
        "Certificate", 
        back_populates="asset",
        cascade="all, delete-orphan"
    )
    tests: Mapped[List["Test"]] = relationship(
        "Test", 
        back_populates="asset",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<Asset {self.asset_code}: {self.name}>"
    
    @property
    def is_certificate_expiring_soon(self) -> bool:
        """Check if certificate expires within 30 days"""
        if not self.certificate_expiry_date:
            return False
        days_until_expiry = (self.certificate_expiry_date - date.today()).days
        return 0 < days_until_expiry <= 30
    
    @property
    def is_certificate_expired(self) -> bool:
        """Check if certificate has expired"""
        if not self.certificate_expiry_date:
            return False
        return self.certificate_expiry_date < date.today()


# Import at bottom to avoid circular imports
from app.models.user import Company
from app.models.certificate import Certificate
from app.models.test import Test

