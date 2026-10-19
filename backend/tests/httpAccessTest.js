process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'verify-only-secret';

const assert = require('assert');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  process.env.MONGODB_URI = mongod.getUri();

  const { User } = require('../models');
  const { signToken } = require('../utils/auth');
  const app = require('../app');
  const mk = async (username, role) => User.create({
    name: username,
    email: `${username}@verify.test`,
    username,
    passwordHash: await bcrypt.hash('Password123', 4),
    role,
    status: 'ACTIVE',
  });

  const inspector = await mk('inspector1', 'INSPECTOR');
  const director = await mk('director1', 'DIRECTOR');
  const admin = await mk('admin1', 'SYSTEM_ADMIN');

  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;

  const call = async (method, path, token, body) => {
    const res = await fetch(base + path, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(token ? { cookie: `token=${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, json: await res.json().catch(() => null) };
  };

  const payload = { outletName: 'Kisumu Agrovet', outletType: 'AGROVET', ownerName: 'Otieno' };
  const insp = signToken({ id: inspector._id.toString(), role: inspector.role });
  const dir = signToken({ id: director._id.toString(), role: director.role });
  const adm = signToken({ id: admin._id.toString(), role: admin.role });

  const r1 = await call('POST', '/api/outlets', insp, payload);
  console.log(`INSPECTOR  POST /outlets      -> ${r1.status} ${r1.status === 201 ? '(allowed OK)' : '(!!! ' + r1.status + ')'}`);
  assert.strictEqual(r1.status, 201);
  const inspOutletId = r1.json.item._id;

  const r2 = await call('PUT', `/api/outlets/${inspOutletId}`, insp, payload);
  console.log(`INSPECTOR  PUT  /outlets/:id  -> ${r2.status} ${r2.status === 200 ? '(allowed OK)' : '(!!! ' + r2.status + ')'}`);
  assert.strictEqual(r2.status, 200);

  const r3 = await call('POST', '/api/outlets', dir, payload);
  console.log(`DIRECTOR   POST /outlets      -> ${r3.status} ${r3.status === 201 ? '(allowed OK)' : '(!!! ' + r3.status + ')'}`);
  assert.strictEqual(r3.status, 201);
  const outletId = r3.json.item._id;

  const r4 = await call('PUT', `/api/outlets/${outletId}`, insp, { outletName: 'Renamed by Inspector', outletType: 'AGROVET', ownerName: 'Hijacked' });
  console.log(`INSPECTOR  PUT existing      -> ${r4.status} ${r4.status === 200 ? '(allowed OK)' : '(!!! ' + r4.status + ')'}`);
  assert.strictEqual(r4.status, 200);

  const r5 = await call('GET', '/api/outlets', insp);
  console.log(`INSPECTOR  GET  /outlets      -> ${r5.status} ${r5.status === 200 ? '(read allowed OK)' : '(!!! ' + r5.status + ')'}`);
  assert.strictEqual(r5.status, 200);

  // mass-assignment guard
  const r6 = await call('PUT', `/api/outlets/${outletId}`, adm, {
    outletName: 'Renamed',
    outletType: 'AGROVET',
    ownerName: 'Otieno',
    _id: '507f1f77bcf86cd799439011',
    kvbRegistrationInfo: 'X',
  });
  console.log(`ADMIN      PUT w/ _id payload -> ${r6.status}, id unchanged: ${r6.json.item && r6.json.item._id === outletId ? 'OK' : '(!!! MUTATED)'}`);
  assert.ok(r6.json.item && r6.json.item._id === outletId);

  // ReDoS: catastrophic pattern must return fast
  const t0 = Date.now();
  const r7 = await call('GET', '/api/outlets?search=' + encodeURIComponent('(a%2B)%2B%24'), insp);
  const ms = Date.now() - t0;
  console.log(`ReDoS probe                   -> ${r7.status} in ${ms}ms ${ms < 1000 ? '(fast OK)' : '(!!! SLOW)'}`);
  assert.ok(ms < 1000);

  // pagination total
  await call('POST', '/api/outlets', dir, { ...payload, outletName: 'Second Outlet' });
  const r8 = await call('GET', '/api/outlets?limit=1&page=1', insp);
  console.log(`Pagination total (3 records)  -> total=${r8.json.total} items=${r8.json.items.length} limit=${r8.json.limit}`);
  assert.strictEqual(r8.json.total, 3);

  const r9 = await call('GET', '/api/outlets?limit=999999', insp);
  console.log(`Limit cap                     -> limit=${r9.json.limit} ${r9.json.limit <= 200 ? '(capped OK)' : '(!!! UNCAPPED)'}`);
  assert.ok(r9.json.limit <= 200);

  const r10 = await call('POST', '/api/auth/logout', null);
  console.log(`Unauth POST /auth/logout      -> ${r10.status} ${r10.status === 401 ? '(now 401 OK)' : '(!!! ' + r10.status + ')'}`);
  assert.strictEqual(r10.status, 401);

  const r11 = await call('POST', '/api/auth/login', null, { username: { $ne: null }, password: 'x' });
  console.log(`NoSQL-ish login body          -> ${r11.status} ${r11.status === 400 ? '(400 OK)' : '(!!! ' + r11.status + ')'}`);
  assert.strictEqual(r11.status, 400);

  const r11b = await call('POST', '/api/auth/login', null, { username: 'inspector1', password: 'Password123' });
  console.log(`Real login                   -> ${r11b.status} ${r11b.status === 200 ? '(200 OK)' : '(!!! ' + r11b.status + ')'}`);
  assert.strictEqual(r11b.status, 200);

  const r12 = await call('POST', '/api/auth/logout', insp);
  console.log(`Authed POST /auth/logout      -> ${r12.status} ${r12.status === 200 ? '(200 OK)' : '(!!! ' + r12.status + ')'}`);
  assert.strictEqual(r12.status, 200);

  const logoutLog = await mongoose.connection.collection('auditlogs').findOne({ action: 'LOGOUT' });
  console.log(`Logout audit entry written    -> ${logoutLog ? 'OK' : '(!!! MISSING)'} ip=${logoutLog && logoutLog.ipAddress}`);
  assert.ok(logoutLog);
  assert.ok(logoutLog.ipAddress, 'logout audit must capture IP');

  const loginLog = await mongoose.connection.collection('auditlogs').findOne({ action: 'LOGIN' });
  console.log(`Login audit IP captured        -> ${loginLog && loginLog.ipAddress ? 'OK (' + loginLog.ipAddress + ')' : '(!!! MISSING)'}`);
  assert.ok(loginLog && loginLog.ipAddress);

  server.close();
  await mongoose.disconnect();
  await mongod.stop();
  console.log('\nALL OUTLET/AUTH VERIFICATIONS PASSED');
  process.exit(0);
})().catch((e) => {
  console.error('VERIFICATION FAILED:', e.message);
  process.exit(1);
});
