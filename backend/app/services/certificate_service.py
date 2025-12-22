"""
Certificate Service
PDF generation and certificate management
"""
import os
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from io import BytesIO
import hashlib

from app.models.certificate import Certificate, CertificateType
from app.models.asset import Asset
from app.models.test import Test
from app.services.qr_service import generate_qr_code_base64


# Ensure certificates directory exists
CERTIFICATES_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "static", "certificates")
os.makedirs(CERTIFICATES_DIR, exist_ok=True)


async def generate_certificate_number(db: AsyncSession) -> str:
    """
    Generate unique certificate number
    Format: CERT-YYYYMM-XXXXX
    """
    today = datetime.utcnow().strftime("%Y%m")
    prefix = f"CERT-{today}-"
    
    # Get count of certificates this month
    result = await db.execute(
        select(func.count(Certificate.id)).where(
            Certificate.certificate_number.like(f"{prefix}%")
        )
    )
    count = result.scalar() or 0
    
    # Generate new number
    new_number = f"{prefix}{count + 1:05d}"
    
    return new_number


async def generate_certificate_pdf(
    certificate: Certificate,
    asset: Asset,
    test: Optional[Test],
    db: AsyncSession
) -> str:
    """
    Generate PDF certificate document
    Returns file path
    """
    filename = f"{certificate.certificate_number.replace('/', '-')}.pdf"
    filepath = os.path.join(CERTIFICATES_DIR, filename)
    
    # Create PDF
    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )
    
    # Styles
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=24,
        alignment=TA_CENTER,
        spaceAfter=30,
        textColor=colors.HexColor("#1a1a1a"),
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Heading2'],
        fontSize=14,
        alignment=TA_CENTER,
        spaceAfter=20,
        textColor=colors.HexColor("#666666")
    )
    
    label_style = ParagraphStyle(
        'Label',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor("#888888")
    )
    
    value_style = ParagraphStyle(
        'Value',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.HexColor("#1a1a1a"),
        fontName='Helvetica-Bold'
    )
    
    # Build content
    content = []
    
    # Header
    content.append(Paragraph("CERTIFICATE", title_style))
    content.append(Paragraph(
        _get_certificate_type_name(certificate.certificate_type),
        subtitle_style
    ))
    content.append(Spacer(1, 20))
    
    # Certificate number
    content.append(Paragraph("Certificate No.", label_style))
    content.append(Paragraph(certificate.certificate_number, value_style))
    content.append(Spacer(1, 15))
    
    # Asset information table
    asset_data = [
        ["Asset Information", ""],
        ["Asset Code:", asset.asset_code],
        ["Name:", asset.name],
        ["Type:", asset.asset_type.value.replace("_", " ").title()],
        ["Manufacturer:", asset.manufacturer or "-"],
        ["Model:", asset.model or "-"],
        ["Serial Number:", asset.serial_number or "-"],
        ["Location:", asset.location or "-"],
    ]
    
    if asset.safe_working_load:
        asset_data.append(["Safe Working Load:", f"{asset.safe_working_load} {asset.swl_unit}"])
    
    asset_table = Table(asset_data, colWidths=[150, 300])
    asset_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f5f5f5")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#1a1a1a")),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TEXTCOLOR', (0, 1), (0, -1), colors.HexColor("#666666")),
        ('TEXTCOLOR', (1, 1), (1, -1), colors.HexColor("#1a1a1a")),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e0e0e0")),
    ]))
    
    content.append(asset_table)
    content.append(Spacer(1, 20))
    
    # Test information (if available)
    if test:
        test_data = [
            ["Test Information", ""],
            ["Test Number:", test.test_number],
            ["Test Type:", test.test_type.value.replace("_", " ").title()],
            ["Test Date:", test.completed_at.strftime("%d %B %Y") if test.completed_at else "-"],
            ["Test Load:", f"{test.test_load} {test.load_unit}" if test.test_load else "-"],
            ["Result:", test.result.value.upper()],
        ]
        
        test_table = Table(test_data, colWidths=[150, 300])
        test_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f5f5f5")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#1a1a1a")),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TEXTCOLOR', (0, 1), (0, -1), colors.HexColor("#666666")),
            ('TEXTCOLOR', (1, 1), (1, -1), colors.HexColor("#1a1a1a")),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e0e0e0")),
        ]))
        
        content.append(test_table)
        content.append(Spacer(1, 20))
    
    # Certification details
    cert_data = [
        ["Certification Details", ""],
        ["Issue Date:", certificate.issue_date.strftime("%d %B %Y")],
        ["Expiry Date:", certificate.expiry_date.strftime("%d %B %Y")],
        ["Inspector:", certificate.inspector_name or "-"],
        ["Certification:", certificate.inspector_certification or "-"],
    ]
    
    cert_table = Table(cert_data, colWidths=[150, 300])
    cert_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f5f5f5")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#1a1a1a")),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TEXTCOLOR', (0, 1), (0, -1), colors.HexColor("#666666")),
        ('TEXTCOLOR', (1, 1), (1, -1), colors.HexColor("#1a1a1a")),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e0e0e0")),
    ]))
    
    content.append(cert_table)
    content.append(Spacer(1, 30))
    
    # Notes
    if certificate.notes:
        content.append(Paragraph("Notes:", label_style))
        content.append(Paragraph(certificate.notes, styles['Normal']))
        content.append(Spacer(1, 20))
    
    # Footer with signature and QR code
    footer_text = f"""
    <para alignment="center">
    <font size="9" color="#666666">
    This certificate was digitally signed on {certificate.signed_at.strftime("%d %B %Y at %H:%M") if certificate.signed_at else '-'}
    by {certificate.signed_by or 'CertiTrack System'}.
    <br/><br/>
    Verify this certificate at: certitrack.app/verify/{certificate.certificate_number}
    </font>
    </para>
    """
    content.append(Paragraph(footer_text, styles['Normal']))
    
    # Build PDF
    doc.build(content)
    
    # Calculate hash for integrity verification
    with open(filepath, "rb") as f:
        pdf_hash = hashlib.sha256(f.read()).hexdigest()
    
    # Update certificate with hash
    certificate.pdf_hash = pdf_hash
    
    return filepath


def _get_certificate_type_name(cert_type: CertificateType) -> str:
    """Get human-readable certificate type name"""
    names = {
        CertificateType.LOAD_TEST: "Load Test Certificate",
        CertificateType.THOROUGH_EXAMINATION: "Thorough Examination Certificate",
        CertificateType.CALIBRATION: "Calibration Certificate",
        CertificateType.INSPECTION: "Inspection Certificate",
        CertificateType.ANNUAL: "Annual Certification",
    }
    return names.get(cert_type, "Certificate")

