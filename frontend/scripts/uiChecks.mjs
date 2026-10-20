/**
 * Browser checks for the landing page and authentication panel fixes.
 *
 * Run against a live server: node scripts/uiChecks.mjs [baseUrl]
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:5173';

const results = [];
let failures = 0;

function check(label, condition, detail = '') {
  if (condition) {
    results.push(`  PASS  ${label}${detail ? ` :: ${detail}` : ''}`);
  } else {
    failures += 1;
    results.push(`  FAIL  ${label}${detail ? ` :: ${detail}` : ''}`);
  }
}

const rgb = (value) => {
  const match = String(value).match(/rgba?\(([^)]+)\)/);
  if (!match) return value;
  const [r, g, b, a] = match[1].split(',').map((part) => parseFloat(part.trim()));
  return { r, g, b, a: a === undefined ? 1 : a };
};

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`));

// ---------------------------------------------------------------- landing
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.kvb-service-card', { timeout: 30000 });
await page.waitForTimeout(1500);

const serviceCards = page.locator('.kvb-service-card');
check('services render as a card grid', (await serviceCards.count()) === 6, `${await serviceCards.count()} cards`);

const expectedServices = [
  { badge: 'Registration', cta: 'Start a registration', href: 'https://mms.kenyavetboard.or.ke/site/login/' },
  { badge: 'Licensing', cta: 'Manage licenses', href: 'https://mms.kenyavetboard.or.ke/site/login/' },
  { badge: 'Inspection', cta: 'Open the portal', href: '/login' },
  { badge: 'Education', cta: 'View the standards', href: 'https://kenyavetboard.or.ke/en/registration/registration' },
  { badge: 'Downloads', cta: 'Browse downloads', href: 'https://kenyavetboard.or.ke/en/downloads/forms' },
  { badge: 'Enquiries', cta: 'Make an enquiry', href: 'https://kenyavetboard.or.ke/en/contact' },
];

for (const [index, expected] of expectedServices.entries()) {
  const card = serviceCards.nth(index);
  // The badge is uppercased by CSS, so compare case-insensitively.
  const badge = (await card.locator('.kvb-service-badge-main').innerText()).trim().toLowerCase();
  const cta = (await card.locator('.kvb-service-button').innerText()).trim().replace(/\s+/g, ' ');
  const href = await card.locator('.kvb-service-button').getAttribute('href');
  check(`service "${expected.badge}" badge`, badge === expected.badge.toLowerCase(), badge);
  check(`service "${expected.badge}" call to action`, cta.startsWith(expected.cta), cta);
  check(`service "${expected.badge}" link`, href === expected.href, String(href));
}

// The icon block must fully contain its glyph.
const iconBox = await page.locator('.kvb-service-icon-wrap').first().boundingBox();
const glyphBox = await page.locator('.kvb-service-icon-wrap i').first().boundingBox();
check(
  'service icon is centred inside its tile',
  iconBox &&
    glyphBox &&
    glyphBox.x >= iconBox.x - 0.5 &&
    glyphBox.y >= iconBox.y - 0.5 &&
    glyphBox.x + glyphBox.width <= iconBox.x + iconBox.width + 0.5 &&
    glyphBox.y + glyphBox.height <= iconBox.y + iconBox.height + 0.5,
  iconBox && glyphBox ? `tile ${JSON.stringify(iconBox)} glyph ${JSON.stringify(glyphBox)}` : 'no box',
);

// The three section headlines must be larger than the body copy and sit close
// to the content they introduce.
for (const [label, section] of [
  ['Our Services', '#services'],
  ['Platform Features', '#features'],
  ['Enterprise Security', '.lp-security'],
]) {
  const eyebrow = page.locator(`${section} .kvb-eyebrow`).first();
  const fontSize = parseFloat(await eyebrow.evaluate((el) => getComputedStyle(el).fontSize));
  check(`"${label}" headline is at least 15px`, fontSize >= 15, `${fontSize}px`);

  const headerBox = await page.locator(`${section} .kvb-section-header`).first().boundingBox();
  const gridBox = await page.locator(`${section} .kvb-service-grid, ${section} .kvb-feature-grid, ${section} .kvb-security-grid`).first().boundingBox();
  const gap = headerBox && gridBox ? gridBox.y - (headerBox.y + headerBox.height) : null;
  check(`"${label}" headline block sits close to its content`, gap !== null && gap <= 40, `${gap}px gap`);
}

// Footer links.
const footerChecks = [
  ['Quick Links / Notices', 'a:has-text("Notices")', 'https://kenyavetboard.or.ke/en'],
  ['Support / Make an Enquiry', 'a:has-text("Make an Enquiry")', 'https://kenyavetboard.or.ke/en/contact'],
  ['Support / File a Complaint', 'a:has-text("File a Complaint")', 'https://kenyavetboard.or.ke/en/contact'],
  ['Support / Contact Us', 'a:has-text("Contact Us")', 'https://kenyavetboard.or.ke/en/contact'],
  ['Support / FAQ', 'a:has-text("FAQ")', 'https://kenyavetboard.or.ke/en/faq'],
];
for (const [label, selector, expected] of footerChecks) {
  const link = page.locator(`footer ${selector}`).first();
  const href = await link.getAttribute('href');
  check(label, href === expected, String(href));
}

// ------------------------------------------------- login panel after landing
// This is the reported bug: the landing stylesheet is still in the document
// after a client-side navigation, so the brand text must still be white.
await page.click('a[href="/login"]');
await page.waitForURL(/\/login/);
await page.waitForTimeout(600);

const brandMain = page.locator('.kvb-logo-pill-text-main').first();
const brandSub = page.locator('.kvb-logo-pill-text-sub').first();
const mainColor = rgb(await brandMain.evaluate((el) => getComputedStyle(el).color));
const subColor = rgb(await brandSub.evaluate((el) => getComputedStyle(el).color));
check('brand name stays white on the sign-in panel', mainColor.r === 255 && mainColor.g === 255 && mainColor.b === 255, JSON.stringify(mainColor));
check('brand sub-title stays white on the sign-in panel', subColor.r === 255 && subColor.g === 255 && subColor.b === 255, JSON.stringify(subColor));

// The theme control and the date pill must not overlap.
const toggleBox = await page.locator('.kvb-right-topbar .lp-theme-toggle').boundingBox();
const dateBox = await page.locator('.kvb-right-topbar .kvb-date-pill').boundingBox();
const overlaps =
  toggleBox &&
  dateBox &&
  toggleBox.x < dateBox.x + dateBox.width &&
  toggleBox.x + toggleBox.width > dateBox.x &&
  toggleBox.y < dateBox.y + dateBox.height &&
  toggleBox.y + toggleBox.height > dateBox.y;
check('theme control and date pill do not overlap', !overlaps, `toggle ${JSON.stringify(toggleBox)} date ${JSON.stringify(dateBox)}`);

// The "Inspection Services" shield must sit inside its rounded container.
// A Font Awesome glyph is painted from the ::before pseudo element, so the
// containment is measured on the element itself: a glyph that spills out of
// its box makes scrollWidth/scrollHeight exceed the client box.
const shield = page.locator('.kvb-services-shield');
const shieldStyle = await shield.evaluate((el) => {
  const style = getComputedStyle(el);
  return {
    display: style.display,
    alignItems: style.alignItems,
    justifyContent: style.justifyContent,
    lineHeight: style.lineHeight,
    clientWidth: el.clientWidth,
    clientHeight: el.clientHeight,
    scrollWidth: el.scrollWidth,
    scrollHeight: el.scrollHeight,
    rect: el.getBoundingClientRect().toJSON(),
  };
});
// A flex item is blockified, so the computed display can read "flex" or
// "inline-flex" depending on whether the element is a flex child.
check(
  'shield renders as a centred flex box',
  shieldStyle.display === 'inline-flex' || shieldStyle.display === 'flex',
  shieldStyle.display,
);
check(
  'shield centres its glyph',
  shieldStyle.alignItems === 'center' && shieldStyle.justifyContent === 'center',
  `${shieldStyle.alignItems} / ${shieldStyle.justifyContent}`,
);
check(
  'shield glyph is contained by its container',
  shieldStyle.scrollWidth <= shieldStyle.clientWidth + 1 &&
    shieldStyle.scrollHeight <= shieldStyle.clientHeight + 1,
  `client ${shieldStyle.clientWidth}x${shieldStyle.clientHeight} scroll ${shieldStyle.scrollWidth}x${shieldStyle.scrollHeight}`,
);
check(
  'shield container is square',
  Math.abs(shieldStyle.rect.width - shieldStyle.rect.height) < 1,
  `${shieldStyle.rect.width} x ${shieldStyle.rect.height}`,
);

// Every icon on the page must resolve to a real glyph (Font Awesome renders a
// non-zero width box for a missing icon only if the font has the glyph).
const iconWidths = await page.evaluate(() => {
  const icons = Array.from(document.querySelectorAll('i.fa'));
  return icons.map((icon) => {
    const rect = icon.getBoundingClientRect();
    return { className: icon.className, width: rect.width, height: rect.height };
  });
});
const zeroIcons = iconWidths.filter((icon) => icon.width === 0 || icon.height === 0);
check('every Font Awesome glyph renders with a size', zeroIcons.length === 0, JSON.stringify(zeroIcons.slice(0, 5)));

// The session probe answers 401 for a signed-out visitor. That is the
// expected answer, not a page error, so it is not counted here.
const realErrors = consoleErrors.filter((text) => !text.includes('401') && !text.includes('Failed to load resource'));
check('no console errors on the landing or login page', realErrors.length === 0, realErrors.slice(0, 3).join(' | '));

// ------------------------------------------------------------- dark theme
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.kvb-service-card');
await page.click('.lp-header .lp-theme-toggle');
await page.waitForTimeout(600);
const darkTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
check('the theme toggle switches to dark', darkTheme === 'dark', String(darkTheme));

const darkCard = await page.evaluate(() => {
  const card = document.querySelector('.kvb-service-card');
  const title = document.querySelector('.kvb-service-card-title');
  return {
    background: getComputedStyle(card).backgroundColor,
    titleColor: getComputedStyle(title).color,
  };
});
const light = (value) => {
  const match = String(value).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return false;
  const [, r, g, b] = match.map(Number);
  return (r + g + b) / 3 > 140;
};
check('the service card turns dark in dark mode', !light(darkCard.background), darkCard.background);
check('the service title stays readable in dark mode', light(darkCard.titleColor), darkCard.titleColor);

// ------------------------------------------------------------- responsive
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
await mobile.waitForSelector('.kvb-service-card');
await mobile.waitForTimeout(1200);
const mobileColumns = await mobile.evaluate(() => {
  const cards = Array.from(document.querySelectorAll('.kvb-service-card'));
  const firstTop = cards[0].getBoundingClientRect().top;
  return cards.filter((c) => Math.abs(c.getBoundingClientRect().top - firstTop) < 2).length;
});
check('the service grid collapses to one column on a phone', mobileColumns === 1, `${mobileColumns} columns`);

await mobile.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
await mobile.waitForSelector('.kvb-right-topbar');
await mobile.waitForTimeout(900);
const mobileOverlap = await mobile.evaluate(() => {
  const toggle = document.querySelector('.kvb-right-topbar .lp-theme-toggle')?.getBoundingClientRect();
  const date = document.querySelector('.kvb-right-topbar .kvb-date-pill')?.getBoundingClientRect();
  if (!toggle || !date) return null;
  return toggle.left < date.right && toggle.right > date.left && toggle.top < date.bottom && toggle.bottom > date.top;
});
check('the theme control and date pill do not overlap on a phone', mobileOverlap === false, String(mobileOverlap));
await mobile.close();

await browser.close();

console.log(results.join('\n'));
console.log(failures === 0 ? '\nUI CHECKS PASSED' : `\n${failures} UI CHECK FAILED`);
process.exit(failures === 0 ? 0 : 1);
