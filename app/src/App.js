// Author: Petter Andersson

import React, { Component } from 'react';
import { ready, unready, startGame, toggleLock, buyUnit, refreshShop, buyExp, placePiece, withdrawPiece, battleReady, sellPiece, getStats} from './socket';
import { connect } from 'react-redux';
import { isUndefined, updateMessage } from './f';
import CSSTransitionGroup from 'react-addons-css-transition-group';
import './App.css';

import lockedLock from './assets/lockedLock.png';
import openLock from './assets/openLock.png';
import goldCoin from './assets/goldCoin.png';
import refreshShopImage from './assets/refreshShop.png';
import { getAudio, getBackgroundAudio } from './audio.js';

class PokemonImage extends Component{

  constructor(props) {
    super(props);
    this.state = {dimensions: {}, paddingTop: '0px', sideLength: this.props.sideLength};
    this.onImgLoad = this.onImgLoad.bind(this);
    this.reduceImageSize = this.reduceImageSize.bind(this);
    this.calculatePadding = this.calculatePadding.bind(this);
  }

  onImgLoad({target:img}) {
    // console.log('@onImgLoad - ', img.offsetHeight, 'vs', img.naturalHeight, ', ', img.offsetWidth, 'vs', img.naturalWidth);
    this.setState({dimensions:{height:img.naturalHeight,
                               width:img.naturalWidth}});
    this.calculatePadding(img.naturalHeight);
  }

  reduceImageSize(width, height, initial='true') {
    const sideLength = this.state.sideLength;
    if(width > sideLength || height > sideLength){
      this.reduceImageSize(width * 0.9, height * 0.9, false);
    } else {
      if(!initial){
        this.setState({dimensions:{ height: height,
                                    width:  width}});
        this.calculatePadding(height);
      }
    }
  }

  calculatePadding(height) {
    const sideLength = this.state.sideLength;
    const paddingTop = (sideLength - height) / 2;
    // console.log('@calculatePadding', paddingTop)
    this.setState({paddingTop: paddingTop});
  }

  render(){
    // Import result is the URL of your image
    // TODO: Store gifs locally so calculation is not required everytime
    const {width, height} = this.state.dimensions;
    this.reduceImageSize(width, height);
    const paddingTop = this.state.paddingTop;
    let src = 'https://img.pokemondb.net/sprites/black-white/anim/normal/' + this.props.name + '.gif';
    if(this.props.back){
      src = 'https://img.pokemondb.net/sprites/black-white/anim/back-normal/' + this.props.name + '.gif';
    }
    return (
      <CSSTransitionGroup
          transitionName="example"
          transitionEnterTimeout={300}
          transitionLeave={false}>
          <img
            className={`pokemonImg ${this.props.name}`}
            key={src}
            style={{paddingTop: paddingTop, width: width, height: height}}
            src={src}
            alt='Pokemon'
            onLoad={this.onImgLoad}
          />
        </CSSTransitionGroup>
    );
  }
}

class Pokemon extends Component{

  buyUnitEvent = (index) => {
    // You have enough money to buy this unit
    // Unit != null
    // Hand is not full
    // console.log('@buyUnitEvent', this.props.shopPokemon.cost, this.props.newProps.gold)
    if(this.props.shopPokemon && this.props.newProps.gameIsLive){
      if(this.props.newProps.gold >= this.props.shopPokemon.cost){
        const size = Object.keys(this.props.newProps.myHand).length
        if(size < 8){
          buyUnit(this.props.newProps.storedState, index);
        } else{
          updateMessage(this.props.newProps, 'Hand is full!');
        }
      } else{
        updateMessage(this.props.newProps, 'Not enough gold!');
      }
    }
  }

  render(){
    let content;
    if(!isUndefined(this.props.shopPokemon)){
      const costColorClass = (!isUndefined(this.props.shopPokemon) ? 'costColor' + this.props.shopPokemon.cost : '')
      /*
      const backgroundColor = (Array.isArray(this.props.shopPokemon.type) ? 
            this.props.shopPokemon.type[0] : this.props.shopPokemon.type);
      */
      content = <div>
            <div className={`pokemonImageDiv ${costColorClass}`}>
              <PokemonImage name={this.props.shopPokemon.name} sideLength={85}/>
            </div>
            <div className='pokemonShopText'>
              {this.props.shopPokemon.display_name + '\n'}
              {(Array.isArray(this.props.shopPokemon.type) ? 
                <div>
                  <span className={`type typeLeft ${this.props.shopPokemon.type[0]}`}>{this.props.shopPokemon.type[0]}</span>
                  <span className={`type ${this.props.shopPokemon.type[1]}`}>{this.props.shopPokemon.type[1] + '\n'}</span>
                </div>
                : <span className={`type ${this.props.shopPokemon.type}`}>{this.props.shopPokemon.type + '\n'}</span>)}
              {'$' + this.props.shopPokemon.cost}
            </div>
          </div>
    } else {
      content = <div className={`pokemonShopEmpty text_shadow`}>Empty</div>;
    }
    return (
      <div className={`pokemonShopEntity ${this.props.className}`} onClick={() => this.buyUnitEvent(this.props.index)}>
        {content}
      </div>
    );
  }
}

class Board extends Component {
  state = {
    ...this.props,
    boardData: this.createEmptyArray(this.props.height, this.props.width),
  };

  createEmptyArray(height, width) {
    let data = [];
    for (let i = 0; i < width; i++) {
      data.push([]);
      for (let j = 0; j < height; j++) {
        data[i][j] = {
          x: i,
          y: height-j-1,
        };
      }
    }
    return data;
  }
  
  renderBoard(data) {
    let counter = 0;
    return data.map((datarow) => {
      return <div className='boardRow' key={counter++}>{
        datarow.map((dataitem) => {
          return (
            <div key={dataitem.x * datarow.length + dataitem.y}>
              <Cell value={dataitem} isBoard={this.props.isBoard} map={this.props.map} newProps={this.props.newProps}/>
            </div>);
        })}
      </div>
    });
  }

  render(){
    return (
      <div className='flex center'> 
        {this.renderBoard(this.state.boardData)}
      </div>
    );
  }
}

class Cell extends Component {
  state = {
    ...this.state,
    pos: this.getPos(this.props.value.x, this.props.value.y),
    selPos: this.props.newProps.selectedUnit,
  }

  getPos(x,y){
    if(this.props.isBoard){
      return x + ',' + y;
    } else{
      return String(x);
    }
  }

  getStatsEvent(props, name) {
    if(props.statsMap[name]){
      console.log('Cached info')
      props.dispatch({type: 'SET_STATS', name: name, stats: props.statsMap[name]});
    } else {
      getStats(name);
    }
  }
  
  placePieceEvent = (fromParam, to) => {
    // to is on valid part of the board
    const prop = this.props.newProps;
    const from = String(fromParam);
    if(from && to && prop.gameIsLive){
      console.log('@placePieceEvent',from, to);
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
        updateMessage(prop, 'Invalid target placing!');
      }
    }
  }

  handleCellClick(el){
    const unit = (el.props.isBoard ? el.props.newProps.myBoard[this.state.pos] : el.props.newProps.myHand[this.state.pos]);
    const prevSelectedUnit = el.props.newProps.selectedUnit;
    console.log('@handleCellClick pressed', el.props.value.x, ',', el.props.value.y)
    console.log(' -', el.props.isBoard, this.state.pos, unit, prevSelectedUnit)
    // If unit selected -> presses empty -> place piece 
    if(this.state.pos !== prevSelectedUnit.pos){ // Shouldn't do anything if same tile as SELECT_UNIT Tile
      el.props.newProps.dispatch({ type: 'SELECT_UNIT', selectedUnit: {...el.props.value, isBoard: el.props.isBoard, pos: this.state.pos, unit: unit}});
    } else { // Deselect by doubleclick same unit
      el.props.newProps.dispatch({ type: 'SELECT_UNIT', selectedUnit: {isBoard: el.props.isBoard, pos: ''}});
    }
    if(unit){ // Pressed unit
      this.getStatsEvent(el.props.newProps, unit.name);
    } else if(prevSelectedUnit.pos && this.state.pos !== prevSelectedUnit.pos && prevSelectedUnit.unit){ // Pressed empty cell
      this.placePieceEvent(prevSelectedUnit.pos, this.state.pos);
    }
  }

  handleMouseOver(event, self){
    //console.log('@handleMouseEvent', event, self)
    const x = event.clientX;
    const y = event.clientY;
    const el = document.elementFromPoint(x, y);
    let id = (el.id === '' ? 
      (el.parentElement.id === '' ? 
        (el.parentElement.parentElement.id === '' ? '' : el.parentElement.parentElement.id ) 
      : el.parentElement.id) : el.id);
    if(self.props.newProps.mouseOverId !== id){
      // console.log('Mousing Over:', id);
      self.props.newProps.dispatch({type: 'SET_MOUSEOVER_ID', mouseOverId: id})        
    }
  }

  getValue() {
    // console.log('@Cell.getValue value =', value)
    // console.log('@Cell.getValue', this.props.map, this.props.map[this.getPos(value.x,value.y)])
    if(this.props.map){
      let pokemon;
      const sideLength = 85;
      // console.log('@getValue', this.props.isBoard && this.props.newProps.onGoingBattle)
      if(this.props.isBoard && this.props.newProps.onGoingBattle && this.props.newProps.battleStartBoard){ // Battle
        // console.log('I WANT TO BE RERENDERED', this.props.newProps.battleStartBoard);
        pokemon = this.props.newProps.battleStartBoard[this.state.pos]
        const hpBar = (pokemon ? <div className='barDiv' style={{width: sideLength}}>
          <div className='hpBar text_shadow' style={{width: (pokemon.hp / pokemon.maxHp * 100)+'%'}}>{`${pokemon.hp}/${pokemon.maxHp}`}</div>
          </div> : '')
        /*const manaBar = (pokemon ? <div className='barDiv' style={{width: sideLength}}>
          <div className='manaBar text_shadow' style={{width: (pokemon.mana / 150)+'%'}}>{`${pokemon.mana}/${pokemon.manaCost}`}</div>
          </div> : '')*/
        const actionMessage = (pokemon && pokemon.actionMessage !== '' ? 
        <CSSTransitionGroup
          transitionName="messageUpdate"
          transitionEnterTimeout={1500}
          transitionLeave={false}>
          <div className='text_shadow actionMessage' style={{position: 'absolute'}}>
            {pokemon.actionMessage}
          </div> 
        </CSSTransitionGroup>
          : '');
        if(!isUndefined(pokemon)){
          const back = (this.props.isBoard ? (!isUndefined(pokemon.team) ? pokemon.team === 0 : true) : false);
          return <div style={{position: 'relative'}}>
            <PokemonImage name={pokemon.name} back={back} sideLength={sideLength}/>
            {hpBar}
            {/*manaBar*/}
            {actionMessage}
          </div>
        }
      } else {
        pokemon = this.props.map[this.state.pos];
        if(!isUndefined(pokemon)){
          const back = (this.props.isBoard ? (!isUndefined(pokemon.team) ? pokemon.team === 0 : true) : false);
          return <PokemonImage name={pokemon.name} back={back} sideLength={sideLength}/>
        }
      }
    }
    return null;
  }

  render() {
    // console.log('@renderCell', this.props.selectedUnit)
    const selPos = this.props.newProps.selectedUnit;
    //console.log('@Cell.render', selPos, this.props.newProps.selectedUnit)
    let className = 'cell' +
    (!isUndefined(selPos) && this.props.isBoard === selPos.isBoard && 
    selPos.x === this.props.value.x && selPos.y === this.props.value.y ? ' markedUnit' : '');
    return (
      <div id={this.state.pos} className={className} onClick={() => this.handleCellClick(this)} 
        onMouseOver={(event) => this.handleMouseOver(event, this)}>
        {this.getValue()}
      </div>
    );
  }
}


class App extends Component {
  // Event listener example, can be attached to example buttons
  
  // Event logic

  toggleReady = () => {
    console.log('@toggleReady', this.props.ready);
    const { dispatch } = this.props;
    dispatch({type: 'TOGGLE_READY'});
    this.props.ready ? unready() : ready();
  };

  startGame = () => {
    // TODO: Css affected by this.props.allReady
    if(this.props.allReady){
      // TODO: Actually start game
      console.log('Starting')
      startGame(this.props.playersReady);
    } else {
      console.log('Not starting')
    }
  }

  refreshShopEvent = () => {
    // You have enough money to refresh
    if(this.props.gold >= 2 && this.props.gameIsLive){
      refreshShop(this.props.storedState)
    } else{
      updateMessage(this.props, 'Not enough gold!');
    }
  }

  buyExp = () => {
    // You have enough money to buy exp
    if(this.props.gold >= 5 && this.props.gameIsLive){
      buyExp(this.props.storedState)
    } else{
      updateMessage(this.props, 'Not enough gold!');
    }
  }

  pos = (x,y) => {
    if(isUndefined(y)){
      return String(x);
    }
    return String(x) + ',' + String(y);
  }

  statsMap = {};

  buildStats = () => {
    if(this.props.stats){
      const s = this.props.stats;
      let evolves_from = '';
      let evolves_to = '';
      if(s.evolves_from) {
        evolves_from = <span className='flex'>
          <span className='paddingRight5 marginTop15'>Evolves from: </span>
          <PokemonImage name={s.evolves_from} sideLength={40}/>
        </span>;
      }
      if(s.evolves_to) {
        evolves_to = <span className='flex'>
          <span className='paddingRight5 marginTop15'>Evolves to: </span>
          <PokemonImage name={s.evolves_to} sideLength={40}/>
        </span>
      }
      const content = <div className='center'>
        <div className='textAlignCenter'>
        {(Array.isArray(s.type) ? 
            <div>
              <span className={`type typeLeft ${s.type[0]}`}>{s.type[0]}</span>
              <span className={`type ${s.type[1]}`}>{s.type[1] + '\n'}</span>
            </div>
          : <span className={`type ${s.type}`}>{s.type + '\n'}</span>)}
        </div>
        <div style={{paddingTop: '15px'}}>
          {/*<div>
            <span>Hp: </span>
            <span style={{position: 'relative'}}>
              <div className='levelBar overlap' style={{width: String(s.hp/150 * 100) + '%'}}></div>
              <div className='overlap'>
                {` ${s.hp}`}
              </div>
            </span>
          </div>*/}
          <span className='center'>{`Hp: ${s.hp}\n`}</span>
          <span>{`Attack: ${s.attack}\n`}</span>
          <span>{`Defense: ${s.defense}\n`}</span>
          <span>{`Speed: ${s.speed}\n`}</span>
          <span className={`type ${s.abilityType}`}>{`Ability: ${s.abilityDisplayName}\n`}</span>
        </div>
        <div>
          {evolves_from}
          {evolves_to}
        </div>
      </div>
      return content;
    }
  }

  selectedUnitInformation = () => {
    const className = 'center text_shadow infoPanel';
    const noSelected = <div className={`${className}`} style={{paddingTop: '40px', paddingLeft: '18px'}}>No unit selected</div>
    if(!isUndefined(this.props.selectedUnit)){
      let pokemon = (this.props.selectedUnit.isBoard ? this.props.myBoard[this.props.selectedUnit.pos] : this.props.myHand[this.props.selectedUnit.pos]);
      if(pokemon){
        this.props.dispatch({type: 'NEW_UNIT_SOUND', newAudio: getAudio(pokemon.name)});
        const pokeEl= <PokemonImage name={pokemon.name} sideLength={50}/>;
        // console.log('@selectedUnitInformation', pokemon.display_name, pokemon)
        return <div className={className}>
          <div className='textAlignCenter' style={{paddingTop: '30px'}}>
            <div>{pokemon.display_name}</div>
            {pokeEl}
          </div>
          {this.buildStats()}
          <div className='centerWith50 marginTop5'>
            <button className='normalButton' onClick={() => {
              const from = this.props.selectedUnit.pos;
              this.sellPieceEvent(from);
            }}>Sell {pokemon.display_name}</button>
          </div>
        </div>
      }
    }
    return noSelected;
  }
  
  placePieceEvent = (fromParam, to) => {
    // to is on valid part of the board
    const prop = this.props;
    const from = String(fromParam);
    if(from && to && prop.gameIsLive){
      console.log('@placePieceEvent',from, to);
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
        updateMessage(prop, 'Invalid target placing!');
      }
    }
  }
  
  withdrawPieceEvent = (from) => {
    // Hand is not full
    const prop = this.props;
    const size = Object.keys(prop.myHand).length
    if(prop.myBoard[from] && !prop.onGoingBattle && prop.gameIsLive){ // From contains unit
      if(size < 8){
        withdrawPiece(prop.storedState, String(from));
        prop.dispatch({ type: 'SELECT_UNIT', selectedUnit: {pos: ''}});
      } else{
        updateMessage(prop, 'Hand is full!');
      }
    }
  }

  sellPieceEvent = (from) => {
    const prop = this.props;
    const validUnit = (prop.selectedUnit.isBoard ? prop.myBoard[from] : prop.myHand[from])
    console.log('@sellPiece', validUnit, from, prop.selectedUnit.isBoard)
    if(validUnit && !prop.onGoingBattle && prop.gameIsLive){ // From contains unit
      sellPiece(prop.storedState, String(from));
      prop.dispatch({ type: 'SELECT_UNIT', selectedUnit: {pos: ''}});
    } else{
      updateMessage(prop, 'Invalid target to sell!', from);
    }
  }

  handleKeyPress(event){
    // console.log(event)
    // console.log(event.key, event.currentTarget)
    const prop = this.props;
    let from;
    switch(event.key){
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
        from = String(parseInt(event.key) - 1);
      case 'q':
        from = (isUndefined(from) ? prop.selectedUnit.pos : from);
        const to = prop.mouseOverId;
        console.log('@placePiece q pressed', from, to)
        this.placePieceEvent(from, to);
        prop.dispatch({ type: 'SELECT_UNIT', selectedUnit: {}})
        break;
      case 'w':
        from = prop.mouseOverId;
        console.log(prop.myBoard, from, prop.mouseOverId)
        if(!isUndefined(from) && prop.myBoard[from]){
          this.withdrawPieceEvent(from);
        } else {
          from = prop.selectedUnit.pos;
          this.withdrawPieceEvent(from);
        }
        prop.dispatch({ type: 'SELECT_UNIT', selectedUnit: {}})
        break;
      case 'e':
        from = prop.selectedUnit.pos;
        if(!isUndefined(from)){
          this.sellPieceEvent(from);
        } else {
          console.log('Use Select to sell units!')
        }
        prop.dispatch({ type: 'SELECT_UNIT', selectedUnit: {}})
        break;
      case 'd':
        this.refreshShopEvent();
        break;
      case 'f':
        this.buyExp();
        break;
      default:
    }
  }

  wait = async (ms) => {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }

  renderMove = async (nextMove, board, timeToWait) => {
    let newBoard = board;
    await this.wait(timeToWait);
    // console.log('@Time: ', timeToWait, board);
    const action = nextMove.action;
    const target = nextMove.target;
    const value = nextMove.value;
    const unitPos = nextMove.unitPos;
    const typeEffective = nextMove.typeEffective;
    const unit = newBoard[unitPos];  // Save unit from prev pos
    switch(action) {
      case 'move':
        console.log('Move from', unitPos, 'to', target);
        delete newBoard[unitPos];        // Remove unit from previous pos
        newBoard[target] = unit;         // Add unit to new pos on board
        // newBoard[unitPos].actionMessage = '';
        return newBoard;
      case 'attack':
        // TODO: Animate attack on unitPos
        if(isUndefined(newBoard[target])){
          console.log('Time to crash: ', newBoard, target, value);
        }
        if(typeEffective !== '') {
          // Either '' or Message
          newBoard[unitPos].actionMessage = value + '! ' + typeEffective;
        } else {
          newBoard[unitPos].actionMessage = value;
        }
        const newHp = newBoard[target].hp - value;
        console.log('Attack from', unitPos, 'with', value, 'damage, newHp', newHp);
        if(newHp <= 0){
          delete newBoard[target]; 
        } else {
          newBoard[target].hp = newHp;
        }
        return newBoard;
      case 'spell':
        // TODO: Animations
        // TODO: Check spell effects
        const effect = nextMove.effect;
        const abilityName = nextMove.abilityName;
        if(typeEffective !== '') {
          // Either '' or Message
          newBoard[unitPos].actionMessage = abilityName + '! ' + value + '! ' + typeEffective;
        } else {
          newBoard[unitPos].actionMessage = value;
        }
        let newHpSpell = newBoard[target].hp - value;
        console.log('Spell (' + abilityName + ') from', unitPos, 'with', value, 'damage, newHp', newHpSpell, (effect ? effect : ''));
        if(effect && Object.keys(effect).length){
          console.log('SPELL EFFECT Not Empty: ', effect);
          Object.keys(effect).forEach(e => {
            const unitPosEffect = newBoard[e];
            const effectToApplyOnUnit = effect[e];
            Object.keys(effectToApplyOnUnit).forEach(buff => {
              const typeEffect = buff;
              const valueEffect = effectToApplyOnUnit[buff];
              console.log('Found', typeEffect, 'effect with value', valueEffect, 'for unit', unitPosEffect);
              switch(typeEffect){
                case 'multistrike':
                  // TODO Visualize multistrike ability
                case 'teleport':
                case 'noTarget':
                case 'dot':
                  // TODO Visualize 'dot' is appled to unit
                  break;
                case 'heal':
                  if(unitPosEffect === target){
                    newHpSpell += valueEffect;
                  } else {
                    newBoard[unitPosEffect].hp = newBoard[unitPosEffect].hp + valueEffect;
                  }
                  break;
                // case buffs, not required in theory for attack or defence, since not visible
                default:
              }
            });
          });
        }
        if(newHpSpell <= 0){
          delete newBoard[target]; 
        } else {
          newBoard[target].hp = newHpSpell;
        }
        return newBoard;
      default:
        console.log('error action = ', action);
    }
  }

  startBattleEvent = async (self) => {
    const { dispatch, actionStack, battleStartBoard } = self.props;
    dispatch({type: 'CHANGE_STARTBATTLE', value: false});
    let board = battleStartBoard
    let currentTime = 0;
    const timeFactor = 15; // Load in a better way TODO
    console.log('Starting Battle with', actionStack.length, 'moves');
    // Add some kind of timer here for battle countdowns (setTimeout here made dispatch not update correct state)
    let counter = 0;
    while(actionStack.length > 0) {
      const nextMove = actionStack.shift(); // actionStack is mutable
      const time = nextMove.time;
      const nextRenderTime =  (time - currentTime) * timeFactor;
      if(isUndefined(board)){
        console.log('CHECK ME: Board is undefined', board, nextMove, nextRenderTime);
      }
      board = await this.renderMove(nextMove, board, nextRenderTime);
      // console.log('Next action in', nextRenderTime, '(', currentTime, time, ')')
      currentTime = time;
      dispatch({type: 'UPDATE_BATTLEBOARD', board, moveNumber: counter});
      counter += 1;
    }
    if(actionStack.length === 0){
      if(isUndefined(battleStartBoard)){
        dispatch({type: 'UPDATE_MESSAGE', message: 'You lost!'}); 
      } else {
        const winningTeam = Object.values(battleStartBoard)[0].team;
        // console.log('END OF BATTLE: winningTeam', winningTeam, 'x', Object.values(battleStartBoard));
        if(winningTeam === 0) {
          dispatch({type: 'UPDATE_MESSAGE', message: 'You won!'}); 
        } else {
          dispatch({type: 'UPDATE_MESSAGE', message: 'You lost!'}); 
        }
      }
    }
  }

  // TODO: Add listener here to call this.startBattleEvent (Some kind of state change)
  //     {(this.props.startBattle ? this.startBattleEvent() : '')}

  playerStatsDiv = () => {
    const players = this.props.players;
    const sortedPlayersByHp = Object.keys(players).sort(function(a,b){return players[b].hp - players[a].hp});
    let list = [];
    for(let i = 0; i < sortedPlayersByHp.length; i++){
      // console.log('inner: ', i, sortedPlayersByHp[i], players[sortedPlayersByHp[i]], players[sortedPlayersByHp[i]].hp)
      list.push(<div key={i}>{'Player ' + players[sortedPlayersByHp[i]].index + ': ' + players[sortedPlayersByHp[i]].hp + ' hp'}</div>)
    }
    // console.log('@PlayerStatsDiv', sortedPlayersByHp);
    return <div className='text_shadow biggerText' style={{paddingTop: '45px'}}>
      Scoreboard:  
      {list}
    </div>
  }

  getAmountOfUnitsOnBoard = () => {
    const unitsOnBoard = Object.keys(this.props.myBoard).length;
    const level = this.props.level;
    let color;
    if(unitsOnBoard > level) {
      color = 'red'
    }
    const content = <span style={{color: color}}>{unitsOnBoard}</span>
    return <div className='marginTop5 biggerText text_shadow' style={{paddingLeft: '65px'}}>
      Pieces: {content} / {level}
    </div>
  }

  playMusic = () => {
    let source = '';
    if(this.props.onGoingBattle){
      if(this.props.enemyIndex) {
        source = getBackgroundAudio('pvpbattle');
      } else {
        source = getBackgroundAudio('battle');
      }
    } else {
      source = getBackgroundAudio('idle');
    }
    const ref = React.createRef();
    return <audio ref={ref} src={source} onLoadStart={() => ref.current.volume = this.props.volume} loop autoPlay/>
  }

  handleVolumeChange = (e) => {
    const newVolume = e.target.value / 100; // this.audioElement.length * 
    console.log('@handleVolumechange', e.target.value)
    this.props.dispatch({type: 'CHANGE_VOLUME', newVolume})
  }

  unitSound = () => {
    let ref = React.createRef();
    return (this.props.soundEnabled ? <audio ref={ref} src={this.props.selectedSound } onLoadStart={() => ref.current.volume = this.props.volume} autoPlay/> : '')
  }

  buildHelp = () => {
    let s = 'Information:\n';
    s += 'Hotkeys:\n';
    s += 'Q: Place Unit\n';
    s += 'W: Withdraw Unit\n';
    s += 'E: Sell Unit\n';
    s += 'F: Buy Exp\n';
    s += 'D: Refresh Shop\n';
    if(this.props.typeStatsString){
      s += this.props.typeStatsString;
    }
    alert(s); // Don't allow this, pauses battle
  }

  render() {
    return <div>
      <div className='centerWith50 flex' style={{width: '80%'}}>
        <div className='marginTop5 biggerText text_shadow' style={{paddingLeft: '65px'}}>
          {'Round: ' + this.props.round}
        </div>
        {this.getAmountOfUnitsOnBoard()}
        <div className='flex' style={{paddingLeft: '65px'}}>
          <div className='marginTop5 biggerText'>
            <span className='text_shadow paddingLeft5'>{JSON.stringify(this.props.gold, null, 2)}</span>
          </div>
          <img className='goldImage' src={goldCoin} alt='goldCoin'></img>
        </div>
        {( this.props.onGoingBattle ? <div className='marginTop5 biggerText text_shadow' style={{paddingLeft: '65px'}}>
          {(this.props.enemyIndex ? 'Enemy ' + this.props.enemyIndex : '')} 
        </div> : '')}
      </div>
      <div className='flex' style={{paddingTop: '10px'}} onKeyDown={(event) => this.handleKeyPress(event)} tabIndex='0'>
        <div style={{width: '165px'}}>
          <div className='flex'> 
            <button className={'normalButton' + (this.props.level !== -1 ? ' hidden': '')} onClick={this.toggleReady} style={{width: '80px'}}>{(this.props.ready ? 'Unready' : 'Ready')}</button>
            <button className={'normalButton' + (this.props.level !== -1 ? ' hidden': '')} onClick={this.startGame}>
              StartGame{(this.props.playersReady !== -1 ? ` (${this.props.playersReady}/${this.props.connectedPlayers})` : '')}
            </button>
          </div>
          <div className='flex'>
            <div className='marginTop5 biggerText text_shadow paddingLeft5' style={{marginTop: '15px'}}>
              {'Player ' + this.props.index}
            </div>
            <div className='marginTop5 paddingLeft5'>
              <button className={'normalButton'} onClick={this.buildHelp}>Help</button>
            </div>
          </div>
          <div className={'text_shadow messageUpdate'} style={{padding: '5px'}} >
            <CSSTransitionGroup
              transitionName="messageUpdate"
              transitionEnterTimeout={500}
              transitionLeave={false}>
              <div>
                {'Message: ' + this.props.message}
              </div>
            </CSSTransitionGroup>
          </div>
          <div className = 'centerWith50'>
            <button className='normalButton marginTop5' onClick={this.buyExp}>Buy Exp</button>
          </div>
          <div>
            {this.selectedUnitInformation()}
            {this.unitSound()}
          </div>
          <div className='centerWith50 marginTop5'>
            <button className='normalButton' onClick={() => this.props.dispatch({type: 'TOGGLE_MUSIC'})}>
              {(this.props.musicEnabled ? 'Mute Music': 'Turn on Music')}
            </button>
            <button className='normalButton marginTop5' onClick={() => this.props.dispatch({type: 'TOGGLE_SOUND'})}>
              {(this.props.soundEnabled ? 'Mute Sound': 'Turn on Sound')}
            </button>
            {(this.props.musicEnabled && this.props.gameIsLive ? this.playMusic() : '')}
          </div>
          <div className='paddingLeft5'>
            Volume: 
            <input
              type="range"
              className="volume-bar"
              value={this.props.volume * 100}
              min="0"
              max="100"
              step="0.01"
              onChange={this.handleVolumeChange}
              />
          </div>
          <div>mouseOverId: {JSON.stringify(this.props.mouseOverId, null, 2)}</div>
          {/*<div>Selected Unit: {JSON.stringify(this.props.selectedUnit, null, 2)}</div>*/}
        </div>
        <div>
          <div>
            <Board height={8} width={8} map={this.props.myBoard} isBoard={true} newProps={this.props}/>
          </div>
          <div className='levelDiv'>
            <div className='levelBar overlap' style={{width: (this.props.expToReach !== 0 ? String(this.props.exp/this.props.expToReach * 100) : '100') + '%'}}></div>
            <div className='biggerText centerWith50 overlap levelText'>
              <span className='text_shadow paddingLeft5 paddingRight5'>{'Level ' + JSON.stringify(this.props.level, null, 2)}</span>
              {/*<span className='text_shadow paddingLeft5 paddingRight5'>{'( ' + (this.props.expToReach === 'max' ? 'max' : this.props.exp + '/' + this.props.expToReach) + ' )'}</span>*/}
            </div>
            <div className='overlap text_shadow marginTop5 paddingLeft5'>
              {'Exp: ' + this.props.exp + '/' + this.props.expToReach}
            </div>
            {/*<div className='paddingLeft5 center'>_____________________________________________________________________________</div>*/}
          </div>
          <div className='flex center'>
            <Board height={1} width={8} map={this.props.myHand} isBoard={false} newProps={this.props}/>
          </div>
        </div>
        <div className='paddingLeft5'>
          <div>
            <div>
              <div className='flex'>
                <Pokemon shopPokemon={this.props.myShop[this.pos(0)]} index={0} newProps={this.props}/>
                <Pokemon shopPokemon={this.props.myShop[this.pos(1)]} index={1} newProps={this.props}/>
                <Pokemon shopPokemon={this.props.myShop[this.pos(2)]} index={2} newProps={this.props}/>
              </div>
              <div className='flex'>
                <div className='' style={{paddingTop: '60px', paddingLeft: '24px'}}>
                  <div>
                    <img className='lockImage' onClick={() => toggleLock(this.props.storedState)} src={this.props.lock ? lockedLock : openLock} alt='lock'/>   
                  </div>
                  <div style={{paddingTop: '10px'}}>
                    <img className='refreshShopImage' onClick={this.refreshShopEvent} src={refreshShopImage} alt='refreshShop'/>
                  </div>
                  <div className='flex'>
                    <div className='text_shadow goldImageTextSmall'>2</div>
                    <img className='goldImageSmall' src={goldCoin} alt='goldCoin'></img>
                  </div>
                </div>
                <Pokemon shopPokemon={this.props.myShop[this.pos(3)]} index={3} newProps={this.props} className='pokemonShopHalf'/>
                <Pokemon shopPokemon={this.props.myShop[this.pos(4)]} index={4} newProps={this.props} className='paddingLeft30'/>                
              </div>
            </div>
          </div>
          <div style={{paddingTop: '20px', paddingLeft: '10px'}}>
            <button className='normalButton' onClick={() => battleReady(this.props.storedState)}>Battle ready</button>
          </div>
        </div>
        <div>
          {this.playerStatsDiv()}
        </div>
      </div>
      <input className='hidden' type='checkbox' checked={this.props.startBattle} onChange={(this.props.startBattle ? this.startBattleEvent(this) : () => '')}/>
      {/*
      <p>battleStartBoard:{JSON.stringify(this.props.battleStartBoard, null, 2)}</p>
      <div>{'Board: ' + JSON.stringify(this.props.myBoard, null, 2)}</div>
      <div>{'Hand: ' + JSON.stringify(this.props.myHand, null, 2)}</div>
      <p>Index:{JSON.stringify(this.props.index, null, 2)}</p>
      <p>players:{JSON.stringify(this.props.players, null, 2)}</p>
      <p>player:{JSON.stringify(this.props.player, null, 2)}</p>
      <p>myShop:{JSON.stringify(this.props.myShop, null, 2)}</p>
      <p>myHand:{JSON.stringify(this.props.myHand, null, 2)}</p>
      <p>myBoard:{JSON.stringify(this.props.myBoard, null, 2)}</p>
      <p>lock:{JSON.stringify(this.props.lock, null, 2)}</p>
      <p>level:{JSON.stringify(this.props.level, null, 2)}</p>
      <p>exp:{JSON.stringify(this.props.exp, null, 2)}</p>
      <p>gold:{JSON.stringify(this.props.gold, null, 2)}</p>
      <p>State:{JSON.stringify(this.props.storedState, null, 2)}</p>
      */}
    </div>;
  }
}

const mapStateToProps = state => ({
  gameIsLive: state.gameIsLive, 
  index: state.index,
  ready: state.ready,
  playersReady: state.playersReady,
  connectedPlayers: state.connectedPlayers,
  allReady: state.allReady,
  message: state.message,
  storedState: state.storedState,
  pieces: state.pieces,
  players: state.players,
  player: state.player,
  myHand: state.myHand,
  myBoard: state.myBoard,
  myShop: state.myShop,
  lock: state.lock,
  level: state.level,
  exp: state.exp,
  expToReach: state.expToReach,
  gold: state.gold,
  onGoingBattle: state.onGoingBattle,
  enemyIndex: state.enemyIndex,
  startBattle: state.startBattle,
  actionStack: state.actionStack,
  battleStartBoard: state.battleStartBoard,
  selectedUnit: state.selectedUnit,
  mouseOverId: state.mouseOverId,
  stats: state.stats,
  statsMap: state.statsMap,
  typeStatsString: state.typeStatsString,
  round: state.round,
  musicEnabled: state.musicEnabled,
  soundEnabled: state.soundEnabled,
  selectedSound: state.selectedSound,
  volume: state.volume,
});

export default connect(mapStateToProps)(App);
// TODO: Add react code here to connect to the reducer (state)

//export default App;
