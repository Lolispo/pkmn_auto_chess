// Author: Petter Andersson
'use strict';

const { Map, List, fromJS } = require('immutable');

const pokemon_js = require('./pokemon');
const deck_js = require('./deck');
const f = require('./f');
const player_js = require('./player');
const state_logic_js = require('./state_logic');


//const rarity = List([45, 30, 25, 15, 10]);    // Real version
const rarity = List([3, 3, 3, 3, 3]);      // Test version
const levelPieceProbability = Map({
    1:  Map({ 1: 1.00, 2: 0.00, 3: 0.00, 4: 0.0, 5: 0.00 }),
    2:  Map({ 1: 0.70, 2: 0.30, 3: 0.00, 4: 0.0, 5: 0.0 }),
    3:  Map({ 1: 0.60, 2: 0.35, 3: 0.05, 4: 0.0, 5: 0.0 }),
    4:  Map({ 1: 0.50, 2: 0.35, 3: 0.15, 4: 0.0, 5: 0.0 }),
    5:  Map({ 1: 0.40, 2: 0.35, 3: 0.23, 4: 0.02, 5: 0.0 }),
    6:  Map({ 1: 0.33, 2: 0.30, 3: 0.30, 4: 0.07, 5: 0.0 }),
    7:  Map({ 1: 0.30, 2: 0.30, 3: 0.30, 4: 0.10, 5: 0.0 }),
    8:  Map({ 1: 0.24, 2: 0.30, 3: 0.30, 4: 0.15, 5: 0.01 }),
    9:  Map({ 1: 0.22, 2: 0.30, 3: 0.35, 4: 0.20, 5: 0.03 }),
    10: Map({ 1: 0.19, 2: 0.25, 3: 0.25, 4: 0.25, 5: 0.06 }),
});

exports.getLevelPieceProbability = function(){
    return levelPieceProbability;
}

function buildPieceStorage(){
    let availablePieces = List([List([]),List([]),List([]),List([]),List([])]);
    let decks = deck_js.getDecks();
    for(let i = 0; i < decks.size; i++){
        for(let j = 0; j < decks.get(i).size; j++){
            let pokemon = decks.get(i).get(j);
            if(pokemon.get('evolves_from') == undefined){ // Only add base level
                console.log('Adding',rarity.get(pokemon.get('cost')),pokemon.get('name'),'to',pokemon.get('cost'));
                for(let l = 0; l < rarity.get(pokemon.get('cost') - 1); l++){
                    availablePieces = state_logic_js.push(availablePieces, i, pokemon.get('name'));
                }
            }
        }
        availablePieces = state_logic_js.shuffle(availablePieces, i); 
    }
    return availablePieces;
}

function init(){
    const pieceStorage = buildPieceStorage();
    const state = Map({
        pieces: pieceStorage,
        discarded_pieces: List([])
    });
    return state;
}

function getFive(state, playerIndex){
    const level = state.get('players').get(playerIndex).get('level');
    const prob = levelPieceProbability.get(String(level));
    const random = Math.random();
    let probSum = 0.0;
    let fivePieces = List([]);
    let pieceStorage = state.get('pieces');
    for(let i = 0; i < 5; i++){
        if(probSum += prob.get('1') > random){
            let piece = pieceStorage.get(0).get(0);
            fivePieces = fivePieces.push(piece);
            pieceStorage = state_logic_js.removeFirst(pieceStorage, 0);
        } else if(probSum += prob.get('2') > random){
            let piece = pieceStorage.get(1).get(0);
            fivePieces = fivePieces.push(piece);
            pieceStorage = state_logic_js.removeFirst(pieceStorage, 1);
        } else if(probSum += prob.get('3') > random){
            let piece = pieceStorage.get(2).get(0);
            fivePieces = fivePieces.push(piece);
            pieceStorage = state_logic_js.removeFirst(pieceStorage, 2);
        } else if(probSum += prob.get('4') > random){
            let piece = pieceStorage.get(3).get(0);
            fivePieces = fivePieces.push(piece);
            pieceStorage = state_logic_js.removeFirst(pieceStorage, 3);
        } else if(probSum += prob.get('5') > random){
            let piece = pieceStorage.get(0).get(4);
            fivePieces = fivePieces.push(piece);
            pieceStorage = state_logic_js.removeFirst(pieceStorage, 4);
        }
    }
    state = state_logic_js.updateShop(state, playerIndex, fivePieces, pieceStorage);
    return state;
}

/**
 * *Assumed hand not full here
 * *Assumed can afford
 * Remove unit from shop
 * Add unit to hand
 * Remove money from player
 *  Amount of money = getUnit(unitId).cost
 */
function buyUnit(state, playerIndex, unitID){
    let shop = state.getIn(['players', playerIndex, 'shop']);
    const unit = shop.get(unitID);
    shop = shop.splice(unitID, 1, null); 
    state = state.setIn(['players', playerIndex,'shop'], shop);
    const hand = state.getIn(['players', playerIndex, 'hand']).push(unit); 
    state = state.setIn(['players', playerIndex,'hand'], hand);
    const currentGold = state.getIn(['players', playerIndex,'gold']);
    console.log(unit)
    const cost = pokemon_js.getStats(unit).get('cost');
    return state.setIn(['players', playerIndex,'gold'], currentGold - cost);
}

exports.start = function(){
    let state = init();
    //f.print(state, '1: ');
    state = player_js.initPlayers(state, 2);
    //f.print(state, '2: ');
    state = getFive(state, 0);
    f.print(state, '3: ');
    /*
    state = getFive(state, 0);
    f.print(state, '4: ');
    state = getFive(state, 0);
    f.print(state, '5: ');
    */
    state = buyUnit(state, 0, 1);
    f.print(state, '** Bought a Unit at index 1: ');
}

//console.log(f.getRandomInt(5));
//console.log(pokemon_js.getMap().get('Pikachu'.toLowerCase()));