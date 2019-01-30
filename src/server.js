const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);

// we will use port 8000 for our app
server.listen(8000, () => console.log('connected to port 8000!'));


io.on('connection', socket => {
  // below we listen if our pot is updated
  // then emit an event to all connected sockets about the update
    /*
        Example io code
        io.on('connection', function(socket){
            socket.emit('request', ); // emit an event to the socket
            io.emit('broadcast', ); // emit an event to all connected sockets
            socket.on('reply', function(){  }); // listen to the event
        });
    */

  // broadcast to everyone if somebody pitched in
  socket.on('UPDATE_EVERYONES_PIECES', state => {
    socket.broadcast.emit('UPDATED_PIECES', state);
  });


  // this is to make sure that when a client disconnects
  // the client's name will be removed from our server's list of names
  // then broadcast that to everybody connected so their list will be updated
  socket.on('disconnect', () => {
    serverNames = serverNames.filter(data => data.socketId !== socket.id);
    names = serverNames.map(data => data.name);
    socket.broadcast.emit('SEND_NAMES_TO_CLIENTS', names);
    socket.emit('SEND_NAMES_TO_CLIENTS', names);
  });
});