FROM jenkins/jenkins:lts

# Cambiamos a root para poder instalar dependencias y usar Docker
USER root

# Instalamos el cliente de Docker para poder usar 'docker' dentro de Jenkins
RUN apt-get update && \
    apt-get install -y docker.io python3 python3-pip python3-venv && \
    rm -rf /var/lib/apt/lists/*

ENV JAVA_OPTS="-Djenkins.install.runSetupWizard=false"
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
    "job-dsl"

RUN mkdir -p /etc/jenkins
COPY casc.yaml /etc/jenkins/casc.yaml
