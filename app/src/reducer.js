import { socket } from './index';

const reducer = (
  state = {
    test: 'default',
    pieces: []
  },
  action
) => {
  switch (action.type) { // Listens to events dispatched from from socket.js
    case 'NEW_PIECES':
      // Update state with incoming data from server
      state = { ...state, pieces: action.newState.pieces};
      state = { ...state, test: 'im updated'};
      console.log(action.newState)
      console.log(state);
      
      // Send state to server
      socket && socket.emit('UPDATE_STATE', state); 
      break;
    default:
      break;
  }

  return state;
};

export default reducer;