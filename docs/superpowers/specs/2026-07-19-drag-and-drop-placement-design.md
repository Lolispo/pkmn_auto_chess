# Drag-and-drop unit placement — design

**Status:** proposed, pending user approval. (Scope + technique chosen as best-judgment
defaults while the user was away — flagged below for review.)

## Goal
Let players place/move Pokémon by dragging tiles, in addition to the existing
click-to-select and hotkey flows. Dragging should feel like the natural primary way to
move units between the hand and the board.

## Scope (v1)
- **hand → board** — place a unit on an empty board cell (the core ask).
- **board → board** — reposition a unit to an empty board cell.
- **board → hand** — withdraw a unit back to the hand.
- **hand → hand** — rearrange the hand (falls out for free; already supported by events).
- **Deferred:** drag-to-sell, and swapping onto an *occupied* cell (see Edge cases).

## Chosen decisions (best-judgment; confirm on review)
| Decision | Choice | Why |
|---|---|---|
| Drag technique | **HTML5 native drag-and-drop** (`draggable` + `onDragStart/Over/Drop`) | Works correctly under the `ScaleStage` `transform: scale()` (browser hit-tests DOM elements — no manual coordinate math), no new dependencies, fits the class-component/vanilla codebase. |
| Coexist with click/hotkey | **Additive** — keep both | Drag is a new affordance; the existing flows stay for power users and as a fallback (incl. weak touch support on native DnD). |
| Backend changes | **None** | `placePieceEvent` / `withdrawPieceEvent` already accept arbitrary hand/board positions and are server-authoritative. |

*Alternatives considered:*
- *Pointer-events custom drag (floating ghost sprite):* nicer visuals + touch, but must
  correct for the stage's scale factor when positioning the ghost, and is more code.
  Rejected for v1 (native DnD's `setDragImage` gives an acceptable ghost).
- *Library (react-dnd / dnd-kit):* robust but adds a dependency + provider wiring;
  dnd-kit is hooks-only (codebase is class components). Overkill for a grid. Rejected.

## Current reality (grounded in code)
- Each board/hand tile is a `Cell` (`app/src/App.jsx`, `class Cell`) rendered as
  `<div className='cell' onClick={handleCellClick}>`. Position strings: hand = `"x"`,
  board = `"x,y"`; `isBoard` distinguishes them.
- Two-click placement: `handleCellClick` selects a unit (`SELECT_UNIT`), then a click on
  an empty target calls `placePieceEvent(props, from, to)`.
- `placePieceEvent(prop, from, to)` (`app/src/events.js`) guards dead/visiting/battle,
  validates the target position, checks the source unit exists, then emits `PLACE_PIECE`.
  It already accepts hand or board `from`/`to`.
- `withdrawPieceEvent(prop, from)` emits `WITHDRAW_PIECE` for board→hand (guards hand < 8).
- Placement is blocked during `onGoingBattle` (hand→hand is the only battle-time exception).

## Architecture
A thin interaction layer on `Cell`, plus one pure resolver function. No new components,
no backend, no new socket events.

1. **Pure resolver** — `resolveDrop(source, target)` in a new
   `app/src/dragPlacement.js`:
   - Input: `source = {pos, isBoard}`, `target = {pos, isBoard}`.
   - Output: `{ action: 'place' | 'withdraw' | 'none', from, to }`.
   - Rules: same cell → `none`; board source + hand target → `withdraw`; otherwise →
     `place` (hand→board, board→board, hand→hand). No DOM, no Redux → unit-testable.
2. **Drag source tracking** — a module-level `let dragSource = null` in `dragPlacement.js`
   (set on `dragStart`, cleared on `dragEnd`), with `setDragSource`/`getDragSource`
   helpers. Simpler and more reliable than round-tripping through `dataTransfer` (whose
   payload can't be read during `dragOver`, only on `drop`); `dataTransfer.setData` is
   still set so the drag is valid, but the source object is the source of truth.
3. **`Cell` wiring** (only when placement is allowed — not dead, not visiting, not
   `onGoingBattle`):
   - Tiles that contain a unit: `draggable`, `onDragStart` → `setDragSource({pos, isBoard})`
     and `dataTransfer.setDragImage(spriteEl, ...)`; `onDragEnd` → clear source + highlight.
   - All tiles: `onDragOver` → `preventDefault()` (enables drop) + add `.dropTarget`
     highlight; `onDragLeave` → remove highlight; `onDrop` → compute
     `resolveDrop(getDragSource(), {pos, isBoard})` and call `placePieceEvent` or
     `withdrawPieceEvent` accordingly, then clear state.

## Data flow
`dragStart` (source cell) → store `{pos, isBoard}` → `dragOver` (target) highlights →
`drop` (target) → `resolveDrop` → `placePieceEvent`/`withdrawPieceEvent` → existing
`PLACE_PIECE`/`WITHDRAW_PIECE` socket emit → server validates → `UPDATED_STATE` → re-render.
Identical to the two-click path from `placePieceEvent` onward.

## Visual feedback
- **Drag image:** the tile's Pokémon sprite via `setDragImage` (not the default box).
- **Valid target:** `.dropTarget` CSS class on `dragOver` (subtle outline/glow), removed on
  `dragLeave`/`drop`. v1 highlights empty board cells and the hand as valid targets.
- Reuse existing cell sizing; no layout changes.

## Edge cases
- **Drop on occupied board cell:** ignored client-side in v1 (mirrors the current
  click-to-place, which only places on empty cells). Swap-on-occupied is deferred.
- **Drop outside any cell / same cell:** no-op (`resolveDrop` → `none`; `dragEnd` clears).
- **During battle:** tiles are not `draggable` and cells don't accept drops (guards mirror
  `placePieceEvent`). Hand→hand during battle is out of scope for drag in v1.
- **Dead / visiting another player:** no drag (guarded), same as existing events.

## Testing
- Unit-test `resolveDrop` (Mocha, no DOM): same-cell → none; board→hand → withdraw;
  hand→board / board→board / hand→hand → place with correct from/to.
- Manual: drag hand→board (place), board→board (move), board→hand (withdraw), drop on
  occupied cell (no-op), attempt during battle (blocked), verify server state updates and
  the click/hotkey paths still work.

## Touched files
- Create: `app/src/dragPlacement.js` (resolver + drag-source state), test file for it.
- Modify: `app/src/App.jsx` (`Cell`: drag/drop handlers + guards), `app/src/App.css`
  (`.dropTarget` highlight).
- No backend changes.

## Out of scope (v1)
Drag-to-sell, swap-on-occupied, touch/mobile drag polish, animated ghost that tweens back
on invalid drop.
