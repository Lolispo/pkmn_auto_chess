// Author: Petter Andersson

const { Map, List } = require('immutable');
const shuffle = require('immutable-shuffle');

const isUndefined = obj => (typeof obj === 'undefined');
exports.isUndefined = obj => isUndefined(obj);

exports.getRandomInt = max => Math.floor(Math.random() * Math.floor(max));

/**
 * Returns:
 * position: Map{
 *   x ,
 *   y (if missing -> is on hand, outside of the board)
 * }
 */
const pos = (x, y) => {
  // console.log('@pos', List([x]), List([x,y]));
  if (y === undefined) {
    //return Map({ x });
    return List([x])
  }
  //return Map({ x, y });
  return List([x,y])
};


const x = pos => {
  //return pos.get('x');
  return pos.get(0);
}

const y = pos => {
  return pos.get(1);
  //return pos.get('y');
}

exports.pos = (x,y) => pos(x,y);
exports.x = pos => x(pos);
exports.y = pos => y(pos);

/**
 * Given a position, returns if it is on hand or board
 */
exports.checkHandUnit = position => isUndefined(y(position));

/**
 * Reverses position, your units position on enemy boards
 */
exports.reverseUnitPos = posInput => pos(7 - x(posInput), 7 - y(posInput));

// exports.print = (obj, msg) => console.log(msg + JSON.stringify(obj)); // Normal version
exports.print = (obj, msg = '') => console.log(msg + JSON.stringify(obj, null, 2)); // Pretty printed version

exports.printBoard = async (boardParam, moveParam) => {
  const board = await boardParam;
  const move = await moveParam;
  const keysIter = board.keys();
  let tempUnit = keysIter.next();
  // console.log(move)
  console.log(` -- Move @${move.get('time')}: `);
  while (!tempUnit.done) {
    // console.log('@printBoard', tempUnit.value, board, moveParam)
    const xPos = x(tempUnit.value);
    const yPos = y(tempUnit.value);
    const action = move.get('action');
    const target = move.get('target');
    const unitPos = move.get('unitPos');
    const effect = move.get('effect');
    // Unit start string
    const builtString = `${(board.get(tempUnit.value).get('team') === 0 ? 'o' : 'x')}{${xPos},${yPos}}: `
    + `${board.get(tempUnit.value).get('name')}. hp: ${board.get(tempUnit.value).get('hp')} mana: ${board.get(tempUnit.value).get('mana')}`;
    let resultString = builtString;
    // Move string TODO Print dot damage here as well
    if ((x(unitPos) === xPos && y(unitPos) === yPos)
    || (action === 'move' && x(target) === xPos && y(target) === yPos)) {
      resultString = `${builtString} : ${action}(`
      + `${(move.get('abilityName') ? `${move.get('abilityName')}, `
      + `${(effect && effect.size > 0 ? (effect.get(target) ? `Dot applied: ${effect.get(target).get('dot')}, ` : `Healed: ${effect.get(unitPos).get('heal')}, `) : '')}` : '')}`
      + `target: {${x(target)},${y(target)}} ${
        isUndefined(move.get('value')) ? '' : `dmg: ${move.get('value')}`
      }${action === 'move' ? `from: {${x(unitPos)},${y(unitPos)}}` : ''})`;
    }
    console.log(resultString);
    tempUnit = keysIter.next();
  }
  console.log();
};

exports.removeFirst = async (state, id) => state.set(id, state.get(id).shift());

exports.push = (state, id, value) => state.set(id, state.get(id).push(value));

exports.shuffle = (state, id) => state.set(id, shuffle(state.get(id)));
