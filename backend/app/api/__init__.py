"""
CertiTrack API Routes
"""
from fastapi import APIRouter
from app.api.routes import auth, assets, certificates, tests, users, dashboard

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(assets.router, prefix="/assets", tags=["Assets"])
api_router.include_router(tests.router, prefix="/tests", tags=["Tests"])
api_router.include_router(certificates.router, prefix="/certificates", tags=["Certificates"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])

