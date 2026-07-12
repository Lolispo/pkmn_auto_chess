# Todos: server status visibility + wake control (candidate Spec C)

**Status:** DONE — all todos shipped + validated live (2026-07-12)
**Date:** 2026-07-12

## Progress (2026-07-12)

- ✅ **Todo 1 — wake button:** auto-wake removed; "▶ Wake server" button live.
- ✅ **Todo 2 — status + lastOnline:** waker `GET`/`POST`; `lastOnline` SSM param written by
  the sleeper; frontend status panel. Validated live (`GET` reports state without waking).
- ✅ **Todo 3 — wake-time measurement:** frontend times wake→connected, logs + shows
  "⚡ Server woke in Ns". Observed cold start ~70–100s.
- ✅ **Todo 4 — `validate-wake.sh`:** generic reusable script in `web-platform/scripts`
  (args: api-url/waker-url/cluster/service/cycles). Live run: **3/3 healthy, 0 failures**;
  only confirmed cold starts count toward timing (stale-task cycles are flagged).
- ✅ **Todo 5 — shutdown validation:** confirmed a real `desiredCount → 0` and a real
  `lastOnline` timestamp written + reported while offline.
- ✅ **Backstop:** daily 04:00 UTC force-scale-down catches stuck/unreachable tasks
  (bounds runaway to <24h), never kills a task with connected players. DNS-updater retries
  the public-IP lookup in-Lambda. web-platform tests 21/21.
- ✅ **Budget alarm:** account-wide AWS Budget (`petterbuilds-monthly`, $10/mo, us-east-1)
  in `web-platform` (`BudgetStack`), emails at 80% actual + 100% forecast. Deployed.

**Ownership:** wake-time = frontend (pkmn); validate script + budget = web-platform.

---

**Context:** Follows the scale-to-zero backend (design `2026-07-02-aws-scale-to-zero-backend-design.md`).
The backend is live and wakes/sleeps correctly; these items make its state **visible and
user-controlled**, and **validate** the mechanics we haven't measured yet.

Chosen design decision (status source): **A — extend the waker Lambda (GET reports status,
POST wakes) + persist `lastOnline` in SSM**, written by the sleeper on shutdown. Rationale:
Lambdas are always available (work while the Fargate task is down), it's live-accurate
(reads ECS desired/running counts), reuses the existing waker Function URL, and an SSM
Standard parameter is free. Reusable pieces live in `web-platform`'s construct; pkmn consumes.

---

## Todo 1 — Wake on button press (remove auto-wake)

**Problem:** `wakeBackend()` currently fires in `app/src/index.jsx` on every page load, so any
visitor (or a link-preview bot) triggers a paid wake.

**Change:** remove the auto-call; add a **"▶ Wake server"** button in the main-menu loading
area. Click → POST waker → existing connect + `/health` poll + "Waking up server 💤" state
takes over. Disable the button while `state === 'waking'`.

**Files:** `app/src/index.jsx` (drop the auto `wakeBackend()`), `app/src/App.jsx` (button in
the `!connected` branch, wired to `wakeBackend()`).

**Effort:** S. **Depends on:** none (works with today's waker).

---

## Todo 2 — Always-available server status + "last online"

**Problem:** status must be visible when the backend is **off**, so it can't come from the
backend. Users (esp. the owner) want: current state (offline / waking / online) and when it
was last online.

**Design (source A):**
- **Waker Lambda becomes GET+POST:**
  - `GET` → `{ state, desiredCount, runningCount, lastOnline }` where `state` is derived:
    `online` (runningCount≥1), `waking` (desiredCount≥1, runningCount=0), else `offline`.
    Does **not** wake.
  - `POST` → wake (set desiredCount=1), as today.
- **`lastOnline` persistence:** an SSM Standard parameter, e.g. `/pkmn/last-online`.
  - The **sleeper** writes `lastOnline = now` (ISO) when it scales the service to 0.
  - (Optional) a heartbeat: while online, sleeper/health-check refreshes it so a crash still
    leaves a recent value.
- **Frontend:** on load, `GET` the waker URL → render "Server offline · last online 2h ago ·
  [Wake server]" / "Waking… (Ns)" / "Online". Poll `GET` (or `/health`) during wake.

**IAM added:** waker Lambda `ssm:GetParameter` on `/pkmn/last-online`; sleeper Lambda
`ssm:PutParameter` on same. (Construct creates the param + wires both.)

**Construct API additions (`WakeableFargateService`):** create the SSM param, pass its name
to waker (read) + sleeper (write), and give the waker a GET branch. Consumer unchanged beyond
reading the same Function URL with GET.

**Files:** `web-platform/lambda/waker/index.ts` (GET/POST split + SSM read),
`web-platform/lambda/sleeper/index.ts` (SSM write on scale-down),
`web-platform/lib/wakeable-fargate-service.ts` (SSM param + IAM + env), tests for both;
`app/src/App.jsx` + `app/src/socket.js` (status fetch + render).

**Effort:** M. **Open Q:** SSM param vs DynamoDB (SSM chosen — free, single value is enough).

---

## Todo 3 — Measure wake time (cold-start duration)

**Goal:** turn the one-off "~90s" observation into a tracked number.

**Approach:**
- **Frontend:** time from wake-click → first successful `/health`; `console.log` + show it
  ("ready in 82s"). Cheap, immediately useful.
- **Central (optional):** waker stores `wakeStartedAt` (SSM/return value); `GET` status exposes
  elapsed; or backend emits a CloudWatch metric on boot (task start → first request).

**Files:** `app/src/socket.js` (timing around the wake→connect), optional construct/Lambda.

**Effort:** S (frontend only) / M (central metric).

---

## Todo 4 — Validate wake reliability ("starts every time")

**Goal:** evidence it cold-starts consistently, with distribution of durations.

**Approach:** `infra/validate-wake.sh` — loop N times: force sleep (desiredCount=0, wait
running=0) → POST waker → poll `/health` through CloudFront → record duration + pass/fail →
print summary (count, median, max, failures). Reuses the commands already used in manual
testing.

**Files:** `infra/validate-wake.sh`.

**Effort:** S. **Note:** each cycle costs a real cold start (~1–2 min); keep N small (e.g. 5).

---

## Todo 5 — Validate the shut-off mechanic end-to-end

**Problem:** the sleeper's *decision* was verified, but we never observed an actual
`desiredCount → 0` after the 15-min idle grace.

**Approach:** either (a) temporarily set `idleGraceMinutes` low (e.g. 1) and watch the scheduled
sleeper scale to 0, or (b) fold into `validate-wake.sh`: after a wake with no sockets, wait
`grace + schedule` and assert `desiredCount == 0` and `/health` becomes unreachable. Restore
grace to 15 after.

**Files:** `infra/validate-wake.sh` (shutdown-assert path).

**Effort:** S–M (bounded by real wall-clock waits).

---

## Suggested sequencing

1. Todo 1 (button) — independent, immediate UX win, cuts accidental wakes.
2. Todo 2 (status + lastOnline) — the substantive one; construct + frontend.
3. Todos 3–5 (measure + validate) — instrumentation/validation, partly a shared script.

Todos 2–3 touch the `web-platform` construct → same two-repo split (construct change + pkmn
consumes). If we build these, promote this doc to a proper Spec C design + implementation plan.
