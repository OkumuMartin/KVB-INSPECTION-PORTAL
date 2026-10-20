/**
 * Measure what each kind of link on the landing page does to the browser
 * history, and whether the user can get back to the portal.
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:5173';
const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });

async function historyState(page) {
  return page.evaluate(() => ({
    length: history.length,
    href: location.href,
    entries: performance.getEntriesByType('navigation').length,
  }));
}

const report = [];

// ---------------------------------------------------------------- same tab
{
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.kvb-service-card');
  await page.waitForTimeout(1200);

  const before = await historyState(page);
  report.push(`landing page: history.length = ${before.length}`);

  // The notice ticker links to the Board's main site with no target, so it
  // navigates the current tab away.
  const ticker = page.locator('.kvb-ticker-items a').first();
  const tickerHref = await ticker.getAttribute('href');
  const tickerTarget = await ticker.getAttribute('target');
  report.push(`notice ticker: href=${tickerHref} target=${tickerTarget}`);

  await ticker.click({ force: true });
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForTimeout(2500);
  const after = await historyState(page);
  report.push(`after clicking the ticker: url=${after.href} history.length = ${after.length}`);

  // Can the user go back?
  await page.goBack({ waitUntil: 'domcontentloaded' }).catch((e) => report.push(`goBack failed: ${e.message}`));
  await page.waitForTimeout(2500);
  const back = await historyState(page);
  report.push(`after goBack: url=${back.href} history.length = ${back.length}`);
  report.push(`back returned to the portal: ${back.href.startsWith(BASE)}`);
  await page.close();
}

// ---------------------------------------------------------------- new tab
{
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.kvb-service-card');
  await page.waitForTimeout(1200);

  const before = await historyState(page);
  const [popup] = await Promise.all([
    context.waitForEvent('page'),
    page.locator('.kvb-service-button').first().click(),
  ]);
  await popup.waitForLoadState('domcontentloaded').catch(() => {});
  const after = await historyState(page);
  report.push(`service button (target=_blank): original tab url=${after.href} history.length ${before.length} -> ${after.length}`);
  report.push(`popup opened at: ${popup.url()}`);
  await popup.close();
  await page.close();
}

await browser.close();
console.log(report.join('\n'));
