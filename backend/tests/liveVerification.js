/**
 * Live-database verification against the configured MongoDB Atlas cluster.
 *
 * Unlike the other suites this one never falls back to the in-memory database:
 * it talks to the real cluster so it can confirm that the production data set
 * matches what the current models expect. It is read-mostly — the only writes
 * are a probe outlet and a probe inspection that are deleted afterwards.
 *
 * Usage:
 *   npm run test:live
 *
 * Prerequisite: this machine's public IP must be present in the Atlas
 * cluster's IP access list. The script prints the required IP on failure.
 */

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const { getPublicIp } = require('./publicIp');
const {
  User,
  Outlet,
  Inspection,
  InspectionComment,
  AuditLog,
  EmailLog,
  Counter,
} = require('../models');
const { ALL_FINDINGS } = require('../config/inspectionFormConfig');
const { normalizeKenyanPhone } = require('../services/inspectionService');

const results = [];
let failures = 0;

function pass(label, detail = '') {
  results.push(`  PASS  ${label}${detail ? ` :: ${detail}` : ''}`);
}

function fail(label, detail = '') {
  failures += 1;
  results.push(`  FAIL  ${label}${detail ? ` :: ${detail}` : ''}`);
}

function check(label, condition, detail = '') {
  if (condition) pass(label, detail);
  else fail(label, detail);
  return condition;
}

function section(title) {
  results.push(`\n${title}`);
}

async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Configure backend/.env before running this suite.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000,
      socketTimeoutMS: 45000,
    });
  } catch (error) {
    console.error('\nCould not reach the live Atlas cluster.');
    console.error(`Reason: ${error.message}`);
    console.error('\nThis is almost always the Atlas IP access list.');
    console.error(`Add this machine's public IP (${await getPublicIp()}) to the access list:`);
    console.error('  Atlas > Network Access > Add IP Address');
    console.error('\nSet MONGODB_URI to point at the cluster you intend to verify.');
    process.exit(1);
  }
}

async function run() {
  const db = mongoose.connection.db;

  section('Connection');
  const build = db.admin().serverBuildInfo;
  check('connected to the live cluster', mongoose.connection.readyState === 1);
  pass('database name', db.databaseName);
  pass('server version', build ? build.version : 'unknown');
  pass('Atlas host', uriHost());

  section('Collections and indexes');
  // createIndexes() is additive: it creates missing collections and indexes
  // without dropping anything, so it is safe to run against production data.
  // syncIndexes() is deliberately avoided — it removes indexes the schema
  // does not declare.
  const models = [
    ['users', User],
    ['outlets', Outlet],
    ['inspections', Inspection],
    ['inspectioncomments', InspectionComment],
    ['auditlogs', AuditLog],
    ['emaillogs', EmailLog],
    ['counters', Counter],
  ];

  for (const [name, model] of models) {
    try {
      await model.createIndexes();
      pass(`indexes ensured for "${name}"`);
    } catch (error) {
      fail(`indexes ensured for "${name}"`, error.message);
    }
  }

  const existing = new Set((await db.listCollections().toArray()).map((c) => c.name));
  for (const [name, model] of models) {
    const count = existing.has(name) ? await db.collection(name).countDocuments() : 0;
    check(`collection "${name}" present`, existing.has(name), `${count} document(s)`);
  }

  const userIndexes = await db.collection('users').indexes();
  const inspectionIndexes = await db.collection('inspections').indexes();
  const outletIndexes = await db.collection('outlets').indexes();

  const hasUnique = (list, key, name) =>
    list.some((ix) => ix.unique && JSON.stringify(ix.key) === JSON.stringify(key) && (!name || ix.name === name));

  check('users.email is unique', hasUnique(userIndexes, { email: 1 }));
  check('users.username is unique', hasUnique(userIndexes, { username: 1 }));
  check('inspections.inspectionNumber is unique', hasUnique(inspectionIndexes, { inspectionNumber: 1 }));
  check('outlets.outletName is indexed', outletIndexes.some((ix) => ix.key && ix.key.outletName === 1));
  check('outlets.county is indexed', outletIndexes.some((ix) => ix.key && ix.key.county === 1));
  check(
    'inspections.formData.outletInformation.outletName is indexed',
    inspectionIndexes.some((ix) => ix.key && ix.key['formData.outletInformation.outletName'] === 1),
  );

  section('Sequential inspection number');
  const year = new Date().getFullYear();
  const totalInspections = await Inspection.countDocuments();
  const counter = await Counter.findById(`inspectionNumber:${year}`).lean();
  if (!counter) {
    if (totalInspections === 0) {
      pass('counter document', `no inspections yet, so no counter for ${year} is expected`);
    } else {
      fail('counter document exists', `no Counter found for ${year} but ${totalInspections} inspection(s) exist`);
    }
  } else {
    pass('counter document', `inspectionNumber:${year} = ${counter.seq}`);
    const nextNumber = `KVB-INS-${year}-${String(counter.seq + 1).padStart(4, '0')}`;
    const clash = await Inspection.findOne({ inspectionNumber: nextNumber }).lean();
    check('the next sequential number is unused', !clash, nextNumber);
  }

  section('Stored data conforms to the current schema');
  const legacyAttendantFields = await Inspection.countDocuments({
    $or: [
      { 'formData.attendant1': { $exists: true } },
      { 'formData.attendant2': { $exists: true } },
      { 'formData.attendants': { $exists: false } },
    ],
  });
  check(
    'no legacy attendant1/attendant2 fields remain',
    legacyAttendantFields === 0,
    `${legacyAttendantFields} inspection(s) with a legacy or missing attendants array`,
  );

  let badStatusCount = 0;
  const badStatusDetail = [];
  for (const finding of ALL_FINDINGS) {
    const path = `formData.findings.${finding.path}.status`;
    const count = await Inspection.countDocuments({
      [path]: { $exists: true, $nin: finding.statuses },
    });
    if (count > 0) {
      badStatusCount += count;
      badStatusDetail.push(`${finding.path} (${count})`);
    }
  }
  check(
    'every stored finding status is a configured status',
    badStatusCount === 0,
    badStatusCount === 0 ? `${ALL_FINDINGS.length} finding paths checked` : badStatusDetail.join(', '),
  );

  const unnormalised = await Inspection.find({
    'formData.ownerInformation.telephone': { $exists: true, $nin: ['', null] },
  })
    .select('formData.ownerInformation.telephone')
    .lean();
  const badPhones = unnormalised.filter((doc) => {
    const stored = doc.formData.ownerInformation.telephone;
    const normalised = normalizeKenyanPhone(stored);
    return !normalised.ok || normalised.value !== stored;
  });
  check(
    'stored owner telephone numbers are in canonical form',
    badPhones.length === 0,
    `${badPhones.length} of ${unnormalised.length} not normalised`,
  );

  section('GPS coordinates round-trip');
  const probeName = `__live_probe_outlet_${Date.now()}__`;
  const probeOutlet = await Outlet.create({
    outletName: probeName,
    outletType: 'AGROVET',
    county: 'Kisumu',
    subCounty: 'Kisumu Central',
    ownerName: 'Live Verification Probe',
    telephone: '+254712345678',
    latitude: '-1.2921',
    longitude: '36.8219',
  });
  const readBack = await Outlet.findById(probeOutlet._id).lean();
  check('latitude persisted', readBack.latitude === '-1.2921', String(readBack.latitude));
  check('longitude persisted', readBack.longitude === '36.8219', String(readBack.longitude));

  section('Inspection creation against the live cluster');
  const probeInspector = await User.create({
    name: 'Live Verification Probe',
    email: `live-probe-${Date.now()}@probe.test`,
    username: `live_probe_${Date.now()}`,
    passwordHash: 'not-a-real-hash',
    role: 'INSPECTOR',
  });
  const probeInspection = await Inspection.create({
    inspectionNumber: `KVB-INS-${year}-PROBE${Date.now()}`,
    status: 'DRAFT',
    outlet: probeOutlet._id,
    inspector: probeInspector._id,
    inspectionDate: new Date().toISOString().slice(0, 10),
    formData: {
      outletInformation: { outletName: 'Probe Outlet', outletType: 'AGROVET', county: 'Kisumu', subCounty: 'Kisumu Central' },
      ownerInformation: { ownerName: 'Probe Owner', telephone: '+254712345678' },
      attendants: [{ name: 'Probe Attendant', telephone: '+254712345679' }],
      products: { veterinaryMedicines: { category1: true } },
      findings: {},
    },
  });
  check('inspection created', Boolean(probeInspection._id));
  const reread = await Inspection.findById(probeInspection._id).lean();
  check('attendants persisted as an array', Array.isArray(reread.formData.attendants) && reread.formData.attendants.length === 1);
  check('attendant telephone normalised', reread.formData.attendants[0].telephone === '+254712345679', reread.formData.attendants[0].telephone);
  check('owner telephone normalised', reread.formData.ownerInformation.telephone === '+254712345678', reread.formData.ownerInformation.telephone);
  await Inspection.deleteOne({ _id: probeInspection._id });
  await User.deleteOne({ _id: probeInspector._id });
  await Outlet.deleteOne({ _id: probeOutlet._id });
  check('probe inspection cleaned up', (await Inspection.findById(probeInspection._id).lean()) === null);
  check('probe user cleaned up', (await User.findById(probeInspector._id).lean()) === null);
  check('probe outlet cleaned up', (await Outlet.findById(probeOutlet._id).lean()) === null);

  section('Duplicate protection');
  let duplicateRejected = false;
  try {
    await User.create({
      name: 'Duplicate Probe',
      email: 'duplicate-probe@live.test',
      username: 'duplicate_probe',
      passwordHash: 'x',
    });
    await User.create({
      name: 'Duplicate Probe',
      email: 'duplicate-probe@live.test',
      username: 'duplicate_probe_2',
      passwordHash: 'x',
    });
  } catch (error) {
    duplicateRejected = error.code === 11000;
  }
  await User.deleteMany({ email: 'duplicate-probe@live.test' });
  check('duplicate email is rejected by the unique index', duplicateRejected);

  section('Production hygiene');
  const demoUsers = await User.find({ email: /^admin@kvb\.ke$/ }).lean();
  check('no seeded demo admin account exists on the live database', demoUsers.length === 0, `${demoUsers.length} found`);
  const weakHashes = await User.find({ passwordHash: { $in: ['admin123', 'password', '123456', 'Admin@123'] } }).lean();
  check('no account uses a well-known demo password hash', weakHashes.length === 0, `${weakHashes.length} found`);

  section('Counts');
  for (const [name, model] of models) {
    pass(name, String(await model.countDocuments()));
  }
}

function uriHost() {
  const raw = process.env.MONGODB_URI || '';
  try {
    if (raw.startsWith('mongodb+srv://')) {
      return new URL(raw.replace('mongodb+srv://', 'https://')).origin;
    }
    const match = raw.match(/^mongodb:\/\/(?:[^@/]*@)?([^/?]+)/);
    if (match) return match[1];
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

(async () => {
  await connect();
  try {
    await run();
  } catch (error) {
    fail('suite crashed', error.stack || error.message);
  } finally {
    await mongoose.disconnect();
  }

  console.log(results.join('\n'));
  console.log(
    failures === 0
      ? '\nLIVE DATABASE VERIFICATION PASSED'
      : `\nLIVE DATABASE VERIFICATION FAILED (${failures} check(s))`,
  );
  process.exit(failures === 0 ? 0 : 1);
})();
