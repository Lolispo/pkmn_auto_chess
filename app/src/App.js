// Author: Petter Andersson

import React, { Component } from 'react';
import { ready, unready, startGame, toggleLock, buyUnit, refreshShop, buyExp, placePiece, withdrawPiece, battleReady, sellPiece, getStats, sendMessage} from './socket';
import { connect } from 'react-redux';
import { isUndefined, updateMessage } from './f';
import CSSTransitionGroup from 'react-addons-css-transition-group';
import './App.css';

import lockedLock from './assets/lockedLock.png';
import openLock from './assets/openLock.png';
import goldCoin from './assets/goldCoin.png';
import refreshShopImage from './assets/refreshShop.png';
import pokemonLogo from './assets/pokemonLogo.png';
import autoChess from './assets/AutoChess.png';
import soundMuted from './assets/soundMuted.png';
import sound from './assets/sound.png';
import music from './assets/note.png';
import musicMuted from './assets/noteMuted.png';
import pieceImg from './assets/piece.png';
import info from './assets/info.png';
import { getUnitAudio, getSoundEffect } from './audio.js';

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
    const baseMarginTop = paddingTop + height - 15;
    const baseMarginLeft = 85 - width - 7;
    return (
      <CSSTransitionGroup
          transitionName="example"
          transitionEnterTimeout={300}
          transitionLeave={false}>
          <div>
            {(this.props.renderBase ? <div key={this.props.renderBase} className={`pokemonImageBase ${this.props.renderBase}`} 
            style={{
              marginTop: (isNaN(baseMarginTop) ? '' : baseMarginTop), 
              marginLeft: (isNaN(baseMarginLeft) ? '' : baseMarginLeft), 
              width: (!isNaN(width) ? width * 1.5 : '')
            }}></div> : '')}
            <img
              className={`pokemonImg ${this.props.name} ${(this.props.classList ? this.props.classList : '')}`}
              key={src}
              style={{paddingTop: paddingTop, width: width, height: height}}
              src={src}
              alt='Pokemon'
              onLoad={this.onImgLoad}
            />
          </div>
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
    if(this.props.newProps.isDead){
      updateMessage(this.props.newProps, 'You are dead! No buying when dead', 'error');
      this.props.newProps.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('invalid')});
      return;
    }
    if(this.props.shopPokemon && this.props.newProps.gameIsLive){
      if(this.props.newProps.gold >= this.props.shopPokemon.cost){
        const size = Object.keys(this.props.newProps.myHand).length;
        if(size < 8){
          buyUnit(this.props.newProps.storedState, index);
        } else{
          updateMessage(this.props.newProps, 'Hand is full!', 'error');
          this.props.newProps.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('invalid')});
        }
      } else{
        updateMessage(this.props.newProps, 'Not enough gold!', 'error');
        this.props.newProps.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('invalid')});
      }
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

  infoEvent = (event) => {
    event.stopPropagation();
    const prop = this.props.newProps;
    console.log('Pressed info shop', this.props.shopPokemon.name)
    prop.dispatch({ type: 'SELECT_SHOP_INFO', name: this.props.shopPokemon.name});
    this.getStatsEvent(prop, this.props.shopPokemon.name);
  }

  render(){
    let content;
    if(!isUndefined(this.props.shopPokemon)){
      const costColorClass = (!isUndefined(this.props.shopPokemon) ? 'costColor' + this.props.shopPokemon.cost : '')
      const costColorTextClass = (!isUndefined(this.props.shopPokemon) ? 'costColorText' + this.props.shopPokemon.cost : '')
      /*
      const backgroundColor = (Array.isArray(this.props.shopPokemon.type) ? 
            this.props.shopPokemon.type[0] : this.props.shopPokemon.type);
      */
      content = <div>
            <div className={`pokemonImageDiv`}>
              <div className='pokemonInfo'>
                <img className='infoImg' src={info} onClick={this.infoEvent} alt={'info' + this.props.shopPokemon.name}/>
                <div className='infoImgBg'/>
              </div>
              <PokemonImage name={this.props.shopPokemon.name} sideLength={85} renderBase={costColorClass}/>
            </div>
            <div className='pokemonShopText'>
              <span className={costColorTextClass}>{this.props.shopPokemon.display_name + '\n'}</span>
              {(Array.isArray(this.props.shopPokemon.type) ?
                <div>
                  <span className={`type typeLeft ${this.props.shopPokemon.type[0]}`}>{this.props.shopPokemon.type[0]}</span>
                  <span className={`type ${this.props.shopPokemon.type[1]}`}>{this.props.shopPokemon.type[1] + '\n'}</span>
                </div>
                : <span className={`type ${this.props.shopPokemon.type}`}>{this.props.shopPokemon.type + '\n'}</span>)}
              {<span className={(this.props.newProps.gold < this.props.shopPokemon.cost ? 'redFont' : '')}>{'$' + this.props.shopPokemon.cost}</span>}
            </div>
          </div>
    } else {
      content = <div className={`pokemonShopEmpty text_shadow`}>Empty</div>;
    }
    return (
      <div className={`pokemonShopEntity ${(this.props.className ? this.props.className : '')}`} onClick={() => this.buyUnitEvent(this.props.index)}>
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
      return <div className='boardColumn' key={counter++}>{
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
    if(prop.isDead){
      updateMessage(prop, 'You are dead!', 'error');
      prop.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('invalid')});
      return;
    }
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
        updateMessage(prop, 'Invalid target placing!', 'error');
        prop.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('invalid')});
      }
    }
  }

  handleCellClick(el){
    const unit = (el.props.isBoard ? (el.props.newProps.onGoingBattle ? el.props.newProps.battleStartBoard[this.state.pos] : el.props.newProps.myBoard[this.state.pos]) : el.props.newProps.myHand[this.state.pos]);
    const prevSelectedUnit = el.props.newProps.selectedUnit;
    console.log('@handleCellClick pressed', el.props.value.x, ',', el.props.value.y)
    // console.log(' -', el.props.isBoard, el.props.newProps.onGoingBattle, this.state.pos, unit, prevSelectedUnit)
    // If unit selected -> presses empty -> place piece 
    if(this.state.pos !== prevSelectedUnit.pos){ // Shouldn't do anything if same tile as SELECT_UNIT Tile
      el.props.newProps.dispatch({ type: 'SELECT_UNIT', selectedUnit: {...el.props.value, isBoard: el.props.isBoard, pos: this.state.pos, unit: unit}});
    } else { // Deselect by doubleclick same unit
      el.props.newProps.dispatch({ type: 'SELECT_UNIT', selectedUnit: {isBoard: el.props.isBoard, pos: ''}});
    }
    if(unit){ // Pressed unit
      console.log('Get Stats for', unit.name)
      el.props.newProps.dispatch({ type: 'NEW_UNIT_SOUND', newAudio: ''});
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
        (el.parentElement.parentElement.id === '' ? 
          (el.parentElement.parentElement.parentElement.id === '' ? 
            (el.parentElement.parentElement.parentElement.parentElementid === '' ? '' : el.parentElement.parentElement.parentElement.parentElement.id) 
          : el.parentElement.parentElement.parentElement.id) 
        : el.parentElement.parentElement.id) 
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
        pokemon = this.props.newProps.battleStartBoard[this.state.pos];
        const hpBar = (pokemon ? <div className='barDiv' style={{width: sideLength}}>
          <div className={`hpBar text_shadow ${(this.props.isBoard ? (pokemon.team === 0 ? 'friendlyBar' : 'enemyBar') : '')}`} 
          style={{width: (pokemon.hp / pokemon.maxHp * 100)+'%'}}>{`${pokemon.hp}/${pokemon.maxHp}`}</div>
          </div> : '');
        const manaBar = (pokemon ? <div className='barDiv' style={{width: sideLength}}>
          <div className={`manaBar text_shadow ${(pokemon.mana === 0 ? 'hidden' : '')}
          ${(pokemon.mana >= pokemon.manaCost ? 'colorPurple' : '')}`} style={{width: (pokemon.mana / 150 * 100)+'%'}}>{`${pokemon.mana}/${pokemon.manaCost}`}</div>
          </div> : '');
        const actionMessage = (pokemon && pokemon.actionMessage && pokemon.actionMessage !== '' ? 
          <div className={`text_shadow actionMessage ${(pokemon.actionMessage.split(' ').length > 2 ? 'actionMessagePadding' : '')}`} style={{position: 'absolute'}}>
            {pokemon.actionMessage}
          </div>
          : '');
        if(!isUndefined(pokemon)){
          const back = (this.props.isBoard ? (!isUndefined(pokemon.team) ? pokemon.team === 0 : true) : false);
          const classList = (pokemon.winningAnimation ? ' winningAnimation' : (pokemon.attackAnimation ? ' ' + pokemon.attackAnimation : '')) + ' absolute';
          // console.log('@rendereding pokemonImage classList', classList)
          return <div style={{position: 'relative'}}>
            <PokemonImage name={pokemon.name} back={back} sideLength={sideLength} classList={classList}/>
            {hpBar}
            {manaBar}
            {actionMessage}
          </div>
        }
      } else {
        pokemon = this.props.map[this.state.pos];
        // if(pokemon && pokemon.buff) console.log(pokemon.buff)
        let buffs = '';
        if(this.props.isBoard){
          let pokemonBuffList = [];
          if(pokemon && pokemon.buff && pokemon.buff.length > 0){
            // console.log('@stuff', pokemonBuffList, pokemon.buff.length)
            for(let i = 0; i < pokemon.buff.length; i++){
              pokemonBuffList.push(<span>{pokemon.buff[i] + '\n'}</span>);
            }
          }
          buffs = (pokemon && pokemon.buff && pokemon.buff.length > 0 ? <div className='text_shadow textList buffText'>Buffed: {pokemonBuffList}</div> : '');
        }
        if(!isUndefined(pokemon)){
          const back = (this.props.isBoard ? (!isUndefined(pokemon.team) ? pokemon.team === 0 : true) : false);
          return <div>
            <PokemonImage name={pokemon.name} back={back} sideLength={sideLength}/>
            {buffs}
          </div>
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


class Audio extends Component {
  constructor(props) {
    super(props);
    this.state = {
      props: this.props.newProps,
      loop: this.props.loopEnabled || false,
      source: this.props.source,
      volume: this.props.newProps.volume,
    };
  }

  render() {
    console.log('@Audio', this.state.source);
    const ref = React.createRef();
    if(this.state.loop){
      return <audio ref={ref} src={this.state.source} onLoadStart={() => ref.current.volume = this.state.volume} loop autoPlay/>
    } else {
      return <audio ref={ref} src={this.state.source} onLoadStart={() => ref.current.volume = this.state.volume} autoPlay/>
    }
  }
}

class Timer extends Component {

  constructor(props) {
    super(props);
    this.state = {
      seconds: '00',
    }
    this.startCountDown = this.startCountDown.bind(this);
    this.tick = this.tick.bind(this);
    if(this.props.startTimer && !this.props.gameEnded){
      console.log('@Timer constructor StartingTimer', this.props.startTime)
      this.startCountDown();
      this.props.dispatch({type: 'DISABLE_START_TIMER'})
    }
  }

  tick() {
    const sec = this.secondsRemaining;
    this.setState({
      seconds: sec
    })
    if (sec < 10) {
      this.setState({
        seconds: '0' + this.state.seconds,
      })
    }
    if (sec === 0) {
      console.log('@Timer.tick Stopping timer since sec === 0', sec, this.secondsRemaining)
      clearInterval(this.intervalHandle);
      if(Object.keys(this.props.storedState).length > 0){
        console.log('BattleReady!')
        battleReady(this.props.storedState);
      }
    }
    this.secondsRemaining--
  }
  
  startCountDown() {
    console.log('@Timer.StartCountDown! intervalHandle', this.intervalHandle)
    this.secondsRemaining = this.props.startTime;
    clearInterval(this.intervalHandle);
    console.log('intervalHandle2', this.intervalHandle)
    this.intervalHandle = setInterval(this.tick, 1000);
    console.log('@Timer.StartCountDown: ', this.secondsRemaining, this.intervalHandle);
  }

  componentWillUnmount() {
    clearInterval(this.intervalHandle);
  }

  render () {
    return <div className='timerDiv'>
      <div className='text_shadow timerText'>{(this.state.seconds !== '00' ? this.state.seconds : '')}</div>
    </div>
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {chatMessageInput: ''};
  }
  // Event listener example, can be attached to example buttons
  
  // Event logic

  toggleReady = () => {
    console.log('@toggleReady', this.props.ready);
    const { dispatch } = this.props;
    dispatch({type: 'TOGGLE_READY'});
    this.props.ready ? unready() : ready();
  };

  startGameEvent = (forceStart=false) => {
    console.log('@startGameEvent', forceStart)
    if(this.props.allReady || forceStart){
      console.log('Starting')
      startGame(this.props.playersReady);
    } else {
      console.log('Not starting')
    }
  }

  refreshShopEvent = () => {
    // You have enough money to refresh
    if(this.props.isDead){
      updateMessage(this.props, 'You are dead! No shop interaction when dead', 'error');
      this.props.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('invalid')});
      return;
    }
    if(this.props.gold >= 2 && this.props.gameIsLive){
      refreshShop(this.props.storedState)
    } else{
      updateMessage(this.props, 'Not enough gold!', 'error');
      this.props.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('invalid')});
    }
  }

  buyExpEvent = () => {
    // You have enough money to buy exp
    if(this.props.isDead){
      updateMessage(this.props, 'You are dead! No exp buying when dead', 'error');
      this.props.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('invalid')});
      return;
    }
    if(this.props.gold >= 5 && this.props.gameIsLive && this.props.level < 10){
      buyExp(this.props.storedState)
    } else{
      updateMessage(this.props, 'Not enough gold!', 'error');
      this.props.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('invalid')});
    }
  }

  pos = (x,y) => {
    if(isUndefined(y)){
      return String(x);
    }
    return String(x) + ',' + String(y);
  }

  getPosCoords = (pos) => {
    return pos.split(',');
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
      const boardBuffs = this.props.boardBuffs;
      /*
      {(Array.isArray(s.type) ? 
        //boardBuffs.typeBuffMapSolo
        <div>
          <span className={`type typeLeft ${s.type[0]}`}>{s.type[0]}</span>
          <span className={`type ${s.type[1]}`}>{s.type[1] + '\n'}</span>
        </div>
      : <span className={`type ${s.type}`}>{s.type + '\n'}</span>)}
      Object.keys(boardBuffs.typeBuffMapAll).forEach(e => {
        
      });
      Object.keys(boardBuffs.typeDebuffMapEnemy).forEach(e => {
        
      });*/
      const content = <div className='center'>
        <div className='textAlignCenter marginTop5'>
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

  statsRender = (className, name, allowSell=false) => {
    const pokeEl= <PokemonImage name={name} sideLength={50}/>;
    return <div className={className}>
      <div className='textAlignCenter' style={{paddingTop: '30px'}}>
        <div>{this.props.stats.display_name}</div>
        {pokeEl}
      </div>
      {this.buildStats()}
      {(allowSell ? <div className='centerWith50 marginTop5'>
        <button className='normalButton' onClick={() => {
          const from = this.props.selectedUnit.pos;
          this.sellPieceEvent(from);
        }}>Sell {this.props.stats.display_name}</button>
      </div> : '')}
    </div>;
  }

  selectedUnitInformation = () => {
    const className = 'center text_shadow infoPanel';
    const noSelected = <div className={className}><div className={`noSelected`}>No unit selected</div></div>
    if(this.props.stats && !this.props.isSelectModeShop && !isUndefined(this.props.selectedUnit)){
      let pokemon = (this.props.selectedUnit.isBoard ? (this.props.onGoingBattle ? this.props.battleStartBoard[this.props.selectedUnit.pos] 
        : this.props.myBoard[this.props.selectedUnit.pos]) : this.props.myHand[this.props.selectedUnit.pos]);
      if(pokemon){
        this.props.dispatch({type: 'NEW_UNIT_SOUND', newAudio: getUnitAudio(pokemon.name)});
        // console.log('@selectedUnitInformation', pokemon.display_name, pokemon)
        return this.statsRender(className, pokemon.name, true);
      }
    } else if(this.props.stats && this.props.isSelectModeShop && this.props.selectedShopUnit !== ''){
      const name = this.props.selectedShopUnit;
      this.props.dispatch({type: 'NEW_UNIT_SOUND', newAudio: getUnitAudio(name)});
      return this.statsRender(className, name)
    }
    return noSelected;
  }
  
  placePieceEvent = (fromParam, to) => {
    // to is on valid part of the board
    const prop = this.props;
    const from = String(fromParam);
    if(prop.isDead){
      updateMessage(prop, 'You are dead!', 'error');
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
        updateMessage(prop, 'Invalid target placing!', 'error');
        prop.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('invalid')});
      }
    }
  }
  
  withdrawPieceEvent = (from) => {
    // Hand is not full
    const prop = this.props;
    if(prop.isDead){
      updateMessage(prop, 'You are dead!', 'error');
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

  sellPieceEvent = (from) => {
    const prop = this.props;
    if(prop.isDead){
      updateMessage(prop, 'You are dead!', 'error');
      prop.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('invalid')});
      return;
    }
    const validUnit = (prop.selectedUnit.isBoard ? prop.myBoard[from] : prop.myHand[from])
    console.log('@sellPiece', validUnit, from, prop.selectedUnit.isBoard)
    // From contains unit, hand unit is ok during battle
    // TODO: Remove false && and fix allowing sellPiece during battle, currently weird
    if(validUnit && prop.gameIsLive && (!prop.onGoingBattle || (false && !prop.selectedUnit.isBoard))){ 
      sellPiece(prop.storedState, String(from));
      prop.dispatch({ type: 'SELECT_UNIT', selectedUnit: {pos: ''}});
      prop.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('sellUnit')});
    } else{
      updateMessage(prop, 'Invalid target to sell! ' + from, 'error');
      prop.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('invalid')});
    }
  }

  handleKeyPress(event){
    // console.log(event)
    // console.log(event.key, event.currentTarget)
    const prop = this.props;
    let from;
    if(event.target.tagName === 'INPUT'){
      return;
    }
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
        this.buyExpEvent();
        break;
      default:
    }
  }

  wait = async (ms) => {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }

  damageUnit = async (newBoard, target, value, unitPos, direction, actionMessageTarget, manaChanges, actionMessageAttacker) => {
    if(isUndefined(newBoard[target])){
      console.log('Time to crash: ', newBoard, target, value);
    }
    if(actionMessageTarget)   newBoard[target].actionMessage = actionMessageTarget;
    if(actionMessageAttacker) newBoard[unitPos].actionMessage = actionMessageAttacker;
    // console.log('direction: ' + direction)
    if(direction !== '') {
      newBoard[unitPos].attackAnimation = 'animate' + direction; 
    }
    if(manaChanges && Object.keys(manaChanges).length){
      Object.keys(manaChanges).forEach(e => {
        const unitPosManaChange = newBoard[e];
        const newMana = manaChanges[e];
        unitPosManaChange.mana = newMana;
      });
    }
    const newHp = newBoard[target].hp - value;
    if(newHp <= 0){
      // TODO: Animation then remove
      newBoard[target].attackAnimation = 'animateDead'; 
      delete newBoard[target]; 
/*      await setTimeout(() => {
      }, 1)
*/
    } else {
      newBoard[target].hp = newHp;
    }
    return newBoard;
  }

  renderMove = async (nextMove, board) => {
    let newBoard = board;
    // console.log('@Time: ', timeToWait, board);
    const action = nextMove.action;
    const target = nextMove.target;
    const value = nextMove.value;
    const unitPos = nextMove.unitPos;
    const typeEffective = nextMove.typeEffective;
    const direction = nextMove.direction;
    const manaChanges = nextMove.manaChanges;
    const unit = newBoard[unitPos];  // Save unit from prev pos
    switch(action) {
      case 'move':
        console.log('Move from', unitPos, 'to', target);
        delete newBoard[unitPos];        // Remove unit from previous pos
        newBoard[target] = unit;         // Add unit to new pos on board
        newBoard[target].actionMessage = '';
        return newBoard;
      case 'attack':
        // TODO: Animate attack on unitPos
        console.log('Attack from', unitPos, 'to', target, 'with', value, 'damage');
        let actionMessage = '';
        if(typeEffective !== '') { // Either '' or Message
          actionMessage = '- ' + value + '! ' + typeEffective;
        } else {
          actionMessage = '- ' + value;
        }
        return this.damageUnit(newBoard, target, value, unitPos, direction, actionMessage, manaChanges);
      case 'spell':
        // TODO: Animations
        // TODO: Check spell effects
        const effect = nextMove.effect;
        const abilityName = nextMove.abilityName;
        let actionMessageTarget = '';
        let actionMessageAttacker = abilityName + '!';
        if(typeEffective !== '') { // Either '' or Message
          actionMessageTarget = '- ' + value + '! ' + typeEffective;
        } else {
          actionMessageTarget = '- ' + value;
        }
        if(direction !== '') {
          newBoard[unitPos].attackAnimation = 'animate' + direction; 
        }
        let newHpSpell = newBoard[target].hp - value;
        console.log('Spell (' + abilityName + ') from', unitPos, 'to', target, 'with', value, 'damage, newHp', newHpSpell, (effect ? effect : ''));
        if(effect && Object.keys(effect).length){
          console.log('SPELL EFFECT: ', effect);
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
                  actionMessageTarget = actionMessageTarget + '! Dot applied'
                  break;
                case 'heal':
                  if(unitPosEffect === target){
                    console.log('Enemy Heal (SHOULDNT OCCUR)')
                    newHpSpell += valueEffect;
                  } else {
                    console.log('Normal heal')
                    newBoard[e].hp = newBoard[e].hp + valueEffect;
                    actionMessageAttacker = actionMessageAttacker + '! Heal for ' + valueEffect;
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
          newBoard[target].actionMessage = actionMessageTarget;
        }
        newBoard[unitPos].actionMessage = actionMessageAttacker;
        return newBoard;
      case 'dotDamage': 
        // TODO: Animate Poison Damage on unitPos
        console.log('Poison damage on', unitPos, 'with', value, 'damage');
        actionMessage = '- ' + value +' Dot!';
        return this.damageUnit(newBoard, target, value, unitPos, direction, actionMessage);
      default:
        console.log('error action = ', action, nextMove);
        return board;
    }
  }

  endOfBattleClean = (battleBoard) => {
    const unitsAlive = Object.keys(battleBoard);
    for(let i = 0; i < unitsAlive.length; i++){
      // Jumping animation
      battleBoard[unitsAlive[i]].winningAnimation = true;
      console.log('Setting winningAnimation', unitsAlive[i], battleBoard[unitsAlive[i]]);
      battleBoard[unitsAlive[i]].actionMessage = '';
    }
    return battleBoard;
  }

  removeClassAnimation = (nextMove, board) => {
    const unitPos = nextMove.unitPos;
    if(board && board[unitPos]){
      board[unitPos].attackAnimation = '';
    }
    return board;
  }

  startBattleEvent = async () => {
    const { dispatch, actionStack, battleStartBoard } = this.props;
    if(this.props.isDead){
      return;
    }
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
      await this.wait(nextRenderTime);
      // Fix remove class Animation
      board = await this.removeClassAnimation(nextMove, board);
      dispatch({type: 'UPDATE_BATTLEBOARD', board, moveNumber: counter});
      board = await this.renderMove(nextMove, board);
      // console.log('Next action in', nextRenderTime, '(', currentTime, time, ')')
      currentTime = time;
      dispatch({type: 'UPDATE_BATTLEBOARD', board, moveNumber: counter});
      counter += 1;
    }
    if(actionStack.length === 0){
      board = await this.endOfBattleClean(battleStartBoard);
      dispatch({type: 'UPDATE_BATTLEBOARD', board, moveNumber: 'Ended'});
      const winningTeam = (Object.values(battleStartBoard)[0] ? Object.values(battleStartBoard)[0].team : 1);
      // console.log('END OF BATTLE: winningTeam', winningTeam, 'x', Object.values(battleStartBoard));
      if(winningTeam === 0) {
        updateMessage(this.props, 'Battle won!', 'big');
        dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('cheer')});
      } else {
        updateMessage(this.props, 'Battle lost!', 'big');
        dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('battleLose')});
      }
    }
  }

  createScoreboardPlayerEntry = (player, isDead) => {
    const hp = player.hp;
    return <div className='playerScoreboardContainer' key={player.index}>
      <div className='playerScoreboardInner'>
        <span>{'Player ' + player.index + '\n'}</span>
        {(this.props.players[player.index].streak ? <span className='streak'>{'Streak:' + this.props.players[player.index].streak}</span> : '')}
        <div className='playerHpBarDiv'>
          <div className={`playerHpBar overlap ${(hp === 0 ? 'hidden' : '')}`} 
          style={{width: (hp) + '%'}}/>
          <div className='playerHpBarText biggerText centerWith50 overlap'>
            <span className='text_shadow paddingLeft5 paddingRight5'>{hp + '%'}</span>
          </div>
        </div>
      </div>
    </div>
  }

  playerStatsDiv = () => {
    const players = this.props.players;
    const sortedPlayersByHp = Object.keys(players).sort(function(a,b){return players[b].hp - players[a].hp});
    let list = [];
    for(let i = 0; i < sortedPlayersByHp.length; i++){
      const player = players[sortedPlayersByHp[i]];
      // console.log('inner: ', i, sortedPlayersByHp[i], players[sortedPlayersByHp[i]], players[sortedPlayersByHp[i]].hp)
      list.push(this.createScoreboardPlayerEntry(player, false));
    }
    const deadPlayers = this.props.deadPlayers;
    for(let i = 0; i < deadPlayers.size; i++){
      const player = deadPlayers[i];
      list.push(this.createScoreboardPlayerEntry(player, true));
    }
    // console.log('@PlayerStatsDiv', sortedPlayersByHp);
    return <div className='scoreboard' style={{paddingTop: '45px'}}>
      <div className='text_shadow biggerText '>
        Scoreboard:  
        {list}   
      </div>
    </div>
  }

  getAmountOfUnitsOnBoard = () => {
    const unitsOnBoard = Object.keys(this.props.myBoard).length;
    const level = this.props.level;
    const content = <span className={(unitsOnBoard > level ? 'redFont' : '')}>{unitsOnBoard}</span>
    return <div className='marginTop5 flex' style={{paddingLeft: '65px'}}>
      <img style={{marginTop: '-5px'}} className='pieceImg' src={pieceImg} alt='Pieces'/>
      <div className='biggerText text_shadow' style={{paddingLeft: '5px'}}>
        <span className='pieceDiv'> : {content} / {level}</span>
      </div>
    </div>;
  }

  playMusic = () => {
    // console.log('@playMusic', this.props.music);
    const el = <audio ref='MusicEl' src={this.props.music} onLoadStart={() => this.refs.MusicEl.volume = this.props.volume} loop autoPlay/>;
    if(this.refs.MusicEl){
      this.refs.MusicEl.volume = this.props.volume;
    }
    return el;
    // return <Audio loopEnabled={true} source={source} newProps={this.props}/>
  }

  handleVolumeChange = (e) => {
    const newVolume = e.target.value / 100; // this.audioElement.length * 
    // console.log('@handleVolumechange', e.target.value)
    this.props.dispatch({type: 'CHANGE_VOLUME', newVolume})
  }

  unitSound = () => {
    let ref = React.createRef();
    return (this.props.soundEnabled ? <audio ref={ref} src={this.props.selectedSound} onLoadStart={() => ref.current.volume = this.props.volume} autoPlay/> : '')
    // return <Audio loopEnabled={false} source={this.props.selectedSound} newProps={this.props}/>
  }
/*
  soundEffect = () => {
    let ref = React.createRef();
    return (this.props.soundEnabled ? <audio ref={ref} src={this.props.soundEffect} onLoadStart={() => ref.current.volume = this.props.volume} autoPlay/> : '')
    // return <Audio loopEnabled={false} source={this.props.soundEffect} newProps={this.props}/>
  }
*/
  soundEffects = () => {
    let audioObjects = [];
    for(let i = 0; i < this.props.soundEffects.length; i++){
      const source = this.props.soundEffects[i];
      if(source === '')
        break;
      let ref = React.createRef();
      const audioEl = <audio ref={ref} key={'sound' + source + i} src={source} onLoadStart={() => ref.current.volume = this.props.volume} autoPlay/>;
      const chatSound = getSoundEffect('pling');
      audioObjects.push((this.props.soundEnabled && source !== chatSound) || (source === chatSound && this.props.chatSoundEnabled) ? audioEl : '');
    }
    return audioObjects;
    // return <Audio loopEnabled={false} source={this.props.soundEffect} newProps={this.props}/>
  }

  handleChatSubmit = (event) => {
    sendMessage(this.state.chatMessageInput);
    this.setState({chatMessageInput: ''})
    event.preventDefault();
  }

  // TODO: Fix not working
  scrollToBottom = () => {
    if(this.messagesEnd !== null){
      this.messagesEnd.scrollIntoView({ behavior: "smooth" });
    }
  }

  buildHelp = () => {
    let s = '';
    let s2 = 'Hotkeys:\n';
    s2 += 'Q: Place Unit\n';
    s2 += 'W: Withdraw Unit\n';
    s2 += 'E: Sell Unit\n';
    s2 += 'F: Buy Exp\n';
    s2 += 'D: Refresh Shop\n';
    let chat = false;
    let messageCollection = [];
    switch(this.props.chatHelpMode){
      case 'types':
        if(this.props.typeStatsString){
          s += this.props.typeStatsString;
        } else {
          s += s2;
        }
        break;
      case 'typeBonuses':
        if(this.props.typeBonusString){
          s += this.props.typeBonusString;
        } else {
          s += s2;
        }
        break;
      case 'hotkeys':
        s += s2;
        break;
      case 'chat':
      default:
          //s += this.props.chatMessage;
          for(let i = 0; i < this.props.chatMessages.length; i++){
            messageCollection.push(<div key={i}><span className='text_shadow bold'>{this.props.senderMessages[i]}</span><span>{this.props.chatMessages[i]}</span></div>);
          }
          chat = true;
        break;
    }
    return (chat ? <div>{<div className='helpText text_shadow'><span className='bold'>Chat:</span><div>{messageCollection}</div>
    <div style={{ float:"left", clear: "both" }}
      ref={(el) => { this.messagesEnd = el;}}>
    </div></div>}
    <div className='chatTypingDiv'>
      <form onSubmit={this.handleChatSubmit}>
        <label>
          <input placeholder='Type a message ...' className='textInput' type="text" value={this.state.chatMessageInput} 
          onChange={(event) => this.setState({chatMessageInput: event.target.value})} />
        </label>
        <input className='text_shadow normalButton' style={{height: '25px'}} type="submit" value="Submit" />
      </form>
    </div>
    </div> : <div className='helpText text_shadow'><span className='bold'>{'Information:\n'}</span>{s}</div>);
  }

  render() {
    const mainMenu = <div>
      <div className='logos'>
        <img src={pokemonLogo} alt='pokemonLogo'/>
        <img src={autoChess} alt='autoChessLogo'/>
      </div>
      {/*<div className='titleCard text_shadow'>Pokemon Auto Chess</div>*/}
      <div className='startButtons'>
        <div className='flex'> 
          <button className={`normalButton ${(!this.props.ready ? 'growAnimation' : '')}`} 
          onClick={this.toggleReady} style={{width: '80px'}}>{(this.props.ready ? 'Unready' : 'Ready')}</button>
          <button style={{marginLeft: '5px'}} className={`normalButton ${(this.props.playersReady === this.props.connectedPlayers ? 'growAnimation' : '')}`} onClick={() => this.startGameEvent()}>
            StartGame{(this.props.connected ? ` (${this.props.playersReady}/${this.props.connectedPlayers})` : ' Connecting ...')}
          </button>
          <button style={{marginLeft: '5px'}} className={`normalButton ${(this.props.playersReady >= 2 && this.props.playersReady !== this.props.connectedPlayers ? '' : 'hidden')}`} onClick={() => this.startGameEvent(true)}>
            Force Start Game{(this.props.connected ? ` (${this.props.playersReady}/${this.props.connectedPlayers})` : ' Connecting ...')}
          </button>
        </div>
      </div>
      <div className='mainMenuSoundDiv marginTop5'>
        <div>
          <img className={(this.props.musicEnabled ? 'musicImg' : 'musicMutedImg')} src={(this.props.musicEnabled ? music : musicMuted)} 
          alt={(this.props.musicEnabled ? 'Mute Music': 'Turn on Music')} onClick={() => this.props.dispatch({type: 'TOGGLE_MUSIC'})}/>
        </div>
        <div>
          <img className={(this.props.soundEnabled ? 'soundImg' : 'soundMutedImg')} src={(this.props.soundEnabled ? sound : soundMuted)} 
          alt={(this.props.soundEnabled ? 'Mute Sound': 'Turn on Sound')}  onClick={() => this.props.dispatch({type: 'TOGGLE_SOUND'})}/>
        </div>
        {(this.props.musicEnabled ? this.playMusic() : '')} 
      </div>
    </div>
    const topBar = <div className='centerWith50 flex' style={{width: '80%'}}>
        <div className='marginTop5 biggerText text_shadow' style={{paddingLeft: '65px'}}>
          {'Round: ' + this.props.round}
        </div>
        {this.getAmountOfUnitsOnBoard()}
        <div className='flex' style={{paddingLeft: '65px'}}>
          <div className='marginTop5 biggerText'>
            <span className='text_shadow paddingLeft5'>{JSON.stringify(this.props.gold, null, 2)}</span>
          </div>
          <img className='goldImage' src={goldCoin} alt='goldCoin'/>
        </div>
        {( this.props.onGoingBattle ? <div className='marginTop5 biggerText text_shadow' style={{paddingLeft: '65px'}}>
          {(this.props.enemyIndex ? 'Enemy ' + this.props.enemyIndex : '')} 
        </div> : '')}
      </div>;
    const leftSideBar = <div style={{width: '165px'}}>
        <div className='flex'>
          <div className='marginTop5 biggerText text_shadow paddingLeft5' style={{marginTop: '15px'}}>
            {'Player ' + this.props.index}
          </div>
        </div>
        <div className={'text_shadow messageUpdate'} style={{padding: '5px'}} >
          <CSSTransitionGroup
            transitionName="messageUpdate"
            transitionEnterTimeout={500}
            transitionLeave={false}>
            <div className={`updateMessage ${(this.props.messageMode === 'big' ? 'goldFont' : (this.props.messageMode === 'error' ? 'redFont' : ''))}`}>
              {'Message: ' + this.props.message}
            </div>
          </CSSTransitionGroup>
        </div>
        {this.props.gameIsLive ? <Timer startTime={5} key={this.props.round} startTimer={this.props.startTimer} 
        storedState={this.props.storedState} dispatch={this.props.dispatch} gameEnded={this.props.gameEnded}></Timer> : ''}
        <div className = 'centerWith50'>
          <button className='normalButton marginTop5' onClick={this.buyExpEvent}>Buy Exp</button>
          <div className='flex marginTop5'>
            <div className={`text_shadow goldImageTextSmall ${(this.props.gold < 5 ? 'redFont' : '')}`} style={{marginLeft: '22px'}}>5</div>
            <img className='goldImageSmall' src={goldCoin} alt='goldCoin'/>
          </div>
        </div>
        <div>
          {this.selectedUnitInformation()}
          {this.unitSound()}
          {this.soundEffects()}
        </div>
        <div className='boardBuffs text_shadow'>
          {/*{(this.props.boardBuffs && this.props.boardBuffs.typeBuffMapSolo && Object.keys(this.props.boardBuffs.typeBuffMapSolo).length > 0 ?
            JSON.stringify(this.props.boardBuffs.typeBuffMapSolo, null, 2) : '')}
          {(this.props.boardBuffs && this.props.boardBuffs.typeBuffMapAll && Object.keys(this.props.boardBuffs.typeBuffMapAll).length > 0  ? 
            JSON.stringify(this.props.boardBuffs.typeBuffMapAll, null, 2) : '')}
          {(this.props.boardBuffs && this.props.boardBuffs.typeDebuffMapEnemy && Object.keys(this.props.boardBuffs.typeDebuffMapEnemy).length > 0 ? 
          JSON.stringify(this.props.boardBuffs.typeDebuffMapEnemy, null, 2) : '')}*/}
        </div>
        <div className='marginTop5 flex'>
          <div onClick={() => this.props.dispatch({type: 'TOGGLE_MUSIC'})}>
            <img className={(this.props.musicEnabled ? 'musicImg' : 'musicMutedImg')} src={(this.props.musicEnabled ? music : musicMuted)} alt={(this.props.musicEnabled ? 'Mute Music': 'Turn on Music')}/>
          </div>
          <div onClick={() => this.props.dispatch({type: 'TOGGLE_SOUND'})}>
            <img className={(this.props.soundEnabled ? 'soundImg' : 'soundMutedImg')} src={(this.props.soundEnabled ? sound : soundMuted)} alt={(this.props.soundEnabled ? 'Mute Sound': 'Turn on Sound')}/>
          </div>
          {(this.props.musicEnabled && this.props.gameIsLive ? this.playMusic() : '')} 
        </div>
        <div className='paddingLeft5 marginTop5 text_shadow'>
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
        <div className='text_shadow'>mouseOverId: {JSON.stringify(this.props.mouseOverId, null, 2)}</div>
        {/*<div>Selected Unit: {JSON.stringify(this.props.selectedUnit, null, 2)}</div>*/}
      </div>
    const boardDiv = <div className={(!this.props.onGoingBattle ? 'boardDiv' : 'boardDivBattle')}>
        <div>
          <Board height={8} width={8} map={this.props.myBoard} isBoard={true} newProps={this.props}/>
        </div>
        <div className='levelDiv'>
          <div className={`levelBar overlap ${(this.props.exp === 0 ? 'hidden' : '')}`} 
          style={{width: (this.props.expToReach !== 0 ? String(this.props.exp/this.props.expToReach * 100) : '100') + '%'}}/>
          <div className='biggerText centerWith50 overlap levelText'>
            <span className='text_shadow paddingLeft5 paddingRight5'>{'Level ' + JSON.stringify(this.props.level, null, 2)}</span>
            {/*<span className='text_shadow paddingLeft5 paddingRight5'>{'( ' + (this.props.expToReach === 'max' ? 'max' : this.props.exp + '/' + this.props.expToReach) + ' )'}</span>*/}
          </div>
          <div className='overlap text_shadow marginTop5 paddingLeft5 levelTextExp'>
            {'Exp: ' + this.props.exp + '/' + this.props.expToReach}
          </div>
        </div>
        <div className='flex center handDiv'>
          <Board height={1} width={8} map={this.props.myHand} isBoard={false} newProps={this.props}/>
        </div>
      </div>;
    const rightSide = <div>
        <div className='flex'>
          <div className='paddingLeft5'>
            <div>
              <div>
                <div className='flex'>
                  <Pokemon shopPokemon={this.props.myShop[this.pos(0)]} index={0} newProps={this.props}/>
                  <Pokemon shopPokemon={this.props.myShop[this.pos(1)]} index={1} newProps={this.props}/>
                  <Pokemon shopPokemon={this.props.myShop[this.pos(2)]} index={2} newProps={this.props}/>
                </div>
                <div className='flex'>
                  <div className='shopInteractDiv'>
                    <div>
                      <img className={`lockImage ${(this.props.lock ? 'shineLock' : '')}`} onClick={() => toggleLock(this.props.storedState)} src={this.props.lock ? lockedLock : openLock} alt='lock'/>   
                    </div>
                    <div style={{paddingTop: '10px'}}>
                      <img className='refreshShopImage' onClick={this.refreshShopEvent} src={refreshShopImage} alt='refreshShop'/>
                    </div>
                    <div className='flex'>
                      <div className={`text_shadow goldImageTextSmall ${(this.props.gold < 2 ? 'redFont' : '')}`}>2</div>
                      <img className='goldImageSmall' src={goldCoin} alt='goldCoin'/>
                    </div>
                  </div>
                  <Pokemon shopPokemon={this.props.myShop[this.pos(3)]} index={3} newProps={this.props} className='pokemonShopHalf'/>
                  <Pokemon shopPokemon={this.props.myShop[this.pos(4)]} index={4} newProps={this.props} className='paddingLeft30'/>                
                </div>
              </div>
            </div>
          </div>
          {this.playerStatsDiv()}
        </div>
        <div className='marginTop5 paddingLeft5' style={{paddingTop: '5px', paddingLeft: '10px'}}>
          <div className='flex'>
            <button className={`normalButton ${(this.props.help ? '' : 'growAnimation')}`} onClick={() => this.props.dispatch({type: 'TOGGLE_HELP'})}>
              {(this.props.chatHelpMode === 'chat' ? (this.props.help ? 'Hide Chat' : 'Show Chat') : (this.props.help ? 'Hide Help' : 'Show Help'))}
            </button>
            <button style={{marginLeft: '5px'}} className={`normalButton`} onClick={() => this.props.dispatch({type: 'TOGGLE_CHAT_SOUND'})}>
              {(this.props.chatSoundEnabled ? 'Mute Chat': 'Unmute Chat')}
            </button>
            {/*<div style={{marginLeft: '5px'}}>
              <button className='normalButton test_animation' onClick={() => battleReady(this.props.storedState)}>Battle ready</button>
            </div>*/}
          </div>
          {(this.props.help ? <div className='text_shadow marginTop15'>
          <input type='radio' name='helpRadio' onChange={() => this.props.dispatch({type: 'SET_HELP_MODE', chatHelpMode: 'chat'})}/>Chat 
          <input type='radio' name='helpRadio' onChange={() => this.props.dispatch({type: 'SET_HELP_MODE', chatHelpMode: 'hotkeys'})}/>Hotkeys 
          <input type='radio' name='helpRadio' onChange={() => this.props.dispatch({type: 'SET_HELP_MODE', chatHelpMode: 'types'})}/>Types
          <input type='radio' name='helpRadio' onChange={() => this.props.dispatch({type: 'SET_HELP_MODE', chatHelpMode: 'typeBonuses'})}/>TypeBonuses</div>: '')}
        </div>
        {(this.props.help ? this.buildHelp() : '')}
      </div>;
    return (this.props.gameIsLive ? <div className='gameDiv'>
      {topBar}
      <div className='flex' style={{paddingTop: '10px'}} onKeyDown={(event) => this.handleKeyPress(event)} tabIndex='0'>
        {leftSideBar}
        {boardDiv}
        {rightSide}
      </div>
      <input className='hidden' type='checkbox' checked={this.props.startBattle} onChange={(this.props.startBattle ? this.startBattleEvent.bind(this)() : () => '')}/>
    </div> : <div className='mainMenu'>{mainMenu}</div>);
  }
}

const mapStateToProps = state => ({
  gameIsLive: state.gameIsLive, 
  connected: state.connected,
  index: state.index,
  ready: state.ready,
  playersReady: state.playersReady,
  connectedPlayers: state.connectedPlayers,
  allReady: state.allReady,
  message: state.message,
  messageMode: state.messageMode,
  help: state.help,
  chatHelpMode: state.chatHelpMode,
  senderMessages: state.senderMessages,
  chatMessages: state.chatMessages,
  storedState: state.storedState,
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
  streak: state.streak,
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
  typeBonusString: state.typeBonusString,
  round: state.round,
  musicEnabled: state.musicEnabled,
  soundEnabled: state.soundEnabled,
  chatSoundEnabled: state.chatSoundEnabled,
  selectedSound: state.selectedSound,
  soundEffect: state.soundEffect,
  soundEffects: state.soundEffects,
  music: state.music,
  volume: state.volume,
  startTimer: state.startTimer,
  isDead: state.isDead,
  selectedShopUnit: state.selectedShopUnit,
  isSelectModeShop: state.isSelectModeShop,
  boardBuffs: state.boardBuffs,
  deadPlayers: state.deadPlayers,
  gameEnded: state.gameEnded,
});

export default connect(mapStateToProps)(App);
// TODO: Add react code here to connect to the reducer (state)

//export default App;
