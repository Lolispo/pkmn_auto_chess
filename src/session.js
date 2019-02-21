// Author: Petter Andersson

const { Map, List, Set } = require('immutable');
const gameJS = require('./game');

function Session(initCounter){
  this.connectedPlayers = Map({}); // Bind socket.id -> playerid (previous connectedPlayer in socketcontroller)
  this.readyList = Map({});
  this.prepBattleState;
  this.counter = initCounter; // 0, 1 is for testing alone
  this.nextPlayerIndex = 0;

  
}

Session.prototype.addPlayer = (socketId) => {
  this.connectedPlayers = this.connectedPlayers.set(socketId, counter); // TODO Move logic from socketcontroller
}

exports.findFirstAvailableIndex = (connectedPlayers) => {
  const iter = connectedPlayers.keys();
  let temp = iter.next();
  let takenIndices = Set([]);
  while (!temp.done) {
    const id = temp.value;
    const index = connectedPlayers.get(id);
    takenIndices = takenIndices.add(index);
    temp = iter.next();
  }
  for(let i = 0; i < 8; i++){
    if(!takenIndices.includes(i)){
      return i;
    }
  }
  return undefined;
}

