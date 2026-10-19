const mongoose = require('mongoose');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const CONNECT_OPTIONS = {
  serverSelectionTimeoutMS: 15000,
  maxPoolSize: 50,
  minPoolSize: 5,
  bufferCommands: false,
  bufferTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 15000,
};

let mongod;

async function startInMemoryMongo(reason) {
  if (IS_PRODUCTION) {
    throw new Error(
      `Cannot fall back to in-memory MongoDB in production (${reason}). ` +
        'Configure MONGODB_URI and verify the database is reachable.',
    );
  }

  console.warn(`Using in-memory MongoDB (${reason}). Data will NOT persist.`);
  let MongoMemoryServer;
  try {
    ({ MongoMemoryServer } = require('mongodb-memory-server'));
  } catch (error) {
    throw new Error(
      'mongodb-memory-server is unavailable. Install dev dependencies or set MONGODB_URI.',
    );
  }

  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  console.log('DEV_IN_MEMORY_MONGODB_URI=' + uri);
  await mongoose.connect(uri, CONNECT_OPTIONS);
  console.log('MongoDB (in-memory) connected successfully.');
  return { connected: true, mode: 'memory', uri };
}

async function connectMongo() {
  if (!process.env.MONGODB_URI) {
    return startInMemoryMongo('MONGODB_URI is not set');
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, CONNECT_OPTIONS);
    console.log('MongoDB connected successfully.');
    return { connected: true, mode: 'mongo' };
  } catch (error) {
    return startInMemoryMongo(`connection failed: ${error.message}`);
  }
}

async function disconnectMongo() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
  if (mongod) {
    await mongod.stop();
    mongod = null;
    console.log('In-memory MongoDB stopped.');
  }
}

module.exports = { connectMongo, disconnectMongo };
