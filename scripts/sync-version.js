#!/usr/bin/env node
/* Copies siteData.version from data.js into package.json so data.js is the only place
 * the version number is ever edited. Run automatically by `npm run sync-version`
 * and by the GitHub Pages workflow before deploying. */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const data = fs.readFileSync(path.join(root, 'data.js'), 'utf8');
const m = data.match(/version\s*:\s*["']v?([^"']+)["']/);
if (!m) { console.error('Could not find version in data.js'); process.exit(1); }
const pkgPath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
if (pkg.version !== m[1]) { pkg.version = m[1]; fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n'); console.log('package.json version set to ' + m[1] + ' (from data.js)'); }
else console.log('package.json already at ' + m[1]);
