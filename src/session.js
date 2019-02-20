// Author: Petter Andersson

const { Map, List, Set } = require('immutable');
const gameJS = require('./game');


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
  for (let i = 0; i < 8; i++) {
    if (!takenIndices.includes(i)) {
      return i;
    }
  }
  return undefined;
};
