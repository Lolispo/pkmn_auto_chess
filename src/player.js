// Author: Petter Andersson
'use strict';

const { Map, List, fromJS } = require('immutable');

function Player(i){
    return Map({
        index: i,
        name: 'Default String',
        exp: 0,
        exp_to_reach: 1,
        level: 1,
        shop: Map({}),    // Buys from 5
        hand: Map({}),    // Sideline
        board: Map({}),   // Placed on board
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