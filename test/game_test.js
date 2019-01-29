// Author: Petter Andersson
'use strict';

const assert = require('assert');
const rewire = require("rewire");
const { Map, List, fromJS } = require('immutable');
const fileModule = rewire("../src/game.js");

const f = require('../src/f');

//const levelPieceProbability = fileModule.__get__('getLevelPieceProbability');

describe('levelPiece', function(){
    describe('levelPieceAccurate', function(){
        it('does all rows add up to 1?', function(){
            const levelPieceProbability = fileModule.getLevelPieceProbability();
            for(var i = 1; i <= 10; i++){
                const level = levelPieceProbability.get(String(i));
                let sum = 0;
                for(var j = 1; j <= 5; j++){
                    sum += level.get(String(j));
                }
                //console.error(i);
                assert.equal(Math.round(sum * 100) / 100, 1.0);
            }
        });
    });
})
