# 🏢 Departments Service

Microservicio de gestión de departamentos construido con **NestJS**, **TypeORM** y **PostgreSQL**.  
Parte del sistema de onboarding de empleados (Reto 2).

## 📋 Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/departments` | Crea un nuevo departamento |
| `GET` | `/departments` | Lista departamentos (paginación + filtro por nombre) |
| `GET` | `/departments/:id` | Obtiene un departamento por UUID |
| `PUT` | `/departments/:id` | Actualiza un departamento por UUID |
| `DELETE` | `/departments/:id` | Elimina un departamento por UUID |

### Query params de `GET /departments`

| Parámetro | Tipo | Requerido | Default | Descripción |
|---|---|---|---|---|
| `name` | string | No | — | Filtro parcial por nombre (case-insensitive) |
| `page` | number | No | `1` | Número de página |
| `limit` | number | No | `10` | Items por página |

## 🛠️ Tech Stack

- **Runtime**: Node.js 20
- **Framework**: NestJS + TypeScript
- **ORM**: TypeORM
- **Base de datos**: PostgreSQL 16
- **Documentación**: Swagger (`@nestjs/swagger`)

## ⚙️ Variables de Entorno

| Variable | Descripción | Default |
|---|---|---|
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_USERNAME` | Usuario de PostgreSQL | `postgres` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | `postgres` |
| `DB_NAME` | Nombre de la base de datos | `departments_db` |

## 🚀 Despliegue

### Opción A — Con Docker Compose (recomendado, sistema completo)

Desde la raíz del proyecto:

```bash
docker compose up --build
```

Acceder a Swagger: **http://localhost:8081/api**

### Opción B — Despliegue individual con Docker

```bash
# 1. Construir la imagen
docker build -t departments-service .

# 2. Correr el contenedor (requiere PostgreSQL accesible en localhost:5433)
docker run -p 8081:8081 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=5432 \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=postgres \
  -e DB_NAME=departments_db \
  departments-service
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

### Crear un departamento

```bash
curl -X POST http://localhost:8081/departments \
  -H "Content-Type: application/json" \
  -d '{"name": "Technology", "description": "Software and infrastructure team"}'
```

**Respuesta exitosa (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Technology",
  "description": "Software and infrastructure team"
}
```

### Listar departamentos (con paginación y filtro)

```bash
# Sin filtros
curl http://localhost:8081/departments

# Filtrar por nombre
curl "http://localhost:8081/departments?name=tech&page=1&limit=5"
```

**Respuesta (200):**
```json
{
  "data": [ { "id": "...", "name": "Technology", "description": "..." } ],
  "currentPage": 1,
  "totalPages": 2,
  "totalItems": 12,
  "itemsPerPage": 5
}
```

### Obtener departamento por ID

```bash
curl http://localhost:8081/departments/550e8400-e29b-41d4-a716-446655440000
```

**Error — no encontrado (404):**
```json
{
  "statusCode": 404,
  "message": "Department with id \"<UUID>\" not found."
}
```

### Actualizar un departamento

```bash
curl -X PUT http://localhost:8081/departments/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{"description": "Updated description"}'
```

### Eliminar un departamento

```bash
curl -X DELETE http://localhost:8081/departments/550e8400-e29b-41d4-a716-446655440000
# Respuesta: 204 No Content
```

## 📝 Notas importantes

- El `id` de cada departamento es un **UUID v4** generado automáticamente.
- El campo `name` debe ser **único**.
- Al eliminar un departamento que tiene empleados asociados, los empleados existentes no se eliminan (la relación es validada solo en el momento de creación del empleado vía HTTP REST desde `employees-service`).
