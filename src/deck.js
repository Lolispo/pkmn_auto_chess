// Author: Petter Andersson


const { List } = require('immutable');
const f = require('./f');
const pokemonJS = require('./pokemon');

async function buildDecks(pokemonParam) {
  const pokemon = await pokemonParam;
  // console.log(pokemon)
  let decks = List([List([]), List([]), List([]), List([]), List([])]);
  const pokemonIterator = pokemon.values();
  let tempPokemon = pokemonIterator.next();
  while (!tempPokemon.done) {
    const pokemonVar = tempPokemon.value;
    // console.log(pokemon.get('evolves_from'))
    if (f.isUndefined(pokemonVar.get('evolves_from'))) { // Only add base level
      console.log(decks, tempPokemon.value)
      decks = f.push(decks, tempPokemon.value.get('cost') - 1, tempPokemon.value);
    }
    tempPokemon = pokemonIterator.next();
  }
  // console.log('@buildDecks, decks', decks)
  return decks;
}

const decks = buildDecks(pokemonJS.getMap());

exports.getDecks = () => decks;
