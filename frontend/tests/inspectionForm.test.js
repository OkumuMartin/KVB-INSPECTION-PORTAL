import test from 'node:test';
import assert from 'node:assert/strict';

import {
  validateFieldPath,
  collectStepErrors,
  validateTelephone,
  trainingLevelOptions,
  FALLBACK_TRAINING_LEVELS,
} from '../lib/inspectionForm.js';

function emptyFormData() {
  return {
    inspectionDetails: { formNumber: '' },
    outletInformation: {
      outletName: '',
      outletType: '',
      otherType: '',
      county: '',
      subCounty: '',
      centre: '',
    },
    ownerInformation: {
      ownerName: '',
      address: '',
      telephone: '',
      trainingLevel: '',
      ownerEmail: '',
    },
    kvbStatus: {},
    attendants: [
      {
        name: '',
        telephone: '',
        kvbStatus: { registrationNumber: '', retention: false, practice: false, retentionYear: '', practiceYear: '' },
      },
      {
        name: '',
        telephone: '',
        kvbStatus: { registrationNumber: '', retention: false, practice: false, retentionYear: '', practiceYear: '' },
      },
    ],
    products: {
      veterinaryMedicines: { category1: false, category2: false, category3: false, category4: false },
      otherProducts: { agricultural: false, feedsAndSalts: false, others: false, otherDescription: '' },
    },
    findings: {},
    otherComments: '',
    location: { latitude: '', longitude: '', capturedAt: '' },
    signOff: {
      inspector: { name: '', signatureData: '', date: '' },
      personInCharge: { name: '', signatureData: '', date: '' },
    },
  };
}

test('outlet step reports every missing required field', () => {
  const errors = collectStepErrors({
    step: 'outlet',
    formData: emptyFormData(),
    outletId: '',
    inspectionDate: '2026-10-20',
  });

  assert.ok(errors.outlet);
  assert.ok(errors['formData.outletInformation.outletName']);
  assert.ok(errors['formData.outletInformation.outletType']);
  assert.ok(errors['formData.outletInformation.county']);
  assert.ok(errors['formData.outletInformation.subCounty']);
});

test('a completed outlet step reports no errors', () => {
  const formData = emptyFormData();
  formData.outletInformation.outletName = 'Kisumu Agrovet';
  formData.outletInformation.outletType = 'AGROVET';
  formData.outletInformation.county = 'Kisumu';
  formData.outletInformation.subCounty = 'Kisumu Central';

  const errors = collectStepErrors({
    step: 'outlet',
    formData,
    outletId: 'abc',
    inspectionDate: '2026-10-20',
  });

  assert.deepEqual(errors, {});
});

test('the outlet name error clears as soon as the name becomes valid', () => {
  const formData = emptyFormData();
  assert.ok(validateFieldPath('formData.outletInformation.outletName', formData));

  formData.outletInformation.outletName = 'K';
  assert.ok(validateFieldPath('formData.outletInformation.outletName', formData));

  formData.outletInformation.outletName = 'Kisumu Agrovet';
  assert.equal(validateFieldPath('formData.outletInformation.outletName', formData), null);
});

test('the other outlet type is only required for the OTHER type', () => {
  const formData = emptyFormData();

  formData.outletInformation.outletType = 'OTHER';
  assert.ok(validateFieldPath('formData.outletInformation.otherType', formData));

  formData.outletInformation.otherType = 'Feed mill';
  assert.equal(validateFieldPath('formData.outletInformation.otherType', formData), null);

  formData.outletInformation.outletType = 'AGROVET';
  assert.equal(validateFieldPath('formData.outletInformation.otherType', formData), null);
});

test('the owner name is required and must be long enough', () => {
  const formData = emptyFormData();
  assert.ok(validateFieldPath('formData.ownerInformation.ownerName', formData));

  formData.ownerInformation.ownerName = 'O';
  assert.ok(validateFieldPath('formData.ownerInformation.ownerName', formData));

  formData.ownerInformation.ownerName = 'Otieno';
  assert.equal(validateFieldPath('formData.ownerInformation.ownerName', formData), null);
});

test('an empty telephone is allowed but a malformed one is not', () => {
  const formData = emptyFormData();
  assert.equal(validateFieldPath('formData.ownerInformation.telephone', formData), null);

  formData.ownerInformation.telephone = '0712345678';
  assert.equal(validateFieldPath('formData.ownerInformation.telephone', formData), null);

  formData.ownerInformation.telephone = '12345';
  assert.ok(validateFieldPath('formData.ownerInformation.telephone', formData));
});

test('Kenyan telephone formats are accepted', () => {
  assert.equal(validateTelephone('0712345678'), null);
  assert.equal(validateTelephone('+254712345678'), null);
  assert.equal(validateTelephone('254712345678'), null);
  assert.equal(validateTelephone('+254202012345'), null);
  assert.ok(validateTelephone('12345'));
  assert.ok(validateTelephone('not a number'));
});

test('an attendant row is only validated once it has content', () => {
  const formData = emptyFormData();
  formData.attendants[0].telephone = '0712345678';
  assert.equal(validateFieldPath('formData.attendants.0.telephone', formData), null);

  formData.attendants[0].name = 'Jane';
  assert.equal(validateFieldPath('formData.attendants.0.telephone', formData), null);

  formData.attendants[0].telephone = 'abc';
  assert.ok(validateFieldPath('formData.attendants.0.telephone', formData));
  assert.equal(validateFieldPath('formData.attendants.0.name', formData), null);
});

test('the other products description is only required when "others" is checked', () => {
  const formData = emptyFormData();
  assert.equal(validateFieldPath('formData.products.otherProducts.otherDescription', formData), null);

  formData.products.otherProducts.others = true;
  assert.ok(validateFieldPath('formData.products.otherProducts.otherDescription', formData));

  formData.products.otherProducts.otherDescription = 'Hay and straw';
  assert.equal(validateFieldPath('formData.products.otherProducts.otherDescription', formData), null);
});

test('coordinates outside the valid range are rejected', () => {
  const formData = emptyFormData();

  formData.location.latitude = 'abc';
  assert.ok(validateFieldPath('formData.location.latitude', formData));

  formData.location.latitude = '95';
  assert.ok(validateFieldPath('formData.location.latitude', formData));

  formData.location.latitude = '-1.2921';
  assert.equal(validateFieldPath('formData.location.latitude', formData), null);

  formData.location.longitude = '400';
  assert.ok(validateFieldPath('formData.location.longitude', formData));

  formData.location.longitude = '36.8219';
  assert.equal(validateFieldPath('formData.location.longitude', formData), null);
});

test('a finding must be assessed before the step can be completed', () => {
  const formData = emptyFormData();
  formData.findings = { premises: { site: { status: 'NOT_ASSESSED' } } };

  assert.ok(validateFieldPath('formData.findings.premises.site', formData));

  formData.findings.premises.site.status = 'Accessible';
  assert.equal(validateFieldPath('formData.findings.premises.site', formData), null);
});

test('the inspector sign-off is required', () => {
  const formData = emptyFormData();
  assert.ok(validateFieldPath('formData.signOff.inspector.name', formData));
  assert.ok(validateFieldPath('formData.signOff.inspector.date', formData));

  formData.signOff.inspector.name = 'Dr. Otieno';
  formData.signOff.inspector.date = '2026-10-20';
  assert.equal(validateFieldPath('formData.signOff.inspector.name', formData), null);
  assert.equal(validateFieldPath('formData.signOff.inspector.date', formData), null);
});

test('the training level dropdown keeps a legacy value visible', () => {
  const canonical = trainingLevelOptions(FALLBACK_TRAINING_LEVELS, 'Certificate in Animal Health');
  assert.equal(canonical.length, 4);

  const legacy = trainingLevelOptions(FALLBACK_TRAINING_LEVELS, 'Certificate in Veterinary Medicine');
  assert.equal(legacy.length, 5);
  assert.ok(legacy.includes('Certificate in Veterinary Medicine'));
});
