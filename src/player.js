// Author: Petter Andersson


const { Map, List, fromJS } = require('immutable');

/**
 * locked assumed false
 * name: 'Default String',
 * streak: 0
 */
function Player(i) {
  return Map({
    index: i,
    hp: 100,
    level: 1,
    exp: 0,
    exp_to_reach: 1,
    gold: 1,
    shop: List([]), // Buys from 5
    hand: List([]), // Sideline, 8 at once
    board: Map({}), // Placed on board (8x8 area, placeable is 4x8)
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

exports.initPlayers = function (state, peoplePlaying) {
  let players = List([]);
  for (let i = 0; i < peoplePlaying; i++) {
    const player = new Player(i);
    // TODO: Customize player more, name, avatar etc
    players = players.push(player);
  }
  state = state.set('players', players);
  state = state.set('amountOfPlayers', players.size);
  return state;
};
