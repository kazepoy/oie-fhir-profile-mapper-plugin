# Travaux ouverts

Le [plan actif](doc/plan-suite.md) définit les décisions, le périmètre et les
critères de fin. Cette liste en est le suivi synthétique et la boîte d'entrée.
Le [journal de reprise](doc/history/reprise-refonte.md) conserve les anciens
diagnostics et comptes rendus ; les travaux livrés figurent dans le
[CHANGELOG](CHANGELOG.md).

## Prochain lot décidé — B : contrats

- [ ] Décrire et tester le contrat courant de `mappings`, les propriétés de
  l'étape et le script généré, sans annoncer une stabilité 1.0.
- [ ] Formaliser les modèles sources `OieMessage`, HL7 v2 typé et FHIR direct,
  avec fixtures valides et invalides et limites de portabilité FML/OIE.
- [ ] Arbitrer le manifeste des packages, le verrouillage des profils, les
  dépendances transitives, conflits de versions et ordre de résolution.

## À concevoir — C : interface

- [ ] Revoir les onglets, les zones source/cible/inspecteur et la place du JSON
  (éditeur natif OIE ou vue dédiée).
- [ ] Étudier les liens source → résultat pour retrouver les règles en erreur,
  la sélection d'un élément source et l'évaluation d'expressions sur le sample.
- [ ] Concevoir un mode simple/avancé ; justifier les réglages par un besoin
  réel, y compris les fonctions expérimentales (IA, trace, complétion).
- [ ] Revoir la complétion Monaco et les liens vers l'élément exact d'un IG.
- [ ] Vérifier la préférence de langue Web Admin ; à défaut, prévoir une
  préférence du plugin initialisée depuis le navigateur.

## À prioriser — D et E : exemples et FML

La [matrice](doc/demo/Matrice-exemples.md) fait autorité sur la couverture.
Les douze canaux sont groupés et tagués dans OIE ; JSON, CSV, XML, HL7 v2,
Strict Parser, source FHIR, Organization R5 et Patient FR Core sont démontrés.
Organization R5 est un cas Profile Mapper : ce n'est pas une preuve FML R5.

- [ ] Choisir les prochains cas utiles : canal R4B, FML R5 avec Organization et `Permission`,
  profil R4 externe (package DevDays à évaluer), EU Laboratory, map publiée
  dans un package IG et modèle logique métier arbitraire source/cible.
- [ ] Demander à l'utilisateur l'IG HL7 v2 source à utiliser.
- [ ] Démontrer une terminologie externe légère préchargée avec ConceptMaps,
  avec absence de correspondance, indisponibilité et diagnostics.
- [ ] Concevoir la dérivation éditable d'une map canonique et la navigation
  dans les imports imbriqués, avec diagnostics dans la bonne source.
- [ ] Ajouter les jeux d'essai FML enregistrés avec résultats attendus ; étudier
  la faisabilité d'une trace par groupe/règle.

## Revue continue — F : documentation et preuves

- [ ] Revoir traductions, captures et cohérence des procédures avec les écrans.
- [ ] Compléter l'inventaire des contournements, fixtures et prérequis OIE/HAPI,
  avec preuves, alternatives et demandes amont dans le registre de plateforme.
- [ ] Consigner explicitement le choix du moteur FHIR Data Type/HAPI et la place
  écartée ou éventuelle de Matchbox, sans changer de moteur dans ce rangement.
- [ ] Poursuivre la revue de véracité et les tests par capacité : contrats,
  moteur, interface et limites documentées.

L'organisation de `doc/`, la séparation des manuels d'agents et l'explication
du rôle des deux transformeurs sont livrées. Les dépendances directes FR Core
sont embarquées ; la résolution transitive générale reste ouverte au lot B.

## Reporté par décision

S-3, charge, optimisations associées, double validation, runtime partagé/pools,
durcissement/endurance/permissions finales, release 1.0, migration automatique
format 1 → 2, index persistant et nouveaux caches. Les autres idées non
priorisées restent classées dans le registre du plan.

## Nouvelles idées à classer

Aucune idée non classée à ce jour. Ajouter ici les nouvelles demandes avant
leur intégration au plan, sans recopier les comptes rendus de livraison.
