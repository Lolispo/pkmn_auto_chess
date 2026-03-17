# Frontend — React + Redux

## Stack

- React 18 (class components, no hooks)
- Redux for state management
- react-redux 8.x
- Socket.io-client 2.x for real-time server communication
- Vite 5.x (bundler/dev server)
- CSS (no preprocessor, no CSS-in-JS)

## Structure

- `App.jsx` — Main monolithic component. Renders game UI, shop, board, chat, battle animations.
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
npm start        # Vite dev server on port 3000
npm run startboth  # Frontend + backend concurrently
npm run build    # Vite production build
npm run preview  # Preview production build
npm run lint     # ESLint
npm run lintfix  # ESLint auto-fix
```

## Notes

- JSX files use `.jsx` extension (required by Vite)
- Sprites are fetched from backend via `/sprites` endpoint (base64 JSON)
- Unit data fetched via `/unitJson` endpoint
- Vite proxy config forwards `/sprites` and `/unitJson` to backend on port 8000
- Backend must be running on port 8000 for the app to function
