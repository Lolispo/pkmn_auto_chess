# Debugging & logs

Where the backend logs live and how to get at them fast — to a local file or in the browser.

## TL;DR

```bash
infra/dump-logs.sh task            # dump last 15m of game-server logs → /tmp/pkmn-task-logs.log
infra/dump-logs.sh task --follow   # stream live
infra/dump-logs.sh task --browser  # open in the CloudWatch console
```
Components: `task` (game server), `waker`, `sleeper`, `dns` (the three Lambdas).
Flags: `--follow`, `--browser`, `--since <dur>` (e.g. `1h`, `30m`). Files open with `code /tmp/pkmn-<comp>-logs.log`.

## What's where

The backend is scale-to-zero Fargate; the game server's stdout and the three orchestration
Lambdas all log to CloudWatch (region `eu-north-1`, account `private`). Log-group names carry
random CDK suffixes, so `dump-logs.sh` resolves them dynamically — don't hardcode them.

| Component | What it logs | Group pattern |
|---|---|---|
| `task` | Game server (Express + Socket.io): boot (`connected to port 8000!`), `/sprites` + `/unitJson` fetches, socket/game events | `…TaskDefappLogGroup…` |
| `waker` | Wake requests (`GET` status / `POST` wake) | `/aws/lambda/…BackendWaker…` |
| `sleeper` | Idle scale-down decisions + daily backstop | `/aws/lambda/…BackendSleeper…` |
| `dns` | Points `origin-pkmn` at the task IP on wake | `/aws/lambda/…BackendDnsUpdater…` |

## Notes

- **The server sleeps when idle**, so to capture a fresh *startup* you must wake it first
  (open https://pkmn.petterbuilds.com and click "Wake server", or `curl -X POST <waker-url>`),
  wait ~70–100s, then dump `task`. A bare wake only logs `connected to port 8000!` — request
  logging appears once the frontend actually loads sprites / connects a socket.
- **In the browser:** `infra/dump-logs.sh <comp> --browser` opens that group in CloudWatch.
  From there, "Live Tail" streams in real time.
- Endpoints for reference: frontend `https://pkmn.petterbuilds.com`, API
  `https://pkmn-api.petterbuilds.com`, health `…/health`.
- Env overrides: `AWS_PROFILE` (default `private`), `AWS_REGION` (default `eu-north-1`).

See `docs/architecture.md` for how the pieces fit together.
