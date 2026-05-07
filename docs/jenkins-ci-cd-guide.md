# Guía de Implementación CI/CD con Jenkins y SonarQube

Esta guía documenta la infraestructura de Integración y Entrega Continua (CI/CD) implementada para los microservicios del Reto 6. Detalla cómo está construida la orquestación, cómo fluye la información y qué credenciales utilizar.

## 1. Arquitectura y Ubicación de las Piezas

La infraestructura CI/CD corre contenerizada usando Docker Compose (perfil `ci`). Las piezas principales son:

*   **Jenkins (`/jenkins`)**: Orquestador principal.
    *   **`Dockerfile`**: Instala dependencias (Docker CLI, NodeJS, Git) e instala automáticamente todos los plugins necesarios.
    *   **`casc.yaml` (Jenkins Configuration as Code)**: Archivo maestro. Define la seguridad, pre-configura la conexión con SonarQube, y crea automáticamente los *jobs* de los pipelines escaneando el repositorio local.
*   **SonarQube (`docker-compose.yml`)**: Analizador de código estático. Utiliza una base de datos PostgreSQL independiente (`sonar-db`).
*   **Registro Docker (`localhost:5000`)**: Registro local en el clúster para empaquetar y almacenar las imágenes generadas durante el pipeline, dejándolas disponibles para las pruebas E2E.

## 2. Accesos y Credenciales

| Servicio | URL | Usuario | Contraseña | Notas |
| :--- | :--- | :--- | :--- | :--- |
| **Jenkins** | `http://localhost:8086` | `admin` | `admin` | Autenticación bloqueada a anónimos (definida en `casc.yaml`). |
| **SonarQube** | `http://localhost:9000` | `admin` | `admin` (por defecto) | Para base de datos interna: `sonar`/`sonar`. |

> [!IMPORTANT]
> **Resolución de Enlaces (El problema de host.docker.internal)**
> Debido a que Jenkins y SonarQube se comunican por una red interna de Docker, es posible que tu navegador Mac no pueda resolver el nombre `sonarqube` cuando hagas clic en los links generados por Jenkins.
> **Solución Requerida:** Ejecuta en la terminal de tu Mac:
> `sudo sh -c 'echo "127.0.0.1 sonarqube" >> /etc/hosts'`

## 3. Flujo del Pipeline (Pipelines Declarativos)

Ambos servicios (`employees-service` y `notifications-service`) tienen su propio `Jenkinsfile` en la raíz de su carpeta. El flujo visual está diseñado con emojis y banners de separación en consola para máxima claridad.

Las etapas de ambos pipelines son conceptualmente idénticas:

1.  **`🏗️ Build & Install`**: Instala las dependencias. (NPM para Node, Pip/Venv para Python).
2.  **`🧪 Unit Tests & Coverage`**: Ejecuta las pruebas unitarias y genera los reportes de cobertura en formato XML compatible con SonarQube (`lcov.info` o `coverage.xml`).
3.  **`🔍 SonarQube Analysis`**: Usa el plugin `SonarScanner` inyectando el token de seguridad. Envía el código y los reportes de cobertura al servidor interno (`http://sonarqube:9000`).
4.  **`🛡️ Quality Gate`**: Jenkins se pone en "pausa" (timeout de 5 min) esperando que SonarQube analice el código y responda mediante un Webhook si el código cumple los estándares (aprobado o fallido). Si falla, el pipeline se aborta.
5.  **`📦 Docker Package`**: Construye la imagen de producción del microservicio y la sube al registro local de Docker (`localhost:5000/nombre-servicio`).
6.  **`🎭 BDD E2E Tests`**: Levanta todo el entorno con variables que apuntan a los contenedores locales y corre la suite de pruebas funcionales automatizadas (Cucumber).

## 4. Diferencias Específicas por Servicio

### Employees Service (Node.js/TypeScript)
*   **Pipeline Config**: Utiliza `npm ci` para instalar y `npm run test:cov` para pruebas.
*   **SonarQube**: Depende del archivo `sonar-project.properties`.
*   **Variables**: Requiere inyección de dependencias hacia departamentos y el RabbitMQ.

### Notifications Service (Python/Flask)
*   **Pipeline Config**: Crea un entorno virtual (`venv`) al vuelo e instala dependencias con `pip`. Ejecuta pruebas usando `pytest --cov`.
*   **SonarQube**: Configurado para escanear archivos `.py` y consumir el archivo de cobertura `coverage.xml` generado por Pytest.

## 5. Checklist de Preparación (Primer Uso)

Si levantas la infraestructura desde cero (`docker compose down -v`), debes reconfigurar SonarQube para que hable con Jenkins:

1. Ingresa a SonarQube (`localhost:9000`).
2. Crea el token global de tipo "User" llamado `jenkins-token`.
3. Ingresa a Jenkins (`localhost:8086`) -> **Manage Jenkins** -> **Credentials**. Añade un *Secret Text* llamado `sonar-token` y pega el token de SonarQube.
4. En SonarQube, ve a **Administration** -> **Configuration** -> **Webhooks**. Crea uno apuntando a Jenkins: `http://jenkins:8080/sonarqube-webhook/` (¡Ojo! Puerto 8080 porque es comunicación interna entre contenedores).
5. (Opcional pero recomendado) Ejecutar el comando para el `/etc/hosts` de tu maquina para crear el enlace a sonarqube: sudo sh -c 'echo "127.0.0.1 sonarqube" >> /etc/hosts'.
