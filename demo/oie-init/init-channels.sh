#!/bin/sh
# Réinitialise OIE à l'état initial de la démo : supprime les canaux, groupes et tags
# existants, installe les contextes FHIR, importe et déploie tous les canaux de
# channels/ et groupes de groups/, puis marque la première connexion comme faite.
set -eu

OIE_URL="${OIE_URL:-https://oie-app:8443}"
OIE_USER="${OIE_USER:-admin}"
OIE_PASSWORD="${OIE_PASSWORD:-admin}"
OIE_SKIP_FIRST_LOGIN="${OIE_SKIP_FIRST_LOGIN:-true}"
INIT_DIR="${OIE_INIT_DIR:-/oie-init}"
CHANNELS_DIR="$INIT_DIR/channels"
GROUPS_DIR="$INIT_DIR/groups"
SETTINGS_FILE="$INIT_DIR/fhir-settings.json"
EMPTY_SET_FILE="$INIT_DIR/empty-set.xml"
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

bulk_update_groups() {
  status=$(curl --insecure --noproxy '*' --silent --show-error --max-time 300 \
    --user "$OIE_USER:$OIE_PASSWORD" --header 'X-Requested-With: OpenAPI' \
    --form "channelGroups=@$1;type=application/xml" \
    --form "removedChannelGroupIds=@$2;type=application/xml" \
    --output "$RESPONSE_FILE" --write-out '%{http_code}' \
    "$OIE_URL/api/channelgroups/_bulkUpdate?override=true") || fail "Mise à jour des groupes impossible"
  case "$status" in
    2??) ;;
    *) fail "HTTP $status sur /channelgroups/_bulkUpdate : $(cat "$RESPONSE_FILE")" ;;
  esac
  if grep -qE '<boolean>false</boolean>|"boolean" *: *false|^false$' "$RESPONSE_FILE"; then
    fail "Groupes refusés : $(cat "$RESPONSE_FILE")"
  fi
}

xml_value() {
  sed -n "s:.*<$1>\(.*\)</$1>.*:\1:p" "$2" | head -n 1
}

echo "=== Réinitialisation OIE ($OIE_URL) ==="

# 1. Nettoyage complet : canaux déployés/enregistrés, groupes et tags.
api GET /channels/idsAndNames
awk '
  BEGIN { print "<set>" }
  /<entry>/ { first=1; next }
  first && /<string>[^<]+<\/string>/ {
    id=$0
    sub(/^.*<string>/, "", id)
    sub(/<\/string>.*$/, "", id)
    first=0
    print "  <string>" id "</string>"
  }
  END { print "</set>" }
' "$RESPONSE_FILE" > /tmp/oie-existing-ids.xml

if grep -Fq "<string>" /tmp/oie-existing-ids.xml; then
  echo "Suppression des canaux existants..."
  api POST "/channels/_undeploy?returnErrors=true" /tmp/oie-existing-ids.xml
  [ ! -s "$RESPONSE_FILE" ] || fail "Arrêt des canaux refusé : $(cat "$RESPONSE_FILE")"
  api POST /channels/_removeChannels /tmp/oie-existing-ids.xml
fi

api GET /channelgroups
awk '
  BEGIN { print "<set>" }
  /<channelGroup[ >]/ { in_group=1; got_id=0; next }
  /<\/channelGroup>/ { in_group=0; got_id=0; next }
  in_group && !got_id && /<id>[^<]+<\/id>/ {
    id=$0
    sub(/^.*<id>/, "", id)
    sub(/<\/id>.*$/, "", id)
    got_id=1
    print "  <string>" id "</string>"
  }
  END { print "</set>" }
' "$RESPONSE_FILE" > /tmp/oie-removed-groups.xml

if grep -Fq "<string>" /tmp/oie-removed-groups.xml; then
  bulk_update_groups "$EMPTY_SET_FILE" /tmp/oie-removed-groups.xml
fi

api PUT /server/channelTags "$EMPTY_SET_FILE" application/xml

# 2. Contextes FHIR (Settings > FHIR Mapper) : requis avant l'import/déploiement des canaux.
if [ -f "$SETTINGS_FILE" ]; then
  api POST /extensions/fhir-profile-mapper/settings "$SETTINGS_FILE" text/plain
  echo "Contextes FHIR installés"
fi

# 3. Import des canaux.
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

# Contrôle global d'invalidité (extension absente ou étape non désérialisée).
api GET /channels
if grep -Fq "This channel is invalid." "$RESPONSE_FILE"; then
  fail "Au moins un canal est invalide après import. Vérifier les extensions et la désérialisation des étapes."
fi

# 4. Installation de tous les groupes en un seul appel.
{
  printf '<set>\n'
  for file in "$GROUPS_DIR"/*.xml; do
    [ -f "$file" ] || continue
    awk '$0 !~ /^<\/?set[^>]*>/ { print }' "$file"
  done
  printf '</set>\n'
} > /tmp/oie-groups.xml

if grep -Fq "<channelGroup" /tmp/oie-groups.xml; then
  bulk_update_groups /tmp/oie-groups.xml "$EMPTY_SET_FILE"
  echo "Groupes installés"
fi

# 5. Déploiement groupé en un seul appel.
if [ "$count" -gt 0 ]; then
  echo "Déploiement de $count canal(aux)..."
  api POST "/channels/_deploy?returnErrors=true" /tmp/oie-deploy-ids.xml
  if [ -s "$RESPONSE_FILE" ]; then
    fail "Déploiement refusé : $(cat "$RESPONSE_FILE")"
  fi
fi

# 6. Première connexion du compte marquée comme faite (évite l'assistant de changement de mot de passe).
if [ "$OIE_SKIP_FIRST_LOGIN" = true ]; then
  request GET /users/current > /dev/null
  user_id=$(xml_value id "$RESPONSE_FILE")
  [ -n "$user_id" ] || fail "id du compte $OIE_USER introuvable"
  printf false > /tmp/firstlogin.txt
  api PUT "/users/$user_id/preferences/firstlogin" /tmp/firstlogin.txt text/plain
  echo "Première connexion de $OIE_USER marquée comme faite"
fi

echo "=== Terminé : $count canal(aux) importé(s) et déployé(s) ==="
