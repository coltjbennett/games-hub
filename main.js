/* main.js — ColtonOS 95 desktop shell
 *
 * A Windows 95-style desktop: icons you can drag, real windows (drag / resize /
 * minimize / maximize / close), taskbar + Start menu, Explorer-style folders,
 * Control Panel, Run / Find / Shut Down dialogs, and a CRT overlay.
 *
 * Design rules
 *  - One delegated listener per concern; no polling loops (the clock re-arms
 *    itself on the minute boundary and sleeps while the tab is hidden).
 *  - Windows move with transforms and commit left/top on release.
 *  - Games/applets stay in same-origin iframes, so their saves and the chatroom
 *    protocol (parent-shell / universal-chat / arcade-hub) keep working.
 *  - Everything works with mouse, keyboard, touch and pen (Pointer Events).
 */
(function () {
  'use strict';

  const D = document, H = D.documentElement;
  const $ = (s, r) => (r || D).querySelector(s);
  const $$ = (s, r) => Array.from((r || D).querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ORIGIN = window.location.origin;
  const IC = n => 'images/icons/' + n + '.svg';

  /* ---------- tiny DOM builder ---------- */
  function h(tag, attrs, ...kids) {
    const e = D.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
      else if (k === 'on') for (const ev in v) e.addEventListener(ev, v[ev]);
      else if (k === 'dataset') Object.assign(e.dataset, v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat()) { if (c === null || c === undefined || c === false) continue; e.append(c.nodeType ? c : D.createTextNode(String(c))); }
    return e;
  }
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let uid = 0; const nextId = p => (p || 'gh') + '-' + (++uid);

  /* ---------- storage ---------- */
  const store = {
    get(k, d = null) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage may be blocked */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
    json(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    setJson(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    sget(k, d = null) { try { const v = sessionStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    sset(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
    sjson(k, d) { try { const v = sessionStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    ssetJson(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  /* Legacy keys (still written so older cached pages/applets stay in sync) */
  const LEGACY = {
    theme: 'project-launcher-theme-v1', motion: 'project-launcher-reduced-motion-v1', compact: 'project-launcher-compact-v1',
    contrast: 'project-launcher-high-contrast-v1', lowPower: 'project-launcher-low-power-v1', noCrt: 'project-launcher-no-crt',
    favorites: 'project-launcher-favorites-v1', recents: 'project-launcher-recents-v1', visits: 'colton-launcher-visits', visitSession: 'colton-launcher-session'
  };
  const KEYS = {
    settings: 'gh-desktop-v2', icons: 'gh-icons-v2', trash: 'gh-trash-v1', session: 'gh-window-session-v2',
    runHistory: 'gh-run-history-v1', explorerView: 'gh-explorer-view-v1', welcomeShown: 'gh-welcome-shown'
  };

  /* ---------- settings ---------- */
  const DEFAULTS = {
    scheme: 'standard', desktopColor: '#008080', wallpaper: 'logo',
    crt: 'standard', crtIntensity: 100, crtFlicker: false, crtOverGames: false,
    reducedMotion: false, highContrast: false, compact: false, lowPower: false, textScale: 1,
    clickMode: 'auto', dblClickMs: 450, autoHide: false, showClock: true, snap: true, autoArrange: false,
    windowAnim: true, opaqueDrag: true, welcome: true, startupSound: true,
    uiSounds: false, uiVolume: 50, theaterSounds: true, copyDialog: true, busyCursor: true, crashDialogs: true, scandisk: true, crtPower: true,
    wpTilePx: 64, wpSmooth: false, logoSize: 30, iconSpacing: 0, labelLines: 2, labelShadow: false, hideIcons: false, winShadow: false, titleGradient: false, selColor: '', titleColor: '', fontMode: 'w95',
    showOnline: true, clock24: false, showSeconds: false, themeName: '', saver: 'pipes', saverMin: 10, saverText: 'ColtonOS 95', pipesCount: 3, pipesJoint: 'mixed', pipesSpeed: 100
  };
  const SCHEMES = {
    standard: 'Windows Standard', highcontrast: 'High Contrast Black', rose: 'Rose', marine: 'Marine', pumpkin: 'Pumpkin',
    spruce: 'Spruce', slate: 'Slate', wheat: 'Wheat', eggplant: 'Eggplant', rainyday: 'Rainy Day', hotdog: 'Hot Dog Stand'
  };
  const OLD_THEME_MAP = { classic: 'standard', 'win98-blue': 'standard', 'win95-blue': 'standard', 'win95-teal': 'standard', 'windows-gray': 'slate', gray: 'slate', olive: 'spruce', plum: 'eggplant', 'dos-amber': 'pumpkin', 'blue-gray-nt': 'marine', 'midnight-dos': 'highcontrast', midnight: 'highcontrast' };

  let settings = loadSettings();
  function loadSettings() {
    const s = Object.assign({}, DEFAULTS, store.json(KEYS.settings, null) || {});
    if (store.get(KEYS.settings) === null) { // first run on v2: migrate what we can from the old launcher
      const th = store.get(LEGACY.theme);
      if (th && OLD_THEME_MAP[th]) s.scheme = OLD_THEME_MAP[th];
      if (store.get(LEGACY.motion) === 'true') s.reducedMotion = true;
      if (store.get(LEGACY.compact) === 'true') s.compact = true;
      if (store.get(LEGACY.contrast) === 'true') s.highContrast = true;
      if (store.get(LEGACY.lowPower) === 'true') s.lowPower = true;
      if (store.get(LEGACY.noCrt) === 'true') s.crt = 'off';
      if (!store.get(KEYS.settings) && window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) s.reducedMotion = true;
      if (store.get('gh-skip-boot') === '1') s.startupSound = false;
    }
    if (!SCHEMES[s.scheme]) s.scheme = 'standard';
    return s;
  }
  function saveSettings() {
    store.setJson(KEYS.settings, settings);
    // keep the old keys in sync for anything still reading them
    store.set(LEGACY.motion, String(!!settings.reducedMotion)); store.set(LEGACY.compact, String(!!settings.compact));
    store.set(LEGACY.contrast, String(!!settings.highContrast)); store.set(LEGACY.lowPower, String(!!settings.lowPower));
    store.set(LEGACY.noCrt, String(settings.crt === 'off')); store.set(LEGACY.theme, settings.scheme);
    if (settings.startupSound) store.del('gh-skip-boot'); else store.set('gh-skip-boot', '1');
  }

  const fullscreenLow = new Set();
  function devicePrefersLowPower() {
    return !!((navigator.connection && navigator.connection.saveData) ||
      (Number.isFinite(navigator.deviceMemory) && navigator.deviceMemory <= 2) ||
      (Number.isFinite(navigator.hardwareConcurrency) && navigator.hardwareConcurrency <= 2));
  }
  function lowPowerActive() { return settings.lowPower || devicePrefersLowPower() || fullscreenLow.size > 0; }

  let applyHooks = [];
  function applySettings() {
    const s = settings;
    H.dataset.scheme = s.highContrast ? 'highcontrast' : s.scheme;
    H.dataset.crt = s.crt;
    H.style.setProperty('--desktop', s.highContrast ? '#000000' : s.desktopColor);
    H.style.setProperty('--text-scale', String(s.textScale));
    H.style.setProperty('--crt-i', String(clamp(s.crtIntensity, 10, 100) / 100));
    H.classList.toggle('reduced-motion', !!s.reducedMotion);
    H.classList.toggle('high-contrast', !!s.highContrast);
    H.classList.toggle('compact-mode', !!s.compact);
    H.classList.toggle('wp-custom', s.wallpaper === 'custom');
    H.classList.toggle('label-shadow', !!s.labelShadow); H.classList.toggle('hide-icons', !!s.hideIcons);
    H.classList.toggle('win-shadow', !!s.winShadow); H.classList.toggle('title-gradient', !!s.titleGradient);
    H.classList.toggle('no-busy', !s.busyCursor);
    H.style.setProperty('--logo-h', clamp(s.logoSize, 10, 80) + 'vh');
    H.style.setProperty('--label-lines', String(clamp(s.labelLines, 1, 4)));
    H.style.setProperty('--cell', cellSize() + 'px');
    H.style.setProperty('--wp-tile', clamp(s.wpTilePx, 8, 512) + 'px');
    H.classList.toggle('wp-smooth', !!s.wpSmooth);
    const hc = s.highContrast;
    s.selColor && !hc ? H.style.setProperty('--sel', s.selColor) : H.style.removeProperty('--sel');
    s.titleColor && !hc ? H.style.setProperty('--title-a', s.titleColor) : H.style.removeProperty('--title-a');
    s.fontMode === 'system' ? H.style.setProperty('--ui-font', 'Tahoma, "Segoe UI", system-ui, sans-serif') : H.style.removeProperty('--ui-font');
    H.classList.toggle('no-wallpaper', s.wallpaper === 'none');
    H.classList.toggle('wp-tile', s.wallpaper === 'tile');
    armSaver();
    H.classList.toggle('taskbar-autohide', !!s.autoHide);
    H.classList.toggle('crt-pause', !s.crtOverGames);
    H.classList.toggle('low-power', lowPowerActive());
    H.classList.toggle('auto-low-power', devicePrefersLowPower());
    const crt = $('#crt');
    if (crt) crt.classList.toggle('flicker', !!s.crtFlicker && !s.reducedMotion && !lowPowerActive());
    const meta = $('meta[name="theme-color"]'); if (meta) meta.content = '#000000';
    applyHooks.forEach(f => { try { f(); } catch (e) {} });
    sendActivityToChat();
  }
  function setSetting(key, value, silent) {
    if (!(key in DEFAULTS)) return;
    settings[key] = value; saveSettings(); applySettings();
    if (!silent) notifyFrames();
  }
  function notifyFrames() {
    $$('iframe').forEach(f => { try { f.contentWindow.postMessage({ source: 'parent-shell', action: 'settingsChanged' }, ORIGIN); } catch (e) {} });
  }

  /* ---------- site data (from data.js) ---------- */
  const SITE = (typeof siteData !== 'undefined') ? siteData : {};
  const PROJECTS = (typeof projects !== 'undefined') ? projects : [];
  const CLASSICS = (typeof classics !== 'undefined') ? classics : [];
  const NEWS = (typeof announcements !== 'undefined') ? announcements : [];
  const STATUS_META = {
    complete: { label: 'Complete', bucket: 'complete' }, beta: { label: 'Beta Release', bucket: 'progress' }, new: { label: 'NEW!!!', bucket: 'progress' },
    wipPlayable: { label: 'WIP-Playable', bucket: 'progress' }, wipBuggy: { label: 'WIP - Buggy', bucket: 'progress' },
    unfinished: { label: 'Unfinished', bucket: 'progress' }, legacy: { label: 'Legacy', bucket: 'legacy' }, abandoned: { label: 'Abandoned', bucket: 'legacy' }
  };
  const statusLabel = k => (STATUS_META[k] || { label: k || 'Unknown' }).label;
  const slug = u => String(u).replace(/[^a-z0-9]/gi, '-').toLowerCase();

  /* ---------- geometry helpers ---------- */
  const desk = $('#desktop'), layer = $('#windows-layer'), iconLayer = $('#icon-layer');
  const deskSize = () => ({ w: desk.clientWidth, h: desk.clientHeight });
  const viewSize = () => ({ w: window.innerWidth, h: window.innerHeight });
  const isSmallScreen = () => { const s = deskSize(); return s.w <= 700 || s.h <= 420; };
  const coarse = () => !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
  const reducedMotion = () => settings.reducedMotion || lowPowerActive();

  /* ---------- screen-reader announcements ---------- */
  const live = $('#a11y-live');
  let liveTimer = 0;
  function announce(msg) {
    if (!live) return;
    clearTimeout(liveTimer); live.textContent = '';
    liveTimer = setTimeout(() => { live.textContent = msg; }, 60);
  }

  /* ---------- analytics hook (only fires if consent loaded gtag) ---------- */
  function track(name, params) { try { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); } catch (e) {} }

  /* =====================================================================
   *  MENUS
   * ===================================================================== */
  const menuStack = [];
  let menuOpener = null, menuOwner = null, menuReturnFocus = null;
  const startBtn = $('#start-btn');

  function parseMnemonic(label) {
    const i = label.indexOf('&');
    if (i < 0 || i === label.length - 1) return { text: label, key: '', node: D.createTextNode(label) };
    const f = D.createDocumentFragment();
    f.append(D.createTextNode(label.slice(0, i)), h('u', { text: label[i + 1] }), D.createTextNode(label.slice(i + 2)));
    return { text: label.slice(0, i) + label.slice(i + 1), key: label[i + 1].toLowerCase(), node: f };
  }

  function buildMenuList(items, cls) {
    const ul = h('ul', { class: 'menu ' + (cls || ''), role: 'menu' });
    for (const it of items) {
      if (it.sep) { ul.append(h('li', { role: 'separator', class: 'sep' })); continue; }
      const role = it.radio ? 'menuitemradio' : (it.checked !== undefined ? 'menuitemcheckbox' : 'menuitem');
      const b = h('button', {
        type: 'button', class: 'mi' + (it.submenu ? ' has-sub' : ''), role, tabindex: '-1',
        'aria-haspopup': it.submenu ? 'menu' : null, 'aria-expanded': it.submenu ? 'false' : null,
        'aria-checked': (it.radio || it.checked !== undefined) ? String(!!(it.radio ? it.on : it.checked)) : null, disabled: it.disabled
      });
      if (it.icon) b.append(h('img', { class: 'ico', src: it.icon, alt: '', width: 16, height: 16, draggable: 'false' }));
      else if (it.checked) b.append(h('span', { class: 'chk-mark' }));
      else if (it.radio && it.on) b.append(h('span', { class: 'dot-mark' }));
      const m = parseMnemonic(it.label || '');
      b._key = m.key; b._item = it;
      b.append(h('span', { class: 'lbl' }, m.node));
      if (it.accel) b.append(h('span', { class: 'acc', text: it.accel }));
      ul.append(h('li', { role: 'none' }, b));
    }
    return ul;
  }

  function placeMenu(el, x, y, parentRect) {
    el.style.left = '0px'; el.style.top = '0px'; el.style.visibility = 'hidden';
    D.body.append(el);
    const v = viewSize(), w = el.offsetWidth, hh = el.offsetHeight;
    let nx = x, ny = y;
    if (parentRect) {
      nx = parentRect.right - 4;
      if (nx + w > v.w) nx = Math.max(0, parentRect.left - w + 4);
      ny = parentRect.top - 3;
    }
    if (nx + w > v.w) nx = Math.max(0, v.w - w);
    if (ny + hh > v.h) ny = parentRect ? Math.max(0, v.h - hh) : Math.max(0, (parentRect ? 0 : y - hh));
    if (ny + hh > v.h) { el.classList.add('scroll'); ny = 0; }
    el.style.left = Math.max(0, nx) + 'px'; el.style.top = Math.max(0, ny) + 'px'; el.style.visibility = '';
  }

  function hotItem(ul, btn) {
    $$('.mi.hot', ul).forEach(x => x.classList.remove('hot'));
    if (btn) { btn.classList.add('hot'); try { btn.focus({ preventScroll: true }); } catch (e) {} }
  }
  const enabledItems = ul => $$('.mi:not(:disabled)', ul);

  function openMenuLevel(level, items, x, y, parentBtn, startContainer) {
    while (menuStack.length > level) { const m = menuStack.pop(); m.el.remove(); if (m.parentBtn) { m.parentBtn.setAttribute('aria-expanded', 'false'); } }
    const ul = buildMenuList(items, startContainer ? 'menu-in' : '');
    let el = ul;
    if (startContainer) {
      el = h('div', { class: 'start-menu raised', id: 'start-menu' }, h('div', { class: 'start-banner', 'aria-hidden': 'true' }, h('span', {}, 'ColtonOS', h('b', { text: '95' }))), ul);
      ul.classList.add('menu-in'); ul.setAttribute('role', 'menu'); ul.setAttribute('aria-label', 'Start menu');
      D.body.append(el);
    } else {
      placeMenu(el, x, y, parentBtn ? parentBtn.getBoundingClientRect() : null);
    }
    const entry = { el, ul, items, parentBtn, level };
    menuStack.push(entry);
    if (parentBtn) parentBtn.setAttribute('aria-expanded', 'true');
    ul.addEventListener('click', onMenuClick);
    ul.addEventListener('pointerover', onMenuHover);
    return entry;
  }

  function onMenuHover(e) {
    if (e.pointerType !== 'mouse') return;
    const b = e.target.closest('.mi'); if (!b || b.disabled) return;
    const ul = b.closest('ul'); const level = menuStack.findIndex(m => m.ul === ul);
    if (level < 0) return;
    hotItem(ul, b);
    const it = b._item;
    if (it.submenu) {
      if (menuStack[level + 1] && menuStack[level + 1].parentBtn === b) return;
      clearTimeout(onMenuHover.t);
      onMenuHover.t = setTimeout(() => { if (b.isConnected && b.classList.contains('hot')) openMenuLevel(level + 1, resolveItems(it.submenu), 0, 0, b); }, 180);
    } else {
      clearTimeout(onMenuHover.t);
      onMenuHover.t = setTimeout(() => { while (menuStack.length > level + 1) { const m = menuStack.pop(); m.el.remove(); if (m.parentBtn) m.parentBtn.setAttribute('aria-expanded', 'false'); } }, 220);
    }
  }
  const resolveItems = s => (typeof s === 'function' ? s() : s);

  function onMenuClick(e) {
    const b = e.target.closest('.mi'); if (!b || b.disabled) return;
    const it = b._item, ul = b.closest('ul'), level = menuStack.findIndex(m => m.ul === ul);
    if (it.submenu) {
      const open = menuStack[level + 1] && menuStack[level + 1].parentBtn === b;
      if (!open) { const en = openMenuLevel(level + 1, resolveItems(it.submenu), 0, 0, b); if (e.detail === 0) hotItem(en.ul, enabledItems(en.ul)[0]); }
      return;
    }
    const fn = it.onClick;
    closeMenus(false);
    if (fn) setTimeout(() => fn(), 0);
  }

  function closeMenus(returnFocus) {
    clearTimeout(onMenuHover.t);
    while (menuStack.length) { const m = menuStack.pop(); m.el.remove(); }
    if (menuOpener) {
      menuOpener.classList.remove('open');
      if (menuOpener.hasAttribute('aria-expanded')) menuOpener.setAttribute('aria-expanded', 'false');
    }
    startBtn.classList.remove('on'); startBtn.setAttribute('aria-expanded', 'false');
    const back = returnFocus ? (menuOpener || menuReturnFocus) : null;
    menuOpener = null; menuOwner = null; menuReturnFocus = null;
    if (back && back.isConnected && back.focus) { try { back.focus(); } catch (e) {} }
  }
  const menusOpen = () => menuStack.length > 0;

  function showContextMenu(items, x, y, kbd) {
    closeMenus(false);
    menuReturnFocus = D.activeElement && D.activeElement !== D.body ? D.activeElement : null;
    const en = openMenuLevel(0, items, x, y, null);
    if (kbd) hotItem(en.ul, enabledItems(en.ul)[0]);
    return en;
  }

  function showStartMenu(viaKeyboard) {
    closeMenus(false);
    menuOpener = startBtn; startBtn.classList.add('on'); startBtn.setAttribute('aria-expanded', 'true');
    const en = openMenuLevel(0, startMenuItems(), 0, 0, null, true);
    en.el.style.maxHeight = (viewSize().h - parseInt(getComputedStyle(H).getPropertyValue('--taskbar-h') || 28, 10)) + 'px';
    if (viaKeyboard) hotItem(en.ul, enabledItems(en.ul)[0]);
  }
  function toggleStartMenu(viaKeyboard) { if (menuOpener === startBtn && menusOpen()) closeMenus(false); else showStartMenu(viaKeyboard); }

  /* menu keyboard handling */
  D.addEventListener('keydown', e => {
    if (!menusOpen()) return;
    const top = menuStack[menuStack.length - 1];
    const items = enabledItems(top.ul);
    const cur = items.indexOf(D.activeElement);
    const k = e.key;
    const stop = () => { e.preventDefault(); e.stopPropagation(); };
    if (k === 'ArrowDown') { stop(); hotItem(top.ul, items[(cur + 1) % items.length]); }
    else if (k === 'ArrowUp') { stop(); hotItem(top.ul, items[(cur - 1 + items.length) % items.length]); }
    else if (k === 'Home') { stop(); hotItem(top.ul, items[0]); }
    else if (k === 'End') { stop(); hotItem(top.ul, items[items.length - 1]); }
    else if (k === 'ArrowRight') {
      stop();
      const b = D.activeElement;
      if (b && b._item && b._item.submenu) { const en = openMenuLevel(top.level + 1, resolveItems(b._item.submenu), 0, 0, b); hotItem(en.ul, enabledItems(en.ul)[0]); }
      else if (menuOwner) menuOwner.next();
    } else if (k === 'ArrowLeft') {
      stop();
      if (top.level > 0) { const pb = top.parentBtn; menuStack.pop().el.remove(); pb.setAttribute('aria-expanded', 'false'); hotItem(menuStack[menuStack.length - 1].ul, pb); }
      else if (menuOwner) menuOwner.prev();
    } else if (k === 'Enter' || k === ' ') { stop(); if (D.activeElement && D.activeElement.classList.contains('mi')) D.activeElement.click(); }
    else if (k === 'Escape') { stop(); if (top.level > 0) { const pb = top.parentBtn; menuStack.pop().el.remove(); pb.setAttribute('aria-expanded', 'false'); hotItem(menuStack[menuStack.length - 1].ul, pb); } else closeMenus(true); }
    else if (k === 'Tab') { stop(); closeMenus(true); }
    else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const lk = k.toLowerCase();
      const matches = items.filter(b => (b._key || b.textContent.trim()[0].toLowerCase()) === lk);
      if (matches.length) { stop(); const i = matches.indexOf(D.activeElement); const nxt = matches[(i + 1) % matches.length]; hotItem(top.ul, nxt); if (matches.length === 1 && !(nxt._item && nxt._item.submenu)) nxt.click(); }
    }
  }, true);

  D.addEventListener('pointerdown', e => {
    if (!menusOpen()) return;
    if (e.target.closest('.menu, .start-menu')) return;
    if (menuOpener && menuOpener.contains(e.target)) return; // opener handles its own toggle
    closeMenus(false);
  }, true);
  window.addEventListener('blur', () => {
    // a click inside an iframe blurs the parent window: close menus and activate that window
    setTimeout(() => {
      const ae = D.activeElement;
      if (ae && ae.tagName === 'IFRAME') { closeMenus(false); const w = winFromEl(ae); if (w && !modalStack.length) focusWin(w, true); }
    }, 0);
  });
  window.addEventListener('resize', () => { closeMenus(false); onResize(); });

  /* window menubar */
  function buildMenubar(W, defs) {
    const bar = h('div', { class: 'win-menubar', role: 'menubar', 'aria-label': W.title + ' menu' });
    const btns = defs.map((d, i) => {
      const m = parseMnemonic(d.label);
      const b = h('button', { type: 'button', role: 'menuitem', 'aria-haspopup': 'menu', 'aria-expanded': 'false', tabindex: i === 0 ? '0' : '-1' }, m.node);
      b._key = m.key; b._def = d; return b;
    });
    const openAt = (b, kbd) => {
      closeMenus(false); focusWin(W, true);
      const r = b.getBoundingClientRect();
      menuOpener = b; b.classList.add('open'); b.setAttribute('aria-expanded', 'true');
      menuOwner = { next: () => openAt(btns[(btns.indexOf(b) + 1) % btns.length], true), prev: () => openAt(btns[(btns.indexOf(b) - 1 + btns.length) % btns.length], true) };
      const en = openMenuLevel(0, resolveItems(b._def.items), r.left, r.bottom, null);
      if (kbd) hotItem(en.ul, enabledItems(en.ul)[0]);
    };
    btns.forEach(b => {
      b.addEventListener('click', () => { if (menuOpener === b && menusOpen()) closeMenus(false); else openAt(b, b.dataset.kbd === '1'); b.dataset.kbd = ''; });
      b.addEventListener('keydown', e => {
        if (menusOpen()) return;
        const i = btns.indexOf(b);
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAt(b, true); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); btns.forEach(x => x.tabIndex = -1); const n = btns[(i + 1) % btns.length]; n.tabIndex = 0; n.focus(); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); btns.forEach(x => x.tabIndex = -1); const n = btns[(i - 1 + btns.length) % btns.length]; n.tabIndex = 0; n.focus(); }
      });
      b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && menusOpen() && menuOpener && menuOpener !== b && btns.includes(menuOpener)) openAt(b, false); });
      bar.append(b);
    });
    bar._btns = btns; bar._openAt = openAt;
    return bar;
  }


  /* =====================================================================
   *  SYSTEM SOUNDS (tiny synthesized tones; off by default)
   * ===================================================================== */
  let actx = null;
  function playSound(kind) {
    if (!settings.uiSounds) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      const vol = clamp(settings.uiVolume, 0, 100) / 100 * 0.18, t0 = actx.currentTime;
      const note = (f, at, dur, type) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = type || 'triangle'; o.frequency.setValueAtTime(f, t0 + at);
        g.gain.setValueAtTime(0.0001, t0 + at); g.gain.exponentialRampToValueAtTime(vol, t0 + at + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
        o.connect(g); g.connect(actx.destination); o.start(t0 + at); o.stop(t0 + at + dur + 0.02);
      };
      const S = {
        open: [[523, 0, .09], [784, .07, .12]], close: [[784, 0, .08], [523, .07, .12]], min: [[392, 0, .07], [294, .05, .09]], max: [[294, 0, .07], [440, .05, .09]],
        error: [[196, 0, .16, 'square'], [147, .13, .22, 'square']], warning: [[440, 0, .12, 'square'], [330, .1, .16, 'square']], question: [[587, 0, .1], [784, .09, .12]],
        info: [[988, 0, .12, 'sine'], [1319, .1, .25, 'sine']], tada: [[523, 0, .12], [659, .1, .12], [784, .2, .14], [1047, .3, .4]]
      };
      (S[kind] || S.info).forEach(n => note(n[0], n[1], n[2], n[3]));
    } catch (e) { /* audio unavailable */ }
  }

  /* classic wireframe zoom used when windows minimize / restore */
  function zoomLines(a, b) {
    if (!settings.windowAnim || reducedMotion() || !a || !b || typeof Element.prototype.animate !== 'function') return;
    const e = h('div', { 'aria-hidden': 'true', style: { position: 'fixed', zIndex: '99989', pointerEvents: 'none', border: '2px dotted #fff', outline: '1px dotted #000', boxSizing: 'border-box' } });
    D.body.append(e);
    const f = r => ({ left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    const an = e.animate([f(a), f(b)], { duration: 150, easing: 'steps(6, end)' });
    an.onfinish = an.oncancel = () => e.remove();
  }

  /* cascade / tile (taskbar right-click menu) */
  function arrangeWindows(mode) {
    const list = Array.from(wins.values()).filter(w => !w.o.dialog && isVisible(w)).sort((a, b) => (+a.el.style.zIndex || 0) - (+b.el.style.zIndex || 0));
    if (!list.length) return;
    const d = deskSize();
    list.forEach(w => { if (w.maximized) setMax(w, false); });
    if (mode === 'cascade') {
      const w0 = Math.round(d.w * 0.62), h0 = Math.round(d.h * 0.68);
      list.forEach((w, i) => { applyGeo(w, { left: 14 + (i % 10) * 28, top: 10 + (i % 10) * 28, width: Math.min(w0, d.w - 20), height: Math.min(h0, d.h - 20) }); w.el.style.zIndex = String(++zTop); });
    } else {
      const n = list.length, horiz = mode === 'horizontal';
      const cols = horiz ? 1 : Math.ceil(Math.sqrt(n)), rows = horiz ? n : Math.ceil(n / cols);
      list.forEach((w, i) => {
        const c = horiz ? 0 : i % cols, r = horiz ? i : Math.floor(i / cols), cw = Math.floor(d.w / cols), ch = Math.floor(d.h / rows);
        applyGeo(w, { left: c * cw, top: r * ch, width: cw, height: ch });
      });
    }
    const top = list[list.length - 1]; focusWin(top, false); list.forEach(saveGeo); announce((mode === 'cascade' ? 'Windows cascaded' : 'Windows tiled'));
  }
  function minimizeAll() { Array.from(wins.values()).forEach(w => { if (!w.o.dialog && isVisible(w)) minimizeWin(w); }); }

  /* =====================================================================
   *  WINDOW MANAGER
   * ===================================================================== */
  const wins = new Map();          // id -> W
  const modalStack = [];           // open modal dialogs
  const geoMemory = store.sjson(KEYS.session, {});
  const HEAVY = new Set(['game', 'arcade']);
  let zTop = 10, activeWin = null, openCount = 0, activityState = null;
  const taskStrip = $('#tb-tasks');

  const winFromEl = el => { const w = el.closest && el.closest('.win'); return w ? wins.get(w.id) : null; };
  const isVisible = W => !!W && W.visible && !W.minimized && !W.closed;

  function saveGeo(W) {
    if (W.o.dialog || W.maximized) return;
    const e = W.el;
    geoMemory[W.id] = { left: e.offsetLeft, top: e.offsetTop, width: e.offsetWidth, height: e.offsetHeight };
    store.ssetJson(KEYS.session, geoMemory);
  }

  function bounds(W) { return W.o.dialog ? viewSize() : deskSize(); }

  function defaultGeometry(W) {
    const o = W.o, b = bounds(W);
    let w = Math.min(o.width || 640, b.w - 6), hh = Math.min(o.height || 440, b.h - 6);
    if (o.fillPct) { w = Math.round(b.w * o.fillPct[0]); hh = Math.round(b.h * o.fillPct[1]); }
    const n = openCount % 8;
    let x = 22 + n * 26, y = 14 + n * 26;
    if (x + w > b.w - 4) x = Math.max(2, Math.round((b.w - w) / 2));
    if (y + hh > b.h - 4) y = Math.max(2, Math.round((b.h - hh) / 2));
    if (o.center) { x = Math.round((b.w - w) / 2); y = Math.max(2, Math.round((b.h - hh) / 2.2)); }
    return { left: x, top: y, width: w, height: hh };
  }

  function applyGeo(W, g) {
    const b = bounds(W);
    const w = clamp(g.width, 160, b.w), hh = clamp(g.height, 90, b.h);
    W.el.style.width = w + 'px'; W.el.style.height = hh + 'px';
    W.el.style.left = clamp(g.left, 60 - w, b.w - 60) + 'px';
    W.el.style.top = clamp(g.top, 0, Math.max(0, b.h - 26)) + 'px';
  }

  function createWindow(o) {
    if (o.id && wins.has(o.id)) { const ex = wins.get(o.id); ex.show(); return ex; }
    const id = o.id || nextId('win');
    const dlg = !!o.dialog;
    const titleId = id + '-title';
    const el = h('div', {
      class: 'win raised' + (o.className ? ' ' + o.className : '') + (dlg ? ' dialog' : '') + (o.resizable === false || dlg ? ' nosize' : ''),
      id, role: 'dialog', 'aria-labelledby': titleId, tabindex: '-1'
    });
    el.hidden = true;
    if (dlg) { el.style.position = 'fixed'; }
    const W = { id, el, o, title: o.title || 'Window', kind: o.kind || 'window', visible: false, minimized: false, maximized: false, closed: false, background: false, restoreGeo: null, taskBtn: null };

    const sys = h('button', { type: 'button', class: 'wt-sys', 'aria-label': 'System menu', 'aria-haspopup': 'menu', tabindex: '-1', style: { background: 'none', border: '0', padding: '0', width: '16px', height: '16px', flex: 'none' } },
      h('img', { class: 'wt-icon', src: o.icon || IC('programs'), alt: '', width: 16, height: 16, draggable: 'false' }));
    const titleText = h('span', { class: 'wt-text', id: titleId, text: W.title });
    const ctl = h('span', { class: 'win-ctl' });
    const mk = (cls, label, extra) => h('button', { type: 'button', class: cls + (extra ? ' ' + extra : ''), 'aria-label': label, title: label, tabindex: '0' });
    const bMin = (!dlg && o.minimizable !== false) ? mk('c-min', 'Minimize') : null;
    const bMax = (!dlg && o.maximizable !== false && o.resizable !== false) ? mk('c-max', 'Maximize', bMin ? '' : '') : null;
    const bClose = o.closable === false ? null : mk('c-close', 'Close', 'gap');
    [bMin, bMax, bClose].forEach(b => b && ctl.append(b));
    const titleEl = h('div', { class: 'win-title' }, sys, titleText, ctl);
    const body = h('div', { class: 'win-body' + (o.frame ? ' framed' : '') });
    el.append(titleEl);
    if (o.menubar) { W.menubar = buildMenubar(W, o.menubar); el.append(W.menubar); }
    el.append(body);
    if (o.status) {
      W.statusEls = o.status.map((cls) => h('div', { class: cls || '' }));
      W.statusBar = h('div', { class: 'win-status', role: 'status' }, W.statusEls);
      el.append(W.statusBar);
    }
    if (!dlg && o.resizable !== false) ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].forEach(d => el.append(h('div', { class: 'rz rz-' + d, dataset: { dir: d } })));
    body.append(h('div', { class: 'win-shield' }));
    W.body = body; W.titleEl = titleEl; W.titleText = titleText; W.sys = sys; W.bMax = bMax; W.bMin = bMin;

    if (o.frame) {
      const f = o.frame;
      const iframe = h('iframe', { class: 'app-frame', id: f.iframeId || id + '-frame', title: o.title || 'Application', referrerpolicy: 'no-referrer', allow: 'fullscreen; autoplay; gamepad; microphone; camera; clipboard-write', allowfullscreen: '' });
      iframe.loading = f.keepAlive ? 'eager' : 'eager';
      W.iframe = iframe; W.frameSrc = f.src; W.keepAlive = !!f.keepAlive; W.deferred = !!f.deferLoad;
      iframe.src = f.deferLoad ? 'about:blank' : f.src;
      body.prepend(iframe);
      installFrameThrottle(W);
      installFullscreenTracking(W);
      iframe.addEventListener('load', () => hookIdle(iframe));
    }
    if (o.content) body.prepend(o.content);

    /* methods */
    W.setTitle = t => { W.title = t; titleText.textContent = t; if (W.iframe) W.iframe.title = t; if (W.taskBtn) { W.taskBtn.querySelector('span').textContent = t; W.taskBtn.title = t; } };
    W.setStatus = (i, t) => { if (W.statusEls && W.statusEls[i]) W.statusEls[i].textContent = t; };
    W.show = () => showWin(W);
    W.focus = () => focusWin(W, false);
    W.minimize = () => minimizeWin(W);
    W.toggleMax = () => toggleMax(W);
    W.close = (force) => closeWin(W, force);
    W.reload = () => { if (!W.iframe) return; W.iframe.src = 'about:blank'; setTimeout(() => { if (!W.closed) W.iframe.src = W.frameSrc; }, 50); };
    W.requestClose = () => { if (o.onBeforeClose && o.onBeforeClose(W) === false) return; closeWin(W); };

    wins.set(id, W);
    attachWindowEvents(W, bMin, bMax, bClose);
    (dlg ? D.body : layer).append(el);
    return W;
  }

  function attachWindowEvents(W, bMin, bMax, bClose) {
    const el = W.el;
    if (bMin) bMin.addEventListener('click', () => minimizeWin(W));
    if (bMax) bMax.addEventListener('click', () => toggleMax(W));
    if (bClose) bClose.addEventListener('click', () => W.requestClose());
    el.addEventListener('pointerdown', e => { if (!modalStack.length || W.o.dialog) { if (activeWin !== W) focusWin(W, true); closeMenusIfOutside(e); } }, true);
    W.sys.addEventListener('click', e => { e.stopPropagation(); if (e.detail === 2) { return; } openSystemMenu(W, true); });
    W.sys.addEventListener('dblclick', e => { e.preventDefault(); closeMenus(false); W.requestClose(); });
    W.titleEl.addEventListener('contextmenu', e => { e.preventDefault(); const r = { x: e.clientX, y: e.clientY }; openSystemMenu(W, false, r); });
    el.addEventListener('keydown', e => onWindowKey(W, e));
    attachDrag(W);
    attachResize(W);
    // double-click / double-tap title bar toggles maximize
    let lastTap = 0;
    W.titleEl.addEventListener('pointerup', e => {
      if (e.target.closest('button') || !W.bMax) return;
      const now = performance.now();
      if (now - lastTap < 400) { lastTap = 0; toggleMax(W); } else lastTap = now;
    });
  }
  function closeMenusIfOutside(e) { if (menusOpen() && !e.target.closest('.menu, .start-menu, .win-menubar')) closeMenus(false); }

  function showWin(W) {
    if (W.closed) return;
    if (W.deferred && W.iframe) { W.deferred = false; W.iframe.src = W.frameSrc; }
    if (W.iframe && W.iframe.src === 'about:blank' && !W.keepAlive && W.frameSrc) W.iframe.src = W.frameSrc;
    if (!W.visible) {
      W.visible = true; W.minimized = false;
      W.el.classList.remove('minimized'); W.el.hidden = false;
      if (!W.placed) {
        W.placed = true;
        const saved = geoMemory[W.id];
        if (W.o.dialog) placeDialog(W); else applyGeo(W, saved || defaultGeometry(W));
        openCount++;
        if (!W.o.dialog && isSmallScreen() && W.o.maximizable !== false && W.o.resizable !== false && !W.o.noAutoMax) setMax(W, true);
      }
      if (settings.windowAnim && !reducedMotion()) { W.el.classList.add('opening'); setTimeout(() => W.el.classList.remove('opening'), 160); }
      addTaskButton(W);
      announce(W.title + ' opened');
      if (!W.o.dialog) playSound('open');
    } else if (W.minimized) {
      const tr = W.taskBtn && W.taskBtn.getBoundingClientRect();
      W.minimized = false; W.el.classList.remove('minimized');
      if (tr) zoomLines(tr, W.el.getBoundingClientRect());
    }
    focusWin(W, false);
    refreshState();
  }

  function focusWin(W, fromPointer) {
    if (!W || W.closed) return;
    if (!W.visible || W.minimized) { showWin(W); return; }
    if (W.o.dialog) { W.el.style.zIndex = String(99996 + modalStack.indexOf(W) * 2); }
    else if (+W.el.style.zIndex !== zTop || !W.el.style.zIndex) {
      W.el.style.zIndex = String(++zTop);
      if (zTop > 8000) renormalizeZ();
    }
    if (activeWin && activeWin !== W) { activeWin.el.classList.remove('active'); }
    W.el.classList.add('active');
    const changed = activeWin !== W;
    activeWin = W;
    updateTaskButtons();
    if (changed) { setActivity(W); refreshState(); }
    if (!fromPointer) {
      if (W.iframe) { try { W.iframe.contentWindow.focus(); } catch (e) { try { W.iframe.focus(); } catch (e2) {} } }
      else if (!W.el.contains(D.activeElement)) { try { W.el.focus({ preventScroll: true }); } catch (e) {} }
    }
  }
  function renormalizeZ() {
    const list = Array.from(wins.values()).filter(w => !w.o.dialog && w.visible).sort((a, b) => (+a.el.style.zIndex || 0) - (+b.el.style.zIndex || 0));
    zTop = 10; list.forEach(w => { w.el.style.zIndex = String(++zTop); });
  }

  function topVisible(except) {
    let best = null, bz = -1;
    wins.forEach(w => { if (w !== except && !w.o.dialog && isVisible(w)) { const z = +w.el.style.zIndex || 0; if (z > bz) { bz = z; best = w; } } });
    return best;
  }

  function minimizeWin(W) {
    if (!W.visible || W.minimized || W.o.dialog) return;
    zoomLines(W.el.getBoundingClientRect(), W.taskBtn && W.taskBtn.getBoundingClientRect()); playSound('min');
    W.minimized = true; W.el.classList.add('minimized');
    if (W.maximized) fullscreenLow.delete(W.id);
    if (activeWin === W) { W.el.classList.remove('active'); activeWin = null; const nx = topVisible(W); if (nx) focusWin(nx, false); else setActivity(null); }
    updateTaskButtons(); refreshState(); announce(W.title + ' minimized');
    const tb = W.taskBtn; if (tb && D.activeElement === D.body) { try { tb.focus(); } catch (e) {} }
  }

  function setMax(W, on) {
    if (on === W.maximized) return;
    if (on) {
      const e = W.el;
      W.restoreGeo = { left: e.style.left, top: e.style.top, width: e.style.width, height: e.style.height };
      W.maximized = true; e.classList.add('maximized');
      if (HEAVY.has(W.kind)) fullscreenLow.add(W.id);
    } else {
      W.maximized = false; W.el.classList.remove('maximized');
      if (W.restoreGeo) Object.assign(W.el.style, W.restoreGeo);
      fullscreenLow.delete(W.id);
    }
    if (W.bMax) {
      W.bMax.classList.toggle('c-max', !on); W.bMax.classList.toggle('c-rest', on);
      W.bMax.setAttribute('aria-label', on ? 'Restore' : 'Maximize'); W.bMax.title = on ? 'Restore' : 'Maximize';
    }
    applySettings(); playSound('max');
  }
  function toggleMax(W) { if (!W.bMax) return; setMax(W, !W.maximized); saveGeo(W); refreshState(); }

  function closeWin(W, force) {
    if (W.closed) return;
    if (W.o.dialog) { closeDialogWin(W); return; }
    const keep = W.keepAlive && !force;
    if (activeWin === W) { activeWin = null; }
    fullscreenLow.delete(W.id); nativeFullscreen.delete(W.id);
    saveGeo(W); playSound('close');
    removeTaskButton(W);
    W.visible = false; W.minimized = false;
    if (keep) { W.el.hidden = true; W.el.classList.remove('active'); if (W.maximized) { setMax(W, false); } }
    else {
      W.closed = true;
      if (W.iframe) { try { W.iframe.src = 'about:blank'; } catch (e) {} }
      if (W.onClosed) { try { W.onClosed(); } catch (e) {} }
      W.o.onClose && W.o.onClose(W);
      W.el.remove(); wins.delete(W.id);
    }
    const nx = topVisible(W);
    if (nx) focusWin(nx, false); else setActivity(null);
    applySettings(); refreshState();
    announce(W.title + ' closed');
    if (!nx) { const t = W.opener; if (t && t.isConnected && t.focus) { try { t.focus(); } catch (e) {} } }
  }

  /* ----- activity / state shared with the chatroom & CSS ----- */
  function setActivity(W) {
    const next = W ? { id: W.id, kind: W.kind || 'window', name: W.activityName || W.title } : null;
    const same = (!next && !activityState) || (next && activityState && next.id === activityState.id && next.kind === activityState.kind && next.name === activityState.name);
    activityState = next;
    if (!same) { refreshState(); sendActivityToChat(); }
  }
  function refreshState() {
    const heavy = Array.from(wins.values()).filter(w => HEAVY.has(w.kind) && isVisible(w));
    H.classList.toggle('game-open', heavy.length > 0);
    wins.forEach(w => { if (!HEAVY.has(w.kind)) { w.background = false; return; } w.background = heavy.length > 1 && isVisible(w) && activeWin !== w; });
    syncChatVisibility();
    // low power also tracks fullscreen/maximized heavy windows
    const lp = lowPowerActive(); if (H.classList.contains('low-power') !== lp) H.classList.toggle('low-power', lp);
  }
  function chatFrame() { const w = wins.get('chat-window'); return w && w.iframe; }
  function postToFrame(f, msg) { try { if (f && f.contentWindow) f.contentWindow.postMessage(msg, ORIGIN); } catch (e) {} }
  function sendActivityToChat() {
    const cw = wins.get('chat-window'); const f = cw && cw.iframe; if (!f) return;
    const open = isVisible(cw);
    postToFrame(f, { source: 'parent-shell', action: 'activityState', activeWindow: activityState ? Object.assign({}, activityState) : null, chatWindowOpen: open,
      lowPowerMode: H.classList.contains('low-power') || H.classList.contains('game-open'), isHomepage: !open && !activityState });
  }

  /* ----- background frame throttle for non-active heavy windows (ported) ----- */
  function installFrameThrottle(W) {
    if (!HEAVY.has(W.kind)) return;
    const iframe = W.iframe, MS = 33;
    const patch = () => {
      try {
        const w = iframe.contentWindow;
        if (!w || w.__ghRafPatched || typeof w.requestAnimationFrame !== 'function') return;
        w.__ghRafPatched = true;
        const nRaf = w.requestAnimationFrame.bind(w), nCancel = w.cancelAnimationFrame.bind(w), pending = new Map(); let seq = 0;
        w.requestAnimationFrame = cb => {
          if (!W.background) return nRaf(cb);
          const id = 1e9 + (++seq), ent = { t: 0, r: 0 };
          ent.t = w.setTimeout(() => { ent.r = nRaf(ts => { pending.delete(id); cb(ts); }); }, MS);
          pending.set(id, ent); return id;
        };
        w.cancelAnimationFrame = id => { const ent = pending.get(id); if (ent) { w.clearTimeout(ent.t); if (ent.r) nCancel(ent.r); pending.delete(id); return; } nCancel(id); };
      } catch (e) { /* cross-origin frames run unthrottled */ }
    };
    iframe.addEventListener('load', patch);
  }

  /* ----- iframe fullscreen + ping overlay (ported) ----- */
  const nativeFullscreen = new Set();
  function installFullscreenTracking(W) {
    const iframe = W.iframe;
    const install = () => {
      try {
        const doc = iframe.contentDocument, cw = iframe.contentWindow;
        if (!doc || !cw || doc.location.href === 'about:blank') return;
        const onFs = () => {
          const active = !!doc.fullscreenElement;
          if (W.id !== 'chat-window') { if (active) nativeFullscreen.add(W.id); else nativeFullscreen.delete(W.id); fullscreenLow[active ? 'add' : 'delete']('fs-' + W.id); applySettings(); }
          if (active) ensureFramePing(iframe); else if (cw.__gamesHubHidePing) cw.__gamesHubHidePing();
        };
        doc.addEventListener('fullscreenchange', onFs);
        cw.__gamesHubShowPingFromParent = t => { ensureFramePing(iframe); if (cw.__gamesHubShowPing) cw.__gamesHubShowPing(t); };
        ensureFramePing(iframe);
      } catch (e) { /* cross-origin */ }
    };
    iframe.addEventListener('load', install);
  }
  function ensureFramePing(iframe) {
    try {
      const doc = iframe.contentDocument, cw = iframe.contentWindow;
      if (!doc || !doc.body || !cw) return;
      let ov = doc.getElementById('__gamesHubPingOverlay');
      if (!ov) {
        ov = doc.createElement('div'); ov.id = '__gamesHubPingOverlay'; ov.setAttribute('role', 'status'); ov.setAttribute('aria-live', 'polite');
        ov.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);width:min(420px,calc(100vw - 20px));max-height:140px;overflow:hidden;padding:7px 10px;background:#c0c0c0;color:#000;border:2px solid;border-color:#fff #000 #000 #fff;box-shadow:inset -1px -1px #808080,inset 1px 1px #dfdfdf,3px 3px 0 #000;font:14px "W95FA","MS Sans Serif",Tahoma,sans-serif;font-weight:bold;line-height:1.35;white-space:pre-line;overflow-wrap:anywhere;pointer-events:auto;z-index:2147483647;display:none;text-align:center';
        ov.addEventListener('click', () => { ov.style.display = 'none'; });
        doc.body.appendChild(ov);
      }
      const place = () => {
        const full = doc.fullscreenElement;
        try {
          if (full && full.nodeType === 1 && full !== doc.documentElement && full !== doc.body && full.appendChild) { if (ov.parentNode !== full) full.appendChild(ov); ov.style.position = 'absolute'; }
          else { if (ov.parentNode !== doc.body) doc.body.appendChild(ov); ov.style.position = 'fixed'; }
        } catch (e) {}
      };
      cw.__gamesHubShowPing = t => { place(); ov.textContent = t || ''; ov.style.display = t ? 'block' : 'none'; };
      cw.__gamesHubHidePing = () => { ov.style.display = 'none'; };
    } catch (e) {}
  }

  /* ----- dragging ----- */
  function attachDrag(W) {
    const t = W.titleEl;
    t.addEventListener('pointerdown', e => {
      if (e.button > 0 && e.pointerType === 'mouse') return;
      if (e.target.closest('button')) return;
      if (W.maximized) return;
      const el = W.el, sx = e.clientX, sy = e.clientY, ox = el.offsetLeft, oy = el.offsetTop;
      let moving = false, nx = ox, ny = oy, raf = 0;
      const b = bounds(W);
      try { t.setPointerCapture(e.pointerId); } catch (err) {}
      const apply = () => { raf = 0; el.style.transform = 'translate3d(' + (nx - ox) + 'px,' + (ny - oy) + 'px,0)'; };
      const move = ev => {
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (!moving) { if (Math.hypot(dx, dy) < 4) return; moving = true; el.classList.add('moving'); if (!settings.opaqueDrag) el.classList.add('outline-drag'); H.classList.add('dragging-ui'); }
        nx = clamp(ox + dx, 70 - el.offsetWidth, b.w - 70); ny = clamp(oy + dy, 0, Math.max(0, b.h - 24));
        if (!raf) raf = requestAnimationFrame(apply);
      };
      const up = () => {
        t.removeEventListener('pointermove', move); t.removeEventListener('pointerup', up); t.removeEventListener('pointercancel', up);
        if (raf) cancelAnimationFrame(raf);
        if (moving) { el.style.left = nx + 'px'; el.style.top = ny + 'px'; el.style.transform = ''; el.classList.remove('moving', 'outline-drag'); H.classList.remove('dragging-ui'); saveGeo(W); }
      };
      t.addEventListener('pointermove', move); t.addEventListener('pointerup', up); t.addEventListener('pointercancel', up);
    });
  }

  /* ----- resizing ----- */
  function attachResize(W) {
    W.el.addEventListener('pointerdown', e => {
      const hd = e.target.closest('.rz'); if (!hd || W.maximized) return;
      if (e.button > 0 && e.pointerType === 'mouse') return;
      e.preventDefault();
      const dir = hd.dataset.dir, el = W.el, sx = e.clientX, sy = e.clientY;
      const r0 = { l: el.offsetLeft, t: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
      const minW = W.o.minWidth || 200, minH = W.o.minHeight || 120, b = bounds(W);
      let raf = 0, last = null;
      try { hd.setPointerCapture(e.pointerId); } catch (err) {}
      H.classList.add('dragging-ui');
      const apply = () => { raf = 0; if (!last) return; el.style.left = last.l + 'px'; el.style.top = last.t + 'px'; el.style.width = last.w + 'px'; el.style.height = last.h + 'px'; };
      const move = ev => {
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        let l = r0.l, tp = r0.t, w = r0.w, hh = r0.h;
        if (dir.includes('e')) w = clamp(r0.w + dx, minW, b.w - l);
        if (dir.includes('s')) hh = clamp(r0.h + dy, minH, b.h - tp);
        if (dir.includes('w')) { w = clamp(r0.w - dx, minW, r0.l + r0.w); l = r0.l + r0.w - w; }
        if (dir.includes('n')) { hh = clamp(r0.h - dy, minH, r0.t + r0.h); tp = r0.t + r0.h - hh; }
        last = { l, t: tp, w, h: hh };
        if (!raf) raf = requestAnimationFrame(apply);
      };
      const up = () => {
        hd.removeEventListener('pointermove', move); hd.removeEventListener('pointerup', up); hd.removeEventListener('pointercancel', up);
        if (raf) { cancelAnimationFrame(raf); apply(); }
        H.classList.remove('dragging-ui'); saveGeo(W);
      };
      hd.addEventListener('pointermove', move); hd.addEventListener('pointerup', up); hd.addEventListener('pointercancel', up);
    });
  }

  /* ----- system menu, keyboard move/size ----- */
  function openSystemMenu(W, kbd, at) {
    const r = W.sys.getBoundingClientRect();
    const items = [
      { label: '&Restore', disabled: !W.maximized && !W.minimized || !W.bMax, onClick: () => { if (W.minimized) focusWin(W); else toggleMax(W); } },
      { label: '&Move', disabled: W.maximized || W.o.dialog && false, onClick: () => startKeyboardMove(W, 'move') },
      { label: '&Size', disabled: W.maximized || W.o.resizable === false || W.o.dialog, onClick: () => startKeyboardMove(W, 'size') },
      { label: 'Mi&nimize', disabled: !W.bMin, onClick: () => minimizeWin(W) },
      { label: 'Ma&ximize', disabled: !W.bMax || W.maximized, onClick: () => toggleMax(W) }
    ];
    if (W.iframe) {
      items.push({ sep: true }, { label: 'Re&load', onClick: () => W.reload() },
        { label: '&Full Screen', onClick: () => { const el = W.body; (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el); } });
    }
    items.push({ sep: true }, { label: '&Close', accel: 'Alt+F4', onClick: () => W.requestClose() });
    menuReturnFocus = W.sys;
    const x = at ? at.x : r.left, y = at ? at.y : r.bottom;
    const en = showContextMenu(items, x, y, kbd);
    menuReturnFocus = W.sys;
  }

  function startKeyboardMove(W, mode) {
    const el = W.el; const start = { l: el.offsetLeft, t: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
    const b = bounds(W); const bar = h('div', { class: 'tip', style: { left: '50%', bottom: '40px', transform: 'translateX(-50%)', pointerEvents: 'none' }, text: (mode === 'move' ? 'Moving' : 'Resizing') + ' — use arrow keys, Enter to finish, Esc to cancel' });
    D.body.append(bar); announce(bar.textContent);
    const step = e => (e.shiftKey ? 40 : 10);
    const onKey = e => {
      const k = e.key;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(k)) {
        e.preventDefault(); e.stopPropagation();
        const s = step(e), dx = k === 'ArrowLeft' ? -s : k === 'ArrowRight' ? s : 0, dy = k === 'ArrowUp' ? -s : k === 'ArrowDown' ? s : 0;
        if (mode === 'move') { el.style.left = clamp(el.offsetLeft + dx, 70 - el.offsetWidth, b.w - 70) + 'px'; el.style.top = clamp(el.offsetTop + dy, 0, b.h - 24) + 'px'; }
        else { el.style.width = clamp(el.offsetWidth + dx, W.o.minWidth || 200, b.w - el.offsetLeft) + 'px'; el.style.height = clamp(el.offsetHeight + dy, W.o.minHeight || 120, b.h - el.offsetTop) + 'px'; }
      } else if (k === 'Enter' || k === 'Escape') {
        e.preventDefault(); e.stopPropagation();
        if (k === 'Escape') { el.style.left = start.l + 'px'; el.style.top = start.t + 'px'; el.style.width = start.w + 'px'; el.style.height = start.h + 'px'; }
        D.removeEventListener('keydown', onKey, true); D.removeEventListener('pointerdown', done, true); bar.remove(); saveGeo(W);
      }
    };
    const done = () => { onKey({ key: 'Enter', preventDefault() {}, stopPropagation() {} }); };
    D.addEventListener('keydown', onKey, true); D.addEventListener('pointerdown', done, true);
  }

  function onWindowKey(W, e) {
    if (e.altKey && e.key === ' ') { e.preventDefault(); e.stopPropagation(); openSystemMenu(W, true); }
    else if (e.altKey && e.key === 'F4') { e.preventDefault(); e.stopPropagation(); W.requestClose(); }
  }

  /* ----- taskbar buttons ----- */
  function addTaskButton(W) {
    if (W.o.dialog || W.o.noTask || W.taskBtn) return;
    const b = h('button', { type: 'button', class: 'tb-btn tb-task', title: W.title, 'aria-pressed': 'false' },
      h('img', { src: W.o.icon || IC('programs'), alt: '', width: 16, height: 16 }), h('span', { text: W.title }));
    b.addEventListener('click', () => {
      if (W.minimized) focusWin(W, false);
      else if (activeWin === W) minimizeWin(W);
      else focusWin(W, false);
    });
    b.addEventListener('contextmenu', e => { e.preventDefault(); if (W.minimized) { /* system menu needs a visible window */ } const r = b.getBoundingClientRect(); const items = [
      { label: '&Restore', disabled: !W.minimized && !W.maximized, onClick: () => { if (W.minimized) focusWin(W); else toggleMax(W); } },
      { label: 'Mi&nimize', disabled: W.minimized || !W.bMin, onClick: () => minimizeWin(W) }, { label: 'Ma&ximize', disabled: !W.bMax || W.maximized, onClick: () => { focusWin(W); toggleMax(W); } },
      { sep: true }, { label: '&Close', onClick: () => W.requestClose() }];
      menuReturnFocus = b; showContextMenu(items, r.left, r.top - 4); const m = menuStack[0]; if (m) { m.el.style.top = Math.max(0, r.top - m.el.offsetHeight) + 'px'; } });
    let lp = 0; // long-press = context menu on touch
    b.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') lp = setTimeout(() => { lp = 0; b.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true })); }, 550); });
    ['pointerup', 'pointercancel', 'pointermove'].forEach(ev => b.addEventListener(ev, () => { if (lp) { clearTimeout(lp); lp = 0; } }));
    W.taskBtn = b; taskStrip.append(b); updateTaskButtons();
  }
  function removeTaskButton(W) { if (W.taskBtn) { W.taskBtn.remove(); W.taskBtn = null; } }
  function updateTaskButtons() {
    wins.forEach(w => { if (w.taskBtn) { const on = activeWin === w && !w.minimized; w.taskBtn.classList.toggle('on', on); w.taskBtn.setAttribute('aria-pressed', String(on)); } });
  }
  function cycleWindows(dir) {
    const list = Array.from(wins.values()).filter(w => !w.o.dialog && w.visible && w.taskBtn);
    if (!list.length) return;
    const i = list.indexOf(activeWin);
    const nx = list[(i + dir + list.length) % list.length];
    focusWin(nx, false);
  }
  function showDesktop() {
    const open = Array.from(wins.values()).filter(w => !w.o.dialog && isVisible(w));
    if (open.length) { open.forEach(w => { w._wasShown = true; minimizeWinQuiet(w); }); announce('Desktop shown'); }
    else { wins.forEach(w => { if (w._wasShown && w.visible && w.minimized) { w._wasShown = false; w.minimized = false; w.el.classList.remove('minimized'); } }); const t = topVisible(); if (t) focusWin(t); updateTaskButtons(); refreshState(); }
    const first = $('.desktop-icon[tabindex="0"]'); if (open.length && first) { try { first.focus(); } catch (e) {} }
  }
  function minimizeWinQuiet(W) { if (W.minimized) return; W.minimized = true; W.el.classList.add('minimized'); W.el.classList.remove('active'); if (activeWin === W) activeWin = null; setActivity(null); updateTaskButtons(); refreshState(); }

  function onResize() {
    const b = deskSize();
    wins.forEach(w => { if (w.o.dialog || w.maximized || !w.visible) return; const e = w.el; applyGeo(w, { left: e.offsetLeft, top: e.offsetTop, width: Math.min(e.offsetWidth, b.w), height: Math.min(e.offsetHeight, b.h) }); });
    layoutIcons(true);
    positionBalloons();
  }
  function positionBalloons() {}

  /* =====================================================================
   *  MODAL DIALOGS
   * ===================================================================== */
  function placeDialog(W) {
    const e = W.el, v = viewSize();
    e.style.width = W.o.width ? Math.min(W.o.width, v.w - 12) + 'px' : 'auto';
    e.style.maxHeight = (v.h - 12) + 'px';
    e.style.left = '0px'; e.style.top = '0px';
    const w = e.offsetWidth, hh = e.offsetHeight;
    e.style.left = Math.max(4, Math.round((v.w - w) / 2)) + 'px';
    e.style.top = Math.max(4, Math.round((v.h - hh) / 2.3)) + 'px';
  }

  function closeDialogWin(W) {
    if (W.closed) return;
    W.closed = true; W.visible = false;
    const i = modalStack.indexOf(W); if (i >= 0) modalStack.splice(i, 1);
    if (W._blocker) W._blocker.remove();
    W.el.remove(); wins.delete(W.id);
    if (W.onClosed) W.onClosed();
    const top = modalStack[modalStack.length - 1];
    if (top) focusWin(top, false);
    else {
      if (W._prevFocus && W._prevFocus.isConnected) { try { W._prevFocus.focus(); } catch (e) {} }
      else if (activeWin) focusWin(activeWin, false);
    }
  }

  /* opens a modal dialog; returns the window (W.result is a Promise resolving to a button value) */
  function openDialog(o) {
    const prev = D.activeElement;
    const blocker = h('div', { class: 'modal-layer', style: { position: 'fixed', inset: '0', zIndex: String(99995 + modalStack.length * 2), background: 'transparent' } });
    D.body.append(blocker);
    const btns = o.buttons === undefined ? [{ label: 'OK', value: 'ok', default: true }] : o.buttons;
    const body = h('div', {}, o.content || null);
    let resolve; const result = new Promise(r => { resolve = r; });
    const W = createWindow({ id: o.id || nextId('dlg'), title: o.title || 'ColtonOS', icon: o.icon || IC('programs'), dialog: true, width: o.width || 0, closable: o.closable !== false, content: body, onClose: () => {} });
    W._blocker = blocker; W._prevFocus = prev; W.result = result;
    let finished = false;
    const finish = v => { if (finished) return; finished = true; resolve(v); closeDialogWin(W); };
    W.finish = finish;
    W.requestClose = () => finish(o.cancelValue !== undefined ? o.cancelValue : 'cancel');
    const closeBtn = W.el.querySelector('.c-close'); if (closeBtn) closeBtn.onclick = () => W.requestClose();
    if (btns.length) {
      const row = h('div', { class: 'dialog-btns' });
      btns.forEach(b => {
        const bt = h('button', { type: 'button', class: 'btn' + (b.default ? ' default' : ''), text: b.label, disabled: b.disabled });
        bt.addEventListener('click', () => { if (b.onClick && b.onClick(W) === false) return; finish(b.value !== undefined ? b.value : b.label); });
        bt._def = b; row.append(bt);
      });
      body.append(row); W.buttonRow = row;
    }
    modalStack.push(W);
    blocker.addEventListener('pointerdown', e => { e.preventDefault(); W.el.classList.add('flash'); setTimeout(() => W.el.classList.remove('flash'), 110); setTimeout(() => W.el.classList.add('flash'), 220); setTimeout(() => W.el.classList.remove('flash'), 330); });
    W.el.addEventListener('keydown', e => {
      if (e.key === 'Escape' && o.escape !== false) { e.preventDefault(); e.stopPropagation(); W.requestClose(); return; }
      if (e.key === 'Enter' && !e.target.closest('button, textarea, select, a, summary, [role="tab"]')) {
        const d = W.buttonRow && $('.btn.default', W.buttonRow); if (d && !d.disabled) { e.preventDefault(); d.click(); }
      }
      if (e.key === 'Tab') {
        const f = $$('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]', W.el).filter(x => x.offsetParent !== null);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && (D.activeElement === first || !W.el.contains(D.activeElement))) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && D.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    showWin(W);
    W.el.classList.add('active');
    closeMenus(false);
    const target = o.focus ? (typeof o.focus === 'function' ? o.focus(W) : o.focus) : ($('.btn.default', W.el) || $('.btn', W.el) || W.el);
    setTimeout(() => { try { target.focus(); } catch (e) {} }, 0);
    announce((o.title || 'Dialog') + (o.announce ? '. ' + o.announce : ''));
    return W;
  }

  function msgBox(text, o) {
    o = o || {};
    const labels = (o.buttons || ['OK']).map((l, i) => ({ label: l, value: l.toLowerCase(), default: i === (o.def || 0) }));
    playSound(o.icon === 'error' ? 'error' : o.icon === 'warning' ? 'warning' : o.icon === 'question' ? 'question' : 'info');
    const body = h('div', { class: 'dialog-body' }, h('img', { class: 'di', src: IC(o.icon || 'info'), alt: '', width: 32, height: 32 }), h('div', { class: 'msg', text }));
    const W = openDialog({ title: o.title || 'ColtonOS', icon: IC(o.icon || 'info'), content: body, buttons: labels, cancelValue: o.cancel || (labels.length > 1 ? 'cancel' : 'ok'), announce: text, width: o.width || 0 });
    return W.result;
  }

  function makeTabs(tabs, startIdx) {
    const list = h('div', { class: 'tabs', role: 'tablist' });
    const wrap = h('div', {}, list);
    const panelHost = h('div', { class: 'tabpanel' });
    wrap.append(panelHost);
    const btns = tabs.map((t, i) => h('button', { type: 'button', role: 'tab', id: nextId('tab'), 'aria-selected': 'false', tabindex: '-1', text: t.label }));
    const sel = (i, focus) => {
      btns.forEach((b, j) => { b.setAttribute('aria-selected', String(i === j)); b.tabIndex = i === j ? 0 : -1; });
      panelHost.replaceChildren(tabs[i].panel); panelHost.setAttribute('role', 'tabpanel'); panelHost.setAttribute('aria-labelledby', btns[i].id);
      if (focus) btns[i].focus();
      if (tabs[i].onShow) tabs[i].onShow();
    };
    btns.forEach((b, i) => {
      b.addEventListener('click', () => sel(i, false));
      b.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight') { e.preventDefault(); sel((i + 1) % btns.length, true); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); sel((i - 1 + btns.length) % btns.length, true); }
        else if (e.key === 'Home') { e.preventDefault(); sel(0, true); } else if (e.key === 'End') { e.preventDefault(); sel(btns.length - 1, true); }
      });
      list.append(b);
    });
    sel(startIdx || 0, false);
    wrap.select = sel;
    return wrap;
  }

  /* =====================================================================
   *  ITEMS: everything launchable (apps, games, folders, files)
   * ===================================================================== */
  const ITEMS = new Map();
  /* extension points used by os-extras.js (virtual file system, DOS prompt, themes, sounds…) */
  const HOOKS = { desktopIds: () => [], children: () => [], vfsParent: () => null, newMenu: () => [], beforeOpen: null, shutdown: null, dropOnto: null, presence: null, deleteVfs: null, renameVfs: null };
  const addItem = it => { ITEMS.set(it.id, it); return it; };
  const track2 = (name, p) => track(name, p);

  const SYSTEM_APPS = [
    { id: 'monitor', title: 'System Monitor', icon: IC('monitor-graph'), src: 'applets/system-monitor.html', w: 780, h: 620, keep: true, defer: true, desc: 'Performance, storage manager, and data export / import' },
    { id: 'control', title: 'Control Panel', icon: IC('control-panel'), src: 'applets/control-panel.html', w: 720, h: 560, keep: true, defer: true, desc: 'Settings for the whole desktop' },
    { id: 'arcade', title: 'Arcade Hub', icon: IC('gamepad'), src: 'games.html', fill: [0.95, 0.94], kind: 'arcade', desc: 'Browse the third-party web games arcade', shortcut: true },
    { id: 'chat', title: 'Chatroom', icon: 'images/icons/chatroom.png', src: 'applets/chatroom.html', w: 580, h: 540, keep: true, kind: 'chatroom', desc: 'Universal chatroom for everyone on the site', shortcut: true, winId: 'chat-window', frameId: 'chat-frame' }
  ];
  /* Applets are auto-detected from the `applets` array in data.js (title, description, icon, url [+ optional w/h/keep/group]) */
  const SLUG_FIX = { 'web-proxy-browser-applet': 'browser' };
  const appletSlug = u => { const b = String(u).split('/').pop().replace(/\.html?$/i, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase(); return SLUG_FIX[b] || b; };
  const APPLET_DATA = (typeof applets !== 'undefined' && Array.isArray(applets)) ? applets : [];
  const APPLETS = APPLET_DATA.filter(a => a && a.url && a.title).map(a => ({ id: a.id || appletSlug(a.url), title: a.title, icon: a.icon || IC('programs'), src: a.url, w: a.w, h: a.h, keep: !!a.keep, desc: a.description || '', group: a.group || '', applet: true }));
  const APPS = APPLETS.concat(SYSTEM_APPS);
  const TEXT_FILES = [
    { id: 'changelog', title: 'Changelog.txt', src: 'applets/textviewer.html?src=changelog.txt', desc: 'What changed in each version' },
    { id: 'todo', title: 'TODO.txt', src: 'applets/textviewer.html?src=TODO.txt', desc: 'Ideas and known follow-ups' },
    { id: 'license', title: 'LICENSE.txt', src: 'applets/textviewer.html?src=LICENSE.txt', desc: 'License information' }
  ];

  function frameWindow(it, extra) {
    const o = Object.assign({
      id: it.winId || ('app-' + it.id), title: it.title, icon: it.icon, kind: it.kind || 'window', width: it.w || 640, height: it.h || 480, fillPct: it.fill,
      frame: { src: it.src, keepAlive: !!it.keep, deferLoad: !!it.defer, iframeId: it.frameId }, minWidth: 260, minHeight: 160
    }, extra || {});
    if (it.kind === 'chatroom') o.kind = 'chatroom';
    return createWindow(o);
  }

  APPS.forEach(a => addItem({
    id: 'app:' + a.id, title: a.title, type: a.kind === 'arcade' ? 'Shortcut to web arcade' : 'Application', icon: a.icon, shortcut: !!a.shortcut, desc: a.desc,
    keywords: a.title + ' ' + (a.desc || '') + ' ' + a.id, app: a,
    open: opener => { const W = frameWindow(a); W.opener = opener; showWin(W); }
  }));
  TEXT_FILES.forEach(f => addItem({
    id: 'file:' + f.id, title: f.title, type: 'Text Document', icon: IC('document'), desc: f.desc, keywords: f.title + ' text document ' + f.desc,
    open: opener => { const W = createWindow({ id: 'file-' + f.id, title: f.title + ' - Notepad', icon: IC('document'), width: 720, height: 520, frame: { src: f.src }, minWidth: 260 }); W.opener = opener; showWin(W); }
  }));

  const recents = () => { const r = store.json(LEGACY.recents, []); return Array.isArray(r) ? r : []; };
  const favorites = () => { const f = store.json(LEGACY.favorites, []); return Array.isArray(f) ? f : []; };
  const isFav = u => favorites().includes(u);
  function toggleFav(u) { const f = favorites(); const n = f.includes(u) ? f.filter(x => x !== u) : [...f, u].slice(-100); store.setJson(LEGACY.favorites, n); favChanged(); return n.includes(u); }
  function addRecent(url, title, type) {
    if (!url) return;
    const e = { url, title: title || 'Project', type: type || 'Game', timestamp: Date.now() };
    store.setJson(LEGACY.recents, [e, ...recents().filter(r => r && r.url !== url)].slice(0, 12));
  }
  const favListeners = new Set();
  function favChanged() { favListeners.forEach(f => { try { f(); } catch (e) {} }); }

  function openGame(url, title, image, opener) {
    addRecent(url, title, 'Game');
    const id = 'game-win-' + slug(url);
    if (wins.has(id)) { showWin(wins.get(id)); return wins.get(id); }
    const W = createWindow({ id, title, icon: image || IC('gamepad'), kind: 'game', fillPct: [0.96, 0.95], frame: { src: url }, minWidth: 280, minHeight: 200 });
    W.opener = opener; showWin(W); return W;
  }

  PROJECTS.forEach(p => addItem({
    id: 'game:' + p.url, title: p.title, type: 'Game', icon: p.image || 'images/missing.png', thumb: true, shortcut: true, project: p,
    desc: p.description, keywords: p.title + ' ' + p.type + ' ' + (p.tags || []).join(' ') + ' ' + statusLabel(p.statusKey) + ' game',
    status: statusLabel(p.statusKey), kindLabel: p.type,
    open: opener => { openGame(p.url, p.title, p.image, opener); track('launch_game', { event_category: 'Games', game_title: p.title, game_url: p.url }); }
  }));
  CLASSICS.forEach(c => addItem({
    id: 'game:' + c.url, title: c.title, type: 'Classic Game', icon: c.image || 'images/missing.png', thumb: true, shortcut: true, classic: c,
    desc: 'Classic arcade remake', keywords: c.title + ' classic retro arcade game',
    open: opener => { openGame(c.url, c.title, c.image, opener); track('launch_game', { event_category: 'Classic Games', game_title: c.title, game_url: c.url }); }
  }));

  const driveError = letter => () => msgBox(letter + ':\\ is not accessible.\n\nThe device is not ready.', { title: 'My Computer', icon: 'error', buttons: ['Retry', 'Cancel'], cancel: 'cancel' });
  addItem({ id: 'drive:a', title: '3½ Floppy (A:)', type: '3½-Inch Floppy Disk', icon: IC('floppy'), desc: 'Removable disk', keywords: 'floppy a drive', open: driveError('A') });
  addItem({ id: 'drive:c', title: 'ColtonOS (C:)', type: 'Local Disk', icon: IC('hard-disk'), desc: 'Programs, games and files', keywords: 'c drive hard disk files', open: o => openExplorer('drive-c', o) });
  addItem({ id: 'drive:d', title: '(D:)', type: 'CD-ROM Disc', icon: IC('cdrom'), desc: 'CD-ROM drive', keywords: 'cd rom d drive', open: driveError('D') });

  const FOLDERS = {
    'my-computer': { title: 'My Computer', icon: IC('my-computer'), items: () => ['drive:a', 'drive:c', 'drive:d', 'sys:network', 'folder:documents', 'app:control', 'app:monitor'] },
    'drive-c': { title: 'ColtonOS (C:)', icon: IC('hard-disk'), items: () => ['folder:games', 'folder:classics', 'folder:accessories', 'folder:documents', 'app:library', 'app:welcome', 'app:help', 'file:changelog', 'file:todo', 'file:license'] },
    games: { title: 'Games', icon: IC('folder'), items: () => PROJECTS.map(p => 'game:' + p.url) },
    classics: { title: 'Classic Games', icon: IC('folder'), items: () => CLASSICS.map(c => 'game:' + c.url).concat(APPLETS.filter(a => a.group === 'games').map(a => 'app:' + a.id)) },
    accessories: { title: 'Accessories', icon: IC('folder'), items: () => APPLETS.map(a => 'app:' + a.id).concat(['app:monitor']) },
    documents: { title: 'My Documents', icon: IC('documents-folder'), path: 'C:\\My Documents', parent: 'drive-c', items: () => HOOKS.children('docs') },
    network: { title: 'Network Neighborhood', icon: IC('network'), path: 'Network Neighborhood', parent: 'my-computer', items: () => HOOKS.children('net') },
    recycle: { title: 'Recycle Bin', icon: IC('recycle-bin'), items: () => trashState().items.filter(i => ITEMS.has(i)), recycle: true }
  };
  [['games', 'Games', 'All of the original games and experiments'], ['classics', 'Classic Games', 'Small classic arcade remakes'], ['accessories', 'Accessories', 'Calculator, Paint, Notepad, MS-DOS Prompt and other tools'], ['documents', 'My Documents', 'Your saved text files and pictures']].forEach(([k, t, d]) =>
    addItem({ id: 'folder:' + k, title: t, type: 'File Folder', icon: IC('folder'), desc: d, keywords: t + ' folder ' + d, open: o => openExplorer(k, o) }));
  addItem({ id: 'sys:my-computer', title: 'My Computer', type: 'System Folder', icon: IC('my-computer'), desc: 'Drives and system tools', keywords: 'my computer drives explorer', open: o => openExplorer('my-computer', o) });
  addItem({ id: 'sys:network', title: 'Network Neighborhood', type: 'System Folder', icon: IC('network'), desc: 'Other computers on the ColtonNet (people in the chatroom)', keywords: 'network neighborhood computers chat people online', open: o => openExplorer('network', o) });
  addItem({ id: 'sys:recycle', title: 'Recycle Bin', type: 'System Folder', icon: IC('recycle-bin'), desc: 'Items you removed from the desktop', keywords: 'recycle bin trash deleted', open: o => openExplorer('recycle', o) });

  /* Trash (desktop shortcuts only — nothing real is ever deleted) */
  const trashState = () => { const t = store.json(KEYS.trash, null); return t && Array.isArray(t.items) ? { items: t.items, purged: t.purged || [] } : { items: [], purged: [] }; };
  const saveTrash = t => store.setJson(KEYS.trash, t);
  const trashChanged = new Set();
  function trashIcon() { const b = $('.desktop-icon[data-id="sys:recycle"] img'); if (b) b.src = IC('recycle-bin'); }

  /* ----- generic activation (double-click / single-click / tap) ----- */
  const tapState = { id: null, t: 0 };
  const singleClickMode = () => settings.clickMode === 'single' || (settings.clickMode === 'auto' && coarse());
  function shouldOpen(id) {
    const now = performance.now();
    if (singleClickMode()) { tapState.id = null; return true; }
    if (tapState.id === id && now - tapState.t < settings.dblClickMs) { tapState.id = null; return true; }
    tapState.id = id; tapState.t = now; return false;
  }
  function openItem(id, opener) {
    const it = ITEMS.get(id); if (!it || !it.open) return;
    closeMenus(false);
    const go = () => it.open(opener || null);
    if (HOOKS.beforeOpen && HOOKS.beforeOpen(it, go)) return;
    go();
  }
  function itemIcon(it, size) {
    const img = h('img', { src: it.icon, alt: '', width: size || 32, height: size || 32, draggable: 'false', class: it.thumb ? 'thumb' : '', decoding: 'async' });
    img.onerror = () => { img.onerror = null; img.src = 'images/missing.png'; };
    return img;
  }

  /* ----- touch long-press helper ----- */
  function longPress(host, targetSel, handler) {
    let t = 0, sx = 0, sy = 0;
    host.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse') return;
      const tg = e.target.closest(targetSel); sx = e.clientX; sy = e.clientY;
      clearTimeout(t);
      t = setTimeout(() => { t = 0; host._lpFired = true; handler(e, tg, sx, sy); }, 520);
    });
    const cancel = e => { if (e && e.type === 'pointermove' && Math.hypot(e.clientX - sx, e.clientY - sy) < 10) return; if (t) { clearTimeout(t); t = 0; } };
    ['pointerup', 'pointercancel', 'pointermove'].forEach(ev => host.addEventListener(ev, cancel));
    host.addEventListener('click', e => { if (host._lpFired) { host._lpFired = false; e.preventDefault(); e.stopPropagation(); } }, true);
  }

  /* spatial arrow-key navigation shared by desktop and explorer */
  function spatialNext(els, cur, key) {
    if (!els.length) return null;
    if (!cur) return els[0];
    const r = cur.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let best = null, bs = Infinity;
    for (const e of els) {
      if (e === cur) continue;
      const q = e.getBoundingClientRect(), x = q.left + q.width / 2, y = q.top + q.height / 2, dx = x - cx, dy = y - cy;
      let p, s;
      if (key === 'ArrowRight') { if (dx <= 4) continue; p = dx; s = Math.abs(dy); }
      else if (key === 'ArrowLeft') { if (dx >= -4) continue; p = -dx; s = Math.abs(dy); }
      else if (key === 'ArrowDown') { if (dy <= 4) continue; p = dy; s = Math.abs(dx); }
      else { if (dy >= -4) continue; p = -dy; s = Math.abs(dx); }
      const sc = p + s * 3; if (sc < bs) { bs = sc; best = e; }
    }
    return best;
  }

  /* =====================================================================
   *  EXPLORER (folder windows)
   * ===================================================================== */
  function itemTypeLabel(it) { return it.kindLabel ? it.type + ' · ' + it.kindLabel : it.type; }

  function itemProperties(it) {
    const rows = [['Type:', it.type], ['Location:', it.project || it.classic ? 'C:\\Games' + (it.classic ? '\\Classics' : '') : it.id.startsWith('app:') ? 'C:\\Accessories' : 'C:\\']];
    if (it.status) rows.push(['Status:', it.status]);
    if (it.project && it.project.tags) rows.push(['Tags:', it.project.tags.join(', ')]);
    if (it.desc) rows.push(['Comment:', it.desc]);
    const tbl = h('table', { style: { borderCollapse: 'collapse' } }, rows.map(r => h('tr', {}, h('td', { style: { padding: '3px 10px 3px 0', verticalAlign: 'top', whiteSpace: 'nowrap' }, text: r[0] }), h('td', { style: { padding: '3px 0', overflowWrap: 'anywhere' }, text: r[1] }))));
    const body = h('div', { class: 'dialog-pad' }, h('div', { class: 'row', style: { marginBottom: '8px', alignItems: 'center' } }, itemIcon(it, 32), h('strong', { text: it.title })), h('div', { class: 'hr' }), tbl);
    openDialog({ title: it.title + ' Properties', icon: it.icon, content: body, width: 360, buttons: [{ label: 'Open', value: 'open', onClick: () => { setTimeout(() => openItem(it.id), 0); } }, { label: 'Close', value: 'close', default: true }] });
  }

  function openExplorer(fid, opener) {
    let def = FOLDERS[fid]; if (!def) return;
    const id = 'explorer-' + fid; let curFid = fid; const hist = [];
    if (wins.has(id)) { showWin(wins.get(id)); return; }
    let view = store.get(KEYS.explorerView, 'large'), sortBy = 'none', selected = new Set(), W;
    const list = h('div', { class: 'ex-items', role: 'listbox', 'aria-label': def.title + ' contents', 'aria-multiselectable': 'true' });
    const head = h('div', { class: 'ex-head', 'aria-hidden': 'true' }, h('span', { class: 'h-name', text: 'Name' }), h('span', { class: 'h-col', text: 'Type' }), h('span', { class: 'h-col', text: 'Comment' }));
    const scroller = h('div', { class: 'explorer-view sunken view-' + view }, head, list);
    const ids = () => { let a = def.items().filter(i => ITEMS.has(i)); if (sortBy === 'name') a.sort((x, y) => ITEMS.get(x).title.localeCompare(ITEMS.get(y).title)); if (sortBy === 'type') a.sort((x, y) => ITEMS.get(x).type.localeCompare(ITEMS.get(y).type) || ITEMS.get(x).title.localeCompare(ITEMS.get(y).title)); return a; };
    const els = () => $$('.ex-item', list);
    function status() {
      const n = els().length;
      W.setStatus(0, n + ' object(s)' + (selected.size ? ' — ' + selected.size + ' selected' : ''));
      const first = [...selected][0]; const it = first && ITEMS.get(first);
      W.setStatus(1, it ? it.type : (def.recycle && !n ? 'Recycle Bin is empty' : ''));
    }
    function render() {
      list.replaceChildren();
      const all = ids(); selected = new Set([...selected].filter(i => all.includes(i)));
      all.forEach((iid, k) => {
        const it = ITEMS.get(iid);
        const di = h('span', { class: 'di-img' + (it.shortcut ? ' shortcut' : '') }, itemIcon(it, 32));
        di.style.setProperty('--icon-mask', 'url("' + it.icon + '")');
        const b = h('button', { type: 'button', class: 'ex-item' + (selected.has(iid) ? ' selected' : ''), role: 'option', 'aria-selected': String(selected.has(iid)), tabindex: k === 0 ? '0' : '-1', dataset: { id: iid }, title: it.title + (it.desc ? ' — ' + it.desc : '') },
          di, h('span', { class: 'di-label', text: it.title }), h('span', { class: 'ex-col', text: it.type }), h('span', { class: 'ex-col', text: it.status || it.desc || '' }));
        list.append(b);
      });
      if (!all.length) list.append(h('div', { class: 'ex-empty', text: def.recycle ? 'The Recycle Bin is empty.' : 'This folder is empty.' }));
      status();
    }
    function select(set, focusEl) {
      selected = set; els().forEach(e => { const on = selected.has(e.dataset.id); e.classList.toggle('selected', on); e.setAttribute('aria-selected', String(on)); });
      if (focusEl) { els().forEach(e => e.tabIndex = -1); focusEl.tabIndex = 0; focusEl.focus(); }
      status();
    }
    function openSel() { selected.forEach(i => openOrNav(i)); }
    function restore(ids2) { const t = trashState(); t.items = t.items.filter(i => !ids2.includes(i)); saveTrash(t); render(); layoutIcons(false); }
    function emptyBin() {
      msgBox('Are you sure you want to permanently remove these shortcuts from the desktop?\n\n(You can bring them all back from Control Panel › Display › Desktop.)', { title: 'Confirm Multiple File Delete', icon: 'question', buttons: ['Yes', 'No'], def: 1, cancel: 'no' }).then(r => { if (r === 'yes') { const t = trashState(); t.purged = [...new Set([...t.purged, ...t.items])]; t.items = []; saveTrash(t); render(); layoutIcons(false); } });
    }
    function itemMenu(iid) {
      const it = ITEMS.get(iid);
      const m = [{ label: '&Open', onClick: () => openOrNav(iid) }];
      if (def.recycle) m.unshift({ label: '&Restore', onClick: () => restore([...selected]) });
      if (it.vfs) m.push({ sep: true }, { label: 'Rena&me', onClick: () => HOOKS.renameVfs(it) }, { label: '&Delete', onClick: () => HOOKS.deleteVfs([it.id]) });
      m.push({ sep: true }, { label: 'P&roperties', onClick: () => itemProperties(it) });
      return m;
    }
    const setView = v => { view = v; store.set(KEYS.explorerView, v); scroller.className = 'explorer-view sunken view-' + v; };
    const viewItems = () => [['large', 'Lar&ge Icons'], ['small', 'S&mall Icons'], ['list', '&List'], ['details', '&Details']].map(([v, l]) => ({ label: l, radio: true, on: view === v, onClick: () => setView(v) }));
    const arrange = () => [{ label: 'by &Name', onClick: () => { sortBy = 'name'; render(); } }, { label: 'by &Type', onClick: () => { sortBy = 'type'; render(); } }];
    const FOLDER_OF = { 'folder:documents': 'documents', 'folder:games': 'games', 'folder:classics': 'classics', 'folder:accessories': 'accessories', 'drive:c': 'drive-c', 'sys:my-computer': 'my-computer', 'sys:recycle': 'recycle' };
    const PARENT = { games: 'drive-c', classics: 'drive-c', accessories: 'drive-c', 'drive-c': 'my-computer' };
    const pathOf = f => (FOLDERS[f] && FOLDERS[f].path) || PATHS[f] || (FOLDERS[f] ? FOLDERS[f].title : '');
    const parentOf = f => (FOLDERS[f] && FOLDERS[f].parent) || PARENT[f];
    const PATHS = { 'my-computer': 'My Computer', 'drive-c': 'C:\\', games: 'C:\\Games', classics: 'C:\\Classic Games', accessories: 'C:\\Accessories', recycle: 'Recycle Bin' };
    const addr = h('input', { type: 'text', class: 'field grow', readonly: true, 'aria-label': 'Address', value: pathOf(fid) });
    const bBack = h('button', { type: 'button', class: 'btn small', text: '◄ Back', disabled: true, title: 'Back (Alt+Left)' });
    const bUp = h('button', { type: 'button', class: 'btn small', text: '▲ Up', disabled: !parentOf(fid), title: 'Up one level (Backspace)' });
    const toolbar = h('div', { class: 'win-toolbar' }, bBack, bUp, h('span', { text: 'Address' }), addr);
    const wrap = h('div', { style: { display: 'flex', flexDirection: 'column', flex: '1', minHeight: '0' } }, toolbar, scroller);
    function navTo(nf, push) {
      if (!FOLDERS[nf] || nf === curFid) return;
      if (push !== false) hist.push(curFid);
      curFid = nf; def = FOLDERS[nf];
      trashChanged.add(render);
      W.setTitle(def.title); const wi = $('.wt-icon', W.el); if (wi) wi.src = def.icon; if (W.taskBtn) $('img', W.taskBtn).src = def.icon;
      list.setAttribute('aria-label', def.title + ' contents'); selected = new Set(); sortBy = 'none';
      addr.value = pathOf(nf); bBack.disabled = !hist.length; bUp.disabled = !parentOf(nf);
      render(); announce(def.title); scroller.scrollTop = 0;
    }
    const goUp = () => { if (parentOf(curFid)) navTo(parentOf(curFid)); };
    const goBack = () => { if (hist.length) navTo(hist.pop(), false), (bBack.disabled = !hist.length); };
    bUp.addEventListener('click', goUp); bBack.addEventListener('click', goBack);
    const openOrNav = iid => { const nf = FOLDER_OF[iid] || (ITEMS.get(iid) && ITEMS.get(iid).vfsFolder ? iid : null); if (nf && FOLDERS[nf] && nf !== curFid) navTo(nf); else openItem(iid, W.sys); };
    const menubar = [
      { label: '&File', items: () => [{ label: '&Open', disabled: !selected.size || def.recycle, onClick: openSel }].concat(def.recycle ? [{ label: '&Restore', disabled: !selected.size, onClick: () => restore([...selected]) }, { label: 'Empty Recycle &Bin', disabled: !els().length, onClick: emptyBin }] : [{ label: 'P&roperties', disabled: selected.size !== 1, onClick: () => itemProperties(ITEMS.get([...selected][0])) }]).concat([{ sep: true }, { label: '&Close', onClick: () => W.requestClose() }]) },
      { label: '&Edit', items: () => [{ label: 'Select &All', accel: 'Ctrl+A', onClick: () => select(new Set(ids())) }, { label: '&Invert Selection', onClick: () => select(new Set(ids().filter(i => !selected.has(i)))) }] },
      { label: '&View', items: () => viewItems().concat([{ sep: true }, { label: 'Arrange &Icons', submenu: arrange() }, { sep: true }, { label: '&Refresh', onClick: render }]) },
      { label: '&Help', items: () => [{ label: '&Help Topics', onClick: () => openHelp() }, { sep: true }, { label: '&About ColtonOS…', onClick: showAbout }] }
    ];
    W = createWindow({ id, title: def.title, icon: def.icon, content: wrap, menubar, status: ['grow', ''], width: 540, height: 380, minWidth: 260, minHeight: 160 });
    W.opener = opener;
    W.onClosed = () => trashChanged.delete(render);
    trashChanged.add(render);
    list.addEventListener('click', e => {
      if (e.detail === 0) return;
      const b = e.target.closest('.ex-item'); if (!b) return;
      const iid = b.dataset.id;
      if (e.ctrlKey || e.metaKey) { const s = new Set(selected); s.has(iid) ? s.delete(iid) : s.add(iid); select(s, b); return; }
      select(new Set([iid]), b);
      if (!def.recycle && shouldOpen(iid)) openOrNav(iid);
      else if (def.recycle && shouldOpen(iid)) itemProperties(ITEMS.get(iid));
    });
    scroller.addEventListener('click', e => { if (e.target === scroller || e.target === list) select(new Set()); });
    list.addEventListener('keydown', e => {
      const b = e.target.closest('.ex-item'); if (!b) return;
      const k = e.key, all = els();
      if (k === 'Enter') { e.preventDefault(); if (!selected.has(b.dataset.id)) select(new Set([b.dataset.id]), b); def.recycle ? itemProperties(ITEMS.get(b.dataset.id)) : openSel(); }
      else if (k === ' ') { e.preventDefault(); const s = new Set(selected); s.has(b.dataset.id) ? s.delete(b.dataset.id) : s.add(b.dataset.id); select(s, b); }
      else if (k.startsWith('Arrow') && !e.altKey) {
        e.preventDefault();
        let n;
        if (view === 'details' || view === 'list' && (k === 'ArrowUp' || k === 'ArrowDown')) { const i = all.indexOf(b); n = all[clamp(i + (k === 'ArrowDown' || k === 'ArrowRight' ? 1 : -1), 0, all.length - 1)]; }
        else n = spatialNext(all, b, k);
        if (n) select(e.shiftKey ? new Set([...selected, n.dataset.id]) : new Set([n.dataset.id]), n);
      } else if (k === 'a' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); select(new Set(ids())); }
      else if (k === 'Home') { e.preventDefault(); select(new Set([all[0].dataset.id]), all[0]); }
      else if (k === 'End') { e.preventDefault(); const l = all[all.length - 1]; select(new Set([l.dataset.id]), l); }
      else if (k === 'ContextMenu' || (k === 'F10' && e.shiftKey)) { e.preventDefault(); const r = b.getBoundingClientRect(); if (!selected.has(b.dataset.id)) select(new Set([b.dataset.id])); showContextMenu(itemMenu(b.dataset.id), r.left + 10, r.bottom - 6, true); }
      else if (k === 'Backspace') { e.preventDefault(); goUp(); }
      else if (k === 'ArrowLeft' && e.altKey) { e.preventDefault(); goBack(); }
    });
    const ctx = (e, b, x, y) => {
      if (b) { if (!selected.has(b.dataset.id)) select(new Set([b.dataset.id])); showContextMenu(itemMenu(b.dataset.id), x, y); }
      else showContextMenu(viewItems().concat([{ sep: true }, { label: 'Arrange &Icons', submenu: arrange() }]).concat(HOOKS.vfsParent(curFid) ? [{ sep: true }, { label: 'Ne&w', submenu: HOOKS.newMenu(HOOKS.vfsParent(curFid)) }] : []).concat([{ label: '&Refresh', onClick: render }]), x, y);
    };
    scroller.addEventListener('contextmenu', e => { e.preventDefault(); ctx(e, e.target.closest('.ex-item'), e.clientX, e.clientY); });
    longPress(scroller, '.ex-item', (e, b, x, y) => ctx(e, b, x, y));
    render(); showWin(W);
    setTimeout(() => { const f = els()[0]; if (f && W.el.contains(D.activeElement) === false && !coarse()) { /* leave focus on window */ } }, 0);
    return W;
  }
  function refreshTrashViews() { trashChanged.forEach(f => f()); }

  /* =====================================================================
   *  DESKTOP ICONS
   * ===================================================================== */
  const desktopDefault = () => ['sys:my-computer', 'folder:documents', 'sys:network', 'app:library', 'app:arcade', 'app:chat', 'folder:classics', 'folder:accessories', 'sys:recycle'].concat(PROJECTS.map(p => 'game:' + p.url)).concat(HOOKS.desktopIds());
  const iconNames = store.json('gh-icon-names', {}) || {};
  const nameOf = it => iconNames[it.id] || it.title;
  const icons = new Map();
  let iconPos = store.json(KEYS.icons, {}) || {};
  let iconOrder = store.json(KEYS.icons + '-order', null);
  let selIcons = new Set(), focusIcon = null;

  const cellSize = () => (settings.iconSpacing >= 50 ? settings.iconSpacing : (settings.compact ? 68 : 75));
  function gridDims() { const s = deskSize(), c = cellSize(); return { c, cols: Math.max(1, Math.floor((s.w - 4) / c)), rows: Math.max(1, Math.floor((s.h - 4) / c)) }; }
  const cellXY = (col, row) => { const c = cellSize(); return { x: 4 + col * c, y: 4 + row * c }; };
  const xyCell = (x, y) => { const c = cellSize(); return { col: Math.max(0, Math.round((x - 4) / c)), row: Math.max(0, Math.round((y - 4) / c)) }; };
  function visibleIconIds() {
    const t = trashState(), hide = new Set([...t.items, ...t.purged]);
    let ids = desktopDefault().filter(i => ITEMS.has(i) && !hide.has(i));
    if (iconOrder) ids = iconOrder.filter(i => ids.includes(i)).concat(ids.filter(i => !iconOrder.includes(i)));
    return ids;
  }

  function buildIcons() {
    iconLayer.replaceChildren(); icons.clear();
    visibleIconIds().forEach(id => {
      const it = ITEMS.get(id);
      const di = h('span', { class: 'di-img' + (it.shortcut ? ' shortcut' : '') }, itemIcon(it, 32));
      di.style.setProperty('--icon-mask', 'url("' + it.icon + '")');
      const el = h('div', { class: 'desktop-icon', role: 'option', 'aria-selected': 'false', tabindex: '-1', dataset: { id }, 'aria-label': nameOf(it) + (it.type ? ', ' + it.type : ''), title: it.desc ? nameOf(it) + ' — ' + it.desc : nameOf(it) }, di, h('span', { class: 'di-label', text: nameOf(it) }));
      iconLayer.append(el); icons.set(id, { id, el, x: 0, y: 0 });
    });
    layoutIcons(false);
    const first = icons.values().next().value; if (first) { first.el.tabIndex = 0; focusIcon = first.id; }
  }

  function layoutIcons(reflow) {
    if (!icons.size) return;
    const { cols, rows } = gridDims(); const taken = new Set(), placed = new Map(); const ids = visibleIconIds();
    ids.forEach(i => { if (!icons.has(i)) return; });
    if (!settings.autoArrange) ids.forEach(id => {
      const p = iconPos[id]; if (!p) return;
      if (settings.snap) {
        let { col, row } = xyCell(p.x, p.y); col = Math.min(col, cols - 1); row = Math.min(row, rows - 1);
        const k = col + ',' + row; if (taken.has(k)) return; taken.add(k); placed.set(id, cellXY(col, row));
      } else { const s = deskSize(); placed.set(id, { x: clamp(p.x, 0, Math.max(0, s.w - 40)), y: clamp(p.y, 0, Math.max(0, s.h - 40)) }); const c = xyCell(p.x, p.y); taken.add(c.col + ',' + c.row); }
    });
    let k = 0;
    ids.forEach(id => {
      if (placed.has(id)) return;
      let col, row;
      do { col = Math.floor(k / rows); row = k % rows; k++; } while (taken.has(col + ',' + row));
      taken.add(col + ',' + row); placed.set(id, cellXY(col, row));
    });
    placed.forEach((pos, id) => { const ic = icons.get(id); if (!ic) return; ic.x = pos.x; ic.y = pos.y; ic.el.style.left = pos.x + 'px'; ic.el.style.top = pos.y + 'px'; });
  }
  const persistIcons = () => { const o = {}; icons.forEach(ic => { o[ic.id] = { x: ic.x, y: ic.y }; }); iconPos = o; store.setJson(KEYS.icons, o); };

  function setIconSelection(set, focusId) {
    selIcons = set;
    icons.forEach(ic => { const on = set.has(ic.id); ic.el.classList.toggle('selected', on); ic.el.setAttribute('aria-selected', String(on)); });
    if (focusId) { icons.forEach(ic => ic.el.tabIndex = -1); const ic = icons.get(focusId); if (ic) { ic.el.tabIndex = 0; focusIcon = focusId; if (D.activeElement !== ic.el) ic.el.focus({ preventScroll: true }); } }
  }
  function deactivateWindows() {
    if (activeWin) { activeWin.el.classList.remove('active'); activeWin = null; updateTaskButtons(); setActivity(null); }
  }

  function iconMenu(id) {
    const it = ITEMS.get(id), many = selIcons.size > 1;
    const folder = it.id.startsWith('folder:') || it.id.startsWith('sys:');
    const m = [{ label: '&Open', onClick: () => selIcons.forEach(i => openItem(i)) }];
    if (id === 'sys:my-computer') m.push({ label: '&Explore', onClick: () => openItem(id) });
    if (id === 'sys:recycle') m.push({ label: 'Empty Recycle &Bin', disabled: !trashState().items.length, onClick: () => { const W = wins.get('explorer-recycle'); openExplorer('recycle'); setTimeout(() => { const w = wins.get('explorer-recycle'); w && w.menubar && w.menubar._btns[0].click(); }, 50); } });
    if (it.vfs) m.push({ label: 'Explore', disabled: it.vfs.kind !== 'folder', onClick: () => openItem(id) });
    if (it.project) m.push({ label: isFav(it.project.url) ? 'Remove from &Favorites' : 'Add to &Favorites', onClick: () => toggleFav(it.project.url) });
    m.push({ sep: true });
    if (id !== 'sys:recycle') m.push({ label: '&Delete', accel: 'Del', onClick: () => trashSelected() });
    m.push({ label: 'Rena&me', accel: 'F2', disabled: many, onClick: () => startRename(id) });
    m.push({ label: 'P&roperties', disabled: many, onClick: () => id === 'sys:my-computer' ? showSystemProperties() : itemProperties(it) });
    return m;
  }
  function desktopMenu() {
    return [
      { label: 'Ne&w', submenu: HOOKS.newMenu('desktop') }, { sep: true },
      { label: 'Arrange &Icons', submenu: [{ label: 'by &Name', onClick: () => arrangeIcons('name') }, { label: 'by &Type', onClick: () => arrangeIcons('type') }, { label: 'by &Status', onClick: () => arrangeIcons('status') }, { sep: true }, { label: 'Auto &Arrange', checked: !!settings.autoArrange, onClick: () => { setSetting('autoArrange', !settings.autoArrange); layoutIcons(false); } }] },
      { label: 'Line &up Icons', onClick: () => { const s = settings.snap; settings.snap = true; layoutIcons(false); persistIcons(); settings.snap = s; } },
      { sep: true }, { label: '&Refresh', onClick: () => { buildIcons(); announce('Desktop refreshed'); } },
      { sep: true }, { label: 'Find…', onClick: () => openFind() }, { label: 'Run…', onClick: () => openRun() },
      { sep: true }, { label: 'P&roperties', onClick: () => openControl('display') }
    ];
  }
  function arrangeIcons(by) {
    const ids = visibleIconIds();
    ids.sort((a, b) => { const x = ITEMS.get(a), y = ITEMS.get(b); if (by === 'type') return x.type.localeCompare(y.type) || x.title.localeCompare(y.title); if (by === 'status') return (x.status || '~').localeCompare(y.status || '~') || x.title.localeCompare(y.title); return x.title.localeCompare(y.title); });
    iconOrder = ids; store.setJson(KEYS.icons + '-order', ids); iconPos = {}; store.setJson(KEYS.icons, {});
    layoutIcons(false); persistIcons(); announce('Icons arranged by ' + by);
  }
  function resetIcons() {
    Object.keys(iconNames).forEach(k => delete iconNames[k]); store.del('gh-icon-names'); iconPos = {}; iconOrder = null; store.del(KEYS.icons); store.del(KEYS.icons + '-order'); store.del(KEYS.trash);
    buildIcons(); refreshTrashViews();
  }

  function trashSelected() {
    const vids = [...selIcons].filter(i => ITEMS.get(i) && ITEMS.get(i).vfs);
    if (vids.length && HOOKS.deleteVfs) { HOOKS.deleteVfs(vids); }
    const ids = [...selIcons].filter(i => i !== 'sys:recycle' && i !== 'sys:my-computer' && !(ITEMS.get(i) && ITEMS.get(i).vfs));
    if (!ids.length && vids.length) return;
    if (!ids.length) { msgBox('You can\'t delete this item. It is part of ColtonOS.', { title: 'Error Deleting File', icon: 'error' }); return; }
    const names = ids.length === 1 ? 'the shortcut \'' + ITEMS.get(ids[0]).title + '\'' : 'these ' + ids.length + ' items';
    msgBox('Are you sure you want to send ' + names + ' to the Recycle Bin?', { title: ids.length === 1 ? 'Confirm File Delete' : 'Confirm Multiple File Delete', icon: 'question', buttons: ['Yes', 'No'], def: 0, cancel: 'no' }).then(r => {
      if (r !== 'yes') return;
      const t = trashState(); t.items = [...new Set([...t.items, ...ids])]; saveTrash(t);
      ids.forEach(i => delete iconPos[i]); store.setJson(KEYS.icons, iconPos);
      setIconSelection(new Set()); buildIcons(); refreshTrashViews(); announce(names + ' moved to the Recycle Bin');
    });
  }

  /* pointer handling: select / drag / rubber-band / open / long-press */
  let rubberEl = null;
  iconLayer.addEventListener('pointerdown', e => {
    if (e.target.matches && e.target.matches('input.rename')) return;
    if (e.pointerType === 'mouse' && e.button > 0) { const ic = e.target.closest('.desktop-icon'); if (ic && !selIcons.has(ic.dataset.id)) setIconSelection(new Set([ic.dataset.id]), ic.dataset.id); return; }
    const ic = e.target.closest('.desktop-icon');
    closeMenus(false);
    if (!ic) { deactivateWindows(); if (!(e.ctrlKey || e.metaKey)) setIconSelection(new Set()); startRubber(e); return; }
    deactivateWindows();
    const id = ic.dataset.id;
    if (e.ctrlKey || e.metaKey) { const s = new Set(selIcons); s.has(id) ? s.delete(id) : s.add(id); setIconSelection(s, id); return; }
    const wasSel = selIcons.has(id);
    if (!wasSel) setIconSelection(new Set([id]), id); else setIconSelection(selIcons, id);
    startIconDrag(e, ic, id, wasSel);
  });

  function startIconDrag(e, ic, id, wasSel) {
    const sx = e.clientX, sy = e.clientY, pid = e.pointerId; let moved = false, raf = 0, dx = 0, dy = 0, lp = 0, fired = false;
    const group = () => [...selIcons].map(i => icons.get(i)).filter(Boolean);
    const o0 = new Map(); group().forEach(g => o0.set(g.id, { x: g.x, y: g.y }));
    try { ic.setPointerCapture(pid); } catch (err) {}
    if (e.pointerType !== 'mouse') lp = setTimeout(() => { lp = 0; if (moved) return; fired = true; cleanup(); showContextMenu(iconMenu(id), sx, sy); }, 520);
    const paint = () => { raf = 0; group().forEach(g => { g.el.style.transform = 'translate3d(' + dx + 'px,' + dy + 'px,0)'; }); };
    const move = ev => {
      if (ev.pointerId !== pid) return;
      dx = ev.clientX - sx; dy = ev.clientY - sy;
      if (!moved) { if (Math.hypot(dx, dy) < 6) return; moved = true; if (lp) { clearTimeout(lp); lp = 0; } group().forEach(g => g.el.classList.add('dragging')); }
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const cleanup = () => { ic.removeEventListener('pointermove', move); ic.removeEventListener('pointerup', up); ic.removeEventListener('pointercancel', cancel); if (lp) { clearTimeout(lp); lp = 0; } if (raf) { cancelAnimationFrame(raf); raf = 0; } };
    const cancel = () => { cleanup(); group().forEach(g => { g.el.style.transform = ''; g.el.classList.remove('dragging'); }); };
    const up = ev => {
      cleanup();
      if (fired) return;
      if (!moved) {
        if (!(ev.ctrlKey || ev.metaKey) && selIcons.size > 1) setIconSelection(new Set([id]), id);
        if (shouldOpen(id)) openItem(id, ic);
        return;
      }
      const s = deskSize(); const g = group();
      // dropped on the Recycle Bin?
      const bin = icons.get('sys:recycle');
      if (bin && !selIcons.has('sys:recycle')) { const br = bin.el.getBoundingClientRect(); if (ev.clientX >= br.left && ev.clientX <= br.right && ev.clientY >= br.top && ev.clientY <= br.bottom) { cancel(); trashSelected(); return; } }
      if (HOOKS.dropOnto) {
        let tgt = null; icons.forEach(t => { if (selIcons.has(t.id)) return; const r = t.el.getBoundingClientRect(); if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) tgt = t.id; });
        if (tgt && HOOKS.dropOnto(tgt, g.map(x => x.id))) { g.forEach(it => { it.el.style.transform = ''; it.el.classList.remove('dragging'); }); return; }
      }
      g.forEach(it => { it.el.style.transform = ''; it.el.classList.remove('dragging'); });
      if (settings.autoArrange) {
        const { rows, c } = gridDims(); const lead = g[0], cc = xyCell(o0.get(lead.id).x + dx, o0.get(lead.id).y + dy);
        const idx = cc.col * rows + cc.row; const moving = new Set(g.map(x => x.id));
        const rest = visibleIconIds().filter(i => !moving.has(i)); rest.splice(clamp(idx, 0, rest.length), 0, ...g.map(x => x.id));
        iconOrder = rest; store.setJson(KEYS.icons + '-order', rest); layoutIcons(false); return;
      }
      // free / snapped placement with collision avoidance
      const moving = new Set(g.map(x => x.id)); const taken = new Set(); icons.forEach(i => { if (!moving.has(i.id)) { const c2 = xyCell(i.x, i.y); taken.add(c2.col + ',' + c2.row); } });
      const { cols, rows } = gridDims();
      g.forEach(it => {
        const o = o0.get(it.id); let nx = clamp(o.x + dx, 0, Math.max(0, s.w - 50)), ny = clamp(o.y + dy, 0, Math.max(0, s.h - 50));
        if (settings.snap) {
          let { col, row } = xyCell(nx, ny); col = Math.min(col, cols - 1); row = Math.min(row, rows - 1);
          if (taken.has(col + ',' + row)) { let found = null; for (let r = 1; r < 12 && !found; r++) for (let a = -r; a <= r && !found; a++) for (let b = -r; b <= r && !found; b++) { if (Math.max(Math.abs(a), Math.abs(b)) !== r) continue; const cc = col + a, rr = row + b; if (cc < 0 || rr < 0 || cc >= cols || rr >= rows) continue; if (!taken.has(cc + ',' + rr)) found = [cc, rr]; } if (found) { col = found[0]; row = found[1]; } }
          taken.add(col + ',' + row); const p = cellXY(col, row); nx = p.x; ny = p.y;
        }
        it.x = nx; it.y = ny; it.el.style.left = nx + 'px'; it.el.style.top = ny + 'px';
      });
      persistIcons();
    };
    ic.addEventListener('pointermove', move); ic.addEventListener('pointerup', up); ic.addEventListener('pointercancel', cancel);
  }

  function startRubber(e) {
    const r0 = desk.getBoundingClientRect(), sx = e.clientX - r0.left, sy = e.clientY - r0.top; let started = false;
    const base = (e.ctrlKey || e.metaKey) ? new Set(selIcons) : new Set();
    const host = iconLayer; try { host.setPointerCapture(e.pointerId); } catch (err) {}
    const move = ev => {
      const x = ev.clientX - r0.left, y = ev.clientY - r0.top;
      if (!started) { if (Math.hypot(x - sx, y - sy) < (e.pointerType === 'touch' ? 8 : 4)) return; started = true; if (e.pointerType !== 'mouse') host._lpFired = false; rubberEl = h('div', { id: 'rubber' }); iconLayer.append(rubberEl); }
      const l = Math.min(sx, x), t = Math.min(sy, y), w = Math.abs(x - sx), hh = Math.abs(y - sy);
      Object.assign(rubberEl.style, { left: l + 'px', top: t + 'px', width: w + 'px', height: hh + 'px' });
      const s = new Set(base);
      icons.forEach(ic => { const ix = ic.x + 20, iy = ic.y + 4, iw = 36, ih = 50; if (ix < l + w && ix + iw > l && iy < t + hh && iy + ih > t) s.add(ic.id); });
      setIconSelection(s);
    };
    const up = () => { host.removeEventListener('pointermove', move); host.removeEventListener('pointerup', up); host.removeEventListener('pointercancel', up); if (rubberEl) { rubberEl.remove(); rubberEl = null; } };
    host.addEventListener('pointermove', move); host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up);
  }

  iconLayer.addEventListener('contextmenu', e => {
    e.preventDefault(); closeMenus(false);
    const ic = e.target.closest('.desktop-icon');
    if (ic) { if (!selIcons.has(ic.dataset.id)) setIconSelection(new Set([ic.dataset.id]), ic.dataset.id); showContextMenu(iconMenu(ic.dataset.id), e.clientX, e.clientY); }
    else { setIconSelection(new Set()); showContextMenu(desktopMenu(), e.clientX, e.clientY); }
  });
  longPress(iconLayer, '.desktop-icon', (e, ic, x, y) => { if (ic) return; showContextMenu(desktopMenu(), x, y); });

  iconLayer.addEventListener('keydown', e => {
    const ic = e.target.closest('.desktop-icon'); if (!ic) return;
    const id = ic.dataset.id, k = e.key, all = $$('.desktop-icon', iconLayer);
    if (e.target.matches && e.target.matches('input.rename')) return;
    if (k === 'F2') { e.preventDefault(); startRename(id); }
    else if (k === 'Enter') { e.preventDefault(); if (!selIcons.has(id)) setIconSelection(new Set([id]), id); [...selIcons].forEach(i => openItem(i, ic)); }
    else if (k === ' ') { e.preventDefault(); const s = new Set(selIcons); s.has(id) ? s.delete(id) : s.add(id); setIconSelection(s, id); }
    else if (k.startsWith('Arrow')) {
      e.preventDefault();
      if (e.altKey) { moveIconByCell(id, k); return; }
      const n = spatialNext(all, ic, k);
      if (n) setIconSelection(e.shiftKey ? new Set([...selIcons, n.dataset.id]) : new Set([n.dataset.id]), n.dataset.id);
    }
    else if (k === 'Home' || k === 'End') { e.preventDefault(); const n = k === 'Home' ? all[0] : all[all.length - 1]; setIconSelection(new Set([n.dataset.id]), n.dataset.id); }
    else if (k === 'a' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setIconSelection(new Set(all.map(x => x.dataset.id)), id); }
    else if (k === 'Escape') setIconSelection(new Set(), id);
    else if (k === 'Delete') { e.preventDefault(); if (!selIcons.has(id)) setIconSelection(new Set([id]), id); trashSelected(); }
    else if (k === 'ContextMenu' || (k === 'F10' && e.shiftKey)) { e.preventDefault(); if (!selIcons.has(id)) setIconSelection(new Set([id]), id); const r = ic.getBoundingClientRect(); showContextMenu(iconMenu(id), r.left + 30, r.top + 40, true); }
    else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const lk = k.toLowerCase(), m = all.filter(x => ITEMS.get(x.dataset.id).title.toLowerCase().startsWith(lk));
      if (m.length) { const n = m[(m.indexOf(ic) + 1) % m.length]; setIconSelection(new Set([n.dataset.id]), n.dataset.id); }
    }
  });
  function startRename(id) {
    const ic = icons.get(id); if (!ic) return; const it = ITEMS.get(id), label = $('.di-label', ic.el); if (!label || $('input.rename', ic.el)) return;
    const inp = h('input', { type: 'text', class: 'rename', value: nameOf(it), 'aria-label': 'Rename ' + nameOf(it), maxlength: '40', spellcheck: 'false' });
    label.replaceWith(inp); inp.focus(); inp.select();
    let done = false;
    const fin = ok => {
      if (done) return; done = true;
      const v = inp.value.trim();
      if (ok && v && it.vfs && HOOKS.renameVfs) { HOOKS.renameVfs(it, v); }
      else if (ok && v && v !== nameOf(it)) { if (v === it.title) delete iconNames[id]; else iconNames[id] = v; store.setJson('gh-icon-names', iconNames); }
      const nl = h('span', { class: 'di-label', text: nameOf(it) }); inp.replaceWith(nl); ic.el.setAttribute('aria-label', nameOf(it) + (it.type ? ', ' + it.type : '')); ic.el.focus({ preventScroll: true });
    };
    inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); fin(true); } else if (e.key === 'Escape') { e.preventDefault(); fin(false); } });
    inp.addEventListener('blur', () => fin(true));
  }
  function moveIconByCell(id, key) {
    if (settings.autoArrange) return;
    const ic = icons.get(id), c = cellSize(), { cols, rows } = gridDims();
    let { col, row } = xyCell(ic.x, ic.y); col += key === 'ArrowRight' ? 1 : key === 'ArrowLeft' ? -1 : 0; row += key === 'ArrowDown' ? 1 : key === 'ArrowUp' ? -1 : 0;
    col = clamp(col, 0, cols - 1); row = clamp(row, 0, rows - 1);
    const occ = [...icons.values()].find(o => o !== ic && (() => { const q = xyCell(o.x, o.y); return q.col === col && q.row === row; })());
    if (occ) { const p = { x: ic.x, y: ic.y }; occ.x = p.x; occ.y = p.y; occ.el.style.left = p.x + 'px'; occ.el.style.top = p.y + 'px'; }
    const p = cellXY(col, row); ic.x = p.x; ic.y = p.y; ic.el.style.left = p.x + 'px'; ic.el.style.top = p.y + 'px';
    persistIcons(); announce(ITEMS.get(id).title + ' moved to column ' + (col + 1) + ', row ' + (row + 1));
  }

  /* =====================================================================
   *  TASKBAR: quick launch, tray, clock
   * ===================================================================== */
  let onlineCount = '…', chatUnread = false;
  const tray = $('#tb-tray');
  const clockBtn = h('button', { type: 'button', class: 'tray-clock', 'aria-label': 'Clock' });
  const chatTray = h('button', { type: 'button', class: 'tray-btn', title: 'Chatroom', 'aria-label': 'Chatroom' }, h('img', { src: 'images/icons/chatroom.png', alt: '' }), h('span', { class: 'dot', hidden: true }));
  const netTray = h('button', { type: 'button', class: 'tray-btn', title: 'Network', 'aria-label': 'Network status' }, h('img', { src: IC('network'), alt: '' }));
  const sndTray = h('button', { type: 'button', class: 'tray-btn', title: 'Volume', 'aria-label': 'Volume', 'aria-haspopup': 'dialog', 'aria-expanded': 'false' }, h('img', { src: IC('speaker'), alt: '' }));
  const onlineTray = h('button', { type: 'button', class: 'tray-online', title: 'People online', 'aria-label': 'People online' }, h('span', { class: 'ol-dot', 'aria-hidden': 'true' }), h('span', { class: 'ol-n', text: '…' }));
  onlineTray.addEventListener('click', () => openItem('app:chat', onlineTray));
  tray.append(onlineTray, chatTray, netTray, sndTray, clockBtn);
  chatTray.addEventListener('click', () => openItem('app:chat', chatTray));
  sndTray.addEventListener('click', () => openVolume());
  netTray.addEventListener('click', () => msgBox('Network status: ' + (navigator.onLine ? 'Online' : 'Offline') + '\nUsers online in the chatroom: ' + onlineCount + (navigator.onLine ? '' : '\n\nLocal games and apps still work offline.'), { title: 'Network', icon: 'info' }));
  clockBtn.addEventListener('dblclick', () => openItem('app:clock', clockBtn));
  clockBtn.addEventListener('click', e => { if (e.detail === 0) openItem('app:clock', clockBtn); });
  function setChatDot(on) { chatUnread = on; $('.dot', chatTray).hidden = !on; chatTray.title = 'Chatroom — ' + onlineCount + ' online' + (on ? ' (new messages)' : ''); chatTray.setAttribute('aria-label', chatTray.title); }
  function paintNet() {
    const on = navigator.onLine; netTray.classList.toggle('off', !on);
    onlineTray.hidden = !settings.showOnline; $('.ol-n', onlineTray).textContent = onlineCount; onlineTray.title = onlineCount + ' online now'; onlineTray.setAttribute('aria-label', onlineCount + ' people online'); onlineTray.classList.toggle('off', !on);
    netTray.title = 'Network: ' + (on ? 'Online' : 'Offline') + ' — ' + onlineCount + ' users in chat';
  }
  window.addEventListener('online', paintNet); window.addEventListener('offline', paintNet);

  let clockTimer = 0;
  function tickClock() {
    clearTimeout(clockTimer);
    const now = new Date();
    clockBtn.hidden = !settings.showClock;
    clockBtn.textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: settings.showSeconds ? '2-digit' : undefined, hour12: settings.clock24 ? false : undefined });
    clockBtn.title = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    clockBtn.setAttribute('aria-label', 'Clock, ' + clockBtn.textContent + ', ' + clockBtn.title);
    if (!D.hidden) clockTimer = setTimeout(tickClock, settings.showSeconds ? 1000 - now.getMilliseconds() + 20 : 60000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + 50);
  }
  D.addEventListener('visibilitychange', () => { if (!D.hidden) tickClock(); else clearTimeout(clockTimer); });

  function buildQuickLaunch() {
    const q = $('#tb-quick');
    const mk = (title, icon, fn) => { const b = h('button', { type: 'button', class: 'tb-btn', title, 'aria-label': title }, h('img', { src: icon, alt: '', width: 16, height: 16 })); b.addEventListener('click', fn); q.append(b); };
    mk('Show Desktop', IC('my-computer'), showDesktop);
    mk('Project Library', IC('documents-folder'), () => openItem('app:library'));
    mk('Arcade Hub', IC('gamepad'), () => openItem('app:arcade'));
    mk('Chatroom', 'images/icons/chatroom.png', () => openItem('app:chat'));
  }

  function taskbarMenu(x, y) {
    showContextMenu([{ label: '&Cascade Windows', onClick: () => arrangeWindows('cascade') }, { label: 'Tile Windows &Horizontally', onClick: () => arrangeWindows('horizontal') }, { label: 'Tile Windows &Vertically', onClick: () => arrangeWindows('vertical') },
      { label: '&Minimize All Windows', onClick: minimizeAll }, { sep: true }, { label: 'Show &Desktop', onClick: showDesktop }, { label: 'Task &Manager…', onClick: openTaskManager }, { sep: true }, { label: 'P&roperties', onClick: () => openControl('taskbar') }], x, y);
    const m = menuStack[0]; if (m) m.el.style.top = Math.max(0, y - m.el.offsetHeight) + 'px';
  }
  (function () {
    const tb = $('#taskbar');
    tb.addEventListener('contextmenu', e => { if (e.target.closest('button')) return; e.preventDefault(); closeMenus(false); taskbarMenu(e.clientX, e.clientY); });
    longPress(tb, 'button', (e, b, x, y) => { if (e.target.closest('button')) return; taskbarMenu(x, y); });
  }());

  startBtn.addEventListener('click', e => { toggleStartMenu(e.detail === 0); });
  startBtn.addEventListener('pointerdown', e => { if (menuOpener === startBtn && menusOpen()) { e.preventDefault(); } });

  /* ----- Start menu ----- */
  const ico = (it, size) => it.icon;
  const appItem = (id, label) => { const it = ITEMS.get(id); return { label: label || it.title, icon: it.icon, onClick: () => openItem(id, startBtn) }; };
  function startMenuItems() {
    const games = PROJECTS.map(p => { const it = ITEMS.get('game:' + p.url); return { label: p.title, icon: it.icon, onClick: () => openItem(it.id, startBtn) }; });
    const classicsM = CLASSICS.map(c => { const it = ITEMS.get('game:' + c.url); return { label: c.title, icon: it.icon, onClick: () => openItem(it.id, startBtn) }; });
    const favs = favorites().map(u => ITEMS.get('game:' + u)).filter(Boolean).map(it => ({ label: it.title, icon: it.icon, onClick: () => openItem(it.id, startBtn) }));
    const recs = recents().filter(r => r && ITEMS.has('game:' + r.url)).map(r => { const it = ITEMS.get('game:' + r.url); return { label: it.title, icon: it.icon, onClick: () => openItem(it.id, startBtn) }; });
    const empty = [{ label: '(Empty)', disabled: true }];
    return [
      { label: '&Programs', icon: IC('programs'), submenu: () => [
        { label: '&Accessories', icon: IC('folder'), submenu: APPLETS.filter(a => a.group !== 'games').map(a => appItem('app:' + a.id)).concat([{ sep: true }, appItem('app:monitor')]) },
        { label: '&Games', icon: IC('folder'), submenu: games.concat([{ sep: true }, { label: 'Classic Games', icon: IC('folder'), submenu: classicsM }]).concat(APPLETS.filter(a => a.group === 'games').length ? [{ sep: true }].concat(APPLETS.filter(a => a.group === 'games').map(a => appItem('app:' + a.id))) : []) },
        { label: '&Internet', icon: IC('folder'), submenu: [appItem('app:browser'), appItem('app:chat'), appItem('app:arcade')] },
        { sep: true }, { label: 'Project &Library', icon: IC('documents-folder'), onClick: () => openItem('app:library') },
        { label: '&Welcome', icon: IC('help'), onClick: () => openItem('app:welcome') },
        { label: 'Windows &Explorer', icon: IC('my-computer'), onClick: () => openItem('sys:my-computer') },
        { label: 'MS-&DOS Prompt', icon: IC('run'), onClick: () => openItem('app:msdos', startBtn) },
        { label: 'My Doc&uments', icon: IC('documents-folder'), onClick: () => openItem('folder:documents', startBtn) }
      ] },
      { label: 'F&avorites', icon: IC('star'), submenu: () => (favs.length ? favs : empty) },
      { label: '&Documents', icon: IC('documents-folder'), submenu: () => (recs.length ? recs : empty).concat([{ sep: true }, { label: '&Clear Documents', disabled: !recs.length, onClick: () => { store.setJson(LEGACY.recents, []); announce('Documents list cleared'); } }]) },
      { label: '&Settings', icon: IC('control-panel'), submenu: [{ label: '&Control Panel', icon: IC('control-panel'), onClick: () => openControl() }, { label: '&Taskbar && Start Menu…', icon: IC('programs'), onClick: () => openControl('taskbar') }, { label: '&Display…', icon: IC('my-computer'), onClick: () => openControl('display') }] },
      { label: '&Find', icon: IC('find'), submenu: [{ label: '&Files or Folders… ', icon: IC('find'), accel: 'Ctrl+K', onClick: () => openFind() }] },
      { label: '&Help', icon: IC('help'), onClick: () => openHelp() },
      { label: '&Run…', icon: IC('run'), onClick: () => openRun() },
      { sep: true },
      { label: 'S&hut Down…', icon: IC('shutdown'), onClick: () => openShutdown() }
    ].map(x => { if (x.label && x.label.includes('&&')) x.label = x.label.replace('&&', '§').replace('§', '&'); return x; });
  }

  /* =====================================================================
   *  CONTROL PANEL (opens the Settings applet to a page)
   * ===================================================================== */
  function openControl(page) {
    const it = ITEMS.get('app:control'); GH.pendingPage = page || 'home';
    const W = frameWindow(it.app); showWin(W);
    if (W.iframe && W.iframe.contentWindow && W.iframe.src && W.iframe.src.indexOf('control-panel') > -1) postToFrame(W.iframe, { source: 'parent-shell', action: 'cpGoto', page: GH.pendingPage });
  }

  /* =====================================================================
   *  LAYOUT SESSION (save / restore / reset)
   * ===================================================================== */
  function saveLayout() {
    const state = {};
    wins.forEach(w => { if (w.o.dialog || !w.visible) return; const e = w.el; state[w.id] = { left: e.offsetLeft, top: e.offsetTop, width: e.offsetWidth, height: e.offsetHeight, max: w.maximized, min: w.minimized }; });
    store.ssetJson(KEYS.session + '-layout', state);
  }
  function restoreLayout() {
    const st = store.sjson(KEYS.session + '-layout', null); if (!st) return false;
    Object.keys(st).forEach(id => { const w = wins.get(id); if (!w || !w.visible) return; const g = st[id]; if (w.maximized) setMax(w, false); applyGeo(w, g); if (g.max) setMax(w, true); });
    return true;
  }
  function resetLayout() {
    Object.keys(geoMemory).forEach(k => delete geoMemory[k]); store.ssetJson(KEYS.session, geoMemory);
    let i = 0; wins.forEach(w => { if (w.o.dialog || !w.visible) return; if (w.maximized) setMax(w, false); openCount = i++; applyGeo(w, defaultGeometry(w)); }); openCount = i;
  }

  /* =====================================================================
   *  SYSTEM DIALOGS: About, System Properties, Run, Shut Down
   * ===================================================================== */
  function visitCount() { const n = parseInt(store.get(LEGACY.visits, '0'), 10); return isNaN(n) ? 0 : n; }

  /* =====================================================================
   *  CLOSE PROGRAM (task manager)
   * ===================================================================== */
  function openTaskManager() {
    const list = h('div', { class: 'find-results sunken', role: 'listbox', 'aria-label': 'Programs', style: { height: '190px', overflow: 'auto' }, tabindex: '0' });
    let sel = null, rows = [];
    const progs = () => Array.from(wins.values()).filter(w => !w.o.dialog && w.visible);
    function draw() {
      const p = progs(); list.replaceChildren(); rows = [];
      if (!p.find(w => w.id === sel)) sel = p[0] && p[0].id;
      p.forEach(w => {
        const st = w.minimized ? 'Minimized' : (activeWin === w ? 'Active' : 'Running');
        const r = h('div', { class: 'ex-item' + (w.id === sel ? ' selected' : ''), role: 'option', 'aria-selected': String(w.id === sel), dataset: { id: w.id }, style: { flexDirection: 'row', width: '100%', textAlign: 'left', gap: '8px', padding: '3px 6px', alignItems: 'center', cursor: 'default' } },
          h('img', { src: w.o.icon || IC('programs'), alt: '', width: 16, height: 16, style: { width: '16px', height: '16px', objectFit: 'cover' } }), h('span', { class: 'grow', text: w.title }), h('span', { style: { opacity: '.75' }, text: st }));
        r.addEventListener('click', () => { sel = w.id; draw(); }); r.addEventListener('dblclick', () => act('switch')); rows.push(r); list.append(r);
      });
      if (!p.length) list.append(h('div', { class: 'ex-empty', text: 'No programs are running.' }));
    }
    function act(kind) { const w = wins.get(sel); if (!w) return; if (kind === 'switch') { dlg.finish('ok'); focusWin(w, false); } else { w.close(true); draw(); announce(w.title + ' ended'); } }
    list.addEventListener('keydown', e => { const i = rows.findIndex(r => r.dataset.id === sel); if (e.key === 'ArrowDown' && rows[i + 1]) { e.preventDefault(); sel = rows[i + 1].dataset.id; draw(); } else if (e.key === 'ArrowUp' && rows[i - 1]) { e.preventDefault(); sel = rows[i - 1].dataset.id; draw(); } else if (e.key === 'Delete') { e.preventDefault(); act('end'); } });
    const body = h('div', { class: 'dialog-pad' }, h('p', { style: { margin: '0 0 8px' }, text: 'These programs are running. You can switch to one or end it. Ending a game closes it without saving.' }), list);
    const dlg = openDialog({ title: 'Close Program', icon: IC('programs'), content: body, width: 420, focus: () => list, buttons: [
      { label: 'End Task', value: 'end', onClick: () => { act('end'); return false; } }, { label: 'Switch To', value: 'switch', onClick: () => { act('switch'); return false; } }, { label: 'Cancel', value: 'cancel', default: true }] });
    draw();
  }
  addItem({ id: 'app:taskmgr', title: 'Task Manager', type: 'Application', icon: IC('programs'), desc: 'See and end running programs', keywords: 'task manager close program end task running ctrl alt delete', open: () => openTaskManager() });

  /* tray volume popup */
  let volEl = null;
  function closeVolume() { if (volEl) { volEl.remove(); volEl = null; sndTray.setAttribute('aria-expanded', 'false'); D.removeEventListener('pointerdown', volOutside, true); D.removeEventListener('keydown', volKey, true); } }
  const volOutside = e => { if (volEl && !volEl.contains(e.target) && !sndTray.contains(e.target)) closeVolume(); };
  const volKey = e => { if (e.key === 'Escape') { closeVolume(); sndTray.focus(); } };
  function openVolume() {
    if (volEl) { closeVolume(); return; }
    closeMenus(false);
    const range = h('input', { type: 'range', min: '0', max: '100', step: '5', 'aria-label': 'System sound volume', style: { width: '120px' } }); range.value = settings.uiVolume;
    range.addEventListener('input', () => setSetting('uiVolume', +range.value, true)); range.addEventListener('change', () => playSound('info'));
    const mute = h('input', { type: 'checkbox', checked: !settings.uiSounds }); mute.addEventListener('change', () => { setSetting('uiSounds', !mute.checked, true); if (!mute.checked) playSound('info'); });
    volEl = h('div', { class: 'win raised vol-pop', role: 'dialog', 'aria-label': 'Volume', style: { position: 'fixed', zIndex: '100000', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' } },
      h('strong', { text: 'Volume' }), range, h('label', { class: 'chk' }, mute, h('span', { class: 'box' }), h('span', { class: 'lbl', text: 'Mute' })),
      h('button', { type: 'button', class: 'btn small', text: 'Sound settings…', on: { click: () => { closeVolume(); openControl('sounds'); } } }));
    D.body.append(volEl); const r = sndTray.getBoundingClientRect(); volEl.style.left = clamp(r.left + r.width / 2 - volEl.offsetWidth / 2, 4, innerWidth - volEl.offsetWidth - 4) + 'px'; volEl.style.top = (r.top - volEl.offsetHeight - 4) + 'px';
    sndTray.setAttribute('aria-expanded', 'true'); D.addEventListener('pointerdown', volOutside, true); D.addEventListener('keydown', volKey, true); range.focus();
  }

  function showAbout() {
    const body = h('div', { class: 'dialog-body' }, h('img', { class: 'di', src: 'images/windows.png', alt: '', width: 32, height: 32, style: { objectFit: 'contain' } }),
      h('div', { class: 'msg', style: { whiteSpace: 'normal' } }, h('strong', { text: 'ColtonOS 95' }), h('br'), 'Macrohard Corporation (the exact opposite of Microsoft)', h('br'), 'Version ' + (SITE.version || ''), h('div', { class: 'hr' }),
        'This product is licensed to:', h('br'), (SITE.author || 'COLTON BENNETT') + (SITE.location ? ', ' + SITE.location : ''), h('div', { class: 'hr' }), (SITE.footerCopyright || ''), h('br'), 'You have visited ' + visitCount() + ' time(s).'));
    openDialog({ title: 'About ColtonOS', icon: IC('help'), content: body, width: 380, buttons: [{ label: 'OK', value: 'ok', default: true }] });
  }
  function showSystemProperties() {
    const nav = navigator, mem = nav.deviceMemory ? nav.deviceMemory + ' GB+' : 'Not reported', cores = nav.hardwareConcurrency || '?';
    const ua = nav.userAgent.replace(/\s*\(.*?\)\s*/g, ' ').trim().slice(0, 90);
    const row = (a, b) => h('div', { style: { margin: '2px 0' } }, h('strong', { text: a }), h('br'), b);
    const general = h('div', { class: 'col', style: { gap: '4px' } }, h('div', { class: 'row', style: { alignItems: 'flex-start', gap: '12px' } }, h('img', { src: IC('my-computer'), alt: '', width: 48, height: 48 }), h('div', { class: 'grow' },
      row('System:', 'ColtonOS 95 ' + (SITE.version || '')), row('Registered to:', (SITE.author || '') + ' · ' + (SITE.location || '')), row('Computer:', 'Web browser — ' + ua), row('Memory:', mem + ' · ' + cores + ' logical processor(s)'))));
    const perf = h('div', { class: 'col' }, row('Low Power Mode:', lowPowerActive() ? 'ON' + (devicePrefersLowPower() ? ' (automatic for this device)' : '') : 'Off'), row('CRT effect:', settings.crt), row('Network:', navigator.onLine ? 'Online' : 'Offline'), row('Chat users online:', String(onlineCount)),
      h('div', { class: 'hr' }), h('button', { type: 'button', class: 'btn', text: 'Open System Monitor…', on: { click: () => openItem('app:monitor') } }));
    const resBox = h('div', { class: 'col' });
    const res = () => {
      const sc = window.screen || {}, row2 = (a, b) => h('div', { style: { margin: '2px 0' } }, h('strong', { text: a }), h('br'), b);
      const est = h('span', { text: 'Checking…' }); resBox.replaceChildren(row2('Display:', (sc.width || '?') + ' × ' + (sc.height || '?') + ' at ' + (window.devicePixelRatio || 1) + '× scale, ' + (sc.colorDepth || '?') + '-bit color'), row2('Window:', innerWidth + ' × ' + innerHeight), row2('Language:', navigator.language || '?'), row2('Time zone:', (Intl.DateTimeFormat().resolvedOptions().timeZone || '?')), row2('Input:', coarse() ? 'Touch screen' : 'Mouse and keyboard'), row2('Saved data (this browser):', est));
      if (navigator.storage && navigator.storage.estimate) navigator.storage.estimate().then(e => { est.textContent = (e.usage / 1048576).toFixed(1) + ' MB used of about ' + Math.round(e.quota / 1048576) + ' MB available'; }).catch(() => { est.textContent = 'Not available'; }); else est.textContent = 'Not available';
    };
    const tabs = makeTabs([{ label: 'General', panel: general }, { label: 'Performance', panel: perf }, { label: 'Resources', panel: resBox, onShow: res }]);
    openDialog({ title: 'System Properties', icon: IC('my-computer'), content: tabs, width: 420, buttons: [{ label: 'OK', value: 'ok', default: true }, { label: 'Cancel', value: 'cancel' }] });
  }

  const RUN_ALIASES = { command: 'app:msdos', 'command.com': 'app:msdos', msdos: 'app:msdos', dos: 'app:msdos', cmd: 'app:msdos', winmine: 'app:minesweeper', sol: 'app:solitaire', network: 'sys:network', calc: 'app:calculator', notepad: 'app:notepad', notes: 'app:notes', 'my documents': 'folder:documents', mspaint: 'app:paint', control: 'app:control', 'control panel': 'app:control', explorer: 'sys:my-computer', iexplore: 'app:browser', winver: 'about', help: 'help', sysmon: 'app:monitor', taskmgr: 'app:taskmgr', 'close program': 'app:taskmgr', saver: 'saver', chat: 'app:chat', arcade: 'app:arcade', timer: 'app:timer', clock: 'app:clock', weather: 'app:weather', welcome: 'app:welcome', library: 'app:library', find: 'find', shutdown: 'shutdown', 'c:\\': 'drive:c', 'c:': 'drive:c', 'a:': 'drive:a', 'd:': 'drive:d' };
  function resolveRun(text) {
    const t = text.trim().toLowerCase().replace(/\.(exe|html?|txt)$/, ''); if (!t) return null;
    if (RUN_ALIASES[t]) return RUN_ALIASES[t];
    for (const it of ITEMS.values()) if (it.title.toLowerCase().replace(/\.(txt)$/, '') === t) return it.id;
    for (const it of ITEMS.values()) if (it.title.toLowerCase().startsWith(t) && t.length > 2) return it.id;
    return null;
  }
  function runCommand(id, opener) {
    if (id === 'saver') GH.previewSaver(); else if (id === 'about') showAbout(); else if (id === 'help') openHelp(); else if (id === 'find') openFind(); else if (id === 'shutdown') openShutdown(); else openItem(id, opener);
  }
  function openRun() {
    const hist = store.json(KEYS.runHistory, []);
    const input = h('input', { type: 'text', class: 'field', id: 'run-input', list: 'run-list', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Open', style: { width: '100%' } });
    const dl = h('datalist', { id: 'run-list' }, hist.map(x => h('option', { value: x })));
    const body = h('div', { class: 'dialog-pad' }, h('div', { class: 'row', style: { alignItems: 'flex-start', gap: '12px', marginBottom: '10px' } }, h('img', { src: IC('run'), alt: '', width: 32, height: 32 }), h('div', { class: 'grow', text: 'Type the name of a program, folder or game, and ColtonOS will open it for you.' })),
      h('label', { class: 'row' }, h('span', { text: 'Open:' }), h('span', { class: 'grow' }, input), dl));
    const go = W => {
      const v = input.value.trim(); if (!v) return false;
      const id = resolveRun(v);
      if (!id) { msgBox('Cannot find \'' + v + '\'. Make sure you typed the name correctly, and then try again.\n\nTip: use Find (Ctrl+K) to search everything.', { title: v, icon: 'error' }); return false; }
      store.setJson(KEYS.runHistory, [v, ...hist.filter(x => x !== v)].slice(0, 10));
      setTimeout(() => runCommand(id), 0);
    };
    openDialog({ title: 'Run', icon: IC('run'), content: body, width: 420, focus: () => input, buttons: [{ label: 'OK', value: 'ok', default: true, onClick: go }, { label: 'Cancel', value: 'cancel' }, { label: 'Browse…', value: 'browse', onClick: () => { setTimeout(openFind, 0); } }] });
  }

  function openShutdown() {
    let choice = 'shutdown';
    const mk = (v, label) => h('label', { class: 'rad' }, h('input', { type: 'radio', name: 'sd', value: v, checked: v === 'shutdown', on: { change: () => { choice = v; } } }), h('span', { class: 'box' }), h('span', { class: 'lbl', text: label }));
    const body = h('div', { class: 'dialog-body' }, h('img', { class: 'di', src: IC('shutdown'), alt: '', width: 32, height: 32 }), h('div', { class: 'msg', style: { whiteSpace: 'normal' } }, 'Are you sure you want to:', h('div', { class: 'col', style: { margin: '8px 0 0 8px', gap: '4px' }, role: 'radiogroup', 'aria-label': 'Shut down options' }, mk('shutdown', 'Shut down the computer?'), mk('restart', 'Restart the computer?'), mk('dos', 'Restart the computer in MS-DOS mode?'), mk('close', 'Close all programs and return to the desktop?'))));
    openDialog({ title: 'Shut Down ColtonOS', icon: IC('shutdown'), content: body, width: 380, focus: W => $('input:checked', W.el), buttons: [{ label: 'Yes', value: 'yes', default: true, onClick: () => { setTimeout(() => doShutdown(choice), 0); } }, { label: 'No', value: 'no' }, { label: 'Help', value: 'help', onClick: () => { setTimeout(() => openHelp('start'), 0); return false; } }] });
  }
  function doShutdown(mode) {
    if (mode === 'close') { Array.from(wins.values()).forEach(w => { if (!w.o.dialog) w.close(true); }); return; }
    store.set('gh-dirty', '0');
    if (HOOKS.shutdown && HOOKS.shutdown(mode)) return;
    const sc = h('div', { id: 'shutdown-screen', role: 'alertdialog', 'aria-label': 'Shutting down', tabindex: '0', style: { position: 'fixed', inset: '0', zIndex: '2147482000', background: '#008080', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: '22px', padding: '20px', cursor: 'default' } }, mode === 'restart' ? 'ColtonOS is restarting…' : 'ColtonOS is shutting down…');
    D.body.append(sc); closeMenus(false); wins.forEach(w => { try { if (w.iframe) w.iframe.src = 'about:blank'; } catch (e) {} });
    const restart = () => { try { sessionStorage.removeItem('gh-boot-done'); } catch (e) {} location.href = location.pathname + '?restart=' + Date.now(); };
    if (mode === 'restart') { setTimeout(restart, reducedMotion() ? 200 : 1400); return; }
    setTimeout(() => {
      sc.style.background = '#000'; sc.style.color = '#ff9a1f'; sc.style.fontSize = '24px';
      sc.replaceChildren(h('div', {}, 'It\'s now safe to turn off', h('br'), 'your computer.', h('div', { style: { color: '#888', fontSize: '14px', marginTop: '28px' }, text: 'Click or press any key to restart.' })));
      sc.focus(); announce('It is now safe to turn off your computer. Press any key to restart.');
      setTimeout(() => { sc.addEventListener('pointerdown', restart); sc.addEventListener('keydown', restart); }, 400);
    }, reducedMotion() ? 200 : 1500);
  }

  /* =====================================================================
   *  FIND (replaces the old Quick Launch palette)
   * ===================================================================== */
  function openFind(q) {
    if (wins.has('find')) { const w = wins.get('find'); showWin(w); const i = $('input', w.el); i && (i.focus(), q !== undefined && (i.value = q, i.dispatchEvent(new Event('input')))); return; }
    const input = h('input', { type: 'search', class: 'field grow', 'aria-label': 'Named', autocomplete: 'off', placeholder: 'Type a game, app or folder name…' });
    const results = h('div', { class: 'find-results sunken', role: 'listbox', 'aria-label': 'Search results' });
    const content = h('div', { class: 'col', style: { flex: '1', minHeight: '0', padding: '6px', gap: '6px' } },
      h('label', { class: 'row' }, h('span', { text: 'Named:' }), input), results);
    let W, sel = -1, rows = [];
    const score = (it, t) => { const hay = (it.title + ' ' + (it.keywords || '') + ' ' + it.type).toLowerCase(); const ti = it.title.toLowerCase(); if (!t) return 1; if (ti === t) return 100; if (ti.startsWith(t)) return 60; if (ti.includes(t)) return 40; return t.split(/\s+/).every(w => hay.includes(w)) ? 10 : 0; };
    function render() {
      const t = input.value.trim().toLowerCase();
      const list = [...ITEMS.values()].filter(it => it.open && !it.id.startsWith('drive:')).map(it => ({ it, s: score(it, t) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s || a.it.title.localeCompare(b.it.title)).slice(0, 60);
      results.replaceChildren(); rows = [];
      list.forEach((x, i) => {
        const r = h('div', { class: 'ex-item', role: 'option', id: 'find-r' + i, 'aria-selected': 'false', style: { flexDirection: 'row', width: '100%', textAlign: 'left', gap: '8px', padding: '3px 6px', alignItems: 'center', cursor: 'default' }, dataset: { id: x.it.id } }, itemIcon(x.it, 16), h('span', { class: 'grow', text: x.it.title }), h('span', { style: { opacity: '.7' }, text: x.it.type }));
        r.querySelector('img').style.cssText = 'width:16px;height:16px;object-fit:cover';
        r.addEventListener('click', ev => { setSel(i); if (shouldOpen(x.it.id) || singleClickMode()) go(); }); rows.push(r); results.append(r);
      });
      if (!list.length) results.append(h('div', { class: 'ex-empty', text: 'No items found.' }));
      setSel(list.length ? 0 : -1); W.setStatus(0, list.length + ' file(s) found');
    }
    const setSel = i => { sel = i; rows.forEach((r, j) => { const on = i === j; r.classList.toggle('selected', on); r.setAttribute('aria-selected', String(on)); if (on) { r.scrollIntoView({ block: 'nearest' }); input.setAttribute('aria-activedescendant', r.id); } }); };
    const go = () => { if (sel < 0) return; const id = rows[sel].dataset.id; openItem(id, W.sys); };
    W = createWindow({ id: 'find', title: 'Find: All Files', icon: IC('find'), content, width: 500, height: 420, status: ['grow'], minWidth: 300, minHeight: 220 });
    input.addEventListener('input', render);
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSel(Math.min(rows.length - 1, sel + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(Math.max(0, sel - 1)); }
      else if (e.key === 'Enter') { e.preventDefault(); go(); }
    });
    results.setAttribute('tabindex', '-1');
    render(); showWin(W); setTimeout(() => input.focus(), 30);
    if (q) { input.value = q; render(); }
  }

  /* =====================================================================
   *  PROJECT LIBRARY (the catalogue: search, filter, favorites, recents)
   * ===================================================================== */
  function openLibrary() {
    if (wins.has('library')) { showWin(wins.get('library')); return; }
    let search = '', status = 'all', sort = 'default', mode = 'all', cur = (PROJECTS.find(p => p.featured) || PROJECTS[0] || {}).url, W;
    const searchI = h('input', { type: 'search', class: 'field', 'aria-label': 'Search projects', placeholder: 'Search projects…', style: { width: '170px' } });
    const statusS = h('select', { class: 'field', 'aria-label': 'Filter by status' }, h('option', { value: 'all', text: 'All statuses' }), Object.keys(STATUS_META).map(k => h('option', { value: k, text: STATUS_META[k].label })));
    const sortS = h('select', { class: 'field', 'aria-label': 'Sort order' }, h('option', { value: 'default', text: 'Curated order' }), h('option', { value: 'type', text: 'Sort by type' }));
    const mkMode = (v, l) => h('button', { type: 'button', class: 'btn small', 'aria-pressed': 'false', text: l, dataset: { mode: v } });
    const bFav = mkMode('favorites', '☆ Favorites'), bRec = mkMode('recent', 'Recent'), bClr = h('button', { type: 'button', class: 'btn small', text: 'Clear' });
    const tools = h('div', { class: 'lib-tools' }, searchI, statusS, sortS, bFav, bRec, bClr);
    const tbody = h('tbody'); const table = h('table', { class: 'lib-table', role: 'grid', 'aria-label': 'Projects', 'aria-rowcount': '0' }, h('thead', {}, h('tr', { role: 'row' }, h('th', { role: 'columnheader', text: 'Name' }), h('th', { role: 'columnheader', text: 'Type' }), h('th', { role: 'columnheader', text: 'Status' }), h('th', { role: 'columnheader', class: 'hide-s', text: 'Tags' }))), tbody);
    const listBox = h('div', { class: 'lib-list sunken' }, table);
    const detail = h('div', { class: 'lib-detail sunken', 'aria-live': 'polite' });
    const content = h('div', { class: 'lib' }, tools, h('div', { class: 'lib-main' }, listBox, detail));
    const rowsData = () => {
      const feat = PROJECTS.find(p => p.featured); let arr = PROJECTS.filter(p => !p.featured);
      if (sort === 'type') arr.sort((a, b) => a.type.localeCompare(b.type) || a.title.localeCompare(b.title));
      if (feat) arr = [feat, ...arr];
      const t = search.trim().toLowerCase(), rc = new Set(recents().map(r => r.url));
      return arr.filter(p => (status === 'all' || p.statusKey === status) && (!t || [p.title, p.type, statusLabel(p.statusKey), p.description, ...(p.tags || [])].join(' ').toLowerCase().includes(t)) && (mode !== 'favorites' || isFav(p.url)) && (mode !== 'recent' || rc.has(p.url)));
    };
    function renderRows() {
      const d = rowsData(); tbody.replaceChildren();
      if (!d.find(p => p.url === cur)) cur = d[0] && d[0].url;
      d.forEach((p, i) => {
        const tr = h('tr', { role: 'row', 'aria-selected': String(p.url === cur), tabindex: p.url === cur ? '0' : '-1', dataset: { url: p.url }, 'aria-rowindex': String(i + 1) },
          h('td', { role: 'gridcell', class: 'nm' }, (() => { const im = h('img', { src: p.image || 'images/missing.png', alt: '', width: 16, height: 16 }); im.onerror = () => { im.src = 'images/missing.png'; }; return im; })(), (p.featured ? '★ ' : '') + p.title + (isFav(p.url) ? ' ☆' : '')),
          h('td', { role: 'gridcell', text: p.type }), h('td', { role: 'gridcell', text: statusLabel(p.statusKey) }), h('td', { role: 'gridcell', class: 'hide-s', text: (p.tags || []).slice(0, 3).join(', ') }));
        tbody.append(tr);
      });
      table.setAttribute('aria-rowcount', String(d.length));
      if (!d.length) tbody.append(h('tr', {}, h('td', { colspan: '4', style: { padding: '14px', opacity: '.7' }, text: mode === 'favorites' ? 'No favorites yet. Select a project and choose “Add to Favorites”.' : mode === 'recent' ? 'Nothing played yet.' : 'No projects match your filters.' })));
      const done = PROJECTS.filter(p => p.statusKey === 'complete').length;
      W && (W.setStatus(0, d.length + ' of ' + PROJECTS.length + ' project(s)'), W.setStatus(1, done + ' complete · ' + CLASSICS.length + ' classics'));
      [bFav, bRec].forEach(b => { const on = mode === b.dataset.mode; b.setAttribute('aria-pressed', String(on)); b.classList.toggle('pressed', on); });
      renderDetail();
    }
    function renderDetail() {
      const p = PROJECTS.find(x => x.url === cur); detail.replaceChildren();
      if (!p) { detail.append(h('p', { text: 'Select a project to see details.' })); return; }
      const shot = h('img', { class: 'shot', src: p.image || 'images/missing.png', alt: 'Screenshot of ' + p.title }); shot.onerror = () => { shot.style.display = 'none'; };
      const fav = isFav(p.url);
      detail.append(shot, h('h2', { text: p.title }), h('div', { text: p.type + ' · ' + statusLabel(p.statusKey) + (p.featured ? ' · ★ Featured' : '') }), h('p', { text: p.description }),
        h('div', { class: 'tags', 'aria-label': 'Tags' }, (p.tags || []).map(t => h('span', { text: t }))),
        h('div', { class: 'row', style: { flexWrap: 'wrap' } }, h('button', { type: 'button', class: 'btn default', text: 'Launch', on: { click: () => openItem('game:' + p.url, W.sys) } }),
          h('button', { type: 'button', class: 'btn', text: fav ? '★ Remove favorite' : '☆ Add to Favorites', 'aria-pressed': String(fav), on: { click: () => { const on = toggleFav(p.url); announce(p.title + (on ? ' added to' : ' removed from') + ' favorites'); } } }),
          h('button', { type: 'button', class: 'btn', text: 'Copy link', on: { click: () => { const u = new URL(p.url, location.href).href; (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(() => announce('Link copied'), () => msgBox(u, { title: 'Project link', icon: 'info' })); } } })));
    }
    W = createWindow({ id: 'library', title: 'Project Library', icon: IC('documents-folder'), content, status: ['grow', ''], width: 760, height: 500, minWidth: 340, minHeight: 260,
      menubar: [{ label: '&File', items: () => [{ label: '&Launch', onClick: () => cur && openItem('game:' + cur, W.sys) }, { sep: true }, { label: '&Close', onClick: () => W.requestClose() }] },
        { label: '&View', items: () => [{ label: '&All projects', radio: true, on: mode === 'all', onClick: () => { mode = 'all'; renderRows(); } }, { label: '&Favorites', radio: true, on: mode === 'favorites', onClick: () => { mode = 'favorites'; renderRows(); } }, { label: '&Recent', radio: true, on: mode === 'recent', onClick: () => { mode = 'recent'; renderRows(); } }] },
        { label: '&Help', items: () => [{ label: '&Help Topics', onClick: () => openHelp('library') }, { label: '&About ColtonOS…', onClick: showAbout }] }] });
    const fl = () => renderRows(); favListeners.add(fl); W.onClosed = () => favListeners.delete(fl);
    searchI.addEventListener('input', () => { search = searchI.value; renderRows(); });
    statusS.addEventListener('change', () => { status = statusS.value; renderRows(); });
    sortS.addEventListener('change', () => { sort = sortS.value; renderRows(); });
    [bFav, bRec].forEach(b => b.addEventListener('click', () => { mode = mode === b.dataset.mode ? 'all' : b.dataset.mode; renderRows(); }));
    bClr.addEventListener('click', () => { search = ''; status = 'all'; sort = 'default'; mode = 'all'; searchI.value = ''; statusS.value = 'all'; sortS.value = 'default'; renderRows(); });
    tbody.addEventListener('click', e => { const tr = e.target.closest('tr[data-url]'); if (!tr) return; cur = tr.dataset.url; renderRows(); const n = $('tr[data-url="' + CSS.escape(cur) + '"]', tbody); n && n.focus(); if (e.detail && shouldOpen('lib:' + cur)) openItem('game:' + cur, W.sys); });
    tbody.addEventListener('keydown', e => {
      const trs = $$('tr[data-url]', tbody), i = trs.findIndex(t => t.dataset.url === cur);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const n = trs[clamp(i + (e.key === 'ArrowDown' ? 1 : -1), 0, trs.length - 1)]; if (n) { cur = n.dataset.url; renderRows(); const t = $('tr[data-url="' + CSS.escape(cur) + '"]', tbody); t && (t.focus(), t.scrollIntoView({ block: 'nearest' })); } }
      else if (e.key === 'Enter') { e.preventDefault(); cur && openItem('game:' + cur, W.sys); }
    });
    renderRows(); showWin(W);
  }
  addItem({ id: 'app:library', title: 'Project Library', type: 'Application', icon: IC('documents-folder'), desc: 'Browse, search and favorite every project', keywords: 'library catalogue catalog projects games search favorites recent featured', open: () => openLibrary() });

  /* =====================================================================
   *  WELCOME + HELP
   * ===================================================================== */
  function openWelcome() {
    if (wins.has('welcome')) { showWin(wins.get('welcome')); return; }
    const feat = PROJECTS.find(p => p.featured), complete = PROJECTS.filter(p => p.statusKey === 'complete').length, prog = PROJECTS.filter(p => STATUS_META[p.statusKey] && STATUS_META[p.statusKey].bucket === 'progress').length;
    const stat = (n, l) => h('div', { class: 'well' }, h('b', { text: String(n) }), l);
    const mqText = (SITE.marqueeText || '').replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, '');
    const welcome = h('div', {}, h('p', { text: 'Welcome to my catalog! These are the projects I have been building lately. Everything you see here is a real program: double-click (or tap) to open it.' }),
      h('h2', { text: 'How to get around' }),
      h('ol', { class: 'steps' }, h('li', { class: 'well' }, h('span', {}, h('strong', { text: 'Open things. ' }), 'Double-click an icon, or just tap it on a touchscreen. Keyboard: arrow keys then Enter.')),
        h('li', { class: 'well' }, h('span', {}, h('strong', { text: 'Move things. ' }), 'Drag icons anywhere. Drag a window by its blue title bar and resize it from the edges.')),
        h('li', { class: 'well' }, h('span', {}, h('strong', { text: 'Find things. ' }), 'Click ', h('strong', { text: 'Start' }), ', open the Games folder, or press Ctrl+K to search. Right-click (or press-and-hold) for menus.'))),
      h('div', { class: 'stats' }, stat(PROJECTS.length, 'Projects'), stat(complete, 'Complete'), stat(prog, 'In progress'), stat(CLASSICS.length, 'Classics')),
      feat ? h('div', { class: 'ann well' }, h('h3', { text: '★ Featured game: ' + feat.title }), h('p', { text: feat.description }), h('div', { style: { marginTop: '6px' } }, h('button', { type: 'button', class: 'btn small', text: 'Play ' + feat.title, on: { click: () => openItem('game:' + feat.url) } }))) : null,
      h('p', { class: 'small', text: (SITE.heroNote || '').replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '') }),
      h('div', { class: 'marquee', 'aria-hidden': 'true' }, h('span', { text: mqText })),
      h('p', { class: 'small' }, 'Got suggestions or ideas? I\'d love to hear them! ', h('a', { class: 'link', href: 'mailto:coltjbennett@gmail.com', text: 'Send them here' }), '.'));
    const news = h('div', {}, NEWS.map(a => { const p = h('p'); p.innerHTML = a.content; return h('div', { class: 'ann well' }, h('h3', { text: a.title }), p); }));
    const TIPS = ['Press Ctrl+K at any time to search every game, app and folder.', 'Drag an icon onto the Recycle Bin to hide it. You can always restore it.', 'Right-click the taskbar to cascade or tile your windows.', 'Hold Ctrl+Alt and tap the arrow keys to switch windows, like Alt+Tab.', 'Press F2 on a desktop icon to rename it.', 'Open Control Panel › Display › Screen Saver to try 3D Pipes, Starfield and Mystify.', 'Turn on Low Power Mode if a game runs slowly.', 'Double-click a window title bar to maximize it, or double-click the little icon on its left to close it.', 'The CRT effect pauses while a game is open. You can change that under Display › Effects.', 'In a folder window, press Backspace to go up one level.', 'Add a game to Favorites in the Project Library and it appears on the Start menu.', 'Click the speaker in the taskbar to turn system sounds on and adjust the volume.'];
    let tipN = Math.floor(Math.random() * TIPS.length);
    const tipText = h('p', { style: { fontSize: '1.1em', lineHeight: '1.4' } }), tipNo = h('div', { class: 'small', style: { opacity: '.75' } });
    const showTip = () => { tipText.textContent = TIPS[tipN]; tipNo.textContent = 'Tip ' + (tipN + 1) + ' of ' + TIPS.length; };
    showTip();
    const tipsPanel = h('div', {}, h('div', { class: 'row', style: { alignItems: 'flex-start', gap: '12px' } }, h('img', { src: IC('help'), alt: '', width: 32, height: 32 }), h('div', { class: 'grow' }, h('strong', { text: 'Did you know…' }), tipText, tipNo)),
      h('div', { class: 'row', style: { marginTop: '10px' } }, h('button', { type: 'button', class: 'btn', text: 'Previous Tip', on: { click: () => { tipN = (tipN - 1 + TIPS.length) % TIPS.length; showTip(); } } }), h('button', { type: 'button', class: 'btn', text: 'Next Tip', on: { click: () => { tipN = (tipN + 1) % TIPS.length; showTip(); } } })));
    const tabs = makeTabs([{ label: 'Welcome', panel: welcome }, { label: 'Tips', panel: tipsPanel }, { label: 'What\'s New', panel: news }]);
    tabs.style.cssText = 'flex:1;min-height:0;display:flex;flex-direction:column;padding:8px';
    $('.tabpanel', tabs).style.cssText = 'flex:1;min-height:0;overflow:auto';
    const chk = h('input', { type: 'checkbox', checked: settings.welcome, on: { change: e => setSetting('welcome', e.target.checked) } });
    const foot = h('div', { class: 'welcome-foot' }, h('label', { class: 'chk grow' }, chk, h('span', { class: 'box' }), h('span', { class: 'lbl', text: 'Show this Welcome Screen next time you start ColtonOS' })),
      h('button', { type: 'button', class: 'btn', text: 'Project Library', on: { click: () => openItem('app:library') } }), h('button', { type: 'button', class: 'btn', text: 'Help', on: { click: () => openHelp() } }), h('button', { type: 'button', class: 'btn default', text: 'Close', on: { click: () => W.requestClose() } }));
    const head = h('div', { class: 'welcome-head' }, h('img', { src: 'images/windows.png', alt: '' }), h('div', {}, h('h1', { text: 'Welcome to ColtonOS 95' }), h('p', { text: 'Colton\'s Project Launcher ' + (SITE.version || '') + ' · Visit #' + String(visitCount()).padStart(6, '0') })));
    const content = h('div', { class: 'welcome' }, head, tabs, foot);
    const W = createWindow({ id: 'welcome', title: 'Welcome', icon: IC('help'), content, width: 600, height: 520, minWidth: 320, minHeight: 280 });
    showWin(W); setTimeout(() => { const b = $('.btn.default', W.el); b && b.focus(); }, 30);
  }
  addItem({ id: 'app:welcome', title: 'Welcome', type: 'Application', icon: IC('help'), desc: 'Tour, announcements and featured game', keywords: 'welcome tour announcements news featured what is new', open: () => openWelcome() });

  const HELP_PAGES = [
    ['start', 'Getting started', `<h2>Getting started</h2><p>ColtonOS 95 is a desktop that lives in your browser. Every game and tool is a program you can open, move around and close, just like a real computer.</p><h3>Opening programs</h3><p><b>Mouse:</b> double-click an icon. <b>Touchscreen:</b> tap it. <b>Keyboard:</b> use the arrow keys to pick an icon and press Enter. You can also click <b>Start</b> and browse the Programs menu.</p><h3>Can't find a game?</h3><p>Open <b>Project Library</b> to search and filter by status, favorites or recent play, or press <kbd>Ctrl</kbd>+<kbd>K</kbd> to Find anything.</p><h3>Shutting down</h3><p>Start › Shut Down. Restarting plays the startup sound again. Your saves are kept.</p>`],
    ['icons', 'Icons and the desktop', `<h2>Icons and the desktop</h2><p><b>Move:</b> drag an icon. Hold <kbd>Alt</kbd> and press an arrow key to nudge the selected icon one grid cell (no mouse needed).</p><p><b>Select several:</b> drag a box around them, or hold <kbd>Ctrl</kbd> and click.</p><p><b>Right-click</b> (touch: press and hold) the desktop for Arrange Icons, Line up Icons and Refresh. Dropping a shortcut on the <b>Recycle Bin</b> only hides the shortcut; restore it from the Bin at any time.</p><p>The folders: <b>Classic Games</b> holds the retro remakes, <b>Accessories</b> holds Calculator, Paint and friends, and <b>My Computer</b> shows everything.</p>`],
    ['windows', 'Windows and the taskbar', `<h2>Windows and the taskbar</h2><p>Drag a title bar to move a window; drag an edge or corner to resize. The buttons at the right minimize, maximize and close. Click the small icon at the left of the title bar for the system menu (also <kbd>Alt</kbd>+<kbd>Space</kbd>), which includes <b>Move</b> and <b>Size</b> for keyboard users and <b>Full Screen</b> for games.</p><p>Right-click an empty part of the taskbar (or press and hold) to Cascade, Tile, or Minimize All Windows. Every open window has a button on the taskbar. Click it to bring the window forward; click the active one to minimize it. On small screens, windows open maximized so games fit.</p>`],
    ['library', 'Project Library', `<h2>Project Library</h2><p>The Library lists every original project with its status (Complete, Beta, Legacy…). Pick a project to see its picture, description and tags. <b>Launch</b> opens it; <b>Add to Favorites</b> puts it in Start › Favorites. Recently opened games appear in Start › Documents.</p>`],
    ['keys', 'Keyboard shortcuts', `<h2>Keyboard shortcuts</h2><table><tr><td><kbd>Ctrl</kbd>+<kbd>Esc</kbd> or <kbd>Win</kbd></td><td>Open the Start menu</td></tr><tr><td><kbd>Ctrl</kbd>+<kbd>K</kbd> or <kbd>/</kbd></td><td>Find</td></tr><tr><td><kbd>Alt</kbd>+<kbd>F4</kbd></td><td>Close the active window</td></tr><tr><td><kbd>Alt</kbd>+<kbd>Space</kbd></td><td>System menu</td></tr><tr><td><kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>←</kbd>/<kbd>→</kbd></td><td>Switch windows: keep the keys held, tap the arrow to choose, release to switch</td></tr><tr><td><kbd>F2</kbd></td><td>Rename the selected desktop icon</td></tr><tr><td><kbd>Backspace</kbd></td><td>Go up one folder in an open folder window</td></tr><tr><td><kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>D</kbd></td><td>Show the desktop</td></tr><tr><td><kbd>F10</kbd></td><td>Focus the menu bar</td></tr><tr><td>Arrow keys, <kbd>Enter</kbd></td><td>Move between icons and open them</td></tr><tr><td><kbd>Alt</kbd>+arrows</td><td>Move the selected desktop icon</td></tr><tr><td><kbd>Shift</kbd>+<kbd>F10</kbd></td><td>Context menu</td></tr><tr><td><kbd>Del</kbd></td><td>Send the selected shortcut to the Recycle Bin</td></tr></table>`],
    ['touch', 'Touchscreen tips', `<h2>Touchscreen tips</h2><p>Tap an icon to open it (Control Panel › Mouse can switch to double-tap). Drag icons and title bars with your finger. <b>Press and hold</b> for the right-click menu. Windows open maximized on phones; use the middle title-bar button to restore or the taskbar to switch.</p>`],
    ['access', 'Accessibility', `<h2>Accessibility</h2><p>Everything can be done with the keyboard, and the desktop works with screen readers (window changes are announced). Open <b>Control Panel › Accessibility</b> to enable High Contrast, larger text, reduced motion, and to turn off the CRT effect.</p>`],
    ['crt', 'Screen effects and speed', `<h2>Screen effects and speed</h2><p>The CRT effect is a single lightweight overlay: scanlines, a phosphor mask and a soft vignette. It pauses automatically while a game is open so games stay sharp and fast. Change it under Control Panel › Display › Effects. <b>Low Power Mode</b> turns off decoration on slower devices without removing any features.</p>`],
    ['saver', 'Screen savers', `<h2>Screen savers</h2><p>After a few minutes with no activity, ColtonOS starts a screen saver. Choose one under <b>Control Panel › Display › Screen Saver</b>: <b>3D Pipes</b> (the classic, drawn with three.js), <b>Mystify</b>, <b>Starfield</b>, a bouncing <b>ColtonOS logo</b>, a scrolling <b>marquee</b>, or a blank screen. Move the mouse, press a key or tap to return.</p><p>Screen savers never start while a game is open, and 3D Pipes falls back to Mystify if the 3D library cannot load (for example, when you are offline for the first time). Pipes can be customized: number of pipes, joint style and speed. To preview one, press <kbd>Ctrl</kbd>+<kbd>K</kbd> and Run <b>saver</b>, or use Preview in Control Panel.</p>`],
    ['taskmgr', 'Close Program', `<h2>Close Program</h2><p>If an app stops responding, open <b>Task Manager</b> from the taskbar's right-click menu, from Run (type <b>taskmgr</b>), or press <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>Delete</kbd>. Select a program, then <b>End Task</b> to close it or <b>Switch To</b> to bring it forward.</p>`],
    ['trouble', 'Troubleshooting', `<h2>Troubleshooting</h2><p><b>A game is slow:</b> turn on Low Power Mode, close other windows, or maximize the game.</p><p><b>I deleted an icon:</b> open the Recycle Bin and choose Restore, or use Control Panel › Display › Desktop › Restore default icons.</p><p><b>Reset everything:</b> Control Panel › System › Reset all desktop settings. Game saves and chat data are never touched by this.</p>`]
  ];
  function openHelp(page) {
    let W = wins.get('help');
    const show = id => { const pg = HELP_PAGES.find(p => p[0] === id) || HELP_PAGES[0]; $$('button', W.nav).forEach(b => b.setAttribute('aria-current', String(b.dataset.id === pg[0]))); W.page.innerHTML = pg[2]; W.page.scrollTop = 0; };
    if (W) { showWin(W); if (page) show(page); return; }
    const nav = h('ul', { class: 'help-nav sunken', 'aria-label': 'Help topics' }); const pageEl = h('div', { class: 'help-page sunken', tabindex: '0', role: 'document', 'aria-label': 'Help topic' });
    HELP_PAGES.forEach(p => nav.append(h('li', {}, h('button', { type: 'button', text: p[1], dataset: { id: p[0] }, on: { click: () => show(p[0]) } }))));
    W = createWindow({ id: 'help', title: 'ColtonOS Help', icon: IC('help'), content: h('div', { class: 'help' }, nav, pageEl), width: 640, height: 440, minWidth: 300, minHeight: 220 });
    W.nav = nav; W.page = pageEl; showWin(W); show(page || 'start');
  }
  addItem({ id: 'app:help', title: 'Help', type: 'Application', icon: IC('help'), desc: 'How to use ColtonOS', keywords: 'help how to guide tutorial keyboard shortcuts touch accessibility', open: () => openHelp() });

  /* =====================================================================
   *  CHATROOM + NOTIFICATIONS
   * ===================================================================== */
  let lastChatOpen = null, pingTimer = 0;
  function syncChatVisibility() {
    const cw = wins.get('chat-window'); if (!cw) return;
    const open = isVisible(cw);
    if (open === lastChatOpen) return;
    lastChatOpen = open;
    if (open) setChatDot(false);
    const f = cw.iframe;
    if (f && f.contentWindow) postToFrame(f, { source: 'parent-shell', action: open ? 'chatWindowOpened' : 'chatWindowClosed', activeWindow: activityState ? Object.assign({}, activityState) : null, chatWindowOpen: open, isHomepage: !open && !activityState });
    sendActivityToChat();
  }
  function showPing(text) {
    const b = $('#ping-banner'); $('#ping-banner-text').textContent = text; b.hidden = false; requestAnimationFrame(() => b.classList.add('show'));
    H.classList.add('ping-banner-open');
    try { wins.forEach(w => { if (w.iframe && w.iframe.contentWindow && w.iframe.contentWindow.__gamesHubShowPing) w.iframe.contentWindow.__gamesHubShowPing(text); else if (w.iframe) { ensureFramePing(w.iframe); w.iframe.contentWindow.__gamesHubShowPing && w.iframe.contentWindow.__gamesHubShowPing(text); } }); } catch (e) {}
    clearTimeout(pingTimer); pingTimer = setTimeout(hidePing, 3000);
  }
  function hidePing() {
    const b = $('#ping-banner'); b.classList.remove('show'); setTimeout(() => { if (!b.classList.contains('show')) b.hidden = true; }, 200);
    H.classList.remove('ping-banner-open'); clearTimeout(pingTimer);
    wins.forEach(w => { try { w.iframe && w.iframe.contentWindow.__gamesHubHidePing && w.iframe.contentWindow.__gamesHubHidePing(); } catch (e) {} });
  }
  $('#ping-banner').addEventListener('click', () => { hidePing(); openItem('app:chat'); });
  $('#ping-banner').style.cursor = 'pointer';

  let toastEl = null, toastT = 0;
  function toast(msg) {
    if (!toastEl) { toastEl = h('div', { class: 'tip toast', role: 'status' }); D.body.append(toastEl); }
    toastEl.textContent = msg; toastEl.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { toastEl.hidden = true; }, 2800); announce(msg);
  }

  window.addEventListener('message', e => {
    if (e.origin !== ORIGIN) return;
    const d = e.data || {};
    const cf = chatFrame();
    if (d.source === 'arcade-hub') {
      const aw = wins.get('app-arcade'); if (!aw || !aw.iframe || e.source !== aw.iframe.contentWindow) return;
      if (d.active === false) { aw.activityName = ''; if (activeWin === aw) setActivity(aw); return; }
      const name = typeof d.name === 'string' && d.name.trim() ? d.name.trim() : 'Arcade Hub';
      aw.activityName = name === 'Arcade Hub' ? '' : name; if (activeWin === aw) { activityState = null; setActivity(aw); }
    } else if (d.source === 'universal-chat') {
      if (!cf || e.source !== cf.contentWindow) return;
      if (d.kind === 'activityRequest') sendActivityToChat();
      else if (d.kind === 'presence') { onlineCount = String(d.count); if (HOOKS.presence) HOOKS.presence(Array.isArray(d.users) ? d.users.filter(u => typeof u === 'string').slice(0, 100) : []); paintNet(); setChatDot(chatUnread); }
      else if (d.kind === 'unread') { const cw = wins.get('chat-window'); if (!isVisible(cw)) setChatDot(true); }
      else if (d.kind === 'ping') showPing(d.text);
    } else if (d.source === 'control-panel') {
      if (d.action === 'quickLaunch') openFind(); else if (d.action === 'install') GH.install();
    }
  });

  /* PWA install */
  let installPrompt = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; });
  window.addEventListener('appinstalled', () => { installPrompt = null; toast('ColtonOS was installed as an app.'); });

  /* =====================================================================
   *  TERMS OF SERVICE (same contract as before: ids + 'tosAccepted' key)
   * ===================================================================== */
  function setupToS(next) {
    const overlay = $('#tos-modal-overlay'), accept = $('#tos-accept-btn');
    if (!overlay || !accept) { next(); return; }
    const need = () => !store.get('tosAccepted');
    const show = () => {
      if (!need()) { next(); return; }
      overlay.style.display = 'flex'; $('.win', overlay).hidden = false;
      const blocker = overlay; try { accept.focus(); } catch (e) {} announce('Terms of Service. Please read and accept to continue.');
    };
    accept.addEventListener('click', () => { store.set('tosAccepted', 'true'); overlay.style.display = 'none'; next(); });
    overlay.addEventListener('keydown', e => {
      if (e.key === 'Tab') { const f = $$('button, [tabindex="0"]', overlay); const first = f[0], last = f[f.length - 1]; if (e.shiftKey && D.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && D.activeElement === last) { e.preventDefault(); first.focus(); } }
    });
    const booting = () => !!window.__ghBooting || !!D.getElementById('gh-boot-overlay');
    if (booting()) {
      let done = false; const once = () => { if (done) return; done = true; clearInterval(poll); show(); };
      const poll = setInterval(() => { if (!booting()) once(); }, 150); window.addEventListener('gh-boot-complete', once, { once: true });
    } else show();
  }

  /* =====================================================================
   *  GLOBAL KEYBOARD
   * ===================================================================== */
  let metaAlone = false;
  function onGlobalKey(e) {
    if (e.key === 'Meta') { metaAlone = true; return; } metaAlone = false;
    if (modalStack.length) return;
    const typing = e.target && (e.target.matches && e.target.matches('input, textarea, select, [contenteditable="true"]'));
    if (e.ctrlKey && e.key === 'Escape') { e.preventDefault(); toggleStartMenu(true); }
    else if (e.ctrlKey && !e.altKey && !e.shiftKey && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); openFind(); }
    else if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey && !(e.target.closest && e.target.closest('iframe'))) { e.preventDefault(); openFind(); }
    else if (e.ctrlKey && e.altKey && e.key === 'ArrowRight') { e.preventDefault(); switcherStep(1); }
    else if (e.ctrlKey && e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); switcherStep(-1); }
    else if (e.key === 'Escape' && swEl) { e.preventDefault(); closeSwitcher(false); }
    else if (e.ctrlKey && e.altKey && (e.key === 'd' || e.key === 'D')) { e.preventDefault(); showDesktop(); }
    else if (e.ctrlKey && e.altKey && (e.key === 'Delete' || e.key === 'Backspace')) { e.preventDefault(); openTaskManager(); }
    else if (e.altKey && e.key === ' ' && activeWin && !activeWin.o.dialog) { e.preventDefault(); openSystemMenu(activeWin, true); }
    else if (e.altKey && e.key === 'F4' && activeWin) { e.preventDefault(); activeWin.requestClose(); }
    else if ((e.key === 'F10' && !e.shiftKey) || (e.key === 'Alt' && false)) { if (activeWin && activeWin.menubar) { e.preventDefault(); const b = activeWin.menubar._btns[0]; b.focus(); } }
    else if (e.altKey && !e.ctrlKey && e.key.length === 1 && activeWin && activeWin.menubar) {
      const b = activeWin.menubar._btns.find(x => x._key === e.key.toLowerCase()); if (b) { e.preventDefault(); activeWin.menubar._openAt(b, true); }
    }
  }
  D.addEventListener('keydown', onGlobalKey);
  let swEl = null, swList = [], swIdx = 0;
  function switcherStep(dir) {
    if (!swEl) {
      swList = Array.from(wins.values()).filter(w => !w.o.dialog && w.visible && w.taskBtn).sort((a, b) => (+b.el.style.zIndex || 0) - (+a.el.style.zIndex || 0));
      if (swList.length < 2) { if (swList[0]) focusWin(swList[0], false); return; }
      swIdx = 0; closeMenus(false);
      swEl = h('div', { class: 'win raised dialog active', role: 'dialog', 'aria-label': 'Switch windows', style: { position: 'fixed', left: '50%', top: '38%', transform: 'translate(-50%,-50%)', zIndex: '99997', maxWidth: '94vw' } },
        h('div', { class: 'win-title' }, h('span', { class: 'wt-text', text: 'Switch windows' })), h('div', { class: 'sw-body' }, h('div', { class: 'sw-row' }), h('div', { class: 'sw-name', 'aria-live': 'polite' })));
      D.body.append(swEl);
    }
    swIdx = (swIdx + dir + swList.length) % swList.length;
    const row = $('.sw-row', swEl); row.replaceChildren(...swList.map((w, i) => h('img', { src: w.o.icon || IC('programs'), alt: '', class: 'sw-item' + (i === swIdx ? ' sel' : ''), width: 32, height: 32 })));
    $('.sw-name', swEl).textContent = swList[swIdx].title;
  }
  function closeSwitcher(commit) { if (!swEl) return; const w = swList[swIdx]; swEl.remove(); swEl = null; if (commit && w && !w.closed) focusWin(w, false); }
  function onGlobalKeyUp(e) {
    if (swEl && (e.key === 'Control' || e.key === 'Alt')) closeSwitcher(true);
    if (e.key === 'Meta' && metaAlone && !modalStack.length) { metaAlone = false; toggleStartMenu(true); }
  }
  D.addEventListener('keyup', onGlobalKeyUp);
  D.addEventListener('contextmenu', e => { if (!e.target.closest('input, textarea, iframe, .tos-scroll') && !e.target.closest('.win-body .lib-detail')) e.preventDefault(); });
  // Desktop-wide: stop text-selection drags and pinch zoom gestures from disturbing the shell
  D.addEventListener('gesturestart', e => e.preventDefault());

  /* =====================================================================
   *  VISITOR COUNTER
   * ===================================================================== */
  function countVisit() {
    try {
      let n = visitCount();
      if (store.sget(LEGACY.visitSession) !== '1') { n += 1; store.set(LEGACY.visits, String(n)); store.sset(LEGACY.visitSession, '1'); }
    } catch (e) {}
  }


  /* =====================================================================
   *  SCREEN SAVER (idle only; never while a game/arcade window is visible)
   * ===================================================================== */
  let saverEl = null, saverTimer = 0, lastInput = Date.now(), saverRaf = 0, saverGrace = 0;
  const noteInput = () => { lastInput = Date.now(); };
  ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev => D.addEventListener(ev, noteInput, { passive: true, capture: true }));
  function hookIdle(iframe) {
    try { const d = iframe.contentDocument; if (!d || d.__ghIdle) return; d.__ghIdle = true; ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev => d.addEventListener(ev, noteInput, { passive: true, capture: true })); d.addEventListener('keydown', onGlobalKey); d.addEventListener('keyup', onGlobalKeyUp); } catch (e) {}
  }
  function armSaver() {
    clearTimeout(saverTimer);
    if (settings.saver === 'none' || saverEl) return;
    const wait = Math.max(1, settings.saverMin) * 60000 - (Date.now() - lastInput);
    saverTimer = setTimeout(saverCheck, Math.max(1000, wait));
  }
  function saverCheck() {
    if (saverEl || settings.saver === 'none') return;
    if (Date.now() - lastInput < Math.max(1, settings.saverMin) * 60000) { armSaver(); return; }
    if (D.hidden || H.classList.contains('game-open') || nativeFullscreen.size || D.fullscreenElement || modalStack.length) { saverTimer = setTimeout(saverCheck, 15000); return; }
    startSaver(settings.saver);
  }
  function startSaver(kind) {
    if (saverEl || kind === 'none') return;
    closeMenus(false);
    const el = h('div', { id: 'saver', role: 'dialog', 'aria-label': 'Screen saver. Press any key or tap to return.', tabindex: '-1' });
    el.style.cssText = 'position:fixed;inset:0;z-index:2147482500;background:#000;overflow:hidden;cursor:none;touch-action:none';
    const still = !!settings.reducedMotion;
    if (still && (kind === 'pipes' || kind === 'mystify')) kind = 'logo';
    if (kind === 'pipes') { el._cleanup = runPipes(el); }
    else if (kind === 'mystify') { el._cleanup = runMystify(el); }
    else if (kind === 'starfield') {
      const cv = h('canvas', { 'aria-hidden': 'true' }); el.append(cv); const ctx = cv.getContext('2d'); let w = 0, hh = 0; const stars = [];
      const fit = () => { w = cv.width = innerWidth; hh = cv.height = innerHeight; }; fit(); window.addEventListener('resize', fit);
      for (let i = 0; i < 180; i++) stars.push({ x: (Math.random() - .5) * 2, y: (Math.random() - .5) * 2, z: Math.random() });
      let last = 0;
      const frame = t => {
        saverRaf = requestAnimationFrame(frame); if (t - last < 33) return; last = t;
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, hh);
        for (const s of stars) {
          if (!still) s.z -= 0.012; if (s.z <= 0.02) { s.x = (Math.random() - .5) * 2; s.y = (Math.random() - .5) * 2; s.z = 1; }
          const px = w / 2 + s.x / s.z * w * 0.25, py = hh / 2 + s.y / s.z * w * 0.25, r = Math.max(1, (1 - s.z) * 3), c = Math.floor(120 + 135 * (1 - s.z));
          ctx.fillStyle = 'rgb(' + c + ',' + c + ',' + c + ')'; ctx.fillRect(px, py, r, r);
        }
      };
      saverRaf = requestAnimationFrame(frame); el._cleanup = () => { cancelAnimationFrame(saverRaf); window.removeEventListener('resize', fit); };
    } else if (kind === 'logo') {
      el.append(h('div', { class: 'sv-x' + (still ? ' still' : ''), 'aria-hidden': 'true' }, h('div', { class: 'sv-y' }, h('img', { src: 'images/windows.png', alt: '', width: 96, height: 96 }))));
    } else if (kind === 'marquee') {
      el.append(h('div', { class: 'sv-marquee' + (still ? ' still' : ''), 'aria-hidden': 'true', text: settings.saverText || 'ColtonOS 95' }));
    }
    D.body.append(el); saverEl = el; el.focus();
    saverGrace = performance.now() + 500; let sx = null, sy = null;
    const wake = ev => {
      if (performance.now() < saverGrace) return;
      if (ev.type === 'pointermove') { if (sx === null) { sx = ev.clientX; sy = ev.clientY; return; } if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 10) return; }
      stopSaver();
    };
    el._wake = wake; ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev => window.addEventListener(ev, wake, true));
    announce('Screen saver started. Press any key or tap to return.');
  }

  /* ----- 3D Pipes (three.js r128 from the same cdnjs URL the games use) ----- */
  function loadThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (loadThree.p) return loadThree.p;
    loadThree.p = new Promise((res, rej) => {
      const sc = h('script', { src: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', async: true });
      sc.onload = () => (window.THREE ? res(window.THREE) : rej(new Error('three missing')));
      sc.onerror = () => { loadThree.p = null; sc.remove(); rej(new Error('three offline')); };
      D.head.append(sc);
    });
    return loadThree.p;
  }

  function runPipes(host) {
    const state = { dead: false, stop: null };
    loadThree().then(THREE => { if (!state.dead) state.stop = initPipes(THREE, host); }).catch(() => { if (!state.dead) state.stop = runMystify(host); });
    return () => { state.dead = true; if (state.stop) state.stop(); };
  }

  function initPipes(THREE, host) {
    const low = lowPowerActive(), N = 10, R = 0.15, BALL = 0.27, MAX_MESHES = low ? 360 : 700, FILL = 0.3;
    const count = clamp(settings.pipesCount | 0 || 3, 1, 5), speedMul = clamp(settings.pipesSpeed || 100, 40, 250) / 100, jointStyle = settings.pipesJoint || 'mixed';
    let W = innerWidth, Hh = innerHeight, raf = 0, alive = true, last = 0, angle = Math.random() * 6, resetAt = 0;
    const renderer = new THREE.WebGLRenderer({ antialias: !low, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, low ? 1 : 1.5)); renderer.setSize(W, Hh); renderer.setClearColor(0x000000, 1);
    const cv = renderer.domElement; cv.setAttribute('aria-hidden', 'true'); cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block'; host.append(cv);
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(60, W / Hh, 0.1, 200);
    scene.add(new THREE.AmbientLight(0x505060, 1)); const dir = new THREE.DirectionalLight(0xffffff, 0.9); dir.position.set(6, 10, 8); scene.add(dir);
    const pl = new THREE.PointLight(0xffffff, 0.8, 0); scene.add(pl);
    const seg = low ? 8 : 14, cylGeo = new THREE.CylinderGeometry(R, R, 1, seg, 1, false), ballGeo = new THREE.SphereGeometry(BALL, seg + 4, seg), elbowGeo = new THREE.SphereGeometry(R * 1.02, seg, Math.max(6, seg - 4));
    const mats = [], mk = () => new THREE.MeshPhongMaterial({ color: new THREE.Color().setHSL(Math.random(), 0.9, 0.52), shininess: 95, specular: 0x777777 });
    for (let i = 0; i < 14; i++) mats.push(mk());
    const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], UP = new THREE.Vector3(0, 1, 0), off = (N - 1) / 2;
    const occ = new Uint8Array(N * N * N), idx = (x, y, z) => x + N * (y + N * z), inb = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < N && y < N && z < N;
    const free = (x, y, z) => inb(x, y, z) && !occ[idx(x, y, z)];
    const meshes = []; let used = 0;
    const world = c => new THREE.Vector3(c[0] - off, c[1] - off, c[2] - off);
    const add = m => { scene.add(m); meshes.push(m); return m; };
    const joint = (c, mat, kind) => { const ball = kind === 'ball' || (kind === 'mixed' && Math.random() < 0.45); const m = add(new THREE.Mesh(ball ? ballGeo : elbowGeo, mat)); m.position.copy(world(c)); };
    let pipes = [];
    function spawn() {
      for (let tries = 0; tries < 40; tries++) {
        const c = [Math.random() * N | 0, Math.random() * N | 0, Math.random() * N | 0];
        if (!free(c[0], c[1], c[2])) continue;
        const ds = DIRS.map((d, i) => i).filter(i => free(c[0] + DIRS[i][0], c[1] + DIRS[i][1], c[2] + DIRS[i][2]));
        if (!ds.length) continue;
        const p = { c, d: ds[Math.random() * ds.length | 0], mat: mats[Math.random() * mats.length | 0], mesh: null, t: 0, wait: 0 };
        occ[idx(c[0], c[1], c[2])] = 1; used++; joint(c, p.mat, 'ball'); startSeg(p); return p;
      }
      return null;
    }
    function startSeg(p) {
      const d = DIRS[p.d], m = new THREE.Mesh(cylGeo, p.mat); m.quaternion.setFromUnitVectors(UP, new THREE.Vector3(d[0], d[1], d[2])); m.scale.y = 0.001; m.position.copy(world(p.c)); add(m); p.mesh = m; p.t = 0;
    }
    for (let i = 0; i < count; i++) { const p = spawn(); if (p) pipes.push(p); }
    function step(p, dt) {
      if (p.wait > 0) { p.wait -= dt; return; }
      p.t += dt * 2.4 * speedMul;
      const pr = Math.min(p.t, 1), d = DIRS[p.d], w = world(p.c);
      p.mesh.scale.y = Math.max(pr, 0.001); p.mesh.position.set(w.x + d[0] * pr / 2, w.y + d[1] * pr / 2, w.z + d[2] * pr / 2);
      if (p.t < 1) return;
      p.c = [p.c[0] + d[0], p.c[1] + d[1], p.c[2] + d[2]]; occ[idx(p.c[0], p.c[1], p.c[2])] = 1; used++;
      const opts = []; for (let i = 0; i < 6; i++) if (free(p.c[0] + DIRS[i][0], p.c[1] + DIRS[i][1], p.c[2] + DIRS[i][2])) opts.push(i);
      if (!opts.length) { joint(p.c, p.mat, 'ball'); p.dead = true; return; }
      const others = opts.filter(i => i !== p.d);
      const nd = (opts.includes(p.d) && (Math.random() > 0.38 || !others.length)) ? p.d : others[Math.random() * others.length | 0];
      if (nd !== p.d) joint(p.c, p.mat, jointStyle);
      p.d = nd; startSeg(p);
    }
    function reset() { meshes.forEach(m => scene.remove(m)); meshes.length = 0; occ.fill(0); used = 0; pipes = []; mats.forEach((m, i) => { m.color.setHSL(Math.random(), 0.9, 0.52); }); for (let i = 0; i < count; i++) { const p = spawn(); if (p) pipes.push(p); } resetAt = 0; }
    const onResize = () => { W = innerWidth; Hh = innerHeight; renderer.setSize(W, Hh); cam.aspect = W / Hh; cam.updateProjectionMatrix(); };
    window.addEventListener('resize', onResize);
    const frame = t => {
      if (!alive) return; raf = requestAnimationFrame(frame);
      if (low && t - last < 33) return; const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
      angle += dt * 0.09; const r = 13.5;
      cam.position.set(Math.cos(angle) * r, Math.sin(angle * 0.63) * 4.5, Math.sin(angle) * r); cam.lookAt(0, 0, 0); pl.position.copy(cam.position);
      if (!resetAt) {
        pipes.forEach(p => step(p, dt));
        pipes = pipes.filter(p => !p.dead).concat([]);
        while (pipes.length < count && used < N * N * N * FILL) { const p = spawn(); if (!p) break; pipes.push(p); }
        if (used > N * N * N * FILL || meshes.length > MAX_MESHES || (!pipes.length)) resetAt = t + 1800;
      } else if (t > resetAt) reset();
      renderer.render(scene, cam);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      alive = false; cancelAnimationFrame(raf); window.removeEventListener('resize', onResize);
      try { meshes.forEach(m => scene.remove(m)); cylGeo.dispose(); ballGeo.dispose(); elbowGeo.dispose(); mats.forEach(m => m.dispose()); renderer.dispose(); if (renderer.forceContextLoss) renderer.forceContextLoss(); } catch (e) {}
      cv.remove();
    };
  }

  /* ----- Mystify (classic bouncing polygons; also the offline fallback for Pipes) ----- */
  function runMystify(host) {
    const cv = h('canvas', { 'aria-hidden': 'true' }); host.append(cv); const ctx = cv.getContext('2d'); let w = 0, hh = 0, raf = 0, alive = true, last = 0, hue = Math.random() * 360;
    const fit = () => { w = cv.width = innerWidth; hh = cv.height = innerHeight; }; fit(); window.addEventListener('resize', fit);
    const mkPoly = () => Array.from({ length: 4 }, () => ({ x: Math.random() * w, y: Math.random() * hh, vx: (Math.random() < .5 ? -1 : 1) * (2 + Math.random() * 3), vy: (Math.random() < .5 ? -1 : 1) * (2 + Math.random() * 3) }));
    const polys = [mkPoly(), mkPoly()], hist = [[], []], TR = 12;
    const frame = t => {
      if (!alive) return; raf = requestAnimationFrame(frame); if (t - last < 33) return; last = t; hue = (hue + 0.6) % 360;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, hh);
      polys.forEach((pts, k) => {
        pts.forEach(p => { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > w) { p.vx *= -1; p.x = clamp(p.x, 0, w); } if (p.y < 0 || p.y > hh) { p.vy *= -1; p.y = clamp(p.y, 0, hh); } });
        hist[k].unshift(pts.map(p => [p.x, p.y])); if (hist[k].length > TR) hist[k].pop();
        hist[k].forEach((poly, i) => { ctx.strokeStyle = 'hsla(' + ((hue + k * 140 + i * 6) % 360) + ',90%,60%,' + (1 - i / TR) + ')'; ctx.lineWidth = 2; ctx.beginPath(); poly.forEach((q, j) => (j ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath(); ctx.stroke(); });
      });
    };
    raf = requestAnimationFrame(frame);
    return () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener('resize', fit); cv.remove(); };
  }

  function stopSaver() {
    if (!saverEl) return; const el = saverEl; saverEl = null;
    ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev => window.removeEventListener(ev, el._wake, true));
    if (el._cleanup) el._cleanup(); el.remove(); lastInput = Date.now(); armSaver(); announce('Screen saver stopped');
    const ic = icons.get(focusIcon); if (activeWin) focusWin(activeWin, false);
  }
  D.addEventListener('visibilitychange', () => { if (!D.hidden) { armSaver(); } });

  /* =====================================================================
   *  PUBLIC API for applets (Control Panel etc.)
   * ===================================================================== */
  const GH = window.GHShell = {
    pendingPage: 'home', version: SITE.version || '',
    getSettings: () => Object.assign({}, settings), defaults: Object.assign({}, DEFAULTS), schemes: Object.assign({}, SCHEMES),
    set: (k, v) => setSetting(k, v), setMany: o => { Object.keys(o).forEach(k => { if (k in DEFAULTS) settings[k] = o[k]; }); saveSettings(); applySettings(); layoutIcons(false); notifyFrames(); },
    resetSettings: () => { settings = Object.assign({}, DEFAULTS); saveSettings(); applySettings(); layoutIcons(false); notifyFrames(); },
    lowPowerAuto: devicePrefersLowPower, lowPowerActive,
    openItem: id => openItem(id), openControl, openFind, openHelp, openRun, openShutdown, showAbout, showSystemProperties, msgBox, toast,
    saveLayout: () => { saveLayout(); toast('Window layout saved for this session.'); }, restoreLayout: () => toast(restoreLayout() ? 'Window layout restored.' : 'No saved layout in this session.'),
    resetLayout: () => { resetLayout(); toast('Window sizes and positions reset.'); },
    resetIcons: () => { resetIcons(); toast('Desktop icons restored to their defaults.'); },
    arrangeIcons, clearFavorites: () => { store.setJson(LEGACY.favorites, []); favChanged(); toast('Favorites cleared.'); }, clearRecents: () => { store.setJson(LEGACY.recents, []); toast('Recent projects cleared.'); },
    favoritesCount: () => favorites().length, recentsCount: () => recents().length, trashCount: () => trashState().items.length + trashState().purged.length,
    install: async () => { if (!installPrompt) { toast('Your browser is not offering app installation right now.'); return false; } installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; return true; },
    exportTheme: () => ({ format: 'games-hub-theme-pack', version: 2, settings: Object.assign({}, settings) }),
    importTheme: pack => {
      if (!pack || pack.format !== 'games-hub-theme-pack') return false;
      if (pack.version === 2 && pack.settings) { const s = {}; Object.keys(DEFAULTS).forEach(k => { if (k in pack.settings && typeof pack.settings[k] === typeof DEFAULTS[k]) s[k] = pack.settings[k]; }); if (!SCHEMES[s.scheme || 'standard']) return false; GH.setMany(s); return true; }
      const th = OLD_THEME_MAP[pack.theme] || (SCHEMES[pack.theme] ? pack.theme : null); if (!th) return false;
      GH.setMany({ scheme: th, reducedMotion: !!pack.reducedMotion, compact: !!pack.compactMode, highContrast: !!pack.highContrast, lowPower: !!pack.lowPower, crt: pack.crt === false ? 'off' : 'standard' }); return true;
    },
    playSound, previewSaver: k => { if (saverEl) return; startSaver(k || settings.saver === 'none' ? (k || 'logo') : settings.saver); }, arrangeWindows, minimizeAll,
    catalog: () => ({ games: PROJECTS.map(p => ({ title: p.title, url: p.url })), classics: CLASSICS.map(c => ({ title: c.title, url: c.url })), applets: APPLETS.map(a => ({ title: a.title, url: a.src })) }),
    launchByUrl: url => { const id = ITEMS.has('game:' + url) ? 'game:' + url : (APPLETS.find(a => a.src === url) ? 'app:' + APPLETS.find(a => a.src === url).id : null); if (id) openItem(id); return !!id; },
    hooks: HOOKS, rebuildIcons: () => { buildIcons(); }, refreshViews: () => refreshTrashViews(),
    dumpState: () => ({ windows: Array.from(wins.keys()), active: activeWin && activeWin.id })
  };

  /* =====================================================================
   *  INIT
   * ===================================================================== */
  GH.internals = { h, $, $$, store, createWindow, showWin, openDialog, msgBox, toast, ITEMS, addItem, FOLDERS, wins, openExplorer, openItem, showContextMenu, closeMenus, playSound, announce, IC, itemIcon, frameWindow, startRename, setIconSelection, buildIcons, settings: () => settings, reducedMotion, APPS, APPLETS, PROJECTS, CLASSICS, clamp };
  const origRefresh = refreshState;
  applyHooks.push(syncChatVisibility);
  function init() {
    countVisit();
    applySettings();
    buildQuickLaunch();
    buildIcons();
    tickClock(); paintNet(); setChatDot(false);
    // chat lives in a hidden window so it keeps receiving pings while "closed"
    const chat = ITEMS.get('app:chat').app; const cw = frameWindow(chat); cw.opener = null; cw.noTaskDefault = true;
    onResize();
    D.fonts && D.fonts.ready && D.fonts.ready.then(() => { layoutIcons(false); });
    // service-worker friendly: update low-power status when connection changes
    if (navigator.connection && navigator.connection.addEventListener) navigator.connection.addEventListener('change', applySettings);
    window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').addEventListener && matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => { if (e.matches && !store.get(KEYS.settings)) setSetting('reducedMotion', true); });
    // after boot + Terms: show Welcome once per session
    setupToS(() => {
      if (settings.welcome && store.sget(KEYS.welcomeShown) !== '1') { store.sset(KEYS.welcomeShown, '1'); openWelcome(); }
      else { const f = icons.get(focusIcon); }
    });
    store.set('gh-dirty', '1');
    track('desktop_ready', { event_category: 'System' });
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', init); else init();
})();
