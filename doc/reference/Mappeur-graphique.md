# FHIR Profile Mapper : l'éditeur graphique

Ce document décrit l'étage de saisie et la construction du contrat de mapping. Le format de ce contrat, sa compilation Java et les règles exécutées sont décrits dans [Format et exécution des mappings](Specification-mapping.md).

## 1. Responsabilité de l'éditeur

L'éditeur fournit une étape **FHIR Profile Mapper** dans l'administration web d'OIE. Il aide à sélectionner un profil, parcourir ses éléments et décrire comment construire une ressource ou un Bundle.

L'étape est présentée en trois onglets : **Properties** (action, profil, terminologie, Bundles, options et édition en JSON), **Mapper** (arbre des éléments et leurs règles) et **Test** (message exemple, trace et script généré). Une étape qui a déjà des règles s'ouvre sur **Mapper**, une nouvelle étape sur **Properties**. Un compteur rouge sur **Mapper** signale les éléments requis non mappés, un `!` sur **Test** l'échec du dernier test. **Go to rule** ramène sur **Mapper** et sélectionne le champ concerné. Les erreurs et avertissements de l'étape restent visibles au-dessus des onglets.

Dans une étape **Create a Bundle**, `Bundle.entry` n'est pas signalé comme requis non mappé : les entrées viennent des étapes de ressource qui sélectionnent ce Bundle dans **Add to Bundles**.

Il **ne transforme pas les messages métier dans le navigateur**. Il construit une configuration et un tableau de mappings JSON. Le serveur compile ces mappings en JavaScript avec `FhirProfileMapperStep.getScript()` ; OIE exécute ce JavaScript lors du traitement du message.

```text
Saisie graphique → état de l'éditeur → mappings JSON → compilation serveur → JavaScript
```

L'onglet Generated Script et les contrôles d'étape utilisent le même compilateur serveur. Ils ne sont pas un second générateur propre à l'interface.

Source principale : [webadmin/src/profile-mapper/editor.js](../../webadmin/src/profile-mapper/editor.js). L'étape est enregistrée par `registerProfileMapper()` ; son composant est `ProfileMapperEditor`. Le fichier `webadmin/web/plugin.js` en est le bundle généré.

Le tableau est compact : les champs et l'aide FHIR ont une hauteur bornée, sans
modifier la densité des autres écrans de Web Admin. Les branches ouvertes sont
regroupées sur un fond légèrement teinté avec une bordure gauche et des limites
de bloc. Des guides verticaux, des raccords et une indentation de 20 px rendent
les niveaux visibles ; les parents ouverts sont en gras. Les lignes de
condition, répétition et traduction restent dans le bloc de leur élément.

## 2. Choisir l'action

Le même type de step propose deux actions.

| Action | Ce que l'on renseigne |
|---|---|
| **Create a Bundle** | Nom interne, profil cible de type Bundle, type du Bundle, en-tête et destination du résultat. |
| **Build a resource** | Profil de la ressource, mappings, ajout facultatif à un ou plusieurs Bundles créés auparavant ; sinon destination de cette ressource seule. |

Exemple pour un résultat de laboratoire :

```text
1. Créer « labo-transaction » : transaction → message sortant
2. Créer « labo-document » : document → variable bundleDocument
3. Construire Composition et organisation auteur : ajouter au document
4. Construire Patient : ajouter à transaction ET document
5. Construire Observations et rapports : ajouter à transaction ET document
```

Il n'y a pas d'étape utilisateur « Produire un résultat ». Les destinations des résultats sont connues dès leur déclaration ; la finalisation intervient automatiquement après la dernière étape FHIR explicite.

Le nom interne d'un Bundle sert au rattachement des étapes. Ce n'est ni l'identifiant FHIR du Bundle ni l'URL de son profil.

## 3. Charger un profil et construire l'arbre

**FHIR context** choisit un contexte défini dans *Settings › FHIR Mapper* : la version
FHIR, les packages et le serveur de terminologie viennent alors du contexte, et les
champs correspondants de l'étape disparaissent. Sans contexte, renseigner **FHIR
Version**, **Profile Packages** et **Target Profile**, puis Load. Les packages sont des chemins du serveur OIE, séparés par `;`. List profiles permet de choisir une définition connue de ces packages.

Le serveur fournit le snapshot de la StructureDefinition. `indexSd()` l'indexe par identifiant et parent ; `makeTree()` construit les nœuds affichés. L'arbre présente :

- cardinalité minimale et maximale ;
- types permis, choix `value[x]` et branches typées ;
- Must Support, valeurs fixes et patterns ;
- slices nommées et discriminants pris en charge ;
- instances répétées ajoutées par l'utilisateur.

L'ouverture d'un type complexe ou d'une extension peut charger une autre StructureDefinition. Les définitions sont mises en cache par version, packages et URL. Les éléments `extension`, `modifierExtension` et certains identifiants techniques sont masqués tant que **extensions & ids** n'est pas coché.

Changer de profil conserve les mappings dont les éléments existent encore. Les éléments absents sont signalés ; si un type nécessaire n'a pas pu être chargé, l'édition est bloquée afin de ne pas supprimer silencieusement des mappings.

Pour **Create a Bundle**, le profil doit décrire un Bundle. Un type fixé par ce profil règle Bundle Type et rend ce choix non modifiable. Les entrées ne sont pas mappées dans l'en-tête : elles viennent des étapes de ressources.

### Contextes FHIR du serveur

Le panneau *Settings › FHIR Mapper* administre des contextes nommés : version FHIR,
packages (un chemin serveur par ligne), serveur de terminologie avec autorisation,
cache et délai, et politique de validation (`always` ou `off`). Ils sont enregistrés
dans les propriétés de l'extension et lus par `GET /settings` (permission **Edit FHIR
mappings**) ; les modifier (`POST /settings`) demande la permission **Manage FHIR
mapper settings**. Une étape FHIR Profile Mapper ou FHIR FML Transform qui nomme un
contexte en partage les réglages ; **Validate FHIR output** propose alors
« as the context says ». Un canal déployé garde le contexte lu à son déploiement.

## 4. Écrire une expression de valeur

Chaque élément peut recevoir une expression JavaScript, une constante comprise :

```javascript
msg['PID']['PID.7']['PID.7.1'].toString()
```

```javascript
'final'
```

```javascript
$('patientId')
```

Un champ du panneau **Message Trees** peut être glissé, cliqué ou collé dans une expression. En contexte d'itération, l'éditeur adapte un chemin source à la variable la plus proche : par exemple, sous `msg['PID']['PID.5']` parcouru comme `n`, le chemin devient `n['PID.5.2'].toString()`.

L'éditeur conserve les expressions comme texte. La vérification syntaxique et leur exécution appartiennent au serveur. Une expression vide n'est pas compilée comme une valeur ; `({})` peut créer un objet qui recevra ensuite les valeurs fixes de son profil.

## 5. Aide à la saisie

Dans les champs d'expression, saisir `fhir` ou `hl7` ouvre les propositions des huit fonctions du runtime. Chaque proposition indique la signature, une description et un exemple.

- ↑/↓ : choisir ; Entrée ou Tab : insérer ; Échap : fermer.
- Un clic insère aussi l'exemple.
- Seul le nom à l'emplacement du curseur est remplacé ; le reste de l'expression est conservé.
- Si un appel possède déjà des parenthèses, ses arguments sont conservés.
- Les chaînes, commentaires et membres d'objet ne déclenchent pas les suggestions.

L'aide existe dans les valeurs, itérations, conditions, noms de référence, expressions de requête et repli de traduction. Elle ne constitue pas une analyse complète de JavaScript : la syntaxe et les paramètres effectifs sont contrôlés lors de la compilation et du test serveur.

La portée et les limites de `fhirRef`, `fhirRefs`, `fhirFind`, `fhirFilter`, `fhirUuid` et des trois fonctions `hl7…` figurent dans la [spécification](Specification-mapping.md#fonctions-des-expressions).

### Éditeur de code, recherche, annulation et plein écran

Un clic dans un champ d'expression l'ouvre dans l'éditeur de code de Web Admin
(Monaco), sur une ligne : coloration, complétion typée de `msg`, `tmp` et des maps,
fonctions du mappeur (publiées aussi dans le panneau **Reference**, catégorie
*FHIR Mapper*), variables et indices des itérations englobantes, chemins du message
exemple, modèles de garde des accès facultatifs, et `fhirRef('…')` pour chaque nom
de référence déclaré par une autre étape du transformeur. Un seul champ porte un
éditeur à la fois ; Entrée, Tab ou un clic ailleurs le referme. Sans Monaco, le
champ texte et ses suggestions restent disponibles.

Les expressions qui ne sont pas en cours d'édition sont affichées avec les couleurs de
l'éditeur. `Alt+Espace` (`⌥Espace` sur macOS) ou `Ctrl+Espace` ouvre les propositions,
dans cet ordre : variables d'itération, codes du jeu de valeurs, références des autres
étapes, chemins de l'exemple réécrits vers la variable d'itération, fonctions, autres
chemins de l'exemple (seuls ceux qui portent une valeur, 80 au plus), modèles de garde.

Dans l'onglet **Test**, le message exemple est édité avec la coloration de son type
(HL7 v2, XML, JSON) ; le résultat, le script généré et l'édition en JSON sont colorés
de même. Chaque onglet a un bouton **?** qui explique son rôle, ses boutons et ses
raccourcis ; le panneau *Settings › FHIR Mapper* et l'étape FML ont le leur.

La barre de l'onglet **Mapper** offre la recherche d'éléments (les branches qui
contiennent le texte se déplient), **Expand mapped**, **Collapse all**, et
**Undo** / **Redo** des règles (les frappes rapprochées comptent pour une
modification). Les éléments signalés par le dernier test ou la dernière compilation
sont marqués en rouge, avec le message en info-bulle. **Full screen** étend l'étape
à toute la page ; Échap y met fin. L'étape FHIR FML Transform a le même bouton.

Le bouton **Rules** d'un élément déjà mappé ouvre la note et la case d'activation
de chacune de ses règles (valeur, condition, itération ou valeur fixe). Les règles
de la racine sont accessibles de la même façon. Une règle désactivée reste dans
le canal avec son expression et sa note, mais le serveur ne l'exécute pas ; le
bouton indique **Rules (disabled)**. Désactiver une condition supprime son contrôle :
les règles situées dessous peuvent alors s'exécuter sans cette condition.
**Undo** / **Redo** restaure aussi les notes et l'activation.

L'**Element inspector** suit l'élément sélectionné : cliquez sur son nom,
activez ce bouton avec Entrée au clavier, ou placez le focus dans un de ses
champs. Il affiche les types, cardinalités, Must Support, slice, description,
définition, binding, valeur fixe ou pattern et exemples du profil disponibles.
Le lien **Official FHIR definition** mène à la définition de la version FHIR choisie.
L'expression et les règles déjà présentes (condition, itération, traduction,
notes et activation) se modifient aussi depuis l'inspecteur, avec la même
complétion, la même sauvegarde et le même historique que l'arbre. Les boutons
de l'arbre servent toujours à ajouter une condition, une itération ou une traduction.
Les diagnostics de l'élément sélectionné y sont regroupés ; **Go to rule**
sélectionne l'élément et révèle son champ dans l'arbre en effaçant la recherche.
En plein écran, l'inspecteur se place à droite de l'arbre ; dans une zone de
moins de 1 100 pixels de large, il passe en dessous.

Le menu d'une ligne s'ouvre par clic droit, **Maj+F10** sur son nom ou son bouton
**⋯**. Il donne accès à l'inspecteur, à l'ajout d'une occurrence, aux conditions,
itérations et traductions, à l'activation des règles de la branche et à leur
copie en JSON dans le presse-papiers. **Duplicate branch** copie une branche
mappée vers une nouvelle occurrence du même élément répétable, dans la limite
du profil. Les expressions, traductions, notes et règles désactivées sont
conservées ; les chemins de destination et les identifiants sont nouveaux.
Une branche déjà itérée n'est pas duplicable. Annuler/Rétablir conserve les
identifiants de la copie ; les expressions et références ne sont pas réécrites.

Dans l'inspecteur d'un élément qui possède des extensions, **Profile extension**
propose les slices déclarées, avec leur URL, et révèle la slice choisie. Mapper
sa valeur ajoute automatiquement l'URL fixe du profil. **List context extensions**
propose les extensions du catalogue du contexte ; le choix ajoute leur URL à
une occurrence libre de `extension`. Choisir ensuite le type de valeur et son
expression dans l'arbre. Ce choix hors profil est indisponible si le profil
ferme le slicing des extensions. Les contextes d'application de l'extension
restent contrôlés par la validation FHIR du résultat.

Les propositions du champ **ConceptMap** tiennent compte des systèmes source et
cible renseignés et, sans cible explicite, du binding de l'élément. Les systèmes
des codes du binding sont utilisés lorsqu'ils ont pu être développés.
**All ConceptMaps** affiche toute la liste, notamment pour les maps sans
métadonnées suffisantes. Le choix actuel n'est jamais remplacé automatiquement ;
la table HL7 n'est pas déduite du texte de l'expression.

La recherche dans les types chargés est bornée pour ne pas parcourir indéfiniment
les extensions récursives. La branche sélectionnée est examinée en priorité ;
un message indique lorsque la recherche est partielle.

Un élément lié à un jeu de valeurs l'indique dans son champ vide (« required binding:
administrative-gender »). À la première édition de ce champ, l'éditeur lit les codes
du jeu de valeurs sur le serveur et les propose dans la complétion, entre apostrophes
(`'female'`), avec leur libellé. Un jeu de valeurs que le serveur ne sait pas
développer sans serveur de terminologie ne propose rien.

**Sample fields**, au-dessus de l'arbre, liste les champs du message exemple de
l'onglet Test avec leur valeur (HL7 v2 lu par le serveur), filtrables par chemin ou
par valeur. Un clic insère le chemin dans le champ en cours d'édition, réécrit vers
la variable d'itération s'il y a lieu ; sans champ en édition, le chemin est copié.
Une ligne se glisse aussi sur un champ. `Alt+↓` et `Alt+↑` passent au champ suivant
ou précédent de l'arbre, `Alt+→` et `Alt+←` ouvrent ou referment l'élément. Une
erreur du dernier test ou de la compilation est aussi soulignée dans le champ édité.

## 6. Répétitions, conditions et traductions

| Contrôle | Effet dans le contrat de mapping |
|---|---|
| **+ / −** | Ajoute ou retire une instance explicite d'un élément répétable. |
| **↻** | Produit une règle `each`, avec expression de liste et variable. |
| **?** | Produit une règle `condition`, sur l'élément et ses descendants. |
| **⇄** | Ajoute la configuration `translate` à une règle de valeur. |

Une itération sur la ressource produit une ressource par élément de la liste ; elle nécessite un Bundle cible. Une itération sur un sous-élément produit ses répétitions. Les variables et leurs indices sont indiqués sous la ligne ; les portées peuvent s'imbriquer.

Une condition s'applique par item si l'élément itère. Une condition sur la racine peut empêcher la construction de cette ressource.

La traduction choisit une ConceptMap, un système source et éventuellement un système cible. Sans correspondance, les choix sont : absence, code source, valeur fixe, expression de repli ou erreur. L'option de conservation du codage source concerne les CodeableConcepts.

**Terminology Server** vide ou `n/a` utilise les ConceptMaps des packages locaux. Une URL utilise le serveur de terminologie tel qu'OIE peut l'atteindre. Les options proposent l'expression Authorization, le délai du cache et le timeout. Le bouton Test de traduction utilise un code fourni et affiche le résultat ou l'erreur serveur.

## 7. Ajouter à un Bundle et définir les sorties

La zone **Add to Bundles** est un encadré à fond distinct. Elle propose une case à cocher pour chaque Bundle explicitement créé dans les étapes précédentes du même transformeur. Plusieurs cases peuvent être cochées. Sans cible, la ressource est un résultat autonome.

L’éditeur conserve une sélection devenue inconnue, afin de pouvoir la retirer ou corriger la création manquante ; le déploiement refuse cette configuration. Les cibles ne sont pas retrouvées par leurs profils.

Le **Reference Name** est commun aux cibles. La ressource est construite une fois, avec ses UUID, conversions et traductions, puis ajoutée aux conteneurs sélectionnés avec un même fullUrl. Chaque conteneur garde sa propre entrée et sa propre requête. Les références doivent désigner une même identité dans les cibles concernées ; un conflit est signalé.

Chaque cible sélectionnée possède sa carte : nom, type et étape de création. Pour transaction/batch, les champs Method et Request URL sont alignés sur une ligne, et If-None-Exist apparaît pour POST. Pour document, message et collection, la carte indique qu’aucune requête ne s’applique. Le type et le profil ne sont pas redéfinis dans l’étape Patient.

Le **Result destination** se règle sur Create a Bundle ou sur une ressource seule : message sortant ou variable de Channel Map. Un transformeur ne dispose que d'un message sortant ; choisir des variables distinctes pour les autres résultats. Une destination OIE peut ensuite exploiter ces variables.

Les profils ne sont pas des destinations. Ils décrivent les contraintes FHIR des objets construits ; le transport HTTP, fichier ou autre reste une responsabilité du channel.

## 8. De l'état graphique au JSON

Le composant conserve notamment les valeurs, itérations, conditions et traductions dans des maps indexées par clé d'élément. Il conserve aussi les instances répétées et les branches développées.

`compile()` parcourt l'arbre pour produire les règles déclaratives :

1. itérations et conditions avec leur portée ;
2. règles de valeur avec type, expression et chemin ;
3. traductions attachées aux règles de valeur ;
4. valeurs fixes et patterns, avec leur précondition `when`.

Le résultat est sérialisé dans `element.mappings`. La compilation couvre aussi les éléments temporairement masqués, afin qu'un filtre d'affichage ne supprime pas un mapping enregistré. L’action, le nom du Bundle créé, le tableau `bundleTargets` et les paramètres de sortie sont des propriétés de l’étape, distinctes du tableau de mappings. Le tableau des cibles est sérialisé en JSON ; chaque cible possède ses éventuels paramètres de requête.

Le détail du format JSON, des chemins de slices/répétitions et de la génération des portées JavaScript figure dans [la spécification](Specification-mapping.md#3-règles-chemins-et-portées).

## 9. Contrôles et échanges serveur

Les contrôles locaux signalent la configuration incohérente et les éléments obligatoires/Must Support non couverts. Ils ne prouvent pas à eux seuls la conformité FHIR du résultat. Le serveur reste l'autorité pour la compilation et la validation.

| Route sous `/api/extensions/fhir-profile-mapper` | Usage |
|---|---|
| `profiles` | Lister les profils disponibles. |
| `structure` | Charger une StructureDefinition et son snapshot. |
| `conceptMaps` | Lister les ConceptMaps disponibles. |
| `catalog` | Lister les ressources de conformité des packages (`kind` : un type de ressource, `profile`, `extension`, `logical`, ou vide). |
| `catalog/elements` | Un profil et tous les types qu'il utilise, réduits aux champs de l'arbre : `{root, types, errors}`. L'éditeur ouvre l'arbre avec cette seule requête. |
| `catalog/expand` | Les codes d'un ValueSet (`valueSet`, `filter`), 200 au plus. |
| `settings` | Lire (GET) ou remplacer (POST) les contextes FHIR du serveur. |
| `translate` | Tester une traduction. |
| `script` | Compiler la configuration d'une étape et relever ses erreurs de syntaxe. |
| `test` | Exécuter une étape sur un message exemple et valider la ressource obtenue. |

Le plugin déclare trois permissions, appliquées par un plugin d'autorisation comme [RBAC](https://github.com/diridium-com/role-based-access-control) et accordées à tous sans lui :

| Permission | Routes |
|---|---|
| **Edit FHIR mappings** | `profiles`, `structure`, `conceptMaps`, `translate`, `script`, `functions`, `source`, `catalog`, `catalog/elements`, `catalog/expand`, `settings` (lecture) |
| **Manage FHIR mapper settings** | `settings` (écriture) |
| **Test FHIR mapper steps** | `test` |

Le test exécute le code de l'étape sur le serveur, avec l'accès à Java, à la configuration map et aux code templates, comme un channel déployé : n'accorder **Test FHIR mapper steps** qu'aux utilisateurs autorisés à déployer. Sans cette permission, l'onglet **Test** l'indique. L'exécution est limitée à dix secondes.

L’onglet **Test** propose **Preview scope** : **This step only** conserve
l’aperçu isolé et ses références de remplacement ; **Profile Mapper steps of
this transformer** exécute les Profile Mapper activés du même transformeur,
dans l’ordre, avec les vraies références et la finalisation des Bundles. Les
ressources intermédiaires et les variables publiées sont consultables séparément.
Les autres types d’étapes sont exclus. Le message initial vient du template
entrant du transformeur ; en destination, fournir un message préparé par la source.
Le [manuel multi-étapes](../user-manual/fr/profile-mapper/apercu-multi-etapes.md) précise
le parcours et ses limites.

**Generated script** montre la compilation réelle. **Validate Step** vérifie la configuration de l'étape ; un test de message vérifie aussi le comportement des expressions et, si elle est activée, la validation FHIR de leur résultat.

Les erreurs du test et du script généré affichent l'étape, la phase, la clé,
le chemin cible et l'expression lorsqu'ils sont connus. **Go to rule** ouvre
les parents de l'élément, retire les filtres qui pourraient le masquer et
positionne le focus sur la valeur, condition, itération ou traduction concernée.
L'indice de règle dans la réponse API correspond au tableau `mappings` testé ;
il ne constitue pas un identifiant stable après modification du mapping.

Le message de test peut être **enregistré dans l'étape** (**Save as sample**) : il est
alors sauvegardé avec le canal, dans la propriété `samples`, au lieu du navigateur.
La liste des exemples permet d'en changer ; un exemple se modifie en place et se
supprime par **Delete sample**. Après un test, **Use this result as expected** fixe le
résultat de référence de l'exemple : les tests suivants disent s'il correspond, et
montrent sinon les deux résultats côte à côte. Les identités `urn:uuid` sont renommées en conservant leurs relations de référence ;
`meta.lastUpdated` et l’ordre des propriétés JSON sont ignorés dans la comparaison. **Run all** exécute tous les
exemples, chacun dans son périmètre enregistré, et donne pour chacun *passed* ou *failed* (erreur, résultat FHIR invalide
ou écart avec l'attendu).

Cocher **Trace** avant **Run** pour voir les phases d'exécution dans
**Execution trace**. Les événements permettent aussi de revenir à leur règle.
**Include scalar values** autorise une capture limitée des valeurs ; elle est
désactivée par défaut. **Export trace JSON** télécharge la trace de ce test.
Les options, les limites et la portée de l'aperçu sont précisées dans
[Trace.md](Trace.md).

Les boutons d’import/export de **Properties** acceptent des tableaux CSV ou
Markdown (`key,expression,note`) et exportent la documentation Markdown/HTML,
avec notes, activation, conditions et traductions. L’import vérifie toutes les
cibles avant application ; **Undo** annule l’import en une opération. Voir
[Tableaux et documentation](../user-manual/fr/profile-mapper/tableaux-et-documentation.md).

## 10. Limites et vérification

L'administration Swing ne connaît pas cet éditeur. Le studio prend en charge les
sous-slices, les extensions de primitives, les `contained` à profil concret et
les discriminants `type`, `profile` ou `exists` que la structure JSON permet de
démontrer. Il refuse explicitement les cas non matérialisables, notamment
`profile($this)` sur une `Reference`; un `contained` générique sans profil reste
masqué. La traduction locale sans `dependsOn`/`product` ni traduction inverse
n'est pas prise en charge.

Les [tests de l'éditeur](../../webadmin/test/unit/profile-mapper.test.js) se lancent avec :

```bash
(cd webadmin && npm test)        # sans navigateur
(cd webadmin && npm run test:e2e) # parcours Playwright contre la démo lancée
```

Le [guide de la démonstration](../demo/Demo.md) décrit les canaux et leurs ports HTTP, dont les exemples SQL XML et CSV nettoyé à la source puis mappé en destination, avec résultats individuels ou collection.
