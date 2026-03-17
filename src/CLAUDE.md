# Backend — Node.js + Express + Socket.io

## Stack

- Express 4.x (HTTP server + static endpoints)
- Socket.io 2.x (real-time game state sync)
- Immutable.js 3.x (all game state is immutable data structures)
- CORS enabled

## Key files

- `index.js` — Server bootstrap. Loads Pokemon data from root JSON files, starts Express on port 8000, initializes Socket.io.
- `socketcontroller.js` — All socket event handlers. Routes events to game logic. This is the "controller" layer.
- `game.js` — Core engine (~2100 lines). Handles battle simulation, shop, economy, leveling, unit placement, combat resolution. All state manipulation returns new Immutable maps.
- `game_constants.js` — Configuration: rarity probabilities per level, XP curves, gold rewards.
- `types.js` — Type bonus definitions and application logic (~560 lines).
- `abilities.js` — Individual Pokemon ability implementations.
- `session.js` — Lobby/session management, player tracking.
- `player.js` — Player state initialization.
- `deck.js` — Builds the shared piece pool from Pokemon data.
- `pokemon.js` — Loads and parses Pokemon JSON data into Immutable structures.
- `f.js` — Utility functions (shared between modules).

## Immutable.js patterns

All game state is `Immutable.Map` or `Immutable.List`. Common operations:

```js
state.get('key')
state.set('key', value)
state.getIn(['nested', 'path'])
state.setIn(['nested', 'path'], value)
state.updateIn(['path'], v => v + 1)
```

Never mutate state directly. Always return new immutable structures.

## Testing

Tests are in `test/game_test.js`. They use `rewire` to access private (non-exported) functions:

```js
const game = rewire('../src/game');
const privateFunc = game.__get__('privateFunc');
```

Run: `npm test` from project root.
