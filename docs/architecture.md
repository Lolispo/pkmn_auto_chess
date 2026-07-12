# Architecture — scale-to-zero hosting

How `pkmn.petterbuilds.com` (frontend) and `pkmn-api.petterbuilds.com` (scale-to-zero
Fargate backend) fit together, and **where each responsibility lives**.

## System diagram

```mermaid
flowchart TB
  subgraph browser["🌐 Browser — user (repo: pkmn_auto_chess/app)"]
    UI["React app<br/>pkmn.petterbuilds.com"]
  end

  subgraph platform["Static hosting — SHARED (repo: web-platform)"]
    CFfront["CloudFront + router fn"]
    S3[("S3 apps bucket<br/>/pkmn prefix")]
    CFfront --> S3
  end

  subgraph construct["WakeableFargateService — REUSABLE (repo: web-platform, deployed by pkmn/infra)"]
    CFapi["CloudFront<br/>pkmn-api.petterbuilds.com<br/>TLS wildcard cert · WSS passthrough"]
    Waker["λ Waker (Function URL)<br/>GET = status · POST = wake"]
    DNS["λ DNS-updater<br/>on task RUNNING"]
    Sleeper["λ Sleeper<br/>5-min idle + daily backstop"]
    EB["EventBridge rules<br/>TaskRunning · Sleeper(5m) · Backstop(04:00)"]
    SSM[("SSM params<br/>/pkmn/last-online<br/>/platform/wildcard-cert-arn")]
    ECS["ECS Service<br/>desiredCount 0 ↔ 1"]
  end

  subgraph fargate["ECS Fargate task — image from repo: pkmn_auto_chess"]
    Task["Node + Express + Socket.io<br/>/health · /sprites · /unitJson<br/>game state (in-memory)<br/>public IP :8000"]
  end

  R53["Route 53 (petterbuilds.com)<br/>pkmn → platform CF<br/>pkmn-api → backend CF<br/>origin-pkmn → task IP (TTL 60)"]

  UI -->|"page load (static)"| CFfront
  UI -->|"1 · GET status (no wake)"| Waker
  UI -->|"2 · POST wake (button)"| Waker
  UI -->|"3 · wss + fetch /sprites"| CFapi

  Waker -->|"read lastOnline"| SSM
  Waker -->|"DescribeServices / UpdateService→1"| ECS
  ECS --> Task

  EB --> DNS
  EB --> Sleeper
  DNS -->|"DescribeTasks → ENI public IP"| Task
  DNS -->|"UPSERT origin-pkmn"| R53
  Sleeper -->|"GET /health"| CFapi
  Sleeper -->|"UpdateService→0"| ECS
  Sleeper -->|"write lastOnline"| SSM

  CFapi -->|"origin = origin-pkmn.*"| R53
  R53 -.->|"resolves to"| Task
```

## Who owns what / where the logic lives

| Component | Runs where | Responsibility | Repo |
|---|---|---|---|
| **React app** | Browser (served from S3/CloudFront) | GET status on load, "Wake" button → POST, connect `wss`, render asleep/waking/online + last-online | `pkmn_auto_chess/app` |
| **Static hosting** | CloudFront + S3 (always up) | Serve the frontend under `/pkmn` | `web-platform` (shared) |
| **Backend CloudFront** | Managed edge | TLS (wildcard cert) + WebSocket passthrough to the task | `web-platform` construct |
| **Waker λ** | Lambda (always available) | `GET` = report state (ECS counts) + `lastOnline` (SSM); `POST` = scale to 1 | `web-platform` construct |
| **DNS-updater λ** | Lambda (event-driven) | On task RUNNING: find task public IP (ENI), UPSERT `origin-pkmn` | `web-platform` construct |
| **Sleeper λ** | Lambda (scheduled) | Idle → scale to 0 + write `lastOnline`; daily backstop reclaims stuck tasks | `web-platform` construct |
| **ECS Service / Task** | Fargate (0↔1) | Run the game server; serve `/health`, `/sprites`, Socket.io; hold in-memory game state | image from `pkmn_auto_chess`, service from construct |
| **SSM params** | Managed | `last-online` (per app) · `wildcard-cert-arn` (platform) | construct / `web-platform` |
| **Route 53** | Managed | Public names + the runtime-updated `origin-pkmn` record | construct / `web-platform` |

**Key idea:** everything that must answer *while the task is down* lives in **Lambda / managed
services** (Waker, SSM, CloudFront, Route 53). The task itself only handles gameplay.

## Wake sequence

```mermaid
sequenceDiagram
  participant U as Browser
  participant W as Waker λ
  participant E as ECS
  participant D as DNS-updater λ
  participant R as Route 53
  participant T as Fargate task
  U->>W: POST /(wake)
  W->>E: UpdateService desiredCount=1
  E->>T: launch task (public IP)
  T-->>E: RUNNING (EventBridge event)
  E->>D: task RUNNING
  D->>T: DescribeTasks → ENI public IP (retry ≤5×)
  D->>R: UPSERT origin-pkmn → IP (TTL 60)
  U->>T: poll /health via CloudFront (until OK ~50–90s)
  U->>T: connect wss + load sprites
```

## Sleep sequence

```mermaid
sequenceDiagram
  participant S as Sleeper λ
  participant T as Fargate task
  participant E as ECS
  participant P as SSM
  Note over S: every 5 min (idle) + daily 04:00 (force backstop)
  S->>T: GET /health
  alt players connected
    T-->>S: activeSessions > 0 → do nothing
  else idle (or force + unreachable)
    S->>E: UpdateService desiredCount=0
    S->>P: put lastOnline = now
  end
```
