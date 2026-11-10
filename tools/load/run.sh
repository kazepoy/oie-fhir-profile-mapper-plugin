#!/bin/sh
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at https://mozilla.org/MPL/2.0/.
#
# Lance le test de charge k6 contre la démo démarrée et range le rapport dans
# tools/load/reports/<date>-<profil>/.
#   tools/load/run.sh                      paliers 5 → 40 msg/s (~5 min)
#   PROFIL=rapide tools/load/run.sh        vérification courte (~40 s)
#   PROFIL=endurance DEBIT=10 DUREE=2h tools/load/run.sh
set -eu
cd "$(dirname "$0")"
LOAD=$(pwd)
ROOT=$(cd ../.. && pwd)

K6_IMAGE=${K6_IMAGE:-grafana/k6:1.3.0}
SCRIPT=${SCRIPT:-charge.js}
PROFIL=${PROFIL:-$( [ "$SCRIPT" = charge.js ] && echo paliers || basename "$SCRIPT" .js)}
NETWORK=${NETWORK:-fhir-profile-mapper-demo_default}
OUT="$LOAD/reports/$(date +%Y%m%d-%H%M%S)-$PROFIL"
mkdir -p "$OUT"

app=$(docker compose -f "$ROOT/demo/compose.yaml" ps -q oie-app)
db=$(docker compose -f "$ROOT/demo/compose.yaml" ps -q oie-db)
[ -n "$app" ] || { echo "La démo n'est pas démarrée (cd demo && docker compose up -d)." >&2; exit 1; }

# Relevé CPU et mémoire des conteneurs OIE et Postgres toutes les 5 s pendant le test.
echo "horodatage;conteneur;cpu;memoire" > "$OUT/docker-stats.csv"
(
  while :; do
    docker stats --no-stream --format "{{.Name}};{{.CPUPerc}};{{.MemUsage}}" "$app" "$db" 2>/dev/null |
      sed "s/^/$(date +%H:%M:%S);/" >> "$OUT/docker-stats.csv"
    sleep 5
  done
) &
STATS=$!
trap 'kill $STATS 2>/dev/null || true' EXIT INT TERM

echo "Tableau de bord en direct : http://localhost:5665"
status=0
docker run --rm --network "$NETWORK" -p 127.0.0.1:5665:5665 \
  -v "$LOAD:/load:ro" -v "$ROOT/demo/examples:/examples:ro" -v "$OUT:/reports" \
  -e PROFIL="$PROFIL" -e COMMIT="$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo inconnu)" \
  -e OIE_HOST -e CHAUFFAGE_S -e MESURE_S -e CLIENTS -e P95_MS -e ERREURS_MAX -e DEBIT -e DUREE \
  -e K6_WEB_DASHBOARD=true -e K6_WEB_DASHBOARD_EXPORT=/reports/rapport.html \
  "$K6_IMAGE" run --quiet /load/$SCRIPT || status=$?

kill $STATS 2>/dev/null || true
# Pics CPU et mémoire par conteneur, ajoutés au résumé.
{
  echo "## Ressources serveur (relevé toutes les 5 s)"
  echo
  echo "| Conteneur | CPU max | Mémoire max |"
  echo "|---|---:|---:|"
  awk -F';' 'NR > 1 {
      cpu = $3; sub(/%/, "", cpu); split($4, m, " / "); mem = m[1]; v = mem + 0
      if (mem ~ /GiB/) v *= 1024; else if (mem ~ /KiB/) v /= 1024
      if (cpu + 0 > c[$2]) c[$2] = cpu + 0
      if (v > mx[$2]) mx[$2] = v
    }
    END { for (k in c) printf "| %s | %.0f %% | %.0f MiB |\n", k, c[k], mx[k] }' "$OUT/docker-stats.csv"
  echo
  echo "Détail : \`docker-stats.csv\`. Le CPU est en % d'un cœur."
} >> "$OUT/resume.md"

echo
echo "Rapport : $OUT/resume.md et $OUT/rapport.html"
exit $status
