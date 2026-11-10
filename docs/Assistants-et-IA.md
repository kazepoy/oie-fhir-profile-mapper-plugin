# Assistants de code et édition par un agent IA

## Dans l'éditeur

`Ctrl+Espace` ou `Alt+Espace` (`⌥+Espace` sur macOS) ouvre les suggestions, même
sans préfixe. macOS réserve par défaut `Ctrl+Espace` au changement de source de
saisie : la page ne reçoit alors pas ce raccourci. Le catalogue présente
signatures, paramètres, types de retour, descriptions et exemples insérables.
La recherche explicite porte aussi sur les descriptions. Les flèches sélectionnent,
Entrée/Tab insèrent, Échap ferme. Le texte hors de la sélection reste conservé.
Les suggestions ne s'ouvrent pas dans une chaîne ou un commentaire.

Les variables des itérations englobantes et leurs indices sont proposés.
L'expression `each` ne voit pas sa propre variable, tandis que la condition et
les valeurs du corps la voient. Un repli de traduction dispose de `code` et
`system`. Les chemins sont tirés de la structure du message exemple, avec des
alias vers les variables d'itération lorsque leur expression est un chemin.
Ils ne prouvent pas qu'une donnée sera présente : garder les accès facultatifs.
La profondeur est limitée à cinq niveaux et le nombre de chemins à 200.

JSON et XML sont lus dans le navigateur. Un exemple HL7 v2 est sérialisé par
le moteur OIE via `POST /source`, sans réimplémenter son parseur. Un exemple
incomplet peut ne produire aucune suggestion de chemin. Les arbres source et
leur glisser-déposer restent disponibles. Les fonctions arbitraires des code
templates OIE ne sont pas introspectées automatiquement.

Les pastilles **?** ouvrent les définitions officielles HL7 FHIR dans la version
sélectionnée (R4, R4B ou R5). Pour un sous-élément d'un type ou une slice d'IG,
le lien vise la propriété principale de la ressource de base ; il ne prétend
pas documenter les contraintes propres à l'IG.

Le catalogue unique est
[`mapper-functions.json`](../src/main/resources/org/oie/fhir/mapper/mapper-functions.json),
publié par `GET /api/extensions/fhir-profile-mapper/functions`. Un test Java
vérifie que chaque fonction publiée existe dans le runtime réel. Le navigateur
utilise ce catalogue ; les implémentations des fonctions restent dans le runtime
et dans OIE.

## Modifier une étape en JSON

Dans l'onglet **Properties**, **Mapping JSON — import / export**, puis **Read current step**, fournit l'objet
utilisé par l'éditeur. Après modification, **Validate and apply** vérifie le JSON
et compile son script sur le serveur avant d'appliquer les changements à cette
étape. Le numéro de séquence et l'état activé sont conservés. Le channel doit
ensuite être enregistré ; le test d'un message et le déploiement restent des
contrôles distincts de cette compilation.

Les règles peuvent porter un `id` stable, unique dans l'étape. Les anciens
exports sans id restent lisibles. L'éditeur en attribue lors de l'édition et
préserve ceux des règles déjà connues (clé et forme de règle). Un agent conserve
ces ids quand il modifie une expression, déplace ou renomme une règle.
`ruleId` est restitué dans les diagnostics et les événements de trace. Un id de
règle n'est ni le `Patient.id` produit ni une version du format de mapping.
Les propriétés de règle inconnues sont refusées à l'import pour éviter une perte
silencieuse lors de la réouverture.

## Modifier un export de channel sans toucher aux autres étapes

Prérequis : Python et les dépendances de `tools/requirements.txt`. Depuis la
racine du dépôt, créer `target/`, puis :

```sh
python3 tools/channel_mapping.py list demo/oie-init/channels/sql-xml-vers-patient-fhir.xml
python3 tools/channel_mapping.py extract demo/oie-init/channels/sql-xml-vers-patient-fhir.xml --connector 0 --sequence 1 --assign-ids --output target/patient.json
python3 tools/check_mapping.py target/patient.json
python3 tools/channel_mapping.py apply demo/oie-init/channels/sql-xml-vers-patient-fhir.xml --connector 0 --sequence 1 --step target/patient.json --output target/channel-modifie.xml
python3 tools/channel_mapping.py explain target/channel-modifie.xml --connector 0 --sequence 1
```

Modifier `target/patient.json` avant `apply`. La sélection explicite désigne le
connecteur et le numéro de séquence ; `--response` cible son transformeur de
réponse. L'outil n'écrit que l'export de sortie choisi, sans contacter OIE.
Il remplace la région XML de cette étape et préserve octet pour octet le reste
du fichier, y compris scripts, types de données et propriétés des connecteurs.
L'état activé et le numéro de séquence de l'étape restent inchangés. Les exports
supportés contiennent un seul `<channel>` avec les classes XStream explicites.

Pour construire un nouveau channel, partir d'un export d'exemple, lui attribuer
un nouvel UUID, un nom et un port libre, puis adapter ses étapes. Les API OIE
existantes importent (`PUT /api/channels/{id}`), relisent (`GET` au même chemin)
et déploient (`POST /api/channels/{id}/_deploy?returnErrors=true`) le channel.
Ces opérations ne sont pas déclenchées automatiquement par l'outil local.

Pour tester une étape, `POST /api/extensions/fhir-profile-mapper/test` reçoit
`{"step": {...}, "message": "...", "dataType": "XML", "trace": {"enabled": true}}`.
Le corps est `text/plain`, la réponse JSON ; utiliser l'authentification OIE et
`X-Requested-With: OpenAPI`. Le test aperçu simule les références : rejouer le
channel déployé pour vérifier les dépendances entre étapes.

Un agent explique un résultat à partir des règles extraites, des diagnostics
et de la [trace](Trace.md), puis modifie la règle identifiée par `id`. Relire
l'export et rouvrir le channel dans l'éditeur avant une nouvelle modification.
Les tests Python couvrent le remplacement ciblé et la relecture sur les six
exports ; les tests Node couvrent l'import JSON, les ids, les portées et le clavier.
