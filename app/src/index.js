import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';
import configureSocket from './socket';
import { createStore } from 'redux';
import reducer from './reducer';
import { Provider } from 'react-redux';
const store = createStore(reducer);

//ReactDOM.render(<App />, document.getElementById('root'));

// setup socket connection
export const socket = configureSocket(store.dispatch);

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
