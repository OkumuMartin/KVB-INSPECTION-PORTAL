require('dotenv').config();
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const mongoose = require('mongoose');
const { Outlet } = require('../models');
const { isValidCounty, isValidSubCounty } = require('../config/regions');

const EXCEL_PATH = path.resolve(
  process.env.EXCEL_PATH ||
    'C:\\Users\\SIBUOR\\Downloads\\INSPECTION ACTIVITIES F_Y 26_27 .xlsx'
);

const PROD_URI = process.env.MONGODB_URI;

function parseDate(value) {
  if (!value) return null;
  // Excel serial number (e.g. 46304)
  if (typeof value === 'number') {
    const date = new Date((value - 25569) * 86400 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }
  const str = String(value).trim();
  // Formats: 21/07/2026, 23-09-2026, 26/08/2026
  const m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    const date = new Date(Number(y), Number(mo) - 1, Number(d));
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function parseGps(value) {
  if (!value) return { lat: '', lng: '' };
  const str = String(value).trim();
  const m = str.match(/^([-+]?\d+\.?\d*),\s*([-+]?\d+\.?\d*)$/);
  if (!m) return { lat: '', lng: '' };
  return { lat: m[1].trim(), lng: m[2].trim() };
}

function normalizePhone(value) {
  if (!value) return '';
  const str = String(value).trim();
  if (str === '-' || str === 'N/A' || str === 'NA' || str === '') return '';
  const compact = str.replace(/[^0-9+]/g, '');
  if (!compact) return '';
  // Convert to +254 format
  if (compact.startsWith('+254')) return compact;
  if (compact.startsWith('254') && compact.length === 12) return '+' + compact;
  if (compact.startsWith('0') && compact.length === 10) return '+254' + compact.slice(1);
  if (compact.length === 9 && /^[17]/.test(compact)) return '+254' + compact;
  return compact; // best effort
}

function inferOutletType(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('chemist') && !n.includes('agrovet') && !n.includes('agro')) return 'CHEMIST';
  if (n.includes('agrovet') || n.includes('agro') || n.includes('agroshop') || n.includes('vet')) return 'AGROVET';
  return 'OTHER';
}

function cleanString(value) {
  if (value === null || value === undefined) return '';
  const str = String(value).trim();
  if (str === '-' || str === 'N/A' || str === 'NA' || str === '') return '';
  return str;
}

function normalizeCounty(value) {
  const c = cleanString(value);
  if (!c) return '';
  // Trim trailing spaces
  return c.replace(/\s+$/, '');
}

function normalizeSubCounty(value) {
  const s = cleanString(value);
  if (!s) return '';
  return s.replace(/\s+$/, '');
}

function buildOutlet(row, sheetName) {
  // Map column names by position since they vary slightly across sheets
  const [
    sno,
    name,
    dateInspected,
    county,
    subCounty,
    town,
    gps,
    proprietor,
    proprietorContact,
    practitioner,
    practitionerContacts,
    kvbNumber,
    compliance,
    remarks,
    inspector,
    dcemsRemarks,
    ceosRemarks,
  ] = row;

  const outletName = cleanString(name);
  if (!outletName) return null;

  const countyClean = normalizeCounty(county);
  const subCountyClean = normalizeSubCounty(subCounty);

  if (!isValidCounty(countyClean)) {
    console.warn(`Skipping "${outletName}": invalid county "${countyClean}"`);
    return null;
  }
  if (!isValidSubCounty(countyClean, subCountyClean)) {
    console.warn(`Warning: "${outletName}" sub-county "${subCountyClean}" not in regions.js for county "${countyClean}" — importing anyway.`);
  }

  const { lat, lng } = parseGps(gps);
  const outletType = inferOutletType(outletName);
  const ownerPhone = normalizePhone(proprietorContact);

  return {
    outletName,
    outletType,
    outletTypeOther: outletType === 'OTHER' ? cleanString(outletName) : '',
    ownerName: cleanString(proprietor),
    ownerTrainingLevel: cleanString(practitioner),
    ownerPhone,
    address: cleanString(town),
    county: countyClean,
    subCounty: subCountyClean,
    centre: cleanString(town),
    kvbRegistrationInfo: cleanString(kvbNumber),
    latitude: lat,
    longitude: lng,
    locationSource: 'Excel import',
    formNumber: `KVB/IMPORT/${sheetName.replace(/\s+/g, '_')}/${cleanString(sno) || ''}`,
  };
}

async function main() {
  if (!PROD_URI) {
    console.error('Set MONGODB_URI to your production Atlas URI');
    console.error('Example: $env:MONGODB_URI="mongodb+srv://..."');
    process.exit(1);
  }

  if (!fs.existsSync(EXCEL_PATH)) {
    console.error('Excel file not found at:', EXCEL_PATH);
    process.exit(1);
  }

  console.log('Reading Excel file:', EXCEL_PATH);
  const wb = XLSX.readFile(EXCEL_PATH);
  console.log('Sheets found:', wb.SheetNames.join(', '));

  const allOutlets = [];
  let skipped = 0;

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });
    if (rows.length < 2) {
      console.log(`Sheet "${sheetName}": no data rows, skipping.`);
      continue;
    }

    const sheetOutlets = [];
    for (let i = 1; i < rows.length; i++) {
      const outlet = buildOutlet(rows[i], sheetName);
      if (!outlet) {
        skipped++;
        continue;
      }
      sheetOutlets.push(outlet);
    }

    console.log(`Sheet "${sheetName}": ${sheetOutlets.length} outlets parsed.`);
    allOutlets.push(...sheetOutlets);
  }

  console.log(`\nTotal outlets parsed: ${allOutlets.length}`);
  console.log(`Total skipped: ${skipped}`);

  if (allOutlets.length === 0) {
    console.error('No outlets to import. Aborting.');
    process.exit(1);
  }

  await mongoose.connect(PROD_URI, {
    serverSelectionTimeoutMS: 30000,
    bufferCommands: false,
  });

  // Backup: show current count before clearing
  const before = await Outlet.countDocuments();
  console.log(`Outlets in prod before import: ${before}`);

  await Outlet.deleteMany({});
  console.log('Cleared existing outlets in production.');

  // Insert in batches to avoid hitting MongoDB limits
  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < allOutlets.length; i += BATCH) {
    const batch = allOutlets.slice(i, i + BATCH);
    const result = await Outlet.insertMany(batch, { ordered: false });
    inserted += result.length;
    console.log(`Inserted batch ${Math.floor(i / BATCH) + 1}: ${result.length} outlets`);
  }

  const after = await Outlet.countDocuments();
  console.log(`\nImport complete. Total outlets in production: ${after}`);

  // Show a sample for verification
  const sample = await Outlet.find().limit(3).lean();
  console.log('\nSample outlets:');
  sample.forEach((o) => console.log(`  - ${o.outletName} | ${o.county} | ${o.subCounty} | ${o.outletType}`));

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
