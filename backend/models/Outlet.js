const mongoose = require('mongoose');

const OUTLET_TYPES = ['AGROVET', 'CHEMIST', 'OTHER'];

const outletSchema = new mongoose.Schema(
  {
    outletName: { type: String, required: [true, 'Outlet name is required.'], trim: true, maxlength: [150, 'Outlet name must not exceed 150 characters.'] },
    formNumber: { type: String, trim: true, maxlength: [50, 'Form number must not exceed 50 characters.'] },
    outletType: { type: String, required: true, enum: OUTLET_TYPES, default: 'AGROVET' },
    outletTypeOther: { type: String, trim: true, maxlength: [100, 'Other outlet type must not exceed 100 characters.'] },
    ownerName: { type: String, required: [true, 'Owner name is required.'], trim: true, maxlength: [100, 'Owner name must not exceed 100 characters.'] },
    ownerTrainingLevel: { type: String, trim: true, maxlength: [150, 'Level of training must not exceed 150 characters.'] },
    ownerEmail: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address.'],
    },
    ownerPhone: { type: String, trim: true },
    address: { type: String, trim: true, maxlength: [300, 'Address must not exceed 300 characters.'] },
    county: { type: String, trim: true, maxlength: [80, 'County must not exceed 80 characters.'] },
    subCounty: { type: String, trim: true, maxlength: [80, 'Sub-county must not exceed 80 characters.'] },
    centre: { type: String, trim: true, maxlength: [80, 'Centre must not exceed 80 characters.'] },
    kvbRegistrationInfo: { type: String, trim: true, maxlength: [100, 'KVB registration info must not exceed 100 characters.'] },
    latitude: { type: String, trim: true, maxlength: [30, 'Latitude must not exceed 30 characters.'] },
    longitude: { type: String, trim: true, maxlength: [30, 'Longitude must not exceed 30 characters.'] },
    locationSource: { type: String, trim: true, maxlength: [30, 'Location source must not exceed 30 characters.'] },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

outletSchema.index({ outletName: 1 });
outletSchema.index({ county: 1 });
outletSchema.index({ subCounty: 1 });
outletSchema.index({ county: 1, subCounty: 1 });
outletSchema.index({ ownerName: 1 });
outletSchema.index({ outletName: 'text' });

module.exports = { schema: outletSchema, OUTLET_TYPES };
