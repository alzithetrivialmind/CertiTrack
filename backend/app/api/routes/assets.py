"""
Asset Routes
Equipment Registry Management
"""
import uuid
from typing import Optional, List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User, UserRole
from app.models.asset import Asset, AssetCategory, AssetType, AssetStatus
from app.schemas.asset import (
    AssetCreate, AssetUpdate, AssetResponse, AssetListResponse, AssetQRScan
)
from app.api.deps import get_current_user, require_inspector
from app.services.qr_service import generate_qr_code

router = APIRouter()


@router.get("/", response_model=AssetListResponse)
async def list_assets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[AssetCategory] = None,
    asset_type: Optional[AssetType] = None,
    status: Optional[AssetStatus] = None,
    expiring_soon: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all assets with pagination and filters"""
    query = select(Asset).where(Asset.is_deleted == False)
    count_query = select(func.count(Asset.id)).where(Asset.is_deleted == False)
    
    # Filter by company
    if current_user.role != UserRole.SUPER_ADMIN and current_user.company_id:
        query = query.where(Asset.company_id == current_user.company_id)
        count_query = count_query.where(Asset.company_id == current_user.company_id)
    
    # Search filter
    if search:
        search_filter = or_(
            Asset.name.ilike(f"%{search}%"),
            Asset.asset_code.ilike(f"%{search}%"),
            Asset.serial_number.ilike(f"%{search}%"),
            Asset.location.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    
    # Category filter
    if category:
        query = query.where(Asset.category == category)
        count_query = count_query.where(Asset.category == category)
    
    # Type filter
    if asset_type:
        query = query.where(Asset.asset_type == asset_type)
        count_query = count_query.where(Asset.asset_type == asset_type)
    
    # Status filter
    if status:
        query = query.where(Asset.status == status)
        count_query = count_query.where(Asset.status == status)
    
    # Expiring soon filter
    if expiring_soon:
        from datetime import timedelta
        soon_date = date.today() + timedelta(days=30)
        query = query.where(
            Asset.certificate_expiry_date <= soon_date,
            Asset.certificate_expiry_date >= date.today()
        )
        count_query = count_query.where(
            Asset.certificate_expiry_date <= soon_date,
            Asset.certificate_expiry_date >= date.today()
        )
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(Asset.created_at.desc())
    
    result = await db.execute(query)
    assets = result.scalars().all()
    
    # Calculate computed properties
    asset_responses = []
    for asset in assets:
        response = AssetResponse.model_validate(asset)
        response.is_certificate_expiring_soon = asset.is_certificate_expiring_soon
        response.is_certificate_expired = asset.is_certificate_expired
        asset_responses.append(response)
    
    return AssetListResponse(
        items=asset_responses,
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size
    )


@router.post("/", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def create_asset(
    asset_data: AssetCreate,
    current_user: User = Depends(require_inspector),
    db: AsyncSession = Depends(get_db)
):
    """Create a new asset"""
    # Set company from user if not provided
    company_id = asset_data.company_id or current_user.company_id
    
    if not company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company ID is required"
        )
    
    # Check if asset code exists in company
    result = await db.execute(
        select(Asset).where(
            Asset.company_id == company_id,
            Asset.asset_code == asset_data.asset_code,
            Asset.is_deleted == False
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Asset code already exists in this company"
        )
    
    # Create asset
    asset = Asset(
        company_id=company_id,
        **asset_data.model_dump(exclude={"company_id"})
    )
    
    # Generate QR code
    qr_data = f"CT-{asset.id}"
    asset.qr_data = qr_data
    asset.qr_code = await generate_qr_code(qr_data, str(asset.id))
    
    db.add(asset)
    await db.flush()
    await db.refresh(asset)
    
    return asset


@router.get("/scan/{qr_data}", response_model=AssetResponse)
async def scan_asset_qr(
    qr_data: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get asset by QR code data (used when scanning QR)"""
    result = await db.execute(
        select(Asset).where(
            Asset.qr_data == qr_data,
            Asset.is_deleted == False
        )
    )
    asset = result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    
    # Check company access
    if (
        current_user.role != UserRole.SUPER_ADMIN 
        and asset.company_id != current_user.company_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return asset


@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(
    asset_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get asset by ID"""
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
    
    # Check company access
    if (
        current_user.role != UserRole.SUPER_ADMIN 
        and asset.company_id != current_user.company_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return asset


@router.put("/{asset_id}", response_model=AssetResponse)
async def update_asset(
    asset_id: uuid.UUID,
    asset_data: AssetUpdate,
    current_user: User = Depends(require_inspector),
    db: AsyncSession = Depends(get_db)
):
    """Update asset"""
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
    
    # Check company access
    if (
        current_user.role != UserRole.SUPER_ADMIN 
        and asset.company_id != current_user.company_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    update_data = asset_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(asset, field, value)
    
    await db.flush()
    await db.refresh(asset)
    
    return asset


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_asset(
    asset_id: uuid.UUID,
    current_user: User = Depends(require_inspector),
    db: AsyncSession = Depends(get_db)
):
    """Soft delete asset"""
    from datetime import datetime
    
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
    
    # Check company access
    if (
        current_user.role != UserRole.SUPER_ADMIN 
        and asset.company_id != current_user.company_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Soft delete
    asset.is_deleted = True
    asset.deleted_at = datetime.utcnow()
    await db.flush()


@router.get("/{asset_id}/qr-code")
async def regenerate_qr_code(
    asset_id: uuid.UUID,
    current_user: User = Depends(require_inspector),
    db: AsyncSession = Depends(get_db)
):
    """Regenerate QR code for asset"""
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
    
    # Check company access
    if (
        current_user.role != UserRole.SUPER_ADMIN 
        and asset.company_id != current_user.company_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Regenerate QR
    qr_data = f"CT-{asset.id}"
    asset.qr_data = qr_data
    asset.qr_code = await generate_qr_code(qr_data, str(asset.id))
    
    await db.flush()
    await db.refresh(asset)
    
    return {"qr_code": asset.qr_code, "qr_data": asset.qr_data}

