// Author: Petter Andersson
'use strict';

const { Map, List, fromJS } = require('immutable');

/**
 * ☆ = &#9734;
 * evolves_from: None Assumed
 * mana_from_hit_given: 10 Assumed
 * mana_from_hit_taken: 10 Assumed
 */
const pokemonMap = new Map({
    bulbasaur: Map({
        name: 'bulbasaur',
        display_name: 'Bulbasaur☆',
        type: 'grass',
        cost: '3',
        attack: 15,
        defence: 15,
        ability: 'razorleaf',
        evolves_to: 'ivysaur'
    }),
    charmander: Map({
        name: 'charmander',
        display_name: 'Charmander☆',
        type: 'fire',
        cost: '3',
        attack: 15,
        defence: 15,
        ability: 'ember',
        evolves_to: 'charmeleon'
    }),
    charmeleon: Map({
        name: 'charmeleon',
        display_name: 'Charmeleon☆☆',
        type: 'fire',
        cost: '4',
        attack: 15,
        defence: 15,
        ability: 'ember',
        evolves_from: 'charmander',
        evolves_to: 'charizard'
    }),
    charizard: Map({
        name: 'charizard',
        display_name: 'Charizard☆☆☆',
        type: 'fire',
        cost: '5',
        attack: 15,
        defence: 15,
        ability: 'ember',
        evolves_from: 'charmeleon'
    }),
    squirtle: Map({
        name: 'squirtle',
        display_name: 'Squirtle☆',
        type: 'water',
        cost: '3',
        attack: 15,
        defence: 15,
        ability: 'watergun',
        evolves_to: 'wartortle'
    }),
    caterpie: Map({
        name: 'caterpie',
        display_name: 'Caterpie☆',
        type: 'grass',
        cost: '1',
        attack: 9,
        defence: 8,
        ability: 'stringshot',
        evolves_to: 'raticate'
    }),
    weedle: Map({
        name: 'weedle',
        display_name: 'Weedle☆',
        type: 'grass',
        cost: '1',
        attack: 9,
        defence: 8,
        ability: 'stringshot',
        evolves_to: 'raticate'
    }),
    pidgey: Map({
        name: 'pidgey',
        display_name: 'Pidgey☆',
        type: 'normal',
        cost: '1',
        attack: 9,
        defence: 8,
        ability: 'gust',
        evolves_to: 'pidgeotto'
    }),
    pidgeotto: Map({
        name: 'pidgeotto',
        display_name: 'Pidgeotto☆☆',
        type: 'normal',
        cost: '3',
        attack: 13,
        defence: 12,
        ability: 'quickattack',
        evolves_from: 'pidgey',
        evolves_to: 'pidgeot'
    }),
    rattata: Map({
        name: 'rattata',
        display_name: 'Rattata☆',
        type: 'normal',
        cost: '1',
        attack: 9,
        defence: 8,
        ability: 'quickattack',
        evolves_to: 'raticate'
    }),
    raticate: Map({
        name: 'raticate',
        display_name: 'Raticate☆☆',
        type: 'normal',
        cost: '3',
        attack: 9,
        defence: 8,
        ability: 'quickattack',
        evolves_from: 'rattata',
        evolves_to: 'raticate2'
    }),
    raticate2: Map({
        name: 'raticate2',
        display_name: 'Raticate☆☆☆',
        type: 'normal',
        cost: '5',
        attack: 9,
        defence: 8,
        ability: 'quickattack',
        evolves_from: 'raticate2'
    }),
    pikachu: Map({
        name: 'pikachu',
        display_name: 'Pikachu☆',
        type: 'electric',
        cost: '1',
        attack: 10,
        defence: 10,
        ability: 'thundershock',
        evolves_to: 'pikachu2'
    }),
    pikachu2: Map({
        name: 'pikachu2',
        display_name: 'Pikachu☆☆',
        type: 'electric',
        cost: '3',
        attack: 10,
        defence: 10,
        ability: 'thundershock',
        evolves_from: 'pikachu',
        evolves_to: 'raichu'
    }),
    raichu: Map({
        name: 'raichu',
        display_name: 'Raichu☆☆☆',
        type: 'electric',
        cost: '5',
        attack: 10,
        defence: 10,
        ability: 'thunderbolt',
        evolves_from: 'pikachu2',
        evolves_to: 'raichu'
    }),
});

exports.getStats = function(name){
    return pokemonMap.get(name.toLowerCase());
}

exports.getMap = function(){
    return pokemonMap;
}