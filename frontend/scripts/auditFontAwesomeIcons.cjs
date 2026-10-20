/**
 * Audit the Font Awesome icon names used in the frontend against the
 * Font Awesome 6.5.1 free set that the app actually loads.
 *
 * Font Awesome 6 dropped the Font Awesome 5 names (`fa-info-circle`,
 * `fa-magnifying-glass-location`, ...) unless the separate `v4-shims` /
 * `v5-shims` stylesheets are included, which this app does not load. Any
 * icon that is not in the free set renders as an empty box.
 *
 * Usage: node scripts/auditFontAwesomeIcons.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const CSS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
const ROOT = path.join(__dirname, '..');
const SOURCE_DIRS = ['app', 'components', 'hooks', 'lib', 'context', 'providers'];
const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);

/* Font Awesome utility classes are not icons, so they never appear in the
   `:before` map. Ignoring them keeps the audit free of false positives. */
const UTILITY_CLASSES = new Set([
  'fa-fw',
  'fa-ul',
  'fa-li',
  'fa-border',
  'fa-pull-left',
  'fa-pull-right',
  'fa-inverse',
  'fa-spin',
  'fa-spin-reverse',
  'fa-spin-pulse',
  'fa-pulse',
  'fa-beat',
  'fa-fade',
  'fa-bounce',
  'fa-shake',
  'fa-flip',
  'fa-rotate',
  'fa-stack',
  'fa-inverse',
  'fa-layers',
  'fa-swap-opacity',
]);

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { timeout: 20000 }, (response) => {
        let body = '';
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => resolve(body));
      })
      .on('error', reject);
  });
}

function collectFiles(dir, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '_legacy_src') continue;
      collectFiles(full, found);
    } else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      found.push(full);
    }
  }
  return found;
}

async function main() {
  const css = await fetchText(CSS_URL);

  // Every icon the free stylesheet can render, e.g. ".fa-user:before{...}"
  const available = new Set();
  for (const match of css.matchAll(/\.(fa-[a-z0-9-]+):before/g)) {
    available.add(match[1]);
  }

  const used = new Map();
  for (const dir of SOURCE_DIRS) {
    const absolute = path.join(ROOT, dir);
    if (!fs.existsSync(absolute)) continue;
    for (const file of collectFiles(absolute)) {
      const source = fs.readFileSync(file, 'utf8');
      for (const match of source.matchAll(/\bfa-(?:fa-)?([a-z0-9-]+)\b/g)) {
        const name = `fa-${match[1]}`;
        if (UTILITY_CLASSES.has(name)) continue;
        // Size modifiers (fa-2x, fa-lg, ...) are utilities too.
        if (/^fa-(?:\d+x|xs|sm|lg|xl|\d*xl)$/.test(name)) continue;
        if (!used.has(name)) used.set(name, new Set());
        used.get(name).add(path.relative(ROOT, file));
      }
    }
  }

  const missing = [...used.entries()]
    .filter(([name]) => !available.has(name))
    .sort(([a], [b]) => a.localeCompare(b));

  console.log(`Font Awesome free icons available: ${available.size}`);
  console.log(`Distinct icon names used: ${used.size}`);
  console.log(`Icon names NOT in the free set: ${missing.length}`);

  if (missing.length > 0) {
    console.log('');
    for (const [name, files] of missing) {
      console.log(`  ${name}`);
      for (const file of files) console.log(`      ${file}`);
    }
    process.exit(1);
  }

  console.log('\nAll icon names resolve to a Font Awesome 6 free icon.');
}

main().catch((error) => {
  console.error(`Could not check the icon set: ${error.message}`);
  process.exit(2);
});
