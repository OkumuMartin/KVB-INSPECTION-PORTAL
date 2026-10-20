import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:5173';
const PAGES = ['/', '/login', '/register', '/forgot-password', '/reset-password?token=test', '/dashboard', '/inspections', '/outlets', '/unauthorized'];

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

const problems = [];
let current = '';
page.on('response', (r) => {
  if (r.status() >= 400) problems.push(`${current}  ${r.status()} ${r.url()}`);
});
page.on('requestfailed', (r) => problems.push(`${current}  FAILED ${r.url()} ${r.failure()?.errorText}`));
page.on('console', (m) => {
  if (m.type() === 'error' && !m.text().includes('401')) problems.push(`${current}  console: ${m.text()}`);
});
page.on('pageerror', (e) => problems.push(`${current}  pageerror: ${e.message}`));

for (const path of PAGES) {
  current = path;
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const heading = await page.locator('h1, .kvb-right-title, .kvb-section-title').first().textContent().catch(() => null);
  console.log(`${path.padEnd(30)} -> ${(heading || '(no heading)').trim().slice(0, 50)}`);
}

console.log('\n--- problems ---');
if (problems.length === 0) console.log('  none');
else problems.forEach((p) => console.log('  ' + p));

await browser.close();
process.exit(problems.length === 0 ? 0 : 1);
