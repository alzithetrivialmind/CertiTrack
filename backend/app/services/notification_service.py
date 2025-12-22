"""
Notification Service
Email and WhatsApp alerts for certificate expiry
"""
import asyncio
from datetime import date, timedelta
from typing import List, Optional
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import aiosmtplib
from jinja2 import Template
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.models.asset import Asset
from app.models.user import User, Company


async def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None
) -> bool:
    """Send email using SMTP"""
    if not settings.smtp_user or not settings.smtp_password:
        print(f"SMTP not configured. Would send email to {to_email}: {subject}")
        return False
    
    try:
        message = MIMEMultipart("alternative")
        message["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
        message["To"] = to_email
        message["Subject"] = subject
        
        if text_content:
            message.attach(MIMEText(text_content, "plain"))
        message.attach(MIMEText(html_content, "html"))
        
        await aiosmtplib.send(
            message,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user,
            password=settings.smtp_password,
            use_tls=True,
        )
        
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False


async def send_expiry_alert(
    asset: Asset,
    recipients: List[str],
    days_until_expiry: int
) -> bool:
    """Send certificate expiry alert"""
    subject = f"⚠️ Certificate Expiring: {asset.name} ({asset.asset_code})"
    
    html_template = Template("""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .alert-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .info-table td { padding: 10px; border-bottom: 1px solid #eee; }
            .info-table td:first-child { color: #666; width: 40%; }
            .btn { display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⚠️ Certificate Expiry Alert</h1>
            </div>
            <div class="content">
                <div class="alert-box">
                    <strong>{{ days }} days remaining</strong> until certificate expiry
                </div>
                
                <h3>Asset Details</h3>
                <table class="info-table">
                    <tr>
                        <td>Asset Code</td>
                        <td><strong>{{ asset.asset_code }}</strong></td>
                    </tr>
                    <tr>
                        <td>Name</td>
                        <td>{{ asset.name }}</td>
                    </tr>
                    <tr>
                        <td>Type</td>
                        <td>{{ asset.asset_type.value | replace('_', ' ') | title }}</td>
                    </tr>
                    <tr>
                        <td>Location</td>
                        <td>{{ asset.location or '-' }}</td>
                    </tr>
                    <tr>
                        <td>Certificate Expiry</td>
                        <td><strong>{{ asset.certificate_expiry_date }}</strong></td>
                    </tr>
                </table>
                
                <p>Please schedule an inspection and certification renewal to ensure compliance.</p>
                
                <a href="{{ frontend_url }}/assets/{{ asset.id }}" class="btn">View Asset Details</a>
                
                <div class="footer">
                    <p>This is an automated alert from CertiTrack.</p>
                    <p>© {{ year }} CertiTrack - Digital Testing & Certification Platform</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """)
    
    html_content = html_template.render(
        asset=asset,
        days=days_until_expiry,
        frontend_url=settings.frontend_url,
        year=date.today().year
    )
    
    text_content = f"""
    Certificate Expiry Alert
    
    {days_until_expiry} days remaining until certificate expiry
    
    Asset Details:
    - Asset Code: {asset.asset_code}
    - Name: {asset.name}
    - Type: {asset.asset_type.value}
    - Location: {asset.location or '-'}
    - Certificate Expiry: {asset.certificate_expiry_date}
    
    Please schedule an inspection and certification renewal.
    
    View at: {settings.frontend_url}/assets/{asset.id}
    """
    
    success = True
    for recipient in recipients:
        result = await send_email(recipient, subject, html_content, text_content)
        if not result:
            success = False
    
    return success


async def check_expiring_certificates(db: AsyncSession) -> List[dict]:
    """
    Check for certificates expiring within alert threshold
    Returns list of assets needing alerts
    """
    alert_date = date.today() + timedelta(days=settings.alert_days_before_expiry)
    
    result = await db.execute(
        select(Asset).where(
            Asset.is_deleted == False,
            Asset.certificate_expiry_date <= alert_date,
            Asset.certificate_expiry_date >= date.today()
        )
    )
    
    expiring_assets = result.scalars().all()
    
    alerts = []
    for asset in expiring_assets:
        days_remaining = (asset.certificate_expiry_date - date.today()).days
        alerts.append({
            "asset": asset,
            "days_remaining": days_remaining,
            "company_id": asset.company_id
        })
    
    return alerts


async def send_daily_alerts(db: AsyncSession) -> dict:
    """
    Send daily alert emails for expiring certificates
    Called by scheduled task (Celery)
    """
    alerts = await check_expiring_certificates(db)
    
    sent_count = 0
    failed_count = 0
    
    # Group by company
    company_alerts = {}
    for alert in alerts:
        cid = str(alert["company_id"])
        if cid not in company_alerts:
            company_alerts[cid] = []
        company_alerts[cid].append(alert)
    
    # Send alerts per company
    for company_id, company_alert_list in company_alerts.items():
        # Get company admins
        result = await db.execute(
            select(User).where(
                User.company_id == company_id,
                User.is_active == True
            )
        )
        users = result.scalars().all()
        recipients = [u.email for u in users]
        
        for alert in company_alert_list:
            success = await send_expiry_alert(
                alert["asset"],
                recipients,
                alert["days_remaining"]
            )
            if success:
                sent_count += 1
            else:
                failed_count += 1
    
    return {
        "total_alerts": len(alerts),
        "sent": sent_count,
        "failed": failed_count
    }

