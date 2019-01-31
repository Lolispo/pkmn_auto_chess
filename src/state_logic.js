// Author: Petter Andersson

const shuffle = require('immutable-shuffle');

/**
 * Refresh shop
 * Update discarded cards from previous shop
 * Add new shop
 */
exports.updateShop = (stateParam, playerIndex, newShop, newPieceStorage) => {
  let state = stateParam;
  const shop = state.getIn(['players', playerIndex, 'shop']);
  if (shop.size !== 0) {
    state = state.set('discarded_pieces', state.get('discarded_pieces').concat(shop));
  }
  state = state.setIn(['players', playerIndex, 'shop'], newShop);
  state = state.set('pieces', newPieceStorage);
  return state;
};

/**
 * Replace with update logic
 *
 *  list = list.update(
        list.findIndex(function(item) {
            return item.get("name") === "third";
        }), function(item) {
            return item.set("count", 4);
        }
    );
 */


exports.removeFirst = (state, id) => state.set(id, state.get(id).shift());

exports.push = (state, id, value) => state.set(id, state.get(id).push(value));

exports.shuffle = (state, id) => state.set(id, shuffle(state.get(id)));
