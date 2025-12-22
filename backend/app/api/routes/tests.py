"""
Test Routes
Equipment Testing and Examination
"""
import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User, UserRole
from app.models.asset import Asset
from app.models.test import Test, TestStatus, TestResult, TestType
from app.schemas.test import (
    TestCreate, TestUpdate, TestResponse, TestSubmit, TestValidation
)
from app.api.deps import get_current_user, require_inspector
from app.services.test_service import validate_test_result, generate_test_number

router = APIRouter()


@router.get("", response_model=List[TestResponse])
async def list_tests(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    asset_id: Optional[uuid.UUID] = None,
    status: Optional[TestStatus] = None,
    result: Optional[TestResult] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all tests with filters"""
    query = select(Test).options(selectinload(Test.asset))
    
    # Filter by company via asset
    if current_user.role != UserRole.SUPER_ADMIN and current_user.company_id:
        query = query.join(Asset).where(Asset.company_id == current_user.company_id)
    
    # Asset filter
    if asset_id:
        query = query.where(Test.asset_id == asset_id)
    
    # Status filter
    if status:
        query = query.where(Test.status == status)
    
    # Result filter
    if result:
        query = query.where(Test.result == result)
    
    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(Test.created_at.desc())
    
    db_result = await db.execute(query)
    tests = db_result.scalars().all()
    
    return tests


@router.post("", response_model=TestResponse, status_code=status.HTTP_201_CREATED)
async def create_test(
    test_data: TestCreate,
    current_user: User = Depends(require_inspector),
    db: AsyncSession = Depends(get_db)
):
    """Create a new test/examination"""
    # Verify asset exists and user has access
    result = await db.execute(
        select(Asset).where(
            Asset.id == test_data.asset_id,
            Asset.is_deleted == False
        )
    )
    asset = result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    
    if (
        current_user.role != UserRole.SUPER_ADMIN 
        and asset.company_id != current_user.company_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Generate test number
    test_number = await generate_test_number(db)
    
    # Create test
    test = Test(
        test_number=test_number,
        asset_id=test_data.asset_id,
        inspector_id=test_data.inspector_id or current_user.id,
        test_type=test_data.test_type,
        test_location=test_data.test_location,
        safe_working_load=test_data.safe_working_load,
        test_load=test_data.test_load,
        load_unit=test_data.load_unit,
        test_load_percentage=test_data.test_load_percentage,
        scheduled_date=test_data.scheduled_date,
        status=TestStatus.SCHEDULED,
        result=TestResult.PENDING,
    )
    
    db.add(test)
    await db.flush()
    await db.refresh(test)
    
    return test


@router.post("/submit", response_model=TestValidation)
async def submit_test_results(
    test_data: TestSubmit,
    current_user: User = Depends(require_inspector),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit test results from field (QR scan workflow)
    This is the main endpoint for field inspectors
    """
    asset_id = test_data.asset_id
    
    # If QR data provided, get asset from QR
    if test_data.qr_data:
        result = await db.execute(
            select(Asset).where(
                Asset.qr_data == test_data.qr_data,
                Asset.is_deleted == False
            )
        )
        asset = result.scalar_one_or_none()
        if asset:
            asset_id = asset.id
    
    if not asset_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Asset ID or valid QR data required"
        )
    
    # Verify asset exists
    result = await db.execute(
        select(Asset).where(
            Asset.id == asset_id,
            Asset.is_deleted == False
        )
    )
    asset = result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    
    if (
        current_user.role != UserRole.SUPER_ADMIN 
        and asset.company_id != current_user.company_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Generate test number
    test_number = await generate_test_number(db)
    
    # Create test record
    test = Test(
        test_number=test_number,
        asset_id=asset_id,
        inspector_id=current_user.id,
        test_type=test_data.test_type,
        test_location=test_data.test_location,
        safe_working_load=test_data.safe_working_load,
        test_load=test_data.test_load,
        load_unit=test_data.load_unit,
        measured_values=test_data.measured_values or {},
        observations=test_data.observations,
        defects_found=test_data.defects_found,
        recommendations=test_data.recommendations,
        photos=test_data.photos,
        is_automated=test_data.is_automated,
        sensor_id=test_data.sensor_id,
        sensor_data=test_data.sensor_data,
        scanned_qr_data=test_data.qr_data,
        scan_timestamp=datetime.utcnow(),
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow(),
        status=TestStatus.COMPLETED,
    )
    
    # Automatic validation - eliminates human error
    validation_result = validate_test_result(test)
    test.result = validation_result["result"]
    test.is_validated = True
    test.validated_by = "System Auto-Validation"
    test.validated_at = datetime.utcnow()
    
    db.add(test)
    await db.flush()
    await db.refresh(test)
    
    # Update asset inspection dates
    asset.last_inspection_date = datetime.utcnow().date()
    await db.flush()
    
    return TestValidation(
        test_id=test.id,
        result=test.result,
        is_pass=test.result == TestResult.PASS,
        validation_details=validation_result["details"],
        recommendations=validation_result.get("recommendations")
    )


@router.get("/{test_id}", response_model=TestResponse)
async def get_test(
    test_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get test by ID"""
    result = await db.execute(
        select(Test)
        .options(selectinload(Test.asset))
        .where(Test.id == test_id)
    )
    test = result.scalar_one_or_none()
    
    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test not found"
        )
    
    # Check company access via asset
    if (
        current_user.role != UserRole.SUPER_ADMIN 
        and test.asset.company_id != current_user.company_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return test


@router.put("/{test_id}", response_model=TestResponse)
async def update_test(
    test_id: uuid.UUID,
    test_data: TestUpdate,
    current_user: User = Depends(require_inspector),
    db: AsyncSession = Depends(get_db)
):
    """Update test"""
    result = await db.execute(
        select(Test)
        .options(selectinload(Test.asset))
        .where(Test.id == test_id)
    )
    test = result.scalar_one_or_none()
    
    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test not found"
        )
    
    # Check company access
    if (
        current_user.role != UserRole.SUPER_ADMIN 
        and test.asset.company_id != current_user.company_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    update_data = test_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(test, field, value)
    
    await db.flush()
    await db.refresh(test)
    
    return test


@router.post("/{test_id}/validate", response_model=TestValidation)
async def validate_test(
    test_id: uuid.UUID,
    current_user: User = Depends(require_inspector),
    db: AsyncSession = Depends(get_db)
):
    """Manually trigger test validation"""
    result = await db.execute(
        select(Test)
        .options(selectinload(Test.asset))
        .where(Test.id == test_id)
    )
    test = result.scalar_one_or_none()
    
    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test not found"
        )
    
    # Check company access
    if (
        current_user.role != UserRole.SUPER_ADMIN 
        and test.asset.company_id != current_user.company_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Run validation
    validation_result = validate_test_result(test)
    test.result = validation_result["result"]
    test.is_validated = True
    test.validated_by = current_user.full_name
    test.validated_at = datetime.utcnow()
    
    await db.flush()
    await db.refresh(test)
    
    return TestValidation(
        test_id=test.id,
        result=test.result,
        is_pass=test.result == TestResult.PASS,
        validation_details=validation_result["details"],
        recommendations=validation_result.get("recommendations")
    )

