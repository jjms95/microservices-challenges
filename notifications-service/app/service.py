"""Business logic for saving and querying notifications."""
import logging
import uuid
from typing import List

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Notification, NotificationType
from app.schemas import EmployeeCreatedPayload, EmployeeDeletedPayload, UserEventPayload

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

    async def delete_all(self) -> int:
        result = await self.db.execute(delete(Notification))
        await self.db.commit()
        return result.rowcount

    async def handle_user_event(self, payload: UserEventPayload, event_name: str) -> None:
        """Persiste una notificación de tipo PASSWORD_RECOVERY en la base de datos.

        FIX: Este método fue agregado porque la versión original de la reescritura
        (de NestJS a Python) solo imprimía un log al recibir eventos "user.created"
        y "user.recovered" desde el auth-service, sin persistir la notificación en
        la base de datos. Esto causaba inconsistencia con el comportamiento esperado
        del consumer original de NestJS (notifications.consumer.ts), que sí creaba
        un registro Notification con tipo PASSWORD_RECOVERY y el resetToken.

        Flujo:
            1. Busca el employee_id asociado al email del usuario en notificaciones
               existentes. Si no lo encuentra, usa "unknown".
            2. Crea una notificación PASSWORD_RECOVERY con el token de recuperación.
               3. Persiste en la base de datos y loguea la operación.

        Args:
            payload: Datos del evento (email y token de recuperación).
            event_name: Nombre del evento ("user.created" o "user.recovered").
        """
        result = await self.db.execute(
            select(Notification.employee_id)
            .where(Notification.recipient == payload.email)
            .limit(1)
        )
        employee_id = result.scalar_one_or_none()
        if not employee_id:
            employee_id = "unknown"

        message = (
            f"Para establecer o recuperar su contraseña, utilice este enlace: "
            f"https://app.empresa.com/reset?token={payload.token}"
        )
        notification = Notification(
            id=str(uuid.uuid4()),
            type=NotificationType.PASSWORD_RECOVERY,
            recipient=payload.email,
            message=message,
            employee_id=employee_id,
            reset_token=payload.token,
        )
        self.db.add(notification)
        await self.db.commit()

        logger.info(
            "[NOTIFICACIÓN] Tipo: SEGURIDAD | Para: %s | Mensaje: %s",
            payload.email,
            message,
        )
