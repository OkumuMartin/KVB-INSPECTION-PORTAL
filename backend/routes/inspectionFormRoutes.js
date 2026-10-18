const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { buildFormSchema } = require('../config/inspectionFormConfig');
const { OUTLET_TYPES } = require('../models/Outlet');

const router = express.Router();

const OUTLET_TYPE_LABELS = {
  AGROVET: 'Agrovet',
  CHEMIST: 'Chemist',
  OTHER: 'Others',
};

router.get('/schema', requireAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      ...buildFormSchema(),
      outletTypes: OUTLET_TYPES.map((value) => ({ value, label: OUTLET_TYPE_LABELS[value] })),
    },
  });
});

module.exports = router;
