// Author: Petter Andersson

const { Map } = require('immutable');

exports.getRandomInt = max => Math.floor(Math.random() * Math.floor(max));

// exports.print = (obj, msg) => console.log(msg + JSON.stringify(obj)); // Normal version
exports.print = (obj, msg='') => console.log(msg + JSON.stringify(obj, null, 2)); // Pretty printed version

exports.printBoard = async (boardParam, moveParam) => {
  const board = await boardParam;
  const move = await moveParam;
  const keysIter = board.keys();
  let tempUnit = keysIter.next();
  // console.log(move)
  console.log();
  while (!tempUnit.done) {
    const x = tempUnit.value.get('x');
    const y = tempUnit.value.get('y');
    const builtString = `{${x},${y}}: ${board.get(tempUnit.value).get('name')}. hp: ${board.get(tempUnit.value).get('hp')}`;
    let resultString = builtString;
    if ((move.get('unitPos').get('x') === x && move.get('unitPos').get('y') === y)
    || (move.get('action') === 'move' && move.get('target').get('x') === x && move.get('target').get('y') === y)) {
      resultString = `${builtString} : ${move.get('action')}(target: {${move.get('target').get('x')},${
        move.get('target').get('y')}} ${
        typeof move.get('value') === 'undefined' ? '' : `dmg: ${move.get('value')}`
      }${move.get('action') === 'move' ? `from: {${move.get('unitPos').get('x')},${move.get('unitPos').get('y')}}` : ''})`;
    }
    console.log(resultString);
    tempUnit = keysIter.next();
  }
};

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

exports.isUndefined = obj => (typeof obj === 'undefined');
