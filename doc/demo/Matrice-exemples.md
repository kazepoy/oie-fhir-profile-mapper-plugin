# Matrice des canaux et exemples

Cette matrice classe les demandes du TODO selon les preuves disponibles. Le
socle compte désormais vingt-trois canaux répartis en neuf groupes natifs `<Source> - <Transfo>` :
**HL7v2 - Mapper**, **HL7v2 - FML**, **FML versus Mapper**, **JSON - Mapper**, **CSV - Mapper**, **CSV - FML**,
**XML - Mapper**, **FHIR - FML** et **HTTP - Mock**.

Le [manifeste](../../examples/channels.json) associe chaque export à un
groupe, des tags et un fichier d'entrée.
Les tags fonctionnels colorés (sans tags d'IG ni de profil) sont portés par `exportData/channelTags` dans chaque
export et suivent partout le même ordre canonique (`version`, `source`, `transformeur`, puis capacités triées alphabétiquement) : ils sont visibles et filtrables dans OIE, et conservés à l'export.
Le contrôle de démo vérifie leurs affectations réelles via l'API.

## Parcours disponibles

Tous les transformeurs source ont un message entrant préchargé. Dans chaque
canal Profile Mapper, ouvrir l'étape **Patient** (ou **Organization** sur 10810,
**Observation** sur 10813 et 10816), puis **Test** : elle contient
au moins un sample avec résultat attendu. Les deux canaux CSV Mapper transforment
en destination après nettoyage ; le canal CSV FML R5 transforme directement en source.

| Groupe | Canal (port) | Preuve distinctive | Exemple testable |
|---|---|---|---|
| `hl7v2-mapper` | ORU R01 to FHIR Bundle (10801) | Transaction, références, terminologie locale, traces | Deux samples Patient ; rejeu du canal : 12 puis 4 ressources |
| `hl7v2-mapper` | ORU R01 to FHIR Patient (10802) | Contexte partagé, profil local, slices et traduction | Deux samples Patient avec attendu |
| `hl7v2-mapper` | ORU R01 to Two Lab Bundles (10803) | Transaction et document partageant les ressources | Sample de portée **transformer** : transaction attendue ; rejeu vérifiant aussi le document et l'archive |
| `hl7v2-mapper` | ORU R01 to FHIR Patient (strict) (10808) | Chemins HAPI plutôt que chemins du parseur standard | Sample XML typé avec Patient attendu ; canal recevant l'ER7 |
| `hl7v2-fml` | ORU R01 to FHIR Bundle (FML typed) (10807) | Modèle logique HL7 v2 et map important une autre map | XML typé et Bundle attendu, contrôlés par l'API FML et le canal ER7 |
| `hl7v2-fml` | ORU R01 to FHIR Patient (FML inline) (10809) | Map embarquée, modèle `OieMessage`, ConceptMap locale | Message ER7 préchargé ; Patient attendu vérifié par l'API FML et le canal |
| `hl7v2-fml` | ORU R01 to FHIR Patient (FML IG) (10815) | `StructureMap` JSON publiée dans `/fhir-volume/ig`, résolue par `mapUrl` | ER7 nominal et ER7 sans date de naissance refusé |
| `fml-versus-mapper` | ORU R01 Patient (FML vs Mapper) (10817) | Double destination parallèle HL7 v2 simple : FML inline vs Mapper, sorties identiques | Métadonnées `FML_MS`, `MAPPER_MS`, `DIFF_MS` et `OUTPUTS_EQUAL=true` |
| `fml-versus-mapper` | ORU R01 Patient Strict (FML vs Mapper) (10818) | Double destination parallèle HL7 v2 Strict Parser : FML inline vs Mapper, sorties identiques | Métadonnées `FML_MS`, `MAPPER_MS`, `DIFF_MS` et `OUTPUTS_EQUAL=true` |
| `fml-versus-mapper` | CSV Patient (FML vs Mapper) (10820) | Double destination parallèle CSV (`DELIMITED`) : FML inline vs Mapper, sorties identiques | Métadonnées `FML_MS`, `MAPPER_MS`, `DIFF_MS` et `OUTPUTS_EQUAL=true` |
| `fml-versus-mapper` | SQL XML Patient (FML vs Mapper) (10821) | Double destination parallèle XML SQL métier : FML inline vs Mapper, sorties identiques | Métadonnées `FML_MS`, `MAPPER_MS`, `DIFF_MS` et `OUTPUTS_EQUAL=true` |
| `fml-versus-mapper` | Business JSON Patient (FML vs Mapper) (10822) | Double destination parallèle JSON métier (FR Core 2.2.0) : FML inline vs Mapper, sorties identiques | Métadonnées `FML_MS`, `MAPPER_MS`, `DIFF_MS` et `OUTPUTS_EQUAL=true` |
| `fml-versus-mapper` | FHIR Patient Summary (FML vs Mapper) (10823) | Double destination parallèle source FHIR (`sourceModel=fhir`) : FML inline vs Mapper, sorties identiques | Métadonnées `FML_MS`, `MAPPER_MS`, `DIFF_MS` et `OUTPUTS_EQUAL=true` |
| `xml-mapper` | SQL XML to FHIR Patient (10804) | XML de ligne SQL simulée, accents et zéros initiaux | Ligne XML et Patient attendu ; aucune base SQL requise |
| `csv-mapper` | CSV Business Patients to Patient (10805) | Découpage batch, nettoyage puis mapping en destination | Sample XML d'une ligne déjà nettoyée ; rejeu CSV vérifiant les dix messages |
| `csv-mapper` | CSV Business Patients to Collection (10806) | Dix ressources dans un seul Bundle | Sample XML nettoyé, portée **transformer**, collection attendue |
| `csv-fml` | CSV to Permission R5 (FML) (10814) | CSV par défaut vers Bundle R5 (`Organization` + `Permission`) | CSV nominal et statut invalide refusé en aperçu et déployé |
| `json-mapper` | Business JSON to Organization R5 (10810) | JSON métier et champ markdown propre à R5 | Sample avec attendu ; conversion booléenne invalide refusée |
| `json-mapper` | Business JSON to Patient FR Core (10811) | Profil publié 2.2.0, slice PI, extension de lieu de naissance | Sample avec attendu ; usage PI `official` refusé par la validation |
| `json-mapper` | Business JSON to Obs EU Lab (10813) | Profil publié EU Laboratory 2.0.0 (`Observation-resultslab-eu-lab`) | Sample avec attendu ; `effective[x]` manquant refusé |
| `json-mapper` | Business JSON to Obs (External TX) (10816) | Serveur de terminologie externe (`ConceptMap/$translate`) | `GLU` traduit, `UNKNOWN` en repli `fixed`, `UNAVAILABLE` en erreur 503 |
| `fhir-fml` | FHIR Patient to Summary (FML) (10812) | Source `fhir`, projection sans `OieMessage`, `false` conservé | JSON et attendu ; sexe non autorisé refusé |
| `http-mock` | HTTP Terminology Mock ($translate) (10819) | Serveur mock léger répondant à `/fhir/ConceptMap/$translate` | Supporte le canal 10816 et les tests de disponibilité |

Le [guide des trois nouveaux parcours](JSON-FR-Core-et-FML.md) détaille les
requêtes, les cas d'erreur et le périmètre des dépendances FR Core.

Les attendus ajoutés ont été confrontés aux sorties déployées et aux
assertions métier du script de contrôle. Le rejeu compare le contenu en
normalisant les UUID, tout en conservant leurs relations de référence.

## Tester les variantes Strict Parser et CSV

L'aperçu HL7 v2 utilise le sérialiseur standard du serveur, pas les propriétés
du connecteur. Pour les étapes Strict Parser, tester avec **Data type = XML** et
le [XML typé du message minimal](../../examples/hl7v2/oru-r01-minimal-strict.xml).
Ce fichier provient du Strict Parser OIE, avec suppression du namespace comme
dans les canaux. Il contient notamment `<OBX.5>5.10</OBX.5>` : ce champ primitif
n'a pas d'enfant `Varies.1`.

Le Profile Mapper strict enregistre déjà ce sample XML. Pour FML typé,
sélectionner XML et copier ce fichier dans **Sample message**. FML n'enregistre
pas encore de jeux d'essai dans l'étape : le manifeste associe l'entrée XML à
son [Bundle attendu](../../examples/hl7v2/oru-r01-minimal-strict-expected.json), et
`check.py` les rejoue via `/extensions/fhir-fml/test`.

Le Bundle FML typé est un exemple d'imports et de modèle logique, pas une
conversion clinique complète : la valeur biologique est une `valueString`, sans
unité ni référence au Patient. Le canal laboratoire Profile Mapper porte la
démonstration des valeurs quantitatives, unités et références.

Pour les deux CSV, les samples XML des étapes représentent les données après
nettoyage : l'aperçu n'exécute pas les JavaScriptSteps précédents ni le
découpage batch. Le rejeu HTTP du CSV reste donc nécessaire.

## Diagnostics disponibles

`python3 examples/check.py` vérifie aussi :

- naissance obligatoire absente : message déployé en erreur avec `birthDate` ;
- conversion booléenne impossible : diagnostic avec chemin, règle et expression ;
- accès à une donnée facultative absente, puis correction par une garde ;
- traces bornées, valeurs capturées seulement à la demande et résultat inchangé.

Ces erreurs sont des cas du contrôle existant, pas des canaux supplémentaires.

## Demandes du TODO couvertes et suites différées

| Demande | État et suite pertinente |
|---|---|
| Source JSON métier et ressource FHIR entrante | Couvertes par les ports 10810, 10811, 10812, 10813 et 10816 |
| R4B/R5, fonction propre à R5 | Profile Mapper R5 démontré par `Organization.description` sur 10810 ; FML R5 (CSV vers `Organization` et `Permission`) démontré sur 10814 ; R4B écarté de la démo par choix utilisateur (reste couvert en tests Java) |
| FR Core et HL7 Europe Laboratory | Patient FR Core 2.2.0 validé sur 10811 ; Observation EU Laboratory 2.0.0 (avec dépendances directes fixées) validée sur 10813 |
| Map publiée dans un package IG (`mapUrl`) | Couverte sur 10815 (`ORU R01 to FHIR Patient (FML IG)`) avec `StructureMap-OruR01ToPatientIG.json` |
| Terminologie externe, absence de correspondance et indisponibilité | Mock OIE `ConceptMap/$translate` sur 10819 et consommateur sur 10816 : traduction GLU -> LOINC, repli `fixed` vers `data-absent-reason#unknown` et erreur 503 sur `UNAVAILABLE` |
| Groupes OIE `<Source> - <Transfo>` et tags ordonnés | 8 groupes natifs (`CSV - FML`, `CSV - Mapper`, `FHIR - FML`, `HL7v2 - FML`, `HL7v2 - Mapper`, `HTTP - Mock`, `JSON - Mapper`, `XML - Mapper`), tags colorés sans tags IG/profil, dans l'ordre `[Release, Source, Transfo, ...fonctionnalités]` |
| Cas nécessitant conception ou arbitrage | Profil R4 externe (`DevDays`), IG HL7 v2 officielle, modèle logique métier arbitraire dans FML, dérivation/surcharge, imports imbriqués et samples FML enregistrés restent différés |

## Rejouer

Depuis la racine, démo à jour et démarrée :

```sh
python3 -m unittest discover -s tools/tests
python3 tools/run_tests.py --offline demo/oie-init/channels
python3 examples/check.py
```

Le premier contrôle impose une entrée de manifeste par export, l'ordre
canonique des tags, un message préchargé par canal et les attendus des exemples.
Le second contrôle les structures des vingt samples Profile Mapper ; le
dernier exécute les vingt-trois canaux, ces vingt samples, les cinq aperçus
FML, les sept contre-exemples et le contrôle des neuf groupes et des tags. Voir
le [guide de rejeu](Rejeu-tests.md) pour cibler un export.
