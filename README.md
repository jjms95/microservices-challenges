# 🚀 Microservices Challenges — Sistema Completo

> Sistema de onboarding de empleados construido con microservicios NestJS, TypeORM, PostgreSQL y Docker Compose.

## 📐 Arquitectura

```
Cliente (Postman / curl)
        │
        ├──► employees-service  (:8080)  ──► database-employees  (PostgreSQL :5432)
        │           │
        │           └── HTTP REST ──► departments-service (:8081)
        │
        └──► departments-service (:8081)  ──► database-departments (PostgreSQL :5433)
```

## 🛠️ Tech Stack

| Componente | Tecnología |
|---|---|
| Runtime | Node.js 20 |
| Framework | NestJS + TypeScript |
| ORM | TypeORM |
| Base de datos | PostgreSQL 16 |
| Contenedores | Docker + Docker Compose |
| Documentación API | Swagger (`@nestjs/swagger`) |

## 📦 Prerrequisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo
- [Git](https://git-scm.com/)
- Puertos libres: `8080`, `8081`, `5432`, `5433`

## ⚡ Despliegue Rápido (Sistema Completo)

### 1. Clonar el repositorio

```bash
git clone https://github.com/jjms95/microservices-challenges.git
cd microservices-challenges
```

### 2. Levantar todos los servicios

```bash
docker compose up --build
```

Esto levanta **4 contenedores** en orden:
1. `database-departments` — PostgreSQL para departamentos
2. `database-employees` — PostgreSQL para empleados
3. `departments-service` — API de departamentos (espera a su BD)
4. `employees-service` — API de empleados (espera a su BD y al servicio de departamentos)

### 3. Verificar que todo esté corriendo

```bash
docker compose ps
```

Deberías ver 4 contenedores con estado `running`.

### 4. Acceder a la documentación (Swagger UI)

| Servicio | URL |
|---|---|
| Employees Service | http://localhost:8080/api |
| Departments Service | http://localhost:8081/api |

## 🧪 Flujo de Prueba End-to-End

### Paso 1: Crear un departamento

```bash
curl -X POST http://localhost:8081/departments \
  -H "Content-Type: application/json" \
  -d '{"name": "Technology", "description": "Software and infrastructure"}'
```

Guarda el `id` UUID del departamento creado.

### Paso 2: Crear un empleado (con departamento válido)

```bash
curl -X POST http://localhost:8080/employees \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@company.com",
    "departmentId": "<UUID_DEL_DEPARTAMENTO>",
    "hireDate": "2024-01-15"
  }'
```

### Paso 3: Validar comunicación entre microservicios (departamento inexistente)

```bash
curl -X POST http://localhost:8080/employees \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@company.com",
    "departmentId": "00000000-0000-0000-0000-000000000000",
    "hireDate": "2024-01-15"
  }'
# Debe responder: 400 Bad Request - Department does not exist
```

### Paso 4: Listar empleados con paginación y filtros

```bash
# Todos los empleados
curl http://localhost:8080/employees

# Filtrar por nombre + paginación
curl "http://localhost:8080/employees?name=john&page=1&limit=5"

# Filtrar por email
curl "http://localhost:8080/employees?email=@company.com"
```

## 🛑 Detener el sistema

```bash
# Detener contenedores (conserva volúmenes/datos)
docker compose down

# Detener y eliminar volúmenes (borra datos de BD)
docker compose down -v
```

## 📁 Estructura del Proyecto

```
microservices-challenges/
├── docker-compose.yml          ← Orquestación completa del sistema
├── .gitignore
├── README.md                   ← Este archivo
├── employees-service/          ← Reto 1 & 2
│   ├── Dockerfile
│   ├── src/
│   │   ├── employees/          ← Módulo de empleados
│   │   └── resilience/         ← Circuit breaker
│   └── README.md
└── departments-service/        ← Reto 2
    ├── Dockerfile
    ├── src/
    │   └── departments/        ← Módulo de departamentos
    └── README.md
```

## 🔄 Patrones de Resiliencia (employees-service)

El `employees-service` implementa los siguientes patrones al comunicarse con `departments-service`:

- **Timeout**: Las peticiones HTTP tienen un límite de 5 segundos
- **Retry con backoff exponencial**: Hasta 3 reintentos (500ms, 1000ms, 1500ms) en errores de red o 5xx
- **Circuit Breaker**: Se abre tras 3 fallos consecutivos, rechaza peticiones por 15s (fail-fast), y entra en HALF_OPEN para probar recuperación
