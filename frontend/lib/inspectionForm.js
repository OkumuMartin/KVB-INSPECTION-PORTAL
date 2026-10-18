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

  const setError = (field, message) => {
    errors[field] = message;
  };

  if (step === 'inspection') {
    if (!inspectionDate) setError('inspectionDate', 'Inspection date is required.');
  }

  if (step === 'outlet') {
    if (!outletId) setError('outlet', 'Select the outlet being inspected.');
    if (!formData.outletInformation.outletName.trim()) {
      setError('formData.outletInformation.outletName', 'Name of outlet is required.');
    }
    if (!formData.outletInformation.outletType) {
      setError('formData.outletInformation.outletType', 'Type of outlet is required.');
    }
    if (formData.outletInformation.outletType === 'OTHER' && !formData.outletInformation.otherType.trim()) {
      setError('formData.outletInformation.otherType', 'Specify the other outlet type.');
    }
    if (!formData.outletInformation.county) setError('formData.outletInformation.county', 'County is required.');
    if (!formData.outletInformation.subCounty) {
      setError('formData.outletInformation.subCounty', 'Sub-county is required.');
    }
  }

  if (step === 'owner') {
    if (!formData.ownerInformation.ownerName.trim()) {
      setError('formData.ownerInformation.ownerName', "Owner's name is required.");
    }
    const phoneError = validateTelephone(formData.ownerInformation.telephone);
    if (phoneError) setError('formData.ownerInformation.telephone', phoneError);
  }

  if (step === 'attendants') {
    formData.attendants.forEach((attendant, index) => {
      const hasContent = attendant.name.trim() || attendant.telephone.trim() || attendant.kvbStatus.registrationNumber.trim();
      if (!hasContent) return;
      if (!attendant.name.trim()) {
        setError(`formData.attendants.${index}.name`, 'Enter the attendant name or clear this row.');
      }
      const phoneError = validateTelephone(attendant.telephone);
      if (phoneError) setError(`formData.attendants.${index}.telephone`, phoneError);
    });
  }

  if (step === 'products') {
    const { otherProducts } = formData.products;
    if (otherProducts.others && !otherProducts.otherDescription.trim()) {
      setError('formData.products.otherProducts.otherDescription', 'Describe the other products stocked.');
    }
  }

  if (step === 'findings') {
    sections.forEach((section) => {
      section.items.forEach((item) => {
        const finding = getFinding(formData, section.key, item.key);
        if (finding.status === 'NOT_ASSESSED') {
          setError(`formData.findings.${section.key}.${item.key}`, 'Assess this item before continuing.');
        }
      });
    });
  }

  if (step === 'signoff') {
    if (!formData.signOff.inspector.name.trim()) {
      setError('formData.signOff.inspector.name', 'Inspector name is required.');
    }
    if (!formData.signOff.inspector.date) {
      setError('formData.signOff.inspector.date', 'Inspector sign-off date is required.');
    }
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
