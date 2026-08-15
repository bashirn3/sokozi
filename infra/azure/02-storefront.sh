#!/usr/bin/env bash
#
# Sokozi on Azure, stage 2: the storefront.
#
# Run after stage 1, and only once the backend answers /health and you have the
# publishable key from its admin:
#
#   PUBLISHABLE_KEY=pk_... ./infra/azure/02-storefront.sh
#
# Two reasons this is a separate stage rather than part of stage 1:
#
# 1. NEXT_PUBLIC_* values are inlined by Next at build time, so the publishable
#    key has to exist before the image is built. It cannot be supplied later as
#    an app setting.
#
# 2. The build calls the backend. Category and product pages are prerendered
#    with generateStaticParams, so the backend must be up and seeded or those
#    pages come out empty.

set -euo pipefail

LOCATION="${LOCATION:-southafricanorth}"
SUFFIX="${SUFFIX:-$(whoami | tr -cd '[:alnum:]' | tr '[:upper:]' '[:lower:]' | cut -c1-6)}"

RG="${RG:-sokozi-rg}"
ACR="${ACR:-sokoziacr${SUFFIX}}"
PLAN="${PLAN:-sokozi-plan}"
BACKEND_APP="${BACKEND_APP:-sokozi-backend-${SUFFIX}}"
STOREFRONT_APP="${STOREFRONT_APP:-sokozi-storefront-${SUFFIX}}"

BACKEND_URL="https://${BACKEND_APP}.azurewebsites.net"
STOREFRONT_URL="https://${STOREFRONT_APP}.azurewebsites.net"

: "${PUBLISHABLE_KEY:?Set PUBLISHABLE_KEY to the key from ${BACKEND_URL}/app, Settings, Publishable API Keys}"
WHATSAPP_NUMBER="${WHATSAPP_NUMBER:-}"
STRIPE_KEY="${STRIPE_KEY:-}"

# The build will silently produce empty category and product pages if the
# backend is not answering, so fail loudly here instead.
echo "Checking the backend is up before building..."
if ! curl -fsS --max-time 20 "$BACKEND_URL/health" >/dev/null; then
  echo "Backend is not answering at $BACKEND_URL/health."
  echo "Deploy and seed it first, or the storefront will build with no products."
  exit 1
fi
echo "Backend is healthy."

echo "Building the storefront image in Azure. This takes a few minutes."
az acr build -r "$ACR" -t "sokozi-storefront:latest" -f apps/storefront/Dockerfile . \
  --build-arg NEXT_PUBLIC_MEDUSA_BACKEND_URL="$BACKEND_URL" \
  --build-arg NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY="$PUBLISHABLE_KEY" \
  --build-arg NEXT_PUBLIC_BASE_URL="$STOREFRONT_URL" \
  --build-arg NEXT_PUBLIC_DEFAULT_REGION=tz \
  --build-arg NEXT_PUBLIC_WHATSAPP_NUMBER="$WHATSAPP_NUMBER" \
  --build-arg NEXT_PUBLIC_STRIPE_KEY="$STRIPE_KEY" \
  -o none
echo "Storefront image built."

ACR_SERVER="$(az acr show -n "$ACR" --query loginServer -o tsv)"
ACR_USER="$(az acr credential show -n "$ACR" --query username -o tsv)"
ACR_PASS="$(az acr credential show -n "$ACR" --query 'passwords[0].value' -o tsv)"

# `az webapp show` is not usable for the existence check. On some CLI builds it
# aborts on an unrelated XML parsing fault, which would send every run down the
# create path. Listing and filtering avoids that code path entirely.
app_exists() {
  [[ -n "$(az webapp list -g "$RG" --query "[?name=='${1}'].name" -o tsv)" ]]
}

if ! app_exists "$STOREFRONT_APP"; then
  # `az webapp create` creates the app and can then crash while fetching the FTP
  # publish profile for its own output, so its exit code says nothing about
  # whether the app exists. The result is verified instead of trusted.
  az webapp create \
    -g "$RG" -p "$PLAN" -n "$STOREFRONT_APP" \
    --container-image-name "$ACR_SERVER/sokozi-storefront:latest" -o none || true

  app_exists "$STOREFRONT_APP" || { echo "Could not create $STOREFRONT_APP."; exit 1; }
fi

# The container is configured after creation, never during it, for two reasons.
#
# `az webapp create` prepends the registry host to --container-image-name even
# when the name already carries it, producing acr.io/acr.io/image:tag, which
# fails to pull with a message about the repository not existing.
#
# It also does not persist the registry credentials, so the app is left unable
# to authenticate. Both faults look like a healthy deployment until the pull is
# attempted, so both are set explicitly here.
az webapp config container set -g "$RG" -n "$STOREFRONT_APP" \
  --container-image-name "$ACR_SERVER/sokozi-storefront:latest" -o none

# Registry credentials and runtime settings go in through a 0600 file rather
# than the command line, which would expose the password in the process list.
SETTINGS_TMP="$(mktemp -t sokozi-storefront-settings)"
trap 'rm -f "$SETTINGS_TMP"' EXIT
umask 077
cat > "$SETTINGS_TMP" <<JSON
[
  {"name":"DOCKER_REGISTRY_SERVER_URL","value":"https://${ACR_SERVER}","slotSetting":false},
  {"name":"DOCKER_REGISTRY_SERVER_USERNAME","value":"${ACR_USER}","slotSetting":false},
  {"name":"DOCKER_REGISTRY_SERVER_PASSWORD","value":"${ACR_PASS}","slotSetting":false},
  {"name":"WEBSITES_PORT","value":"8000","slotSetting":false},
  {"name":"PORT","value":"8000","slotSetting":false},
  {"name":"NODE_ENV","value":"production","slotSetting":false}
]
JSON
chmod 600 "$SETTINGS_TMP"
az webapp config appsettings set -g "$RG" -n "$STOREFRONT_APP" --settings @"$SETTINGS_TMP" -o none
rm -f "$SETTINGS_TMP"

# Always on keeps the container loaded, which is what avoids a cold start on the
# first request after an idle period.
az webapp config set -g "$RG" -n "$STOREFRONT_APP" --always-on true -o none
az webapp restart -g "$RG" -n "$STOREFRONT_APP" -o none

# The backend needs to trust the storefront's real origin, which only exists now.
az webapp config appsettings set -g "$RG" -n "$BACKEND_APP" --settings \
  STORE_CORS="$STOREFRONT_URL" \
  AUTH_CORS="${STOREFRONT_URL},${BACKEND_URL}" -o none
az webapp restart -g "$RG" -n "$BACKEND_APP" -o none

echo
echo "Storefront: $STOREFRONT_URL/tz"
echo "Admin     : $BACKEND_URL/app"
echo
echo "Now work through plan.html against the deployed site, not localhost."
echo "Rebuild this image whenever a NEXT_PUBLIC_ value changes. Restarting is"
echo "not enough, because Next inlines them at build time."
