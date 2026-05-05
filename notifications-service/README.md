# Notifications Service — Python / FastAPI

Microservicio reactivo que consume eventos de RabbitMQ y registra el historial de notificaciones.
**Reescrito de NestJS/TypeScript a Python/FastAPI** como parte del Reto 6.

---

## Stack tecnológico

| Categoría       | Tecnología            |
|-----------------|-----------------------|
| Lenguaje        | Python 3.12           |
| Framework HTTP  | FastAPI 0.115         |
| ORM             | SQLAlchemy 2 (async)  |
| Base de datos   | PostgreSQL 16         |
| Driver async DB | asyncpg               |
| Message broker  | RabbitMQ (aio-pika)   |
| Seguridad       | PyJWT                 |
| Docs            | Swagger UI / ReDoc    |

---

## Endpoints HTTP

Todos los endpoints requieren **Bearer JWT** con rol `USER` o `ADMIN`.

| Método | Ruta                             | Descripción                              |
|--------|----------------------------------|------------------------------------------|
| GET    | `/notifications`                 | Lista todas las notificaciones           |
| GET    | `/notifications/{employeeId}`    | Notificaciones de un empleado específico |
| GET    | `/api`                           | Swagger UI                               |
| GET    | `/api/redoc`                     | ReDoc                                    |
| GET    | `/api/openapi.json`              | Esquema OpenAPI JSON                     |

---

## Eventos RabbitMQ consumidos

| Patrón             | Acción                                                  |
|--------------------|--------------------------------------------------------|
| `employee.created` | Guarda notificación tipo `WELCOME` en la DB             |
| `employee.deleted` | Guarda notificación tipo `OFFBOARDING` en la DB         |
| `user.created`     | Registra log de seguridad (enlace de reset de contraseña)|
| `user.recovered`   | Registra log de seguridad (enlace de reset de contraseña)|

Exchange: `employees_exchange` (fanout) — Queue: `notifications_queue`

---

## Seguridad (JWT)

- Tokens firmados con HS256, secreto compartido (`JWT_SECRET`)
- Los tokens de tipo `RESET_PASSWORD` son rechazados con 401
- ADMIN siempre tiene acceso; los roles `USER` y `ADMIN` pueden consultar notificaciones

---

## Estructura del proyecto

```
notifications-service/
├── app/
│   ├── __init__.py
│   ├── config.py       # Configuración desde variables de entorno
│   ├── consumer.py     # Consumidor aio-pika (RabbitMQ)
│   ├── database.py     # Engine async SQLAlchemy + sesión
│   ├── main.py         # Bootstrap FastAPI (startup, router, OpenAPI)
│   ├── models.py       # Modelo SQLAlchemy Notification
│   ├── router.py       # Endpoints HTTP FastAPI
│   ├── schemas.py      # Schemas Pydantic (request/response)
│   └── security.py     # JWT decode + dependency require_roles()
├── requirements.txt
├── Dockerfile
├── .env                # Variables de entorno locales
└── README.md
```

---

## Variables de entorno

| Variable       | Valor por defecto                      | Descripción                  |
|----------------|----------------------------------------|------------------------------|
| `DB_HOST`      | `localhost`                            | Host de PostgreSQL           |
| `DB_PORT`      | `5434`                                 | Puerto de PostgreSQL         |
| `DB_USERNAME`  | `postgres`                             |                              |
| `DB_PASSWORD`  | `postgres`                             |                              |
| `DB_NAME`      | `notifications_db`                     |                              |
| `RABBITMQ_URL` | `amqp://admin:admin@localhost:5672`    | URL de conexión AMQP         |
| `JWT_SECRET`   | `supersecret2026`                      | Secreto compartido para JWT  |

---

## Ejecución local

```bash
# Crear y activar entorno virtual
python -m venv .venv && source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# (Opcional) cargar variables de entorno
export $(cat .env | xargs)

# Iniciar el servicio
uvicorn app.main:app --host 0.0.0.0 --port 8084 --reload
```

Swagger UI disponible en: **http://localhost:8084/api**

---

## Docker

```bash
# Construir imagen
docker build -t notifications-service .

# Ejecutar con docker-compose (desde la raíz del proyecto)
docker compose up notifications-service
```

---

## Comparativa NestJS → FastAPI

| Concepto NestJS              | Equivalente FastAPI/Python          |
|------------------------------|-------------------------------------|
| `@Module`                    | `FastAPI()` + `include_router()`    |
| `TypeOrmModule`              | SQLAlchemy async engine             |
| `@Entity` / `@Column`        | SQLAlchemy `Column` / `Base`        |
| `@Injectable` Service        | Clase `NotificationsService(db)`    |
| `@Controller` / `@Get`       | `APIRouter` + `@router.get()`       |
| `@EventPattern` Consumer     | `queue.consume()` con aio-pika      |
| `ValidationPipe`             | Pydantic `BaseModel` automático     |
| `JwtAuthGuard`               | `Depends(get_current_user)`         |
| `RolesGuard` + `@Roles()`    | `Depends(require_roles(...))`       |
| `SwaggerModule.setup('api')` | `docs_url="/api"`                   |
| `addBearerAuth()`            | `securitySchemes.bearerAuth` en OAS |
