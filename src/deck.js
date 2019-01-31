// Author: Petter Andersson


const { List } = require('immutable');
const pokemon_js = require('./pokemon');
const state_logic_js = require('./state_logic');

function buildDecks(pokemon) {
  let decks = List([List([]), List([]), List([]), List([]), List([])]);
  const pokemon_iter = pokemon.values();
  let temp_pokemon = pokemon_iter.next();
  while (!temp_pokemon.done) {
    decks = state_logic_js.push(decks, temp_pokemon.value.get('cost') - 1, temp_pokemon.value);
    temp_pokemon = pokemon_iter.next();
  }
  return decks;
}

const decks = buildDecks(pokemon_js.getMap());

exports.getDecks = function () {
  return decks;
};
