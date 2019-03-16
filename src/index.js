// Author: Petter Andersson

const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const router = express.Router();
const cors = require('cors')


const deckJS = require('./deck');
const pokemonJS = require('./pokemon');
const socketController = require('./socketcontroller.js');

// we will use port 8000 for our app
server.listen(8000, () => console.log('connected to port 8000!'));

app.use('/', router);
app.use(cors())

router.all('*', cors());

let pokemonSpritesJSON = pokemonJS.getPokemonSprites();

const getSprites = async () => {
  return pokemonSpritesJSON;
}

router.get('/sprites', async (req, res) => {
  console.log('/sprites GET Request - ', req.connection.remoteAddress);
  const sprites = await getSprites();
  res.json({sprites: sprites});
});

io.on('connection', (socket) => {
  socketController(socket, io);
});
