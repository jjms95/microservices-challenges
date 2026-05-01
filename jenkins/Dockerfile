FROM jenkins/jenkins:lts

# Cambiamos a root para poder instalar dependencias y usar Docker
USER root

# Instalamos el cliente de Docker para poder usar 'docker' dentro de Jenkins
RUN apt-get update && \
    apt-get install -y docker.io && \
    rm -rf /var/lib/apt/lists/*

# Volvemos al usuario jenkins (o nos quedamos en root si hay problemas de permisos con el socket,
# pero para mejores prácticas intentamos volver a jenkins y ajustaremos en el compose)
# En muchos entornos locales, es más estable dejarlo en root para evitar problemas de permisos
# con /var/run/docker.sock montado desde Windows. 
# Lo dejaremos como root para asegurar que no falle la conexión al daemon.

# Variables de entorno para omitir el Setup Wizard de Jenkins y usar JCasC
ENV JAVA_OPTS="-Djenkins.install.runSetupWizard=false"
ENV CASC_JENKINS_CONFIG="/var/jenkins_home/casc.yaml"

# Instalamos los plugins necesarios
RUN jenkins-plugin-cli --plugins \
    "workflow-aggregator" \
    "docker-workflow" \
    "git" \
    "configuration-as-code" \
    "sonar" \
    "jacoco" \
    "htmlpublisher" \
    "nodejs"

# Copiamos el archivo de configuración JCasC
COPY casc.yaml /var/jenkins_home/casc.yaml
