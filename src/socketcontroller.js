// Author: Petter Andersson

const { Map, fromJS } = require('immutable');
const gameJS = require('./game');
const sessionJS = require('./session');
const pokemonJS = require('./pokemon');
const abilitiesJS = require('./abilities');
const f = require('./f');

let connectedPlayers = Map({}); // Stores connected players, socketids -> ConnectedUser
let sessions = Map({});         // Maps sessionIds to sessions

const TIME_FACTOR = 15;

const getPlayerIndex = socketId => sessionJS.getPlayerIndex(sessions.get(connectedPlayers.get(socketId).get('sessionId')), socketId);

const countReadyPlayers = (isReadyAction, socket, io) => {
  const iter = connectedPlayers.keys();
  let temp = iter.next();
  let counterReady = 0;
  let counterPlayersWaiting = 0;
  // console.log('@countReadyPlayers', connectedPlayers, sessions)
  while (!temp.done) {
    const id = temp.value;
    // Compares to true since sessionId = true => ready (if value -> not ready)
    const sessionId = connectedPlayers.get(id).get('sessionId');
    // console.log('@inside - sessionId for', temp.value, ':', sessionId, connectedPlayers.get(id), connectedPlayers.get(id).get('sessionId'));
    counterReady = (sessionId === true ? counterReady + 1 : counterReady); 
    counterPlayersWaiting = (sessionId === false || sessionId === true ? counterPlayersWaiting + 1 : counterPlayersWaiting);
    temp = iter.next();
  }
  if (counterReady === counterPlayersWaiting) {
    io.emit('ALL_READY', counterReady, counterPlayersWaiting, true);
  } else if(!isReadyAction){ // Someone went unready
    io.emit('ALL_READY', counterReady, counterPlayersWaiting, false);
  } else {
    io.emit('READY', counterReady, counterPlayersWaiting)
  }
}

const getStateToSend = (state) => {
  return state.delete('pieces').delete('discardedPieces');
}

module.exports = function (socket, io) {
  /*
    Example io code
    io.on('connection', function(socket){
        socket.emit('request', ); // emit an event to the socket
        io.emit('broadcast', ); // emit an event to all connected sockets
        socket.on('reply', function(){  }); // listen to the event
        socket.broadcast.emit('UPDATED_PIECES', state); (Didn't work, check)
    });
  */

  // TODO Rename, Method used when client connects
  socket.on('GIVE_ID', async () => {
    console.log('@Give_id', socket.id);
    const newUser = sessionJS.createUser(socket.id);
    connectedPlayers = connectedPlayers.set(socket.id, newUser);
    // TODO: Handle many connected players
  });

  socket.on('READY', async () => {
    connectedPlayers = connectedPlayers.setIn([socket.id, 'sessionId'], true); // Ready
    console.log(`Player is ready`);
    countReadyPlayers(true, socket, io);
  });

  socket.on('UNREADY', async () => {
    connectedPlayers = connectedPlayers.setIn([socket.id, 'sessionId'], false); // Unready
    console.log(`Player went unready`);
    countReadyPlayers(false, socket, io);
  });

  socket.on('START_GAME', async amountToPlay => {
    const waitingPlayers = connectedPlayers.filter((player) => player.get('sessionId') === true || player.get('sessionId') === false);
    const sessionConnectedPlayers = sessionJS.initializeConnectedPlayers(waitingPlayers);
    const sessionId = sessionJS.findFirstAvailableIndex(sessions);
    connectedPlayers = await sessionJS.updateSessionIds(connectedPlayers, Array.from(sessionConnectedPlayers.keys()), sessionId);
    const state = await gameJS._startGame(amountToPlay);
    // Set pieces in Session
    const newSession = sessionJS.makeSession(sessionConnectedPlayers, state.get('pieces'));
    sessions = sessions.set(sessionId, newSession);
    console.log('Starting game!');
    
    // Send to all connected sockets
    const stateToSend = getStateToSend(state); //.setIn(['players', '0', 'gold'], 1000);
    console.log('@startGame', socket.id, sessionConnectedPlayers, stateToSend)
    const iter = sessionConnectedPlayers.keys();
    let temp = iter.next();
    while (!temp.done) {
      const id = temp.value
      io.to(`${id}`).emit('NEW_PLAYER', sessionConnectedPlayers.get(id));
      temp = iter.next();
    }
    io.emit('UPDATED_STATE', stateToSend);
  });

  // disconnect logic
  socket.on('disconnect', () => {
    // Find which connection disconnected, remove data from that person
    if(connectedPlayers){
      console.log('Player disconnected: ', connectedPlayers.get(socket.id).get('socketId'));
      const user = connectedPlayers.get(socket.id);
      const sessionId = user.get('sessionId')
      const session = sessions.get(sessionId);
      if(sessionId && session){ // User was in a session (not false, true | sessionId)
        const updatedSession = sessionJS.sessionPlayerDisconnect(socket.id, session);
        if(f.isUndefined(updatedSession)){
          console.log('Removing Session:', sessionId, '(All players left)');
          sessions = sessions.delete(sessionId);
        } else {
          console.log('Still Players left in session:', sessionId);
          sessions = updatedSession;
        }
      }
      connectedPlayers = connectedPlayers.delete(socket.id);
    }
  });

  socket.on('TOGGLE_LOCK', async (stateParam) => {
    const index = getPlayerIndex(socket.id);
    // const state = await gameJS.toggleLock(fromJS(stateParam), index);
    const prevLock = (fromJS(stateParam)).getIn(['players', index, 'locked']);
    console.log('Toggling Lock for Shop! prev lock =', prevLock);
    socket.emit('LOCK_TOGGLED', index, !prevLock);
  });

  socket.on('BUY_UNIT', async (stateParam, pieceIndex) => {
    const index = getPlayerIndex(socket.id);
    const stateWithPieces = sessionJS.addPiecesToState(socket.id, connectedPlayers, sessions, fromJS(stateParam));
    // console.log('@BuyUnit', stateWithPieces,'\nSTATE BEFORE', fromJS(stateParam), stateParam);
    // console.log('Discarded pieces inc', fromJS(stateParam).get('discardedPieces'));
    const state = await gameJS.buyUnit(stateWithPieces, index, pieceIndex);
    // Gold, shop, hand
    console.log('Bought unit at', pieceIndex, 'discarded =', state.get('discardedPieces'));
    sessions = sessionJS.updateSessionPieces(socket.id, connectedPlayers, sessions, state);
    socket.emit('UPDATED_STATE', getStateToSend(state)); // Was updateplayer
    // socket.emit('UPDATE_PLAYER', index, state.getIn(['players', index]));
  });

  socket.on('BUY_EXP', async (stateParam) => {
    const index = getPlayerIndex(socket.id);
    const stateWithPieces = sessionJS.addPiecesToState(socket.id, connectedPlayers, sessions, fromJS(stateParam));
    const state = await gameJS.buyExp(stateWithPieces, index);
    // Gold, shop, hand
    console.log('Bought exp');
    socket.emit('UPDATE_PLAYER', index, state.getIn(['players', index]));
  });

  socket.on('REFRESH_SHOP', async (stateParam) => {
    const index = getPlayerIndex(socket.id);
    const stateWithPieces = sessionJS.addPiecesToState(socket.id, connectedPlayers, sessions, fromJS(stateParam));
    const state = await gameJS._refreshShop(stateWithPieces, index);
    console.log('Refreshes Shop, level', state.getIn(['players', index, 'level']));
    // Requires Shop and Pieces
    // socket.emit('UPDATED_PIECES', state);
    sessions = sessionJS.updateSessionPieces(socket.id, connectedPlayers, sessions, state);
    socket.emit('UPDATE_PLAYER', index, state.getIn(['players', index]));
  });

  socket.on('PLACE_PIECE', async (stateParam, from, to) => {
    const index = getPlayerIndex(socket.id);
    const stateWithPieces = sessionJS.addPiecesToState(socket.id, connectedPlayers, sessions, fromJS(stateParam));
    const state = await gameJS._placePiece(stateWithPieces, index, from, to);
    console.log('Place piece at ', from, ' at', to);
    // Hand and board
    socket.emit('UPDATE_PLAYER', index, state.getIn(['players', index]));
  });

  socket.on('WITHDRAW_PIECE', async (stateParam, from) => {
    const index = getPlayerIndex(socket.id);
    const stateWithPieces = sessionJS.addPiecesToState(socket.id, connectedPlayers, sessions, fromJS(stateParam));
    const state = await gameJS._withdrawPiece(stateWithPieces, index, from);
    console.log('Withdraw piece at ', from);
    // Hand and board
    socket.emit('UPDATE_PLAYER', index, state.getIn(['players', index]));
  });

  socket.on('SELL_PIECE', async (stateParam, from) => {
    const index = getPlayerIndex(socket.id);
    const stateWithPieces = sessionJS.addPiecesToState(socket.id, connectedPlayers, sessions, fromJS(stateParam));
    const state = await gameJS._sellPiece(stateWithPieces, index, from);
    console.log('Sell piece at ', from);
    // Hand and board
    socket.emit('UPDATE_PLAYER', index, state.getIn(['players', index]));
  });

  socket.on('BATTLE_READY', async (stateParam) => {
    const index = getPlayerIndex(socket.id);
    const state = fromJS(stateParam); // Shouldn't require pieces in battle
    const amount = state.get('amountOfPlayers');
    const sessionId = connectedPlayers.get(socket.id).get('sessionId');
    const session = sessions.get(sessionId);
    let counter = session.get('counter');
    let prepBattleState = session.get('prepBattleState');
    // console.log('@battleReady', index, state.getIn(['players', index]));
    if (index != -1 && state.getIn(['players', index])) {
      // console.log('@battleReady', counter, amount);
      if (f.isUndefined(prepBattleState)) { // First ready player
        counter += 1;
        prepBattleState = state.set('players', Map({})).setIn(['players', index], state.getIn(['players', index]));
      } else if (prepBattleState.getIn(['players', index])) { // Update from player already registered
        prepBattleState = prepBattleState.setIn(['players', index], state.getIn(['players', index]));
      } else { // New player
        counter += 1;
        prepBattleState = prepBattleState.setIn(['players', index], state.getIn(['players', index]));
      }
      if (counter === amount) {
        // Set Session to reset counter and remove prepBattleStatess
        const newSession = (session.get('prepBattleState') ? session.set('counter', 0).delete('prepBattleState') : session.set('counter', 0));
        sessions = sessions.set(sessionId, newSession);
        console.log('@sc.battleReady Ready for battle!');
        // console.log('@sc.battleReady state', prepBattleState.getIn(['players']));
        // Battle
        const prepBSWithPieces = sessionJS.addPiecesToState(socket.id, connectedPlayers, sessions, prepBattleState);
        // console.log('@sc.battleReady State sent in', prepBSWithPieces)

        const obj = await gameJS.battleSetup(prepBSWithPieces);
        const state = obj.get('state');
        console.log('@sc.battleReady Players in state after Battle', state.getIn(['players']));
        const preBattleState = obj.get('preBattleState');
        console.log('@sc.battleReady Pre battle state', preBattleState.getIn(['players']));
        const actionStacks = obj.get('actionStacks');
        const startingBoards = obj.get('startingBoards');
        const iter = connectedPlayers.keys();
        let temp = iter.next();
        const stateToSend = getStateToSend(state);
        const longestTime = TIME_FACTOR * sessionJS.getLongestBattleTime(actionStacks) + 2000;
        while (!temp.done) {
          const socketId = temp.value;
          const index = getPlayerIndex(socketId);
          // console.log('Player update', index, preBattleState.getIn(['players', index]));
          io.to(`${socketId}`).emit('UPDATE_PLAYER', index, preBattleState.getIn(['players', index]));
          io.to(`${socketId}`).emit('BATTLE_TIME', actionStacks, startingBoards);
          temp = iter.next();
        }
        setTimeout(() => {
          io.emit('END_BATTLE');
          io.emit('UPDATED_STATE', stateToSend);
        }, longestTime);
      } else {
        const newSession = session.set('counter', counter).set('prepBattleState', prepBattleState);
        sessions = sessions.set(sessionId, newSession);
      }
    }
  });

  socket.on('GET_STATS', async (name) => {
    const stats = pokemonJS.getStats(name);
    const ability = abilitiesJS.getAbility(name);
    const newStats = (await stats).set('abilityType', (await ability).get('type'));
    console.log('Retrieving stats for', name, newStats);
    socket.emit('SET_STATS', name, newStats);
  });
};
