// Author: Petter Andersson
'use strict';

const { Map, List, fromJS } = require('immutable');


exports.updateShop = function(state, playerIndex, fivePieces, newPieceStorage){
    const shop = state.get('players').get(playerIndex).set('shop', fivePieces);
    const players = state.get('players').set(playerIndex, shop);
    state = state.set('players', players);
    state = state.set('pieceStorage', newPieceStorage);
    return state;
}