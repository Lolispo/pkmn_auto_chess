// Author: Petter Andersson


const { Map, fromJS } = require('immutable');
const pokemonJS = require('./pokemon');
const fs = require('fs');

const abilityDefaults = Map({
  mana: 100,
  lifestealValue: 0.5,
  dotDamage: 1/16,
  aoeRange: 1,
  range: 8
})

exports.getAbilityDefault = name => abilityDefaults.get(name);

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

exports.getAbility = async (name) => {
  console.log(name);
  const ability = (await pokemonJS.getStats(name)).get('ability');
  return (await abilitiesMap).get(ability);
}

exports.getMap = () => abilitiesMap;
