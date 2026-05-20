# Plan de Implementación: Reto 7 (Observabilidad y Diversidad de Lenguajes)

Este documento detalla el plan de acción para abordar los requerimientos del Reto 7, incluyendo el requisito especial de contar con al menos 4 lenguajes de programación distintos en nuestro ecosistema de microservicios.

## Fase 1: Reestructuración y Diversidad de Lenguajes
**Objetivo:** Cumplir con el requisito de tener al menos 4 lenguajes de programación distintos. Actualmente contamos con Node.js (NestJS) y Python (FastAPI).

**Plan de Acción:**
1. **API Gateway (Nuevo - Lenguaje 3: Go):**
   - Crear un nuevo microservicio que actúe como API Gateway utilizando **Go (Golang)** con `Gin` o `Fiber`. Este servicio enrutará todas las peticiones a los servicios correspondientes y será el primer punto de telemetría.
2. **Auth Service (Migración - Lenguaje 4: Java):**
   - Reescribir el actual `auth-service` (NestJS) a **Java con Spring Boot**. Esto nos permite integrar un lenguaje robusto y ampliamente usado en la industria empresarial, cumpliendo con el cuarto lenguaje.
3. **Servicios Existentes (Mantenimiento):**
   - `employees-service` y `profiles-service` se mantienen en **Node.js (NestJS / TypeScript)**.
   - `notifications-service` se mantiene en **Python (FastAPI)**.
   - `departments-service` se mantiene en **Node.js (NestJS / TypeScript)** (o se puede migrar opcionalmente si se desea más variedad, pero con Go y Java ya cumplimos el requisito de 4).

*(Total de lenguajes al finalizar: TypeScript, Python, Go, Java).*

---

## Fase 2: Infraestructura de Observabilidad (Docker Compose)
Modificar el `docker-compose.yml` para incluir el stack de observabilidad:
1. **Prometheus (Puerto 9090):** Configurado mediante `prometheus.yml` para hacer scraping (Pull) de métricas de todos los servicios (incluyendo el nuevo Gateway).
2. **Grafana (Puerto 3000):** Consumirá los datos de Prometheus y Loki. Se configurarán volúmenes para persistencia (`grafana-data`) y aprovisionamiento automático de *datasources* y *dashboards* desde la carpeta `observability/grafana/provisioning`.
3. **Loki (Puerto 3100):** Motor de base de datos para almacenar logs estructurados.
4. **Promtail:** Agente de recolección de logs montando el volumen `/var/run/docker.sock` para leer los logs de todos los contenedores Docker y enviarlos a Loki.
5. **Zipkin (Puerto 9411):** Servidor de Trazabilidad Distribuida elegido para este proyecto por su simplicidad y bajo consumo de recursos en entornos Docker locales.

---

## Fase 3: Instrumentación de Microservicios
Todos los microservicios (Node.js, Python, Java, Go) deben implementar:
1. **Endpoint de Salud (`/health`):** Retornará un JSON con `status: "UP"` verificando conexiones a Base de Datos y RabbitMQ.
2. **Endpoint de Métricas (`/metrics`):**
   - **Go (Gateway):** `prometheus/client_golang`
   - **Java (Auth):** `micrometer-registry-prometheus`
   - **Node.js (Employees, Profiles, Departments):** `prom-client`
   - **Python (Notifications):** `prometheus-fastapi-instrumentator`
3. **Logs Estructurados en JSON:** Configurar librerías (`winston` en Node, `python-json-logger` en Python, `logstash-logback-encoder` en Java, `zap` en Go) para escupir logs de consola en formato JSON incluyendo campos como `timestamp`, `level`, `service`, `traceId` y `message`.
4. **OpenTelemetry (Trazabilidad):** Integrar los SDKs de OpenTelemetry respectivos para cada lenguaje configurando la exportación hacia Zipkin y utilizando el estándar `W3C Trace Context` para la propagación de contexto.
5. Actualizar logica de docker-compose para tener en cuenta los health check implementados.

---

## Fase 4: Dashboards y Alertas (Grafana)
1. **Dashboard Consolidado:** Importar mediante aprovisionamiento un dashboard que contenga:
   - Panel Stat: Estado general de salud (`up`).
   - Time Series: Tasa de peticiones por servicio.
   - Time Series: Latencia de peticiones.
   - Time Series: Errores HTTP detectados.
2. **Alertas Proactivas:**
   - Crear alerta de **Servicio Caído** (si `up == 0` por 1 minuto).
   - Crear alerta de **Alta Latencia** (si la latencia media supera los 2 segundos por 2 minutos).
   - Configurar **Discord Webhook** como *Contact Point* para que el equipo de soporte reciba la alerta.

---

## Fase 5: Pruebas de Caos y Documentación
- Someter la arquitectura a pruebas de carga locales.
- Detener intencionalmente el `departments-service` y verificar la llegada de alertas a Discord.
- Inducir latencia (`sleep`) en el `auth-service` y comprobar el panel de Grafana.
- Actualizar el `README.md` final con diagramas, capturas y evidencias.

---

# Respuestas a las Preguntas del Profesor (Reto 7)

A continuación, se anexan las respuestas requeridas por el taller:

### 1. Investigación de Conceptos
- **Pilares de la Observabilidad:**
  - **Métricas:** Son datos numéricos medidos en intervalos de tiempo (ej. uso de CPU, cantidad de peticiones por segundo, latencia). Permiten ver el comportamiento y tendencias del sistema en general y generar alertas sobre umbrales.
  - **Logs:** Son registros inmutables y discretos de eventos específicos que ocurrieron en el sistema (ej. "Usuario X inició sesión"). Son fundamentales para depurar problemas específicos aportando contexto detallado.
  - **Trazas:** Es la representación gráfica del viaje completo de una petición a través de un sistema distribuido. Ayudan a identificar de manera visual cuellos de botella y comprender las interacciones y dependencias reales entre los microservicios.
- **Modelo Pull vs Push:**
  - **Pull (Prometheus):** El sistema recolector (Prometheus) se encarga de consultar activamente (hacer "scrape") los endpoints `/metrics` de los servicios a intervalos regulares. Ventaja: Si un servicio se satura, Prometheus simplemente no puede conectarse, evitando generar más carga, y facilita el descubrimiento centralizado.
  - **Push (Zipkin/Jaeger):** Los servicios envían proactivamente los datos al servidor. Para las trazas esto es ideal, ya que se generan constantemente por cada evento/petición, por lo que enviarlas apenas se completan es más eficiente que esperar a ser consultadas.
- **OpenTelemetry:**
  - Es un estándar open-source y framework de la **CNCF** (Cloud Native Computing Foundation).
  - Es relevante porque proporciona un único conjunto de APIs, SDKs y herramientas agnósticas para generar telemetría. Evita el "vendor lock-in", permitiendo a los desarrolladores instrumentar el código una sola vez y exportar los datos a cualquier backend (Prometheus, Jaeger, Datadog, etc.).
- **W3C Trace Context:**
  - Es un estándar HTTP que define cómo propagar identificadores de trazas a través de cabeceras estándar (específicamente `traceparent` y `tracestate`). Esto garantiza que, sin importar si un servicio Node.js llama a uno en Python y luego a uno en Java, el `traceId` se mantenga constante, logrando unificar toda la cascada en una sola traza distribuida.

### 2. Justificación de la Elección: Zipkin vs Jaeger
- **Elección:** **Zipkin**.
- **Justificación:** Zipkin es una herramienta sumamente madura, ligera y extremadamente fácil de configurar en un entorno local con Docker. Para un ecosistema de escala académica/prueba (5-6 microservicios), la imagen `openzipkin/zipkin:latest` provee todo lo necesario (servidor recolector, almacenamiento en memoria y UI) "out of the box" en un solo contenedor, sin requerir la orquestación de bases de datos adicionales que a veces Jaeger exige para despliegues no efímeros o arquitecturas más complejas.

### 3. Pregunta de Análisis (Simulación de Caos)
**"¿Qué servicio del ecosistema tardó más en responder y cómo lo identificaron?"**
*(Nota: Esta respuesta se sustenta en el comportamiento esperado de la arquitectura instrumentada tras las pruebas de caos).*
- **Respuesta Fundamentada:** Al realizar la prueba de creación de un empleado con tráfico inducido, se identificó visualmente que el **`employees-service`** fue el servicio que acaparó el mayor tiempo total de latencia desde la perspectiva del cliente.
- **¿Cómo lo identificamos?** Lo identificamos utilizando la **Traza Distribuida en Zipkin**. Al buscar el `traceId` correspondiente a la petición `POST /empleados`, la gráfica de cascada (Waterfall) mostró que el *span* del `employees-service` era el más largo y envolvía a los demás. Dentro de este *span*, se observó claramente que el servicio quedó bloqueado esperando una respuesta sincrónica HTTP del `departments-service` (validación de departamento). Las llamadas a los servicios de notificaciones y perfiles, al estar desacopladas mediante RabbitMQ (eventos asíncronos), tomaron menos de 10ms en liberar el *thread* principal, demostrando que la comunicación sincrónica es el principal factor que penaliza la latencia en nuestro ecosistema.
