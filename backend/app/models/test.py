"""
Test Models
Equipment testing and examination records
"""
import uuid
from datetime import datetime
from enum import Enum as PyEnum
from typing import Optional, List
from sqlalchemy import String, DateTime, ForeignKey, Text, Enum, Float, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database import Base


class TestStatus(str, PyEnum):
    """Test status enumeration"""
    SCHEDULED = "scheduled"  # Test is scheduled
    IN_PROGRESS = "in_progress"  # Test is being conducted
    COMPLETED = "completed"  # Test finished
    CANCELLED = "cancelled"  # Test was cancelled


class TestResult(str, PyEnum):
    """Test result enumeration"""
    PENDING = "pending"  # Result not yet determined
    PASS = "pass"  # Equipment passed test
    FAIL = "fail"  # Equipment failed test
    CONDITIONAL = "conditional"  # Pass with conditions


class TestType(str, PyEnum):
    """Type of test conducted"""
    LOAD_TEST = "load_test"  # Proof load testing
    VISUAL_INSPECTION = "visual_inspection"  # Visual examination
    FUNCTIONAL_TEST = "functional_test"  # Functional testing
    NDT = "ndt"  # Non-destructive testing
    CALIBRATION = "calibration"  # Calibration
    PERIODIC = "periodic"  # Periodic examination


class Test(Base):
    """Test/Examination record model"""
    __tablename__ = "tests"
    
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
    
    # Inspector reference
    inspector_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="SET NULL")
    )
    
    # Test Info
    test_number: Mapped[str] = mapped_column(String(100), nullable=False)
    test_type: Mapped[TestType] = mapped_column(
        Enum(TestType), 
        default=TestType.LOAD_TEST
    )
    
    # Scheduling
    scheduled_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Status & Result
    status: Mapped[TestStatus] = mapped_column(
        Enum(TestStatus), 
        default=TestStatus.SCHEDULED
    )
    result: Mapped[TestResult] = mapped_column(
        Enum(TestResult), 
        default=TestResult.PENDING
    )
    
    # Test Parameters (Load Testing)
    safe_working_load: Mapped[Optional[float]] = mapped_column(Float)  # SWL
    test_load: Mapped[Optional[float]] = mapped_column(Float)  # Applied test load
    load_unit: Mapped[str] = mapped_column(String(20), default="ton")
    test_load_percentage: Mapped[Optional[float]] = mapped_column(Float)  # e.g., 125% of SWL
    
    # Measurements (can be from IoT sensors)
    measured_values: Mapped[Optional[dict]] = mapped_column(JSONB, default=dict)
    # Example: {"load_applied": 12.5, "deflection": 2.3, "readings": [...]}
    
    # IoT Integration
    is_automated: Mapped[bool] = mapped_column(Boolean, default=False)
    sensor_id: Mapped[Optional[str]] = mapped_column(String(100))
    sensor_data: Mapped[Optional[dict]] = mapped_column(JSONB, default=dict)
    
    # Location
    test_location: Mapped[Optional[str]] = mapped_column(String(255))
    
    # Observations
    observations: Mapped[Optional[str]] = mapped_column(Text)
    defects_found: Mapped[Optional[str]] = mapped_column(Text)
    recommendations: Mapped[Optional[str]] = mapped_column(Text)
    
    # Photo evidence
    photos: Mapped[Optional[list]] = mapped_column(JSONB, default=list)
    # Example: ["url1", "url2"]
    
    # QR Scan tracking
    scanned_qr_data: Mapped[Optional[str]] = mapped_column(String(255))
    scan_timestamp: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Validation
    is_validated: Mapped[bool] = mapped_column(Boolean, default=False)
    validated_by: Mapped[Optional[str]] = mapped_column(String(255))
    validated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Additional metadata
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
    asset: Mapped["Asset"] = relationship("Asset", back_populates="tests")
    inspector: Mapped[Optional["User"]] = relationship("User", back_populates="tests_conducted")
    certificate: Mapped[Optional["Certificate"]] = relationship(
        "Certificate", 
        back_populates="test",
        uselist=False
    )
    
    def __repr__(self) -> str:
        return f"<Test {self.test_number}>"
    
    def calculate_result(self) -> TestResult:
        """
        Automatically calculate test result based on measured values
        This is where "human error" elimination happens
        """
        if not self.measured_values or not self.safe_working_load:
            return TestResult.PENDING
        
        # Example logic for load test
        applied_load = self.measured_values.get("load_applied", 0)
        expected_test_load = self.safe_working_load * 1.25  # 125% proof load
        
        # Check if load was applied correctly
        if applied_load < expected_test_load * 0.95:
            return TestResult.FAIL  # Insufficient test load
        
        # Check for defects
        if self.defects_found and len(self.defects_found.strip()) > 0:
            return TestResult.CONDITIONAL
        
        # Check deflection/deformation
        deflection = self.measured_values.get("deflection", 0)
        max_allowable = self.measured_values.get("max_deflection", float("inf"))
        if deflection > max_allowable:
            return TestResult.FAIL
        
        return TestResult.PASS


# Import at bottom to avoid circular imports
from app.models.asset import Asset
from app.models.user import User
from app.models.certificate import Certificate

