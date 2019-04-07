// Author: Petter Andersson

const { Map, List } = require('immutable');
const gameJS = require('./game');
const f = require('./f');

const rarityAmount = List([45, 30, 25, 15, 10]); // Real version
// const rarityAmount = List([3, 3, 3, 3, 3]); // Test version
// const rarityAmount = List([9, 9, 9, 9, 9]); // Test version

exports.debugMode = true;

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
    Map({ name: 'caterpie', x: 5, y: 1 }),
  ])),
  3: async () => gameJS.createBattleBoard(List([
    Map({ name: 'pidgey', x: 3, y: 1 }),
    Map({ name: 'pidgeotto', x: 5, y: 1 }),
  ])),
  10: async () => gameJS.createBattleBoard(List([
    // Map({ name: 'geodude', x: 3, y: 1 }),
    Map({ name: 'onix', x: 4, y: 1 }),
    Map({ name: 'rhyhorn', x: 5, y: 2 }),
    Map({ name: 'geodude', x: 3, y: 2 }),
  ])),
  15: async () => gameJS.createBattleBoard(List([
    Map({ name: 'staryu', x: 3, y: 1 }),
    Map({ name: 'starmie', x: 4, y: 1 }),
    Map({ name: 'horsea', x: 5, y: 2 }),
    Map({ name: 'seadra', x: 6, y: 2 }),
    Map({ name: 'seel', x: 2, y: 1 }),
    Map({ name: 'poliwhirl', x: 5, y: 1 }),
    Map({ name: 'magikarp', x: 7, y: 2 }),
  ])),
  20: async () => gameJS.createBattleBoard(List([
    Map({ name: 'voltorb', x: 3, y: 1 }),
    Map({ name: 'pikachu', x: 4, y: 1 }),
    Map({ name: 'raichu', x: 5, y: 1 }),
    Map({ name: 'electrode', x: 7, y: 2 }),
    Map({ name: 'electabuzz', x: 6, y: 2 }),
    Map({ name: 'magneton', x: 2, y: 2 }),
    Map({ name: 'ampharos', x: 6, y: 1 }),
  ])),
  25: async () => gameJS.createBattleBoard(List([
    Map({ name: 'victreebel', x: 3, y: 1 }),
    Map({ name: 'parasect', x: 4, y: 1 }),
    Map({ name: 'vileplume', x: 5, y: 1 }),
    Map({ name: 'gloom', x: 6, y: 1 }),
    Map({ name: 'venusaur', x: 7, y: 1 }),
    Map({ name: 'ivysaur', x: 2, y: 1 }),
    Map({ name: 'bulbasaur', x: 1, y: 1 }),
  ])),
  30: async () => gameJS.createBattleBoard(List([
    Map({ name: 'beedrill', x: 3, y: 1 }),
    Map({ name: 'butterfree', x: 4, y: 1 }),
    Map({ name: 'crobat', x: 5, y: 1 }),
    Map({ name: 'crobat', x: 6, y: 1 }),
    Map({ name: 'crobat', x: 1, y: 1 }),
    Map({ name: 'metapod', x: 7, y: 2 }),
    Map({ name: 'kakuna', x: 2, y: 2 }),
    Map({ name: 'golbat', x: 1, y: 2 }),
  ])),
  35: async () => gameJS.createBattleBoard(List([
    // Map({ name: 'kadabra', x: 3, y: 1 }),
    Map({ name: 'haunter', x: 4, y: 1 }),
    // Map({ name: 'alakazam', x: 5, y: 1 }),
    Map({ name: 'drowzee', x: 6, y: 1 }),
    Map({ name: 'hypno', x: 7, y: 1 }),
    Map({ name: 'gengar', x: 2, y: 1 }),
    Map({ name: 'jynx', x: 1, y: 1 }),
    Map({ name: 'exeggutor', x: 2, y: 2 }),
    Map({ name: 'gardevoir', x: 3, y: 1 }),
    Map({ name: 'kirlia', x: 5, y: 1 }),
  ])),
  40: async () => gameJS.createBattleBoard(List([
    Map({ name: 'growlithe', x: 3, y: 1 }),
    Map({ name: 'ponyta', x: 4, y: 1 }),
    Map({ name: 'rapidash', x: 5, y: 1 }),
    Map({ name: 'arcanine', x: 6, y: 1 }),
    Map({ name: 'ninetales', x: 7, y: 1 }),
    Map({ name: 'charizard', x: 2, y: 1 }),
    Map({ name: 'magmar', x: 2, y: 2 }),
    Map({ name: 'magmortar', x: 4, y: 2 }),
    Map({ name: 'flareon', x: 6, y: 2 }),
  ])),
  45: async () => gameJS.createBattleBoard(List([
    Map({ name: 'rhyhorn', x: 3, y: 1 }),
    Map({ name: 'dugtrio', x: 4, y: 1 }),
    Map({ name: 'nidoqueen', x: 5, y: 1 }),
    Map({ name: 'nidoking', x: 6, y: 1 }),
    Map({ name: 'rhydon', x: 2, y: 1 }),
    Map({ name: 'nidorino', x: 2, y: 2 }),
    Map({ name: 'nidorina', x: 5, y: 2 }),
    Map({ name: 'rhydon', x: 3, y: 1 }),
    Map({ name: 'persian', x: 3, y: 2 }),
    Map({ name: 'mewtwo', x: 4, y: 2 }),
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

const gymLeader = Map({
  10: 'Brock',
  15: 'Misty',
  20: 'Lt.Surge',
  25: 'Erika',
  30: 'Koga',
  35: 'Sabrina',
  40: 'Blaine',
  45: 'Giovanni',
});

exports.getGymLeader = round => gymLeader.get(String(round));


exports.getRoundType = (round) => {
  if (round <= 3) {
    return 'npc';
  }
  if (round % 5 === 0 && round > 5 && round < 50) {
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
  if (f.isUndefined(probs)) console.log('getPieceProbability', index);
  return [probs.get('1'), probs.get('1') + probs.get('2'), probs.get('1') + probs.get('2') + probs.get('3'),
    probs.get('1') + probs.get('2') + probs.get('3') + probs.get('4'),
    probs.get('1') + probs.get('2') + probs.get('3') + probs.get('4') + probs.get('5')];
};

exports.getTypeEffectString = (typeFactor) => {
  if (typeFactor <= 0.0) {
    return 'No effect';
  } if (typeFactor <= 0.25) {
    return 'Not effective';
  } if (typeFactor <= 0.5) {
    return 'Not very effective';
  } if (typeFactor > 0.5 && typeFactor < 2) {
    return '';
  } if (typeFactor <= 2) {
    return 'Super effective!';
  } if (typeFactor <= 4) {
    return 'Extremely effective!';
  }
  return '';
};
