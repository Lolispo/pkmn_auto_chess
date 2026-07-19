# Bottom-right HUD redesign — design

**Status:** proposed, pending user approval. (Damage/chat placement chosen as best-judgment
default — "side by side" — while the user was away; flagged for review.)

## Goal
Un-swamp the bottom-right corner. Today one cramped panel multiplexes five things behind a
radio row (Chat / Hotkeys / Types / Buffs / Damage), so gameplay reference and the
(interesting) post-battle damage are buried in tiny shared space. Split it into three
purpose-built surfaces: **Chat = just chat**, **reference info = an openable side panel**,
**damage = its own always-visible panel**.

## Current reality (grounded in code)
- `rightSide` (`App.jsx:1682`) = shop on top, then a `belowShopDiv` with controls + one
  panel gated by `help` (collapse) and a 5-way radio that sets `chatHelpMode`.
- `buildHelp()` (`App.jsx:1399`) renders the active mode into one area:
  `chat` → message list + chat input form (`handleChatSubmit`); `hotkeys` → a hardcoded
  string; `types` → `typeStatsString`; `typeBonuses` → `typeBonusString`.
- `getDmgBoard(board)` (`App.jsx:1461`) renders sorted damage bars; the damage view shows
  when `showDmgBoard || chatHelpMode === 'damageBoard'` (current board post-battle,
  `prevDmgBoard` during battle).
- The whole game renders inside the fixed **1600×1000 `ScaleStage`** (letterboxed), layout
  `leftBar | board | rightSide`.

## Chosen decisions
| Decision | Choice |
|---|---|
| Reference-info form | **Slide-in side panel** from the right edge, closable (✕ / Esc / click backdrop). |
| Damage + chat placement | **Side by side** below the shop — Damage left, Chat right (best-judgment; confirm). |
| Component style | **Render-helper methods on `App`** (matches existing `buildHelp`/`getDmgBoard`/`playerStatsDiv`), not new files — lower risk, consistent with the monolith. |

## The three surfaces

### 1. Chat panel (always visible, bottom-right, right)
`renderChatPanel()` — header "Chat", the scrollable message list (`chatMessages` /
`senderMessages`, keep the `messagesEnd` auto-scroll ref), and the existing chat input form
(`handleChatSubmit`, `chatMessageInput`). This is the `chat` branch of `buildHelp` lifted
into its own always-on panel. No mode gating.

### 2. Damage panel (always visible, bottom-right, left)
`renderDamagePanel()` — header "Damage · last battle". Renders `getDmgBoard(...)` for the
best-available board: `dmgBoard` if non-empty, else `prevDmgBoard` (during battle), else a
muted placeholder ("No battles yet"). Always visible — drop the `showDmgBoard` /
`chatHelpMode === 'damageBoard'` gating.

### 3. Info side panel (overlay, opened on demand)
`renderInfoSidepanel()` — a fixed-position panel that slides in from the right over the game
(inside the stage), returns `null` when closed. Contains sub-tabs **Hotkeys · Types · Buffs**
selecting `infoSection`; content = the hotkeys string / `typeStatsString` / `typeBonusString`
respectively. Header with title + ✕. Closes on ✕, `Esc`, or backdrop click. Roomy
("encyclopedia") layout so the reference is actually readable.
- **Open control:** a small **"ⓘ Info"** button in the controls area (replacing the
  collapse/`toggleHelp` image), dispatching `TOGGLE_INFO`.

## State changes (`reducer.js`)
- **Add:** `infoOpen: false`, `infoSection: 'hotkeys'`.
- **Actions:** `TOGGLE_INFO` (flip `infoOpen`), `SET_INFO_SECTION` (set `infoSection`).
- **Retire (for this area):** the 5-way `chatHelpMode` radio and the `help` collapse toggle;
  `showDmgBoard` no longer gates the damage view. Leave the underlying `chatMessages`,
  `senderMessages`, `dmgBoard`, `prevDmgBoard`, `typeStatsString`, `typeBonusString` state
  as-is. (`showDmgBoard` and its socket auto-toggle can remain unused; not removed to keep
  the change contained.)

## Layout
- `rightSide` below the shop: replace the radio/`buildHelp` block with a flex row:
  `[ renderDamagePanel() ][ renderChatPanel() ]`, each a styled panel with a header.
- Keep the shop and Buy-Exp / message controls; swap the collapse image for the "ⓘ Info"
  button.
- Info side panel is a `position: fixed` overlay pinned to the right of the stage, above the
  game, with a subtle backdrop; slide/opacity transition on open.

## Styling direction
Match the menu/lobby aesthetic for one coherent system: dark translucent panels
(`rgba(15,17,25,0.82)`), `1px rgba(255,255,255,0.14)` border, ~14px radius, uppercase
letter-spaced headers (like `.lobbyHeader`), muted body text. Damage bars: unit name + value
with a proportional fill bar (reuse the existing bar markup, restyled). Info side panel:
~340px wide, full stage height, section sub-tabs styled like the lobby, scrollable body.

## Isolation / testability
Each surface is one render method with a single responsibility and clear inputs
(chat: messages+input; damage: a board object; info: `infoSection` + reference strings).
Frontend has no unit-test runner (ESM; Mocha is backend/CJS), so verify via
`cd app && npm run build` + browser E2E: chat send/scroll, damage panel shows last battle,
Info button opens the side panel, sub-tabs switch, ✕/Esc/backdrop close, and the board isn't
permanently obscured.

## Out of scope (v1)
- A full Pokémon encyclopedia/wiki (separate, larger TODO) — the info panel covers only the
  existing reference (hotkeys, type effectiveness, type buffs).
- Chat categories/filtering; multi-round damage history (show latest battle only);
  reworking `leftBar`.

## Touched files
`app/src/App.jsx` (rightSide layout, `renderChatPanel`/`renderDamagePanel`/
`renderInfoSidepanel`, Info button, remove radio + `buildHelp`), `app/src/App.css` (panels,
side panel, damage bars, info button), `app/src/reducer.js` (`infoOpen`/`infoSection` +
actions). No backend changes.

## Workflow note
Implement on a feature branch (e.g. `feat/bottom-right-hud`), not on `main`; land only when
the user says so.
