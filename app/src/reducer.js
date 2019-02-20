import { socket } from './index';

const reducer = (
  state = {
    index: -1,
    ready: false,
    allReady: false,
    message: 'default',
    storedState: {},
    pieces: [],
    players: {},
    myHand: {},
    myBoard: {},
    myShop: {},
    lock: false,
    level: -1,
    exp: -1,
    expToReach: -1,
    gold: -1,
    onGoingBattle: false,
    actionStack: {},
    battleStartBoard: {},
    selectedUnit: -1,
    mouseOverId: -1,
  },
  action
) => {
  switch (action.type) { // Listens to events dispatched from from socket.js
    case 'NEW_STATE':
      // Update state with incoming data from server
      state = { ...state, pieces: action.newState.pieces, 
        storedState: action.newState,
        message: 'im updated', 
        players: action.newState.players,
        myHand: action.newState.players[state.index].hand,
        myBoard: action.newState.players[state.index].board,
        myShop: action.newState.players[state.index].shop,
        level: action.newState.players[state.index].level,
        exp: action.newState.players[state.index].exp,
        expToReach: action.newState.players[state.index].expToReach,
        gold: action.newState.players[state.index].gold,
      };
      console.log(action.newState)
      console.log(state);

      break;
    case 'NEW_PIECES':
      console.log('@New Pieces', action.newState.discarded_pieces)
      state = { ...state, pieces: action.newState.pieces}
      state.storedState.pieces = action.newState.pieces;
      state.storedState.discarded_pieces = action.newState.discarded_pieces;
      break;
    case 'UPDATE_PLAYER':
      console.log('updating player', action.index, action.player);
      state = { ...state,
        message: 'Updated player', 
        myHand: action.player.hand,
        myBoard: action.player.board,
        myShop: action.player.shop,
        level: action.player.level,
        exp: action.player.exp,
        expToReach: action.player.expToReach,
        gold: action.player.gold,
      };
      state.players[state.index] = action.player
      state.storedState.players[state.index] = action.player;
      console.log('@Updated player', state.storedState)
      break;
    case 'LOCK_TOGGLED':
      console.log('lock toggled')
      state = {...state, lock: action.lock}
      state.storedState.players[state.index]['lock'] = action.lock;
      break;
    case 'NEW_PLAYER':
      console.log('Received player index', action.index);
      state = { ...state, index: action.index}
      break;
    case 'TOGGLE_READY':
      state = { ...state, ready: !state.ready}
      break;
    case 'ALL_READY':
      console.log('AllReady', action.value)
      state = { ...state, allReady: action.value}
      break;
    case 'UPDATE_MESSAGE':
      state = {...state, message: action.message}
      break;
    case 'BATTLE_TIME':
      const actionStack = action.actionStacks[state.index];
      const battleStartBoard = action.battleStartBoards[state.index];
      state = {
        ...state,
        onGoingBattle: true,
        actionStack,
        battleStartBoard,
      }
      console.log('@battleTime actionStack', state.actionStack);
      console.log('@battleTime battleStartBoard', state.battleStartBoard)
      break;
    case 'SELECT_UNIT':
      // TODO: Mark unit as selected Css
      state = {...state, selectedUnit: action.selectedUnit}
      break;
    case 'SET_MOUSEOVER_ID':
      // console.log('@reducer.setMouseOverId', action.mouseOverId);
      state = {...state, mouseOverId: action.mouseOverId}
      break;
    default:
      break;
  }

  return state;
};

export default reducer;