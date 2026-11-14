#!/bin/sh
# Réinitialise OIE depuis demo/oie-init/data :
# 1. Restaure la configuration serveur OIE (écrase l'existant, contextes FHIR inclus).
# 2. Importe les canaux (data/channels/) et les groupes (data/groups/) au format export OIE.
# 3. Déploie les canaux et marque la première connexion comme faite.
set -eu

OIE_URL="${OIE_URL:-https://oie-app:8443}"
OIE_USER="${OIE_USER:-admin}"
OIE_PASSWORD="${OIE_PASSWORD:-admin}"
OIE_SKIP_FIRST_LOGIN="${OIE_SKIP_FIRST_LOGIN:-true}"
INIT_DIR="${OIE_INIT_DIR:-/oie-init}"
DATA_DIR="$INIT_DIR/data"
CONFIG_FILE="$DATA_DIR/configuration.xml"
CHANNELS_DIR="$DATA_DIR/channels"
GROUPS_DIR="$DATA_DIR/groups"
EMPTY_SET_FILE=/tmp/oie-empty-set.xml
RESPONSE_FILE=/tmp/oie-response.txt

fail() {
  echo "  -> ERREUR : $*" >&2
  exit 1
}

# request MÉTHODE CHEMIN [FICHIER [TYPE]] : appel REST authentifié (corps XML par défaut).
request() {
  set -- "$1" "$2" "${3:-}" "${4:-application/xml}"
  if [ -n "$3" ]; then
    curl --insecure --noproxy '*' --silent --show-error --max-time 300 \
      --user "$OIE_USER:$OIE_PASSWORD" --header 'X-Requested-With: OpenAPI' \
      --header "Content-Type: $4" --data-binary "@$3" \
      --request "$1" --output "$RESPONSE_FILE" --write-out '%{http_code}' "$OIE_URL/api$2" || fail "appel impossible : $1 $2"
  else
    curl --insecure --noproxy '*' --silent --show-error --max-time 300 \
      --user "$OIE_USER:$OIE_PASSWORD" --header 'X-Requested-With: OpenAPI' \
      --request "$1" --output "$RESPONSE_FILE" --write-out '%{http_code}' "$OIE_URL/api$2" || fail "appel impossible : $1 $2"
  fi
}

# api MÉTHODE CHEMIN [FICHIER [TYPE]] : échoue hors HTTP 2xx et sur une réponse booléenne false.
api() {
  status=$(request "$@")
  case "$status" in
    2??) ;;
    *) fail "HTTP $status sur $1 $2 : $(cat "$RESPONSE_FILE")" ;;
  esac
  if grep -qE '<boolean>false</boolean>|"boolean" *: *false|^false$' "$RESPONSE_FILE"; then
    fail "OIE a refusé $1 $2 : $(cat "$RESPONSE_FILE")"
  fi
}

xml_value() {
  sed -n "s:.*<$1>\(.*\)</$1>.*:\1:p" "$2" | head -n 1
}

echo "=== Réinitialisation OIE ($OIE_URL) ==="

# 1. Restauration de la configuration OIE (écrase canaux, groupes, tags et réglages existants).
[ -f "$CONFIG_FILE" ] || fail "Fichier de configuration introuvable : $CONFIG_FILE"
echo "Import de la configuration serveur OIE..."
api PUT "/server/configuration?deploy=true&overwriteConfigMap=true" "$CONFIG_FILE"

# 2. Import des canaux au format export OIE.
count=0
printf '<set>\n' > /tmp/oie-deploy-ids.xml
for file in "$CHANNELS_DIR"/*.xml; do
  [ -f "$file" ] || continue
  id=$(xml_value id "$file")
  name=$(xml_value name "$file")
  [ -n "$id" ] || fail "<id> introuvable dans $file"
  api PUT "/channels/$id?override=true" "$file"
  printf '  <string>%s</string>\n' "$id" >> /tmp/oie-deploy-ids.xml
  count=$((count + 1))
  echo "Canal importé : $name"
done
printf '</set>\n' >> /tmp/oie-deploy-ids.xml

api GET /channels
if grep -Fq "This channel is invalid." "$RESPONSE_FILE"; then
  fail "Au moins un canal est invalide après import. Vérifier les extensions et la désérialisation des étapes."
fi

# 3. Import des groupes de canaux.
printf '<set/>\n' > "$EMPTY_SET_FILE"
{
  printf '<set>\n'
  for file in "$GROUPS_DIR"/*.xml; do
    [ -f "$file" ] || continue
    awk '$0 !~ /^<\/?set[^>]*>/ { print }' "$file"
  done
  printf '</set>\n'
} > /tmp/oie-groups.xml

if grep -Fq "<channelGroup" /tmp/oie-groups.xml; then
  status=$(curl --insecure --noproxy '*' --silent --show-error --max-time 300 \
    --user "$OIE_USER:$OIE_PASSWORD" --header 'X-Requested-With: OpenAPI' \
    --form "channelGroups=@/tmp/oie-groups.xml;type=application/xml" \
    --form "removedChannelGroupIds=@$EMPTY_SET_FILE;type=application/xml" \
    --output "$RESPONSE_FILE" --write-out '%{http_code}' \
    "$OIE_URL/api/channelgroups/_bulkUpdate?override=true") || fail "Mise à jour des groupes impossible"
  case "$status" in
    2??) ;;
    *) fail "HTTP $status sur /channelgroups/_bulkUpdate : $(cat "$RESPONSE_FILE")" ;;
  esac
  if grep -qE '<boolean>false</boolean>|"boolean" *: *false|^false$' "$RESPONSE_FILE"; then
    fail "Groupes refusés : $(cat "$RESPONSE_FILE")"
  fi
  echo "Groupes installés"
fi

# 4. Déploiement groupé des canaux importés.
if [ "$count" -gt 0 ]; then
  echo "Déploiement de $count canal(aux)..."
  api POST "/channels/_deploy?returnErrors=true" /tmp/oie-deploy-ids.xml
  if [ -s "$RESPONSE_FILE" ]; then
    fail "Déploiement refusé : $(cat "$RESPONSE_FILE")"
  fi
fi

# 5. Première connexion marquée comme faite (évite l'assistant de changement de mot de passe).
if [ "$OIE_SKIP_FIRST_LOGIN" = true ]; then
  request GET /users/current > /dev/null
  user_id=$(xml_value id "$RESPONSE_FILE")
  [ -n "$user_id" ] || fail "id du compte $OIE_USER introuvable"
  printf false > /tmp/firstlogin.txt
  api PUT "/users/$user_id/preferences/firstlogin" /tmp/firstlogin.txt text/plain
  echo "Première connexion de $OIE_USER marquée comme faite"
fi

echo "=== Terminé : $count canal(aux) importé(s) et déployé(s) ==="
