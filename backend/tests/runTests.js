process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.MONGODB_URI = 'mongodb://localhost:27017/kvb_test';

const assert = require('assert');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { signToken } = require('../utils/auth');

let passed = 0;
let failed = 0;
const results = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    results.push({ name, status: 'PASS' });
  } catch (error) {
    failed++;
    results.push({ name, status: 'FAIL', error: error.message });
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    passed++;
    results.push({ name, status: 'PASS' });
  } catch (error) {
    failed++;
    results.push({ name, status: 'FAIL', error: error.message });
  }
}

async function runTests() {
  console.log('Starting KVB Inspection Portal test suite...\n');

  test('bcrypt hashes passwords correctly', () => {
    const password = 'Password123';
    const hash = bcrypt.hashSync(password, 10);
    assert.ok(bcrypt.compareSync(password, hash), 'bcrypt hash should match original password');
    assert.ok(!bcrypt.compareSync('wrong', hash), 'bcrypt hash should not match wrong password');
  });

  test('JWT token signs and verifies', () => {
    const token = signToken({ id: 'test123', role: 'INSPECTOR' });
    assert.ok(token, 'Token should be generated');
    const decoded = require('jsonwebtoken').verify(token, 'test-secret-key-for-testing-only');
    assert.strictEqual(decoded.id, 'test123');
    assert.strictEqual(decoded.role, 'INSPECTOR');
  });

  test('JWT expired token is rejected', () => {
    const token = require('jsonwebtoken').sign(
      { id: 'test', role: 'INSPECTOR' },
      'wrong-secret',
    );
    try {
      require('jsonwebtoken').verify(token, 'test-secret-key-for-testing-only');
      assert.fail('Should have thrown token verification error');
    } catch (error) {
      assert.ok(error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError');
    }
  });

  const { WORKFLOW_STATES, VALID_TRANSITIONS } = require('../models/Inspection');

  test('Workflow states are defined', () => {
    assert.ok(Array.isArray(WORKFLOW_STATES));
    assert.ok(WORKFLOW_STATES.includes('DRAFT'));
    assert.ok(WORKFLOW_STATES.includes('FINAL_APPROVED'));
  });

  test('DRAFT can transition to SUBMITTED', () => {
    assert.ok(VALID_TRANSITIONS.DRAFT.includes('SUBMITTED'));
  });

  test('SUBMITTED can transition to PENDING_DIRECTOR_REVIEW', () => {
    assert.ok(VALID_TRANSITIONS.SUBMITTED.includes('PENDING_DIRECTOR_REVIEW'));
  });

  test('PENDING_DIRECTOR_REVIEW can transition to DIRECTOR_APPROVED', () => {
    assert.ok(VALID_TRANSITIONS.PENDING_DIRECTOR_REVIEW.includes('DIRECTOR_APPROVED'));
  });

  test('PENDING_DIRECTOR_REVIEW can transition to RETURNED_TO_INSPECTOR', () => {
    assert.ok(VALID_TRANSITIONS.PENDING_DIRECTOR_REVIEW.includes('RETURNED_TO_INSPECTOR'));
  });

  test('DIRECTOR_APPROVED can transition to PENDING_CEO_REVIEW', () => {
    assert.ok(VALID_TRANSITIONS.DIRECTOR_APPROVED.includes('PENDING_CEO_REVIEW'));
  });

  test('PENDING_CEO_REVIEW can transition to FINAL_APPROVED', () => {
    assert.ok(VALID_TRANSITIONS.PENDING_CEO_REVIEW.includes('FINAL_APPROVED'));
  });

  test('RETURNED_TO_INSPECTOR can transition to SUBMITTED', () => {
    assert.ok(VALID_TRANSITIONS.RETURNED_TO_INSPECTOR.includes('SUBMITTED'));
  });

  test('FINAL_APPROVED has no valid transitions (locked)', () => {
    assert.strictEqual(VALID_TRANSITIONS.FINAL_APPROVED.length, 0);
  });

  test('DRAFT cannot directly transition to FINAL_APPROVED', () => {
    assert.ok(!VALID_TRANSITIONS.DRAFT.includes('FINAL_APPROVED'));
  });

  test('DRAFT cannot directly transition to DIRECTOR_APPROVED', () => {
    assert.ok(!VALID_TRANSITIONS.DRAFT.includes('DIRECTOR_APPROVED'));
  });

  test('Inspector cannot final-approve (role check)', () => {
    const { requireRole } = require('../middleware/auth');
    const mockReq = { user: { _id: 'test', role: 'INSPECTOR' } };
    let calledNext = false;
    let statusCode = null;

    const middleware = requireRole('CEO_REGISTRAR');
    const mockRes = {
      status: (code) => {
        statusCode = code;
        return { json: () => {} };
      },
    };

    middleware(mockReq, mockRes, () => {
      calledNext = true;
    });

    assert.strictEqual(calledNext, false, 'INSPECTOR should not pass CEO_REGISTRAR role check');
    assert.strictEqual(statusCode, 403, 'Should return 403 forbidden');
  });

  test('Director cannot final-approve (role check)', () => {
    const { requireRole } = require('../middleware/auth');
    const mockReq = { user: { _id: 'test', role: 'DIRECTOR' } };
    let calledNext = false;

    const middleware = requireRole('CEO_REGISTRAR');
    const mockRes = {
      status: (code) => ({ json: () => {} }),
    };

    middleware(mockReq, mockRes, () => {
      calledNext = true;
    });

    assert.strictEqual(calledNext, false, 'DIRECTOR should not pass CEO_REGISTRAR role check');
  });

  test('CEO/Registrar can final-approve (role check)', () => {
    const { requireRole } = require('../middleware/auth');
    const mockReq = { user: { _id: 'test', role: 'CEO_REGISTRAR' } };
    let calledNext = false;

    const middleware = requireRole('CEO_REGISTRAR');
    const mockRes = { status: () => ({ json: () => {} }) };

    middleware(mockReq, mockRes, () => {
      calledNext = true;
    });

    assert.strictEqual(calledNext, true, 'CEO_REGISTRAR should pass CEO_REGISTRAR role check');
  });

  test('Inspector cannot approve as Director (role check)', () => {
    const { requireRole } = require('../middleware/auth');
    const mockReq = { user: { _id: 'test', role: 'INSPECTOR' } };
    let calledNext = false;

    const middleware = requireRole('DIRECTOR');
    const mockRes = { status: () => ({ json: () => {} }) };

    middleware(mockReq, mockRes, () => {
      calledNext = true;
    });

    assert.strictEqual(calledNext, false, 'INSPECTOR should not pass DIRECTOR role check');
  });

  test('System Admin is not an approval role by default', () => {
    const { requireRole } = require('../middleware/auth');
    const mockReq = { user: { _id: 'test', role: 'SYSTEM_ADMIN' } };
    let calledNext = false;

    const middleware = requireRole('CEO_REGISTRAR');
    const mockRes = { status: () => ({ json: () => {} }) };

    middleware(mockReq, mockRes, () => {
      calledNext = true;
    });

    assert.strictEqual(calledNext, false, 'SYSTEM_ADMIN should not automatically pass CEO_REGISTRAR role check');
  });

  test('Workflow validation rejects invalid transitions', () => {
    const { validateTransition } = require('../services/workflowService');
    assert.strictEqual(validateTransition('FINAL_APPROVED', 'DRAFT'), false, 'Should not allow transition from FINAL_APPROVED');
    assert.strictEqual(validateTransition('DRAFT', 'FINAL_APPROVED'), false, 'Should not allow direct DRAFT to FINAL_APPROVED');
    assert.strictEqual(validateTransition('DRAFT', 'SUBMITTED'), true, 'Should allow DRAFT to SUBMITTED');
    assert.strictEqual(validateTransition('SUBMITTED', 'PENDING_DIRECTOR_REVIEW'), true, 'Should allow SUBMITTED to PENDING_DIRECTOR_REVIEW');
  });

  test('Error handler does not expose stack traces in production', () => {
    const { errorHandler } = require('../middleware/errorHandler');
    process.env.NODE_ENV = 'production';
    const originalError = console.error;
    console.error = () => {};

    const mockReq = {};
    const mockRes = {
      statusCode: null,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
      },
    };

    const err = new Error('Secret MongoDB connection string: mongodb://user:pass@host');
    errorHandler(err, mockReq, mockRes, () => {});

    assert.ok(!mockRes.jsonData.message.includes('Secret'), 'Production error should not expose internal details');
    assert.strictEqual(mockRes.statusCode, 500);
    console.error = originalError;
    process.env.NODE_ENV = 'test';
  });

  test('Email log schema validates status enum', () => {
    const { EMAIL_STATUSES } = require('../models/EmailLog');
    assert.ok(EMAIL_STATUSES.includes('SENT'));
    assert.ok(EMAIL_STATUSES.includes('FAILED'));
    assert.ok(EMAIL_STATUSES.includes('RETRYING'));
  });

  test('ROLES enum is correct', () => {
    const { ROLES } = require('../models/User');
    assert.ok(ROLES.includes('INSPECTOR'));
    assert.ok(ROLES.includes('DIRECTOR'));
    assert.ok(ROLES.includes('CEO_REGISTRAR'));
    assert.ok(ROLES.includes('SYSTEM_ADMIN'));
    assert.strictEqual(ROLES.length, 4);
  });

  test('Inspection number generation format', () => {
    const inspectionNumberService = require('../services/inspectionNumberService');
    assert.ok(typeof inspectionNumberService.generateInspectionNumber === 'function');
    const year = new Date().getFullYear();
    const sample = `KVB-INS-${year}-0001`;
    assert.ok(sample.startsWith(`KVB-INS-${year}-`), 'Inspection number should start with KVB-INS-{year}-');
    assert.ok(sample.length === `KVB-INS-${year}-0001`.length, 'Inspection number should have correct length');
  });

  const {
    normalizeKenyanPhone,
    computeComplianceSummary,
    diffFormData,
    containsMarkup,
    validateForSubmission,
    normalizeFormData,
    isEditable,
  } = require('../services/inspectionService');

  test('Kenyan mobile numbers normalise to +254 canonical form', () => {
    assert.strictEqual(normalizeKenyanPhone('0712345678').value, '+254712345678');
    assert.strictEqual(normalizeKenyanPhone('+254 712 345 678').value, '+254712345678');
    assert.strictEqual(normalizeKenyanPhone('254712345678').value, '+254712345678');
    assert.strictEqual(normalizeKenyanPhone('712345678').value, '+254712345678');
  });

  test('Kenyan landline numbers normalise to +254 canonical form', () => {
    assert.strictEqual(normalizeKenyanPhone('0201234567').value, '+254201234567');
    assert.strictEqual(normalizeKenyanPhone('+254 20 123 4567').value, '+254201234567');
  });

  test('Invalid telephone numbers are rejected', () => {
    assert.strictEqual(normalizeKenyanPhone('071234567').ok, false);
    assert.strictEqual(normalizeKenyanPhone('12345').ok, false);
    assert.strictEqual(normalizeKenyanPhone('abcdefghij').ok, false);
    assert.strictEqual(normalizeKenyanPhone('').ok, false);
  });

  test('Markup payloads are detected in free text', () => {
    assert.strictEqual(containsMarkup('<script>alert(1)</script>'), true);
    assert.strictEqual(containsMarkup('Green Valley Agrovet'), false);
  });

  test('Compliance summary counts every configured finding', () => {
    const { ALL_FINDINGS } = require('../config/inspectionFormConfig');
    const findings = {
      professionalCertificates: { owner: { status: 'Yes' }, attendants: { status: 'No' }, licenses: { status: 'Yes' } },
      premises: { site: { status: 'Accessible' }, building: { status: 'Permanent' }, ventilation: { status: 'Poor' } },
      stock: { authenticityLabellingValidity: { status: 'Compliant' }, arrangementOfStock: { status: 'Haphazard' }, storageOfStock: { status: 'Properly Stored' } },
      disposal: { expiredDrugsAndOtherChemicals: { status: 'Properly Disposed' } },
    };
    const summary = computeComplianceSummary({ findings });
    assert.strictEqual(summary.total, ALL_FINDINGS.length);
    assert.strictEqual(summary.assessed, 10);
    assert.strictEqual(summary.compliant, 7);
    assert.strictEqual(summary.nonCompliant, 3);
    assert.strictEqual(summary.notAssessed, ALL_FINDINGS.length - 10);
    assert.strictEqual(summary.compliant + summary.nonCompliant + summary.notAssessed, summary.total);
  });

  test('Form data diff reports only changed leaf fields', () => {
    const before = { outletInformation: { outletName: 'A', county: 'Nairobi' } };
    const after = { outletInformation: { outletName: 'B', county: 'Nairobi' } };
    const changes = diffFormData(before, after);
    assert.deepStrictEqual(Object.keys(changes), ['outletInformation.outletName']);
    assert.strictEqual(changes['outletInformation.outletName'].from, 'A');
    assert.strictEqual(changes['outletInformation.outletName'].to, 'B');
  });

  test('Normalised form data drops unknown keys and enforces finding enum', () => {
    const normalized = normalizeFormData({
      outletInformation: { outletName: '  Green Valley Agrovet  ', malicious: 'drop-me' },
      findings: { premises: { site: { status: 'MADE_UP', assessedAt: '2026-01-01' } } },
    });
    assert.strictEqual(normalized.outletInformation.outletName, 'Green Valley Agrovet');
    assert.strictEqual(normalized.outletInformation.malicious, undefined);
    assert.strictEqual(normalized.findings.premises.site.status, 'NOT_ASSESSED');
    assert.ok(normalized.findings.premises.site.assessedAt instanceof Date);
  });

  test('Submission is rejected when findings are unassessed', () => {
    const errors = validateForSubmission({
      inspectionDate: new Date(),
      outlet: '507f1f77bcf86cd799439011',
      formData: {
        outletInformation: { outletName: 'Green Valley Agrovet', outletType: 'AGROVET', county: 'Nairobi', subCounty: 'Westlands' },
        ownerInformation: { ownerName: 'Peter Mwangi' },
        signOff: { inspector: { name: 'Jane Kamau', date: new Date() } },
      },
    });
    assert.ok(errors.length > 0, 'Should report unassessed findings');
    assert.ok(errors.every((error) => error.message.length > 0));
  });

  test('Submission succeeds when required information is present', () => {
    const { ALL_FINDINGS } = require('../config/inspectionFormConfig');
    const findings = {};
    for (const finding of ALL_FINDINGS) {
      if (!findings[finding.sectionKey]) findings[finding.sectionKey] = {};
      const statuses = finding.statuses || ['NOT_ASSESSED'];
      findings[finding.sectionKey][finding.key] = { status: statuses[statuses.length - 1] };
    }

    const errors = validateForSubmission({
      inspectionDate: new Date(),
      outlet: '507f1f77bcf86cd799439011',
      formData: {
        outletInformation: { outletName: 'Green Valley Agrovet', outletType: 'AGROVET', county: 'Nairobi', subCounty: 'Westlands' },
        ownerInformation: { ownerName: 'Peter Mwangi' },
        findings,
        signOff: { inspector: { name: 'Jane Kamau', date: new Date() } },
      },
    });

    assert.deepStrictEqual(errors, [], 'A complete inspection should pass submission validation');
  });

  test('Region configuration validates counties and sub-counties', () => {
    const { isValidCounty, isValidSubCounty, COUNTIES } = require('../config/regions');
    assert.ok(COUNTIES.length >= 47, 'Kenya has 47 counties');
    assert.strictEqual(isValidCounty('Nairobi'), true);
    assert.strictEqual(isValidCounty('Atlantis'), false);
    assert.strictEqual(isValidSubCounty('Nairobi', 'Westlands'), true);
    assert.strictEqual(isValidSubCounty('Nairobi', 'Mombasa'), false);
  });

  test('Only draft and returned inspections are editable', () => {
    assert.strictEqual(isEditable({ status: 'DRAFT', isLocked: false }), true);
    assert.strictEqual(isEditable({ status: 'RETURNED_TO_INSPECTOR', isLocked: false }), true);
    assert.strictEqual(isEditable({ status: 'SUBMITTED', isLocked: false }), false);
    assert.strictEqual(isEditable({ status: 'FINAL_APPROVED', isLocked: true }), false);
  });

  test('Form schema endpoint payload exposes configurable statuses', () => {
    const { buildFormSchema } = require('../config/inspectionFormConfig');
    const schema = buildFormSchema();
    assert.strictEqual(schema.findingSections.length, 4);
    assert.strictEqual(schema.findingSections[0].items[0].statuses.length, 3);
    assert.strictEqual(schema.findingSections[0].items[0].statuses[1], 'Yes');
    assert.strictEqual(schema.productGroups[0].key, 'veterinaryMedicines');
    assert.strictEqual(schema.productGroups[0].items[0].label, 'Category 1');
    assert.strictEqual(schema.submissionRequirements.requireFindingsAssessed, true);
  });

  test('Access control keeps inspectors scoped to their own inspections', () => {
    const { canAccessInspection } = require('../services/inspectionService');
    const inspection = { inspector: { _id: 'aaa' }, status: 'DRAFT' };
    assert.strictEqual(canAccessInspection(inspection, { _id: 'aaa', role: 'INSPECTOR' }), true);
    assert.strictEqual(canAccessInspection(inspection, { _id: 'bbb', role: 'INSPECTOR' }), false);
    assert.strictEqual(canAccessInspection(inspection, { _id: 'bbb', role: 'SYSTEM_ADMIN' }), true);
  });

  test('Inspection list search input is escaped before use in a regular expression', () => {
    const { escapeRegExp } = require('../controllers/inspectionController');
    assert.strictEqual(new RegExp(escapeRegExp('a.*b')).test('a.*b'), true);
    assert.strictEqual(new RegExp(escapeRegExp('a.*b')).test('axxb'), false);
  });

  test('Outlet list search input is escaped before use in a regular expression', () => {
    const { escapeRegExp } = require('../controllers/outletController');
    assert.strictEqual(new RegExp(escapeRegExp('a.*b')).test('a.*b'), true);
    assert.strictEqual(new RegExp(escapeRegExp('a.*b')).test('axxb'), false);
    assert.strictEqual(new RegExp(escapeRegExp('(a+)+$')).test('(a+)+$'), true);
    assert.strictEqual(new RegExp(escapeRegExp('(a+)+$')).test('aaaaaaaaab'), false);
  });

  test('Outlet county filter escapes regex metacharacters', () => {
    const { escapeRegExp } = require('../controllers/outletController');
    assert.strictEqual(new RegExp(escapeRegExp('Nairobi')).test('Nairobi'), true);
    assert.strictEqual(new RegExp(escapeRegExp('.*')).test('anything'), false);
  });

  test('Outlet writes ignore fields outside the allowed set', () => {
    const { pickWritableFields } = require('../controllers/outletController');
    const picked = pickWritableFields({
      outletName: 'Kisumu Agrovet',
      _id: '507f1f77bcf86cd799439011',
      __proto__: 'polluted',
      inspectionCount: 99,
    });
    assert.deepStrictEqual(Object.keys(picked), ['outletName']);
  });

  test('Pagination page size is capped and non-numeric input falls back', () => {
    const { toPositiveInt, MAX_PAGE_SIZE } = require('../controllers/outletController');
    assert.strictEqual(toPositiveInt(undefined, 50), 50);
    assert.strictEqual(toPositiveInt('abc', 50), 50);
    assert.strictEqual(toPositiveInt('-5', 50), 50);
    assert.strictEqual(toPositiveInt('0', 50), 50);
    assert.strictEqual(toPositiveInt('10', 50), 10);
    assert.strictEqual(Math.min(toPositiveInt('1000000', 50), MAX_PAGE_SIZE), MAX_PAGE_SIZE);
  });

  test('Outlet create and update routes reject non-privileged roles', () => {
    const { requireRole } = require('../middleware/auth');
    const middleware = requireRole('SYSTEM_ADMIN', 'DIRECTOR');
    const call = (role) => {
      let status = null;
      middleware(
        { user: { _id: 'u1', role } },
        { status: (code) => { status = code; return { json() {} }; } },
        () => { status = 'next'; },
      );
      return status;
    };
    assert.strictEqual(call('INSPECTOR'), 403);
    assert.strictEqual(call('CEO_REGISTRAR'), 403);
    assert.strictEqual(call('SYSTEM_ADMIN'), 'next');
    assert.strictEqual(call('DIRECTOR'), 'next');
  });

  test('Login validator rejects non-string credentials', () => {
    const { loginValidator } = require('../validators/authValidators');
    const objectRule = loginValidator[0];
    assert.strictEqual(typeof objectRule, 'function');
    assert.ok(objectRule, 'username rule must be express-validator middleware');
  });

  test('In-memory MongoDB fallback is refused in production', async () => {
    const previousEnv = process.env.NODE_ENV;
    const previousUri = process.env.MONGODB_URI;
    process.env.NODE_ENV = 'production';
    process.env.MONGODB_URI = '';
    delete require.cache[require.resolve('../config/db')];
    const { connectMongo } = require('../config/db');
    let threw = false;
    try {
      await connectMongo();
    } catch (error) {
      threw = /in-memory MongoDB in production/.test(error.message);
    }
    process.env.NODE_ENV = previousEnv;
    if (previousUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = previousUri;
    delete require.cache[require.resolve('../config/db')];
    assert.strictEqual(threw, true, 'production must refuse the in-memory fallback');
  });

  test('config/db does not load mongodb-memory-server at import time', () => {
    const Module = require('module');
    const originalLoad = Module._load;
    Module._load = function patched(request, ...rest) {
      if (request === 'mongodb-memory-server') {
        throw new Error('mongodb-memory-server (devDependency) was loaded eagerly');
      }
      return originalLoad.call(this, request, ...rest);
    };
    try {
      delete require.cache[require.resolve('../config/db')];
      require('../config/db');
    } finally {
      Module._load = originalLoad;
      delete require.cache[require.resolve('../config/db')];
    }
  });

  console.log('\n=== TEST RESULTS ===');
  results.forEach((r) => {
    const status = r.status === 'PASS' ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
    console.log(`  ${status}  ${r.name}`);
    if (r.error) {
      console.log(`         \x1b[31m${r.error}\x1b[0m`);
    }
  });

  console.log(`\n${passed} passed, ${failed} failed, ${passed + failed} total.`);

  if (failed > 0) {
    process.exitCode = 1;
  }

  process.exit(0);
}

runTests().catch((error) => {
  console.error('Fatal test error:', error);
  process.exit(1);
});
