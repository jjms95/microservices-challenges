FROM jenkins/jenkins:lts

# Cambiamos a root para poder instalar dependencias y usar Docker
USER root

# Instalamos el cliente de Docker para poder usar 'docker' dentro de Jenkins
RUN apt-get update && \
    apt-get install -y docker.io curl && \
    rm -rf /var/lib/apt/lists/*

# Instalamos Docker Compose v2 (necesario para el comando 'docker compose' en la etapa E2E)
RUN mkdir -p /usr/local/lib/docker/cli-plugins && \
    curl -SL https://github.com/docker/compose/releases/download/v2.26.1/docker-compose-linux-$(uname -m) -o /usr/local/lib/docker/cli-plugins/docker-compose && \
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

ENV JAVA_OPTS="-Djenkins.install.runSetupWizard=false -Dhudson.model.DirectoryBrowserSupport.CSP="
ENV CASC_JENKINS_CONFIG="/etc/jenkins/casc.yaml"

# Allow git to clone from local file:// URIs (useful for local development with mounted workspaces)
RUN git config --system protocol.file.allow always

# Instalamos los plugins necesarios
RUN jenkins-plugin-cli --plugins \
    "workflow-aggregator" \
    "docker-workflow" \
    "git" \
    "configuration-as-code" \
    "sonar" \
    "jacoco" \
    "htmlpublisher" \
    "nodejs" \
    "job-dsl" \
    "lockable-resources"

RUN mkdir -p /etc/jenkins
COPY casc.yaml /etc/jenkins/casc.yaml
