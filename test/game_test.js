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
const increaseExp = fileModule.__get__('increaseExp');
const sellPiece = fileModule.__get__('sellPiece');
const calcDamageTaken = fileModule.__get__('calcDamageTaken');
const removeHp = fileModule.__get__('removeHp'); 
const placePiece = fileModule.__get__('placePiece');
const checkPieceUpgrade = fileModule.__get__('checkPieceUpgrade');
const checkHandUnit = fileModule.__get__('checkHandUnit');
const discardBaseUnits = fileModule.__get__('discardBaseUnits');

describe('game state', () => {
  describe('initEmptyState', () => {
    it('initEmptyState is correct?', () => {
      let state = initEmptyState(2);
      assert.equal(state.get('round'), 1);
      assert.equal(state.get('income_basic'), 1);
      assert.equal(state.get('discarded_pieces').size, 0);
      assert.equal(state.getIn(['players', 0, 'level']), 1);
      assert.equal(state.getIn(['players', 1, 'level']), 1);
      assert.equal(state.getIn(['players', 0, 'expToReach']), 1);
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
    it('does refreshShop remove current shop?', async () => {
      let state = initEmptyState(2);
      const pieces = state.get('pieces');
      state = await refreshShop(state, 0);
      // Assertion
      const newPieces = state.get('pieces');
      const shop = state.getIn(['players', 0, 'shop']);
      assert.equal(pieces.get(0).get(0), shop.get(0));
      assert.equal(pieces.get(0).get(5), newPieces.get(0).get(0));
      state = await refreshShop(state, 0);
      const newestPieces = state.get('pieces');
      assert.equal(pieces.get(0).get(10), newestPieces.get(0).get(0));
      assert.equal(pieces.get(0).get(0), state.get('discarded_pieces').get(0));
      assert.equal(pieces.get(0).get(5), state.getIn(['players', 0, 'shop']).get(0));
      assert.equal(state.getIn(['players', 1, 'shop']).size, 0);
    });
  });
  describe('buyUnit', () => {
    /*
    * Remove unit from shop
    * Add unit to hand
    * Remove money from player
    *  Amount of money = getUnit(unitId).cost
    */
    it('buyunit default?', async () => {
      let state = initEmptyState(2);
      state = await refreshShop(state, 0);
      const shop = state.getIn(['players', 0, 'shop']);
      state = await buyUnit(state, 0, 1);
      const hand = state.getIn(['players', 0, 'hand']);
      console.log(hand)
      console.log(f.getPos(0))
      console.log(hand.get(f.getPos(0)))
      assert.equal(hand.get(f.getPos(0)).get('name'), shop.get(1));
      assert.equal(state.getIn(['players', 0, 'shop']).get(1), null);
    });
  });
  describe('increaseExp', () => {
    it('increaseExp default?', async() => {
      let state = initEmptyState(2);
      assert.equal(state.getIn(['players', 0, 'level']), 1);
      assert.equal(state.getIn(['players', 0, 'exp']), 0);
      state = await increaseExp(state, 0, 1);
      //console.log(state)
      assert.equal(state.getIn(['players', 0, 'level']), 2);
      assert.equal(state.getIn(['players', 0, 'exp']), 0);
      assert.equal(state.getIn(['players', 0, 'expToReach']), fileModule2.getExpRequired(2));
    });
  });
  describe('buyExp', () => {
    it('does buyexp increase level correctly?', async() => {
      let state = initEmptyState(2);
      state = await buyExp(state, 0);
      // Buy 5 exp from level 1, 0exp:
      // 1(^1) + 1(^2) + 2(^3) + 1(4) = Level 4, 1 exp
      assert.equal(state.getIn(['players', 0, 'level']), 4);
      assert.equal(state.getIn(['players', 0, 'exp']), 1);
      assert.equal(state.getIn(['players', 0, 'expToReach']), fileModule2.getExpRequired(4));
    });
  });
  describe('toggleLock', () => {
    it('toggleLock false -> true', async () => {
      let state = initEmptyState(2);
      state = await toggleLock(state, 0);
      assert.equal(state.getIn(['players', 0, 'locked']), true);
    });
    it('toggleLock false -> true -> false', async () => {
      let state = initEmptyState(2);
      state = await toggleLock(state, 0);
      assert.equal(state.getIn(['players', 0, 'locked']), true);
      state = await toggleLock(state, 0);
      assert.equal(state.getIn(['players', 0, 'locked']), false);
      // Assertion
    });
  });
  describe('endBattle', () => {
    /*
    * winner:
    *  Gain 1 gold
    * loser:
    *  Lose hp
    *      Calculate amount of hp to lose
    */
    it('endBattle win?', async () => {
      let state = initEmptyState(2);
      const gold = state.getIn(['players', 0, 'gold']);
      state = await endBattle(state, 0, true, 1); // index, winner, winneramount
      assert.equal(state.getIn(['players', 0, 'gold']), gold + 1);
      assert.equal(state.getIn(['players', 1, 'gold']), gold); // Not affected
    });
    it('endBattle lose?', async () => {
      let state = initEmptyState(2);
      const hp = state.getIn(['players', 0, 'hp']);
      state = await endBattle(state, 0, false, 1); // index, winner, winneramount
      // TODO Test with damage taken (Will be 0 when no enemy units)
      //assert.equal(state.getIn(['players', 0, 'hp']), hp - 1);
    });
  });
  describe('endTurn', () => {
    /*
    * Increase players exp by 1
    * Refresh shop as long as player is not locked
    * Gold:
    *  Interest for 10 gold
    *  Increasing throughout the game basic income
    *  Win streak / lose streak (TODO)
    */
    it('endTurn default?', async () => {
      let state = initEmptyState(2);
      const pieces = await state.get('pieces');
      assert.equal(state.getIn(['players', 0, 'gold']), 1);
      state = await endTurn(state);
      assert.equal(state.get('income_basic'), 2);
      assert.equal(state.get('round'), 2);
      const shop = await state.getIn(['players', 0, 'shop']);
      const shop2 = await state.getIn(['players', 1, 'shop']);
      //console.log('\@endTurn Pieces', pieces.get(0))
      //console.log('@endTurn Shop', shop)
      //console.log('@endTurn Shop2', shop2)
      assert.equal(state.getIn(['players', 0, 'exp']), 0);
      assert.equal(state.getIn(['players', 1, 'exp']), 0);
      assert.equal(state.getIn(['players', 0, 'level']), 2);
      assert.equal(state.getIn(['players', 1, 'level']), 2);
      assert.equal(shop.get(0), pieces.get(0).get(0));
      assert.equal(shop2.get(0), pieces.get(0).get(5));
      assert.equal(state.getIn(['pieces']).get(0).get(0), pieces.get(0).get(10));
      assert.equal(state.getIn(['players', 0, 'gold']), 3);
    });
    
    it('endTurn with locked player?', async () => {
      let state = initEmptyState(2);
      state = await toggleLock(state, 0);
      const pieces = state.get('pieces');
      state = await endTurn(state);
      assert.equal(state.getIn(['players', 0, 'shop']).size, 0);
      assert.equal(state.getIn(['players', 1, 'shop']).get(0), pieces.get(0).get(0));
      assert.equal(state.getIn(['pieces']).get(0).get(0), pieces.get(0).get(5));
    });
    it('endTurn higher gold?', async () => {
      let state = initEmptyState(2);
      state = state.setIn(['players', 0, 'gold'], 20);
      state = state.setIn(['players', 0, 'streak'], 3);
      state = state.set('income_basic', 2);
      state = await endTurn(state);
      // 20 start, 2 + 1(endTurn) basic, 1 streak, 2 tens
      assert.equal(state.getIn(['players', 0, 'gold']), 20+3+Math.floor(3/2)+2);
    });
    
  });
  describe('endBattle, prepEndTurn, endTurn', () => {
    it('many tests?', async () => {
      let state = initEmptyState(2);
      const hp = state.getIn(['players', 0, 'hp']);
      const pieces = state.get('pieces');
      state = await endBattle(state, 0, true, 1); // index, winner, winneramount
      state = await endBattle(state, 1, false, 1); // index, winner, winneramount
      // Assertion - endTurn should have been run
      // Player 0 won round, player 1 lost round
      assert.equal(state.get('income_basic'), 2); // inc by 1
      assert.equal(state.get('round'), 2);  // 
      const shop = await state.getIn(['players', 0, 'shop']);
      const shop2 = await state.getIn(['players', 1, 'shop']);
      //console.log('\@endTurn Pieces', pieces.get(0))
      //console.log('@endTurn Shop', shop)
      //console.log('@endTurn Shop2', shop2)
      assert.equal(state.getIn(['players', 0, 'exp']), 0);
      assert.equal(state.getIn(['players', 1, 'exp']), 0);
      assert.equal(state.getIn(['players', 0, 'level']), 2);
      assert.equal(state.getIn(['players', 1, 'level']), 2);
      assert.equal(shop.get(0), pieces.get(0).get(0));
      assert.equal(shop2.get(0), pieces.get(0).get(5));
      assert.equal(state.getIn(['pieces']).get(0).get(0), pieces.get(0).get(10));
      assert.equal(state.getIn(['players', 0, 'gold']), 4); // 1 start, 1 win, 2 basic
      assert.equal(state.getIn(['players', 1, 'gold']), 3); // 1 start 2 basic
      assert.equal(state.getIn(['players', 0, 'hp']), hp);
      // TODO Test with damage taken (Will be 0 when no enemy units)
      //assert.equal(state.getIn(['players', 1, 'hp']), hp - 1);
    });
  });
  describe('sellPiece', () => {
    // TODO Sellpiece from board
    // TODO Sell higher level piece
    it('sellPiece from hand?', async () => {
      let state = initEmptyState(2);
      state = await refreshShop(state, 0);
      state = await buyUnit(state, 0, 1);
      const hand = state.getIn(['players', 0, 'hand']);
      const gold = state.getIn(['players', 0, 'gold']);
      const unit = hand.get(f.getPos(0));
      state = await sellPiece(state, 0, Map({x: 0}));
      assert.equal(unit.get('name'), state.get('discarded_pieces').get(0));
      assert.equal(state.getIn(['players', 0, 'hand']).get(f.getPos(0)), undefined);
      assert.equal(gold, 0);
      assert.equal(state.getIn(['players', 0, 'gold']), pokemonJs.getStats(unit.get('name')).get('cost'));
    });
  });
  describe('calcDamageTaken', () => {
    it('calcDamageTaken tests?', async () => {
      // TODO     
    });
  });
  describe('removeHp', () => {
    it('removeHp tests?', async () => {
      // TODO     
    });
  });

  /**
    * Place piece
    * Swap functionality by default, if something is there already
    * Make these functions after!
    *  TODO: Withdraw piece (return)
    *      should use this aswell but should use to_position as best possible
    */
  describe('placePiece', () => {
    it('placePiece tests?', async () => {
      // TODO     
    });
  });
  /**
   * upgrades a unit of type piece if three exist
   * Sets new unit at position
   */
  describe('checkPieceUpgrade', () => {
    it('checkPieceUpgrade tests?', async () => {
      // TODO     
    });
  });
  // checkHandUnit test TODO
  // discardBaseUnits test TODO
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
