"""JWT security layer — equivalent to NestJS JwtStrategy + JwtAuthGuard + RolesGuard."""
import logging
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings

logger = logging.getLogger(__name__)

# Reusable Bearer token extractor (equivalent to ExtractJwt.fromAuthHeaderAsBearerToken)
bearer_scheme = HTTPBearer(auto_error=True)


def _decode_token(token: str) -> dict:
    """
    Decode and validate a JWT token.
    Raises HTTP 401 if invalid, expired, or uses a RESET_PASSWORD token.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Equivalent to: if (payload.type === 'RESET_PASSWORD') throw new UnauthorizedException()
    if payload.get("type") == "RESET_PASSWORD":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token usage",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """
    FastAPI dependency: validates JWT and returns the user dict.
    Equivalent to JwtAuthGuard.
    """
    payload = _decode_token(credentials.credentials)
    return {"id": payload.get("sub"), "role": payload.get("role")}


def require_roles(*allowed_roles: str):
    """
    Factory that returns a FastAPI dependency enforcing role-based access.
    Equivalent to @Roles('USER','ADMIN') + RolesGuard.
    ADMIN always passes regardless of the allowed_roles list.
    """

    def _check(user: dict = Depends(get_current_user)) -> dict:
        if user["role"] == "ADMIN":
            return user
        if user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return _check
