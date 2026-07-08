#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
export AWS_PROFILE="${AWS_PROFILE:-private}"
export CDK_DEFAULT_ACCOUNT="${CDK_DEFAULT_ACCOUNT:-873163838676}"
export CDK_DEFAULT_REGION="${CDK_DEFAULT_REGION:-eu-north-1}"

cd "$SCRIPT_DIR"
npm ci
npx cdk deploy PkmnBackend --require-approval never "$@"
echo ""
echo "→ Copy the WakerUrl output into app/.env.production (VITE_WAKER_URL), then: cd app && npm run deploy"
