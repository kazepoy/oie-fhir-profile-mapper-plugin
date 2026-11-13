# JSON R5, FR Core et source FHIR

Ces trois canaux complètent la [matrice](Matrice-exemples.md). Ils utilisent des
données fictives, des attendus versionnés et un contre-exemple chacun.

| Canal | Groupe OIE | Port et chemin | But |
|---|---|---|---|
| JSON métier vers Organization R5 | FHIR - Mapper metier | `8090/organization-r5/` | Source JSON et champ `Organization.description` propre à R5 |
| JSON métier vers Patient FR Core | FHIR - Mapper metier | `8091/patient-fr-core/` | Profil publié FR Core 2.2.0, slice d'identifiant PI et lieu de naissance |
| Patient FHIR vers résumé FML | FHIR - FML | `8092/patient-summary/` | Une ressource FHIR reçue directement par une map FML |

Les requêtes nominales et invalides figurent dans
[`demo.http`](../../demo/examples/demo.http). Chaque POST utilise
`Content-Type: application/json; charset=UTF-8`.

## Organization R5

L'[entrée métier](../../demo/examples/organisation-metier.json) produit
l'[Organization attendue](../../demo/examples/expected/organisation-r5.json).
La version R5 est configurée sur l'étape et les datatypes FHIR du canal. Le
champ `description` est de type `markdown`, [ajouté en R5](https://hl7.org/fhir/R5/organization.html).

Ouvrir l'étape **Organization**, puis **Test → Run all** pour rejouer le sample
enregistré avec comparaison. L'[entrée invalide](../../demo/examples/organisation-metier-invalide.json)
fournit `active: "invalide"` : la conversion doit échouer sur
`Organization.active`, avant la validation FHIR.

## Patient FR Core

L'[entrée métier](../../demo/examples/patient-metier-fr-core.json) produit le
[Patient attendu](../../demo/examples/expected/patient-fr-core.json), qui
déclare le [profil publié FR Core Patient 2.2.0](https://hl7.fr/ig/fhir/core/2.2.0/StructureDefinition-fr-core-patient.html).
Le nom officiel, l'identifiant interne et l'extension `patient-birthPlace`
suivent les contraintes du profil. L'IPP fictif conserve ses zéros initiaux ;
aucun identifiant national de santé n'est utilisé.

Le sample nominal est enregistré dans l'étape **Patient**. Le
[contre-exemple](../../demo/examples/patient-metier-fr-core-invalide.json) ne
change que `usage_ipp`, de `usual` à `official`. Cet usage est exclu du ValueSet
FR Core de la slice PI. La validation doit signaler une erreur sur
`Patient.identifier[0].use`, aussi bien en aperçu que dans le canal déployé.

Le validateur peut aussi retourner une information sur la slice de
`meta.profile`, car l'étape publie la canonique sans suffixe de version. Ce
message informatif n'est pas une erreur de conformité ; le package chargé et
les contraintes contrôlées sont ceux de la version 2.2.0.

### Packages du contexte

L'image télécharge les archives à version fixe et vérifie leurs SHA-256. Le
contexte `fr-core-2.2.0` charge explicitement :

1. `hl7.fhir.fr.core#2.2.0` ;
2. `hl7.fhir.uv.extensions.r4#5.2.0` ;
3. `hl7.terminology.r4#7.1.0` ;
4. `ans.fr.terminologies#1.7.0`.

Le core R4 4.0.1 est fourni par FHIR Data Type. Les trois archives ajoutées
correspondent aux dépendances directes non-core du manifeste FR Core ; elles
permettent notamment de résoudre les extensions et terminologies du cas testé.
L'ordre ci-dessus est la configuration de cette démo, pas une règle générale de
priorité applicable à tous les IG.

Ce lot n'ajoute pas de résolveur transitif universel. Le manifeste ANS déclare
aussi IPS 1.1.0 et une autre version de THO ; le présent cas n'utilise pas les
profils IPS. Le contexte retient explicitement THO 7.1.0, demandé par FR Core.
La validation de ce Patient ne prouve donc pas la prise en charge de tout le
graphe d'IG et de toutes ses variantes de versions.

Sur une installation existante, reconstruire l'image et relancer
l'initialisation avec `OIE_INIT_FORCE=true` pour mettre à jour le contexte et les
canaux de démo. Cette option remplace leurs personnalisations locales.

## Patient FHIR vers FML

La [source](../../demo/examples/patient-fhir-source.json) est déjà un Patient
FHIR R4. Le datatype FHIR valide l'entrée puis la présente en JSON au
transformeur. La map [`PatientSummary.fml`](../../demo/fml/PatientSummary.fml)
utilise `sourceModel: fhir` : elle lit directement `Patient`, sans enveloppe
`OieMessage`.

Le [résumé attendu](../../demo/examples/expected/patient-fhir-summary.json)
conserve explicitement l'id, les identifiants, le nom, le sexe, la naissance et
`active: false`. `telecom` et les autres propriétés sont omis par cette
projection ; ce canal ne constitue pas une anonymisation.

Dans l'étape **Résumé Patient**, l'onglet **Test** est préchargé avec la
source JSON. Le [contre-exemple](../../demo/examples/patient-fhir-source-invalide.json)
fournit un sexe `inconnu`, hors du ValueSet FHIR : l'aperçu signale l'erreur de
validation et le datatype entrant du canal déployé refuse le message.

## Contrôles automatisés

`python3 demo/examples/check.py` compare les réponses HTTP aux attendus, rejoue
les aperçus et vérifie que chaque contre-exemple produit un nouveau message
OIE en erreur avec le diagnostic attendu. Les samples positifs Profile Mapper
restent rejouables avec `tools/run_tests.py` ; les trois aperçus FML sont
contrôlés depuis le manifeste de démonstration.
