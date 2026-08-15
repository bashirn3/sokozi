#!/usr/bin/env bash
#
# Put the Stripe secret key on the deployed backend.
#
#   ./infra/azure/03-stripe.sh
#
# The key is read from apps/backend/.env and handed to Azure through a file with
# 0600 permissions, so it is never typed, never echoed, never written to shell
# history, and never visible in the process list. Nothing here prints its value,
# and the temporary file is removed even if the script fails.
#
# Run this before building the storefront: medusa-config.ts only registers the
# payment module when STRIPE_API_KEY is present, so without it the backend
# offers pp_system_default alone and no card payment is possible.

set -euo pipefail

RG="${RG:-swe}"
BACKEND_APP="${BACKEND_APP:-sokozi-backend-bashir}"
ENV_FILE="$(git rev-parse --show-toplevel)/apps/backend/.env"

[[ -f "$ENV_FILE" ]] || { echo "No $ENV_FILE"; exit 1; }

# cut -f2- keeps everything after the first '=', so a key containing '=' survives.
KEY="$(grep -m1 '^STRIPE_API_KEY=' "$ENV_FILE" | cut -d= -f2- | tr -d '"'"'"'[:space:]')"
[[ -n "$KEY" ]] || { echo "STRIPE_API_KEY is empty in apps/backend/.env"; exit 1; }

case "$KEY" in
  sk_test_*) echo "Found a test-mode secret key (${#KEY} chars)." ;;
  sk_live_*) echo "Found a LIVE secret key. This will take real money."
             read -r -p "Continue? [y/N] " r; [[ "$r" == y || "$r" == Y ]] || exit 1 ;;
  *)         echo "Value does not look like a Stripe secret key. Aborting."; exit 1 ;;
esac

TMP="$(mktemp -t stripe-settings)"
trap 'rm -f "$TMP"' EXIT
umask 077
printf '[{"name":"STRIPE_API_KEY","value":"%s","slotSetting":false}]' "$KEY" > "$TMP"
chmod 600 "$TMP"

echo "Applying to $BACKEND_APP..."
az webapp config appsettings set -g "$RG" -n "$BACKEND_APP" --settings @"$TMP" -o none
rm -f "$TMP"

echo "Restarting so the payment module registers..."
az webapp restart -g "$RG" -n "$BACKEND_APP" -o none

echo
echo "Done. The backend takes a couple of minutes to come back."
echo "Stripe is registered once this lists pp_stripe_stripe:"
echo "  psql \"\$CONN\" -tAc 'select id from payment_provider'"
echo
echo "STRIPE_WEBHOOK_SECRET is still unset. It needs a webhook pointed at"
echo "  https://${BACKEND_APP}.azurewebsites.net/hooks/payment/stripe_stripe"
echo "created in the Stripe dashboard, which is a separate step."
