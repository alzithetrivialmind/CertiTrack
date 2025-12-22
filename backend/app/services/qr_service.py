"""
QR Code Service
Generate QR codes for asset tracking
"""
import os
import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer
from io import BytesIO
import base64

from app.config import settings


# Ensure QR codes directory exists
QR_CODES_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "static", "qrcodes")
os.makedirs(QR_CODES_DIR, exist_ok=True)


async def generate_qr_code(data: str, asset_id: str) -> str:
    """
    Generate QR code for asset tracking
    Returns the file path or base64 encoded image
    """
    # Create QR code with custom styling
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    
    # Add data
    qr.add_data(data)
    qr.make(fit=True)
    
    # Create styled image
    img = qr.make_image(
        image_factory=StyledPilImage,
        module_drawer=RoundedModuleDrawer(),
        fill_color="#1a1a1a",
        back_color="white"
    )
    
    # Save to file
    filename = f"{asset_id}.png"
    filepath = os.path.join(QR_CODES_DIR, filename)
    img.save(filepath)
    
    # Return relative path for storage
    return f"/static/qrcodes/{filename}"


async def generate_qr_code_base64(data: str) -> str:
    """
    Generate QR code and return as base64 string
    Useful for embedding in PDFs
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=8,
        border=2,
    )
    
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="#1a1a1a", back_color="white")
    
    # Convert to base64
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"


def decode_qr_data(qr_data: str) -> dict:
    """
    Parse QR code data
    Format: CT-{asset_uuid}
    """
    if not qr_data.startswith("CT-"):
        return {"valid": False, "error": "Invalid QR format"}
    
    try:
        asset_id = qr_data.replace("CT-", "")
        return {
            "valid": True,
            "asset_id": asset_id,
        }
    except Exception as e:
        return {"valid": False, "error": str(e)}

