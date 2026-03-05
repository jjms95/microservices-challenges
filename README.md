# 🚀 Microservices Challenges — Sistema Completo

> Sistema de onboarding y offboarding de empleados construido con microservicios NestJS, TypeORM, PostgreSQL, RabbitMQ y Docker Compose.

## 📐 Arquitectura del Sistema (Reto 3)

```
🌐 Cliente HTTP (curl / Postman / Bruno)
        │
        ├──────────────────────────────────────────────────────┐
        │                                                      │
        ▼                                                      ▼
👥 employees-service :8080          🏢 departments-service :8081
        │  │                                │
        │  └──[HTTP REST validates dept]────┘
        │
        │  Publica eventos:
        │  ┌─────────────────────────────────────────┐
        │  │  employee.created / employee.deleted     │
        │  └──────────────────┬──────────────────────┘
        │                     ▼
        │          📨 RabbitMQ (fanout exchange)
        │             employees_exchange :5672
        │             Management UI      :15672
        │                  │
        │         ┌────────┴────────┐
        │         ▼                 ▼
        │  📋 profiles-service    📧 notifications-service
        │     :8083                  :8084
        │     Consume:               Consume:
        │     employee.created       employee.created
        │                            employee.deleted
        ▼         ▼                 ▼
🗄 db-employees  🗄 db-departments  🗄 db-profiles  🗄 db-notifications
   :5432            :5433              :5435            :5434
```

---

## 🛠️ Tech Stack

| Componente | Tecnología |
|---|---|
| Runtime | Node.js 20 |
| Framework | NestJS + TypeScript |
| ORM | TypeORM |
| Base de datos | PostgreSQL 16 |
| Message Broker | **RabbitMQ 3** (AMQP) |
| Contenedores | Docker + Docker Compose |
| Documentación API | Swagger (`@nestjs/swagger`) |

---

## 📨 Justificación del Message Broker: RabbitMQ

Se evaluaron cuatro opciones antes de seleccionar RabbitMQ:

| Broker | Pros | Contras |
|---|---|---|
| **RabbitMQ** ✅ | AMQP estándar, Management UI, exchanges/queues flexibles, soporte nativo en `@nestjs/microservices`, amplia documentación | Menor throughput que Kafka para streaming masivo |
| Apache Kafka | Alto throughput, persistencia de mensajes, ideal para streaming | Overhead de configuración elevado (Zookeeper/KRaft), complejo para casos sencillos |
| Redis Streams | Ligero, bajo overhead | No está pensado como message broker principal; limitado para patrones complejos |
| NATS | Ultra-ligero, cloud-native | Menor ecosistema en NestJS, menos documentación para AMQP patterns |

**RabbitMQ fue elegido porque:**
1. **Patrón fan-out nativo**: el exchange de tipo `fanout` permite que un evento publicado llegue simultáneamente a N consumers sin acoplar al publisher.
2. **Integración NestJS de primera clase**: `@nestjs/microservices` incluye `Transport.RMQ` con soporte completo para patterns `@EventPattern`.
3. **Management UI**: permite observar exchanges, colas y mensajes en tiempo real en `http://localhost:15672`, esencial para debugging y demostración.
4. **Curva de aprendizaje adecuada**: para el contexto de este reto educativo, RabbitMQ tiene documentación muy accesible y ejemplos abundantes.

---

## 🗂️ Servicios del Sistema

| Servicio | Puerto | Swagger | Rol | Reto |
|---|---|---|---|---|
| `employees-service` | `:8080` | [/api](http://localhost:8080/api) | Publisher de eventos + CRUD | R1, R2, R3 |
| `departments-service` | `:8081` | [/api](http://localhost:8081/api) | CRUD departamentos | R2 |
| `profiles-service` | `:8083` | [/api](http://localhost:8083/api) | Consumer async + REST | R3 |
| `notifications-service` | `:8084` | [/api](http://localhost:8084/api) | Consumer puramente reactivo | R3 |
| `message-broker` (RabbitMQ) | `:5672` / `:15672` | — | Fan-out exchange | R3 |

---

## 📋 Documentación de Eventos

### Exchange

| Propiedad | Valor |
|---|---|
| Nombre | `employees_exchange` |
| Tipo | `fanout` (todos los consumers reciben todos los eventos) |
| Durabilidad | `durable: true` |

### Eventos publicados

#### `employee.created`

**Productor:** `employees-service` (disparado por `POST /employees` exitoso)

**Payload:**
```json
{
  "id": "uuid-del-empleado",
  "name": "Juan Pérez",
  "email": "juan@empresa.com",
  "departmentId": "uuid-del-departamento",
  "hireDate": "2024-01-15T00:00:00.000Z"
}
```

**Consumidores:**
| Servicio | Cola | Acción |
|---|---|---|
| `notifications-service` | `notifications_queue` | Crea notificación tipo `WELCOME` y emite log estructurado |
| `profiles-service` | `profiles_queue` | Crea perfil por defecto con campos `phone`, `address`, `city`, `biography` vacíos |

---

#### `employee.deleted`

**Productor:** `employees-service` (disparado por `DELETE /employees/:id` exitoso)

**Payload:**
```json
{
  "id": "uuid-del-empleado",
  "name": "Juan Pérez",
  "email": "juan@empresa.com"
}
```

**Consumidores:**
| Servicio | Cola | Acción |
|---|---|---|
| `notifications-service` | `notifications_queue` | Crea notificación tipo `OFFBOARDING` y emite log estructurado |
| `profiles-service` | `profiles_queue` | Acknowledges sin acción (perfiles no reaccionan a eliminación) |

### Comportamiento ante fallos de publicación

- La publicación ocurre **después** de que la operación en base de datos sea exitosa.
- Si la publicación falla, el servicio **registra el error** en logs pero **no revierte** la operación de base de datos.
- El `EventsPublisherService` conecta a RabbitMQ al inicio (`OnModuleInit`) y reintenta automáticamente gracias a `amqp-connection-manager`.

---

## 📦 Prerrequisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo
- Puertos libres: `8080`, `8081`, `8083`, `8084`, `5432`, `5433`, `5434`, `5435`, `5672`, `15672`

---

## ⚡ Despliegue del Sistema Completo

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd microservices-challenges
```

### 2. Levantar todos los servicios con un solo comando

```bash
make prod
# equivalente a: docker compose up --build
```

Esto levanta **9 contenedores** en el orden correcto:
1. `message-broker` (RabbitMQ)
2. 4 bases de datos PostgreSQL (esperan healthcheck)
3. `departments-service`
4. `employees-service` (espera broker + departments)
5. `notifications-service` (espera broker)
6. `profiles-service` (espera broker)

### 3. Verificar que todos los servicios están corriendo

```bash
docker compose ps
```

### 4. Acceder a las interfaces

| Interfaz | URL | Credenciales |
|---|---|---|
| RabbitMQ Management UI | http://localhost:15672 | admin / admin |
| Swagger employees-service | http://localhost:8080/api | — |
| Swagger departments-service | http://localhost:8081/api | — |
| Swagger profiles-service | http://localhost:8083/api | — |
| Swagger notifications-service | http://localhost:8084/api | — |

---

## 🧪 Instrucciones de Prueba del Flujo Asincrónico

### Paso 1: Verificar que RabbitMQ está activo

Ir a http://localhost:15672 → Login con `admin/admin` → Verificar que existe el exchange `employees_exchange` y las colas `notifications_queue` y `profiles_queue`.

### Paso 2: Crear un departamento

```bash
curl -X POST http://localhost:8081/departments \
  -H "Content-Type: application/json" \
  -d '{"name": "Technology", "description": "Software and infrastructure department"}'

# Guarda el UUID del campo "id" en la respuesta
```

### Paso 3: Crear un empleado (dispara event fan-out)

```bash
curl -X POST http://localhost:8080/employees \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@empresa.com",
    "departmentId": "<UUID_DEPARTAMENTO>",
    "hireDate": "2024-01-15"
  }'

# Guarda el UUID del campo "id" en la respuesta
```

Este `POST` exitoso desencadena automáticamente:
- ✅ Evento `employee.created` publicado en `employees_exchange`
- ✅ `notifications-service` crea notificación WELCOME
- ✅ `profiles-service` crea perfil por defecto

### Paso 4: Verificar el perfil creado automáticamente

```bash
curl http://localhost:8083/profiles/<UUID_EMPLEADO>
```

**Respuesta esperada (200 OK):**
```json
{
  "id": "uuid-perfil",
  "employeeId": "<UUID_EMPLEADO>",
  "name": "Juan Pérez",
  "email": "juan@empresa.com",
  "phone": "",
  "address": "",
  "city": "",
  "biography": "",
  "createdAt": "2024-01-15T..."
}
```

### Paso 5: Verificar la notificación de bienvenida

```bash
curl http://localhost:8084/notifications/<UUID_EMPLEADO>
```

**Respuesta esperada (200 OK):**
```json
[
  {
    "id": "uuid-notif",
    "type": "WELCOME",
    "recipient": "juan@empresa.com",
    "message": "Welcome Juan Pérez! Your employee account has been successfully created...",
    "employeeId": "<UUID_EMPLEADO>",
    "sentAt": "2024-01-15T..."
  }
]
```

**Log esperado en la consola de notifications-service:**
```
[NOTIFICATION] Type: WELCOME | To: juan@empresa.com | Message: "Welcome Juan Pérez!..."
```

### Paso 6: Actualizar el perfil del empleado

```bash
curl -X PUT http://localhost:8083/profiles/<UUID_EMPLEADO> \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "3001234567",
    "city": "Armenia",
    "biography": "Software engineer with 5 years of experience."
  }'
```

### Paso 7: Eliminar un empleado (dispara segundo evento)

```bash
curl -X DELETE http://localhost:8080/employees/<UUID_EMPLEADO>
# Respuesta: 204 No Content

# Verificar notificación de desvinculación
curl http://localhost:8084/notifications/<UUID_EMPLEADO>
```

**Respuesta esperada:** Ahora habrá 2 notificaciones: WELCOME + OFFBOARDING.

**Log esperado:**
```
[NOTIFICATION] Type: OFFBOARDING | To: juan@empresa.com | Message: "Dear Juan Pérez, your employee account has been deactivated..."
```

### Paso 8: Verificar persistencia de datos

```bash
# Reiniciar servicios (sin eliminar volúmenes)
docker compose down
docker compose up

# Verificar que los datos aún existen
curl http://localhost:8084/notifications        # historial completo
curl http://localhost:8083/profiles             # todos los perfiles
```

---

## 🛑 Comandos útiles

```bash
make prod           # Levantar sistema completo (producción)
make dev            # Hot-reload completo en Docker (desarrollo)
make dev-db         # Solo bases de datos + broker en Docker
make down           # Detener todos los contenedores
make clean          # Detener + eliminar volúmenes (reset de BD)
make logs           # Ver logs de todos los servicios
make logs-employees # Ver logs solo del employees-service
make help           # Ver todos los comandos disponibles
```

---

## 📁 Estructura del Proyecto

```
microservices-challenges/
├── docker-compose.yml            ← Orquestación completa (9 contenedores)
├── docker-compose.dev.yml        ← Override para desarrollo con hot-reload
├── Makefile                      ← Comandos convenientes
├── README.md                     ← Este archivo
├── employees-service/            ← Reto 1, 2 y 3 (publisher)
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── src/
│       ├── employees/            ← CRUD + DELETE + event publishing
│       ├── messaging/            ← MessagingModule + EventsPublisherService
│       └── resilience/           ← Circuit Breaker
├── departments-service/          ← Reto 2
│   ├── Dockerfile
│   └── src/departments/
├── profiles-service/             ← Reto 3 (consumer + REST)
│   ├── Dockerfile
│   └── src/profiles/
│       ├── profiles.consumer.ts  ← @EventPattern('employee.created')
│       ├── profiles.controller.ts← GET/PUT /profiles
│       └── profiles.service.ts
└── notifications-service/        ← Reto 3 (puramente reactivo)
    ├── Dockerfile
    └── src/notifications/
        ├── notifications.consumer.ts  ← @EventPattern handlers
        ├── notifications.controller.ts← GET /notifications
        └── notifications.service.ts
```

---

## 🔄 Patrones de Resiliencia (employees-service)

| Patrón | Configuración |
|---|---|
| **Timeout HTTP** | 5s por petición a departments-service |
| **Retry con backoff** | Hasta 3 reintentos (500ms, 1000ms, 1500ms) |
| **Circuit Breaker** | Abre tras 3 fallos → 15s cooldown → HALF_OPEN |
| **Event fire-and-forget** | Errores de publicación se loggean, nunca abortan la operación de BD |
