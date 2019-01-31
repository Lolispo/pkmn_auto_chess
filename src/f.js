// Author: Petter Andersson


exports.getRandomInt = max => Math.floor(Math.random() * Math.floor(max));

exports.print = (obj, msg) => console.log(msg + JSON.stringify(obj)); // Normal version
// console.log(msg + JSON.stringify(obj, null, 2));    // Pretty printed version
