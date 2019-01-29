// Author: Petter Andersson
'use strict';

const { Map, List, fromJS } = require('immutable');

/**
 * locked assumed false
 * name: 'Default String',
 */
function Player(i){
    return Map({
        index: i,
        level: 1,
        exp: 0,
        exp_to_reach: 1,
        gold: 1,
        shop: List([]),    // Buys from 5
        hand: List([]),    // Sideline, 8 at once
        board: Map({}),    // Placed on board (8x8 area, placeable is 4x8)
        /**
         * Board example
         *      Map({
         *          'x,y': unit,
         *          '6,4': Map({name: 'Pidor'})
         *          default: empty
         *      })
         */
    });
}

exports.initPlayers = function(state, peoplePlaying){
    let players = List([]);
    for(var i = 0; i < peoplePlaying; i++){
        let player = new Player(i); 
        // TODO: Customize player more, name, avatar etc
        players = players.push(player);
    }
    state = state.set('players', players);
    return state;
}