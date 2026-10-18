require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const ROOT = path.resolve(__dirname, '..');
const models = require(path.join(ROOT, 'models'));
const { connectMongo, disconnectMongo } = require(path.join(ROOT, 'config', 'db'));
const { generateInspectionNumber } = require(path.join(ROOT, 'services', 'inspectionNumberService'));
const { normalizeFormData } = require(path.join(ROOT, 'services', 'inspectionService'));
const seedDatabase = require(path.join(ROOT, 'seeds', 'seedDatabase'));

const SOURCE = 'C:/Users/SIBUOR/Desktop/KVB INSPECTION PORTAL/inspection_data_cleaned.json';

function asString(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return '';
}

// proprietor_contact is empty in the cleaned dataset; practitioner_contact
// (the person-in-charge phone) is the closest available owner contact.
function ownerPhone(rec) {
  return asString(rec.proprietor_contact) || asString(rec.practitioner_contact);
}

function classifyOutlet(name) {
  const n = asString(name).toLowerCase();
  if (n.includes('chemist') || n.includes('pharmacy') || n.includes('drug')) return 'CHEMIST';
  return 'AGROVET';
}

function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function buildFormData(rec) {
  const gps = asString(rec.gps).split(',').map((s) => s.trim()).filter(Boolean);
  const attendants = (rec.practitioners || []).slice(0, 9).map((name) => ({ name }));
  if (attendants.length > 0 && asString(rec.practitioner_contact)) {
    attendants[0].telephone = asString(rec.practitioner_contact);
  }
  return normalizeFormData({
    outletInformation: {
      outletName: asString(rec.premise_name),
      outletType: classifyOutlet(rec.premise_name),
      county: asString(rec.county),
      subCounty: asString(rec.sub_county),
      centre: asString(rec.town),
    },
    ownerInformation: {
      ownerName: asString(rec.proprietor),
      telephone: ownerPhone(rec),
    },
    kvbStatus: { registrationNumber: asString(rec.kvb_number) },
    attendants,
    location: gps.length >= 2 ? { latitude: gps[0], longitude: gps[1] } : undefined,
  });
}

function buildSourceMeta(rec) {
  return {
    sourceSheet: asString(rec.source_sheet),
    sourceInspector: asString(rec.inspector),
    sourceCompliance: asString(rec.compliance),
    sourceRemarks: asString(rec.remarks),
    dceRemarks: asString(rec.dce_remarks),
    ceoRemarks: asString(rec.ceo_remarks),
  };
}

async function runImport() {
  const data = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
  const rows = [];
  for (const county of Object.keys(data.counties)) {
    for (const sub of Object.keys(data.counties[county].sub_counties)) {
      for (const r of data.counties[county].sub_counties[sub]) rows.push(r);
    }
  }

  const inspectors = await models.User.find({ role: 'INSPECTOR', status: 'ACTIVE' }).sort({ _id: 1 });
  if (inspectors.length === 0) throw new Error('No active INSPECTOR users. Seed first.');

  const outletCache = new Map();
  let createdOutlets = 0;
  let createdInspections = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const rec = rows[i];
    const name = asString(rec.premise_name).trim();
    if (!name) { skipped += 1; continue; }
    const key = name.toLowerCase();
    let outlet = outletCache.get(key);
    if (!outlet) {
      outlet = await models.Outlet.findOne({ outletName: new RegExp('^' + escapeRegex(name) + '$', 'i') });
    }
    if (!outlet) {
      outlet = await models.Outlet.create({
        outletName: name,
        outletType: classifyOutlet(name),
        ownerName: asString(rec.proprietor) || 'Unknown',
        county: asString(rec.county),
        subCounty: asString(rec.sub_county),
        centre: asString(rec.town),
        ownerPhone: ownerPhone(rec),
        kvbRegistrationInfo: asString(rec.kvb_number),
        latitude: asString(rec.gps).split(',')[0],
        longitude: asString(rec.gps).split(',')[1],
      });
      createdOutlets += 1;
    }
    outletCache.set(key, outlet);

    const inspector = inspectors[i % inspectors.length];
    const formData = buildFormData(rec);
    const sourceMeta = buildSourceMeta(rec);
    const inspectionNumber = await generateInspectionNumber();
    const inspectionDate = rec.date_inspected ? new Date(rec.date_inspected + 'T00:00:00.000Z') : new Date();
    await models.Inspection.create({
      inspectionNumber,
      outlet: outlet._id,
      inspector: inspector._id,
      inspectionDate,
      status: 'FINAL_APPROVED',
      isLocked: true,
      draft: false,
      formData,
      ...sourceMeta,
      workflowHistory: [
        { action: 'INSPECTION_CREATED', actor: inspector._id, role: 'INSPECTOR', timestamp: new Date() },
        { action: 'FINAL_APPROVED', actor: inspector._id, role: 'INSPECTOR', timestamp: new Date() },
      ],
    });
    createdInspections += 1;
  }
  return { createdOutlets, createdInspections, skipped, total: rows.length, inspectors: inspectors.length };
}

async function main() {
  const { mode } = await connectMongo();
  console.log('Mongo mode:', mode);
  console.log('Seeding base data (users/outlets/counter)...');
  await seedDatabase();
  const result = await runImport();
  console.log('Inspectors available:', result.inspectors);
  console.log('Outlets created:', result.createdOutlets);
  console.log('Inspections created:', result.createdInspections);
  console.log('Skipped (no name):', result.skipped);
  console.log('DB totals -> inspections:', await models.Inspection.countDocuments(), 'outlets:', await models.Outlet.countDocuments(), 'users:', await models.User.countDocuments());
  const indexes = await models.Inspection.collection.indexes();
  console.log('Inspection indexes:', indexes.map((i) => i.name).join(', '));
  await disconnectMongo();
  process.exit(0);
}

if (require.main === module) {
  main().catch(async (err) => { console.error('Import failed:', err.message); try { await disconnectMongo(); } catch (e) {} process.exit(1); });
}

module.exports = { runImport, asString, classifyOutlet, escapeRegex, buildFormData };