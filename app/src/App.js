import React, { Component } from 'react';
import { sendNameToServer } from './socket';

class App extends Component {
  // Event listener example, can be attached to example buttons
  exampleEvent = () => {
    // Event logic
    // Get required and relevant data from this.props
    const { dispatch, name } = this.props;
    // dispatch can be used to change state values
    dispatch({ type: 'MEMES' });
    // Example: Send data to server
    sendNameToServer(name)
  };

  render() {
    return <div>I'm ready for changes</div>;
  }
}

// TODO: Add react code here to connect to the reducer (state)

export default App;
