// Author: Petter Andersson

const shuffle = require('immutable-shuffle');
const gameConstantsJS = require('./game_constants');

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
    return String(x);
  }
  return `${x},${y}`;
};


const x = (position) => {
  if (!isUndefined(position)) {
    const splitted = position.split(',');
    const curr = splitted[0];
    return (isUndefined(curr) ? curr : parseInt(curr, 10));
  }
  console.log('pos is undefined WE ARE FUCKED');
  return 0;
};

const y = (position) => {
  const splitted = position.split(',');
  const curr = splitted[1];
  return (isUndefined(curr) ? curr : parseInt(curr, 10));
};

exports.pos = (px, py) => pos(px, py);
exports.x = position => x(position);
exports.y = position => y(position);

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

const p = (msg) => {
  if (gameConstantsJS.debugMode) console.log(msg);
};

exports.p = msg => p(msg);

exports.printBoard = async (boardParam, moveParam) => {
  const board = await boardParam;
  const move = await moveParam;
  const keysIter = board.keys();
  let tempUnit = keysIter.next();
  if (isUndefined(board) || isUndefined(move)) {
    console.log('@printBoard', board, move);
  }
  p(` -- Move @${move.get('time')}: ${move.get('action')} ${(move.get('action') === 'attack' ? move.get('direction') : '')}`);
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
    p(resultString);
    tempUnit = keysIter.next();
  }
  p('');
};

exports.removeFirst = async (state, id) => state.set(id, state.get(id).shift());

exports.push = (state, id, value) => state.set(id, state.get(id).push(value));

exports.shuffle = (state, id) => state.set(id, shuffle(state.get(id)));

const shuffleFisher = (listParam) => {
  let list = listParam;
  for (let i = list.size - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    // console.log('@shuffleFisher', i, randomIndex, 'Swapping', list.get(randomIndex), list.get(i), list)
    const last = list.get(i);
    list = list.set(i, list.get(randomIndex));
    list = list.set(randomIndex, last);
  }
  // console.log('shuffleFisher', list);
  return list;
};

exports.shuffleImmutable = list => shuffleFisher(list);
