// Author: Petter Andersson

const { Map, List } = require('immutable');

const f = require('./f');

const increaseSpeed = (unit, bonus) => unit.set('speed', unit.get('speed') - bonus); // Lower speed = better
const increaseHp = (unit, bonus) => unit.set('hp', +unit.get('hp') + +bonus);
const increaseAttack = (unit, bonus) => unit.set('attack', +unit.get('attack') + +bonus);
const increaseDefense = (unit, bonus) => unit.set('defense', +unit.get('defense') + +bonus);
const decreaseDefense = (unit, bonus) => unit.set('defense', +unit.get('defense') - +bonus);
const decreaseSpeed = (unit, bonus) => unit.set('speed', +unit.get('speed') + +bonus); // Higher speed value = worse

// TODO: Add hp reg mechanic?

/**
 * req: Required amount of units to receive bonus
 * bonus: function effect for buffs only for units with type
 * allBonus: function effect for buffs for entire team
 * TODO: Add for enemy: enemyDebuff: func
 * bonusType: bonus, allBonus, enemyDebuff
 *
 * strongAgainst: Assumed Empty
 */
const typeMap = new Map({
  normal: Map({
    name: 'normal',
    ineffectiveAgainst: List([
      'Rock',
      'Steel',
    ]),
    noDamageAgainst: 'Ghost',
    // desc: 'Normal: [4, 7, 10] Increases Hp for all units [15, 30, 45]',
    req: List([4, 7, 10]),
    bonusAmount: List([15, 30, 45]),
    bonusType: 'allBonus',
    bonusStatType: 'hp',
    allBonus: (unit, bonus) => increaseHp(unit, bonus),
  }),
  fire: Map({
    name: 'fire',
    strongAgainst: List([
      'Grass',
      'Ice',
      'Bug',
      'Steel',
    ]),
    ineffectiveAgainst: List([
      'Fire',
      'Water',
      'Rock',
      'Dragon',
    ]),
    // desc: 'Fire: [2, 4, 6] Increases attack damage for fire types [10, 20, 30]',
    req: List([2, 4, 6]),
    bonusAmount: List([10, 20, 30]),
    bonusType: 'bonus',
    bonusStatType: 'attack',
    bonus: (unit, bonus) => increaseAttack(unit, bonus),
    /*
    Increase burn chance for abilities? (currently 10%)
    [3, 6] might be better
    */
  }),
  water: Map({
    name: 'water',
    strongAgainst: List([
      'Fire',
      'Ground',
      'Rock',
    ]),
    ineffectiveAgainst: List([
      'Water',
      'Grass',
      'Dragon',
    ]),
    // desc: 'Water: [4, 7, 10] Increases speed for all water type units [15, 30, 45]',
    req: List([4, 7, 10]),
    bonusAmount: List([15, 30, 45]),
    bonusType: 'allBonus',
    bonusStatType: 'speed',
    allBonus: (unit, bonus) => increaseSpeed(unit, bonus),
    /*
    All bonus defense
    Could be better
    [4, 7, 10]
    */
  }),
  electric: Map({
    name: 'electric',
    strongAgainst: List([
      'Water',
      'Flying',
    ]),
    ineffectiveAgainst: List([
      'Electric',
      'Grass',
      'Dragon',
    ]),
    noDamageAgainst: 'Ground',
    // desc: 'Electric: [2, 4, 6] Increases speed for all [20, 40, 60]',
    req: List([2, 4, 6]),
    bonusAmount: List([20, 40, 60]),
    bonusType: 'allBonus',
    bonusStatType: 'speed',
    allBonus: (unit, bonus) => increaseSpeed(unit, bonus),
  }),
  grass: Map({
    name: 'grass',
    strongAgainst: List([
      'Water',
      'Ground',
      'Rock',
    ]),
    ineffectiveAgainst: List([
      'Fire',
      'Grass',
      'Poison',
      'Flying',
      'Bug',
      'Dragon',
      'Steel',
    ]),
    // desc: 'Grass: [2, 4, 6] Increases defense for all grass type units [20, 40, 60]',
    req: List([2, 4, 6]),
    bonusAmount: List([20, 40, 60]),
    bonusType: 'bonus',
    bonusStatType: 'defense',
    bonus: (unit, bonus) => increaseDefense(unit, bonus),
    // TODO: Better buff, doesnt fit
  }),
  ice: Map({
    name: 'ice',
    strongAgainst: List([
      'Grass',
      'Ground',
      'Flying',
      'Dragon',
    ]),
    ineffectiveAgainst: List([
      'Fire',
      'Water',
      'Ice',
      'Steel',
    ]),
    // desc: 'Ice: [2, 4, 6] Increases Hp for all units [30, 60, 90]',
    req: List([2, 4, 6]),
    bonusAmount: List([30, 60, 90]),
    bonusType: 'allBonus',
    bonusStatType: 'hp',
    allBonus: (unit, bonus) => increaseHp(unit, bonus),
  }),
  fighting: Map({
    name: 'fighting',
    strongAgainst: List([
      'Normal',
      'Ice',
      'Rock',
      'Dark',
      'Steel',
    ]),
    ineffectiveAgainst: List([
      'Poison',
      'Flying',
      'Psychic',
      'Bug',
      'Fairy',
    ]),
    noDamageAgainst: 'Ghost',
    // desc: 'Fighting: [2, 4, 6] Increases Damage for all fighting type units [20, 40, 60]',
    req: List([2, 4, 6]),
    bonusAmount: List([20, 40, 60]),
    bonusType: 'bonus',
    bonusStatType: 'attack',
    bonus: (unit, bonus) => increaseAttack(unit, bonus),
  }),
  poison: Map({
    name: 'poison',
    strongAgainst: List([
      'Grass',
      'Fairy',
    ]),
    ineffectiveAgainst: List([
      'Poison',
      'Ground',
      'Rock',
      'Ghost',
    ]),
    noDamageAgainst: 'Steel',
    req: List([3, 6, 9]),
    bonusAmount: List([20, 40, 60]),
    bonusType: 'enemyDebuff',
    bonusStatType: 'speed',
    enemyDebuff: (unit, bonus) => decreaseSpeed(unit, bonus),
    /*
    early game
    */
  }),
  ground: Map({
    name: 'ground',
    strongAgainst: List([
      'Fire',
      'Electric',
      'Poison',
      'Rock',
      'Steel',
    ]),
    ineffectiveAgainst: List([
      'Grass',
      'Bug',
    ]),
    noDamageAgainst: 'Flying',
    // desc: 'Ground: [2, 4, 6] Increases defense for all ground typed units [30, 60, 90]',
    req: List([2, 4, 6]),
    bonusAmount: List([30, 60, 90]),
    bonusType: 'bonus',
    bonusStatType: 'defense',
    bonus: (unit, bonus) => increaseDefense(unit, bonus),
  }),
  flying: Map({
    name: 'flying',
    strongAgainst: List([
      'Grass',
      'Fighting',
      'Bug',
    ]),
    ineffectiveAgainst: List([
      'Electric',
      'Rock',
      'Steel',
    ]),
    // desc: 'Flying: [3, 6, 9] Increases defense for all flying typed units [30, 60, 90]',
    req: List([3, 6, 9]),
    bonusAmount: List([30, 60, 90]),
    bonusType: 'bonus',
    bonusStatType: 'defense',
    bonus: (unit, bonus) => increaseSpeed(unit, bonus),
  }),
  psychic: Map({
    name: 'psychic',
    strongAgainst: List([
      'Fighting',
      'Poison',
    ]),
    ineffectiveAgainst: List([
      'Psychic',
      'Steel',
    ]),
    noDamageAgainst: 'Dark',
    // desc: 'Psychic: [3, 6, 9] Decreases defense for all enemy units [20, 40, 60]',
    req: List([3, 6, 9]),
    bonusAmount: List([20, 40, 60]),
    bonusType: 'enemyDebuff',
    bonusStatType: 'defense',
    enemyDebuff: (unit, bonus) => decreaseDefense(unit, bonus),
  }),
  bug: Map({
    name: 'bug',
    strongAgainst: List([
      'Grass',
      'Psychic',
      'Dark',
    ]),
    ineffectiveAgainst: List([
      'Fire',
      'Fighting',
      'Poison',
      'Flying',
      'Ghost',
      'Steel',
      'Fairy',
    ]),
    // desc: 'Bug: [2, 4] Increases Hp for all bug typed units [20, 40, 60]',
    req: List([2, 4]),
    bonusAmount: List([20, 40, 60]),
    bonusType: 'bonus',
    bonusStatType: 'hp',
    bonus: (unit, bonus) => increaseHp(unit, bonus),
    /*
    [2, 4] Druid buff TODO
    */
  }),
  rock: Map({
    name: 'rock',
    strongAgainst: List([
      'Fire',
      'Ice',
      'Flying',
      'Bug',
    ]),
    ineffectiveAgainst: List([
      'Fighting',
      'Ground',
      'Steel',
    ]),
    // desc: 'Rock: [2, 4, 6] Increases attack damage for all rock typed units [15, 30, 45]',
    req: List([2, 4, 6]),
    bonusAmount: List([15, 30, 45]),
    bonusType: 'bonus',
    bonusStatType: 'attack',
    bonus: (unit, bonus) => increaseDefense(unit, bonus),
  }),
  ghost: Map({
    name: 'ghost',
    strongAgainst: List([
      'Psychic',
      'Ghost',
    ]),
    ineffectiveAgainst: 'Dark',
    noDamageAgainst: 'Normal',
    // desc: 'Ghost: [1] Increases attack damage for all ghost typed units [30]',
    req: List([1]),
    bonusAmount: List([30]),
    bonusType: 'bonus',
    bonusStatType: 'attack',
    bonus: (unit, bonus) => increaseAttack(unit, bonus),
    /*
    TODO: Demon ? Only strong if only ghost on board, +50% dmg
          Evasion ? (Since ghost hard to hit)
    */
  }),
  dragon: Map({
    name: 'dragon',
    strongAgainst: 'Dragon',
    ineffectiveAgainst: 'Steel',
    noDamageAgainst: 'Fairy',
    // desc: 'Dragon: [1] Increases attack damage for all dragon typed units [30]',
    req: List([1]),
    bonusAmount: List([30]),
    bonusType: 'bonus',
    bonusStatType: 'attack',
    bonus: (unit, bonus) => increaseAttack(unit, bonus),
    /*
    dratini
    TODO
    Strong unique
    Better spell power
    */
  }),
  dark: Map({
    name: 'dark',
    strongAgainst: List([
      'Psychic',
      'Ghost',
    ]),
    ineffectiveAgainst: List([
      'Fighting',
      'Dark',
      'Fairy',
    ]),
    /*
    None
    */
  }),
  steel: Map({
    name: 'steel',
    strongAgainst: List([
      'Ice',
      'Rock',
      'Fairy',
    ]),
    ineffectiveAgainst: List([
      'Fire',
      'Water',
      'Electric',
      'Steel',
    ]),
    //desc: 'Steel: [1, 2] Increases defense for all steel typed units [15, 30]',
    req: List([1, 2]),
    bonusAmount: List([15, 30]),
    bonusType: 'bonus',
    bonusStatType: 'defense',
    bonus: (unit, bonus) => increaseDefense(unit, bonus),
    /*
    Defense for steel units
    No combo, simple bonus
    */
  }),
  fairy: Map({
    name: 'fairy',
    strongAgainst: List([
      'Fighting',
      'Dragon',
      'Dark',
    ]),
    ineffectiveAgainst: List([
      'Fire',
      'Poison',
      'Steel',
    ]),
    /*
    None
    */
  }),
});

/**
 * Type matchup, check for strong against defenseType
 */
const isStrongAgainst = async (attackType, defenseType) => {
  const strongAgainst = typeMap.get(attackType).get('strongAgainst');
  if (!f.isUndefined(strongAgainst)) {
    if(strongAgainst.size > 0){
      const lowerCase = strongAgainst.map(v => v.toLowerCase());
      return (lowerCase.includes(defenseType) ? 2.0 : 1.0);
    } else {
      const lowerCase = strongAgainst.toLowerCase();
      return (lowerCase.includes(defenseType) ? 2.0 : 1.0);
    }
  }
  return 1.0;
};

/**
 * Type matchup, check for ineffective against defenseType
 * TODO List to lowercase
 */
const isIneffectiveAgainst = async (attackType, defenseType) => {
  const ineffectiveAgainst = typeMap.get(attackType).get('ineffectiveAgainst');
  if (ineffectiveAgainst.size > 0) {
    const lowerCase = ineffectiveAgainst.map(v => v.toLowerCase());
    return (lowerCase.includes(defenseType) ? 0.5 : 1.0);
  } else {
    const lowerCase = ineffectiveAgainst.toLowerCase();
    return (lowerCase.includes(defenseType) ? 0.5 : 1.0);
  }
  // console.log('@inefective', ineffectiveAgainst.includes(defenseType), ineffectiveAgainst);
};

/**
 * Type matchup, check for strong against defenseType
 */
const hasNoDamageAgainst = async (attackType, defenseType) => {
  const noDamage = typeMap.get(attackType).get('noDamageAgainst');
  if (!f.isUndefined(noDamage)) {
    const lowerCase = noDamage.toLowerCase();
    return (lowerCase.includes(defenseType) ? 0.0 : 1.0);
  }
  return 1.0;
};

/**
 * Returns type factor for attack
 * 2 if attackType is effective against defenseType
 * 0.5 if defenseType is resistance against attackType
 */
const calcTypeFactor = async (attackType, defenseType) => {
  const strengthRatio = await isStrongAgainst(attackType, defenseType);
  const ineffectiveRatio = await isIneffectiveAgainst(attackType, defenseType);
  const noEffectRatio = await hasNoDamageAgainst(attackType, defenseType);
  // console.log('@calcTypeFactor', attackType, defenseType, strengthRatio, ineffectiveRatio);
  return strengthRatio * ineffectiveRatio * noEffectRatio;
};

/**
 * Returns typefactor from attacktype to defenseType
 */
exports.getTypeFactor = async (attackType, typesDefender) => {
  // console.log('@getTypeFactor', attackType, typesDefender)
  if (!f.isUndefined(typesDefender.size)) { // 2 Defending types
    let typeList = List([1, 1]);
    for (let i = 0; i < typesDefender.size; i++) {
      typeList = typeList.set(i, await calcTypeFactor(attackType, typesDefender.get(i)));
    }
    return typeList.get(0) * typeList.get(1);
  } // 1 type
  return calcTypeFactor(attackType, typesDefender);
};

const getStringFromList = list => {
  // console.log('@getStringFromList', list)
  if(!list.size){
    return list;
  }
  let s = list.get(0);
  for(let i = 1; i < list.size; i++){
    s += ', ' + list.get(i);
  }
  return s;
}

const capitalize = string => string.charAt(0).toUpperCase() + string.slice(1);

const getTypeDesc = name => {
  const type = typeMap.get(name);
  if(f.isUndefined(type.get('req'))){
    return '';
  }
  const typeName = type.get('name');
  const req = type.get('req').toJS();
  const bonusType = type.get('bonusType');
  const inc = (bonusType !== 'enemyDebuff' ? 'Increases': 'Decreases'); 
  const units = (bonusType === 'bonus' ? 'all ' + typeName + ' typed units' : (bonusType === 'allBonus' ? 'all units' : 'all enemy units'));
  const bonusAmount = type.get('bonusAmount').toJS();
  const bonusStatType = type.get('bonusStatType');
  return `${capitalize(typeName)}: [${req}] ${inc} ${bonusStatType} for ${units} [${bonusAmount}]`;
  // 'Steel: [1, 2] Increases defense for all steel typed units [15, 30]',
}

exports.buildTypeString = () => {
  const iter = typeMap.keys();
  let temp = iter.next();
  let s = 'Types:\n';
  let typeDesc = 'Type bonuses:\n';
  while (!temp.done) {
    const type = typeMap.get(temp.value);
    let name = type.get('name');
    let tempString = name.charAt(0).toUpperCase() + name.slice(1) + ': ';
    if(type.get('strongAgainst')) tempString += '\n-   Strong against: ' + getStringFromList(type.get('strongAgainst'));
    if(type.get('ineffectiveAgainst')) tempString += '\n-   Ineffective against: ' + getStringFromList(type.get('ineffectiveAgainst'));
    if(type.get('noDamageAgainst')) tempString += '\n-   No effect against: ' + getStringFromList(type.get('noDamageAgainst'));
    s += tempString + '\n';
    const typeDescription = getTypeDesc(name);
    if(typeDescription !== ''){
      typeDesc += typeDescription + '\n';
    }
    /*
    if(!f.isUndefined(type.get('desc'))){
      typeDesc += type.get('desc') + '\n';
    }*/
    temp = iter.next();
  }
  return [s, typeDesc];
}

exports.getType = name => typeMap.get(name);

exports.getBonusAmount = (name, level) => typeMap.get(name).get('bonusAmount').get(level - 1);

exports.getBonusStatType = name => typeMap.get(name).get('bonusStatType');

exports.getBuffFuncSolo = name => typeMap.get(name).get('bonus');

exports.getBuffFuncAll = name => typeMap.get(name).get('allBonus');

exports.getEnemyDebuff = name => typeMap.get(name).get('enemyDebuff');

exports.getBonusType = name => typeMap.get(name).get('bonusType');

/*
exports.isSoloBuff = (name) => {
  const buff = typeMap.get(name);
  return (!f.isUndefined(buff.get('bonus')));
};
*/
exports.getBuffFunc = (name) => {
  const buff = typeMap.get(name);
  return (!f.isUndefined(buff.get('bonus')) ? Map({ func: buff.get('bonus'), forAll: false }) : Map({ func: buff.get('allBonus'), forAll: true }));
};

exports.hasBonus = name => !f.isUndefined(typeMap.get(name).get('req'));

// Given name and level, returns required amount for that level
exports.getTypeReq = (name, level) => typeMap.get(name).get('req').get(level - 1);
