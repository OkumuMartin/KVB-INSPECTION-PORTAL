const { Outlet } = require('../models');
const { createAuditLog } = require('../services/auditLogService');
const { geocodeOutlet } = require('../services/geocodingService');

const MAX_PAGE_SIZE = 200;

const WRITABLE_FIELDS = [
  'outletName',
  'formNumber',
  'outletType',
  'outletTypeOther',
  'ownerName',
  'ownerTrainingLevel',
  'ownerEmail',
  'ownerPhone',
  'address',
  'county',
  'subCounty',
  'centre',
  'kvbRegistrationInfo',
  // GPS coordinates captured on site during an inspection. These override the
  // geocoded position because a device fix is more accurate than an address
  // lookup.
  'latitude',
  'longitude',
  'locationSource',
];

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toPositiveInt(value, fallback) {
  const parsed = parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return parsed;
}

function pickWritableFields(body) {
  const picked = {};
  for (const field of WRITABLE_FIELDS) {
    if (body && body[field] !== undefined) {
      picked[field] = body[field];
    }
  }
  return picked;
}

async function listOutlets(req, res, next) {
  try {
    const { page, limit, search, county } = req.query;
    const currentPage = toPositiveInt(page, 1);
    const pageSize = Math.min(toPositiveInt(limit, 50), MAX_PAGE_SIZE);
    const filter = {};

    if (search) {
      const regex = new RegExp(escapeRegExp(search), 'i');
      filter.$or = [
        { outletName: regex },
        { ownerName: regex },
        { county: regex },
      ];
    }

    if (county) {
      filter.county = new RegExp(escapeRegExp(county), 'i');
    }

    const [outlets, total] = await Promise.all([
      Outlet.find(filter)
        .sort({ createdAt: -1 })
        .limit(pageSize)
        .skip((currentPage - 1) * pageSize)
        .lean(),
      Outlet.countDocuments(filter),
    ]);

    return res.json({ items: outlets, total, page: currentPage, limit: pageSize });
  } catch (error) {
    next(error);
  }
}

async function getOutlet(req, res, next) {
  try {
    const outlet = await Outlet.findById(req.params.id).lean();

    if (!outlet) {
      return res.status(404).json({ message: 'Outlet not found.' });
    }

    return res.json({ item: outlet });
  } catch (error) {
    next(error);
  }
}

async function createOutlet(req, res, next) {
  try {
    const data = pickWritableFields(req.body);

    const outlet = await Outlet.create(data);

    const geocodeResult = await geocodeOutlet(outlet);
    if (geocodeResult) {
      outlet.latitude = geocodeResult.latitude;
      outlet.longitude = geocodeResult.longitude;
      outlet.locationSource = geocodeResult.locationSource;
      await outlet.save();
    }

    await createAuditLog({
      user: req.user._id,
      role: req.user.role,
      action: 'OUTLET_CREATED',
      req,
      metadata: { outletName: outlet.outletName },
    });

    return res.status(201).json({ item: outlet });
  } catch (error) {
    next(error);
  }
}

async function updateOutlet(req, res, next) {
  try {
    const updates = pickWritableFields(req.body);

    const outlet = await Outlet.findByIdAndUpdate(req.params.id, updates, {
      returnDocument: 'after',
      runValidators: true,
    }).lean();

    if (!outlet) {
      return res.status(404).json({ message: 'Outlet not found.' });
    }

    await createAuditLog({
      user: req.user._id,
      role: req.user.role,
      action: 'OUTLET_UPDATED',
      req,
      metadata: { outletId: req.params.id, changes: Object.keys(updates) },
    });

    return res.json({ item: outlet });
  } catch (error) {
    next(error);
  }
}

async function deleteOutlet(req, res, next) {
  try {
    const outlet = await Outlet.findByIdAndDelete(req.params.id).lean();

    if (!outlet) {
      return res.status(404).json({ message: 'Outlet not found.' });
    }

    await createAuditLog({
      user: req.user._id,
      role: req.user.role,
      action: 'OUTLET_DELETED',
      req,
      metadata: { outletId: req.params.id, outletName: outlet.outletName },
    });

    return res.json({ success: true, message: 'Outlet deleted.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listOutlets,
  getOutlet,
  createOutlet,
  updateOutlet,
  deleteOutlet,
  escapeRegExp,
  pickWritableFields,
  toPositiveInt,
  MAX_PAGE_SIZE,
};
