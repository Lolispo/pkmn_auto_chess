// Author: Petter Andersson

const { Map } = require('immutable');

exports.getRandomInt = max => Math.floor(Math.random() * Math.floor(max));

// exports.print = (obj, msg) => console.log(msg + JSON.stringify(obj)); // Normal version
exports.print = (obj, msg = '') => console.log(msg + JSON.stringify(obj, null, 2)); // Pretty printed version

exports.printBoard = async (boardParam, moveParam) => {
  const board = await boardParam;
  const move = await moveParam;
  const keysIter = board.keys();
  let tempUnit = keysIter.next();
  // console.log(move)
  console.log();
  while (!tempUnit.done) {
    // console.log('@printBoard', tempUnit.value, board, moveParam)
    const x = tempUnit.value.get('x');
    const y = tempUnit.value.get('y');
    const action = move.get('action');
    const target = move.get('target');
    const unitPos = move.get('unitPos');
    const effect = move.get('effect');
    // Unit start string
    const builtString = `${(board.get(tempUnit.value).get('team') === 0 ? 'o' : 'x')}{${x},${y}}: `
    + `${board.get(tempUnit.value).get('name')}. hp: ${board.get(tempUnit.value).get('hp')} mana: ${board.get(tempUnit.value).get('mana')}`;
    let resultString = builtString;
    // Move string TODO Print dot damage here as well
    if ((unitPos.get('x') === x && unitPos.get('y') === y)
    || (action === 'move' && target.get('x') === x && target.get('y') === y)) {
      resultString = `${builtString} : ${action}(`
      + `${(move.get('abilityName') ? `${move.get('abilityName')}, `
      + `${(effect && effect.size > 0 ? (effect.get(target) ? effect.get(target).get('dot') + ', ' : effect.get(unitPos).get('heal') + ', ') : '')}` : '')}`
      + `target: {${target.get('x')},${target.get('y')}} ${
        typeof move.get('value') === 'undefined' ? '' : `dmg: ${move.get('value')}`
      }${action === 'move' ? `from: {${unitPos.get('x')},${unitPos.get('y')}}` : ''})`;
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
exports.pos = (x, y) => {
  if (y === undefined) {
    return Map({ x });
  }
  return Map({ x, y });
};

exports.isUndefined = obj => (typeof obj === 'undefined');
