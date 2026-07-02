# Design: Reusable scale-to-zero Fargate backend (web-platform capability + pkmn as first consumer)

**Status:** DRAFT — awaiting approval
**Date:** 2026-07-02
**Author:** Petter Andersson (with Claude)

## Goal

Host the Pokémon Auto Chess backend on AWS as cheaply as possible: **asleep (≈ $0) most
of the time**, **woken automatically when a user opens the frontend**, and **scaled back
down when nobody has played for a while**. Crucially, the wake/scaledown machinery is built
as a **reusable capability owned by `web-platform`**, with pkmn as its **first consumer** —
so the generic infra is separated from pkmn specifics and can serve future projects.

## Decisions (locked)

- **Compute:** ECS Fargate service, `desiredCount` 0↔1. True ~$0 idle.
- **TLS/WSS:** CloudFront reusing the existing `*.petterbuilds.com` wildcard cert (no ALB,
  no per-service cert).
- **Subdomains:** `pkmn.petterbuilds.com` (frontend) + `pkmn-api.petterbuilds.com` (backend).
- **Reuse model:** a **CDK construct library** in `web-platform`. web-platform exports a
  `WakeableFargateService` construct (with the waker/sleeper/DNS-updater Lambda code
  bundled). pkmn keeps a thin `infra/` CDK app that imports it via a local path dependency
  (`file:../web-platform`) and instantiates it. pkmn owns its own deploy.
- **Account:** personal AWS account (`AWS_PROFILE=private`, `eu-north-1`; certs `us-east-1`).

## Non-goals

- No new frontend hosting infrastructure — deploy via web-platform's `deploy-app.sh`.
- No HA / multi-instance scaling. One task is enough.
- No persistence of game state across restarts (in-memory, ephemeral by design).

## Decomposition — two specs, two plans

This work spans two repos and is split into two independently-shippable sub-projects.
**Spec A ships first** (the reusable capability); **Spec B** consumes it.

---

## Spec A — `web-platform`: `WakeableFargateService` construct

A reusable CDK construct that turns any container image into a scale-to-zero,
wake-on-demand HTTPS/WSS service on `<app-id>-api.petterbuilds.com`, with **no pkmn
knowledge**.

### What the construct provisions (given: image, app-id, healthPath, idle grace)

- **ECS cluster + Fargate service** (`desiredCount: 0`, public subnet + public IP, SG open
  on the container port). CPU/mem are props (default 0.25 vCPU / 1 GB).
- **CloudFront distribution:** alt-name `<app-id>-api.petterbuilds.com`, wildcard cert
  (looked up), custom origin `origin-<app-id>.petterbuilds.com` over HTTP, behavior with
  WebSocket + all methods, cache disabled except an optional long-TTL static path.
  Route53 record for the alt-name.
- **Waker Lambda** + **Function URL** (CORS locked to the app's frontend origin): sets
  `desiredCount=1` if 0; returns `waking`/`ready`.
- **DNS-updater Lambda** + EventBridge rule on `ECS Task State Change` (RUNNING): reads the
  task ENI public IP, upserts the `origin-<app-id>` A record (TTL 60).
- **Sleeper Lambda** + EventBridge schedule (~5 min): `GET <healthPath>`; scales to 0 when
  the app reports idle beyond the grace window (never sleeps an active session).

### Construct interface (sketch)

```ts
new WakeableFargateService(this, 'PkmnBackend', {
  appId: 'pkmn',                       // → pkmn-api.petterbuilds.com, origin-pkmn, cluster names
  image: ecs.ContainerImage.fromAsset('...'),  // or fromEcrRepository
  containerPort: 8000,
  healthPath: '/health',               // must return { activeSessions, lastActivityTs }
  idleGraceMinutes: 15,
  cpu: 256, memoryMiB: 1024,
  frontendOrigin: 'https://pkmn.petterbuilds.com',  // waker CORS + backend CORS
});
// exposes: .wakerFunctionUrl, .apiDomainName
```

### Lambda handlers (generic, parameterized by env/props)

- `waker/` — `ecs:UpdateService desiredCount=1`; returns readiness JSON.
- `dns-updater/` — from an ECS task-state event, resolve public IP via ENI, `route53
  ChangeResourceRecordSets` upsert.
- `sleeper/` — fetch health URL; `ecs:UpdateService desiredCount=0` when idle.

All three are small Node handlers, unit-testable in isolation, with least-privilege IAM
scoped by the construct.

### Packaging for cross-repo reuse

- web-platform's `package.json` gains a library export (`main`/`exports` → compiled
  `lib/index.js`) so `WakeableFargateService` is importable. It remains a deployable CDK
  app as today.
- Consumers add `"@petterbuilds/web-platform": "file:../web-platform"` (local sibling
  dependency). Both repos pin the same `aws-cdk-lib` major.

### Spec A testing

- Jest unit tests per Lambda handler (mock AWS SDK): waker sets desiredCount, sleeper
  respects idle grace, dns-updater upserts the right record.
- `cdk synth` assertion test: instantiating the construct yields the ECS service, the
  CloudFront alt-name, and the three Lambdas + rules (matches web-platform's test style).

---

## Spec B — `pkmn_auto_chess`: first consumer

### 1. Backend app changes (`src/index.js`)

- `server.listen(process.env.PORT || 8000, '0.0.0.0', …)`.
- Add `GET /health` → `{ ok, activeSessions, lastActivityTs }`, sourced from
  `session.js` / `socketcontroller.js` (count live sessions; stamp activity on connect,
  disconnect, and round tick).
- Lock CORS `origin` to `frontendOrigin` (env-driven; `*` retained for local dev).
- No game-logic changes.

### 2. Container

- `Dockerfile` adapted from the `add-cdk-infra` branch (fix `CMD`, drop stray
  `> output.out`). `.dockerignore` excludes `app/`, `node_modules`, test assets. Built via
  the construct's `fromAsset` (or pushed to ECR).

### 3. pkmn `infra/` (thin CDK app)

- Imports `WakeableFargateService` from web-platform and instantiates it with `appId:
  'pkmn'`, the Dockerfile image, `healthPath: '/health'`, `frontendOrigin:
  'https://pkmn.petterbuilds.com'`.
- A `deploy.sh` that builds the image and `cdk deploy`s (personal profile).

### 4. Frontend (`app/`, deployed via web-platform)

- `app/src/socket.js`: replace the derived URL with `import.meta.env.VITE_BACKEND_URL`
  (default `http://localhost:8000`), force `transports:['websocket']`.
- **Wake gate:** on load, call the construct's waker Function URL, show a "waking the
  server…" state, poll `/health` until ok, then connect. Folds into the existing
  `/sprites` retry loop in `socket.js`.
- `app/.env.production` → `VITE_BACKEND_URL=https://pkmn-api.petterbuilds.com` and the
  waker URL (or fetch both from an emitted config).
- Copy `web-platform/scripts/deploy-app.sh` → `app/scripts/deploy-app.sh` (app-id `pkmn`
  baked in); add `"deploy": "npm run build && scripts/deploy-app.sh pkmn dist"`.

### 5. Cleanup

- Delete branches `add-github-pages-deploy` and `add-cdk-infra`; remove
  `.github/workflows/deploy-frontend.yml`.

### Spec B testing

- Unit-test `/health` active-session counting (`rewire`, like `test/game_test.js`);
  existing `npm test` stays green.
- End-to-end smoke on the personal account: cold-open `pkmn.petterbuilds.com` → observe
  wake → play → auto-sleep; confirm `wss://` connects through CloudFront.

---

## Wake / cold-start sequence

1. Browser opens `https://pkmn.petterbuilds.com` (web-platform static host).
2. Frontend calls the waker Function URL → `desiredCount=1`.
3. Fargate pulls image + boots Node + loads ~14 MB sprites (~30–60 s). Task RUNNING →
   EventBridge → DNS-updater sets `origin-pkmn` to the task IP.
4. Frontend polls `GET /health` via CloudFront until `ok`, then connects `wss://`.
5. Idle: sleeper sees no active sessions past the grace window → `desiredCount=0`.

## Cost estimate (personal account, eu-north-1)

- **Idle:** ECR + CloudFront + Lambda/EventBridge ≈ **< $1/mo** (no running task).
- **Active:** 0.25 vCPU / 1 GB ≈ **~$0.012/hr**. No ALB, no always-on IPv4, no per-service cert.

## Risks / open questions

- **CloudFront + Socket.io:** WebSocket passthrough is supported; forcing
  `transports:['websocket']` avoids long-poll affinity. Verify the handshake through
  CloudFront in the smoke test.
- **Cold-start latency (~30–60 s):** user-visible; the wake gate must make it feel
  intentional. Later optimization: serve the 14 MB sprites as a static asset from
  CloudFront/S3 to shrink boot time.
- **Cross-repo CDK coupling:** `file:../web-platform` requires both repos present locally
  and CDK-version-aligned. Acceptable for personal sibling repos; revisit publishing a real
  package if a third consumer appears.
- **DNS-updater race:** frontend connects only after `/health` is ok (not merely when the
  waker returns), which only resolves once DNS + task are both live.
