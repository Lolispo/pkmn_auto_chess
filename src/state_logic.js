// Author: Petter Andersson
'use strict';

const { Map, List, fromJS, setIn} = require('immutable');
const shuffle = require('immutable-shuffle');

exports.updateShop = function(state, playerIndex, fivePieces, newPieceStorage){
    if(state.getIn(['players', playerIndex,'shop']).size != 0){
        state.p
    }
    state = state.setIn(['players',playerIndex,'shop'], fivePieces);
    state = state.set('pieceStorage', newPieceStorage);
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