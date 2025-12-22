"""
CertiTrack - Digital Testing & Certification Platform
Main FastAPI Application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import settings
from app.database import init_db
from app.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("🚀 Starting CertiTrack API...")
    await init_db()
    print("✅ Database initialized")
    
    # Create static directories
    static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
    os.makedirs(os.path.join(static_dir, "qrcodes"), exist_ok=True)
    os.makedirs(os.path.join(static_dir, "certificates"), exist_ok=True)
    os.makedirs(os.path.join(static_dir, "uploads"), exist_ok=True)
    
    yield
    
    # Shutdown
    print("👋 Shutting down CertiTrack API...")


# Create FastAPI app
app = FastAPI(
    title="CertiTrack API",
    redirect_slashes=False,  # Prevent redirect that breaks CORS
    description="""
    ## Digital Testing & Certification Platform
    
    CertiTrack is a SaaS platform for managing heavy equipment testing, 
    certification, and compliance tracking.
    
    ### Features
    - **Asset Registry**: Database for Cranes, Load Cells, Shackles, Wire Ropes
    - **QR Code Tracking**: Scan equipment for instant access to records
    - **Automated Testing**: Validate test results automatically, eliminating human error
    - **Digital Certificates**: One-click PDF certificate generation
    - **Expiry Alerts**: Notifications before certificates expire
    - **ERPNext Ready**: Designed for integration with ERPNext
    
    ### Target Market
    - Shipyard Companies (Galangan)
    - Inspection Vendors
    - Heavy Logistics Companies
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        settings.frontend_url,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
static_path = os.path.join(os.path.dirname(__file__), "..", "static")
if os.path.exists(static_path):
    app.mount("/static", StaticFiles(directory=static_path), name="static")

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "app": "CertiTrack API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/api/docs",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "database": "connected",
    }

