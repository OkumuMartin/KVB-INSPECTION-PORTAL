process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'smoke-secret';
process.env.SMTP_HOST = '';

const assert = require('assert');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { signToken } = require('../utils/auth');

async function run() {
  const mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri('kvb_smoke');

  const models = require('../models');
  const app = require('../app');
  const { generatePdfBuffer } = require('../services/pdfService');
  const { ALL_FINDINGS } = require('../config/inspectionFormConfig');

  await mongoose.connect(process.env.MONGODB_URI);

  const inspector = await models.User.create({
    name: 'Jane Kamau',
    email: 'inspector@smoke.test',
    username: 'inspector1',
    passwordHash: 'x',
    role: 'INSPECTOR',
    status: 'ACTIVE',
  });

  const outlet = await models.Outlet.create({
    outletName: 'Green Valley Agrovet',
    outletType: 'AGROVET',
    ownerName: 'Peter Mwangi',
    county: 'Nairobi',
    subCounty: 'Westlands',
    centre: 'Kikuyu',
    kvbRegistrationInfo: 'REG-2026-001',
  });

  const findings = {};
  for (const finding of ALL_FINDINGS) {
    findings[finding.sectionKey] = findings[finding.sectionKey] || {};
    const goodStatus = finding.statuses[1];
    findings[finding.sectionKey][finding.key] = { status: goodStatus };
  }
  findings.premises.ventilation = { status: 'Poor' };
  findings.stock.authenticityLabellingValidity = { status: 'Suspected Counterfeit/Unfit' };

  const controller = require('../controllers/inspectionController');
  const token = signToken({ id: inspector._id.toString(), role: 'INSPECTOR' });

  const call = async (method, body = {}, params = {}) => {
    const req = { body, params, query: {}, user: { _id: inspector._id, role: 'INSPECTOR', name: inspector.name } };
    let status = 200;
    let payload;
    const res = {
      status(code) { status = code; return res; },
      json(data) { payload = data; return res; },
      send(data) { payload = data; return res; },
      set() { return res; },
    };
    await controller[method](req, res, (error) => { throw error; });
    return { status, payload };
  };

  const created = await call('createInspection', {
    outlet: outlet._id.toString(),
    inspectionDate: '2026-09-28',
  });

  assert.strictEqual(created.status, 201, `create failed: ${JSON.stringify(created.payload)}`);
  const inspectionId = created.payload.item._id;
  const number = created.payload.item.inspectionNumber;
  assert.ok(/^KVB-INS-\d{4}-\d{4}$/.test(number), `unexpected number ${number}`);
  console.log('created', number);

  const updated = await call('updateInspection', {
    inspectionDate: '2026-09-28',
    formData: {
      outletInformation: { outletName: 'Green Valley Agrovet', outletType: 'AGROVET', county: 'Nairobi', subCounty: 'Westlands', centre: 'Kikuyu' },
      ownerInformation: { ownerName: 'Peter Mwangi', address: 'Kikuyu Road', telephone: '0712345678', trainingLevel: 'Certificate' },
      kvbStatus: { registrationNumber: 'REG-2026-001', retention: true, practice: true },
      attendants: [{ name: 'Dorcas Njeri', telephone: '0734556677', kvbStatus: { registrationNumber: 'KVB-AT-001', retention: true, practice: true } }],
      products: { veterinaryMedicines: { category1: true }, otherProducts: { agricultural: true } },
      findings,
      otherComments: 'Rectify ventilation within 30 days.',
      signOff: { inspector: { name: 'Jane Kamau', date: '2026-09-28' } },
    },
  }, { id: inspectionId });

  assert.strictEqual(updated.status, 200, `update failed: ${JSON.stringify(updated.payload)}`);
  assert.strictEqual(updated.payload.item.formData.ownerInformation.telephone, '+254712345678', 'phone should normalise');
  assert.ok(updated.payload.changedFields.length > 0, 'expected changed fields');
  console.log('updated, changed fields:', updated.payload.changedFields.length);

  const submitted = await call('submitInspection', {}, { id: inspectionId });
  assert.strictEqual(submitted.status, 200, `submit failed: ${JSON.stringify(submitted.payload)}`);
  assert.strictEqual(submitted.payload.data.status, 'PENDING_DIRECTOR_REVIEW');
  console.log('submitted ->', submitted.payload.data.status);

  const locked = await call('updateInspection', { formData: { otherComments: 'tamper' } }, { id: inspectionId });
  assert.strictEqual(locked.status, 409, `expected 409 on locked record, got ${locked.status}`);
  console.log('locked edit rejected with', locked.status);

  const detail = await call('getInspection', {}, { id: inspectionId });
  assert.strictEqual(detail.payload.compliance.compliant, 10);
  assert.strictEqual(detail.payload.compliance.nonCompliant, 2);
  console.log('compliance', detail.payload.compliance.complianceRate + '%');

  const populated = await models.Inspection.findById(inspectionId)
    .populate('outlet')
    .populate('inspector', 'name role')
    .lean();
  const pdf = await generatePdfBuffer(populated);
  assert.ok(Buffer.isBuffer(pdf) && pdf.length > 3000, 'pdf should be a non-trivial buffer');
  assert.strictEqual(pdf.subarray(0, 4).toString(), '%PDF', 'pdf magic bytes');
  console.log('pdf bytes', pdf.length);

  const audit = await call('getInspectionAuditLog', {}, { id: inspectionId });
  assert.ok(audit.payload.items.length >= 2, 'expected audit entries');
  assert.ok(audit.payload.items.some((entry) => entry.changes && Object.keys(entry.changes).length > 0), 'expected change diff');
  console.log('audit entries', audit.payload.items.length, '-', audit.payload.items.map((e) => e.action).join(', '));

  const director = await models.User.create({
    name: 'Martin Otieno', email: 'director@smoke.test', username: 'director1',
    passwordHash: 'x', role: 'DIRECTOR', status: 'ACTIVE',
  });

  const ceo = await models.User.create({
    name: 'Lilian Wanjiru', email: 'ceo@smoke.test', username: 'ceo1',
    passwordHash: 'x', role: 'CEO_REGISTRAR', status: 'ACTIVE',
  });

  const callAs = async (user, method, body = {}, params = {}) => {
    const req = { body, params, query: {}, user: { _id: user._id, role: user.role, name: user.name } };
    let status = 200;
    let payload;
    const res = {
      status(code) { status = code; return res; },
      json(data) { payload = data; return res; },
      send(data) { payload = data; return res; },
      set() { return res; },
    };
    await controller[method](req, res, (error) => { throw error; });
    return { status, payload };
  };

  const approved = await callAs(director, 'directorApprove', {}, { id: inspectionId });
  assert.strictEqual(approved.status, 200, `director approve failed: ${JSON.stringify(approved.payload)}`);
  assert.strictEqual(approved.payload.item.status, 'PENDING_CEO_REVIEW');
  console.log('director approved ->', approved.payload.item.status);

  const finalized = await callAs(ceo, 'finalApprove', { signature: { name: 'Lilian Wanjiru' } }, { id: inspectionId });
  assert.strictEqual(finalized.status, 200, `final approve failed: ${JSON.stringify(finalized.payload)}`);
  assert.strictEqual(finalized.payload.item.status, 'FINAL_APPROVED');
  assert.strictEqual(finalized.payload.item.isLocked, true);
  console.log('final approved -> locked');

  const tamper = await call('updateInspection', { formData: { otherComments: 'tamper' } }, { id: inspectionId });
  assert.strictEqual(tamper.status, 409, 'finalized record must be immutable');
  console.log('finalized record immutable');

  const finalPdfDoc = await models.Inspection.findById(inspectionId).populate('outlet').populate('inspector', 'name role').lean();
  const finalPdf = await generatePdfBuffer(finalPdfDoc);
  assert.strictEqual(finalPdf.subarray(0, 4).toString(), '%PDF');
  console.log('final pdf bytes', finalPdf.length);

  const badPayload = await call('updateInspection', {
    formData: { outletInformation: { county: 'Atlantis' } },
  }, { id: inspectionId });
  assert.strictEqual(badPayload.status, 409, 'locked record short-circuits before field validation');

  const draft = await call('createInspection', { outlet: outlet._id.toString(), inspectionDate: '2026-09-28' });
  const deleted = await call('deleteInspection', {}, { id: draft.payload.item._id });
  assert.strictEqual(deleted.status, 200, `delete failed: ${JSON.stringify(deleted.payload)}`);
  assert.strictEqual(await models.Inspection.countDocuments({ _id: draft.payload.item._id }), 0);
  console.log('draft delete ok');

  const notReady = await call('createInspection', { outlet: outlet._id.toString() });
  const earlySubmit = await call('submitInspection', {}, { id: notReady.payload.item._id });
  assert.strictEqual(earlySubmit.status, 422, 'incomplete inspection must be rejected at submit');
  console.log('incomplete submit rejected with 422 and', earlySubmit.payload.errors.length, 'field errors');

  assert.ok(app, 'app loaded');
  console.log('\nSMOKE TEST PASSED');
  await mongoose.disconnect();
  await mongo.stop();
  process.exit(0);
}

run().catch(async (error) => {
  console.error('SMOKE TEST FAILED:', error);
  process.exit(1);
});
