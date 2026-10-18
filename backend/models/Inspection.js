const mongoose = require('mongoose');
const { LIMITS } = require('../config/inspectionFormConfig');
const { OUTLET_TYPES } = require('./Outlet');

const WORKFLOW_STATES = [
  'DRAFT',
  'SUBMITTED',
  'PENDING_DIRECTOR_REVIEW',
  'DIRECTOR_APPROVED',
  'PENDING_CEO_REVIEW',
  'RETURNED_TO_INSPECTOR',
  'FINAL_APPROVED',
];

const VALID_TRANSITIONS = {
  DRAFT: ['SUBMITTED', 'PENDING_DIRECTOR_REVIEW'],
  SUBMITTED: ['PENDING_DIRECTOR_REVIEW'],
  PENDING_DIRECTOR_REVIEW: ['DIRECTOR_APPROVED', 'RETURNED_TO_INSPECTOR'],
  DIRECTOR_APPROVED: ['PENDING_CEO_REVIEW', 'RETURNED_TO_INSPECTOR'],
  PENDING_CEO_REVIEW: ['FINAL_APPROVED', 'RETURNED_TO_INSPECTOR', 'PENDING_DIRECTOR_REVIEW'],
  RETURNED_TO_INSPECTOR: ['SUBMITTED'],
  FINAL_APPROVED: [],
};

const EDITABLE_STATES = ['DRAFT', 'RETURNED_TO_INSPECTOR'];

const trimString = { type: String, trim: true };

const kvbStatusSchema = new mongoose.Schema(
  {
    registrationNumber: { ...trimString, maxlength: [LIMITS.registrationNumberMax, `Registration number must not exceed ${LIMITS.registrationNumberMax} characters.`] },
    retention: { type: Boolean, default: false },
    practice: { type: Boolean, default: false },
    retentionYear: { ...trimString, maxlength: [4, 'Year must be 4 digits.'] },
    practiceYear: { ...trimString, maxlength: [4, 'Year must be 4 digits.'] },
  },
  { _id: false },
);

const attendantSchema = new mongoose.Schema(
  {
    name: { ...trimString, maxlength: [LIMITS.nameMax, `Attendant name must not exceed ${LIMITS.nameMax} characters.`] },
    telephone: trimString,
    kvbStatus: { type: kvbStatusSchema, default: () => ({}) },
  },
  { _id: false },
);

const findingSchema = new mongoose.Schema(
  {
    status: { type: String, default: 'NOT_ASSESSED' },
    remarks: { type: String, trim: true, maxlength: [1000, 'Finding remarks must not exceed 1000 characters.'] },
    assessedAt: Date,
  },
  { _id: false },
);

function findingGroup(keys) {
  const shape = {};
  for (const key of keys) {
    shape[key] = { type: findingSchema, default: () => ({}) };
  }
  return shape;
}

const findingsSchema = new mongoose.Schema(
  {
    professionalCertificates: { type: new mongoose.Schema(findingGroup(['owner', 'attendants', 'licenses']), { _id: false }), default: () => ({}) },
    premises: {
      type: new mongoose.Schema(findingGroup(['site', 'building', 'ventilation', 'floorAndWalls', 'space']), { _id: false }),
      default: () => ({}),
    },
stock: {
      type: new mongoose.Schema(findingGroup(['arrangementOfStock', 'storageOfStock', 'authenticityLabellingValidity']), { _id: false }),
      default: () => ({}),
    },
    disposal: { type: new mongoose.Schema(findingGroup(['expiredDrugsAndOtherChemicals']), { _id: false }), default: () => ({}) },
  },
  { _id: false },
);

const signatorySchema = new mongoose.Schema(
  {
    name: { ...trimString, maxlength: [LIMITS.nameMax, `Signatory name must not exceed ${LIMITS.nameMax} characters.`] },
    signatureData: {
      type: String,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return v.length <= 400000;
        },
        message: 'Signature data must not exceed 400,000 characters.',
      },
    },
    date: Date,
  },
  { _id: false },
);

const formDataSchema = new mongoose.Schema(
  {
    inspectionDetails: {
      type: new mongoose.Schema(
        {
          formNumber: trimString,
          inspectionNumber: trimString,
        },
        { _id: false },
      ),
      default: () => ({}),
    },
    outletInformation: {
      type: new mongoose.Schema(
        {
          outletName: { ...trimString, maxlength: [LIMITS.nameMax, 'Outlet name must not exceed 150 characters.'] },
          outletType: { type: String, enum: OUTLET_TYPES },
          otherType: { ...trimString, maxlength: [LIMITS.otherTypeMax, 'Other outlet type must not exceed 100 characters.'] },
          county: trimString,
          subCounty: trimString,
          centre: { ...trimString, maxlength: [LIMITS.nameMax, 'Centre must not exceed 150 characters.'] },
        },
        { _id: false },
      ),
      default: () => ({}),
    },
    ownerInformation: {
      type: new mongoose.Schema(
        {
          ownerName: { ...trimString, maxlength: [LIMITS.nameMax, 'Owner name must not exceed 150 characters.'] },
          address: { ...trimString, maxlength: [LIMITS.addressMax, 'Address must not exceed 300 characters.'] },
          telephone: trimString,
          trainingLevel: { ...trimString, maxlength: [LIMITS.trainingLevelMax, 'Level of training must not exceed 150 characters.'] },
          ownerEmail: { type: String, trim: true, lowercase: true },
        },
        { _id: false },
      ),
      default: () => ({}),
    },
    kvbStatus: { type: kvbStatusSchema, default: () => ({}) },
    attendants: { type: [attendantSchema], default: [] },
    products: {
      type: new mongoose.Schema(
        {
          veterinaryMedicines: {
            type: new mongoose.Schema(
              { category1: Boolean, category2: Boolean, category3: Boolean, category4: Boolean },
              { _id: false },
            ),
            default: () => ({}),
          },
          otherProducts: {
            type: new mongoose.Schema(
              {
                agricultural: Boolean,
                feedsAndSalts: Boolean,
                others: Boolean,
                otherDescription: { ...trimString, maxlength: [LIMITS.maxOtherProductsDescription, 'Other products description must not exceed 200 characters.'] },
              },
              { _id: false },
            ),
            default: () => ({}),
          },
        },
        { _id: false },
      ),
      default: () => ({}),
    },
    findings: { type: findingsSchema, default: () => ({}) },
    otherComments: { ...trimString, maxlength: [LIMITS.otherCommentsMax, 'Other comments must not exceed 2000 characters.'] },
    location: {
      type: new mongoose.Schema(
        {
          latitude: trimString,
          longitude: trimString,
          capturedAt: Date,
        },
        { _id: false },
      ),
      default: () => ({}),
    },
    signOff: {
      type: new mongoose.Schema(
        {
          inspector: { type: signatorySchema, default: () => ({}) },
          personInCharge: { type: signatorySchema, default: () => ({}) },
        },
        { _id: false },
      ),
      default: () => ({}),
    },
  },
  { _id: false },
);

const inspectionSchema = new mongoose.Schema(
  {
    inspectionNumber: { type: String, required: true, trim: true },
    outlet: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true },
    inspector: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    inspectionDate: { type: Date, required: true, default: Date.now },
    status: { type: String, required: true, enum: WORKFLOW_STATES, default: 'DRAFT' },
    isLocked: { type: Boolean, default: false },
    draft: { type: Boolean, default: true },
    formData: { type: formDataSchema, default: () => ({}) },
    signature: {
      name: { type: String },
      role: { type: String },
      capturedAt: { type: Date },
      data: { type: String },
    },
    finalApproval: {
      approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvedAt: { type: Date },
      signature: {
        name: { type: String },
        role: { type: String },
        capturedAt: { type: Date },
        data: { type: String },
      },
    },
    workflowHistory: [
      {
        action: { type: String, required: true },
        actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String },
        reason: { type: String },
        timestamp: { type: Date, default: Date.now },
        metadata: { type: mongoose.Schema.Types.Mixed },
      },
    ],
    sourceSheet: { ...trimString, maxlength: [100, 'Source sheet must not exceed 100 characters.'] },
    sourceInspector: { ...trimString, maxlength: [LIMITS.nameMax, 'Source inspector must not exceed 150 characters.'] },
    sourceCompliance: {
      type: String,
      enum: ['', 'CLOSED', 'COMPLIANT', 'NON_COMPLIANT', 'NON_PROFESSIONAL', 'NOT_APPLICABLE'],
      default: '',
    },
    sourceRemarks: { ...trimString, maxlength: [LIMITS.otherCommentsMax, 'Source remarks must not exceed 2000 characters.'] },
    dceRemarks: { ...trimString, maxlength: [LIMITS.otherCommentsMax, 'DCE remarks must not exceed 2000 characters.'] },
    ceoRemarks: { ...trimString, maxlength: [LIMITS.otherCommentsMax, 'CEO remarks must not exceed 2000 characters.'] },
  },
  { timestamps: true, strictQuery: true },
);

inspectionSchema.index({ status: 1 });
inspectionSchema.index({ outlet: 1 });
inspectionSchema.index({ inspector: 1 });
inspectionSchema.index({ inspector: 1, status: 1 });
inspectionSchema.index({ status: 1, inspectionDate: -1 });
inspectionSchema.index({ outlet: 1, status: 1 });
inspectionSchema.index({ inspectionDate: -1 });
inspectionSchema.index({ createdAt: -1 });
inspectionSchema.index({ 'formData.outletInformation.outletName': 1 });
inspectionSchema.index({ 'formData.outletInformation.county': 1, 'formData.outletInformation.subCounty': 1, inspectionDate: -1 });
inspectionSchema.index({ 'formData.kvbStatus.registrationNumber': 1 });
inspectionSchema.index({ 'formData.attendants.kvbStatus.registrationNumber': 1 });
inspectionSchema.index({ inspectionNumber: 1 }, { unique: true });

module.exports = {
  schema: inspectionSchema,
  WORKFLOW_STATES,
  VALID_TRANSITIONS,
  EDITABLE_STATES,
  OUTLET_TYPES,
};
