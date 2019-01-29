// Author: Petter Andersson
'use strict';

const { Map, List, fromJS } = require('immutable');
const pokemon_js = require('./pokemon');
const state_logic_js = require('./state_logic');

const decks = fromJS(buildDecks(pokemon_js.getMap()));

function buildDecks(pokemon){
    let decks = List([List([]),List([]),List([]),List([]),List([])]);
    let pokemon_iter = pokemon.values();
    let temp_pokemon = pokemon_iter.next();
    while(!temp_pokemon.done){
        decks = state_logic_js.push(decks, temp_pokemon.value.cost - 1, temp_pokemon.value);
        temp_pokemon = pokemon_iter.next();
    }
    return decks;
}

exports.getDecks = function(){
    return decks;
}