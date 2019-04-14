// Author: Petter Andersson


const { Map } = require('immutable');
const gameConstantsJS = require('./game_constants');

/**
 * locked assumed false
 * name: 'Default String',
 * streak: 0
 */
function Player(i) {
  return Map({
    index: i,
    hp: (gameConstantsJS.debugMode ? 5 : 100),
    level: (gameConstantsJS.debugMode ? 5 : 1),
    exp: 0,
    expToReach: 1,
    gold: (gameConstantsJS.debugMode ? 10000 : 1),
    shop: Map({}), // Buys from 5
    hand: Map({}), // Sideline, 8 at once
    board: Map({}), // Placed on board (8x8 area, placeable is 4x8)
    rivals: Map({}), // Holds index and numbers of players played in battle
    /**
     * Board example
     *      Map({ (Check OrderedMap in immutable)
     *          'x,y': unit,
     *          '6,4': Map({name: 'Pidor'})
     *          default: empty
     *      })
     */
  });
}

exports.initPlayers = (state, peoplePlaying) => {
  let players = Map({});
  for (let i = 0; i < peoplePlaying; i++) {
    const player = new Player(String(i));
    // TODO: Customize player more, name, avatar etc
    players = players.set(String(i), player);
  }
  const state2 = state.set('players', players);
  return state2.set('amountOfPlayers', players.size);
};
