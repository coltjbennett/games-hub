/*
 * boot.js — Windows 95-style boot sequence for the Project Launcher.
 * ColtonOS by Macrohard Corporation (the exact opposite of Microsoft).
 *
 * Loaded synchronously as the FIRST script in index.html's <head>, so the boot
 * screen covers the page before the stylesheet, main.js, or the Terms of Service
 * modal can show anything.
 *
 * Behavior
 *  - Plays only on a fresh launch (new tab / new browser session). Skipped on
 *    refresh, back/forward navigation, and service-worker update reloads.
 *  - Tries to start audio automatically. If the browser blocks that (normal for
 *    first-time visitors and Safari/iOS), a green-phosphor POST (power-on self test) screen is
 *    shown instead. Clicking anywhere, or pressing Enter / any key, boots into
 *    the site and is the user gesture that unlocks audio.
 *  - The sound is NEVER cut short: while the track is really playing, only the
 *    user can end the boot. Timers for a silent boot only start after the
 *    power button is pressed (or immediately when no power screen is needed).
 *  - A thin progress line (bottom edge) shows the boot is alive. It follows the audio
 *    when it plays and hitches very slightly for realism, but always takes the same
 *    total time.
 *  - On the POST screen Esc skips the boot with no sound; once the boot picture
 *    is showing, click / Enter / Space / Esc skips it.
 *
 * Opt-outs
 *  - ?noboot in the URL for a single visit.
 *  - localStorage.setItem('gh-skip-boot', '1') disables it permanently.
 *
 * Assets (case-sensitive on GitHub Pages):
 *    images/bootscreen.PNG
 *    images/win95.mp3
 *    images/w95f.woff2 / w95f.woff   (already in the repo; used for the POST screen)
 */
(function () {
  'use strict';

  var SESSION_KEY = 'gh-boot-done';
  var SKIP_KEY = 'gh-skip-boot';
  var IMAGE_FILE = 'images/bootscreen.PNG';
  var AUDIO_FILE = 'images/win95.mp3';

  var AUDIO_FETCH_TIMEOUT_MS = 4000; // then fall back to streaming the file directly
  var ASSETS_TIMEOUT_MS = 4500;      // overall wait before trying to start anyway
  var SILENT_BOOT_MS = 5000;         // boot length when there is no sound
  var STALL_GRACE_MS = 2500;         // audio paused by the system this long -> finish
  var TAIL_MS = 400;                 // short pause after the sound ends
  var SKIP_GUARD_MS = 800;           // ignore skip input right after starting
  var FADE_MS = 450;

  var siteVersion = '';              // read live from data.js (siteData.version); nothing to edit here
  var OS_NAME = 'ColtonOS';
  var CORP_NAME = 'Macrohard Corporation';
  var CORP_SHORT = 'Macrohard';
  var COPY_FROM = 1995;              // fictional founding year, for the copyright line
  var COUNT_KEY = 'gh-boot-count';
  var LAST_KEY = 'gh-last-boot';

  // ---------- Should we boot at all? ----------
  try { if (/[?&]noboot(?:=|&|$)/.test(location.search)) return; } catch (e) {}
  try { if (window.localStorage.getItem(SKIP_KEY) === '1') return; } catch (e) {}
  try {
    var navEntry = window.performance && performance.getEntriesByType &&
      performance.getEntriesByType('navigation')[0];
    if (navEntry && (navEntry.type === 'reload' || navEntry.type === 'back_forward')) return;
  } catch (e) {}
  try {
    if (window.sessionStorage.getItem(SESSION_KEY) === '1') return;
    window.sessionStorage.setItem(SESSION_KEY, '1'); // a refresh mid-boot won't re-boot
  } catch (e) {}

  // Tell main.js a boot is in progress so it holds back the Terms modal until 'gh-boot-complete'.
  window.__ghBooting = true;

  // ---------- Asset URLs (resolved against this script so subpaths work) ----------
  var base = (document.currentScript && document.currentScript.src) || location.href;
  function assetUrl(path) {
    try { return new URL(path, base).href; } catch (e) { return path; }
  }

  // ---------- Styles ----------
  var css = [
    "@font-face{font-family:'GHBoot';font-display:block;src:url('" + assetUrl('images/w95f.woff2') +
      "') format('woff2'),url('" + assetUrl('images/w95f.woff') + "') format('woff')}",

    'html.gh-booting{background:#000!important;overflow:hidden!important}',
    /* visibility:hidden also removes the page (and the ToS modal) from clicks and tab order */
    /* Hide EVERYTHING in the page, children included, so a modal that sets its own
       visibility:visible (the ToS dialog) still can't show through. Body also becomes a
       stacking context so nothing inside it can out-rank the boot overlay's z-index. */
    'html.gh-booting body{position:relative!important;z-index:0!important}',
    'html.gh-booting body,html.gh-booting body *{visibility:hidden!important;pointer-events:none!important}',
    'html.gh-booting>:not(#gh-boot-overlay):not(head):not(body):not(script):not(style):not(link):not(meta){',
    'visibility:hidden!important;pointer-events:none!important}',

    '#gh-boot-overlay{position:fixed;inset:0;z-index:2147483647;visibility:visible!important;background:#000;color:#c0c0c0;',
    'display:flex;align-items:center;justify-content:center;overflow:hidden;',
    "font-family:'GHBoot','MS Sans Serif',Tahoma,Geneva,sans-serif;",
    'opacity:1;transition:opacity ' + FADE_MS + 'ms ease;cursor:default;',
    '-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}',
    '#gh-boot-overlay.gh-boot-out{opacity:0;pointer-events:none}',
    /* The site's styles.css has a universal `* { font-family: "Times New Roman" }`, which
       beats inheritance for every child of the overlay. #id + * out-ranks it. */
    "#gh-boot-overlay,#gh-boot-overlay *{font-family:'GHBoot','MS Sans Serif',Tahoma,Geneva,sans-serif!important;",
    '-webkit-font-smoothing:none;font-smooth:never}',

    /* boot picture + CRT turn-on */
    '#gh-boot-img{display:none;width:100%;height:100%;object-fit:contain;background:transparent}',
    /* soft blue glow behind the picture (shows in the letterbox bars) */
    '#gh-boot-overlay.gh-boot-running{background:radial-gradient(ellipse at center,#0b1c3a 0,#04080f 55%,#000 100%)}',
    /* faint scanlines + vignette over the boot picture */
    '#gh-boot-overlay.gh-boot-running::before{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;',
    'background:repeating-linear-gradient(0deg,rgba(0,0,0,.125) 0,rgba(0,0,0,.125) 1px,transparent 1px,transparent 3px),',
    'radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,.5) 100%);animation:gh-fade-in 1.2s ease .3s both}',
    '@keyframes gh-fade-in{from{opacity:0}to{opacity:1}}',
    '#gh-boot-overlay.gh-boot-running #gh-boot-img{display:block;',
    'animation:gh-crt-on .65s cubic-bezier(.2,.8,.2,1) both}',
    '@keyframes gh-crt-on{',
    '0%{transform:scale(.02,.004);filter:brightness(8);opacity:0}',
    '12%{opacity:1}',
    '30%{transform:scale(1,.004);filter:brightness(8)}',
    '70%{transform:scale(1,1.03);filter:brightness(2.4)}',
    '100%{transform:scale(1,1);filter:brightness(1)}}',

    /* POST screen */
    '#gh-boot-power{display:none;position:absolute;inset:0;box-sizing:border-box;padding:22px 28px;',
    'z-index:1;color:#33ff33;font-size:16px;line-height:19px;',
    'text-shadow:0 0 5px rgba(51,255,51,.45),1px 0 0 rgba(255,60,120,.10),-1px 0 0 rgba(60,255,255,.085);',
    '-webkit-font-smoothing:none;font-smooth:never;text-rendering:optimizeSpeed}',
    '#gh-boot-overlay.gh-boot-waiting #gh-boot-power{display:block;animation:gh-bios-on .6s ease-out,gh-flicker .18s infinite}',
    '@keyframes gh-flicker{0%,100%{opacity:1}50%{opacity:.972}}',
    '@keyframes gh-bios-on{0%{filter:brightness(3.2) blur(3px)}35%{filter:brightness(1.8) blur(1px)}100%{filter:none}}',
    /* slow CRT refresh band rolling down the screen */
    '#gh-boot-overlay.gh-boot-waiting::after{content:"";position:absolute;left:0;right:0;top:0;height:90px;z-index:2;',
    'pointer-events:none;background:linear-gradient(180deg,transparent,rgba(51,255,51,.06),transparent);',
    'animation:gh-roll 7s linear infinite}',
    '@keyframes gh-roll{from{transform:translateY(-100px)}to{transform:translateY(100vh)}}',
    /* scanlines + vignette */
    '#gh-boot-overlay.gh-boot-waiting::before{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;',
    'background:repeating-linear-gradient(0deg,rgba(0,0,0,.26) 0,rgba(0,0,0,.26) 1px,transparent 1px,transparent 3px),',
    'radial-gradient(ellipse at center,transparent 50%,rgba(0,0,0,.56) 100%)}',
    '#gh-bios-term{height:100%;overflow:hidden}',
    '.gh-bl{white-space:pre-wrap;min-height:19px;word-break:break-word}',
    '.gh-bl .k{display:inline-block;min-width:190px}',
    '.gh-bl .hi,.gh-bl.hi{color:#d9ffd9;text-shadow:0 0 5px rgba(217,255,217,.55)}',
    '.gh-bl .dim,.gh-bl.dim{color:#1fa81f;text-shadow:none}',
    '#gh-bios-cur{display:inline-block;width:9px;height:15px;margin-left:3px;vertical-align:-2px;',
    'background:#33ff33;box-shadow:0 0 6px rgba(51,255,51,.7);animation:gh-boot-blink 1s steps(1) infinite}',
    '@keyframes gh-boot-blink{50%{opacity:0}}',
    '#gh-bios-clock{display:none}', /* a POST screen has no live clock */

    '#gh-boot-hint{position:absolute;right:calc(20px + env(safe-area-inset-right,0px));',
    'bottom:calc(22px + env(safe-area-inset-bottom,0px));z-index:3;font-size:12px;letter-spacing:.08em;',
    'color:#7a7a7a;opacity:0;transition:opacity .6s ease;pointer-events:none}',
    '#gh-boot-hint.gh-show{opacity:1}',

    /* progress line along the bottom edge */
    '#gh-boot-bar{position:absolute;left:0;bottom:0;height:3px;width:0;z-index:3;pointer-events:none;opacity:0;',
    'background:linear-gradient(90deg,#1e6bff,#7fd0ff 80%,#fff);box-shadow:0 0 10px rgba(127,208,255,.85);',
    'transition:opacity .5s ease}',
    '#gh-boot-overlay.gh-boot-running #gh-boot-bar{opacity:1}',

    /* corporate copyright footer */
    '#gh-boot-copy{position:absolute;left:calc(20px + env(safe-area-inset-left,0px));',
    'bottom:calc(22px + env(safe-area-inset-bottom,0px));z-index:3;font-size:12px;letter-spacing:.06em;',
    'color:#8d8d8d;opacity:0;pointer-events:none;transition:opacity .9s ease .6s}',
    '#gh-boot-overlay.gh-boot-running #gh-boot-copy{opacity:1}',

    '@media (prefers-reduced-motion:reduce){',
    '#gh-boot-overlay.gh-boot-running #gh-boot-img{animation:none}',
    '#gh-boot-overlay.gh-boot-waiting #gh-boot-power,#gh-bios-cur{animation:none}',
    '#gh-boot-overlay.gh-boot-waiting::after,#gh-boot-overlay.gh-boot-running::before{animation:none}',
    '#gh-boot-overlay{transition-duration:1ms}}',
    '@media (max-width:560px){#gh-boot-power{padding:14px 14px}.gh-bl .k{min-width:120px}',
    '#gh-boot-copy{display:none}',
    '#gh-bios-clock{display:none}}',
    '@media (min-width:1500px){#gh-boot-power{font-size:20px;line-height:24px;padding:34px 44px}',
    '.gh-bl{min-height:24px}.gh-bl .k{min-width:240px}#gh-bios-cur{width:11px;height:19px}',
    '#gh-bios-clock{top:34px;right:44px}}'
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
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', CORP_SHORT + ' ' + OS_NAME + ' startup screen. Press Enter or click to continue.');

  var img = new Image();
  img.id = 'gh-boot-img';
  img.alt = '';
  img.draggable = false;

  var power = document.createElement('div');
  power.id = 'gh-boot-power';
  power.setAttribute('aria-hidden', 'true');
  var clockEl = document.createElement('div');
  clockEl.id = 'gh-bios-clock';
  var term = document.createElement('div');
  term.id = 'gh-bios-term';
  power.appendChild(clockEl);
  power.appendChild(term);

  var hint = document.createElement('div');
  hint.id = 'gh-boot-hint';
  hint.textContent = 'Click or press Esc to skip';

  var bar = document.createElement('div');
  bar.id = 'gh-boot-bar';
  bar.setAttribute('aria-hidden', 'true');

  var copy = document.createElement('div');
  copy.id = 'gh-boot-copy';
  copy.setAttribute('aria-hidden', 'true');
  function updateFooter() {
    copy.textContent = 'Copyright \u00A9 ' + COPY_FROM + '-' + new Date().getFullYear() + ' ' + CORP_NAME +
      (siteVersion ? '   |   ' + OS_NAME + ' v' + siteVersion : '');
  }
  updateFooter();

  // The version shown on the POST screen and footer comes straight from data.js, so it
  // never has to be edited here. data.js loads after this script, so it is fetched and
  // parsed as text. If the POST header is already on screen when it arrives, it updates.
  var postHeaderVal = null;
  function postHeaderText() {
    return CORP_SHORT.toUpperCase() + ' ' + OS_NAME + ' Power-On Self Test' + (siteVersion ? '  v' + siteVersion : '');
  }
  (function loadSiteVersion() {
    try {
      fetch(assetUrl('data.js'), { cache: 'no-cache' })
        .then(function (r) { return r.ok ? r.text() : ''; })
        .then(function (text) {
          var m = /siteData\s*=\s*\{[^}]*?\bversion\s*:\s*(["'])([^"']{1,24})\1/.exec(text);
          if (!m) return;
          var v = m[2].replace(/^\s*v/i, '').trim();
          if (!v) return;
          siteVersion = v;
          updateFooter();
          if (postHeaderVal) postHeaderVal.textContent = postHeaderText();
        })
        .catch(function () {});
    } catch (e) {}
  })();

  overlay.appendChild(img);
  overlay.appendChild(power);
  overlay.appendChild(copy);
  overlay.appendChild(hint);
  overlay.appendChild(bar);
  root.appendChild(overlay); // on <html>, outside <body>, so it exists before <body> parses

  // Lock the page while booting: `inert` blocks focus (so a modal can't steal it or trap
  // keys), clicks and screen readers. Released in finish(). Our listener registers first,
  // so this runs before main.js's own DOMContentLoaded code can open the ToS modal.
  // Unconditional lock rules (NOT tied to the html.gh-booting class, which main.js could
  // wipe when it toggles its own html classes like no-crt / low-power). Two stylesheets:
  //   lockEl: hides the whole page; removed when the overlay starts fading out.
  //   tosEl : keeps the Terms of Service modal hidden until the overlay is GONE.
  function makeStyle(id, text) {
    var el = document.createElement('style');
    el.id = id;
    el.textContent = text;
    (document.head || root).appendChild(el);
    return el;
  }
  try { if (document.fonts && document.fonts.load) document.fonts.load("16px 'GHBoot'"); } catch (e) {}
  var lockEl = makeStyle('gh-boot-lock',
    'body,body *{visibility:hidden!important;pointer-events:none!important}' +
    'html>:not(#gh-boot-overlay):not(head):not(body):not(script):not(style):not(link):not(meta){' +
    'visibility:hidden!important;pointer-events:none!important}');
  var tosEl = makeStyle('gh-boot-tos',
    '#tos-modal-overlay,.tos-overlay,.tos-modal-box{display:none!important;visibility:hidden!important;' +
    'opacity:0!important;pointer-events:none!important}');

  function lockPage(locked) {
    try { if (document.body) document.body.inert = locked; } catch (e) {}
  }
  lockPage(true);

  // If anything strips our html class or detaches the overlay mid-boot, put it back.
  var guardObs = null;
  try {
    guardObs = new MutationObserver(function () {
      if (phase === 'done') return;
      if (!root.classList.contains('gh-booting')) root.classList.add('gh-booting');
      if (overlay.parentNode !== root) root.appendChild(overlay);
      lockPage(true);
    });
    guardObs.observe(root, { attributes: true, attributeFilter: ['class'], childList: true });
  } catch (e) {}

  document.addEventListener('DOMContentLoaded', function () { if (phase !== 'done') lockPage(true); });
  document.addEventListener('readystatechange', function () { if (phase !== 'done') lockPage(true); });

  // ---------- Audio ----------
  var audio = new Audio();
  audio.preload = 'auto';
  var blobUrl = '';

  // ---------- State ----------
  var phase = 'loading'; // loading -> waiting (power screen) -> running -> done
  var bootStartedAt = 0;
  var skipAllowedAt = 0;
  var endTimer = null;
  var hintTimer = null;
  var watchdog = null;
  var pausedSince = 0;
  var assetsTimer = null;
  var postTimer = null;
  var clockTimer = null;
  var postStopped = false;
  var cursorEl = null;
  var barTimer = null;

  function playAttempt() {
    // Resolves 'ok' | 'blocked' (needs a user gesture) | 'fail' (missing/unsupported file).
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

  // Progress mapping with a few tiny hitches. The curve f(t) runs from f(0)=0 to f(1)=1,
  // so the bar always starts and ends exactly with the real boot (same total time); in
  // between it drifts a little slower/faster and stalls very briefly a couple of times.
  function makeStutterCurve() {
    var segs = [], w = 0, hitches = 0, i;
    while (w < 0.98) {
      var cw = 0.07 + Math.random() * 0.10;
      segs.push({ w: cw, s: 0.8 + Math.random() * 0.4 });         // slightly slower/faster
      w += cw;
      if (hitches < 2 && w > 0.2 && w < 0.85 && Math.random() < 0.45) {
        var hw = 0.02 + Math.random() * 0.012;
        segs.push({ w: hw, s: 0.05 });                              // tiny near-pause
        w += hw; hitches++;
      }
    }
    if (!hitches) segs.splice(Math.floor(segs.length / 2), 0, { w: 0.025, s: 0.05 });
    var W = 0, D = 0;
    for (i = 0; i < segs.length; i++) W += segs[i].w;
    for (i = 0; i < segs.length; i++) { segs[i].w /= W; D += segs[i].w * segs[i].s; }
    var t0 = 0, p0 = 0;
    for (i = 0; i < segs.length; i++) {
      segs[i].t0 = t0; segs[i].p0 = p0;
      segs[i].dp = segs[i].w * segs[i].s / D;
      t0 += segs[i].w; p0 += segs[i].dp;
    }
    return function (t) {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      for (var j = segs.length - 1; j >= 0; j--) {
        if (t >= segs[j].t0) return segs[j].p0 + (t - segs[j].t0) / segs[j].w * segs[j].dp;
      }
      return 0;
    };
  }

  function startBar(soundIsPlaying) {
    stopBar();
    var curve = makeStutterCurve();
    function frame() {
      barTimer = 0;
      if (phase !== 'running') return;
      var t, elapsed = Date.now() - bootStartedAt;
      if (soundIsPlaying && isFinite(audio.duration) && audio.duration > 0) {
        t = audio.currentTime / audio.duration;
      } else if (soundIsPlaying) {
        t = Math.min(0.95, elapsed / 15000); // duration unknown: creep, never claim to be done
      } else {
        t = elapsed / SILENT_BOOT_MS;
      }
      bar.style.width = (curve(Math.max(0, Math.min(1, t))) * 100).toFixed(2) + '%';
      barTimer = (window.requestAnimationFrame || function (f) { return setTimeout(f, 33); })(frame);
    }
    frame();
  }

  function stopBar() {
    if (!barTimer) return;
    try { (window.cancelAnimationFrame || clearTimeout)(barTimer); } catch (e) {}
    barTimer = 0;
  }

  function audioIsPlaying() {
    return !audio.paused && !audio.ended && audio.readyState > 2;
  }

  function finish() {
    if (phase === 'done') return;
    phase = 'done';

    clearTimeout(endTimer);
    clearTimeout(hintTimer);
    clearTimeout(assetsTimer);
    clearInterval(watchdog);
    stopBar();
    bar.style.width = '100%';
    stopPost();
    try { audio.pause(); } catch (e) {}

    document.removeEventListener('keydown', onKeyDown, true);
    overlay.removeEventListener('click', onOverlayClick);

    // Reveal the page now so it shows beneath the fading overlay.
    // Reveal the page now (under the fading overlay), but the ToS modal stays hidden
    // until the overlay is completely gone: see the timeout below.
    if (guardObs) { try { guardObs.disconnect(); } catch (e) {} }
    lockPage(false);
    if (lockEl.parentNode) lockEl.parentNode.removeChild(lockEl);
    root.classList.remove('gh-booting');
    overlay.classList.add('gh-boot-out');

    setTimeout(function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
      if (blobUrl) { try { URL.revokeObjectURL(blobUrl); } catch (e) {} }
      try { audio.removeAttribute('src'); audio.load(); } catch (e) {}
      // Boot is completely over: now (and only now) the Terms modal may appear.
      window.__ghBooting = false;
      if (tosEl.parentNode) tosEl.parentNode.removeChild(tosEl);
      try {
        var tosOverlay = document.getElementById('tos-modal-overlay');
        var accept = document.getElementById('tos-accept-btn');
        if (tosOverlay && accept && getComputedStyle(tosOverlay).display !== 'none') accept.focus();
      } catch (e) {}
      try { window.dispatchEvent(new CustomEvent('gh-boot-complete')); } catch (e) {}
    }, FADE_MS + 50);
  }

  function beginBoot(soundIsPlaying) {
    if (phase === 'done' || phase === 'running') return;
    phase = 'running';
    bootStartedAt = Date.now();
    skipAllowedAt = bootStartedAt + SKIP_GUARD_MS;

    overlay.classList.remove('gh-boot-waiting');
    overlay.classList.add('gh-boot-running');
    hintTimer = setTimeout(function () { hint.classList.add('gh-show'); }, 1500);
    startBar(soundIsPlaying);

    if (soundIsPlaying) {
      // Finish only when the track actually ends (or the user skips).
      audio.addEventListener('ended', function () {
        if (phase === 'running') endTimer = setTimeout(finish, TAIL_MS);
      }, { once: true });

      // Safety net for a genuinely broken stream: only acts if the audio is no
      // longer playing, or has run far past its own length. It never ends a
      // boot while the sound is healthy.
      watchdog = setInterval(function () {
        if (phase !== 'running') return;
        var elapsed = Date.now() - bootStartedAt;
        var dur = isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;

        if (audio.ended) return; // 'ended' handler takes it from here
        if (audio.paused || audio.readyState <= 2) {
          if (!pausedSince) pausedSince = Date.now();
          if (Date.now() - pausedSince > STALL_GRACE_MS && elapsed > 1500) finish();
        } else {
          pausedSince = 0;
        }
        if (elapsed > ((dur || 120) + 5) * 1000) finish();
      }, 500);
    } else {
      // No sound: the timer starts HERE, after the power button (if any) was pressed.
      endTimer = setTimeout(finish, SILENT_BOOT_MS);
    }
  }

  function powerOn() {
    if (phase !== 'waiting') return;
    phase = 'powering'; // blocks double activation (keydown + click)
    stopPost();

    // play() must run synchronously inside the user's click/key event.
    playAttempt().then(function (result) {
      // Trust what the audio element is really doing, not just the promise result.
      var playing = result === 'ok' || audioIsPlaying();
      phase = 'waiting';
      beginBoot(playing);
    });
  }

  function showPowerScreen() {
    if (phase !== 'loading') return;
    phase = 'waiting';
    overlay.classList.add('gh-boot-waiting');
    startPost();
  }

  // ---------- POST screen ----------
  var reduceMotion = false;
  try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function stopPost() {
    postStopped = true;
    clearTimeout(postTimer);
    clearInterval(clockTimer);
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function timeString(d) {
    var date = d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit' });
    var time = d.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' });
    return date + '  ' + time;
  }

  function fmtBytes(n) {
    if (!isFinite(n) || n < 0) return '?';
    var u = ['B', 'KB', 'MB', 'GB', 'TB'], i = 0;
    while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
    return (i === 0 ? String(Math.round(n)) : n.toFixed(n >= 100 ? 0 : 1)) + ' ' + u[i];
  }

  function withTimeout(makePromise, ms) {
    return new Promise(function (resolve) {
      var t = setTimeout(function () { resolve(null); }, ms);
      var p = null;
      try { p = makePromise(); } catch (e) { p = null; }
      Promise.resolve(p).then(
        function (v) { clearTimeout(t); resolve(v || null); },
        function () { clearTimeout(t); resolve(null); }
      );
    });
  }

  function gatherInfo() {
    var info = {};
    return Promise.all([
      withTimeout(function () { return navigator.getBattery && navigator.getBattery(); }, 500)
        .then(function (b) { info.battery = b; }),
      withTimeout(function () { return navigator.storage && navigator.storage.estimate && navigator.storage.estimate(); }, 500)
        .then(function (e) { info.storage = e; }),
      withTimeout(function () {
        return navigator.userAgentData && navigator.userAgentData.getHighEntropyValues &&
          navigator.userAgentData.getHighEntropyValues(['architecture', 'bitness']);
      }, 500).then(function (v) { info.uad = v; })
    ]).then(function () { return info; });
  }

  function getGPU() {
    try {
      var c = document.createElement('canvas');
      var gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!gl) return null;
      var ext = gl.getExtension('WEBGL_debug_renderer_info');
      var r = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
      var lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
      return r.replace(/^ANGLE \((.*)\)$/, '$1');
    } catch (e) { return null; }
  }

  function getBrowserOS() {
    var ua = navigator.userAgent || '';
    var uad = navigator.userAgentData;
    var browser = 'Unknown browser', m;
    if ((m = ua.match(/Edg\/(\d+)/))) browser = 'Microsoft Edge ' + m[1];
    else if ((m = ua.match(/OPR\/(\d+)/))) browser = 'Opera ' + m[1];
    else if ((m = ua.match(/(?:Firefox|FxiOS)\/(\d+)/))) browser = 'Firefox ' + m[1];
    else if ((m = ua.match(/(?:Chrome|CriOS)\/(\d+)/))) browser = 'Chrome ' + m[1];
    else if ((m = ua.match(/Version\/(\d+).*Safari/))) browser = 'Safari ' + m[1];

    var os = 'Unknown OS';
    if (uad && uad.platform) os = uad.platform;
    else if (/Windows/.test(ua)) os = 'Windows';
    else if (/Android/.test(ua)) os = 'Android';
    else if (/iPhone|iPod/.test(ua)) os = 'iOS';
    else if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) os = 'iPadOS';
    else if (/Mac OS X|Macintosh/.test(ua)) os = 'macOS';
    else if (/CrOS/.test(ua)) os = 'ChromeOS';
    else if (/Linux/.test(ua)) os = 'Linux';
    return { browser: browser, os: os };
  }

  function bumpBootCount() {
    var count = 1, last = null;
    try {
      count = (parseInt(window.localStorage.getItem(COUNT_KEY), 10) || 0) + 1;
      last = window.localStorage.getItem(LAST_KEY);
      window.localStorage.setItem(COUNT_KEY, String(count));
      window.localStorage.setItem(LAST_KEY, new Date().toISOString());
    } catch (e) {}
    return { count: count, last: last };
  }

  function addLine(label, value, status, cls) {
    var line = document.createElement('div');
    line.className = 'gh-bl' + (cls ? ' ' + cls : '');
    var valEl = null;
    if (label) {
      var k = document.createElement('span');
      k.className = 'k';
      k.textContent = label;
      line.appendChild(k);
    }
    if (value !== null && value !== undefined && value !== '') {
      valEl = document.createElement('span');
      valEl.className = 'v';
      valEl.textContent = value;
      line.appendChild(valEl);
    }
    if (status) {
      var st = document.createElement('span');
      st.className = 'hi';
      st.textContent = ' ' + status;
      line.appendChild(st);
    }
    if (cursorEl && cursorEl.parentNode) cursorEl.parentNode.removeChild(cursorEl);
    cursorEl = document.createElement('span');
    cursorEl.id = 'gh-bios-cur';
    line.appendChild(cursorEl);
    term.appendChild(line);
    term.scrollTop = term.scrollHeight;
    return { line: line, val: valEl };
  }

  function buildPostItems(info) {
    var items = [];
    var now = new Date();
    var bo = getBrowserOS();
    var mdy = pad2(now.getMonth() + 1) + '/' + pad2(now.getDate()) + '/' + String(now.getFullYear()).slice(-2);
    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}

    var cores = navigator.hardwareConcurrency;
    var arch = '';
    if (info.uad && info.uad.architecture) {
      arch = ' (' + info.uad.architecture + (info.uad.bitness ? ' ' + info.uad.bitness + '-bit' : '') + ')';
    }
    var mem = navigator.deviceMemory;
    var memLabel = mem ? (mem >= 8 ? '8+ GB' : mem + ' GB') : 'not reported by browser';
    var memTotalK = Math.round((mem || 4) * 1024 * 1024);
    var gpu = getGPU();

    var scr = window.screen || {};
    var dpr = window.devicePixelRatio || 1;
    var display = (scr.width || '?') + ' x ' + (scr.height || '?') + ', ' + (scr.colorDepth || 24) +
      '-bit color, ' + (Math.round(dpr * 100) / 100) + 'x scale';

    var pointer = 'Keyboard detected';
    try {
      var fine = window.matchMedia('(pointer: fine)').matches;
      var touch = navigator.maxTouchPoints || 0;
      pointer = (fine ? 'Mouse / trackpad' : 'No fine pointer') + (touch ? ', touchscreen (' + touch + ' pt)' : '');
    } catch (e) {}

    var pads = 0;
    try {
      var gp = navigator.getGamepads ? navigator.getGamepads() : [];
      for (var i = 0; i < gp.length; i++) if (gp[i]) pads++;
    } catch (e) {}

    var net = navigator.onLine === false ? 'OFFLINE' : 'ONLINE';
    var conn = navigator.connection;
    if (conn && navigator.onLine !== false) {
      var bits = [];
      if (conn.effectiveType) bits.push(conn.effectiveType);
      if (conn.downlink) bits.push('~' + conn.downlink + ' Mbps');
      if (conn.rtt) bits.push(conn.rtt + ' ms RTT');
      if (bits.length) net += ' (' + bits.join(', ') + ')';
    }

    var powerStr = 'Not reported by browser';
    if (info.battery) {
      powerStr = 'Battery ' + Math.round(info.battery.level * 100) + '%' + (info.battery.charging ? ' (charging)' : ' (discharging)');
    } else if (navigator.getBattery) {
      powerStr = 'AC power';
    }

    var disk = OS_NAME + ' origin storage';
    if (info.storage && info.storage.quota) {
      disk += ', ' + fmtBytes(info.storage.usage || 0) + ' used of ' + fmtBytes(info.storage.quota);
    }

    var standalone = false;
    try { standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) {}
    var sw = (navigator.serviceWorker && navigator.serviceWorker.controller) ? 'ACTIVE (offline cache ready)' : 'not yet installed';
    var bc = bumpBootCount();

    items.push({ blank: true });
    items.push({ k: 'Date / Time', v: timeString(now) + (tz ? '  [' + tz + ']' : '') });
    items.push({ k: 'System ID', v: now.getFullYear() + '-MHRD-' + OS_NAME.toUpperCase() + '-00' });
    items.push({ blank: true });
    items.push({ k: 'Main Processor', v: (cores ? cores + ' logical core' + (cores === 1 ? '' : 's') : 'unknown core count') + arch, s: 'OK' });
    items.push({ mem: memTotalK, label: 'Memory Test', note: '(' + memLabel + ')' });
    items.push({ k: 'Video Adapter', v: gpu || 'Generic (WebGL unavailable)', s: 'OK' });
    items.push({ k: 'Display', v: display });
    items.push({ k: 'Window', v: window.innerWidth + ' x ' + window.innerHeight });
    items.push({ pause: 140 });
    items.push({ blank: true });
    items.push({ text: 'Detecting hardware ...' });
    items.push({ k: 'Pointing Device', v: pointer, s: 'OK' });
    items.push({ k: 'Game Controllers', v: pads ? pads + ' detected' : 'none detected' });
    items.push({ k: 'Network Adapter', v: net, s: navigator.onLine === false ? '' : 'OK' });
    items.push({ k: 'Power Source', v: powerStr });
    items.push({ k: 'Primary Master', v: disk, s: 'OK' });
    items.push({ k: 'Cache Service', v: sw });
    items.push({ k: 'Locale', v: navigator.language || 'unknown' });
    items.push({ pause: 120 });
    items.push({ blank: true });
    items.push({ k: 'Operating System', v: bo.os });
    items.push({ k: 'Browser Engine', v: bo.browser });
    items.push({ k: 'Launch Mode', v: standalone ? 'Installed app' : 'Browser tab' });
    items.push({ blank: true });
    items.push({ text: 'Verifying DMI Pool Data ........', s: 'OK' });
    items.push({ text: 'Checking NVRAM ..................', s: 'Update OK!' });
    items.push({ text: 'Plug and Play device scan complete', cls: 'dim' });
    items.push({ k: 'Boot Count', v: String(bc.count) + (bc.last ? '   (last boot: ' + timeString(new Date(bc.last)) + ')' : '   (first boot)') });
    items.push({ pause: 180 });
    items.push({ blank: true });
    items.push({ text: 'Power-on self test complete: 0 errors found', cls: 'hi' });
    items.push({ text: 'Boot device: ' + CORP_SHORT + ' ' + OS_NAME + ' (Hard Disk C:)', cls: 'hi' });
    items.push({ blank: true });
    items.push({ prompt: true });
    return items;
  }

  function startPost() {
    postStopped = false;

    // Header appears instantly; live clock ticks in the corner.
    postHeaderVal = addLine('', postHeaderText(), '', 'hi').val;
    addLine('', 'Copyright (C) ' + COPY_FROM + '-' + new Date().getFullYear() + ' ' + CORP_NAME + '. All Rights Reserved.', '', '');
    addLine('', CORP_SHORT + ': hard by name, hard by nature.', '', 'dim');
    function tick() { clockEl.textContent = timeString(new Date()); }
    tick();
    clockTimer = setInterval(tick, 1000);

    gatherInfo().then(function (info) {
      if (postStopped || phase !== 'waiting') return;
      runPost(buildPostItems(info));
    });
  }

  function runPost(items) {
    var i = 0;
    function lineDelay() { return reduceMotion ? 0 : 20 + Math.random() * 30; }

    function next() {
      if (postStopped || phase !== 'waiting') return;
      if (i >= items.length) return;
      var it = items[i++];

      if (it.pause) {
        postTimer = setTimeout(next, reduceMotion ? 0 : it.pause);
      } else if (it.blank) {
        addLine('', '', '', '');
        postTimer = setTimeout(next, lineDelay());
      } else if (it.mem) {
        runMemTest(it, function () { postTimer = setTimeout(next, lineDelay()); });
      } else if (it.prompt) {
        addLine('', 'Press ENTER, click anywhere, or press any key to boot into ' + OS_NAME, '', 'hi');
        addLine('', 'Press ESC to skip the boot sequence', '', 'dim');
      } else if (it.text !== undefined) {
        addLine('', it.text, it.s || '', it.cls || '');
        postTimer = setTimeout(next, lineDelay());
      } else {
        addLine(it.k, it.v, it.s || '', it.cls || '');
        postTimer = setTimeout(next, lineDelay());
      }
    }
    next();
  }

  function runMemTest(it, done) {
    var row = addLine(it.label, '0K', '', '');
    var start = Date.now();
    var dur = reduceMotion ? 0 : 650;
    (function step() {
      if (postStopped || phase !== 'waiting') return;
      var p = dur === 0 ? 1 : Math.min(1, (Date.now() - start) / dur);
      if (p < 1) {
        row.val.textContent = Math.floor(it.mem * p) + 'K';
        postTimer = setTimeout(step, 24);
      } else {
        row.val.textContent = it.mem + 'K ' + it.note;
        var ok = document.createElement('span');
        ok.className = 'hi';
        ok.textContent = ' OK';
        row.line.insertBefore(ok, cursorEl);
        done();
      }
    })();
  }

  function onOverlayClick() {
    if (phase === 'waiting') powerOn();
    else if (phase === 'running' && Date.now() >= skipAllowedAt) finish();
  }

  function isNonActivatingKey(e) {
    // Modifier-only keys, shortcuts (Ctrl+R, Alt+Tab...) and F-keys (F5, F11, F12)
    // must pass through to the browser and cannot unlock audio anyway.
    if (e.ctrlKey || e.metaKey || e.altKey) return true;
    return /^(Shift|Control|Alt|AltGraph|Meta|OS|CapsLock|NumLock|ScrollLock|Fn|FnLock|ContextMenu|Dead|Unidentified|F\d{1,2})$/.test(e.key);
  }

  function onKeyDown(e) {
    if (phase === 'done') return;
    e.stopPropagation(); // nothing behind the boot screen reacts to keys

    var key = e.key;
    if (key === 'Escape') {
      if (phase === 'waiting' || phase === 'powering' || phase === 'loading' ||
          (phase === 'running' && Date.now() >= skipAllowedAt)) {
        e.preventDefault();
        finish();
      }
      return;
    }

    if (phase === 'waiting') {
      if (isNonActivatingKey(e)) return;
      e.preventDefault();
      powerOn(); // Enter, Space, letters... anything
    } else if (phase === 'running') {
      if ((key === 'Enter' || key === ' ') && Date.now() >= skipAllowedAt) {
        e.preventDefault();
        finish();
      }
    }
  }

  document.addEventListener('keydown', onKeyDown, true);
  overlay.addEventListener('click', onOverlayClick);

  // ---------- Load assets, then try to autoplay ----------
  var pending = 2;
  var imgDone = false;
  var audioDone = false;
  var started = false;

  function startSequence() {
    if (started || phase !== 'loading') return;
    started = true;
    clearTimeout(assetsTimer);

    playAttempt().then(function (result) {
      if (phase !== 'loading') return; // skipped with Escape meanwhile
      if (result === 'blocked') showPowerScreen();
      else beginBoot(result === 'ok');
    });
  }

  function assetFinished() {
    pending -= 1;
    if (pending <= 0) startSequence();
  }

  // Image
  img.onload = function () { if (!imgDone) { imgDone = true; assetFinished(); } };
  img.onerror = function () {
    if (img.parentNode) img.parentNode.removeChild(img); // no broken-image icon
    if (!imgDone) { imgDone = true; assetFinished(); }
  };
  img.src = assetUrl(IMAGE_FILE);
  if (img.complete && img.naturalWidth > 0) img.onload();

  // Audio: fetch the whole file as a Blob so playback never depends on HTTP range
  // requests or the service worker, and so duration is known up front.
  function audioReady() { if (!audioDone) { audioDone = true; assetFinished(); } }
  function useDirectAudio() {
    if (audioDone) return;
    audio.src = assetUrl(AUDIO_FILE);
    audioReady();
  }

  var fetchTimer = setTimeout(useDirectAudio, AUDIO_FETCH_TIMEOUT_MS);
  if (window.fetch && window.URL && URL.createObjectURL) {
    fetch(assetUrl(AUDIO_FILE)).then(function (res) {
      if (!res.ok) throw new Error('audio ' + res.status);
      return res.blob();
    }).then(function (blob) {
      if (audioDone) return;
      clearTimeout(fetchTimer);
      blobUrl = URL.createObjectURL(blob);
      audio.src = blobUrl;
      audioReady();
    }).catch(function () {
      clearTimeout(fetchTimer);
      useDirectAudio();
    });
  } else {
    clearTimeout(fetchTimer);
    useDirectAudio();
  }

  assetsTimer = setTimeout(startSequence, ASSETS_TIMEOUT_MS);
})();
