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

  // --- CSRF token delivery -------------------------------------------------
  const csrfRes = await fetch(base + '/api/csrf-token');
  const csrfToken = csrfRes.headers.get('x-csrf-token');
  console.log(`CSRF header on response        -> ${csrfToken ? 'OK' : '(!!! MISSING)'}`);
  assert.ok(csrfToken, 'X-CSRF-Token must be exposed on every response');
  assert.ok(
    csrfRes.headers.get('access-control-expose-headers')?.includes('X-CSRF-Token'),
    'CORS must expose X-CSRF-Token to the browser client',
  );

  // --- Public self-registration -------------------------------------------
  const reg = await call('POST', '/api/auth/register', null, {
    name: 'Jane Wanjiku',
    email: 'jane@verify.test',
    username: 'jane',
    password: 'Password123',
  });
  console.log(`Public register                -> ${reg.status} ${reg.status === 201 ? '(201 OK)' : '(!!! ' + reg.status + ')'}`);
  assert.strictEqual(reg.status, 201);
  assert.strictEqual(reg.json.user.role, 'INSPECTOR', 'self-registration must never grant an elevated role');

  const escalate = await call('POST', '/api/auth/register', null, {
    name: 'Escalator',
    email: 'esc@verify.test',
    username: 'esc',
    password: 'Password123',
    role: 'SYSTEM_ADMIN',
  });
  console.log(`Role escalation blocked        -> ${escalate.json.user.role === 'INSPECTOR' ? 'OK' : '(!!! ' + escalate.json.user.role + ')'}`);
  assert.strictEqual(escalate.json.user.role, 'INSPECTOR');

  const dup = await call('POST', '/api/auth/register', null, {
    name: 'Jane Again', email: 'jane@verify.test', username: 'jane2', password: 'Password123',
  });
  console.log(`Duplicate registration rejected-> ${dup.status} ${dup.status === 409 ? '(409 OK)' : '(!!! ' + dup.status + ')'}`);
  assert.strictEqual(dup.status, 409);

  const weak = await call('POST', '/api/auth/register', null, {
    name: 'Weak', email: 'weak@verify.test', username: 'weak', password: 'short',
  });
  console.log(`Weak password rejected         -> ${weak.status} ${weak.status === 400 ? '(400 OK)' : '(!!! ' + weak.status + ')'}`);
  assert.strictEqual(weak.status, 400);

  // --- Password recovery ---------------------------------------------------
  const forgotUnknown = await call('POST', '/api/auth/forgot-password', null, { email: 'nobody@verify.test' });
  console.log(`Forgot password (unknown)      -> ${forgotUnknown.status} ${forgotUnknown.status === 200 ? '(200 OK)' : '(!!! ' + forgotUnknown.status + ')'}`);
  assert.strictEqual(forgotUnknown.status, 200);

  process.env.EXPOSE_RESET_LINK = 'true';
  const forgot = await call('POST', '/api/auth/forgot-password', null, { email: 'jane@verify.test' });
  console.log(`Forgot password (known)        -> ${forgot.status} ${forgot.status === 200 ? '(200 OK)' : '(!!! ' + forgot.status + ')'}`);
  assert.strictEqual(forgot.status, 200);
  const resetUrl = forgot.json.devResetUrl;
  assert.ok(resetUrl, 'a reset link must be issued for a known address');
  const rawToken = new URL(resetUrl).searchParams.get('token');
  assert.ok(rawToken);

  const storedUser = await User.findOne({ email: 'jane@verify.test' }).select('+passwordResetToken +passwordResetExpires');
  assert.ok(storedUser.passwordResetToken, 'a reset token digest must be stored');
  assert.notStrictEqual(
    storedUser.passwordResetToken,
    rawToken,
    'the raw reset token must never be stored — only its digest',
  );
  assert.ok(storedUser.passwordResetExpires, 'the reset token must carry an expiry');
  assert.ok(
    storedUser.passwordResetExpires.getTime() > Date.now(),
    'the reset token must not be expired when it is issued',
  );

  const badReset = await call('POST', '/api/auth/reset-password', null, { token: 'deadbeef', password: 'NewPassword123' });
  console.log(`Invalid reset token rejected   -> ${badReset.status} ${badReset.status === 400 ? '(400 OK)' : '(!!! ' + badReset.status + ')'}`);
  assert.strictEqual(badReset.status, 400);

  const reset = await call('POST', '/api/auth/reset-password', null, { token: rawToken, password: 'NewPassword123' });
  console.log(`Password reset accepted        -> ${reset.status} ${reset.status === 200 ? '(200 OK)' : '(!!! ' + reset.status + ')'}`);
  assert.strictEqual(reset.status, 200);

  const newLogin = await call('POST', '/api/auth/login', null, { username: 'jane', password: 'NewPassword123' });
  console.log(`Login with the new password    -> ${newLogin.status} ${newLogin.status === 200 ? '(200 OK)' : '(!!! ' + newLogin.status + ')'}`);
  assert.strictEqual(newLogin.status, 200);

  const oldLogin = await call('POST', '/api/auth/login', null, { username: 'jane', password: 'Password123' });
  console.log(`Old password rejected          -> ${oldLogin.status} ${oldLogin.status === 401 ? '(401 OK)' : '(!!! ' + oldLogin.status + ')'}`);
  assert.strictEqual(oldLogin.status, 401);

  const reuse = await call('POST', '/api/auth/reset-password', null, { token: rawToken, password: 'Another12345' });
  console.log(`Reset token is single use      -> ${reuse.status} ${reuse.status === 400 ? '(400 OK)' : '(!!! ' + reuse.status + ')'}`);
  assert.strictEqual(reuse.status, 400);

  // --- Outlet GPS coordinates ---------------------------------------------
  // The outlet write validator requires the core identity fields, so a GPS
  // update carries them alongside the coordinates.
  const gpsWrite = await call('PUT', `/api/outlets/${outletId}`, insp, {
    outletName: 'Kisumu Agrovet',
    outletType: 'AGROVET',
    ownerName: 'Otieno',
    latitude: '-1.2921',
    longitude: '36.8219',
    locationSource: 'GPS',
  });
  console.log(`Outlet GPS coordinates stored  -> ${gpsWrite.status} ${gpsWrite.status === 200 ? '(200 OK)' : '(!!! ' + gpsWrite.status + ')'}`);
  assert.strictEqual(gpsWrite.status, 200);
  assert.strictEqual(gpsWrite.json.item.latitude, '-1.2921');
  assert.strictEqual(gpsWrite.json.item.locationSource, 'GPS');

  const badLat = await call('PUT', `/api/outlets/${outletId}`, insp, {
    outletName: 'Kisumu Agrovet',
    outletType: 'AGROVET',
    ownerName: 'Otieno',
    latitude: '999',
    longitude: '36.8',
  });
  console.log(`Out-of-range latitude rejected -> ${badLat.status} ${badLat.status === 400 ? '(400 OK)' : '(!!! ' + badLat.status + ')'}`);
  assert.strictEqual(badLat.status, 400);

  const badLon = await call('PUT', `/api/outlets/${outletId}`, insp, {
    outletName: 'Kisumu Agrovet',
    outletType: 'AGROVET',
    ownerName: 'Otieno',
    latitude: '-1.29',
    longitude: '400',
  });
  console.log(`Out-of-range longitude rejected-> ${badLon.status} ${badLon.status === 400 ? '(400 OK)' : '(!!! ' + badLon.status + ')'}`);
  assert.strictEqual(badLon.status, 400);

  server.close();
  await mongoose.disconnect();
  await mongod.stop();
  console.log('\nALL OUTLET/AUTH VERIFICATIONS PASSED');
  process.exit(0);
})().catch((e) => {
  console.error('VERIFICATION FAILED:', e.message);
  process.exit(1);
});
