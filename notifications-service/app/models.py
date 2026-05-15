"""Notification SQLAlchemy model — mirrors the original TypeORM entity."""
import enum
import uuid
from datetime import datetime

from sqlalchemy import Column, Enum, String, Text, DateTime, func
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class NotificationType(str, enum.Enum):
    WELCOME = "WELCOME"
    OFFBOARDING = "OFFBOARDING"
    # FIX: Se agregó PASSWORD_RECOVERY, que faltaba en la reescritura de NestJS a Python.
    # El auth-service emite eventos "user.created" y "user.recovered" que requieren este tipo
    # para persistir las notificaciones de recuperación de contraseña en la base de datos.
    PASSWORD_RECOVERY = "PASSWORD_RECOVERY"


class Notification(Base):
    __tablename__ = "notifications"

    id: str = Column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    type: NotificationType = Column(Enum(NotificationType, name="notifications_type_enum"), nullable=False)
    recipient: str = Column(String(255), nullable=False)
    message: str = Column(Text, nullable=False)
    employee_id: str = Column(String(255), nullable=False, name="employeeId")
    # FIX: Se agregó reset_token para almacenar el token de recuperación de contraseña.
    # Corresponde a la columna "resetToken" que existía en la entidad TypeORM original
    # pero no fue incluida en la migración a SQLAlchemy.
    reset_token: str = Column(String(512), nullable=True, name="resetToken")
    sent_at: datetime = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        name="sent_at",
    )
