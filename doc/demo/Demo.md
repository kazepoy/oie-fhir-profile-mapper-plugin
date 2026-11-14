# Démo OIE

Environnement de démonstration du plugin de mapping :

- Open Integration Engine **4.7.0** et PostgreSQL **18.3** ;
- Web Support **1.3.0**, avec l'administration web **1.3.0** ;
- FHIR Data Type **1.5.1**, dans sa version officielle ;
- [Role Based Access Control](https://github.com/diridium-com/role-based-access-control) **1.3.0**
  (diridium-com), qui remplace l'autorisation « tout permis » d'OIE par des rôles ;
- [OIE Flow UI](https://github.com/kazepoy/oie-flow-ui-plugin) **0.8.1**, pour suivre
  les messages dans les canaux (Flows Monitoring, Channel Flow) ;
- FHIR Profile Mapper **0.1.0-SNAPSHOT**, compilé depuis les sources du projet, avec
  ses deux étapes : FHIR Profile Mapper et [FHIR FML Transform](../reference/Transformation-FML.md).

Web Support, FHIR Data Type, RBAC et Flow UI sont téléchargés au build, avec vérification
de leur SHA-256. Les packages officiels
[FR Core 2.2.0](https://hl7.fr/ig/fhir/core/2.2.0/) et
[HL7 Europe Laboratory 2.0.0](https://hl7.eu/fhir/laboratory/2.0.0/) sont eux
aussi épinglés et vérifiés. Le mapper est compilé avec Maven à partir de l'API de l'image OIE
cible, puis installé dans cette même image. Le compilateur, le runtime et l'éditeur graphique sont repris du POC. L'initialisation importe et déploie vingt-trois canaux (dans neuf groupes `<Source> - <Transfo>`), avec les ressources de [demo/fhir-volume](../../demo/fhir-volume) montées dans `/fhir-volume` (`ig/`, `fml/` et `fml-typed/`).

L'initialisation crée cinq contextes dans *Settings › FHIR Mapper* :
`demo-labo`, `fr-core-2.2.0`, `eu-laboratory-2.0.0`, `external-terminology` et `demo-r5`.
Les deux contextes d'IG rendent les profils publiés sélectionnables dans une étape R4 sans téléchargement manuel.
Le contexte FR Core et le contexte EU Laboratory fournissent aussi leurs dépendances directes non-core ; voir [leur périmètre](JSON-FR-Core-et-FML.md#packages-du-contexte).
`external-terminology` pointe vers le mock HTTP de terminologie interne (`http://127.0.0.1:8099/fhir`).
Sur un volume déjà initialisé, relancer `oie-init` réinitialise les contextes, canaux, groupes et tags à l'état initial.

## Ce que montre chaque canal

La [matrice des exemples](Matrice-exemples.md) classe les canaux par groupes et
tags, précise les samples disponibles et distingue les capacités démontrées
des cas encore à construire. Les dix-sept canaux comportant Profile Mapper ont des samples enregistrés avec attendu ; cinq aperçus FML sont rejoués par `check.py`, plus un mock HTTP de terminologie.
Les vingt-trois canaux sont classés dans neuf groupes natifs OIE (`HL7v2 - Mapper`, `HL7v2 - FML`, `FML versus Mapper`, `JSON - Mapper`, `CSV - Mapper`, `CSV - FML`, `XML - Mapper`, `FHIR - FML`, `HTTP - Mock`) et portent des tags
fonctionnels colorés (sans tags IG/profil) ordonnés uniformément : version, source, transformeur, puis fonctions illustrées triées alphabétiquement.

| Canal | Port | Fonctions montrées |
|---|---|---|
| ORU R01 to FHIR Bundle | 8081 | Bundle nommé, sept étapes, itérations de ressources, références entre étapes (`fhirRef`), traductions ConceptMap, **trace des messages traités** (action *FHIR mapping trace* dans Messages), **exemples enregistrés** sur l'étape Patient |
| ORU R01 to FHIR Patient | 8082 | Une ressource seule, sur le **contexte FHIR `demo-labo`** (installé par l'initialisation, visible dans *Settings › FHIR Mapper*) ; slices, itération, condition, traduction ; **deux exemples avec résultat attendu** (*Run all* dans l'onglet Test) |
| ORU R01 to Two Lab Bundles | 8083 | Deux Bundles (transaction et document) qui partagent les mêmes ressources, résultat en variable, chaînes de destinations ; sample multi-étapes sur Patient |
| SQL XML to FHIR Patient | 8084 | Source XML, accents et zéros initiaux ; sample avec Patient attendu |
| CSV Business Patients to Patient | 8085 | Nettoyage à la source, mapping en destination ; sample XML nettoyé |
| CSV Business Patients to Collection | 8086 | Bundle `collection` ; sample multi-étapes des dix lignes nettoyées |
| ORU R01 to FHIR Bundle (FML typed) | 8087 | Strict Parser, modèle logique HL7 v2 typé, map `ORUR01toBundle` important `PIDtoPatient`, Bundle transaction Patient + Observation |
| ORU R01 to FHIR Patient (strict) | 8088 | Strict Parser HL7 v2 : mêmes règles, autres chemins |
| ORU R01 to FHIR Patient (FML inline) | 8089 | **Map FML écrite dans l'étape** (onglet Map, *Check*), sans fichier de map, sur le contexte `demo-labo` |
| Business JSON to Organization R5 | 8090 | Source JSON, champ `description` de type markdown propre à R5, attendu et erreur de conversion |
| Business JSON to Patient FR Core | 8091 | FR Core 2.2.0, identifiant PI, lieu de naissance ; contrainte d'usage de l'identifiant testée |
| FHIR Patient to Summary (FML) | 8092 | Source FHIR JSON validée, map de projection, `active: false` conservé, code de sexe invalide refusé |
| Business JSON to Obs EU Lab | 8093 | Contexte `eu-laboratory-2.0.0`, profil `Observation-resultslab-eu-lab`, attendu et champ obligatoire `effective[x]` manquant refusé |
| CSV to Permission R5 (FML) | 8094 | Source CSV par défaut, map FML R5 produisant un Bundle transaction `Organization` + `Permission` (spécifique R5) |
| ORU R01 to FHIR Patient (FML IG) | 8095 | Map `StructureMap` JSON publiée dans `/fhir-volume/ig`, résolue par `mapUrl` sans map inline ni fichier `.fml` |
| Business JSON to Obs (External TX) | 8096 | Serveur de terminologie externe (`external-terminology`), traduction `GLU` → LOINC, repli sur code inconnu et erreur HTTP 503 |
| ORU R01 Patient (FML vs Mapper) | 8097 | Double destination parallèle sur entrée HL7 v2 simple : Destination 1 en FML inline, Destination 2 en Profile Mapper, sorties identiques et temps comparés en métadonnées (`FML_MS`, `MAPPER_MS`, `DIFF_MS`, `OUTPUTS_EQUAL`) |
| ORU R01 Patient Strict (FML vs Mapper) | 8098 | Même comparaison parallèle FML inline vs Profile Mapper sur HL7 v2 Strict Parser |
| HTTP Terminology Mock ($translate) | 8099 | Mock OIE HTTP implémentant `GET /fhir/ConceptMap/$translate` pour les essais de terminologie externe et d'indisponibilité |
| CSV Patient (FML vs Mapper) | 8100 | Même comparaison parallèle FML inline vs Profile Mapper sur entrée CSV (`DELIMITED`) |
| SQL XML Patient (FML vs Mapper) | 8101 | Même comparaison parallèle FML inline vs Profile Mapper sur XML SQL métier |
| Business JSON Patient (FML vs Mapper) | 8102 | Même comparaison parallèle FML inline vs Profile Mapper sur JSON métier vers Patient FR Core 2.2.0 |
| FHIR Patient Summary (FML vs Mapper) | 8103 | Même comparaison parallèle FML inline (`sourceModel=fhir`) vs Profile Mapper sur ressource Patient FHIR R4 |

Pour voir l'assistance à la saisie : ouvrir le canal du port 8082, son transformeur
source, l'étape *Patient*, puis **Full screen**. Cliquer un champ pour l'éditer avec
la complétion, ouvrir **Sample fields** pour insérer un chemin de l'exemple, et
lancer **Run all** dans l'onglet Test.

Sélectionner le nom **Patient** dans l'arbre ouvre l'inspecteur : **Profile
extension** propose la slice optionnelle `registrationMode`, avec son URL.
**List context extensions** propose notamment `ExampleSourceLabel`, absente du
profil Patient, pour essayer l'ajout par URL puis le choix du type de valeur.
Le menu **⋯** d'un élément s'ouvre aussi au clic droit ou par Maj+F10 ; la
duplication est disponible sur une occurrence répétable mappée et non itérée.

## Lancer

Docker avec Compose **2.23.1 ou ultérieur** est nécessaire (`configs.content`).
Depuis la racine du projet :

```sh
cd demo
docker compose up -d --build
docker compose logs oie-init
```

Le premier build compile OIE depuis ses sources et peut prendre plusieurs minutes.

Administration : <https://localhost:8443/oie-webadmin/> (certificat autosigné).
Compte : `admin`, mot de passe : `demo-oie-password`.
Dans *Settings > Extensions*, vérifier la présence de Web Support, FHIR Data Type,
Role-Based Access Control, Flow UI et FHIR Profile Mapper. Au premier démarrage avec RBAC,
les comptes existants reçoivent le rôle *Administrator* ; un compte créé ensuite
n'a aucun rôle tant qu'il ne lui en est pas attribué un (onglet *Role-Based Access
Control* de *Settings*, ou `POST /api/extensions/rbac/users/{id}/role/{roleId}`).
Pour éditer et tester des mappings, un rôle doit aussi avoir les permissions
**Edit FHIR mappings** et **Test FHIR mapper steps** du plugin, et pour l'étape FML
**Edit FHIR FML transforms** et **Test FHIR FML transforms**. Le journal OIE doit
contenir `FHIR Profile Mapper started.` et `FHIR FML Transform started.`.
L'image active le niveau `INFO` pour les loggers `fr.kazepoy.fhir.mapper` et `fr.kazepoy.fhir.fml`.

Les réglages sont dans [compose.yaml](../../demo/compose.yaml). Pour les personnaliser,
copier [.env.example](../../demo/.env.example) en `demo/.env` avant le premier lancement.
Les ports 8443 et 8081 à 8105 doivent être libres. L'administration utilise
`OIE_BIND_ADDRESS` ; la plage des exemples est publiée sur toutes les interfaces.
Les conteneurs et volumes utilisent le projet
Compose `fhir-profile-mapper-demo`.

## Rejouer les exemples

Les requêtes prêtes à exécuter sont dans
[demo.http](../../examples/demo.http). Le contrôle complet nécessite Python 3 et les dépendances des outils,
depuis la racine du projet :

```sh
python3 -m pip install -r tools/requirements.txt
python3 examples/check.py
```

Ce script crée des messages dans les canaux de démo. Il vérifie les réponses
HTTP et lit les messages via l’API OIE, sans modifier les canaux. Il compare
aussi les aperçus multi-étapes aux sorties des canaux déployés, pour un Bundle
et les deux Bundles labo, puis rejoue les samples des exports avec le même outil
que [run_tests.py](Rejeu-tests.md).

| Port | Route | Résultat vérifié |
|---|---|---|
| 8081 | `/oru/` | Bundle transaction de 12 ressources, ou 4 pour l'ORU minimal |
| 8082 | `/patient/` | Patient conforme au profil d'exemple |
| 8083 | `/labo/` | Transaction de 12 ressources et document de 14, identités partagées, document archivé |
| 8084 | `/sql-patient/` | Ligne XML SQL vers Patient, accents et zéros initiaux conservés |
| 8085 | `/csv-patients/` | Dix messages Patient après nettoyage du CSV ; dernier Patient en réponse HTTP |
| 8086 | `/csv-patients-collection/` | Un Bundle collection contenant les dix Patients |
| 8087 | `/bundle/` | Bundle transaction Patient + Observation par les maps FML typées `ORUR01toBundle` et `PIDtoPatient` |
| 8088 | `/patient/` | Patient par le Strict Parser HL7 v2, identique à celui du port 8082 |
| 8089 | `/patient/` | Patient par la map FML écrite dans l'étape, identique à celui du port 8082 |

Le canal du port 8088, *ORU R01 to FHIR Patient (strict)*, reprend celui du
port 8082 avec **Use Strict Parser** et **Strip Namespaces** dans les propriétés
HL7 v2 entrantes de la source. `msg` est alors le XML HAPI : segments rangés dans
les groupes du message et composants nommés d'après leur type. Seuls les chemins
du mapping changent :

| Élément | Parser par défaut (8082) | Strict Parser (8088) |
|---|---|---|
| PID | `msg['PID']` | `msg['ORU_R01.PATIENT_RESULT']['ORU_R01.PATIENT']['PID']` |
| IPP | `PID.3` → `PID.3.5`, `PID.3.1` | `PID.3` → `CX.5`, `CX.1` |
| Nom | `n['PID.5.1']`, `n['PID.5.2']` | `n['XPN.1']['FN.1']`, `n['XPN.2']` |
| Sexe, naissance | `PID.8.1`, `PID.7.1` | `PID.8`, `PID.7` → `TS.1` |

Le Strict Parser rejette en revanche une version HL7 inconnue de HAPI 2.3 (au-delà
de 2.8.1) et un type de message hors standard.

Le canal du port 8087 utilise le même XML Strict Parser, mais l'adapte au
`StructureDefinition` logique `ORU__R01`. Les noms deviennent compatibles FHIRPath
(`ORU_R01.OBSERVATION` → `ORU__R01_OBSERVATION`, `OBX.3` → `OBX_3`) et les valeurs
terminales sont exposées sous `.value`. Les fixtures montées sont représentatives
du contrat de la démo, pas un IG xxx canonique.

Les destinations portent le nom du système visé, simulé par un JavaScript Writer :
*FHIR Server*, *FHIR Repository*, *Document Repository*, *PCA/PRA Archive*. Le canal
labo a deux chaînes de destinations, visibles dans Channel Flow : le serveur FHIR
reçoit la transaction en parallèle de l'entrepôt documentaire, suivi de l'archive
PCA/PRA. Un filtre n'archive le document que si l'entrepôt l'a accepté ; l'archive
l'écrit dans `appdata/archive-pca/labo-document-<message>.json`.

Le document du canal labo est conservé dans `channelMap["bundleDocument"]`
et dans le contenu *Encoded* de l'entrepôt documentaire et de l'archive. Le script
vérifie ses références et l'identité des douze ressources communes à la transaction.
Il vérifie aussi la traduction locale GLU vers LOINC et le refus de l'ORU sans
date de naissance : réponse HTTP vide, message OIE en `ERROR` mentionnant
`birthDate`. Ce dernier message d'erreur est donc attendu après le contrôle.

Le fichier [diagnostic-error.json](../../examples/api/diagnostic-error.json) provoque
volontairement une conversion booléenne impossible dans l'API de test. Le script
vérifie que le diagnostic désigne `Patient.active`, la règle `0`, la phase
`conversion` et l'expression `'invalide'`, avec la validation FHIR désactivée.
Ce test d'API ne crée pas de message de channel. La même erreur peut être essayée
dans l'éditeur en saisissant `'invalide'` comme expression de `Patient.active` :
le bouton **Go to rule** ramène au champ concerné.

Le fichier [typeerror-error.json](../../examples/api/typeerror-error.json) utilise
`msg.optional.gender` avec une source vide. Il doit renvoyer un diagnostic
`TypeError` de phase `value`, avec et sans validation FHIR. Le contrôle remplace
ensuite l'expression par `msg.optional && msg.optional.gender` et vérifie les
deux cas : donnée facultative absente (élément omis) ou présente (élément mappé).

[trace-preview.json](../../examples/api/trace-preview.json) produit un aperçu
avec une condition ignorée, un élément absent, une date convertie et une
constante appliquée. Le contrôle compare les résultats avec/sans trace, vérifie
la capture explicite des valeurs et la troncature à trois événements.
Dans l'éditeur, activer **Trace**, exécuter le test, puis utiliser
**Export trace JSON**. Voir le [contrat de trace](../reference/Trace.md).

Le channel *ORU R01 to FHIR Bundle* trace aussi ses messages traités : ses
étapes Patient et Observation ont **Trace processed messages**. Après un envoi,
ouvrir **Messages**, le message, puis **Mappings** : la variable `fhirMapperTrace`
contient les règles exécutées, les références réelles et la finalisation du
Bundle. Le contrôle vérifie cette trace sur le dernier message ORU.

Le script utilise les valeurs de démonstration par défaut. En cas de réglages
personnalisés, lui transmettre `OIE_PASSWORD` et `OIE_HTTPS_PORT` dans son
environnement ; il ne lit pas `.env`. Les ports des exemples sont publiés
directement de 8081 à 8099. Si ce mappage est modifié dans Compose, le script
accepte `ORU_PORT`, `PATIENT_PORT`, `LAB_BUNDLES_PORT`, `SQL_PATIENT_PORT`,
`CSV_PATIENTS_PORT` et `CSV_COLLECTION_PORT` pour choisir les ports hôte.
`DEMO_HOST` et `OIE_API` permettent de choisir l'hôte et l'URL de l'API.
Il accepte le certificat autosigné et ignore les proxys pour cette démo locale.

Pour essayer l'éditeur : ouvrir un canal, sélectionner son transformeur,
puis une étape FHIR Profile Mapper. Les profils et traductions passent par
les API de notre plugin. Le fonctionnement de l'éditeur est décrit dans
[Mappeur-graphique.md](../reference/Mappeur-graphique.md).

## Ajouter ou réimporter des exemples

Déposer les exports XML de canaux dans
[demo/oie-init/channels/](../../demo/oie-init/channels/), puis relancer
l'initialisation depuis `demo/` :

```sh
docker compose run --rm oie-init
```

L'init supprime les canaux, groupes et tags existants, puis importe et déploie les
exemples depuis zéro. L'init refuse les imports signalés invalides par OIE et les erreurs de déploiement.
Les futurs listeners peuvent utiliser les ports 8081 à 8099 déjà publiés.
Au-delà de cette plage, compléter `oie-app.ports`.

```sh
docker compose stop  # arrêter en conservant les conteneurs et les données
docker compose down  # retirer les conteneurs ; les volumes restent conservés
```

Cette base est adaptée de `fhir-datatype-Eclipse-OIE/demo-oru2fhir`.
