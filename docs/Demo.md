# Démo OIE

Environnement de démonstration du plugin de mapping :

- Open Integration Engine **4.7.0** et PostgreSQL **18.3** ;
- Web Support **1.3.0**, avec l'administration web **1.3.0** ;
- FHIR Data Type **1.5.1**, dans sa version officielle ;
- FHIR Profile Mapper **0.1.0-SNAPSHOT**, compilé depuis les sources du projet.

Web Support et FHIR Data Type sont téléchargés au build, avec vérification de
leur SHA-256. Le mapper est compilé avec Maven à partir de l'API de l'image OIE
cible, puis installé dans cette même image. Le compilateur, le runtime et
l'éditeur graphique sont repris du POC. L'initialisation importe et déploie les
six canaux de référence, avec leur IG de démonstration montée dans `/fhir-ig`.

## Lancer

Docker avec Compose **2.23.1 ou ultérieur** est nécessaire (`configs.content`).
Depuis la racine du projet :

```sh
cd demo
docker compose up -d --build
docker compose logs oie-init
```

Le premier build compile OIE depuis ses sources et peut prendre plusieurs minutes.

Administration : <https://localhost:8443/oie-webadmin/> (certificat autosigné).
Compte : `admin`, mot de passe : `demo-fhir-mapper-admin`.
Dans *Settings > Extensions*, vérifier la présence de Web Support, FHIR Data Type
et FHIR Profile Mapper. Le journal OIE doit contenir `FHIR Profile Mapper started.`.
L'image active le niveau `INFO` pour le logger `org.oie.fhir.mapper`.

Les réglages sont dans [compose.yaml](../demo/compose.yaml). Pour les personnaliser,
copier [.env.example](../demo/.env.example) en `demo/.env` avant le premier lancement.
Les ports 8443 et 8081 à 8086 doivent être libres. Les conteneurs et volumes utilisent le projet
Compose `fhir-profile-mapper-demo`.

## Rejouer les exemples

Les requêtes prêtes à exécuter sont dans
[demo.http](../demo/examples/demo.http). Le contrôle complet nécessite seulement
Python 3, depuis la racine du projet :

```sh
python3 demo/examples/check.py
```

Ce script crée des messages dans les canaux de démo. Il vérifie les réponses
HTTP et lit les messages via l'API OIE, sans modifier les canaux.

| Port | Route | Résultat vérifié |
|---|---|---|
| 8081 | `/oru/` | Bundle transaction de 12 ressources, ou 4 pour l'ORU minimal |
| 8082 | `/patient/` | Patient conforme au profil d'exemple |
| 8083 | `/labo/` | Transaction de 12 ressources et document de 14, identités partagées |
| 8084 | `/sql-patient/` | Ligne XML SQL vers Patient, accents et zéros initiaux conservés |
| 8085 | `/csv-patients/` | Dix messages Patient après nettoyage du CSV ; dernier Patient en réponse HTTP |
| 8086 | `/csv-patients-collection/` | Un Bundle collection contenant les dix Patients |

Le document du canal labo est conservé dans `channelMap["bundleDocument"]`
et dans le contenu *Encoded* de sa deuxième destination. Le script vérifie
ses références et l'identité des douze ressources communes à la transaction.
Il vérifie aussi la traduction locale GLU vers LOINC et le refus de l'ORU sans
date de naissance : réponse HTTP vide, message OIE en `ERROR` mentionnant
`birthDate`. Ce dernier message d'erreur est donc attendu après le contrôle.

Le script utilise les valeurs de démonstration par défaut. En cas de réglages
personnalisés, lui transmettre `OIE_PASSWORD`, `OIE_HTTPS_PORT` et les variables
de ports de `.env.example` dans son environnement ; il ne lit pas `.env`.
`DEMO_HOST` et `OIE_API` permettent de choisir l'hôte et l'URL de l'API.
Il accepte le certificat autosigné et ignore les proxys pour cette démo locale.

Pour essayer l'éditeur : ouvrir un canal, sélectionner son transformeur,
puis une étape FHIR Profile Mapper. Les profils et traductions passent par
les API de notre plugin. Le fonctionnement de l'éditeur est décrit dans
[Mappeur-graphique.md](Mappeur-graphique.md).

## Ajouter ou réimporter des exemples

Déposer les exports XML de canaux dans
[demo/oie-init/channels/](../demo/oie-init/channels/), puis relancer
l'initialisation depuis `demo/` :

```sh
docker compose run --rm oie-init
```

L'init importe et déploie les nouveaux canaux. Un canal déjà présent est conservé ;
`OIE_INIT_FORCE=true` permet de le remplacer par son export :

```sh
docker compose run --rm -e OIE_INIT_FORCE=true oie-init
```

Cette commande remplace les canaux portant les identifiants des exports fournis.
L'init refuse les imports signalés invalides par OIE et les erreurs de déploiement.
Ajouter les ports des futurs listeners à `oie-app.ports` si nécessaire.

```sh
docker compose stop  # arrêter en conservant les conteneurs et les données
docker compose down  # retirer les conteneurs ; les volumes restent conservés
```

Cette base est adaptée de `fhir-datatype-Eclipse-OIE/demo-oru2fhir`.
