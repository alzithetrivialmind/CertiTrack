"""
Asset Schemas
"""
from datetime import datetime, date
from typing import Optional, List, Any
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.asset import AssetCategory, AssetType, AssetStatus


class AssetBase(BaseModel):
    """Base asset schema"""
    name: str = Field(..., min_length=2, max_length=255)
    asset_code: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    category: AssetCategory = AssetCategory.LIFTING
    asset_type: AssetType = AssetType.OTHER
    
    # Specifications
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    year_manufactured: Optional[int] = None
    
    # Capacity
    safe_working_load: Optional[float] = None
    swl_unit: str = "ton"
    max_capacity: Optional[float] = None
    capacity_unit: str = "ton"
    
    # Location
    location: Optional[str] = None
    site: Optional[str] = None
    department: Optional[str] = None


class AssetCreate(AssetBase):
    """Schema for creating an asset"""
    company_id: Optional[UUID] = None  # Auto-set from auth context
    certificate_expiry_date: Optional[date] = None
    extra_data: Optional[dict] = None


class AssetUpdate(BaseModel):
    """Schema for updating an asset"""
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[AssetCategory] = None
    asset_type: Optional[AssetType] = None
    status: Optional[AssetStatus] = None
    
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    year_manufactured: Optional[int] = None
    
    safe_working_load: Optional[float] = None
    swl_unit: Optional[str] = None
    max_capacity: Optional[float] = None
    capacity_unit: Optional[str] = None
    
    location: Optional[str] = None
    site: Optional[str] = None
    department: Optional[str] = None
    
    last_inspection_date: Optional[date] = None
    next_inspection_date: Optional[date] = None
    certificate_expiry_date: Optional[date] = None
    
    extra_data: Optional[dict] = None
    photo_url: Optional[str] = None


class AssetResponse(AssetBase):
    """Schema for asset response"""
    id: UUID
    company_id: UUID
    status: AssetStatus
    
    qr_code: Optional[str]
    qr_data: Optional[str]
    
    last_inspection_date: Optional[date]
    next_inspection_date: Optional[date]
    certificate_expiry_date: Optional[date]
    
    photo_url: Optional[str]
    extra_data: Optional[dict]
    
    # Computed fields
    is_certificate_expiring_soon: bool = False
    is_certificate_expired: bool = False
    
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AssetListResponse(BaseModel):
    """Paginated asset list response"""
    items: List[AssetResponse]
    total: int
    page: int
    page_size: int
    pages: int


class AssetQRScan(BaseModel):
    """Schema for QR code scan data"""
    qr_data: str
    scan_location: Optional[str] = None
    scan_timestamp: Optional[datetime] = None

