// Author: Petter Andersson

// src/socket.js
import io from 'socket.io-client';

const socket = io('http://192.168.0.28:8000');

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
  
  socket.on('LOCK_TOGGLED', (index, lock) => {
    dispatch({ type: 'LOCK_TOGGLED', index: index, lock: lock});
  });

  socket.on('NEW_PLAYER', index => {
    dispatch({ type: 'NEW_PLAYER', index: index});
  });

  // TODO Update in reducer for Allready and ready
  socket.on('ALL_READY', (playersReady, connectedPlayers, allReady) => {
    dispatch({ type: 'ALL_READY', playersReady: playersReady, connectedPlayers: connectedPlayers, value: allReady});
  });

  socket.on('READY', (playersReady, connectedPlayers) => {
    dispatch({ type: 'READY', playersReady: playersReady, connectedPlayers: connectedPlayers});
  });
  
  socket.on('BATTLE_TIME', (actionStacks, battleStartBoards, enemy) => {
    dispatch({ type: 'BATTLE_TIME', actionStacks, battleStartBoards, enemy});
  });

  socket.on('END_BATTLE', () => {
    dispatch({ type: 'END_BATTLE'});
  });

  socket.on('END_GAME', winningPlayer => {
    dispatch({ type: 'END_GAME', winningPlayer});
  });

  socket.on('SET_STATS', (name, stats) => {
    console.log('@socket.setStats')
    dispatch({ type: 'SET_STATS', name, stats});
  });
  
  return socket;
};



// the following are functions that our client side uses
// to emit actions to everyone connected to our web socket
export const ready = () =>
  socket.emit('READY');

export const unready = () =>
  socket.emit('UNREADY');

export const giveId = () => 
  socket.emit('GIVE_ID');

export const startGame = amountToPlay => 
  socket.emit('START_GAME', amountToPlay);

export const toggleLock = (state) => {
  if(state.players) {
    socket.emit('TOGGLE_LOCK', state);
  }
}

export const buyUnit = (state, pieceIndex) => {
  socket.emit('BUY_UNIT', state, pieceIndex);  
}

export const buyExp = (state) => {
  socket.emit('BUY_EXP', state);  
}

export const refreshShop = (state) => 
  socket.emit('REFRESH_SHOP', state);

export const placePiece = (state, from, to) => 
  socket.emit('PLACE_PIECE', state, from, to);

export const withdrawPiece = (state, from) => 
  socket.emit('WITHDRAW_PIECE', state, from);

export const sellPiece = (state, from) => 
  socket.emit('SELL_PIECE', state, from);

export const battleReady = (state) => {
  socket.emit('BATTLE_READY', state);
}

export const getStats = (name) => {
  socket.emit('GET_STATS', name);
}

export default configureSocket;