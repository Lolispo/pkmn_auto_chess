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
    case 'NEW_PIECES':
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
    case 'NEW_PLAYER':
      console.log('Received player index');
      state = { ...state, index: action.index}
      console.log('@newPlayer', action.index); 
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