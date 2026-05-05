# 🚀 Microservices Challenges — Sistema Completo

> Sistema de onboarding y offboarding de empleados construido con microservicios NestJS, TypeORM, PostgreSQL, RabbitMQ y Docker Compose.

## 📐 Arquitectura del Sistema (Reto 4)

```
🌐 Cliente HTTP (Requests con token JWT Bearer)
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
        │                  │
        │         ┌────────┴───────────────┐
        │         ▼                        ▼
        │  📋 profiles-service      🔐 auth-service :8085
        │     :8083                 Consume: employee.created
        │                                    employee.deleted
        │                           Publica: user.created
        │                                    user.recovered
        │                                  │
        │                                  ▼ (a RabbitMQ)
        │                                  │
        │         ┌────────────────────────┤
        │         ▼                        
        │  📧 notifications-service        
        │     :8084                        
        │     Consume: user.created        
        │              user.recovered      
        │              employee.created    
        │              employee.deleted    
        ▼         ▼                 ▼                 ▼
🗄 db-employees  🗄 db-departments  🗄 db-profiles  🗄 db-auth & db-notifications
   :5432            :5433              :5435            :5436 & :5434
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
| Seguridad | Passport, JSON Web Tokens (JWT), BCrypt, RBAC |
| Contenedores | Docker + Docker Compose |
| Documentación API | Swagger (`@nestjs/swagger`) |
| Integración Continua (CI) | **Jenkins** + Configuration as Code (JCasC) |
| Calidad de Código | **SonarQube** + JaCoCo / LCOV |
| Image Registry | Local Docker Registry (`registry:2`) |

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
| `auth-service` | `:8085` | [/api/docs](http://localhost:8085/api) | Identity Provider + Generación JWT | R4 |
| `employees-service` | `:8080` | [/api](http://localhost:8080/api) | Publisher de eventos + CRUD (Protegido JWT) | R1, R2, R3, R4 |
| `departments-service` | `:8081` | [/api](http://localhost:8081/api) | CRUD departamentos (Protegido JWT) | R2, R4 |
| `profiles-service` | `:8083` | [/api](http://localhost:8083/api) | Consumer async + REST (Protegido JWT) | R3, R4 |
| `notifications-service` | `:8084` | [/api](http://localhost:8084/api) | Consumer puramente reactivo (Protegido JWT)| R3, R4 |
| `message-broker` (RabbitMQ) | `:5672` / `:15672` | — | Fan-out exchange | R3, R4 |
| `jenkins` | `:8080` / `:50000` | — | Servidor de Integración Continua (CI) | R6 |
| `sonarqube` | `:9000` | — | Servidor de Análisis Estático (Quality Gate) | R6 |
| `registry` | `:5000` | — | Repositorio local de imágenes Docker | R6 |

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

### Eventos de Seguridad (`auth-service`)

#### `user.created` & `user.recovered`

Generados por `auth-service` para delegar el envío de correos sobre tokens de restablecimiento de contraseñas de forma asíncrona a `notifications-service`. Adicionalmente, incluye el token de recuperación (stateless).

---

### Sesion de usuarios

Para hacer pruebas de los servicios, se debe iniciar sesion en auth-service y obtener un token. Este token se debe incluir en el header de las peticiones a los servicios protegidos.

#### Roles y permisos

Existen 2 roles: 

- ADMIN: Puede crear, actualizar y eliminar todos los recursos.
- USER: Tiene acceso de solo lectura. Solo puede consultar información.

#### Usuarios de prueba

- ADMIN  → admin@empresa.com      / Admin123!
- USER   → usuario@empresa.com    / User123!
- USER   → nuevo.empleado@empresa.com (no password - needs reset)
- USER   → exempleado@empresa.com (INACTIVE - login denied)

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
docker compose up --build
```

Esto levanta **10 contenedores** en el orden correcto:
1. `message-broker` (RabbitMQ)
2. 5 bases de datos PostgreSQL (esperan healthcheck)
3. `departments-service`
4. `employees-service` (espera broker + departments)
5. `notifications-service` (espera broker)
6. `profiles-service` (espera broker)
7. `auth-service` (espera broker)

### 3. Verificar que todos los servicios están corriendo

```bash
docker compose ps
```

### 4. Acceder a las interfaces

| Interfaz | URL | Credenciales |
|---|---|---|
| RabbitMQ Management UI | http://localhost:15672 | admin / admin |
| Swagger auth-service | http://localhost:8085/api/docs | — |
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

## 📁 Estructura del Proyecto (Reto 4)

> **Nota:** Para la estructura completa incluyendo el proyecto de pruebas BDD (Reto 5), ver la sección [📁 Estructura del Proyecto (Completa — Reto 5)](#-estructura-del-proyecto-completa--reto-5) al final de este documento.

```
microservices-challenges/
├── docker-compose.yml            ← Orquestación completa (10 contenedores)
├── docker-compose.dev.yml        ← Override para desarrollo con hot-reload
├── Makefile                      ← Comandos convenientes
├── README.md                     ← Este archivo
├── auth-service/                 ← Reto 4 (Identity Provider & Security)
│   ├── Dockerfile
│   └── src/auth/
│       ├── auth.controller.ts    ← POST /auth/login /recover /reset
│       ├── users.consumer.ts     ← @EventPattern('employee.created')
│       └── strategies/jwt.strategy.ts
├── employees-service/            ← Reto 1, 2, 3 y 4
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── src/
│       ├── security/             ← Guards de Autenticación y Autorización (JWT)
│       ├── employees/            ← CRUD + DELETE + event publishing
│       ├── messaging/            ← MessagingModule + EventsPublisherService
│       └── resilience/           ← Circuit Breaker
├── departments-service/          ← Reto 2 y 4
│   ├── Dockerfile
│   └── src/departments/
├── profiles-service/             ← Reto 3 y 4
│   ├── Dockerfile
│   └── src/profiles/
│       ├── profiles.consumer.ts  
│       ├── profiles.controller.ts
│       └── profiles.service.ts
└── notifications-service/        ← Reto 3 y 4
    ├── Dockerfile
    └── src/
        ├── security/
        └── notifications/
            ├── notifications.consumer.ts  ← @EventPattern('user.created')
            ├── notifications.controller.ts
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

---

## 🧪 Reto 5 — Automatización BDD

### ¿Qué es BDD y por qué este enfoque?

**Behavior-Driven Development (BDD)** es una metodología que extiende TDD enfocándose en el *comportamiento del sistema* desde la perspectiva del usuario, no en la implementación técnica.

| Aspecto | Pruebas Tradicionales | BDD |
|---|---|---|
| Perspectiva | Técnica (funciones, clases) | Negocio (flujos, comportamiento, reglas) |
| Lenguaje | Código de programación | Lenguaje natural estructurado (Gherkin) |
| Audiencia | Desarrolladores | Desarrolladores, QA, stakeholders |
| Documentación | Se desactualiza fácilmente | **Documentación viva**: si la prueba pasa, el comportamiento es real |

**Fue elegido** porque los retos anteriores se verificaban manualmente con `curl`/Postman — estas verificaciones no son repetibles. Con BDD, cada flujo queda documentado como escenario ejecutable que sirve como especificación viva del sistema.

---

### 🛠️ Framework elegido: Cucumber.js + Axios

| Herramienta | Versión | Rol | Justificación |
|---|---|---|---|
| **Node.js** | 20 | Runtime | Consistente con el stack del proyecto (NestJS) |
| **Cucumber.js** (`@cucumber/cucumber`) | ^10.3 | Framework BDD | Soporte nativo de Gherkin en español (`# language: es`), `npx cucumber-js` como único comando de ejecución |
| **Axios** | ^1.6 | Cliente HTTP | API clara para peticiones con headers JWT; `validateStatus: () => true` permite capturar cualquier código sin lanzar excepciones |
| **dotenv** | ^16 | Variables de entorno | Configura URLs base y credenciales sin hardcodear valores |

---

### 📋 Prerrequisitos para ejecutar las pruebas

- **Docker Desktop** instalado y corriendo
- **Node.js 20+** instalado localmente (o usar el contenedor Docker)
- El sistema completo levantado (`docker compose up --build -d`)

---

### ⚡ Instrucciones de ejecución paso a paso

#### 1. Levantar el sistema

```bash
docker compose up --build -d
# Esperar ~30s a que todos los servicios arranquen correctamente
docker compose ps   # verificar que todos están "healthy" o "running"
```

#### 2. Configurar variables de entorno

```bash
cd e2e-tests
cp .env.example .env
# El archivo .env ya tiene los valores correctos para desarrollo local.
# Modificar EMPLOYEES_URL, AUTH_URL, etc. solo si los servicios corren en otro host.
```

#### 3. Instalar dependencias

```bash
cd e2e-tests
npm install
```

#### 4. Ejecutar la suite completa

```bash
npm test
# Equivalente a: npx cucumber-js
```

#### 5. Ejecutar por feature individual

```bash
npm run test:humo        # Solo prueba de humo (sanity check)
npm run test:seguridad   # Solo escenarios de seguridad/RBAC
npm run test:onboarding  # Solo escenarios de onboarding (con polling)
npm run test:offboarding # Solo escenarios de offboarding (con polling)
```

#### 6. (Opcional) Ejecutar en Docker sin instalar dependencias locales

```bash
docker compose --profile bdd up --build bdd-tests
```

**Desglose del comando:**

| Parte | Qué hace |
|---|---|
| `docker compose` | El orquestador de contenedores |
| `--profile bdd` | **Activa el perfil `bdd`** — sin esta bandera, el servicio `bdd-tests` es completamente invisible para Compose y no aparece en ningún comando (`up`, `ps`, `down`, etc.) |
| `up --build` | Construye la imagen del contenedor y lo levanta (igual que con cualquier otro servicio) |
| `bdd-tests` | Le indica a Compose que levante **únicamente ese servicio**, sin tocar los demás |

**¿Por qué existe el `--profile`?**

En el `docker-compose.yml`, el servicio `bdd-tests` tiene la propiedad:
```yaml
profiles:
  - bdd
```

Esto hace que Docker Compose lo **excluya por defecto** de todos sus comandos. Un `docker compose up` normal levanta todos los microservicios sin ejecutar las pruebas. Solo al pasar `--profile bdd` el servicio se vuelve visible para el orquestador.

**¿Qué pasa si se omiten partes del comando?**

```bash
docker compose up                          # ❌ bdd-tests no existe para Compose (ignorado por perfil)
docker compose --profile bdd up            # ⚠️  levanta TODOS los servicios + bdd-tests al mismo tiempo
docker compose --profile bdd up bdd-tests  # ✅ solo construye y ejecuta las pruebas BDD
```

**Requisito previo:** el sistema debe estar ya corriendo (`docker compose up -d`) antes de ejecutar este comando, ya que `bdd-tests` no levanta los microservicios — solo los usa como dependencias de red.

#### 7. Interpretar los resultados

```
Feature: Onboarding de empleados
  ✓ Registro exitoso genera credenciales de acceso automáticamente
  ✓ Registro exitoso genera una notificación de bienvenida
  ✓ El nuevo empleado puede establecer contraseña y hacer login
  ✓ Registro falla con departamento inexistente
  ✓ Registro falla cuando faltan campos obligatorios

18 scenarios (18 passed)
77 steps (77 passed)
```

- `✓` — El escenario pasó correctamente
- `✗` — El escenario falló; se muestra qué se esperaba y qué se obtuvo
- `?` — El paso no tiene implementación (pending)

**Cómo probar que las pruebas detectan fallos:** modificar un código esperado, por ejemplo en `seguridad.feature`:
```gherkin
# Cambiar el código esperado de 401 a 200 (incorrecto)
Entonces la respuesta debe tener código 200
```
La salida mostrará:
```
AssertionError: Se esperaba código HTTP 200 pero se obtuvo 401.
Cuerpo: {"message":"Unauthorized","statusCode":401}
```

---

### 📐 Estructura del proyecto de pruebas

```
e2e-tests/
├── cucumber.json              ← Configuración de Cucumber (require paths, formato)
├── package.json               ← Dependencias: @cucumber/cucumber, axios, dotenv
├── Dockerfile                 ← Contenedor para ejecutar sin instalar dependencias
├── .env.example               ← Plantilla de variables de entorno
├── .env                       ← Variables activas (no versionar en producción)
│
├── features/                  ← Archivos Gherkin en español
│   ├── humo.feature           ← Verificación de que todos los servicios responden
│   ├── seguridad.feature      ← Control de acceso JWT y RBAC
│   ├── onboarding.feature     ← Registro de empleados + verificación asincrónica
│   └── offboarding.feature    ← Desvinculación + bloqueo de acceso
│
├── step_definitions/          ← Implementaciones de los pasos
│   ├── comunes.steps.js       ← Aserciones compartidas (HTTP code, notificaciones)
│   ├── humo.steps.js          ← Steps de prueba de humo
│   ├── seguridad.steps.js     ← Steps de autenticación y RBAC
│   ├── onboarding.steps.js    ← Steps de registro + polling
│   └── offboarding.steps.js   ← Steps de desvinculación + polling
│
└── support/
    ├── world.js               ← Contexto compartido (token, response, IDs) — 1 instancia por escenario
    ├── hooks.js               ← Before/After: limpieza de datos entre escenarios
    └── polling.js             ← Función esperarHastaQue() para eventual consistency
```

---

### 🎭 Descripción de los escenarios implementados

#### Feature: Verificación del sistema (Prueba de humo) — 4 escenarios
| Escenario | Flujo que cubre |
|---|---|
| El servicio de empleados responde | `GET /employees` → 401 (requiere auth) = servicio activo |
| El servicio de departamentos responde | `GET /departments` → 401 = servicio activo |
| El servicio de autenticación responde | `GET /auth/login` → respuesta del servicio |
| El servicio de notificaciones responde | `GET /notifications` → 401 = servicio activo |

#### Feature: Seguridad y control de acceso — 6 escenarios
| Escenario | Flujo que cubre |
|---|---|
| Acceso denegado sin token | `GET /employees` sin Authorization → 401 |
| Acceso denegado con token malformado | Token string inválido → 401 |
| USER puede consultar pero no crear | `GET /employees` con USER → 200; `POST /employees` con USER → 403 |
| ADMIN puede crear y consultar | `GET /employees` y `GET /departments` con ADMIN → 200 |
| Login con credenciales incorrectas | `POST /auth/login` con clave errónea → 401 |
| Usuario inactivo no puede hacer login | `POST /auth/login` con `exempleado@empresa.com` → 401 |

#### Feature: Onboarding con verificación asincrónica — 5 escenarios
| Escenario | Flujo que cubre |
|---|---|
| Registro genera credenciales | `POST /employees` → `employee.created` → `auth-service` crea usuario (polling) |
| Registro genera notificación | `POST /employees` → `employee.created` → `notifications-service` crea `WELCOME` (polling) |
| Empleado puede hacer login | Registro → recuperar contraseña → reset → `POST /auth/login` exitoso |
| Falla con departamento inexistente | `POST /employees` con UUID ficticio → 400 |
| Falla sin campos obligatorios | `POST /employees` sin email → 400 |

#### Feature: Offboarding — 3 escenarios
| Escenario | Flujo que cubre |
|---|---|
| Desvinculación genera notificación | `DELETE /employees/:id` → `employee.deleted` → notificación `OFFBOARDING` (polling) |
| Empleado desvinculado no puede hacer login | Delete → `POST /auth/login` con empleado → 401 (polling) |
| Recuperación falla para desvinculado | Delete → `POST /auth/recover-password` → 404 (polling) |

---

### ⏱️ Justificación de los parámetros de Polling

```
Parámetro           Valor    Justificación
─────────────────── ──────── ─────────────────────────────────────────────────────
maxIntentos         15       Cubre carga alta en el broker y reinicios de servicio
intervaloMs         2000ms   Balance entre velocidad de la prueba y carga en APIs
timeoutTotal        ~30s     El evento se procesa en <5s normalmente; 30s da margen
                             suficiente para máquinas lentas o entornos CI/CD
```

**Por qué no se usa `sleep` fijo:**
- Si el evento se procesa en 1s → la prueba termina en 1s, no en 30s
- Si el sistema tarda más de lo usual → el polling lo tolera sin fallar
- Elimina pruebas intermitentes (flaky tests) por variaciones de timing en Docker

---

### 🔒 Estrategia de Aislamiento de Datos

Cada escenario es completamente independiente gracias a:
1. **Emails únicos por escenario:** `empleado.test.<timestamp+random>@empresa.com` — nunca colisionan entre ejecuciones ni entre escenarios paralelos
2. **Contexto World por escenario:** Cucumber crea una instancia nueva del World por escenario — no hay estado compartido entre escenarios
3. **Hook `After` automático:** Limpia empleados y departamentos creados usando el token ADMIN, incluso si el escenario falla a medias
4. **Antecedentes en offboarding:** Recrean el estado completo (departamento + empleado + credenciales activas) desde cero en cada escenario

---

## 📁 Estructura del Proyecto (Completa — Reto 5)

```
microservices-challenges/
├── docker-compose.yml            ← Orquestación completa (10 contenedores + bdd-tests profile)
├── docker-compose.dev.yml        ← Override para desarrollo con hot-reload
├── Makefile                      ← Comandos convenientes
├── README.md                     ← Este archivo
│
├── e2e-tests/                    ← Reto 5 — Suite BDD (proyecto independiente)
│   ├── cucumber.json             ← Configuración de Cucumber.js
│   ├── package.json             ← Dependencias: @cucumber/cucumber, axios, dotenv
│   ├── Dockerfile               ← Contenedor opcional para CI/CD
│   ├── .env.example             ← Plantilla de variables
│   ├── features/                ← Archivos .feature (Gherkin en español)
│   │   ├── humo.feature
│   │   ├── seguridad.feature
│   │   ├── onboarding.feature
│   │   └── offboarding.feature
│   ├── step_definitions/        ← Implementaciones de pasos (peticiones HTTP reales)
│   │   ├── comunes.steps.js     ← Aserciones compartidas
│   │   ├── humo.steps.js
│   │   ├── seguridad.steps.js
│   │   ├── onboarding.steps.js
│   │   └── offboarding.steps.js
│   └── support/
│       ├── world.js             ← Contexto compartido (1 instancia por escenario)
│       ├── hooks.js             ← Limpieza de datos entre escenarios
│       └── polling.js           ← esperarHastaQue() — sin sleep fijo
│
├── auth-service/                 ← Reto 4 (Identity Provider & Security)
│   ├── Dockerfile
│   └── src/auth/
│       ├── auth.controller.ts   ← POST /auth/login /recover-password /reset-password
│       ├── users.consumer.ts    ← @EventPattern('employee.created' | 'employee.deleted')
│       └── strategies/jwt.strategy.ts
├── employees-service/            ← Reto 1, 2, 3 y 4
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── src/
│       ├── security/            ← Guards JWT + RBAC
│       ├── employees/           ← CRUD + DELETE + event publishing
│       ├── messaging/           ← MessagingModule + EventsPublisherService
│       └── resilience/          ← Circuit Breaker
├── departments-service/          ← Reto 2 y 4
│   ├── Dockerfile
│   └── src/departments/
├── profiles-service/             ← Reto 3 y 4
│   ├── Dockerfile
│   └── src/profiles/
└── notifications-service/        ← Reto 3 y 4
    ├── Dockerfile
    └── src/
        ├── security/
        └── notifications/

---

## 🏗️ Reto 6 — Integración Continua (CI/CD)

### ¿Qué es la Integración Continua en este proyecto?

La Integración Continua (CI) es una práctica de desarrollo en la que los cambios de código se prueban, analizan y empaquetan de forma automatizada. Se integra en este proyecto para:
1. **Detectar errores tempranamente:** No esperar hasta producción para saber si un microservicio compila o si rompió alguna prueba.
2. **Estandarizar calidad:** Asegurar que todo el código pase un umbral de cobertura (70%) mediante un Quality Gate.
3. **Despliegues confiables:** Generar automáticamente imágenes Docker listas para producción al finalizar el ciclo.

### 🛠️ Herramientas Utilizadas

- **Jenkins**: Orquestador principal de pipelines. Configurado mediante *Jenkins Configuration as Code (JCasC)* y el plugin **Job DSL** para que los pipelines se auto-aprovisionen.
- **SonarQube**: Plataforma de análisis estático de código para detectar bugs, vulnerabilidades y evaluar la cobertura de pruebas.
- **Docker Registry Local**: Un repositorio local (`localhost:5000`) donde se almacenan las imágenes Docker preparadas para despliegue.

### 🔑 Acceso a Jenkins y SonarQube

| Servicio | URL | Credenciales |
|---|---|---|
| **Jenkins** | [http://localhost:8086](http://localhost:8086) | Acceso anónimo (No requiere credenciales gracias a JCasC) |
| **SonarQube** | [http://localhost:9000](http://localhost:9000) | `admin` / `admin` (se pedirá cambio en el primer login) |

### ⚙️ Instrucciones de Configuración y Uso

#### 1. Cómo levantar el sistema con Jenkins incluido
```bash
docker compose up -d --build
```
Esto levantará toda la arquitectura de microservicios más la infraestructura CI/CD (`jenkins`, `sonarqube`, `docker-registry`). **La contraseña inicial de Jenkins se omite** porque el Setup Wizard ha sido deshabilitado y JCasC aprovisiona todo automáticamente.

#### 2. Configuración en SonarQube (Manual de una sola vez)
1. Entra a SonarQube, ve a **Quality Gates** y crea uno nuevo llamado `Reto6 Gate` exigiendo **Coverage >= 70%**. Establécelo como Default.
2. Genera un token en SonarQube (Global Analysis Token).
3. Ve a **Administration > Configuration > Webhooks** y añade uno apuntando a Jenkins: `http://jenkins:8080/sonarqube-webhook/`.
4. Ve a Jenkins > Administrar Jenkins > Credentials, y crea un **Secret text** con ID `sonar-token` conteniendo tu token.

#### 3. Cómo ejecutar un pipeline manualmente
1. Abre [http://localhost:8086](http://localhost:8086).
2. Verás dos pipelines ya creados: `employees-service-pipeline` y `notifications-service-pipeline`. *(Fueron importados automáticamente por JCasC + Job DSL)*.
3. Haz clic en uno de ellos y selecciona **Build Now** (Construir ahora).

### 🔄 Descripción de las Etapas del Pipeline

| Etapa | Qué verifica |
|---|---|
| **Checkout** | Clona el código fuente desde el workspace local montado. |
| **Build** | Instala las dependencias y compila el proyecto (`npm install`, `pip install`). Verifica que no haya errores de sintaxis o dependencias rotas. |
| **Test & Coverage** | Ejecuta pruebas unitarias (`npm run test:cov`, `pytest`). Falla si alguna prueba no pasa. Genera el XML/LCOV. |
| **SonarQube Analysis** | Envía el reporte de cobertura al servidor SonarQube para buscar Code Smells y Vulnerabilidades. |
| **Quality Gate** | Espera a que SonarQube confirme si se superó el umbral (70%). Si es menor, la etapa falla. |
| **Package** | Construye la imagen Docker del microservicio y la hace `push` al Docker Registry local (`localhost:5000`). |
| **E2E Tests** | Levanta el ecosistema Docker completo, ejecuta la suite de pruebas funcionales (Cucumber/BDD) del Reto 5, y lo apaga (`docker compose down`). |

### 🚦 Cómo interpretar los resultados

- 🟩 **Etapa en Verde (Éxito):** La condición de esa fase se cumplió (ej. todas las pruebas pasaron, el Quality Gate dio luz verde, la imagen se subió).
- 🟥 **Etapa en Rojo (Fallo):** Si el pipeline se detiene aquí, ocurrió un error (ej. una prueba unitaria falló, la cobertura de SonarQube fue menor al 70%, el Dockerfile estaba mal estructurado). Revisa los `Logs` de la etapa para ver el motivo exacto.

*(Adjunte debajo la captura de pantalla de un pipeline exitoso finalizado)*
![Pipeline Exitoso Jenkins](./docs/pipeline_success.png)

