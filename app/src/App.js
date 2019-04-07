// Author: Petter Andersson

import React, { Component } from 'react';
import { ready, unready, startGame, battleReady, sendMessage } from './socket';
import { toggleLockEvent, buyUnitEvent, refreshShopEvent, buyExpEvent, placePieceEvent, withdrawPieceEvent, sellPieceEvent, getStatsEvent } from './events';
import { connect } from 'react-redux';
import { isUndefined, updateMessage } from './f';
import './App.css';
import './animations.css';

import { getUnitAudio, getSoundEffect } from './audio.js';
import { getImage, getTypeImg, getGymImage } from './images.js';

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
    let src;
    if(this.props.newProps.pokemonSprites){
      if(!this.props.newProps.pokemonSprites.pokemon[this.props.name]) console.log('Undefined image', this.props.name, this.props.newProps.pokemonSprites.pokemon[this.props.name]);
      src = 'data:image/gif;base64,' + this.props.newProps.pokemonSprites.pokemon[this.props.name].front;
      if(this.props.back){
        src = 'data:image/gif;base64,' + this.props.newProps.pokemonSprites.pokemon[this.props.name].back;
      }
    }
    const baseMarginTop = paddingTop + height - 15;
    const baseMarginLeft = 85 - width - 7;
    const imgEl = <img
      className={`pokemonImg ${(this.props.newProps.onGoingBattle ? '' : this.props.renderBase ? 'pokemonSpawn' : 'pokemonEnter')} ` +
        `${this.props.name} ${(this.props.classList ? this.props.classList : '')}`}
      key={src}
      style={{paddingTop: paddingTop, width: width, height: height}}
      src={src}
      alt='Pokemon'
      onLoad={this.onImgLoad}
    />
    return (
      <div>
        {(this.props.renderBase ? <div key={this.props.renderBase} className={`pokemonImageBase ${this.props.renderBase}`} 
        style={{
          marginTop: (isNaN(baseMarginTop) ? '' : baseMarginTop), 
          marginLeft: (isNaN(baseMarginLeft) ? '' : baseMarginLeft), 
          width: (!isNaN(width) ? width * 1.5 : '')
        }}></div> : '')}
        {imgEl}
      </div>
    );
  }
}

class ShopPokemon extends Component{

  handleInfoPress = (event) => {
    event.stopPropagation();
    const prop = this.props.newProps;
    console.log('Pressed info shop', this.props.shopPokemon.name)
    prop.dispatch({ type: 'SELECT_SHOP_INFO', name: this.props.shopPokemon.name});
    getStatsEvent(prop, this.props.shopPokemon.name);
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
            <img className='infoImg' src={getImage('info')} onClick={this.handleInfoPress} alt={'info' + this.props.shopPokemon.name}/>
            <div className='infoImgBg'/>
          </div>
          {(this.props.shopPokemon.reqEvolve ? <div className='pokemonBaby'>
            <img className='babyImg' src={getImage('baby')} alt={'baby' + this.props.shopPokemon.name}/>
          </div> : '')}
          <PokemonImage name={this.props.shopPokemon.name} sideLength={85} renderBase={costColorClass} newProps={this.props.newProps}/>
        </div>
        <div className='pokemonShopText'>
          <span className={costColorTextClass}>{this.props.shopPokemon.displayName + '\n'}</span>
          {(Array.isArray(this.props.shopPokemon.type) ?
            <div>
              <span className={`type typeLeft ${this.props.shopPokemon.type[0]}`}>{this.props.shopPokemon.type[0]}</span>
              <span className={`type ${this.props.shopPokemon.type[1]}`}>{this.props.shopPokemon.type[1] + '\n'}</span>
            </div>
            : <span className={`type ${this.props.shopPokemon.type}`}>{this.props.shopPokemon.type + '\n'}</span>)}
          {<span className={(this.props.newProps.gold < this.props.shopPokemon.cost ? 'redFont' : '')}>
            {<span>
              <img className='goldImageShop' style={{paddingLeft: '0px', marginLeft: '0px'}} src={getImage('goldCoin')} alt='goldCoin'/>
            </span>}
            <span className='shopCostText'>{/*'$' + */this.props.shopPokemon.cost}</span>
          </span>}
        </div>
      </div>
    } else {
      content = <div className={`pokemonShopEmpty text_shadow`}>Empty</div>;
    }
    return (
      <div className={`pokemonShopEntity ${(this.props.className ? this.props.className : '')}`} onClick={() => buyUnitEvent(this.props, this.props.index)}>
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

  handleCellClick(el){
    const unit = (el.props.isBoard ? (el.props.newProps.onGoingBattle ? el.props.newProps.battleStartBoard[this.state.pos] : el.props.newProps.myBoard[this.state.pos]) : el.props.newProps.myHand[this.state.pos]);
    const prevSelectedUnit = el.props.newProps.selectedUnit;
    console.log('@handleCellClick pressed', el.props.value.x, ',', el.props.value.y)
    // console.log(' -', el.props.isBoard, el.props.newProps.onGoingBattle, this.state.pos, unit, prevSelectedUnit)
    // If unit selected -> presses empty -> place piece 
    if(this.state.pos !== prevSelectedUnit.pos){ // Shouldn't do anything if same tile as SELECT_UNIT Tile
      el.props.newProps.dispatch({ type: 'SELECT_UNIT', selectedUnit: {...el.props.value, isBoard: el.props.isBoard, pos: this.state.pos, unit: unit, displaySell: true}});
    } else if (!prevSelectedUnit.displaySell) { 
      el.props.newProps.dispatch({ type: 'SELECT_UNIT', selectedUnit: {...el.props.value, isBoard: el.props.isBoard, pos: this.state.pos, unit: unit, displaySell: true}});
    } else { // Deselect by doubleclick same unit
      el.props.newProps.dispatch({ type: 'SELECT_UNIT', selectedUnit: ''}); // {isBoard: el.props.isBoard, pos: ''}
    }
    if(unit){ // Pressed unit
      console.log('Get Stats for', unit.name)
      el.props.newProps.dispatch({ type: 'NEW_UNIT_SOUND', newAudio: ''});
      getStatsEvent(el.props.newProps, unit.name);
    } else if(prevSelectedUnit.pos && this.state.pos !== prevSelectedUnit.pos && 
              prevSelectedUnit.unit && prevSelectedUnit.displaySell){ // Pressed empty cell
      placePieceEvent(this.props.newProps, prevSelectedUnit.pos, this.state.pos);
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
        // (Math.min(pokemon.hp, pokemon.maxHp) / Math.max(pokemon.hp, pokemon.maxHp) * 100)
        const hpBar = (pokemon ? <div className='barDiv' style={{width: sideLength}}>
          <div className={`hpBar text_shadow ${(this.props.isBoard ? (pokemon.team === 0 ? 'friendlyBar' : 'enemyBar') : '')}`} 
            style={{width: (pokemon.hp / Math.max(pokemon.hp, pokemon.maxHp) * 100)+'%'}}>
            {`${pokemon.hp}/${pokemon.maxHp}`}
          </div>
          {(pokemon.hp > pokemon.maxHp ? <div className={`boostBar text_shadow ${(this.props.isBoard ? 'boostBar' : '')}`} 
            style={{width: (/*pokemon.hp-pokemon.maxHp / pokemon.hp*/1 * 100)+'%'}}/> : '')} 
          </div> : '');
        const manaBar = (pokemon ? <div className='barDiv' style={{width: sideLength}}>
          <div className={`manaBar text_shadow ${(pokemon.mana === 0 ? 'hidden' : '')}
          ${(pokemon.mana >= pokemon.manaCost ? 'colorPurple' : '')}`} style={{width: (pokemon.mana / pokemon.manaCost * 100)+'%'}}>{`${pokemon.mana}/${pokemon.manaCost}`}</div>
          </div> : '');
        const actionMessage = (pokemon && pokemon.actionMessage && pokemon.actionMessage !== '' ? 
          <div className={`text_shadow actionMessage ${(pokemon.actionMessage.split(' ').length > 2 ? 'actionMessagePadding' : '')}`} style={{position: 'absolute'}}>
            {pokemon.actionMessage}
          </div>
          : '');
        let styleVar = {position: 'relative'};
        if(pokemon && pokemon.animateMove){
          styleVar = pokemon.animateMove;
          // console.log('StyleVar', pokemon.name, styleVar)
        }
        if(!isUndefined(pokemon)){
          const back = (this.props.isBoard ? (!isUndefined(pokemon.team) ? pokemon.team === 0 : true) : false);
          const classList = `absolute ${(pokemon.winningAnimation ? ' winningAnimation' : (pokemon.attackAnimation ? ' ' + pokemon.attackAnimation : ''))} ` +
              `${(this.props.newProps.onGoingBattle && !this.props.isBoard ? 'pokemonEnter' : '')}`;
          // console.log('@rendereding pokemonImage classList', classList)
          return <div className={`relative`} style={styleVar}>
            <PokemonImage name={pokemon.name} back={back} sideLength={sideLength} classList={classList} newProps={this.props.newProps}/>
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
              pokemonBuffList.push(<span key={'buff' + pokemon.buff[i]}>{pokemon.buff[i] + '\n'}</span>);
            }
          }
          buffs = (pokemon && pokemon.buff && pokemon.buff.length > 0 ? <div className='text_shadow textList buffText'>Buffed: {pokemonBuffList}</div> : '');
        }
        if(!isUndefined(pokemon)){
          const back = (this.props.isBoard ? (!isUndefined(pokemon.team) ? pokemon.team === 0 : true) : false);
          return <div>
            <PokemonImage name={pokemon.name} back={back} sideLength={sideLength} newProps={this.props.newProps}/>
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
    (!isUndefined(selPos) && this.props.isBoard === selPos.isBoard && selPos.displaySell &&
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
      this.props.dispatch({ type: 'DISABLE_START_TIMER' });
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
    if(sec <= 5) {
      // console.log('@Tick')
      this.props.dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('Tick')});
    }
    if (sec === 0) {
      console.log('@Timer.tick Stopping timer since sec === 0', sec, this.secondsRemaining)
      clearInterval(this.intervalHandle);
      if(Object.keys(this.props.storedState).length > 0){
        console.log('BattleReady!')
        this.props.dispatch({ type: 'DEACTIVATE_INTERACTIONS' });
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

  pos = (x,y) => {
    if(isUndefined(y)){
      return String(x);
    }
    return String(x) + ',' + String(y);
  }

  getPosCoords = (pos) => {
    return pos.split(',');
  }

  setBuffsFromSolo = (buffs, solo, type) => {
    const buff = solo[type];
    if(buff) {
      buffs[buff['typeBuff']] = (buffs[buff['typeBuff']] || 0) + buff['value'];
    }
  }

  buildStats = () => {
    if(this.props.stats){
      const s = this.props.stats;
      let evolves_from = '';
      let evolves_to = '';
      let snd_evolves_to = '';
      if(s.evolves_from) {
        evolves_from = <span className='flex'>
          <span className='paddingRight5 marginTop15'>Evolves from: </span>
          <PokemonImage name={s.evolves_from} sideLength={40} newProps={this.props}/>
        </span>;
      }
      if(s.evolves_to) {
        if(Array.isArray(s.evolves_to)){
          const evoList = [];
          for(let i = 0; i < s.evolves_to.length; i++){
            evoList.push(<span key={'evo'+s.evolves_to[i]}><PokemonImage name={s.evolves_to[i]} sideLength={40} newProps={this.props}/></span>)
          }
          evolves_to = <span className='flex'>
            <span className='paddingRight5 marginTop15'>Evols: </span>
            {evoList}
          </span>
        } else {
          evolves_to = <span className='flex'>
            <span className='paddingRight5 marginTop15'>Evolves to: </span>
            <PokemonImage name={s.evolves_to} sideLength={40} newProps={this.props}/>
          </span>
        }
      }
      if(s.snd_evolves_to) {
        snd_evolves_to = <span className='flex'>
          <span className='paddingRight5 marginTop15'>Last Evolve: </span>
          <PokemonImage name={s.snd_evolves_to} sideLength={40} newProps={this.props}/>
        </span>
      }
      const boardBuffs = this.props.boardBuffs;
      const buffs = {};
      if(boardBuffs){
        const solo = boardBuffs.typeBuffMapSolo
        if(Array.isArray(s.type)){
          this.setBuffsFromSolo(buffs, solo, s.type[0]);
          this.setBuffsFromSolo(buffs, solo, s.type[1]);
        } else {
          this.setBuffsFromSolo(buffs, solo, s.type);
        }
        Object.keys(boardBuffs.typeBuffMapAll).forEach(type => {
          const value = boardBuffs.typeBuffMapAll[type];
          buffs[value['typeBuff']] = (buffs[value['typeBuff']] || 0) + value['value'];
        });
        // Object.keys(boardBuffs.typeDebuffMapEnemy).forEach(e => {
        // });
      }
      // console.log('@buffs', buffs);
      const content = <div className='center'>
        <div className='textAlignCenter marginTop5'>
        {(Array.isArray(s.type) ? 
            <div>
              <span className={`type typeLeft ${s.type[0]}`}>{s.type[0]}</span>
              <span className={`type ${s.type[1]}`}>{s.type[1] + '\n'}</span>
            </div>
          : <span className={`type ${s.type}`}>{s.type + '\n'}</span>)}
        </div>
        <div className='infoPanelStats'>
          {/*<div>
            <span>Hp: </span>
            <span style={{position: 'relative'}}>
              <div className='levelBar overlap' style={{width: String(s.hp/150 * 100) + '%'}}></div>
              <div className='overlap'>
                {` ${s.hp}`}
              </div>
            </span>
          </div>*/}
          <span className='center'><span>{`Hp: ${s.hp}`}</span>{(buffs['hp'] ? <span className='infoPanelBuff'>{` + ${buffs['hp']}\n`}</span> : '\n')}</span>
          <span><span>{`Attack: ${s.attack}`}</span>{(buffs['attack'] ? <span className='infoPanelBuff'>{` + ${buffs['attack']}\n`}</span> : '\n')}</span>
          <span><span>{`Defense: ${s.defense}`}</span>{(buffs['defense'] ? <span className='infoPanelBuff'>{` + ${buffs['defense']}\n`}</span> : '\n')}</span>
          <span><span>{`Speed: ${s.speed}`}</span>{(buffs['speed'] ? <span className='infoPanelBuff'>{` + ${buffs['speed']}\n`}</span> : '\n')}</span>
          <span><span>{`Sp.Attack: ${s.specialAttack}`}</span>{(buffs['specialAttack'] ? <span className='infoPanelBuff'>{` + ${buffs['specialAttack']}\n`}</span> : '\n')}</span>
          <span><span>{`Sp.Defense: ${s.specialDefense}`}</span>{(buffs['specialDefense'] ? <span className='infoPanelBuff'>{` + ${buffs['specialDefense']}\n`}</span> : '\n')}</span>
          <span>{`Level: ${s.cost}\n`}</span>
          <span>{`Range: ${s.range || 1}\n`}</span>
          <span className={`type ${s.abilityType}`}>{`Ability: ${s.abilityDisplayName}\n`}</span>
        </div>
        <div>
          {evolves_from}
          {evolves_to}
          {snd_evolves_to}
        </div>
      </div>
      return content;
    }
  }

  statsRender = (className, name, allowSell=false) => {
    const pokeEl= <PokemonImage name={name} sideLength={50} newProps={this.props}/>;
    return <div className={className}>
      <div className='textAlignCenter'>
        <div>{this.props.stats.displayName}</div>
        <div className='infoPanelPokemonLogo'>{pokeEl}</div>
      </div>
      {this.buildStats()}
      {(allowSell ? <div className='marginTop5'>
        <button className='normalButton textList marginLeft5' onClick={() => {
          const from = this.props.selectedUnit.pos;
          sellPieceEvent(this.props, from);
        }}>
          <span>
            {'Sell ' + this.props.stats.displayName + '\n'}
          </span>
          <span className='flex centerWith50'>
            <img className='goldImageSmallest' src={getImage('pokedollar')} alt='pokedollar'/>
            <span className='goldImageTextSmall'>{this.props.stats.cost}</span>
          </span>
        </button>
      </div> : '')}
    </div>;
  }

  selectedUnitInformation = () => {
    const className = 'center text_shadow infoPanel';
    const noSelected = <div className={className}><div className={`noSelected`}>No unit selected</div></div>
    if(this.props.stats && !this.props.isSelectModeShop && !isUndefined(this.props.selectedUnit)){
      let pokemon = (this.props.selectedUnit.isBoard ? (this.props.onGoingBattle && this.props.battleStartBoard ? this.props.battleStartBoard[this.props.selectedUnit.pos] 
        : this.props.myBoard[this.props.selectedUnit.pos]) : this.props.myHand[this.props.selectedUnit.pos]);
      if(pokemon){
        this.props.dispatch({type: 'NEW_UNIT_SOUND', newAudio: getUnitAudio(pokemon.name)});
        // console.log('@selectedUnitInformation', pokemon.displayName, pokemon)
        const displaySell = this.props.selectedUnit.isBoard && this.props.onGoingBattle && this.props.battleStartBoard ? false : this.props.selectedUnit.displaySell;
        return this.statsRender(className, pokemon.name, displaySell);
      }
    } else if(this.props.stats && this.props.isSelectModeShop && this.props.selectedShopUnit !== ''){
      const name = this.props.selectedShopUnit;
      this.props.dispatch({type: 'NEW_UNIT_SOUND', newAudio: getUnitAudio(name)});
      return this.statsRender(className, name)
    }
    return noSelected;
  }
  
  capitalize = string => string.charAt(0).toUpperCase() + string.slice(1);

  displayBuffsRender = (boardBuffs, isEnemy = false) => {
    const list = [];
    let counter = 0;
    // if(isEnemy) console.log('DisplayBuffsRender', boardBuffs);
    const buffKeys = Object.keys(boardBuffs.buffMap);
    const sortedBuffKeys = buffKeys.sort((a,b) => {
      const markedA = boardBuffs.typeBuffMapSolo[a] || boardBuffs.typeBuffMapAll[a] || boardBuffs.typeDebuffMapEnemy[a];
      const markedB = boardBuffs.typeBuffMapSolo[b] || boardBuffs.typeBuffMapAll[b] || boardBuffs.typeDebuffMapEnemy[b];
      const ma = (markedA ? markedA['tier'] : 0);
      const mb = (markedB ? markedB['tier'] : 0);
      return mb - ma;
    });
    // Object.keys(boardBuffs.buffMap).forEach(type => {
    for(let i = 0; i < sortedBuffKeys.length; i++){
      const type = sortedBuffKeys[i];
      const amount = boardBuffs.buffMap[type];
      const marked = boardBuffs.typeBuffMapSolo[type] || boardBuffs.typeBuffMapAll[type] || boardBuffs.typeDebuffMapEnemy[type];
      let bonus;
      const reqs = this.props.typeMap[type]['req'];
      let reqVar = reqs[0];
      if(!isUndefined(marked)){
        reqVar = reqs[marked['tier']];
        bonus = <div>
          <span className={`${(!isEnemy ? 'typeTier' : 'typeTierSmaller')}`}>{marked['tier']}</span>
          {/*<span>{' Bonus: ' + marked['typeBuff'] + ': ' + marked['value']}</span>*/}
        </div>
      }
      const left = (!isEnemy ? counter * 40 % 160 : counter * 30 % 180);
      const top = (!isEnemy ? Math.floor(counter / 4) * 60 : Math.floor(counter / 6) * 30);;
      list.push(<span key={type} className='typeElement' style={{marginLeft: left, marginTop: top}} onClick={() => this.props.dispatch({type: 'SET_MARKED_BUFF', buff: type})}>
        <img className={`${(isEnemy ? 'typeImgSmaller' : 'typeImg')}`} src={getTypeImg(type)} alt={type}/>
        {(!isEnemy ? <span>
          <span className='typeBonusText'>{amount}</span>
          <span className='typeBonusTextBelow'>{type}</span>
          <span className='typeBonusTextReq'>{reqVar}</span>
        </span> : <span>
          <span className='typeBonusTextSmaller'>{amount}</span>
        </span>)}
        {bonus}
      </span>
      );
      counter += 1;
    };
    let buffInfoDiv;
    if(this.props.markedBuff && this.props.displayMarkedBuff && !isEnemy) {
      const buffedType = this.props.markedBuff;
      const marked = boardBuffs.typeBuffMapSolo[buffedType] || boardBuffs.typeBuffMapAll[buffedType] || boardBuffs.typeDebuffMapEnemy[buffedType];
      let tier = 0;
      if(!isUndefined(marked)){
        tier = marked['tier'];
        //bonus = marked['typeBuff'] + ': ' + marked['value'];
      }
      const type = this.props.typeMap[buffedType];
      // console.log('@Type', type, type['req'], type['req'][0]);
      const typeName = type['name'];
      const capitalTypeName = this.capitalize(typeName);
      const req = type['req'];
      const bonusType = type['bonusType'];
      const inc = (bonusType !== 'enemyDebuff' ? 'Increases' : 'Decreases');
      const units = (bonusType === 'bonus' ? `all ${typeName} typed units` : (bonusType === 'allBonus' ? 'all units' : 'all enemy units'));
      const bonusAmount = type['bonusAmount'];
      const bonusStatType = type['bonusStatType'];
      if(!isUndefined(req)) {
        let classList = (0 < tier ? 'goldFont' : '');
        let reqList = [<span key={'disp_0' + typeName} className={`${classList}`}>{req[0]}</span>];
        let bonusAmountList = [<span key={'dispValue_0'} className={`${classList}`}>{bonusAmount[0]}</span>];
        for(let i = 1; i < req.length; i++){
          classList = (0 < tier ? 'goldFont' : '');
          // console.log('i: ', i, req[i], bonusAmount[i]);
          reqList.push(<span key={'disp_' + i + '_' + typeName} className={`${classList}`}>{', ' + req[i]}</span>);
          bonusAmountList.push(<span key={'dispValue_' + i} className={`${classList}`}>{', ' + bonusAmount[i]}</span>);
        }
       buffInfoDiv = <div className='buffInfoDiv' style={{marginTop: Math.floor((counter - 1) / 4) * 60 + 60}}>
          <span>{capitalTypeName + ': '}</span>
          <span>{'['}</span>{reqList}<span>{']'}</span>
          <span>{` ${inc} ${bonusStatType} for ${units} `}</span>
          <span>{'['}</span>{bonusAmountList}<span>{']'}</span>
        </div>;
      }
      // return `${this.capitalize(typeName)}: [${req}] ${inc} ${bonusStatType} for ${units} [${bonusAmount}]`;
    }
    return <div className='typeDiv'>
      <div>
        {list}
      </div>
      <div>
        {buffInfoDiv}
      </div>
    </div>;
  }

  displayBuffs = () => this.displayBuffsRender(this.props.boardBuffs);

  displayEnemyBuffs = () => {
    const boardBuffsVar = this.props.players[this.props.enemyIndex.split(' ')[1]];
    // console.log('displayEnemyBuffs', (boardBuffsVar.boardBuffs ? boardBuffsVar.boardBuffs.buffMap : '')); // boardBuffsVar, (boardBuffsVar ? boardBuffsVar.boardBuffs : '')
    if(boardBuffsVar && boardBuffsVar.boardBuffs) { //
      return this.displayBuffsRender(boardBuffsVar.boardBuffs, true);
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
        from = (isUndefined(from) ? (prop.selectedUnit.displaySell ? prop.selectedUnit.pos : '') : from);
        const to = prop.mouseOverId;
        console.log('@placePiece q pressed', from, to)
        placePieceEvent(this.props, from, to);
        prop.dispatch({ type: 'SELECT_UNIT', selectedUnit: {}})
        break;
      case 'w':
        from = prop.mouseOverId;
        console.log(prop.myBoard, from, prop.mouseOverId)
        if(!isUndefined(from) && prop.myBoard[from]){
          withdrawPieceEvent(this.props, from);
        } else {
          from = (prop.selectedUnit.displaySell ? prop.selectedUnit.pos : '');
          withdrawPieceEvent(this.props, from);
        }
        prop.dispatch({ type: 'SELECT_UNIT', selectedUnit: {}})
        break;
      case 'e':
        from = (prop.selectedUnit.displaySell ? prop.selectedUnit.pos : '');
        if(!isUndefined(from)){
          sellPieceEvent(this.props, from);
        } else {
          console.log('Use Select to sell units!')
        }
        prop.dispatch({ type: 'SELECT_UNIT', selectedUnit: {}})
        break;
      case 'd':
        refreshShopEvent(this.props);
        break;
      case 'f':
        buyExpEvent(this.props);
        break;
      case 'k':
        this.props.dispatch({type: 'TOGGLE_DEBUG_MODE'});
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
      console.log('animate: ', direction, 'attack' + direction + ' 0.3s ease-in 0s normal 1 both running');
      /*newBoard[unitPos].animateMove = { // attackAnimation = {
        animation: 'attack' + direction + ' 0.3s', // ease-in 0s normal 1 both running',
      } */
      newBoard[unitPos].attackAnimation = 'animate' + direction;
    }
    if(newBoard[unitPos].animateMove !== ''){
      newBoard[unitPos].animateMove = '';
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
      // TODO: Death Animation then remove
      // console.log('Attack / Dot DA');
      newBoard[target].hp = newHp;
      newBoard[target].animateMove = {
        animation: 'deathAnimation 1.0s', // TODO: Test on normal div if animation work
        animationFillMode: 'forwards', 
      }; 
      //delete newBoard[target]; 
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
        newBoard[target].animateMove = {
          animation: 'move' + direction + ' 0.5s',
        };
        return newBoard;
      case 'attack':
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
        if(newBoard[unitPos].animateMove !== ''){
          newBoard[unitPos].animateMove = '';
        }
        let newHpSpell = newBoard[target].hp;
        let damage = value;
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
                case 'multistrike': {
                  // TODO Visualize multistrike ability
                  damage *= valueEffect;
                  actionMessageTarget = actionMessageTarget + '! Hit ' + valueEffect + ' times!';
                  break;
                }
                case 'teleport':
                case 'noTarget':
                  damage = 0;
                  break;
                case 'dot': {
                  // TODO Visualize 'dot' is applied to unit

                  actionMessageTarget = actionMessageTarget + '! Dot applied'
                  break;
                }
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
        newHpSpell -= damage;
        console.log('Spell (' + abilityName + ') from', unitPos, 'to', target, 'with', value, 'damage, newHp', newHpSpell, (effect ? effect : ''));
        if(newHpSpell <= 0){
          // console.log('Spell DA');
          newBoard[target].hp = newHpSpell;
          newBoard[target].animateMove = {
            animation: 'deathAnimation 1.0s', // TODO: Test on normal div if animation work
            animationFillMode: 'forwards', 
          }; 
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

  endOfBattleClean = (battleBoard, winner) => {
    const unitsAlive = Object.keys(battleBoard);
    for(let i = 0; i < unitsAlive.length; i++){
      // Jumping animation
      if(battleBoard[unitsAlive[i]].hp > 0 && battleBoard[unitsAlive[i]].team === (winner ? 0 : 1)){
        battleBoard[unitsAlive[i]].winningAnimation = true;
        // console.log('Setting winningAnimation', unitsAlive[i], battleBoard[unitsAlive[i]]);
        battleBoard[unitsAlive[i]].actionMessage = '';
      } else {
        // console.log('HEY', battleBoard[unitsAlive[i]].hp > 0, battleBoard[unitsAlive[i]].team === (winner ? 0 : 1), battleBoard[unitsAlive[i]].hp > 0 && battleBoard[unitsAlive[i]].team === (winner ? 0 : 1));
        // delete battleBoard[unitsAlive[i]]; 
      }
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

  removeActionMessage = (nextMove, board) => {
    const target = nextMove.target;
    if(board && board[target]){
      board[target].actionMessage = '';
      /*
      const obj = {...board[target], actionMessage: ''}
      const keys = Object.keys(board);
      return keys.map((key, index) => {
        if (index !== target) {
          // This isn't the item we care about - keep it as-is
          return board[key]
        }
        // Otherwise, this is the one we want - return an updated value
        return {
          ...obj,
        }
      })*/
    }
    return board;
  }

  startBattleEvent = async () => {
    const { dispatch, actionStack, battleStartBoard, winner } = this.props;
    if(this.props.isDead && this.props.visiting === this.props.index){
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
      board = await this.removeActionMessage(nextMove, board);
      dispatch({type: 'UPDATE_BATTLEBOARD', board, moveNumber: counter});
      board = await this.renderMove(nextMove, board);
      /*
      setTimeout(() => {
        dispatch({type: 'RESET_BATTLEBOARD_ACTIONMESSAGE', pos: nextMove.target});
      }, 1500)
      */
      // console.log('Next action in', nextRenderTime, '(', currentTime, time, ')')
      currentTime = time;
      dispatch({type: 'UPDATE_BATTLEBOARD', board, moveNumber: counter});
      counter += 1;
    }
    if(actionStack.length === 0){
      await this.wait(1000);
      board = await this.endOfBattleClean(battleStartBoard, winner);
      dispatch({type: 'UPDATE_BATTLEBOARD', board, moveNumber: 'Ended'});
      // console.log('END OF BATTLE: winningTeam', winningTeam, 'x', Object.values(battleStartBoard));
      if(winner) {
        updateMessage(this.props, 'Battle won!', 'big');
        dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('cheer')});
      } else {
        updateMessage(this.props, 'Battle lost!', 'big');
        dispatch({type: 'NEW_SOUND_EFFECT', newSoundEffect: getSoundEffect('battleLose')});
      }
    }
  }

  visitPlayer = (playerIndex) => {
    console.log('Visiting Player', playerIndex, '...')
    this.props.dispatch({type: 'SPEC_PLAYER', playerIndex})
  }

  createScoreboardPlayerEntry = (player, isDead) => {
    const hp = player.hp;
    return <div className='playerScoreboardContainer' key={player.index}>
      <div className='playerScoreboardInner'>
        <span className='flex'>
          <span className='biggerText'><span className={`playerScoreboardName ${(player.index === this.props.index ? 'bold' : '')}`}>
              {'Player ' + player.index}
            </span>
            {(isDead ? <span className='redFont playerScoreboardDead'>
              {' Dead' + '\n'}
            </span> : 
            <span className='playerScoreBoardVisitButtonDiv'>
              {(this.props.visiting !== player.index ? <button className='normalButton visitButton' onClick={() => this.visitPlayer(player.index)}>
                  {(player.index === this.props.index ? 'Home' : 'Visit')}
                </button> : '')}
              <span>{'\n'}</span>
            </span>)}
          </span>
        </span>
        {(this.props.players[player.index] ? <span className='flex'>
          <span className='playerScoreboardLevel'>
            <span>{'Lvl: ' + this.props.players[player.index].level}</span>
          </span>
          <span className='flex'>
            <img className='goldImageScoreboard' src={getImage('pokedollar')} alt='pokedollar'/>
            <span className='goldImageTextSmall'>{this.props.players[player.index].gold}</span>
          </span>
          {(this.props.players[player.index].streak ? <span className='flex'>
            <img className={`streakImage ${(this.props.players[player.index].streak > 0 ? 'flameImage' : 'icecubeImage')}`} 
            src={(this.props.players[player.index].streak > 0 ? getImage('flame') : getImage('icecube'))} alt='trophy'/>
            <span className='streak'>{Math.abs(this.props.players[player.index].streak)}</span>
          </span> : '')}
        </span> : '')}
        <div className='playerHpBarDiv'>
          <div className={`playerHpBar overlap ${(hp === 0 ? 'hidden' : '')}`} 
          style={{width: (hp) + '%'}}/>
          <div className={`playerHpBarText biggerText centerWith50 overlap ${(hp === 100 ? 'playerHpBarTextFull' : '')}`}>
            <span className='text_shadow paddingLeft5 paddingRight5'>{hp + '%'}</span>
          </div>
        </div>
      </div>
    </div>
  }

  playerStatsDiv = () => {
    const players = this.props.players;
    // console.log('@playerStatsDiv, Players: ', players);
    // TODO: Prevent keys of players being null
    const playerKeys = Object.keys(players).filter(key => key !== null && players[key] !== null);
    const sortedPlayersByHp = playerKeys.sort(function(a,b){return players[b].hp - players[a].hp});
    let list = [];
    for(let i = 0; i < sortedPlayersByHp.length; i++){
      const player = players[sortedPlayersByHp[i]];
      // console.log('inner: ', i, sortedPlayersByHp[i], players[sortedPlayersByHp[i]], players[sortedPlayersByHp[i]].hp)
      list.push(this.createScoreboardPlayerEntry(player, false));
    }
    const deadPlayers = this.props.deadPlayers;
    for(let i = 0; i < deadPlayers.length; i++){
      const player = deadPlayers[i];
      list.push(this.createScoreboardPlayerEntry(player, true));
    }
    /*
    Object.keys(deadPlayers).forEach((deadPlayer) => {
      const player = deadPlayers[deadPlayer];
      list.push(this.createScoreboardPlayerEntry(player, true));
    })
    */
    // console.log('@PlayerStatsDiv', sortedPlayersByHp);
    return <div className='scoreboard'>
      <div className='text_shadow biggerText '>
        <span className='playerScoreboardName'>Scoreboard:</span>  
        {list}   
      </div>
    </div>
  }

  getAmountOfUnitsOnBoard = () => {
    const unitsOnBoard = Object.keys(this.props.myBoard).length;
    const level = this.props.level;
    const content = <span className={(unitsOnBoard > level ? 'redFont' : '')}>{unitsOnBoard}</span>
    return <div className='marginTop5 flex topBarPieceDiv'>
      <img style={{marginTop: '-5px'}} className='pieceImg' src={getImage('pieceImg')} alt='Pieces'/>
      <div className='biggerText text_shadow paddingLeft5'>
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
        continue;
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
    return (chat ? <div>{
    <div className='helpText text_shadow'>
      <span className='bold'>Chat:</span>
      <div className='messageContainerDiv'>
        <div className='messagesContainer'>{messageCollection}</div>
      </div>
      <div style={{ float:"left", clear: "both" }}
        ref={(el) => { this.messagesEnd = el;}}>
      </div>
    </div>}
    <div className='chatTypingDiv'>
      <form onSubmit={this.handleChatSubmit}>
        <label>
          <input placeholder='Type a message ...' className='textInput' type="text" value={this.state.chatMessageInput} 
          onChange={(event) => this.setState({chatMessageInput: event.target.value})} />
        </label>
        <input className='text_shadow normalButton chatTypingSubmit' type="submit" value="Submit" />
      </form>
    </div>
    </div> : <div className='helpText text_shadow'>
        <span className='bold'>{'Information:\n'}</span>
        <div className='messageContainerSimple'>{s}</div>
    </div>);
  }

  getDmgBoard = (dmgBoard) => {
    const list = [];
    if(!dmgBoard) return '';
    const keys = Object.keys(dmgBoard);
    const sortedDmgBoard = keys.sort((a,b) => dmgBoard[b] - dmgBoard[a]);
    // keys.forEach(unitName => {
    for(let i = 0; i < sortedDmgBoard.length; i++){
      const unitName = sortedDmgBoard[i];
      const value = dmgBoard[unitName];
      // console.log('@getDmgBoard', value, this.props.dmgBoardTotalDmg)
      const width = value / this.props.dmgBoardTotalDmg * 100 + '%';
      list.push(<div className='dmgBoardUnitDiv' key={unitName}>
        <div className='damageBarDiv'>
          <span className='damageBar friendlyBar' style={{width: width}}></span>
        </div>
        <span className='dmgBoardUnitName'>{unitName + ': '}</span>
        <span className='dmgBoardUnitValue'>{value}</span>
      </div>)
    }
    return list;
  }

  render() {
    const mainMenu = <div>
      <div className='logos'>
        <img src={getImage('pokemonLogo')} alt='pokemonLogo'/>
        <img src={getImage('autoChess')} alt='autoChessLogo'/>
      </div>
      {/*<div className='titleCard text_shadow'>Pokemon Auto Chess</div>*/}
      <div className='startButtons'>
        <div className='flex'> 
          <button className={`normalButton startButton ${(!this.props.ready ? 'growAnimation' : '')} ${(this.props.loaded ? '' : 'hidden')}`} 
          onClick={this.toggleReady}>{(this.props.ready ? 'Unready' : 'Ready')}</button>
          <button style={{marginLeft: '5px'}} className={`normalButton ${(this.props.playersReady === this.props.connectedPlayers ? 'growAnimation' : '')}`} onClick={() => this.startGameEvent()}>
            {(this.props.connected ? 
              (!this.props.loaded ? ' Loading ...' :
                (this.props.playersReady === -1 ? ' Connected!' : `Start Game (${this.props.playersReady}/${this.props.connectedPlayers})`)
              ) 
            : ' Connecting ...')}
          </button>
          <button style={{marginLeft: '5px'}} className={`normalButton ${(this.props.playersReady >= 2 && this.props.playersReady !== this.props.connectedPlayers && this.props.ready ? '' : 'hidden')}`} 
            onClick={() => this.startGameEvent(true)}>
            Force Start Game{(this.props.connected ? ` (${this.props.playersReady}/${this.props.connectedPlayers})` : ' Connecting ...')}
          </button>
        </div>
      </div>
      <div className='mainMenuSoundDiv marginTop5'>
        <div>
          <img className='musicImgMainMenu' src={(this.props.musicEnabled ? getImage('music') : getImage('musicMuted'))} 
          alt={(this.props.musicEnabled ? 'Mute Music': 'Turn on Music')} onClick={() => this.props.dispatch({type: 'TOGGLE_MUSIC'})}/>
        </div>
        <div>
          <img className='soundImgMainMenu' src={(this.props.soundEnabled ? getImage('sound') : getImage('soundMuted'))} 
          alt={(this.props.soundEnabled ? 'Mute Sound': 'Turn on Sound')}  onClick={() => this.props.dispatch({type: 'TOGGLE_SOUND'})}/>
        </div>
        {(this.props.musicEnabled ? this.playMusic() : '')} 
      </div>
    </div>
    const topBar = <div className='flex topBarDiv'>
        <div className='flex topBarPlayerName'>
          <div className='marginTop5 biggerText text_shadow paddingLeft5'>
            {(this.props.visiting === this.props.index ? 'Player ' + this.props.index : 
            <span><span className='goldFont'>{'Visit: '}</span><span>{'Player ' + this.props.visiting}</span></span>)}
          </div>
        </div>
        <div className='marginTop5 biggerText text_shadow topBarRound'>
          {'Round: ' + this.props.round}
        </div>
        {this.getAmountOfUnitsOnBoard()}
        <div className='flex topBarPadding'>
          <img className='goldImage' src={getImage('goldCoin')} alt='goldCoin'/>
          <div className='marginTop5 biggerText'>
            <span className='text_shadow paddingLeft5'>{JSON.stringify(this.props.gold, null, 2)}</span>
          </div>
        </div>
        <div className='marginTop5 biggerText text_shadow topBarPadding'>
          {(this.props.onGoingBattle ? <div className='redFont'>
            {(this.props.enemyIndex ? <span className='nextUpText'>{this.props.enemyIndex}</span>: '')}
            {(this.props.roundType === 'gym' ? <img className='gymLeader' src={getGymImage(this.props.enemyIndex)} alt={this.props.enemyIndex}/> : '')}
          </div> : <div>
            {(this.props.enemyIndex !== -1 ? <span className='nextUpText'>{'Up next: ' + (this.props.enemyIndex !== '' ? '' : 
              (this.props.roundType === 'npc' ? 'Npc Battle' : (this.props.roundType === 'pvp' ? 'PvP Battle' : '')))} 
            </span>: '')}
            {(this.props.roundType === 'gym' ? <img className='gymLeader upNext' src={getGymImage(this.props.enemyIndex)} alt={this.props.enemyIndex}/>: '')}
          </div>)}
        </div>
      </div>;
    const leftBar = <div className='leftBar'>
        {this.props.gameIsLive ? <Timer startTime={this.props.timerDuration} key={this.props.round} startTimer={this.props.startTimer} 
        storedState={this.props.storedState} dispatch={this.props.dispatch} gameEnded={this.props.gameEnded}></Timer> : ''}
        <div>
          {this.selectedUnitInformation()}
          {this.unitSound()}
          {this.soundEffects()}
        </div>
        <div className='boardBuffs text_shadow'>
          {(this.props.boardBuffs && this.props.boardBuffs.buffMap && Object.keys(this.props.boardBuffs.buffMap).length > 0 ?
            this.displayBuffs() : '')}
        </div>
        <div className='battleEnemyBuffs text_shadow'>
          {(this.props.onGoingBattle && this.props.enemyIndex.includes('Player') ?
            this.displayEnemyBuffs() : '')}
        </div>
        <div className='flex musicDiv'>
          <div onClick={() => this.props.dispatch({type: 'TOGGLE_MUSIC'})}>
            <img className='musicImg' src={(this.props.musicEnabled ? getImage('music') : getImage('musicMuted'))} alt={(this.props.musicEnabled ? 'Mute Music': 'Turn on Music')}/>
          </div>
          <div onClick={() => this.props.dispatch({type: 'TOGGLE_SOUND'})}>
            <img className='soundImg' src={(this.props.soundEnabled ? getImage('sound') : getImage('soundMuted'))} alt={(this.props.soundEnabled ? 'Mute Sound': 'Turn on Sound')}/>
          </div>
          <img className='chatSoundImg' src={(this.props.chatSoundEnabled ? getImage('chatSound') : getImage('chatSoundMuted'))} 
          onClick={() => this.props.dispatch({type: 'TOGGLE_CHAT_SOUND'})} alt='chatSoundToggle'/>
          {(this.props.musicEnabled && this.props.gameIsLive ? this.playMusic() : '')} 
        </div>
        <div className='paddingLeft5 marginTop5 text_shadow'>
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
        <div className={`flex center ${(this.props.index === this.props.visiting ? 'handDiv' : 'handDivVisiting')}`}>
          <Board height={1} width={8} map={this.props.myHand} isBoard={false} newProps={this.props}/>
        </div>
      </div>;
    const rightSide = <div className='flex'>
      <div>
        <div>
          <div className='paddingLeft5'>
            <div>
              <div>
                <div className='flex'>
                  <ShopPokemon shopPokemon={this.props.myShop[this.pos(0)]} index={0} newProps={this.props}/>
                  <ShopPokemon shopPokemon={this.props.myShop[this.pos(1)]} index={1} newProps={this.props}/>
                  <ShopPokemon shopPokemon={this.props.myShop[this.pos(2)]} index={2} newProps={this.props}/>
                </div>
                <div className='flex'>
                  <div className='shopInteractDiv'>
                    <div>
                      <img className={`lockImage ${(this.props.lock ? 'shineLock' : '')}`} onClick={() => toggleLockEvent(this.props)} 
                      src={this.props.lock ? getImage('lockedLock') : getImage('openLock')} alt='lock'/>   
                    </div>
                    <div className='refreshShopDiv'>
                      <img className='refreshShopImage' onClick={() => refreshShopEvent(this.props)} src={getImage('refreshShop')} alt='refreshShop'/>
                    </div>
                    <div className='flex goldImageRefreshDiv'>
                      <img className='goldImageSmall' src={getImage('goldCoin')} alt='goldCoin'/>
                      <div className={`text_shadow goldImageTextSmall ${(this.props.gold < 2 ? 'redFont' : '')}`}>2</div>
                    </div>
                  </div>
                  <ShopPokemon shopPokemon={this.props.myShop[this.pos(3)]} index={3} newProps={this.props} className='pokemonShopHalf'/>
                  <ShopPokemon shopPokemon={this.props.myShop[this.pos(4)]} index={4} newProps={this.props} className='paddingLeft30'/>                
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='marginTop5 paddingLeft5 belowShopDiv'>
          <div className='flex'>
            <div>
              <button style={{marginLeft: '5px'}} className='normalButton' onClick={() => buyExpEvent(this.props)}>Buy Exp</button>
              <div className='flex marginTop5 goldImageBuyExp'>
                <img className='goldImageSmall' src={getImage('goldCoin')} style={{marginLeft: '18px'}} alt='goldCoin'/>
                <div className={`text_shadow goldImageTextSmall ${(this.props.gold < 5 ? 'redFont' : '')}`}>5</div>
              </div>
            </div>
            <div className='toggleHelpDiv'>
              <img className='toggleHelpImg' src={(this.props.help ? getImage('collapse') : getImage('collapseNot'))} 
                    onClick={() => this.props.dispatch({type: 'TOGGLE_HELP'})} alt='toggleHelp'/>
            </div>
            {(this.props.debugMode ? <div className='text_shadow hoveringDiv'>Hovering: {JSON.stringify(this.props.mouseOverId, null, 2)}</div> : '')}
            <div className={'text_shadow messageUpdate'} style={{padding: '5px'}} >
              <div className={`updateMessage ${(this.props.messageMode === 'big' ? 'goldFont' : (this.props.messageMode === 'error' ? 'redFont' : ''))}`}>
                {'Message: ' + this.props.message}
              </div>
            </div>
            {/*<div style={{marginLeft: '5px'}}>
              <button className='normalButton test_animation' onClick={() => battleReady(this.props.storedState)}>Battle ready</button>
            </div>*/}
          </div>
        </div>
        <div>
          {(this.props.help ? <div className='text_shadow marginTop5'>
            <input className='check' type='radio' name='helpRadio' onChange={() => this.props.dispatch({type: 'SET_HELP_MODE', chatHelpMode: 'chat'})}/>
            <label className='labels'>Chat</label> 
            <input className='check' type='radio' name='helpRadio' onChange={() => this.props.dispatch({type: 'SET_HELP_MODE', chatHelpMode: 'hotkeys'})}/> 
            <label className='labels'>Hotkeys</label> 
            <input className='check' type='radio' name='helpRadio' onChange={() => this.props.dispatch({type: 'SET_HELP_MODE', chatHelpMode: 'types'})}/>
            <label className='labels'>Types</label> 
            <input className='check' type='radio' name='helpRadio' onChange={() => this.props.dispatch({type: 'SET_HELP_MODE', chatHelpMode: 'typeBonuses'})}/>
            <label className='labels'>Buffs</label> 
            <input className='check' type='radio' name='helpRadio' onChange={() => this.props.dispatch({type: 'SET_HELP_MODE', chatHelpMode: 'damageBoard'})}/>
            <label className='labels'>Damage</label> 
          </div>: '')}
            {(!this.props.onGoingBattle && this.props.dmgBoard && Object.keys(this.props.dmgBoard).length > 0 && (this.props.showDmgBoard
              || this.props.chatHelpMode === 'damageBoard') ? <div className='dmgBoardDiv helpText text_shadow'>
              <span className='bold'>Damage Dealt:</span>{this.getDmgBoard(this.props.dmgBoard)}
            </div> : (this.props.onGoingBattle && this.props.prevDmgBoard && Object.keys(this.props.prevDmgBoard).length > 0 && (this.props.showDmgBoard
              || this.props.chatHelpMode === 'damageBoard') ? <div className='dmgBoardDiv helpText text_shadow'>
              <span className='bold'>Damage Dealt Previous Round:</span>{this.getDmgBoard(this.props.prevDmgBoard)}
            </div> : (this.props.help ? this.buildHelp() : '')))}
        </div>
      </div>
      {this.playerStatsDiv()}
    </div>;
    return (this.props.gameIsLive ? <div className='gameDiv'>
      {topBar}
      <div className='flex wholeBody' onKeyDown={(event) => this.handleKeyPress(event)} tabIndex='0'>
        {leftBar}
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
  onGoingBattle: state.onGoingBattle,
  isBattle: state.isBattle,
  enemyIndex: state.enemyIndex,
  roundType: state.roundType,
  startBattle: state.startBattle,
  actionStack: state.actionStack,
  battleStartBoard: state.battleStartBoard,
  winner: state.winner,
  dmgBoard: state.dmgBoard,
  selectedUnit: state.selectedUnit,
  mouseOverId: state.mouseOverId,
  stats: state.stats,
  statsMap: state.statsMap,
  typeStatsString: state.typeStatsString,
  typeBonusString: state.typeBonusString,
  typeMap: state.typeMap,
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
  pokemonSprites: state.pokemonSprites,
  alternateAnimation: state.alternateAnimation,
  loaded: state.loaded,
  visiting: state.visiting,
  showDmgBoard: state.showDmgBoard,
  timerDuration: state.timerDuration,
  dmgBoardTotalDmg: state.dmgBoardTotalDmg,
  markedBuff: state.markedBuff,
  displayMarkedBuff: state.displayMarkedBuff,
  debugMode: state.debugMode,
  prevDmgBoard: state.prevDmgBoard,
});

export default connect(mapStateToProps)(App);
// TODO: Add react code here to connect to the reducer (state)

//export default App;
