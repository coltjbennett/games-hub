/*
 * boot.js — Windows 95-style boot sequence for the Project Launcher.
 *
 * Loaded synchronously as the FIRST script in index.html's <head>, so the boot
 * screen covers the page before the stylesheet, main.js, or the Terms of Service
 * modal can show anything.
 *
 * Behavior
 *  - Plays only on a fresh launch (new tab / new browser session). It is skipped
 *    on refresh, back/forward navigation, and the service worker's automatic
 *    update reloads, because a per-session flag is set the moment a boot starts.
 *  - Tries to start audio automatically. Browsers only allow that when the user
 *    has built up enough "engagement" with the site (mostly desktop Chrome/Edge
 *    for returning visitors). When the browser blocks it, a power-button screen
 *    is shown instead; clicking it counts as the user gesture that unlocks audio.
 *  - Click / Enter / Space / Escape skips the boot once it has started.
 *
 * Opt-outs
 *  - Add ?noboot to the URL for a single visit.
 *  - localStorage.setItem('gh-skip-boot', '1') disables it permanently
 *    (a Control Panel toggle can simply set/remove this key).
 *
 * Assets (case-sensitive on GitHub Pages):
 *    images/bootscreen.PNG
 *    images/win95.mp3
 */
(function () {
  'use strict';

  var SESSION_KEY = 'gh-boot-done';
  var SKIP_KEY = 'gh-skip-boot';
  var IMAGE_FILE = 'images/bootscreen.PNG';
  var AUDIO_FILE = 'images/win95.mp3';

  var ASSET_TIMEOUT_MS = 2000;   // don't wait longer than this for the image
  var SILENT_BOOT_MS = 5000;     // boot length when there is no sound
  var MAX_BOOT_MS = 12000;       // hard cap, whatever happens
  var TAIL_MS = 350;             // short pause after the sound ends
  var SKIP_GUARD_MS = 800;       // ignore skip input right after starting
  var FADE_MS = 450;

  // ---------- Should we boot at all? ----------
  try {
    if (/[?&]noboot(?:=|&|$)/.test(location.search)) return;
  } catch (e) {}

  try {
    if (window.localStorage.getItem(SKIP_KEY) === '1') return;
  } catch (e) {}

  try {
    var navEntry = window.performance && performance.getEntriesByType &&
      performance.getEntriesByType('navigation')[0];
    if (navEntry && (navEntry.type === 'reload' || navEntry.type === 'back_forward')) return;
  } catch (e) {}

  try {
    if (window.sessionStorage.getItem(SESSION_KEY) === '1') return;
    // Set immediately so a refresh mid-boot does not boot again.
    window.sessionStorage.setItem(SESSION_KEY, '1');
  } catch (e) {}

  // ---------- Asset URLs (resolved against this script, so subpaths work) ----------
  var base = (document.currentScript && document.currentScript.src) || location.href;
  function assetUrl(path) {
    try { return new URL(path, base).href; } catch (e) { return path; }
  }

  // ---------- Styles ----------
  var css = [
    'html.gh-booting{background:#000!important;overflow:hidden!important}',
    /* visibility:hidden also removes the page (and ToS modal) from tab order and clicks */
    'html.gh-booting body{visibility:hidden!important}',
    '#gh-boot-overlay{position:fixed;inset:0;z-index:2147483647;background:#000;color:#9a9a9a;',
    'display:flex;align-items:center;justify-content:center;overflow:hidden;',
    'opacity:1;transition:opacity ' + FADE_MS + 'ms ease;cursor:default;',
    '-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}',
    '#gh-boot-overlay.gh-boot-out{opacity:0;pointer-events:none}',
    '#gh-boot-img{display:none;width:100%;height:100%;object-fit:contain;background:#000}',
    '#gh-boot-overlay.gh-boot-running #gh-boot-img{display:block}',
    '#gh-boot-power{display:none;flex-direction:column;align-items:center;gap:22px;',
    "font-family:'Courier New',Courier,monospace;text-align:center;padding:24px}",
    '#gh-boot-overlay.gh-boot-waiting #gh-boot-power{display:flex}',
    '#gh-boot-btn{width:92px;height:92px;border-radius:50%;border:3px solid #4a4a4a;',
    'background:radial-gradient(circle at 35% 30%,#3a3a3a,#161616);color:#bdbdbd;',
    'display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;',
    'box-shadow:0 0 0 6px #0c0c0c,0 6px 18px rgba(0,0,0,.8);',
    'transition:color .15s,border-color .15s,box-shadow .15s,transform .05s}',
    '#gh-boot-btn:hover,#gh-boot-btn:focus-visible{color:#7dff9a;border-color:#7dff9a;',
    'box-shadow:0 0 0 6px #0c0c0c,0 0 24px rgba(125,255,154,.45);outline:none}',
    '#gh-boot-btn:active{transform:scale(.96)}',
    '#gh-boot-btn svg{width:42px;height:42px}',
    '#gh-boot-led{width:8px;height:8px;border-radius:50%;background:#2cff5e;',
    'box-shadow:0 0 8px #2cff5e;animation:gh-boot-pulse 1.4s ease-in-out infinite}',
    '@keyframes gh-boot-pulse{0%,100%{opacity:.25}50%{opacity:1}}',
    '#gh-boot-label{font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:#8a8a8a}',
    '#gh-boot-sub{font-size:12px;color:#5a5a5a}',
    '#gh-boot-hint{position:absolute;right:14px;bottom:10px;font-size:12px;',
    "font-family:'Courier New',Courier,monospace;color:#6a6a6a;opacity:0;",
    'transition:opacity .6s ease;pointer-events:none}',
    '#gh-boot-hint.gh-show{opacity:1}',
    '@media (prefers-reduced-motion:reduce){#gh-boot-led{animation:none}',
    '#gh-boot-overlay{transition-duration:1ms}}'
  ].join('');

  var styleEl = document.createElement('style');
  styleEl.id = 'gh-boot-style';
  styleEl.textContent = css;
  (document.head || document.documentElement).appendChild(styleEl);

  // ---------- DOM ----------
  var root = document.documentElement;
  root.classList.add('gh-booting');

  var overlay = document.createElement('div');
  overlay.id = 'gh-boot-overlay';
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-label', 'Starting up');

  var img = new Image();
  img.id = 'gh-boot-img';
  img.alt = '';
  img.draggable = false;

  var power = document.createElement('div');
  power.id = 'gh-boot-power';
  power.innerHTML =
    '<div id="gh-boot-led"></div>' +
    '<button id="gh-boot-btn" type="button" aria-label="Power on">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 3v9"/><path d="M6.4 6.6a8 8 0 1 0 11.2 0"/></svg>' +
    '</button>' +
    '<div id="gh-boot-label">Press power button</div>' +
    '<div id="gh-boot-sub">Esc to skip</div>';

  var hint = document.createElement('div');
  hint.id = 'gh-boot-hint';
  hint.textContent = 'Click or press Esc to skip';

  overlay.appendChild(img);
  overlay.appendChild(power);
  overlay.appendChild(hint);
  // Attached to <html>, outside <body>, so it exists before <body> is parsed.
  root.appendChild(overlay);

  // ---------- Audio ----------
  var audio = new Audio();
  audio.preload = 'auto';
  audio.src = assetUrl(AUDIO_FILE);

  // ---------- State ----------
  var phase = 'loading'; // loading -> waiting (power button) -> running -> done
  var withSound = false;
  var skipAllowedAt = 0;
  var endTimer = null;
  var maxTimer = null;
  var hintTimer = null;

  function playAttempt() {
    // Resolves 'ok' | 'blocked' (needs a user gesture) | 'fail' (file missing/unsupported).
    try {
      var p = audio.play();
      if (p && typeof p.then === 'function') {
        return p.then(
          function () { return 'ok'; },
          function (err) { return (err && err.name === 'NotAllowedError') ? 'blocked' : 'fail'; }
        );
      }
      return Promise.resolve(audio.paused ? 'fail' : 'ok');
    } catch (e) {
      return Promise.resolve('fail');
    }
  }

  function finish() {
    if (phase === 'done') return;
    phase = 'done';

    clearTimeout(endTimer);
    clearTimeout(maxTimer);
    clearTimeout(hintTimer);
    try { audio.pause(); } catch (e) {}

    document.removeEventListener('keydown', onKeyDown, true);
    overlay.removeEventListener('click', onOverlayClick);

    // Reveal the page right away so it appears underneath the fading overlay.
    root.classList.remove('gh-booting');
    overlay.classList.add('gh-boot-out');

    setTimeout(function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
      try { window.dispatchEvent(new CustomEvent('gh-boot-complete')); } catch (e) {}
    }, FADE_MS + 50);
  }

  function beginBoot(sound) {
    if (phase === 'done' || phase === 'running') return;
    phase = 'running';
    withSound = sound;
    skipAllowedAt = Date.now() + SKIP_GUARD_MS;

    overlay.classList.remove('gh-boot-waiting');
    overlay.classList.add('gh-boot-running');

    hintTimer = setTimeout(function () { hint.classList.add('gh-show'); }, 1500);
    maxTimer = setTimeout(finish, MAX_BOOT_MS);

    if (withSound) {
      audio.addEventListener('ended', function () {
        endTimer = setTimeout(finish, TAIL_MS);
      }, { once: true });
    } else {
      endTimer = setTimeout(finish, SILENT_BOOT_MS);
    }
  }

  function powerOn() {
    if (phase !== 'waiting') return;
    // play() must be called synchronously inside the user's click/key event.
    playAttempt().then(function (result) {
      beginBoot(result === 'ok');
    });
  }

  function showPowerScreen() {
    if (phase !== 'loading') return;
    phase = 'waiting';
    overlay.classList.add('gh-boot-waiting');
    var btn = document.getElementById('gh-boot-btn');
    if (btn) { try { btn.focus(); } catch (e) {} }
  }

  function onOverlayClick() {
    if (phase === 'waiting') {
      powerOn();
    } else if (phase === 'running' && Date.now() >= skipAllowedAt) {
      finish();
    }
  }

  function onKeyDown(e) {
    if (phase === 'done') return;
    // Nothing on the page behind the boot screen should react to keys.
    e.stopPropagation();

    var key = e.key;
    if (phase === 'waiting') {
      if (key === 'Escape') { e.preventDefault(); finish(); }
      else if (key === 'Enter' || key === ' ') { e.preventDefault(); powerOn(); }
    } else if (phase === 'running') {
      if ((key === 'Escape' || key === 'Enter' || key === ' ') && Date.now() >= skipAllowedAt) {
        e.preventDefault();
        finish();
      }
    } else if (key === 'Escape') {
      e.preventDefault();
      finish();
    }
  }

  document.addEventListener('keydown', onKeyDown, true);
  overlay.addEventListener('click', onOverlayClick);

  // ---------- Start: load the image, then try to autoplay ----------
  var assetsHandled = false;
  function onAssetsReady() {
    if (assetsHandled || phase !== 'loading') return;
    assetsHandled = true;

    playAttempt().then(function (result) {
      if (phase !== 'loading') return; // skipped with Escape meanwhile
      if (result === 'blocked') showPowerScreen();
      else beginBoot(result === 'ok');
    });
  }

  img.onload = onAssetsReady;
  img.onerror = function () {
    // missing image: drop it (no broken-image icon), still do the sound + fade
    if (img.parentNode) img.parentNode.removeChild(img);
    onAssetsReady();
  };
  setTimeout(onAssetsReady, ASSET_TIMEOUT_MS);
  img.src = assetUrl(IMAGE_FILE);
  if (img.complete) onAssetsReady();
})();
