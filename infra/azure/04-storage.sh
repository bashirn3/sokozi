#!/usr/bin/env bash
#
# Point the backend at S3-compatible object storage, configured for Cloudflare R2.
#
#   ./infra/azure/04-storage.sh
#
# Values are read from apps/backend/.env and handed to Azure through a file with
# 0600 permissions, so nothing is typed, echoed, or left in shell history or the
# process list. Nothing here prints a secret.
#
# Without this, Medusa writes uploads to the container's own disk. That disk is
# replaced on every deploy and restart, so images uploaded through the admin
# disappear later and the product is left showing a broken image. The failure is
# silent and happens on a schedule nobody chose.
#
# The same settings work against AWS S3 or Backblaze B2. Nothing here is
# Cloudflare specific, which is deliberate: the store stays portable.

set -euo pipefail

RG="${RG:-swe}"
BACKEND_APP="${BACKEND_APP:-sokozi-backend-bashir}"
ENV_FILE="$(git rev-parse --show-toplevel)/apps/backend/.env"

[[ -f "$ENV_FILE" ]] || { echo "No $ENV_FILE"; exit 1; }

# cut -f2- keeps everything after the first '=', so a value containing '='
# survives. Quotes and surrounding whitespace are stripped.
read_var() {
  grep -m1 "^${1}=" "$ENV_FILE" | cut -d= -f2- | sed 's/^[[:space:]]*//;s/[[:space:]]*$//;s/^"//;s/"$//;s/^'"'"'//;s/'"'"'$//'
}

S3_BUCKET="$(read_var S3_BUCKET)"
S3_ENDPOINT="$(read_var S3_ENDPOINT)"
S3_FILE_URL="$(read_var S3_FILE_URL)"
S3_ACCESS_KEY_ID="$(read_var S3_ACCESS_KEY_ID)"
S3_SECRET_ACCESS_KEY="$(read_var S3_SECRET_ACCESS_KEY)"
S3_REGION="$(read_var S3_REGION)"
S3_REGION="${S3_REGION:-auto}"

missing=()
for v in S3_BUCKET S3_ENDPOINT S3_FILE_URL S3_ACCESS_KEY_ID S3_SECRET_ACCESS_KEY; do
  [[ -n "${!v}" ]] || missing+=("$v")
done
if (( ${#missing[@]} )); then
  echo "These are still blank in apps/backend/.env:"
  printf '  %s\n' "${missing[@]}"
  echo
  echo "S3_ENDPOINT is https://<account-id>.r2.cloudflarestorage.com"
  echo "S3_FILE_URL is the bucket's public https://pub-xxxx.r2.dev address"
  exit 1
fi

# A wrong endpoint fails at upload time, inside the admin, with an unhelpful
# message. Catching the shape here is cheaper than debugging it there.
case "$S3_ENDPOINT" in
  https://*) ;;
  *) echo "S3_ENDPOINT must start with https://. Got: $S3_ENDPOINT"; exit 1 ;;
esac
case "$S3_FILE_URL" in
  https://*) ;;
  *) echo "S3_FILE_URL must start with https://. Got: $S3_FILE_URL"; exit 1 ;;
esac

echo "Bucket   : $S3_BUCKET"
echo "Endpoint : $S3_ENDPOINT"
echo "Public   : $S3_FILE_URL"
echo "Region   : $S3_REGION"
echo "Keys     : present (${#S3_ACCESS_KEY_ID} and ${#S3_SECRET_ACCESS_KEY} chars)"
echo
read -r -p "Apply to $BACKEND_APP and restart it? [y/N] " reply
[[ "$reply" == "y" || "$reply" == "Y" ]] || { echo "Aborted."; exit 1; }

TMP="$(mktemp -t sokozi-storage)"
trap 'rm -f "$TMP"' EXIT
umask 077
S3_BUCKET="$S3_BUCKET" S3_ENDPOINT="$S3_ENDPOINT" S3_FILE_URL="$S3_FILE_URL" \
S3_ACCESS_KEY_ID="$S3_ACCESS_KEY_ID" S3_SECRET_ACCESS_KEY="$S3_SECRET_ACCESS_KEY" \
S3_REGION="$S3_REGION" python3 - "$TMP" <<'PY'
import json, os, sys
s = lambda n: {"name": n, "value": os.environ[n], "slotSetting": False}
json.dump([s(n) for n in (
    "S3_BUCKET", "S3_ENDPOINT", "S3_FILE_URL",
    "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "S3_REGION",
)], open(sys.argv[1], "w"))
PY
chmod 600 "$TMP"

echo "Applying..."
az webapp config appsettings set -g "$RG" -n "$BACKEND_APP" --settings @"$TMP" -o none
rm -f "$TMP"

# Left over from creating the admin user and unused since. Removed here so the
# backend restarts once rather than twice.
if az webapp config appsettings list -g "$RG" -n "$BACKEND_APP" --query "[?name=='ADMIN_BOOTSTRAP_PASSWORD'].name" -o tsv | grep -q .; then
  echo "Removing the unused ADMIN_BOOTSTRAP_PASSWORD setting..."
  az webapp config appsettings delete -g "$RG" -n "$BACKEND_APP" \
    --setting-names ADMIN_BOOTSTRAP_PASSWORD -o none
fi

echo "Restarting..."
az webapp restart -g "$RG" -n "$BACKEND_APP" -o none

echo
echo "Done. Give it two or three minutes, then confirm with:"
echo "  curl -s -o /dev/null -w '%{http_code}\\n' https://${BACKEND_APP}.azurewebsites.net/health"
echo
echo "Then upload an image to any product in the admin. The image URL should"
echo "begin with $S3_FILE_URL. If it begins with the backend's own address the"
echo "provider did not register, and the upload is still on disposable disk."
