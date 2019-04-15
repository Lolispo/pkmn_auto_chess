// Author: Petter Andersson

const {
  Map, List, Set, fromJS,
} = require('immutable');

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
    discardedPieces: List([]),
    round: 1, // (gameConstantsJS.debugMode ? 8 : 1),
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
  console.log(`@refillPieces Refilling ${discardedPieces.size} units (Pieces size = ${pieces.size})`); // pieceStorage
  for (let i = 0; i < discardedPieces.size; i++) {
    const name = discardedPieces.get(i);
    const cost = (await pokemonJS.getStats(name)).get('cost');
    /*
    if (f.isUndefined(pieceStorage.get(0)) || f.isUndefined(pieceStorage.get(1)) || f.isUndefined(pieceStorage.get(2))
        || f.isUndefined(pieceStorage.get(3)) || f.isUndefined(pieceStorage.get(4))) {
      console.log('@refillPieces pieceStorage WAS UNDEFINED HERE', pieceStorage);
      for (let j = 0; j < 5; j++) {
        if (f.isUndefined(pieceStorage.get(j))) {
          pieceStorage = pieceStorage.set(j, List([]));
        }
      }
    }*/
    if(f.isUndefined(pieceStorage.get(cost - 1))) {
      console.log('@RefillPieces Undefined', cost - 1, pieceStorage.get(cost - 1), name);
      pieceStorage = await pieceStorage.set(cost - 1, List([]));
    }       
    pieceStorage = await f.push(pieceStorage, cost - 1, name);
    // console.log('@refillPieces', name);
  }
  return pieceStorage;
}

/**
 * Finds correct rarity for piece (random value)
 * Returns the piece taken from pieceStorage from correct rarity list
 * i is used to know which rarity it is checking (from 1 to 5)
 * Made sure after method that rarity contain pieces
 */
async function getPieceFromRarity(random, prob, index, pieceStorage, unitAmounts, newUnitAmounts) {
  let piece;
  let pieceIndex;
  if (prob > random) {
    if (f.isUndefined(unitAmounts)) {
      piece = pieceStorage.get(index).get(0);
      pieceIndex = 0;
    } else {
      const keys = Array.from(unitAmounts.keys());
      for (let i = 0; i < keys.length; i++) {
        const tempPiece = pieceStorage.get(index).get(i);
        if (!keys.includes(tempPiece) || (keys.includes(tempPiece) && (((unitAmounts.get(tempPiece) || 0) + (newUnitAmounts.get(tempPiece) || 0)) < 9))) {
          /*if (unitAmounts.get(tempPiece) === 8) 
          console.log('@getPieceFromRarity 8 Units, Adding one', (newUnitAmounts.get(tempPiece) || 0), (unitAmounts.get(tempPiece) || 0), tempPiece, 
          ((unitAmounts.get(tempPiece) || 0) + (newUnitAmounts.get(tempPiece) || 0)), unitAmounts, newUnitAmounts);*/
          piece = tempPiece;
          pieceIndex = i;
          break;
        }
      }
    }
  }
  return Map({ piece, index: pieceIndex });
}

/**
 * Updates shop with a new piece from getPieceFromRarity
 * Removes the piece from correct place in pieceStorage
 */
async function addPieceToShop(shop, pos, pieces, level, discPieces, player, newUnitAmounts) {
  const prob = gameConstantsJS.getPieceProbabilityNum(level);
  let newShop = shop;
  let newPieceStorage = pieces;
  let newDiscPieces = discPieces;
  // TODO: Get amount of units of different types
  // Units at 9 => add to not allowed list
  const unitAmounts = player.get('unitAmounts');
  // console.log('addPieceToShop LEVEL ', level, prob)
  for (let i = 0; i < 5; i++) { // Loop over levels
    // If any piece storage goes empty -> put all discarded pieces in pieces
    // console.log('@addPieceToShop', discPieces)
    if (newPieceStorage.get(i).size === 0) {
      newPieceStorage = await refillPieces(newPieceStorage, discPieces);
      newDiscPieces = List([]);
    }
    // TODO: In theory, pieces might still be empty here, if not enough pieces were in the deck.
    // Temp: Assumes enough pieces are available
    const random = Math.random();
    //console.log('Before call:', i, newUnitAmounts)
    const pieceObj = await getPieceFromRarity(random, prob[i], i, newPieceStorage, unitAmounts, newUnitAmounts);
    const piece = pieceObj.get('piece');
    const pieceIndex = pieceObj.get('index');
    if (!f.isUndefined(piece)) {
      const unitStats = await pokemonJS.getStats(piece);
      let newShopUnit = Map({
        name: piece,
        displayName: unitStats.get('displayName'),
        cost: unitStats.get('cost'),
        type: unitStats.get('type'),
      });
      if (unitStats.get('reqEvolve')) {
        newShopUnit = newShopUnit.set('reqEvolve', unitStats.get('reqEvolve'));
      }
      newShop = newShop.set(pos, newShopUnit);
      // Removes first from correct rarity array
      newPieceStorage = await f.removeFromPieceStorage(newPieceStorage, i, pieceIndex);
      newUnitAmounts = newUnitAmounts.set(piece, (newUnitAmounts.get(piece) || 0) + 1);
      //console.log('@newUnitAmounts', piece, newUnitAmounts);
      break;
    }
  }
  return { newShop, pieceStorage: newPieceStorage, discPieces: newDiscPieces, newUnitAmounts};
}

/**
 * Refresh shop
 * Generate newShop from pieces and update pieces to newPieces
 * Update discarded cards from previous shop
 * Add new shop
 * TODO: Add logic for piece cap, max 9 units
 */
async function refreshShop(stateParam, playerIndex) {
  let state = stateParam;
  const level = state.getIn(['players', playerIndex, 'level']);
  let newShop = Map({});
  let pieceStorage = state.get('pieces');
  let discPieces = state.get('discardedPieces');
  let newUnitAmounts = Map({});
  for (let i = 0; i < 5; i++) { // Loop over pieces
    if (!level) console.log('@refreshShop adding piece', level, playerIndex);
    const obj = await addPieceToShop(newShop, f.pos(i), pieceStorage, level, discPieces, state.getIn(['players', playerIndex]), newUnitAmounts);
    newShop = obj.newShop;
    pieceStorage = obj.pieceStorage;
    discPieces = obj.discPieces;
    newUnitAmounts = obj.newUnitAmounts;
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
    const shopToList = fromJS(Array.from(filteredShop.map((value, key) => value).values()));
    // console.log('@refreshShop:', shopToList, '(', pieceStorage.size, '/', discPieces.size, ')');
    state = state.set('discardedPieces', discPieces.concat(shopToList));
  }
  state = state.setIn(['players', playerIndex, 'shop'], newShop);
  state = state.set('pieces', pieceStorage);
  return state;
}

// Cost of 2 gold
exports.refreshShopGlobal = async (stateParam, index) => {
  const state = stateParam.setIn(['players', index, 'gold'], stateParam.getIn(['players', index, 'gold']) - 2);
  return refreshShop(state, index);
};

/**
 * Create unit for board/hand placement from name and spawn position
 */
async function getBoardUnit(name, x, y) {
  const unitInfo = await pokemonJS.getStats(name);
  if (f.isUndefined(unitInfo)) console.log('UNDEFINED:', name);
  // console.log('@getBoardUnit', name, unitInfo)
  let unit = Map({
    name,
    displayName: unitInfo.get('displayName'),
    position: f.pos(x, y),
    type: unitInfo.get('type'),
  });
  if (unitInfo.get('reqEvolve')) {
    unit = unit.set('reqEvolve', unitInfo.get('reqEvolve'));
  }
  return unit;
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
 * Get first available spot on hand
 */
async function getFirstAvailableSpot(state, playerIndex) {
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
 * *Assumed hand not full here
 * *Assumed can afford
 * Remove unit from shop
 * Add unit to hand
 * Remove money from player
 *  Amount of money = getUnit(unitId).cost
 */
exports.buyUnit = async (stateParam, playerIndex, unitID) => {
  let state = stateParam;
  // console.log('@buyunit', unitID, playerIndex, f.pos(unitID));
  // console.log(state.getIn(['players', playerIndex, 'shop']));
  let shop = state.getIn(['players', playerIndex, 'shop']);
  const unit = shop.get(f.pos(unitID)).get('name');
  if (!f.isUndefined(unit)) {
    shop = shop.delete(f.pos(unitID));
    state = state.setIn(['players', playerIndex, 'shop'], shop);

    const hand = state.getIn(['players', playerIndex, 'hand']);
    const unitInfo = await pokemonJS.getStats(unit);
    const handIndex = await getFirstAvailableSpot(state, playerIndex); // TODO: Go: Get first best hand index
    // console.log('@buyUnit handIndex', handIndex);
    const unitHand = await getBoardUnit(unit, f.x(handIndex));
    // console.log('@buyUnit unitHand', unitHand)
    state = state.setIn(['players', playerIndex, 'hand'], hand.set(unitHand.get('position'), unitHand));

    const currentGold = state.getIn(['players', playerIndex, 'gold']);
    state = state.setIn(['players', playerIndex, 'gold'], currentGold - unitInfo.get('cost'));
    state = state.setIn(['players', playerIndex, 'unitAmounts', unit], (state.getIn(['players', playerIndex, 'unitAmounts', unit]) || 0) + 1);
  }
  return state;
};


/**
 * toggleLock for player (setIn)
 */
exports.toggleLock = async (state, playerIndex) => {
  const locked = state.getIn(['players', playerIndex, 'locked']);
  if (!locked) {
    return state.setIn(['players', playerIndex, 'locked'], true);
  }
  return state.setIn(['players', playerIndex, 'locked'], false);
};

async function increaseExp(stateParam, playerIndex, amountParam) {
  let state = stateParam;
  let player = state.getIn(['players', playerIndex]);
  let level = player.get('level');
  let exp = player.get('exp');
  let expToReach = player.get('expToReach');
  let amount = amountParam;
  if (level === 10) return state;
  while (amount >= 0) {
    // console.log('increaseExp', level, exp, expToReach)
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
      if (level === 10) {
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
  // console.log('increaseExp leaving', level, exp, expToReach)
  return state;
}

/**
 * Buy exp for player (setIn)
 */
exports.buyExp = (state, playerIndex) => {
  const gold = state.getIn(['players', playerIndex, 'gold']);
  const newState = state.setIn(['players', playerIndex, 'gold'], gold - 5);
  return increaseExp(newState, playerIndex, 4);
};


/**
 * Board interaction
 * On move: reset the ids to index
 */

/**
  * Checks all units on board for player of that piece type
  * if 3 units are found, remove those 3 units and replace @ position with evolution
  * No units are added to discardedPieces
  */
async function checkPieceUpgrade(stateParam, playerIndex, piece, position) {
  let state = stateParam;
  const boardUnits = state.getIn(['players', playerIndex, 'board']);
  const name = piece.get('name');
  const stats = await pokemonJS.getStats(name);
  if (f.isUndefined(stats.get('evolves_to'))) return Map({ state, upgradeOccured: false });
  let pieceCounter = 0;
  let positions = List([]);
  const keysIter = boardUnits.keys();
  let tempUnit = keysIter.next();
  while (!tempUnit.done) {
    const unit = boardUnits.get(tempUnit.value);
    if (unit.get('name') === name) {
      pieceCounter += 1;
      positions = positions.push(unit.get('position'));
      // TODO: Check for bug buff here (baby pkmns)
    }
    tempUnit = keysIter.next();
  }
  let requiredAmount = 3;
  if (piece.get('reqEvolve')) {
    requiredAmount = piece.get('reqEvolve');
    console.log('LESS UNITS REQUIRED FOR UPGRADE', piece.get('name'), requiredAmount);
  }
  if (pieceCounter >= requiredAmount) { // Upgrade unit @ position
    // console.log('UPGRADING UNIT', name);
    let board = state.getIn(['players', playerIndex, 'board']);
    let discPieces = state.get('discardedPieces');
    for (let i = 0; i < positions.size; i++) {
      const unit = board.get(positions.get(i));
      discPieces = discPieces.push(unit.get('name'));
      board = board.delete(positions.get(i));
    }
    state = state.set('discardedPieces', discPieces);
    state = state.setIn(['players', playerIndex, 'board'], board);
    const evolvesUnit = stats.get('evolves_to');
    let evolvesTo = evolvesUnit;
    if (!f.isUndefined(evolvesTo.size)) { // List
      evolvesTo = evolvesUnit.get(f.getRandomInt(evolvesTo.size));
    }
    // Check if multiple evolutions exist, random between
    const newPiece = await getBoardUnit(evolvesTo, f.x(position), f.y(position));
    state = state.setIn(['players', playerIndex, 'board', position], newPiece);
    // TODO: List -> handle differently
    const evolutionDisplayName = (await pokemonJS.getStats(evolvesTo)).get('displayName');
    // console.log('evolutionDisplayName', evolutionDisplayName);
    const nextPieceUpgrade = await checkPieceUpgrade(state, playerIndex, newPiece, position);
    // Get both upgrades
    return nextPieceUpgrade.set('upgradeOccured', List([evolutionDisplayName]).concat(nextPieceUpgrade.get('upgradeOccured') || List([])));
  }
  return Map({ state, upgradeOccured: false });
}

/**
 * Place piece
 * Swap functionality by default, if something is there already
 * * Assumes that only half of the board is placed on
 * TODO: Mark units to be sent back if too many
 *       Do buff calculations and mark on board
 *       Return if PieceUpgrade occured Map({state, upgradeOccured: true})
 */
async function placePiece(stateParam, playerIndex, fromPosition, toPosition, shouldSwap = 'true') {
  let piece;
  let state = stateParam;
  if (f.checkHandUnit(fromPosition)) { // from hand
    // console.log('@placePiece placeOnBoard', fromPosition, state.getIn(['players', playerIndex, 'hand']));
    piece = state.getIn(['players', playerIndex, 'hand', fromPosition]).set('position', toPosition);
    const newHand = state.getIn(['players', playerIndex, 'hand']).delete(fromPosition);
    state = state.setIn(['players', playerIndex, 'hand'], newHand);
  } else { // from board
    // console.log('@placePiece', fromPosition);
    // console.log('@placePiece board', state.getIn(['players', playerIndex, 'board']));
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
  }
  if (shouldSwap && !f.isUndefined(newPiece)) { // Swap allowed
    if (f.checkHandUnit(fromPosition)) { // Swap newPiece to hand
      state = state.setIn(['players', playerIndex, 'hand', fromPosition], newPiece.set('position', fromPosition));
    } else { // Swap newPiece to board
      state = state.setIn(['players', playerIndex, 'board', fromPosition], newPiece.set('position', fromPosition));
    }
  }
  // console.log(state.getIn(['players', playerIndex, 'board']));
  const tempMarkedResults = await markBoardBonuses(state.getIn(['players', playerIndex, 'board']));
  const tempBoard = tempMarkedResults.get('newBoard');
  let upgradeOccured = false;
  if (!f.checkHandUnit(toPosition)) {
    const obj = await checkPieceUpgrade(state.setIn(['players', playerIndex, 'board'], tempBoard), playerIndex, tempBoard.get(toPosition), toPosition);
    state = obj.get('state');
    upgradeOccured = obj.get('upgradeOccured');
  }
  if (shouldSwap && !f.isUndefined(newPiece) && !f.checkHandUnit(fromPosition)) {
    const obj = await checkPieceUpgrade(state.setIn(['players', playerIndex, 'board'], tempBoard), playerIndex, tempBoard.get(fromPosition), fromPosition);
    state = obj.get('state');
    upgradeOccured = obj.get('upgradeOccured') || upgradeOccured;
  }
  const markedResults = await markBoardBonuses(state.getIn(['players', playerIndex, 'board']));
  const buffMap = markedResults.get('buffMap').get('0');
  const typeBuffMapSolo = markedResults.get('typeBuffMapSolo').get('0');
  const typeBuffMapAll = markedResults.get('typeBuffMapAll').get('0');
  const typeDebuffMapEnemy = markedResults.get('typeDebuffMapEnemy').get('0');
  // Add this information to the state, boardBuffs

  const boardBuffs = Map({
    buffMap, typeBuffMapSolo, typeBuffMapAll, typeDebuffMapEnemy,
  });
  // console.log('@boardBuffs', boardBuffs);
  state = state.setIn(['players', playerIndex, 'boardBuffs'], boardBuffs);
  const markedBoard = markedResults.get('newBoard');
  state = state.setIn(['players', playerIndex, 'board'], markedBoard);
  return Map({ state, upgradeOccured });
}

exports.placePieceGlobal = async (stateParam, playerIndex, fromPosition, toPosition, shouldSwap = 'true') => placePiece(stateParam, playerIndex, fromPosition, toPosition, shouldSwap);

/**
 * WithdrawPiece from board to best spot on bench
 * * Assumes not bench is full
 */
async function withdrawPiece(state, playerIndex, piecePosition) {
  const benchPosition = await getFirstAvailableSpot(state, playerIndex);
  // TODO: Handle placePiece return upgradeOccured
  return (await placePiece(state, playerIndex, piecePosition, benchPosition, false)).get('state');
}

exports.withdrawPieceGlobal = async (state, playerIndex, piecePosition) => withdrawPiece(state, playerIndex, piecePosition);

/**
 * When units are sold, when level 1, a level 1 unit should be added to discardedPieces
 * Level 2 => 3 level 1 units, Level 3 => 9 level 1 units
 */
async function discardBaseUnits(stateParam, playerIndex, name, depth = 1) {
  let state = stateParam;
  const unitStats = await pokemonJS.getStats(name);
  const evolutionFrom = unitStats.get('evolves_from');
  // console.log('@discardBaseUnits start', name, depth);
  if (f.isUndefined(evolutionFrom)) { // Base level
    let discPieces = state.get('discardedPieces');
    const amountOfPieces = 3 ** (depth - 1); // Math.pow
    console.log('@discardBaseUnits', amountOfPieces, depth, name);
    for (let i = 0; i < amountOfPieces; i++) {
      discPieces = discPieces.push(name);
    }
    const unitAmounts = state.getIn(['players', playerIndex, 'unitAmounts']);
    if(unitAmounts) {
      const newValue = unitAmounts.get(name) - amountOfPieces;
      if(newValue === 0) {
        state = state.setIn(['players', playerIndex, 'unitAmounts'], unitAmounts.delete(name));
      } else {
        state = state.setIn(['players', playerIndex, 'unitAmounts', name], newValue);
      }
    }
    return state.set('discardedPieces', (await discPieces));
  }
  const newName = evolutionFrom;
  // console.log('@discardBaseUnits', newName, depth);
  return discardBaseUnits(state, playerIndex, newName, depth + 1);
}

/**
 * Sell piece
 * Increase money for player
 * Remove piece from position
 * add piece to discarded pieces
 */
async function sellPiece(state, playerIndex, piecePosition) {
  let pieceTemp;
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
    const unitToSell = newState.getIn(['players', playerIndex, 'hand', piecePosition]);
    const newHand = newState.getIn(['players', playerIndex, 'hand']).delete(piecePosition);
    const newDiscardedPieces = newState.set('discardedPieces', newState.get('discardedPieces').push(unitToSell.get('name')));
    newState = newDiscardedPieces.setIn(['players', playerIndex, 'hand'], newHand);
  } else {
    const unitToSell = newState.getIn(['players', playerIndex, 'board', piecePosition]);
    const newBoard = newState.getIn(['players', playerIndex, 'board']).delete(piecePosition);
    const newDiscardedPieces = newState.set('discardedPieces', newState.get('discardedPieces').push(unitToSell.get('name')));
    newState = newDiscardedPieces.setIn(['players', playerIndex, 'board'], newBoard);
  }
  // Add units to discarded Cards, add base level of card
  return discardBaseUnits(newState, playerIndex, piece.get('name'));
}

exports.sellPieceGlobal = (state, playerIndex, piecePosition) => sellPiece(state, playerIndex, piecePosition);

function allowedCoordinate(board, pos) {
  const x = f.x(pos);
  const y = f.y(pos);
  return f.isUndefined(board.get(pos)) && x >= 0 && x < 8 && y >= 0 && y < 8;
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
      if (allowedCoordinate(board, f.pos(x, y - i))) { // S
        return f.pos(x, y - i);
      } if (allowedCoordinate(board, f.pos(x - i, y - i))) { // SW
        return f.pos(x - i, y - i);
      } if (allowedCoordinate(board, f.pos(x + i, y - i))) { // SE
        return f.pos(x + i, y - i);
      } if (allowedCoordinate(board, f.pos(x - i, y))) { // W
        return f.pos(x - i, y);
      } if (allowedCoordinate(board, f.pos(x + i, y))) { // E
        return f.pos(x + i, y);
      } if (allowedCoordinate(board, f.pos(x, y + i))) { // N
        return f.pos(x, y + i);
      } if (allowedCoordinate(board, f.pos(x - i, y + i))) { // NW
        return f.pos(x - i, y + i);
      } if (allowedCoordinate(board, f.pos(x + i, y + i))) { // NE
        return f.pos(x + i, y + i);
      }
    } else { // N team
      if (allowedCoordinate(board, f.pos(x, y + i))) { // N
        return f.pos(x, y + i);
      } if (allowedCoordinate(board, f.pos(x + i, y + i))) { // NE
        return f.pos(x + i, y + i);
      } if (allowedCoordinate(board, f.pos(x - i, y + i))) { // NW
        return f.pos(x - i, y + i);
      } if (allowedCoordinate(board, f.pos(x + i, y))) { // E
        return f.pos(x + i, y);
      } if (allowedCoordinate(board, f.pos(x - i, y))) { // W
        return f.pos(x - i, y);
      } if (allowedCoordinate(board, f.pos(x, y - i))) { // S
        return f.pos(x, y - i);
      } if (allowedCoordinate(board, f.pos(x + i, y - i))) { // SE
        return f.pos(x + i, y - i);
      } if (allowedCoordinate(board, f.pos(x - i, y - i))) { // SW
        return f.pos(x - i, y - i);
      }
    }
  }
  // TODO: if no spot available, move closer to enemy?
  // Temp: no move
  return f.pos();
}

function getHeuristicScore(unitPos, closestEnemyPos) {
  const x = f.x(closestEnemyPos);
  const y = f.y(closestEnemyPos);
  const ux = f.x(unitPos);
  const uy = f.y(unitPos);
  return Math.floor(((uy - y) ** 2) + ((ux - x) ** 2));
}

function getLowestKey(openSet, heuristicMap) {
  const iter = openSet.keys();
  let temp = iter.next();
  let lowestIndex = temp.value;
  let lowestValue = heuristicMap.get(lowestIndex);
  while (!temp.done) {
    const key = temp.value;
    const value = heuristicMap.get(key);
    if (value < lowestValue) {
      lowestValue = value;
      lowestIndex = key;
    }
    temp = iter.next();
  }
  return lowestIndex;
}

function handleNeighbor(pathFindParam, board, current, enemyPos, pos) {
  let pathFind = pathFindParam;
  if (pathFind.get('visited').has(pos)) {
    // console.log('@Path @handleNeighbor Visited', pos)
    return pathFind;
  }
  if (!allowedCoordinate(board, pos) && pos !== enemyPos) { // Taken already
    // console.log('@Path @handleNeighbor Spot taken', pos, (board.get(pos) ? board.get(pos).get('name') : ''));
    return pathFind;
  }
  const distanceTraveled = pathFind.getIn(['fromStartScore', current]) + 1;
  // console.log('@Path @handleNeighbor', pos, pathFind.get('toVisit')) // !pathFind.get('toVisit').has(pos), pathFind.get('toVisit').has(pos),
  // console.log('@Path fromStartScore', distanceTraveled, pathFind.getIn(['fromStartScore', pos]));
  if (!pathFind.get('toVisit').has(pos)) { // New visited node
    pathFind = pathFind.set('toVisit', pathFind.get('toVisit').add(pos));
  } else if (distanceTraveled >= (pathFind.getIn(['fromStartScore', pos]) || 0)) { // Not a better option
    return pathFind;
  }
  // console.log('@Path Path Recorded')
  // Record path
  const heuristicScore = distanceTraveled + getHeuristicScore(pos, enemyPos);
  return pathFind.setIn(['cameFrom', pos], current).setIn(['fromStartScore', pos], distanceTraveled).setIn(['heuristicScore', pos], heuristicScore);
}

function getDirection(unitPos, path) {
  const ux = f.x(unitPos);
  const uy = f.y(unitPos);
  const tx = f.x(path);
  const ty = f.y(path);
  const y = (ty - uy);
  const x = (tx - ux);
  let sx = '';
  let sy = '';
  if (x !== 0) {
    let type = 'W';
    if (x > 0) {
      type = 'E';
    }
    sx = Math.abs(x) + type;
  }
  if (y !== 0) {
    let type = 'S';
    if (y > 0) {
      type = 'N';
    }
    sy = Math.abs(y) + type;
  }
  return sy + sx;
}

async function getStepMovePos(board, unitPos, closestEnemyPos, range, team, exceptionsList = List([])) {
  const stepsToTake = Math.floor(Math.random() * 2 + 1); // 1 currently //  1 - 2, * 2
  const rangeToTarget = getHeuristicScore(unitPos, closestEnemyPos);
  if (stepsToTake > rangeToTarget) { // Within range, move to closest available space // && rangeToTarget === 1
    const goal = getMovePos(board, closestEnemyPos, 1, team);
    const direction = getDirection(unitPos, goal);
    // console.log('Move direction: ', direction);
    return Map({ movePos: goal, direction });
  } // More TOWARDS unit with stepsToTake amount of steps
  let pathFind = Map({
    fromStartScore: Map({}).set(unitPos, 0), // gScore
    heuristicScore: Map({}).set(unitPos, rangeToTarget), // fScore
    toVisit: Set([]).add(unitPos), // openSet
    visited: Set([]), // closedSet
    cameFrom: Map({}), // cameFrom
  });
    // console.log('@Path Start', unitPos, closestEnemyPos);
  while (pathFind.get('toVisit').size > 0) {
    // console.log('@Path ToVisit: ', pathFind.get('toVisit'))
    const current = getLowestKey(pathFind.get('toVisit'), pathFind.get('heuristicScore'));
    if (current === closestEnemyPos) {
      let cameFrom = current;
      let path = List([]);
      while (cameFrom !== unitPos) {
        cameFrom = pathFind.getIn(['cameFrom', cameFrom]);
        path = path.unshift(cameFrom);
      }
      if (path.size <= 1) {
        console.log('Shouldnt get here @path goal');
      } else {
        let index;
        if (path.size <= stepsToTake) {
          index = path.size - 1;
        } else {
          index = stepsToTake;
        }
        // console.log('Finished Path Finding! Return Path[' + index + ']:', path.get(index), path);
        const direction = getDirection(unitPos, path.get(index));
        // console.log('Move direction: ', direction);
        return Map({ movePos: path.get(index), direction });
      }
    }
    // console.log('@Path Current', current);
    pathFind = pathFind.set('toVisit', pathFind.get('toVisit').delete(current)).set('visited', pathFind.get('visited').add(current));
    // console.log('@Path Visited', pathFind.get('visited'));

    const ux = f.x(current);
    const uy = f.y(current);

    pathFind = await handleNeighbor(pathFind, board, current, closestEnemyPos, f.pos(ux, uy + 1)); // N
    pathFind = await handleNeighbor(pathFind, board, current, closestEnemyPos, f.pos(ux, uy - 1)); // S
    pathFind = await handleNeighbor(pathFind, board, current, closestEnemyPos, f.pos(ux + 1, uy)); // E
    pathFind = await handleNeighbor(pathFind, board, current, closestEnemyPos, f.pos(ux - 1, uy)); // W
    pathFind = await handleNeighbor(pathFind, board, current, closestEnemyPos, f.pos(ux - 1, uy - 1)); // NW
    pathFind = await handleNeighbor(pathFind, board, current, closestEnemyPos, f.pos(ux + 1, uy - 1)); // NE
    pathFind = await handleNeighbor(pathFind, board, current, closestEnemyPos, f.pos(ux - 1, uy + 1)); // SW
    pathFind = await handleNeighbor(pathFind, board, current, closestEnemyPos, f.pos(ux + 1, uy + 1)); // SE
  }
  const newClosestEnemyObj = getClosestEnemy(board, unitPos, range, team, exceptionsList.push(closestEnemyPos));
  if (f.isUndefined(newClosestEnemyObj.get('closestEnemy'))) {
    console.log('DIDNT FIND PATH. RETURNING ', unitPos);
    return Map({ movePos: unitPos, direction: '' });
  }
  // TODO: Check so not blocked in
  console.log(`No path available to piece, ${closestEnemyPos} from ${unitPos} (Range: ${range}). Going deeper`);
  return getStepMovePos(board, unitPos, newClosestEnemyObj.get('closestEnemy'), range, team, exceptionsList.push(closestEnemyPos));
}

/**
 * return closest enemy and marks if within range or not
 * If someones at spot && its enemy unit
 * Does this handle positioning good for both teams?
 * Map({closestEnemy, withinRange, direction})
 * Current order: SW, NW, S, N, SE, NE, SW, SE, W, E, NW, NE
 * New Current Order: N S W E SW NW SE NE
 * Wanted order:
 *    team 0: N, S, W, E, NW, NE, SW, SE
 *    team 1: S, N, W, E, SW, SE, NW, NE
 */
function getClosestEnemy(board, unitPos, range, team, exceptionsList = List([])) {
  // f.print(board, '@getClosestEnemy board')
  const x = f.x(unitPos);
  const y = f.y(unitPos);
  const enemyTeam = 1 - team;
  let pos;
  f.p('@getClosestEnemy', unitPos, team, range, enemyTeam, board.get(f.pos(x, y)).get('team'));
  // Check N S W E
  pos = f.pos(x, y + 1);
  if (!f.isUndefined(board.get(pos)) && board.get(pos).get('team') === enemyTeam && !exceptionsList.contains(pos)) {
    return Map({ closestEnemy: pos, withinRange: true, direction: 'N' });
  }
  pos = f.pos(x, y - 1);
  if (!f.isUndefined(board.get(pos)) && board.get(pos).get('team') === enemyTeam && !exceptionsList.contains(pos)) {
    return Map({ closestEnemy: pos, withinRange: true, direction: 'S' });
  }
  pos = f.pos(x - 1, y);
  if (!f.isUndefined(board.get(pos)) && board.get(pos).get('team') === enemyTeam && !exceptionsList.contains(pos)) {
    return Map({ closestEnemy: pos, withinRange: true, direction: 'W' });
  }
  pos = f.pos(x + 1, y);
  if (!f.isUndefined(board.get(pos)) && board.get(pos).get('team') === enemyTeam && !exceptionsList.contains(pos)) {
    return Map({ closestEnemy: pos, withinRange: true, direction: 'E' });
  }

  for (let i = 1; i <= 8; i++) {
    const withinRange = i <= range;
    // console.log(withinRange, x, y, i, (x-i), (y-i))

    // Normal checks
    for (let j = x - i; j <= x + i; j++) {
      pos = f.pos(j, y - i);
      if (!f.isUndefined(board.get(pos)) && board.get(pos).get('team') === enemyTeam && !exceptionsList.contains(pos)) {
        const direction = getDirection(unitPos, pos);
        return Map({ closestEnemy: pos, withinRange, direction });
      }
      pos = f.pos(j, y + i);
      if (!f.isUndefined(board.get(pos)) && board.get(pos).get('team') === enemyTeam && !exceptionsList.contains(pos)) {
        const direction = getDirection(unitPos, pos);
        return Map({ closestEnemy: pos, withinRange, direction });
      }
    }
    for (let j = y - i + 1; j < y + i; j++) {
      pos = f.pos(x - i, j);
      if (!f.isUndefined(board.get(pos)) && board.get(pos).get('team') === enemyTeam && !exceptionsList.contains(pos)) {
        const direction = getDirection(unitPos, pos);
        return Map({ closestEnemy: pos, withinRange, direction });
      }
      pos = f.pos(x + i, j);
      if (!f.isUndefined(board.get(pos)) && board.get(pos).get('team') === enemyTeam && !exceptionsList.contains(pos)) {
        const direction = getDirection(unitPos, pos);
        return Map({ closestEnemy: pos, withinRange, direction });
      }
    }
  }
  // f.print(board, '@getClosestEnemy Returning undefined: Board\n');
  console.log('@getClosestEnemy Returning undefined: ', x, y, range, team);
  return Map({ closestEnemy: undefined, withinRange: false, direction: '' });
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
    f.p('@removeHpBattle UNIT DIED!', currentHp, '->', (percent ? `${newHp}(%)` : `${newHp}(-)`));

    return Map({ board: board.delete(unitPos), unitDied: currentHp });
  }
  // Caused a crash0
  if (Number.isNaN(currentHp - hpToRemove)) {
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
async function manaIncrease(board, damage, unitPos, enemyPos) {
  let manaChanges = Map({});
  const unitMana = board.get(unitPos).get('mana');
  const unitManaMult = board.get(unitPos).get('mana_multiplier');
  const unitManaInc = Math.round(Math.min(Math.max(unitManaMult * damage, 5), 15));
  const manaCost = board.get(unitPos).get('manaCost');
  const newMana = Math.min(+unitMana + +unitManaInc, manaCost);
  manaChanges = manaChanges.set(unitPos, newMana);
  if (!f.isUndefined(enemyPos)) {
    const enemyMana = board.get(enemyPos).get('mana');
    const enemyManaMult = board.get(enemyPos).get('mana_multiplier');
    const enemyManaInc = Math.round(Math.min(enemyManaMult * damage, 15));
    const enemyManaCost = board.get(enemyPos).get('manaCost');
    const enemyNewMana = Math.min(+enemyMana + +enemyManaInc, enemyManaCost);
    return manaChanges.set(enemyPos, enemyNewMana);
  }
  return manaChanges;
}

async function manaChangeBoard(boardParam, manaChanges) {
  let board = boardParam;
  const iter = manaChanges.keys();
  let temp = iter.next();
  while (!temp.done) {
    const pid = temp.value;
    board = board.setIn([pid, 'mana'], manaChanges.get(pid));
    temp = iter.next();
  }
  return board;
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
async function calcDamage(actionType, power, unit, target, typeFactor, useSpecial = false) { // attack, defense, typesAttacker, typesDefender
  // console.log('@calcDamage', unit, target)
  const damageRatio = (useSpecial ? unit.get('specialAttack') / target.get('specialDefense') : unit.get('attack') / target.get('defense'));
  const factor = gameConstantsJS.getDamageFactorType(actionType) * power * damageRatio;
  f.p('@calcDamage returning: ', typeFactor, '*', Math.round(factor), '+ 1 =', Math.round(factor * typeFactor + 1));
  return Math.round(factor * typeFactor + 1);
}

/**
 * Heals unit at unitPos by heal amount, not over max hp
 */
async function healUnit(board, unitPos, heal) {
  const maxHp = (await pokemonJS.getStats(board.get(unitPos).get('name'))).get('hp');
  const newHp = (board.getIn([unitPos, 'hp']) + heal >= maxHp ? maxHp : board.getIn([unitPos, 'hp']) + heal);
  const hpHealed = newHp - board.getIn([unitPos, 'hp']);
  return Map({ board: board.setIn([unitPos, 'hp'], newHp), hpHealed });
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
async function useAbility(board, ability, damageParam, unitPos, target) {
  let damage = damageParam;
  const manaCost = ability.get('mana') || abilitiesJS.getAbilityDefault('mana');
  const newMana = board.getIn([unitPos, 'mana']) - manaCost;
  const manaChanges = Map({ unitPos: newMana });
  let newBoard = board.setIn([unitPos, 'mana'], newMana);
  let effectMap = Map({});
  if (!f.isUndefined(ability.get('effect'))) {
    const effect = ability.get('effect');
    const mode = (f.isUndefined(effect.size) ? effect : effect.get(0));
    const args = (f.isUndefined(effect.size) ? undefined : effect.shift(0));
    console.log('@useAbility mode', mode, ', args', args);
    switch (mode) {
      case 'buff': {
        if (!f.isUndefined(args)) { // Args: Use buff on self on board [buffType, amount]
          const buffValue = newBoard.getIn([unitPos, args.get(0)]) + args.get(1);
          console.log('@useAbility - buff', buffValue);
          newBoard = newBoard.setIn([unitPos, args.get(0)], buffValue);
          effectMap = effectMap.setIn([unitPos, `buff${args.get(0)}`], buffValue);
        }
      }
      case 'teleport':
        console.log('@teleport');
      case 'transform':
      case 'noTarget': {
        console.log('@useAbility - noTarget return for mode =', mode);
        if (damage !== 0) {
          console.log('@NoTarget HMMM', damage);
          damage = 0;
        }
        // return Map({ board: Map({ board: newBoard }) });
        break;
      }
      case 'lifesteal': {
        const lsFactor = (!f.isUndefined(args) ? args.get(0) : abilitiesJS.getAbilityDefault('lifestealValue'));
        const healObj = await healUnit(newBoard, unitPos, Math.round(lsFactor * damage));
        newBoard = healObj.get('board');
        effectMap = effectMap.setIn([unitPos, 'heal'], healObj.get('hpHealed'));
        break;
      }
      case 'dot': {
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
      }
      case 'aoe':
        // TODO - Can it even be checked here first? Probably before this stage
        break;
      case 'multiStrike': {
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
      }
      default:
        console.log('@useAbility - default, mode =', mode);
    }
  }
  return Map({ removeHpBoard: (await removeHpBattle(newBoard, target, damage)), effect: effectMap, manaChanges });
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
async function handleDotDamage(board, unitPos) { // , team
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
  // console.log('@deleteNextMoveResultEntries', unitMoveMap, targetToRemove);
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
  return unitMoveMap.delete(targetToRemove);
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
  if (unit.get('mana') >= unit.get('manaCost')) { // Use spell, && withinRange for spell
    // TODO AOE spell logic
    // Idea: Around every adjacent enemy in range of 1 from closest enemy
    const team = unit.get('team');
    const ability = await abilitiesJS.getAbility(unit.get('name'));
    // TODO Check aoe / notarget here instead
    // console.log('@spell ability', ability)
    if (f.isUndefined(ability)) {
      console.log(`${unit.get('name')} buggy ability`);
    }
    const range = (!f.isUndefined(ability.get('acc_range')) && !f.isUndefined(ability.get('acc_range').size)
      ? ability.get('acc_range').get(1) : abilitiesJS.getAbilityDefault('range'));
    const enemyPos = await getClosestEnemy(board, unitPos, range, team);
    const action = 'spell';
    const target = await enemyPos.get('closestEnemy');
    // console.log('@nextmove - ability target: ', target, enemyPos)
    const typeFactor = await typesJS.getTypeFactor(ability.get('type'), board.get(target).get('type'));
    const abilityDamage = (ability.get('power') ? await calcDamage(action, ability.get('power'), unit, board.get(target), typeFactor, true) : 0);
    const abilityName = ability.get('displayName');
    const abilityResult = await useAbility(board, ability, abilityDamage, unitPos, target);
    // console.log('@abilityResult', abilityResult)
    const removedHPBoard = abilityResult.get('removeHpBoard');
    const effect = abilityResult.get('effect');
    const manaChanges = abilityResult.get('manaChanges');
    // Do game over check
    const newBoard = removedHPBoard.get('board');
    // console.log('@spell', newBoard)
    let battleOver = false;
    let damageDealt = abilityDamage;
    if (removedHPBoard.get('unitDied')) {
      battleOver = await isBattleOver(newBoard, team);
      damageDealt = removedHPBoard.get('unitDied');
    }
    const move = Map({
      unitPos,
      action,
      value: damageDealt,
      abilityName,
      target,
      effect,
      manaChanges,
      typeEffective: gameConstantsJS.getTypeEffectString(typeFactor),
      direction: enemyPos.get('direction'),
    });
    return Map({
      nextMove: move,
      newBoard,
      battleOver,
    });
  }
  // Attack
  const range = unit.get('range');
  const team = unit.get('team');
  let tarpos;
  if (!f.isUndefined(optPreviousTarget)) {
    tarpos = Map({ closestEnemy: optPreviousTarget.get('target'), withinRange: true, direction: optPreviousTarget.get('direction') });
  } else {
    tarpos = getClosestEnemy(board, unitPos, range, team);
  }
  const enemyPos = tarpos; // await
  if (enemyPos.get('withinRange')) { // Attack action
    const action = 'attack';
    const target = enemyPos.get('closestEnemy');
    f.p('Closest Enemy: ', unitPos, team, target);
    const attackerType = (!f.isUndefined(unit.get('type').size) ? unit.get('type').get(0) : unit.get('type'));
    // console.log('@nextmove - normal attack target: ', target, enemyPos)
    const typeFactor = await typesJS.getTypeFactor(attackerType, board.get(target).get('type'));
    const value = await calcDamage(action, unit.get('attack'), unit, board.get(target), typeFactor);
    // Calculate newBoard from action
    const removedHPBoard = await removeHpBattle(board, target, value); // {board, unitDied}
    const newBoard = removedHPBoard.get('board');
    let battleOver = false;
    let allowSameMove = false;
    let newBoardMana;
    let manaChanges;
    let damageDealt = value;
    if (removedHPBoard.get('unitDied')) { // Check if battle ends
      battleOver = await isBattleOver(newBoard, team);
      manaChanges = await manaIncrease(newBoard, value, unitPos); // target = dead
      newBoardMana = await manaChangeBoard(newBoard, manaChanges);
      damageDealt = removedHPBoard.get('unitDied');
    } else { // Mana increase, return newBoard
      allowSameMove = true;
      manaChanges = await manaIncrease(newBoard, value, unitPos, target);
      newBoardMana = await manaChangeBoard(newBoard, manaChanges);
    }
    const move = Map({
      unitPos,
      action,
      value: damageDealt,
      target,
      manaChanges,
      typeEffective: gameConstantsJS.getTypeEffectString(typeFactor),
      direction: enemyPos.get('direction'),
    });
    return Map({
      nextMove: move,
      newBoard: newBoardMana,
      allowSameMove,
      battleOver,
    });
  } // Move action
  const closestEnemyPos = enemyPos.get('closestEnemy');
  // console.log('Moving ...', unitPos, 'to', closestEnemyPos, range)
  const movePosObj = await getStepMovePos(board, unitPos, closestEnemyPos, range, team);
  const movePos = movePosObj.get('movePos');
  const direction = movePosObj.get('direction');
  f.p('Move: ', unitPos, 'to', movePos);
  let newBoard;
  let action;
  if (unitPos === movePos) {
    action = 'noAction';
    newBoard = board;
  } else {
    newBoard = board.set(movePos, unit.set('position', movePos)).delete(unitPos);
    action = 'move';
  }
  const move = Map({
    unitPos, action, target: movePos, direction,
  });
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
    if (f.isUndefined(lowestNextMove.get(0))) {
      console.log('@getUnitWithNextMove Undefined', board);
    }
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
  let dmgBoard = Map({});
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
    if (unit.get('hp') <= 0) {
      board = board.delete(unitPos);
      battleOver = battleOver || await isBattleOver(board, 1 - unit.get('team'));
      console.log('Removing unit with hp < 0 before battle start', unit.get('name'), unit.get('hp'), 'battleOver', battleOver);
    } else {
      const target = unit.get('first_move');
      const time = 0;
      const move = Map({
        unitPos, action, target, time,
      });
      actionStack = actionStack.push(move);
      const newUnit = unit.set('next_move', +unit.get('next_move') + +unit.get('speed'))
        .delete('first_move');
      board = board.set(unitPos, newUnit);
    }
    temp = iter.next();
  }
  // Start battle
  while (!battleOver) {
    board = await board;
    // console.log('board @startBattle', board)
    if (f.isUndefined(board)) {
      console.log('board undefined in startBattle');
    }
    const nextUnitToMove = await getUnitWithNextMove(board);
    const unit = board.get(nextUnitToMove);
    // console.log('\n@startbattle Next unit to do action: ', nextUnitToMove);
    const previousMove = unitMoveMap.get(nextUnitToMove);
    // console.log(' --- ', (f.isUndefined(previousMove) ? '' : previousMove.get('nextMove').get('target')), nextUnitToMove)
    let nextMoveResult;
    if (!f.isUndefined(previousMove)) { // Use same target as last round
      // console.log('previousMove in @startBattle', previousMove.get('nextMove').get('target'));
      const previousTarget = previousMove.get('nextMove').get('target');
      const previousDirection = previousMove.get('nextMove').get('direction');
      nextMoveResult = await nextMove(board, nextUnitToMove, Map({ target: previousTarget, direction: previousDirection }));
    } else {
      if (f.isUndefined(nextUnitToMove)) {
        console.log('Unit is undefined');
      }
      nextMoveResult = await nextMove(board, nextUnitToMove);
    }
    const result = await nextMoveResult;
    board = result.get('newBoard');
    const moveAction = result.get('nextMove').get('action');
    let pos = nextUnitToMove;
    // Calc nextMove value
    let nextMoveValue;
    if (moveAction === 'move') { // Faster recharge on moves
      nextMoveValue = +unit.get('next_move') + Math.round(+unit.get('speed') / 3);
      pos = result.get('nextMove').get('target');
    } else {
      nextMoveValue = +unit.get('next_move') + +unit.get('speed');
      // Add to dpsBoard
      if (unit.get('team') === 0) {
        dmgBoard = dmgBoard.set(unit.get('displayName'), (dmgBoard.get(unit.get('displayName')) || 0) + result.get('nextMove').get('value'));
      }
    }
    board = board.setIn([pos, 'next_move'], nextMoveValue);
    // console.log('Updating next_move', nextMoveValue, board.get(pos));
    const madeMove = result.get('nextMove').set('time', unit.get('next_move'));
    if (f.isUndefined(board)) {
      console.log('@startBattle CHECK ME', madeMove, board);
    }
    f.printBoard(board, madeMove);
    if (moveAction !== 'noAction') { // Is a valid action
      actionStack = actionStack.push(madeMove);
      if (result.get('allowSameMove')) { // Store target to be used as next Target
        unitMoveMap = unitMoveMap.set(nextUnitToMove, result);
      } else { // Unit died, Delete every key mapping to nextMoveResult
        const nextMoveAction = moveAction;
        if (nextMoveAction === 'attack' || nextMoveAction === 'spell') { // Unit attacked died
          // console.log('Deleting all keys connected to this: ', nextMoveResult.get('nextMove').get('target'))
          unitMoveMap = await deleteNextMoveResultEntries(unitMoveMap, result.get('nextMove').get('target'));
        } else if (nextMoveAction === 'move') { // Unit moved, remove units that used to attack him
          // console.log('Deleting all keys connected to this: ', nextUnitToMove)
          unitMoveMap = await deleteNextMoveResultEntries(unitMoveMap, nextUnitToMove);
        } else {
          console.log('@nextMove, CHECK shouldnt get here', nextMoveAction, nextMoveAction !== 'noAction', moveAction !== 'noAction');
        }
      }
    }
    battleOver = result.get('battleOver');
    if (battleOver) break; // Breaks if battleover (no dot damage if last unit standing)
    // Dot damage
    const team = board.getIn([nextUnitToMove, 'team']);
    const dotObj = await handleDotDamage(board, nextUnitToMove, team);
    if (!f.isUndefined(dotObj.get('damage'))) {
      console.log('@Dot Damage');
      board = await dotObj.get('board');
      // console.log('@dotDamage battleover', battleOver, dotObj.get('battleOver'), battleOver || dotObj.get('battleOver'));
      const action = 'dotDamage';
      const dotDamage = dotObj.get('damage');
      // console.log('dot damage dealt!', board);
      let damageDealt = dotDamage;
      if (dotObj.get('unitDied')) { // Check if battle ends
        console.log('@dot - unitdied');
        damageDealt = dotObj.get('unitDied');
        battleOver = battleOver || await isBattleOver(board, 1 - team);
        // Delete every key mapping to nextMoveResult
        // console.log('Deleting all keys connected to this: ', nextMoveResult.get('nextMove').get('target'))
        unitMoveMap = await deleteNextMoveResultEntries(unitMoveMap, nextUnitToMove);
      }
      const move = await Map({
        unitPos: nextUnitToMove, action, value: damageDealt, target: nextUnitToMove,
      });
      if (unit.get('team') === 1) {
        dmgBoard = dmgBoard.set('dot', (dmgBoard.get('dot') || 0) + damageDealt);
      }
      console.log('@dotDamage', dotDamage);
      f.printBoard(board, move);
      actionStack = actionStack.push(Map({ nextMove: move, newBoard: board }).set('time', unit.get('next_move')));
    }
  }
  const newBoard = await board;
  // Return the winner
  // f.print(newBoard, '@startBattle newBoard after');
  // f.print(actionStack, '@startBattle actionStack after');
  f.p('@Last - A Survivor', newBoard.keys().next().value, newBoard.get(newBoard.keys().next().value).get('name'));
  const team = newBoard.get(newBoard.keys().next().value).get('team');
  const winningTeam = team;
  const battleEndTime = actionStack.get(actionStack.size - 1).get('time');
  return Map({
    actionStack, board: newBoard, winner: winningTeam, dmgBoard, battleEndTime,
  });
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
async function countUniqueOccurences(board, teamParam = '0') {
  const boardKeysIter = board.keys();
  let tempUnit = boardKeysIter.next();
  let buffMap = Map({ 0: Map({}), 1: Map({}) });
  let unique = Map({ 0: Set([]), 1: Set([]) });
  while (!tempUnit.done) {
    const unitPos = tempUnit.value;
    const unit = board.get(unitPos);
    const name = unit.get('name');
    // console.log('@countUnique UNIT', name)
    const team = unit.get('team') || teamParam;
    // console.log(unique, team, unit, unitPos)
    // console.log('@countUniqueOccurences', unique.get(String(team)), pokemonJS.getBasePokemon(name))
    const basePokemon = await pokemonJS.getBasePokemon(name);
    if (!unique.get(String(team)).has(basePokemon)) { // TODO: Check
      // f.p('@CountUniqueOccurences Unique', basePokemon, team, unique);
      const newSet = await unique.get(String(team)).add(basePokemon);
      unique = await unique.set(String(team), newSet); // Store unique version, only count each once
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
  f.p('@CountUniqueOccurences', unique);
  return buffMap;
}

/**
 * Give bonuses from types
 * Type bonus is either only for those of that type or all units
 */
async function markBoardBonuses(board, teamParam = '0') {
  const buffMap = await countUniqueOccurences(board);

  // Map({0: Map({grass: 40})})
  let typeBuffMapSolo = Map({ 0: Map({}), 1: Map({}) }); // Solo buffs, only for that type
  let typeBuffMapAll = Map({ 0: Map({}), 1: Map({}) }); // For all buff
  let typeDebuffMapEnemy = Map({ 0: Map({}), 1: Map({}) }); // For all enemies debuffs
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
              typeBuffMapSolo = typeBuffMapSolo
                .setIn([String(i), buff, 'value'], (typeBuffMapSolo.get(String(i)).get(buff) ? typeBuffMapSolo.get(String(i)).get(buff).get('value') : 0) + typesJS.getBonusAmount(buff, j))
                .setIn([String(i), buff, 'typeBuff'], typesJS.getBonusStatType(buff))
                .setIn([String(i), buff, 'tier'], j);
              break;
            case 'allBonus':
              typeBuffMapAll = typeBuffMapAll
                .setIn([String(i), buff, 'value'], (typeBuffMapAll.get(String(i)).get(buff) ? typeBuffMapAll.get(String(i)).get(buff).get('value') : 0) + typesJS.getBonusAmount(buff, j))
                .setIn([String(i), buff, 'typeBuff'], typesJS.getBonusStatType(buff))
                .setIn([String(i), buff, 'tier'], j);
              break;
            case 'enemyDebuff':
              typeDebuffMapEnemy = typeDebuffMapEnemy
                .setIn([String(i), buff, 'value'], (typeDebuffMapEnemy.get(String(i)).get(buff) ? typeDebuffMapEnemy.get(String(i)).get(buff).get('value') : 0) + typesJS.getBonusAmount(buff, j))
                .setIn([String(i), buff, 'typeBuff'], typesJS.getBonusStatType(buff))
                .setIn([String(i), buff, 'tier'], j);
              break;
            case 'noBattleBonus':
              // No impact in battle
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
    newBoard = newBoard.setIn([unitPos, 'buff'], List([]));
    const team = unit.get('team') || teamParam;
    // Solo buffs
    const types = board.get(unitPos).get('type'); // Value or List
    if (!f.isUndefined(types.size)) { // List
      let newUnit = unit;
      for (let i = 0; i < types.size; i++) {
        if (!f.isUndefined(typeBuffMapSolo.get(String(team)).get(types.get(i)))) {
          // console.log('@markBoardBonuses Marking unit', newUnit.get('name'));
          const buff = typesJS.getType(types.get(i));
          const buffName = buff.get('name');
          const bonusValue = typeBuffMapSolo.get(String(team)).get(types.get(i)).get('value');
          const bonusType = buff.get('bonusStatType');
          const buffTextContent = (bonusType.includes('unique') ? bonusType.split('_')[1] + bonusValue : `${bonusType} +${bonusValue}`);
          const buffText = `${buffName}: ${buffTextContent}`;
          newUnit = (await typesJS.getBuffFuncSolo(types.get(i))(newUnit, bonusValue))
            .set('buff', (newBoard.get(unitPos).get('buff') || List([])).push(buffText)); // Add buff to unit
          newBoard = await newBoard.set(unitPos, newUnit);
        }
      }
    } else if (!f.isUndefined(typeBuffMapSolo.get(String(team)).get(types))) {
      // console.log('@markBoardBonuses Marking unit', unit.get('name'));
      const buff = typesJS.getType(types);
      const buffName = buff.get('name');
      const bonusValue = typeBuffMapSolo.get(String(team)).get(types).get('value');
      const bonusType = buff.get('bonusStatType');
      const buffTextContent = (bonusType.includes('unique') ? bonusType.split('_')[1] + bonusValue : `${bonusType} +${bonusValue}`);
      const buffText = `${buffName}: ${buffTextContent}`;
      const newUnit = (await typesJS.getBuffFuncSolo(types)(unit, bonusValue))
        .set('buff', (newBoard.get(unitPos).get('buff') || List([])).push(buffText)); // Add buff to unit
      newBoard = await newBoard.set(unitPos, newUnit);
    }

    // All buffs
    const allBuffIter = typeBuffMapAll.get(String(team)).keys();
    let tempBuffAll = allBuffIter.next();
    while (!tempBuffAll.done) {
      const buff = tempBuffAll.value;
      const bonusValue = typeBuffMapAll.get(String(team)).get(buff).get('value');
      const bonusType = typesJS.getBonusStatType(buff);
      const buffText = `${buff}: ${bonusType} +${bonusValue}`;
      const newUnit = typesJS.getBuffFuncAll(buff)(newBoard.get(unitPos), bonusValue)
        .set('buff', (newBoard.get(unitPos).get('buff') || List([])).push(buffText));
      newBoard = await newBoard.set(unitPos, newUnit);
      tempBuffAll = allBuffIter.next();
    }

    // Enemy buffs
    const enemyTeam = 1 - team;
    const enemyDebuffIter = typeDebuffMapEnemy.get(String(enemyTeam)).keys();
    let tempEnemy = enemyDebuffIter.next();
    while (!tempEnemy.done) {
      const buff = tempEnemy.value;
      const bonusValue = typeDebuffMapEnemy.get(String(enemyTeam)).get(buff).get('value');
      const bonusType = typesJS.getBonusStatType(buff);
      const buffText = `${buff}: ${bonusType} +${bonusValue}`;
      const newUnit = typesJS.getEnemyDebuff(buff)(newBoard.get(unitPos), bonusValue)
        .set('buff', (newBoard.get(unitPos).get('buff') || List([])).push(buffText));
      newBoard = await newBoard.set(unitPos, newUnit);
      tempEnemy = enemyDebuffIter.next();
    }
    tempUnit = boardKeysIter.next();
  }
  if (f.isUndefined(newBoard) || Object.keys(newBoard).length === 0) {
    console.log('@markBoardBonuses CHECK ME', newBoard);
  }
  // console.log('NEWBOARD: ', newBoard);
  return Map({
    newBoard, buffMap, typeBuffMapSolo, typeBuffMapAll, typeDebuffMapEnemy,
  });
}

/**
 * Create unit for board battle from createBoardUnit unit given newpos/pos and team
 */
async function createBattleUnit(unit, unitPos, team) {
  const unitStats = await pokemonJS.getStats(unit.get('name'));
  const ability = await abilitiesJS.getAbility(unit.get('name'));
  // if(ability.get('mana')) console.log('@createBattleUnit', unit.get('name'), unitStats.get('ability'), ability.get('mana'));
  return unit.set('team', team).set('attack', unitStats.get('attack'))
    .set('hp', unitStats.get('hp'))
    .set('maxHp', unitStats.get('hp'))
    .set('startHp', unitStats.get('hp'))
    .set('type', unitStats.get('type'))
    .set('next_move', unitStats.get('next_move') || pokemonJS.getStatsDefault('next_move'))
    .set('mana', unitStats.get('mana') || pokemonJS.getStatsDefault('mana'))
    .set('ability', unitStats.get('ability'))
    .set('defense', unitStats.get('defense') || pokemonJS.getStatsDefault('defense'))
    .set('speed', pokemonJS.getStatsDefault('upperLimitSpeed') - (unitStats.get('speed') || pokemonJS.getStatsDefault('speed')))
    /* .set('mana_hit_given', unitStats.get('mana_hit_given') || pokemonJS.getStatsDefault('mana_hit_given'))
    .set('mana_hit_taken', unitStats.get('mana_hit_taken') || pokemonJS.getStatsDefault('mana_hit_taken')) */
    .set('mana_multiplier', unitStats.get('mana_multiplier') || pokemonJS.getStatsDefault('mana_multiplier'))
    .set('specialAttack', unitStats.get('specialAttack'))
    .set('specialDefense', unitStats.get('specialDefense'))
    .set('position', unitPos)
    .set('range', unitStats.get('range') || pokemonJS.getStatsDefault('range'))
    .set('manaCost', ability.get('mana') || abilitiesJS.getDefault('mana'));
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
  const board = await combineBoards(board1, board2);
  if (board1.size === 0) {
    return Map({
      actionStack: List([]), winner: 1, board, startBoard: board,
    });
  } if (board2.size === 0) {
    return Map({
      actionStack: List([]), winner: 0, board, startBoard: board,
    });
  }

  // f.print(board, '@prepareBattle')
  // Both players have units, battle required
  const boardWithBonuses = (await markBoardBonuses(board)).get('newBoard');
  // f.print(boardWithBonuses);
  const boardWithMovement = await setRandomFirstMove(boardWithBonuses);
  if (f.isUndefined(boardWithMovement)) {
    console.log('@prepareBattle UNDEFINED BOARD', board1, board2);
  }
  const result = await startBattle(boardWithMovement);
  return result.set('startBoard', boardWithMovement);
}

async function buildMatchups(players) {
  let matchups = Map({});
  const jsPlayers = players.toJS();
  const keys = Object.keys(jsPlayers);
  const immutableKeys = fromJS(keys);
  let shuffledKeys = f.shuffleImmutable(immutableKeys);
  // console.log('@buildMatchups Keys', players, keys, shuffledKeys);
  for (let i = shuffledKeys.size - 1; i > 2; i -= 2) {
    const pid = shuffledKeys.get(i);
    const otherpid = shuffledKeys.get(i - 1);
    matchups = matchups.set(pid, otherpid).set(otherpid, pid);
    shuffledKeys = shuffledKeys.delete(i).delete(i - 1);
  }
  if (shuffledKeys.size === 3) {
    const fst = shuffledKeys.get(0);
    const snd = shuffledKeys.get(1);
    const trd = shuffledKeys.get(2);
    matchups = matchups.set(fst, snd).set(snd, trd).set(trd, fst);
  } else if (shuffledKeys.size === 2) {
    const fst = shuffledKeys.get(0);
    const snd = shuffledKeys.get(1);
    matchups = matchups.set(fst, snd).set(snd, fst);
  }
  console.log('@buildMatchups -------', matchups);
  return matchups;
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
  const matchups = await buildMatchups(state.get('players'));
  let battleObject = Map({ matchups });
  const iter = matchups.keys();
  let temp = iter.next();
  while (!temp.done) {
    const index = temp.value;
    const enemy = matchups.get(temp.value);
    // console.log('@battleTime pairing: ', pairing, nextPlayer);
    const board1 = state.getIn(['players', index, 'board']);
    const board2 = state.getIn(['players', enemy, 'board']);
    if (f.isUndefined(board2)) console.log('Undefined board', enemy);
    const result = prepareBattle(board1, board2);
    // {actionStack: actionStack, board: newBoard, winner: winningTeam, startBoard: initialBoard}
    const resultBattle = await result;

    // For visualization of battle
    const actionStack = resultBattle.get('actionStack');
    const startBoard = resultBattle.get('startBoard');
    const dmgBoard = resultBattle.get('dmgBoard');
    battleObject = battleObject.setIn(['actionStacks', index], actionStack);
    battleObject = battleObject.setIn(['startingBoards', index], startBoard);
    battleObject = battleObject.setIn(['dmgBoards', index], dmgBoard);

    // For endbattle calculations
    const winner = (resultBattle.get('winner') === 0);
    const finalBoard = resultBattle.get('board');
    const battleEndTime = resultBattle.get('battleEndTime');
    battleObject = battleObject.setIn(['winners', index], winner);
    battleObject = battleObject.setIn(['finalBoards', index], finalBoard);
    battleObject = battleObject.setIn(['battleEndTimes', index], battleEndTime);


    // console.log('@battleTime newBoard, finished board result', newBoard); // Good print, finished board
    // Store rivals logic
    const prevRivals = state.getIn(['players', index, 'rivals']);
    state = state.setIn(['players', index, 'rivals'], prevRivals.set(enemy, (prevRivals.get(enemy) || 0) + 1));

    temp = iter.next();
  }
  // Post battle state
  const newState = await state;
  return Map({
    state: newState,
    battleObject,
    preBattleState: stateParam,
  });
}

async function npcRound(stateParam, npcBoard) {
  const state = stateParam;
  let battleObject = Map({});
  const playerIter = state.get('players').keys();
  let tempPlayer = playerIter.next();
  // TODO: Future: All battles calculate concurrently
  while (!tempPlayer.done) {
    const currentPlayer = tempPlayer.value;
    const board1 = state.getIn(['players', currentPlayer, 'board']);
    const result = prepareBattle(board1, npcBoard);
    // {actionStack: actionStack, board: newBoard, winner: winningTeam, startBoard: initialBoard}
    const resultBattle = await result;

    const actionStack = resultBattle.get('actionStack');
    const startBoard = resultBattle.get('startBoard');
    const dmgBoard = resultBattle.get('dmgBoard');
    battleObject = battleObject.setIn(['actionStacks', currentPlayer], actionStack);
    battleObject = battleObject.setIn(['startingBoards', currentPlayer], startBoard);
    battleObject = battleObject.setIn(['dmgBoards', currentPlayer], dmgBoard);

    // For endbattle calculations
    const winner = (resultBattle.get('winner') === 0);
    const finalBoard = resultBattle.get('board');
    const battleEndTime = resultBattle.get('battleEndTime');
    battleObject = battleObject.setIn(['winners', currentPlayer], winner);
    battleObject = battleObject.setIn(['finalBoards', currentPlayer], finalBoard);
    battleObject = battleObject.setIn(['battleEndTimes', currentPlayer], battleEndTime);

    tempPlayer = playerIter.next();
  }
  // Post battle state
  const newState = await state;
  return Map({
    state: newState,
    battleObject,
    preBattleState: stateParam,
  });
}

/**
 * Board for player with playerIndex have too many units
 * Try to withdraw the cheapest unit
 * if hand is full, sell cheapest unit
 * Do this until board.size == level
 */
async function fixTooManyUnits(state, playerIndex) {
  const board = state.getIn(['players', playerIndex, 'board']);
  // Find cheapest unit
  const iter = board.keys();
  let temp = iter.next();
  let cheapestCost = 100;
  let cheapestCostIndex = List([]);
  while (!temp.done) {
    const unitPos = temp.value;
    const cost = (await pokemonJS.getStats(board.get(unitPos).get('name'))).get('cost');
    if (cost < cheapestCost) {
      cheapestCost = cost;
      cheapestCostIndex = List([unitPos]);
    } else if (cost === cheapestCost) {
      cheapestCostIndex = cheapestCostIndex.push(unitPos);
    }
    temp = iter.next();
  }
  let chosenUnit;
  if (cheapestCostIndex.size === 1) {
    chosenUnit = cheapestCostIndex.get(0);
  } else {
    // TODO Check the one that provides fewest combos
    // Temp: Random from cheapest
    const chosenIndex = Math.random() * cheapestCostIndex.size;
    chosenUnit = cheapestCostIndex.get(chosenIndex);
  }
  // Withdraw if possible unit, otherwise sell
  // console.log('@FixTooManyUnits Check keys', state.get('players'));
  let newState;
  // TODO: Inform Client about update
  if (state.getIn(['players', playerIndex, 'hand']).size < 8) {
    console.log('WITHDRAWING PIECE', board.get(chosenUnit).get('name'));
    newState = await withdrawPiece(state, playerIndex, chosenUnit);
  } else {
    console.log('SELLING PIECE', board.get(chosenUnit).get('name'));
    newState = await sellPiece(state, playerIndex, chosenUnit);
  }
  const newBoard = newState.getIn(['players', playerIndex, 'board']);
  const level = newState.getIn(['players', playerIndex, 'level']);
  if (newBoard.size > level) {
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
    if (board.size > level) {
      const newPlayer = await fixTooManyUnits(state, playerIndex);
      state = state.setIn(['players', playerIndex], newPlayer);
    }
    temp = iter.next();
  }
  const round = state.get('round');
  const roundType = gameConstantsJS.getRoundType(round);
  switch (roundType) {
    case 'gym': {
      const gymLeader = gameConstantsJS.getGymLeader(round);
      const boardNpc = await gameConstantsJS.getSetRound(round);
      return (await npcRound(state, boardNpc)).set('roundType', roundType).set('gymLeader', gymLeader);
    }
    case 'npc': {
      const boardNpc = await gameConstantsJS.getSetRound(round);
      return (await npcRound(state, boardNpc)).set('roundType', roundType);
    }
    case 'shop':
    case 'pvp':
    default: {
      return (await battleTime(state)).set('roundType', roundType);
    }
  }
};

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
  const roundType = gameConstantsJS.getRoundType(round);
  state = state.set('round', round + 1);
  if (round <= 5) {
    state = state.set('income_basic', income_basic);
  }

  // While temp
  const iter = state.get('players').keys();
  let temp = iter.next();
  while (!temp.done) {
    const index = temp.value;
    const locked = state.getIn(['players', index, 'locked']);
    if (!locked) {
      state = await refreshShop(state, index);
      // console.log('Not locked for player[' + i + '] \n', state.get('pieces').get(0));
    }
    state = await increaseExp(state, index, 1);
    const gold = state.getIn(['players', index, 'gold']);
    // Min 0 gold interest -> max 5
    const bonusGold = Math.min(Math.floor(gold / 10), 5);
    const streak = state.getIn(['players', index, 'streak']) || 0;
    const streakGold = (roundType === 'pvp' ? Math.min(Math.floor(
      (streak === 0 || Math.abs(streak) === 1 ? 0 : (Math.abs(streak) / 5) + 1),
    ), 3) : 0);
    const newGold = gold + income_basic + bonusGold + streakGold;
    /*
    console.log(`@playerEndTurn Gold: p[${index + 1}]: `,
      `${gold}, ${income_basic}, ${bonusGold}, ${streakGold} (${streak}) = ${newGold}`);
    */
    state = state.setIn(['players', index, 'gold'], newGold);
    temp = iter.next();
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
    console.log('@prepEndTurn CHECK: Ending Turn', state.get('amountOfPlayers'));
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
    f.p('@calcDamageTaken Returning 0 ', boardUnits);
    return 0; // When there are no units left for the enemy, don't lose hp (A tie)
  }
  let sum = 0;
  // console.log('@calcDamageTaken', boardUnits.size, boardUnits)
  const keysIter = boardUnits.keys();
  let tempUnit = keysIter.next();
  // Each surviving piece does damage based on its level: 1+floor(level/3)
  // Level 1-2 units do 1 damage, 3-5 do 2 damage, 6-8 do 3 damage, level 9 do 4 damage
  while (!tempUnit.done) {
    const stats = await pokemonJS.getStats(boardUnits.get(tempUnit.value).get('name'));
    const level = +stats.get('cost');
    sum += 1 + Math.floor(level / 3);
    tempUnit = keysIter.next();
  }
  return sum;
}

/**
 * Remove hp from player
 * Mark player as defeated if hp <= 0, by removal of player from players
 * Also decrease amountOfPlayers
 */
async function removeHp(state, playerIndex, hpToRemove) {
  const currentHp = state.getIn(['players', playerIndex, 'hp']);
  if (currentHp - hpToRemove <= 0) {
    return state.setIn(['players', playerIndex, 'dead'], true);
  }
  return state.setIn(['players', playerIndex, 'hp'], currentHp - hpToRemove);
}

/**
 * winner: Gain 1 gold
 * loser: Lose hp
 *      Calculate amount of hp to lose
 * Parameters: Enemy player index, winningAmount = damage? (units or damage)
 */
const endBattle = async (stateParam, playerIndex, winner, finishedBoard, roundType, enemyPlayerIndex) => {
  let state = stateParam;
  // console.log('@Endbattle :', playerIndex, winner);
  if (f.isUndefined(finishedBoard)) console.log(finishedBoard);
  // console.log('@endBattle', state, playerIndex, winner, enemyPlayerIndex);
  const streak = state.getIn(['players', playerIndex, 'streak']) || 0;
  if (winner) { // Winner
    // TODO: Npc rewards and gym rewards
    switch (roundType) {
      case 'pvp': {
        const prevGold = state.getIn(['players', playerIndex, 'gold']);
        state = state.setIn(['players', playerIndex, 'gold'], prevGold + 1);
        const newStreak = (streak < 0 ? 0 : +streak + 1);
        state = state.setIn(['players', playerIndex, 'streak'], newStreak);
        f.p('@endBattle Won Player', playerIndex, prevGold, state.getIn(['players', playerIndex, 'gold']), newStreak);
        break;
      }
      case 'npc':
      case 'gym':
        /* TODO: Add item drops / special money drop */
      case 'shop':
      default:
    }
  } else { // Loser
    switch (roundType) {
      case 'pvp': {
        const newStreak = (streak > 0 ? 0 : +streak - 1);
        state = state.setIn(['players', playerIndex, 'streak'], newStreak);
        f.p('@Endbattle pvp', newStreak);
      }
      case 'npc': {
        const hpToRemove = await calcDamageTaken(finishedBoard);
        state = await removeHp(state, playerIndex, hpToRemove);
        f.p('@endBattle Lost Player', playerIndex, hpToRemove);
        break;
      }
      case 'gym': {
        const hpToRemove = await calcDamageTaken(finishedBoard);
        const gymDamage = Math.min(hpToRemove, 3);
        state = await removeHp(state, playerIndex, gymDamage);
        f.p('@endBattle Gymbattle');
      }
      case 'shop':
      default:
    }
  }
  // console.log('@endBattle prep', stateParam.get('players'));
  const potentialEndTurn = await prepEndTurn(state, playerIndex);
  return potentialEndTurn;
};

exports.endBattleForAll = async (stateParam, winners, finalBoards, matchups, roundType) => {
  let tempState = stateParam;
  const iter = stateParam.get('players').keys();
  let temp = iter.next();
  while (!temp.done) {
    const tempIndex = temp.value;
    const winner = winners.get(tempIndex);
    const finalBoard = finalBoards.get(tempIndex);
    const enemy = (matchups ? matchups.get(tempIndex) : undefined);
    // winner & newBoard & isPvpRound & enemy index required
    const round = tempState.get('round');
    const newStateAfterBattle = await endBattle(tempState, tempIndex, winner, finalBoard, roundType, enemy);
    if (newStateAfterBattle.get('round') === round + 1) {
      tempState = newStateAfterBattle;
    } else {
      tempState = tempState.setIn(['players', tempIndex], newStateAfterBattle.getIn(['players', tempIndex]));
    }
    temp = iter.next();
  }
  const newState = await tempState;
  return newState;
};

exports.removeDeadPlayer = async (stateParam, playerIndex) => {
  // console.log('@removeDeadPlayer')
  let state = stateParam;
  const filteredShop = state.getIn(['players', playerIndex, 'shop']).filter(piece => !f.isUndefined(piece));
  const shopUnits = fromJS(Array.from(filteredShop.map((value, key) => value.get('name')).values()));
  const board = state.getIn(['players', playerIndex, 'board']);
  let boardList = List([]);
  const iter = board.keys();
  let temp = iter.next();
  while (!temp.done) {
    const uid = temp.value;
    const unit = board.get(uid);
    boardList = boardList.push(unit.get('name'));
    temp = iter.next();
  }
  // console.log('BoardList', boardList);
  const hand = state.getIn(['players', playerIndex, 'hand']);
  let handList = List([]);
  const iter2 = hand.keys();
  let temp2 = iter2.next();
  while (!temp2.done) {
    const uid = temp2.value;
    const unit = hand.get(uid);
    handList = handList.push(unit.get('name'));
    temp2 = iter2.next();
  }
  // console.log('HandList', handList);
  const playerUnits = shopUnits.concat(boardList).concat(handList);
  console.log('@removeDeadPlayer', shopUnits, boardList, handList, '=', playerUnits);
  for (let i = 0; i < playerUnits.size; i++) {
    state = await discardBaseUnits(state, playerIndex, playerUnits.get(i));
  }
  // state = state.set('discardedPieces', state.get('discardedPieces').concat(playerUnits));
  const newState = state.set('players', state.get('players').delete(playerIndex));
  // console.log('@removeDeadPlayer', newState.get('players'));
  const amountOfPlayers = newState.get('amountOfPlayers') - 1;
  return newState.set('amountOfPlayers', amountOfPlayers);
};


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

exports.startGameGlobal = async (amountPlaying) => {
  const state = await initEmptyState(amountPlaying);
  return startGame(state);
};
