# syntax=docker/dockerfile:1.7
# OIE est fourni par le service de build oie-engine de compose.yaml.
ARG BUSYBOX_IMAGE=busybox:1.37.0-glibc@sha256:42a9ff19af33811ee466b24c66384461d37c32dcc28d1d27d49b8aca816bd5ee
ARG MAVEN_IMAGE=maven:3.9.9-eclipse-temurin-17

FROM curlimages/curl:8.21.0 AS downloads

# Archives officielles, récupérées par l'API GitHub puis vérifiées.
# Web Support 1.3.0 embarque l'administration web 1.3.0.
RUN curl --fail --silent --show-error --location --max-time 300 \
      --header 'Accept: application/octet-stream' \
      https://api.github.com/repos/gibson9583/oie-web-support-plugin/releases/assets/707054284 \
      --output /tmp/websupport.zip \
    && echo '69a6b2285000d6c7356aaa547746528fe0bf145ba9bdf5d595fb9a390aff54ff  /tmp/websupport.zip' | sha256sum -c -

# FHIR Data Type 1.5.1, sans le mapper du POC.
RUN curl --fail --silent --show-error --location --max-time 300 \
      --header 'Accept: application/octet-stream' \
      https://api.github.com/repos/matthydehoog/fhir-datatype-Eclipse-OIE/releases/assets/684674339 \
      --output /tmp/datatype-fhir.zip \
    && echo '11792ed53a01feb52a226b5b19b4dbdae58f183eb4075a3569fda7eaa6124458  /tmp/datatype-fhir.zip' | sha256sum -c -

FROM ${BUSYBOX_IMAGE} AS plugins
COPY --from=downloads /tmp/*.zip /downloads/

RUN mkdir -p /extensions \
    && for zip in /downloads/*.zip; do unzip -q "$zip" -d /extensions; done \
    && chmod -R go-w /extensions

FROM ${MAVEN_IMAGE} AS mapper
WORKDIR /build
# L'API OIE n'est pas publiée sur Maven Central : utiliser celle de l'image cible.
COPY --from=oie-engine /opt/engine/server-lib/mirth-server.jar /engine/server-api.jar
COPY pom.xml assembly.xml LICENSE ./
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -ntp install:install-file -Dfile=/engine/server-api.jar \
      -DgroupId=com.mirth.connect -DartifactId=server-api -Dversion=4.7.0 -Dpackaging=jar \
    && mvn -B -ntp package \
    && mkdir /extensions && cd /extensions && jar xf /build/target/fhir-profile-mapper-*.zip

FROM oie-engine
COPY --from=plugins --chown=engine:engine /extensions/ /opt/engine/extensions/
COPY --from=mapper --chown=engine:engine /extensions/ /opt/engine/extensions/
# OIE ne journalise que les erreurs par défaut pour les loggers non configurés.
RUN printf '\nlogger.fhirProfileMapper.name = org.oie.fhir.mapper\nlogger.fhirProfileMapper.level = INFO\n' >> conf/log4j2.properties
LABEL org.opencontainers.image.title="OIE 4.7.0, Web Support, FHIR Data Type et FHIR Profile Mapper"
