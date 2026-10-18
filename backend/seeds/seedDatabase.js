const bcrypt = require('bcryptjs');
require('dotenv').config();
const mongoose = require('mongoose');
const { connectMongo, disconnectMongo } = require('../config/db');
const models = require('../models');

const BCRYPT_ROUNDS = 12;

const seedUsers = [
  {
    name: 'Jane Kamau',
    email: 'inspector@kvb.ke',
    username: 'inspector1',
    password: 'Password123',
    role: 'INSPECTOR',
    status: 'ACTIVE',
  },
  {
    name: 'Martin Otieno',
    email: 'director@kvb.ke',
    username: 'director1',
    password: 'Password123',
    role: 'DIRECTOR',
    status: 'ACTIVE',
  },
  {
    name: 'Lilian Wanjiru',
    email: 'ceoregistrar@kvb.ke',
    username: 'ceoregistrar1',
    password: 'Password123',
    role: 'CEO_REGISTRAR',
    status: 'ACTIVE',
  },
  {
    name: 'System Administrator',
    email: 'admin@kvb.ke',
    username: 'admin1',
    password: 'Admin@123',
    role: 'SYSTEM_ADMIN',
    status: 'ACTIVE',
    designation: 'IT Manager',
    phone: '+254700000000',
  },
];

const seedOutlets = [
  {
    outletName: 'Green Valley Agrovet',
    outletType: 'AGROVET',
    ownerName: 'Peter Mwangi',
    ownerEmail: 'peter@example.com',
    ownerPhone: '+254712345678',
    address: 'Kikuyu Road, Kshs 100',
    county: 'Nairobi',
    subCounty: 'Westlands',
    centre: 'Kikuyu',
    ownerTrainingLevel: 'Certificate in Animal Health',
    kvbRegistrationInfo: 'REG-2026-001',
    formNumber: 'KVB/VIS/INS/01',
  },
  {
    outletName: 'Mombasa Vet Pharmacy',
    outletType: 'CHEMIST',
    ownerName: 'Asha Yusuf',
    ownerEmail: 'asha@example.com',
    ownerPhone: '+254720112233',
    address: 'Old Town Street',
    county: 'Mombasa',
    subCounty: 'Mvita',
    centre: 'Mombasa',
    ownerTrainingLevel: 'Diploma in Animal Health',
    kvbRegistrationInfo: 'REG-2026-002',
    formNumber: 'KVB/VIS/INS/01',
  },
];

async function seedDatabase() {
  const mongoose = require('mongoose');

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed in production: this script drops the database.');
  }

  const alreadyConnected = mongoose.connection.readyState === 1;

  if (!alreadyConnected) {
    const { connectMongo } = require('../config/db');
    const { connected } = await connectMongo();
    if (!connected) {
      console.error('Cannot seed: MongoDB not connected.');
      return;
    }
  }

  try {
    await mongoose.connection.dropDatabase();
    console.log('Database dropped.');

    const hashedUsers = await Promise.all(
      seedUsers.map(async (user) => ({
        ...user,
        passwordHash: await bcrypt.hash(user.password, BCRYPT_ROUNDS),
      })),
    );

    delete hashedUsers[0].password;
    delete hashedUsers[1].password;
    delete hashedUsers[2].password;
    delete hashedUsers[3].password;

    const createdUsers = await models.User.insertMany(hashedUsers);
    console.log(`Seeded ${createdUsers.length} users.`);

    const createdOutlets = await models.Outlet.insertMany(seedOutlets);
    console.log(`Seeded ${createdOutlets.length} outlets.`);

    const inspector = createdUsers.find((u) => u.role === 'INSPECTOR');

    const sampleInspection = await models.Inspection.create({
      inspectionNumber: 'KVB-INS-2026-0001',
      outlet: createdOutlets[0]._id,
      inspector: inspector._id,
      inspectionDate: new Date('2026-09-10'),
      status: 'PENDING_DIRECTOR_REVIEW',
      draft: false,
      formData: {
        inspectionDetails: {
          formNumber: 'KVB/VIS/INS/01',
        },
        outletInformation: {
          outletName: 'Green Valley Agrovet',
          outletType: 'AGROVET',
          county: 'Nairobi',
          subCounty: 'Westlands',
          centre: 'Kikuyu',
        },
        ownerInformation: {
          ownerName: 'Peter Mwangi',
          address: 'Kikuyu Road',
          telephone: '+254712345678',
          trainingLevel: 'Certificate in Animal Health',
          ownerEmail: 'peter@example.com',
        },
        kvbStatus: {
          registrationNumber: 'REG-2026-001',
          retention: true,
          practice: true,
        },
        attendants: [
          {
            name: 'Dorcas Njeri',
            telephone: '+254734556677',
            kvbStatus: { registrationNumber: 'KVB-AT-001', retention: true, practice: true },
          },
          {
            name: 'Samuel Kimani',
            telephone: '+254722334455',
            kvbStatus: { registrationNumber: 'KVB-AT-002', retention: false, practice: true },
          },
        ],
        products: {
          veterinaryMedicines: { category1: true, category2: true, category3: false, category4: false },
          otherProducts: { agricultural: true, feedsAndSalts: true, others: false, otherDescription: '' },
        },
        findings: {
          professionalCertificates: {
            owner: { status: 'Yes', remarks: 'Certificate displayed at the counter.' },
            attendants: { status: 'Yes', remarks: '' },
            licenses: { status: 'Yes', remarks: 'Licence valid to December 2026.' },
          },
          premises: {
            site: { status: 'Accessible', remarks: '' },
            building: { status: 'Permanent', remarks: '' },
            ventilation: { status: 'Inadequate', remarks: 'Rear store room is poorly ventilated.' },
            floorAndWalls: { status: 'Good', remarks: '' },
            space: { status: 'Adequate', remarks: '' },
          },
          stock: {
            arrangementOfStock: { status: 'Well Arranged', remarks: '' },
            storageOfStock: { status: 'Improperly Stored', remarks: 'Part II products stored on the floor.' },
            authenticityLabellingValidity: { status: 'Compliant', remarks: '' },
          },
          disposal: {
            expiredDrugsAndOtherChemicals: { status: 'Properly Disposed', remarks: 'No expired stock found.' },
          },
        },
        otherComments: 'Establishment to remedy storage and ventilation deficiencies within 30 days.',
        location: {
          latitude: '-1.2833',
          longitude: '36.8167',
          capturedAt: new Date('2026-09-10T08:45:00.000Z'),
        },
        signOff: {
          inspector: { name: 'Jane Kamau', date: new Date('2026-09-10T09:00:00.000Z') },
          personInCharge: { name: 'Peter Mwangi', date: new Date('2026-09-10T09:10:00.000Z') },
        },
      },
      workflowHistory: [
        { action: 'INSPECTION_CREATED', actor: inspector._id, role: 'INSPECTOR', timestamp: new Date('2026-09-10T07:30:00.000Z') },
        { action: 'INSPECTION_SUBMITTED', actor: inspector._id, role: 'INSPECTOR', timestamp: new Date('2026-09-10T09:30:00.000Z') },
        { action: 'SUBMITTED', actor: inspector._id, role: 'INSPECTOR', timestamp: new Date('2026-09-10T09:31:00.000Z') },
      ],
    });

    await models.Counter.create({ _id: 'inspectionNumber:2026', seq: 1 });
    console.log('Seeded counter for inspection numbers.');
    console.log('Seed complete.');

  } catch (error) {
    console.error('Seed error:', error);
  }
}

module.exports = seedDatabase;

if (require.main === module) {
  seedDatabase()
    .then(async () => {
      const { disconnectMongo } = require('../config/db');
      await disconnectMongo();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
