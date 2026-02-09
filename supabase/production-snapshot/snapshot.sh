#!/usr/bin/env bash
# Snapshot production Supabase data via REST API
#
# Usage:
#   ./supabase/production-snapshot/snapshot.sh
#
# Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
# for the PRODUCTION project in .env.production or passed as env vars.
#
# Output: dated JSON files in this directory (gitignored)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATE=$(date +%Y-%m-%d)

# --- Load credentials ---

# Try .env.production first, then fall back to env vars
ENV_FILE="$SCRIPT_DIR/../../.env.production"
if [[ -f "$ENV_FILE" ]]; then
  echo "Loading credentials from .env.production"
  SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL "$ENV_FILE" | cut -d= -f2-)
  ANON_KEY=$(grep NEXT_PUBLIC_SUPABASE_ANON_KEY "$ENV_FILE" | cut -d= -f2-)
elif [[ -n "${NEXT_PUBLIC_SUPABASE_URL:-}" && -n "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" ]]; then
  SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL"
  ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY"
else
  echo "Error: No credentials found."
  echo "Either create .env.production with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY,"
  echo "or export them as environment variables."
  exit 1
fi

BASE="$SUPABASE_URL/rest/v1"

echo "Snapshotting production: $SUPABASE_URL"
echo "Date: $DATE"
echo ""

# --- Export tables ---

TABLES=(
  "parts:1000"
  "vehicle_applications:5000"
  "cross_references:5000"
  "part_images:5000"
  "part_360_frames:5000"
  "site_settings:100"
  "import_history:1000"
)

for entry in "${TABLES[@]}"; do
  TABLE="${entry%%:*}"
  LIMIT="${entry##*:}"
  OUTFILE="$SCRIPT_DIR/${DATE}_${TABLE}.json"

  echo -n "  $TABLE ... "
  curl -sf "$BASE/$TABLE?select=*&order=id&limit=$LIMIT" \
    -H "apikey: $ANON_KEY" \
    -H "Authorization: Bearer $ANON_KEY" \
    -o "$OUTFILE"

  COUNT=$(node -e "const fs=require('fs'); console.log(JSON.parse(fs.readFileSync('$(cygpath -w "$OUTFILE")','utf8')).length)")
  echo "$COUNT rows -> $(basename "$OUTFILE")"
done

echo ""
echo "Snapshot complete: $SCRIPT_DIR/${DATE}_*.json"
