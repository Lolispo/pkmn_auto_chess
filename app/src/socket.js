// src/socket.js
import io from 'socket.io-client';

const socket = io('http://localhost:8000');

const configureSocket = dispatch => {
  // make sure our socket is connected to the port
  socket.on('connect', () => {
    console.log('connected');
  });

  // the socket.on method is like an event listener
  // just like how our redux reducer works
  // the different actions that our socket/client will emit
  // is catched by these listeners
  socket.on('UPDATED_PIECES', state => {
    dispatch({ type: 'NEW_PIECES', newState: state});
  });
  return socket;
};

// the following are functions that our client side uses
// to emit actions to everyone connected to our web socket
export const sendNameToServer = name =>
  socket.emit('SEND_NAME_TO_SERVER', name);

export default configureSocket;