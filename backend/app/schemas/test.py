"""
Test Schemas
"""
from datetime import datetime
from typing import Optional, List, Any
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.test import TestStatus, TestResult, TestType


class TestBase(BaseModel):
    """Base test schema"""
    test_type: TestType = TestType.LOAD_TEST
    test_location: Optional[str] = None
    
    # Load test parameters
    safe_working_load: Optional[float] = None
    test_load: Optional[float] = None
    load_unit: str = "ton"
    test_load_percentage: Optional[float] = Field(default=125.0, description="Proof load percentage")


class TestCreate(TestBase):
    """Schema for creating a test"""
    asset_id: UUID
    inspector_id: Optional[UUID] = None
    scheduled_date: Optional[datetime] = None


class TestUpdate(BaseModel):
    """Schema for updating a test"""
    status: Optional[TestStatus] = None
    result: Optional[TestResult] = None
    test_location: Optional[str] = None
    
    safe_working_load: Optional[float] = None
    test_load: Optional[float] = None
    
    observations: Optional[str] = None
    defects_found: Optional[str] = None
    recommendations: Optional[str] = None
    
    measured_values: Optional[dict] = None
    metadata: Optional[dict] = None


class TestSubmit(BaseModel):
    """Schema for submitting test results (from field/QR scan)"""
    asset_id: Optional[UUID] = None  # Can be derived from QR
    qr_data: Optional[str] = None  # QR code data
    
    # Test data
    test_type: TestType = TestType.LOAD_TEST
    test_location: Optional[str] = None
    
    # Measurements
    safe_working_load: float
    test_load: float
    load_unit: str = "ton"
    
    # Additional measurements (flexible)
    measured_values: Optional[dict] = None
    # Example: {"deflection": 2.3, "ambient_temp": 25, "humidity": 60}
    
    # Observations
    observations: Optional[str] = None
    defects_found: Optional[str] = None
    recommendations: Optional[str] = None
    
    # Photos
    photos: Optional[List[str]] = None  # URLs
    
    # IoT data (future)
    is_automated: bool = False
    sensor_id: Optional[str] = None
    sensor_data: Optional[dict] = None


class TestResponse(TestBase):
    """Schema for test response"""
    id: UUID
    asset_id: UUID
    inspector_id: Optional[UUID]
    
    test_number: str
    status: TestStatus
    result: TestResult
    
    scheduled_date: Optional[datetime]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    
    measured_values: Optional[dict]
    observations: Optional[str]
    defects_found: Optional[str]
    recommendations: Optional[str]
    
    photos: Optional[List[str]]
    
    is_automated: bool
    is_validated: bool
    validated_by: Optional[str]
    validated_at: Optional[datetime]
    
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TestValidation(BaseModel):
    """Response from automatic test validation"""
    test_id: UUID
    result: TestResult
    is_pass: bool
    validation_details: dict
    # Example: {"swl_check": "pass", "deflection_check": "pass", "visual_check": "pending"}
    recommendations: Optional[str] = None

