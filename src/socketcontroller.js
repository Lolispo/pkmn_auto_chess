// Author: Petter Andersson

const gameJS = require('./game');
const { Map, fromJS } = require('immutable');
const sessionJS = require('./session');

let nextPlayerIndex = 0;
let connectedPlayers = Map({});
let readyList = Map({});
let counter = 1; // 0, 1 is for testing alone
let prepBattleState;

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
    connectedPlayers = connectedPlayers.set(socket.id, String(nextPlayerIndex));
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
    // console.log('@startGame shop', state.getIn(['players', 0, 'shop']))
    // console.log('@startGame shop', state.getIn(['players', 0, 'shop']).toJS())
    // TODO: Prevent starting new game when game is live
    // Send to all connected sockets
    socket.emit('UPDATED_STATE', state.setIn(['players', 0, 'gold'], 1000)); // state.getIn(['players', index])
  });
  
  socket.on('TOGGLE_LOCK', async (stateParam) => {
    const index = connectedPlayers.get(socket.id);
    // const state = await gameJS.toggleLock(fromJS(stateParam), index);
    console.log('Toggling Lock for Shop! prev lock =', (fromJS(stateParam)).getIn(['players', index, 'lock']));
    socket.emit('LOCK_TOGGLED', index, (!(fromJS(stateParam)).getIn(['players', index, 'lock']) ? true : false));
  });

  socket.on('BUY_UNIT', async (stateParam, pieceIndex) => {
    const index = connectedPlayers.get(socket.id);
    // console.log('Discarded pieces inc', fromJS(stateParam).get('discarded_pieces'));
    const state = await gameJS.buyUnit(fromJS(stateParam), index, pieceIndex);
    // Gold, shop, hand
    console.log('Bought unit at', pieceIndex, 'discarded =', state.get('discarded_pieces'));
    socket.emit('UPDATED_STATE', state); // Was updateplayer
    // socket.emit('UPDATE_PLAYER', index, state.getIn(['players', index]));
  });
  
  socket.on('BUY_EXP', async (stateParam, pieceIndex) => {
    const index = connectedPlayers.get(socket.id);
    const state = await gameJS.buyExp(fromJS(stateParam), index);
    // Gold, shop, hand
    console.log('Bought exp');
    socket.emit('UPDATE_PLAYER', index, state.getIn(['players', index]));
  });

  socket.on('REFRESH_SHOP', async (stateParam) => {
    const index = connectedPlayers.get(socket.id);
    const state = await gameJS._refreshShop(fromJS(stateParam), index);
    console.log('Refreshes Shop, level', state.getIn(['players', index, 'level']));
    // Requires Shop and Pieces
    socket.emit('UPDATE_PLAYER', index, state.getIn(['players', index]));
    socket.emit('UPDATED_PIECES', state);
  });

  socket.on('PLACE_PIECE', async (stateParam, from, to) => {
    const index = connectedPlayers.get(socket.id);
    const state = await gameJS._placePiece(fromJS(stateParam), index, from, to);
    console.log('Place piece at ', from, ' at', to);
    // Hand and board
    socket.emit('UPDATE_PLAYER', index, state.getIn(['players', index]));
  });

  socket.on('WITHDRAW_PIECE', async (stateParam, from) => {
    const index = connectedPlayers.get(socket.id);
    const state = await gameJS._withdrawPiece(fromJS(stateParam), index, from);
    console.log('Withdraw piece at ', from);
    // Hand and board
    socket.emit('UPDATE_PLAYER', index, state.getIn(['players', index]));
  });

  // TODO Mark dead players as index -1
  socket.on('BATTLE_READY', async (stateParam) => {
    const index = connectedPlayers.get(socket.id);
    const state = fromJS(stateParam);
    const amount = state.get('amountOfPlayers');
    console.log('@battleReady', index, state.getIn(['players', index]))
    if(index != -1 && state.getIn(['players', index])){
      console.log('@battleReady', counter, amount)
      if(typeof prepBattleState === 'undefined'){ // First ready player
        counter += 1;
        prepBattleState = state.set('players', Map({})).setIn(['players', index], state.getIn(['players', index]));
      } else if(prepBattleState.getIn(['players', index])){ // Update from player already registered
        prepBattleState = prepBattleState.setIn(['players', index], state.getIn(['players', index]));
      } else{ // New player
        counter += 1;
        prepBattleState = prepBattleState.setIn(['players', index], state.getIn(['players', index]));
      }
      if(counter === amount){
        counter = 0;
        console.log('@prepBattleState Ready for battle!')
        console.log('@prepBattleState state', prepBattleState.getIn(['players']))
        const obj = await gameJS.battleSetup(prepBattleState);
        const state = obj.get('state');
        const preBattleState = obj.get('preBattleState');
        const actionStacks = obj.get('actionStacks');
        const startingBoards = obj.get('startingBoards');
        const iter = connectedPlayers.keys();
        let temp = iter.next();
        while (!temp.done) {
          const socketId = temp.value;
          const index = connectedPlayers.get(socketId);
          console.log('Player update', preBattleState.getIn(['players', index]))
          io.to(`${socketId}`).emit('UPDATE_PLAYER', index, preBattleState.getIn(['players', index]));
          // TODO: Currently sends actionStacks and startingBoards for all players (For future to show all battles)
          io.to(`${socketId}`).emit('BATTLE_TIME', actionStacks, startingBoards);
          temp = iter.next();
        }
        prepBattleState = undefined;
        console.log('@prepBattleState', state.getIn(['players']));
      }
    }
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
