import { socket } from './index';

const reducer = (
  state = {
    pieces: []
  },
  action
) => {
  switch (action.type) { // Listens to events dispatched from from socket.js
    case 'NEW_PIECES':
      // Update state with incoming data from server
      state = { ...state, pot: action.newState.pieces};
      // Send state to server
      socket && socket.emit('UPDATE_STATE', state); 
      break;
    default:
      break;
  }

  return state;
};

export default reducer;