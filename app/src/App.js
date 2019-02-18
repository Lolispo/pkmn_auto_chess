import React, { Component } from 'react';
import { ready, unready, startGame, toggleLock, buyUnit, refreshShop, placePiece, withdrawPiece} from './socket';
import { connect } from 'react-redux';
import { isUndefined } from './f';


class PokemonImage extends Component{
  render(){
    // Import result is the URL of your image
    const src = 'https://img.pokemondb.net/sprites/x-y/normal/' + this.props.name + '.png';
    return (
      <img
        className={this.props.name}
        src={src}
        alt='Pokemon'
      />
    );
  }
}

class Pokemon extends Component{
  render(){
    const content = (!isUndefined(this.props.shopPokemon) 
      ? <div>
          <PokemonImage name={this.props.shopPokemon.name}/>
          <p>{this.props.shopPokemon.display_name + '$' + this.props.shopPokemon.cost}</p>
        </div>
      : <div>Empty</div>)
    return (
      <div style={{backgroundColor: 'gray'}} onClick={() => this.buyUnitEvent(this.props.index)}>
        {content}
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

  updateMessage = (msg) => {
    // Get required and relevant data from this.props
    // dispatch can be used to change state values
    const { dispatch } = this.props;
    dispatch({ type: 'UPDATE_MESSAGE', message: msg});
  }

  buyUnitEvent = (index) => {
    // You have enough money to buy this unit
    // Unit != null
    // Hand is not full
    console.log('@buyUnitEvent', this.props.myShop[this.pos(index)].cost)
    if(this.props.gold >= this.props.myShop[this.pos(index)].cost){
      buyUnit(this.props.storedState, index);
    } else{
      this.updateMessage('Not enough gold!');
    }
  }

  refreshShopEvent = (index) => {
    // You have enough money to refresh
    if(this.props.gold >= 2){
      refreshShop(this.props.storedState)
    } else{
      this.updateMessage('Not enough gold!');
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
        <button onClick={this.readyButton}>The button of ready</button>
        <button onClick={this.unreadyButton}>The button of unreadying</button>
        <button onClick={this.startGame}>StartGame</button>
      </div>
      <div>
        <p>myShop:{JSON.stringify(this.props.myShop, null, 2)}</p>
        <p>gold:{JSON.stringify(this.props.gold, null, 2)}</p>
        <button onClick={() => toggleLock(this.props.storedState)}>Toggle Lock</button>
        <button onClick={this.refreshShopEvent}>Refresh Shop</button>
        <div>
          <Pokemon shopPokemon={this.props.myShop[this.pos(0)]} index={0}/>
          <Pokemon shopPokemon={this.props.myShop[this.pos(1)]} index={1}/>
          <Pokemon shopPokemon={this.props.myShop[this.pos(2)]} index={2}/>
          <Pokemon shopPokemon={this.props.myShop[this.pos(3)]} index={3}/>
          <Pokemon shopPokemon={this.props.myShop[this.pos(4)]} index={4}/>
        </div>
      </div>
      <div>{'Board: ' + JSON.stringify(this.props.myBoard, null, 2)}</div>
      <div>{'Hand: ' + JSON.stringify(this.props.myHand, null, 2)}</div>
      <div>State: {this.props.message}</div>
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
  storedState: state.storedState,
  allReady: state.allReady,
  pieces: state.pieces,
  message: state.message,
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
