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
function refreshShop(state, playerIndex) {
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
  return stateLogicJS.updateShop(state, playerIndex, fivePieces, pieceStorage);
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
  shop = shop.splice(unitID, 1, null);
  state = state.setIn(['players', playerIndex, 'shop'], shop);

  const hand = state.getIn(['players', playerIndex, 'hand']);
  const unit_info = pokemonJS.getStats(unit);
  const unit_hand = Map({
    name: unit,
    display_name: unit_info.get('display_name'),
    position: Map({
      x: hand.size,
    }),
  });
  state = state.setIn(['players', playerIndex, 'hand'], hand.push(unit_hand));

  const currentGold = state.getIn(['players', playerIndex, 'gold']);
  return state.setIn(['players', playerIndex, 'gold'], currentGold - unit_info.get('cost'));
}


/**
 * TODO
 * toggleLock for player (setIn)
 */
function toggleLock(state, playerIndex) {
  const locked = state.getIn(['players', playerIndex, 'locked']);
  if (locked === false || locked === undefined) {
    return state.setIn(['players', playerIndex, 'locked'], true);
  }
  return state.setIn(['players', playerIndex, 'locked'], false);
}

function increaseExp(state, playerIndex, amount) {
  const player = state.getIn(['players', playerIndex]);
  let level = player.get('level');
  let exp = player.get('exp');
  let exp_to_reach = player.get('exp_to_reach');
  while (amount > 0) {
    if (exp_to_reach > exp + amount) { // not enough exp to level up
      exp += amount;
      amount = 0;
      player.set('level', level);
      player.set('exp', exp);
      player.set('exp_to_reach', exp_to_reach);
      return state.setIn(['players', playerIndex], player);
    } // Leveling up
    level++;
    exp_to_reach = gameConstantsJS.getExpRequired(level);
    amount -= exp_to_reach - exp;
    // 2exp -> 4 when +5 => lvlup +3 exp: 5 = 5 - (4 - 2) = 5 - 2 = 3
    exp = 0;
  }
  return state;
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
function endTurn(stateParam) {
  let state = stateParam;
  const income_basic = state.get('income_basic');
  for (let i = 0; i < state.get('amountOfPlayers'); i++) {
    state = increaseExp(state, i, 1);
    if (state.getIn(['players', i, 'locked'])) {
      state = refreshShop(state, i);
    }
    const gold = state.getIn(['players', i, 'gold']);
    const bonusGold = Math.min(gold % 10, 5); // TODO: Check math, TODO Test
    const streak = state.getIn(['players', i, 'streak']) || 0;
    let streakGold = Math.floor(Math.abs(streak) / 2); // TODO: Math
    streakGold = (streakGold >= 0 ? Math.min(streakGold, 3) : Math.max(streakGold, -3));
    console.log(`Gold updated for player ${i + 1}: `, `${gold}, ${income_basic}, ${bonusGold}, ${streakGold}`);
    const newGold = gold + income_basic + bonusGold + streakGold;
    state = state.setIn(['players', i, 'gold'], newGold);
  }
  const round = state.get('round');
  state = state.set('round', round + 1);
  if (round % 10 === 0) {
    state = state.set('income_basic', income_basic + 1);
  }
  return state;
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
