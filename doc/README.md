# Documentation du plugin FHIR

Cette page est l'entrée de la documentation active. Chaque section a une
responsabilité distincte afin d'éviter de maintenir la même information dans
plusieurs documents.

## Choisir le transformeur

- Préférer **FHIR FML Transform** lorsqu'une map FML et des Implementation
  Guides peuvent porter une transformation portable, indépendante d'OIE.
- Utiliser **FHIR Profile Mapper** pour construire graphiquement une
  transformation adaptée aux messages et au runtime d'OIE. Son format de mapping
  est propre au plugin.

## Sections

| Besoin | Section | Autorité |
|---|---|---|
| Utiliser les écrans et leurs fonctions | [Manuel utilisateur](user-manual/README.md) | Procédures et captures |
| Construire des canaux avec un agent utilisateur | [Manuel agent](agent-manual/README.md) | Instructions d'utilisation dans OIE |
| Comprendre les formats, API et comportements | [Référence](reference/README.md) | Contrats techniques actifs |
| Comprendre les composants et contraintes OIE/HAPI | [Architecture](architecture/README.md) | Décisions et limites de plateforme |
| Compiler, tester et contribuer | [Développement](development/README.md) | Processus contributeur |
| Lancer la démo et rejouer ses exemples | [Démonstration](demo/README.md) | Environnement, exemples et rejeu |
| Relire les constats et plans clos | [Historique](history/README.md) | Documents non normatifs |

La [feuille de route active](plan-suite.md) classe les travaux futurs. Les
changements livrés sont consignés dans le [CHANGELOG](../CHANGELOG.md) et le
[journal des lots](../TODO.md).

## Contrôle

Depuis la racine du dépôt :

```sh
python3 tools/check_doc_links.py
```

Le contrôle refuse les liens locaux cassés et les documents Markdown de `doc/`
qui ne sont pas accessibles depuis le présent index.
