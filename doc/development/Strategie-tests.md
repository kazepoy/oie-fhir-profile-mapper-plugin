# Stratégie de tests

Le projet sépare les tests hors ligne (rapides, exécutés à chaque build) des tests sur la démo Docker (flux OIE réels et interface Web Admin).

## Les trois niveaux

| Niveau | Outils | Emplacement | Commande | Prérequis |
|---|---|---|---|---|
| **Unitaire Java** | JUnit 4 | `src/test/java/fr/kazepoy/fhir/` | `mvn test` | Aucun (hors ligne) |
| **Unitaire Frontend** | Node `node:test` | `webadmin/test/unit/` | `npm --prefix webadmin test` *(inclus dans `mvn package`)* | Node ≥ 22 |
| **Intégration canaux & API** | Node `node:test` + `playwright` (`request`) | `webadmin/test/e2e/demo-*.test.js` | `npm --prefix webadmin run test:e2e` | Démo Docker démarrée |
| **UI Web Admin (E2E)** | Node `node:test` + `playwright` (Chromium / WebKit) | `webadmin/test/e2e/*.test.js` | `npm --prefix webadmin run test:e2e` | Démo Docker + navigateurs Playwright |
| **Outillage & Doc** | Node `node:test` / scripts `.mjs` | `tools/tests/`, `tools/check_doc_links.mjs`, `tools/run_tests.mjs` | `node --test tools/tests/*.test.mjs` *(inclus dans `mvn package`)* | Node ≥ 22 |

## Rôle de chaque couche

### 1. Tests unitaires (`mvn clean package`)
- **Java** : couvrent le moteur Profile Mapper, le moteur FML, la génération Rhino, la sérialisation XML, la trace d'exécution, RBAC et la configuration serveur sans démarrer OIE.
- **Frontend** : testent en isolation le modèle de mapping, la complétion, l'import/export CSV/HTML, l'éditeur FML et les fonctions utilitaires.

### 2. Tests sur la démo active (`webadmin/test/e2e/`)
Un unique socle **Node (`node:test`) + Playwright** couvre tout ce qui nécessite un serveur OIE actif :
- **Canaux et API (`demo-*.test.js`)** : envoie des messages HTTP sur les ports de démo (`10801`–`10823`), lit les messages traités, connecteurs, métadonnées et traces via l'API OIE (`/api/...`), vérifie les aperçus `/extensions/fhir-profile-mapper/test` et `/extensions/fhir-fml/test`, les cas d'erreur et les *samples* enregistrés.
- **Interface Web Admin** : pilote le navigateur (Chromium par défaut, ou WebKit avec `E2E_BROWSER=webkit`) pour valider les écrans, l'aperçu multi-étapes, les langues EN/FR, les thèmes et RBAC.

Commandes ciblées utiles depuis la racine :

```sh
# Toute la suite sur la démo active (API + navigateur)
npm --prefix webadmin run test:e2e

# Uniquement les contrôles canaux / API (sans lancer de navigateur)
npm --prefix webadmin run test:e2e:api
```

### 3. Garde-fous statiques et CI de release
- `tools/check_doc_links.mjs` : vérifie les liens locaux Markdown et le rattachement aux index de `doc/`.
- `tools/tests/` et `tools/run_tests.mjs --offline` : contrôlent la cohérence du manifeste [channels.json](../../examples/channels.json), des exports et des *samples* Profile Mapper hors ligne.

## Où placer un nouveau test ?

- **Règle de mapping, moteur FML, sérialisation, utilitaire JS** → test unitaire Java ou `webadmin/test/unit/`.
- **Comportement d'un canal déployé, connecteur, trace OIE, appel REST** → test `node:test` + `playwright.request` dans `webadmin/test/e2e/demo-*.test.js`.
- **Parcours visuel, éditeur Monaco, thème, traduction, contrôle RBAC dans l'UI** → test navigateur Playwright dans `webadmin/test/e2e/`.
