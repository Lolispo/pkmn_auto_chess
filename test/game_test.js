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
const getBoardUnit = fileModule.__get__('getBoardUnit');
const calcDamageTaken = fileModule.__get__('calcDamageTaken');
const removeHp = fileModule.__get__('removeHp'); 
const placePiece = fileModule.__get__('placePiece');
const checkPieceUpgrade = fileModule.__get__('checkPieceUpgrade');
const checkHandUnit = fileModule.__get__('checkHandUnit');
const discardBaseUnits = fileModule.__get__('discardBaseUnits');

const withdrawPiece = fileModule.__get__('withdrawPiece');


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
    it('sellPiece from hand, level 3?', async () => {
      // TODO
    });
  });
  describe('getBoardUnit', () => {
    /**
     * Input: (name, x, y) 
     * Output: Map({name: name, display_name: stats, position: f.getPos(x,y)})
     */
      it('getBoardUnit tests?', async () => {
        let board = Map({}).set(f.getPos(2,2), getBoardUnit('rattata', 2, 2));
        unitBoard = board.get(f.getPos(2,2));
        unitStats = pokemonJs.getStats('rattata');
        assert.equal(unitBoard.get('name'), 'rattata');
        assert.equal(unitBoard.get('display_name'), unitStats.get('display_name'));
        assert.equal(unitBoard.get('position').get('x'), 2);
        assert.equal(unitBoard.get('position').get('y'), 2);
      });
    });
  describe('calcDamageTaken', () => {
  /**
   * Given a list of units, calculate damage to be removed from player
   * 1 point per level of unit
   * Units level is currently their cost
   */
    it('calcDamageTaken tests?', async () => {
      let board = Map({}).set(f.getPos(2,2), getBoardUnit('rattata', 2, 2));
      const rattataLevel = pokemonJs.getStats('rattata').get('cost');
      const pikachuLevel = pokemonJs.getStats('pikachu').get('cost');
      assert.equal(calcDamageTaken(board), rattataLevel);
      board = board.set(f.getPos(4,4), getBoardUnit('pikachu', 4, 4));
      assert.equal(calcDamageTaken(board), +rattataLevel + +pikachuLevel);
    });
  });
  
  /**  
    * Remove hp from player
    * Mark player as defeated if hp <= 0, by removal of player from players
    * Also decrease amountOfPlayers
    */
  describe('removeHp', () => {
    it('removeHp default?', async () => {
      // TODO
    });
    it('removeHp player defeated (not game over)?', async () => {
      // TODO
    });
    it('removeHp player defeated gameOver?', async () => {
      // TODO
    });
  });

  /**
    * Place piece
    * Swap functionality by default, if something is there already
    */
  describe('placePiece', () => {
    it('placePiece on board to board?', async () => {
      let state = initEmptyState(2);
      state = await refreshShop(state, 0);
      const unit = state.getIn(['players', 0, 'shop']).get(1);
      state = await buyUnit(state, 0, 1);
      state = await placePiece(state, 0, f.getPos(0), f.getPos(1,1));
      state = await placePiece(state, 0, f.getPos(1,1), f.getPos(4,4));
      const board = state.getIn(['players', 0, 'board'])
      assert.equal(board.get(f.getPos(4,4)).get('name'), unit);
      assert.equal(board.get(f.getPos(1,1)), undefined);
    });
    it('placePiece on board to hand?', async () => {
      let state = initEmptyState(2);
      state = await refreshShop(state, 0);
      const unit = state.getIn(['players', 0, 'shop']).get(1);
      state = await buyUnit(state, 0, 1);
      state = await placePiece(state, 0, f.getPos(0), f.getPos(1,1));
      state = await placePiece(state, 0, f.getPos(1,1), f.getPos(4));
      const hand = state.getIn(['players', 0, 'hand'])
      assert.equal(hand.get(f.getPos(4)).get('name'), unit);
      assert.equal(hand.get(f.getPos(1,1)), undefined);   
    });
    it('placePiece on hand to board?', async () => {
      let state = initEmptyState(2);
      state = await refreshShop(state, 0);
      const unit = state.getIn(['players', 0, 'shop']).get(1);
      state = await buyUnit(state, 0, 1);
      state = await placePiece(state, 0, f.getPos(0), f.getPos(1,1));
      const board = state.getIn(['players', 0, 'board'])
      assert.equal(board.get(f.getPos(1,1)).get('name'), unit);
   });
    it('placePiece swap functionality on board->board?', async () => {
      let state = initEmptyState(2);
      state = await refreshShop(state, 0);
      const unit = state.getIn(['players', 0, 'shop']).get(1);
      const unit2 = state.getIn(['players', 0, 'shop']).get(2);
      state = await buyUnit(state, 0, 1);
      state = await buyUnit(state, 0, 2);
      state = await placePiece(state, 0, f.getPos(0), f.getPos(1,1));
      state = await placePiece(state, 0, f.getPos(1), f.getPos(5,3));
      state = await placePiece(state, 0, f.getPos(1,1), f.getPos(5,3));
      const board = state.getIn(['players', 0, 'board'])
      assert.equal(board.get(f.getPos(1,1)).get('name'), unit2);
      assert.equal(board.get(f.getPos(5,3)).get('name'), unit);   
    });
  });
  /**
    * Checks all units on board for player of that piece type
    * if 3 units are found, remove those 3 units and replace @ position with evolution
    * No units are added to discarded_pieces
    * stateParam, playerIndex, piece, position
    */
  describe('checkPieceUpgrade', () => {
    it('checkPieceUpgrade 3 level 1 units?', async () => {
      let state = initEmptyState(2);
      const unit = getBoardUnit('pikachu', 2, 2)
      const newBoard = Map({})
      .set(f.getPos(1,1), getBoardUnit('pikachu', 1, 1))
      .set(f.getPos(1,2), getBoardUnit('pikachu', 1, 2))
      .set(f.getPos(2,2), unit);
      state = state.setIn(['players', 0, 'board'], newBoard);
      state = await checkPieceUpgrade(state, 0, unit, f.getPos(2,2));
      const board = state.getIn(['players', 0, 'board'])
      assert.equal(board.get(f.getPos(2,2)).get('name'), 'pikachu2');
      assert.equal(board.get(f.getPos(1,2)), undefined);
      assert.equal(board.get(f.getPos(1,1)), undefined);
    });
    it('checkPieceUpgrade 3 level 2 units?', async () => {
      // TODO     
    });
  });
  describe('checkHandUnit', () => {
    /**
     * Given a position, returns if it is on hand or board
     */
    it('checkHandUnit hand unit?', async () => {
      // TODO     
    });
    it('checkHandUnit board unit?', async () => {
      // TODO     
    });
  });
  describe('discardBaseUnits', () => {
    /**
     * When units are sold, when level 1, a level 1 unit should be added to discarded_pieces
     * Level 2 => 3 level 1 units, Level 3 => 9 level 1 units
     */
    it('discardBaseUnits level 1 unit test?', async () => {
      // TODO     
    });
    it('discardBaseUnits level 2 test?', async () => {
      // TODO     
    });
    it('discardBaseUnits level 3 test?', async () => {
      // TODO     
    });
  });
  describe('getPieceFromRarity', () => {
    /**
     * Finds correct rarity for piece (random value)
     * Returns the piece taken from pieceStorage from correct rarity list
     * i is used to know which rarity it is checking (from 1 to 5)
     * 
     * getPieceFromRarity(prob, i, pieceStorage)
     */
    it('getPieceFromRarity', async () => {
      // TODO     
    });
  });
  describe('getBoardUnit', () => {
    /**
     * Create unit for board/hand placement from name and spawn position
     */
    it('getBoardUnit board unit', async () => {
      const unit = getBoardUnit('pikachu', 0, 1);
      assert.equal(unit.get('name'), 'pikachu');
      assert.equal(unit.get('position').get('x'), 0);
      assert.equal(unit.get('position').get('y'), 1);
    });
  });
  describe('Gameover', () => {
    /**
     * Marks the only remaining player as the winner
     */
    it('Gameover', async () => {
      // TODO     
    });
  });
  describe('withdrawPiece', () => {
    /**
     * WithdrawPiece from board to best spot on bench
     * Assumes not bench is full
     */
    it('withdrawPiece from board, empty bench', async () => {
      let state = initEmptyState(2);
      state = await refreshShop(state, 0);
      const unit = state.getIn(['players', 0, 'shop']).get(1);
      state = await buyUnit(state, 0, 1);
      state = await placePiece(state, 0, f.getPos(0), f.getPos(1,1));
      state = await withdrawPiece(state, 0, f.getPos(1,1))
      const board = state.getIn(['players', 0, 'board'])
      const hand = state.getIn(['players', 0, 'hand'])
      assert.equal(board.get(f.getPos(1,1)), undefined);
      assert.equal(hand.get(f.getPos(0)).get('name'), unit);   
    });
    it('withdrawPiece from board, hand 2 units', async () => {
      let state = initEmptyState(2);
      state = await refreshShop(state, 0);
      const unit = state.getIn(['players', 0, 'shop']).get(1);
      const unit2 = state.getIn(['players', 0, 'shop']).get(2);
      const unit3 = state.getIn(['players', 0, 'shop']).get(3);
      state = await buyUnit(state, 0, 1);
      state = await buyUnit(state, 0, 2);
      state = await buyUnit(state, 0, 3);
      state = await placePiece(state, 0, f.getPos(0), f.getPos(1,1));
      state = await withdrawPiece(state, 0, f.getPos(1,1))
      const board = state.getIn(['players', 0, 'board'])
      const hand = state.getIn(['players', 0, 'hand'])
      assert.equal(board.get(f.getPos(1,1)), undefined);
      assert.equal(hand.get(f.getPos(0)).get('name'), unit); 
      assert.equal(hand.get(f.getPos(1)).get('name'), unit2); 
      assert.equal(hand.get(f.getPos(2)).get('name'), unit3); 
    });
    it('withdrawPiece from board, hand has unit at 1 and 3 (should put 2)', async () => {
      let state = initEmptyState(2);
      state = await refreshShop(state, 0);
      const unit = state.getIn(['players', 0, 'shop']).get(1);
      const unit2 = state.getIn(['players', 0, 'shop']).get(2);
      const unit3 = state.getIn(['players', 0, 'shop']).get(3);
      state = await buyUnit(state, 0, 1);
      state = await buyUnit(state, 0, 2);
      state = await buyUnit(state, 0, 3);
      state = await placePiece(state, 0, f.getPos(1), f.getPos(1,1));
      state = await withdrawPiece(state, 0, f.getPos(1,1))
      const board = state.getIn(['players', 0, 'board'])
      const hand = state.getIn(['players', 0, 'hand'])
      assert.equal(board.get(f.getPos(1,1)), undefined);
      assert.equal(hand.get(f.getPos(0)).get('name'), unit); 
      assert.equal(hand.get(f.getPos(1)).get('name'), unit2); 
      assert.equal(hand.get(f.getPos(2)).get('name'), unit3);   
    });
    it('withdrawPiece from board, change hand spot 2 and 3', async () => {
      let state = initEmptyState(2);
      state = await refreshShop(state, 0);
      const unit = state.getIn(['players', 0, 'shop']).get(1);
      const unit2 = state.getIn(['players', 0, 'shop']).get(2);
      const unit3 = state.getIn(['players', 0, 'shop']).get(3);
      state = await buyUnit(state, 0, 1);
      state = await buyUnit(state, 0, 2);
      state = await buyUnit(state, 0, 3);
      state = await placePiece(state, 0, f.getPos(1), f.getPos(1,1));
      state = await placePiece(state, 0, f.getPos(2), f.getPos(2,2));
      state = await withdrawPiece(state, 0, f.getPos(2,2))
      state = await withdrawPiece(state, 0, f.getPos(1,1))
      const board = state.getIn(['players', 0, 'board'])
      const hand = state.getIn(['players', 0, 'hand'])
      assert.equal(board.get(f.getPos(1,1)), undefined);
      assert.equal(hand.get(f.getPos(0)).get('name'), unit); 
      assert.equal(hand.get(f.getPos(1)).get('name'), unit3); 
      assert.equal(hand.get(f.getPos(2)).get('name'), unit2);   
    });
  });
  describe('getClosestEnemy', () => {
    /**
     * return enemy pos within range or undefined
     * (board, unitPos, range, team)
     */
    it('getClosestEnemy range 1 with 1 valid target', async () => {
      // TODO     
    });
    it('getClosestEnemy range 1 with 2 valid targets (bot, left)', async () => {
      // TODO Should be bot unit
    });
    it('getClosestEnemy range 1 no targets', async () => {
      // TODO     
    });
    it('getClosestEnemy range 1 target outside range', async () => {
      // TODO     
    });
    it('getClosestEnemy range 2 with 1 valid target 2 from top', async () => {
      // TODO     
    });
  });
  describe('removeHpBattle', () => {
    /**
     * Remove hp from unit
     * Remove unit if hp <= 0
     * Return: ({board, unitDied})
     * (board, unitPos, hpToRemove) 
     */
    it('removeHpBattle default lose hp', async () => {
      // TODO     
    });
    it('removeHpBattle unit dies', async () => {
      // TODO     
    });
  });
  describe('manaIncrease', () => {
    /**
     * Increases mana for both units on board
     * Returns updated board
     * (board, unitPos, enemyPos)
     */
    it('manaIncrease default both units', async () => {
      // TODO     
    });
  });
  describe('nextMove', () => {
      /**
       * Next move calculator
       * If mana is full use spell
       *  TODO: Spells logic
       *  TODO: Conditions for spells
       * Unit checks if it can attack an enemy, is within unit.range
       * If it can, attack on closests target position
       *  If enemy unit dies, check battle over
       *  if attack is made, increase mana for both units
       * If not, make a move to closets enemy unit
       * (board, unitPos)
       * Return: Map({nextMove: Map({action: action, value: value, target: target}), newBoard: newBoard, battleOver: true})
       */
    it('nextMove board 2 units, both full hp, in range, move: attack', async () => {
      // TODO     
    });
    it('nextMove board 3 units, select correct unit, in range, move: attack', async () => {
      // TODO     
    });
    it('nextMove board 2 units, not within range, move: move closer', async () => {
      // TODO     
    });
    it('nextMove board 2 units, low hp on enemy, in range, move: attack, unitDies, battleOver', async () => {
      // TODO     
    });
    it('nextMove Spells test, 100 mana, use spell', async () => {
      // TODO     
    });
  });
  describe('getUnitWithNextMove', () => {
    /**
     * Returns position of unit with the next move
     */
    it('getUnitWithNextMove 1 unit, get pos', async () => {
      // TODO     
    });
    it('getUnitWithNextMove 3 units, different next_move, get lowest', async () => {
      // TODO     
    });
    it('getUnitWithNextMove 3 units, 2 same, 1 different next_move, get either of lowest', async () => {
      // TODO     
    });
  });
  describe('reverseUnitPos', () => {
    /**
     * Reverses position, your units position on enemy boards
     */
    it('reverseUnitPos 1x1 -> 6x6', async () => {
      // TODO     
    });
    it('reverseUnitPos 5x0 -> 2x7', async () => {
      // TODO     
    });
  });
  describe('startBattle', () => {
    /**
     * Battle:
     * Grab next unit to move
     * simulate next move for that unit and calculate new board
     * add that move to actionStack
     * Continue until battle over
     */
    it('startBattle 2 units fight til death, one starts 10 before', async () => {
      // TODO     
    });
    it('startBattle 2 units fight til death, one higher level, start same number', async () => {
      // TODO     
    });
    it('startBattle 2 units outside of range, one starts 10 before', async () => {
      // TODO     
    });
    it('startBattle 2 units fight til death, one starts 10 before', async () => {
      // TODO     
    });
  });
  describe('getMovePos', () => {
    /**
     * Get first available spot at max range away from closest enemy
     * spot that is at maximal possible range from enemy, otherwise closer
     * Different favorable positions for S and N team, prioritize your side movement
     * (Assasins functionality can use enemyTeam as input)
     * 
     * (board, closestEnemyPos, range, team)
     *  TODO
     */
    it('getMovePos default both units', async () => {
      // TODO     
    });
  });
  describe('setRandomFirstMove', () => {
    /**
     * Board with first_move: pos set for all units
     */
    it('setRandomFirstMove(board) default', async () => {
      // TODO     
    });
  });
  describe('prepareBattle', () => {
    /**
     * Spawn opponent in reverse board
     * Mark owners of units
     * Start battle
     * pairing: {
     *  homeID: 1,
     *  enemyID: 0
     * }
     * Gets finished battle, similar to battleTime in that sense, middleMan
     * (stateParam, pairing) 
     */
    it('prepareBattle', async () => {
      // TODO     
    });
  });
  describe('battleTime', () => {
     /**
       * Randomize Opponents for state
       * * Assumes board contains every player's updated board
       * stateParam
       */
    it('battleTime TODO big time', async () => {
      let state = initEmptyState(2);
      state = await refreshShop(state, 0);
      state = await buyUnit(state, 0, 1);
      state = await buyUnit(state, 1, 1);
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
  describe('getPieceProbabilityNum', () => {
    it('getPieceProbabilityNum correct?', () => {
      // TODO
    });
  });
});
