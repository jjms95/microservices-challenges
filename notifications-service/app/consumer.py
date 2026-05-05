"""
RabbitMQ consumer — equivalent to NestJS NotificationsConsumer.

Listens on the 'notifications_queue' bound to the 'employees_exchange' (fanout).
Handles four event patterns:
  - employee.created   → WELCOME notification
  - employee.deleted   → OFFBOARDING notification
  - user.created       → security log (password reset link)
  - user.recovered     → security log (password reset link)

Uses manual ACK (equivalent to noAck: false in NestJS),
and nacks without requeue on processing errors to avoid infinite loops.
"""
import asyncio
import json
import logging

import aio_pika
from aio_pika import IncomingMessage, ExchangeType

from app.config import settings
from app.database import AsyncSessionLocal
from app.schemas import EmployeeCreatedPayload, EmployeeDeletedPayload, UserEventPayload
from app.service import NotificationsService

logger = logging.getLogger(__name__)


async def _handle_employee_created(data: dict) -> None:
    payload = EmployeeCreatedPayload.model_validate(data)
    logger.info("[EVENT RECEIVED] employee.created | id: %s", payload.id)
    async with AsyncSessionLocal() as db:
        svc = NotificationsService(db)
        await svc.handle_employee_created(payload)


async def _handle_employee_deleted(data: dict) -> None:
    payload = EmployeeDeletedPayload.model_validate(data)
    logger.info("[EVENT RECEIVED] employee.deleted | id: %s", payload.id)
    async with AsyncSessionLocal() as db:
        svc = NotificationsService(db)
        await svc.handle_employee_deleted(payload)


async def _handle_user_event(data: dict, event_name: str) -> None:
    payload = UserEventPayload.model_validate(data)
    logger.info(
        "[NOTIFICACIÓN] Tipo: SEGURIDAD | Para: %s | Mensaje: Para establecer o recuperar "
        "su contraseña, utilice este enlace: https://app.empresa.com/reset?token=%s",
        payload.email,
        payload.token,
    )


# ── Dispatch table (event pattern → handler) ────────────────────────────────
_HANDLERS = {
    "employee.created": _handle_employee_created,
    "employee.deleted": _handle_employee_deleted,
    "user.created": lambda d: _handle_user_event(d, "user.created"),
    "user.recovered": lambda d: _handle_user_event(d, "user.recovered"),
}


async def _process_message(message: IncomingMessage) -> None:
    """
    Decode an AMQP message, route it to the correct handler, and ACK/NACK.
    Mirrors the try/catch + channel.ack/channel.nack(false, false) pattern.
    """
    async with message.process(requeue=False):  # auto-nack on exception, no requeue
        try:
            body = json.loads(message.body.decode())

            # NestJS wraps the payload under a 'data' key when publishing via RMQ transport
            pattern = body.get("pattern", "")
            data = body.get("data", body)  # fallback to raw body for plain publishers

            handler = _HANDLERS.get(pattern)
            if handler is None:
                logger.warning("[CONSUMER] Unknown event pattern: %s — ignoring", pattern)
                return

            await handler(data)

        except Exception as exc:  # noqa: BLE001
            logger.error("[CONSUMER] Error processing message: %s", exc, exc_info=True)
            raise  # triggers nack via process() context manager


async def start_consumer() -> None:
    """
    Connect to RabbitMQ, declare the fanout exchange and queue,
    and begin consuming messages.
    Retries indefinitely on connection failure (Docker startup ordering).
    """
    while True:
        try:
            connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
            async with connection:
                channel = await connection.channel()
                await channel.set_qos(prefetch_count=1)

                # Declare the same fanout exchange used by NestJS employees-service
                exchange = await channel.declare_exchange(
                    settings.RABBITMQ_EXCHANGE,
                    ExchangeType.FANOUT,
                    durable=True,
                )

                # Declare a durable queue (mirrors queueOptions: { durable: true })
                queue = await channel.declare_queue(
                    settings.RABBITMQ_QUEUE,
                    durable=True,
                )
                await queue.bind(exchange)

                logger.info(
                    "📨 RabbitMQ consumer started — exchange: %s | queue: %s",
                    settings.RABBITMQ_EXCHANGE,
                    settings.RABBITMQ_QUEUE,
                )

                await queue.consume(_process_message)
                await asyncio.Future()  # block until connection closes

        except Exception as exc:  # noqa: BLE001
            logger.warning("RabbitMQ not ready (%s). Retrying in 5 s…", exc)
            await asyncio.sleep(5)
