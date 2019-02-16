import React, { Component } from 'react';
import { ready, startGame } from './socket';
import { connect } from 'react-redux';

class App extends Component {
  // Event listener example, can be attached to example buttons
  readyButton = () => {
    // Event logic
    console.log('@readyButton');
    // Get required and relevant data from this.props
    const { dispatch, name } = this.props;
    // dispatch can be used to change state values
    ready(this.props.index);
    //dispatch({ type: 'MEMES' });
    // Example: Send data to server
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

  render() {
    return <div>
      <button onClick={this.readyButton}>The button of ready</button>
      <button onClick={this.startGame}>StartGame</button>
      <div>State: {this.props.test}</div>
      <p>Index:{JSON.stringify(this.props.index, null, 2)}</p>
      <p>players:{JSON.stringify(this.props.players, null, 2)}</p>
      <p>player:{JSON.stringify(this.props.player, null, 2)}</p>
      <p>myHand:{JSON.stringify(this.props.myHand, null, 2)}</p>
      <p>myBoard:{JSON.stringify(this.props.myBoard, null, 2)}</p>
      <p>myShop:{JSON.stringify(this.props.myShop, null, 2)}</p>
      <p>level:{JSON.stringify(this.props.level, null, 2)}</p>
      <p>exp:{JSON.stringify(this.props.exp, null, 2)}</p>
      <p>gold:{JSON.stringify(this.props.gold, null, 2)}</p>
    </div>;
  }
}

const mapStateToProps = state => ({
  index: state.index,
  allReady: state.allReady,
  pieces: state.pieces,
  test: state.test,
  players: state.players,
  player: state.player,
  myHand: state.myHand,
  myBoard: state.myBoard,
  myShop: state.myShop,
  level: state.level,
  exp: state.exp,
  expToReach: state.expToReach,
  gold: state.gold,
});

export default connect(mapStateToProps)(App);
// TODO: Add react code here to connect to the reducer (state)

//export default App;
