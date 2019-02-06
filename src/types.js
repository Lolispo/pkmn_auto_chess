// Author: Petter Andersson

const { Map, List} = require('immutable');

const increaseSpeed = (unit, bonus) => unit.set('speed', unit.get('speed') - bonus); // Lower speed = better
const increaseHp = (unit, bonus) => unit.set('hp', unit.get('hp') + bonus);
const increaseAttack = (unit, bonus) => unit.set('attack', unit.get('attack') + bonus);

/**
 * req: Required amount of units to receive bonus
 * bonus: function effect for buffs only for units with type
 * allBonus: function effect for buffs for entire team
 */
const typeMap = new Map({
  normal: Map({
    desc: 'Increases Hp',
    req: List([3, 6, 9]),
    bonusAmount: List([20, 40, 60]),
    bonus: (unit, bonus) => increaseHp(unit, bonus),
  }),
  grass: Map({
    desc: 'Increases speed',
    req: List([2, 4, 6]),
    bonusAmount: List([20, 40, 60]),
    bonus: (unit, bonus) => increaseSpeed(unit, bonus),
  }),
  fire: Map({
    desc: 'Increases attack damage',
    req: List([2, 4, 6]),
    bonusAmount: List([10, 20, 30]),
    bonus: (unit, bonus) => increaseAttack(unit, bonus),
  }),
  water: Map({
    desc: 'Increases attack damage for all',
    req: List([3, 6, 9]),
    bonusAmount: List([15, 30, 45]),
    allBonus: (unit, bonus) => increaseAttack(unit, bonus),
  }),
  water: Map({
    desc: 'Increases speed for all',
    req: List([3, 6, 9]),
    bonusAmount: List([20, 40, 60]),
    allBonus: (unit, bonus) => increaseSpeed(unit, bonus),
  }),
});

exports.getTypeBonus = name => typeMap.get(name);
