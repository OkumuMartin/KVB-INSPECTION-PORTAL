/**
 * Validate the live-verification suite against a real MongoDB instance so its
 * logic is proven before it is pointed at the Atlas cluster.
 *
 * Usage: node tests/liveVerificationHarness.js
 */
const { spawn } = require('child_process');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  const child = spawn(process.execPath, [path.join(__dirname, 'liveVerification.js')], {
    env: { ...process.env, MONGODB_URI: uri, NODE_ENV: 'development' },
    stdio: 'inherit',
  });

  child.on('exit', async (code) => {
    await mongod.stop();
    process.exit(code);
  });
})();
