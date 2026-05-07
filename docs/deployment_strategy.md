# Estrategia de Despliegue en Producción

Este documento detalla el funcionamiento de la infraestructura, resuelve la duda sobre el rol del Docker Registry, y explica cómo llevar este proyecto de un entorno de pruebas local (con Docker Compose) hacia un entorno de producción real, separando los componentes de Infraestructura (CI/CD) de los de la Aplicación.

---

## 1. El Rol del Docker Registry

Actualmente estamos levantando el contenedor `registry` usando la imagen oficial `registry:2`. 
El Docker Registry actúa como un **"Docker Hub" privado**.

*   **¿Dónde se guardan las imágenes?** Cuando Jenkins construye una imagen (ej. `employees-service`) y ejecuta `docker push localhost:5000/employees-service`, la imagen **no** se queda solo en tu caché local de Docker. El contenedor del Registry la recibe y la guarda físicamente en el volumen `registry_data` de tu disco duro.
*   **¿Por qué usarlo?** Porque en un entorno de producción real, los servidores donde correrá tu aplicación no van a compilar el código. Necesitan un lugar desde donde descargar (hacer `pull`) las imágenes ya pre-compiladas y listas para usar. El Registry sirve exactamente para esto.

---

## 2. Arquitectura de Despliegue en Producción

El archivo `docker-compose.yml` agrupa todo para facilitar el aprendizaje y desarrollo local. Sin embargo, en producción la mejor práctica es **separar físicamente** los entornos. Idealmente, tendrías dos servidores (o clusters) distintos:

### A. Servidor de CI/CD (Infraestructura / DevOps)
Este servidor está dedicado únicamente a automatizar y almacenar herramientas. Contiene:
*   **Jenkins:** Orquesta los despliegues y ejecuta los pipelines.
*   **SonarQube + Sonar DB:** Analiza la calidad y seguridad del código.
*   **Docker Registry:** Almacena de forma segura las imágenes construidas por Jenkins.

**Requisitos para Producción:**
*   El Registry debe estar asegurado y expuesto a través de un dominio HTTPS (ej. `registry.miempresa.com`), usando Nginx o Traefik como proxy inverso. `localhost:5000` solo sirve para pruebas locales.
*   Jenkins debe tener instalado un cliente Docker o acceso a un motor Docker local para compilar las imágenes.

### B. Servidor de Aplicación (Producción)
Este es el servidor "en vivo" donde tus clientes acceden. Contiene:
*   **Tus Microservicios:** `employees-service`, `auth-service`, `departments-service`, etc.
*   **Bases de Datos de la aplicación:** Cada microservicio con su base de datos PostgreSQL.
*   **Message Broker:** RabbitMQ.

**Requisitos para Producción:**
*   **NO** necesita tener el código fuente de tu aplicación (ni Git, ni NodeJS).
*   **NO** compila código.
*   Solo necesita tener Docker (o un orquestador como Kubernetes / Docker Swarm) y credenciales para conectarse a tu Servidor de CI/CD (al Registry) para descargar las imágenes.

---

## 3. ¿Cómo funciona el Pipeline hacia Producción?

Si lleváramos este esquema a producción, el pipeline de Jenkins (`Jenkinsfile`) tendría que cambiar ligeramente para agregar un paso real de despliegue. El flujo sería:

1.  **Build & Test:** Jenkins clona el repositorio, ejecuta pruebas unitarias, escanea con SonarQube y compila la imagen Docker.
2.  **Push al Registry Remoto:** Jenkins sube la imagen al Registry. (En vez de `localhost:5000`, usaría `registry.miempresa.com/employees-service:v1.2.3`).
3.  **Despliegue Remoto (Deploy):** Jenkins se conecta por SSH al **Servidor de Aplicación** (o usa herramientas como Ansible / kubectl) y ejecuta comandos remotamente:
    *   Le ordena al servidor de producción que descargue la nueva imagen: `docker pull registry.miempresa.com/employees-service:v1.2.3`
    *   Detiene el contenedor viejo y levanta el nuevo con la imagen actualizada.

---

## 4. Separación de Archivos Compose (Preparación)

Para evitar que el pipeline se rompa y para tener los servicios de CI/CD completamente aislados de los de la aplicación, hemos dividido el proyecto:

1.  **`docker-compose.ci.yml`**: Contiene exclusivamente la infraestructura (Jenkins, SonarQube, Registry y Sonar-DB).
2.  **`docker-compose.yml`**: Contiene únicamente la aplicación (microservicios, sus bases de datos, RabbitMQ).

### ¿Cómo usar esta nueva estructura localmente?

Si deseas levantar Jenkins y SonarQube de forma individual para hacer pruebas de pipeline, sin tener que levantar toda la aplicación:

```bash
# Levantar SOLO la infraestructura de CI/CD
docker compose -f docker-compose.ci.yml up -d
```

Si deseas levantar la aplicación y desarrollar:

```bash
# Levantar SOLO la aplicación y sus bases de datos
docker compose up -d
```

*Nota: Ambos archivos Compose están configurados para usar la misma red `microservices-network`. Esto permite que Jenkins (que está en el compose de CI) pueda hacer peticiones HTTP (como las pruebas E2E) a los microservicios (que están en el compose de la App) localmente.*
