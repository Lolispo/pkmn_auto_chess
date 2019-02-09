// Author: Petter Andersson


const { Map, List, fromJS } = require('immutable');
const f = require('./f');
const fs = require('fs');
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

exports.getStatsDefault = stat => defaultStat.get(stat);

exports.getBasePokemon = name => getBasePokemonLocal(name);

/**
 * Convert type, either string or stringArray to string / immutable list
 * "[grass, poison]" input
 * ['grass', 'poison'] output
 * grass input => grass output
 */
async function getType(string) {
  if(string.charAt(0) === '['){ // 
    const stringToSplit = string.substring(1, string.length - 1); // Remove outer []
    const strings = stringToSplit.split(','); // List over strings
    return fromJS(strings); // Convert to Immutable List([])
  }
  return string;
}

// const pokemonMap = fromJS(JSON.parse(fs.readFileSync('pokemon.json', 'utf8')));
// console.log('@LOAD', pokemonMap)


/**
 * ☆ = &#9734;
 * Level is same as cost
 * TODO: Add read from json file
 */

async function loadImmutablePokemonJSON(){
  let pokemonJSON = JSON.parse(fs.readFileSync('pokemon.json', 'utf8'))
  let immutablePokemon = await fromJS(pokemonJSON);
  // f.print(immutablePokemon)
  /*
  const iter = immutablePokemon.keys();
  let temp = iter.next();
  while (!temp.done) {
    const newType = await getType(immutablePokemon.getIn([temp.value, 'type']));
    immutablePokemon = await immutablePokemon.setIn([temp.value, 'type'], newType);
    temp = iter.next();
  }*/
  // console.log('@immutablePokemon init', immutablePokemon)
  return immutablePokemon;
}

const pokemonMap = loadImmutablePokemonJSON();

exports.getStats = async (name) => {
  const pokeMap = await pokemonMap;
  // console.log('getStats', name, pokeMap.get(name.toLowerCase()));
  return pokeMap.get(name.toLowerCase());
}

const getBasePokemonLocal = async (name) => {
  const pokeMap = await pokemonMap;
  const unitStats = pokeMap.get(name.toLowerCase());
  if (f.isUndefined(unitStats.get('evolution_from'))) { // Base level
    return unitStats.get('name');
  }
  // Go down a level
  return getBasePokemonLocal(unitStats.get('evolution_from').get('name'));
};

exports.getMap = async () => await pokemonMap;
