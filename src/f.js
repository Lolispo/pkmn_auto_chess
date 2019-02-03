// Author: Petter Andersson

const { Map } = require('immutable');

exports.getRandomInt = max => Math.floor(Math.random() * Math.floor(max));

//exports.print = (obj, msg) => console.log(msg + JSON.stringify(obj)); // Normal version
exports.print = (obj, msg) => console.log(msg + JSON.stringify(obj, null, 2));    // Pretty printed version

/**
 * Returns: 
 * position: Map{
 *   x ,
 *   y (if missing -> is on hand, outside of the board)
 * }
 */
exports.getPos = (x, y) => {
  if (y === undefined) {
    return Map({ x });
  }
  return Map({ x, y });
};

exports.isUndefined = obj => (typeof obj === 'undefined' ? true : false);
