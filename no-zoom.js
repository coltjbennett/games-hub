/* no-zoom.js — zooming is disabled everywhere on the site, on purpose.
 *
 * Why not just `user-scalable=no`? Some browsers (notably iOS Safari) ignore it, and a half-disabled zoom is worse than
 * none: an edge case (a focus auto-zoom, a stray pinch) can zoom the page in while the way back out is blocked.
 * So this file does three things, in every page and in every same-origin frame the shell opens:
 *   1. pins the viewport meta (no scaling at all),
 *   2. cancels every zoom input: pinch gestures, two-finger touch moves, Ctrl/Cmd + wheel, Ctrl/Cmd + + / - / 0,
 *   3. if a zoom still sneaks through (visualViewport.scale > 1), snaps the page straight back to 100%.
 *
 * Load it with <script src="no-zoom.js"></script> in <head>. main.js also calls GHNoZoom.install(frameWindow) for iframes.
 */
(function (g) {
  'use strict';
  if (g.GHNoZoom) return;
  /* base URL of this script, so cursors/images resolve the same way inside every frame */
  var BASE = (function () { try { var cs = document.currentScript; return cs && cs.src ? cs.src.replace(/no-zoom\.js[^/]*$/, '') : ''; } catch (e) { return ''; } })();
  var CONTENT = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no';

  function viewportMeta(doc) { return doc.querySelector('meta[name="viewport"]'); }
  function wanted(m) { return CONTENT + (m && /viewport-fit\s*=\s*cover/i.test(m.content || '') ? ', viewport-fit=cover' : ''); }
  function pinMeta(doc) {
    try {
      var m = viewportMeta(doc), want = wanted(m);
      if (!m) { m = doc.createElement('meta'); m.name = 'viewport'; m.content = want; (doc.head || doc.documentElement).appendChild(m); }
      else if (m.content !== want) m.content = want;
    } catch (e) {}
  }
  /* Replacing the meta element (not just editing it) is what makes browsers re-evaluate the viewport and drop a stuck zoom. */
  function resetZoom(win) {
    try {
      var doc = win.document, m = viewportMeta(doc);
      if (m && m.parentNode) { var n = doc.createElement('meta'); n.name = 'viewport'; n.content = wanted(m); m.parentNode.replaceChild(n, m); }
      else pinMeta(doc);
      var x = win.pageXOffset, y = win.pageYOffset; win.scrollTo(x, y);
    } catch (e) {}
  }


  /* ---- Win95 cursors everywhere (v4.6): plain pointer/default/text become the site's own cursor files; resize/grab/etc. are left alone ---- */
  function cursorize(doc) {
    var vu = doc && doc.defaultView && doc.defaultView.__vfsUrl;   /* single-file build: files come from the embedded virtual file system */
    if ((!BASE && !vu) || !doc || !doc.styleSheets) return;
    var U = function (f) { return vu ? vu(f) : BASE + f; };
    try { if (/\/games\//.test(doc.defaultView.location.pathname)) return; } catch (e) { return; }
    var A = 'url("' + U('images/arrow.cur') + '"), default', P = 'url("' + U('images/Cursor_15.cur') + '"), pointer', T = 'url("' + U('images/Beam.cur') + '"), text';
    var fix = function (rules) {
      for (var i = 0; i < rules.length; i++) {
        var r = rules[i];
        if (r.style) { var v = (r.style.getPropertyValue('cursor') || '').trim().toLowerCase(); if (!v || /^url\(/.test(v)) continue; var m = v === 'pointer' ? P : v === 'text' ? T : (v === 'default' || v === 'auto') ? A : null; if (m) r.style.setProperty('cursor', m, r.style.getPropertyPriority('cursor')); }
        if (r.cssRules) fix(r.cssRules);
      }
    };
    var run = function () { for (var k = 0; k < doc.styleSheets.length; k++) { try { fix(doc.styleSheets[k].cssRules); } catch (e) { /* cross-origin sheet */ } } };
    run();
    try {
      var st = doc.createElement('style'); st.setAttribute('data-gh-cursor', '');
      st.textContent = 'html,html *{cursor:' + A + '}html :is(a,button,summary,select,label[for],[role=button],[role=tab],[role=menuitem],[role=option],input[type=button],input[type=submit],input[type=checkbox],input[type=radio],input[type=range],[onclick]){cursor:' + P + '}html :is(input:not([type]),input[type=text],input[type=search],input[type=password],input[type=number],textarea,[contenteditable=true]){cursor:' + T + '}[style*="cursor:pointer"],[style*="cursor: pointer"]{cursor:' + P + ' !important}';
      (doc.head || doc.documentElement).insertBefore(st, (doc.head || doc.documentElement).firstChild);
    } catch (e) {}
    doc.defaultView.addEventListener('load', run); setTimeout(run, 1200);
  }

  function install(win) {
    try {
      if (!win || win.__ghNoZoom) return;
      var doc = win.document; if (!doc) return;
      win.__ghNoZoom = true;
      pinMeta(doc);
      cursorize(doc);

      /* double-tap zoom + pinch via CSS (a scrolling container may still pan) */
      try {
        var st = doc.createElement('style'); st.setAttribute('data-gh-nozoom', '');
        st.textContent = 'html{touch-action:pan-x pan-y;-webkit-text-size-adjust:100%;text-size-adjust:100%}';
        (doc.head || doc.documentElement).appendChild(st);
      } catch (e) {}

      var stop = function (e) { if (e.cancelable) e.preventDefault(); };
      ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (ev) { doc.addEventListener(ev, stop, { passive: false, capture: true }); });
      /* two-finger pinch on touch screens (single-finger drags and games' own multi-touch controls are untouched: only the default action is cancelled) */
      doc.addEventListener('touchmove', function (e) { if ((e.touches && e.touches.length > 1) || (e.scale && e.scale !== 1)) stop(e); }, { passive: false, capture: true });
      /* Ctrl/Cmd + wheel (mouse) and trackpad pinch (Chrome/Edge/Firefox report it as Ctrl + wheel) */
      doc.addEventListener('wheel', function (e) { if (e.ctrlKey || e.metaKey) stop(e); }, { passive: false, capture: true });
      /* Ctrl/Cmd + + / = / - / _ / 0 */
      doc.addEventListener('keydown', function (e) {
        if (!(e.ctrlKey || e.metaKey)) return;
        var k = e.key;
        if (k === '+' || k === '=' || k === '-' || k === '_' || k === '0' || k === 'Add' || k === 'Subtract' || e.code === 'NumpadAdd' || e.code === 'NumpadSubtract' || e.code === 'Numpad0') stop(e);
      }, { passive: false, capture: true });

      /* safety net: if the page ever ends up zoomed in, put it back */
      var vv = win.visualViewport;
      if (vv && vv.addEventListener) {
        var check = function () { if (vv.scale && vv.scale > 1.01) resetZoom(win); };
        vv.addEventListener('resize', check);
        vv.addEventListener('scroll', check);
      }
      win.addEventListener('pageshow', function () { pinMeta(doc); });

      /* same-origin frames opened later (the desktop's app windows) get the same treatment */
      doc.addEventListener('load', function (e) { var t = e.target; if (t && t.tagName === 'IFRAME') { try { install(t.contentWindow); } catch (x) {} } }, true);
      var fr = doc.querySelectorAll ? doc.querySelectorAll('iframe') : [];
      for (var i = 0; i < fr.length; i++) { try { install(fr[i].contentWindow); } catch (x) {} }
    } catch (e) { /* cross-origin frame: its own meta tag has to do the job */ }
  }

  g.GHNoZoom = { install: install, reset: function () { resetZoom(g); }, content: CONTENT };
  install(g);
})(window);
