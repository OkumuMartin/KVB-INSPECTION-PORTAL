/**
 * Resolve this machine's public IPv4 address so the Atlas IP access list
 * can be updated without guesswork. Falls back to "unknown" when the
 * lookup service is unreachable.
 */
const https = require('https');

const ENDPOINTS = ['https://api.ipify.org?format=json', 'https://ifconfig.me/ip'];

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { timeout: 10000 }, (response) => {
      let body = '';
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => resolve(body.trim()));
    });
    request.on('timeout', () => request.destroy(new Error('timed out')));
    request.on('error', reject);
  });
}

async function getPublicIp() {
  for (const endpoint of ENDPOINTS) {
    try {
      const body = await fetchText(endpoint);
      const ip = body.startsWith('{') ? JSON.parse(body).ip : body;
      if (ip && /^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return ip;
    } catch {
      // Try the next provider.
    }
  }
  return 'unknown';
}

module.exports = { getPublicIp };
