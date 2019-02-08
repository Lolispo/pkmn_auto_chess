// Author: Petter Andersson

const { Map, List } = require('immutable');

const f = require('./f');

const increaseSpeed = (unit, bonus) => unit.set('speed', unit.get('speed') - bonus); // Lower speed = better
const increaseHp = (unit, bonus) => unit.set('hp', +unit.get('hp') + +bonus);
const increaseAttack = (unit, bonus) => unit.set('attack', +unit.get('attack') + +bonus);

/**
 * Type matchup, check for strong against defenseType
 */
async function isStrongAgainst(attackerType, defenseType){
  const strongAgainst = typeMap.get(attackerType).get('strongAgainst');
  return (!f.isUndefined(strongAgainst.get(defenseType))? 2.0 : 1.0);
}

/**
 * Type matchup, check for ineffective against defenseType
 */
async function isIneffectiveAgainst(attackType, defenseType){
  const ineffectiveAgainst = typeMap.get(attackerType).get('ineffectiveAgainst');
  return (!f.isUndefined(ineffectiveAgainst.get(defenseType))? 0.5 : 1.0);
}

/**
 * req: Required amount of units to receive bonus
 * bonus: function effect for buffs only for units with type
 * allBonus: function effect for buffs for entire team
 */
const typeMap = new Map({
  normal: Map({
    name: 'normal',
    desc: 'Increases Hp',
    req: List([3, 6, 9]),
    bonusAmount: List([20, 40, 60]),
    bonus: (unit, bonus) => increaseHp(unit, bonus),
  }),
  grass: Map({
    name: 'grass',
    desc: 'Increases speed',
    req: List([2, 4, 6]),
    bonusAmount: List([20, 40, 60]),
    bonus: (unit, bonus) => increaseSpeed(unit, bonus),
  }),
  fire: Map({
    name: 'fire',
    desc: 'Increases attack damage',
    req: List([2, 4, 6]),
    bonusAmount: List([10, 20, 30]),
    bonus: (unit, bonus) => increaseAttack(unit, bonus),
  }),
  water: Map({
    name: 'water',
    desc: 'Increases attack damage for all',
    req: List([3, 6, 9]),
    bonusAmount: List([15, 30, 45]),
    allBonus: (unit, bonus) => increaseAttack(unit, bonus),
  }),
  electric: Map({
    name: 'electric',
    desc: 'Increases speed for all',
    req: List([3, 6, 9]),
    bonusAmount: List([20, 40, 60]),
    allBonus: (unit, bonus) => increaseSpeed(unit, bonus),
  }),
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

// Given name and level, returns required amount for that level
exports.getTypeReq = (name, level) => typeMap.get(name).get('req').get(level - 1);
