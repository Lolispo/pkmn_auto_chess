// Author: Petter Andersson


const { Map, fromJS } = require('immutable');
const fs = require('fs');
const f = require('./f');
/**
 * Default stat variables that are used if nothing is found in specific def
 */
const defaultStat = Map({
  evolves_from: undefined, // None Assumed
  mana_hit_given: 10,
  mana_hit_taken: 10,
  mana: 0,
  speed: 100, // Temp test, lower = faster (Time between attacks)
  upperLimitSpeed: 200,
  defense: 50,
  range: 1, // Range for unit to reach (diagonals allowed)
  next_move: 0, // Next move: time for next move
});

/**
  * Read from json file
  * Convert to immutable Map structure
  *
  * ☆ = &#9734;
  * Level is same as cost
  */
async function loadImmutablePokemonJSON() {
  const pokemonJSON = JSON.parse(fs.readFileSync('pokemon.json', 'utf8'));
  const immutablePokemon = await fromJS(pokemonJSON);
  // f.print(immutablePokemon)
  return immutablePokemon;
}

const pokemonMap = loadImmutablePokemonJSON();

exports.getStats = async (name) => {
  const pokeMap = await pokemonMap;
  // console.log('getStats', name, pokeMap.get(name.toLowerCase()));
  return pokeMap.get(name.toLowerCase());
};

const getBasePokemonLocal = async (name) => {
  const pokeMap = await pokemonMap;
  const unitStats = pokeMap.get(name.toLowerCase());
  if (f.isUndefined(unitStats.get('evolution_from'))) { // Base level
    return unitStats.get('name');
  }
  // Go down a level
  return getBasePokemonLocal(unitStats.get('evolution_from').get('name'));
};

exports.getBasePokemon = name => getBasePokemonLocal(name);

exports.getMap = async () => pokemonMap;

exports.getStatsDefault = stat => defaultStat.get(stat);
