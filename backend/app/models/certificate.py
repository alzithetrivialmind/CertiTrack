"""
Certificate Models
Digital certificates for equipment
"""
import uuid
from datetime import datetime, date
from enum import Enum as PyEnum
from typing import Optional
from sqlalchemy import String, DateTime, Date, ForeignKey, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database import Base


class CertificateStatus(str, PyEnum):
    """Certificate status enumeration"""
    DRAFT = "draft"  # Being prepared
    ISSUED = "issued"  # Active and valid
    EXPIRED = "expired"  # Past expiry date
    REVOKED = "revoked"  # Manually invalidated
    SUPERSEDED = "superseded"  # Replaced by new certificate


class CertificateType(str, PyEnum):
    """Type of certification"""
    LOAD_TEST = "load_test"  # Load/Proof test certificate
    THOROUGH_EXAMINATION = "thorough_examination"  # Thorough examination
    CALIBRATION = "calibration"  # Calibration certificate
    INSPECTION = "inspection"  # General inspection
    ANNUAL = "annual"  # Annual certification


class Certificate(Base):
    """Certificate model - Digital certification document"""
    __tablename__ = "certificates"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    
    # Asset reference
    asset_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("assets.id", ondelete="CASCADE"),
        nullable=False
    )
    
    # Certificate Info
    certificate_number: Mapped[str] = mapped_column(
        String(100), 
        unique=True, 
        nullable=False
    )
    certificate_type: Mapped[CertificateType] = mapped_column(
        Enum(CertificateType), 
        default=CertificateType.LOAD_TEST
    )
    
    # Dates
    issue_date: Mapped[date] = mapped_column(Date, nullable=False)
    expiry_date: Mapped[date] = mapped_column(Date, nullable=False)
    
    # Status
    status: Mapped[CertificateStatus] = mapped_column(
        Enum(CertificateStatus), 
        default=CertificateStatus.DRAFT
    )
    
    # Test reference (if generated from a test)
    test_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("tests.id", ondelete="SET NULL")
    )
    
    # PDF Document
    pdf_url: Mapped[Optional[str]] = mapped_column(String(500))
    pdf_hash: Mapped[Optional[str]] = mapped_column(String(64))  # SHA-256 for integrity
    
    # Digital Signature
    digital_signature: Mapped[Optional[str]] = mapped_column(Text)
    signed_by: Mapped[Optional[str]] = mapped_column(String(255))
    signed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Inspector/Certifier details
    inspector_name: Mapped[Optional[str]] = mapped_column(String(255))
    inspector_certification: Mapped[Optional[str]] = mapped_column(String(255))
    
    # Notes
    notes: Mapped[Optional[str]] = mapped_column(Text)
    
    # Additional data
    extra_data: Mapped[Optional[dict]] = mapped_column(JSONB, default=dict)
    
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
    asset: Mapped["Asset"] = relationship("Asset", back_populates="certificates")
    test: Mapped[Optional["Test"]] = relationship("Test", back_populates="certificate")
    
    def __repr__(self) -> str:
        return f"<Certificate {self.certificate_number}>"
    
    @property
    def is_valid(self) -> bool:
        """Check if certificate is currently valid"""
        return (
            self.status == CertificateStatus.ISSUED 
            and self.expiry_date >= date.today()
        )
    
    @property
    def days_until_expiry(self) -> int:
        """Calculate days until expiry"""
        return (self.expiry_date - date.today()).days


# Import at bottom to avoid circular imports
from app.models.asset import Asset
from app.models.test import Test

