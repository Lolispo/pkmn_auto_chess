// Author: Petter Andersson
'use strict';

const assert = require('assert');
const rewire = require("rewire");
const { Map, List, fromJS, setIn } = require('immutable');
const fileModule = rewire("../src/state_logic.js");

const f = require('../src/f');

//console.log(fileModule)
//const levelPieceProbability = fileModule.__get__('getLevelPieceProbability');

describe('get_in', function(){
    describe('deep', function(){
        it('get_in finds 3 layers deep?', function(){
            const state = Map({
                first: Map({
                    second: Map({
                        meme: 'not dank'
                    })
                })
            });
            assert.equal(state.getIn(['first','second','meme']), 'not dank');
        });
    });
})

describe('set_in', function(){
    describe('deep', function(){
        it('set_in replaces correctly 3 layers in?', function(){
            let state = Map({
                first: Map({
                    second: Map({
                        meme: 'not dank'
                    })
                })
            });
            state = state.setIn(['first','second','meme'], 'dank');
            assert.equal(state.getIn(['first','second','meme']), 'dank');
        });
    });
})
