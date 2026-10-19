require('dotenv').config();
const mongoose = require('mongoose');
const { Outlet } = require('../models');

const DEV_URI = process.env.DEV_MONGODB_URI;

async function main() {
  if (!DEV_URI) {
    console.error('Set DEV_MONGODB_URI to your in-memory MongoDB URI');
    console.error('');
    console.error('Example:');
    console.error('  $env:DEV_MONGODB_URI="mongodb://127.0.0.1:XXXXX/kvb_inspection_db"');
    console.error('  node scripts/export-outlets-dev.js');
    console.error('');
    console.error('Get the URI from your dev server output — look for:');
    console.error('  DEV_IN_MEMORY_MONGODB_URI=mongodb://127.0.0.1:XXXXX/...');
    process.exit(1);
  }

  await mongoose.connect(DEV_URI, {
    serverSelectionTimeoutMS: 15000,
    bufferCommands: false,
  });

  const outlets = await Outlet.find().lean();
  console.log(`Exported ${outlets.length} outlets from dev.`);

  const fs = require('fs');
  fs.writeFileSync('outlets-export.json', JSON.stringify(outlets, null, 2));
  console.log('Written to outlets-export.json');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
