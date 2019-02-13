// Author: Petter Andersson

const { Map, List, Set } = require('immutable');

const pokemonJS = require('./pokemon');
const deckJS = require('./deck');
const f = require('./f');
const playerJS = require('./player');
const typesJS = require('./types');
const stateLogicJS = require('./state_logic');
const gameConstantsJS = require('./game_constants');
const abilitiesJS = require('./abilities');

/**
 * File used for game logic
 */

/**
  * Builds deck of pokemon loaded from pokemon.js
  * Optional parameter to choose pokemon for deck (mainly for testing)
  */
async function buildPieceStorage(optList) {
  let availablePieces = List([List([]), List([]), List([]), List([]), List([])]);
  const decks = await deckJS.getDecks();
  // console.log('@buildPieceStorage: decks', decks)
  for (let i = 0; i < decks.size; i++) {
    for (let j = 0; j < decks.get(i).size; j++) {
      const pokemon = decks.get(i).get(j);
      if (f.isUndefined(optList) || optList.includes(pokemon.get('name'))) {
        const rarityAmount = gameConstantsJS.getRarityAmount(pokemon.get('cost'));
        // console.log('Adding', rarityAmount, pokemon.get('name'), 'to', pokemon.get('cost'));
        for (let l = 0; l < rarityAmount; l++) {
          availablePieces = stateLogicJS.push(availablePieces, i, pokemon.get('name'));
        }
      }
    }
    availablePieces = stateLogicJS.shuffle(availablePieces, i);
  }
  // console.log('\n@buildPieceStorage: availablePieces', availablePieces)
  return availablePieces;
}

async function initEmptyState(amountPlaying, optList) {
  const pieceStorage = await buildPieceStorage(optList);
  const state = Map({
    pieces: pieceStorage,
    discarded_pieces: List([]),
    round: 1,
    income_basic: 1,
  });
  return playerJS.initPlayers(state, amountPlaying);
}

/**
 * Fills pieceStorage with discardedPieces
 */
async function refillPieces(pieces, discardedPieces) {
  let pieceStorage = pieces;
  if (discardedPieces.size === 0) {
    return pieces;
  }
  console.log('@refillPieces', discardedPieces); // pieceStorage
  for (let i = 0; i < discardedPieces.size; i++) {
    const name = discardedPieces.get(i);
    const cost = (await pokemonJS.getStats(discardedPieces.get(i))).get('cost');
    pieceStorage = await stateLogicJS.push(pieceStorage, cost - 1, name);
  }
  return pieceStorage;
}

/**
 * Finds correct rarity for piece (random value)
 * Returns the piece taken from pieceStorage from correct rarity list
 * i is used to know which rarity it is checking (from 1 to 5)
 * Made sure after method that rarity contain pieces
 */
async function getPieceFromRarity(prob, index, pieceStorage) {
  const random = Math.random();
  let piece;
  if (prob > random) {
    piece = pieceStorage.get(index).get(0);
  }
  return piece;
}

/**
 * Updates shop with a new piece from getPieceFromRarity
 * Removes the piece from correct place in pieceStorage
 */
async function addPieceToShop(shop, pieces, level, discPieces) {
  const prob = gameConstantsJS.getPieceProbabilityNum(level);
  let newShop = shop;
  let newPieceStorage = pieces;
  let newDiscPieces = discPieces;
  // console.log('addPieceToShop LEVEL ', level, prob)
  for (let i = 0; i < 5; i++) { // Loop over levels
    // If any piece storage goes empty -> put all discarded pieces in pieces
    if (newPieceStorage.get(i).size === 0) {
      newPieceStorage = await refillPieces(newPieceStorage, discPieces);
      newDiscPieces = List([]);
    }
    // TODO: In theory, pieces might still be empty here, if not enough pieces were in the deck.
    // Temp: If still empty for that level, try a level below
    let piece;
    if (newPieceStorage.get(i).size === 0) {
      if (i != 0) {
        piece = await getPieceFromRarity(prob[i - 1], i - 1, newPieceStorage);
      } else {
        console.log('Not enough pieces of lower rarity, and current rarity not found');
        process.exit();
      }
    } else {
      piece = await getPieceFromRarity(prob[i], i, newPieceStorage);
    }
    // console.log('addPieceToShop piece: ', piece, prob[i], i);
    if (!f.isUndefined(piece)) {
      newShop = newShop.push(piece);
      // Removes first from correct rarity array
      newPieceStorage = await stateLogicJS.removeFirst(newPieceStorage, i);
      break;
    }
  }
  return { newShop, pieceStorage: newPieceStorage, discPieces: newDiscPieces };
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
  let discPieces = state.get('discarded_pieces');
  for (let i = 0; i < 5; i++) { // Loop over pieces
    const obj = await addPieceToShop(newShop, pieceStorage, level, discPieces);
    newShop = obj.newShop;
    pieceStorage = obj.pieceStorage;
    discPieces = obj.discPieces;
  }
  const shop = state.getIn(['players', playerIndex, 'shop']);
  if (shop.size !== 0) {
    state = state.set('discarded_pieces', discPieces.concat(shop.filter(piece => !f.isUndefined(piece))));
  }
  state = state.setIn(['players', playerIndex, 'shop'], newShop);
  state = state.set('pieces', pieceStorage);
  return state;
}

/**
 * Create unit for board/hand placement from name and spawn position
 */
async function getBoardUnit(name, x, y) {
  const unitInfo = await pokemonJS.getStats(name);
  // console.log('getBoardUnit', unitInfo)
  return Map({
    name,
    display_name: unitInfo.get('display_name'),
    position: f.pos(x, y),
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
async function buyUnit(stateParam, playerIndex, unitID) {
  let state = stateParam;
  let shop = state.getIn(['players', playerIndex, 'shop']);
  const unit = shop.get(unitID);
  if (!f.isUndefined(unit)) {
    shop = shop.splice(unitID, 1, undefined);
    state = state.setIn(['players', playerIndex, 'shop'], shop);

    const hand = state.getIn(['players', playerIndex, 'hand']);
    const unitInfo = await pokemonJS.getStats(unit);
    const unitHand = await getBoardUnit(unit, hand.size);
    // console.log('@buyUnit unitHand', unitHand)
    state = state.setIn(['players', playerIndex, 'hand'], hand.set(unitHand.get('position'), unitHand));

    const currentGold = state.getIn(['players', playerIndex, 'gold']);
    state = state.setIn(['players', playerIndex, 'gold'], currentGold - unitInfo.get('cost'));
  }
  return state;
}


/**
 * toggleLock for player (setIn)
 */
async function toggleLock(state, playerIndex) {
  const locked = state.getIn(['players', playerIndex, 'locked']);
  if (!locked) {
    return state.setIn(['players', playerIndex, 'locked'], true);
  }
  return state.setIn(['players', playerIndex, 'locked'], false);
}

async function increaseExp(stateParam, playerIndex, amountParam) {
  let state = stateParam;
  let player = state.getIn(['players', playerIndex]);
  let level = player.get('level');
  let exp = player.get('exp');
  let expToReach = player.get('expToReach');
  let amount = amountParam;
  while (amount >= 0) {
    // console.log(exp, level, expToReach, amount, expToReach > exp + amount);
    if (expToReach > exp + amount) { // not enough exp to level up
      exp += amount;
      amount = 0;
      player = player.set('level', level);
      player = player.set('exp', exp);
      player = player.set('expToReach', expToReach);
      state = state.setIn(['players', playerIndex], player); // await
      break;
    } else { // Leveling up
      level += 1;
      amount -= expToReach - exp;
      expToReach = gameConstantsJS.getExpRequired(level);
      // 2exp -> 4 when +5 => lvlup +3 exp: 5 = 5 - (4 - 2) = 5 - 2 = 3
      exp = 0;
    }
  }
  return state;
}

/**
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
  const boardUnits = state.getIn(['players', playerIndex, 'board']);
  const name = piece.get('name');
  let pieceCounter = 0;
  let positions = List([]);
  const keysIter = boardUnits.keys();
  let tempUnit = keysIter.next();
  while (!tempUnit.done) {
    const unit = boardUnits.get(tempUnit.value);
    if (unit.get('name') === name) {
      pieceCounter += 1;
      positions = positions.push(unit.get('position'));
    }
    tempUnit = keysIter.next();
  }
  if (pieceCounter >= 3) { // Upgrade unit @ position
    let board = state.getIn(['players', playerIndex, 'board']);
    for (let i = 0; i < positions.size; i++) {
      board = board.delete(positions.get(i));
    }
    state = state.setIn(['players', playerIndex, 'board'], board);
    const stats = await pokemonJS.getStats(name);
    const evolvesTo = stats.get('evolves_to');
    // Check if multiple evolutions exist, random between
    let newPiece;
    if (!f.isUndefined(evolvesTo.size)) { // List
      newPiece = await getBoardUnit(evolvesTo.get(f.getRandomInt(evolvesTo.size)), position.get('x'), position.get('y'));
    } else { // Value
      newPiece = await getBoardUnit(evolvesTo, position.get('x'), position.get('y'));
    }
    state = state.setIn(['players', playerIndex, 'board', position], newPiece);
  }
  return state;
}
/**
 * Given a position, returns if it is on hand or board
 */
const checkHandUnit = position => f.isUndefined(position.get('y'));

/**
 * Place piece
 * Swap functionality by default, if something is there already
 * * Assumes that only have of the board is placed on
 */
async function placePiece(stateParam, playerIndex, fromPosition, toPosition, shouldSwap = 'true') {
  let piece;
  let state = stateParam;
  if (checkHandUnit(fromPosition)) { // from hand
    piece = state.getIn(['players', playerIndex, 'hand', fromPosition]).set('position', toPosition);
    const newHand = state.getIn(['players', playerIndex, 'hand']).delete(fromPosition);
    state = state.setIn(['players', playerIndex, 'hand'], newHand);
  } else { // from board
    piece = state.getIn(['players', playerIndex, 'board', fromPosition]).set('position', toPosition);
    const newBoard = state.getIn(['players', playerIndex, 'board']).delete(fromPosition);
    state = state.setIn(['players', playerIndex, 'board'], newBoard);
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
  if (shouldSwap && !f.isUndefined(newPiece)) {
    if (checkHandUnit(fromPosition)) {
      state = state.setIn(['players', playerIndex, 'hand', fromPosition], newPiece.set('position', fromPosition));
    } else {
      state = state.setIn(['players', playerIndex, 'board', fromPosition], newPiece.set('position', fromPosition));
      state = await checkPieceUpgrade(state, playerIndex, newPiece, fromPosition);
    }
  }
  return state;
}

/**
 * WithdrawPiece from board to best spot on bench
 * * Assumes not bench is full
 */
async function withdrawPiece(state, playerIndex, piecePosition) {
  const hand = state.getIn(['players', playerIndex, 'hand']);
  let benchPosition;
  for (let i = 0; i < 8; i++) {
    // Get first available spot on bench
    const pos = f.pos(i);
    if (f.isUndefined(hand.get(pos))) {
      benchPosition = pos;
      break;
    }
  }
  return placePiece(state, playerIndex, piecePosition, benchPosition, false);
}

/**
 * When units are sold, when level 1, a level 1 unit should be added to discarded_pieces
 * Level 2 => 3 level 1 units, Level 3 => 9 level 1 units
 */
async function discardBaseUnits(state, name, depth = '1') {
  const unitStats = await pokemonJS.getStats(name);
  const evolutionFrom = unitStats.get('evolution_from');
  if (f.isUndefined(unitStats.get('evolution_from'))) { // Base level
    let discPieces = state.get('discarded_pieces');
    const amountOfPieces = 3 ** (depth - 1); // Math.pow
    for (let i = 0; i < amountOfPieces; i++) {
      discPieces = await discPieces.push(name);
    }
    return state.set('discarded_pieces', discPieces);
  }
  const newName = evolutionFrom.get('name');
  return discardBaseUnits(state, newName, depth + 1);
}

/**
 * Sell piece
 * Increase money for player
 * Remove piece from position
 * add piece to discarded pieces
 */
async function sellPiece(state, playerIndex, piecePosition) {
  let pieceTemp;
  // TODO: Make this into method, taking pos and get/set, if set take argument to set
  if (checkHandUnit(piecePosition)) {
    pieceTemp = state.getIn(['players', playerIndex, 'hand', piecePosition]);
  } else {
    pieceTemp = state.getIn(['players', playerIndex, 'board', piecePosition]);
  }
  const piece = pieceTemp;
  const unitStats = await pokemonJS.getStats(piece.get('name'));
  const cost = unitStats.get('cost');
  const gold = state.getIn(['players', playerIndex, 'gold']);
  let newState = state.setIn(['players', playerIndex, 'gold'], +gold + +cost);
  if (checkHandUnit(piecePosition)) {
    const newHand = newState.getIn(['players', playerIndex, 'hand']).delete(piecePosition);
    newState = newState.setIn(['players', playerIndex, 'hand'], newHand);
  } else {
    const newBoard = newState.getIn(['players', playerIndex, 'board']).delete(piecePosition);
    newState = newState.setIn(['players', playerIndex, 'board'], newBoard);
  }
  // Add units to discarded Cards, add base level of card
  return discardBaseUnits(newState, piece.get('name'));
}

/**
 * Get first available spot at max range away from closest enemy
 * spot that is at maximal possible range from enemy, otherwise closer
 * Different favorable positions for S and N team, prioritize your side movement
 * (Assasins functionality can use enemyTeam as input)
 */
function getMovePos(board, closestEnemyPos, range, team) {
  const x = closestEnemyPos.get('x');
  const y = closestEnemyPos.get('y');
  for (let i = range; i >= 1; i--) {
    if (team === 0) { // S team
      if (f.isUndefined(board.get(f.pos(x, y - i)))) { // S
        return f.pos(x, y - i);
      } if (f.isUndefined(board.get(f.pos(x - i, y - i)))) { // SW
        return f.pos(x - i, y - i);
      } if (f.isUndefined(board.get(f.pos(x + i, y - i)))) { // SE
        return f.pos(x + i, y - i);
      } if (f.isUndefined(board.get(f.pos(x - i, y)))) { // W
        return f.pos(x - i, y);
      } if (f.isUndefined(board.get(f.pos(x + i, y)))) { // E
        return f.pos(x + i, y);
      } if (f.isUndefined(board.get(f.pos(x, y + i)))) { // N
        return f.pos(x, y + i);
      } if (f.isUndefined(board.get(f.pos(x - i, y + i)))) { // NW
        return f.pos(x - i, y + i);
      } if (f.isUndefined(board.get(f.pos(x + i, y + i)))) { // NE
        return f.pos(x + i, y + i);
      }
    } else { // N team
      if (f.isUndefined(board.get(f.pos(x, y + i)))) { // N
        return f.pos(x, y + i);
      } if (f.isUndefined(board.get(f.pos(x + i, y + i)))) { // NE
        return f.pos(x + i, y + i);
      } if (f.isUndefined(board.get(f.pos(x - i, y + i)))) { // NW
        return f.pos(x - i, y + i);
      } if (f.isUndefined(board.get(f.pos(x + i, y)))) { // E
        return f.pos(x + i, y);
      } if (f.isUndefined(board.get(f.pos(x - i, y)))) { // W
        return f.pos(x - i, y);
      } if (f.isUndefined(board.get(f.pos(x, y - i)))) { // S
        return f.pos(x, y - i);
      } if (f.isUndefined(board.get(f.pos(x + i, y - i)))) { // SE
        return f.pos(x + i, y - i);
      } if (f.isUndefined(board.get(f.pos(x - i, y - i)))) { // SW
        return f.pos(x - i, y - i);
      }
    }
  }
  // TODO: if no spot available, move closer to enemy?
  // Temp: no move
  return undefined;
}


/**
 * return closest enemy and marks if within range or not
 * Map({closestEnemy, withinRange})
 */
function getClosestEnemy(board, unitPos, range, team) {
  // f.print(board, '@getClosestEnemy board')
  const x = unitPos.get('x');
  const y = unitPos.get('y');
  const enemyTeam = 1 - team;
  for (let i = 1; i <= 8; i++) {
    const withinRange = i <= range;
    // console.log(withinRange, x, y, i, (x-i), (y-i))
    for (let j = x - i; j <= x + i; j++) {
      if (!f.isUndefined(board.get(f.pos(j, y - i))) && board.get(f.pos(j, y - i)).get('team') === enemyTeam) { // SW
        return Map({ closestEnemy: f.pos(j, y - i), withinRange });
      } if (!f.isUndefined(board.get(f.pos(j, y + i))) && board.get(f.pos(j, y + i)).get('team') === enemyTeam) { // NW
        return Map({ closestEnemy: f.pos(j, y + i), withinRange });
      }
    }
    for (let j = y - i + 1; j < y + i; j++) {
      if (!f.isUndefined(board.get(f.pos(x - i, j))) && board.get(f.pos(x - i, j)).get('team') === enemyTeam) { // SW
        return Map({ closestEnemy: f.pos(x - i, j), withinRange });
      } if (!f.isUndefined(board.get(f.pos(x + i, j))) && board.get(f.pos(x + i, j)).get('team') === enemyTeam) { // NW
        return Map({ closestEnemy: f.pos(x + i, j), withinRange });
      }
    }
  }
  f.print(board, '@getClosestEnemy Returning undefined: Board\n');
  console.log('@getClosestEnemy Returning undefined: ', x, y, range, team);
  return undefined;
}

/**
 * Remove hp from unit
 * Remove unit if hp <= 0
 * Percent currently not used, hp to remove calculated before hand
 * ({board, unitDied})
 */
async function removeHpBattle(board, unitPos, hpToRemove, percent = false) {
  const currentHp = board.getIn([unitPos, 'hp']);
  // console.log('@removeHpBattle', hpToRemove)
  let newHp = currentHp - hpToRemove;
  if (percent) {
    const maxHp = (await pokemonJS.getStats(board.get(unitPos).get('name'))).get('hp');
    newHp = await Math.round(currentHp - (maxHp * hpToRemove)); // HptoRemove is percentage to remove
  }
  if (newHp <= 0) {
    console.log('@removeHpBattle UNIT DIED!', currentHp, '->', (percent ? `${newHp}(%)` : `${newHp}(-)`));
    return Map({ board: board.delete(unitPos), unitDied: true });
  }
  // Caused a crash0
  if (isNaN(currentHp - hpToRemove)) {
    console.log('Exiting (removeHpBattle) ... ', currentHp, hpToRemove, board.get(unitPos));
    console.log(hpToRemove);
    process.exit();
  }
  return Map({ board: board.setIn([unitPos, 'hp'], newHp), unitDied: false });
}

/**
 * Increases mana for both units on board
 * Returns updated board
 * Supports enemy being dead
 * TODO: Maybe, Load from defaults here, so mana stats don't have to be stored in vain
 */
async function manaIncrease(board, unitPos, enemyPos) {
  const unitMana = board.get(unitPos).get('mana');
  const unitManaInc = board.get(unitPos).get('mana_hit_given');
  const newBoard = board.setIn([unitPos, 'mana'], +unitMana + +unitManaInc);
  if (!f.isUndefined(enemyPos)) {
    const enemyMana = board.get(enemyPos).get('mana');
    const enemyManaInc = board.get(enemyPos).get('mana_hit_taken');
    return newBoard.setIn([enemyPos, 'mana'], +enemyMana + +enemyManaInc);
  }
  return newBoard;
}

/**
 * Calculate amount of damage to be dealt to defender
 * Take defense of defender into account
 * Take type differences into account
 * Calculate factor against both defending types (if super effective against both, 4x damage)
 * Attack should use one type, main one preferrbly
 * Temp: Assumed typesAttacker is one type
 * Power might be wanted
 */
async function calcDamage(actionType, power, unit, target, attackerType) { // attack, defense, typesAttacker, typesDefender
  // console.log('@calcDamage', unit, target)
  const factor = gameConstantsJS.getDamageFactorType(actionType) * power * (unit.get('attack') / target.get('defense'));
  const typeFactor = await typesJS.getTypeFactor(attackerType, target.get('type'));
  console.log('@calcDamage returning: ', typeFactor, '*', Math.round(factor), '+ 1 =', Math.round(factor * typeFactor + 1));
  return Math.round(factor * typeFactor + 1);
}

/**
 * Heals unit at unitPos by heal amount, not over max hp
 */
async function healUnit(board, unitPos, heal) {
  const maxHp = pokemonJS.getStats(board.get(unitPos).get('name')).get('hp');
  const newHp = (board.getIn([unitPos, 'hp'] + heal >= maxHp ? maxHp : board.getIn([unitPos, 'hp']) + heal));
  return board.setIn([unitPos, 'hp'], newHp);
}

/**
 * Use ability
 * Remove mana for spell
 * noTarget functionality
 * Damage unit if have power
 * Temp: Move noTarget out of here
 * Doesn't support aoe currently
 * TODO: Go: Mark the specific information in move
 * currently: returns board
 * new: {board, effect} where effect = abilityTriggers contain heals or dot
 */
async function useAbility(board, ability, damage, unitPos, target) {
  const manaCost = ability.get('mana') || abilitiesJS.getAbilityDefault('mana');
  let newBoard = board.setIn([unitPos, 'mana'], board.getIn([unitPos, 'mana']) - manaCost);
  let effect = Map({});
  if (!f.isUndefined(ability.get('noTarget'))) { // noTarget = true
    const noTarget = ability.get('noTarget');
    if (!f.isUndefined(noTarget.size)) { // If list, means buff, use buff on self on board [buffType, amount]
      newBoard = newBoard.setIn([unitPos, noTarget.get(0)], newBoard.getIn([unitPos, noTarget.get(0)]) + noTarget.get(1));
    }
    return newBoard;
  } // Requires target
  if (!f.isUndefined(ability.get('lifesteal'))) {
    const ls = ability.get('lifesteal');
    const lsFactor = (!f.isUndefined(ls.size) ? ls.get(1) : abilitiesJS.getAbilityDefault('lifestealValue'));
    newBoard = await healUnit(newBoard, unitPos, lsFactor * damage);
    effect = effect.setIn([unitPos, 'heal'], lsFactor * damage);
  }
  if (!f.isUndefined(ability.get('dot'))) {
    const dot = ability.get('dot');
    const accuracy = (!f.isUndefined(dot.size) ? dot.get(0) : dot);
    const dmg = (!f.isUndefined(dot.size) ? dot.get(1) : abilitiesJS.getAbilityDefault('dotDamage'));
    if (dot > (newBoard.getIn([target, 'dot']) || 0)) {
      if (Math.random() < accuracy) { // Successfully puts poison
        console.log(' --- Poison hit on ', target);
        newBoard = await newBoard.setIn([target, 'dot'], dmg);
        effect = effect.setIn([target, 'dot'], dmg);
      }
    }
  }
  return (!f.isUndefined(ability.get('power')) ? Map({ board: (await removeHpBattle(newBoard, target, damage)), effect }) : Map({ board: Map({ board: newBoard }) }));
}

/**
 * Is battle over?
 */
async function isBattleOver(board, team) {
  // console.log('@isBattleOver Check me', board, team)
  const keysIter = board.keys();
  let tempUnit = keysIter.next();
  while (!tempUnit.done) {
    // console.log('in battleover: ', board.get(tempUnit.value).get('team'))
    if (board.get(tempUnit.value).get('team') === 1 - team) {
      return false;
    }
    tempUnit = keysIter.next();
  }
  return true;
}

/**
 * Convert damage in percentage to value
 */
async function dmgPercToHp(board, unitPos, percentDmg) {
  const maxHp = (await pokemonJS.getStats(board.get(unitPos).get('name'))).get('hp');
  return Math.round(maxHp * percentDmg);
}

/**
 * Gives new board after dot damage is handled for unit
 * Returns Map({board, damage, battleOver})
 */
async function handleDotDamage(board, unitPos, team) {
  const dot = board.getIn([unitPos, 'dot']);
  if (!f.isUndefined(dot)) {
    const dmgHp = await dmgPercToHp(board, unitPos, dot);
    const removedHPBoard = await removeHpBattle(board, unitPos, dmgHp); // {board, unitDied}
    const newBoard = removedHPBoard.get('board');
    let battleOver = false;
    if (removedHPBoard.get('unitDied')) { // Check if battle ends
      battleOver = await isBattleOver(newBoard, team);
    }
    return Map({ board: newBoard, damage: dmgHp, battleOver });
  }
  return Map({ board });
}

/**
 * Next move calculator
 * If mana is full use spell
 *  TODO: Spells logic
 *  TODO: Conditions for spells
 * Unit checks if it can attack an enemy, is within unit.range
 * If it can, attack on closests target position
 *  If enemy unit dies, check battle over
 *  if attack is made, increase mana for both units
 * If not, make a move to closest enemy unit
 *
 * Map({nextMove: Map({action: action, value: value, target: target}),
 * newBoard: newBoard, battleOver: true, allowSameMove: true})
 */
async function nextMove(board, unitPos, optPreviousTarget) {
  const unit = board.get(unitPos);
  if (unit.get('mana') >= 100) { // Use spell, && withinRange for spell
    // TODO AOE spell logic
    // Idea: Around every adjacent enemy in range of 1 from closest enemy
    const team = unit.get('team');
    const ability = await abilitiesJS.getAbility(unit.get('name'));
    // TODO Check aoe / notarget here instead
    // console.log('@spell ability', ability)
    const enemyPos = await getClosestEnemy(board, unitPos, (ability.get('range') || abilitiesJS.getAbilityDefault('range')), team);
    const action = 'spell';
    const target = await enemyPos.get('closestEnemy');
    //  console.log('enemyPos', enemyPos)
    const abilityDamage = await calcDamage(action, (ability.get('power') || 0), unit, board.get(target), ability.get('type'));
    const abilityName = ability.get('name');
    const abilityResult = await useAbility(board, ability, abilityDamage, unitPos, target);
    // console.log('@abilityResult', abilityResult)
    const removedHPBoard = abilityResult.get('board');
    const effect = abilityResult.get('effect');
    // Do game over check
    const newBoard = removedHPBoard.get('board');
    // console.log('@spell', newBoard)
    let battleOver = false;
    if (removedHPBoard.get('unitDied')) {
      battleOver = await isBattleOver(newBoard, team);
    }
    const move = Map({
      unitPos, action, value: abilityDamage, abilityName, target, effect,
    });
    return Map({
      nextMove: move,
      newBoard,
      battleOver,
    });
  }
  const range = unit.get('range') || pokemonJS.getStatsDefault('range');
  const team = unit.get('team');
  let tarpos;
  if (!f.isUndefined(optPreviousTarget)) {
    tarpos = Map({ closestEnemy: optPreviousTarget, withinRange: true });
    // console.log('Using previous target', optPreviousTarget)
  } else {
    tarpos = getClosestEnemy(board, unitPos, range, team);
    // console.log('targeting new enemy')
  }
  const enemyPos = tarpos; // await
  // console.log('@nextMove enemyPos', enemyPos)
  if (enemyPos.get('withinRange')) { // Attack action
    const action = 'attack';
    const target = enemyPos.get('closestEnemy');
    const attackerType = (!f.isUndefined(unit.get('type').size) ? unit.get('type').get(0) : unit.get('type'));
    const value = await calcDamage(action, unit.get('attack'), unit, board.get(target), attackerType);
    // Calculate newBoard from action
    const removedHPBoard = await removeHpBattle(board, target, value); // {board, unitDied}
    const newBoard = removedHPBoard.get('board');
    let battleOver = false;
    let allowSameMove = false;
    let newBoardMana;
    if (removedHPBoard.get('unitDied')) { // Check if battle ends
      battleOver = await isBattleOver(newBoard, team);
      newBoardMana = await manaIncrease(newBoard, unitPos); // target = dead
    } else { // Mana increase, return newBoard
      allowSameMove = true;
      newBoardMana = await manaIncrease(newBoard, unitPos, target);
    }
    const move = Map({
      unitPos, action, value, target,
    });
    return Map({
      nextMove: move,
      newBoard: newBoardMana,
      allowSameMove,
      battleOver,
    });
  } // Move action
  const closestEnemyPos = enemyPos.get('closestEnemy');
  const movePos = getMovePos(board, closestEnemyPos, range, team);
  const newBoard = board.set(movePos, unit.set('position', movePos)).delete(unitPos);
  const action = 'move';
  const move = Map({ unitPos, action, target: movePos });
  return Map({ nextMove: move, newBoard });
}

/**
 * Returns position of unit with the next move
 */
async function getUnitWithNextMove(board) {
  // console.log('@getUnitWithNextMove',board)
  const boardKeysIter = board.keys();
  let tempUnit = boardKeysIter.next();
  let lowestNextMove = List([tempUnit.value]);
  let lowestNextMoveValue = board.get(tempUnit.value).get('next_move');
  while (!tempUnit.done) {
    const unitPos = tempUnit.value;
    const unitNextMove = board.get(unitPos).get('next_move');
    if (unitNextMove < lowestNextMoveValue) { // New lowest move
      lowestNextMove = List([unitPos]);
      lowestNextMoveValue = unitNextMove;
    } else if (unitNextMove === lowestNextMoveValue) {
      lowestNextMove = lowestNextMove.push(unitPos);
    }
    tempUnit = boardKeysIter.next();
  }
  // Find nextMove unit
  if (lowestNextMove.size === 1) {
    return lowestNextMove.get(0);
  }
  // TODO: Decide order of equal next move units
  // Approved Temp: Random order
  return lowestNextMove.get(Math.floor(Math.random() * lowestNextMove.size));
}

/**
 * Battle:
 * Grab next unit to move
 * simulate next move for that unit and calculate new board
 * add that move to actionStack
 * Continue until battle over
 */
async function startBattle(boardParam) {
  let actionStack = List([]);
  let unitMoveMap = Map({});
  let board = boardParam;
  // f.print(board, '@startBattle')
  let battleOver = false;
  // TODO First move for all units first
  // Remove first_move from all units when doing first movement
  // First move used for all units (order doesn't matter) and set next_move to + speed accordingly
  while (!battleOver) {
    board = await board;
    const nextUnitToMove = await getUnitWithNextMove(board);
    const unit = board.get(nextUnitToMove);
    // console.log('\n@startbattle Next unit to do action: ', nextUnitToMove);
    const nextMoveBoard = board.setIn([nextUnitToMove, 'next_move'], +unit.get('next_move') + +unit.get('speed'));
    const previousMove = unitMoveMap.get(nextUnitToMove);
    // console.log(' --- ', (f.isUndefined(previousMove) ? '' : previousMove.get('nextMove').get('target')), nextUnitToMove)
    let nextMoveResult;
    if (!f.isUndefined(previousMove)) { // Use same target as last round
      // console.log('previousMove in @startBattle', previousMove.get('nextMove').get('target'));
      const previousTarget = previousMove.get('nextMove').get('target');
      nextMoveResult = await nextMove(nextMoveBoard, nextUnitToMove, previousTarget);
    } else {
      nextMoveResult = await nextMove(nextMoveBoard, nextUnitToMove);
    }
    const result = await nextMoveResult;
    battleOver = result.get('battleOver');
    f.printBoard(result.get('newBoard'), result.get('nextMove'));

    actionStack = actionStack.push(result.get('nextMove').set('time', unit.get('next_move')));
    if (result.get('allowSameMove')) { // Attack on target in same position for example
      unitMoveMap = unitMoveMap.set(nextUnitToMove, nextMoveResult);
      // console.log(' allowing same move, setting for', nextUnitToMove, unitMoveMap.get(nextUnitToMove).get('nextMove').get('target'))
    } else {
      // Delete every key mapping to nextMoveResult
      // console.log('Deleting all keys connected to this: ', nextMoveResult.get('nextMove').get('target'))
      const keysIter = unitMoveMap.keys();
      let tempUnit = keysIter.next();
      while (!tempUnit.done) {
        const tempPrevMove = unitMoveMap.get(tempUnit.value);
        const target = tempPrevMove.get('nextMove').get('target');
        const invalidPrevTarget = nextMoveResult.get('nextMove').get('target');
        if (target.get('x') === invalidPrevTarget.get('x') && target.get('y') === invalidPrevTarget.get('y')) {
          unitMoveMap = await unitMoveMap.delete(tempUnit.value);
          // console.log('Deleting prevMove for: ', tempUnit.value, nextMoveResult.get('nextMove').get('target'))
        }
        tempUnit = keysIter.next();
      }
    // unitMoveMap = unitMoveMap.delete(nextUnitToMove);
    }
    board = result.get('newBoard');
    // Dot damage
    const dotObj = await handleDotDamage(board, nextUnitToMove, board.getIn([nextUnitToMove, 'team']));
    if (!f.isUndefined(dotObj.get('damage'))) {
      board = await dotObj.get('board');
      battleOver = battleOver || dotObj.get('battleOver');
      const action = 'dotDamage';
      const dotDamage = dotObj.get('damage');
      const move = await Map({ unitPos: nextUnitToMove, action, value: dotDamage, target: nextUnitToMove});
      // console.log('dot damage dealt!', board);
      console.log('@dotDamage', dotDamage);
      f.printBoard(board, move);
      actionStack = actionStack.push(Map({ nextMove: move, newBoard: board }).set('time', unit.get('next_move')));
    }
  }
  const newBoard = await board;
  // Return the winner
  // f.print(newBoard, '@startBattle newBoard after');
  // f.print(actionStack, '@startBattle actionStack after');
  const team = newBoard.get(newBoard.keys().next().value).get('team');
  const winningTeam = team;
  return Map({ actionStack, board: newBoard, winner: winningTeam });
}

/**
 * Reverses position, your units position on enemy boards
 */
const reverseUnitPos = pos => Map({ x: 7 - pos.get('x'), y: 7 - pos.get('y') });

/**
 * Board with first_move: pos set for all units
 */
async function setRandomFirstMove(board) {
  const boardKeysIter = board.keys();
  let tempUnit = boardKeysIter.next();
  let newBoard = board;
  while (!tempUnit.done) {
    const unitPos = tempUnit.value;
    const newPos = unitPos;
    // TODO: Factor for movement from pokemon
    // Temp: 0.5
    const isMoving = Math.random() > 0.5;
    if (isMoving) {
      // TODO Make logical movement calculation,
      // Approved Temp: currently starts default spot, makes no firstmove
    }
    // console.log('\n@setRandomFirstMove', board)
    newBoard = newBoard.setIn([unitPos, 'first_move'], newPos);
    tempUnit = boardKeysIter.next();
  }
  return newBoard;
}
/*
  // While temp
  const iter = map.keys();
  let temp = iter.next();
  while (!temp.done) {

    temp = iter.next();
  }
*/

/**
 * Counts unique occurences of piece on board connected to each team
 * Puts them in a map and returns it
 * Map({0: Map({grass: 3, fire: 2}), 1: Map({normal: 5})})
 * Set(['pikachu']) (no more pikachus or raichus)
 */
async function countUniqueOccurences(board) {
  const boardKeysIter = board.keys();
  let tempUnit = boardKeysIter.next();
  let buffMap = Map({ 0: Map({}), 1: Map({}) });
  let unique = Map({ 0: Set([]), 1: Set([]) });
  while (!tempUnit.done) {
    const unitPos = tempUnit.value;
    const unit = board.get(unitPos);
    const name = unit.get('name');
    const team = await unit.get('team');
    // console.log(unique, team, unit, unitPos)
    // console.log('@countUniqueOccurences', unique.get(String(team)), pokemonJS.getBasePokemon(name))
    if (!unique.get(String(team)).has(pokemonJS.getBasePokemon(name))) { // TODO: Check
      const newSet = await unique.get(String(team)).add(name);
      unique = await unique.set(team, newSet); // Store unique version, only count each once
      const types = unit.get('type'); // Value or List
      if (!f.isUndefined(types.size)) { // List
        for (let i = 0; i < types.size; i++) {
          buffMap = buffMap.setIn([String(team), types.get(i)], (buffMap.getIn([String(team), types.get(i)]) || 0) + 1);
        }
      } else { // Value
        buffMap = buffMap.setIn([String(team), types], (buffMap.getIn([String(team), types]) || 0) + 1);
        // console.log('adding type occurence', name, team, buffMap.getIn([String(team), types]))
      }
    }
    tempUnit = boardKeysIter.next();
  }
  return buffMap;
}

/**
 * Give bonuses from types
 * Type bonus is either only for those of that type or all units
 */
async function markBoardBonuses(board) {
  const buffMap = await countUniqueOccurences(board);

  // Map({0: Map({grass: 40})})
  let typeBuffMapSolo = Map({ 0: Map({}), 1: Map({}) }); // Solo buffs, only for that type
  let typeBuffMapAll = Map({ 0: Map({}), 1: Map({}) }); // For all buff
  let typeEnemyDebuffMap = Map({ 0: Map({}), 1: Map({}) }); // For all enemies debuffs
  // Find if any bonuses need applying
  for (let i = 0; i <= 1; i++) {
    const buffsKeysIter = buffMap.get(String(i)).keys();
    let tempBuff = buffsKeysIter.next();
    while (!tempBuff.done) {
      const buff = tempBuff.value;
      const amountBuff = buffMap.get(String(i)).get(buff);
      for (let j = 1; j <= 3; j++) {
        if (typesJS.hasBonus(buff) && amountBuff >= typesJS.getTypeReq(buff, j)) {
          // console.log('@markBoardBonuses', amountBuff, typesJS.getTypeReq(buff, i))
          switch (typesJS.getBonusType(buff)) {
            case 'bonus':
              typeBuffMapSolo = typeBuffMapSolo.setIn([String(i), buff], (typeBuffMapSolo.get(String(i)).get(buff) || 0) + typesJS.getBonusAmount(buff, j));
              break;
            case 'allBonus':
              typeBuffMapAll = typeBuffMapAll.setIn([String(i), buff], (typeBuffMapAll.get(String(i)).get(buff) || 0) + typesJS.getBonusAmount(buff, j));
              break;
            case 'enemyDebuff':
              typeEnemyDebuffMap = typeEnemyDebuffMap.setIn([String(i), buff], (typeEnemyDebuffMap.get(String(i)).get(buff) || 0) + typesJS.getBonusAmount(buff, j));
              break;
            default:
              console.log(`Ability bonus type error ... Error found for ${typesJS.getBonusType(buff)}`);
              process.exit();
          }
        } else {
          break;
        }
      }
      tempBuff = buffsKeysIter.next();
    }
  }

  // Apply buff
  const boardKeysIter = board.keys();
  let tempUnit = boardKeysIter.next();
  let newBoard = board;
  while (!tempUnit.done) {
    const unitPos = tempUnit.value;
    const unit = board.get(unitPos);
    const team = unit.get('team');
    // Solo buffs
    const types = board.get(unitPos).get('type'); // Value or List
    if (!f.isUndefined(types.size)) { // List
      for (let i = 0; i < types.size; i++) {
        if (!f.isUndefined(typeBuffMapSolo.get(String(team)).get(types.get(i)))) {
          const newUnit = typesJS.getBuffFuncSolo(types.get(i))(unit, typeBuffMapSolo.get(String(team)).get(types.get(i)))
            .set('buff', (unit.get('buff') || List([])).push(typesJS.getType(types.get(i)).get('name'))); // Add buff to unit
          newBoard = await newBoard.set(unitPos, newUnit);
        }
      }
    } else { // Value
      // console.log(typeBuffMapSolo.get(String(team)), typeBuffMapSolo.get(String(team)).get(types), types, team)
      if (!f.isUndefined(typeBuffMapSolo.get(String(team)).get(types))) {
        // console.log(typesJS.getBuffFuncSolo(types))
        const newUnit = typesJS.getBuffFuncSolo(types)(unit, typeBuffMapSolo.get(String(team)).get(types))
          .set('buff', (unit.get('buff') || List([])).push(typesJS.getType(types).get('name'))); // Add buff to unit
        newBoard = await newBoard.set(unitPos, newUnit);
      }
    }

    // All buffs
    const allBuffIter = typeBuffMapAll.get(String(team)).keys();
    let tempBuffAll = allBuffIter.next();
    while (!tempBuffAll.done) {
      const buff = tempBuffAll.value;
      const bonusValue = typeBuffMapAll.get(String(team)).get(buff);
      const buffText = `${buff} +${bonusValue}`;
      const newUnit = typesJS.getBuffFuncAll(buff)(newBoard.get(unitPos), bonusValue)
        .set('buff', (newBoard.get(unitPos).get('buff') || List([])).push(buffText));
      newBoard = await newBoard.set(unitPos, newUnit);
      tempBuffAll = allBuffIter.next();
    }

    // Enemy buffs
    const enemyTeam = 1 - team;
    const enemyDebuffIter = typeEnemyDebuffMap.get(String(enemyTeam)).keys();
    let tempEnemy = enemyDebuffIter.next();
    while (!tempEnemy.done) {
      const buff = tempEnemy.value;
      const bonusValue = typeBuffMapAll.get(String(enemyTeam)).get(buff);
      const buffText = `${buff} -${bonusValue}`;
      const newUnit = typesJS.getBuffFuncAll(buff)(newBoard.get(unitPos), bonusValue)
        .set('buff', (newBoard.get(unitPos).get('buff') || List([])).push(buffText));
      newBoard = await newBoard.set(unitPos, newUnit);
      tempEnemy = enemyDebuffIter.next();
    }
    tempUnit = boardKeysIter.next();
  }
  return newBoard;
}

/**
 * Create unit for board battle from createBoardUnit unit given newpos/pos and team
 */
async function createBattleUnit(unit, unitPos, team) {
  const unitStats = await pokemonJS.getStats(unit.get('name'));
  return unit.set('team', team).set('attack', unitStats.get('attack')).set('hp', unitStats.get('hp'))
    .set('type', unitStats.get('type'))
    .set('next_move', unitStats.get('next_move') || pokemonJS.getStatsDefault('next_move'))
    .set('ability', unitStats.get('ability'))
    .set('mana', unitStats.get('mana') || pokemonJS.getStatsDefault('mana'))
    .set('defense', unitStats.get('defense') || pokemonJS.getStatsDefault('defense'))
    .set('speed', pokemonJS.getStatsDefault('upperLimitSpeed') - (unitStats.get('speed') || pokemonJS.getStatsDefault('speed')))
    .set('mana_hit_given', unitStats.get('mana_hit_given') || pokemonJS.getStatsDefault('mana_hit_given'))
    .set('mana_hit_taken', unitStats.get('mana_hit_taken') || pokemonJS.getStatsDefault('mana_hit_taken'))
    .set('position', unitPos);
}

/**
 * Combines two boards into one for battle
 * Adds all relevant stats for the unit to the unit
 * Reverses position for enemy units
 */
async function combineBoards(board1, board2) {
  const keysIter = board1.keys();
  let tempUnit = keysIter.next();
  let newBoard = Map({});
  while (!tempUnit.done) {
    const unitPos = tempUnit.value;
    const unit = board1.get(unitPos);
    const battleUnit = await createBattleUnit(unit, unitPos, 0);
    newBoard = await newBoard.set(unitPos, battleUnit);
    tempUnit = keysIter.next();
  }
  const keysIter2 = board2.keys();
  tempUnit = keysIter2.next();
  while (!tempUnit.done) {
    const unitPos = tempUnit.value;
    const newUnitPos = reverseUnitPos(unitPos); // Reverse unitPos
    const unit = board2.get(unitPos);
    const battleUnit = await createBattleUnit(unit, newUnitPos, 1);
    newBoard = await newBoard.set(newUnitPos, battleUnit);
    tempUnit = keysIter2.next();
  }
  return newBoard;
}

/**
 * Spawn opponent in reverse board
 * Mark owners of units
 * Start battle
 * pairing: {
 *  homeID: 1,
 *  enemyID: 0
 * }
 */
async function prepareBattle(stateParam, pairing) {
  const state = stateParam;
  const board1 = state.getIn(['players', pairing.get('homeID'), 'board']);
  const board2 = state.getIn(['players', pairing.get('enemyID'), 'board']);
  // Check to see if a battle is required
  // Lose when empty, even if enemy no units aswell (tie with no damage taken)
  if (board1.size === 0) {
    return Map({ actionStack: List([]), winner: 1 });
  } if (board2.size === 0) {
    return Map({ actionStack: List([]), winner: 0 });
  }

  // Both players have units, battle required
  const board = await combineBoards(board1, board2);
  // f.print(board, '@prepareBattle')
  const boardWithBonuses = await markBoardBonuses(board);
  // f.print(boardWithBonuses);
  const boardWithMovement = await setRandomFirstMove(boardWithBonuses);
  const result = await startBattle(boardWithMovement);
  return result.set('startBoard', boardWithMovement);
}

/**
 * Randomize Opponents for state
 * TODO: Randomize opponent pairs, shuffle indexes before iterator
 *    Make a system so people have higher odds of meeting each other at the same time
 * Temp: Always face next player in order
 * * Assumes board contains every player's updated board
 */
async function battleTime(stateParam) {
  let state = stateParam;
  const playerIter = state.get('players').keys();
  let tempPlayer = playerIter.next();
  let iter;
  let nextPlayer;
  const firstPlayer = tempPlayer.value;
  while (true) {
    const currentPlayer = tempPlayer.value;
    iter = playerIter.next();
    if (iter.done) {
      nextPlayer = firstPlayer;
    } else {
      nextPlayer = iter.value;
    }
    const index = currentPlayer;
    const enemy = nextPlayer; // (i === amountOfPlayers - 1 ? 0 : i + 1);
    const pairing = Map({ homeID: index, enemyID: enemy });
    // console.log('@battleTime pairing: ', pairing, nextPlayer);
    const result = prepareBattle(state, pairing);
    // {actionStack: actionStack, board: newBoard, winner: winningTeam, startBoard: initialBoard}
    const resultBattle = await result;

    // TODO:  Send actionStack to frontend and startBoard
    const actionStack = resultBattle.get('actionStack');
    const startBoard = resultBattle.get('startBoard');

    const winner = (resultBattle.get('winner') === 0);
    const newBoard = resultBattle.get('board');
    // console.log('@battleTime newBoard, finished board result', newBoard); // Good print, finished board
    const newStateAfterBattle = await endBattle(state, index, winner, newBoard, enemy);
    state = state.setIn(['players', index], newStateAfterBattle.getIn(['players', index]));
    // Store rivals logic
    const prevRivals = state.getIn(['players', index, 'rivals']);
    state = state.setIn(['players', index, 'rivals'], prevRivals.set(enemy, (prevRivals.get(enemy) || 0) + 1));
    if (iter.done) {
      break;
    } else {
      tempPlayer = iter;
    }
  }
  const newState = await state;
  return newState;
}

/**
 * *This is not a player made action, time based event for all players
 * *When last battle is over this method shall be called
 * Increase players exp by 1
 * Refresh shop as long as player is not locked
 * Gold:
 *  Interest for 10 gold
 *  Increasing throughout the game basic income
 *  Win streak / lose streak
 */
async function endTurn(stateParam) {
  let state = stateParam;
  const income_basic = state.get('income_basic');
  const round = state.get('round');
  state = state.set('round', round + 1);
  if (round <= 5) {
    state = state.set('income_basic', income_basic + 1);
  }
  return playerEndTurn(state, state.get('amountOfPlayers'), income_basic + 1);
}

async function playerEndTurn(stateParam, amountPlayers, income_basic) {
  let state = stateParam;
  // console.log('@playerEndTurn\n', state, state.get('amountOfPlayers'));
  for (let i = 0; i < amountPlayers; i++) {
    const locked = state.getIn(['players', i, 'locked']);
    if (!locked) {
      state = await refreshShop(state, i);
      // console.log('Not locked for player[' + i + '] \n', state.get('pieces').get(0));
    }
    state = await increaseExp(state, i, 1);
    const gold = state.getIn(['players', i, 'gold']);
    // Min 0 gold interest -> max 5
    const bonusGold = Math.min(Math.floor(gold / 10), 5);
    const streak = state.getIn(['players', i, 'streak']) || 0;
    const streakGold = Math.min(Math.floor(
      (streak === 0 || Math.abs(streak) === 1 ? 0 : (Math.abs(streak) / 5) + 1),
    ), 3);
    // console.log(`@playerEndTurn Gold: p[${i + 1}]: `,
    // `${gold}, ${income_basic}, ${bonusGold}, ${streakGold}`);
    const newGold = gold + income_basic + bonusGold + streakGold;
    state = state.setIn(['players', i, 'gold'], newGold);
    // console.log(i, '\n', state.get('pieces').get(0));
    // state = state.set(i, state.getIn(['players', i]));
  }
  const newState = await state;
  return newState;
}

let synchronizedPlayers = Map({});

/**
 * Builds new state after battles
 */
async function prepEndTurn(state, playerIndex) {
  synchronizedPlayers = synchronizedPlayers.set(playerIndex, state.getIn(['players', playerIndex]));
  if (synchronizedPlayers.size === state.get('amountOfPlayers')) {
    const newState = state.set('players', synchronizedPlayers); // Set
    const newRoundState = await endTurn(newState);
    return newRoundState;
  }
  return state;
}

/**
 * Given a list of units, calculate damage to be removed from player
 * 1 point per level of unit
 * Units level is currently their cost
 * TODO: Balanced way of removing hp (level is exponentially bad for many units)
 */
async function calcDamageTaken(boardUnits) {
  if (f.isUndefined(boardUnits) || boardUnits.size === 0) {
    console.log('@calcDamageTaken Returning 0 ', boardUnits);
    return 0; // When there are no units left for the enemy, don't lose hp (A tie)
  }
  let sum = 0;
  // console.log('@calcDamageTaken', boardUnits.size, boardUnits)
  const keysIter = boardUnits.keys();
  let tempUnit = keysIter.next();
  while (!tempUnit.done) {
    const stats = await pokemonJS.getStats(boardUnits.get(tempUnit.value).get('name'));
    sum += +stats.get('cost');
    tempUnit = keysIter.next();
  }
  return sum;
}

/**
 * TODO
 * winner: Gain 1 gold
 * loser: Lose hp
 *      Calculate amount of hp to lose
 * Parameters: Enemy player index, winningAmount = damage? (units or damage)
 */
async function endBattle(stateParam, playerIndex, winner, finishedBoard, enemyPlayerIndex) {
  let state = stateParam;
  // console.log('@endBattle', state, playerIndex, winner, enemyPlayerIndex);
  const streak = state.getIn(['players', playerIndex, 'streak']) || 0;
  if (winner) {
    state = state.setIn(['players', playerIndex, 'gold'], state.getIn(['players', playerIndex, 'gold']) + 1);
    state = state.setIn(['players', playerIndex, 'streak'], streak + 1);
  } else {
    const hpToRemove = await calcDamageTaken(finishedBoard);
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
 * Marks the only remaining player as the winner
 */
function gameOver(state) {
  const winningPlayer = state.get('players').values().next().value;
  // TODO Send this information to everyone
  return state;
}

/**
 * Remove hp from player
 * Mark player as defeated if hp <= 0, by removal of player from players
 * Also decrease amountOfPlayers
 */
async function removeHp(state, playerIndex, hpToRemove) {
  const currentHp = state.getIn(['players', playerIndex, 'hp']);
  if (currentHp - hpToRemove <= 0) {
    const newState = state.set('players', state.get('players').delete(playerIndex));
    const amountOfPlayers = newState.get('amountOfPlayers') - 1;
    const removedPlayerState = newState.set('amountOfPlayers', amountOfPlayers);
    if (amountOfPlayers === 1) {
      return gameOver(removedPlayerState);
    }
    return removedPlayerState;
  }
  return state.setIn(['players', playerIndex, 'hp'], currentHp - hpToRemove);
}

/**
 * Initialize all shops for all players
 * Round already set to 1
 * TODO: Use in more testcases
 */
async function startGame(stateParam) {
  let state = stateParam;
  const iter = state.get('players').keys();
  let temp = iter.next();
  while (!temp.done) {
    state = await refreshShop(state, temp.value);
    temp = iter.next();
  }
  return state;
}

exports.start = async () => {
  let state = initEmptyState(2);
  // f.print(state, '**Initial State: ');
  state = await refreshShop(state, 0);
  // f.print(state, '**State with shop given to player 0: ');
  state = await buyUnit(state, 0, 1);
  // f.print(state, '**State where player 0 Bought a Unit at index 1: ');
  state = await battleTime(state);
  f.print(state, '**State after battle time with 0 units: ');
};
