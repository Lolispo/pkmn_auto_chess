// Author: Petter Andersson
'use strict';

const { Map, List, fromJS } = require('immutable');

const pokemon_js = require('./pokemon');

/**
 * Board interaction
 * On move: reset the ids to index
 */

/**
 * TODO
 * Place piece (withdraw uses this aswell)
 * Return should use this aswell but should use to_position as best possible
 * position: Map{
 *   x ,
 *   y (can be missing -> is on hand, outside of the board)
 * }
 */
function placePiece(state, playerIndex, from_position, to_position){
}

/**
 * TODO
 * Sell piece
 */
function sellPiece(state, playerIndex, piece_position){
}