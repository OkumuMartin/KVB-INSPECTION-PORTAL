const {
  ALL_FINDINGS,
  LIMITS,
  SUBMISSION_REQUIREMENTS,
  COMPLIANT_STATUSES,
  getFindingStatuses,
} = require('../config/inspectionFormConfig');
const { OUTLET_TYPES } = require('../models/Outlet');
const { isValidCounty, isValidSubCounty } = require('../config/regions');

const EDITABLE_STATES = ['DRAFT', 'RETURNED_TO_INSPECTOR'];
const LOCKED_STATES = ['FINAL_APPROVED'];

const MARKUP_PATTERN = /<\s*\/?\s*[a-z][^>]*>|<\s*script|javascript\s*:|on(?:error|load|click|mouseover)\s*=/i;
const DIGITS_ONLY = /[^0-9+]/g;
const PHONE_MAX_DIGITS = 13;

function isPlainObject(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function containsMarkup(value) {
  return typeof value === 'string' && MARKUP_PATTERN.test(value);
}

function normalizeKenyanPhone(input) {
  if (input === undefined || input === null || input === '') {
    return { ok: false, value: '', reason: 'required' };
  }
  if (typeof input !== 'string') {
    return { ok: false, value: '', reason: 'invalid' };
  }

  const compact = input.replace(DIGITS_ONLY, '');
  // Reject inputs with more than 13 digits (invalid Kenyan numbers).
  // This check must run before the length regex so that oversized inputs
  // produce a clear "too_many_digits" error rather than a generic "invalid".
  if (compact.replace(/^\+/, '').length > PHONE_MAX_DIGITS) {
    return { ok: false, value: input.trim(), reason: 'too_many_digits' };
  }
  if (!/^\+?\d{9,13}$/.test(compact)) {
    return { ok: false, value: input.trim(), reason: 'invalid' };
  }

  let national = compact;
  if (national.startsWith('+254')) {
    national = `0${national.slice(4)}`;
  } else if (national.startsWith('254')) {
    national = `0${national.slice(3)}`;
  } else if (!national.startsWith('0') && national.length === 9) {
    national = `0${national}`;
  }

  const digits = national.slice(1);
  const isMobile = /^0[17]\d{8}$/.test(national);
  const isLandline = /^0[2-9]\d{8}$/.test(national);

  if (!isMobile && !isLandline) {
    return { ok: false, value: input.trim(), reason: 'invalid' };
  }

  return { ok: true, value: `+254${digits}`, reason: null };
}

function deepMerge(base, patch) {
  if (!isPlainObject(patch)) return patch === undefined ? base : patch;
  const result = isPlainObject(base) ? { ...base } : {};

  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    result[key] = isPlainObject(value) ? deepMerge(result[key], value) : value;
  }

  return result;
}

function isTraversable(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getByPath(source, path) {
  return path
    .split('.')
    .reduce((acc, key) => (isTraversable(acc) ? acc[key] : undefined), source);
}

function stripUndefined(value) {
  if (Array.isArray(value)) {
    return value.map(stripUndefined).filter((item) => item !== undefined);
  }
  if (isPlainObject(value)) {
    const result = {};
    for (const [key, item] of Object.entries(value)) {
      if (item === undefined) continue;
      result[key] = stripUndefined(item);
    }
    return result;
  }
  return value;
}

function sanitizeFormData(input = {}) {
  if (!isPlainObject(input)) return {};

  const cleanText = (value, max) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    if (!trimmed) return '';
    return trimmed.slice(0, max);
  };

  const outletInformation = isPlainObject(input.outletInformation) ? input.outletInformation : {};
  const ownerInformation = isPlainObject(input.ownerInformation) ? input.ownerInformation : {};
  const kvbStatus = isPlainObject(input.kvbStatus) ? input.kvbStatus : {};
  const products = isPlainObject(input.products) ? input.products : {};
  const veterinaryMedicines = isPlainObject(products.veterinaryMedicines) ? products.veterinaryMedicines : {};
  const otherProducts = isPlainObject(products.otherProducts) ? products.otherProducts : {};
  const location = isPlainObject(input.location) ? input.location : {};
  const inspectionDetails = isPlainObject(input.inspectionDetails) ? input.inspectionDetails : {};
  const signOff = isPlainObject(input.signOff) ? input.signOff : {};
  const findings = isPlainObject(input.findings) ? input.findings : {};

  const attendants = Array.isArray(input.attendants)
    ? input.attendants.slice(0, LIMITS.maxAttendants).map((attendant) => {
        const source = isPlainObject(attendant) ? attendant : {};
        const status = isPlainObject(source.kvbStatus) ? source.kvbStatus : {};
        return {
          name: cleanText(source.name, LIMITS.nameMax),
          telephone: cleanText(source.telephone, 20),
          kvbStatus: {
            registrationNumber: cleanText(status.registrationNumber, LIMITS.registrationNumberMax),
            retention: Boolean(status.retention),
            practice: Boolean(status.practice),
            retentionYear: cleanText(status.retentionYear, 4),
            practiceYear: cleanText(status.practiceYear, 4),
          },
        };
      })
    : [];

  const sanitizedFindings = {};
  for (const section of ['professionalCertificates', 'premises', 'stock', 'disposal']) {
    const sectionSource = isPlainObject(findings[section]) ? findings[section] : {};
    sanitizedFindings[section] = {};
    for (const finding of ALL_FINDINGS.filter((item) => item.sectionKey === section)) {
      const source = isPlainObject(sectionSource[finding.key]) ? sectionSource[finding.key] : {};
      const allowed = getFindingStatuses(finding.path);
      const status = allowed.includes(source.status) ? source.status : 'NOT_ASSESSED';
      sanitizedFindings[section][finding.key] = {
        status,
        remarks: cleanText(source.remarks, 1000),
        assessedAt: source.assessedAt ? new Date(source.assessedAt) : undefined,
      };
    }
  }

  const sanitizeSignatory = (source) => {
    const input2 = isPlainObject(source) ? source : {};
    const signatureData = typeof input2.signatureData === 'string' ? input2.signatureData : undefined;
    return {
      name: cleanText(input2.name, LIMITS.nameMax),
      signatureData:
        signatureData && signatureData.length <= LIMITS.signatureMaxBytes ? signatureData : undefined,
      date: input2.date ? new Date(input2.date) : undefined,
    };
  };

  return stripUndefined({
    inspectionDetails: {
      formNumber: cleanText(inspectionDetails.formNumber, 50),
    },
    outletInformation: {
      outletName: cleanText(outletInformation.outletName, LIMITS.nameMax),
      outletType: OUTLET_TYPES.includes(outletInformation.outletType) ? outletInformation.outletType : undefined,
      otherType: cleanText(outletInformation.otherType, LIMITS.otherTypeMax),
      county: cleanText(outletInformation.county, 80),
      subCounty: cleanText(outletInformation.subCounty, 80),
      centre: cleanText(outletInformation.centre, LIMITS.nameMax),
    },
    ownerInformation: {
      ownerName: cleanText(ownerInformation.ownerName, LIMITS.nameMax),
      address: cleanText(ownerInformation.address, LIMITS.addressMax),
      telephone: cleanText(ownerInformation.telephone, 20),
      trainingLevel: cleanText(ownerInformation.trainingLevel, LIMITS.trainingLevelMax),
      ownerEmail: cleanText(ownerInformation.ownerEmail, 120),
    },
    kvbStatus: {
      registrationNumber: cleanText(kvbStatus.registrationNumber, LIMITS.registrationNumberMax),
      retention: Boolean(kvbStatus.retention),
      practice: Boolean(kvbStatus.practice),
      retentionYear: cleanText(kvbStatus.retentionYear, 4),
      practiceYear: cleanText(kvbStatus.practiceYear, 4),
    },
    attendants,
    products: {
      veterinaryMedicines: {
        category1: Boolean(veterinaryMedicines.category1),
        category2: Boolean(veterinaryMedicines.category2),
        category3: Boolean(veterinaryMedicines.category3),
        category4: Boolean(veterinaryMedicines.category4),
      },
      otherProducts: {
        agricultural: Boolean(otherProducts.agricultural),
        feedsAndSalts: Boolean(otherProducts.feedsAndSalts),
        others: Boolean(otherProducts.others),
        otherDescription: cleanText(otherProducts.otherDescription, LIMITS.maxOtherProductsDescription),
      },
    },
    findings: sanitizedFindings,
    otherComments: cleanText(input.otherComments, LIMITS.otherCommentsMax),
    location: {
      latitude: cleanText(location.latitude, 30),
      longitude: cleanText(location.longitude, 30),
      capturedAt: location.capturedAt ? new Date(location.capturedAt) : undefined,
    },
    signOff: {
      inspector: sanitizeSignatory(signOff.inspector),
      personInCharge: sanitizeSignatory(signOff.personInCharge),
    },
  });
}

function normalizeFormData(input) {
  const sanitized = sanitizeFormData(input);
  const ownerPhone = normalizeKenyanPhone(sanitized.ownerInformation.telephone);
  if (ownerPhone.ok && sanitized.ownerInformation.telephone) {
    sanitized.ownerInformation.telephone = ownerPhone.value;
  }

  sanitized.attendants = sanitized.attendants.map((attendant) => {
    const phone = normalizeKenyanPhone(attendant.telephone);
    if (phone.ok && attendant.telephone) {
      return { ...attendant, telephone: phone.value };
    }
    return attendant;
  });

  return sanitized;
}

function buildFormDataFromOutlet(outlet, { inspectionNumber, inspectionDate, inspectorName }) {
  return normalizeFormData({
    inspectionDetails: { formNumber: outlet.formNumber },
    outletInformation: {
      outletName: outlet.outletName,
      outletType: outlet.outletType,
      otherType: outlet.outletTypeOther,
      county: outlet.county,
      subCounty: outlet.subCounty,
      centre: outlet.centre,
    },
    ownerInformation: {
      ownerName: outlet.ownerName,
      address: outlet.address,
      telephone: outlet.ownerPhone,
      trainingLevel: outlet.ownerTrainingLevel,
      ownerEmail: outlet.ownerEmail,
    },
    kvbStatus: { registrationNumber: outlet.kvbRegistrationInfo },
    signOff: { inspector: { name: inspectorName, date: inspectionDate } },
  });
}

function flattenFormData(source, prefix = '', output = {}) {
  if (isPlainObject(source)) {
    for (const [key, value] of Object.entries(source)) {
      flattenFormData(value, prefix ? `${prefix}.${key}` : key, output);
    }
  } else if (Array.isArray(source)) {
    source.forEach((item, index) => flattenFormData(item, `${prefix}.${index}`, output));
  } else if (source !== undefined) {
    output[prefix] = source;
  }
  return output;
}

const IGNORED_DIFF_PATHS = ['signatureData', '_id', '__v'];

function diffFormData(before, after) {
  const flatBefore = flattenFormData(before || {});
  const flatAfter = flattenFormData(after || {});
  const keys = new Set([...Object.keys(flatBefore), ...Object.keys(flatAfter)]);
  const changes = {};

  for (const key of keys) {
    if (IGNORED_DIFF_PATHS.some((ignored) => key.includes(ignored))) continue;
    const from = flatBefore[key];
    const to = flatAfter[key];
    if (from === to) continue;
    if (from === undefined && (to === null || to === '')) continue;
    if (to === undefined && (from === null || from === '')) continue;
    changes[key] = {
      from: typeof from === 'string' ? from.slice(0, 200) : from,
      to: typeof to === 'string' ? to.slice(0, 200) : to,
    };
  }

  return changes;
}

function collectMarkupErrors(formData) {
  const errors = [];
  const flat = flattenFormData(formData);

  for (const [path, value] of Object.entries(flat)) {
    if (typeof value !== 'string') continue;
    if (path.includes('signatureData')) continue;
    if (containsMarkup(value)) {
      errors.push({ field: `formData.${path}`, message: 'HTML or script content is not permitted in this field.' });
    }
  }

  return errors;
}

function validateDraftPayload({ formData, outletId }) {
  const errors = [];
  const form = formData || {};

  if (outletId !== undefined && !outletId) {
    errors.push({ field: 'outlet', message: 'An outlet must be selected.' });
  }

  const outlet = form.outletInformation || {};
  if (outlet.outletType && !OUTLET_TYPES.includes(outlet.outletType)) {
    errors.push({ field: 'formData.outletInformation.outletType', message: 'Invalid outlet type.' });
  }
  if (outlet.outletType === 'OTHER' && SUBMISSION_REQUIREMENTS.requireOtherType && !outlet.otherType) {
    errors.push({ field: 'formData.outletInformation.otherType', message: 'Specify the other outlet type.' });
  }
  if (outlet.county && !isValidCounty(outlet.county)) {
    errors.push({ field: 'formData.outletInformation.county', message: 'Select a valid county.' });
  }
  if (outlet.subCounty && outlet.county && !isValidSubCounty(outlet.county, outlet.subCounty)) {
    errors.push({ field: 'formData.outletInformation.subCounty', message: 'Select a valid sub-county for the chosen county.' });
  }

  const ownerPhone = normalizeKenyanPhone((form.ownerInformation || {}).telephone);
  if ((form.ownerInformation || {}).telephone && !ownerPhone.ok) {
    errors.push({
      field: 'formData.ownerInformation.telephone',
      message: 'Enter a valid Kenyan telephone number, for example +254712345678.',
    });
  }

  (form.attendants || []).forEach((attendant, index) => {
    if (!attendant || !attendant.telephone) return;
    if (!normalizeKenyanPhone(attendant.telephone).ok) {
      errors.push({
        field: `formData.attendants.${index}.telephone`,
        message: 'Enter a valid Kenyan telephone number, for example +254712345678.',
      });
    }
  });

  if (Array.isArray(form.attendants) && form.attendants.length > LIMITS.maxAttendants) {
    errors.push({ field: 'formData.attendants', message: `A maximum of ${LIMITS.maxAttendants} attendants may be recorded.` });
  }

  const otherProducts = ((form.products || {}).otherProducts) || {};
  if (otherProducts.others && SUBMISSION_REQUIREMENTS.requireOtherProductsDescription && !otherProducts.otherDescription) {
    errors.push({ field: 'formData.products.otherProducts.otherDescription', message: 'Describe the other products stocked.' });
  }

  errors.push(...collectMarkupErrors(form));
  return errors;
}

function validateForSubmission(inspection) {
  const form = inspection.formData || {};
  const outlet = form.outletInformation || {};
  const owner = form.ownerInformation || {};
  const errors = [];
  const policy = SUBMISSION_REQUIREMENTS;

  if (policy.requireInspectionDate && !inspection.inspectionDate) {
    errors.push({ field: 'inspectionDate', message: 'Inspection date is required.' });
  }

  if (policy.requireOutletName && !outlet.outletName) {
    errors.push({ field: 'formData.outletInformation.outletName', message: 'Outlet name is required.' });
  }

  if (policy.requireOutletType && !outlet.outletType) {
    errors.push({ field: 'formData.outletInformation.outletType', message: 'Outlet type is required.' });
  }

  if (policy.requireLocation) {
    if (!outlet.county) {
      errors.push({ field: 'formData.outletInformation.county', message: 'County is required.' });
    }
    if (!outlet.subCounty) {
      errors.push({ field: 'formData.outletInformation.subCounty', message: 'Sub-county is required.' });
    }
  }

  if (policy.requireOwnerName && !owner.ownerName) {
    errors.push({ field: 'formData.ownerInformation.ownerName', message: 'Owner name is required.' });
  }

  if (policy.requireFindingsAssessed) {
    for (const finding of ALL_FINDINGS) {
      const value = getByPath(form.findings, finding.path);
      if (!value || value.status === 'NOT_ASSESSED') {
        errors.push({
          field: `formData.findings.${finding.path}`,
          message: `${finding.label} must be assessed before submission.`,
        });
      }
    }
  }

  if (policy.requireInspectorSignOff) {
    const inspector = ((form.signOff || {}).inspector) || {};
    if (!inspector.name) {
      errors.push({ field: 'formData.signOff.inspector.name', message: 'Inspector name is required.' });
    }
    if (!inspector.date) {
      errors.push({ field: 'formData.signOff.inspector.date', message: 'Inspector sign-off date is required.' });
    }
  }

  if (policy.requirePersonInChargeSignOff) {
    const personInCharge = ((form.signOff || {}).personInCharge) || {};
    if (!personInCharge.name) {
      errors.push({ field: 'formData.signOff.personInCharge.name', message: 'Name of person in charge is required.' });
    }
  }

  if (!inspection.outlet) {
    errors.push({ field: 'outlet', message: 'An outlet must be selected.' });
  }

  errors.push(...validateDraftPayload({ formData: form, outletId: inspection.outlet }));
  return errors;
}

function computeComplianceSummary(formData) {
  const findings = (formData || {}).findings || {};
  const summary = {
    total: ALL_FINDINGS.length,
    assessed: 0,
    compliant: 0,
    nonCompliant: 0,
    notApplicable: 0,
    notAssessed: 0,
    complianceRate: 0,
  };

  for (const finding of ALL_FINDINGS) {
    const value = getByPath(findings, finding.path);
    const status = value ? value.status : 'NOT_ASSESSED';
    if (status === 'NOT_ASSESSED') {
      summary.notAssessed += 1;
    } else if (COMPLIANT_STATUSES.has(status)) {
      summary.assessed += 1;
      summary.compliant += 1;
    } else {
      summary.assessed += 1;
      summary.nonCompliant += 1;
    }
  }

  summary.complianceRate = summary.assessed === 0 ? 0 : Math.round((summary.compliant / summary.assessed) * 100);
  return summary;
}

function isEditable(inspection) {
  return !inspection.isLocked && !LOCKED_STATES.includes(inspection.status) && EDITABLE_STATES.includes(inspection.status);
}

function canAccessInspection(inspection, user) {
  const owner = inspection.inspector && (inspection.inspector._id || inspection.inspector);
  const isOwner = owner && owner.toString() === user._id.toString();

  switch (user.role) {
    case 'INSPECTOR':
      return Boolean(isOwner);
    case 'DIRECTOR':
      return ['SUBMITTED', 'PENDING_DIRECTOR_REVIEW', 'DIRECTOR_APPROVED', 'RETURNED_TO_INSPECTOR', 'FINAL_APPROVED'].includes(inspection.status);
    case 'CEO_REGISTRAR':
      return ['DIRECTOR_APPROVED', 'PENDING_CEO_REVIEW', 'RETURNED_TO_INSPECTOR', 'FINAL_APPROVED'].includes(inspection.status);
    case 'SYSTEM_ADMIN':
      return true;
    default:
      return false;
  }
}

module.exports = {
  EDITABLE_STATES,
  LOCKED_STATES,
  isEditable,
  canAccessInspection,
  isPlainObject,
  isTraversable,
  deepMerge,
  getByPath,
  flattenFormData,
  containsMarkup,
  normalizeKenyanPhone,
  sanitizeFormData,
  normalizeFormData,
  buildFormDataFromOutlet,
  diffFormData,
  validateDraftPayload,
  validateForSubmission,
  computeComplianceSummary,
};
