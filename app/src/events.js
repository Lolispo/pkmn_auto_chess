// Author: Petter Andersson

import { toggleLock, buyUnit, refreshShop, buyExp, placePiece, withdrawPiece, sellPiece, getStats} from './socket';
import { updateMessage } from './f';
import { getSoundEffect } from './audio.js';

export function getStatsEvent(props, name) {
  if(props.statsMap[name]){
    console.log('Cached info')
    props.dispatch({type: 'SET_STATS', name: name, stats: props.statsMap[name]});
  } else {
    getStats(name);
  }
}

export function buyUnitEvent(props, index) {
  // You have enough money to buy this unit
  // Unit != null
  // Hand is not full
  // console.log('@buyUnitEvent', this.props.shopPokemon.cost, this.props.newProps.gold)
  if(props.newProps.isDead){
    updateMessage(props.newProps, 'You are dead! No buying when dead', 'error');
    props.newProps.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('invalid')});
    return;
  }
  if(props.shopPokemon && props.newProps.gameIsLive){
    if(props.newProps.gold >= props.shopPokemon.cost){
      const size = Object.keys(props.newProps.myHand).length;
      if(size < 8){
        buyUnit(props.newProps.storedState, index);
      } else{
        updateMessage(props.newProps, 'Hand is full!', 'error');
        props.newProps.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('invalid')});
      }
    } else{
      updateMessage(props.newProps, 'Not enough gold!', 'error');
      props.newProps.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('invalid')});
    }
  }
}

export function refreshShopEvent(props) {
  // You have enough money to refresh
  if(props.isDead){
    updateMessage(this.props, 'You are dead! No shop interaction when dead', 'error');
    props.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('invalid')});
    return;
  }
  if(props.gold >= 2 && props.gameIsLive){
    refreshShop(props.storedState)
  } else{
    updateMessage(this.props, 'Not enough gold!', 'error');
    props.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('invalid')});
  }
}

export function toggleLockEvent(props) {
  if(props.isDead){
    updateMessage(this.props, 'You are dead! No shop interaction when dead', 'error');
    props.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('invalid')});
    return;
  }
  toggleLock(props.storedState);
}

export function buyExpEvent(props) {
  // You have enough money to buy exp
  if(props.isDead){
    updateMessage(props, 'You are dead! No exp buying when dead', 'error');
    props.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('invalid')});
    return;
  }
  if(props.gold >= 5 && props.gameIsLive){
    if(props.level < 10){
      buyExp(props.storedState)
    } else {
      updateMessage(props, 'Already at max level!', 'error');
      props.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('invalid')});
    }
  } else{
    updateMessage(props, 'Not enough gold!', 'error');
    props.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('invalid')});
  }
}

export function placePieceEvent(prop, fromParam, to) {
  // to is on valid part of the board
  const from = String(fromParam);
  if(prop.isDead){
    updateMessage(prop, 'You are dead!', 'error');
    prop.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('invalid')});
    return;
  } else if(prop.visiting !== prop.index){
    updateMessage(prop, 'Visiting!', 'error');
    prop.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('invalid')});
    return;
  }
  if(from && to && prop.gameIsLive){
    console.log('@placePieceEvent', from, to);
    const splitted = to.split(',');
    const fromSplitted = from.split(',');
    const validPos = (splitted.length === 2 ? splitted[1] < 4 && splitted[1] >= 0: true) && splitted[0] < 8 && splitted[0] >= 0;
    const unitExists = (fromSplitted.length === 2 ? prop.myBoard[fromParam] : prop.myHand[from])
    // console.log('@placePieceEvent', fromSplitted, validPos, unitExists, prop.myHand);
    if(validPos && unitExists && !prop.onGoingBattle){
      // console.log('Sending place piece!')
      placePiece(prop.storedState, from, to);
      prop.dispatch({ type: 'SELECT_UNIT', selectedUnit: {pos: ''}});
    } else {
      // TODO: Hand to hand movement during battle allowed
      if(validPos && unitExists && prop.onGoingBattle) {
        if(!from.includes(',') && !to.includes(',')) {
          placePiece(prop.storedState, from, to);
          prop.dispatch({ type: 'SELECT_UNIT', selectedUnit: {pos: ''}});
        }
      }
      updateMessage(prop, 'Invalid target placing!', 'error');
      prop.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('invalid')});
    }
  }
}

export function withdrawPieceEvent(prop, from) {
  // Hand is not full
  if(prop.isDead){
    updateMessage(prop, 'You are dead!', 'error');
    prop.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('invalid')});
    return;
  } else if(prop.visiting !== prop.index) {
    updateMessage(prop, 'Visiting!', 'error');
    prop.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('invalid')});
    return;
  }
  const size = Object.keys(prop.myHand).length;
  if(prop.myBoard[from] && !prop.onGoingBattle && prop.gameIsLive){ // From contains unit
    if(size < 8){
      withdrawPiece(prop.storedState, String(from));
      prop.dispatch({ type: 'SELECT_UNIT', selectedUnit: {pos: ''}});
    } else{
      updateMessage(prop, 'Hand is full!', 'error');
      prop.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('invalid')});
    }
  }
}

export function sellPieceEvent(prop, from) {
  if(prop.isDead){
    updateMessage(prop, 'You are dead!', 'error');
    prop.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('invalid')});
    return;
  } else if(prop.visiting !== prop.index) {
    updateMessage(prop, 'Visiting!', 'error');
    prop.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('invalid')});
    return;
  }
  const validUnit = (prop.selectedUnit.isBoard ? prop.myBoard[from] : prop.myHand[from])
  console.log('@sellPiece', validUnit, from, prop.selectedUnit.isBoard)
  // From contains unit, hand unit is ok during battle
  // TODO: Remove false && and fix allowing sellPiece during battle, currently weird
  if(validUnit && prop.gameIsLive && (!prop.onGoingBattle || (!prop.selectedUnit.isBoard))){ // false &&
    sellPiece(prop.storedState, String(from));
    prop.dispatch({ type: 'SELECT_UNIT', selectedUnit: {pos: ''}});
    prop.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('sellUnit')});
  } else{
    updateMessage(prop, 'Invalid target to sell! ' + from, 'error');
    prop.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('invalid')});
  }
}