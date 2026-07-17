# Lobby System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A pre-game lobby that requires a trainer name before readying and shows all connected trainers to each other, split into a **Waiting** roster and a read-only **Ongoing games** list.

**Architecture:** Each connection has a *presence* `{ socketId, name, ready }`. The client sends one `UPDATE_PRESENCE(name, ready)` event whenever its name or ready status changes; the server stores it on the connected user and rebroadcasts a full `LOBBY_ROSTER` to everyone. The presence reuses the existing tri-state `sessionId` field as the ready flag (`false`/`true`/gameId), so the existing `countReadyPlayers` / Start-game gate is untouched — the roster is a purely additive display channel.

**Tech Stack:** Node.js + Socket.io 2.x + Immutable.js 3.x (backend), React 18 class components + Redux + Vite (frontend), Mocha + rewire + Node `assert` (tests).

## Global Constraints

- **Immutable.js everywhere in backend** — `connectedPlayers` is an `Immutable.Map`; use `.get()` / `.setIn()` / `.forEach()`. Never mutate.
- **No TypeScript** — plain JS. Snake_case allowed; `console.log` allowed (ESLint overrides).
- **Backend tests** run via `npm test` (mocha) from repo root. Frontend has no test harness — frontend tasks are verified by running the app.
- **Name length cap: 20 chars** (matches existing `maxLength='20'` on the input).
- **Single global lobby** — no rooms. Duplicate names allowed; socketId is the unique key.
- Design source of truth: `docs/superpowers/specs/2026-07-18-lobby-system-design.md` (dated 2026-07-17).

---

### Task 1: Backend — `name` field + `buildLobbyRoster` (pure, tested)

**Files:**
- Modify: `src/session.js` (add `name` to `createUser`; add `buildLobbyRoster` export)
- Test: `test/session_test.js` (create)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `exports.createUser(socketId)` → `Immutable.Map({ socketId, sessionId: false, name: '' })`
  - `exports.buildLobbyRoster(connectedPlayers)` → `{ waiting: [{name: string, ready: boolean}], ongoing: [{gameId: number, players: string[]}] }`. Waiting = users whose `sessionId` is `false`/`true`; ongoing = users whose `sessionId` is a number, grouped by that number (empty names filtered out of ongoing).

- [ ] **Step 1: Write the failing test**

Create `test/session_test.js`:

```js
// Author: Petter Andersson

const assert = require('assert');
const { Map } = require('immutable');

const sessionJS = require('../src/session.js');

// Sort helpers so assertions don't depend on Immutable.Map iteration order.
const byName = (arr) => arr.slice().sort((a, b) => a.name.localeCompare(b.name));
const byGame = (arr) => arr.slice().sort((a, b) => a.gameId - b.gameId);
const user = (name, sessionId) => Map({ socketId: name, name, sessionId });

describe('session.buildLobbyRoster', () => {
  it('separates waiting (ready/unready) from ongoing games', () => {
    const connectedPlayers = Map({
      a: user('Ash', true),
      b: user('Misty', false),
      c: user('Gary', 0),
      d: user('Oak', 0),
    });
    const roster = sessionJS.buildLobbyRoster(connectedPlayers);
    assert.deepEqual(byName(roster.waiting), byName([
      { name: 'Ash', ready: true },
      { name: 'Misty', ready: false },
    ]));
    assert.deepEqual(byGame(roster.ongoing), [
      { gameId: 0, players: ['Gary', 'Oak'].sort() },
    ].map((g) => ({ gameId: g.gameId, players: g.players })));
    // players order within a game is not guaranteed either — compare sorted
    assert.deepEqual(roster.ongoing[0].players.slice().sort(), ['Gary', 'Oak']);
  });

  it('handles empty lobby and keeps unnamed waiting players', () => {
    assert.deepEqual(sessionJS.buildLobbyRoster(Map({})), { waiting: [], ongoing: [] });
    const cp = Map({ a: Map({ socketId: 'a', name: '', sessionId: false }) });
    assert.deepEqual(sessionJS.buildLobbyRoster(cp), {
      waiting: [{ name: '', ready: false }],
      ongoing: [],
    });
  });

  it('createUser starts with an empty name and not ready', () => {
    const u = sessionJS.createUser('sock1');
    assert.equal(u.get('socketId'), 'sock1');
    assert.equal(u.get('sessionId'), false);
    assert.equal(u.get('name'), '');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `buildLobbyRoster` is `undefined` / `createUser` has no `name` (assertion error `undefined == ''`).

- [ ] **Step 3: Add `name` to `createUser`**

In `src/session.js`, change `exports.createUser`:

```js
exports.createUser = (socketId) => Map({
  socketId,
  sessionId: false, // Used for ready and sessionId (true|false|sessionId)
  name: '', // Pre-game lobby display name (set via UPDATE_PRESENCE)
});
```

- [ ] **Step 4: Add `buildLobbyRoster`**

In `src/session.js`, add near the other exports (e.g. after `exports.createUser`):

```js
// Build the lobby roster broadcast payload from the connected players map.
// waiting = users still in the lobby (sessionId false/true); ongoing = users
// grouped by their numeric in-game sessionId. Pure function (no I/O).
exports.buildLobbyRoster = (connectedPlayers) => {
  const waiting = [];
  const games = {}; // numeric sessionId -> [name]
  connectedPlayers.forEach((connectedUser) => {
    const sessionId = connectedUser.get('sessionId');
    const name = connectedUser.get('name') || '';
    if (sessionId === false || sessionId === true) {
      waiting.push({ name, ready: sessionId === true });
    } else {
      if (!games[sessionId]) games[sessionId] = [];
      if (name) games[sessionId].push(name);
    }
  });
  const ongoing = Object.keys(games).map((gameId) => ({
    gameId: Number(gameId),
    players: games[gameId],
  }));
  return { waiting, ongoing };
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS — all three `session.buildLobbyRoster` specs green. (Existing `game state` tests unaffected.)

- [ ] **Step 6: Commit**

```bash
git add src/session.js test/session_test.js
git commit -m "feat(lobby): connected-user name field + buildLobbyRoster helper"
```

---

### Task 2: Backend — `UPDATE_PRESENCE` event + roster broadcast

**Files:**
- Modify: `src/socketcontroller.js` (add `broadcastLobbyRoster`; replace `READY`/`UNREADY` handlers with `UPDATE_PRESENCE`; broadcast on join/disconnect/start)

**Interfaces:**
- Consumes: `sessionJS.buildLobbyRoster(connectedPlayers)` (Task 1).
- Produces (socket protocol):
  - Server listens for `UPDATE_PRESENCE(name, ready)`.
  - Server emits `LOBBY_ROSTER({ waiting, ongoing })` to all sockets on any lobby change.
  - Server emits `LOBBY_NAME_REQUIRED` to the acting socket when it tries to ready with an empty name.
  - The existing `READY` / `ALL_READY` count events are still emitted by `countReadyPlayers` — unchanged.

- [ ] **Step 1: Add the `broadcastLobbyRoster` helper**

In `src/socketcontroller.js`, add a top-level helper next to `countReadyPlayers` (it reads the module-level `connectedPlayers`):

```js
const broadcastLobbyRoster = (io) => {
  io.emit('LOBBY_ROSTER', sessionJS.buildLobbyRoster(connectedPlayers));
};
```

- [ ] **Step 2: Broadcast the roster when a player joins**

In the `GIVE_ID` handler, add the broadcast after the existing `countReadyPlayers(false, socket, io);`:

```js
  socket.on('GIVE_ID', async () => {
    console.log('@Give_id', socket.id);
    const newUser = sessionJS.createUser(socket.id);
    connectedPlayers = connectedPlayers.set(socket.id, newUser);
    touch();
    countReadyPlayers(false, socket, io);
    broadcastLobbyRoster(io);
  });
```

- [ ] **Step 3: Replace `READY` / `UNREADY` with `UPDATE_PRESENCE`**

Delete the two handlers:

```js
  socket.on('READY', async () => {
    connectedPlayers = connectedPlayers.setIn([socket.id, 'sessionId'], true); // Ready
    console.log('Player is ready');
    countReadyPlayers(true, socket, io);
  });

  socket.on('UNREADY', async () => {
    connectedPlayers = connectedPlayers.setIn([socket.id, 'sessionId'], false); // Unready
    console.log('Player went unready');
    countReadyPlayers(false, socket, io);
  });
```

Replace them with:

```js
  // Unified pre-game presence: carries the trainer name + desired ready status.
  // Name-gated: cannot ready without a name (server rejects; client also disables).
  socket.on('UPDATE_PRESENCE', async (nameParam, ready) => {
    const name = (nameParam || '').trim().slice(0, 20);
    connectedPlayers = connectedPlayers.setIn([socket.id, 'name'], name);
    if (ready === true && name === '') {
      io.to(socket.id).emit('LOBBY_NAME_REQUIRED');
    }
    const isReady = ready === true && name !== '';
    connectedPlayers = connectedPlayers.setIn([socket.id, 'sessionId'], isReady);
    console.log('Presence update', socket.id, JSON.stringify(name), 'ready:', isReady);
    countReadyPlayers(isReady, socket, io);
    broadcastLobbyRoster(io);
  });
```

- [ ] **Step 4: Broadcast the roster on disconnect and game start**

In the `disconnect` handler, add the broadcast at the end of the `if (connectedPlayers && connectedPlayers.get(socket.id))` block, after the existing `countReadyPlayers(false, socket, io);`:

```js
      connectedPlayers = connectedPlayers.delete(socket.id);
      touch();
      countReadyPlayers(false, socket, io);
      broadcastLobbyRoster(io);
```

In the `START_GAME` handler, add the broadcast as the last line of the handler (after the `emitMessage(...)` that sends `UPDATED_STATE`):

```js
    emitMessage(socket, io, sessionId, (socketId) => {
      io.to(socketId).emit('UPDATED_STATE', stateToSend);
    });
    broadcastLobbyRoster(io);
  });
```

- [ ] **Step 5: Lint the backend**

Run: `npm run lint`
Expected: PASS (no new errors in `src/socketcontroller.js`). If ESLint flags the unused `socket` param in `broadcastLobbyRoster`, note it takes only `io` — no `socket` param, so this should not occur.

- [ ] **Step 6: Manual smoke test (server boots, no crash)**

Run: `npm test` (runs mocha + lint via pre/post hooks) — Expected: PASS, existing + Task 1 tests still green.
Then: `npm start` — Expected: server logs `listening` on 8000 with no exception. Stop it with Ctrl-C. (Full two-client flow is verified in Task 4 once the UI exists.)

- [ ] **Step 7: Commit**

```bash
git add src/socketcontroller.js
git commit -m "feat(lobby): UPDATE_PRESENCE event + LOBBY_ROSTER broadcast (name-gated ready)"
```

---

### Task 3: Frontend — socket wiring + reducer state

**Files:**
- Modify: `app/src/socket.js` (add `LOBBY_ROSTER` + `LOBBY_NAME_REQUIRED` listeners; add `updatePresence` emitter; remove `ready`/`unready` emitters)
- Modify: `app/src/reducer.js` (initial state + `SET_LOBBY_ROSTER` / `LOBBY_NAME_REQUIRED` cases; clear hint on name set)

**Interfaces:**
- Consumes: server events from Task 2 (`LOBBY_ROSTER`, `LOBBY_NAME_REQUIRED`).
- Produces:
  - `updatePresence(name, ready)` exported from `app/src/socket.js` → emits `UPDATE_PRESENCE`.
  - Redux state fields: `lobbyWaiting: [{name, ready}]`, `lobbyOngoing: [{gameId, players}]`, `nameRequiredHint: boolean`.

- [ ] **Step 1: Add socket listeners**

In `app/src/socket.js`, inside `configureSocket`, add near the other `socket.on(...)` handlers (e.g. right after the `UPDATE_PLAYER_NAME` listener):

```js
  socket.on('LOBBY_ROSTER', ({ waiting, ongoing }) => {
    dispatch({ type: 'SET_LOBBY_ROSTER', waiting, ongoing });
  });

  socket.on('LOBBY_NAME_REQUIRED', () => {
    dispatch({ type: 'LOBBY_NAME_REQUIRED' });
  });
```

- [ ] **Step 2: Add the `updatePresence` emitter and remove `ready`/`unready`**

In `app/src/socket.js`, delete:

```js
export const ready = () =>
  socket.emit('READY');

export const unready = () =>
  socket.emit('UNREADY');
```

Add in their place:

```js
export const updatePresence = (name, ready) =>
  socket.emit('UPDATE_PRESENCE', name, ready);
```

- [ ] **Step 3: Extend reducer initial state**

In `app/src/reducer.js`, in the initial `state = { ... }` object, add three fields next to `playerName: '',`:

```js
    playerName: '',
    lobbyWaiting: [],
    lobbyOngoing: [],
    nameRequiredHint: false,
```

- [ ] **Step 4: Add reducer cases + clear hint on private-name update**

In `app/src/reducer.js`, add two new cases (e.g. after the `UPDATE_PRIVATE_NAME` case):

```js
    case 'SET_LOBBY_ROSTER':
      state = { ...state, lobbyWaiting: action.waiting || [], lobbyOngoing: action.ongoing || [] };
      break;
    case 'LOBBY_NAME_REQUIRED':
      // Server refused the ready because no name was set. Surface a hint and
      // roll back the optimistic local ready flag so the button label re-syncs.
      state = { ...state, nameRequiredHint: true, ready: false };
      break;
```

Then modify the existing `UPDATE_PRIVATE_NAME` case to clear the hint:

```js
    case 'UPDATE_PRIVATE_NAME': {
      state = {...state, playerName: action.name, nameRequiredHint: false }
      console.log('Updated name:', action.name);
      break;
    }
```

- [ ] **Step 5: Verify it builds**

Run: `cd app && npm run build`
Expected: build succeeds with no reference errors (confirms no leftover imports of the removed `ready`/`unready` — Task 4 updates the importer, so if building before Task 4, expect the `App.jsx` import to still reference them; run this step's build **after** Task 4, or temporarily accept the App.jsx import error until Task 4). See Task 4 for the import change.

> NOTE: `app/src/App.jsx` still imports `ready, unready` until Task 3 and Task 4 are both applied. Do Task 3 and Task 4 back-to-back and build once at the end of Task 4. Commit Task 3 without a build gate.

- [ ] **Step 6: Commit**

```bash
git add app/src/socket.js app/src/reducer.js
git commit -m "feat(lobby): frontend socket+reducer wiring for presence/roster"
```

---

### Task 4: Frontend — lobby panel UI, name-gated Ready, CSS

**Files:**
- Modify: `app/src/App.jsx` (import; `toggleReady`; `handleNameChange`; render lobby panel + gate Ready; `mapStateToProps`)
- Modify: `app/src/App.css` (lobby panel styles)

**Interfaces:**
- Consumes: `updatePresence` (Task 3); Redux fields `lobbyWaiting`, `lobbyOngoing`, `nameRequiredHint`, existing `playerName`, `ready`, `connected`.
- Produces: the rendered lobby (final UI surface — nothing downstream consumes it).

- [ ] **Step 1: Update the socket import**

In `app/src/App.jsx` line ~4, change:

```js
import { ready, unready, startGame, battleReady, sendMessage, AjaxGetUnitJson, wakeBackend, getServerStatus } from './socket';
```

to:

```js
import { updatePresence, startGame, battleReady, sendMessage, AjaxGetUnitJson, wakeBackend, getServerStatus } from './socket';
```

- [ ] **Step 2: Rewire `toggleReady` to send presence**

In `app/src/App.jsx`, replace the `toggleReady` method:

```js
  toggleReady = () => {
    const desiredReady = !this.props.ready;
    console.log('@toggleReady ->', desiredReady);
    this.props.dispatch({ type: 'TOGGLE_READY' });
    updatePresence(this.props.playerName, desiredReady);
  };
```

- [ ] **Step 3: Rewire `handleNameChange` to send presence (and stop the form reload)**

In `app/src/App.jsx`, replace the `handleNameChange` method:

```js
  handleNameChange = (event) => {
    event.preventDefault();
    const name = this.state.nameChangeInput;
    if (name.length <= 20 && name !== '') {
      this.props.dispatch({ type: 'UPDATE_PRIVATE_NAME', name });
      updatePresence(name, this.props.ready); // push name to lobby, keep ready status
    }
    this.setState({ ...this.state, nameChangeInput: '' });
  };
```

- [ ] **Step 4: Gate the Ready button + build the lobby panel in `render()`**

In `app/src/App.jsx` `render()`, just before `const mainMenu = <div>`, add:

```js
    const nameSet = this.props.playerName !== '';
    const lobbyReady = this.props.connected && loadingProgress >= 100;
    const lobbyPanel = lobbyReady ? (
      <div className='lobbyPanel'>
        <div className='lobbySection'>
          <div className='lobbyHeader'>Waiting</div>
          {this.props.lobbyWaiting.length === 0 ? (
            <div className='lobbyEmpty'>No trainers waiting</div>
          ) : this.props.lobbyWaiting.map((t, i) => (
            <div className='lobbyRow' key={`w${i}`}>
              <span className='lobbyName'>{t.name || '(choosing name)'}</span>
              <span className={t.ready ? 'lobbyReadyTag' : 'lobbyWaitTag'}>
                {t.ready ? '✓ ready' : 'getting ready…'}
              </span>
            </div>
          ))}
        </div>
        <div className='lobbySection'>
          <div className='lobbyHeader'>Ongoing games</div>
          {this.props.lobbyOngoing.length === 0 ? (
            <div className='lobbyEmpty'>No games in progress</div>
          ) : this.props.lobbyOngoing.map((g) => (
            <div className='lobbyRow' key={`g${g.gameId}`}>
              <span className='lobbyGameId'>{`Game #${g.gameId + 1}`}</span>
              <span className='lobbyGamePlayers'>{g.players.join(', ') || '—'}</span>
            </div>
          ))}
        </div>
      </div>
    ) : null;
```

Then, in the existing `consoleActions` block, gate the Ready button and add a hint. Replace:

```js
          <div className='consoleActions'>
            <button className='consoleBtn ghost' onClick={this.toggleReady}>{this.props.ready ? 'Unready' : 'Ready'}</button>
            <button className='consoleBtn' onClick={() => this.startGameEvent()}>{`Start game (${this.props.playersReady}/${this.props.connectedPlayers})`}</button>
          </div>
```

with:

```js
          <div className='consoleActions'>
            <button className='consoleBtn ghost' onClick={this.toggleReady} disabled={!nameSet}>{this.props.ready ? 'Unready' : 'Ready'}</button>
            <button className='consoleBtn' onClick={() => this.startGameEvent()}>{`Start game (${this.props.playersReady}/${this.props.connectedPlayers})`}</button>
          </div>
```

Add a name-gate hint immediately after the `consoleActions`/loading/wake conditional block (right before the `{forceStartVisible && (...)}` line):

```js
        {lobbyReady && (!nameSet || this.props.nameRequiredHint) && (
          <div className='menuHint'>Enter a trainer name below to ready up.</div>
        )}
```

Finally, insert `{lobbyPanel}` into the `mainMenu` markup — place it right after the closing `</div>` of the `menuConsole` block and before `<div className='mainMenuSoundDiv marginTop5'>`:

```js
      </div>
      {lobbyPanel}
      <div className='mainMenuSoundDiv marginTop5'>
```

- [ ] **Step 5: Expose the new fields in `mapStateToProps`**

In `app/src/App.jsx`, in the `mapStateToProps` object (near `playerName: state.playerName,` ~line 1659), add:

```js
  playerName: state.playerName,
  lobbyWaiting: state.lobbyWaiting,
  lobbyOngoing: state.lobbyOngoing,
  nameRequiredHint: state.nameRequiredHint,
```

- [ ] **Step 6: Add lobby CSS**

In `app/src/App.css`, append (after the `.nameRow` / name-input block, end of the menu section):

```css
.lobbyPanel {
  width: 380px;
  max-width: 88%;
  margin: 12px 0 0 150px;
  text-align: left;
  color: #f3f5fb;
  font-family: sans-serif;
}
.lobbySection {
  padding: 14px 18px 16px;
  margin-top: 10px;
  background: rgba(15, 17, 25, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 14px;
  box-shadow: 0 10px 34px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
.lobbyHeader {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1.4px;
  color: #a6adbe;
  margin-bottom: 10px;
}
.lobbyEmpty { font-size: 12.5px; color: #8b92a4; font-style: italic; }
.lobbyRow {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 5px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.lobbyRow:first-of-type { border-top: none; }
.lobbyName { font-size: 14px; font-weight: 700; color: #f3f5fb; }
.lobbyReadyTag { font-size: 12px; font-weight: 800; color: #39d353; }
.lobbyWaitTag { font-size: 12px; color: #8b92a4; }
.lobbyGameId { font-size: 13px; font-weight: 800; color: #4a8ee0; }
.lobbyGamePlayers { font-size: 12.5px; color: #a6adbe; text-align: right; }
```

- [ ] **Step 7: Build the frontend**

Run: `cd app && npm run build`
Expected: PASS — no unresolved imports (confirms `ready`/`unready` removal + `updatePresence` import are consistent across Tasks 3–4).

- [ ] **Step 8: End-to-end manual verification (two browser tabs)**

Start both: from repo root `npm start` (backend :8000), and `cd app && npm start` (Vite :3000). Open **two** tabs on `http://localhost:3000`. Verify:
1. Before typing a name, the **Ready** button is disabled and the hint "Enter a trainer name below to ready up." shows.
2. Type a name in tab A → Save → tab B's **Waiting** list shows that name with "getting ready…" (name visible before readying — decision A).
3. Click **Ready** in tab A → both tabs show "✓ ready" for tab A; the `Start game (x/y)` counter increments.
4. Rename in tab A while ready → both tabs show the new name and tab A stays "✓ ready".
5. Start a game with both tabs readied → both leave **Waiting**; a fresh third tab shows them under **Ongoing games** as `Game #1: <names>`.
6. Close the game tabs → the third tab's **Ongoing games** returns to "No games in progress".

- [ ] **Step 9: Commit**

```bash
git add app/src/App.jsx app/src/App.css
git commit -m "feat(lobby): dedicated lobby panel (waiting + ongoing), name-gated ready"
```

---

## Self-Review (completed while writing)

- **Spec coverage:** name field (T1) · buildLobbyRoster + waiting/ongoing shape (T1) · UPDATE_PRESENCE + name gate + LOBBY_NAME_REQUIRED (T2) · roster broadcast on join/presence/disconnect/start (T2) · socket+reducer wiring (T3) · dedicated panel, both sections, gated Ready, live name (T4) · CSS reusing console palette (T4). All spec sections mapped.
- **Deviation from spec (intentional):** `buildLobbyRoster` takes only `connectedPlayers` (not `sessions`) — in-game names are already carried on the connected user via the presence `name`, so `sessions` is unnecessary. Simpler and still correct.
- **Type consistency:** `updatePresence(name, ready)`, `UPDATE_PRESENCE`, `LOBBY_ROSTER {waiting, ongoing}`, `LOBBY_NAME_REQUIRED`, and reducer fields `lobbyWaiting`/`lobbyOngoing`/`nameRequiredHint` are named identically across T1–T4.
- **Ordering caveat:** Immutable.Map iteration order is not guaranteed → Task 1 test compares sorted arrays; UI order is cosmetic (acceptable v1).
- **Cross-task build ordering:** T3 removes `ready`/`unready` which T4 stops importing — build only after T4 (noted in T3 Step 5 / T4 Step 7).
