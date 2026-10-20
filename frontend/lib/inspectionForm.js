export const FALLBACK_FINDING_STATUSES = [
  { value: 'NOT_ASSESSED', label: 'Not Assessed', glyph: '—' },
  { value: 'Yes', label: 'Yes', glyph: '✓' },
  { value: 'No', label: 'No', glyph: '✗' },
  { value: 'Accessible', label: 'Accessible', glyph: '✓' },
  { value: 'Partially Accessible', label: 'Partially Accessible', glyph: '!' },
  { value: 'Inaccessible', label: 'Inaccessible', glyph: '✗' },
  { value: 'Not Suitable', label: 'Not Suitable', glyph: '!' },
  { value: 'Permanent', label: 'Permanent', glyph: '✓' },
  { value: 'Semi-Permanent', label: 'Semi-Permanent', glyph: '!' },
  { value: 'Temporary', label: 'Temporary', glyph: '!' },
  { value: 'Containerized', label: 'Containerized', glyph: '!' },
  { value: 'Adequate', label: 'Adequate', glyph: '✓' },
  { value: 'Fair', label: 'Fair', glyph: '!' },
  { value: 'Poor', label: 'Poor', glyph: '✗' },
  { value: 'Inadequate', label: 'Inadequate', glyph: '✗' },
  { value: 'Good', label: 'Good', glyph: '✓' },
  { value: 'Moderate', label: 'Moderate', glyph: '!' },
  { value: 'Limited', label: 'Limited', glyph: '✗' },
  { value: 'Congested', label: 'Congested', glyph: '✗' },
  { value: 'Well Arranged', label: 'Well Arranged', glyph: '✓' },
  { value: 'Fairly Arranged', label: 'Fairly Arranged', glyph: '!' },
  { value: 'Poorly Arranged', label: 'Poorly Arranged', glyph: '✗' },
  { value: 'Haphazard', label: 'Haphazard', glyph: '✗' },
  { value: 'Properly Stored', label: 'Properly Stored', glyph: '✓' },
  { value: 'Fairly Stored', label: 'Fairly Stored', glyph: '!' },
  { value: 'Poorly Stored', label: 'Poorly Stored', glyph: '✗' },
  { value: 'Improperly Stored', label: 'Improperly Stored', glyph: '✗' },
  { value: 'Compliant', label: 'Compliant', glyph: '✓' },
  { value: 'Partially Compliant', label: 'Partially Compliant', glyph: '!' },
  { value: 'Non-Compliant', label: 'Non-Compliant', glyph: '✗' },
  { value: 'Suspected Counterfeit/Unfit', label: 'Suspected Counterfeit/Unfit', glyph: '!' },
  { value: 'Properly Disposed', label: 'Properly Disposed', glyph: '✓' },
  { value: 'Awaiting Disposal', label: 'Awaiting Disposal', glyph: '!' },
  { value: 'Improperly Stores', label: 'Improperly Stores', glyph: '✗' },
  { value: 'No proper Disposal System', label: 'No proper Disposal System', glyph: '✗' },
];

export const FALLBACK_FINDING_SECTIONS = [
  {
    key: 'professionalCertificates',
    number: '(a)',
    title: 'Display of Professional Certificates',
    items: [
      { key: 'owner', label: 'Owner', statuses: ['NOT_ASSESSED', 'Yes', 'No'] },
      { key: 'attendants', label: 'Attendant(s)', statuses: ['NOT_ASSESSED', 'Yes', 'No'] },
      { key: 'licenses', label: 'Licenses', statuses: ['NOT_ASSESSED', 'Yes', 'No'] },
    ],
  },
  {
    key: 'premises',
    number: '(b)',
    title: 'Premises',
    items: [
      { key: 'site', label: 'Site', statuses: ['NOT_ASSESSED', 'Accessible', 'Partially Accessible', 'Inaccessible', 'Not Suitable'] },
      { key: 'building', label: 'Building', statuses: ['NOT_ASSESSED', 'Permanent', 'Semi-Permanent', 'Temporary', 'Containerized'] },
      { key: 'ventilation', label: 'Ventilation', statuses: ['NOT_ASSESSED', 'Adequate', 'Fair', 'Poor', 'Inadequate'] },
      { key: 'floorAndWalls', label: 'Floor and Walls', statuses: ['NOT_ASSESSED', 'Good', 'Fair', 'Poor', 'Inadequate'] },
      { key: 'space', label: 'Space', statuses: ['NOT_ASSESSED', 'Adequate', 'Moderate', 'Limited', 'Congested'] },
    ],
  },
  {
    key: 'stock',
    number: '(c)',
    title: 'Stock',
    items: [
      { key: 'arrangementOfStock', label: 'Arrangement of Stock', statuses: ['NOT_ASSESSED', 'Well Arranged', 'Fairly Arranged', 'Poorly Arranged', 'Haphazard'] },
      { key: 'storageOfStock', label: 'Storage of Stock', statuses: ['NOT_ASSESSED', 'Properly Stored', 'Fairly Stored', 'Poorly Stored', 'Improperly Stored'] },
      { key: 'authenticityLabellingValidity', label: 'Authenticity, Labelling and Validity', statuses: ['NOT_ASSESSED', 'Compliant', 'Partially Compliant', 'Non-Compliant', 'Suspected Counterfeit/Unfit'] },
    ],
  },
  {
    key: 'disposal',
    number: '(d)',
    title: 'Disposal of Drugs',
    items: [
      { key: 'expiredDrugsAndOtherChemicals', label: 'Disposal of expired drugs and other chemicals', statuses: ['NOT_ASSESSED', 'Properly Disposed', 'Awaiting Disposal', 'Improperly Stores', 'No proper Disposal System'] },
    ],
  },
];

export const PRODUCT_GROUPS = [
  {
    key: 'veterinaryMedicines',
    title: 'Veterinary Medicines',
    items: [
      { key: 'category1', label: 'Category 1' },
      { key: 'category2', label: 'Category 2' },
      { key: 'category3', label: 'Category 3' },
      { key: 'category4', label: 'Category 4' },
    ],
  },
  {
    key: 'otherProducts',
    title: 'Other Products',
    items: [
      { key: 'agricultural', label: 'Agricultural' },
      { key: 'feedsAndSalts', label: 'Feeds and Salts' },
      { key: 'others', label: 'Others' },
    ],
  },
];

export const OUTLET_TYPES = ['AGROVET', 'CHEMIST', 'OTHER'];

export const OUTLET_TYPE_OPTIONS = [
  { value: 'AGROVET', label: 'Agrovet' },
  { value: 'CHEMIST', label: 'Chemist' },
  { value: 'OTHER', label: 'Others' },
];

/**
 * Section 4(i) of the KVB questionnaire asks for the owner's "Level of
 * Training in Animal Health". The paper form offers a fixed set, so the
 * portal presents a dropdown. The backend serves the authoritative list via
 * GET /api/inspection-form/schema; this is the offline fallback.
 */
export const FALLBACK_TRAINING_LEVELS = [
  'Certificate in Animal Health',
  'Diploma in Animal Health',
  'Degree in Animal Health',
  'No Formal Training',
];

/**
 * Build the option list for the training-level dropdown. A record saved
 * before the dropdown existed may carry a free-text qualification; that value
 * is appended so it is displayed and preserved instead of silently becoming
 * blank on the next save.
 */
export function trainingLevelOptions(trainingLevels = FALLBACK_TRAINING_LEVELS, currentValue = '') {
  const options = [...(trainingLevels || [])];
  const current = String(currentValue || '').trim();
  if (current && !options.some((option) => option.toLowerCase() === current.toLowerCase())) {
    options.push(current);
  }
  return options;
}

export const MAX_ATTENDANTS = 10;
export const LIMITS = {
  nameMax: 150,
  addressMax: 300,
  findingRemarksMax: 1000,
  otherCommentsMax: 2000,
  otherTypeMax: 100,
  otherProductsDescriptionMax: 200,
  registrationNumberMax: 50,
  trainingLevelMax: 150,
};

export const STEPS = [
  { id: 'inspection', label: 'Inspection' },
  { id: 'outlet', label: 'Outlet' },
  { id: 'owner', label: 'Owner' },
  { id: 'attendants', label: 'Attendants' },
  { id: 'products', label: 'Products' },
  { id: 'findings', label: 'Findings' },
  { id: 'signoff', label: 'Sign-Off' },
  { id: 'review', label: 'Review' },
];

export function emptyFindings(sections = FALLBACK_FINDING_SECTIONS) {
  return sections.reduce((acc, section) => {
    acc[section.key] = section.items.reduce((items, item) => {
      items[item.key] = { status: 'NOT_ASSESSED' };
      return items;
    }, {});
    return acc;
  }, {});
}

export function createEmptyFormData({ inspectorName = '', inspectionDate = '' } = {}) {
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
    kvbStatus: { registrationNumber: '', retention: false, practice: false, retentionYear: '', practiceYear: '' },
    attendants: [
      { name: '', telephone: '', kvbStatus: { registrationNumber: '', retention: false, practice: false, retentionYear: '', practiceYear: '' } },
      { name: '', telephone: '', kvbStatus: { registrationNumber: '', retention: false, practice: false, retentionYear: '', practiceYear: '' } },
    ],
    products: {
      veterinaryMedicines: { category1: false, category2: false, category3: false, category4: false },
      otherProducts: { agricultural: false, feedsAndSalts: false, others: false, otherDescription: '' },
    },
    findings: emptyFindings(),
    otherComments: '',
    location: { latitude: '', longitude: '', capturedAt: '' },
    signOff: {
      inspector: { name: inspectorName, signatureData: '', date: inspectionDate },
      personInCharge: { name: '', signatureData: '', date: '' },
    },
  };
}

export function mergeFormData(loaded, { inspectorName = '', inspectionDate = '' } = {}) {
  const base = createEmptyFormData({ inspectorName, inspectionDate });
  if (!loaded) return base;

  const mergeSection = (fallback, incoming) => {
    if (!incoming || typeof incoming !== 'object') return fallback;
    return { ...fallback, ...incoming };
  };

  const sections = FALLBACK_FINDING_SECTIONS.map((section) => {
    const incomingSection = (loaded.findings || {})[section.key] || {};
    const items = section.items.reduce((acc, item) => {
      const source = incomingSection[item.key] || {};
      acc[item.key] = { ...base.findings[section.key][item.key], ...source };
      return acc;
    }, {});
    return [section.key, items];
  });

  const attendants = Array.isArray(loaded.attendants) && loaded.attendants.length > 0
    ? loaded.attendants.map((attendant) => {
        const source = attendant?.kvbStatus || {};
        return {
          name: attendant?.name || '',
          telephone: attendant?.telephone || '',
          kvbStatus: {
            registrationNumber: source.registrationNumber || '',
            retention: Boolean(source.retention),
            practice: Boolean(source.practice),
            retentionYear: source.retentionYear || '',
            practiceYear: source.practiceYear || '',
          },
        };
      })
    : base.attendants;

  return {
    inspectionDetails: mergeSection(base.inspectionDetails, loaded.inspectionDetails),
    outletInformation: mergeSection(base.outletInformation, loaded.outletInformation),
    ownerInformation: mergeSection(base.ownerInformation, loaded.ownerInformation),
    kvbStatus: mergeSection(base.kvbStatus, loaded.kvbStatus),
    attendants,
    products: {
      veterinaryMedicines: mergeSection(base.products.veterinaryMedicines, loaded.products?.veterinaryMedicines),
      otherProducts: mergeSection(base.products.otherProducts, loaded.products?.otherProducts),
    },
    findings: Object.fromEntries(sections),
    otherComments: loaded.otherComments || '',
    location: mergeSection(base.location, loaded.location),
    signOff: {
      inspector: mergeSection(base.signOff.inspector, loaded.signOff?.inspector),
      personInCharge: mergeSection(base.signOff.personInCharge, loaded.signOff?.personInCharge),
    },
  };
}

export function getFinding(formData, sectionKey, itemKey) {
  return formData?.findings?.[sectionKey]?.[itemKey] || { status: 'NOT_ASSESSED' };
}

export function getFindingStatuses(path) {
  for (const section of FALLBACK_FINDING_SECTIONS) {
    for (const item of section.items) {
      if (`${section.key}.${item.key}` === path) return item.statuses || ['NOT_ASSESSED'];
    }
  }
  return ['NOT_ASSESSED'];
}

export function findStatusOptions(sectionKey, itemKey) {
  for (const section of FALLBACK_FINDING_SECTIONS) {
    if (section.key !== sectionKey) continue;
    const item = section.items.find((entry) => entry.key === itemKey);
    return item?.statuses || ['NOT_ASSESSED'];
  }
  return ['NOT_ASSESSED'];
}

export function summarizeFindings(formData, sections = FALLBACK_FINDING_SECTIONS) {
  const summary = { total: 0, assessed: 0, compliant: 0, nonCompliant: 0, notAssessed: 0 };

  for (const section of sections) {
    for (const item of section.items) {
      summary.total += 1;
      const status = getFinding(formData, section.key, item.key).status;
      if (status === 'NOT_ASSESSED') summary.notAssessed += 1;
      else {
        summary.assessed += 1;
        if (status === 'Yes') summary.compliant += 1;
        else if (status === 'Accessible' || status === 'Permanent' || status === 'Adequate' || status === 'Good' || status === 'Well Arranged' || status === 'Properly Stored' || status === 'Compliant' || status === 'Properly Disposed') summary.compliant += 1;
        else if (status === 'No' || status === 'Inaccessible' || status === 'Temporary' || status === 'Inadequate' || status === 'Poorly Arranged' || status === 'Improperly Stored' || status === 'Non-Compliant' || status === 'No proper Disposal System' || status === 'Suspected Counterfeit/Unfit') summary.nonCompliant += 1;
      }
    }
  }

  return summary;
}

export function collectStepErrors({ step, formData, outletId, inspectionDate, sections = FALLBACK_FINDING_SECTIONS }) {
  const errors = {};

  const context = { outletId, inspectionDate };

  const check = (path) => {
    const message = validateFieldPath(path, formData, context);
    if (message) errors[path] = message;
  };

  if (step === 'inspection') {
    check('inspectionDate');
  }

  if (step === 'outlet') {
    check('outlet');
    check('formData.outletInformation.outletName');
    check('formData.outletInformation.outletType');
    check('formData.outletInformation.otherType');
    check('formData.outletInformation.county');
    check('formData.outletInformation.subCounty');
    check('formData.location.latitude');
    check('formData.location.longitude');
  }

  if (step === 'owner') {
    check('formData.ownerInformation.ownerName');
    check('formData.ownerInformation.telephone');
    check('formData.ownerInformation.trainingLevel');
  }

  if (step === 'attendants') {
    formData.attendants.forEach((attendant, index) => {
      const hasContent = attendant.name.trim() || attendant.telephone.trim() || attendant.kvbStatus.registrationNumber.trim();
      if (!hasContent) return;
      check(`formData.attendants.${index}.name`);
      check(`formData.attendants.${index}.telephone`);
    });
  }

  if (step === 'products') {
    check('formData.products.otherProducts.otherDescription');
  }

  if (step === 'findings') {
    sections.forEach((section) => {
      section.items.forEach((item) => {
        check(`formData.findings.${section.key}.${item.key}`);
      });
    });
  }

  if (step === 'signoff') {
    check('formData.signOff.inspector.name');
    check('formData.signOff.inspector.date');
  }

  return errors;
}

export function validateTelephone(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return null;
  const compact = trimmed.replace(/[^0-9+]/g, '');
  const isMobile = /^(\+?254|0)?[17]\d{8}$/.test(compact);
  const isLandline = /^(\+?254|0)[2-9]\d{8}$/.test(compact);
  if (!isMobile && !isLandline) return 'Enter a valid Kenyan number, for example +254712345678.';
  return null;
}

/**
 * Validate a single field and return an error message, or null when the
 * value is acceptable.
 *
 * This is the single source of truth for field-level rules. `collectStepErrors`
 * uses it to build the error map for a whole step, and the form hook calls it
 * on every keystroke so an error disappears the instant the user fixes the
 * field (and reappears if they break it again).
 */
export function validateFieldPath(path, formData = {}, context = {}) {
  const outlet = formData.outletInformation || {};
  const owner = formData.ownerInformation || {};
  const location = formData.location || {};
  const products = formData.products || {};
  const signOff = formData.signOff || {};
  const findings = formData.findings || {};

  switch (path) {
    case 'inspectionDate':
      return context.inspectionDate ? null : 'Inspection date is required.';

    case 'outlet':
      return context.outletId ? null : 'Select the outlet being inspected.';

    case 'formData.outletInformation.outletName': {
      const value = (outlet.outletName || '').trim();
      if (!value) return 'Name of outlet is required.';
      if (value.length < 2) return 'Must be at least 2 characters.';
      if (value.length > LIMITS.nameMax) return `Must not exceed ${LIMITS.nameMax} characters.`;
      return null;
    }

    case 'formData.outletInformation.outletType':
      return outlet.outletType ? null : 'Type of outlet is required.';

    case 'formData.outletInformation.otherType':
      if (outlet.outletType !== 'OTHER') return null;
      return (outlet.otherType || '').trim()
        ? null
        : 'Specify the other outlet type.';

    case 'formData.outletInformation.county':
      return outlet.county ? null : 'County is required.';

    case 'formData.outletInformation.subCounty':
      return outlet.subCounty ? null : 'Sub-county is required.';

    case 'formData.ownerInformation.ownerName': {
      const value = (owner.ownerName || '').trim();
      if (!value) return "Owner's name is required.";
      if (value.length < 2) return 'Must be at least 2 characters.';
      if (value.length > LIMITS.nameMax) return `Must not exceed ${LIMITS.nameMax} characters.`;
      return null;
    }

    case 'formData.ownerInformation.telephone':
      return validateTelephone(owner.telephone);

    case 'formData.ownerInformation.trainingLevel': {
      const value = (owner.trainingLevel || '').trim();
      if (!value) return null;
      if (value.length > LIMITS.trainingLevelMax) {
        return `Must not exceed ${LIMITS.trainingLevelMax} characters.`;
      }
      return null;
    }

    case 'formData.location.latitude': {
      const value = (location.latitude || '').trim();
      if (!value) return null;
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return 'Latitude must be a number.';
      if (parsed < -90 || parsed > 90) return 'Latitude must be between -90 and 90.';
      return null;
    }

    case 'formData.location.longitude': {
      const value = (location.longitude || '').trim();
      if (!value) return null;
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return 'Longitude must be a number.';
      if (parsed < -180 || parsed > 180) return 'Longitude must be between -180 and 180.';
      return null;
    }

    case 'formData.products.otherProducts.otherDescription': {
      const others = (products.otherProducts || {}).others;
      if (!others) return null;
      return (products.otherProducts || {}).otherDescription?.trim()
        ? null
        : 'Describe the other products stocked.';
    }

    case 'formData.signOff.inspector.name':
      return (signOff.inspector || {}).name?.trim() ? null : 'Inspector name is required.';

    case 'formData.signOff.inspector.date':
      return (signOff.inspector || {}).date ? null : 'Inspector sign-off date is required.';

    default:
      break;
  }

  // formData.attendants.<index>.<field>
  const attendantMatch = /^formData\.attendants\.(\d+)\.(name|telephone)$/.exec(path);
  if (attendantMatch) {
    const index = Number(attendantMatch[1]);
    const field = attendantMatch[2];
    const attendant = (formData.attendants || [])[index] || {};
    const hasContent =
      (attendant.name || '').trim() ||
      (attendant.telephone || '').trim() ||
      ((attendant.kvbStatus || {}).registrationNumber || '').trim();

    if (field === 'name') {
      if (!hasContent) return null;
      return (attendant.name || '').trim() ? null : 'Enter the attendant name or clear this row.';
    }
    if (!hasContent) return null;
    return validateTelephone(attendant.telephone);
  }

  // formData.findings.<sectionKey>.<itemKey>
  if (path.startsWith('formData.findings.')) {
    const rest = path.slice('formData.findings.'.length);
    const dot = rest.indexOf('.');
    if (dot > 0) {
      const sectionKey = rest.slice(0, dot);
      const itemKey = rest.slice(dot + 1);
      const status = ((findings[sectionKey] || {})[itemKey] || {}).status;
      return status && status !== 'NOT_ASSESSED' ? null : 'Assess this item before continuing.';
    }
  }

  return null;
}

export function validateField(field, value) {
  if (typeof value !== 'string') return null;
  if (field.endsWith('outletName') || field.endsWith('ownerName')) {
    if (value.trim() && value.trim().length < 2) return 'Must be at least 2 characters.';
    if (value.length > LIMITS.nameMax) return `Must not exceed ${LIMITS.nameMax} characters.`;
  }
  if (field.endsWith('address') && value.length > LIMITS.addressMax) {
    return `Must not exceed ${LIMITS.addressMax} characters.`;
  }
  if (field === 'otherComments' && value.length > LIMITS.otherCommentsMax) {
    return `Must not exceed ${LIMITS.otherCommentsMax} characters.`;
  }
  return null;
}

export function formatDisplayDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function toDateInputValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export function statusLabel(value) {
  const all = FALLBACK_FINDING_STATUSES;
  return all.find((entry) => entry.value === value)?.label || value;
}
