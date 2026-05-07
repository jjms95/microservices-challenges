# 🚀 Microservices Challenges — Sistema Completo

> Sistema modular de onboarding y offboarding de empleados construido con NestJS, Python, PostgreSQL, RabbitMQ, Docker y Jenkins.

Este proyecto abarca la resolución de 6 retos técnicos progresivos, culminando en un ecosistema robusto con Integración Continua (CI/CD), Pruebas de Comportamiento (BDD), y análisis estático de código.

---

## 📑 Tabla de Contenido
1. [Arquitectura y Tecnologías](#-arquitectura-y-tecnologias)
2. [Despliegue Local (Quickstart)](#-despliegue-local-quickstart)
3. [Servicios y API](#-servicios-y-api)
4. [Documentación de Eventos (RabbitMQ)](#-documentacion-de-eventos-rabbitmq)
5. [Pruebas Automatizadas BDD (Reto 5)](#-pruebas-automatizadas-bdd-reto-5)
6. [Integración Continua CI/CD (Reto 6)](#-integracion-continua-cicd-reto-6)
7. [Comandos Útiles](#-comandos-utiles)

---

## 📐 Arquitectura y Tecnologías

### Diagrama General

```text
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
        │     :8084 (Python/FastAPI)       
        │     Consume: user.created        
        │              user.recovered      
        │              employee.created    
        │              employee.deleted    
        ▼         ▼                 ▼                 ▼
🗄 db-employees  🗄 db-departments  🗄 db-profiles  🗄 db-auth & db-notifications
   :5432            :5433              :5435            :5436 & :5434
```

### 🛠️ Tech Stack

| Componente | Tecnología |
|---|---|
| Runtime / Framework | Node.js 20 (NestJS), Python 3.11 (FastAPI) |
| Bases de Datos | PostgreSQL 16, TypeORM, SQLAlchemy |
| Message Broker | **RabbitMQ 3** (AMQP con exchange *fanout*) |
| Seguridad | Passport, JSON Web Tokens (JWT), BCrypt, RBAC |
| Pruebas (BDD) | Cucumber.js, Axios, Jest, PyTest |
| CI / CD | **Jenkins** (JCasC, Job DSL), **SonarQube**, Docker Registry |
| Orquestación | Docker Desktop + Docker Compose |

---

## ⚡ Despliegue Local (Quickstart)

### Prerrequisitos
- **Docker Desktop** instalado y corriendo.
- **Git** instalado.
- Puertos libres requeridos: `8080`, `8081`, `8083`, `8084`, `8085`, `8086`, `9000`, `5000`, `5432`-`5436`, `5672`, `15672`.

### Pasos para iniciar

1. **Clonar el repositorio:**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd microservices-challenges
   ```

2. **Levantar todos los contenedores:**
   ```bash
   docker compose up --build -d
   ```
   *Esto levanta 10 contenedores en total: Broker, 5 Bases de Datos, 5 Microservicios, y las herramientas de CI/CD (Jenkins, SonarQube).*

3. **Verificar el estado:**
   ```bash
   docker compose ps
   ```

---

## 🗂️ Servicios y API

Para hacer peticiones a las APIs protegidas, primero debes obtener un token JWT en el **auth-service** e incluirlo en los headers (`Authorization: Bearer <token>`).

### Accesos Rápidos
| Interfaz / Servicio | URL | Credenciales / Info |
|---|---|---|
| **RabbitMQ Management** | [http://localhost:15672](http://localhost:15672) | `admin` / `admin` |
| **Jenkins** | [http://localhost:8086](http://localhost:8086) | *Acceso Anónimo (Configurado por JCasC)* |
| **SonarQube** | [http://localhost:9000](http://localhost:9000) | `admin` / `admin` |
| **Auth Service (Docs)** | [http://localhost:8085/api/docs](http://localhost:8085/api/docs) | Generación JWT y Login |
| **Employees Service** | [http://localhost:8080/api](http://localhost:8080/api) | CRUD Empleados |
| **Departments Service** | [http://localhost:8081/api](http://localhost:8081/api) | CRUD Departamentos |
| **Profiles Service** | [http://localhost:8083/api](http://localhost:8083/api) | Perfiles (Async) |
| **Notifications Service** | [http://localhost:8084/api](http://localhost:8084/api) | Historial de Notificaciones |

### Usuarios de Prueba (Seeders)
- ADMIN: `admin@empresa.com` / `Admin123!`
- USER (Solo lectura): `usuario@empresa.com` / `User123!`

---

## 📋 Documentación de Eventos (RabbitMQ)

Se utiliza un exchange de tipo **fanout** (`employees_exchange`) para garantizar que múltiples microservicios puedan reaccionar a un mismo evento simultáneamente sin acoplarse.

| Evento | Productor | Consumidores y Reacciones |
|---|---|---|
| `employee.created` | `employees-service` | **notifications:** Genera notificación `WELCOME`.<br>**profiles:** Crea un perfil vacío por defecto.<br>**auth:** Crea credenciales de acceso al empleado. |
| `employee.deleted` | `employees-service` | **notifications:** Genera notificación `OFFBOARDING`.<br>**auth:** Inactiva o elimina al usuario. |
| `user.created` / `recovered` | `auth-service` | **notifications:** Simula el envío de un correo de bienvenida o con el token de reseteo de contraseña. |

---

## 🧪 Pruebas Automatizadas BDD (Reto 5)

Para asegurar la correctitud del sistema y su comportamiento asíncrono, se implementó una suite de **Behavior-Driven Development (BDD)** usando **Cucumber.js**. 

### Por qué BDD
En lugar de probar código aislado, BDD documenta de forma viva los flujos de negocio en lenguaje natural (Gherkin en español). Cada escenario asegura que la comunicación asíncrona a través de RabbitMQ es exitosa verificando las consecuencias (ej. que se creó un perfil y llegó la notificación) mediante *Polling tolerante a fallos*.

### Cómo ejecutar las pruebas E2E

Las pruebas asumen que el sistema ya está levantado (`docker compose up -d`).

**Opción A: Ejecución mediante Docker (Recomendado)**
```bash
# Ejecuta las pruebas BDD en un contenedor efímero y muestra los resultados
docker compose --profile bdd up --build bdd-tests
```

**Opción B: Ejecución Local**
```bash
cd e2e-tests
npm install
npm test
```

*Las pruebas aíslan la data utilizando correos aleatorios por escenario y limpiando la base de datos al finalizar.*

---

## 🏗️ Integración Continua CI/CD (Reto 6)

Se ha implementado un pipeline completo de Integración Continua que intercepta los cambios en el código, ejecuta pruebas, valida la calidad y empaqueta las imágenes listas para producción.

### 🛠️ Herramientas
1. **Jenkins:** Orquestador principal de pipelines. Configurado automáticamente vía **JCasC** y **Job DSL** (Sin wizard inicial, sin instalación manual de plugins).
2. **SonarQube:** Análisis de seguridad, cobertura y deuda técnica (Quality Gate).
3. **Docker Registry Local (`:5000`):** Almacenaje de imágenes Docker aprobadas.

### ⚙️ Configuración Inicial en SonarQube
Dado que el ecosistema se provisiona dinámicamente, Jenkins necesita un token de SonarQube para reportar los escaneos:

1. Ingresa a **SonarQube** en [http://localhost:9000](http://localhost:9000).
2. Ve a **Administration > Configuration > Webhooks** y añade uno apuntando a Jenkins: `http://jenkins:8080/sonarqube-webhook/`.
3. Ve a **Quality Gates** y crea uno llamado `Reto6 Gate` exigiendo **Coverage >= 70%**. Establécelo como Default.
4. Ve a `My Account > Security` y genera un token de acceso (User Token).
5. Ve a **Jenkins** en [http://localhost:8086](http://localhost:8086), navega a `Administrar Jenkins > Credentials` y crea un **Secret text** con el ID `sonar-token` y pega tu token de Sonar.

*(Nota: En JCasC ya dejé configurado el `credentialsId: "sonar-token"`, por lo que Jenkins se conectará automáticamente apenas lo crees).*

### 🔄 Flujo del Pipeline y Etapas

En Jenkins ya existen dos pipelines (`employees-service-pipeline` y `notifications-service-pipeline`). Tienen un trigger de *SCM Polling* (`* * * * *`) que simula un Webhook leyendo de GitHub cada minuto.

| Etapa | Descripción | Si Falla (Rojo) significa... |
|---|---|---|
| **Checkout** | Descarga del código fuente (Git). | Problemas de red o de permisos. |
| **Build** | `npm install` o `pip install`. | Dependencias rotas o error de sintaxis en el código. |
| **Test & Coverage** | Corre las pruebas unitarias y genera métricas (LCOV/XML). | Alguna prueba unitaria falló. |
| **SonarQube Analysis** | Envía el código y métricas al servidor SonarQube. | SonarQube está caído o credenciales inválidas. |
| **Quality Gate** | Espera el veredicto de SonarQube. | El código nuevo no cumple con la cobertura (70%) o tiene bugs críticos. |
| **Package** | Construye la imagen Docker y la sube al registry local. | El `Dockerfile` está mal estructurado o falló el demonio Docker. |
| **E2E Tests** | Levanta el ecosistema y corre BDD. | Fallaron las pruebas de comportamiento (Cucumber). |

### 🚦 Interpretar los resultados en Jenkins
- 🟩 **Verde:** El código es seguro, las pruebas pasaron, y se construyó una imagen Docker lista para ser desplegada en producción.
- 🟥 **Rojo:** Se bloquea el paso a producción. Revisa los logs de la etapa específica fallida (ej. Quality Gate rechazado por falta de tests).

*(Coloca aquí tu captura del pipeline exitoso)*
![Pipeline Exitoso Jenkins](./docs/pipeline_success.png)

---

## 🛑 Comandos Útiles

Si cuentas con `make` instalado, tienes accesos directos convenientes en el proyecto:

```bash
make prod           # Levanta el sistema completo
make dev            # Levanta el sistema completo con Hot-Reload (Watch)
make down           # Detiene el ecosistema
make clean          # Detiene el ecosistema y borra los volúmenes (reset de bases de datos)
make logs           # Ver logs de todo el ecosistema
```
