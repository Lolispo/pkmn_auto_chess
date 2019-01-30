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

// the following are fucntions that our client side uses
// to emit actions to everyone connected to our web socket

/*
    // TODO: Check if interesting
export const getCurrentPot = () => socket.emit('GET_CURRENT_POT');

export const sendNameToServer = name =>
  socket.emit('SEND_NAME_TO_SERVER', name);

export const sendPitchInToServer = name =>
  socket.emit('SOMEONE_PITCHED_IN', name);

export const sendGetOneToServer = name => socket.emit('SOMEONE_GOT_ONE', name);
*/

export default configureSocket;