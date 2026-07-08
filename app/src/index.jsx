import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { configureSocket, AjaxLoadSprites, wakeBackend } from './socket';
import { createStore } from 'redux';
import reducer from './reducer';
import { Provider } from 'react-redux';
const store = createStore(reducer);

// wake the scale-to-zero backend, then set up the socket connection
wakeBackend();
export const socket = configureSocket(store.dispatch);
AjaxLoadSprites(store.dispatch);

const root = createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
