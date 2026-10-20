/**
 * End-to-end check of the sign-in and sign-out flow, including the reported
 * bug: the brand text on the sign-in panel turned black after signing out.
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:5173';
const USER = process.argv[3] || 'ui_test_inspector';
const PASS = process.argv[4] || 'Password123';

const results = [];
let failures = 0;
function check(label, condition, detail = '') {
  if (condition) results.push(`  PASS  ${label}${detail ? ` :: ${detail}` : ''}`);
  else {
    failures += 1;
    results.push(`  FAIL  ${label}${detail ? ` :: ${detail}` : ''}`);
  }
}

const white = (value) => {
  const match = String(value).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return false;
  const [, r, g, b] = match.map(Number);
  return r === 255 && g === 255 && b === 255;
};

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

const consoleErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));

// A signed-out visitor must be able to browse the landing page. The session
// probe answers 401 for a guest, and that must not bounce them to /login.
await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.kvb-service-card', { timeout: 20000 });
await page.waitForTimeout(3000);
check('a signed-out visitor stays on the landing page', !page.url().includes('/login'), page.url());

// Sign in.
await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#username');
await page.fill('#username', USER);
await page.fill('#password', PASS);
await page.click('button[type="submit"]');
await page.waitForURL(/\/dashboard/, { timeout: 20000 });
await page.waitForTimeout(2000);
check('sign in reaches the dashboard', page.url().includes('/dashboard'), page.url());

const dashboardHeading = await page.locator('.dashboard-hero-title, .dashboard-section-title').first().textContent();
check('dashboard renders for the inspector', Boolean(dashboardHeading && dashboardHeading.trim()), (dashboardHeading || '').trim());

// Sign out. The brand text on the sign-in panel must be white, not black.
await page.click('.dashboard-signout');
await page.waitForURL(/\/login/, { timeout: 20000 });
await page.waitForTimeout(2500);

const brandMain = page.locator('.kvb-logo-pill-text-main').first();
const brandSub = page.locator('.kvb-logo-pill-text-sub').first();
const mainColor = await brandMain.evaluate((el) => getComputedStyle(el).color);
const subColor = await brandSub.evaluate((el) => getComputedStyle(el).color);
check('brand name is white immediately after signing out', white(mainColor), mainColor);
check('brand sub-title is white immediately after signing out', white(subColor), subColor);

// The session must really be gone.
await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
check('the dashboard is no longer reachable after signing out', page.url().includes('/login'), page.url());

const realErrors = consoleErrors.filter((e) => !e.includes('401') && !e.includes('Failed to load resource'));
check('no unexpected console errors', realErrors.length === 0, realErrors.slice(0, 3).join(' | '));

await browser.close();
console.log(results.join('\n'));
console.log(failures === 0 ? '\nAUTH FLOW CHECKS PASSED' : `\n${failures} AUTH FLOW CHECK FAILED`);
process.exit(failures === 0 ? 0 : 1);
