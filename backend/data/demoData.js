const bcrypt = require('bcryptjs');

const users = [
  {
    _id: 'u_inspector_1',
    name: 'Jane Kamau',
    email: 'inspector@kvb.ke',
    username: 'inspector1',
    passwordHash: bcrypt.hashSync('Password123', 10),
    role: 'INSPECTOR',
    status: 'ACTIVE',
  },
  {
    _id: 'u_director_1',
    name: 'Martin Otieno',
    email: 'director@kvb.ke',
    username: 'director1',
    passwordHash: bcrypt.hashSync('Password123', 10),
    role: 'DIRECTOR',
    status: 'ACTIVE',
  },
  {
    _id: 'u_ceo_1',
    name: 'Lilian Wanjiru',
    email: 'ceoregistrar@kvb.ke',
    username: 'ceoregistrar1',
    passwordHash: bcrypt.hashSync('Password123', 10),
    role: 'CEO_REGISTRAR',
    status: 'ACTIVE',
  },
  {
    _id: 'u_admin_1',
    name: 'System Admin',
    email: 'admin@kvb.ke',
    username: 'admin1',
    passwordHash: bcrypt.hashSync('Admin@123', 10),
    role: 'SYSTEM_ADMIN',
    status: 'ACTIVE',
  },
];

const outlets = [
  {
    _id: 'out_1',
    outletName: 'Green Valley Agrovet',
    outletType: 'AGROVET',
    ownerName: 'Peter Mwangi',
    ownerEmail: 'peter@example.com',
    ownerPhone: '+254712345678',
    address: 'Kikuyu Road',
    county: 'Nairobi',
    subCounty: 'Westlands',
    centre: 'Kikuyu',
    kvbRegistrationInfo: 'REG-2026-001',
  },
  {
    _id: 'out_2',
    outletName: 'Mombasa Vet Pharmacy',
    outletType: 'CHEMIST',
    ownerName: 'Asha Yusuf',
    ownerEmail: 'asha@example.com',
    ownerPhone: '+254720112233',
    address: 'Old Town Street',
    county: 'Mombasa',
    subCounty: 'Jomvu',
    centre: 'Mombasa',
    kvbRegistrationInfo: 'REG-2026-002',
  },
];

const inspections = [
  {
    _id: 'ins_1',
    inspectionNumber: 'KVB-INS-2026-0001',
    outlet: 'out_1',
    inspector: 'u_inspector_1',
    inspectionDate: '2026-09-10',
    status: 'PENDING_DIRECTOR_REVIEW',
    draft: false,
    formData: {
      inspectionDetails: { inspectionNumber: 'KVB-INS-2026-0001', inspectionDate: '2026-09-10' },
      outletInformation: { outletName: 'Green Valley Agrovet', outletType: 'AGROVET', county: 'Nairobi', subCounty: 'Westlands', centre: 'Kikuyu' },
      ownerInformation: { ownerName: 'Peter Mwangi', address: 'Kikuyu Road', phone: '+254712345678', email: 'peter@example.com' },
      attendants: [
        { name: 'Dorcas Njeri', phone: '+254734556677', kvbNumber: 'KVB-AT-001', retention: 'Registered', practice: 'Active' },
      ],
      products: {
        animalHealthPartI: true,
        animalHealthPartII: true,
        vaccines: false,
        agricultural: true,
        feedsAndSalts: true,
        others: 'Growth supplements',
      },
      findings: {
        ownerProfessionalCertificate: 'Compliant',
        attendantsProfessionalCertificate: 'Compliant',
        licenses: 'Valid',
        site: 'Good',
        building: 'Good',
        ventilation: 'Adequate',
        floorAndWalls: 'Clean',
        space: 'Sufficient',
        stockArrangement: 'Organized',
        stockStorage: 'Controlled',
        authenticity: 'Verified',
        disposal: 'Scheduled',
        otherComments: 'Inspection is proceeding normally.',
      },
      comments: 'Initial inspection completed.',
      location: { latitude: '-1.2833', longitude: '36.8167', capturedAt: '2026-09-10T08:45:00.000Z' },
      signature: { name: 'Jane Kamau', role: 'INSPECTOR', capturedAt: '2026-09-10T09:00:00.000Z' },
    },
    workflowHistory: [],
    createdAt: '2026-09-10T07:30:00.000Z',
    updatedAt: '2026-09-10T09:00:00.000Z',
  },
  {
    _id: 'ins_2',
    inspectionNumber: 'KVB-INS-2026-0002',
    outlet: 'out_2',
    inspector: 'u_inspector_1',
    inspectionDate: '2026-09-11',
    status: 'DRAFT',
    draft: true,
    formData: {
      inspectionDetails: { inspectionNumber: 'KVB-INS-2026-0002', inspectionDate: '2026-09-11' },
      outletInformation: { outletName: 'Mombasa Vet Pharmacy', outletType: 'CHEMIST', county: 'Mombasa', subCounty: 'Jomvu', centre: 'Mombasa' },
    },
    workflowHistory: [],
    createdAt: '2026-09-11T08:00:00.000Z',
    updatedAt: '2026-09-11T08:00:00.000Z',
  },
];

const comments = [
  {
    _id: 'c_1',
    inspection: 'ins_1',
    author: 'u_director_1',
    role: 'DIRECTOR',
    commentText: 'Check stock storage and verify final documentation before approval.',
    isInternal: true,
    createdAt: '2026-09-10T10:00:00.000Z',
  },
];

const auditLogs = [
  {
    _id: 'a_1',
    user: 'u_inspector_1',
    role: 'INSPECTOR',
    action: 'INSPECTION_CREATED',
    inspection: 'ins_1',
    metadata: { status: 'DRAFT' },
    createdAt: '2026-09-10T07:30:00.000Z',
  },
];

const emailLogs = [];

module.exports = { users, outlets, inspections, comments, auditLogs, emailLogs };
