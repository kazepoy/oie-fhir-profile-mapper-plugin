#!/bin/sh
# Import des canaux de channels/ (un <channel> par fichier) par l'API REST d'OIE, puis leur
# déploiement. Un canal déjà présent est laissé tel quel, sauf avec OIE_INIT_FORCE=true :
# une modification faite dans l'administration survit donc à un docker compose up.
# Marque aussi la première connexion du compte comme faite (OIE_SKIP_FIRST_LOGIN, true par
# défaut) : l'administration ne demande alors pas de changer le mot de passe.
set -eu

OIE_URL="${OIE_URL:-https://oie-app:8443}"
OIE_USER="${OIE_USER:-admin}"
OIE_PASSWORD="${OIE_PASSWORD:-admin}"
OIE_INIT_FORCE="${OIE_INIT_FORCE:-false}"
OIE_SKIP_FIRST_LOGIN="${OIE_SKIP_FIRST_LOGIN:-true}"
CHANNELS_DIR="${OIE_INIT_DIR:-/oie-init}/channels"
RESPONSE_FILE=/tmp/oie-response.txt

fail() {
  echo "  -> ERREUR : $*" >&2
  exit 1
}

# request MÉTHODE CHEMIN [FICHIER [TYPE]] : appel REST authentifié (corps XML par défaut) ;
# affiche le code HTTP.
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
    fail "OIE a refusé $1 $2"
  fi
}

xml_value() {
  sed -n "s:.*<$1>\(.*\)</$1>.*:\1:p" "$2" | head -n 1
}

check_channel() {
  case "$(xml_value description "$RESPONSE_FILE")" in
    'This channel is invalid.'*) fail "Canal invalide : $1. Vérifier les extensions et la désérialisation des étapes." ;;
  esac
}

# Les contextes FHIR du serveur (Settings › FHIR Mapper) : des canaux les nomment, ils
# doivent exister avant l'import. Un contexte déjà modifié dans l'administration est
# conservé, sauf avec OIE_INIT_FORCE=true.
SETTINGS_FILE="${OIE_INIT_DIR:-/oie-init}/fhir-settings.json"
if [ -f "$SETTINGS_FILE" ]; then
  api GET /extensions/fhir-profile-mapper/settings
  if [ "$OIE_INIT_FORCE" = "true" ] || ! grep -q '"name"' "$RESPONSE_FILE"; then
    api POST /extensions/fhir-profile-mapper/settings "$SETTINGS_FILE" text/plain
    echo "Contextes FHIR installés"
  else
    echo "Contextes FHIR déjà présents, conservés"
  fi
fi

echo "=== Import des canaux ($OIE_URL) ==="
if [ "$OIE_INIT_FORCE" = true ]; then
  printf '<set/>\n' > /tmp/oie-empty-tags.xml
  api PUT /server/channelTags /tmp/oie-empty-tags.xml application/xml
fi
count=0
for file in "$CHANNELS_DIR"/*.xml; do
  [ -f "$file" ] || continue
  id=$(xml_value id "$file")
  name=$(xml_value name "$file")
  [ -n "$id" ] || fail "<id> introuvable dans $file"
  # GET d'un canal absent : HTTP 204 sans corps.
  status=$(request GET "/channels/$id")
  if [ "$OIE_INIT_FORCE" != true ] && [ "$status" = 200 ] && [ -s "$RESPONSE_FILE" ]; then
    check_channel "$name"
    echo "Canal déjà présent : $name"
    continue
  fi
  echo "Canal : $name"
  api PUT "/channels/$id?override=true" "$file"
  api GET "/channels/$id"
  check_channel "$name"
  echo "Déploiement : $name"
  api POST "/channels/$id/_deploy?returnErrors=true"
  # returnErrors=true : le moteur ne répond rien quand le déploiement passe.
  if [ -s "$RESPONSE_FILE" ]; then
    fail "Déploiement refusé pour $name : $(cat "$RESPONSE_FILE")"
  fi
  count=$((count + 1))
done

# Les tags sont portés par exportData/channelTags dans chaque export de canal.
# Les groupes ne sont installés qu'après les canaux. En mode forcé, les anciens
# groupes serveur absents de groups/*.xml sont retirés pour éviter tout doublon.
if [ "$OIE_INIT_FORCE" = true ]; then
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
    printf '<set/>\n' > /tmp/oie-empty-groups.xml
    status=$(curl --insecure --noproxy '*' --silent --show-error --max-time 300 \
      --user "$OIE_USER:$OIE_PASSWORD" --header 'X-Requested-With: OpenAPI' \
      --form 'channelGroups=@/tmp/oie-empty-groups.xml;type=application/xml' \
      --form 'removedChannelGroupIds=@/tmp/oie-removed-groups.xml;type=application/xml' \
      --output "$RESPONSE_FILE" --write-out '%{http_code}' \
      "$OIE_URL/api/channelgroups/_bulkUpdate?override=true") || fail "Nettoyage des groupes impossible"
    case "$status" in
      2??) ;;
      *) fail "HTTP $status lors du nettoyage des groupes : $(cat "$RESPONSE_FILE")" ;;
    esac
  fi
  {
    printf '<set>\n'
    for file in "${OIE_INIT_DIR:-/oie-init}"/groups/*.xml; do
      [ -f "$file" ] || continue
      awk '$0 !~ /^<\/?set[^>]*>/ { print }' "$file"
    done
    printf '</set>\n'
  } > /tmp/oie-groups.xml
  status=$(curl --insecure --noproxy '*' --silent --show-error --max-time 300 \
    --user "$OIE_USER:$OIE_PASSWORD" --header 'X-Requested-With: OpenAPI' \
    --form 'channelGroups=@/tmp/oie-groups.xml;type=application/xml' \
    --form "removedChannelGroupIds=@${OIE_INIT_DIR:-/oie-init}/empty-set.xml;type=application/xml" \
    --output "$RESPONSE_FILE" --write-out '%{http_code}' \
    "$OIE_URL/api/channelgroups/_bulkUpdate?override=true") || fail "Import des groupes impossible"
  case "$status" in
    2??) ;;
    *) fail "HTTP $status pour les groupes : $(cat "$RESPONSE_FILE")" ;;
  esac
  if grep -qE '<boolean>false</boolean>|"boolean" *: *false|^false$' "$RESPONSE_FILE"; then
    fail "Groupes refusés : $(cat "$RESPONSE_FILE")"
  fi
  for file in "${OIE_INIT_DIR:-/oie-init}"/groups/*.xml; do
    [ -f "$file" ] || continue
    id=$(xml_value id "$file")
    name=$(xml_value name "$file")
    api GET "/channelgroups?channelGroupId=$id"
    grep -Fq "$id" "$RESPONSE_FILE" || fail "Groupe absent après import : $name"
    echo "Groupe installé : $name"
  done
else
  for file in "${OIE_INIT_DIR:-/oie-init}"/groups/*.xml; do
    [ -f "$file" ] || continue
    id=$(xml_value id "$file")
    name=$(xml_value name "$file")
    [ -n "$id" ] || fail "<id> de groupe introuvable dans $file"
    api GET /channelgroups
    if grep -Fq "$id" "$RESPONSE_FILE"; then
      echo "Groupe déjà présent : $name"
      continue
    fi
    # _bulkUpdate remplace toute la liste, même avec override=true : conserver
    # chaque groupe serveur autre que celui que cette définition remplace.
    awk -v group_id="$id" '
      BEGIN { print "<set>" }
      FILENAME == ARGV[1] {
        if ($0 ~ /<channelGroup[ >]/) { inside=1; block="" }
        if (inside) block=block $0 "\n"
        if ($0 ~ /<\/channelGroup>/) {
          if (index(block, "<id>" group_id "</id>") == 0) printf "%s", block
          inside=0
        }
        next
      }
      $0 !~ /^<\/?set[^>]*>/ { print }
      END { print "</set>" }
    ' "$RESPONSE_FILE" "$file" > /tmp/oie-groups.xml
    status=$(curl --insecure --noproxy '*' --silent --show-error --max-time 300 \
      --user "$OIE_USER:$OIE_PASSWORD" --header 'X-Requested-With: OpenAPI' \
      --form 'channelGroups=@/tmp/oie-groups.xml;type=application/xml' \
      --form "removedChannelGroupIds=@${OIE_INIT_DIR:-/oie-init}/empty-set.xml;type=application/xml" \
      --output "$RESPONSE_FILE" --write-out '%{http_code}' \
      "$OIE_URL/api/channelgroups/_bulkUpdate?override=true") || fail "Import du groupe $name impossible"
    case "$status" in
      2??) ;;
      *) fail "HTTP $status pour le groupe $name : $(cat "$RESPONSE_FILE")" ;;
    esac
    if grep -qE '<boolean>false</boolean>|"boolean" *: *false|^false$' "$RESPONSE_FILE"; then
      fail "Groupe refusé : $name"
    fi
    api GET "/channelgroups?channelGroupId=$id"
    grep -Fq "$id" "$RESPONSE_FILE" || fail "Groupe absent après import : $name"
    echo "Groupe installé : $name"
  done
fi

# L'administration web (comme Swing) ouvre un assistant de première connexion, qui demande un
# nouveau mot de passe, tant que la préférence firstlogin du compte n'est pas false.
if [ "$OIE_SKIP_FIRST_LOGIN" = true ]; then
  request GET /users/current > /dev/null
  user_id=$(xml_value id "$RESPONSE_FILE")
  [ -n "$user_id" ] || fail "id du compte $OIE_USER introuvable"
  printf false > /tmp/firstlogin.txt
  api PUT "/users/$user_id/preferences/firstlogin" /tmp/firstlogin.txt text/plain
  echo "Première connexion de $OIE_USER marquée comme faite"
fi

echo "=== Terminé : $count canal(aux) importé(s) et déployé(s) ==="
