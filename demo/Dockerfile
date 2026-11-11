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

# Role Based Access Control 1.3.0 (diridium-com), pour OIE 4.7.0 : contrôle des droits
# par rôle et par canal, côté serveur et dans l'administration web.
RUN curl --fail --silent --show-error --location --max-time 300 \
      https://github.com/diridium-com/role-based-access-control/releases/download/v1.3.0/rbac-1.3.0.zip \
      --output /tmp/rbac.zip \
    && echo 'f540cc77ebfadda88147f07fce412caff41abf30ad302ddca61f0b3f422d0cfd  /tmp/rbac.zip' | sha256sum -c -

# OIE Flow UI 0.8.0 (kazepoy) : Flows Monitoring et Channel Flow dans l'administration web.
RUN curl --fail --silent --show-error --location --max-time 300 \
      https://github.com/kazepoy/oie-flow-ui-plugin/releases/download/v0.8.0/flow-ui-0.8.0.zip \
      --output /tmp/flow-ui.zip \
    && echo '3daa6909fe0e5b6b828b96b53540fde297b9a92f0413bc79753460ad25c56556  /tmp/flow-ui.zip' | sha256sum -c -

FROM ${BUSYBOX_IMAGE} AS plugins
COPY --from=downloads /tmp/*.zip /downloads/

RUN mkdir -p /extensions \
    && for zip in /downloads/*.zip; do unzip -q "$zip" -d /extensions; done \
    && chmod -R go-w /extensions

FROM ${MAVEN_IMAGE} AS mapper
WORKDIR /build
# L'API OIE n'est pas publiée sur Maven Central : utiliser celle de l'image cible.
COPY --from=oie-engine /opt/engine/server-lib/mirth-server.jar /engine/server-api.jar
COPY --from=oie-engine /opt/engine/server-lib/donkey/donkey-model.jar /engine/donkey-model.jar
COPY --from=oie-engine /opt/engine/server-lib/donkey/donkey-server.jar /engine/donkey-server.jar
COPY --from=oie-engine /opt/engine/server-lib/mirth-client-core.jar /engine/client-core.jar
COPY --from=plugins /extensions/datatype-fhir/datatype-fhir-shared.jar /engine/datatype-fhir-api.jar
COPY --from=plugins /extensions/datatype-fhir/lib/datatype-fhir-engine.jar /engine/datatype-fhir-engine.jar
COPY pom.xml assembly.xml LICENSE ./
COPY src ./src
COPY doc/examples/mapping ./doc/examples/mapping
COPY webadmin ./webadmin
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -ntp install:install-file -Dfile=/engine/server-api.jar \
      -DgroupId=com.mirth.connect -DartifactId=server-api -Dversion=4.7.0 -Dpackaging=jar \
    && mvn -B -ntp install:install-file -Dfile=/engine/donkey-model.jar \
      -DgroupId=com.mirth.connect -DartifactId=donkey-model -Dversion=4.7.0 -Dpackaging=jar \
    && mvn -B -ntp install:install-file -Dfile=/engine/donkey-server.jar \
      -DgroupId=com.mirth.connect -DartifactId=donkey-server -Dversion=4.7.0 -Dpackaging=jar \
    && mvn -B -ntp install:install-file -Dfile=/engine/client-core.jar \
      -DgroupId=com.mirth.connect -DartifactId=client-core -Dversion=4.7.0 -Dpackaging=jar \
    && mvn -B -ntp install:install-file -Dfile=/engine/datatype-fhir-api.jar \
      -DgroupId=com.matthy.oie -DartifactId=datatype-fhir-api -Dversion=1.5.1 -Dpackaging=jar \
    && mvn -B -ntp install:install-file -Dfile=/engine/datatype-fhir-engine.jar \
      -DgroupId=com.matthy.oie -DartifactId=datatype-fhir-engine -Dversion=1.5.1 -Dpackaging=jar \
    && mvn -B -ntp package \
    && mkdir /extensions && cd /extensions && jar xf /build/target/fhir-profile-mapper-*.zip

FROM oie-engine
COPY --from=plugins --chown=engine:engine /extensions/ /opt/engine/extensions/
COPY --from=mapper --chown=engine:engine /extensions/ /opt/engine/extensions/
# OIE ne journalise que les erreurs par défaut pour les loggers non configurés.
RUN printf '\nlogger.fhirProfileMapper.name = org.oie.fhir.mapper\nlogger.fhirProfileMapper.level = INFO\n' >> conf/log4j2.properties
LABEL org.opencontainers.image.title="OIE 4.7.0, Web Support, FHIR Data Type, RBAC, Flow UI et FHIR Profile Mapper"
