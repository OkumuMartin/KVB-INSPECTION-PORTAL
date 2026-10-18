require('dotenv').config();
const app = require('./app');
const { connectMongo, disconnectMongo } = require('./config/db');
const seedDatabase = require('./seeds/seedDatabase');
const models = require('./models');

const PORT = process.env.PORT || 5000;

// Validate JWT_SECRET: must be set and strong (≥32 chars) in all environments
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set. Refusing to start with a missing signing secret.');
  process.exit(1);
}
if (typeof JWT_SECRET !== 'string' || JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET must be at least 32 characters long.');
  process.exit(1);
}

// Validate MongoDB URI in production
if (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI) {
  console.error('FATAL: MONGODB_URI is not set in production.');
  process.exit(1);
}

async function startServer() {
  let mode;
  try {
    ({ mode } = await connectMongo());
  } catch (error) {
    console.error('Cannot start server:', error.message);
    process.exit(1);
  }

  if (mode === 'memory') {
    const mongoose = require('mongoose');
    const userCount = await models.User.countDocuments();
    if (userCount === 0) {
      console.log('Auto-seeding empty in-memory database for development...');
      await seedDatabase();
    } else {
      console.log('In-memory database already populated; skipping auto-seed to preserve imported data.');
    }
  }

  app.listen(PORT, () => {
    console.log(`KVB backend running on port ${PORT}`);
  });
}

startServer();