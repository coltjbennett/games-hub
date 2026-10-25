/*
 * boot.js — Windows 95-style boot sequence for the Project Launcher.
 *
 * Loaded synchronously as the FIRST script in index.html's <head>, so the boot
 * screen covers the page before the stylesheet, main.js, or the Terms of Service
 * modal can show anything.
 *
 * Behavior
 *  - Plays only on a fresh launch (new tab / new browser session). Skipped on
 *    refresh, back/forward navigation, and service-worker update reloads.
 *  - Tries to start audio automatically. If the browser blocks that (normal for
 *    first-time visitors and Safari/iOS), a retro PC power button is shown;
 *    pressing it is the user gesture that unlocks audio.
 *  - The sound is NEVER cut short: while the track is really playing, only the
 *    user can end the boot. Timers for a silent boot only start after the
 *    power button is pressed (or immediately when no power screen is needed).
 *  - Click / Enter / Space / Escape skips once the boot has started.
 *
 * Opt-outs
 *  - ?noboot in the URL for a single visit.
 *  - localStorage.setItem('gh-skip-boot', '1') disables it permanently.
 *
 * Assets (case-sensitive on GitHub Pages):
 *    images/bootscreen.PNG
 *    images/win95.mp3
 *    images/w95f.woff2 / w95f.woff   (already in the repo; used for the power screen)
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
    'html.gh-booting body{visibility:hidden!important}',

    '#gh-boot-overlay{position:fixed;inset:0;z-index:2147483647;background:#000;color:#c0c0c0;',
    'display:flex;align-items:center;justify-content:center;overflow:hidden;',
    "font-family:'GHBoot','MS Sans Serif',Tahoma,Geneva,sans-serif;",
    'opacity:1;transition:opacity ' + FADE_MS + 'ms ease;cursor:default;',
    '-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}',
    '#gh-boot-overlay.gh-boot-out{opacity:0;pointer-events:none}',

    /* boot picture + CRT turn-on */
    '#gh-boot-img{display:none;width:100%;height:100%;object-fit:contain;background:#000}',
    '#gh-boot-overlay.gh-boot-running #gh-boot-img{display:block;',
    'animation:gh-crt-on .65s cubic-bezier(.2,.8,.2,1) both}',
    '@keyframes gh-crt-on{',
    '0%{transform:scale(.02,.004);filter:brightness(8);opacity:0}',
    '12%{opacity:1}',
    '30%{transform:scale(1,.004);filter:brightness(8)}',
    '70%{transform:scale(1,1.03);filter:brightness(2.4)}',
    '100%{transform:scale(1,1);filter:brightness(1)}}',

    /* power screen */
    '#gh-boot-power{display:none;flex-direction:column;align-items:center;gap:26px;',
    'padding:24px;text-align:center;position:relative;z-index:1}',
    '#gh-boot-overlay.gh-boot-waiting #gh-boot-power{display:flex}',
    /* faint scanlines + vignette over the whole power screen */
    '#gh-boot-overlay.gh-boot-waiting::before{content:"";position:absolute;inset:0;pointer-events:none;',
    'background:repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0,rgba(255,255,255,.035) 1px,transparent 1px,transparent 3px),',
    'radial-gradient(ellipse at center,transparent 45%,rgba(0,0,0,.65) 100%)}',

    /* the beige PC case front */
    '#gh-boot-case{width:min(440px,88vw);box-sizing:border-box;padding:14px 16px 18px;',
    'background:linear-gradient(180deg,#d9d6cc,#c4c1b6);',
    'border-top:3px solid #fff;border-left:3px solid #fff;border-right:3px solid #4a4a4a;border-bottom:3px solid #4a4a4a;',
    'box-shadow:0 0 0 2px #000,0 18px 40px rgba(0,0,0,.85),inset 1px 1px 0 #efede6,inset -1px -1px 0 #8f8c82}',
    '#gh-boot-badge{display:flex;justify-content:space-between;align-items:baseline;',
    'font-size:12px;letter-spacing:.12em;color:#3d3d3d;text-transform:uppercase;',
    'padding:0 2px 10px;border-bottom:2px groove #aaa79c;margin-bottom:14px}',
    '#gh-boot-badge b{color:#000080;font-weight:normal}',
    '#gh-boot-row{display:flex;align-items:center;justify-content:space-between;gap:16px}',

    '#gh-boot-vents{display:flex;flex-direction:column;gap:5px;width:84px}',
    '#gh-boot-vents i{display:block;height:4px;background:#555;border-radius:2px;',
    'box-shadow:inset 0 1px 1px #000,0 1px 0 #efede6}',

    '#gh-boot-btnwrap{padding:10px;border-radius:16px;background:#9d9a90;',
    'box-shadow:inset 2px 2px 4px rgba(0,0,0,.45),0 1px 0 #efede6}',
    '#gh-boot-btn{display:flex;align-items:center;justify-content:center;width:96px;height:96px;padding:0;',
    'border:0;border-radius:12px;cursor:pointer;color:#2b2b2b;',
    'background:linear-gradient(180deg,#e9e7e0 0%,#cfccc2 55%,#b9b6ab 100%);',
    'box-shadow:inset 2px 2px 0 #fff,inset -2px -2px 0 #7d7a70,0 0 0 2px #1a1a1a,0 7px 0 2px #55524a,0 10px 12px rgba(0,0,0,.55);',
    'transform:translateY(0);transition:transform .06s,box-shadow .06s,color .15s}',
    '#gh-boot-btn:hover{color:#0b7a2b}',
    '#gh-boot-btn:focus-visible{outline:2px dotted #000;outline-offset:6px}',
    '#gh-boot-btn:active,#gh-boot-btn.gh-down{transform:translateY(6px);',
    'box-shadow:inset 2px 2px 0 #7d7a70,inset -2px -2px 0 #fff,0 0 0 2px #1a1a1a,0 1px 0 2px #55524a,0 2px 4px rgba(0,0,0,.5)}',
    '#gh-boot-btn svg{width:46px;height:46px;filter:drop-shadow(0 1px 0 rgba(255,255,255,.7))}',

    '#gh-boot-leds{display:flex;flex-direction:column;gap:12px;width:84px;align-items:flex-start}',
    '.gh-led{display:flex;align-items:center;gap:8px;font-size:11px;letter-spacing:.1em;color:#3d3d3d}',
    '.gh-led i{display:block;width:10px;height:10px;border-radius:50%;border:1px solid #1a1a1a;',
    'box-shadow:inset 1px 1px 1px rgba(255,255,255,.55)}',
    '.gh-led.pwr i{background:#16c53f;box-shadow:0 0 9px #2cff5e,inset 1px 1px 1px rgba(255,255,255,.6);',
    'animation:gh-boot-pulse 1.5s ease-in-out infinite}',
    '.gh-led.hdd i{background:#6a4a00}',
    '@keyframes gh-boot-pulse{0%,100%{opacity:.35}50%{opacity:1}}',

    '#gh-boot-label{font-size:18px;letter-spacing:.2em;text-transform:uppercase;color:#d8d8d8;',
    'text-shadow:0 0 6px rgba(160,255,190,.35)}',
    '#gh-boot-label u{text-decoration:none;animation:gh-boot-blink 1s steps(1) infinite}',
    '@keyframes gh-boot-blink{50%{opacity:0}}',
    '#gh-boot-sub{font-size:12px;letter-spacing:.12em;color:#6f6f6f;margin-top:-10px}',

    '#gh-boot-hint{position:absolute;right:14px;bottom:10px;font-size:12px;letter-spacing:.08em;',
    'color:#6a6a6a;opacity:0;transition:opacity .6s ease;pointer-events:none}',
    '#gh-boot-hint.gh-show{opacity:1}',

    '@media (prefers-reduced-motion:reduce){',
    '#gh-boot-overlay.gh-boot-running #gh-boot-img{animation:none}',
    '.gh-led.pwr i,#gh-boot-label u{animation:none}',
    '#gh-boot-overlay{transition-duration:1ms}}',
    '@media (max-width:420px){#gh-boot-vents{display:none}#gh-boot-row{justify-content:space-around}',
    '#gh-boot-label{font-size:15px}}'
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
    '<div id="gh-boot-case">' +
      '<div id="gh-boot-badge"><span>Project Launcher PC</span><b>Model 95</b></div>' +
      '<div id="gh-boot-row">' +
        '<div id="gh-boot-vents"><i></i><i></i><i></i><i></i><i></i></div>' +
        '<div id="gh-boot-btnwrap">' +
          '<button id="gh-boot-btn" type="button" aria-label="Power on">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" ' +
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<path d="M12 2.8v8.4"/><path d="M6.6 6.5a8 8 0 1 0 10.8 0"/></svg>' +
          '</button>' +
        '</div>' +
        '<div id="gh-boot-leds">' +
          '<div class="gh-led pwr"><i></i><span>POWER</span></div>' +
          '<div class="gh-led hdd"><i></i><span>HDD</span></div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div id="gh-boot-label">Press power button<u>_</u></div>' +
    '<div id="gh-boot-sub">Esc to skip</div>';

  var hint = document.createElement('div');
  hint.id = 'gh-boot-hint';
  hint.textContent = 'Click or press Esc to skip';

  overlay.appendChild(img);
  overlay.appendChild(power);
  overlay.appendChild(hint);
  root.appendChild(overlay); // on <html>, outside <body>, so it exists before <body> parses

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
    try { audio.pause(); } catch (e) {}

    document.removeEventListener('keydown', onKeyDown, true);
    overlay.removeEventListener('click', onOverlayClick);

    // Reveal the page now so it shows beneath the fading overlay.
    root.classList.remove('gh-booting');
    overlay.classList.add('gh-boot-out');

    setTimeout(function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
      if (blobUrl) { try { URL.revokeObjectURL(blobUrl); } catch (e) {} }
      try { audio.removeAttribute('src'); audio.load(); } catch (e) {}
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
    var btn = document.getElementById('gh-boot-btn');
    if (btn) btn.classList.add('gh-down');

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
    var btn = document.getElementById('gh-boot-btn');
    if (btn) { try { btn.focus(); } catch (e) {} }
  }

  function onOverlayClick() {
    if (phase === 'waiting') powerOn();
    else if (phase === 'running' && Date.now() >= skipAllowedAt) finish();
  }

  function onKeyDown(e) {
    if (phase === 'done') return;
    e.stopPropagation(); // nothing behind the boot screen reacts to keys

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
