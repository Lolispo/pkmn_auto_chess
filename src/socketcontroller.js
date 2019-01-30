// Author: Petter Andersson

module.exports = function (socket, io) {
  /*
        Example io code
        io.on('connection', function(socket){
            socket.emit('request', ); // emit an event to the socket
            io.emit('broadcast', ); // emit an event to all connected sockets
            socket.on('reply', function(){  }); // listen to the event
        });
    */

  // broadcast to everyone if somebody pitched in
  // Temp function to showcase syntax
  socket.on('UPDATE_EVERYONES_PIECES', (state) => {
    socket.broadcast.emit('UPDATED_PIECES', state);
  });


  // disconnect logic
  socket.on('disconnect', () => {
    // Something ... TODO
  });
};
