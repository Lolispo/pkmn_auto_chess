// Author: Petter Andersson


const { Map, List, fromJS } = require('immutable');

const pokemon_js = require('./pokemon');

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
 * winner:
 *  Gain 1 gold
 * loser:
 *  Lose hp
 *      Calculate amount of hp to lose
 * Call on endTurn with result (to calculate lose/win streak)
 */
function endBattle(state, playerIndex, winner, winningAmount) { // Enemy player index, winningAmount = damage? (units or damage)
  if (winner) {
    state = state.setIn(['players', playerIndex, 'gold'], state.getIn(['players', playerIndex, 'gold']) + 1);
  } else {
    state = state.setIn(['players', playerIndex, 'hp'], state.getIn(['players', playerIndex, 'hp']) - winningAmount);
  }
  // When every battle is done, call endTurn. Find way to synchronize states here
}
