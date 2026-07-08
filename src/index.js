// Author: Petter Andersson

const express = require('express');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
});

const router = express.Router();
const cors = require('cors');

const deckJS = require('./deck');
const pokemonJS = require('./pokemon');
const socketController = require('./socketcontroller.js');

// Bind on all interfaces so the container is reachable; PORT overridable for hosting.
const PORT = process.env.PORT || 8000;
if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => console.log(`connected to port ${PORT}!`));
}

module.exports = { app, server };

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

// Health/liveness — read by web-platform's scale-to-zero sleeper Lambda.
router.get('/health', (req, res) => {
  res.json({ ok: true, ...socketController.getActivity() });
});

io.on('connection', (socket) => {
  socketController(socket, io);
});
