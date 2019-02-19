import React, { Component } from 'react';
import { ready, unready, startGame, toggleLock, buyUnit, refreshShop, buyExp, placePiece, withdrawPiece} from './socket';
import { connect } from 'react-redux';
import { isUndefined, updateMessage } from './f';
import './App.css';

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
          y: j,
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
              <Cell value={dataitem} isBoard={this.props.isBoard} map={this.props.map}/>
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
  getPos(x,y){
    if(this.props.isBoard){
      return x + ',' + y;
    } else{
      return x;
    }
  }
  
  getValue() {
    const { value } = this.props;
    // console.log('@Cell.getValue value =', value)
    // console.log('@Cell.getValue', this.props.map, this.props.map[this.getPos(value.x,value.y)])
    if(this.props.map){
      const pokemon = this.props.map[this.getPos(value.x,value.y)];
      if(!isUndefined(pokemon)){
        const content = 
        <div title={pokemon.type}>
          <PokemonImage name={pokemon.name} paddingTop='5px'/>
        </div>
        return content;
      }
    }
    return null;
  }

  render() {
    let className = 'cell';
    // (value.isFlagged ? " is-flag" : "");
    return (
      <div className={className}>
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

  /*
  playersEvent = () => {
    const players = this.props.players
    const comp = players.map((player) =>
      <li>{player}</li>
    );
  }*/
  /*
  {this.props.myShop.map(unit =>
    <li key={unit} onClick={() => this.handleClick(unit)}>
      {letter}
    </li>
  )}*/

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

  placePieceEvent = (from, to) => {
    // to is on valid part of the board
  }

  withdrawPieceEvent = (from) => {
    // Hand is not full
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
      <div>Message: {this.props.message}</div>
        <div className='flex'>
          <div>
            <span className='text_shadow paddingLeft5 paddingRight5'>{'Level ' + JSON.stringify(this.props.level, null, 2)}</span>
            <button className='normalButton' onClick={() => toggleLock(this.props.storedState)}>Toggle Lock</button>
            <button className='normalButton' onClick={this.refreshShopEvent}>Refresh Shop</button>
            <span className='text_shadow paddingLeft5'>{JSON.stringify(this.props.gold, null, 2)}</span>
          </div>
          <img className='goldImage' src='https://clipart.info/images/ccovers/1495750449Gold-Coin-PNG-Clipart.png' alt='goldCoin'></img>
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
        <Board height={8} width={8} map={this.props.myBoard} isBoard={true}/>
      </div>
      <div>{'Board: ' + JSON.stringify(this.props.myBoard, null, 2)}</div>
      <div className='flex'>
        <Board height={1} width={8} map={this.props.myHand} isBoard={false}/>
        <img src='https://banner2.kisspng.com/20171217/dd9/trash-can-png-5a364e156b25f5.1849924415135083734389.jpg' alt='trash' style={{width: '90px',height: '52px'}}/>
      </div>
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
});

export default connect(mapStateToProps)(App);
// TODO: Add react code here to connect to the reducer (state)

//export default App;
