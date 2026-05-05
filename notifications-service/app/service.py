"""Business logic for saving and querying notifications."""
import logging
import uuid
from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Notification, NotificationType
from app.schemas import EmployeeCreatedPayload, EmployeeDeletedPayload

logger = logging.getLogger(__name__)


class NotificationsService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def handle_employee_created(self, payload: EmployeeCreatedPayload) -> None:
        message = (
            f"Welcome {payload.name}! Your employee account has been successfully created. "
            "We are glad to have you on board."
        )
        notification = Notification(
            id=str(uuid.uuid4()),
            type=NotificationType.WELCOME,
            recipient=payload.email,
            message=message,
            employee_id=payload.id,
        )
        self.db.add(notification)
        await self.db.commit()

        logger.info(
            "[NOTIFICATION] Type: WELCOME | To: %s | Message: \"%s\"",
            payload.email,
            message,
        )

    async def handle_employee_deleted(self, payload: EmployeeDeletedPayload) -> None:
        message = (
            f"Dear {payload.name}, your employee account has been deactivated. "
            "If you have any questions, please contact HR."
        )
        notification = Notification(
            id=str(uuid.uuid4()),
            type=NotificationType.OFFBOARDING,
            recipient=payload.email,
            message=message,
            employee_id=payload.id,
        )
        self.db.add(notification)
        await self.db.commit()

        logger.info(
            "[NOTIFICATION] Type: OFFBOARDING | To: %s | Message: \"%s\"",
            payload.email,
            message,
        )

    async def find_all(self) -> List[Notification]:
        result = await self.db.execute(
            select(Notification).order_by(Notification.sent_at.desc())
        )
        return list(result.scalars().all())

    async def find_by_employee_id(self, employee_id: str) -> List[Notification]:
        result = await self.db.execute(
            select(Notification)
            .where(Notification.employee_id == employee_id)
            .order_by(Notification.sent_at.desc())
        )
        return list(result.scalars().all())
