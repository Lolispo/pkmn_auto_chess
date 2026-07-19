# Drag-and-Drop Unit Placement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let players drag Pokémon tiles to place/move them (hand→board, board→board, board→hand withdraw, hand→hand), alongside the existing click and hotkey flows.

**Architecture:** A thin frontend interaction layer. HTML5 native drag-and-drop on the existing `Cell` component resolves a `(source → target)` into an action via a pure `resolveDrop` helper, then calls the **existing** `placePieceEvent` / `withdrawPieceEvent`. No backend changes, no new socket events — placement stays server-authoritative.

**Tech Stack:** React 18 class components (no hooks), Vite, plain CSS. Frontend is ESM; backend/Mocha is CommonJS.

## Global Constraints

- **React class components, no hooks** — match the existing `Cell` style.
- **Native HTML5 DnD only** — no new dependencies (no react-dnd/dnd-kit).
- **No backend changes** — reuse `placePieceEvent(prop, from, to)` and `withdrawPieceEvent(prop, from)` from `app/src/events.js`.
- **Position strings:** hand = `"x"`, board = `"x,y"`; `Cell.props.isBoard` distinguishes.
- **Placement guards (mirror existing):** only when `!onGoingBattle && !isDead && visiting === index && gameIsLive`.
- **v1 rule:** occupied board cells are not valid drop targets (no stack/swap); dropping there is a no-op. Hand targets are always valid.
- **No frontend unit-test runner exists** (Mocha is CommonJS/backend-only; frontend is ESM with zero unit tests). Verify via `cd app && npm run build` + browser E2E. Do not add a test runner.

---

### Task 1: Pure drop resolver + drag-source state

**Files:**
- Create: `app/src/dragPlacement.js`

**Interfaces:**
- Consumes: nothing.
- Produces (ESM exports):
  - `resolveDrop(source, target)` → `{ action: 'place'|'withdraw'|'none', from?, to? }` where `source`/`target` are `{ pos: string, isBoard: boolean }`.
  - `setDragSource(source)`, `getDragSource()` → `source|null`, `clearDragSource()`.

- [ ] **Step 1: Create the module**

Create `app/src/dragPlacement.js`:

```js
// Author: Petter Andersson
// Frontend drag-and-drop placement helpers. Pure resolver + a module-level record of
// the current drag source (set on dragstart, read on drop). No DOM, no Redux here.

let dragSource = null;

export const setDragSource = (source) => { dragSource = source; };
export const getDragSource = () => dragSource;
export const clearDragSource = () => { dragSource = null; };

// Given the dragged tile (source) and the tile it was dropped on (target), decide which
// existing event to fire. Board->hand is a withdraw; every other valid combo is a place
// (hand->board, board->board, hand->hand). Same tile / missing source = none.
// Occupied-target rejection is handled by the Cell (it knows the board), not here.
export function resolveDrop(source, target) {
  if (!source || !target) return { action: 'none' };
  if (source.pos === target.pos && source.isBoard === target.isBoard) return { action: 'none' };
  if (source.isBoard && !target.isBoard) return { action: 'withdraw', from: source.pos };
  return { action: 'place', from: source.pos, to: target.pos };
}
```

- [ ] **Step 2: Verify it parses / builds**

Run: `cd app && npm run build`
Expected: build succeeds (`✓ built in …`). The module is unused until Task 2, so this only confirms it parses.

- [ ] **Step 3: Commit**

```bash
cd /Users/petter/HobbyProjects/pkmn_auto_chess
git add app/src/dragPlacement.js
git commit -m "feat(dnd): pure drop resolver + drag-source state helper"
```

---

### Task 2: Wire drag-and-drop into `Cell` + highlight CSS

**Files:**
- Modify: `app/src/App.jsx` (`class Cell` — imports, drag handlers, `render`)
- Modify: `app/src/App.css` (add `.cell.dropTarget`)

**Interfaces:**
- Consumes: `resolveDrop`, `setDragSource`, `getDragSource`, `clearDragSource` (Task 1); existing `placePieceEvent`, `withdrawPieceEvent` (`app/src/events.js`, already imported in `App.jsx`).
- Produces: the shipped drag-and-drop UX (nothing downstream consumes it).

- [ ] **Step 1: Import the resolver helpers**

In `app/src/App.jsx`, near the existing `import { ... } from './events';` (line ~5), add:

```js
import { resolveDrop, setDragSource, getDragSource, clearDragSource } from './dragPlacement';
```

- [ ] **Step 2: Add drag/drop handlers + a validity helper to `Cell`**

In `app/src/App.jsx`, inside `class Cell`, add these methods just after `handleMouseOver` (around line 245):

```js
  // A tile is a valid drop target if there's a drag in progress, it isn't the source
  // tile, and (for board cells) it isn't already occupied (v1: no stack/swap). Hand
  // targets are always valid (withdraw, or hand rearrange handled server-side).
  isValidDropTarget(src) {
    const np = this.props.newProps;
    if (!src) return false;
    if (src.pos === this.state.pos && src.isBoard === this.props.isBoard) return false;
    if (this.props.isBoard) {
      const occupied = !isUndefined(np.myBoard[this.state.pos]) && np.myBoard[this.state.pos];
      if (occupied) return false;
    }
    return true;
  }

  handleDragStart(e) {
    setDragSource({ pos: this.state.pos, isBoard: this.props.isBoard });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.state.pos); // Firefox needs data set to start a drag
    try { e.dataTransfer.setDragImage(e.currentTarget, 40, 40); } catch (err) { /* older browsers */ }
  }

  handleDragEnd() {
    clearDragSource();
  }

  handleDragOver(e) {
    if (!this.isValidDropTarget(getDragSource())) return; // no preventDefault => not a drop target
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('dropTarget');
  }

  handleDragLeave(e) {
    e.currentTarget.classList.remove('dropTarget');
  }

  handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dropTarget');
    const src = getDragSource();
    const result = resolveDrop(src, { pos: this.state.pos, isBoard: this.props.isBoard });
    clearDragSource();
    if (result.action === 'place') {
      placePieceEvent(this.props.newProps, result.from, result.to);
    } else if (result.action === 'withdraw') {
      withdrawPieceEvent(this.props.newProps, result.from);
    }
  }
```

- [ ] **Step 3: Make the cell draggable/droppable in `render`**

In `app/src/App.jsx`, replace the `Cell.render` return (currently lines ~336-341):

```jsx
    return (
      <div id={this.state.pos} className={className} onClick={() => this.handleCellClick(this)} 
        onMouseOver={(event) => this.handleMouseOver(event, this)}>
        {this.getValue()}
      </div>
    );
```

with:

```jsx
    const np = this.props.newProps;
    const canInteract = !np.onGoingBattle && !np.isDead && np.visiting === np.index && np.gameIsLive;
    const cellUnit = this.props.isBoard ? np.myBoard[this.state.pos] : np.myHand[this.state.pos];
    const draggable = canInteract && !isUndefined(cellUnit) && !!cellUnit;
    return (
      <div id={this.state.pos} className={className} onClick={() => this.handleCellClick(this)}
        onMouseOver={(event) => this.handleMouseOver(event, this)}
        draggable={draggable}
        onDragStart={draggable ? (e) => this.handleDragStart(e) : undefined}
        onDragEnd={() => this.handleDragEnd()}
        onDragOver={canInteract ? (e) => this.handleDragOver(e) : undefined}
        onDragLeave={(e) => this.handleDragLeave(e)}
        onDrop={canInteract ? (e) => this.handleDrop(e) : undefined}>
        {this.getValue()}
      </div>
    );
```

- [ ] **Step 4: Add the drop-target highlight CSS**

In `app/src/App.css`, append (after the lobby CSS block, end of file is fine):

```css
.cell.dropTarget {
  outline: 2px solid #ffcb05;
  outline-offset: -2px;
  background: rgba(255, 203, 5, 0.18);
  cursor: copy;
}
```

- [ ] **Step 5: Build**

Run: `cd app && npm run build`
Expected: PASS, no unresolved imports.

- [ ] **Step 6: End-to-end verification (dev servers + browser)**

Start backend and frontend if not already running (backend honors `PORT`; use alternate ports to avoid conflicts):
```bash
cd /Users/petter/HobbyProjects/pkmn_auto_chess && PORT=8001 node src/index.js &
cd /Users/petter/HobbyProjects/pkmn_auto_chess/app && VITE_BACKEND_URL=http://localhost:8001 npx vite --port 3007 &
```
Open `http://localhost:3007/`, start a solo game (name + Ready + Start), then verify:
1. **hand → empty board cell**: drag a hand unit onto an empty board cell → it moves to the board (server state updates, unit leaves hand).
2. **board → empty board cell**: drag a placed unit to another empty cell → it repositions.
3. **board → hand**: drag a board unit onto the hand strip → it withdraws to the hand.
4. **occupied board cell**: drag onto a cell that already has a unit → no-drop cursor, nothing happens (no-op).
5. **during battle**: once a battle starts, tiles are not draggable and cells reject drops.
6. **regression**: click-to-select-then-place and the q/w/e hotkeys still work unchanged.
7. **drop highlight**: hovering a valid target while dragging shows the yellow `.dropTarget` outline; it clears on leave/drop.

- [ ] **Step 7: Commit**

```bash
cd /Users/petter/HobbyProjects/pkmn_auto_chess
git add app/src/App.jsx app/src/App.css
git commit -m "feat(dnd): drag-and-drop placement on board/hand cells (native HTML5 DnD)"
```

---

## Self-Review (completed while writing)

- **Spec coverage:** resolver + drag-source (Task 1); hand→board / board→board / hand→hand place, board→hand withdraw, guards, occupied no-op, drag image, highlight, no backend changes (Task 2). All spec sections mapped.
- **Deviation from spec (intentional):** the spec's "Mocha unit test for `resolveDrop`" is dropped — the repo has no frontend/ESM test runner and the resolver is ESM (Mocha is CommonJS/backend-only). Adding one is scope the user didn't ask for. `resolveDrop` is pure and its three branches are all exercised by the Task 2 E2E (place / withdraw / no-op). If a frontend test runner is added later, `resolveDrop` is trivially unit-testable.
- **Type consistency:** `resolveDrop(source, target)` and `{pos, isBoard}` shapes, `setDragSource`/`getDragSource`/`clearDragSource`, and the `{action, from, to}` result are used identically across Task 1 and Task 2. `placePieceEvent(prop, from, to)` / `withdrawPieceEvent(prop, from)` match `events.js`.
- **Occupied-target handling:** enforced in `Cell.isValidDropTarget` (Cell knows the board), not in the pure `resolveDrop` — consistent with the spec.
