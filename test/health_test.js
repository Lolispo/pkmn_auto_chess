const assert = require('assert');
const rewire = require('rewire');
const { Map } = require('immutable');

describe('socketcontroller health', () => {
  it('getActivity reports connected socket count and last activity timestamp', () => {
    const sc = rewire('../src/socketcontroller');
    sc.__set__('connectedPlayers', Map({ a: Map({}), b: Map({}) }));
    sc.__set__('lastActivityTs', 42);
    const health = sc.getActivity();
    assert.strictEqual(health.activeSessions, 2);
    assert.strictEqual(health.lastActivityTs, 42);
  });

  it('getActivity reports zero when nobody is connected', () => {
    const sc = rewire('../src/socketcontroller');
    sc.__set__('connectedPlayers', Map({}));
    const health = sc.getActivity();
    assert.strictEqual(health.activeSessions, 0);
    assert.strictEqual(typeof health.lastActivityTs, 'number');
  });

  it('touch updates lastActivityTs', () => {
    const sc = rewire('../src/socketcontroller');
    sc.__set__('lastActivityTs', 0);
    sc.__get__('touch')();
    assert.ok(sc.__get__('lastActivityTs') > 0);
  });
});
