// Author: Petter Andersson


const assert = require('assert');
const rewire = require('rewire');
const { Map, List, fromJS } = require('immutable');

const fileModule = rewire('../src/game.js');
const fileModule2 = rewire('../src/game_constants.js');

const f = require('../src/f');

// const levelPieceProbability = fileModule.__get__('getLevelPieceProbability');

describe('levelPiece', () => {
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
