// Author: Petter Andersson

const { Map, List } = require('immutable');

const pokemonJS = require('./pokemon');
const deckJS = require('./deck');
const f = require('./f');
const playerJS = require('./player');
const stateLogicJS = require('./state_logic');
const gameConstantsJS = require('./game_constants');

/**
 * File used for game logic
 */

function buildPieceStorage() {
  let availablePieces = List([List([]), List([]), List([]), List([]), List([])]);
  const decks = deckJS.getDecks();
  for (let i = 0; i < decks.size; i++) {
    for (let j = 0; j < decks.get(i).size; j++) {
      const pokemon = decks.get(i).get(j);
      if (f.isUndefined(pokemon.get('evolves_from'))) { // Only add base level
        const rarityAmount = gameConstantsJS.getRarityAmount(pokemon.get('cost'));
        // console.log('Adding', rarityAmount, pokemon.get('name'), 'to', pokemon.get('cost'));
        for (let l = 0; l < rarityAmount; l++) {
          availablePieces = stateLogicJS.push(availablePieces, i, pokemon.get('name'));
        }
      }
    }
    availablePieces = stateLogicJS.shuffle(availablePieces, i);
  }
  return availablePieces;
}

function initEmptyState(amountPlaying) {
  const pieceStorage = buildPieceStorage();
  const state = Map({
    pieces: pieceStorage,
    discarded_pieces: List([]),
    round: 1,
    income_basic: 1,
  });
  return playerJS.initPlayers(state, amountPlaying);
}

/**
 * Finds correct rarity for piece (random value)
 * Returns the piece taken from pieceStorage from correct rarity list
 * i is used to know which rarity it is checking (from 1 to 5)
 */
async function getPieceFromRarity(prob, i, pieceStorage) {
  const random = Math.random();
  let piece;
  if (prob > random) {
    // console.log('@getPieceFromRarity', prob, random, pieceStorage.get(i).get(0))
    piece = pieceStorage.get(i).get(0);
  }
  return piece;
}

/**
 * Updates shop with a new piece from getPieceFromRarity
 * Removes the piece from correct place in pieceStorage
 */
async function addPieceToShop(shop, pieces, level) {
  const prob = gameConstantsJS.getPieceProbabilityNum(level);
  let newShop = shop;
  let newPieceStorage = pieces;
  for (let i = 0; i < 5; i++) { // Loop over levels
    const piece = await getPieceFromRarity(prob[i], i, newPieceStorage);
    if (!f.isUndefined(piece)) {
      newShop = newShop.push(piece);
      // Removes first from correct rarity array
      newPieceStorage = await stateLogicJS.removeFirst(newPieceStorage, i);
      break;
    }
  }
  return { newShop, pieceStorage: newPieceStorage };
}

/**
 * Refresh shop
 * Generate newShop from pieces and update pieces to newPieces
 * Update discarded cards from previous shop
 * Add new shop
 */
async function refreshShop(stateParam, playerIndex) {
  let state = stateParam;
  const level = state.getIn(['players', playerIndex, 'level']);
  let newShop = List([]);
  let pieceStorage = state.get('pieces');
  // TODO: Check if
  for (let i = 0; i < 5; i++) { // Loop over pieces
    const obj = await addPieceToShop(newShop, pieceStorage, level);
    newShop = obj.newShop;
    pieceStorage = obj.pieceStorage;
  }
  const shop = state.getIn(['players', playerIndex, 'shop']);
  if (shop.size !== 0) {
    state = state.set('discarded_pieces', state.get('discarded_pieces').concat(shop));
  }
  state = state.setIn(['players', playerIndex, 'shop'], newShop);
  state = state.set('pieces', pieceStorage);
  return state;
}

/**
 * Create unit for board/hand placement from name and spawn position
 */
function getBoardUnit(name, x, y) {
  const unitInfo = pokemonJS.getStats(name);
  return Map({
    name,
    display_name: unitInfo.get('display_name'),
    position: f.getPos(x, y),
  });
}

/**
 * *Assumed hand not full here
 * *Assumed can afford
 * Remove unit from shop
 * Add unit to hand
 * Remove money from player
 *  Amount of money = getUnit(unitId).cost
 */
function buyUnit(stateParam, playerIndex, unitID) {
  let state = stateParam;
  let shop = state.getIn(['players', playerIndex, 'shop']);
  const unit = shop.get(unitID);
  if (!f.isUndefined(unit)) {
    shop = shop.splice(unitID, 1, undefined);
    state = state.setIn(['players', playerIndex, 'shop'], shop);

    const hand = state.getIn(['players', playerIndex, 'hand']);
    const unitInfo = pokemonJS.getStats(unit);
    const unitHand = getBoardUnit(unit, hand.size);
    // console.log('@buyUnit unitHand', unitHand)
    state = state.setIn(['players', playerIndex, 'hand'], hand.set(unitHand.get('position'), unitHand));

    const currentGold = state.getIn(['players', playerIndex, 'gold']);
    state = state.setIn(['players', playerIndex, 'gold'], currentGold - unitInfo.get('cost'));
  }
  return state;
}


/**
 * toggleLock for player (setIn)
 */
async function toggleLock(state, playerIndex) {
  const locked = state.getIn(['players', playerIndex, 'locked']);
  if (!locked) {
    return state.setIn(['players', playerIndex, 'locked'], true);
  }
  return state.setIn(['players', playerIndex, 'locked'], false);
}

async function increaseExp(stateParam, playerIndex, amountParam) {
  let state = stateParam;
  let player = state.getIn(['players', playerIndex]);
  let level = player.get('level');
  let exp = player.get('exp');
  let expToReach = player.get('expToReach');
  let amount = amountParam;
  while (amount >= 0) {
    // console.log(exp, level, expToReach, amount, expToReach > exp + amount);
    if (expToReach > exp + amount) { // not enough exp to level up
      exp += amount;
      amount = 0;
      player = player.set('level', level);
      player = player.set('exp', exp);
      player = player.set('expToReach', expToReach);
      state = state.setIn(['players', playerIndex], player); // await
      break;
    } else { // Leveling up
      level += 1;
      amount -= expToReach - exp;
      expToReach = gameConstantsJS.getExpRequired(level);
      // 2exp -> 4 when +5 => lvlup +3 exp: 5 = 5 - (4 - 2) = 5 - 2 = 3
      exp = 0;
    }
  }
  return state;
}

/**
 * Buy exp for player (setIn)
 */
function buyExp(state, playerIndex) {
  return increaseExp(state, playerIndex, 5);
}


/**
 * Board interaction
 * On move: reset the ids to index
 */

/**
  * Checks all units on board for player of that piece type
  * if 3 units are found, remove those 3 units and replace @ position with evolution
  * No units are added to discarded_pieces
  */
async function checkPieceUpgrade(stateParam, playerIndex, piece, position) {
  let state = stateParam;
  const boardUnits = state.getIn(['players', playerIndex, 'board']);
  const name = piece.get('name');
  let pieceCounter = 0;
  const positions = List([]);
  const keysIter = boardUnits.keys();
  let tempUnit = keysIter.next();
  while (!tempUnit.done) {
    const unit = boardUnits.get(tempUnit.value);
    if (unit.get('name') === name) {
      pieceCounter += 1;
      positions = positions.push(unit.get('position'));
    }
    tempUnit = keysIter.next();
  }
  if (pieceCounter >= 3) { // Upgrade unit @ position
    let board = state.getIn(['players', playerIndex, 'board']);
    for(let i = 0; i < positions.size; i++){
      board = board.delete(positions.get(i));
    }
    state = state.setIn(['players', playerIndex, 'board'], board);
    const evolvesTo = pokemonJS.getStats(name).get('evolves_to');
    const newPiece = getBoardUnit(evolvesTo, position.get('x'), position.get('y'));
    state = state.setIn(['players', playerIndex, 'board', position], newPiece);
  }
  return state;
}
/**
 * Given a position, returns if it is on hand or board
 */
const checkHandUnit = position => f.isUndefined(position.get('y'));

/**
 * Place piece
 * Swap functionality by default, if something is there already
 * * Assumes that only have of the board is placed on
 */
async function placePiece(stateParam, playerIndex, fromPosition, toPosition, shouldSwap = 'true') {
  let piece;
  let state = stateParam;
  if (checkHandUnit(fromPosition)) { // from hand
    piece = state.getIn(['players', playerIndex, 'hand', fromPosition]).set('position', toPosition);
    const newHand = state.getIn(['players', playerIndex, 'hand']).delete(fromPosition);
    state = state.setIn(['players', playerIndex, 'hand'], newHand);
  } else { // from board
    piece = state.getIn(['players', playerIndex, 'board', fromPosition]).set('position', toPosition);;
    const newBoard = state.getIn(['players', playerIndex, 'board']).delete(fromPosition);
    state = state.setIn(['players', playerIndex, 'board'], newBoard);
  }
  let newPiece;
  if (checkHandUnit(toPosition)) { // to hand
    newPiece = state.getIn(['players', playerIndex, 'hand', toPosition]);
    state = state.setIn(['players', playerIndex, 'hand', toPosition], piece);
  } else { // to board
    newPiece = state.getIn(['players', playerIndex, 'board', toPosition]);
    state = state.setIn(['players', playerIndex, 'board', toPosition], piece);
    state = await checkPieceUpgrade(state, playerIndex, piece, toPosition);
  }
  if (shouldSwap && !f.isUndefined(newPiece)) {
    if (checkHandUnit(fromPosition)) {
      state = state.setIn(['players', playerIndex, 'hand', fromPosition], newPiece.set('position', fromPosition));
    } else {
      state = state.setIn(['players', playerIndex, 'board', fromPosition], newPiece.set('position', fromPosition));
      state = await checkPieceUpgrade(state, playerIndex, newPiece, fromPosition);
    }
  }
  return state;
}

/**
 * WithdrawPiece from board to best spot on bench
 * * Assumes not bench is full
 */
async function withdrawPiece(state, playerIndex, piecePosition) {
  const hand = state.getIn(['players', playerIndex, 'hand']);
  let benchPosition;
  for (let i = 0; i < 8; i++) {
    // Get first available spot on bench
    const pos = f.getPos(i);
    if (f.isUndefined(hand.get(pos))) {
      benchPosition = pos;
      break;
    }
  }
  return placePiece(state, playerIndex, piecePosition, benchPosition, false);
}

/**
 * When units are sold, when level 1, a level 1 unit should be added to discarded_pieces
 * Level 2 => 3 level 1 units, Level 3 => 9 level 1 units
 */
async function discardBaseUnits(state, name, depth = '1') {
  const unitStats = pokemonJS.getStats(name);
  const evolutionFrom = unitStats.get('evolution_from');
  if (f.isUndefined(unitStats.get('evolution_from'))) { // Base level
    let discPieces = state.get('discarded_pieces');
    const amountOfPieces = 3 ** (depth - 1); // Math.pow
    for (let i = 0; i < amountOfPieces; i++) {
      discPieces = await discPieces.push(name);
    }
    return state.set('discarded_pieces', discPieces);
  }
  const newName = evolutionFrom.get('name');
  return discardBaseUnits(state, newName, depth + 1);
}

/**
 * Sell piece
 * Increase money for player
 * Remove piece from position
 * add piece to discarded pieces
 */
async function sellPiece(state, playerIndex, piecePosition) {
  let pieceTemp;
  // TODO: Make this into method, taking pos and get/set, if set take argument to set
  if (checkHandUnit(piecePosition)) {
    pieceTemp = state.getIn(['players', playerIndex, 'hand', piecePosition]);
  } else {
    pieceTemp = state.getIn(['players', playerIndex, 'board', piecePosition]);
  }
  const piece = pieceTemp;
  const unitStats = pokemonJS.getStats(piece.get('name'));
  const cost = unitStats.get('cost');
  const gold = state.getIn(['players', playerIndex, 'gold']);
  let newState = state.setIn(['players', playerIndex, 'gold'], +gold + +cost);
  if (checkHandUnit(piecePosition)) {
    const newHand = newState.getIn(['players', playerIndex, 'hand']).delete(piecePosition);
    newState = newState.setIn(['players', playerIndex, 'hand'], newHand);
  } else {
    const newBoard = newState.getIn(['players', playerIndex, 'board']).delete(piecePosition);
    newState = newState.setIn(['players', playerIndex, 'board'], newBoard);
  }
  // Add units to discarded Cards, add base level of card
  return discardBaseUnits(newState, piece.get('name'));
}

/**
 * Get first available spot at max range away from closest enemy
 * spot that is at maximal possible range from enemy, otherwise closer
 * Different favorable positions for S and N team, prioritize your side movement
 * (Assasins functionality can use enemyTeam as input)
 */
function getMovePos(board, closestEnemyPos, range, team) {
  const x = closestEnemyPos.get('x');
  const y = closestEnemyPos.get('y');
  for (let i = range; i >= 1; i--) {
    if (team === 0) { // S team
      if (f.isUndefined(board.get(f.getPos(x, y - i)))) { // S
        return f.getPos(x, y - i);
      } if (f.isUndefined(board.get(f.getPos(x - i, y - i)))) { // SW
        return f.getPos(x - i, y - i);
      } if (f.isUndefined(board.get(f.getPos(x + i, y - i)))) { // SE
        return f.getPos(x + i, y - i);
      } if (f.isUndefined(board.get(f.getPos(x - i, y)))) { // W
        return f.getPos(x - i, y);
      } if (f.isUndefined(board.get(f.getPos(x + i, y)))) { // E
        return f.getPos(x + i, y);
      } if (f.isUndefined(board.get(f.getPos(x, y + i)))) { // N
        return f.getPos(x, y + i);
      } if (f.isUndefined(board.get(f.getPos(x - i, y + i)))) { // NW
        return f.getPos(x - i, y + i);
      } if (f.isUndefined(board.get(f.getPos(x + i, y + i)))) { // NE
        return f.getPos(x + i, y + i);
      }
    } else { // N team
      if (f.isUndefined(board.get(f.getPos(x, y + i)))) { // N
        return f.getPos(x, y + i);
      } if (f.isUndefined(board.get(f.getPos(x + i, y + i)))) { // NE
        return f.getPos(x + i, y + i);
      } if (f.isUndefined(board.get(f.getPos(x - i, y + i)))) { // NW
        return f.getPos(x - i, y + i);
      } if (f.isUndefined(board.get(f.getPos(x + i, y)))) { // E
        return f.getPos(x + i, y);
      } if (f.isUndefined(board.get(f.getPos(x - i, y)))) { // W
        return f.getPos(x - i, y);
      } if (f.isUndefined(board.get(f.getPos(x, y - i)))) { // S
        return f.getPos(x, y - i);
      } if (f.isUndefined(board.get(f.getPos(x + i, y - i)))) { // SE
        return f.getPos(x + i, y - i);
      } if (f.isUndefined(board.get(f.getPos(x - i, y - i)))) { // SW
        return f.getPos(x - i, y - i);
      }
    }
  }
  // TODO: if no spot available, move closer to enemy?
  // Temp: no move
  return undefined;
}


/**
 * return closest enemy and marks if within range or not
 * Map({closestEnemy, withinRange})
 */
function getClosestEnemy(board, unitPos, range, team) {
  //f.print(board, '@getClosestEnemy board')
  const x = unitPos.get('x');
  const y = unitPos.get('y');
  const enemyTeam = 1 - team;
  for (let i = 1; i <= 8; i++) {
    const withinRange = i <= range;
    //console.log(withinRange, x, y, i, (x-i), (y-i))
    for (let j = x - i; j <= x + i; j++) {
      if (!f.isUndefined(board.get(f.getPos(j, y - i))) && board.get(f.getPos(j, y - i)).get('team') === enemyTeam) { // SW
        return Map({ closestEnemy: f.getPos(j, y - i), withinRange });
      } if (!f.isUndefined(board.get(f.getPos(j, y + i))) && board.get(f.getPos(j, y + i)).get('team') === enemyTeam) { // NW
        return Map({ closestEnemy: f.getPos(j, y + i), withinRange });
      }
    }
    for (let j = y - i + 1; j < y + i; j++) {
      if (!f.isUndefined(board.get(f.getPos(x - i, j))) && board.get(f.getPos(x - i, j)).get('team') === enemyTeam) { // SW
        return Map({ closestEnemy: f.getPos(x - i, j), withinRange });
      } if (!f.isUndefined(board.get(f.getPos(x + i, j))) && board.get(f.getPos(x + i, j)).get('team') === enemyTeam) { // NW
        return Map({ closestEnemy: f.getPos(x + i, j), withinRange });
      }
    }
  }
  f.print(board, '@getClosestEnemy Returning undefined: Board\n');
  console.log('@getClosestEnemy Returning undefined: ', x, y, range, team);
  return undefined;
}
/**
    if (!f.isUndefined(board.get(f.getPos(x, y + i))) && board.get(f.getPos(x, y + i)).get('team') === enemyTeam) { // N
      return Map({ closestEnemy: f.getPos(x, y + i), withinRange });
    } if (!f.isUndefined(board.get(f.getPos(x + i, y))) && board.get(f.getPos(x + i, y)).get('team') === enemyTeam) { // E
      return Map({ closestEnemy: f.getPos(x + i, y), withinRange });
    } if (!f.isUndefined(board.get(f.getPos(x, y - i))) && board.get(f.getPos(x, y - i)).get('team') === enemyTeam) { // S
      return Map({ closestEnemy: f.getPos(x, y - i), withinRange });
    } if (!f.isUndefined(board.get(f.getPos(x - i, y))) && board.get(f.getPos(x - i, y)).get('team') === enemyTeam) { // W
      return Map({ closestEnemy: f.getPos(x - i, y), withinRange });
    } if (!f.isUndefined(board.get(f.getPos(x + i, y + i))) && board.get(f.getPos(x + i, y + i)).get('team') === enemyTeam) { // NE
      return Map({ closestEnemy: f.getPos(x + i, y + i), withinRange });
    } if (!f.isUndefined(board.get(f.getPos(x + i, y - i))) && board.get(f.getPos(x + i, y - i)).get('team') === enemyTeam) { // SE
      return Map({ closestEnemy: f.getPos(x + i, y - i), withinRange });
    } if (!f.isUndefined(board.get(f.getPos(x - i, y - i))) && board.get(f.getPos(x - i, y - i)).get('team') === enemyTeam) { // SW
      return Map({ closestEnemy: f.getPos(x - i, y - i), withinRange });
    } if (!f.isUndefined(board.get(f.getPos(x - i, y + i))) && board.get(f.getPos(x - i, y + i)).get('team') === enemyTeam) { // NW
      return Map({ closestEnemy: f.getPos(x - i, y + i), withinRange });
    }
*/


/**
 * Remove hp from unit
 * Remove unit if hp <= 0
 * ({board, unitDied})
 */
async function removeHpBattle(board, unitPos, hpToRemove) {
  const currentHp = board.getIn([unitPos, 'hp']);
  if (currentHp - hpToRemove <= 0) {
    console.log('@removeHpBattle UNIT DIED!', currentHp, '-', hpToRemove)
    return Map({ board: board.delete(unitPos), unitDied: true });
  }
  if(isNaN(currentHp - hpToRemove)){
    console.log('Exiting ... ', currentHp, hpToRemove, board.get(unitPos))
    process.exit()
  }
  return Map({ board: board.setIn([unitPos, 'hp'], currentHp - hpToRemove), unitDied: false });
}

/**
 * Increases mana for both units on board
 * Returns updated board
 */
async function manaIncrease(board, unitPos, enemyPos) {
  const unitMana = board.get(unitPos).get('mana');
  const enemyMana = board.get(enemyPos).get('mana');
  const unitManaInc = board.get(unitPos).get('mana_hit_given') || pokemonJS.getStatsDefault('mana_hit_given');
  const enemyManaInc = board.get(enemyPos).get('mana_hit_taken') || pokemonJS.getStatsDefault('mana_hit_taken');
  return board.setIn([unitPos, 'mana'], +unitMana + +unitManaInc).setIn([enemyPos, 'mana'], +enemyMana + +enemyManaInc);
}

/**
 * Next move calculator
 * If mana is full use spell
 *  TODO: Spells logic
 *  TODO: Conditions for spells
 * Unit checks if it can attack an enemy, is within unit.range
 * If it can, attack on closests target position
 *  If enemy unit dies, check battle over
 *  if attack is made, increase mana for both units
 * If not, make a move to closest enemy unit
 *
 * Map({nextMove: Map({action: action, value: value, target: target}),
 * newBoard: newBoard, battleOver: true, allowSameMove: true})
 */
async function nextMove(board, unitPos, optPreviousTarget) {
  const unit = board.get(unitPos);
  if (unit.get('mana') === 100 && false) { // Use spell, && withinRange for spell
    // TODO Spell logic

  } else {
    const range = unit.get('range') || pokemonJS.getStatsDefault('range');
    const team = unit.get('team');
    let targetPos;
    if (!f.isUndefined(optPreviousTarget)) {
      targetPos = Map({ closestEnemy: optPreviousTarget, withinRange: true });
    } else {
      targetPos = getClosestEnemy(board, unitPos, range, team);
    }
    const enemyPos = targetPos; // await
    // console.log('@nextMove enemyPos', enemyPos)
    if (enemyPos.get('withinRange')) { // Attack action
      const action = 'attack';
      const value = unit.get('attack');
      const target = enemyPos.get('closestEnemy');
      // TODO: Add weakness/resistance types between attacker/defender
      // TODO: Check bonuses from players
      // Calculate newBoard from action
      const removedHPBoard = await removeHpBattle(board, target, value); // {board, unitDied}
      if (removedHPBoard.get('unitDied')) { // Check if battle ends
        const newBoard = removedHPBoard.get('board');
        const keysIter = newBoard.keys();
        let tempUnit = keysIter.next();
        let battleOver = true;
        while (!tempUnit.done) {
          if (newBoard.get(tempUnit.value).get('team') === 1 - team) {
            battleOver = false;
            break;
          }
          tempUnit = keysIter.next();
        }
        f.printBoard(newBoard, Map({ unitPos, action, value, target }));
        return Map({ nextMove: Map({ unitPos, action, value, target }), newBoard, battleOver });
      } // Mana increase, return newBoard
      const newBoard = manaIncrease(removedHPBoard.get('board'), unitPos, target);
      // console.log('new hp for ' + target, removedHPBoard.get('board').get(target).get('hp'));
      f.printBoard(newBoard, Map({ unitPos, action, value, target }));
      return Map({ nextMove: Map({ unitPos, action, value, target }), newBoard, allowSameMove: true});
    } // Move action
    const closestEnemyPos = enemyPos.get('closestEnemy');
    const movePos = getMovePos(board, closestEnemyPos, range, team);
    const newBoard = board.set(movePos, unit.set('position', movePos)).delete(unitPos);
    const action = 'move';
    f.printBoard(newBoard, Map({ unitPos, action, target: movePos }));
    return Map({ nextMove: Map({ unitPos, action, target: movePos }), newBoard });
  }
}

/**
 * Returns position of unit with the next move
 */
async function getUnitWithNextMove(board) {
  //console.log('@getUnitWithNextMove',board)
  const boardKeysIter = board.keys();
  let tempUnit = boardKeysIter.next();
  let lowestNextMove = List([tempUnit.value]);
  let lowestNextMoveValue = board.get(tempUnit.value).get('next_move');
  while (!tempUnit.done) {
    const unitPos = tempUnit.value;
    const unitNextMove = board.get(unitPos).get('next_move');
    if (unitNextMove < lowestNextMoveValue) { // New lowest move
      lowestNextMove = List([unitPos]);
      lowestNextMoveValue = unitNextMove;
    } else if (unitNextMove === lowestNextMoveValue) {
      lowestNextMove = lowestNextMove.push(unitPos);
    }
    tempUnit = boardKeysIter.next();
  }
  // Find nextMove unit
  if (lowestNextMove.size === 1) {
    return lowestNextMove.get(0);
  }
  // TODO: Decide order of equal next move units
  // Approved Temp: Random order
  return lowestNextMove.get(Math.floor(Math.random() * lowestNextMove.size));
}

/**
 * Battle:
 * Grab next unit to move
 * simulate next move for that unit and calculate new board
 * add that move to actionStack
 * Continue until battle over
 */
async function startBattle(boardParam) {
  let actionStack = List([]);
  let unitMoveMap = Map({});
  let board = boardParam;
  //f.print(board, '@startBattle')
  let result = Map({});
  // TODO First move for all units first
  // Remove first_move from all units when doing first movement
  // First move used for all units (order doesn't matter) and set next_move to + speed accordingly
  while (!result.get('battleOver')) {
    board = await board;
    const nextUnitToMove = await getUnitWithNextMove(board);
    const unit = board.get(nextUnitToMove);
    //console.log('\n@startbattle Next unit to do action: ', nextUnitToMove); 
    const nextMoveBoard = board.setIn([nextUnitToMove, 'next_move'], +unit.get('next_move') + +unit.get('speed'));
    const previousMove = unitMoveMap.get(nextUnitToMove);
    let nextMoveResult;
    if (!f.isUndefined(previousMove)) { // Use same target as last round
      //console.log('previousMove in @startBattle', previousMove.get('nextMove').get('target'))
      const previousTarget = previousMove.get('nextMove').get('target');
      nextMoveResult = await nextMove(nextMoveBoard, nextUnitToMove, previousTarget);
    } else {
      nextMoveResult = await nextMove(nextMoveBoard, nextUnitToMove);
    }
    result = await nextMoveResult;
    //console.log('@startBattle: ', result.get('nextMove'))
    /*
    if(result.get('nextMove').get('action') === 'attack'){
      process.exit()
    }*/
    actionStack = actionStack.push(result.get('nextMove').set('time', unit.get('next_move')));
    if (result.get('allowSameMove')) { // Attack on target in same position for example
      unitMoveMap = unitMoveMap.set(nextUnitToMove, nextMoveResult);
    } else {
      // Delete every key mapping to nextMoveResult
      const keysIter = unitMoveMap.keys();
      let tempUnit = keysIter.next();
      while (!tempUnit.done) {
        const tempPrevMove = unitMoveMap.get(tempUnit.value);
        if(tempPrevMove.get('target') === nextMoveResult.get('target')){
          unitMoveMap = unitMoveMap.delete(tempUnit.value)
        }
        tempUnit = keysIter.next();
      }
    // unitMoveMap = unitMoveMap.delete(nextUnitToMove);
    }
    //console.log('@startBattle 2 -', result.get('newBoard'))
    board = result.get('newBoard');
  }
  const newBoard = await board;
  // Return the winner
  // f.print(newBoard, '@startBattle newBoard after');
  // f.print(actionStack, '@startBattle actionStack after');
  const winningTeam = newBoard.getIn([actionStack.get(actionStack.size - 1), 'team']);
  return Map({ actionStack, board: newBoard, winner: winningTeam });
}

/**
 * Reverses position, your units position on enemy boards
 */
const reverseUnitPos = pos => Map({ x: 7 - pos.get('x'), y: 7 - pos.get('y') });

/**
 * Board with first_move: pos set for all units
 */
async function setRandomFirstMove(board) {
  const boardKeysIter = board.keys();
  let tempUnit = boardKeysIter.next();
  let newBoard = board;
  while (!tempUnit.done) {
    const unitPos = tempUnit.value;
    const newPos = unitPos;
    // TODO: Factor for movement from pokemon
    // Temp: 0.5
    const isMoving = Math.random() > 0.5;
    if (isMoving) {
      // TODO Make logical movement calculation, 
      // Approved Temp: currently starts default spot, makes no firstmove
    }
    //console.log('\n@setRandomFirstMove', board)
    newBoard = newBoard.setIn([unitPos, 'first_move'], newPos);
    tempUnit = boardKeysIter.next();
  }
  return newBoard;
}

async function markBoardBonuses(board){
  const boardKeysIter = board.keys();
  let tempUnit = boardKeysIter.next();
  let buffMap = Map({});
  while (!tempUnit.done) {
    const unitPos = tempUnit.value;
    const types = board.get(unitPos).get('type'); // Value or List
    if(f.isUndefined(types.size)) { // List 
      for(let i = 0; i < types.size; i++){
        buffMap = buffMap.set(types[i], (buffMap.get(types[i]) || 0) + 1);
      }
    } else { // Value
      buffMap = buffMap.set(types, (buffMap.get(types) || 0) + 1);
    }
    tempUnit = boardKeysIter.next();
  }
  buffMap = await buffMap;
  // Find if any bonuses need applying
  const buffsKeysIter = buffMap.keys();
  let tempBuff = buffsKeysIter.next();
  while (!tempBuff.done) {
    const buff = tempBuff.value;
    const amountBuff = buffMap.get(buff);
    
    tempBuff = buffsKeysIter.next();
  }
  // Apply buff
  const boardKeysIter2 = board.keys();
  tempUnit = boardKeysIter2.next();
  let newBoard = board;
  while (!tempUnit.done) {
    const unitPos = tempUnit.value;
    let buff = List([]);
    

    newBoard = newBoard.setIn([unitPos, 'buff'], buff);
    tempUnit = boardKeysIter2.next();
  }
  return newBoard;
}

/**
 * Spawn opponent in reverse board
 * Mark owners of units
 * Start battle
 * pairing: {
 *  homeID: 1,
 *  enemyID: 0
 * }
 */
async function prepareBattle(stateParam, pairing) {
  const state = stateParam;
  const board1 = state.getIn(['players', pairing.get('homeID'), 'board']);
  const board2 = state.getIn(['players', pairing.get('enemyID'), 'board']);
  // Check to see if a battle is required
  // Lose when empty, even if enemy no units aswell (tie with no damage taken)
  if (board1.size === 0) {
    return Map({ actionStack: List([]), winner: 1 });
  } if (board2.size === 0) {
    return Map({ actionStack: List([]), winner: 0 });
  }
  // Both players have units, battle required
  const keysIter = board1.keys();
  let tempUnit = keysIter.next();
  let newBoard = Map({});
  while (!tempUnit.done) {
    const unitPos = tempUnit.value;
    const unit = board1.get(unitPos);
    const unitStats = pokemonJS.getStats(unit.get('name'));
    const unitWithTeam = unit.set('team', 0).set('attack', unitStats.get('attack')).set('hp', unitStats.get('hp'))
      .set('type', unitStats.get('type'))
      .set('next_move', unitStats.get('next_move') || pokemonJS.getStatsDefault('next_move'))
      .set('ability', unitStats.get('ability'))
      .set('mana', unitStats.get('mana') || pokemonJS.getStatsDefault('mana'))
      .set('speed', pokemonJS.getStatsDefault('upperLimitSpeed') - (unitStats.get('speed') || pokemonJS.getStatsDefault('speed'))) 
      .set('mana_hit_given', unitStats.get('mana_hit_given') || pokemonJS.getStatsDefault('mana_hit_given'))
      .set('mana_hit_taken', unitStats.get('mana_hit_taken') || pokemonJS.getStatsDefault('mana_hit_taken'));
    newBoard = await newBoard.set(unitPos, unitWithTeam);
    tempUnit = keysIter.next();
  }
  const keysIter2 = board2.keys();
  tempUnit = keysIter2.next();
  while (!tempUnit.done) {
    const unitPos = tempUnit.value;
    const newUnitPos = reverseUnitPos(unitPos); // Reverse unitPos
    const unit = board2.get(unitPos);
    const unitStats = pokemonJS.getStats(unit.get('name'));
    const unitWithTeam = unit.set('team', 1).set('attack', unitStats.get('attack')).set('hp', unitStats.get('hp'))
      .set('type', unitStats.get('type'))
      .set('next_move', unitStats.get('next_move') || pokemonJS.getStatsDefault('next_move'))
      .set('ability', unitStats.get('ability'))
      .set('mana', unitStats.get('mana') || pokemonJS.getStatsDefault('mana'))
      .set('speed', unitStats.get('speed') || pokemonJS.getStatsDefault('speed'))
      .set('mana_hit_given', unitStats.get('mana_hit_given') || pokemonJS.getStatsDefault('mana_hit_given'))
      .set('mana_hit_taken', unitStats.get('mana_hit_taken') || pokemonJS.getStatsDefault('mana_hit_taken'));
    const newUnitWithTeam = unitWithTeam.set('position', newUnitPos);
    newBoard = await newBoard.set(newUnitPos, newUnitWithTeam);
    tempUnit = keysIter2.next();
  }
  const board = await newBoard;
  //f.print(board, '@prepareBattle')
  const boardWithBonuses = await markBoardBonuses(board);
  const boardWithMovement = await setRandomFirstMove(boardWithBonuses);
  const result = await startBattle(boardWithMovement);
  return result.set('startBoard', boardWithMovement);
}

/**
 * Randomize Opponents for state
 * * Assumes board contains every player's updated board
 */
async function battleTime(stateParam) {
  // TODO: Randomize opponent pairs, shuffle indexes before iterator
  // Temp: Always face next player in order
  let state = stateParam;
  const playerIter = state.get('players').keys();
  let tempPlayer = playerIter.next();
  let iter;
  let nextPlayer;
  const firstPlayer = tempPlayer.value;
  while (true) { // !tempPlayer.done
    const currentPlayer = tempPlayer.value;
    iter = playerIter.next();
    if (iter.done) {
      nextPlayer = firstPlayer;
    } else {
      nextPlayer = iter.value;
    }
    const index = currentPlayer;
    const enemy = nextPlayer; // (i === amountOfPlayers - 1 ? 0 : i + 1);
    const pairing = Map({ homeID: index, enemyID: enemy });
    //console.log('@battleTime pairing: ', pairing, nextPlayer);
    const result = prepareBattle(state, pairing);
    // {actionStack: actionStack, board: newBoard, winner: winningTeam, startBoard: initialBoard}
    // TODO:  Send actionStack to frontend and startBoard
    //        resultBattle.get('actionStack');
    //        resultBattle.get('startBoard')
    const resultBattle = await result;
    // console.log('\n@battleTime - ', resultBattle);
    const winner = (resultBattle.get('winner') === 0);
    const newBoard = resultBattle.get('board'); // TODO: Check, where to use this?
    const newStateAfterBattle = await endBattle(state, index, winner, enemy);
    state = state.setIn(['players', index], newStateAfterBattle.getIn(['players', index]));
    if (iter.done) {
      break;
    } else {
      tempPlayer = iter;
    }
  }
  const newState = await state;
  return newState;
}

/**
 * *This is not a player made action, time based event for all players
 * *When last battle is over this method shall be called
 * Increase players exp by 1
 * Refresh shop as long as player is not locked
 * Gold:
 *  Interest for 10 gold
 *  Increasing throughout the game basic income
 *  Win streak / lose streak
 */
async function endTurn(stateParam) {
  let state = stateParam;
  const income_basic = state.get('income_basic');
  const round = state.get('round');
  state = state.set('round', round + 1);
  if (round <= 5) {
    state = state.set('income_basic', income_basic + 1);
  }
  return playerEndTurn(state, state.get('amountOfPlayers'), income_basic + 1);
}

async function playerEndTurn(stateParam, amountPlayers, income_basic) {
  let state = stateParam;
  // console.log('@playerEndTurn\n', state, state.get('amountOfPlayers'));
  for (let i = 0; i < amountPlayers; i++) {
    const locked = state.getIn(['players', i, 'locked']);
    if (!locked) {
      state = await refreshShop(state, i);
      // console.log('Not locked for player[' + i + '] \n', state.get('pieces').get(0));
    }
    state = await increaseExp(state, i, 1);
    const gold = state.getIn(['players', i, 'gold']);
    // Min 0 gold interest -> max 5
    const bonusGold = Math.min(Math.floor(gold / 10), 5);
    const streak = state.getIn(['players', i, 'streak']) || 0;
    const streakGold = Math.min(Math.floor(
      (streak === 0 || Math.abs(streak) === 1 ? 0 : (Math.abs(streak) / 5) + 1),
    ), 3);
    // console.log(`@playerEndTurn Gold: p[${i + 1}]: `,
    // `${gold}, ${income_basic}, ${bonusGold}, ${streakGold}`);
    const newGold = gold + income_basic + bonusGold + streakGold;
    state = state.setIn(['players', i, 'gold'], newGold);
    // console.log(i, '\n', state.get('pieces').get(0));
    // state = state.set(i, state.getIn(['players', i]));
  }
  const newState = await state;
  return newState;
}

let synchronizedPlayers = Map({});

/**
 * Builds new state after battles
 */
async function prepEndTurn(state, playerIndex) {
  synchronizedPlayers = synchronizedPlayers.set(playerIndex, state.getIn(['players', playerIndex]));
  if (synchronizedPlayers.size === state.get('amountOfPlayers')) {
    const newState = state.set('players', synchronizedPlayers); // Set
    const newRoundState = await endTurn(newState);
    return newRoundState;
  }
  return state;
}

/**
 * TODO
 * winner:
 *  Gain 1 gold
 * loser:
 *  Lose hp
 *      Calculate amount of hp to lose
 * Parameters: Enemy player index, winningAmount = damage? (units or damage)
 */
async function endBattle(stateParam, playerIndex, winner, enemyPlayerIndex) {
  let state = stateParam;
  const streak = state.getIn(['players', playerIndex, 'streak']) || 0;
  if (winner) {
    state = state.setIn(['players', playerIndex, 'gold'], state.getIn(['players', playerIndex, 'gold']) + 1);
    state = state.setIn(['players', playerIndex, 'streak'], streak + 1);
  } else {
    const boardUnits = state.get(['players', enemyPlayerIndex, 'board']);
    const hpToRemove = calcDamageTaken(boardUnits);
    state = await removeHp(state, playerIndex, hpToRemove);
    state = state.setIn(['players', playerIndex, 'streak'], streak - 1);
  }
  const round = state.get('round');
  const potentialEndTurn = await prepEndTurn(state, playerIndex);
  if (potentialEndTurn.get('round') === round + 1) {
    // TODO: Send information to users

  }
  return potentialEndTurn;
}

/**
 * Given a list of units, calculate damage to be removed from player
 * 1 point per level of unit
 * Units level is currently their cost
 */
function calcDamageTaken(boardUnits) {
  if (f.isUndefined(boardUnits) || boardUnits.size === 0) {
    return 0; // When there are no units left for the enemy, don't lose hp (A tie)
  }
  let sum = 0;
  // console.log('@calcDamageTaken', boardUnits.size)
  const keysIter = boardUnits.keys();
  let tempUnit = keysIter.next();
  while (!tempUnit.done) { // while template
    sum += +pokemonJS.getStats(boardUnits.get(tempUnit.value).get('name')).get('cost');
    tempUnit = keysIter.next();
  }
  return sum;
}

/**
 * Marks the only remaining player as the winner
 */
function gameOver(state) {
  const winningPlayer = state.get('players').values().next().value;
  // TODO Send this information to everyone
  return state;
}

/**
 * Remove hp from player
 * Mark player as defeated if hp <= 0, by removal of player from players
 * Also decrease amountOfPlayers
 */
async function removeHp(state, playerIndex, hpToRemove) {
  const currentHp = state.getIn(['players', playerIndex, 'hp']);
  if (currentHp - hpToRemove <= 0) {
    const newState = state.set('players', state.get('players').delete(playerIndex));
    const amountOfPlayers = newState.get('amountOfPlayers') - 1;
    const removedPlayerState = newState.set('amountOfPlayers', amountOfPlayers);
    if (amountOfPlayers === 1) {
      return await gameOver(removedPlayerState);
    }
    return removedPlayerState;
  }
  return state.setIn(['players', playerIndex, 'hp'], currentHp - hpToRemove);
}

exports.start = async () => {
  let state = initEmptyState(2);
  // f.print(state, '**Initial State: ');
  state = await refreshShop(state, 0);
  // f.print(state, '**State with shop given to player 0: ');
  state = await buyUnit(state, 0, 1);
  // f.print(state, '**State where player 0 Bought a Unit at index 1: ');
  state = await battleTime(state);
  f.print(state, '**State after battle time with 0 units: ');
};
