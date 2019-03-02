// Author: Petter Andersson

const { Map, List, Set } = require('immutable');

const START_COUNTER_VALUE = 0; // 0, 1 is for testing alone
const MAX_AMOUNT_CONCURRENT_GAMES = 8;

const getPlayerIndex = (session, socketId) => session.get('connectedPlayers').get(socketId);
exports.getPlayerIndex = (session, socketId) => getPlayerIndex(session, socketId);

exports.initializeConnectedPlayers = (connectedPlayersMap) => {
  // connectedPlayersMap = (socketId:s -> ConnectedUser:s)
  let tempMap = Map({});
  const iter = connectedPlayersMap.keys();
  let temp = iter.next();
  let counter = 0;
  while (!temp.done) {
    const id = temp.value;
    tempMap = tempMap.set(id, String(counter));
    counter += 1;
    temp = iter.next();
  }
  return tempMap;
};

// Default: prepBattleState = undefined
exports.makeSession = (connectedPlayersInit, pieces) => Map({
  connectedPlayers: connectedPlayersInit, // Bind socket.id -> playerid (previous connectedPlayer in socketcontroller)
  counter: START_COUNTER_VALUE,
  pieces,
  discardedPieces: List([]),
  players: Map({}),
});

exports.createUser = socketId => Map({
  socketId,
  sessionId: false, // Used for ready and sessionId (true|false|sessionId)
});

exports.findFirstAvailableIndex = (sessions) => {
  const iter = sessions.keys();
  let temp = iter.next();
  let takenIndices = Set([]);
  while (!temp.done) {
    const index = temp.value;
    takenIndices = takenIndices.add(index);
    temp = iter.next();
  }
  for (let i = 0; i < MAX_AMOUNT_CONCURRENT_GAMES; i++) {
    if (!takenIndices.includes(i)) {
      return i;
    }
  }
  return undefined;
};

exports.updateSessionIds = async (connectedPlayersParam, playerArray, sessionId) => {
  let connectedPlayers = connectedPlayersParam;
  const iter = connectedPlayers.keys();
  let temp = iter.next();
  while (!temp.done) {
    const id = temp.value;
    if (playerArray.includes(id)) {
      connectedPlayers = await connectedPlayers.setIn([id, 'sessionId'], sessionId);
    }
    temp = iter.next();
  }
  return connectedPlayers;
};

// Remove Session when all connected sockets are disconnected
exports.sessionPlayerDisconnect = (socketId, session) => {
  const newConnectedPlayers = session.get('connectedPlayers').delete(socketId);
  if (newConnectedPlayers.size === 0) {
    return undefined;
  }
  return session.set('connectedPlayers', newConnectedPlayers);
};

const getSession = (socketId, connectedPlayers, sessions) => {
  const sessionId = connectedPlayers.get(socketId).get('sessionId');
  return sessions.get(sessionId);
};

exports.getSession = (socketId, connectedPlayers, sessions) => getSession(socketId, connectedPlayers, sessions);

exports.addPiecesToState = (socketId, connectedPlayers, sessions, state) => {
  const session = getSession(socketId, connectedPlayers, sessions);
  return state.set('pieces', session.get('pieces')).set('discardedPieces', session.get('discardedPieces'));
};

exports.updateSessionPieces = (socketId, connectedPlayers, sessions, state) => {
  const sessionId = connectedPlayers.get(socketId).get('sessionId');
  const session = sessions.get(sessionId);
  const newSession = session.set('pieces', state.get('pieces')).set('discardedPieces', state.get('discardedPieces'));
  // console.log('@updateSessionPieces', newSession.getIn(['pieces', 0, 0]), session.getIn(['pieces', 0, 0]))
  return sessions.set(sessionId, newSession);
};

exports.buildStateAfterBattle = (socketId, connectedPlayers, sessions, state) => {
  const session = getSession(socketId, connectedPlayers, sessions);
  return state.set('players', session.get('players'));
}

exports.updateSessionPlayers = (socketId, connectedPlayers, sessions, state) => {
  const sessionId = connectedPlayers.get(socketId).get('sessionId');
  const session = sessions.get(sessionId);
  const newSession = session.set('players', state.get('players'));
  return sessions.set(sessionId, newSession);
};

exports.updateSessionPlayer = (socketId, connectedPlayers, sessions, state, index) => {
  const sessionId = connectedPlayers.get(socketId).get('sessionId');
  const session = sessions.get(sessionId);
  const newSession = session.setIn(['players', index], state.getIn(['players', index]));
  return sessions.set(sessionId, newSession);
};

exports.getLongestBattleTime = (actionStacks) => {
  let longestTime = -1;
  const iter = actionStacks.keys();
  let temp = iter.next();
  while (!temp.done) {
    const id = temp.value;
    const actionStack = actionStacks.get(id);
    const time = (actionStack.get(actionStack.size - 1) ? actionStack.get(actionStack.size - 1).get('time') : 0);
    if (time > longestTime) {
      longestTime = time;
    }
    temp = iter.next();
  }
  return longestTime;
};
