"""Pydantic schemas for request/response serialization and Swagger docs."""
from datetime import datetime
from typing import Optional
import uuid

from pydantic import BaseModel, Field

from app.models import NotificationType


class NotificationOut(BaseModel):
    """Response schema for a single notification record."""

    id: str = Field(example="550e8400-e29b-41d4-a716-446655440000")
    type: NotificationType = Field(example=NotificationType.WELCOME)
    recipient: str = Field(example="john.doe@company.com")
    message: str = Field(example="Welcome John Doe! Your account has been created.")
    employee_id: str = Field(alias="employee_id", example="uuid-employee-xxxx")
    # FIX: Se agregó reset_token al schema de respuesta para exponer el campo que se
    # añadió al modelo Notification. Permite que la API devuelva el token de recuperación
    # de contraseña, manteniendo paridad con la entidad original de NestJS/TypeORM.
    reset_token: Optional[str] = Field(None, alias="resetToken")
    sent_at: datetime = Field(alias="sent_at")

    model_config = {
        "from_attributes": True,
        "populate_by_name": True,
    }


# ── RabbitMQ payload schemas ────────────────────────────────────────────────

class EmployeeCreatedPayload(BaseModel):
    id: str
    name: str
    email: str
    department_id: Optional[str] = Field(None, alias="departmentId")
    hire_date: Optional[str] = Field(None, alias="hireDate")

    model_config = {"populate_by_name": True}


class EmployeeDeletedPayload(BaseModel):
    id: str
    name: str
    email: str


class UserEventPayload(BaseModel):
    """Payload for user.created / user.recovered events."""
    email: str
    token: str
