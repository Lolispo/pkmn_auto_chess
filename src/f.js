// Author: Petter Andersson

const { Map } = require('immutable');

exports.getRandomInt = max => Math.floor(Math.random() * Math.floor(max));

exports.print = (obj, msg) => console.log(msg + JSON.stringify(obj)); // Normal version
// console.log(msg + JSON.stringify(obj, null, 2));    // Pretty printed version

exports.getPos = (x, y) => {
  if(y === undefined){
    return Map({x});
  } else {
    return Map({x, y});
  }
}
