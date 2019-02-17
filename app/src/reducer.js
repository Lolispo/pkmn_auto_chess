import { socket } from './index';

const reducer = (
  state = {
    index: -1,
    allReady: false,
    test: 'default',
    pieces: [],
    players: {},
    myHand: {},
    myBoard: {},
    myShop: {},
    level: -1,
    exp: -1,
    expToReach: -1,
    gold: -1,
  },
  action
) => {
  switch (action.type) { // Listens to events dispatched from from socket.js
    case 'NEW_STATE':
      // Update state with incoming data from server
      state = { ...state, pieces: action.newState.pieces, 
        test: 'im updated', 
        players: action.newState.players,
        player: action.newState.players[state.index],
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
      
      // Send state to server
      socket && socket.emit('UPDATE_STATE', state); 
      break;
    case 'NEW_PIECES':
      console.log('New Pieces')
      state = { ...state, pieces: action.newState.pieces}
      break;
    case 'UPDATE_PLAYER':
      console.log('updating player', action.index, action.player);
      state = { ...state,
        test: 'Updated player', 
        player: action.newState.players[action.index],
        myHand: action.newState.players[action.index].hand,
        myBoard: action.newState.players[action.index].board,
        myShop: action.newState.players[action.index].shop,
        level: action.newState.players[action.index].level,
        exp: action.newState.players[action.index].exp,
        expToReach: action.newState.players[action.index].expToReach,
        gold: action.newState.players[action.index].gold,
      };
      }
      break;
    case 'NEW_PLAYER':
      console.log('Received player index', action.index);
      state = { ...state, index: action.index}
      break;
    case 'ALL_READY':
      console.log('AllReady', action.value)
      state = { ...state, allReady: action.value}
      break;
    default:
      break;
  }

  return state;
};

export default reducer;