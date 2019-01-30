// Author: Petter Andersson

const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const game = require('./game');

// we will use port 8000 for our app
server.listen(8000, () => console.log('connected to port 8000!'));

const socketController = require('./socketcontroller.js');

io.on('connection', (socket) => {
  socketController(socket, io);
});

game.start();
