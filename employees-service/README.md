# 👥 Employees Service

Microservicio de gestión de empleados construido con **NestJS**, **TypeORM** y **PostgreSQL**.  
Parte del sistema de onboarding de empleados (Reto 1 & 2).

## 📋 Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/employees` | Registra un nuevo empleado |
| `GET` | `/employees` | Lista empleados (paginación + filtros) |
| `GET` | `/employees/:id` | Obtiene un empleado por UUID |

### Query params de `GET /employees`

| Parámetro | Tipo | Requerido | Default | Descripción |
|---|---|---|---|---|
| `name` | string | No | — | Filtro parcial por nombre (case-insensitive) |
| `email` | string | No | — | Filtro parcial por email (case-insensitive) |
| `page` | number | No | `1` | Número de página |
| `limit` | number | No | `10` | Items por página |

## 🛠️ Tech Stack

- **Runtime**: Node.js 20
- **Framework**: NestJS + TypeScript
- **ORM**: TypeORM
- **Base de datos**: PostgreSQL 16
- **Documentación**: Swagger (`@nestjs/swagger`)
- **Resiliencia**: Circuit Breaker + Retry + Timeout

## ⚙️ Variables de Entorno

| Variable | Descripción | Default |
|---|---|---|
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_USERNAME` | Usuario de PostgreSQL | `postgres` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | `postgres` |
| `DB_NAME` | Nombre de la base de datos | `employees_db` |
| `DEPARTMENTS_SERVICE_URL` | URL interna del servicio de departamentos | `http://localhost:8081` |

## 🚀 Despliegue

### Opción A — Con Docker Compose (recomendado, sistema completo)

Desde la raíz del proyecto:

```bash
docker compose up --build
```

Acceder a Swagger: **http://localhost:8080/api**

### Opción B — Despliegue individual con Docker

```bash
# 1. Construir la imagen
docker build -t employees-service .

# 2. Correr el contenedor (requiere PostgreSQL accesible en localhost:5432)
docker run -p 8080:8080 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=5432 \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=postgres \
  -e DB_NAME=employees_db \
  -e DEPARTMENTS_SERVICE_URL=http://host.docker.internal:8081 \
  employees-service
```

### Opción C — Desarrollo local (sin Docker)

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env   # Editar según tu entorno local

# 3. Correr en modo desarrollo
npm run start:dev
```

## 🧪 Pruebas de los Endpoints

### Crear un empleado

```bash
curl -X POST http://localhost:8080/employees \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@company.com",
    "departmentId": "<UUID_DEPARTAMENTO_VÁLIDO>",
    "hireDate": "2024-01-15"
  }'
```

**Respuesta exitosa (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john.doe@company.com",
  "departmentId": "<UUID>",
  "hireDate": "2024-01-15"
}
```

**Error — departamento no existe (400):**
```json
{
  "statusCode": 400,
  "message": "Department with id \"<UUID>\" does not exist."
}
```

**Error — departments-service no disponible (503):**
```json
{
  "statusCode": 503,
  "message": "Could not communicate with departments-service. The service may be temporarily unavailable."
}
```

### Listar empleados (con paginación)

```bash
# Sin filtros
curl http://localhost:8080/employees

# Con filtros y paginación
curl "http://localhost:8080/employees?name=john&page=1&limit=5"
```

**Respuesta (200):**
```json
{
  "data": [ { "id": "...", "name": "John Doe", "email": "...", "departmentId": "...", "hireDate": "..." } ],
  "currentPage": 1,
  "totalPages": 3,
  "totalItems": 25,
  "itemsPerPage": 5
}
```

### Obtener empleado por ID

```bash
curl http://localhost:8080/employees/550e8400-e29b-41d4-a716-446655440000
```

## 🔄 Patrones de Resiliencia

Al registrar un empleado, el servicio valida el `departmentId` llamando a `departments-service` vía HTTP REST con los siguientes mecanismos de resiliencia:

| Patrón | Configuración |
|---|---|
| **Timeout** | 5 segundos por petición |
| **Retry** | Hasta 3 reintentos con backoff exponencial (500ms, 1000ms, 1500ms) |
| **Circuit Breaker** | Se abre tras 3 fallos → 15s cooldown → HALF_OPEN para probar recuperación |

> **Nota:** Los reintentos **no** se aplican a errores 404 (departamento no existe), ya que reintentar no cambiaría el resultado.
