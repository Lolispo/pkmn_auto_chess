# Lobby system — decisions so far (brainstorming in progress)

**Status:** requirements captured; design NOT yet finalized/approved. Resume brainstorming from here.

## Goal
A pre-game lobby: require a name before readying, and showcase trainers to each other before start.

## Decisions (from user, 2026-07-17)
- **Scope:** single shared global lobby (matches current `connectedPlayers` model; no rooms).
- **UI:** dedicated lobby panel (replaces the plain menu once connected), not inside the console card.
- **Roster shows TWO clearly-separated sections:**
  1. **Waiting** — connected trainers with name + ready status (ready ✓ / getting ready).
  2. **Ongoing games** — currently-running sessions and the trainers in them (spectate-able feel).
- **Name gate:** cannot ready up without a submitted name (drop the auto `"Player N"` fallback for the lobby path).

## Current backend reality (what must change)
- `connectedPlayers` = Map socketId → {socketId, sessionId}. `sessionId`: `false` (not ready) / `true` (ready) / real id (in-game). No name stored pre-game.
- Ready flow (`socketcontroller.js`): `READY`/`UNREADY` events → `countReadyPlayers` broadcasts only **counts** (`ALL_READY`/`READY`), not names.
- Names only exist per-session (in-game), via `UPDATE_PLAYER_NAME(name)` keyed by player index. Frontend `playerName` defaults `''`; server auto-names `"Player N"` at game start.

## Implied work (to design next)
- Store `name` on the connected player (pre-game); set/validate via a lobby name event.
- Broadcast a **lobby roster** (waiting players {name, ready}) + **ongoing games** ({gameId, player names}) to all connected clients on any change (join/name/ready/unready/leave/game-start/game-end).
- Frontend: dedicated lobby panel rendering both sections; disable Ready until a name is saved (+ server-side reject).
- Single-repo change (pkmn only): `src/socketcontroller.js`, `src/session.js`, `app/src/reducer.js`, `app/src/socket.js`, `app/src/App.jsx` + CSS.

## Open questions to resolve when resuming
- Ongoing-games section: live/read-only list only, or joinable/spectate? (assume read-only list of names for v1)
- Do names need uniqueness? (assume no for v1)
- Live name edit reflected to others while in lobby? (assume yes — rebroadcast roster on change)
