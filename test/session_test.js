// Author: Petter Andersson

const assert = require('assert');
const { Map } = require('immutable');

const sessionJS = require('../src/session.js');

// Sort helpers so assertions don't depend on Immutable.Map iteration order.
const byName = (arr) => arr.slice().sort((a, b) => a.name.localeCompare(b.name));
const byGame = (arr) => arr.slice().sort((a, b) => a.gameId - b.gameId);
const user = (name, sessionId) => Map({ socketId: name, name, sessionId });

describe('session.buildLobbyRoster', () => {
  it('separates waiting (ready/unready) from ongoing games', () => {
    const connectedPlayers = Map({
      a: user('Ash', true),
      b: user('Misty', false),
      c: user('Gary', 0),
      d: user('Oak', 0),
    });
    const roster = sessionJS.buildLobbyRoster(connectedPlayers);
    assert.deepEqual(byName(roster.waiting), byName([
      { name: 'Ash', ready: true },
      { name: 'Misty', ready: false },
    ]));
    assert.deepEqual(byGame(roster.ongoing).map((g) => g.gameId), [0]);
    // players order within a game is not guaranteed either — compare sorted
    assert.deepEqual(roster.ongoing[0].players.slice().sort(), ['Gary', 'Oak']);
  });

  it('handles empty lobby and keeps unnamed waiting players', () => {
    assert.deepEqual(sessionJS.buildLobbyRoster(Map({})), { waiting: [], ongoing: [] });
    const cp = Map({ a: Map({ socketId: 'a', name: '', sessionId: false }) });
    assert.deepEqual(sessionJS.buildLobbyRoster(cp), {
      waiting: [{ name: '', ready: false }],
      ongoing: [],
    });
  });

  it('createUser starts with an empty name and not ready', () => {
    const u = sessionJS.createUser('sock1');
    assert.equal(u.get('socketId'), 'sock1');
    assert.equal(u.get('sessionId'), false);
    assert.equal(u.get('name'), '');
  });
});
