const assert = require('assert');

describe('GET /health', () => {
  it('returns ok with activity fields', async () => {
    const { app } = require('../src/index');
    const server = app.listen(0);
    const { port } = server.address();
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.ok, true);
      assert.strictEqual(typeof body.activeSessions, 'number');
      assert.strictEqual(typeof body.lastActivityTs, 'number');
    } finally {
      server.close();
    }
  });
});
