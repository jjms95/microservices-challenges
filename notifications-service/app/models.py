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


class Notification(Base):
    __tablename__ = "notifications"

    id: str = Column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    type: NotificationType = Column(Enum(NotificationType), nullable=False)
    recipient: str = Column(String(255), nullable=False)
    message: str = Column(Text, nullable=False)
    employee_id: str = Column(String(255), nullable=False, name="employeeId")
    sent_at: datetime = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        name="sent_at",
    )
