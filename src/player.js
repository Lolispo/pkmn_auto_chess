// Author: Petter Andersson
'use strict';

const { Map, List, fromJS } = require('immutable');

function Player(i){
    return Map({
        index: i,
        name: 'Default String',
        level: 1,
        exp: 0,
        exp_to_reach: 1,
        gold: 1,
        shop: List([]),    // Buys from 5
        hand: List([]),    // Sideline, 8 at once
        board: Map({}),   // Placed on board (8x8 area, placeable is 4x8)
    });
}

exports.initPlayers = function(state, peoplePlaying){
    let players = List([]);
    for(var i = 0; i < peoplePlaying; i++){
        let player = new Player(i);
        players = players.push(player);
    }
    state = state.set('players', players);
    return state;
}