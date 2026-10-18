const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'KVB-Inspection-Portal/1.0 (info@kenyavetboard.or.ke)';
const CACHE = new Map();
const CACHE_TTL = 1000 * 60 * 60;
const MIN_INTERVAL_MS = 1100;
const MAX_QUEUE_DEPTH = 50;
const REQUEST_TIMEOUT_MS = 10000;

let lastRequestAt = 0;
let queueDepth = 0;

async function rateLimitedFetch(url, options) {
  const now = Date.now();
  const wait = Math.max(0, MIN_INTERVAL_MS - (now - lastRequestAt));
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }

  if (queueDepth >= MAX_QUEUE_DEPTH) {
    throw new Error('Geocoding request queue is full. Try again later.');
  }
  queueDepth += 1;
  lastRequestAt = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeout);
    }
  } finally {
    queueDepth -= 1;
  }
}

async function nominatimSearch(query) {
  const cacheKey = query.toLowerCase().trim();
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  const url = new URL(`${NOMINATIM_BASE}/search`);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'ke');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('accept_language', 'en');

  let response;
  try {
    response = await rateLimitedFetch(url.toString(), {
      headers: { 'User-Agent': USER_AGENT },
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Geocoding request timed out after 10 seconds.');
    }
    throw error;
  }

  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.status}`);
  }

  const data = await response.json();
  if (Array.isArray(data) && data.length > 0) {
    const result = {
      latitude: String(data[0].lat),
      longitude: String(data[0].lon),
      displayName: data[0].display_name,
    };
    CACHE.set(cacheKey, { data: result, ts: Date.now() });
    return result;
  }

  return null;
}

async function geocodeOutlet(outlet) {
  if (!outlet) return null;
  const parts = [outlet.outletName, outlet.centre, outlet.subCounty, outlet.county, 'Kenya'].filter(Boolean);
  const query = parts.join(', ');
  if (!query) return null;

  try {
    const result = await nominatimSearch(query);
    if (result) {
      return {
        latitude: result.latitude,
        longitude: result.longitude,
        locationSource: 'geocoded',
      };
    }
  } catch (error) {
    console.error('Geocoding failed:', error.message);
  }

  return null;
}

async function geocodeQuery(query) {
  if (!query || typeof query !== 'string') return null;
  try {
    return await nominatimSearch(query);
  } catch (error) {
    console.error('Geocoding search failed:', error.message);
    return null;
  }
}

function clearCache() {
  CACHE.clear();
}

// Prevent unbounded cache growth.
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of CACHE.entries()) {
    if (now - entry.ts > CACHE_TTL) {
      CACHE.delete(key);
    }
  }
}, 1000 * 60 * 30).unref();

module.exports = {
  geocodeOutlet,
  geocodeQuery,
  clearCache,
};