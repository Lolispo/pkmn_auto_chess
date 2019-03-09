// Author: Petter Andersson

import { getBackgroundAudio, getSoundEffect } from './audio.js';

const getNewSoundEffects = (soundEffects, newSoundEffect) => {
  let newSoundEffects = soundEffects;
  console.log('@getNewSoundEffects', soundEffects, soundEffects.length)
  for(let i = 0; i < soundEffects.length; i++){
    if(soundEffects[i] !== newSoundEffect){
      console.log('@NewSoundEffect', i, newSoundEffect)
      newSoundEffects[i] = newSoundEffect;
      break;
    }
  }
  return newSoundEffects;
}

const reducer = (
  state = {
    gameIsLive: false,
    connected: false,
    index: -1,
    ready: false,
    playersReady: -1,
    connectedPlayers: -1,
    allReady: false,
    message: 'default',
    messageMode: '',
    help: true,
    chatHelpMode: '',
    chatMessages: [],
    senderMessages: [],
    storedState: {},
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
    chatSoundEnabled: true,
    selectedSound: '',
    soundEffects: ['', '', '', '', '','', '', '', '', ''],
    music: getBackgroundAudio('idle'),
    volume: 0.05,
    startTimer: false,
  },
  action
) => {
  let tempSoundEffects;
  switch (action.type) { // Listens to events dispatched from from socket.js
    case 'NEW_STATE':
      // Update state with incoming data from server
      state = { ...state,  
        storedState: action.newState,
        message: 'Received State', 
        messageMode: '',
        players: action.newState.players,
        myHand: action.newState.players[state.index].hand,
        myBoard: action.newState.players[state.index].board,
        myShop: action.newState.players[state.index].shop,
        level: action.newState.players[state.index].level,
        exp: action.newState.players[state.index].exp,
        expToReach: action.newState.players[state.index].expToReach,
        gold: action.newState.players[state.index].gold,
        round: action.newState.round,
      };
      console.log('New State', action.newState)
      // console.log(state);
      break;
    case 'UPDATE_PLAYER':
      console.log('updating player', action.index, action.player);
      state = { ...state,
        message: 'Updated player', 
        messageMode: '',
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
      state = { ...state, 
        index: action.index, 
        gameIsLive: true,
        ready: false,
        playersReady: -1,
        connectedPlayers: -1,
        allReady: false,
        message: 'default',
        messageMode: '',
        help: true,
        chatHelpMode: '',
        chatMessages: [],
        senderMessages: [],
        storedState: {},
        lock: false,
        onGoingBattle: false,
        enemyIndex: -1,
        startBattle: false,
        actionStack: {},
        battleStartBoard: {},
        selectedUnit: -1,
        soundEffects: ['', '', '', '', '','', '', '', '', ''],
        music: getBackgroundAudio('idle'),
        startTimer: true,
      }
      break;
    case 'SET_CONNECTED':
      state = {...state, connected: action.connected};
      break;
    case 'TOGGLE_READY':
      state = { ...state, ready: !state.ready}
      break;
    case 'READY':
      state = { ...state, playersReady: action.playersReady, connectedPlayers: action.connectedPlayers}
      break;
    case 'ALL_READY':
      console.log('AllReady', action.playersReady, action.connectedPlayers, action.value)
      state = { ...state, playersReady: action.playersReady, connectedPlayers: action.connectedPlayers, allReady: action.value, gameIsLive: false}
      break;
    case 'UPDATE_MESSAGE':
      state = {...state, message: action.message, messageMode: action.messageMode}
      break;
    case 'TOGGLE_HELP':
      state = {...state, help: !state.help}
      break;
    case 'SET_HELP_MODE':
      state = {...state, chatHelpMode: action.chatHelpMode}    
      break;
    case 'SET_STATS':
      console.log('Updating stats', action.name, action.stats)
      const statsMap = state.statsMap;
      statsMap[action.name] = action.stats;
      state = {...state, name: action.name, stats: action.stats, statsMap: statsMap}
      break;
    case 'SET_TYPE_BONUSES':
      state = {...state, typeStatsString: action.typeDescs, typeBonusString: action.typeBonuses}
      break;
    case 'BATTLE_TIME':
      const actionStack = action.actionStacks[state.index];
      const battleStartBoard = action.battleStartBoards[state.index];
      console.log('@battle_time', state.soundEffects)
      tempSoundEffects = getNewSoundEffects(state.soundEffects, getSoundEffect('horn'));
      state = {
        ...state,
        music: (action.enemy ? getBackgroundAudio('pvpbattle') : getBackgroundAudio('battle')),
        soundEffects: [...tempSoundEffects],
        onGoingBattle: true,
        enemyIndex: action.enemy,
        actionStack,
        battleStartBoard,
        startBattle: true,
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
        state = {...state, battleStartBoard: action.board, message: 'Move ' + action.moveNumber, messageMode: ''}
        // console.log('state', state);
        break;
    case 'SELECT_UNIT':
      state = {...state, selectedUnit: action.selectedUnit}
      break;
    case 'SET_MOUSEOVER_ID':
      state = {...state, mouseOverId: action.mouseOverId}
      break;
    case 'END_BATTLE':  
      console.log('Battle ended', state.startTimer)
      state = {...state, onGoingBattle: false, round: state.round + 1, music: getBackgroundAudio('idle'), startTimer: true}
      break;
    case 'DISABLE_START_TIMER':
      state = {...state, startTimer: false}
      console.log('Disabled start timer')
      break;
    case 'TOGGLE_MUSIC':
      state = {...state, musicEnabled: !state.musicEnabled}
      break;
    case 'TOGGLE_SOUND':
      state = {...state, soundEnabled: !state.soundEnabled}
      break;
    case 'TOGGLE_CHAT_SOUND':
      console.log(state.chatSoundEnabled)
      state = {...state, chatSoundEnabled: !state.chatSoundEnabled}
      break;
    case 'CHANGE_VOLUME':
      console.log('@reducer.ChangeVolume', action.newVolume)
      state = {...state, volume: action.newVolume, music: state.music}
      break;
    case 'NEW_UNIT_SOUND':
      // console.log('reducer.NewUnitSound', action.newAudio);
      state = {...state, selectedSound: action.newAudio}
      break;
    case 'NEW_SOUND_EFFECT':
      tempSoundEffects = getNewSoundEffects(state.soundEffects, action.newSoundEffect);
      state = {...state, soundEffects: [...tempSoundEffects]};
      break;
    case 'END_GAME':
      console.log('GAME ENDED! Player ' + action.winningPlayer.index + ' won!');
      state = {...state, message: 'Player ' + action.winningPlayer.index + ' won the game', messageMode: 'big', gameEnded: action.winningPlayer, }
      break;
    case 'NEW_CHAT_MESSAGE':
      console.log('@NEW_CHAT_MESSAGE', action.chatType);
      const { senderMessages, chatMessages } = state;
      state = {...state, senderMessages: senderMessages.concat(action.senderMessage), chatMessages: chatMessages.concat(action.newMessage)};
      let soundEffect;
      switch(action.chatType){
        case 'pieceUpgrade':
          soundEffect = getSoundEffect('lvlup');
          break;
        case 'playerEliminated':
        case 'disconnect':
          break;
        case 'chat':
        default:
          soundEffect = getSoundEffect('pling');
      }
      tempSoundEffects = getNewSoundEffects(state.soundEffects, soundEffect);
      state = {...state, soundEffects: [...tempSoundEffects]};
      break;
    default:
      break;
  }

  return state;
};

export default reducer;