"""
Dashboard Routes
Analytics and summary data
"""
from datetime import date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.database import get_db
from app.models.user import User, UserRole
from app.models.asset import Asset, AssetStatus, AssetCategory
from app.models.certificate import Certificate, CertificateStatus
from app.models.test import Test, TestStatus, TestResult
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/summary")
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get dashboard summary statistics"""
    company_filter = True
    if current_user.role != UserRole.SUPER_ADMIN and current_user.company_id:
        company_filter = Asset.company_id == current_user.company_id
    
    # Total assets
    total_assets = await db.execute(
        select(func.count(Asset.id)).where(
            Asset.is_deleted == False,
            company_filter
        )
    )
    total_assets_count = total_assets.scalar() or 0
    
    # Active assets
    active_assets = await db.execute(
        select(func.count(Asset.id)).where(
            Asset.is_deleted == False,
            Asset.status == AssetStatus.ACTIVE,
            company_filter
        )
    )
    active_assets_count = active_assets.scalar() or 0
    
    # Expiring certificates (within 30 days)
    soon_date = date.today() + timedelta(days=30)
    expiring_certs = await db.execute(
        select(func.count(Asset.id)).where(
            Asset.is_deleted == False,
            Asset.certificate_expiry_date <= soon_date,
            Asset.certificate_expiry_date >= date.today(),
            company_filter
        )
    )
    expiring_count = expiring_certs.scalar() or 0
    
    # Expired certificates
    expired_certs = await db.execute(
        select(func.count(Asset.id)).where(
            Asset.is_deleted == False,
            Asset.certificate_expiry_date < date.today(),
            company_filter
        )
    )
    expired_count = expired_certs.scalar() or 0
    
    # Tests this month
    month_start = date.today().replace(day=1)
    tests_this_month = await db.execute(
        select(func.count(Test.id))
        .join(Asset)
        .where(
            Test.created_at >= month_start,
            company_filter
        )
    )
    tests_count = tests_this_month.scalar() or 0
    
    # Pass rate this month
    passed_tests = await db.execute(
        select(func.count(Test.id))
        .join(Asset)
        .where(
            Test.created_at >= month_start,
            Test.result == TestResult.PASS,
            company_filter
        )
    )
    passed_count = passed_tests.scalar() or 0
    pass_rate = (passed_count / tests_count * 100) if tests_count > 0 else 0
    
    return {
        "total_assets": total_assets_count,
        "active_assets": active_assets_count,
        "expiring_soon": expiring_count,
        "expired": expired_count,
        "tests_this_month": tests_count,
        "pass_rate": round(pass_rate, 1),
        "alerts": expiring_count + expired_count,
    }


@router.get("/assets-by-category")
async def get_assets_by_category(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get asset count by category"""
    company_filter = True
    if current_user.role != UserRole.SUPER_ADMIN and current_user.company_id:
        company_filter = Asset.company_id == current_user.company_id
    
    result = await db.execute(
        select(Asset.category, func.count(Asset.id))
        .where(Asset.is_deleted == False, company_filter)
        .group_by(Asset.category)
    )
    
    categories = result.all()
    
    return {
        "data": [
            {"category": cat.value, "count": count}
            for cat, count in categories
        ]
    }


@router.get("/assets-by-status")
async def get_assets_by_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get asset count by status"""
    company_filter = True
    if current_user.role != UserRole.SUPER_ADMIN and current_user.company_id:
        company_filter = Asset.company_id == current_user.company_id
    
    result = await db.execute(
        select(Asset.status, func.count(Asset.id))
        .where(Asset.is_deleted == False, company_filter)
        .group_by(Asset.status)
    )
    
    statuses = result.all()
    
    return {
        "data": [
            {"status": status.value, "count": count}
            for status, count in statuses
        ]
    }


@router.get("/recent-tests")
async def get_recent_tests(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get recent tests"""
    query = select(Test).join(Asset)
    
    if current_user.role != UserRole.SUPER_ADMIN and current_user.company_id:
        query = query.where(Asset.company_id == current_user.company_id)
    
    query = query.order_by(Test.created_at.desc()).limit(limit)
    
    result = await db.execute(query)
    tests = result.scalars().all()
    
    return {
        "tests": [
            {
                "id": str(test.id),
                "test_number": test.test_number,
                "asset_id": str(test.asset_id),
                "test_type": test.test_type.value,
                "result": test.result.value,
                "status": test.status.value,
                "created_at": test.created_at.isoformat(),
            }
            for test in tests
        ]
    }


@router.get("/expiring-assets")
async def get_expiring_assets(
    days: int = Query(30, ge=1, le=365),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get assets with expiring certificates"""
    soon_date = date.today() + timedelta(days=days)
    
    query = select(Asset).where(
        Asset.is_deleted == False,
        Asset.certificate_expiry_date <= soon_date,
        Asset.certificate_expiry_date >= date.today()
    )
    
    if current_user.role != UserRole.SUPER_ADMIN and current_user.company_id:
        query = query.where(Asset.company_id == current_user.company_id)
    
    query = query.order_by(Asset.certificate_expiry_date.asc()).limit(limit)
    
    result = await db.execute(query)
    assets = result.scalars().all()
    
    return {
        "assets": [
            {
                "id": str(asset.id),
                "asset_code": asset.asset_code,
                "name": asset.name,
                "category": asset.category.value,
                "asset_type": asset.asset_type.value,
                "certificate_expiry_date": asset.certificate_expiry_date.isoformat() if asset.certificate_expiry_date else None,
                "days_until_expiry": (asset.certificate_expiry_date - date.today()).days if asset.certificate_expiry_date else None,
                "location": asset.location,
            }
            for asset in assets
        ]
    }


@router.get("/test-trends")
async def get_test_trends(
    months: int = Query(6, ge=1, le=12),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get test trends over time"""
    trends = []
    
    for i in range(months - 1, -1, -1):
        # Calculate month start and end
        today = date.today()
        month_date = today.replace(day=1) - timedelta(days=i * 30)
        month_start = month_date.replace(day=1)
        if month_date.month == 12:
            month_end = month_date.replace(year=month_date.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            month_end = month_date.replace(month=month_date.month + 1, day=1) - timedelta(days=1)
        
        # Count tests
        query = select(func.count(Test.id)).join(Asset).where(
            Test.created_at >= month_start,
            Test.created_at <= month_end
        )
        
        if current_user.role != UserRole.SUPER_ADMIN and current_user.company_id:
            query = query.where(Asset.company_id == current_user.company_id)
        
        result = await db.execute(query)
        count = result.scalar() or 0
        
        # Count passed
        passed_query = select(func.count(Test.id)).join(Asset).where(
            Test.created_at >= month_start,
            Test.created_at <= month_end,
            Test.result == TestResult.PASS
        )
        
        if current_user.role != UserRole.SUPER_ADMIN and current_user.company_id:
            passed_query = passed_query.where(Asset.company_id == current_user.company_id)
        
        passed_result = await db.execute(passed_query)
        passed = passed_result.scalar() or 0
        
        trends.append({
            "month": month_start.strftime("%Y-%m"),
            "total": count,
            "passed": passed,
            "failed": count - passed,
        })
    
    return {"trends": trends}

