#!/usr/bin/env bash
#
# Manual control for the scale-to-zero pkmn backend. Safe to run anytime.
#
# Usage:
#   infra/server.sh status              # is it awake? last online?
#   infra/server.sh start               # wake it (scale to 1), wait until healthy
#   infra/server.sh stop                # sleep it now (scale to 0)
#   infra/server.sh logs [task|waker|sleeper|dns] [--follow|--browser|--since <dur>]
#
# start/stop just set the ECS desiredCount; the normal sleeper/backstop still apply.
# Env: AWS_PROFILE (default private), AWS_REGION (default eu-north-1)
set -euo pipefail
export AWS_PROFILE="${AWS_PROFILE:-private}"
export AWS_REGION="${AWS_REGION:-eu-north-1}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
API_URL="https://pkmn-api.petterbuilds.com"
LAST_ONLINE_PARAM="/pkmn/last-online"

cluster() {
  aws ecs list-clusters --query "clusterArns[?contains(@,'PkmnBackend')] | [0]" --output text
}
service_of() {
  aws ecs list-services --cluster "$1" --query "serviceArns[0]" --output text
}
counts() { # <cluster> <service> -> "desired running"
  aws ecs describe-services --cluster "$1" --services "$2" \
    --query "services[0].[desiredCount,runningCount]" --output text
}

CMD="${1:?usage: server.sh <status|start|stop|logs>}"; shift || true

case "$CMD" in
  status)
    CL=$(cluster); SVC=$(service_of "$CL")
    read -r DES RUN <<<"$(counts "$CL" "$SVC")"
    LAST=$(aws ssm get-parameter --name "$LAST_ONLINE_PARAM" --query Parameter.Value --output text 2>/dev/null || echo "unknown")
    STATE="offline"; [ "${DES:-0}" -ge 1 ] && STATE="waking"; [ "${RUN:-0}" -ge 1 ] && STATE="online"
    echo "state:       $STATE (desired=$DES running=$RUN)"
    echo "last online: $LAST"
    if curl -sf --max-time 5 "$API_URL/health" >/dev/null 2>&1; then
      echo "health:      OK ($API_URL/health)"
    else
      echo "health:      unreachable"
    fi
    ;;

  start)
    CL=$(cluster); SVC=$(service_of "$CL")
    echo "→ starting ($SVC)…"
    aws ecs update-service --cluster "$CL" --service "$SVC" --desired-count 1 >/dev/null
    start=$(date +%s)
    until curl -sf --max-time 5 "$API_URL/health" >/dev/null 2>&1; do
      el=$(($(date +%s) - start)); [ "$el" -gt 240 ] && { echo "✗ not healthy after ${el}s"; exit 1; }
      echo "  [${el}s] booting…"; sleep 10
    done
    echo "✅ online in $(($(date +%s) - start))s — $API_URL"
    ;;

  stop)
    CL=$(cluster); SVC=$(service_of "$CL")
    echo "→ sleeping ($SVC)…"
    aws ecs update-service --cluster "$CL" --service "$SVC" --desired-count 0 >/dev/null
    start=$(date +%s)
    until [ "$(aws ecs describe-services --cluster "$CL" --services "$SVC" --query 'services[0].runningCount' --output text)" = "0" ]; do
      [ $(($(date +%s) - start)) -gt 120 ] && { echo "… still draining (desiredCount is 0, task will stop shortly)"; break; }
      sleep 6
    done
    echo "✅ asleep (desiredCount=0) — ~\$0 idle"
    ;;

  logs)
    exec "$SCRIPT_DIR/dump-logs.sh" "$@"
    ;;

  *)
    echo "unknown command: $CMD (use status|start|stop|logs)" >&2; exit 1 ;;
esac
