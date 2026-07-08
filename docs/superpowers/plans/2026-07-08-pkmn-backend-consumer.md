# pkmn Backend Consumer Implementation Plan (Spec B)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `pkmn_auto_chess` the first consumer of web-platform's `WakeableFargateService`: a health-reporting containerized backend on `pkmn-api.petterbuilds.com` that sleeps when idle, and a frontend (served at `pkmn.petterbuilds.com`) that connects over `wss://` and wakes the backend on load.

**Architecture:** Add a `GET /health` endpoint + activity tracking to the Node/Socket.io backend; containerize it; add a thin `infra/` CDK app that imports `WakeableFargateService` (via `file:../web-platform`) and feeds it the container image + the wildcard cert ARN from SSM; refactor the frontend's hardcoded insecure socket URL to a configurable `wss://` endpoint with a wake trigger; deploy the frontend through web-platform's `deploy-app.sh`.

**Tech Stack:** Node.js 22 + Express + Socket.io (backend, plain JS), Mocha + rewire (backend tests), AWS CDK TypeScript (infra, consuming web-platform), React 18 + Vite 6 (frontend).

## Global Constraints

- Personal AWS account only: `AWS_PROFILE=private` (account 873163838676), region `eu-north-1`. Never Tendium.
- Subdomains: frontend `pkmn.petterbuilds.com`, backend `pkmn-api.petterbuilds.com`.
- Backend stays plain JavaScript (no TypeScript); snake_case allowed; console logging allowed (matches CLAUDE.md).
- Backend `GET /health` MUST return `{ activeSessions: number, lastActivityTs: number }` — the exact contract web-platform's sleeper Lambda reads.
- Frontend must never hardcode `http://…:8000`; the backend URL comes from `import.meta.env.VITE_BACKEND_URL` (Socket.io upgrades the `https://` origin to `wss://`).
- Depends on Spec A being deployed: `WakeableFargateService` is exported from web-platform and `/platform/wildcard-cert-arn` exists in SSM (already deployed).
- Container image data files: the backend needs the root `*.json` (`pokemon.json`, `pokemonAbilities.json`, `pokemonSprites.json`, `pokemonTypes.json`) — the `.dockerignore` must NOT exclude them.

---

### Task 1: Backend `/health` activity tracking

**Files:**
- Modify: `src/socketcontroller.js` (module scope near line 12; `GIVE_ID` handler ~line 94; `disconnect` handler ~line 151; export at ~line 82 / end of file)
- Test: `test/health_test.js`

**Interfaces:**
- Produces: `require('./socketcontroller').getActivity()` → `{ activeSessions: number, lastActivityTs: number }`. `activeSessions` is the count of currently connected sockets (`connectedPlayers.size`); `lastActivityTs` is `Date.now()` of the most recent connect or disconnect. Module-level `let lastActivityTs` and a `touch()` helper are added.

- [ ] **Step 1: Write the failing test**

`test/health_test.js`:
```js
const assert = require('assert');
const rewire = require('rewire');
const { Map } = require('immutable');

describe('socketcontroller health', () => {
  it('getActivity reports connected socket count and last activity timestamp', () => {
    const sc = rewire('../src/socketcontroller');
    sc.__set__('connectedPlayers', Map({ a: Map({}), b: Map({}) }));
    sc.__set__('lastActivityTs', 42);
    const health = sc.getActivity();
    assert.strictEqual(health.activeSessions, 2);
    assert.strictEqual(health.lastActivityTs, 42);
  });

  it('getActivity reports zero when nobody is connected', () => {
    const sc = rewire('../src/socketcontroller');
    sc.__set__('connectedPlayers', Map({}));
    const health = sc.getActivity();
    assert.strictEqual(health.activeSessions, 0);
    assert.strictEqual(typeof health.lastActivityTs, 'number');
  });

  it('touch updates lastActivityTs', () => {
    const sc = rewire('../src/socketcontroller');
    sc.__set__('lastActivityTs', 0);
    sc.__get__('touch')();
    assert.ok(sc.__get__('lastActivityTs') > 0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx mocha --exit test/health_test.js`
Expected: FAIL — `sc.getActivity is not a function`.

- [ ] **Step 3: Add module-level state + touch (near line 12, after `let sessions = Map({});`)**

```js
let lastActivityTs = Date.now();
const touch = () => { lastActivityTs = Date.now(); };
```

- [ ] **Step 4: Call `touch()` on connect and disconnect**

In the `GIVE_ID` handler, right after `connectedPlayers = connectedPlayers.set(socket.id, newUser);`:
```js
    touch();
```
In the `disconnect` handler, right after `connectedPlayers = connectedPlayers.delete(socket.id);`:
```js
      touch();
```

- [ ] **Step 5: Export `getActivity` (at the end of the file, after the `module.exports = (socket, io) => {...};` block)**

```js
module.exports.getActivity = () => ({
  activeSessions: connectedPlayers.size,
  lastActivityTs,
});
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx mocha --exit test/health_test.js`
Expected: PASS (3 passing).

- [ ] **Step 7: Run full backend test + lint**

Run: `npm test && npm run lint`
Expected: existing tests still pass; eslint clean (no-console and camelcase are off, so `touch`/`lastActivityTs` are fine).

- [ ] **Step 8: Commit**

```bash
git add src/socketcontroller.js test/health_test.js
git commit -m "feat: expose getActivity (connected count + last activity) for /health"
```

---

### Task 2: `/health` endpoint + PORT/CORS env in `index.js`

**Files:**
- Modify: `src/index.js`
- Test: `test/health_endpoint_test.js`

**Interfaces:**
- Consumes: `require('./socketcontroller').getActivity()` (Task 1).
- Produces: `require('./index').app` (the Express app, exported for testing); `GET /health` → `200 { ok: true, activeSessions, lastActivityTs }`. Server binds `process.env.PORT || 8000` on `0.0.0.0`, and only calls `listen` when run directly.

- [ ] **Step 1: Write the failing test**

`test/health_endpoint_test.js`:
```js
const assert = require('assert');

describe('GET /health', () => {
  it('returns ok with activity fields', async () => {
    const { app } = require('../src/index');
    const server = app.listen(0);
    const { port } = server.address();
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.ok, true);
      assert.strictEqual(typeof body.activeSessions, 'number');
      assert.strictEqual(typeof body.lastActivityTs, 'number');
    } finally {
      server.close();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx mocha --exit test/health_endpoint_test.js`
Expected: FAIL — `Cannot destructure property 'app'` (index.js does not export `app`) or the process hangs because `index.js` calls `listen(8000)` at import. This confirms the refactor is needed.

- [ ] **Step 3: Add the health route (in `src/index.js`, after the existing `router.get('/unitJson', …)` block)**

```js
const socketControllerModule = require('./socketcontroller.js');

router.get('/health', (req, res) => {
  res.json({ ok: true, ...socketControllerModule.getActivity() });
});
```
Note: `index.js` already has `const socketController = require('./socketcontroller.js');` — reuse that require instead of adding a second one:
```js
router.get('/health', (req, res) => {
  res.json({ ok: true, ...socketController.getActivity() });
});
```

- [ ] **Step 4: Make listen configurable and conditional; export `app`**

Replace:
```js
server.listen(8000, () => console.log('connected to port 8000!'));
```
with:
```js
const PORT = process.env.PORT || 8000;
if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => console.log(`connected to port ${PORT}!`));
}

module.exports = { app, server };
```

- [ ] **Step 5: Lock CORS origin via env (optional hardening, keep `*` default for dev)**

Change the Socket.io `cors` origin:
```js
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
});
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx mocha --exit test/health_endpoint_test.js`
Expected: PASS (1 passing). The `--exit` flag guarantees mocha exits even though the app required socket.io.

- [ ] **Step 7: Full test + lint + smoke-run**

Run: `npm test && npm run lint`
Expected: all green.
Run (manual smoke): `PORT=8123 node src/index.js &` then `curl -s localhost:8123/health` → `{"ok":true,"activeSessions":0,"lastActivityTs":...}`; then `kill %1`.

- [ ] **Step 8: Commit**

```bash
git add src/index.js test/health_endpoint_test.js
git commit -m "feat: GET /health endpoint, PORT env, 0.0.0.0 bind, exportable app"
```

---

### Task 3: Backend container

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`

**Interfaces:**
- Produces: a Docker build context (repo root) that builds a Node 22 image running `node src/index.js`, listening on `$PORT` (default 8000), including the root `*.json` data files.

- [ ] **Step 1: Write the Dockerfile**

`Dockerfile`:
```dockerfile
# Backend image for pkmn_auto_chess (Express + Socket.io game server).
FROM node:22-slim
WORKDIR /usr/src/app

# Install only production deps against the root package.json/package-lock.json.
COPY package*.json ./
RUN npm ci --omit=dev

# App source + the root pokemon *.json data files the backend loads at boot.
COPY src ./src
COPY *.json ./

ENV PORT=8000
EXPOSE 8000
CMD ["node", "src/index.js"]
```

- [ ] **Step 2: Write `.dockerignore`**

`.dockerignore`:
```
node_modules
app
infra
test
docs
.git
.omc
.github
*.md
```
(Keeps the root `*.json` data files — they are required at boot.)

- [ ] **Step 3: Build to verify it works**

Run: `docker build -t pkmn-backend .`
Expected: build succeeds.

- [ ] **Step 4: Run the container and hit /health**

Run: `docker run --rm -d -p 8124:8000 --name pkmn-test pkmn-backend && sleep 3 && curl -s localhost:8124/health && docker stop pkmn-test`
Expected: `{"ok":true,"activeSessions":0,"lastActivityTs":...}`.

- [ ] **Step 5: Commit**

```bash
git add Dockerfile .dockerignore
git commit -m "feat: backend Dockerfile + dockerignore (node 22, serves /health)"
```

---

### Task 4: `infra/` CDK app consuming WakeableFargateService

**Files:**
- Create: `infra/package.json`
- Create: `infra/tsconfig.json`
- Create: `infra/cdk.json`
- Create: `infra/.gitignore`
- Create: `infra/bin/pkmn-infra.ts`
- Create: `infra/lib/backend-stack.ts`

**Interfaces:**
- Consumes: `WakeableFargateService` from `web-platform` (Spec A); `/platform/wildcard-cert-arn` from SSM; the root `Dockerfile` (Task 3).
- Produces: a deployable `PkmnBackend` stack; stack output `WakerUrl` (the Lambda Function URL the frontend calls).

- [ ] **Step 1: Create `infra/package.json`**

```json
{
  "name": "pkmn-infra",
  "version": "0.1.0",
  "private": true,
  "bin": { "pkmn-infra": "bin/pkmn-infra.ts" },
  "scripts": {
    "synth": "cdk synth",
    "deploy": "cdk deploy --require-approval never",
    "cdk": "cdk"
  },
  "devDependencies": {
    "aws-cdk": "2.1128.1",
    "ts-node": "^10.9.2",
    "typescript": "~5.9.3",
    "@types/node": "^24.10.1"
  },
  "dependencies": {
    "aws-cdk-lib": "^2.260.0",
    "constructs": "^10.5.0",
    "web-platform": "file:../../web-platform"
  }
}
```
Note: `file:../../web-platform` — `infra/` is one level below the repo root, so the sibling `web-platform` is two levels up from `infra/`.

- [ ] **Step 2: Create `infra/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["es2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "inlineSourceMap": true
  },
  "exclude": ["node_modules", "cdk.out"]
}
```

- [ ] **Step 3: Create `infra/cdk.json`**

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/pkmn-infra.ts",
  "context": {
    "@aws-cdk/aws-cloudfront:defaultFunctionRuntimeV2_0": true,
    "@aws-cdk/core:newStyleStackSynthesis": true
  }
}
```

- [ ] **Step 4: Create `infra/.gitignore`**

```
node_modules
cdk.out
*.js
*.d.ts
package-lock.json
```

- [ ] **Step 5: Create `infra/lib/backend-stack.ts`**

```ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as path from 'path';
import { WakeableFargateService } from 'web-platform';

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Reuse the platform wildcard cert (published by web-platform's HostingStack).
    const certificateArn = ssm.StringParameter.valueForStringParameter(
      this,
      '/platform/wildcard-cert-arn',
    );

    // Build context is the repo root (one level up from infra/).
    const repoRoot = path.join(__dirname, '..', '..');

    new WakeableFargateService(this, 'Backend', {
      appId: 'pkmn',
      domainName: 'petterbuilds.com',
      certificateArn,
      image: ecs.ContainerImage.fromAsset(repoRoot),
      frontendOrigin: 'https://pkmn.petterbuilds.com',
      containerPort: 8000,
      healthPath: '/health',
      idleGraceMinutes: 15,
    });
  }
}
```

- [ ] **Step 6: Create `infra/bin/pkmn-infra.ts`**

```ts
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BackendStack } from '../lib/backend-stack';

const app = new cdk.App();

new BackendStack(app, 'PkmnBackend', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'eu-north-1',
  },
});
```

- [ ] **Step 7: Install (links the local web-platform construct)**

Run: `cd infra && npm install`
Expected: exits 0; `infra/node_modules/web-platform` symlink exists.

- [ ] **Step 8: Synth to verify it wires up**

Run: `cd infra && AWS_PROFILE=private CDK_DEFAULT_ACCOUNT=873163838676 npx cdk synth PkmnBackend 2>&1 | grep -c "pkmn-api.petterbuilds.com"`
Expected: ≥ 1 (the CloudFront alt-name is present). Requires Docker running (the `fromAsset` image is fingerprinted). If the HostedZone lookup needs context, run with `--profile private` so CDK can perform the lookup.

- [ ] **Step 9: Commit**

```bash
git add infra/package.json infra/tsconfig.json infra/cdk.json infra/.gitignore infra/bin/pkmn-infra.ts infra/lib/backend-stack.ts
git commit -m "feat: infra CDK app consuming WakeableFargateService for pkmn backend"
```

---

### Task 5: Frontend — configurable wss URL + wake trigger

**Files:**
- Modify: `app/src/socket.js` (lines 6-10 URL derivation; the `io(...)` call)
- Modify: `app/src/index.jsx` (bootstrap)
- Create: `app/.env.development`
- Create: `app/.env.production`

**Interfaces:**
- Consumes: `import.meta.env.VITE_BACKEND_URL`, `import.meta.env.VITE_WAKER_URL`.
- Produces: `export function wakeBackend()` in `socket.js` — fire-and-forget POST to the waker URL; called once at bootstrap.

- [ ] **Step 1: Replace the insecure URL derivation in `app/src/socket.js`**

Replace lines 6-10:
```js
const url = window.location.href;
const ip = url.split(':3000')[0].split('http://')[1];
const ipAdress = 'http://' + ip + ':8000';
console.log('Connecting to ' + ipAdress + ' ...');
const socket = io(ipAdress);
```
with:
```js
const ipAdress = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
console.log('Connecting to ' + ipAdress + ' ...');
const socket = io(ipAdress, { transports: ['websocket'] });

// Trigger the backend to wake (scale-to-zero). Fire-and-forget; the socket and
// the /sprites fetch already retry until the backend is up.
export function wakeBackend() {
  const wakerUrl = import.meta.env.VITE_WAKER_URL;
  if (!wakerUrl) return;
  fetch(wakerUrl, { method: 'POST' }).catch(() => { /* backend will wake shortly */ });
}
```
(All existing `ipAdress` references downstream — `AjaxLoadSprites`, `AjaxGetUnitJson` — keep working unchanged.)

- [ ] **Step 2: Call `wakeBackend()` at bootstrap in `app/src/index.jsx`**

Change the import:
```js
import { configureSocket, AjaxLoadSprites, wakeBackend } from './socket';
```
And before `configureSocket`:
```js
wakeBackend();
export const socket = configureSocket(store.dispatch);
AjaxLoadSprites(store.dispatch);
```

- [ ] **Step 3: Create `app/.env.development`**

```
VITE_BACKEND_URL=http://localhost:8000
```

- [ ] **Step 4: Create `app/.env.production`**

```
VITE_BACKEND_URL=https://pkmn-api.petterbuilds.com
VITE_WAKER_URL=
```
(`VITE_WAKER_URL` is filled in after Task 4's deploy prints the `WakerUrl` output — see Task 6.)

- [ ] **Step 5: Build to verify**

Run: `cd app && npm run build`
Expected: `vite build` succeeds; `app/dist/` produced.

- [ ] **Step 6: Lint**

Run: `cd app && npm run lint`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add app/src/socket.js app/src/index.jsx app/.env.development app/.env.production
git commit -m "feat: configurable wss backend URL + wake-on-load trigger"
```

---

### Task 6: Deploy wiring + docs

**Files:**
- Create: `infra/deploy.sh`
- Modify: `app/package.json` (add a `deploy` script)
- Modify: `README.md` (a short "Hosting" section)

**Interfaces:**
- Produces: `infra/deploy.sh` (build image + `cdk deploy`); `npm run deploy` in `app/` (build + web-platform `deploy-app.sh pkmn`).

- [ ] **Step 1: Create `infra/deploy.sh`**

```bash
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
```
Then: `chmod +x infra/deploy.sh`.

- [ ] **Step 2: Add the frontend deploy script to `app/package.json`**

Add to `scripts`:
```json
"deploy": "npm run build && AWS_PROFILE=private ~/HobbyProjects/web-platform/scripts/deploy-app.sh pkmn dist"
```

- [ ] **Step 3: Document the deploy flow in `README.md`**

Add a "Hosting" section:
```markdown
## Hosting (petterbuilds.com)

- **Frontend:** `https://pkmn.petterbuilds.com` via the web-platform static host.
  `cd app && npm run deploy`.
- **Backend:** scale-to-zero Fargate at `https://pkmn-api.petterbuilds.com` (wakes on
  page load, sleeps when idle). `cd infra && ./deploy.sh`.

First-time order: deploy backend → copy the `WakerUrl` output into
`app/.env.production` (`VITE_WAKER_URL`) → deploy frontend.
```

- [ ] **Step 4: Verify scripts are syntactically valid**

Run: `bash -n infra/deploy.sh && node -e "JSON.parse(require('fs').readFileSync('app/package.json'))" && echo OK`
Expected: `OK`.

- [ ] **Step 5: Commit**

```bash
git add infra/deploy.sh app/package.json README.md
git commit -m "feat: deploy scripts + hosting docs for pkmn frontend/backend"
```

---

### Task 7: Retire the superseded frontend branches

**Files:**
- Delete: `.github/workflows/deploy-frontend.yml` (if present on this branch)

**Interfaces:** none (cleanup).

- [ ] **Step 1: Remove the GitHub Pages workflow if it exists on this branch**

Run: `git rm .github/workflows/deploy-frontend.yml 2>/dev/null && git commit -m "chore: remove GitHub Pages workflow (superseded by web-platform hosting)" || echo "not present on this branch — skip"`
Expected: either a commit, or "not present on this branch — skip" (the workflow lives on `add-github-pages-deploy`, not necessarily this feature branch).

- [ ] **Step 2: Delete the two superseded local + remote branches (AFTER this work is merged)**

> Do this only once Spec B is merged to `main`, so no work is lost.
```bash
git branch -D add-github-pages-deploy add-cdk-infra
git push origin --delete add-github-pages-deploy add-cdk-infra
```
Expected: branches removed locally and on origin. (Requires the Lolispo SSH key — `core.sshCommand` is set locally per the repo convention.)

---

### Task 8: End-to-end smoke test (manual, live AWS)

**Files:** none (verification only).

**Interfaces:** validates the full Spec A + Spec B integration — including the one thing no unit test can cover: the CloudFront ↔ Socket.io `wss://` handshake.

- [ ] **Step 1: Deploy the backend**

Run: `cd infra && ./deploy.sh`
Expected: `PkmnBackend` deploys; note the `WakerUrl` output.

- [ ] **Step 2: Wire the waker URL and deploy the frontend**

Put the `WakerUrl` into `app/.env.production` (`VITE_WAKER_URL=…`), commit it, then:
Run: `cd app && npm run deploy`
Expected: "Live at https://pkmn.petterbuilds.com/".

- [ ] **Step 3: Cold-open and verify wake → connect**

Open `https://pkmn.petterbuilds.com` in a browser (backend asleep, `desiredCount 0`).
Expected within ~60 s: the waker Function URL fires, the task starts, the DNS-updater points `origin-pkmn` at the task IP, `/sprites` + `/unitJson` load, and the DevTools Network tab shows a `wss://pkmn-api.petterbuilds.com/socket.io/…` connection in status 101 (Switching Protocols). Play a round to confirm gameplay over the socket.

- [ ] **Step 4: Verify auto-sleep**

Close all tabs. After ~15 min idle grace + the sleeper's 5-min schedule, check:
Run: `aws ecs describe-services --cluster <clusterArn> --services <svc> --profile private --query "services[0].desiredCount"`
Expected: `0` (scaled back down).

- [ ] **Step 5: Record the outcome**

Note in the PR/commit: cold-start time observed, WSS handshake confirmed, auto-sleep confirmed. If the WSS handshake fails through CloudFront, the fallback is to add an `OriginRequestPolicy`/cache-policy tweak point fix or fall back to a Caddy-sidecar TLS model (see design doc risks) — capture findings for a follow-up.

---

## Self-Review

**Spec coverage (Spec B section of the design doc):**
- Backend `/health` + activity tracking → Tasks 1, 2 ✅
- `PORT` env + `0.0.0.0` bind → Task 2 ✅
- CORS lock to frontend origin → Task 2 ✅
- Container (Dockerfile adapted, fixed CMD, dockerignore keeps data JSON) → Task 3 ✅
- Thin `infra/` CDK app instantiating the construct with `appId: 'pkmn'`, cert ARN from SSM, image fromAsset → Task 4 ✅
- Frontend configurable `wss` URL + wake gate + `.env.production` → Task 5 ✅
- Deploy via web-platform `deploy-app.sh`, `npm run deploy` → Task 6 ✅
- Retire `add-github-pages-deploy` + `add-cdk-infra` + Pages workflow → Task 7 ✅
- Live smoke test incl. CloudFront↔Socket.io WSS → Task 8 ✅

**Placeholder scan:** none — `VITE_WAKER_URL` is intentionally empty until the deploy prints it (documented in Tasks 4/6/8), not a plan placeholder.

**Type/name consistency:** `getActivity()` returns `{ activeSessions, lastActivityTs }` in Task 1, consumed identically by the `/health` route in Task 2 and matches web-platform's sleeper contract. `wakeBackend()` defined in Task 5 Step 1, called in Task 5 Step 2. `appId: 'pkmn'` → `pkmn-api.petterbuilds.com` consistent across Tasks 4, 5, 6, 8. Construct prop names (`certificateArn`, `frontendOrigin`, `healthPath`, `idleGraceMinutes`, `containerPort`) match the real `WakeableFargateServiceProps` built in Spec A.

## Notes / risks

- **Docker required** for Tasks 3, 4 (synth), and 8 (deploy). The repo already uses Docker (`docker compose`), so this is available.
- **First-deploy ordering** is a documented chicken-and-egg: backend deploy emits the `WakerUrl`, which the frontend build needs. Task 6/8 sequence it.
- **CloudFront↔Socket.io WSS** is the highest-risk item and is only provable in Task 8. Fallback captured in the design doc.
- **ContainerImage.fromAsset(repoRoot)** builds the whole backend image on every `cdk deploy`; the `.dockerignore` keeps the context small (excludes `app/`, `node_modules`, `infra/`).
