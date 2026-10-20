const FINDING_STATUS_LABELS = {
  NOT_ASSESSED: 'Not Assessed',
  Yes: 'Yes',
  No: 'No',
  Accessible: 'Accessible',
  'Partially Accessible': 'Partially Accessible',
  Inaccessible: 'Inaccessible',
  'Not Suitable': 'Not Suitable',
  Permanent: 'Permanent',
  'Semi-Permanent': 'Semi-Permanent',
  Temporary: 'Temporary',
  Containerized: 'Containerized',
  Adequate: 'Adequate',
  Fair: 'Fair',
  Poor: 'Poor',
  Inadequate: 'Inadequate',
  Good: 'Good',
  Moderate: 'Moderate',
  Limited: 'Limited',
  Congested: 'Congested',
  'Well Arranged': 'Well Arranged',
  'Fairly Arranged': 'Fairly Arranged',
  'Poorly Arranged': 'Poorly Arranged',
  Haphazard: 'Haphazard',
  'Properly Stored': 'Properly Stored',
  'Fairly Stored': 'Fairly Stored',
  'Poorly Stored': 'Poorly Stored',
  'Improperly Stored': 'Improperly Stored',
  Compliant: 'Compliant',
  'Partially Compliant': 'Partially Compliant',
  'Non-Compliant': 'Non-Compliant',
  'Suspected Counterfeit/Unfit': 'Suspected Counterfeit/Unfit',
  'Properly Disposed': 'Properly Disposed',
  'Awaiting Disposal': 'Awaiting Disposal',
  'Improperly Stores': 'Improperly Stores',
  'No proper Disposal System': 'No proper Disposal System',
};

const FINDING_STATUS_GLYPHS = {
  NOT_ASSESSED: '—',
  Yes: '✓',
  No: '✗',
  Accessible: '✓',
  'Partially Accessible': '!',
  Inaccessible: '✗',
  'Not Suitable': '!',
  Permanent: '✓',
  'Semi-Permanent': '!',
  Temporary: '!',
  Containerized: '!',
  Adequate: '✓',
  Fair: '!',
  Poor: '✗',
  Inadequate: '✗',
  Good: '✓',
  Moderate: '!',
  Limited: '✗',
  Congested: '✗',
  'Well Arranged': '✓',
  'Fairly Arranged': '!',
  'Poorly Arranged': '✗',
  Haphazard: '✗',
  'Properly Stored': '✓',
  'Fairly Stored': '!',
  'Poorly Stored': '✗',
  'Improperly Stored': '✗',
  Compliant: '✓',
  'Partially Compliant': '!',
  'Non-Compliant': '✗',
  'Suspected Counterfeit/Unfit': '!',
  'Properly Disposed': '✓',
  'Awaiting Disposal': '!',
  'Improperly Stores': '✗',
  'No proper Disposal System': '✗',
};

const LIMITS = {
  nameMin: 2,
  nameMax: 150,
  addressMax: 300,
  otherTypeMax: 100,
  registrationNumberMax: 50,
  trainingLevelMax: 150,
  findingRemarksMax: 1000,
  otherCommentsMax: 2000,
  signatureMaxBytes: 400000,
  maxAttendants: 10,
  maxOtherProductsDescription: 200,
};

/**
 * Section 4(i) of the KVB questionnaire asks for the owner's "Level of
 * Training in Animal Health". The paper form offers a fixed set, so the
 * portal presents a dropdown and the server rejects anything outside it.
 */
const TRAINING_LEVELS = [
  'Certificate in Animal Health',
  'Diploma in Animal Health',
  'Degree in Animal Health',
  'No Formal Training',
];

const FINDING_SECTIONS = [
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

/**
 * The first non-NOT_ASSESSED status for each finding is the "best" outcome
 * (e.g. "Yes", "Accessible", "Permanent", "Adequate", "Good", "Well Arranged",
 * "Properly Stored", "Compliant", "Properly Disposed"). These are the statuses
 * that count toward the compliance rate.
 *
 * Derived from FINDING_SECTIONS so adding a new finding automatically
 * registers its compliant status — no hardcoded list to maintain.
 */
const COMPLIANT_STATUSES = new Set(
  FINDING_SECTIONS.flatMap((section) =>
    section.items
      .map((item) => item.statuses.find((status) => status !== 'NOT_ASSESSED'))
      .filter(Boolean),
  ),
);

const PRODUCT_GROUPS = [
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

const ALL_FINDINGS = FINDING_SECTIONS.flatMap((section) =>
  section.items.map((item) => ({
    path: `${section.key}.${item.key}`,
    sectionKey: section.key,
    sectionTitle: section.title,
    key: item.key,
    label: item.label,
    statuses: item.statuses,
  })),
);

const ALL_PRODUCTS = PRODUCT_GROUPS.flatMap((group) =>
  group.items.map((item) => ({
    path: `${group.key}.${item.key}`,
    groupKey: group.key,
    key: item.key,
    label: item.label,
  })),
);

const SUBMISSION_REQUIREMENTS = {
  requireInspectionDate: true,
  requireOutletName: true,
  requireOutletType: true,
  requireLocation: true,
  requireOwnerName: true,
  requireFindingsAssessed: true,
  requireInspectorSignOff: true,
  requirePersonInChargeSignOff: false,
  requireOtherType: true,
  requireOtherProductsDescription: true,
};

function buildFormSchema() {
  return {
    version: 1,
    findingSections: FINDING_SECTIONS.map((section) => ({
      key: section.key,
      number: section.number,
      title: section.title,
      items: section.items.map((item) => ({
        key: item.key,
        label: item.label,
        statuses: item.statuses,
      })),
    })),
    productGroups: PRODUCT_GROUPS.map((group) => ({
      key: group.key,
      title: group.title,
      items: group.items.map((item) => ({
        key: item.key,
        label: item.label,
      })),
    })),
    limits: LIMITS,
    trainingLevels: TRAINING_LEVELS,
    submissionRequirements: SUBMISSION_REQUIREMENTS,
    maxAttendants: LIMITS.maxAttendants,
  };
}

function getFindingLabels() {
  return ALL_FINDINGS.reduce((acc, finding) => {
    acc[finding.path] = finding.label;
    return acc;
  }, {});
}

function getFindingStatuses(path) {
  const finding = ALL_FINDINGS.find((entry) => entry.path === path);
  return finding?.statuses || [];
}

module.exports = {
  FINDING_STATUS_LABELS,
  FINDING_STATUS_GLYPHS,
  FINDING_SECTIONS,
  ALL_FINDINGS,
  PRODUCT_GROUPS,
  ALL_PRODUCTS,
  LIMITS,
  TRAINING_LEVELS,
  SUBMISSION_REQUIREMENTS,
  COMPLIANT_STATUSES,
  buildFormSchema,
  getFindingLabels,
  getFindingStatuses,
};
