// Author: Petter Andersson


const { Map } = require('immutable');

/**
 * Mana cost: 100 assumed
 */
const abilitiesMap = new Map({
  thundershock: {
    name: 'Thundershock',
    type: 'electric',
    attack: 15,
  },
  gust: {
    name: 'Gust',
    type: 'normal',
    attack: 15,
  },
  quickattack: {
    name: 'Quick Attack',
    type: 'normal',
    attack: 18,
  },
  stringshot: {
    name: 'String Shot',
    type: 'grass',
    attack: 18,
  },
});

exports.getMap = function () {
  return abilitiesMap;
};
