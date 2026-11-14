# Rejeu des exemples de mapping

`tools/run_tests.mjs` parcourt des exports d’étapes JSON (objet ou liste ordonnée)
ou des exports XML d’un canal OIE. Chaque connecteur et transformeur de réponse
est isolé. Dans un dossier, il recherche récursivement `*.step.json`,
`*.steps.json` et `*.xml`. Les autres fichiers JSON ne sont pas considérés comme
des exports. Une erreur arrête le fichier concerné ; les autres fichiers sont
encore contrôlés. Un dossier doit contenir des exports à tester, pas des fixtures
volontairement invalides comme `invalid-path.step.json`.

## Validation hors ligne

```sh
node tools/run_tests.mjs --offline demo/oie-init/data/channels \
  doc/demo/examples/mapping/patient-samples.step.json \
  doc/demo/examples/mapping/laboratory-samples.steps.json
```

Ce mode vérifie le schéma, y compris le JSON imbriqué dans `mappings`,
`bundleTargets` et `samples`. Il ne compile pas le JavaScript et ne valide pas
les résultats FHIR. La CI de release lance ce contrôle.

## Exécution sur serveur

La démo doit être démarrée avec le plugin à jour. Définir `OIE_PASSWORD` dans
l’environnement, puis :

```sh
node tools/run_tests.mjs --url https://localhost:8443/api --user admin \
  --insecure demo/oie-init/data/channels \
  doc/demo/examples/mapping/laboratory-samples.steps.json
```

`--insecure` accepte le certificat autosigné de la démo. Pour un serveur avec un
certificat reconnu, l’omettre. `OIE_API` et `OIE_USER` peuvent fournir les valeurs
par défaut. Aucun mot de passe n’est accepté sur la ligne de commande ni écrit
dans les exports. Le compte doit avoir **Test FHIR mapper steps** et les droits
nécessaires aux contextes/profils référencés.

Chaque sample d’une étape activée est envoyé à `/test`. `scope:"step"` (ou absent)
exécute cette étape ; `scope:"transformer"` envoie les Profile Mapper activés du
même groupe, dans leur ordre d’export. Les autres types d’étapes du canal ne sont
pas exécutés. Les chemins de packages sont ceux du serveur. Le mode RAW ne
rejoue pas le datatype CSV du connecteur : fournir le message déjà sérialisé ou
un sample XML/JSON correspondant à ce que reçoit le mapper.

Un test échoue en cas d’erreur API/exécution, d’issue FHIR `error`/`fatal` ou d’écart
avec `expected`. La comparaison ignore l’ordre des propriétés JSON et
`meta.lastUpdated`, et renomme les UUID en préservant leurs relations. Elle
compare le message sortant, pas les sorties de variables. Sans `expected`, le
contrôle prouve seulement l’absence d’erreur. Les tests ne déploient ni ne
modifient les canaux ; leurs expressions s’exécutent sur le serveur comme dans
l’onglet Test.

Code de sortie : **0** si tous les contrôles réussissent, **1** en cas d’échec,
**2** pour une invocation invalide. Un rejeu en ligne sans aucun sample échoue.
La sortie récapitule les fichiers réussis ; un fichier en échec peut avoir
exécuté des samples avant son premier échec.

La suite [demo-mapper-api.test.js](../../webadmin/test/e2e/demo-mapper-api.test.js)
rejoue également tous ces *samples* en ligne via Node/Playwright et vérifie les
sorties des canaux déployés (`npm --prefix webadmin run test:e2e`). Voir
[Demo.md](Demo.md).
