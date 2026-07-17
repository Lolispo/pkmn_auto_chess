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
| Name uniqueness | **Not enforced** — duplicates allowed; socketId is the unique key. Names are cosmetic pre-game. |
| Live name edit reflected to others | **Yes** — roster rebroadcasts on every presence change. |
| Unready trainers' names visible | **Yes** — name shows as soon as it's set (presence sent with `ready:false`), before readying. |

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
**Unified presence event + additive roster broadcast.** Each connection has a *presence*
`{ socketId, name, ready }`. The client sends its presence whenever the name **or** ready
status changes; the server stores it keyed by socketId and rebroadcasts the full roster to
everyone. This collapses three separate client events (set-name, ready, unready) into one
`UPDATE_PRESENCE(name, ready)`.

Internally the presence reuses the existing tri-state `sessionId` field as the ready flag
(`false`/`true`/gameId) rather than adding a parallel `ready` field — so the existing
`countReadyPlayers` / Start-game gate keeps working unchanged. `UPDATE_PRESENCE` sets the
new `name` field **and** `sessionId = ready ? true : false`, then calls **both**
`countReadyPlayers` (existing count/`allReady` channel — untouched) **and** the new
`broadcastLobbyRoster` (display channel). The `LOBBY_ROSTER` broadcast is a pure additive
display layer on top of the unchanged count events.

*Alternative considered — keep `SET_LOBBY_NAME` + `READY` + `UNREADY` as three events:*
more event surface for the same behavior; the unified presence event is simpler and maps
directly to the `{socketId, name, ready}` tuple. Rejected.

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
   - New event `UPDATE_PRESENCE(name, ready)` — replaces the old `READY` / `UNREADY` handlers:
     - trim `name`; set `connectedPlayers.setIn([id, 'name'], name)`.
     - **Name gate:** if `ready === true` but `name` is empty, keep `sessionId = false` and
       emit `LOBBY_NAME_REQUIRED` back to that socket (defense-in-depth; client also disables
       the button). Otherwise set `sessionId = ready ? true : false`.
     - call `countReadyPlayers(ready, socket, io)` (unchanged count/`allReady` channel) **and**
       `broadcastLobbyRoster(io)`.
   - Call `broadcastLobbyRoster(io)` on: `GIVE_ID` (join), `UPDATE_PRESENCE`, `disconnect`,
     `START_GAME` (players leave Waiting → appear in Ongoing). Session removal already happens
     in the `disconnect` handler, so game-end (reload → disconnect) naturally drops the game
     from `ongoing`.
   - The in-session `UPDATE_PLAYER_NAME` event (index-keyed, used mid-game) is left as-is.

## Frontend changes (`app/src/`)
1. **`socket.js`**
   - Listener `LOBBY_ROSTER` → `dispatch({ type: 'SET_LOBBY_ROSTER', waiting, ongoing })`.
   - Listener `LOBBY_NAME_REQUIRED` → `dispatch({ type: 'LOBBY_NAME_REQUIRED' })` (flag for a hint).
   - Emitter `updatePresence(name, ready)` → `socket.emit('UPDATE_PRESENCE', name, ready)`.
     Replaces the old `ready()` / `unready()` emitters.
2. **`reducer.js`**
   - Initial state: `lobbyWaiting: []`, `lobbyOngoing: []`, `nameRequiredHint: false`.
   - `SET_LOBBY_ROSTER` → store both arrays. `LOBBY_NAME_REQUIRED` → set hint true.
3. **`App.jsx`**
   - `handleNameChange` (pre-game): keep `UPDATE_PRIVATE_NAME` **and** call
     `updatePresence(name, this.props.ready)` so the server learns the name while preserving
     current ready status (a rename while ready stays ready). Clear `nameRequiredHint`.
   - `toggleReady`: call `updatePresence(this.props.playerName, !this.props.ready)` instead of
     the old `ready()`/`unready()`.
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
