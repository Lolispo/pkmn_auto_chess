// Author: Petter Andersson

const { Map, List, Set } = require('immutable');

const pokemonJS = require('./pokemon');
const deckJS = require('./deck');
const f = require('./f');
const playerJS = require('./player');
const typesJS = require('./types');
const gameConstantsJS = require('./game_constants');
const abilitiesJS = require('./abilities');


/**
 * File used for game logic
 */

/**
  * Builds deck of pokemon loaded from pokemon.js
  * Optional parameter to choose pokemon for deck (mainly for testing)
  */
async function buildPieceStorage(optList) {
  let availablePieces = List([List([]), List([]), List([]), List([]), List([])]);
  const decks = await deckJS.getDecks();
  // console.log('@buildPieceStorage: decks', decks)
  for (let i = 0; i < decks.size; i++) {
    for (let j = 0; j < decks.get(i).size; j++) {
      const pokemon = decks.get(i).get(j);
      if (f.isUndefined(optList) || optList.includes(pokemon.get('name'))) {
        const rarityAmount = gameConstantsJS.getRarityAmount(pokemon.get('cost'));
        // console.log('Adding', rarityAmount, pokemon.get('name'), 'to', pokemon.get('cost'));
        for (let l = 0; l < rarityAmount; l++) {
          availablePieces = f.push(availablePieces, i, pokemon.get('name'));
        }
      }
    }
    availablePieces = f.shuffle(availablePieces, i);
  }
  // console.log('\n@buildPieceStorage: availablePieces', availablePieces)
  return availablePieces;
}

async function initEmptyState(amountPlaying, optList) {
  const pieceStorage = await buildPieceStorage(optList);
  const state = Map({
    pieces: pieceStorage,
    discarded_pieces: List([]),
    round: 1,
    income_basic: 1,
  });
  return playerJS.initPlayers(state, amountPlaying);
}

/**
 * Fills pieceStorage with discardedPieces
 */
async function refillPieces(pieces, discardedPieces) {
  let pieceStorage = pieces;
  if (discardedPieces.size === 0) {
    return pieces;
  }
  console.log('@refillPieces Refilling', discardedPieces.size, 'units'); // pieceStorage
  for (let i = 0; i < discardedPieces.size; i++) {
    const name = discardedPieces.get(i);
    const cost = (await pokemonJS.getStats(discardedPieces.get(i))).get('cost');
    pieceStorage = await f.push(pieceStorage, cost - 1, name);
  }
  return pieceStorage;
}

/**
 * Finds correct rarity for piece (random value)
 * Returns the piece taken from pieceStorage from correct rarity list
 * i is used to know which rarity it is checking (from 1 to 5)
 * Made sure after method that rarity contain pieces
 */
async function getPieceFromRarity(random, prob, index, pieceStorage) {
  let piece;
  if (prob > random) {
    piece = pieceStorage.get(index).get(0);
  }
  return piece;
}

/**
 * Updates shop with a new piece from getPieceFromRarity
 * Removes the piece from correct place in pieceStorage
 */
async function addPieceToShop(shop, pos, pieces, level, discPieces) {
  const prob = gameConstantsJS.getPieceProbabilityNum(level);
  let newShop = shop;
  let newPieceStorage = pieces;
  let newDiscPieces = discPieces;
  // console.log('addPieceToShop LEVEL ', level, prob)
  for (let i = 0; i < 5; i++) { // Loop over levels
    // If any piece storage goes empty -> put all discarded pieces in pieces
    // console.log('@addPieceToShop', discPieces)
    if (newPieceStorage.get(i).size === 0) {
      newPieceStorage = await refillPieces(newPieceStorage, discPieces);
      newDiscPieces = List([]);
    }
    // TODO: In theory, pieces might still be empty here, if not enough pieces were in the deck.
    // Temp: If still empty for that level, try a level below
    const random = Math.random();
    let piece;
    if (newPieceStorage.get(i).size === 0) {
      if (i != 0) {
        piece = await getPieceFromRarity(random, prob[i - 1], i - 1, newPieceStorage);
      } else {
        console.log('Not enough pieces of lower rarity, and current rarity not found');
        process.exit();
      }
    } else {
      piece = await getPieceFromRarity(random, prob[i], i, newPieceStorage);
    }
    // console.log('addPieceToShop piece: ', piece, prob[i], i);
    if (!f.isUndefined(piece)) {
      const unitStats = await pokemonJS.getStats(piece);
      newShop = newShop.set(pos, Map({
        name: piece, 
        display_name: unitStats.get('display_name'),
        cost: unitStats.get('cost'),
        type: unitStats.get('type'),
      }));
      // Removes first from correct rarity array
      newPieceStorage = await f.removeFirst(newPieceStorage, i);
      break;
    }
  }
  return { newShop, pieceStorage: newPieceStorage, discPieces: newDiscPieces };
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
  let newShop = Map({});
  let pieceStorage = state.get('pieces');
  let discPieces = state.get('discarded_pieces');
  for (let i = 0; i < 5; i++) { // Loop over pieces
    const obj = await addPieceToShop(newShop, f.pos(i), pieceStorage, level, discPieces);
    newShop = obj.newShop;
    pieceStorage = obj.pieceStorage;
    discPieces = obj.discPieces;
  }
  const shop = state.getIn(['players', playerIndex, 'shop']);
  if (shop.size !== 0) {
    const iter = shop.values();
    let temp = iter.next();
    let tempShopList = List([]);
    while (!temp.done) {
      tempShopList = tempShopList.push(temp.value.get('name'));
      temp = iter.next();
    }
    const shopList = await tempShopList;
    const filteredShop = shopList.filter(piece => !f.isUndefined(piece));
    console.log('@refreshShop filteredShop', filteredShop, '(', pieceStorage.size, '/', discPieces.size, ')');
    state = state.set('discarded_pieces', discPieces.concat(filteredShop));
  }
  state = state.setIn(['players', playerIndex, 'shop'], newShop);
  state = state.set('pieces', pieceStorage);
  return state;
}

// Cost of 2 gold
exports._refreshShop = async (stateParam, index) => {
  const state = stateParam.setIn(['players', index, 'gold'], stateParam.getIn(['players', index, 'gold']) - 2);
  return refreshShop(state, index);
}

/**
 * Create unit for board/hand placement from name and spawn position
 */
async function getBoardUnit(name, x, y) {
  const unitInfo = await pokemonJS.getStats(name);
  // console.log('@getBoardUnit', name, unitInfo)
  return Map({
    name,
    display_name: unitInfo.get('display_name'),
    position: f.pos(x, y),
  });
}

/**
 * Help function in creating battle boards
 * Use together with combine boards
 */
exports.createBattleBoard = async (inputList) => {
  let board = Map({});
  for (let i = 0; i < inputList.size; i++) {
    const el = inputList.get(i);
    const pokemon = el.get('name');
    const x = el.get('x');
    const y = el.get('y');
    const unit = await getBoardUnit(pokemon, x, y);
    board = await board.set(f.pos(x, y), unit);
  }
  return board;
};

/**
 * *Assumed hand not full here
 * *Assumed can afford
 * Remove unit from shop
 * Add unit to hand
 * Remove money from player
 *  Amount of money = getUnit(unitId).cost
 */
exports.buyUnit = async (stateParam, playerIndex, unitID) => {
  let state = stateParam;
  console.log('@buyunit', unitID, playerIndex, state.getIn(['players', playerIndex, 'hand']).get('name'), f.pos(unitID))
  // console.log(state.getIn(['players', playerIndex, 'shop']));
  let shop = state.getIn(['players', playerIndex, 'shop']);
  const unit = shop.get(f.pos(unitID)).get('name');
  if (!f.isUndefined(unit)) {
    shop = shop.delete(f.pos(unitID));
    state = state.setIn(['players', playerIndex, 'shop'], shop);

    const hand = state.getIn(['players', playerIndex, 'hand']);
    const unitInfo = await pokemonJS.getStats(unit);
    const handIndex = await getFirstAvailableSpot(state, playerIndex); // TODO: Go: Get first best hand index
    console.log('@buyUnit handIndex', handIndex);
    const unitHand = await getBoardUnit(unit, f.x(handIndex));
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
 exports.toggleLock = async (state, playerIndex) => {
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
  if(level === 10)
    return state;
  while (amount >= 0) {
    console.log('increaseExp', level, exp, expToReach)
    // console.log(exp, level, expToReach, amount, expToReach > exp + amount);
    if (expToReach > exp + amount) { // not enough exp to level up
      exp += amount;
      amount = 0;
      player = player.set('level', level);
      player = player.set('exp', exp);
      player = player.set('expToReach', expToReach);
      state = state.setIn(['players', playerIndex], player);
      break;
    } else { // Leveling up
      level += 1;
      if(level === 10){
        player = player.set('level', level);
        player = player.set('exp', 0);
        player = player.set('expToReach', 'max');
        state = state.setIn(['players', playerIndex], player);
        break;
      }
      amount -= expToReach - exp;
      expToReach = gameConstantsJS.getExpRequired(level);
      // 2exp -> 4 when +5 => lvlup +3 exp: 5 = 5 - (4 - 2) = 5 - 2 = 3
      exp = 0;
    }
  }
  console.log('increaseExp leaving', level, exp, expToReach)
  return state;
}

/**
 * Buy exp for player (setIn)
 */
exports.buyExp = (state, playerIndex) => {
  const gold = state.getIn(['players', playerIndex, 'gold']);
  const newState = state.setIn(['players', playerIndex, 'gold'], gold - 5);
  return increaseExp(newState, playerIndex, 5);
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
  let positions = List([]);
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
    for (let i = 0; i < positions.size; i++) {
      board = board.delete(positions.get(i));
    }
    state = state.setIn(['players', playerIndex, 'board'], board);
    const stats = await pokemonJS.getStats(name);
    const evolvesTo = stats.get('evolves_to');
    // Check if multiple evolutions exist, random between
    let newPiece;
    if (!f.isUndefined(evolvesTo.size)) { // List
      newPiece = await getBoardUnit(evolvesTo.get(f.getRandomInt(evolvesTo.size)), f.x(position), f.y(position));
    } else { // Value
      newPiece = await getBoardUnit(evolvesTo, f.x(position), f.y(position));
    }
    state = state.setIn(['players', playerIndex, 'board', position], newPiece);
  }
  return state;
}

/**
 * Place piece
 * Swap functionality by default, if something is there already
 * * Assumes that only half of the board is placed on
 */
async function placePiece(stateParam, playerIndex, fromPosition, toPosition, shouldSwap = 'true') {
  let piece;
  let state = stateParam;
  if (f.checkHandUnit(fromPosition)) { // from hand
    console.log('@placePiece placeOnBoard', fromPosition, state.getIn(['players', playerIndex, 'hand']))
    piece = state.getIn(['players', playerIndex, 'hand', fromPosition]).set('position', toPosition);
    const newHand = state.getIn(['players', playerIndex, 'hand']).delete(fromPosition);
    state = state.setIn(['players', playerIndex, 'hand'], newHand);
  } else { // from board
    console.log('@placePiece', fromPosition)
    console.log('@placePiece board', state.getIn(['players', playerIndex, 'board']));
    piece = state.getIn(['players', playerIndex, 'board', fromPosition]).set('position', toPosition);
    const newBoard = state.getIn(['players', playerIndex, 'board']).delete(fromPosition);
    state = state.setIn(['players', playerIndex, 'board'], newBoard);
  }
  let newPiece;
  if (f.checkHandUnit(toPosition)) { // to hand
    newPiece = state.getIn(['players', playerIndex, 'hand', toPosition]);
    state = state.setIn(['players', playerIndex, 'hand', toPosition], piece);
  } else { // to board
    newPiece = state.getIn(['players', playerIndex, 'board', toPosition]);
    state = state.setIn(['players', playerIndex, 'board', toPosition], piece);
    state = await checkPieceUpgrade(state, playerIndex, piece, toPosition);
  }
  if (shouldSwap && !f.isUndefined(newPiece)) {
    if (f.checkHandUnit(fromPosition)) {
      state = state.setIn(['players', playerIndex, 'hand', fromPosition], newPiece.set('position', fromPosition));
    } else {
      state = state.setIn(['players', playerIndex, 'board', fromPosition], newPiece.set('position', fromPosition));
      state = await checkPieceUpgrade(state, playerIndex, newPiece, fromPosition);
    }
  }
  return state;
}

exports._placePiece = async (stateParam, playerIndex, fromPosition, toPosition, shouldSwap = 'true') => {
  return placePiece(stateParam, playerIndex, fromPosition, toPosition, shouldSwap);
}

/**
 * Get first available spot on hand
 */
async function getFirstAvailableSpot(state, playerIndex){
  const hand = state.getIn(['players', playerIndex, 'hand']);
  // console.log('@getFirst', hand.keys().value)
  for (let i = 0; i < 8; i++) {
    // Get first available spot on bench
    const pos = f.pos(i);
    // console.log('inner', hand.get(pos), hand.get(String(pos)))
    if (f.isUndefined(hand.get(pos)) && f.isUndefined(hand.get(String(pos)))) {
      return pos;
    }
  }
  // Returns undefined if hand is full
  return undefined;
}

/**
 * WithdrawPiece from board to best spot on bench
 * * Assumes not bench is full
 */
async function withdrawPiece(state, playerIndex, piecePosition) {
  let benchPosition = await getFirstAvailableSpot(state, playerIndex);
  return placePiece(state, playerIndex, piecePosition, benchPosition, false);
}

exports._withdrawPiece = async (state, playerIndex, piecePosition) => {
  return withdrawPiece(state, playerIndex, piecePosition);
}

/**
 * When units are sold, when level 1, a level 1 unit should be added to discarded_pieces
 * Level 2 => 3 level 1 units, Level 3 => 9 level 1 units
 */
async function discardBaseUnits(state, name, depth = '1') {
  const unitStats = await pokemonJS.getStats(name);
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
  // Make this into method, taking pos and get/set, if set take argument to set
  if (f.checkHandUnit(piecePosition)) {
    pieceTemp = state.getIn(['players', playerIndex, 'hand', piecePosition]);
  } else {
    pieceTemp = state.getIn(['players', playerIndex, 'board', piecePosition]);
  }
  const piece = pieceTemp;
  const unitStats = await pokemonJS.getStats(piece.get('name'));
  const cost = unitStats.get('cost');
  const gold = state.getIn(['players', playerIndex, 'gold']);
  let newState = state.setIn(['players', playerIndex, 'gold'], +gold + +cost);
  if (f.checkHandUnit(piecePosition)) {
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
  const x = f.x(closestEnemyPos);
  const y = f.y(closestEnemyPos);
  for (let i = range; i >= 1; i--) {
    if (team === 0) { // S team
      if (f.isUndefined(board.get(f.pos(x, y - i)))) { // S
        return f.pos(x, y - i);
      } if (f.isUndefined(board.get(f.pos(x - i, y - i)))) { // SW
        return f.pos(x - i, y - i);
      } if (f.isUndefined(board.get(f.pos(x + i, y - i)))) { // SE
        return f.pos(x + i, y - i);
      } if (f.isUndefined(board.get(f.pos(x - i, y)))) { // W
        return f.pos(x - i, y);
      } if (f.isUndefined(board.get(f.pos(x + i, y)))) { // E
        return f.pos(x + i, y);
      } if (f.isUndefined(board.get(f.pos(x, y + i)))) { // N
        return f.pos(x, y + i);
      } if (f.isUndefined(board.get(f.pos(x - i, y + i)))) { // NW
        return f.pos(x - i, y + i);
      } if (f.isUndefined(board.get(f.pos(x + i, y + i)))) { // NE
        return f.pos(x + i, y + i);
      }
    } else { // N team
      if (f.isUndefined(board.get(f.pos(x, y + i)))) { // N
        return f.pos(x, y + i);
      } if (f.isUndefined(board.get(f.pos(x + i, y + i)))) { // NE
        return f.pos(x + i, y + i);
      } if (f.isUndefined(board.get(f.pos(x - i, y + i)))) { // NW
        return f.pos(x - i, y + i);
      } if (f.isUndefined(board.get(f.pos(x + i, y)))) { // E
        return f.pos(x + i, y);
      } if (f.isUndefined(board.get(f.pos(x - i, y)))) { // W
        return f.pos(x - i, y);
      } if (f.isUndefined(board.get(f.pos(x, y - i)))) { // S
        return f.pos(x, y - i);
      } if (f.isUndefined(board.get(f.pos(x + i, y - i)))) { // SE
        return f.pos(x + i, y - i);
      } if (f.isUndefined(board.get(f.pos(x - i, y - i)))) { // SW
        return f.pos(x - i, y - i);
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
  // f.print(board, '@getClosestEnemy board')
  const x = f.x(unitPos);
  const y = f.y(unitPos);
  const enemyTeam = 1 - team;
  for (let i = 1; i <= 8; i++) {
    const withinRange = i <= range;
    // console.log(withinRange, x, y, i, (x-i), (y-i))
    for (let j = x - i; j <= x + i; j++) {
      if (!f.isUndefined(board.get(f.pos(j, y - i))) && board.get(f.pos(j, y - i)).get('team') === enemyTeam) { // SW
        return Map({ closestEnemy: f.pos(j, y - i), withinRange });
      } if (!f.isUndefined(board.get(f.pos(j, y + i))) && board.get(f.pos(j, y + i)).get('team') === enemyTeam) { // NW
        return Map({ closestEnemy: f.pos(j, y + i), withinRange });
      }
    }
    for (let j = y - i + 1; j < y + i; j++) {
      if (!f.isUndefined(board.get(f.pos(x - i, j))) && board.get(f.pos(x - i, j)).get('team') === enemyTeam) { // SW
        return Map({ closestEnemy: f.pos(x - i, j), withinRange });
      } if (!f.isUndefined(board.get(f.pos(x + i, j))) && board.get(f.pos(x + i, j)).get('team') === enemyTeam) { // NW
        return Map({ closestEnemy: f.pos(x + i, j), withinRange });
      }
    }
  }
  f.print(board, '@getClosestEnemy Returning undefined: Board\n');
  console.log('@getClosestEnemy Returning undefined: ', x, y, range, team);
  return undefined;
}

/**
 * Remove hp from unit
 * Remove unit if hp <= 0
 * Percent currently not used, hp to remove calculated before hand
 * ({board, unitDied})
 */
async function removeHpBattle(board, unitPos, hpToRemove, percent = false) {
  const currentHp = board.getIn([unitPos, 'hp']);
  // console.log('@removeHpBattle', hpToRemove)
  let newHp = currentHp - hpToRemove;
  if (percent) {
    const maxHp = (await pokemonJS.getStats(board.get(unitPos).get('name'))).get('hp');
    newHp = await Math.round(currentHp - (maxHp * hpToRemove)); // HptoRemove is percentage to remove
  }
  if (newHp <= 0) {
    console.log('@removeHpBattle UNIT DIED!', currentHp, '->', (percent ? `${newHp}(%)` : `${newHp}(-)`));
    return Map({ board: board.delete(unitPos), unitDied: true });
  }
  // Caused a crash0
  if (isNaN(currentHp - hpToRemove)) {
    console.log('Exiting (removeHpBattle) ... ', currentHp, hpToRemove, board.get(unitPos));
    console.log(hpToRemove);
    process.exit();
  }
  return Map({ board: board.setIn([unitPos, 'hp'], newHp), unitDied: false });
}

/**
 * Increases mana for both units on board
 * Returns updated board
 * Supports enemy being dead
 * TODO: Maybe, Load from defaults here, so mana stats don't have to be stored in vain
 */
async function manaIncrease(board, unitPos, enemyPos) {
  const unitMana = board.get(unitPos).get('mana');
  const unitManaInc = board.get(unitPos).get('mana_hit_given');
  const newBoard = board.setIn([unitPos, 'mana'], +unitMana + +unitManaInc);
  if (!f.isUndefined(enemyPos)) {
    const enemyMana = board.get(enemyPos).get('mana');
    const enemyManaInc = board.get(enemyPos).get('mana_hit_taken');
    return newBoard.setIn([enemyPos, 'mana'], +enemyMana + +enemyManaInc);
  }
  return newBoard;
}

/**
 * Calculate amount of damage to be dealt to defender
 * Take defense of defender into account
 * Take type differences into account
 * Calculate factor against both defending types (if super effective against both, 4x damage)
 * Attack should use one type, main one preferrbly
 * Temp: Assumed typesAttacker is first listed type for normal attacks, set in ability for abilities
 * Power might be wanted
 */
async function calcDamage(actionType, power, unit, target, attackerType) { // attack, defense, typesAttacker, typesDefender
  // console.log('@calcDamage', unit, target)
  const factor = gameConstantsJS.getDamageFactorType(actionType) * power * (unit.get('attack') / target.get('defense'));
  const typeFactor = await typesJS.getTypeFactor(attackerType, target.get('type'));
  console.log('@calcDamage returning: ', typeFactor, '*', Math.round(factor), '+ 1 =', Math.round(factor * typeFactor + 1));
  return Math.round(factor * typeFactor + 1);
}

/**
 * Heals unit at unitPos by heal amount, not over max hp
 */
async function healUnit(board, unitPos, heal) {
  const maxHp = (await pokemonJS.getStats(board.get(unitPos).get('name'))).get('hp');
  const newHp = (board.getIn([unitPos, 'hp']) + heal >= maxHp ? maxHp : board.getIn([unitPos, 'hp']) + heal);
  return board.setIn([unitPos, 'hp'], newHp);
}

/**
 * Use ability
 * Remove mana for spell
 * noTarget functionality
 * Damage unit if have power
 * Temp: Move noTarget out of here
 * Doesn't support aoe currently
 * TODO: Mark the specific information in move
 *    Attempt fix by effectMap
 * currently: returns board
 * new: {board, effect} where effect = abilityTriggers contain heals or dot
 */
async function useAbility(board, ability, damage, unitPos, target) {
  const manaCost = ability.get('mana') || abilitiesJS.getAbilityDefault('mana');
  let newBoard = board.setIn([unitPos, 'mana'], board.getIn([unitPos, 'mana']) - manaCost);
  let effectMap = Map({});
  if (!f.isUndefined(ability.get('effect'))) {
    const effect = ability.get('effect');
    const mode = (f.isUndefined(effect.size) ? effect : effect.get(0));
    const args = (f.isUndefined(effect.size) ? undefined : effect.shift(0));
    console.log('@useAbility mode', mode, ', args', args);
    switch (mode) {
      case 'buff':
        if (!f.isUndefined(args)) { // Args: Use buff on self on board [buffType, amount]
          const buffValue = newBoard.getIn([unitPos, args.get(0)]) + args.get(1);
          newBoard = newBoard.setIn([unitPos, args.get(0)], buffValue);
          effectMap = effectMap.setIn([unitPos, `buff${args.get(0)}`], buffValue);
        }
      case 'teleport':
      case 'transform':
      case 'noTarget':
        console.log('@useAbility - noTarget return for mode =', mode);
        return Map({ board: Map({ board: newBoard }) });
      case 'lifesteal':
        const lsFactor = (!f.isUndefined(args) ? args.get(0) : abilitiesJS.getAbilityDefault('lifestealValue'));
        newBoard = await healUnit(newBoard, unitPos, lsFactor * damage);
        effectMap = effectMap.setIn([unitPos, 'heal'], lsFactor * damage);
        break;
      case 'dot':
        const accuracy = (!f.isUndefined(args) ? args.get(0) : abilitiesJS.getAbilityDefault('dotAccuracy'));
        const dmg = (!f.isUndefined(args) ? args.get(1) : abilitiesJS.getAbilityDefault('dotDamage'));
        if (dmg > (newBoard.getIn([target, 'dot']) || 0)) {
          if (Math.random() < accuracy) { // Successfully puts poison
            console.log(' --- Poison hit on ', target);
            newBoard = await newBoard.setIn([target, 'dot'], dmg);
            effectMap = effectMap.setIn([target, 'dot'], dmg);
          }
        }
        break;
      case 'aoe':
        // TODO - Can it even be checked here first? Probably before this stage
        break;
      case 'multiStrike':
        const percentages = abilitiesJS.getAbilityDefault('multiStrikePercentage');
        const r = Math.random();
        let sum = 0;
        for (let i = 0; i < 4; i++) {
          sum += percentages.get(i);
          if (r <= sum) { // 2-5 hits
            damage *= (2 + i);
            effectMap = effectMap.setIn([unitPos, 'multiStrike'], (2 + i));
            break;
          }
        }
        break;
      default:
        console.log('@useAbility - default, mode =', mode);
    }
  }
  return Map({ board: (await removeHpBattle(newBoard, target, damage)), effect: effectMap });
}

/**
 * Is battle over?
 */
async function isBattleOver(board, team) {
  // console.log('@isBattleOver Check me', board, team)
  const keysIter = board.keys();
  let tempUnit = keysIter.next();
  while (!tempUnit.done) {
    // console.log('in battleover: ', board.get(tempUnit.value).get('team'))
    if (board.get(tempUnit.value).get('team') === 1 - team) {
      return false;
    }
    tempUnit = keysIter.next();
  }
  return true;
}

/**
 * Convert damage in percentage to value
 */
async function dmgPercToHp(board, unitPos, percentDmg) {
  const maxHp = (await pokemonJS.getStats(board.get(unitPos).get('name'))).get('hp');
  return Math.round(maxHp * percentDmg);
}

/**
 * Gives new board after dot damage is handled for unit
 * Returns Map({board, damage, unitDied})
 */
async function handleDotDamage(board, unitPos, team) {
  const dot = board.getIn([unitPos, 'dot']);
  if (!f.isUndefined(dot)) {
    const dmgHp = await dmgPercToHp(board, unitPos, dot);
    const removedHPBoard = await removeHpBattle(board, unitPos, dmgHp); // {board, unitDied}
    const newBoard = removedHPBoard.get('board');
    return Map({ board: newBoard, damage: dmgHp, unitDied: removedHPBoard.get('unitDied') });
  }
  return Map({ board });
}

/**
 * Deletes all entries for a unit so allowed same move cant be used to attack those units
 * If a unit dies, the people that previously attacked that unit have to select new target
 */
async function deleteNextMoveResultEntries(unitMoveMapParam, targetToRemove) {
  // console.log('@deleteNextMoveResultEntries', targetToRemove)
  let unitMoveMap = unitMoveMapParam;
  const keysIter = unitMoveMap.keys();
  let tempUnit = keysIter.next();
  while (!tempUnit.done) {
    const tempPrevMove = unitMoveMap.get(tempUnit.value);
    const target = tempPrevMove.get('nextMove').get('target');
    const invalidPrevTarget = targetToRemove;
    if (f.x(target) === f.x(invalidPrevTarget) && f.y(target) === f.y(invalidPrevTarget)) {
      unitMoveMap = await unitMoveMap.delete(tempUnit.value);
      // console.log('Deleting prevMove for: ', tempUnit.value, nextMoveResult.get('nextMove').get('target'))
    }
    tempUnit = keysIter.next();
  }
  return unitMoveMap;
}

/**
 * Next move calculator
 * If mana is full use spell
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
  if (unit.get('mana') >= 100) { // Use spell, && withinRange for spell
    // TODO AOE spell logic
    // Idea: Around every adjacent enemy in range of 1 from closest enemy
    const team = unit.get('team');
    const ability = await abilitiesJS.getAbility(unit.get('name'));
    // TODO Check aoe / notarget here instead
    // console.log('@spell ability', ability)
    // TODO: Some ability still crashes - oddish fixed
    if(f.isUndefined(ability)){
      console.log(unit.get('name') + ' buggy ability')
    }
    const range = (!f.isUndefined(ability.get('acc_range')) && !f.isUndefined(ability.get('acc_range').size)
      ? ability.get('acc_range').get(1) : abilitiesJS.getAbilityDefault('range'));
    const enemyPos = await getClosestEnemy(board, unitPos, range, team);
    const action = 'spell';
    const target = await enemyPos.get('closestEnemy');
    // console.log('@nextmove - ability target: ', target, enemyPos)
    const abilityDamage = await calcDamage(action, (ability.get('power') || 0), unit, board.get(target), ability.get('type'));
    const abilityName = ability.get('name');
    const abilityResult = await useAbility(board, ability, abilityDamage, unitPos, target);
    // console.log('@abilityResult', abilityResult)
    const removedHPBoard = abilityResult.get('board');
    const effect = abilityResult.get('effect');
    // Do game over check
    const newBoard = removedHPBoard.get('board');
    // console.log('@spell', newBoard)
    let battleOver = false;
    if (removedHPBoard.get('unitDied')) {
      battleOver = await isBattleOver(newBoard, team);
    }
    const move = Map({
      unitPos, action, value: abilityDamage, abilityName, target, effect,
    });
    return Map({
      nextMove: move,
      newBoard,
      battleOver,
    });
  }
  const range = unit.get('range') || pokemonJS.getStatsDefault('range');
  const team = unit.get('team');
  let tarpos;
  if (!f.isUndefined(optPreviousTarget)) {
    tarpos = Map({ closestEnemy: optPreviousTarget, withinRange: true });
  } else {
    tarpos = getClosestEnemy(board, unitPos, range, team);
  }
  const enemyPos = tarpos; // await
  if (enemyPos.get('withinRange')) { // Attack action
    const action = 'attack';
    const target = enemyPos.get('closestEnemy');
    const attackerType = (!f.isUndefined(unit.get('type').size) ? unit.get('type').get(0) : unit.get('type'));
    // console.log('@nextmove - normal attack target: ', target, enemyPos)
    const value = await calcDamage(action, unit.get('attack'), unit, board.get(target), attackerType);
    // Calculate newBoard from action
    const removedHPBoard = await removeHpBattle(board, target, value); // {board, unitDied}
    const newBoard = removedHPBoard.get('board');
    let battleOver = false;
    let allowSameMove = false;
    let newBoardMana;
    if (removedHPBoard.get('unitDied')) { // Check if battle ends
      battleOver = await isBattleOver(newBoard, team);
      newBoardMana = await manaIncrease(newBoard, unitPos); // target = dead
    } else { // Mana increase, return newBoard
      allowSameMove = true;
      newBoardMana = await manaIncrease(newBoard, unitPos, target);
    }
    const move = Map({
      unitPos, action, value, target,
    });
    return Map({
      nextMove: move,
      newBoard: newBoardMana,
      allowSameMove,
      battleOver,
    });
  } // Move action
  const closestEnemyPos = enemyPos.get('closestEnemy');
  const movePos = getMovePos(board, closestEnemyPos, range, team);
  const newBoard = board.set(movePos, unit.set('position', movePos)).delete(unitPos);
  const action = 'move';
  const move = Map({ unitPos, action, target: movePos });
  return Map({ nextMove: move, newBoard });
}

/**
 * Returns position of unit with the next move
 */
async function getUnitWithNextMove(board) {
  // console.log('@getUnitWithNextMove',board)
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
  // Decide order of equal next move units
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
  // f.print(board, '@startBattle')
  let battleOver = false;

  // First move for all units first
  // Remove first_move from all units when doing first movement
  // First move used for all units (order doesn't matter) and set next_move to + speed accordingly
  // Update actionStack and board accordingly
  const iter = board.keys();
  let temp = iter.next();
  while (!temp.done) {
    const unitPos = temp.value;
    const action = 'move';
    const unit = board.get(unitPos);
    const target = unit.get('first_move');
    const time = 0;
    const move = Map({
      unitPos, action, target, time,
    });
    actionStack = actionStack.push(move);
    const newUnit = unit.set('next_move', +unit.get('next_move') + +unit.get('speed'))
      .delete('first_move');
    board = board.set(unitPos, newUnit);
    temp = iter.next();
  }
  // Start battle
  while (!battleOver) {
    board = await board;
    const nextUnitToMove = await getUnitWithNextMove(board);
    const unit = board.get(nextUnitToMove);
    // console.log('\n@startbattle Next unit to do action: ', nextUnitToMove);
    const nextMoveBoard = board.setIn([nextUnitToMove, 'next_move'], +unit.get('next_move') + +unit.get('speed'));
    const previousMove = unitMoveMap.get(nextUnitToMove);
    // console.log(' --- ', (f.isUndefined(previousMove) ? '' : previousMove.get('nextMove').get('target')), nextUnitToMove)
    let nextMoveResult;
    if (!f.isUndefined(previousMove)) { // Use same target as last round
      // console.log('previousMove in @startBattle', previousMove.get('nextMove').get('target'));
      const previousTarget = previousMove.get('nextMove').get('target');
      nextMoveResult = await nextMove(nextMoveBoard, nextUnitToMove, previousTarget);
    } else {
      nextMoveResult = await nextMove(nextMoveBoard, nextUnitToMove);
    }
    const result = await nextMoveResult;
    battleOver = result.get('battleOver');
    const madeMove = result.get('nextMove').set('time', unit.get('next_move'));
    f.printBoard(result.get('newBoard'), madeMove);

    actionStack = actionStack.push(madeMove);
    if (result.get('allowSameMove')) { // Attack on target in same position for example
      unitMoveMap = unitMoveMap.set(nextUnitToMove, nextMoveResult);
      // console.log(' allowing same move, setting for', nextUnitToMove, unitMoveMap.get(nextUnitToMove).get('nextMove').get('target'))
    } else {
      // Delete every key mapping to nextMoveResult
      const nextMoveAction = nextMoveResult.get('nextMove').get('action');
      if (nextMoveAction === 'attack' || nextMoveAction === 'spell') { // Unit attacked died
        // console.log('Deleting all keys connected to this: ', nextMoveResult.get('nextMove').get('target'))
        unitMoveMap = await deleteNextMoveResultEntries(unitMoveMap, nextMoveResult.get('nextMove').get('target'));
      } else if (nextMoveAction === 'move') { // Unit moved, remove units that used to attack him
        // console.log('Deleting all keys connected to this: ', nextUnitToMove)
        unitMoveMap = await deleteNextMoveResultEntries(unitMoveMap, nextUnitToMove);
      }
    }
    board = result.get('newBoard');
    if (battleOver) break; // Breaks if battleover (no dot damage if last unit standing)
    // Dot damage
    const team = board.getIn([nextUnitToMove, 'team']);
    const dotObj = await handleDotDamage(board, nextUnitToMove, team);
    if (!f.isUndefined(dotObj.get('damage'))) {
      board = await dotObj.get('board');
      // console.log('@dotDamage battleover', battleOver, dotObj.get('battleOver'), battleOver || dotObj.get('battleOver'));
      const action = 'dotDamage';
      const dotDamage = dotObj.get('damage');
      const move = await Map({
        unitPos: nextUnitToMove, action, value: dotDamage, target: nextUnitToMove,
      });
      // console.log('dot damage dealt!', board);
      if (dotObj.get('unitDied')) { // Check if battle ends
        console.log('@dot - unitdied');
        battleOver = battleOver || await isBattleOver(board, 1 - team);
        // Delete every key mapping to nextMoveResult
        // console.log('Deleting all keys connected to this: ', nextMoveResult.get('nextMove').get('target'))
        unitMoveMap = await deleteNextMoveResultEntries(unitMoveMap, move);
      }
      // console.log('@dotDamage', dotDamage);
      f.printBoard(board, move);
      actionStack = actionStack.push(Map({ nextMove: move, newBoard: board }).set('time', unit.get('next_move')));
    }
  }
  const newBoard = await board;
  // Return the winner
  // f.print(newBoard, '@startBattle newBoard after');
  // f.print(actionStack, '@startBattle actionStack after');
  console.log('@Last - A Survivor', newBoard.keys().next().value, newBoard.get(newBoard.keys().next().value).get('name'));
  const team = newBoard.get(newBoard.keys().next().value).get('team');
  const winningTeam = team;
  return Map({ actionStack, board: newBoard, winner: winningTeam });
}


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
    // console.log('\n@setRandomFirstMove', board)
    newBoard = newBoard.setIn([unitPos, 'first_move'], newPos);
    tempUnit = boardKeysIter.next();
  }
  return newBoard;
}
/*
  // While temp
  const iter = map.keys();
  let temp = iter.next();
  while (!temp.done) {

    temp = iter.next();
  }
*/

/**
 * Counts unique occurences of piece on board connected to each team
 * Puts them in a map and returns it
 * Map({0: Map({grass: 3, fire: 2}), 1: Map({normal: 5})})
 * Set(['pikachu']) (no more pikachus or raichus)
 */
async function countUniqueOccurences(board) {
  const boardKeysIter = board.keys();
  let tempUnit = boardKeysIter.next();
  let buffMap = Map({ 0: Map({}), 1: Map({}) });
  let unique = Map({ 0: Set([]), 1: Set([]) });
  while (!tempUnit.done) {
    const unitPos = tempUnit.value;
    const unit = board.get(unitPos);
    const name = unit.get('name');
    const team = await unit.get('team');
    // console.log(unique, team, unit, unitPos)
    // console.log('@countUniqueOccurences', unique.get(String(team)), pokemonJS.getBasePokemon(name))
    if (!unique.get(String(team)).has(pokemonJS.getBasePokemon(name))) { // TODO: Check
      const newSet = await unique.get(String(team)).add(name);
      unique = await unique.set(team, newSet); // Store unique version, only count each once
      const types = unit.get('type'); // Value or List
      if (!f.isUndefined(types.size)) { // List
        for (let i = 0; i < types.size; i++) {
          buffMap = buffMap.setIn([String(team), types.get(i)], (buffMap.getIn([String(team), types.get(i)]) || 0) + 1);
        }
      } else { // Value
        buffMap = buffMap.setIn([String(team), types], (buffMap.getIn([String(team), types]) || 0) + 1);
        // console.log('adding type occurence', name, team, buffMap.getIn([String(team), types]))
      }
    }
    tempUnit = boardKeysIter.next();
  }
  return buffMap;
}

/**
 * Give bonuses from types
 * Type bonus is either only for those of that type or all units
 */
async function markBoardBonuses(board) {
  const buffMap = await countUniqueOccurences(board);

  // Map({0: Map({grass: 40})})
  let typeBuffMapSolo = Map({ 0: Map({}), 1: Map({}) }); // Solo buffs, only for that type
  let typeBuffMapAll = Map({ 0: Map({}), 1: Map({}) }); // For all buff
  let typeEnemyDebuffMap = Map({ 0: Map({}), 1: Map({}) }); // For all enemies debuffs
  // Find if any bonuses need applying
  for (let i = 0; i <= 1; i++) {
    const buffsKeysIter = buffMap.get(String(i)).keys();
    let tempBuff = buffsKeysIter.next();
    while (!tempBuff.done) {
      const buff = tempBuff.value;
      const amountBuff = buffMap.get(String(i)).get(buff);
      for (let j = 1; j <= 3; j++) {
        if (typesJS.hasBonus(buff) && amountBuff >= typesJS.getTypeReq(buff, j)) {
          // console.log('@markBoardBonuses', amountBuff, typesJS.getTypeReq(buff, i))
          switch (typesJS.getBonusType(buff)) {
            case 'bonus':
              typeBuffMapSolo = typeBuffMapSolo.setIn([String(i), buff], (typeBuffMapSolo.get(String(i)).get(buff) || 0) + typesJS.getBonusAmount(buff, j));
              break;
            case 'allBonus':
              typeBuffMapAll = typeBuffMapAll.setIn([String(i), buff], (typeBuffMapAll.get(String(i)).get(buff) || 0) + typesJS.getBonusAmount(buff, j));
              break;
            case 'enemyDebuff':
              typeEnemyDebuffMap = typeEnemyDebuffMap.setIn([String(i), buff], (typeEnemyDebuffMap.get(String(i)).get(buff) || 0) + typesJS.getBonusAmount(buff, j));
              break;
            default:
              console.log(`Ability bonus type error ... Error found for ${typesJS.getBonusType(buff)}`);
              process.exit();
          }
        } else {
          break;
        }
      }
      tempBuff = buffsKeysIter.next();
    }
  }

  // Apply buff
  const boardKeysIter = board.keys();
  let tempUnit = boardKeysIter.next();
  let newBoard = board;
  while (!tempUnit.done) {
    const unitPos = tempUnit.value;
    const unit = board.get(unitPos);
    const team = unit.get('team');
    // Solo buffs
    const types = board.get(unitPos).get('type'); // Value or List
    if (!f.isUndefined(types.size)) { // List
      for (let i = 0; i < types.size; i++) {
        if (!f.isUndefined(typeBuffMapSolo.get(String(team)).get(types.get(i)))) {
          const newUnit = typesJS.getBuffFuncSolo(types.get(i))(unit, typeBuffMapSolo.get(String(team)).get(types.get(i)))
            .set('buff', (unit.get('buff') || List([])).push(typesJS.getType(types.get(i)).get('name'))); // Add buff to unit
          newBoard = await newBoard.set(unitPos, newUnit);
        }
      }
    } else { // Value
      // console.log(typeBuffMapSolo.get(String(team)), typeBuffMapSolo.get(String(team)).get(types), types, team)
      if (!f.isUndefined(typeBuffMapSolo.get(String(team)).get(types))) {
        // console.log(typesJS.getBuffFuncSolo(types))
        const newUnit = typesJS.getBuffFuncSolo(types)(unit, typeBuffMapSolo.get(String(team)).get(types))
          .set('buff', (unit.get('buff') || List([])).push(typesJS.getType(types).get('name'))); // Add buff to unit
        newBoard = await newBoard.set(unitPos, newUnit);
      }
    }

    // All buffs
    const allBuffIter = typeBuffMapAll.get(String(team)).keys();
    let tempBuffAll = allBuffIter.next();
    while (!tempBuffAll.done) {
      const buff = tempBuffAll.value;
      const bonusValue = typeBuffMapAll.get(String(team)).get(buff);
      const buffText = `${buff} +${bonusValue}`;
      const newUnit = typesJS.getBuffFuncAll(buff)(newBoard.get(unitPos), bonusValue)
        .set('buff', (newBoard.get(unitPos).get('buff') || List([])).push(buffText));
      newBoard = await newBoard.set(unitPos, newUnit);
      tempBuffAll = allBuffIter.next();
    }

    // Enemy buffs
    const enemyTeam = 1 - team;
    const enemyDebuffIter = typeEnemyDebuffMap.get(String(enemyTeam)).keys();
    let tempEnemy = enemyDebuffIter.next();
    while (!tempEnemy.done) {
      const buff = tempEnemy.value;
      const bonusValue = typeBuffMapAll.get(String(enemyTeam)).get(buff);
      const buffText = `${buff} -${bonusValue}`;
      const newUnit = typesJS.getBuffFuncAll(buff)(newBoard.get(unitPos), bonusValue)
        .set('buff', (newBoard.get(unitPos).get('buff') || List([])).push(buffText));
      newBoard = await newBoard.set(unitPos, newUnit);
      tempEnemy = enemyDebuffIter.next();
    }
    tempUnit = boardKeysIter.next();
  }
  return newBoard;
}

/**
 * Create unit for board battle from createBoardUnit unit given newpos/pos and team
 */
async function createBattleUnit(unit, unitPos, team) {
  const unitStats = await pokemonJS.getStats(unit.get('name'));
  return unit.set('team', team).set('attack', unitStats.get('attack')).set('hp', unitStats.get('hp'))
    .set('type', unitStats.get('type'))
    .set('next_move', unitStats.get('next_move') || pokemonJS.getStatsDefault('next_move'))
    .set('ability', unitStats.get('ability'))
    .set('mana', unitStats.get('mana') || pokemonJS.getStatsDefault('mana'))
    .set('defense', unitStats.get('defense') || pokemonJS.getStatsDefault('defense'))
    .set('speed', pokemonJS.getStatsDefault('upperLimitSpeed') - (unitStats.get('speed') || pokemonJS.getStatsDefault('speed')))
    .set('mana_hit_given', unitStats.get('mana_hit_given') || pokemonJS.getStatsDefault('mana_hit_given'))
    .set('mana_hit_taken', unitStats.get('mana_hit_taken') || pokemonJS.getStatsDefault('mana_hit_taken'))
    .set('position', unitPos);
}

/**
 * Combines two boards into one for battle
 * Adds all relevant stats for the unit to the unit
 * Reverses position for enemy units
 */
async function combineBoards(board1, board2) {
  const keysIter = board1.keys();
  let tempUnit = keysIter.next();
  let newBoard = Map({});
  while (!tempUnit.done) {
    const unitPos = tempUnit.value;
    const unit = board1.get(unitPos);
    const battleUnit = await createBattleUnit(unit, unitPos, 0);
    newBoard = await newBoard.set(unitPos, battleUnit);
    tempUnit = keysIter.next();
  }
  const keysIter2 = board2.keys();
  tempUnit = keysIter2.next();
  while (!tempUnit.done) {
    const unitPos = tempUnit.value;
    const newUnitPos = f.reverseUnitPos(unitPos); // Reverse unitPos
    const unit = board2.get(unitPos);
    const battleUnit = await createBattleUnit(unit, newUnitPos, 1);
    newBoard = await newBoard.set(newUnitPos, battleUnit);
    tempUnit = keysIter2.next();
  }
  return newBoard;
}

/**
 * Spawn opponent in reverse board
 * Mark owners of units
 * Start battle
 */
async function prepareBattle(board1, board2) {
  // Check to see if a battle is required
  // Lose when empty, even if enemy no units aswell (tie with no damage taken)
  if (board1.size === 0) {
    return Map({ actionStack: List([]), winner: 1 });
  } if (board2.size === 0) {
    return Map({ actionStack: List([]), winner: 0 });
  }

  // Both players have units, battle required
  const board = await combineBoards(board1, board2);
  // f.print(board, '@prepareBattle')
  const boardWithBonuses = await markBoardBonuses(board);
  // f.print(boardWithBonuses);
  const boardWithMovement = await setRandomFirstMove(boardWithBonuses);
  const result = await startBattle(boardWithMovement);
  return result.set('startBoard', boardWithMovement);
}

/**
 * Randomize Opponents for state
 * TODO: Randomize opponent pairs, shuffle indexes before iterator
 *    Make a system so people have higher odds of meeting each other at the same time
 * Temp: Always face next player in order
 * * Assumes board contains every player's updated board
 */
async function battleTime(stateParam) {
  let state = stateParam;
  let actionStacks = Map({});
  let startingBoards = Map({});
  const playerIter = state.get('players').keys();
  let tempPlayer = playerIter.next();
  let iter;
  let nextPlayer;
  const firstPlayer = tempPlayer.value;
  // TODO: Future: All battles calculate concurrently
  while (true) {
    const currentPlayer = tempPlayer.value;
    iter = playerIter.next();
    if (iter.done) {
      nextPlayer = firstPlayer;
    } else {
      nextPlayer = iter.value;
    }
    const index = currentPlayer;
    const enemy = nextPlayer;
    // console.log('@battleTime pairing: ', pairing, nextPlayer);
    const board1 = state.getIn(['players', index, 'board']);
    const board2 = state.getIn(['players', enemy, 'board']);
    const result = prepareBattle(board1, board2);
    // {actionStack: actionStack, board: newBoard, winner: winningTeam, startBoard: initialBoard}
    const resultBattle = await result;

    // TODO: Send actionStack to frontend and startBoard
    const actionStack = resultBattle.get('actionStack');
    const startBoard = resultBattle.get('startBoard');
    actionStacks = actionStacks.set(index, actionStack);
    startingBoards = startingBoards.set(index, startBoard);

    const winner = (resultBattle.get('winner') === 0);
    const newBoard = resultBattle.get('board');
    // console.log('@battleTime newBoard, finished board result', newBoard); // Good print, finished board
    const round = state.get('round');
    const newStateAfterBattle = await endBattle(state, index, winner, newBoard, true, enemy);
    if(newStateAfterBattle.get('round') === round + 1){
      state = newStateAfterBattle;
    } else {
      state = state.setIn(['players', index], newStateAfterBattle.getIn(['players', index]));
    }
    // Store rivals logic
    const prevRivals = state.getIn(['players', index, 'rivals']);
    state = state.setIn(['players', index, 'rivals'], prevRivals.set(enemy, (prevRivals.get(enemy) || 0) + 1));
    if (iter.done) {
      break;
    } else {
      tempPlayer = iter;
    }
  }
  // Post battle state
  const newState = await state;
  return Map({}).set('state', newState).set('startingBoards', startingBoards).set('actionStacks', actionStacks);
}

async function npcRound(stateParam, npcBoard) {
  let state = stateParam;
  let actionStacks = Map({});
  let startingBoards = Map({});
  const playerIter = state.get('players').keys();
  let tempPlayer = playerIter.next();
  // TODO: Future: All battles calculate concurrently
  while (!tempPlayer.done) {
    const currentPlayer = tempPlayer.value;
    const board1 = state.getIn(['players', currentPlayer, 'board']);
    const result = prepareBattle(board1, npcBoard);
    // {actionStack: actionStack, board: newBoard, winner: winningTeam, startBoard: initialBoard}
    const resultBattle = await result;

    // TODO: Send actionStack to frontend and startBoard
    const actionStack = resultBattle.get('actionStack');
    const startBoard = resultBattle.get('startBoard');
    actionStacks = actionStacks.set(currentPlayer, actionStack);
    startingBoards = startingBoards.set(currentPlayer, startBoard);

    const winner = (resultBattle.get('winner') === 0);
    const newBoard = resultBattle.get('board');

    // TODO Npc: Give bonuses for beating npcs, special money or something
    const round = state.get('round');
    const newStateAfterBattle = await endBattle(state, currentPlayer, winner, newBoard, false);
    if(newStateAfterBattle.get('round') === round + 1){
      state = newStateAfterBattle;
    } else {
      state = state.setIn(['players', currentPlayer], newStateAfterBattle.getIn(['players', currentPlayer]));
    }
    tempPlayer = playerIter.next();
  }
  // Post battle state
  const newState = await state;
  return Map({}).set('state', newState).set('startingBoards', startingBoards).set('actionStacks', actionStacks);
}

/**
 * Board for player with playerIndex have too many units
 * Try to withdraw the cheapest unit
 * if hand is full, sell cheapest unit
 * Do this until board.size == level
 */
async function fixTooManyUnits(state, playerIndex){
  const board = state.getIn(['players', playerIndex, 'board']);
  // Find cheapest unit
  const iter = board.keys();
  let temp = iter.next();
  let cheapestCost = 100;
  let cheapestCostIndex = List([]);
  while (!temp.done) {
    const unitPos = temp.value;
    const cost = (await pokemonJS.getStats(board.get(unitPos).get('name'))).get('cost');
    if(cost < cheapestCost){
      cheapestCost = cost;
      cheapestCostIndex = List([unitPos]);
    } else if(cost == cheapestCost) {
      cheapestCostIndex = cheapestCostIndex.push(unitPos)
    }
    temp = iter.next();
  }
  let chosenUnit;
  if(cheapestCostIndex.size === 1){
    chosenUnit = cheapestCostIndex.get(0);
  } else {
    // TODO Check the one that provides fewest combos
    // Temp: Random from cheapest
    const chosenIndex = Math.random() * cheapestCostIndex.size;
    chosenUnit = cheapestCostIndex.get(chosenIndex); 
  }
  // Withdraw if possible unit, otherwise sell
  let newState;
  // TODO: Inform Client about update
  if(state.getIn(['players', playerIndex, 'hand']).size < 8){
    console.log('WITHDRAWING PIECE', board.get(chosenUnit).get('name'))
    newState = await withdrawPiece(state, playerIndex, chosenUnit);
  } else {
    console.log('SELLING PIECE', board.get(chosenUnit).get('name'))
    newState = await sellPiece(state, playerIndex, chosenUnit);
  }
  const newBoard = newState.getIn(['players', playerIndex, 'board']);
  const level = newState.getIn(['players', playerIndex, 'level']);
  if(newBoard.size > level) {
    return fixTooManyUnits(newState, playerIndex);
  }
  return newState.getIn(['players', playerIndex]);
}

/**
 * Check not too many units on board
 * Calculate battle for given board, either pvp or npc/gym round
 */
exports.battleSetup = async (stateParam) => {
  let state = stateParam;
  const iter = state.get('players').keys();
  let temp = iter.next();
  while (!temp.done) {
    const playerIndex = temp.value;
    const board = state.getIn(['players', playerIndex, 'board']);
    const level = state.getIn(['players', playerIndex, 'level']);
    if(board.size > level) {
      const newPlayer = await fixTooManyUnits(state, playerIndex);
      state = state.setIn(['players', playerIndex], newPlayer);
    }
    temp = iter.next();
  }
  const round = state.get('round');
  switch (gameConstantsJS.getRoundType(round)) {
    case 'pvp':
      return (await battleTime(state)).set('preBattleState', state);
    case 'npc':
      const boardNpc = await gameConstantsJS.getSetRound(round);
      return (await npcRound(state, boardNpc)).set('preBattleState', state);
    case 'gym':
      const boardGym = await gameConstantsJS.getSetRound(round);
      return (await npcRound(state, boardGym)).set('preBattleState', state);
  }
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
  const income_basic = state.get('income_basic') + 1;
  const round = state.get('round');
  state = state.set('round', round + 1);
  if (round <= 5) {
    state = state.set('income_basic', income_basic);
  }

  for (let i = 0; i < state.get('amountOfPlayers'); i++) {
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
    synchronizedPlayers = Map({});
    const newRoundState = await endTurn(newState);
    return newRoundState;
  }
  return state;
}

/**
 * Given a list of units, calculate damage to be removed from player
 * 1 point per level of unit
 * Units level is currently their cost
 * TODO: Balanced way of removing hp (level is exponentially bad for many units)
 */
async function calcDamageTaken(boardUnits) {
  if (f.isUndefined(boardUnits) || boardUnits.size === 0) {
    console.log('@calcDamageTaken Returning 0 ', boardUnits);
    return 0; // When there are no units left for the enemy, don't lose hp (A tie)
  }
  let sum = 0;
  // console.log('@calcDamageTaken', boardUnits.size, boardUnits)
  const keysIter = boardUnits.keys();
  let tempUnit = keysIter.next();
  while (!tempUnit.done) {
    const stats = await pokemonJS.getStats(boardUnits.get(tempUnit.value).get('name'));
    sum += +stats.get('cost');
    tempUnit = keysIter.next();
  }
  return sum;
}

/**
 * winner: Gain 1 gold
 * loser: Lose hp
 *      Calculate amount of hp to lose
 * Parameters: Enemy player index, winningAmount = damage? (units or damage)
 */
async function endBattle(stateParam, playerIndex, winner, finishedBoard, isPvP, enemyPlayerIndex) {
  let state = stateParam;
  // console.log('@endBattle', state, playerIndex, winner, enemyPlayerIndex);
  if(isPvP){
    const streak = state.getIn(['players', playerIndex, 'streak']) || 0;
    if (winner) {
      state = state.setIn(['players', playerIndex, 'gold'], state.getIn(['players', playerIndex, 'gold']) + 1);
      const newStreak = (streak < 0 ? 0 : +streak + 1);
      state = state.setIn(['players', playerIndex, 'streak'], newStreak);
    } else {
      const hpToRemove = await calcDamageTaken(finishedBoard);
      state = await removeHp(state, playerIndex, hpToRemove);
      const newStreak = (streak > 0 ? 0 : +streak - 1);
      state = state.setIn(['players', playerIndex, 'streak'], newStreak);
    }
  }
  const round = state.get('round');
  // console.log('@endBattle prep', stateParam.get('players'));
  const potentialEndTurn = await prepEndTurn(state, playerIndex);
  if (potentialEndTurn.get('round') === round + 1) {
    // TODO: Send information to users

  }
  return potentialEndTurn;
}

/**
 * Marks the only remaining player as the winner
 */
function gameOver(state) {
  const winningPlayer = state.get('players').values().next().value;
  console.log('GAME OVER, winner =', winningPlayer);
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
      return gameOver(removedPlayerState);
    }
    return removedPlayerState;
  }
  return state.setIn(['players', playerIndex, 'hp'], currentHp - hpToRemove);
}

/**
 * Initialize all shops for all players
 * Round already set to 1
 */
async function startGame(stateParam) {
  let state = stateParam;
  const iter = state.get('players').keys();
  let temp = iter.next();
  while (!temp.done) {
    state = await refreshShop(state, temp.value);
    temp = iter.next();
  }
  return state;
}

exports._startGame = async () => {
  const state = await initEmptyState(2);
  return await startGame(state);
};
