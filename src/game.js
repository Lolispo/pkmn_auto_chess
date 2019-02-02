// Author: Petter Andersson

const { Map, List } = require('immutable');

const pokemonJS = require('./pokemon');
const deckJS = require('./deck');
const f = require('./f');
const playerJS = require('./player');
const stateLogicJS = require('./state_logic');
const gameConstantsJS = require('./game_constants');

/**
 * File used for interactive methods for users
 */


function buildPieceStorage() {
  let availablePieces = List([List([]), List([]), List([]), List([]), List([])]);
  const decks = deckJS.getDecks();
  for (let i = 0; i < decks.size; i++) {
    for (let j = 0; j < decks.get(i).size; j++) {
      const pokemon = decks.get(i).get(j);
      if (pokemon.get('evolves_from') === undefined) { // Only add base level
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
    piece = await pieceStorage.get(i).get(0);
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
    if (piece !== undefined) {
      newShop = await newShop.push(piece);
      newPieceStorage = await stateLogicJS.removeFirst(newPieceStorage, i); // Removes first from correct rarity array
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
    newShop = await obj.newShop;
    pieceStorage = await obj.pieceStorage;
  }
  const shop = await state.getIn(['players', playerIndex, 'shop']);
  if (shop.size !== 0) {
    state = await state.set('discarded_pieces', state.get('discarded_pieces').concat(shop));
  }
  state = await state.setIn(['players', playerIndex, 'shop'], newShop);
  state = await state.set('pieces', pieceStorage);
  return state;
}

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
  if (unit !== undefined) {
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
 * TODO
 * toggleLock for player (setIn)
 */
async function toggleLock(state, playerIndex) {
  const locked = state.getIn(['players', playerIndex, 'locked']);
  if (locked === false || locked === undefined) {
    return state.setIn(['players', playerIndex, 'locked'], true);
  }
  return state.setIn(['players', playerIndex, 'locked'], false);
}

async function increaseExp(stateParam, playerIndex, amount) {
  let state = stateParam;
  let player = state.getIn(['players', playerIndex]);
  let level = player.get('level');
  let exp = player.get('exp');
  let expToReach = player.get('expToReach');
  while (amount >= 0) {
    // console.log(exp, level, expToReach, amount, expToReach > exp + amount);
    if (expToReach > exp + amount) { // not enough exp to level up
      exp += amount;
      amount = 0;
      player = player.set('level', level);
      player = player.set('exp', exp);
      player = player.set('expToReach', expToReach);
      state = await state.setIn(['players', playerIndex], player);
      break;
    } else { // Leveling up
      level += 1;
      amount -= expToReach - exp;
      expToReach = gameConstantsJS.getExpRequired(level);
      // 2exp -> 4 when +5 => lvlup +3 exp: 5 = 5 - (4 - 2) = 5 - 2 = 3
      exp = 0;
    }
  }
  return await state;
}

/**
 * TODO
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
  const boardUnits = state.getIn('players', playerIndex, 'board');
  const name = piece.get('name');
  let pieceCounter = 0;
  const positions = List([]);
  boardUnits.forEach((row) => {
    row.forEach((unit) => {
      if (unit.get('name') === name) {
        pieceCounter += 1;
        positions.push(unit.get('position'));
      }
    });
  });
  if (pieceCounter >= 3) { // Upgrade unit @ position
    for (const pos in positions) { // TODO: Esllint says this could be better, not efficient
      const newBoard = await state.getIn(['players', playerIndex, 'board']).delete(pos);
      state = await state.setIn(['players', playerIndex, 'board'], newBoard);
    }
    const evolvesTo = pokemonJS.getStats(name).get('evolves_to');
    const newPiece = getBoardUnit(evolvesTo.get('name'), position.get('x'), position.get('y'));
    state = await state.setIn(['players', playerIndex, 'board', position], newPiece);
  }
  return state;
}

const checkHandUnit = position => position.get('y') === undefined;

/**
 * TODO
 * Place piece
 * Swap functionality by default, if something is there already
 * Make these functions after!
 *  TODO: Withdraw piece (return)
 *      should use this aswell but should use to_position as best possible
 *
 * position: Map{
 *   x ,
 *   y (can be missing -> is on hand, outside of the board)
 * }
 */
async function placePiece(stateParam, playerIndex, fromPosition, toPosition, shouldSwap = 'true') {
  let piece;
  let state = stateParam;
  if (checkHandUnit(fromPosition)) { // from hand
    piece = state.getIn(['players', playerIndex, 'hand', fromPosition]);
    const newHand = await state.getIn(['players', playerIndex, 'hand']).delete(fromPosition);
    state = await state.setIn(['players', playerIndex, 'hand'], newHand);
  } else { // from board
    piece = state.getIn(['players', playerIndex, 'board', fromPosition]);
    const newBoard = await state.getIn(['players', playerIndex, 'board']).delete(fromPosition);
    state = await state.setIn(['players', playerIndex, 'board'], newBoard);
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
  if (shouldSwap) {
    if (checkHandUnit(fromPosition)) {
      state = state.setIn(['players', playerIndex, 'hand', fromPosition], newPiece);
    } else {
      state = state.setIn(['players', playerIndex, 'board', fromPosition], newPiece);
      state = await checkPieceUpgrade(state, playerIndex, newPiece, fromPosition);
    }
  }
  return await state;
}

/**
 * When units are sold, when level 1, a level 1 unit should be added to discarded_pieces
 * Level 2 => 3 level 1 units, Level 3 => 9 level 1 units
 */
async function discardBaseUnits(state, name, depth = '1') {
  const unitStats = pokemonJS.getStats(name);
  const evolutionFrom = unitStats.get('evolution_from');
  if (unitStats.get('evolution_from') === undefined) { // Base level
    let discPieces = await state.get('discarded_pieces');
    for (let i = 0; i < Math.pow(3, depth - 1); i++) {
      discPieces = await discPieces.push(name);
    }
    return await state.set('discarded_pieces', discPieces);
  }
  const newName = evolutionFrom.get('name');
  return await discardBaseUnits(state, newName, depth + 1);
}

/**
 * TODO
 * Sell piece
 * Increase money for player
 * Remove piece from position
 * add piece to discarded pieces
 */
async function sellPiece(state, playerIndex, piecePosition) {
  let pieceTemp;
  if (checkHandUnit(piecePosition)) { // TODO: Make this into method, taking pos and get/set, if set take argument to set
    pieceTemp = await state.getIn(['players', playerIndex, 'hand', piecePosition]);
  } else {
    pieceTemp = await state.getIn(['players', playerIndex, 'board', piecePosition]);
  }
  const piece = await pieceTemp;
  const unitStats = await pokemonJS.getStats(piece.get('name'));
  const cost = unitStats.get('cost');
  const gold = state.getIn(['players', playerIndex, 'gold']);
  let newState = await state.setIn(['players', playerIndex, 'gold'], +gold + +cost); // Required for int addition of strings
  if (checkHandUnit(piecePosition)) {
    const newHand = await newState.getIn(['players', playerIndex, 'hand']).delete(piecePosition);
    newState = await newState.setIn(['players', playerIndex, 'hand'], newHand);
  } else {
    const newBoard = await newState.getIn(['players', playerIndex, 'board']).delete(piecePosition);
    newState = await newState.setIn(['players', playerIndex, 'board'], newBoard);
  }
  // Add units to discarded Cards, add base level of card
  return await discardBaseUnits(newState, piece.get('name'));
}

/**
 * TODO
 * Start battle
 * Random Opponent
 * Spawn opponent in reverse board
 * Battle:
 *  Simulate random movement on back-end (here)
 *  Calculate order of attacks for all units adjacent to each other
 *  Keep looping Movement -> Attack -> Mana -> Spell -> Check Team Dead
 *  When Team Dead
 * battle: first movement random, then ->
 * jump to closets target one team at a time, if in range attack until teams are dead
 */
function startBattle(state, playerIndex, piece_position) {
}

/**
 * TODO
 * *This is not a player made action, time based event for all players
 * *When last battle is over this method shall be called
 * Increase players exp by 1
 * Refresh shop as long as player is not locked
 * Gold:
 *  Interest for 10 gold
 *  Increasing throughout the game basic income
 *  Win streak / lose streak (TODO)
 */
async function endTurn(stateParam) {
  let state = stateParam;
  const income_basic = state.get('income_basic');
  const round = state.get('round');
  state = await state.set('round', round + 1);
  if (round <= 5) {
    state = await state.set('income_basic', income_basic + 1);
  }
  return await playerEndTurn(state, state.get('amountOfPlayers'), income_basic + 1);
}

async function playerEndTurn(stateParam, amountPlayers, income_basic) {
  let state = stateParam;
  // console.log('@playerEndTurn\n', state, state.get('amountOfPlayers'));
  for (let i = 0; i < amountPlayers; i++) {
    const locked = await state.getIn(['players', i, 'locked']);
    if (!locked || locked === undefined) {
      state = await refreshShop(state, i);
      // console.log('Not locked for player[' + i + '] \n', state.get('pieces').get(0));
    }
    state = await increaseExp(state, i, 1);
    const gold = await state.getIn(['players', i, 'gold']);
    // Min 0 gold interest -> max 5
    const bonusGold = Math.min(Math.floor(gold / 10), 5);
    const streak = state.getIn(['players', i, 'streak']) || 0;
    const streakGold = Math.min(Math.floor(
      (streak === 0 || Math.abs(streak) === 1 ? 0 : (Math.abs(streak) / 5) + 1),
    ), 3);
    // console.log(`@playerEndTurn Gold: p[${i + 1}]: `,
    // `${gold}, ${income_basic}, ${bonusGold}, ${streakGold}`);
    const newGold = gold + income_basic + bonusGold + streakGold;
    state = await state.setIn(['players', i, 'gold'], newGold);
    // console.log(i, '\n', state.get('pieces').get(0));
    // state = await state.set(i, state.getIn(['players', i]));
  }
  const newState = await state; // Promise.all TODO
  return newState;
}

let synchronizedPlayers = Map({});

/**
 * Builds new state after battles
 */
function prepEndTurn(state, playerIndex) {
  synchronizedPlayers = synchronizedPlayers.set(playerIndex, state.getIn(['players', playerIndex]));
  if (synchronizedPlayers.size === state.get('amountOfPlayers')) {
    const newState = state.set('players', synchronizedPlayers); // Set
    const newRoundState = endTurn(newState);
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
  if (boardUnits === undefined || boardUnits.size === 0) { // boardUnits === undefined
    return 0; // When there are no units left for the enemy, don't lose hp (A tie)
  }
  const keysIter = boardUnits.keys();
  const size = boardUnits.size;
  let tempUnit = keysIter.next();
  let sum = 0;
  // console.log('@calcDamageTaken', boardUnits.size)
  while (!tempUnit.done) {
    sum += +pokemonJS.getStats(boardUnits.get(tempUnit.value).get('name')).get('cost');
    tempUnit = keysIter.next();
  }
  return sum;
}

/**
 * Remove hp from player
 * Mark player as defeated if hp <= 0
 */
async function removeHp(state, playerIndex, hpToRemove) {
  const currentHp = state.getIn(['players', playerIndex, 'hp']);
  if (currentHp - hpToRemove <= 0) {
    // TODO: Mark player as defeated
    // TODO: Check if there is only one player left
    return state;
  }
  return state.setIn(['players', playerIndex, 'hp'], currentHp - hpToRemove);
}

exports.start = function () {
  let state = initEmptyState(2);
  // f.print(state, '**Initial State: ');
  state = refreshShop(state, 0);
  // f.print(state, '**State with shop given to player 0: ');
  state = buyUnit(state, 0, 1);
  f.print(state, '**State where player 0 Bought a Unit at index 1: ');
};
