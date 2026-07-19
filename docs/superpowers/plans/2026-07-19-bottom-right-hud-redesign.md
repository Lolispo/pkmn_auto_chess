# Bottom-right HUD Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the cramped 5-way tabbed bottom-right panel with three purpose-built surfaces: an always-visible Chat panel, an always-visible Damage panel, and an on-demand slide-in Info side panel (Hotkeys / Types / Buffs).

**Architecture:** Frontend-only, no backend. Keep the existing "render-helper method on `App`" pattern (like `buildHelp`/`getDmgBoard`). Add `infoOpen`/`infoSection` Redux state; add `renderChatPanel`/`renderDamagePanel`/`renderInfoSidepanel`; rebuild the `rightSide` bottom area as `[Damage][Chat]` side by side; open the info panel with a button + close via ✕/backdrop/Esc.

**Tech Stack:** React 18 class components (no hooks), Redux, Vite, plain CSS. Frontend is ESM; no frontend unit-test runner (verify via build + browser E2E).

## Global Constraints

- **React class components, no hooks.** Render surfaces as methods on `App`.
- **No backend changes.** Reuse existing state (`chatMessages`, `senderMessages`, `dmgBoard`, `prevDmgBoard`, `typeStatsString`, `typeBonusString`) and events (`handleChatSubmit`, `sendMessage`).
- **Work on branch `feat/bottom-right-hud`** (already created). Do NOT push to `main`; land only when the user says so.
- **Style to match the menu/lobby system:** panels `background: rgba(15,17,25,0.82)`, `border: 1px solid rgba(255,255,255,0.14)`, `border-radius: 14px`, uppercase letter-spaced headers (like `.lobbyHeader`), accent `#ffcb05`.
- **Panel order is a one-line swap** (Damage vs Chat) — user is unsure which side; keep it trivial to flip.
- Verify each task: `cd app && npm run build`, then browser E2E on `http://localhost:3007/`.

---

### Task 1: Redux state + actions for the info panel

**Files:**
- Modify: `app/src/reducer.js` (initial state ~line 96; `NEW_PLAYER` reset ~line 266; add cases near `TOGGLE_HELP` ~line 335)

**Interfaces:**
- Consumes: nothing.
- Produces: state `infoOpen: boolean`, `infoSection: 'hotkeys'|'types'|'buffs'`; actions `TOGGLE_INFO` (flip `infoOpen`), `SET_INFO_OPEN` (`{open}`), `SET_INFO_SECTION` (`{section}`).

- [ ] **Step 1: Add initial state fields**

In `app/src/reducer.js`, in the initial state object, right after `chatHelpMode: 'chat',` (~line 97):

```js
    chatHelpMode: 'chat',
    infoOpen: false,
    infoSection: 'hotkeys',
```

- [ ] **Step 2: Reset on NEW_PLAYER**

In the `NEW_PLAYER` case, right after `chatHelpMode: 'chat',` (~line 267):

```js
        chatHelpMode: 'chat',
        infoOpen: false,
        infoSection: 'hotkeys',
```

- [ ] **Step 3: Add the reducer cases**

In `app/src/reducer.js`, immediately after the `SET_HELP_MODE` case (the one ending `showDmgBoard: false}` ~line 339, before its `break;`'s following case), add:

```js
    case 'TOGGLE_INFO':
      state = {...state, infoOpen: !state.infoOpen}
      break;
    case 'SET_INFO_OPEN':
      state = {...state, infoOpen: action.open}
      break;
    case 'SET_INFO_SECTION':
      state = {...state, infoSection: action.section, infoOpen: true}
      break;
```

- [ ] **Step 4: Build**

Run: `cd app && npm run build`
Expected: PASS (state/actions unused until Task 2 — just confirms it parses).

- [ ] **Step 5: Commit**

```bash
cd /Users/petter/HobbyProjects/pkmn_auto_chess
git add app/src/reducer.js
git commit -m "feat(hud): infoOpen/infoSection state + TOGGLE_INFO/SET_INFO_SECTION actions"
```

---

### Task 2: Info side panel + Info button (additive — old radio still present)

**Files:**
- Modify: `app/src/App.jsx` (add `renderInfoSidepanel` method; add Info button in the controls area ~line 1723; add `Escape` case in `handleKeyPress` ~line 855; render `{this.renderInfoSidepanel()}` in the game view; add `infoOpen`/`infoSection` to `mapStateToProps` ~line 1788)
- Modify: `app/src/App.css` (info button + side panel styles)

**Interfaces:**
- Consumes: `infoOpen`, `infoSection` (Task 1); existing `typeStatsString`, `typeBonusString`.
- Produces: `renderInfoSidepanel()` returning the overlay or `null`.

- [ ] **Step 1: Add the `renderInfoSidepanel` method**

In `app/src/App.jsx`, add this method just before `buildHelp = () => {` (~line 1399):

```js
  renderInfoSidepanel = () => {
    if (!this.props.infoOpen) return null;
    const hotkeys = 'Q  Place unit\nW  Withdraw unit\nE  Sell unit\nF  Buy exp\nD  Refresh shop\n1-8  Select hand slot';
    const section = this.props.infoSection;
    let body;
    if (section === 'types') body = this.props.typeStatsString || 'Type info appears once a game starts.';
    else if (section === 'buffs') body = this.props.typeBonusString || 'Type buffs appear once a game starts.';
    else body = hotkeys;
    const tab = (key, label) => (
      <button key={key}
        className={`infoTab ${section === key ? 'infoTabActive' : ''}`}
        onClick={() => this.props.dispatch({ type: 'SET_INFO_SECTION', section: key })}>{label}</button>
    );
    return (
      <div className='infoBackdrop' onClick={() => this.props.dispatch({ type: 'SET_INFO_OPEN', open: false })}>
        <div className='infoPanelSide' onClick={(e) => e.stopPropagation()}>
          <div className='infoPanelHeader'>
            <span className='infoPanelTitle'>Info</span>
            <button className='infoClose' onClick={() => this.props.dispatch({ type: 'SET_INFO_OPEN', open: false })}>✕</button>
          </div>
          <div className='infoTabs'>{tab('hotkeys', 'Hotkeys')}{tab('types', 'Types')}{tab('buffs', 'Buffs')}</div>
          <div className='infoBody text_shadow'>{body}</div>
        </div>
      </div>
    );
  }
```

- [ ] **Step 2: Add an Escape-to-close case in `handleKeyPress`**

In `app/src/App.jsx` `handleKeyPress` (~line 855), add as the first `case` inside the `switch(event.key){`:

```js
      case 'Escape':
        if (this.props.infoOpen) this.props.dispatch({ type: 'SET_INFO_OPEN', open: false });
        break;
```

- [ ] **Step 3: Add the Info button (replace the collapse toggle image)**

In `app/src/App.jsx`, replace the `toggleHelpDiv` block (~lines 1723-1726):

```jsx
            <div className='toggleHelpDiv'>
              <img className='toggleHelpImg' src={(this.props.help ? getImage('collapse') : getImage('collapseNot'))} 
                    onClick={() => this.props.dispatch({type: 'TOGGLE_HELP'})} alt='toggleHelp'/>
            </div>
```

with:

```jsx
            <div className='toggleHelpDiv'>
              <button className='infoOpenBtn' onClick={() => this.props.dispatch({type: 'TOGGLE_INFO'})}>ⓘ Info</button>
            </div>
```

- [ ] **Step 4: Render the side panel in the game view**

In `app/src/App.jsx`, in the `gameIsLive` return (~line 1762), add `{this.renderInfoSidepanel()}` right after the `wholeBody` div closes:

```jsx
      <div className='flex wholeBody' onKeyDown={(event) => this.handleKeyPress(event)} tabIndex='0'>
        {leftBar}
        {boardDiv}
        {rightSide}
      </div>
      {this.renderInfoSidepanel()}
      <input className='hidden' type='checkbox' checked={this.props.startBattle} onChange={(this.props.startBattle ? this.startBattleEvent.bind(this)() : () => '')}/>
```

- [ ] **Step 5: Expose new props**

In `mapStateToProps` (~line 1789, after `chatHelpMode: state.chatHelpMode,`):

```js
  chatHelpMode: state.chatHelpMode,
  infoOpen: state.infoOpen,
  infoSection: state.infoSection,
```

- [ ] **Step 6: Add CSS**

In `app/src/App.css`, append at end of file:

```css
/* ---- Info side panel ---- */
.infoOpenBtn {
  padding: 7px 12px; border: none; border-radius: 9px; cursor: pointer;
  font-family: sans-serif; font-weight: 800; font-size: 13px; color: #e7eaf2;
  background: rgba(255, 255, 255, 0.08); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
}
.infoOpenBtn:hover { filter: brightness(1.15); }
.infoBackdrop {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.35); z-index: 1000;
  display: flex; justify-content: flex-end;
}
.infoPanelSide {
  width: 340px; max-width: 90%; height: 100%; padding: 18px 20px;
  background: rgba(15, 17, 25, 0.96); border-left: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: -12px 0 40px rgba(0, 0, 0, 0.5); color: #f3f5fb; font-family: sans-serif;
  overflow-y: auto;
}
.infoPanelHeader { display: flex; align-items: center; justify-content: space-between; }
.infoPanelTitle { font-size: 16px; font-weight: 800; letter-spacing: 0.3px; }
.infoClose {
  border: none; background: transparent; color: #a6adbe; font-size: 18px; cursor: pointer; line-height: 1;
}
.infoClose:hover { color: #fff; }
.infoTabs { display: flex; gap: 6px; margin: 14px 0; }
.infoTab {
  flex: 1; padding: 8px 6px; border: none; border-radius: 8px; cursor: pointer;
  font-family: sans-serif; font-weight: 700; font-size: 12.5px; color: #a6adbe;
  background: rgba(255, 255, 255, 0.06);
}
.infoTab:hover { color: #fff; }
.infoTabActive { color: #1b1d26; background: #ffcb05; }
.infoBody { white-space: pre-line; font-size: 13.5px; line-height: 1.6; color: #d7dbe6; }
```

- [ ] **Step 7: Build + E2E**

Run: `cd app && npm run build` → Expected: PASS.
Browser (`http://localhost:3007/`, start a game): click **ⓘ Info** → panel slides from the right; **Hotkeys/Types/Buffs** tabs switch content; **✕**, **backdrop click**, and **Esc** all close it; the board is visible again after closing. (The old radio panel still works — removed in Task 3.)

- [ ] **Step 8: Commit**

```bash
cd /Users/petter/HobbyProjects/pkmn_auto_chess
git add app/src/App.jsx app/src/App.css
git commit -m "feat(hud): slide-in Info side panel (hotkeys/types/buffs) + Info button"
```

---

### Task 3: Always-visible Chat + Damage panels; remove the radio/tab panel

**Files:**
- Modify: `app/src/App.jsx` (add `renderChatPanel` + `renderDamagePanel`; replace the radio/`buildHelp` block ~lines 1738-1758 with the two panels; delete `buildHelp`)
- Modify: `app/src/App.css` (chat + damage panel styles)

**Interfaces:**
- Consumes: existing `chatMessages`, `senderMessages`, `chatMessageInput` state, `handleChatSubmit`, `messagesEnd` ref, `getDmgBoard`, `dmgBoard`, `prevDmgBoard`, `dmgBoardTotalDmg`.
- Produces: `renderChatPanel()`, `renderDamagePanel()`.

- [ ] **Step 1: Add `renderChatPanel` and `renderDamagePanel`**

In `app/src/App.jsx`, add both methods just before `renderInfoSidepanel` (~line 1399):

```js
  renderChatPanel = () => {
    const messages = [];
    for (let i = 0; i < this.props.chatMessages.length; i++) {
      messages.push(
        <div key={i}><span className='text_shadow bold'>{this.props.senderMessages[i]}</span><span>{this.props.chatMessages[i]}</span></div>
      );
    }
    return (
      <div className='hudPanel chatPanel'>
        <div className='hudPanelHeader'>Chat</div>
        <div className='messagesContainer'>{messages}</div>
        <div style={{ float: 'left', clear: 'both' }} ref={(el) => { this.messagesEnd = el; }}></div>
        <form className='chatTypingDiv' onSubmit={this.handleChatSubmit}>
          <input placeholder='Type a message …' className='textInput' type='text' value={this.state.chatMessageInput}
            onChange={(event) => this.setState({ ...this.state, chatMessageInput: event.target.value })} />
          <input className='text_shadow normalButton chatTypingSubmit' type='submit' value='Send' />
        </form>
      </div>
    );
  }

  renderDamagePanel = () => {
    const cur = this.props.dmgBoard && Object.keys(this.props.dmgBoard).length > 0 ? this.props.dmgBoard : null;
    const prev = this.props.prevDmgBoard && Object.keys(this.props.prevDmgBoard).length > 0 ? this.props.prevDmgBoard : null;
    const board = cur || prev;
    const label = cur ? 'Last battle' : (prev ? 'Previous round' : '');
    return (
      <div className='hudPanel damagePanel'>
        <div className='hudPanelHeader'>Damage{label ? ` · ${label}` : ''}</div>
        {board
          ? <div className='dmgBoardDiv helpText text_shadow'>{this.getDmgBoard(board)}</div>
          : <div className='hudEmpty'>No battles yet</div>}
      </div>
    );
  }
```

- [ ] **Step 2: Replace the radio/`buildHelp` block with the two panels**

In `app/src/App.jsx`, replace this block (~lines 1738-1758):

```jsx
        <div>
          {(this.props.help ? <div className='text_shadow marginTop5'>
            <input className='check' type='radio' name='helpRadio' onChange={() => this.props.dispatch({type: 'SET_HELP_MODE', chatHelpMode: 'chat'})}/>
            <label className='labels'>Chat</label> 
            <input className='check' type='radio' name='helpRadio' onChange={() => this.props.dispatch({type: 'SET_HELP_MODE', chatHelpMode: 'hotkeys'})}/> 
            <label className='labels'>Hotkeys</label> 
            <input className='check' type='radio' name='helpRadio' onChange={() => this.props.dispatch({type: 'SET_HELP_MODE', chatHelpMode: 'types'})}/>
            <label className='labels'>Types</label> 
            <input className='check' type='radio' name='helpRadio' onChange={() => this.props.dispatch({type: 'SET_HELP_MODE', chatHelpMode: 'typeBonuses'})}/>
            <label className='labels'>Buffs</label> 
            <input className='check' type='radio' name='helpRadio' onChange={() => this.props.dispatch({type: 'SET_HELP_MODE', chatHelpMode: 'damageBoard'})}/>
            <label className='labels'>Damage</label> 
          </div>: '')}
            {(!this.props.onGoingBattle && this.props.dmgBoard && Object.keys(this.props.dmgBoard).length > 0 && (this.props.showDmgBoard
              || this.props.chatHelpMode === 'damageBoard') ? <div className='dmgBoardDiv helpText text_shadow'>
              <span className='bold'>Damage Dealt:</span>{this.getDmgBoard(this.props.dmgBoard)}
            </div> : (this.props.onGoingBattle && this.props.prevDmgBoard && Object.keys(this.props.prevDmgBoard).length > 0 && (this.props.showDmgBoard
              || this.props.chatHelpMode === 'damageBoard') ? <div className='dmgBoardDiv helpText text_shadow'>
              <span className='bold'>Damage Dealt Previous Round:</span>{this.getDmgBoard(this.props.prevDmgBoard)}
            </div> : (this.props.help ? this.buildHelp() : '')))}
        </div>
```

with (Damage left, Chat right — swap the two lines to flip):

```jsx
        <div className='hudPanels flex'>
          {this.renderDamagePanel()}
          {this.renderChatPanel()}
        </div>
```

- [ ] **Step 3: Delete the now-unused `buildHelp` method**

In `app/src/App.jsx`, delete the entire `buildHelp = () => { ... }` method (from `buildHelp = () => {` through its closing `}` ~lines 1399-1459 in the original, now shifted down by Tasks 2-3 additions). It has no remaining callers after Step 2.

- [ ] **Step 4: Add CSS**

In `app/src/App.css`, append at end of file:

```css
/* ---- Bottom-right HUD panels ---- */
.hudPanels { gap: 12px; margin-top: 6px; align-items: stretch; }
.hudPanel {
  background: rgba(15, 17, 25, 0.82); border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 14px; padding: 10px 12px; color: #f3f5fb; font-family: sans-serif;
}
.hudPanelHeader {
  font-size: 11px; text-transform: uppercase; letter-spacing: 1.4px; color: #a6adbe; margin-bottom: 8px;
}
.hudEmpty { font-size: 12.5px; color: #8b92a4; font-style: italic; }
.damagePanel { width: 240px; }
.chatPanel { width: 300px; display: flex; flex-direction: column; }
.chatPanel .messagesContainer { flex: 1 1 auto; max-height: 150px; overflow-y: auto; font-size: 13px; }
.chatPanel .chatTypingDiv { display: flex; gap: 6px; margin-top: 8px; }
.chatPanel .textInput { flex: 1 1 auto; min-width: 0; }
```

- [ ] **Step 5: Build + E2E**

Run: `cd app && npm run build` → Expected: PASS, no reference to `buildHelp` remains (grep to confirm: `grep -n buildHelp app/src/App.jsx` → no matches).
Browser (start a game, play a round): **Chat** panel shows messages and can send; **Damage** panel shows "No battles yet" pre-battle and the sorted damage bars after a battle (and previous round during battle); both are visible together without switching tabs; the **ⓘ Info** panel still opens/closes. Confirm the Damage/Chat left-right order reads well — if not, swap the two lines in Step 2.

- [ ] **Step 6: Commit**

```bash
cd /Users/petter/HobbyProjects/pkmn_auto_chess
git add app/src/App.jsx app/src/App.css
git commit -m "feat(hud): always-visible Chat + Damage panels; remove radio tab panel"
```

---

## Self-Review (completed while writing)

- **Spec coverage:** chat-only panel (T3), always-visible damage panel (T3), slide-in info panel with hotkeys/types/buffs + open button + ✕/backdrop/Esc (T2), removal of radio + help-collapse + damage gating (T3), `infoOpen`/`infoSection` state (T1), style matches menu/lobby (T2/T3 CSS), no backend changes. All spec sections mapped.
- **Ordering:** T2 adds the info panel *before* T3 removes the radio, so hotkeys/types/buffs are never unreachable in an intermediate state.
- **Placeholder scan:** none — all steps carry full code.
- **Type/name consistency:** `infoOpen`/`infoSection`, `TOGGLE_INFO`/`SET_INFO_OPEN`/`SET_INFO_SECTION`, `renderInfoSidepanel`/`renderChatPanel`/`renderDamagePanel` used identically across tasks. Reused `getDmgBoard`, `handleChatSubmit`, `messagesEnd`, `chatMessageInput` match existing definitions.
- **Deviation:** no automated unit test (frontend has no ESM test runner, as established) — verified via build + browser E2E. Panels are pure render methods over existing state.
- **Left/right order** kept as a two-line swap in T3 Step 2 per the user's uncertainty.
