#!/usr/bin/env bash
# Regenerate the typed surface for every Guardian API from the raw OpenAPI specs.
# Source of truth: ../recon/specs/*.{yaml,json}  →  src/generated/*.ts
set -euo pipefail
cd "$(dirname "$0")/.."

SPECS_DIR="../recon/specs"
OUT="src/generated"
mkdir -p "$OUT"

# api-name : spec-file
map="
eoi EOI.yaml
benefits Benefits.yaml
policy Policy.yaml
retail Retail.yaml
groupRatingQuoting GroupRatingQuoting.yaml
hmb HMB.yaml
underwriting UnderwritingDataSvc.json
dentalProvider GroupDentalProvider.yaml
gpsIllustration GPSIllustration.yaml
vob VOB.yaml
prefill eSuitePrefill.json
"

echo "$map" | while read -r name file; do
  [ -z "$name" ] && continue
  npx --yes openapi-typescript "$SPECS_DIR/$file" -o "$OUT/$name.ts" \
    | grep -E '🚀|error' || true
done
echo "✔ generated $(ls "$OUT" | wc -l) API type modules into $OUT"
