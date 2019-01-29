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
    bulbasaur: {
        name: 'Bulbasaur☆',
        type: 'grass',
        cost: '2',
        attack: 15,
        defence: 15,
        ability: 'razorleaf',
        evolves_to: 'ivysaur'
    },
    charmander: {
        name: 'Charmander☆',
        type: 'fire',
        cost: '2',
        attack: 15,
        defence: 15,
        ability: 'ember',
        evolves_to: 'charmeleon'
    },
    charmeleon: {
        name: 'Charmeleon☆☆',
        type: 'fire',
        cost: '2',
        attack: 15,
        defence: 15,
        ability: 'ember',
        evolves_from: 'charmander',
        evolves_to: 'charizard'
    },
    charizard: {
        name: 'Charizard☆☆☆',
        type: 'fire',
        cost: '2',
        attack: 15,
        defence: 15,
        ability: 'ember',
        evolves_from: 'charmeleon'
    },
    squirtle: {
        name: 'Squirtle☆',
        type: 'water',
        cost: '2',
        attack: 15,
        defence: 15,
        ability: 'watergun',
        evolves_to: 'wartortle'
    },
    caterpie: {
        name: 'Caterpie☆',
        type: 'grass',
        cost: '1',
        attack: 9,
        defence: 8,
        ability: 'stringshot',
        evolves_to: 'raticate'
    },
    weedle: {
        name: 'Weedle☆',
        type: 'grass',
        cost: '1',
        attack: 9,
        defence: 8,
        ability: 'stringshot',
        evolves_to: 'raticate'
    },
    pidgey: {
        name: 'Pidgey☆',
        type: 'normal',
        cost: '1',
        attack: 9,
        defence: 8,
        ability: 'gust',
        evolves_to: 'pidgeotto'
    },
    pidgeotto: {
        name: 'Pidgeotto☆☆',
        type: 'normal',
        cost: '3',
        attack: 13,
        defence: 12,
        ability: 'quickattack',
        evolves_from: 'pidgey',
        evolves_to: 'pidgeot'
    },
    rattata: {
        name: 'Rattata☆',
        type: 'normal',
        cost: '1',
        attack: 9,
        defence: 8,
        ability: 'quickattack',
        evolves_to: 'raticate'
    },
    raticate: {
        name: 'Raticate☆☆',
        type: 'normal',
        cost: '3',
        attack: 9,
        defence: 8,
        ability: 'quickattack',
        evolves_from: 'rattata',
        evolves_to: 'raticate2'
    },
    raticate2: {
        name: 'Raticate☆☆☆',
        type: 'normal',
        cost: '5',
        attack: 9,
        defence: 8,
        ability: 'quickattack',
        evolves_from: 'raticate2'
    },
    pikachu: {
        name: 'Pikachu☆',
        type: 'electric',
        cost: '1',
        attack: 10,
        defence: 10,
        ability: 'thundershock',
        evolves_to: 'pikachu2'
    },
    pikachu2: {
        name: 'Pikachu☆☆',
        type: 'electric',
        cost: '3',
        attack: 10,
        defence: 10,
        ability: 'thundershock',
        evolves_from: 'pikachu',
        evolves_to: 'raichu'
    },
    raichu: {
        name: 'Raichu☆☆☆',
        type: 'electric',
        cost: '5',
        attack: 10,
        defence: 10,
        ability: 'thunderbolt',
        evolves_from: 'pikachu2',
        evolves_to: 'raichu'
    },

});

exports.getMap = function(){
    return pokemonMap;
}