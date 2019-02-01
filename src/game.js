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
 * Move me
 * Refactor into two methods
 */
async function refreshShop(state, playerIndex) {
  const level = state.get('players').get(playerIndex).get('level');
  const prob = gameConstantsJS.getLevelPieceProbability(level);
  const random = Math.random();
  let probSum = 0.0;
  let fivePieces = List([]);
  let pieceStorage = state.get('pieces');
  for (let i = 0; i < 5; i++) { // TODO: Check if probSum logic works as intended
    if (probSum += prob.get('1') > random) {
      const piece = pieceStorage.get(0).get(0);
      fivePieces = fivePieces.push(piece);
      pieceStorage = stateLogicJS.removeFirst(pieceStorage, 0);
    } else if (probSum += prob.get('2') > random) {
      const piece = pieceStorage.get(1).get(0);
      fivePieces = fivePieces.push(piece);
      pieceStorage = stateLogicJS.removeFirst(pieceStorage, 1);
    } else if (probSum += prob.get('3') > random) {
      const piece = pieceStorage.get(2).get(0);
      fivePieces = fivePieces.push(piece);
      pieceStorage = stateLogicJS.removeFirst(pieceStorage, 2);
    } else if (probSum += prob.get('4') > random) {
      const piece = pieceStorage.get(3).get(0);
      fivePieces = fivePieces.push(piece);
      pieceStorage = stateLogicJS.removeFirst(pieceStorage, 3);
    } else if (probSum += prob.get('5') > random) {
      const piece = pieceStorage.get(0).get(4);
      fivePieces = fivePieces.push(piece);
      pieceStorage = stateLogicJS.removeFirst(pieceStorage, 4);
    }
  }
  return await stateLogicJS.updateShop(state, playerIndex, fivePieces, pieceStorage);
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
  if (unit !== null) {
    shop = shop.splice(unitID, 1, null);
    state = state.setIn(['players', playerIndex, 'shop'], shop);

    const hand = state.getIn(['players', playerIndex, 'hand']);
    const unitInfo = pokemonJS.getStats(unit);
    const unitHand = Map({
      name: unit,
      display_name: unitInfo.get('display_name'),
      position: Map({
        x: hand.size,
      }),
    });
    state = state.setIn(['players', playerIndex, 'hand'], hand.push(unitHand));

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
 * TODO
 * Place piece
 * Make this functions after!
 *  TODO: Withdraw piece (return)
 *      should use this aswell but should use to_position as best possible
 *  TODO: Swap Piece (New!)
 *
 * Handle upgrades!
 *  If 3 of the same exist on board, remove others and replace with evolves_to
 * position: Map{
 *   x ,
 *   y (can be missing -> is on hand, outside of the board)
 * }
 */
function placePiece(state, playerIndex, from_position, to_position) {
}

/**
 * TODO
 * Sell piece
 */
function sellPiece(state, playerIndex, piece_position) {
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
    const streakGold = Math.min(Math.floor(streak === 0 ? 0 : (Math.abs(streak) / 5) + 1), 3); // TODO: Math
    // console.log(`@playerEndTurn Gold: p[${i + 1}]: `, `${gold}, ${income_basic}, ${bonusGold}, ${streakGold}`);
    const newGold = gold + income_basic + bonusGold + streakGold;
    state = await state.setIn(['players', i, 'gold'], newGold);
    // console.log(i, '\n', state.get('pieces').get(0));
    // state = await state.set(i, state.getIn(['players', i]));
  }
  const newState = await state;
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
    // Send data to users TODO
  }
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
function endBattle(stateParam, playerIndex, winner, winningAmount) {
  let state = stateParam;
  const streak = state.getIn(['players', playerIndex, 'streak']) || 0;
  if (winner) {
    state = state.setIn(['players', playerIndex, 'gold'], state.getIn(['players', playerIndex, 'gold']) + 1);
    state = state.setIn(['players', playerIndex, 'streak'], streak + 1);
  } else {
    state = state.setIn(['players', playerIndex, 'hp'], state.getIn(['players', playerIndex, 'hp']) - winningAmount);
    state = state.setIn(['players', playerIndex, 'streak'], streak - 1);
  }
  prepEndTurn(state, playerIndex);
  return state;
}

exports.start = function () {
  let state = initEmptyState(2);
  // f.print(state, '**Initial State: ');
  state = refreshShop(state, 0);
  // f.print(state, '**State with shop given to player 0: ');
  state = buyUnit(state, 0, 1);
  f.print(state, '**State where player 0 Bought a Unit at index 1: ');
};
