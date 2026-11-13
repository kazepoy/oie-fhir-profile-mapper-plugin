# Matrice des canaux et exemples

Cette matrice classe les demandes du TODO selon les preuves disponibles. Le
socle compte désormais douze canaux, dont trois parcours JSON/R5, FR Core et
source FHIR ajoutés après la consolidation des neuf premiers.

Le [manifeste](../../demo/examples/channels.json) associe chaque export à un
groupe, des tags et un fichier d'entrée. L'initialisation installe les groupes
natifs **FHIR - Mapper HL7 v2**, **FHIR - Mapper metier** et **FHIR - FML**.
Les tags fonctionnels sont portés par `exportData/channelTags` dans chaque
export : ils sont visibles et filtrables dans OIE, et conservés à l'export.
Le contrôle de démo vérifie leurs affectations réelles via l'API.

## Parcours disponibles

Tous les transformeurs source ont un message entrant préchargé. Dans chaque
canal Profile Mapper, ouvrir l'étape **Patient** (ou **Organization** sur 8090),
puis **Test** : elle contient
au moins un sample avec résultat attendu. Les deux canaux CSV mappent dans la
première destination, après le nettoyage effectué par la source.

| Groupe | Canal (port) | Preuve distinctive | Exemple testable |
|---|---|---|---|
| `mapper-hl7v2` | ORU → Bundle (8081) | Transaction, références, terminologie locale, traces | Deux samples Patient ; rejeu du canal : 12 puis 4 ressources |
| `mapper-hl7v2` | ORU → Patient (8082) | Contexte partagé, profil local, slices et traduction | Deux samples Patient avec attendu |
| `mapper-hl7v2` | ORU → deux Bundles (8083) | Transaction et document partageant les ressources | Sample de portée **transformer** : transaction attendue ; rejeu vérifiant aussi le document et l'archive |
| `mapper-metier` | SQL XML → Patient (8084) | XML de ligne SQL simulée, accents et zéros initiaux | Ligne XML et Patient attendu ; aucune base SQL requise |
| `mapper-metier` | CSV → Patients (8085) | Découpage batch, nettoyage puis mapping en destination | Sample XML d'une ligne déjà nettoyée ; rejeu CSV vérifiant les dix messages |
| `mapper-metier` | CSV → collection (8086) | Dix ressources dans un seul Bundle | Sample XML nettoyé, portée **transformer**, collection attendue |
| `fml` | ORU Strict Parser → Bundle (8087) | Modèle logique HL7 v2 et map important une autre map | XML typé et Bundle attendu, contrôlés par l'API FML et le canal ER7 |
| `mapper-hl7v2` | ORU Strict Parser → Patient (8088) | Chemins HAPI plutôt que chemins du parseur standard | Sample XML typé avec Patient attendu ; canal recevant l'ER7 |
| `fml` | ORU → Patient inline (8089) | Map embarquée, modèle `OieMessage`, ConceptMap locale | Message ER7 préchargé ; Patient attendu vérifié par l'API FML et le canal |
| `mapper-metier` | JSON → Organization R5 (8090) | JSON métier et champ markdown propre à R5 | Sample avec attendu ; conversion booléenne invalide refusée |
| `mapper-metier` | JSON → Patient FR Core (8091) | Profil publié 2.2.0, slice PI, extension de lieu de naissance | Sample avec attendu ; usage PI `official` refusé par la validation |
| `fml` | Patient FHIR → résumé (8092) | Source `fhir`, projection sans `OieMessage`, `false` conservé | JSON et attendu ; sexe non autorisé refusé |

Le [guide des trois nouveaux parcours](JSON-FR-Core-et-FML.md) détaille les
requêtes, les cas d'erreur et le périmètre des dépendances FR Core.

Les attendus ajoutés ont été confrontés aux sorties déployées et aux
assertions métier du script de contrôle. Le rejeu compare le contenu en
normalisant les UUID, tout en conservant leurs relations de référence.

## Tester les variantes Strict Parser et CSV

L'aperçu HL7 v2 utilise le sérialiseur standard du serveur, pas les propriétés
du connecteur. Pour les étapes Strict Parser, tester avec **Data type = XML** et
le [XML typé du message minimal](../../demo/examples/oru-r01-minimal-strict.xml).
Ce fichier provient du Strict Parser OIE, avec suppression du namespace comme
dans les canaux. Il contient notamment `<OBX.5>5.10</OBX.5>` : ce champ primitif
n'a pas d'enfant `Varies.1`.

Le Profile Mapper strict enregistre déjà ce sample XML. Pour FML typé,
sélectionner XML et copier ce fichier dans **Sample message**. FML n'enregistre
pas encore de jeux d'essai dans l'étape : le manifeste associe l'entrée XML à
son [Bundle attendu](../../demo/examples/expected/fml-typed-bundle.json), et
`check.py` les rejoue via `/extensions/fhir-fml/test`.

Le Bundle FML typé est un exemple d'imports et de modèle logique, pas une
conversion clinique complète : la valeur biologique est une `valueString`, sans
unité ni référence au Patient. Le canal laboratoire Profile Mapper porte la
démonstration des valeurs quantitatives, unités et références.

Pour les deux CSV, les samples XML des étapes représentent les données après
nettoyage : l'aperçu n'exécute pas les JavaScriptSteps précédents ni le
découpage batch. Le rejeu HTTP du CSV reste donc nécessaire.

## Diagnostics disponibles

`python3 demo/examples/check.py` vérifie aussi :

- naissance obligatoire absente : message déployé en erreur avec `birthDate` ;
- conversion booléenne impossible : diagnostic avec chemin, règle et expression ;
- accès à une donnée facultative absente, puis correction par une garde ;
- traces bornées, valeurs capturées seulement à la demande et résultat inchangé.

Ces erreurs sont des cas du contrôle existant, pas des canaux supplémentaires.

## Demandes du TODO encore à couvrir

| Demande | État et suite pertinente |
|---|---|
| Source JSON métier et ressource FHIR entrante | Couvertes par les ports 8090/8091 et 8092 |
| R4B/R5, fonction propre à R5 | Profile Mapper R5 démontré par `Organization.description` sur 8090 ; FML R5 (Organization et `Permission`) à prioriser ; R4B reste couvert par les tests Java seulement |
| FR Core et HL7 Europe Laboratory | Patient FR Core 2.2.0 validé sur 8091 ; aucun canal EU Laboratory pour le moment |
| Autre profil R4 externe | Package DevDays proposé à évaluer ; aucun canal ni package supplémentaire choisi |
| Map publiée dans un package IG | Non couverte : les maps actuelles sont locales/inline. Choisir un package et une transformation ayant un attendu vérifiable |
| Dépendances transitives et ordre des packages | Dépendances directes FR Core chargées pour le cas 8091 ; résolution transitive générale et conflits de versions restent ouverts |
| Dérivation/surcharge et cascade d'imports | Un import est couvert ; dérivation et cascade attendent les fonctions du lot E |
| IG source HL7 v2 fournie par l'utilisateur | À choisir avec l'utilisateur ; le modèle logique actuel est une fixture locale, pas une IG officielle |
| Autres modèles logiques | Le modèle HL7 v2 typé ne dérive pas d'une ressource ; un modèle métier arbitraire reste à démontrer |
| Terminologie externe et indisponibilité | Traductions locales couvertes ; serveur externe maîtrisé et cas d'indisponibilité à traiter dans un lot dédié |
| Samples FML enregistrés et groupes natifs OIE | Groupes/tags natifs installés ; jeux d'essai FML enregistrés dans l'étape encore à implémenter |

## Rejouer

Depuis la racine, démo à jour et démarrée :

```sh
python3 -m unittest discover -s tools/tests
python3 tools/run_tests.py --offline demo/oie-init/channels
python3 demo/examples/check.py
```

Le premier contrôle impose une entrée de manifeste par export, un message
préchargé par canal et les attendus des exemples. Le second contrôle les
structures des onze samples Profile Mapper ; le dernier exécute les canaux,
ces onze samples, les trois aperçus FML, les trois contre-exemples et le
contrôle des groupes/tags. Voir le [guide de rejeu](Rejeu-tests.md)
pour cibler un export.
