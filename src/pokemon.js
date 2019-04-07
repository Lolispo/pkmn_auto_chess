// Author: Petter Andersson


const { Map, fromJS } = require('immutable');
const fs = require('fs');
const f = require('./f');
/**
 * Default stat variables that are used if nothing is found in specific def
 */
const defaultStat = Map({
  evolves_from: undefined, // None Assumed - Not used
  /*
  mana_hit_given: 10,
  mana_hit_taken: 10,
  */
  mana_multiplier: 1,
  mana: 0,
  speed: 100, // Temp test, lower = faster (Time between attacks)
  upperLimitSpeed: 250,
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
  return fromJS(pokemonJSON);
}

async function loadGifsJSON() {
  const pokemonJSON = JSON.parse(fs.readFileSync('pokemonSprites.json', 'utf8'));
  return fromJS(pokemonJSON);
}

const pokemonMap = loadImmutablePokemonJSON();
const pokemonSprites = loadGifsJSON();

exports.getStats = async (name) => {
  const pokeMap = await pokemonMap;
  // console.log('getStats', name);//, pokeMap.get(name.toLowerCase()));
  if (f.isUndefined(name)) console.log('@getStats undefined', name);
  return pokeMap.get(name.toLowerCase());
};

const getBasePokemonLocal = async (name) => {
  const pokeMap = await pokemonMap;
  const unitStats = pokeMap.get(name.toLowerCase());
  // console.log('@getBasePokemonLocal', unitStats, name, unitStats.get('evolves_from'));
  if (f.isUndefined(unitStats.get('evolves_from'))) { // Base level
    // console.log('@getBase This pokemon is a base unit: ', unitStats.get('name'), unitStats.get('evolves_from'), f.isUndefined(unitStats.get('evolves_from')));
    return unitStats.get('name');
  }
  // Go down a level
  // console.log('@pokemonJs.getBasePokemon Check out', unitStats.get('evolves_from'))
  return getBasePokemonLocal(unitStats.get('evolves_from'));
};

exports.getBasePokemon = name => getBasePokemonLocal(name);

const getUnitTierLocal = async (name, counter = 1) => {
  const pokeMap = await pokemonMap;
  const unitStats = pokeMap.get(name.toLowerCase());
  // console.log('@getBasePokemonLocal', unitStats, name, unitStats.get('evolves_from'));
  if (f.isUndefined(unitStats.get('evolves_from'))) { // Base level
    // console.log('@getBase This pokemon is a base unit: ', unitStats.get('name'), unitStats.get('evolves_from'), f.isUndefined(unitStats.get('evolves_from')));
    return counter;
  }
  // Go down a level
  // console.log('@pokemonJs.getBasePokemon Check out', unitStats.get('evolves_from'))
  return getUnitTierLocal(unitStats.get('evolves_from'), counter + 1);
};

exports.getUnitTier = name => getUnitTierLocal(name);

exports.getMap = async () => pokemonMap;

exports.getPokemonSprites = async () => pokemonSprites;

exports.getStatsDefault = stat => defaultStat.get(stat);
