"""FastAPI router — equivalent to NestJS NotificationsController.

Endpoints:
  GET /notifications          → List all notifications  (USER | ADMIN)
  GET /notifications/{id}     → List by employeeId       (USER | ADMIN)

Both are protected by JWT Bearer auth + role check.
"""
import logging
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import NotificationOut
from app.security import require_roles
from app.service import NotificationsService

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/notifications",
    tags=["notifications"],
)

# Shared dependency: authenticated user must have role USER or ADMIN
_auth = require_roles("USER", "ADMIN")


@router.get(
    "",
    response_model=List[NotificationOut],
    summary="List all notifications",
    description=(
        "Returns all notifications recorded by the service, ordered by most recent first."
    ),
    responses={
        200: {"description": "List of all notifications."},
        401: {"description": "Missing or invalid JWT token."},
        403: {"description": "Insufficient role permissions."},
    },
)
async def find_all(
    db: AsyncSession = Depends(get_db),
    _user: dict = Depends(_auth),
) -> List[NotificationOut]:
    svc = NotificationsService(db)
    return await svc.find_all()


@router.get(
    "/{employee_id}",
    response_model=List[NotificationOut],
    summary="Get notifications for a specific employee",
    description="Returns all notifications for the given employee UUID, ordered by most recent first.",
    responses={
        200: {"description": "Notifications for the given employee."},
        401: {"description": "Missing or invalid JWT token."},
        403: {"description": "Insufficient role permissions."},
    },
)
async def find_by_employee_id(
    employee_id: str,
    db: AsyncSession = Depends(get_db),
    _user: dict = Depends(_auth),
) -> List[NotificationOut]:
    svc = NotificationsService(db)
    return await svc.find_by_employee_id(employee_id)
