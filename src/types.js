// Author: Petter Andersson

const { Map, List } = require('immutable');

const f = require('./f');

const increaseSpeed = (unit, bonus) => unit.set('speed', unit.get('speed') - bonus); // Lower speed = better
const increaseHp = (unit, bonus) => unit.set('hp', +unit.get('hp') + +bonus);
const increaseAttack = (unit, bonus) => unit.set('attack', +unit.get('attack') + +bonus);
const increaseDefense = (unit, bonus) => unit.set('defense', +unit.get('defense') + +bonus);

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
    desc: 'Increases Hp',
    req: List([3, 6, 9]),
    bonusAmount: List([20, 40, 60]),
    bonusType: 'bonus',
    bonus: (unit, bonus) => increaseHp(unit, bonus),
    /*
    All stages of game, 15 max ish (Could remove some, farfetchd, ditto, porygon)
    [4, 7, 10] hp for all
    pidgey rattata spearow clefairy jigglypuff meowth farfetchd doduo lickitung chansey kangaskhan tauros ditto eevee porygon snorlax
    */
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
    desc: 'Increases attack damage',
    req: List([2, 4, 6]),
    bonusAmount: List([10, 20, 30]),
    bonusType: 'bonus',
    bonus: (unit, bonus) => increaseAttack(unit, bonus),
    /*
    charmander, vulpix, growlithe, moltres, magmar, flareon ponyta
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
    desc: 'Increases attack damage for all',
    req: List([3, 6, 9]),
    bonusAmount: List([15, 30, 45]),
    bonusType: 'allBonus',
    allBonus: (unit, bonus) => increaseAttack(unit, bonus),
    /*
    All bonus (something) defense/attack
    18 units: Remove, goldeen, horsea, (krabby, slowpoke, tentacool)
    [4, 7, 10]
    psyduck poliwag tentacool slowpoke krabby omanyte kabuto
    squirtle, seel, shellder, horsea, goldeen, staryu, magikarp, vaporeon, lapras
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
    desc: 'Increases speed for all',
    req: List([3, 6, 9]),
    bonusAmount: List([20, 40, 60]),
    bonusType: 'allBonus',
    allBonus: (unit, bonus) => increaseSpeed(unit, bonus),
    /*
    pikachu magnemite voltorb jolteon electabuzz zapdos
    [2,4,6]
    */
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
    desc: 'Increases speed',
    req: List([2, 4, 6]),
    bonusAmount: List([20, 40, 60]),
    bonusType: 'bonus',
    bonus: (unit, bonus) => increaseSpeed(unit, bonus),
    /*
    oddish, bellsprout, exeggcute, tangela paras
    [2,4,6]
    */
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
    /*
    dewgong, articuno, cloyster, jynx, lapras
    Should be strong, [2,4,6]
    Buff for all
    */
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
    /*
    mankey, poliwrath, machop, hitmonlee chan
    Damage a lot for Fighters?
    [2,4,6]
    */
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
    /*
    weedle bulba ekans, nidoranx2, zubat oddish venonat bellsprout tentacool grimer gastly koffing
    early game
    Buff for all of same type
    [3,6,9]
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
    /*
    sandshrew (nidoking/queen) diglett geodude onix cubone rhyhorn
    [3, 6, 9] 
    [2, 4, 6] might be too strong

    */
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
    /*
    Increases speed for all flyers
    [3, 6, 9]
    [4, 7, 10]
    charizard, butterfree, pidgey, spearow, zubat, farfetchd, doduo, 
    scyther gyarados aerodactyl 3xbirds dragonite
    */
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
    /*
    abra gastly drowzee slowbro exeggcute starmie mrmime jynx mew mewtwo
    [2, 4, 6] Too strong?
    Undead buff? Decreases enemy defense
    */
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
    [2, 4] Druid buff
    caterpie weedle paras venonat scyther pinsir
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
    /*
    geodude rhyhorn onix omanyte kabuto aerodactly
    [2, 4, 6] Increase Defense
    */
  }),
  ghost: Map({
    name: 'ghost',
    strongAgainst: List([
      'Psychic',
      'Ghost',
    ]),
    ineffectiveAgainst: 'Dark',
    /*
    gastly
    Demon ? Only strong if only ghost on board, +50% dmg
    Evasion ? (Since ghost hard to hit)
    */
  }),
  dragon: Map({
    name: 'dragon',
    strongAgainst: 'Dragon',
    ineffectiveAgainst: 'Steel',
    /*
    dratini
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
    /*
    Magnemite
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
  return (!f.isUndefined(strongAgainst) && !f.isUndefined(strongAgainst.get(defenseType)) ? 2.0 : 1.0);
};

/**
 * Type matchup, check for ineffective against defenseType
 */
const isIneffectiveAgainst = async (attackType, defenseType) => {
  const ineffectiveAgainst = typeMap.get(attackType).get('ineffectiveAgainst');
  return (!f.isUndefined(ineffectiveAgainst.get(defenseType)) ? 0.5 : 1.0);
};

/**
 * Returns type factor for attack
 * 2 if attackType is effective against defenseType
 * 0.5 if defenseType is resistance against attackType
 */
const calcTypeFactor = async (attackType, defenseType) => {
  const strengthRatio = await isStrongAgainst(attackType, defenseType);
  const ineffectiveRatio = await isIneffectiveAgainst(attackType, defenseType);
  // console.log('@calcTypeFactor', attackType, defenseType, strengthRatio, ineffectiveRatio);
  return strengthRatio * ineffectiveRatio;
};

/**
 * Returns typefactor from attacktype to defenseType
 */
exports.getTypeFactor = async (attackType, typesDefender) => {
  // console.log('@getTypeFactor', attackType, typesDefender)
  if (!f.isUndefined(typesDefender.size)) { // 2 Defending types
    let typeFactorList = List([1, 1]);
    for (let i = 0; i < typesDefender.size; i++) {
      typeFactorList = typeFactorList.set(i, await calcTypeFactor(attackType, typesDefender.get(i)));
    }
    return typeFactorList.get(0) * typeFactorList.get(1);
  } // 1 type
  return calcTypeFactor(attackType, typesDefender);
};

exports.getType = name => typeMap.get(name);

exports.getBonusAmount = (name, level) => typeMap.get(name).get('bonusAmount').get(level - 1);

exports.getBuffFuncSolo = name => typeMap.get(name).get('bonus');

exports.getBuffFuncAll = name => typeMap.get(name).get('allBonus');

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
