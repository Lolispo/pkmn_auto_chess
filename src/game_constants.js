// Author: Petter Andersson

const { Map, List } = require('immutable');
const gameJS = require('./game');
const f = require('./f');

// const rarityAmount = List([45, 30, 25, 15, 10]); // Real version
// const rarityAmount = List([3, 3, 3, 3, 3]); // Test version
const rarityAmount = List([9, 9, 9, 9, 9]); // Test version


const levelPieceProbability = Map({
  1: Map({
    1: 1.00, 2: 0.00, 3: 0.00, 4: 0.00, 5: 0.00,
  }),
  2: Map({
    1: 0.70, 2: 0.30, 3: 0.00, 4: 0.00, 5: 0.00,
  }),
  3: Map({
    1: 0.60, 2: 0.35, 3: 0.05, 4: 0.00, 5: 0.00,
  }),
  4: Map({
    1: 0.50, 2: 0.35, 3: 0.15, 4: 0.00, 5: 0.00,
  }),
  5: Map({
    1: 0.40, 2: 0.35, 3: 0.23, 4: 0.02, 5: 0.00,
  }),
  6: Map({
    1: 0.33, 2: 0.30, 3: 0.30, 4: 0.07, 5: 0.00,
  }),
  7: Map({
    1: 0.30, 2: 0.30, 3: 0.30, 4: 0.10, 5: 0.00,
  }),
  8: Map({
    1: 0.24, 2: 0.30, 3: 0.30, 4: 0.15, 5: 0.01,
  }),
  9: Map({
    1: 0.22, 2: 0.30, 3: 0.25, 4: 0.20, 5: 0.03,
  }),
  10: Map({
    1: 0.19, 2: 0.25, 3: 0.25, 4: 0.25, 5: 0.06,
  }),
});

// TODO: Correct numbers
const expRequiredPerLevel = Map({
  1: 1,
  2: 1,
  3: 2,
  4: 4,
  5: 8,
  6: 16,
  7: 24,
  8: 32,
  9: 40,
});

exports.getExpRequired = index => expRequiredPerLevel.get(String(index));

const damageFactorType = Map({
  attack: 0.125,
  spell: 0.5,
});

exports.getDamageFactorType = actionType => damageFactorType.get(actionType);

/**
 * Set level setups
 * 1,2,3 Npc levels
 * 10+ Gym battles
 *  10: Rock: Geodude, Onix
    15: Water: Staryu, Starmie
    20: Electric: voltorb, pikachu, raichu
    25: Grass: victreebel, tangela, vileplume
    30: Poison: koffing, muk, koffing, weezing
    35: Psychic: kadabra, mr. mime, venomoth, alakazam
    40: Fire: Growlithe, ponyta, rapidash, arcanine
    45: Ground: rhyhorn, dugtrio, nidoqueen, nidoking, rhydon
    50: Ice: dewgong, cloyster, slowbro, jynx, lapras
    55: Fighting + Onix: Onix, hitmonlee, hitmonchan, onix, machamp
    60: Ghost + goldbat/arbok: Gengar, golbat, haunter, arbok, gengar
    65: Flying + Dragon: Gyarados, Dragonair, aerodactyl, dragonite
    70: Final Boss: Pidgeot, alakazam, rhydon, arcanine, exeggutor, blastoise
 */
const roundSetConfiguration = Map({
  1: async () => gameJS.createBattleBoard(List([
    Map({ name: 'magikarp', x: 3, y: 1 }),
  ])),
  2: async () => gameJS.createBattleBoard(List([
    Map({ name: 'rattata', x: 3, y: 1 }),
    Map({ name: 'rattata', x: 4, y: 1 }),
  ])),
  3: async () => gameJS.createBattleBoard(List([
    Map({ name: 'pidgey', x: 3, y: 1 }),
    Map({ name: 'pidgeotto', x: 4, y: 1 }),
  ])),
  10: async () => gameJS.createBattleBoard(List([
    Map({ name: 'geodude', x: 3, y: 1 }),
    Map({ name: 'onix', x: 4, y: 1 }),
  ])),
  15: async () => gameJS.createBattleBoard(List([
    Map({ name: 'staryu', x: 3, y: 1 }),
    Map({ name: 'starmie', x: 4, y: 1 }),
  ])),
  20: async () => gameJS.createBattleBoard(List([
    Map({ name: 'voltorb', x: 3, y: 1 }),
    Map({ name: 'pikachu', x: 4, y: 1 }),
    Map({ name: 'raichu', x: 5, y: 1 }),
  ])),
  25: async () => gameJS.createBattleBoard(List([
    Map({ name: 'victreebel', x: 3, y: 1 }),
    Map({ name: 'tangela', x: 4, y: 1 }),
    Map({ name: 'vileplume', x: 5, y: 1 }),
  ])),
  30: async () => gameJS.createBattleBoard(List([
    Map({ name: 'koffing', x: 3, y: 1 }),
    Map({ name: 'muk', x: 4, y: 1 }),
    Map({ name: 'weezing', x: 5, y: 1 }),
    Map({ name: 'koffing', x: 6, y: 1 }),
  ])),
  35: async () => gameJS.createBattleBoard(List([
    Map({ name: 'kadabra', x: 3, y: 1 }),
    Map({ name: 'venomoth', x: 4, y: 1 }),
    Map({ name: 'alakazam', x: 5, y: 1 }),
    Map({ name: 'mr. mime', x: 6, y: 1 }),
  ])),
  40: async () => gameJS.createBattleBoard(List([
    Map({ name: 'growlithe', x: 3, y: 1 }),
    Map({ name: 'ponyta', x: 4, y: 1 }),
    Map({ name: 'rapidash', x: 5, y: 1 }),
    Map({ name: 'arcanine', x: 6, y: 1 }),
  ])),
  45: async () => gameJS.createBattleBoard(List([
    Map({ name: 'rhyhorn', x: 3, y: 1 }),
    Map({ name: 'dugtrio', x: 4, y: 1 }),
    Map({ name: 'nidoqueen', x: 5, y: 1 }),
    Map({ name: 'nidoking', x: 6, y: 1 }),
    Map({ name: 'rhydon', x: 2, y: 1 }),
  ])),
});

exports.getSetRound = async (round) => {
  const board = await roundSetConfiguration.get(String(round))();
  // console.log('@getSetRound', board);
  if (f.isUndefined(board)) {
    return gameJS.createBattleBoard(List([
      Map({ name: 'rhyhorn', x: 3, y: 1 }),
      Map({ name: 'dugtrio', x: 4, y: 1 }),
      Map({ name: 'nidoqueen', x: 5, y: 1 }),
      Map({ name: 'nidoking', x: 6, y: 1 }),
      Map({ name: 'rhydon', x: 2, y: 1 }),
    ]));
  }
  return board;
};

exports.getRoundType = (round) => {
  if (round <= 3) {
    return 'npc';
  }
  if (round % 5 === 0 && round > 5) {
    return 'gym';
  }
  if (round === 21 || round === 31 || round === 41 || round === 51) {
    return 'shop';
  }
  return 'pvp';
};

// index - 1, Handles 0-4 indexes, send cost directly
exports.getRarityAmount = index => rarityAmount.get(index - 1);

exports.getLevelPieceProbability = index => levelPieceProbability.get(String(index));

exports.getPieceProbabilityNum = (index) => {
  const probs = levelPieceProbability.get(String(index));
  return [probs.get('1'), probs.get('1') + probs.get('2'), probs.get('1') + probs.get('2') + probs.get('3'),
    probs.get('1') + probs.get('2') + probs.get('3') + probs.get('4'),
    probs.get('1') + probs.get('2') + probs.get('3') + probs.get('4') + probs.get('5')];
};
