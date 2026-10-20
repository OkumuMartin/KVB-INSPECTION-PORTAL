import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:5173';
const OUT = 'C:/Users/SIBUOR/AppData/Local/Temp/kilo/kvb-shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });

async function shoot(path, name, options = {}) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  if (options.dark) {
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.style.colorScheme = 'dark';
    });
    await page.waitForTimeout(400);
  }
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: options.fullPage ?? false });
  await page.close();
  console.log(`  ${name}.png`);
}

await shoot('/', 'landing-top');
await shoot('/', 'landing-services', { fullPage: false });
await shoot('/login', 'login');
await shoot('/login', 'login-dark', { dark: true });

// Scroll to the services section for a dedicated shot.
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.kvb-service-card');
await page.waitForTimeout(1200);
await page.locator('#services').scrollIntoViewIfNeeded();
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/services.png` });
console.log('  services.png');

await page.locator('.lp-features, #features').first().scrollIntoViewIfNeeded();
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/features.png` });
console.log('  features.png');

await page.locator('.lp-footer').scrollIntoViewIfNeeded();
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/footer.png` });
console.log('  footer.png');
await page.close();

await browser.close();
console.log(`\nScreenshots written to ${OUT}`);
