// Author: Petter Andersson


const { fromJS } = require('immutable');

/**
  * Read from json file
  * Convert to immutable Map structure
  * accuracy doesn't matter: Default 100
  * power def 0
  * noTarget, lifesteal, aoe default false
  * mana default 100
  * noTargetEffect
  * unique TODO
  */
 async function loadImmutableAbilitiesJSON() {
  const pokemonJSON = JSON.parse(fs.readFileSync('pokemonAbilities.json', 'utf8'));
  return fromJS(pokemonJSON);
}

const abilitiesMap = loadImmutableAbilitiesJSON();

exports.getMap = () => abilitiesMap;
