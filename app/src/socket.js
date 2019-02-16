// src/socket.js
import io from 'socket.io-client';

const socket = io('http://localhost:8000');

// Receiving information
const configureSocket = dispatch => {
  // make sure our socket is connected to the port
  socket.on('connect', () => {
    console.log('connected');
    giveId();
  });

  // the socket.on method is like an event listener
  // just like how our redux reducer works
  // the different actions that our socket/client will emit
  // is catched by these listeners
  socket.on('UPDATED_PIECES', state => {
    console.log('Updating pieces');
    dispatch({ type: 'NEW_PIECES', newState: state});
  });


  socket.on('NEW_PLAYER', index => {
    dispatch({ type: 'NEW_PLAYER', index: index});
  });
  
  socket.on('ALL_READY', bool => {
    dispatch({ type: 'ALL_READY', value: bool});
  });
  
  return socket;
};



// the following are functions that our client side uses
// to emit actions to everyone connected to our web socket
export const sendNameToServer = name =>
  socket.emit('SEND_NAME_TO_SERVER', name);

export const ready = name =>
  socket.emit('READY', name);

export const giveId = () => 
  socket.emit('GIVE_ID');

export const startGame = () => 
  socket.emit('START_GAME');

export default configureSocket;