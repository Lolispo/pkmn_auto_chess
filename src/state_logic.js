// Author: Petter Andersson
'use strict';

const { Map, List, fromJS} = require('immutable');
const shuffle = require('immutable-shuffle');

/**
 * Refresh shop
 * Update discarded cards from previous shop
 * Add new shop
 */
exports.updateShop = function(state, playerIndex, newShop, newPieceStorage){
    let shop = state.getIn(['players', playerIndex,'shop']);
    if(shop.size != 0){
        state = state.set('discarded_pieces', state.get('discarded_pieces').concat(shop));
    }
    state = state.setIn(['players', playerIndex,'shop'], newShop);
    state = state.set('pieces', newPieceStorage);
    return state;
}

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

 
exports.removeFirst = function(state, id){
    return state.set(id, state.get(id).shift());
}

exports.push = function(state, id, value){
    return state.set(id, state.get(id).push(value));
}

exports.shuffle = function(state, id){
    return state.set(id, shuffle(state.get(id)));
}

