// Author: Petter Andersson

const gameJS = require('./game');
const { Map } = require('immutable');
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
   
  socket.on('READY', async (index) => {
    console.log('Player ' + index + ' is ready');
    readyList = readyList.set(index, true);
    if(readyList.every((val) => val)){
      socket.emit('ALL_READY', true);
    }
  });

  socket.on('UNREADY', async (index) => {
    console.log('Player ' + index + ' is unready');
    readyList = readyList.set(index, false);
    socket.emit('ALL_READY', false);
  });

  socket.on('START_GAME', async () => {
    state = await gameJS._startGame();
    console.log('Starting game!');
    socket.emit('UPDATED_PIECES', state); // state.getIn(['players', index])
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
