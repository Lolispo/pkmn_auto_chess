// Author: Petter Andersson

const { Map, List, fromJS } = require('immutable');

const f = require('./f');
const fs = require('fs');

const increaseSpeed = (unit, bonus) => unit.set('speed', unit.get('speed') - bonus); // Lower speed = better
const increaseHp = (unit, bonus) => unit.set('hp', +unit.get('hp') + +bonus);
const increaseAttack = (unit, bonus) => unit.set('attack', +unit.get('attack') + +bonus);

/**
 * Type matchup, check for strong against defenseType
 */
exports.isStrongAgainst = async (attackType, defenseType) => {
  const strongAgainst = typeMap.get(attackType).get('strongAgainst');
  return (!f.isUndefined(strongAgainst) && !f.isUndefined(strongAgainst.get(defenseType)) ? 2.0 : 1.0);
}

/**
 * Type matchup, check for ineffective against defenseType
 */
exports.isIneffectiveAgainst = async (attackType, defenseType) => {
  const ineffectiveAgainst = typeMap.get(attackType).get('ineffectiveAgainst');
  return (!f.isUndefined(ineffectiveAgainst.get(defenseType))? 0.5 : 1.0);
}

// const typesMapLoad = fromJS(JSON.parse(fs.readFileSync('pokemonTypes.json', 'utf8')));

/**
 * req: Required amount of units to receive bonus
 * bonus: function effect for buffs only for units with type
 * allBonus: function effect for buffs for entire team
 * TODO: Add from json
 * strongAgainst: Assumed Empty
 */
const typeMap = new Map({
  "normal": Map({
    "name": "normal",
    "ineffectiveAgainst": List([
      "Rock",
      "Steel"
    ]),
    desc: 'Increases Hp',
    req: List([3, 6, 9]),
    bonusAmount: List([20, 40, 60]),
    bonus: (unit, bonus) => increaseHp(unit, bonus),
  }),
  "fire": Map({
    "name": "fire",
    "strongAgainst": List([
      "Grass",
      "Ice",
      "Bug",
      "Steel"
    ]),
    "ineffectiveAgainst": List([
      "Fire",
      "Water",
      "Rock",
      "Dragon"
    ]),
    desc: 'Increases attack damage',
    req: List([2, 4, 6]),
    bonusAmount: List([10, 20, 30]),
    bonus: (unit, bonus) => increaseAttack(unit, bonus),
  }),
  "water": Map({
    "name": "water",
    "strongAgainst": List([
      "Fire",
      "Ground",
      "Rock"
    ]),
    "ineffectiveAgainst": List([
      "Water",
      "Grass",
      "Dragon"
    ]),
    desc: 'Increases attack damage for all',
    req: List([3, 6, 9]),
    bonusAmount: List([15, 30, 45]),
    allBonus: (unit, bonus) => increaseAttack(unit, bonus),
  }),
  "electric": Map({
    "name": "electric",
    "strongAgainst": List([
      "Water",
      "Flying"
    ]),
    "ineffectiveAgainst": List([
      "Electric",
      "Grass",
      "Dragon"
    ]),
    desc: 'Increases speed for all',
    req: List([3, 6, 9]),
    bonusAmount: List([20, 40, 60]),
    allBonus: (unit, bonus) => increaseSpeed(unit, bonus)
  }),
  "grass": Map({
    "name": "grass",
    "strongAgainst": List([
      "Water",
      "Ground",
      "Rock"
    ]),
    "ineffectiveAgainst": List([
      "Fire",
      "Grass",
      "Poison",
      "Flying",
      "Bug",
      "Dragon",
      "Steel"
    ]),
    desc: 'Increases speed',
    req: List([2, 4, 6]),
    bonusAmount: List([20, 40, 60]),
    bonus: (unit, bonus) => increaseSpeed(unit, bonus),
  }),
  "ice": Map({
    "name": "ice",
    "strongAgainst": List([
      "Grass",
      "Ground",
      "Flying",
      "Dragon"
    ]),
    "ineffectiveAgainst": List([
      "Fire",
      "Water",
      "Ice",
      "Steel"
    ])
  }),
  "fighting": Map({
    "name": "fighting",
    "strongAgainst": List([
      "Normal",
      "Ice",
      "Rock",
      "Dark",
      "Steel"
    ]),
    "ineffectiveAgainst": List([
      "Poison",
      "Flying",
      "Psychic",
      "Bug",
      "Fairy"
    ])
  }),
  "poison": Map({
    "name": "poison",
    "strongAgainst": List([
      "Grass",
      "Fairy"
    ]),
    "ineffectiveAgainst": List([
      "Poison",
      "Ground",
      "Rock",
      "Ghost"
    ])
  }),
  "ground": Map({
    "name": "ground",
    "strongAgainst": List([
      "Fire",
      "Electric",
      "Poison",
      "Rock",
      "Steel"
    ]),
    "ineffectiveAgainst": List([
      "Grass",
      "Bug"
    ])
  }),
  "flying": Map({
    "name": "flying",
    "strongAgainst": List([
      "Grass",
      "Fighting",
      "Bug"
    ]),
    "ineffectiveAgainst": List([
      "Electric",
      "Rock",
      "Steel"
    ])
  }),
  "psychic": Map({
    "name": "psychic",
    "strongAgainst": List([
      "Fighting",
      "Poison"
    ]),
    "ineffectiveAgainst": List([
      "Psychic",
      "Steel"
    ])
  }),
  "bug": Map({
    "name": "bug",
    "strongAgainst": List([
      "Grass",
      "Psychic",
      "Dark"
    ]),
    "ineffectiveAgainst": List([
      "Fire",
      "Fighting",
      "Poison",
      "Flying",
      "Ghost",
      "Steel",
      "Fairy"
    ])
  }),
  "rock": Map({
    "name": "rock",
    "strongAgainst": List([
      "Fire",
      "Ice",
      "Flying",
      "Bug"
    ]),
    "ineffectiveAgainst": List([
      "Fighting",
      "Ground",
      "Steel"
    ])
  }),
  "ghost": Map({
    "name": "ghost",
    "strongAgainst": List([
      "Psychic",
      "Ghost"
    ]),
    "ineffectiveAgainst": "Dark"
  }),
  "dragon": Map({
    "name": "dragon",
    "strongAgainst": "Dragon",
    "ineffectiveAgainst": "Steel"
  }),
  "dark": Map({
    "name": "dark",
    "strongAgainst": List([
      "Psychic",
      "Ghost"
    ]),
    "ineffectiveAgainst": List([
      "Fighting",
      "Dark",
      "Fairy"
    ])
  }),
  "steel": Map({
    "name": "steel",
    "strongAgainst": List([
      "Ice",
      "Rock",
      "Fairy"
    ]),
    "ineffectiveAgainst": List([
      "Fire",
      "Water",
      "Electric",
      "Steel"
    ])
  }),
  "fairy": Map({
    "name": "fairy",
    "strongAgainst": List([
      "Fighting",
      "Dragon",
      "Dark"
    ]),
    "ineffectiveAgainst": List([
      "Fire",
      "Poison",
      "Steel"
    ])
  })
});

exports.getType = name => typeMap.get(name);

exports.getBonusAmount = (name, level) => typeMap.get(name).get('bonusAmount').get(level - 1);

exports.getBuffFuncSolo = name => typeMap.get(name).get('bonus');

exports.getBuffFuncAll = name => typeMap.get(name).get('allBonus');

exports.isSoloBuff = (name) => {
  const buff = typeMap.get(name);
  return (!f.isUndefined(buff.get('bonus')));
};

exports.getBuffFunc = (name) => {
  const buff = typeMap.get(name);
  return (!f.isUndefined(buff.get('bonus')) ? Map({ func: buff.get('bonus'), forAll: false }) : Map({ func: buff.get('allBonus'), forAll: true }));
};

exports.hasBonus = name => !f.isUndefined(typeMap.get(name).get('req'));

// Given name and level, returns required amount for that level
exports.getTypeReq = (name, level) => {
  return typeMap.get(name).get('req').get(level - 1);
}