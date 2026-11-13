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
| `src/main/java/org/oie/fhir/fml/` | Étape FHIR FML Transform, son API et son pont vers le moteur FML (`lib/fhir-fml-bridge.jar`) |
| `webadmin/src/` | Éditeurs Web Admin : `profile-mapper/editor.js`, `fml/editor.js` et `fml/language.js`, `fhir/` (complétion, lecture de l'exemple, historique, comparaison de résultats), `trace/`, `host/` (éditeur de code, références, action de message) |
| `webadmin/test/` | `unit/` : tests Node sans navigateur ; `e2e/` : parcours Playwright contre la démo |
| `webadmin/web/plugin.js` | Bundle **généré** par `npm run build` (esbuild) ; ne pas l'éditer |
| `tools/` | Outils Python : contrôle du schéma, édition d'une étape dans un export de channel |
| `src/main/resources/plugin.xml` | Descripteur de l'extension, versionné depuis le POM |
| `assembly.xml` | Assemblage du ZIP installable |
| `demo/` | OIE, Web Admin, FHIR Data Type, RBAC et compilation du mapper dans Docker |
| `.github/workflows/release.yml` | Build et release GitHub sur tag |
| `doc/` | Plan de conception et documentation technique |

Les appels à FHIR Data Type passent par la [façade et l'adaptateur](Integration-FHIR-Data-Type.md).
Le plugin n'embarque aucune bibliothèque HAPI ni copie du moteur tiers.

## Démo

Le [guide de la démo](Demo.md) décrit la compilation et le lancement avec Docker,
les paramètres et la vérification du chargement du plugin. Aucun JDK ni Maven
n'est nécessaire sur l'hôte pour ce lancement.

## Compiler sans Docker

Prérequis : JDK 17 ou ultérieur, Maven 3.8 ou ultérieur, Node.js 22 ou ultérieur
et npm (disponibles dans le `PATH`). Les JAR OIE et
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
(cd webadmin && npm run test:e2e)                      # contre la démo lancée (Playwright)
python3 -m unittest discover -s tools/tests
```

`mvn clean package` exécute `npm ci`, `npm run check`, la construction frontend
avant la copie des ressources, les tests Java et les tests unitaires Node.
`-DskipTests` ignore les tests Java/Node, mais reconstruit toujours le frontend.
Le bundle embarqué porte la version Maven via `MAPPER_VERSION`. Un lancement
direct de `npm run build` utilise la version de `webadmin/package.json`.

Le résultat est `target/fhir-profile-mapper-0.1.0-SNAPSHOT.zip` :

```text
fhir-profile-mapper/
  LICENSE
  plugin.xml
  fhir-profile-mapper-server.jar
  lib/fhir-profile-mapper-bridge.jar
  lib/fhir-fml-bridge.jar
  webadmin/plugin.json
  webadmin/web/plugin.js
```

Ce ZIP peut aussi être installé dans *Settings > Extensions* d'OIE 4.7.0, suivi
d'un redémarrage. FHIR Data Type 1.5.1 est requis pour les services FHIR.

## Socle frontend et langues

Les modèles FHIR et la compilation sont dans `src/fhir/model.js` ; les conversions
d’étapes dans `fhir/step.js`, les expressions dans `fhir/expressions.js`.
`host/catalog.js` et `host/channel-context.js` isolent les appels au catalogue et
la lecture du canal hôte. `profile-mapper/expression.js` regroupe les champs de
saisie et la complétion ; `inspector.js` porte l’inspecteur. Les éditeurs gardent
l’orchestration React. Les tests importent les modules directement, sans VM ni
réécriture du fichier source. Les styles sont installés une seule fois à l’entrée
du plugin et utilisent les variables de thème de Web Admin.

Le [guide i18n](i18n.md) décrit les catalogues, le choix de langue et leurs contrôles.
Pour les parcours navigateur : installer Playwright avec `cd webadmin && npx
playwright install chromium webkit`, lancer la démo, puis `npm run test:e2e`.
La variable `E2E_BROWSER=webkit` sélectionne WebKit ; la langue et le thème des
parcours sont explicitement définis, indépendamment du poste de développement.

## Rejouer les exemples

Le [guide de rejeu](Rejeu-tests.md) décrit `tools/run_tests.py`, la validation
hors ligne et les essais sur serveur. La CI de release contrôle les exports
positifs hors ligne ; `demo/examples/check.py` compare les aperçus aux sorties
déployées et rejoue les samples de la démo en ligne.

## Vérifier la reproductibilité

Après `mvn clean package`, exécuter depuis la racine :

```sh
python3 tools/check_reproducible.py
```

Le script copie les sources dans un autre répertoire, sans dépendances Node ni
`target`, remplace le bundle par un contenu périmé, puis reconstruit avec Maven.
Il vérifie son remplacement et compare les ZIP complets octet par octet.
Les horodatages des archives sont fixés par `project.build.outputTimestamp`.
La vérification suppose les mêmes sources et dépendances ; elle ne compare pas
les images Docker ni des versions différentes de JDK/Node. La CI applique ce
contrôle après son assemblage. Le Dockerfile de démo fournit Node/npm à Maven.

## Publier une release

Pousser un tag `vX.Y.Z` : la [GitHub Action](../.github/workflows/release.yml)
construit l'extension avec la version du tag, lance les tests Java et publie le
ZIP et son `SHA256SUMS` dans une release. Un tag contenant `-` (`v0.2.0-rc1`)
donne une pré-release. Les JAR OIE et FHIR Data Type sont extraits des archives
officielles, vérifiées par empreinte. Un lancement manuel construit le ZIP sans
le publier.

Le projet est sous [Mozilla Public License 2.0](../LICENSE). Le texte de licence
est inclus dans le ZIP d'extension et dans le JAR sous `META-INF/LICENSE`.
