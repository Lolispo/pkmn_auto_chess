// Author: Petter Andersson


const assert = require('assert');
const rewire = require('rewire');
const { Map, List, fromJS } = require('immutable');

const fileModule = rewire('../src/game.js');
const fileModule2 = rewire('../src/game_constants.js');
const pokemonJs = rewire('../src/pokemon.js');

const f = require('../src/f');

const initEmptyState = fileModule.__get__('initEmptyState');
const refreshShop = fileModule.__get__('refreshShop');
const buyUnit = fileModule.__get__('buyUnit');
const buyExp = fileModule.__get__('buyExp');
const toggleLock = fileModule.__get__('toggleLock');
const endBattle = fileModule.__get__('endBattle');
const endTurn = fileModule.__get__('endTurn');
const buildPieceStorage = fileModule.__get__('buildPieceStorage');

describe('game state', () => {
  describe('initEmptyState', () => {
    it('initEmptyState is correct?', () => {
      let state = initEmptyState(2);
      assert.equal(state.get('round'), 1);
      assert.equal(state.get('income_basic'), 1);
      assert.equal(state.get('discarded_pieces').size, 0);
      assert.equal(state.getIn(['players', 0, 'level']), 1);
      assert.equal(state.getIn(['players', 1, 'level']), 1);
      assert.equal(state.getIn(['players', 0, 'exp_to_reach']), 1);
      assert.equal(state.getIn(['players', 0, 'exp']), 0);
    });
  });
  describe('buildPieceStorage', () => {
    it('buildPieceStorage is correct?', () => {
      let pieces = buildPieceStorage();
      /*
      // Enable test when all rarities exist
      let sum = 0;
      for(let i = 0; i < 5; i++){
        sum += fileModule2.getRarityAmount(i);
      }
      assert.equal(pieces.size, sum);
      */
      assert.equal(pokemonJs.getStats(pieces.get(0).get(0)).get('cost'), 1);
      assert.equal(pokemonJs.getStats(pieces.get(2).get(0)).get('cost'), 3);
    });
  });
  describe('refreshShop', () => {
    it('does refreshShop remove current shop?', () => {
      let state = initEmptyState(2);
      state = refreshShop(state, 0);
      // Assertion
    });
  });
  describe('buyUnit', () => {
    it('does buyunit remove unit from shop?', () => {
      let state = initEmptyState(2);
      state = refreshShop(state, 0);
      state = buyUnit(state, 0, 1);
      // Assertion
    });
  });
  describe('buyExp', () => {
    it('does buyexp increase level correctly?', () => {
      let state = initEmptyState(2);
      state = buyExp(state, 0);
      // Assertion
    });
  });
  describe('toggleLock', () => {
    it('toggleLock false -> true', () => {
      let state = initEmptyState(2);
      state = toggleLock(state, 0);
      // Assertion
    });
    it('toggleLock false -> true -> false', () => {
      let state = initEmptyState(2);
      state = toggleLock(state, 0);
      state = toggleLock(state, 0);
      // Assertion
    });
  });
  describe('endBattle', () => {
    it('many tests?', () => {
      let state = initEmptyState(2);
      state = endBattle(state, 0, true, 1); // index, winner, winneramount
      // Assertion
    });
  });
  describe('endTurn', () => {
    it('many tests?', () => {
      let state = initEmptyState(2);
      state = endTurn(state);
      // Assertion
    });
  });
  describe('endBattle, prepEndTurn, endTurn', () => {
    it('many tests?', () => {
      let state = initEmptyState(2);
      state = endBattle(state, 0, true, 1); // index, winner, winneramount
      state = endBattle(state, 1, false, 1); // index, winner, winneramount
      // Assertion - endTurn should have been run
    });
  });
});

describe('gameconstants', () => {
  describe('levelPieceAccurate', () => {
    it('does all rows add up to 1?', () => {
      for (let i = 1; i <= 10; i++) {
        const level = fileModule2.getLevelPieceProbability(i);
        let sum = 0;
        for (let j = 1; j <= 5; j++) {
          sum += level.get(String(j));
        }
        // console.error(i);
        assert.equal(Math.round(sum * 100) / 100, 1.0);
      }
    });
  });
});
