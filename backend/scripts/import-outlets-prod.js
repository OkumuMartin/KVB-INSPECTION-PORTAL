require('dotenv').config();
const mongoose = require('mongoose');
const { Outlet } = require('../models');
const fs = require('fs');

const PROD_URI = process.env.MONGODB_URI;

async function main() {
  if (!PROD_URI) {
    console.error('Set MONGODB_URI to your production Atlas URI');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync('outlets-export.json', 'utf8'));
  console.log(`Read ${data.length} outlets from export file.`);

  await mongoose.connect(PROD_URI, {
    serverSelectionTimeoutMS: 30000,
    bufferCommands: false,
  });

  // Clear existing outlets in prod so we start fresh with the 253
  await Outlet.deleteMany({});
  console.log('Cleared existing outlets in production.');

  const inserted = await Outlet.insertMany(data, { ordered: false });
  console.log(`Inserted ${inserted.length} outlets into production.`);

  const count = await Outlet.countDocuments();
  console.log(`Total outlets now in production: ${count}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
