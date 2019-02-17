// Author: Petter Andersson

const gameJS = require('./game');
const { Map, fromJS } = require('immutable');
const sessionJS = require('./session');

let nextPlayerIndex = 0;
let connectedPlayers = Map({});
let readyList = Map({});

module.exports = function (socket, io) {
  /*
    Example io code
    io.on('connection', function(socket){
        socket.emit('request', ); // emit an event to the socket
        io.emit('broadcast', ); // emit an event to all connected sockets
        socket.on('reply', function(){  }); // listen to the event
    });
  */
       
  socket.on('GIVE_ID', async () => {
    console.log('@Give_id', nextPlayerIndex)
    connectedPlayers = connectedPlayers.set(socket.id, nextPlayerIndex);
    if(connectedPlayers.size <= 8)
      socket.emit('NEW_PLAYER', nextPlayerIndex);
    else{
      // Don't allow more players TODO: Do something
      socket.emit('NEW_PLAYER', nextPlayerIndex);
    } 
    nextPlayerIndex = sessionJS.findFirstAvailableIndex(connectedPlayers);
  });
   
  socket.on('READY', async () => {
    const index = connectedPlayers.get(socket.id);
    console.log('Player ' + index + ' is ready');
    readyList = readyList.set(index, true);
    if(readyList.every((val) => val)){
      socket.emit('ALL_READY', true);
    }
  });

  socket.on('UNREADY', async () => {
    const index = connectedPlayers.get(socket.id);
    console.log('Player ' + index + ' is unready');
    readyList = readyList.set(index, false);
    socket.emit('ALL_READY', false);
  });

  socket.on('START_GAME', async () => {
    const state = await gameJS._startGame();
    console.log('Starting game!');
    socket.emit('UPDATED_STATE', state); // state.getIn(['players', index])
  });
  
  socket.on('TOGGLE_LOCK', async (stateParam) => {
    const index = connectedPlayers.get(socket.id);
    // const state = await gameJS.toggleLock(fromJS(stateParam), String(index));
    console.log('Toggling Lock for Shop! prev lock =', (fromJS(stateParam)).getIn(['players', String(index), 'lock']));
    socket.emit('LOCK_TOGGLED', index, (!(fromJS(stateParam)).getIn(['players', String(index), 'lock']) ? true : false));
  });

  socket.on('BUY_UNIT', async (stateParam, pieceIndex) => {
    const index = connectedPlayers.get(socket.id);
    const state = await gameJS.buyUnit(fromJS(stateParam), String(index), pieceIndex);
    // Gold, shop, hand
    console.log('Bought unit at ', pieceIndex);
    socket.emit('UPDATE_PLAYER', index, state.getIn(['players', String(index)]));
  });
  
  socket.on('REFRESH_SHOP', async (stateParam) => {
    const index = connectedPlayers.get(socket.id);
    const state = await gameJS._refreshShop(fromJS(stateParam), String(index));
    console.log('Refreshes Shop');
    // Requires Shop and Pieces
    socket.emit('UPDATE_PLAYER', index, state.getIn(['players', String(index)]));
    socket.emit('UPDATED_PIECES', state);
  });

  socket.on('PLACE_PIECE', async (stateParam, from, to) => {
    const index = connectedPlayers.get(socket.id);
    const state = await gameJS._placePiece(fromJS(stateParam), String(index), from, to);
    console.log('Place piece at ', from, ' at', to);
    // Hand and board
    socket.emit('UPDATE_PLAYER', index, state.getIn(['players', String(index)]));
  });

  socket.on('WITHDRAW_PIECE', async (stateParam, from) => {
    const index = connectedPlayers.get(socket.id);
    const state = await gameJS._withdrawPiece(fromJS(stateParam), String(index), from);
    console.log('Withdraw piece at ', from);
    // Hand and board
    socket.emit('UPDATE_PLAYER', index, state.getIn(['players', String(index)]));
  });

  // broadcast to everyone if somebody pitched in
  // Temp function to showcase syntax
  socket.on('UPDATE_EVERYONES_PIECES', (state) => {
    socket.broadcast.emit('UPDATED_PIECES', state);
  });

  // disconnect logic
  socket.on('disconnect', () => {
    // Find which connection disconnected, remove data from that person
    console.log('disconnected player ... index =', connectedPlayers.get(socket.id))
    connectedPlayers = connectedPlayers.delete(socket.id);
    nextPlayerIndex = sessionJS.findFirstAvailableIndex(connectedPlayers);
  });
};
