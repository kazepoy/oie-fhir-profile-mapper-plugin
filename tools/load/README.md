# Tests de charge

Mesure l'exécution des canaux de la démo, côté production : messages envoyés aux
écouteurs HTTP, mapping, validation, trace et destinations compris. L'éditeur
n'est pas concerné. L'outil est [k6](https://grafana.com/docs/k6/), lancé par
Docker : rien à installer.

```sh
cd demo && docker compose up -d && cd ..
tools/load/run.sh                                   # paliers 5, 10, 20, 40 msg/s (~5 min)
PROFIL=rapide tools/load/run.sh                     # vérification courte (~40 s)
PROFIL=endurance DEBIT=10 DUREE=2h tools/load/run.sh
```

Chaque profil commence par un chauffage à 2 msg/s, exclu des mesures. Le débit
total est réparti à tour de rôle sur les cinq canaux : `/oru/`, `/patient/`,
`/labo/`, `/sql-patient/` et `/csv-patients-collection/`. Chaque réponse est
vérifiée : HTTP 200 et la ressource FHIR attendue avec son nombre d'entrées.

Pendant le test, le tableau de bord en direct est sur <http://localhost:5665>.
Le rapport est rangé dans `tools/load/reports/<date>-<profil>/` :

- `resume.md` : verdict des seuils, latences et débit par canal, pics CPU et
  mémoire d'OIE et de Postgres ;
- `rapport.html` : courbes de débit et de latence dans le temps ;
- `docker-stats.csv` : relevé CPU et mémoire toutes les 5 s.

Le script échoue (code 99) si un seuil est dépassé. Les seuils se règlent par
variables d'environnement : `P95_MS` (1000 ms par défaut) et `ERREURS_MAX` (0.01).

## ORU vers Bundle : coût de la validation et de la trace

```sh
python3 tools/load/oru_variantes.py deploy     # cinq copies du canal, ports 10891 à 10895
SCRIPT=oru.js tools/load/run.sh                # ~6 min
python3 tools/load/oru_variantes.py remove     # quand on a fini
```

Chaque variante est une copie du canal « ORU R01 to FHIR Bundle ». Seuls trois
réglages changent : la validation du mapper (`validateOutput` des sept étapes),
la trace (`traceMessages` des sept étapes) et la validation du datatype FHIR en
sortie de la source (`validateOutbound`).

| Variante | Port | Validation mapper | Trace | Validation datatype |
|---|---|:-:|:-:|:-:|
| validation+trace | 10891 | oui | oui | oui |
| validation | 10892 | oui | non | oui |
| trace | 10893 | non | oui | oui |
| sans | 10894 | non | non | oui |
| sans-datatype | 10895 | non | non | non |

Les variantes passent l'une après l'autre, avec un client chacune : le canal
traite un message à la fois. La latence mesurée est donc le temps de service,
et le débit obtenu est le débit maximal du canal. `CHAUFFAGE_S`, `MESURE_S` et
`CLIENTS` règlent ces durées et le nombre de clients.

### Résultats du 10 novembre 2026 (commit 9c88410)

Démo locale (Docker Desktop sur macOS, 12 cœurs, `-Xmx2g`), message
`oru-r01-labo.er7`. Pour chaque variante : 60 s de mesure après 15 s de
chauffage, avec un client. Toutes les réponses étaient conformes.

| Variante | Médiane | p95 | Débit max |
|---|---:|---:|---:|
| validation+trace | 227 ms | 245 ms | 4,4 msg/s |
| validation | 187 ms | 200 ms | 5,3 msg/s |
| trace | 114 ms | 120 ms | 8,7 msg/s |
| sans | 103 ms | 112 ms | 9,6 msg/s |
| sans-datatype | 18 ms | 19 ms | 55 msg/s |

- **Le mapper seul est rapide** : 18 ms pour 7 étapes et 12 ressources.
- **La validation coûte presque tout, et elle est faite deux fois.** Celle du
  datatype FHIR en sortie ajoute environ 85 ms, et celle du mapper environ
  85 ms de plus. Le Bundle validé deux fois multiplie le temps total par 10.
- **La trace coûte peu** : +11 ms sans validation du mapper (+10 %), +40 ms
  avec (+21 %). Elle coûte davantage quand la validation du mapper est active,
  probablement parce qu'elle enregistre aussi les résultats de validation.
- **Ressources** : OIE atteint au plus 316 % CPU et 1,5 Go de mémoire ;
  Postgres reste négligeable.
- **En production, choisir une seule des deux validations.** Celle du mapper
  donne les diagnostics règle par règle, ce qui rend celle du datatype
  redondante. La combinaison « validation du mapper sans validation du
  datatype » reste à mesurer ; l'estimation est d'environ 100 ms, soit
  10 msg/s.
- **Point à vérifier** : la variante `sans` a eu une requête isolée à 102 s,
  au-delà du délai d'attente de 60 s, alors que son p99 reste à 127 ms.
  C'est probablement une pause de la VM Docker.

## À garder en tête

- les messages sont stockés par OIE : chaque test fait grossir la base de la démo ;
- sur macOS, Docker tourne dans une VM : comparer des runs entre eux, pas
  transposer les chiffres absolus à un serveur ;
- les réglages des canaux (stockage des messages, threads de la source, file
  d'attente) pèsent autant que le mapper sur le résultat.
