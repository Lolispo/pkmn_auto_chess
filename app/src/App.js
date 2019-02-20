import React, { Component } from 'react';
import { ready, unready, startGame, toggleLock, buyUnit, refreshShop, buyExp, placePiece, withdrawPiece, battleReady, sellPiece} from './socket';
import { connect } from 'react-redux';
import { isUndefined, updateMessage } from './f';
import './App.css';
import lockedLock from './assets/lockedLock.png';
import openLock from './assets/openLock.png';
import goldCoin from './assets/goldCoin.png';
// import { ifError } from 'assert';

class PokemonImage extends Component{

  render(){
    // Import result is the URL of your image
    let src = 'https://img.pokemondb.net/sprites/black-white/anim/normal/' + this.props.name + '.gif';
    if(this.props.back){
      src = 'https://img.pokemondb.net/sprites/black-white/anim/back-normal/' + this.props.name + '.gif';
    }
    const pt = this.props.paddingTop;
    return (
      <img
        className={`pokemonImg ${this.props.name}`}
        style={{paddingTop: pt}}
        src={src}
        alt='Pokemon'
      />
    );
  }
}

class Pokemon extends Component{
  buyUnitEvent = (index) => {
    // You have enough money to buy this unit
    // Unit != null
    // Hand is not full
    // console.log('@buyUnitEvent', this.props.shopPokemon.cost, this.props.newProps.gold)
    if(this.props.shopPokemon){
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
      content = <div>
            <div className='pokemonImageDiv'>
              <PokemonImage name={this.props.shopPokemon.name} paddingTop='30px'/>
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
      content = <div className='pokemonShopEmpty'>Empty</div>;
    }
    return (
      <div className='pokemonShopEntity' onClick={() => this.buyUnitEvent(this.props.index)}>
        {content}
      </div>
    );
  }
}

class Board extends Component {
  state = {
    ...this.props,
    boardData: this.createEmptyArray(this.props.height, this.props.width),
    // gameStatus: "Game in progress",
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
    return data.map((datarow) => {
      return <div className='boardRow'>{
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
      <div className='flex'> 
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
      return x;
    }
  }

  placePieceEvent = (fromParam, to) => {
    // to is on valid part of the board
    const prop = this.props.newProps;
    const from = String(fromParam);
    if(from && to){
      console.log('@placePieceEvent',from, to);
      const splitted = to.split(',');
      const fromSplitted = from.split(',');
      const validPos = (splitted.length === 2 ? splitted[1] < 4 && splitted[1] >= 0: true) && splitted[0] < 8 && splitted[0] >= 0;
      const unitExists = (fromSplitted.length === 2 ? prop.myBoard[fromParam] : prop.myHand[from])
      console.log('@placePieceEvent', fromSplitted, validPos, unitExists, prop.myHand);
      if(validPos && unitExists && !prop.onGoingBattle){
        console.log('Sending place piece!')
        placePiece(prop.storedState, from, to);
      } else {
        updateMessage(prop, 'Invalid target placing!');
      }
    }
  }

  
  withdrawPieceEvent = (from) => {
    // Hand is not full
    const prop = this.props.newProps;
    const size = Object.keys(prop.myHand).length
    if(size < 8){
      if(prop.myBoard[from] && !prop.onGoingBattle){ // From contains unit
        withdrawPiece(prop.storedState, String(from));
      }
    } else{
      updateMessage(prop, 'Hand is full!');
    }
  }

  sellPieceEvent = (from) => {
    const prop = this.props.newProps;
    const validUnit = (this.props.isBoard ? prop.myBoard[from] : prop.myHand[from])
    if(validUnit && !prop.onGoingBattle){ // From contains unit
      sellPiece(prop.storedState, String(from));
    } else{
      updateMessage(prop, 'Invalid target to sell!', from);
    }
  }
  
  handleCellClick(el){
    // console.log('@handleCellClick pressed', el.props.value.x, ',', el.props.value.y)
    el.props.newProps.dispatch({ type: 'SELECT_UNIT', selectedUnit: {...el.props.value, isBoard: el.props.isBoard, pos: this.state.pos}});
  }

  handleKeyPress(event, self){
    // console.log(event)
    // console.log(event.key, event.currentTarget)
    let from;
    switch(event.key){
      case 'q':
        from = self.props.newProps.selectedUnit.pos;
        const to = self.props.newProps.mouseOverId;
        this.placePieceEvent(from, to);
        break;
      case 'w':
        from = self.props.newProps.mouseOverId;
        console.log(self.props.newProps.myBoard, from, self.props.newProps.mouseOverId)
        if(!isUndefined(from) && self.props.newProps.myBoard[from]){
          this.withdrawPieceEvent(from);
        } else {
          from = self.props.newProps.selectedUnit.pos;
          this.withdrawPieceEvent(from);
        }
        break;
      case 'e':
        from = self.props.newProps.selectedUnit.pos;
        if(!isUndefined(from)){
          this.sellPieceEvent(from);
        } else {
          console.log('Use Select to sell units!')
        }
        break;
    }
  }

  handleMouseOver(event, self){
    //console.log('@handleMouseEvent', event, self)
    const x = event.clientX;
    const y = event.clientY;
    const el = document.elementFromPoint(x, y);
    let id = el.id;
    if(el.id === ''){
      id = el.parentElement.id;

    }
    if(self.props.newProps.mouseOverId !== id){
      console.log('Mousing Over:', id);
      self.props.newProps.dispatch({type: 'SET_MOUSEOVER_ID', mouseOverId: id})        
    }
  }

  getValue() {
    const { value } = this.props;
    // console.log('@Cell.getValue value =', value)
    // console.log('@Cell.getValue', this.props.map, this.props.map[this.getPos(value.x,value.y)])
    if(this.props.map){
      const pokemon = this.props.map[this.state.pos];
      if(!isUndefined(pokemon)){
        const back = (this.props.isBoard ? (!isUndefined(pokemon.team) ? pokemon.team === 0 : true) : false);
        return <PokemonImage name={pokemon.name} paddingTop='5px' back={back}/>
      }
    }
    return null;
  }

  render() {
    // console.log('@renderCell', this.props.selectedUnit)
    const selPos = this.state.selPos;
    let className = 'cell' +
    (!isUndefined(selPos) && this.props.isBoard === selPos.isBoard && 
    selPos.x === this.props.value.x && selPos.y === this.props.value.y ? ' markedUnit' : '');
    return (
      <div id={this.state.pos} className={className} onClick={() => this.handleCellClick(this)} onKeyDown={(event) => this.handleKeyPress(event, this)} 
        onMouseOver={(event) => this.handleMouseOver(event, this)} tabIndex='0'>
        {this.getValue()}
      </div>
    );
  }
}


class App extends Component {
  // Event listener example, can be attached to example buttons
  
  // Event logic

  readyButton = () => {
    console.log('@readyButton');
    ready();
  };

  unreadyButton = () => {
    console.log('@unreadyButton');
    unready();
  };

  startGame = () => {
    // TODO: Css affected by this.props.allReady
    if(this.props.allReady){
      // TODO: Actually start game
      console.log('Starting')
      startGame();
    } else {
      console.log('Not starting')
    }
  }

  refreshShopEvent = (index) => {
    // You have enough money to refresh
    if(this.props.gold >= 2){
      refreshShop(this.props.storedState)
    } else{
      updateMessage(this.props, 'Not enough gold!');
    }
  }

  buyExp = (index) => {
    // You have enough money to buy exp
    if(this.props.gold >= 5){
      buyExp(this.props.storedState)
    } else{
      updateMessage(this.props, 'Not enough gold!');
    }
  }

  pos = (x,y) => {
    if(isUndefined(y)){
      return String(x);
      //return 'List [ ' + x + ' ]'
      //return 'Map { "x": ' + x + ' }'
    }
    return String(x) + ',' + String(y);
    //return 'List [ ' + x + ', ' + y + ' ]'
    //return 'Map { "x": ' + x + ', "y": ' + y + ' }';
  }

  /**
   * Shop add as modal
   */
  render() {
    return <div>
      <div> 
        <button className='normalButton' onClick={this.readyButton}>The button of ready</button>
        <button className='normalButton' onClick={this.unreadyButton}>The button of unreadying</button>
        <button className='normalButton' onClick={this.startGame}>StartGame</button>
      </div>
      <div>
      <div className='text_shadow'>Message: {this.props.message}</div>
        <div>
          <div>
            <span className='text_shadow paddingLeft5 paddingRight5'>{'Level ' + JSON.stringify(this.props.level, null, 2)}</span>
            <span className='text_shadow paddingLeft5 paddingRight5'>{'( ' + this.props.exp + '/' + this.props.expToReach + ')'}</span>
          </div>
          <div className='flex'>
            <div>
              <img className='lockImage' src={this.props.lock ? lockedLock : openLock} alt='lock'/>   
            </div>
            <div>
              <button className='normalButton' onClick={() => toggleLock(this.props.storedState)}>Toggle Lock</button>
              <button className='normalButton' onClick={this.refreshShopEvent}>Refresh Shop</button>
              <span className='text_shadow paddingLeft5'>{JSON.stringify(this.props.gold, null, 2)}</span>
            </div>
            <img className='goldImage' src={goldCoin} alt='goldCoin'></img>
          </div>
        </div>
        <div>
          <div>
            <button className='normalButton' onClick={this.buyExp}>Buy Exp</button>
          </div>
        </div>
        <div className='flex'>
          <Pokemon shopPokemon={this.props.myShop[this.pos(0)]} index={0} newProps={this.props}/>
          <Pokemon shopPokemon={this.props.myShop[this.pos(1)]} index={1} newProps={this.props}/>
          <Pokemon shopPokemon={this.props.myShop[this.pos(2)]} index={2} newProps={this.props}/>
          <Pokemon shopPokemon={this.props.myShop[this.pos(3)]} index={3} newProps={this.props}/>
          <Pokemon shopPokemon={this.props.myShop[this.pos(4)]} index={4} newProps={this.props}/>
        </div>
      </div>
      <div>
        <Board height={8} width={8} map={this.props.myBoard} isBoard={true} newProps={this.props}/>
      </div>
      <div className='flex'>
        <Board height={1} width={8} map={this.props.myHand} isBoard={false} newProps={this.props}/>
      </div>
      <button className='normalButton' onClick={() => battleReady(this.props.storedState)}>Battle ready</button>
      <div>selectedUnit: {JSON.stringify(this.props.selectedUnit, null, 2)}</div>
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
    </div>;
  }
}

const mapStateToProps = state => ({
  index: state.index,
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
  actionStack: state.actionStack,
  battleStartBoard: state.battleStartBoard,
  selectedUnit: state.selectedUnit,
  mouseOverId: state.mouseOverId,
});

export default connect(mapStateToProps)(App);
// TODO: Add react code here to connect to the reducer (state)

//export default App;
