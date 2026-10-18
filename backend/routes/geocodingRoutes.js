const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { geocodeQuery, geocodeOutlet, clearCache } = require('../services/geocodingService');

const router = express.Router();

router.get('/search', requireAuth, async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ message: 'Query parameter q is required.' });
    }
    const result = await geocodeQuery(q);
    if (!result) {
      return res.status(404).json({ message: 'Location not found.' });
    }
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/outlet', requireAuth, async (req, res, next) => {
  try {
    const outlet = req.body || {};
    if (!outlet.outletName) {
      return res.status(400).json({ message: 'Outlet name is required for geocoding.' });
    }
    const result = await geocodeOutlet(outlet);
    if (!result) {
      return res.status(404).json({ message: 'Could not geocode the outlet location.' });
    }
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

if (process.env.NODE_ENV !== 'production') {
  router.delete('/cache', (req, res) => {
    clearCache();
    return res.json({ message: 'Geocoding cache cleared.' });
  });
}

module.exports = router;
