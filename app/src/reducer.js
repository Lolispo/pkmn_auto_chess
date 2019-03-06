// Author: Petter Andersson

const reducer = (
  state = {
    gameIsLive: false,
    index: -1,
    ready: false,
    playersReady: -1,
    connectedPlayers: -1,
    allReady: false,
    message: 'default',
    help: false,
    helpMode: '',
    chatMessage: '',
    chatMessages: [],
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
    enemyIndex: -1,
    startBattle: false,
    actionStack: {},
    battleStartBoard: {},
    selectedUnit: -1,
    mouseOverId: -1,
    stats: {},
    statsMap: {},
    typeStatsString: '',
    typeBonusString: '',
    round: 1,
    musicEnabled: false,
    soundEnabled: true,
    selectedSound: '',
    soundEffect: '',
    soundEffectSwitch: false,
    volume: 0.05,
  },
  action
) => {
  switch (action.type) { // Listens to events dispatched from from socket.js
    case 'NEW_STATE':
      // Update state with incoming data from server
      state = { ...state, pieces: action.newState.pieces, 
        storedState: action.newState,
        message: 'Received State', 
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
      console.log('@New Pieces', action.newState.discardedPieces)
      state = { ...state, pieces: action.newState.pieces}
      state.storedState.pieces = action.newState.pieces;
      state.storedState.discardedPieces = action.newState.discardedPieces;
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
      state.storedState.players[state.index]['locked'] = action.lock;
      break;
    case 'NEW_PLAYER':
      console.log('Received player index', action.index);
      state = { ...state, index: action.index, gameIsLive: true}
      break;
    case 'TOGGLE_READY':
      state = { ...state, ready: !state.ready}
      break;
    case 'READY':
      state = { ...state, playersReady: action.playersReady, connectedPlayers: action.connectedPlayers}
      break;
    case 'ALL_READY':
      console.log('AllReady', action.playersReady, action.connectedPlayers, action.value)
      state = { ...state, playersReady: action.playersReady, connectedPlayers: action.connectedPlayers, allReady: action.value}
      break;
    case 'UPDATE_MESSAGE':
      state = {...state, message: action.message}
      break;
    case 'TOGGLE_HELP':
      state = {...state, help: !state.help}
      break;
    case 'SET_HELP_MODE':
      state = {...state, helpMode: action.helpMode}    
      break;
    case 'SET_STATS':
      console.log('Updating stats', action.name, action.stats)
      const statsMap = state.statsMap;
      statsMap[action.name] = action.stats;
      state = {...state, name: action.name, stats: action.stats, statsMap}
      break;
    case 'SET_TYPE_BONUSES':
      state = {...state, typeStatsString: action.typeDescs, typeBonusString: action.typeBonuses}
      break;
    case 'BATTLE_TIME':
      const actionStack = action.actionStacks[state.index];
      const battleStartBoard = action.battleStartBoards[state.index];
      state = {
        ...state,
        onGoingBattle: true,
        enemyIndex: action.enemy,
        actionStack,
        battleStartBoard,
        startBattle: true
      }
      console.log('@battleTime actionStack', state.actionStack);
      console.log('@battleTime battleStartBoard', state.battleStartBoard)
      // TODO: BattleStartBoard contain unneccessary amount of information
      break;
    case 'CHANGE_STARTBATTLE':
      console.log('FIND ME: Changing StartBattle', action.value);
      state = {...state, startBattle: action.value}
      break;
    case 'UPDATE_BATTLEBOARD':
        // console.log('@reducer.updateBattleBoard: MOVE NUMBER: ', action.moveNumber,'Updating state battleBoard', action.board);
        state = {...state, battleStartBoard: action.board, message: 'Move ' + action.moveNumber}
        // console.log('state', state);
        break;
    case 'SELECT_UNIT':
      // TODO: Mark unit as selected Css
      state = {...state, selectedUnit: action.selectedUnit}
      break;
    case 'SET_MOUSEOVER_ID':
      // console.log('@reducer.setMouseOverId', action.mouseOverId);
      state = {...state, mouseOverId: action.mouseOverId}
      break;
    case 'END_BATTLE':
      state = {...state, onGoingBattle: false, round: state.round + 1}
      break;
    case 'TOGGLE_MUSIC':
      state = {...state, musicEnabled: !state.musicEnabled}
      break;
    case 'TOGGLE_SOUND':
      state = {...state, soundEnabled: !state.soundEnabled}
      break;
    case 'CHANGE_VOLUME':
      console.log('@reducer.ChangeVolume', action.newVolume)
      state = {...state, volume: action.newVolume}
      break;
    case 'NEW_UNIT_SOUND':
      state = {...state, selectedSound: action.newAudio}
      break;
    case 'NEW_SOUND_EFFECT':
      console.log('@NewSoundEffect', action.newSoundEffect, state.soundEffect)
      if(state.soundEffect === action.newSoundEffect){
        state = {...state, soundEffectSwitch: !state.soundEffectSwitch}
      } else {
        state = {...state, soundEffect: action.newSoundEffect}
      }
      break;
    case 'END_GAME':
      console.log('GAME ENDED! Player ' + action.winningPlayer.index + ' won!');
      state = {...state, gameIsLive: false, message: 'Player ' + action.winningPlayer.index + ' won the game'}
      break;
    case 'NEW_CHAT_MESSAGE':
      state = {...state, chatMessage: state.chatMessage + action.newMessage + '\n'}
      state.chatMessages.push(action.newMessage)
      break;
    default:
      break;
  }

  return state;
};

export default reducer;