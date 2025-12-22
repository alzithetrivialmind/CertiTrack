"""
Certificate Schemas
"""
from datetime import datetime, date
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.certificate import CertificateStatus, CertificateType


class CertificateBase(BaseModel):
    """Base certificate schema"""
    certificate_type: CertificateType = CertificateType.LOAD_TEST
    issue_date: date
    expiry_date: date
    inspector_name: Optional[str] = None
    inspector_certification: Optional[str] = None
    notes: Optional[str] = None


class CertificateCreate(CertificateBase):
    """Schema for creating a certificate"""
    asset_id: UUID
    test_id: Optional[UUID] = None
    metadata: Optional[dict] = None


class CertificateUpdate(BaseModel):
    """Schema for updating a certificate"""
    status: Optional[CertificateStatus] = None
    expiry_date: Optional[date] = None
    inspector_name: Optional[str] = None
    inspector_certification: Optional[str] = None
    notes: Optional[str] = None
    metadata: Optional[dict] = None


class CertificateResponse(CertificateBase):
    """Schema for certificate response"""
    id: UUID
    asset_id: UUID
    certificate_number: str
    status: CertificateStatus
    test_id: Optional[UUID]
    
    pdf_url: Optional[str]
    
    signed_by: Optional[str]
    signed_at: Optional[datetime]
    
    is_valid: bool = False
    days_until_expiry: int = 0
    
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CertificateGenerateRequest(BaseModel):
    """Request to generate certificate PDF"""
    asset_id: UUID
    test_id: Optional[UUID] = None
    certificate_type: CertificateType = CertificateType.LOAD_TEST
    validity_days: int = Field(default=365, ge=30, le=730)
    inspector_name: str
    inspector_certification: Optional[str] = None
    notes: Optional[str] = None

