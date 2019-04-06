// Author: Petter Andersson

const { Map, List } = require('immutable');

const f = require('./f');
const pokemonJS = require('./pokemon');

const increaseSpeed = (unit, bonus) => unit.set('speed', Math.max(10, unit.get('speed') - bonus)); // Lower speed = better
const increaseHp = (unit, bonus) => unit.set('hp', +unit.get('hp') + +bonus);
const increaseAttack = (unit, bonus) => unit.set('attack', +unit.get('attack') + +bonus);
const increaseDefense = (unit, bonus) => unit.set('defense', +unit.get('defense') + +bonus);
const decreaseDefense = (unit, bonus) => unit.set('defense', Math.max(0, +unit.get('defense') - +bonus));
const decreaseSpeed = (unit, bonus) => unit.set('speed', +unit.get('speed') + +bonus); // Higher speed value = worse
const decreaseHp = (unit, bonus) => unit.set('hp', Math.max(0, +unit.get('hp') - +bonus));
const decreaseAttack = (unit, bonus) => unit.set('attack', Math.max(0, +unit.get('attack') - +bonus));

const reqForUpgrade = async (unit, bonus) => {
  // Get tier of unit
  const tier = await pokemonJS.getUnitTier(unit.get('name'));
  console.log('@reqForUpgrade bugs', tier, bonus)
  if(tier <= bonus) { // Bonus marks highest allowed tier for unit
    console.log('@reqForUpgrade bugs BONUS', unit)
    return unit.set('reqEvolve', 2);
  }
  return unit;
}

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
    req: List([3, 5, 7]),
    bonusAmount: List([10, 20, 25]),
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
    req: List([2, 4, 6]),
    bonusAmount: List([10, 10, 15]),
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
    req: List([3, 5, 7]),
    bonusAmount: List([15, 20, 25]),
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
    req: List([2, 4, 6]),
    bonusAmount: List([25, 30, 35]),
    bonusType: 'bonus',
    bonusStatType: 'speed',
    bonus: (unit, bonus) => increaseSpeed(unit, bonus),
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
    req: List([2, 4]),
    bonusAmount: List([10, 15]),
    bonusType: 'enemyDebuff',
    bonusStatType: 'hp',
    enemyDebuff: (unit, bonus) => decreaseHp(unit, bonus),
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
    req: List([2, 4]),
    bonusAmount: List([25, 40]),
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
    req: List([2, 3]),
    bonusAmount: List([15, 15]),
    bonusType: 'allBonus',
    bonusStatType: 'attack',
    allBonus: (unit, bonus) => increaseAttack(unit, bonus),
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
    req: List([3, 5, 7]),
    bonusAmount: List([20, 25, 30]),
    bonusType: 'enemyDebuff',
    bonusStatType: 'speed',
    enemyDebuff: (unit, bonus) => decreaseSpeed(unit, bonus),
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
    req: List([2, 4, 5]),
    bonusAmount: List([15, 15, 10]),
    bonusType: 'enemyDebuff',
    bonusStatType: 'speed',
    enemyDebuff: (unit, bonus) => decreaseSpeed(unit, bonus),
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
    req: List([3, 6, 9]),
    bonusAmount: List([20, 20, 25]),
    bonusType: 'bonus',
    bonusStatType: 'speed',
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
    req: List([2, 3, 5]),
    bonusAmount: List([20, 30, 50]),
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
    /*
    req: List([2, 4]),
    bonusAmount: List([40, 50]),
    bonusType: 'bonus',
    bonusStatType: 'hp',
    bonus: (unit, bonus) => increaseHp(unit, bonus),
    */
    desc: 'Only two units required for upgrade of bug units of tier: ',
    req: List([2, 4]),
    bonusAmount: List([1, 2]),
    bonusType: 'bonus',
    bonusStatType: 'unique',
    bonus: (unit, bonus) => reqForUpgrade(unit, bonus),
    /*
    [2, 4] Druid buff
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
    req: List([2, 4, 6]),
    bonusAmount: List([20, 25, 30]),
    bonusType: 'bonus',
    bonusStatType: 'defense',
    bonus: (unit, bonus) => increaseDefense(unit, bonus),
    // 5 units
  }),
  ghost: Map({
    name: 'ghost',
    strongAgainst: List([
      'Psychic',
      'Ghost',
    ]),
    ineffectiveAgainst: 'Dark',
    noDamageAgainst: 'Normal',
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
    req: List([1]),
    bonusAmount: List([15]),
    bonusType: 'enemyDebuff',
    bonusStatType: 'attack',
    enemyDebuff: (unit, bonus) => decreaseAttack(unit, bonus),
    /*
    dratini
    Better spell power
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
    req: List([1]),
    bonusAmount: List([30]),
    bonusType: 'bonus',
    bonusStatType: 'attack',
    bonus: (unit, bonus) => increaseAttack(unit, bonus),
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
    req: List([2, 3]),
    bonusAmount: List([10, 20]),
    bonusType: 'allBonus',
    bonusStatType: 'hp',
    allBonus: (unit, bonus) => increaseHp(unit, bonus),
  }),
});

/**
 * Type matchup, check for strong against defenseType
 */
const isStrongAgainst = async (attackType, defenseType) => {
  const strongAgainst = typeMap.get(attackType).get('strongAgainst');
  if (!f.isUndefined(strongAgainst)) {
    if (strongAgainst.size > 0) {
      const lowerCase = strongAgainst.map(v => v.toLowerCase());
      return (lowerCase.includes(defenseType) ? 2.0 : 1.0);
    }
    const lowerCase = strongAgainst.toLowerCase();
    return (lowerCase.includes(defenseType) ? 2.0 : 1.0);
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
  }
  const lowerCase = ineffectiveAgainst.toLowerCase();
  return (lowerCase.includes(defenseType) ? 0.5 : 1.0);

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

const getStringFromList = (list) => {
  // console.log('@getStringFromList', list)
  if (!list.size) {
    return list;
  }
  let s = list.get(0);
  for (let i = 1; i < list.size; i++) {
    s += `, ${list.get(i)}`;
  }
  return s;
};

const capitalize = string => string.charAt(0).toUpperCase() + string.slice(1);

const getTypeDesc = (name) => {
  const type = typeMap.get(name);
  if (f.isUndefined(type.get('req'))) {
    return '';
  }
  const typeName = type.get('name');
  const req = type.get('req').toJS();
  const bonusType = type.get('bonusType');
  const inc = (bonusType !== 'enemyDebuff' ? 'Increases' : 'Decreases');
  const units = (bonusType === 'bonus' ? `all ${typeName} typed units` : (bonusType === 'allBonus' ? 'all units' : 'all enemy units'));
  const bonusAmount = type.get('bonusAmount').toJS();
  const bonusStatType = type.get('bonusStatType');
  let defString = '';
  if(bonusStatType === 'unique') {
    defString = type.get('desc');
  } else {
    defString = `${inc} ${bonusStatType} for ${units}`;
  }
  return `${capitalize(typeName)}: [${req}] ${defString} [${bonusAmount}]`;
  // 'Steel: [1, 2] Increases defense for all steel typed units [15, 30]',
};

exports.buildTypeString = () => {
  const iter = typeMap.keys();
  let temp = iter.next();
  let s = 'Types:\n';
  let typeDesc = 'Type bonuses:\n';
  while (!temp.done) {
    const type = typeMap.get(temp.value);
    const name = type.get('name');
    let tempString = `${name.charAt(0).toUpperCase() + name.slice(1)}: `;
    if (type.get('strongAgainst')) tempString += `\n-   Strong against: ${getStringFromList(type.get('strongAgainst'))}`;
    if (type.get('ineffectiveAgainst')) tempString += `\n-   Ineffective against: ${getStringFromList(type.get('ineffectiveAgainst'))}`;
    if (type.get('noDamageAgainst')) tempString += `\n-   No effect against: ${getStringFromList(type.get('noDamageAgainst'))}`;
    s += `${tempString}\n`;
    const typeDescription = getTypeDesc(name);
    if (typeDescription !== '') {
      typeDesc += `${typeDescription}\n`;
    }
    /*
    if(!f.isUndefined(type.get('desc'))){
      typeDesc += type.get('desc') + '\n';
    } */
    temp = iter.next();
  }
  return [s, typeDesc, typeMap];
};

exports.getType = name => typeMap.get(name);

exports.getBonusAmount = (name, level) => typeMap.get(name).get('bonusAmount').get(level - 1);

exports.getBonusStatType = name => typeMap.get(name).get('bonusStatType');

exports.getBuffFuncSolo = name => typeMap.get(name).get('bonus');

exports.getBuffFuncAll = name => typeMap.get(name).get('allBonus');

exports.getEnemyDebuff = name => typeMap.get(name).get('enemyDebuff');

// exports.getBuffNoBattleSolo = name => typeMap.get(name).get('noBattleBonus');

exports.getBonusType = name => typeMap.get(name).get('bonusType');

exports.hasBonus = name => !f.isUndefined(typeMap.get(name).get('req'));

// Given name and level, returns required amount for that level
exports.getTypeReq = (name, level) => typeMap.get(name).get('req').get(level - 1);
