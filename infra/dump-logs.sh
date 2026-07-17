#!/usr/bin/env bash
#
# Quick access to the pkmn backend logs — dump to a local file, follow live, or open
# in the CloudWatch console. Resolves log-group names dynamically (they carry random
# suffixes that change if the stack is recreated).
#
# Usage:
#   infra/dump-logs.sh <task|waker|sleeper|dns> [--follow] [--browser] [--since <dur>]
#
# Examples:
#   infra/dump-logs.sh task                 # dump last 15m of game-server logs to a file
#   infra/dump-logs.sh task --follow        # stream live
#   infra/dump-logs.sh sleeper --browser    # open the sleeper Lambda logs in the browser
#   infra/dump-logs.sh waker --since 1h     # last hour of waker Lambda logs
#
# Env: AWS_PROFILE (default private), AWS_REGION (default eu-north-1)
set -euo pipefail
export AWS_PROFILE="${AWS_PROFILE:-private}"
export AWS_REGION="${AWS_REGION:-eu-north-1}"

COMP="${1:?usage: dump-logs.sh <task|waker|sleeper|dns> [--follow] [--browser] [--since <dur>]}"
shift || true
FOLLOW=0; BROWSER=0; SINCE="15m"
while [ $# -gt 0 ]; do
  case "$1" in
    --follow) FOLLOW=1 ;;
    --browser) BROWSER=1 ;;
    --since) SINCE="$2"; shift ;;
    *) echo "unknown arg: $1" >&2; exit 1 ;;
  esac
  shift
done

case "$COMP" in
  task)    PATTERN="TaskDefappLogGroup" ;;   # the game server (Express + Socket.io) stdout
  waker)   PATTERN="BackendWaker" ;;
  sleeper) PATTERN="BackendSleeper" ;;
  dns)     PATTERN="BackendDnsUpdater" ;;
  *) echo "unknown component: $COMP (use task|waker|sleeper|dns)" >&2; exit 1 ;;
esac

GROUP=$(aws logs describe-log-groups \
  --query "logGroups[?contains(logGroupName,'$PATTERN')].logGroupName | [0]" --output text)
[ -n "$GROUP" ] && [ "$GROUP" != "None" ] || { echo "no log group matching '$PATTERN'" >&2; exit 1; }
echo "→ log group: $GROUP"

if [ "$BROWSER" = 1 ]; then
  ENC=${GROUP//\//\$252F}   # CloudFront console encodes '/' as $252F in the URL fragment
  URL="https://${AWS_REGION}.console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#logsV2:log-groups/log-group/${ENC}"
  echo "→ opening $URL"
  open "$URL"
  exit 0
fi

if [ "$FOLLOW" = 1 ]; then
  echo "→ following live (Ctrl-C to stop)…"
  exec aws logs tail "$GROUP" --follow --format short
fi

OUT="/tmp/pkmn-${COMP}-logs.log"
aws logs tail "$GROUP" --since "$SINCE" --format short > "$OUT" 2>&1
echo "→ wrote $OUT ($(wc -l < "$OUT" | tr -d ' ') lines, last $SINCE)"
echo "  open it:  code $OUT"
