# syntax=docker/dockerfile:1.7
# OIE est fourni par le service de build oie-engine de compose.yaml.
ARG BUSYBOX_IMAGE=busybox:1.37.0-glibc@sha256:42a9ff19af33811ee466b24c66384461d37c32dcc28d1d27d49b8aca816bd5ee
ARG MAVEN_IMAGE=maven:3.9.9-eclipse-temurin-17
ARG NODE_IMAGE=node:22-bookworm-slim@sha256:e9f565d32859f0cbfb52125eafe8be39390f24dac302dc3cdf566e8ba3ab21ee

FROM ${NODE_IMAGE} AS node-toolchain

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

# OIE Flow UI 0.8.4 (kazepoy) : Flows Monitoring et Channel Flow dans l'administration web.
RUN curl --fail --silent --show-error --location --max-time 300 \
      https://github.com/kazepoy/oie-flow-ui-plugin/releases/download/v0.8.4/flow-ui-0.8.4.zip \
      --output /tmp/flow-ui.zip \
    && echo '91512cca81619c631182cfc3515bce773a5ded34c9c3df21fb53d9763f8e1d89  /tmp/flow-ui.zip' | sha256sum -c -

# Profils publics de la démo, versions permanentes publiées par HL7 France et HL7 Europe.
RUN curl --fail --silent --show-error --location --max-time 300 \
      https://hl7.fr/ig/fhir/core/2.2.0/package.tgz \
      --output /tmp/hl7.fhir.fr.core-2.2.0.tgz \
    && echo '085e61bf579829a6d5520c6f388d763d27ba400f9f6ca548bc88da5545ba13f9  /tmp/hl7.fhir.fr.core-2.2.0.tgz' | sha256sum -c - \
    && curl --fail --silent --show-error --location --max-time 300 \
      https://hl7.eu/fhir/laboratory/2.0.0/package.tgz \
      --output /tmp/hl7.fhir.eu.laboratory-2.0.0.tgz \
    && echo '097aa45c6efcdbc3f25ead8b7d448fee5011b5e7ecf264aa400c5e2c69c5c488  /tmp/hl7.fhir.eu.laboratory-2.0.0.tgz' | sha256sum -c -

# Dépendances directes FR Core et EU Laboratory utilisées par les contextes de démonstration.
RUN curl --fail --silent --show-error --location --max-time 300 \
      https://packages.fhir.org/hl7.fhir.uv.extensions.r4/5.2.0 \
      --output /tmp/hl7.fhir.uv.extensions.r4-5.2.0.tgz \
    && echo 'b406e75575f05676559d0759770c5939d023ee72fb2ef38e0b3259328487720a  /tmp/hl7.fhir.uv.extensions.r4-5.2.0.tgz' | sha256sum -c - \
    && curl --fail --silent --show-error --location --max-time 300 \
      https://packages.fhir.org/hl7.terminology.r4/7.1.0 \
      --output /tmp/hl7.terminology.r4-7.1.0.tgz \
    && echo '1cb0cd5601972925fcd04f2c175d9cc63a9ecd9346a91a6e735f1a865dc5fba1  /tmp/hl7.terminology.r4-7.1.0.tgz' | sha256sum -c - \
    && curl --fail --silent --show-error --location --max-time 300 \
      https://packages.fhir.org/ans.fr.terminologies/1.7.0 \
      --output /tmp/ans.fr.terminologies-1.7.0.tgz \
    && echo '7239d21c228b59849dee4003fe47e4fdcf40da78ccca25c0af50a26f6122baaa  /tmp/ans.fr.terminologies-1.7.0.tgz' | sha256sum -c - \
    && curl --fail --silent --show-error --location --max-time 300 \
      https://packages.fhir.org/hl7.fhir.eu.base/2.0.0 \
      --output /tmp/hl7.fhir.eu.base-2.0.0.tgz \
    && echo 'b2858677ae11245bbc768ced2e205c5354ebf71ae8d7a7a0f2915c3eb6124999  /tmp/hl7.fhir.eu.base-2.0.0.tgz' | sha256sum -c - \
    && curl --fail --silent --show-error --location --max-time 300 \
      https://packages.fhir.org/hl7.fhir.eu.extensions.r4/1.3.0 \
      --output /tmp/hl7.fhir.eu.extensions.r4-1.3.0.tgz \
    && echo '8510e930856961d550c04d43f243ef0bdcb27089431fe183ab11c7f805f0c2f1  /tmp/hl7.fhir.eu.extensions.r4-1.3.0.tgz' | sha256sum -c - \
    && curl --fail --silent --show-error --location --max-time 300 \
      https://packages.fhir.org/hl7.fhir.uv.xver-r5.r4/0.1.0 \
      --output /tmp/hl7.fhir.uv.xver-r5.r4-0.1.0.tgz \
    && echo '7ee6f04d78ced803dd567559a0d178bafbd2d3b71db61bbbf6b15c796a1a664d  /tmp/hl7.fhir.uv.xver-r5.r4-0.1.0.tgz' | sha256sum -c -

FROM ${BUSYBOX_IMAGE} AS plugins
COPY --from=downloads /tmp/*.zip /downloads/

RUN mkdir -p /extensions \
    && for zip in /downloads/*.zip; do unzip -q "$zip" -d /extensions; done \
    && chmod -R go-w /extensions

FROM ${MAVEN_IMAGE} AS mapper
COPY --from=node-toolchain /usr/local/bin/node /usr/local/bin/node
COPY --from=node-toolchain /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/npm
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm
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
    && mvn -B -ntp package -DskipTests \
    && mkdir /extensions && cd /extensions && jar xf /build/target/fhir-profile-mapper-*.zip

FROM oie-engine
COPY --from=plugins --chown=engine:engine /extensions/ /opt/engine/extensions/
COPY --from=mapper --chown=engine:engine /extensions/ /opt/engine/extensions/
COPY --from=downloads --chown=engine:engine /tmp/hl7.fhir.fr.core-2.2.0.tgz /tmp/hl7.fhir.eu.laboratory-2.0.0.tgz /fhir-packages/
COPY --from=downloads --chown=engine:engine /tmp/hl7.fhir.uv.extensions.r4-5.2.0.tgz /tmp/hl7.terminology.r4-7.1.0.tgz /tmp/ans.fr.terminologies-1.7.0.tgz /tmp/hl7.fhir.eu.base-2.0.0.tgz /tmp/hl7.fhir.eu.extensions.r4-1.3.0.tgz /tmp/hl7.fhir.uv.xver-r5.r4-0.1.0.tgz /fhir-packages/
# OIE ne journalise que les erreurs par défaut pour les loggers non configurés.
RUN printf '\nlogger.fhirProfileMapper.name = fr.kazepoy.fhir.mapper\nlogger.fhirProfileMapper.level = INFO\nlogger.fhirFml.name = fr.kazepoy.fhir.fml\nlogger.fhirFml.level = INFO\n' >> conf/log4j2.properties
LABEL org.opencontainers.image.title="OIE 4.7.0 FHIR Profile Mapper - NOT FOR PRODUCTION USE"
