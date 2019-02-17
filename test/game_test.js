// Author: Petter Andersson


const assert = require('assert');
const rewire = require('rewire');
const { Map, List, fromJS } = require('immutable');

const fileModule = rewire('../src/game.js');
const fileModule2 = rewire('../src/game_constants.js');
const pokemonJS = rewire('../src/pokemon.js');

const f = require('../src/f');

const initEmptyState = fileModule.__get__('initEmptyState');
const refreshShop = fileModule.__get__('refreshShop');
const buyUnit = fileModule.buyUnit;
const buyExp = fileModule.__get__('buyExp');
const toggleLock = fileModule.toggleLock;
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
const battleTime = fileModule.__get__('battleTime');
const withdrawPiece = fileModule.__get__('withdrawPiece');
const markBoardBonuses = fileModule.__get__('markBoardBonuses');
const createBattleUnit = fileModule.__get__('createBattleUnit');
const startGame = fileModule.__get__('startGame');
const battleSetup = fileModule.__get__('battleSetup');





describe('game state', () => {
  describe('initEmptyState', () => {
    it('initEmptyState is correct?', async () => {
      let state = await initEmptyState(2);
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
    it('buildPieceStorage is correct?', async () => {
      let pieces = await buildPieceStorage();
      /*
      // Enable test when all rarities exist
      let sum = 0;
      for(let i = 0; i < 5; i++){
        sum += fileModule2.getRarityAmount(i);
      }
      assert.equal(pieces.size, sum);
      */
      const stats = await pokemonJS.getStats(pieces.get(0).get(0));
      const stats2 = await pokemonJS.getStats(pieces.get(2).get(0))
      assert.equal(stats.get('cost'), 1);
      assert.equal(stats2.get('cost'), 3);
    });
  });
  describe('refreshShop', () => {
    it('does refreshShop remove current shop?', async () => {
      let state = await initEmptyState(2);
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
      let state = await initEmptyState(2);
      state = await startGame(state);
      const shop = state.getIn(['players', 0, 'shop']);
      state = await buyUnit(state, 0, 1);
      const hand = state.getIn(['players', 0, 'hand']);
      console.log(hand)
      console.log(hand.get(f.pos(0)))
      assert.equal(hand.get(f.pos(0)).get('name'), shop.get(1));
      assert.equal(state.getIn(['players', 0, 'shop']).get(1), null);
    });
  });
  describe('increaseExp', () => {
    it('increaseExp default?', async() => {
      let state = await initEmptyState(2);
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
      let state = await initEmptyState(2);
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
      let state = await initEmptyState(2);
      state = await toggleLock(state, 0);
      assert.equal(state.getIn(['players', 0, 'locked']), true);
    });
    it('toggleLock false -> true -> false', async () => {
      let state = await initEmptyState(2);
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
      let state = await initEmptyState(2);
      const gold = state.getIn(['players', 0, 'gold']);
      const unit = await createBattleUnit((await getBoardUnit('rattata', 2, 2)), f.pos(2,2), 0);
      state = await endBattle(state, 0, true, Map({}).set(f.pos(2,2), unit), true, 1); 
      assert.equal(state.getIn(['players', 0, 'gold']), gold + 1);
      assert.equal(state.getIn(['players', 1, 'gold']), gold); // Not affected
    });
    it('endBattle lose?', async () => {
      let state = await initEmptyState(2);
      const hp = state.getIn(['players', 0, 'hp']);
      const unit = await createBattleUnit((await getBoardUnit('rattata', 2, 2)), f.pos(2,2), 1);
      state = await endBattle(state, 0, false, Map({}).set(f.pos(2,2), unit), true, 1);
      // TODO Test with damage taken (Will be 0 when no enemy units)
      assert.equal(state.getIn(['players', 0, 'hp']), hp - (await pokemonJS.getStats(unit.get('name'))).get('cost'));
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
      let state = await initEmptyState(2);
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
      let state = await initEmptyState(2);
      state = await toggleLock(state, 0);
      const pieces = state.get('pieces');
      state = await endTurn(state);
      assert.equal(state.getIn(['players', 0, 'shop']).size, 0);
      assert.equal(state.getIn(['players', 1, 'shop']).get(0), pieces.get(0).get(0));
      assert.equal(state.getIn(['pieces']).get(0).get(0), pieces.get(0).get(5));
    });
    it('endTurn higher gold?', async () => {
      let state = await initEmptyState(2);
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
      let state = await initEmptyState(2);
      const hp = state.getIn(['players', 0, 'hp']); // Both have same start hp
      const pieces = state.get('pieces');
      const unit = await createBattleUnit((await getBoardUnit('squirtle', 2, 2)), f.pos(2,2), 0);
      state = await endBattle(state, 0, true, Map({}).set(f.pos(2,2), unit), true, 1);
      state = await endBattle(state, 1, false, Map({}).set(f.pos(2,2), unit), true, 0);
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
      assert.equal(state.getIn(['players', 1, 'hp']), hp - (await pokemonJS.getStats(unit.get('name'))).get('cost'));
    });
  });
  describe('sellPiece', () => {
    // TODO Sellpiece from board
    // TODO Sell higher level piece
    it('sellPiece from hand?', async () => {
      let state = await initEmptyState(2);
      state = await startGame(state);
      state = await buyUnit(state, 0, 1);
      const hand = state.getIn(['players', 0, 'hand']);
      const gold = state.getIn(['players', 0, 'gold']);
      const unit = hand.get(f.pos(0));
      state = await sellPiece(state, 0, Map({x: 0}));
      assert.equal(unit.get('name'), state.get('discarded_pieces').get(0));
      assert.equal(state.getIn(['players', 0, 'hand']).get(f.pos(0)), undefined);
      assert.equal(gold, 0);
      const stats = await pokemonJS.getStats(unit.get('name'));
      assert.equal(state.getIn(['players', 0, 'gold']), stats.get('cost'));
    });
    it('sellPiece from hand, level 3?', async () => {
      // TODO
    });
  });
  describe('getBoardUnit', () => {
    /**
     * Input: (name, x, y) 
     * Output: Map({name: name, display_name: stats, position: f.pos(x,y)})
     */
      it('getBoardUnit tests?', async () => {
        const unit = await getBoardUnit('rattata', 2, 2);
        let board = Map({}).set(f.pos(2,2), unit);
        unitBoard = board.get(f.pos(2,2));
        unitStats = await pokemonJS.getStats('rattata');
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
      const unit = await getBoardUnit('rattata', 2, 2);
      let board = Map({}).set(f.pos(2,2), unit);
      const rStats = await pokemonJS.getStats('rattata');
      const pStats = await pokemonJS.getStats('pikachu');
      const rattataLevel = rStats.get('cost');
      const pikachuLevel = pStats.get('cost');
      const valueDamageTaken = await calcDamageTaken(board);
      assert.equal(valueDamageTaken, rattataLevel);
      board = board.set(f.pos(4,4), await getBoardUnit('pikachu', 4, 4));
      assert.equal(await calcDamageTaken(board), +rattataLevel + +pikachuLevel);
    });
  });
  
  /**  
    * Remove hp from player
    * Mark player as defeated if hp <= 0, by removal of player from players
    * Also decrease amountOfPlayers
    */
  describe('removeHp', () => {
    it('removeHp default?', async () => {
      let state = await initEmptyState(2);
      state = await removeHp(state, 0, 5);
      assert.equal(state.getIn(['players', 0, 'hp']), 95);
    });
    it('removeHp player defeated (not game over)?', async () => {
      let state = await initEmptyState(3);
      state = state.setIn(['players', 0, 'hp'], 5);
      state = await removeHp(state, 0, 5);
      assert.equal(state.getIn(['players', 0]), undefined);
      assert.equal(state.get('amountOfPlayers'), 2);
    });
    it('removeHp player defeated gameOver?', async () => {
      // TODO
      let state = await initEmptyState(2);
      state = state.setIn(['players', 0, 'hp'], 5);
      state = await removeHp(state, 0, 5);
      assert.equal(state.getIn(['players', 0]), undefined);
      assert.equal(state.get('amountOfPlayers'), 1);
    });
  });

  /**
    * Place piece
    * Swap functionality by default, if something is there already
    */
  describe('placePiece', () => {
    it('placePiece on board to board?', async () => {
      let state = await initEmptyState(2);      
      state = await startGame(state);
      const unit = state.getIn(['players', 0, 'shop']).get(1);
      state = await buyUnit(state, 0, 1);
      state = await placePiece(state, 0, f.pos(0), f.pos(1,1));
      state = await placePiece(state, 0, f.pos(1,1), f.pos(4,4));
      const board = state.getIn(['players', 0, 'board'])
      assert.equal(board.get(f.pos(4,4)).get('name'), unit);
      assert.equal(board.get(f.pos(4,4)).get('position').get('x'), 4);
      assert.equal(board.get(f.pos(4,4)).get('position').get('y'), 4);
      assert.equal(board.get(f.pos(1,1)), undefined);
    });
    it('placePiece on board to hand?', async () => {
      let state = await initEmptyState(2);
      state = await startGame(state);
      const unit = state.getIn(['players', 0, 'shop']).get(1);
      state = await buyUnit(state, 0, 1);
      state = await placePiece(state, 0, f.pos(0), f.pos(1,1));
      state = await placePiece(state, 0, f.pos(1,1), f.pos(4));
      const hand = state.getIn(['players', 0, 'hand'])
      assert.equal(hand.get(f.pos(4)).get('name'), unit);
      assert.equal(hand.get(f.pos(1,1)), undefined);   
    });
    it('placePiece on hand to board?', async () => {
      let state = await initEmptyState(2);
      state = await startGame(state);
      const unit = state.getIn(['players', 0, 'shop']).get(1);
      state = await buyUnit(state, 0, 1);
      state = await placePiece(state, 0, f.pos(0), f.pos(1,1));
      const board = state.getIn(['players', 0, 'board'])
      assert.equal(board.get(f.pos(1,1)).get('name'), unit);
   });
    it('placePiece swap functionality on board->board?', async () => {
      let state = await initEmptyState(2);
      state = await startGame(state);
      const unit = state.getIn(['players', 0, 'shop']).get(1);
      const unit2 = state.getIn(['players', 0, 'shop']).get(2);
      state = await buyUnit(state, 0, 1);
      state = await buyUnit(state, 0, 2);
      state = await placePiece(state, 0, f.pos(0), f.pos(1,1));
      state = await placePiece(state, 0, f.pos(1), f.pos(5,3));
      state = await placePiece(state, 0, f.pos(1,1), f.pos(5,3));
      const board = state.getIn(['players', 0, 'board'])
      assert.equal(board.get(f.pos(1,1)).get('name'), unit2);
      assert.equal(board.get(f.pos(5,3)).get('name'), unit);   
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
      let state = await initEmptyState(2);
      const unit = await getBoardUnit('charmander', 2, 2)
      const newBoard = Map({})
      .set(f.pos(1,1), await getBoardUnit('charmander', 1, 1))
      .set(f.pos(1,2), await getBoardUnit('charmander', 1, 2))
      .set(f.pos(2,2), unit);
      state = state.setIn(['players', 0, 'board'], newBoard);
      state = await checkPieceUpgrade(state, 0, unit, f.pos(2,2));
      const board = state.getIn(['players', 0, 'board'])
      assert.equal(board.get(f.pos(2,2)).get('name'), 'charmeleon');
      assert.equal(board.get(f.pos(1,2)), undefined);
      assert.equal(board.get(f.pos(1,1)), undefined);
    });
    it('checkPieceUpgrade 3 level 2 units?', async () => {
      let state = await initEmptyState(2);
      const unit = await getBoardUnit('charmeleon', 2, 2)
      const newBoard = Map({})
      .set(f.pos(1,1), await getBoardUnit('charmeleon', 1, 1))
      .set(f.pos(1,2), await getBoardUnit('charmeleon', 1, 2))
      .set(f.pos(1,3), await getBoardUnit('pikachu', 1, 3))
      .set(f.pos(1,4), await getBoardUnit('pikachu', 1, 4))
      .set(f.pos(2,2), unit);
      state = state.setIn(['players', 0, 'board'], newBoard);
      state = await checkPieceUpgrade(state, 0, unit, f.pos(2,2));
      const board = state.getIn(['players', 0, 'board'])
      assert.equal(board.get(f.pos(2,2)).get('name'), 'charizard');
      assert.equal(board.get(f.pos(1,2)), undefined);
      assert.equal(board.get(f.pos(1,1)), undefined); 
      assert.equal(board.get(f.pos(1,3)).get('name'), 'pikachu'); 
      assert.equal(board.get(f.pos(1,4)).get('name'), 'pikachu'); 
    });
  });
  describe('checkHandUnit', () => {
    /**
     * Given a position, returns if it is on hand or board
     */
    it('checkHandUnit hand unit?', async () => {
      assert.equal(checkHandUnit(f.pos(2)), true);
    });
    it('checkHandUnit board unit?', async () => {
      assert.equal(checkHandUnit(f.pos(2,2)), false);
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
      const unit = await getBoardUnit('pikachu', 0, 1);
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
      let state = await initEmptyState(2);
      state = await startGame(state);
      const unit = state.getIn(['players', 0, 'shop']).get(1);
      state = await buyUnit(state, 0, 1);
      state = await placePiece(state, 0, f.pos(0), f.pos(1,1));
      state = await withdrawPiece(state, 0, f.pos(1,1))
      const board = state.getIn(['players', 0, 'board'])
      const hand = state.getIn(['players', 0, 'hand'])
      assert.equal(board.get(f.pos(1,1)), undefined);
      assert.equal(hand.get(f.pos(0)).get('name'), unit);   
    });
    it('withdrawPiece from board, hand 2 units', async () => {
      let state = await initEmptyState(2);
      state = await startGame(state);
      const unit = state.getIn(['players', 0, 'shop']).get(1);
      const unit2 = state.getIn(['players', 0, 'shop']).get(2);
      const unit3 = state.getIn(['players', 0, 'shop']).get(3);
      state = await buyUnit(state, 0, 1);
      state = await buyUnit(state, 0, 2);
      state = await buyUnit(state, 0, 3);
      state = await placePiece(state, 0, f.pos(0), f.pos(1,1));
      state = await withdrawPiece(state, 0, f.pos(1,1))
      const board = state.getIn(['players', 0, 'board'])
      const hand = state.getIn(['players', 0, 'hand'])
      assert.equal(board.get(f.pos(1,1)), undefined);
      assert.equal(hand.get(f.pos(0)).get('name'), unit); 
      assert.equal(hand.get(f.pos(1)).get('name'), unit2); 
      assert.equal(hand.get(f.pos(2)).get('name'), unit3); 
    });
    it('withdrawPiece from board, hand has unit at 1 and 3 (should put 2)', async () => {
      let state = await initEmptyState(2);
      state = await startGame(state);
      const unit = state.getIn(['players', 0, 'shop']).get(1);
      const unit2 = state.getIn(['players', 0, 'shop']).get(2);
      const unit3 = state.getIn(['players', 0, 'shop']).get(3);
      state = await buyUnit(state, 0, 1);
      state = await buyUnit(state, 0, 2);
      state = await buyUnit(state, 0, 3);
      state = await placePiece(state, 0, f.pos(1), f.pos(1,1));
      state = await withdrawPiece(state, 0, f.pos(1,1))
      const board = state.getIn(['players', 0, 'board'])
      const hand = state.getIn(['players', 0, 'hand'])
      assert.equal(board.get(f.pos(1,1)), undefined);
      assert.equal(hand.get(f.pos(0)).get('name'), unit); 
      assert.equal(hand.get(f.pos(1)).get('name'), unit2); 
      assert.equal(hand.get(f.pos(2)).get('name'), unit3);   
    });
    it('withdrawPiece from board, change hand spot 2 and 3', async () => {
      let state = await initEmptyState(2);
      state = await startGame(state);
      const unit = state.getIn(['players', 0, 'shop']).get(1);
      const unit2 = state.getIn(['players', 0, 'shop']).get(2);
      const unit3 = state.getIn(['players', 0, 'shop']).get(3);
      state = await buyUnit(state, 0, 1);
      state = await buyUnit(state, 0, 2);
      state = await buyUnit(state, 0, 3);
      state = await placePiece(state, 0, f.pos(1), f.pos(1,1));
      state = await placePiece(state, 0, f.pos(2), f.pos(2,2));
      state = await withdrawPiece(state, 0, f.pos(2,2))
      state = await withdrawPiece(state, 0, f.pos(1,1))
      const board = state.getIn(['players', 0, 'board'])
      const hand = state.getIn(['players', 0, 'hand'])
      assert.equal(board.get(f.pos(1,1)), undefined);
      assert.equal(hand.get(f.pos(0)).get('name'), unit); 
      assert.equal(hand.get(f.pos(1)).get('name'), unit3); 
      assert.equal(hand.get(f.pos(2)).get('name'), unit2);   
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
     * (board, unitPos, hpToRemove, percentage) 
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
  describe('markBoardBonuses', () => {
    /**
     * Give bonuses from types
     * Type bonus is either only for those of that type or all units
     */
    it('markBoardBonuses 3 normal types', async () => {
      const unit = await createBattleUnit((await getBoardUnit('rattata', 1, 1)), f.pos(1,1), 0);
      const unit2 = await createBattleUnit((await getBoardUnit('pidgey', 1, 2)), f.pos(1,2), 0);
      const unit3 = await createBattleUnit((await getBoardUnit('spearow', 1, 3)), f.pos(1,3), 0);
      const newBoard = Map({})
      .set(f.pos(1,1), unit)
      .set(f.pos(1,2), unit2)
      .set(f.pos(1,3), unit3);
      const markedBoard = await markBoardBonuses(newBoard);
      assert.equal(markedBoard.get(f.pos(1,1)).get('buff').get(0), 'normal');
      assert.equal(markedBoard.get(f.pos(1,2)).get('buff').get(0), 'normal');
      assert.equal(markedBoard.get(f.pos(1,3)).get('buff').get(0), 'normal');
      // TODO: Check that the normal buff is applied
      assert.equal(markedBoard.get(f.pos(1,1)).get('hp'), (await pokemonJS.getStats('rattata')).get('hp') + 20);
      assert.equal(markedBoard.get(f.pos(1,2)).get('hp'), (await pokemonJS.getStats('pidgey')).get('hp') + 20);
      assert.equal(markedBoard.get(f.pos(1,3)).get('hp'), (await pokemonJS.getStats('spearow')).get('hp') + 20);
    });
    it('markBoardBonuses team impact', async () => {
      // TODO
    });
    it('markBoardBonuses rattatas / raticates counts as 1 ', async () => {
      // TODO
    });
  });
  describe('battleTime', () => {
    /**
     * Randomize Opponents for state
     * * Assumes board contains every player's updated board
     * stateParam
     */
    it('battleTime Poison battle', async () => {
      let state = await initEmptyState(2, List(['weedle', 'nidoran ♀', 'ekans']));
      state = await startGame(state);
      state = await buyUnit(state, 0, 1);
      state = await buyUnit(state, 1, 1);
      state = await endTurn(state);
      state = await buyUnit(state, 0, 1);
      state = await buyUnit(state, 1, 1);
      state = await placePiece(state, 0, f.pos(0), f.pos(1,1))
      state = await placePiece(state, 0, f.pos(1), f.pos(2,2))
      state = await placePiece(state, 1, f.pos(0), f.pos(1,1))
      state = await placePiece(state, 1, f.pos(1), f.pos(2,2))
      state = await battleTime(state);
      f.print(state)
    });
    it('battleTime Weedle battle', async () => {
      let state = await initEmptyState(2, List(['charmander', 'oddish', 'paras', 'ponyta', 'vulpix', 'caterpie', 'weedle']));
      state = await startGame(state);
      state = await buyUnit(state, 0, 1);
      state = await buyUnit(state, 1, 1);
      state = await endTurn(state);
      state = await buyUnit(state, 0, 1);
      state = await buyUnit(state, 1, 1);
      state = await placePiece(state, 0, f.pos(0), f.pos(1,1))
      state = await placePiece(state, 0, f.pos(1), f.pos(2,2))
      state = await placePiece(state, 1, f.pos(0), f.pos(1,1))
      state = await placePiece(state, 1, f.pos(1), f.pos(2,2))
      state = await battleTime(state);
      f.print(state)
    });
    it('battleTime Big', async () => {
      let state = await initEmptyState(2);
      state = await startGame(state);
      state = await buyUnit(state, 0, 1);
      state = await buyUnit(state, 1, 1);
      state = await endTurn(state);
      state = await buyUnit(state, 0, 1);
      state = await buyUnit(state, 1, 1);
      state = await placePiece(state, 0, f.pos(0), f.pos(1,1))
      state = await placePiece(state, 0, f.pos(1), f.pos(2,2))
      state = await placePiece(state, 1, f.pos(0), f.pos(1,1))
      state = await placePiece(state, 1, f.pos(1), f.pos(2,2))
      state = await battleTime(state);
      f.print(state)
      state = await buyUnit(state, 0, 1);
      state = await buyUnit(state, 1, 1);
      state = await placePiece(state, 0, f.pos(0), f.pos(1,2))
      state = await placePiece(state, 1, f.pos(0), f.pos(1,2))
      state = await battleTime(state);
      f.print(state)
      state = await buyUnit(state, 0, 1);
      state = await buyUnit(state, 1, 1);
      state = await placePiece(state, 0, f.pos(0), f.pos(2,1))
      state = await placePiece(state, 1, f.pos(0), f.pos(2,1))
      state = await battleTime(state);
      f.print(state)
    });
  });
  describe('battleSetup', () => {
    /**
     * Randomize Opponents for state
     * * Assumes board contains every player's updated board
     * stateParam
     */
    it('battleSetup Big', async () => {
      let state = await initEmptyState(2);
      state = await startGame(state);
      state = await buyUnit(state, 0, 1);
      state = await buyUnit(state, 1, 1);
      state = await placePiece(state, 0, f.pos(0), f.pos(1,1))
      state = await placePiece(state, 1, f.pos(0), f.pos(1,1))
      state = await buyUnit(state, 0, 2);
      state = await buyUnit(state, 1, 2);
      state = await placePiece(state, 0, f.pos(0), f.pos(2,2))
      state = await placePiece(state, 1, f.pos(0), f.pos(2,2))
      state = await battleSetup(state);
      // f.print(state)
      state = await placePiece(state, 0, f.pos(0), f.pos(3,3))
      state = await placePiece(state, 1, f.pos(0), f.pos(3,3))
      state = await battleSetup(state);
      // f.print(state)
      state = await buyUnit(state, 0, 1);
      state = await buyUnit(state, 1, 1);
      state = await placePiece(state, 0, f.pos(0), f.pos(1,2))
      state = await placePiece(state, 1, f.pos(0), f.pos(1,2))
      state = await battleSetup(state);
      f.print(state)
      state = await buyUnit(state, 0, 1);
      state = await buyUnit(state, 1, 1);
      state = await placePiece(state, 0, f.pos(0), f.pos(2,1))
      state = await placePiece(state, 1, f.pos(0), f.pos(2,1))
      state = await battleSetup(state);
      f.print(state)
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
  describe('getRoundType', () => {
    it('getRoundType correct?', () => {
      assert.equal(fileModule2.getRoundType(1), 'npc');
      assert.equal(fileModule2.getRoundType(2), 'npc');
      assert.equal(fileModule2.getRoundType(3), 'npc');
      assert.equal(fileModule2.getRoundType(4), 'pvp');
      assert.equal(fileModule2.getRoundType(5), 'pvp');
      assert.equal(fileModule2.getRoundType(8), 'pvp');
      assert.equal(fileModule2.getRoundType(10), 'gym');
      assert.equal(fileModule2.getRoundType(20), 'gym');
      assert.equal(fileModule2.getRoundType(21), 'shop');

    });
  });
  describe('getSetRound', () => {
    it('getSetRound 1?', async () => {
      const board = await fileModule2.getSetRound(1)
      const unit = board.get(f.pos(3,1))
      assert.equal('magikarp', unit.get('name'))
    });
    it('getSetRound 2?', async () => {
      const board = await fileModule2.getSetRound(2)
      assert.equal('rattata', board.get(f.pos(3,1)).get('name'))
      assert.equal('rattata', board.get(f.pos(4,1)).get('name'))
    });
    it('getSetRound 3?', async () => {
      const board = await fileModule2.getSetRound(3)
      assert.equal('pidgey', board.get(f.pos(3,1)).get('name'))
      assert.equal('pidgeotto', board.get(f.pos(4,1)).get('name'))
    });
  });
});
