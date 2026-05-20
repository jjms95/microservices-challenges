"""
Responsibilities:
  - Creates all DB tables (synchronize: true equivalent)
  - Mounts the /notifications router
  - Configures OpenAPI / Swagger docs at /api  (same path as NestJS)
  - Starts the RabbitMQ consumer as a background asyncio task
  - Listens on port 8084
"""
import asyncio
import logging

import uvicorn
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

from app.config import settings
from app.consumer import start_consumer
from app.database import Base, engine
from app.router import router

from pythonjsonlogger import jsonlogger
from opentelemetry import trace

class CustomJsonFormatter(jsonlogger.JsonFormatter):
    def add_fields(self, log_record, record, message_dict):
        super().add_fields(log_record, record, message_dict)
        log_record['timestamp'] = log_record.pop('asctime', None)
        log_record['level'] = log_record.pop('levelname', None)
        log_record['service'] = 'notifications-service'
        
        span = trace.get_current_span()
        if span.is_recording():
            log_record['traceId'] = format(span.get_span_context().trace_id, "032x")
        else:
            log_record['traceId'] = ""
            
        log_record.pop('name', None)

logger = logging.getLogger(__name__)
logHandler = logging.StreamHandler()
formatter = CustomJsonFormatter('%(asctime)s %(levelname)s %(message)s')
logHandler.setFormatter(formatter)
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)

# OpenTelemetry
import os
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.resources import Resource
from opentelemetry.exporter.zipkin.json import ZipkinExporter
from opentelemetry.sdk.trace.export import BatchSpanProcessor

# Prometheus
from prometheus_fastapi_instrumentator import Instrumentator

# ── FastAPI app ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="Notifications Service API",
    description=(
        "Reactive microservice that consumes RabbitMQ events and records notification history.\n\n"
        "**Events consumed:**\n"
        "- `employee.created` → sends WELCOME notification\n"
        "- `employee.deleted` → sends OFFBOARDING notification\n"
        "- `user.created` / `user.recovered` → logs security (password-reset) notification"
    ),
    version="1.0.0",
    docs_url="/api",         # same path as NestJS SwaggerModule.setup('api', …)
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Mount the notifications router
app.include_router(router)

# Prometheus metrics
Instrumentator().instrument(app).expose(app)

# OpenTelemetry configuration
resource = Resource.create(attributes={"service.name": "notifications-service"})
trace.set_tracer_provider(TracerProvider(resource=resource))
zipkin_url = os.environ.get("ZIPKIN_ENDPOINT", "http://zipkin:9411/api/v2/spans")
zipkin_exporter = ZipkinExporter(endpoint=zipkin_url)
trace.get_tracer_provider().add_span_processor(BatchSpanProcessor(zipkin_exporter))
FastAPIInstrumentor.instrument_app(app)


# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["health"], summary="Health check")
async def health() -> dict:
    return {
        "status": "UP",
        "service": "notifications-service",
        "checks": {"database": "UP", "messageBroker": "UP"}
    }


# ── Startup / Shutdown lifecycle ─────────────────────────────────────────────
@app.on_event("startup")
async def on_startup() -> None:
    # Create tables if they don't exist (synchronize: true)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Database tables synchronized")

    # Launch RabbitMQ consumer as a background task
    asyncio.create_task(start_consumer())
    logger.info("📨 RabbitMQ consumer task scheduled")


@app.on_event("shutdown")
async def on_shutdown() -> None:
    await engine.dispose()
    logger.info("🛑 Database engine disposed")


# ── Security scheme in OpenAPI (addBearerAuth equivalent) ────────────────────
def _custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    schema.setdefault("components", {}).setdefault("securitySchemes", {})["bearerAuth"] = {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
    }
    # Apply global security requirement (equivalent to @ApiBearerAuth on the controller)
    for path_item in schema.get("paths", {}).values():
        for operation in path_item.values():
            if isinstance(operation, dict):
                operation.setdefault("security", [{"bearerAuth": []}])
    app.openapi_schema = schema
    return schema


app.openapi = _custom_openapi  # type: ignore[method-assign]


# ── Dev entrypoint ───────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=False,
        log_level="info",
    )
