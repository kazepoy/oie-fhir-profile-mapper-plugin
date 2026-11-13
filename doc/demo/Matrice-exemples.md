# Matrice des canaux et exemples

Cette matrice classe les demandes du TODO selon les preuves disponibles. Le
lot actuel rend les neuf canaux existants faciles à essayer et contrôle leurs
résultats avant d'ajouter de nouvelles démonstrations.

Le [manifeste](../../demo/examples/channels.json) associe chaque export à un
groupe, des tags et un fichier d'entrée. Ces groupes servent au classement de la
documentation et des tests ; ils ne créent pas de groupes natifs dans OIE.

## Parcours disponibles

Tous les transformeurs source ont un message entrant préchargé. Dans chaque
canal Profile Mapper, ouvrir l'étape **Patient**, puis **Test** : elle contient
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
| Source JSON métier et ressource FHIR entrante | Fixtures/API disponibles ; pas de canal déployé représentatif. Un prochain cas peut combiner source JSON et ressource R5 |
| R4B/R5, fonction propre à R5 | Tests Java existants ; tous les canaux actuels restent R4. Ne pas annoncer une preuve d'intégration R5 |
| FR Core et HL7 Europe Laboratory | Packages téléchargés et contextes installés ; pas encore de canal démontrant leur conformité |
| Map publiée dans un package IG | Non couverte : les maps actuelles sont locales/inline. Choisir un package et une transformation ayant un attendu vérifiable |
| Dépendances transitives et ordre des packages | Question ouverte du TODO ; le téléchargement des deux IG ne prouve pas le chargement de leurs dépendances |
| Dérivation/surcharge et cascade d'imports | Un import est couvert ; dérivation et cascade attendent les fonctions du lot E |
| IG source HL7 v2 fournie par l'utilisateur | À choisir avec l'utilisateur ; le modèle logique actuel est une fixture locale, pas une IG officielle |
| Autres modèles logiques | Le modèle HL7 v2 typé ne dérive pas d'une ressource ; un modèle métier arbitraire reste à démontrer |
| Terminologie externe et indisponibilité | Traductions locales couvertes ; serveur externe maîtrisé et cas d'indisponibilité à traiter dans un lot dédié |
| Samples FML enregistrés et groupes natifs OIE | Restent à implémenter ; le manifeste ne remplace pas ces fonctions d'interface |

## Rejouer

Depuis la racine, démo à jour et démarrée :

```sh
python3 -m unittest discover -s tools/tests
python3 tools/run_tests.py --offline demo/oie-init/channels
python3 demo/examples/check.py
```

Le premier contrôle impose une entrée de manifeste par export, un message
préchargé par canal et les attendus des exemples. Le second contrôle les
structures des neuf samples Profile Mapper ; le dernier exécute les canaux,
ces neuf samples et les deux aperçus FML. Voir le [guide de rejeu](Rejeu-tests.md)
pour cibler un export.
