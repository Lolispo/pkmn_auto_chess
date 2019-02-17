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
    console.log('Updating pieces'); // Only send the pieces instead
    dispatch({ type: 'NEW_PIECES', newState: state});
  });

  socket.on('UPDATED_STATE', state => {
    console.log('Updating state');
    dispatch({ type: 'NEW_STATE', newState: state});
  });

  socket.on('UPDATE_PLAYER', (index, player) => {
    dispatch({ type: 'UPDATE_PLAYER', index: index, player: player});
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
export const ready = () =>
  socket.emit('READY');

export const ready = () =>
  socket.emit('UNREADY');

export const giveId = () => 
  socket.emit('GIVE_ID');

export const startGame = () => 
  socket.emit('START_GAME');

export const toggleLock = (state) => 
  socket.emit('TOGGLE_LOCK', state);

export const buyUnit = (state, pieceIndex) => 
  socket.emit('BUY_UNIT', state, pieceIndex);

export const refreshShop = (state) => 
  socket.emit('REFRESH_SHOP', state);

export const placePiece = (state, from, to) => 
  socket.emit('PLACE_PIECE', state, from, to);

export const withdrawPiece = (state, from) => 
  socket.emit('WITHDRAW_PIECE', state, from);

export default configureSocket;