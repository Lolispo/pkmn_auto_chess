// Author: Petter Andersson

const express = require('express');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const router = express.Router();
const cors = require('cors');

const deckJS = require('./deck');
const pokemonJS = require('./pokemon');
const socketController = require('./socketcontroller.js');

// we will use port 8000 for our app
server.listen(8000, () => console.log('connected to port 8000!'));

app.use('/', router);
app.use(cors());

router.all('*', cors());

const pokemonSpritesJSON = pokemonJS.getPokemonSprites();
const pokemonJson = pokemonJS.getMap();

const getSprites = async () => pokemonSpritesJSON;
const getPokemonJson = async () => pokemonJson;

router.get('/sprites', async (req, res) => {
  console.log('/sprites GET Request - ', req.socket.remoteAddress);
  const sprites = await getSprites();
  res.json({ sprites });
});

router.get('/unitJson', async (req, res) => {
  console.log('/unitJson GET Request - ', req.socket.remoteAddress);
  const pokemonJson = await getPokemonJson();
  res.json({ pokemonJson });
});

io.on('connection', (socket) => {
  socketController(socket, io);
});
