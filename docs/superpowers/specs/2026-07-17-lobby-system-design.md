# Lobby system — design

**Status:** proposed, pending user approval. Supersedes the open questions in
`2026-07-17-lobby-system-decisions.md` (requirements doc).

## Goal
A pre-game lobby that (1) requires a trainer name before readying and (2) shows
all connected trainers to each other, split into **Waiting** and **Ongoing games**.

## Resolved decisions (v1)
| Open question | Decision |
|---|---|
| Ongoing-games section | **Read-only name list** (gameId + trainer names). No spectate/join in v1. |
| Name uniqueness | **Not enforced** — duplicates allowed. Names are cosmetic pre-game. |
| Live name edit reflected to others | **Yes** — roster rebroadcasts on every name change. |

## Current reality (grounded in code)
- `connectedPlayers` (in `socketcontroller.js`) = `Map` socketId → `{ socketId, sessionId }`,
  where `sessionId` is a **tri-state**: `false` (not ready) / `true` (ready) / real id (in-game).
  **No name is stored on the connected user.**
- `countReadyPlayers()` broadcasts only *counts* via `READY` / `ALL_READY`, not names.
- Trainer name is **client-only pre-game**: `handleNameChange` → `UPDATE_PRIVATE_NAME`
  (sets `state.playerName` locally, never emitted). It first reaches the server at game
  start, when the reducer's `NEW_PLAYER` case calls `updatePlayerName(...)` (defaulting to
  `"Player N"` when blank).
- `sessions` `Map` sessionId → session; each session has `connectedPlayers` (socketId→pid)
  and `players` (pid → `{ name, ... }`). Ongoing-game names are derivable from here.

## Approach (chosen)
**Additive roster channel, keep existing count events.** Add a new server-built
`LOBBY_ROSTER` broadcast carrying full display data (waiting names+ready, ongoing games).
Leave `READY`/`ALL_READY` count events untouched so the Start-game gating logic
(`allReady`, `playersReady/connectedPlayers`) keeps working unchanged. The roster is a
pure *display* channel layered on top.

*Alternative considered — fold counts into the roster and retire `READY`/`ALL_READY`:*
cleaner single source of truth, but rewires the start-game gate and risks regressions for
no v1 user benefit. Rejected on YAGNI/risk grounds.

## Data shape
Server emits `LOBBY_ROSTER` to **all connected sockets** on any change:
```js
{
  waiting: [ { name: 'Ash', ready: true }, { name: 'Misty', ready: false }, ... ],
  ongoing: [ { gameId: 0, players: ['Gary', 'Oak'] }, ... ]
}
```
- `waiting` = `connectedPlayers` entries whose `sessionId` is `false` or `true`
  (i.e. in-lobby, not in a game). `ready = (sessionId === true)`. Unnamed players
  (name still `''`) shown as e.g. `"(choosing name)"`.
- `ongoing` = one entry per session in `sessions`; `players` = the session's player names.

## Backend changes (`src/`)
1. **`session.js` `createUser`** — add `name: ''` to the connected-user Map.
2. **`session.js`** — add `buildLobbyRoster(connectedPlayers, sessions)` helper returning
   the `{ waiting, ongoing }` object above (pure function → unit-testable via rewire).
3. **`socketcontroller.js`**
   - Add `broadcastLobbyRoster(io)` → `io.emit('LOBBY_ROSTER', sessionJS.buildLobbyRoster(...))`.
   - New event `SET_LOBBY_NAME(name)`: trim; set `connectedPlayers.setIn([id,'name'], name)`;
     `broadcastLobbyRoster(io)`. (Dedicated pre-game event — distinct from the index-keyed,
     in-session `UPDATE_PLAYER_NAME`.)
   - **Name gate** on `READY`: if the connected user's `name` is empty, do **not** set ready;
     emit `LOBBY_NAME_REQUIRED` back to that socket and return. (Defense-in-depth; the client
     also disables the button.)
   - Call `broadcastLobbyRoster(io)` on: `GIVE_ID` (join), `SET_LOBBY_NAME`, `READY`,
     `UNREADY`, `disconnect`, `START_GAME` (players leave Waiting → appear in Ongoing).
     Session removal already happens in the `disconnect` handler, so game-end (reload →
     disconnect) naturally drops the game from `ongoing`.

## Frontend changes (`app/src/`)
1. **`socket.js`**
   - Listener `LOBBY_ROSTER` → `dispatch({ type: 'SET_LOBBY_ROSTER', waiting, ongoing })`.
   - Listener `LOBBY_NAME_REQUIRED` → `dispatch({ type: 'LOBBY_NAME_REQUIRED' })` (flag for a hint).
   - Emitter `setLobbyName(name)` → `socket.emit('SET_LOBBY_NAME', name)`.
2. **`reducer.js`**
   - Initial state: `lobbyWaiting: []`, `lobbyOngoing: []`, `nameRequiredHint: false`.
   - `SET_LOBBY_ROSTER` → store both arrays. `LOBBY_NAME_REQUIRED` → set hint true.
3. **`App.jsx`**
   - `handleNameChange` (pre-game): keep `UPDATE_PRIVATE_NAME` **and** call `setLobbyName(name)`
     so the server learns the name. Clear `nameRequiredHint`.
   - Ready button `disabled` when `this.props.playerName === ''`; show inline hint
     "Enter a trainer name to ready up" when blank or on `nameRequiredHint`.
   - **Dedicated lobby panel** shown once `connected && loadingProgress >= 100`, replacing the
     in-console Ready/Start block (logos + status pill stay). Layout:
     - Trainer-name form (top).
     - Ready / Start-game buttons (Ready gated as above).
     - **Waiting** section: list of `lobbyWaiting` rows — name + `✓ ready` / `getting ready…`.
     - **Ongoing games** section: list of `lobbyOngoing` — `Game #N: name, name, …`
       (or "No games in progress").
   - Pre-connect / loading state (wake button, loading string) is **unchanged**.
4. **CSS** (`app/src/App.css`): lobby-panel container,
   two roster sections with headers, roster rows, ready indicators. Reuse existing
   `menuConsole` visual language (status pill, dividers) for cohesion.

## Isolation / testability
- `buildLobbyRoster` is a pure function of `(connectedPlayers, sessions)` → rewire unit test
  covering: mixed ready/unready, unnamed player, players spread across sessions, empty lobby.
- `broadcastLobbyRoster` is the only new I/O surface; it just serializes the pure result.

## Out of scope (v1)
- Spectating / joining ongoing games.
- Name uniqueness / profanity filter.
- Rooms / multiple named lobbies (single global lobby only).
- Reconnect-by-URL, persistent logins/stats (tracked separately in TODO.md "Startscreen").

## Touched files
`src/session.js`, `src/socketcontroller.js`, `test/game_test.js` (or a session test),
`app/src/socket.js`, `app/src/reducer.js`, `app/src/App.jsx`, `app/src/App.css`.
