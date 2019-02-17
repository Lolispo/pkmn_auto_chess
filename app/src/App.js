import React, { Component } from 'react';
import { ready, unready, startGame, toggleLock, buyUnit, refreshShop, placePiece, withdrawPiece} from './socket';
import { connect } from 'react-redux';

class App extends Component {
  // Event listener example, can be attached to example buttons
  
  // Event logic
  // Get required and relevant data from this.props
  // dispatch can be used to change state values
  // const { dispatch, name } = this.props;
  // dispatch({ type: 'MEMES' });
  // Example: Send data to server

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

  buyUnitEvent = (index) => {
    // You have enough money to buy this unit
    // Unit != null
    // Hand is not full
    buyUnit(this.props.storedState, index);
  }

  refreshShopEvent = (index) => {
    // You have enough money to refresh
    refreshShop(this.props.storedState)
  }

  placePieceEvent = (from, to) => {
    // to is on valid part of the board
  }

  withdrawPieceEvent = (from) => {
    // Hand is not full
  }

  render() {
    return <div>
      <div> 
        <button onClick={this.readyButton}>The button of ready</button>
        <button onClick={this.unreadyButton}>The button of unreadying</button>
        <button onClick={this.startGame}>StartGame</button>
      </div>
      <div>
        <p>myShop:{JSON.stringify(this.props.myShop, null, 2)}</p>
        <button onClick={() => toggleLock(this.props.storedState)}>Toggle Lock</button>
        <button onClick={this.refreshShopEvent}>Refresh Shop</button>
        <button onClick={() => this.buyUnitEvent(0)}>{this.props.myShop[0]}</button>
        <button onClick={() => this.buyUnitEvent(1)}>{this.props.myShop[1]}</button>
        <button onClick={() => this.buyUnitEvent(2)}>{this.props.myShop[2]}</button>
        <button onClick={() => this.buyUnitEvent(3)}>{this.props.myShop[3]}</button>
        <button onClick={() => this.buyUnitEvent(4)}>{this.props.myShop[4]}</button>
      </div>
      <div>{JSON.stringify(this.props.myBoard, null, 2)}</div>
      <div>{JSON.stringify(this.props.myHand[{x:0}], null, 2)}</div>
      <div>State: {this.props.test}</div>
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
  test: state.test,
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
