const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { listCounties, COUNTIES, REGIONS } = require('../config/regions');

const router = express.Router();

router.get('/counties', requireAuth, (req, res) => {
  res.json({ success: true, data: listCounties() });
});

router.get('/counties/:county/sub-counties', requireAuth, (req, res) => {
  const county = req.params.county;
  if (!COUNTIES.includes(county)) {
    return res.status(404).json({ success: false, message: 'Unknown county.' });
  }
  return res.json({ success: true, data: REGIONS[county] });
});

module.exports = router;
