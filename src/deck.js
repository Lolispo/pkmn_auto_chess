// Author: Petter Andersson


const { List } = require('immutable');
const pokemonJS = require('./pokemon');
const stateLogicJS = require('./state_logic');

function buildDecks(pokemon) {
  let decks = List([List([]), List([]), List([]), List([]), List([])]);
  const pokemonIterator = pokemon.values();
  let tempPokemon = pokemonIterator.next();
  while (!tempPokemon.done) {
    decks = stateLogicJS.push(decks, tempPokemon.value.get('cost') - 1, tempPokemon.value);
    tempPokemon = pokemonIterator.next();
  }
  return decks;
}

const decks = buildDecks(pokemonJS.getMap());

exports.getDecks = () => decks;
