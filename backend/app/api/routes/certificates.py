"""
Certificate Routes
Digital Certificate Management
"""
import uuid
from datetime import datetime, date, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User, UserRole
from app.models.asset import Asset
from app.models.certificate import Certificate, CertificateStatus, CertificateType
from app.models.test import Test
from app.schemas.certificate import (
    CertificateCreate, CertificateUpdate, CertificateResponse, 
    CertificateGenerateRequest
)
from app.api.deps import get_current_user, require_inspector
from app.services.certificate_service import (
    generate_certificate_number, 
    generate_certificate_pdf
)

router = APIRouter()


@router.get("", response_model=List[CertificateResponse])
async def list_certificates(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    asset_id: Optional[uuid.UUID] = None,
    status: Optional[CertificateStatus] = None,
    expiring_soon: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all certificates with filters"""
    query = select(Certificate).options(selectinload(Certificate.asset))
    
    # Filter by company via asset
    if current_user.role != UserRole.SUPER_ADMIN and current_user.company_id:
        query = query.join(Asset).where(Asset.company_id == current_user.company_id)
    
    # Asset filter
    if asset_id:
        query = query.where(Certificate.asset_id == asset_id)
    
    # Status filter
    if status:
        query = query.where(Certificate.status == status)
    
    # Expiring soon filter
    if expiring_soon:
        soon_date = date.today() + timedelta(days=30)
        query = query.where(
            Certificate.expiry_date <= soon_date,
            Certificate.expiry_date >= date.today(),
            Certificate.status == CertificateStatus.ISSUED
        )
    
    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(Certificate.created_at.desc())
    
    result = await db.execute(query)
    certificates = result.scalars().all()
    
    # Add computed properties
    cert_responses = []
    for cert in certificates:
        response = CertificateResponse.model_validate(cert)
        response.is_valid = cert.is_valid
        response.days_until_expiry = cert.days_until_expiry
        cert_responses.append(response)
    
    return cert_responses


@router.post("/generate", response_model=CertificateResponse, status_code=status.HTTP_201_CREATED)
async def generate_certificate(
    request: CertificateGenerateRequest,
    current_user: User = Depends(require_inspector),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate a new certificate for an asset
    This is the "Auto-PDF Report" feature
    """
    # Verify asset exists
    result = await db.execute(
        select(Asset).where(
            Asset.id == request.asset_id,
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
    
    # Verify test if provided
    test = None
    if request.test_id:
        result = await db.execute(
            select(Test).where(Test.id == request.test_id)
        )
        test = result.scalar_one_or_none()
        if not test:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test not found"
            )
    
    # Generate certificate number
    cert_number = await generate_certificate_number(db)
    
    # Calculate dates
    issue_date = date.today()
    expiry_date = issue_date + timedelta(days=request.validity_days)
    
    # Create certificate record
    certificate = Certificate(
        asset_id=request.asset_id,
        certificate_number=cert_number,
        certificate_type=request.certificate_type,
        issue_date=issue_date,
        expiry_date=expiry_date,
        status=CertificateStatus.ISSUED,
        test_id=request.test_id,
        inspector_name=request.inspector_name,
        inspector_certification=request.inspector_certification,
        notes=request.notes,
        signed_by=current_user.full_name,
        signed_at=datetime.utcnow(),
    )
    
    db.add(certificate)
    await db.flush()
    
    # Generate PDF
    pdf_url = await generate_certificate_pdf(certificate, asset, test, db)
    certificate.pdf_url = pdf_url
    
    # Update asset certificate expiry
    asset.certificate_expiry_date = expiry_date
    asset.last_inspection_date = issue_date
    asset.next_inspection_date = expiry_date - timedelta(days=30)
    
    await db.flush()
    await db.refresh(certificate)
    
    response = CertificateResponse.model_validate(certificate)
    response.is_valid = certificate.is_valid
    response.days_until_expiry = certificate.days_until_expiry
    
    return response


@router.get("/{certificate_id}", response_model=CertificateResponse)
async def get_certificate(
    certificate_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get certificate by ID"""
    result = await db.execute(
        select(Certificate)
        .options(selectinload(Certificate.asset))
        .where(Certificate.id == certificate_id)
    )
    certificate = result.scalar_one_or_none()
    
    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found"
        )
    
    # Check company access via asset
    if (
        current_user.role != UserRole.SUPER_ADMIN 
        and certificate.asset.company_id != current_user.company_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    response = CertificateResponse.model_validate(certificate)
    response.is_valid = certificate.is_valid
    response.days_until_expiry = certificate.days_until_expiry
    
    return response


@router.get("/{certificate_id}/download")
async def download_certificate_pdf(
    certificate_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Download certificate PDF"""
    result = await db.execute(
        select(Certificate)
        .options(selectinload(Certificate.asset))
        .where(Certificate.id == certificate_id)
    )
    certificate = result.scalar_one_or_none()
    
    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found"
        )
    
    # Check company access
    if (
        current_user.role != UserRole.SUPER_ADMIN 
        and certificate.asset.company_id != current_user.company_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    if not certificate.pdf_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PDF not available"
        )
    
    # Return PDF file
    return FileResponse(
        certificate.pdf_url,
        media_type="application/pdf",
        filename=f"Certificate_{certificate.certificate_number}.pdf"
    )


@router.post("/{certificate_id}/revoke", response_model=CertificateResponse)
async def revoke_certificate(
    certificate_id: uuid.UUID,
    reason: Optional[str] = None,
    current_user: User = Depends(require_inspector),
    db: AsyncSession = Depends(get_db)
):
    """Revoke a certificate"""
    result = await db.execute(
        select(Certificate)
        .options(selectinload(Certificate.asset))
        .where(Certificate.id == certificate_id)
    )
    certificate = result.scalar_one_or_none()
    
    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found"
        )
    
    # Check company access
    if (
        current_user.role != UserRole.SUPER_ADMIN 
        and certificate.asset.company_id != current_user.company_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    certificate.status = CertificateStatus.REVOKED
    if reason:
        certificate.notes = f"{certificate.notes or ''}\nRevoked: {reason}"
    
    await db.flush()
    await db.refresh(certificate)
    
    return certificate


@router.get("/verify/{certificate_number}")
async def verify_certificate(
    certificate_number: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Public endpoint to verify certificate authenticity
    No authentication required - for external verification
    """
    result = await db.execute(
        select(Certificate)
        .options(selectinload(Certificate.asset))
        .where(Certificate.certificate_number == certificate_number)
    )
    certificate = result.scalar_one_or_none()
    
    if not certificate:
        return {
            "valid": False,
            "message": "Certificate not found"
        }
    
    is_valid = certificate.is_valid
    
    return {
        "valid": is_valid,
        "certificate_number": certificate.certificate_number,
        "asset_name": certificate.asset.name,
        "asset_code": certificate.asset.asset_code,
        "issue_date": certificate.issue_date.isoformat(),
        "expiry_date": certificate.expiry_date.isoformat(),
        "status": certificate.status.value,
        "days_until_expiry": certificate.days_until_expiry if is_valid else 0,
        "message": "Certificate is valid" if is_valid else f"Certificate status: {certificate.status.value}"
    }

