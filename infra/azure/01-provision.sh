#!/usr/bin/env bash
#
# Sokozi on Azure, stage 1: infrastructure and the backend.
#
# Creates billable resources. Read it before running it.
#
#   ./infra/azure/01-provision.sh
#
# Everything is named from SUFFIX so the script can be run again for a second
# environment without colliding. ACR, Postgres and web app names have to be
# globally unique across all of Azure, which is why the suffix exists.
#
# The database password is generated here and written to .azure-secrets.env,
# which is gitignored. It is never printed.

set -euo pipefail

LOCATION="${LOCATION:-southafricanorth}"
SUFFIX="${SUFFIX:-$(whoami | tr -cd '[:alnum:]' | tr '[:upper:]' '[:lower:]' | cut -c1-6)}"

RG="${RG:-sokozi-rg}"
ACR="${ACR:-sokoziacr${SUFFIX}}"
PG="${PG:-sokozi-pg-${SUFFIX}}"
PLAN="${PLAN:-sokozi-plan}"
BACKEND_APP="${BACKEND_APP:-sokozi-backend-${SUFFIX}}"
STOREFRONT_APP="${STOREFRONT_APP:-sokozi-storefront-${SUFFIX}}"
PG_ADMIN="${PG_ADMIN:-sokozi}"
PG_DB="sokozi"

SECRETS_FILE="$(git rev-parse --show-toplevel)/.azure-secrets.env"

echo "Region        : $LOCATION"
echo "Resource group: $RG"
echo "Registry      : $ACR"
echo "Postgres      : $PG"
echo "Backend app   : $BACKEND_APP"
echo "Storefront app: $STOREFRONT_APP"
echo
read -r -p "Create these billable resources? [y/N] " reply
[[ "$reply" == "y" || "$reply" == "Y" ]] || { echo "Aborted."; exit 1; }

# ---------------------------------------------------------------- secrets ---
# Generated once and kept out of git. JWT and cookie secrets rotate sessions if
# changed later, so they are written down rather than regenerated per run.
if [[ ! -f "$SECRETS_FILE" ]]; then
  {
    echo "PG_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-24)"
    echo "JWT_SECRET=$(openssl rand -base64 32)"
    echo "COOKIE_SECRET=$(openssl rand -base64 32)"
  } > "$SECRETS_FILE"
  chmod 600 "$SECRETS_FILE"
  echo "Generated secrets into .azure-secrets.env (gitignored)."
fi
# shellcheck disable=SC1090
source "$SECRETS_FILE"

# ------------------------------------------------------------ foundation ---
az group create -n "$RG" -l "$LOCATION" -o none
echo "Resource group ready."

# Basic is the cheapest tier that supports the build tasks used below.
az acr create -g "$RG" -n "$ACR" --sku Basic --admin-enabled true -o none
echo "Container registry ready."

# Burstable B1ms is the cheapest tier. Public access is on so App Service can
# reach it without VNet integration, which is deliberate for an MVP: private
# networking is a Phase 3 concern if this survives.
az postgres flexible-server create \
  -g "$RG" -n "$PG" -l "$LOCATION" \
  --tier Burstable --sku-name Standard_B1ms \
  --version 16 --storage-size 32 \
  --admin-user "$PG_ADMIN" --admin-password "$PG_PASSWORD" \
  --database-name "$PG_DB" \
  --public-access 0.0.0.0 \
  --yes -o none
echo "Postgres ready."

# One plan hosts both apps, which is half the compute cost of two.
az appservice plan create \
  -g "$RG" -n "$PLAN" -l "$LOCATION" \
  --is-linux --sku B1 -o none
echo "App Service plan ready."

# ----------------------------------------------------------- build image ---
# Built by ACR, not locally. No Docker daemon is needed on this machine, and
# this is the first real test of the Dockerfile.
echo "Building the backend image in Azure. This takes a few minutes."
az acr build -r "$ACR" -t "sokozi-backend:latest" -f apps/backend/Dockerfile . -o none
echo "Backend image built."

# --------------------------------------------------------- deploy backend ---
ACR_SERVER="$(az acr show -n "$ACR" --query loginServer -o tsv)"
ACR_USER="$(az acr credential show -n "$ACR" --query username -o tsv)"
ACR_PASS="$(az acr credential show -n "$ACR" --query 'passwords[0].value' -o tsv)"
PG_HOST="$(az postgres flexible-server show -g "$RG" -n "$PG" --query fullyQualifiedDomainName -o tsv)"

az webapp create \
  -g "$RG" -p "$PLAN" -n "$BACKEND_APP" \
  --container-image-name "$ACR_SERVER/sokozi-backend:latest" \
  --container-registry-url "https://$ACR_SERVER" \
  --container-registry-user "$ACR_USER" \
  --container-registry-password "$ACR_PASS" -o none

BACKEND_URL="https://${BACKEND_APP}.azurewebsites.net"
STOREFRONT_URL="https://${STOREFRONT_APP}.azurewebsites.net"

# sslmode=require is not optional. Azure Postgres refuses plaintext connections.
az webapp config appsettings set -g "$RG" -n "$BACKEND_APP" --settings \
  WEBSITES_PORT=9000 \
  PORT=9000 \
  NODE_ENV=production \
  DATABASE_URL="postgresql://${PG_ADMIN}:${PG_PASSWORD}@${PG_HOST}:5432/${PG_DB}?sslmode=require" \
  JWT_SECRET="$JWT_SECRET" \
  COOKIE_SECRET="$COOKIE_SECRET" \
  STORE_CORS="$STOREFRONT_URL" \
  ADMIN_CORS="$BACKEND_URL" \
  AUTH_CORS="${STOREFRONT_URL},${BACKEND_URL}" \
  -o none

# Always on keeps the container from being unloaded when idle, which is what
# reintroduces cold starts and the slow first request.
az webapp config set -g "$RG" -n "$BACKEND_APP" --always-on true -o none

echo
echo "Backend deploying to $BACKEND_URL"
echo
echo "Next:"
echo "  1. Wait for it, then check:  curl $BACKEND_URL/health"
echo "     First boot runs db:migrate, which also seeds the catalogue once."
echo "     Do not run the seed by hand."
echo
echo "  2. Create the admin user, in the app's SSH console:"
echo "       pnpm --filter @dtc/backend exec medusa user -e admin@sokozi.co.tz -p '<password>'"
echo "     Generate the password with: openssl rand -base64 32"
echo "     Then change it from inside the admin at $BACKEND_URL/app"
echo
echo "  3. Copy the publishable key from $BACKEND_URL/app"
echo "     Settings, Publishable API Keys. It differs from your local one."
echo
echo "  4. Run stage 2:"
echo "       PUBLISHABLE_KEY=pk_... ./infra/azure/02-storefront.sh"
