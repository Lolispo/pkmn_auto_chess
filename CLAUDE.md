# Pokemon Auto Chess

A multiplayer auto-battler game inspired by Dota Auto Chess, using Pokemon as units.

## Architecture

```
src/           → Backend (Node.js/Express + Socket.io, port 8000)
app/src/       → Frontend (React + Redux, port 3000)
test/          → Mocha tests
*.json (root)  → Pokemon data files (stats, abilities, sprites, types)
```

### Backend modules

| File | Purpose |
|---|---|
| `index.js` | Express server + Socket.io setup |
| `socketcontroller.js` | Socket event routing → game logic |
| `game.js` | Core game engine (battle, economy, leveling) |
| `game_constants.js` | Rarity probabilities, level curves, config |
| `types.js` | Type bonus system (team composition bonuses) |
| `abilities.js` | Pokemon ability definitions |
| `pokemon.js` | Pokemon stats loader from JSON |
| `deck.js` | Deck/piece-pool building |
| `player.js` | Player initialization |
| `session.js` | Session/lobby management |
| `f.js` | Shared utility functions |

### Frontend modules

| File | Purpose |
|---|---|
| `App.jsx` | Main React component (monolithic) |
| `reducer.js` | Redux state management |
| `socket.js` | Socket.io client setup + listeners |
| `events.js` | Player action → socket emission mapping |
| `audio.js` | Sound effect + music management |
| `images.js` | Asset loading utilities |
| `f.js` | Shared utility functions |

### Data flow

1. Player connects via WebSocket → `socketcontroller` manages lobby
2. Game starts → `game.js:initEmptyState` builds Immutable.js state
3. Gameplay: buy/place/battle phases cycle each round
4. Backend is source of truth; state synced to clients via Socket.io
5. Frontend Redux store mirrors backend state for rendering

## Key patterns

- **Immutable.js everywhere** in backend — all game state is `Immutable.Map`/`List`. Use `.get()`, `.set()`, `.getIn()`, `.setIn()` etc.
- **No TypeScript** — plain JavaScript throughout
- **Snake_case** allowed (ESLint camelcase rule is off)
- **Console logging** allowed (ESLint no-console is off)
- **Private functions tested via `rewire`** — `game_test.js` uses `rewire` to access unexported functions

## Commands

```bash
# Run backend
npm start

# Run frontend (Vite dev server)
cd app && npm start

# Run both concurrently
cd app && npm run startboth

# Build frontend for production
cd app && npm run build

# Run tests
npm test

# Lint
npm run lint
npm run lintfix

# Docker
npm run container:start   # docker compose up -d
npm run container:stop    # docker compose down
```

## Testing

- Framework: Mocha with Node.js `assert`
- Tests live in `test/game_test.js`
- Uses `rewire` to test private functions from `game.js`
- Run: `npm test` (also lints before/after)

## Linting

- ESLint with Airbnb config
- Key overrides: no-console off, camelcase off, max-len off, no-plusplus off
- Run: `npm run lint` / `npm run lintfix`

## Debugging / logs (hosted backend)

Backend logs live in CloudWatch (region `eu-north-1`, profile `private`). Quick access:

```bash
infra/dump-logs.sh task            # game-server logs → /tmp/pkmn-task-logs.log
infra/dump-logs.sh task --follow   # stream live
infra/dump-logs.sh task --browser  # open in CloudWatch console
```
Components: `task` (game server), `waker`, `sleeper`, `dns`. Full guide: `docs/debugging.md`.
Architecture + deploy: `docs/architecture.md`.

## Data files (root)

- `pokemon.json` — base stats for all Pokemon
- `pokemonAbilities.json` — ability definitions
- `pokemonSprites.json` — base64-encoded GIF sprites (~14MB, do not read casually)
- `pokemonTypes.json` — type information

## Game concepts

- **Rarity tiers**: Cost 1-5, with decreasing shop probability
- **Evolution**: Combine 3 identical units → upgraded unit
- **Type bonuses**: 2+ units of same type grant team buffs (attack, defense, HP, etc.)
- **Mana system**: Units gain mana in combat, cast abilities when full
- **Battle**: Automated combat with movement, targeting, AOE effects
