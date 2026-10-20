import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:5173';
const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();

await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.kvb-service-card');
await page.waitForTimeout(1000);

const before = await page.evaluate(() => ({ href: location.href, len: history.length }));

// Dispatch the click on the DOM node so the marquee animation cannot move the
// target out from under the pointer.
await page.evaluate(() => {
  document.querySelector('.kvb-ticker-items a').click();
});
await page.waitForTimeout(4000);
const after = await page.evaluate(() => ({ href: location.href, len: history.length }));

console.log('before click :', JSON.stringify(before));
console.log('after click  :', JSON.stringify(after));
console.log('left the portal in the same tab:', !after.href.startsWith(BASE));
console.log('history length changed:', after.len !== before.len);

await browser.close();
