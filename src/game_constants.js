// Author: Petter Andersson

const { Map, List } = require('immutable');

// const rarity = List([45, 30, 25, 15, 10]);    // Real version
const rarityAmount = List([3, 3, 3, 3, 3]); // Test version

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
  6: 12,
  7: 16,
  8: 24,
  9: 28,
  10: 32,
});

// index - 1, Handles 0-4 indexes, send cost directly
exports.getRarityAmount = index => rarityAmount.get(index - 1);

exports.getLevelPieceProbability = index => levelPieceProbability.get(String(index));

exports.getExpRequired = index => expRequiredPerLevel.get(index);
