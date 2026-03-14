# Frontend — React + Redux

## Stack

- React 16 (class components, no hooks)
- Redux for state management
- Socket.io-client for real-time server communication
- Create React App (react-scripts 2.x)
- CSS (no preprocessor, no CSS-in-JS)

## Structure

- `App.js` — Main monolithic component. Renders game UI, shop, board, chat, battle animations.
- `reducer.js` — Redux reducer handling all game state actions
- `socket.js` — Configures socket listeners, dispatches Redux actions on server events
- `events.js` — Maps user interactions to socket emissions (buy, place, ready, etc.)
- `audio.js` — Manages background music and sound effects
- `images.js` — Loads type icons and other image assets
- `assets/` — Music, sound effects, Pokemon cries, images

## Data flow

```
User interaction → events.js → socket.emit() → server
Server → socket event → socket.js listener → dispatch(action) → reducer → React re-render
```

## Commands

```bash
npm start        # Dev server on port 3000
npm run startboth  # Frontend + backend concurrently
npm run build    # Production build
npm run lint     # ESLint
npm run lintfix  # ESLint auto-fix
```

## Notes

- Sprites are fetched from backend via `/sprites` endpoint (base64 JSON)
- Unit data fetched via `/unitJson` endpoint
- Backend must be running on port 8000 for the app to function
