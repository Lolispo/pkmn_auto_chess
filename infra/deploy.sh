#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
REGION="${AWS_REGION:-eu-north-1}"

echo "=== Building frontend ==="
cd "$PROJECT_ROOT/app"
npm ci
npm run build

echo ""
echo "=== Deploying CDK stack (region: $REGION) ==="
cd "$SCRIPT_DIR"
npm ci
npx cdk deploy --context region="$REGION" --require-approval never "$@"
