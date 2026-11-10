# Développement et installation

Le format des mappings, son schéma et les exemples exécutés par
`MappingSpecificationTest` sont dans [Specification-mapping.md](Specification-mapping.md).

## Structure

| Chemin | Rôle |
|---|---|
| `pom.xml` | Module Maven, Java 17, API OIE 4.7.0 fournie par le moteur |
| `src/main/java/org/oie/fhir/mapper/` | Compilateur des étapes et métadonnées de déploiement |
| `src/main/java/org/oie/fhir/mapper/server/` | Cycle de vie, API et exécution des tests de l'éditeur |
| `src/main/java/org/oie/fhir/mapper/integration/` | Adaptateur du datatype et pont de catalogue |
| `webadmin/` | Éditeur, onglet Flow, vue Flows et leurs tests Node |
| `tools/` | Outils Python : contrôle du schéma, édition d'une étape dans un export de channel |
| `src/main/resources/plugin.xml` | Descripteur de l'extension, versionné depuis le POM |
| `assembly.xml` | Assemblage du ZIP installable |
| `demo/` | OIE, Web Admin, FHIR Data Type, RBAC et compilation du mapper dans Docker |
| `.github/workflows/release.yml` | Build et release GitHub sur tag |
| `docs/` | Plan de conception et documentation technique |

Les appels à FHIR Data Type passent par la [façade et l'adaptateur](Integration-FHIR-Data-Type.md).
Le plugin n'embarque aucune bibliothèque HAPI ni copie du moteur tiers.

## Démo

Le [guide de la démo](Demo.md) décrit la compilation et le lancement avec Docker,
les paramètres et la vérification du chargement du plugin. Aucun JDK ni Maven
n'est nécessaire sur l'hôte pour ce lancement.

## Compiler sans Docker

Prérequis : JDK 17 ou ultérieur et Maven 3.8 ou ultérieur. Les JAR OIE et
FHIR Data Type ne sont pas publiés sur Maven Central. Les installer une fois
depuis une installation OIE 4.7.0 contenant le datatype officiel 1.5.1.
Depuis la racine du projet :

```sh
OIE_INSTALL_DIR=/chemin/vers/oie
install_oie_jar() {
  mvn install:install-file -Dfile="$OIE_INSTALL_DIR/$2" \
    -DgroupId=com.mirth.connect -DartifactId="$1" -Dversion=4.7.0 -Dpackaging=jar
}
install_oie_jar server-api server-lib/mirth-server.jar
install_oie_jar client-core server-lib/mirth-client-core.jar
install_oie_jar donkey-model server-lib/donkey/donkey-model.jar
install_oie_jar donkey-server server-lib/donkey/donkey-server.jar
mvn install:install-file \
  -Dfile="$OIE_INSTALL_DIR/extensions/datatype-fhir/datatype-fhir-shared.jar" \
  -DgroupId=com.matthy.oie -DartifactId=datatype-fhir-api -Dversion=1.5.1 -Dpackaging=jar
mvn install:install-file \
  -Dfile="$OIE_INSTALL_DIR/extensions/datatype-fhir/lib/datatype-fhir-engine.jar" \
  -DgroupId=com.matthy.oie -DartifactId=datatype-fhir-engine -Dversion=1.5.1 -Dpackaging=jar
mvn clean package
node --test webadmin/test/
python3 -m unittest discover -s tools/tests
```

Le résultat est `target/fhir-profile-mapper-0.1.0-SNAPSHOT.zip` :

```text
fhir-profile-mapper/
  LICENSE
  plugin.xml
  fhir-profile-mapper-server.jar
  lib/fhir-profile-mapper-bridge.jar
  webadmin/plugin.json
  webadmin/web/plugin.js
  webadmin/web/channel-flow.js
  webadmin/web/flow-dashboard.js
```

Ce ZIP peut aussi être installé dans *Settings > Extensions* d'OIE 4.7.0, suivi
d'un redémarrage. FHIR Data Type 1.5.1 est requis pour les services FHIR.

## Publier une release

Pousser un tag `vX.Y.Z` : la [GitHub Action](../.github/workflows/release.yml)
construit l'extension avec la version du tag, lance les tests Java et publie le
ZIP et son `SHA256SUMS` dans une release. Un tag contenant `-` (`v0.2.0-rc1`)
donne une pré-release. Les JAR OIE et FHIR Data Type sont extraits des archives
officielles, vérifiées par empreinte. Un lancement manuel construit le ZIP sans
le publier.

Le projet est sous [Mozilla Public License 2.0](../LICENSE). Le texte de licence
est inclus dans le ZIP d'extension et dans le JAR sous `META-INF/LICENSE`.
