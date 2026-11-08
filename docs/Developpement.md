# Développement et installation

Le projet dispose pour l'instant d'un socle compilable et installable : un
plugin de service qui journalise son démarrage et son arrêt. Le runtime et
l'éditeur graphique suivront le [plan du projet](Plan.md).

## Structure

| Chemin | Rôle |
|---|---|
| `pom.xml` | Module Maven, Java 17, API OIE 4.7.0 fournie par le moteur |
| `src/main/java/org/oie/fhir/mapper/server/` | Point d'entrée du plugin et cycle de vie OIE |
| `src/main/resources/plugin.xml` | Descripteur de l'extension, versionné depuis le POM |
| `assembly.xml` | Assemblage du ZIP installable |
| `demo/` | OIE, Web Admin, FHIR Data Type et compilation du mapper dans Docker |
| `docs/` | Plan de conception et documentation technique |

Les futurs appels à FHIR Data Type seront centralisés dans l'adaptateur prévu
au plan. Le socle n'embarque aucune bibliothèque HAPI ni copie du plugin tiers.

## Démo

Le [guide de la démo](Demo.md) décrit la compilation et le lancement avec Docker,
les paramètres et la vérification du chargement du plugin. Aucun JDK ni Maven
n'est nécessaire sur l'hôte pour ce lancement.

## Compiler sans Docker

Prérequis : JDK 17 ou ultérieur et Maven 3.8 ou ultérieur. L'API OIE n'est pas sur
Maven Central ; l'installer une fois depuis une installation OIE 4.7.0.
Exécuter les commandes suivantes depuis la racine du projet :

```sh
OIE_INSTALL_DIR=/chemin/vers/oie
mvn install:install-file \
  -Dfile="$OIE_INSTALL_DIR/server-lib/mirth-server.jar" \
  -DgroupId=com.mirth.connect -DartifactId=server-api \
  -Dversion=4.7.0 -Dpackaging=jar
mvn clean package
```

Le résultat est `target/fhir-profile-mapper-0.1.0-SNAPSHOT.zip` :

```text
fhir-profile-mapper/
  LICENSE
  plugin.xml
  fhir-profile-mapper-server.jar
```

Ce ZIP peut aussi être installé dans *Settings > Extensions* d'OIE 4.7.0, suivi
d'un redémarrage. FHIR Data Type reste le prérequis pour les futurs services FHIR.

Le projet est sous [Mozilla Public License 2.0](../LICENSE). Le texte de licence
est inclus dans le ZIP d'extension et dans le JAR sous `META-INF/LICENSE`.
