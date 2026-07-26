#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
export AWS_PROFILE="${AWS_PROFILE:-private}"
export AWS_REGION="${AWS_REGION:-eu-north-1}"        # private profile has no region → pin it
export CDK_DEFAULT_ACCOUNT="${CDK_DEFAULT_ACCOUNT:-873163838676}"
export CDK_DEFAULT_REGION="${CDK_DEFAULT_REGION:-eu-north-1}"

cd "$SCRIPT_DIR"
npm ci
npx cdk deploy PkmnBackend --require-approval never "$@"
echo ""
echo "→ Backend deployed. The frontend derives the wake endpoint from VITE_BACKEND_URL,"
echo "   so there is nothing to copy. Ship it with:  cd app && npm run deploy"
