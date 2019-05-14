// Author: Petter Andersson

// src/socket.js
import io from 'socket.io-client';

const url = window.location.href;
const ip = url.split(':3000')[0].split('http://')[1];
const ipAdress = 'http://' + ip + ':8000';
console.log('Connecting to ' + ipAdress + ' ...');
const socket = io(ipAdress);
let timeoutCounter = 1;

export async function AjaxLoadSprites(dispatch) {
  console.log('Fetching Sprites from ' + ipAdress + '/sprites');
  fetch(ipAdress + '/sprites', {
    method: 'GET',
    headers: {
      "Content-Type": "text/plain"
    },
  }).then(async response => {
    // console.log(response);
    const result = await response.json();
    // console.log(result);
    dispatch({ type: 'LOAD_SPRITES_JSON', pokemonSprites: result.sprites});
  }).catch((err) => {
    console.log('Failed to fetch', err);
    timeoutCounter = (timeoutCounter < 5 ? timeoutCounter + 1 : 10);
    setTimeout(() => { // Try again in 2 seconds
      AjaxLoadSprites(dispatch);
    }, 2000 * timeoutCounter); 
  });
}

export async function AjaxGetUnitJson(dispatch) {
  console.log('Fetching json from ' + ipAdress + '/unitJson');
  fetch(ipAdress + '/unitJson', {
    method: 'GET',
    headers: {
      "Content-Type": "text/plain"
    },
  }).then(async response => {
    // console.log(response);
    const result = await response.json();
    // console.log(result);
    dispatch({ type: 'LOAD_UNIT_JSON', json: result});
  }).catch((err) => {
    console.log('Failed to fetch', err);
  });
}

// Receiving information
export const configureSocket = dispatch => {
  // make sure our socket is connected to the port
  socket.on('connect', () => {
    console.log('Socket connected');
    dispatch({type: 'SET_CONNECTED', connected: true})
    giveId();
    /*
    const sprites = localStorage.getItem('sprites');
    if(sprites){
      dispatch({ type: 'LOAD_SPRITES_JSON', sprites});
    } else {
      getSprites();
    }
    */
  });

  socket.on('disconnect', () => {
    dispatch({type: 'SET_CONNECTED', connected: false})
    window.location.reload();
    console.log('disconnected');
  });

  socket.on('UPDATED_STATE', state => {
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
  
  socket.on('BATTLE_TIME', (actionStacks, battleStartBoards, winners, dmgBoards, enemy, roundType) => {
    dispatch({ type: 'BATTLE_TIME', actionStacks, battleStartBoards, winners, enemy, dmgBoards, roundType});
  });

  socket.on('END_BATTLE', (upcomingRoundType, upcomingGymLeader) => {
    // console.log('@endBattle', upcomingRoundType, upcomingGymLeader)
    if(upcomingGymLeader) {
      dispatch({ type: 'END_BATTLE', upcomingRoundType, upcomingGymLeader});
    } else {
      dispatch({ type: 'END_BATTLE', upcomingRoundType});
    }
    setTimeout(() => {
      dispatch({ type: 'CLEAR_TICKS'});
    }, 5000);
    setTimeout(() => {
      dispatch({ type: 'TOGGLE_SHOW_DMGBOARD'});
    }, 10000);
  });

  socket.on('END_GAME', winningPlayer => {
    dispatch({ type: 'END_GAME', winningPlayer});
    setTimeout(() => {
      window.location.reload();
    }, 60000);
  });

  socket.on('SET_STATS', (name, stats) => {
    dispatch({ type: 'SET_STATS', name, stats});
  });

  socket.on('SET_TYPE_BONUSES', (descs, bonuses, typeMap) => {
    dispatch({ type: 'SET_TYPE_BONUSES', typeDescs: descs, typeBonuses: bonuses, typeMap: typeMap});
  });

  socket.on('NEW_CHAT_MESSAGE', (senderMessage, message, type) => {
    dispatch({type: 'NEW_CHAT_MESSAGE', senderMessage, newMessage: message, chatType: type});
  });

  socket.on('DEAD_PLAYER', (pid, position) => {
    dispatch({type: 'DEAD_PLAYER', pid, position});
  });

  socket.on('UPDATE_PLAYER_NAME', (pid, name) => {
    dispatch({type: 'UPDATE_PLAYER_NAME', pid, name});
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

export const toggleLock = (state) => 
  socket.emit('TOGGLE_LOCK', state);

export const buyUnit = (state, pieceIndex) =>
  socket.emit('BUY_UNIT', state, pieceIndex);  

export const buyExp = (state) =>
  socket.emit('BUY_EXP', state);  

export const refreshShop = (state) => 
  socket.emit('REFRESH_SHOP', state);

export const placePiece = (state, from, to) => 
  socket.emit('PLACE_PIECE', state, from, to);

export const withdrawPiece = (state, from) => 
  socket.emit('WITHDRAW_PIECE', state, from);

export const sellPiece = (state, from) => 
  socket.emit('SELL_PIECE', state, from);

export const battleReady = (state) => 
  socket.emit('BATTLE_READY', state);

export const getStats = (name) => 
  socket.emit('GET_STATS', name);

export const sendMessage = message => 
  socket.emit('SEND_MESSAGE', message);

export const getSprites = () => 
  socket.emit('GET_SPRITES');

export const updatePlayerName = (name) => 
  socket.emit('UPDATE_PLAYER_NAME', name);

export default configureSocket;