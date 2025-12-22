"""
API Dependencies
Common dependencies for authentication and database access
"""
from typing import Optional
from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.database import get_db
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            token, 
            settings.jwt_secret_key, 
            algorithms=[settings.jwt_algorithm]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    result = await db.execute(
        select(User).where(User.id == UUID(user_id))
    )
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensure user is active"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


def require_roles(*roles: UserRole):
    """Dependency factory to require specific roles"""
    async def role_checker(
        current_user: User = Depends(get_current_user)
    ) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This action requires one of these roles: {[r.value for r in roles]}"
            )
        return current_user
    return role_checker


# Common role dependencies
require_admin = require_roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
require_inspector = require_roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.INSPECTOR)


class CompanyFilter:
    """Dependency to filter by company for multi-tenant queries"""
    
    def __init__(
        self,
        current_user: User = Depends(get_current_user)
    ):
        self.user = current_user
        self.company_id = current_user.company_id
    
    def apply(self, query):
        """Apply company filter to query"""
        if self.user.role != UserRole.SUPER_ADMIN and self.company_id:
            # Non-super admins only see their company data
            query = query.filter_by(company_id=self.company_id)
        return query

