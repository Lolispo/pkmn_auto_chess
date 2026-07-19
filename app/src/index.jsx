import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ScaleStage from './ScaleStage';
import { configureSocket, AjaxLoadSprites } from './socket';
import { createStore } from 'redux';
import reducer from './reducer';
import { Provider } from 'react-redux';
import { installOffscreenDetector } from './offscreenDetector';
const store = createStore(reducer);

// Dev-only: press F9 to highlight anything rendered outside the viewport (replaces zoom-out check).
installOffscreenDetector();

// Set up the socket connection. The backend is scale-to-zero and is woken explicitly
// via the "Wake server" button (see App), not automatically on load.
export const socket = configureSocket(store.dispatch);
AjaxLoadSprites(store.dispatch);

const root = createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <ScaleStage>
      <App />
    </ScaleStage>
  </Provider>
);
