#!/usr/bin/env node
/*
 * Generates the static proxy files used by the Internet Explorer applet:
 *   scram/    <- @mercuryworkshop/scramjet            (dist)
 *   baremux/  <- @mercuryworkshop/bare-mux            (dist)
 *   curl/     <- @mercuryworkshop/libcurl-transport   (dist)   [default transport]
 *   epoxy/    <- @mercuryworkshop/epoxy-transport     (dist)   [optional alternative]
 *
 * Usage:  node scripts/setup-proxy.js
 * Needs Node 18+ and internet access. Packages are installed into a temporary folder,
 * so this repository gets no node_modules and package.json is not touched.
 * The GitHub Pages workflow runs this automatically before every deploy.
 */
const fs = require('fs'), path = require('path'), os = require('os');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
// Scramjet v1.1.0 is the last v1 release and is the API the applet is written against.
const PACKAGES = [
  { name: '@mercuryworkshop/scramjet',          spec: '1.1.0',   out: 'scram',   required: true,  must: ['scramjet.all.js', 'scramjet.wasm.wasm'] },
  { name: '@mercuryworkshop/bare-mux',          spec: '2.1.9',   out: 'baremux', required: true,  must: ['worker.js', 'index.mjs'] },
  // libcurl.js is a floating (^0.7.4) dependency of the transport; its wasm is copied into curl/.
  // Pin it so a new upstream release can never silently change the wasm between deploys.
  { name: 'libcurl.js',                        spec: '0.7.4',   out: null,      required: true,  must: ['libcurl.wasm'] },
  { name: '@mercuryworkshop/libcurl-transport', spec: '1.5.2',   out: 'curl',    required: true,  must: ['index.mjs'] },
  { name: '@mercuryworkshop/epoxy-transport',   spec: '3.0.2',   out: 'epoxy',   required: false, must: ['index.mjs'] }
];

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name), d = path.join(dest, entry.name);
    if (entry.isDirectory()) { if (entry.name !== 'types') copyDir(s, d); }
    else if (!/\.(map|d\.ts|d\.mts)$/.test(entry.name)) fs.copyFileSync(s, d);
  }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gh-proxy-'));
fs.writeFileSync(path.join(tmp, 'package.json'), '{"name":"gh-proxy-setup","private":true}');
let failed = false;

// Retry npm a few times: a single flaky registry response used to fail the whole step.
function npmInstall(spec, attempts) {
  for (let i = 1; i <= attempts; i++) {
    try {
      // No --silent: if npm fails, its real error must show up in the Actions log.
      execSync('npm install --no-audit --no-fund --loglevel=error --fetch-retries=5 --fetch-retry-mintimeout=2000 ' + spec,
        { cwd: tmp, stdio: 'inherit' });
      return;
    } catch (err) {
      if (i === attempts) throw err;
      console.warn('  .. npm install failed (attempt ' + i + '/' + attempts + '), retrying in ' + (i * 3) + 's');
      execSync('node -e "setTimeout(()=>{}, ' + (i * 3000) + ')"');
    }
  }
}

for (const pkg of PACKAGES) {
  try {
    console.log('Installing ' + pkg.name + '@' + pkg.spec + ' ...');
    npmInstall(pkg.name + '@' + pkg.spec, 3);
    const base = path.join(tmp, 'node_modules', pkg.name);
    const dist = fs.existsSync(path.join(base, 'dist')) ? path.join(base, 'dist') : base;
    if (!pkg.out) {
      const missing = pkg.must.filter(f => !fs.existsSync(path.join(dist, f)));
      if (missing.length) throw new Error('expected file(s) missing from package: ' + missing.join(', '));
      console.log('  -> pinned (installed for the transport build)');
      continue;
    }
    const dest = path.join(root, pkg.out);
    fs.rmSync(dest, { recursive: true, force: true });
    copyDir(dist, dest);
    // libcurl.js ships its wasm next to the library; keep a copy beside the transport too.
    if (pkg.out === 'curl') {
      const lcBase = path.join(tmp, 'node_modules', 'libcurl.js');
      const lc = fs.existsSync(path.join(lcBase, 'dist')) ? path.join(lcBase, 'dist') : lcBase;
      if (!fs.existsSync(lc)) throw new Error('pinned libcurl.js package files were not found');
      copyDir(lc, dest);
      if (!fs.existsSync(path.join(dest, 'libcurl.wasm'))) {
        throw new Error('libcurl.js WebAssembly asset was not copied to curl/libcurl.wasm');
      }
    }
    const missing = pkg.must.filter(f => !fs.existsSync(path.join(dest, f)));
    if (missing.length) throw new Error('expected file(s) missing after copy: ' + missing.join(', '));
    console.log('  -> ' + pkg.out + '/  (' + fs.readdirSync(dest).length + ' entries)');
  } catch (err) {
    console.error((pkg.required ? '::error::' : '::warning::') + 'Proxy setup: ' + pkg.name + ' failed: ' + err.message);
    if (pkg.required) failed = true;
  }
}
fs.rmSync(tmp, { recursive: true, force: true });
if (failed) { console.error('Proxy setup incomplete: a required package failed.'); process.exit(1); }
console.log('Proxy files ready.');
