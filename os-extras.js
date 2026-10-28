/* os-extras.js — ColtonOS shell extensions (loaded after main.js).
 *  - Virtual file system: My Documents, desktop files/folders, right-click New, drag into folders
 *  - Network Neighborhood (people in the chatroom appear as computers)
 *  - Custom tiled wallpaper (downscaled to a preset, stored in IndexedDB)
 *  - Desktop themes, theater sounds (HDD seek, modem), busy cursor, copy dialog, crash dialog
 *  - Shutdown / restart sequence with CRT power-off, and "Restart in MS-DOS mode"
 * Everything talks to main.js through window.GHShell.internals / GHShell.hooks. */
(function () {
  'use strict';
  const GH = window.GHShell, FS = window.ColtonFS;
  if (!GH || !GH.internals || !FS) return;
  const I = GH.internals, HOOKS = GH.hooks;
  const { h, $, $$, ITEMS, FOLDERS, wins, IC, store } = I;
  const D = document, H = D.documentElement;
  const S = () => I.settings();
  const slug = u => String(u).replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const rm = () => I.reducedMotion();

  /* ===================== virtual file system -> items ===================== */
  const KIND = { folder: 'File Folder', text: 'Text Document', image: 'Bitmap Image' };
  const fsIcon = m => m.kind === 'folder' ? IC('folder') : m.kind === 'image' ? 'images/icons/paint.png' : IC('document');
  const sizeText = n => n < 1024 ? n + ' bytes' : (n / 1024).toFixed(1) + ' KB';
  const appById = id => I.APPS.find(a => a.id === id);

  function openFileIn(appId, m) {
    const a = appById(appId); if (!a) return;
    const id = 'vfsapp-' + m.id; if (wins.has(id)) { I.showWin(wins.get(id)); return; }
    const W = I.createWindow({ id, title: m.name + ' - ' + a.title, icon: a.icon, kind: 'window', width: a.w || 600, height: a.h || 460, frame: { src: a.src + (a.src.includes('?') ? '&' : '?') + 'open=' + encodeURIComponent(m.id) }, minWidth: 260, minHeight: 160 });
    I.showWin(W);
  }
  function syncItems() {
    const all = FS.all(), live = new Set(all.map(m => 'vfs:' + m.id));
    Array.from(ITEMS.keys()).forEach(k => { if (k.startsWith('vfs:') && !live.has(k)) { ITEMS.delete(k); delete FOLDERS[k]; } });
    all.forEach(m => {
      const id = 'vfs:' + m.id, folder = m.kind === 'folder';
      const it = { id, title: m.name, type: KIND[m.kind] || 'File', icon: fsIcon(m), desc: folder ? 'Folder' : sizeText(m.size || 0), keywords: m.name + ' ' + (KIND[m.kind] || ''), vfs: m, vfsFolder: folder,
        open: o => folder ? I.openExplorer(id, o) : openFileIn(m.kind === 'image' ? 'paint' : 'notepad', FS.meta(m.id) || m) };
      ITEMS.set(id, it);
      if (folder) FOLDERS[id] = { title: m.name, icon: IC('folder'), path: FS.pathOf(m.id), parent: m.parent === 'docs' ? 'documents' : m.parent === 'desktop' ? 'drive-c' : 'vfs:' + m.parent, items: () => FS.children(m.id).map(c => 'vfs:' + c.id) };
    });
  }
  HOOKS.desktopIds = () => FS.children('desktop').map(m => 'vfs:' + m.id);
  HOOKS.children = key => key === 'net' ? netIds() : FS.children(key).map(m => 'vfs:' + m.id);
  HOOKS.vfsParent = fid => fid === 'documents' ? 'docs' : (typeof fid === 'string' && fid.startsWith('vfs:') ? fid.slice(4) : null);

  function askText(title, label, value) {
    return new Promise(res => {
      const inp = h('input', { type: 'text', class: 'field', value: value || '', style: { width: '100%' }, maxlength: '60', 'aria-label': label });
      let val = null;
      const W = I.openDialog({ title, icon: IC('question'), width: 340, content: h('div', { class: 'dialog-pad' }, h('div', { text: label, style: { marginBottom: '6px' } }), inp), focus: () => { setTimeout(() => inp.select(), 0); return inp; },
        buttons: [{ label: 'OK', value: 'ok', default: true, onClick: () => { val = inp.value; } }, { label: 'Cancel', value: 'cancel' }] });
      W.result.then(r => res(r === 'ok' && val && val.trim() ? val.trim() : null));
    });
  }
  const blankPng = () => new Promise(res => { const c = D.createElement('canvas'); c.width = 320; c.height = 240; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 320, 240); c.toBlob(res, 'image/png'); });
  function newNode(parent, kind) {
    const mk = kind === 'folder' ? FS.create({ parent, name: 'New Folder', kind }) : kind === 'text' ? FS.create({ parent, name: 'New Text Document.txt', kind, data: '' }) : blankPng().then(b => FS.create({ parent, name: 'New Bitmap Image.png', kind, data: b }));
    mk.then(m => { if (parent === 'desktop') setTimeout(() => { const id = 'vfs:' + m.id; I.setIconSelection(new Set([id]), id); I.startRename(id); }, 60); });
  }
  HOOKS.newMenu = parent => [{ label: '&Folder', icon: IC('folder'), onClick: () => newNode(parent, 'folder') }, { sep: true }, { label: '&Text Document', icon: IC('document'), onClick: () => newNode(parent, 'text') }, { label: '&Bitmap Image', icon: 'images/icons/paint.png', onClick: () => newNode(parent, 'image') }];
  HOOKS.renameVfs = (it, name) => {
    const go = n => { if (n) FS.rename(it.vfs.id, n); };
    if (name) go(name); else askText('Rename', 'New name for ' + it.title + ':', it.title).then(go);
  };
  HOOKS.deleteVfs = ids => {
    const names = ids.length === 1 ? '\'' + ITEMS.get(ids[0]).title + '\'' : 'these ' + ids.length + ' items';
    I.msgBox('Are you sure you want to delete ' + names + '?\n\nThis cannot be undone.', { title: 'Confirm File Delete', icon: 'question', buttons: ['Yes', 'No'], def: 1, cancel: 'no' }).then(r => { if (r === 'yes') ids.forEach(i => ITEMS.get(i) && FS.remove(ITEMS.get(i).vfs.id)); });
  };
  HOOKS.dropOnto = (tgt, ids) => {
    const t = ITEMS.get(tgt); let parent = null;
    if (t && t.vfsFolder) parent = t.vfs.id; else if (tgt === 'folder:documents') parent = 'docs';
    if (!parent) return false;
    const mv = ids.map(i => ITEMS.get(i)).filter(it => it && it.vfs && it.vfs.id !== parent);
    if (!mv.length) return false;
    mv.forEach(it => FS.move(it.vfs.id, parent)); I.toast(mv.length + ' item(s) moved to ' + (t && t.title || 'My Documents') + '.');
    return true;
  };
  let fsTimer = 0;
  FS.onChange(() => { clearTimeout(fsTimer); fsTimer = setTimeout(() => { syncItems(); GH.rebuildIcons(); GH.refreshViews(); }, 30); });
  FS.ready().then(() => { syncItems(); GH.rebuildIcons(); GH.refreshViews(); });

  /* ===================== Network Neighborhood ===================== */
  let netUsers = [];
  function netIds() { return ['net:self'].concat(netUsers.map(u => 'net:' + u)); }
  ITEMS.set('net:self', { id: 'net:self', title: 'COLTONOS (this computer)', type: 'Computer', icon: IC('my-computer'), desc: 'You', keywords: 'this computer', open: o => I.openExplorer('my-computer', o) });
  HOOKS.presence = users => {
    const key = users.join('|'); if (key === netUsers.join('|')) return;
    netUsers.forEach(u => ITEMS.delete('net:' + u)); netUsers = users;
    users.forEach(u => ITEMS.set('net:' + u, { id: 'net:' + u, title: u, type: 'Computer', icon: IC('network'), desc: 'Online in the chatroom', keywords: u + ' computer network chat', open: () => I.openItem('app:chat') }));
    GH.refreshViews();
  };

  /* ===================== custom tiled wallpaper ===================== */
  function kv() {
    return new Promise((res, rej) => { const r = indexedDB.open('ColtonOS-wallpaper', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  }
  const kvGet = k => kv().then(d => new Promise((res, rej) => { const q = d.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => { d.close(); res(q.result); }; q.onerror = () => rej(q.error); }));
  const kvPut = (k, v) => kv().then(d => new Promise((res, rej) => { const tx = d.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = () => { d.close(); res(); }; tx.onerror = () => rej(tx.error); }));
  let wpUrl = '';
  function showWallpaper(blob) {
    if (wpUrl) URL.revokeObjectURL(wpUrl);
    wpUrl = blob ? URL.createObjectURL(blob) : '';
    blob ? H.style.setProperty('--wp-custom-url', 'url("' + wpUrl + '")') : H.style.removeProperty('--wp-custom-url');
  }
  function scaleBlob(source, longest) {
    return new Promise((res, rej) => {
      createImageBitmap(source).then(bmp => {
        const k = Math.min(1, longest / Math.max(bmp.width, bmp.height));
        const w = Math.max(1, Math.round(bmp.width * k)), hh = Math.max(1, Math.round(bmp.height * k));
        const c = D.createElement('canvas'); c.width = w; c.height = hh; const x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(bmp, 0, 0, w, hh);
        c.toBlob(b => b ? res(b) : rej(new Error('Could not encode image')), 'image/png');
      }).catch(rej);
    });
  }
  GH.setCustomWallpaper = (file, px, smooth) =>
    scaleBlob(file, 512).then(src => kvPut('source', src).then(() => scaleBlob(src, px)).then(b => kvPut('tile', b).then(() => { showWallpaper(b); GH.setMany({ wallpaper: 'custom', wpTilePx: px, wpSmooth: !!smooth }); return true; })));
  GH.rescaleWallpaper = px => kvGet('source').then(src => { if (!src) return false; return scaleBlob(src, px).then(b => kvPut('tile', b).then(() => { showWallpaper(b); GH.setMany({ wpTilePx: px }); return true; })); });
  GH.hasCustomWallpaper = () => kvGet('tile').then(t => !!t).catch(() => false);
  GH.customWallpaperUrl = () => wpUrl;
  kvGet('tile').then(b => { if (b) showWallpaper(b); }).catch(() => {});

  /* ===================== themes ===================== */
  const THEMES = {
    'ColtonOS Default': { scheme: 'standard', desktopColor: '#008080', wallpaper: 'logo', crt: 'standard', titleGradient: false, uiSounds: false, saver: 'pipes' },
    'Pumpkin Spice': { scheme: 'pumpkin', desktopColor: '#3a1c00', wallpaper: 'logo', crt: 'light', titleGradient: true, uiSounds: true, saver: 'starfield' },
    'Deep Space': { scheme: 'slate', desktopColor: '#00001c', wallpaper: 'none', crt: 'standard', titleGradient: true, uiSounds: true, saver: 'starfield' },
    'Rose Garden': { scheme: 'rose', desktopColor: '#c08096', wallpaper: 'logo', crt: 'off', titleGradient: false, uiSounds: false, saver: 'mystify' },
    'Forest': { scheme: 'spruce', desktopColor: '#00300f', wallpaper: 'logo', crt: 'light', titleGradient: true, uiSounds: false, saver: 'pipes' },
    'Rainy Day': { scheme: 'rainyday', desktopColor: '#2c3c4c', wallpaper: 'none', crt: 'standard', titleGradient: false, uiSounds: false, saver: 'mystify' },
    'Amber Terminal': { scheme: 'pumpkin', desktopColor: '#000000', wallpaper: 'none', crt: 'heavy', titleGradient: false, uiSounds: true, saver: 'marquee', labelShadow: false },
    'Hot Dog Stand': { scheme: 'hotdog', desktopColor: '#ff0000', wallpaper: 'none', crt: 'off', titleGradient: false, uiSounds: true, saver: 'logo' },
    'Wheat Field': { scheme: 'wheat', desktopColor: '#7a6a3a', wallpaper: 'logo', crt: 'light', titleGradient: true, uiSounds: false, saver: 'logo' }
  };
  GH.themes = () => Object.keys(THEMES);
  GH.applyTheme = name => { const t = THEMES[name]; if (!t) return false; GH.setMany(Object.assign({}, t, { selColor: '', titleColor: '', themeName: name })); I.toast('Theme applied: ' + name); return true; };

  /* ===================== synthesized theater sounds ===================== */
  let actx = null, master = null;
  function ctx() {
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); return actx; } catch (e) { return null; }
  }
  function noiseBuf(c) { const b = c.createBuffer(1, c.sampleRate, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
  const vol = () => Math.max(0, Math.min(100, S().uiVolume)) / 100;
  function bus(c, gain) { master = c.createGain(); master.gain.value = gain; master.connect(c.destination); return master; }
  function fxStop() { if (master && actx) { try { master.gain.setTargetAtTime(0, actx.currentTime, 0.04); } catch (e) {} } }
  function hddSound() {
    if (!S().theaterSounds) return 0; const c = ctx(); if (!c) return 0;
    const out = bus(c, vol() * 0.35), t0 = c.currentTime, nb = noiseBuf(c); let t = 0.02;
    for (let i = 0; i < 26; i++) {
      const src = c.createBufferSource(); src.buffer = nb; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 500 + Math.random() * 2600; bp.Q.value = 2 + Math.random() * 4;
      const g = c.createGain(); const len = 0.015 + Math.random() * 0.05; g.gain.setValueAtTime(0.0001, t0 + t); g.gain.exponentialRampToValueAtTime(0.9, t0 + t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t0 + t + len);
      src.connect(bp); bp.connect(g); g.connect(out); src.start(t0 + t, Math.random() * 0.5, len + 0.02);
      if (i % 5 === 0) { const o = c.createOscillator(), og = c.createGain(); o.type = 'square'; o.frequency.value = 55 + Math.random() * 40; og.gain.setValueAtTime(0.0001, t0 + t); og.gain.exponentialRampToValueAtTime(0.35, t0 + t + 0.005); og.gain.exponentialRampToValueAtTime(0.0001, t0 + t + 0.06); o.connect(og); og.connect(out); o.start(t0 + t); o.stop(t0 + t + 0.08); }
      t += 0.02 + Math.random() * 0.075;
    }
    return t;
  }
  function modemSound() {
    if (!S().theaterSounds) return 0; const c = ctx(); if (!c) return 0;
    const out = bus(c, vol() * 0.16), t0 = c.currentTime;
    const tone = (f1, f2, at, dur, type) => { const o = c.createOscillator(), g = c.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f1, t0 + at); if (f2) o.frequency.linearRampToValueAtTime(f2, t0 + at + dur); g.gain.setValueAtTime(0.0001, t0 + at); g.gain.linearRampToValueAtTime(1, t0 + at + 0.01); g.gain.setValueAtTime(1, t0 + at + dur - 0.01); g.gain.linearRampToValueAtTime(0.0001, t0 + at + dur); o.connect(g); g.connect(out); o.start(t0 + at); o.stop(t0 + at + dur + 0.02); };
    const rows = [697, 770, 852, 941], cols = [1209, 1336, 1477]; let t = 0.2;
    for (let i = 0; i < 8; i++) { const r = rows[(Math.random() * 4) | 0], k = cols[(Math.random() * 3) | 0]; tone(r, 0, t, 0.07); tone(k, 0, t, 0.07); t += 0.12; }
    t += 0.5; tone(2100, 0, t, 0.5); tone(1100, 0, t + 0.55, 0.12); tone(2100, 0, t + 0.7, 0.2); t += 1.0;
    const nb = noiseBuf(c);
    for (let i = 0; i < 16; i++) { const f = 900 + Math.random() * 1800; tone(f, f + (Math.random() - .5) * 1600, t, 0.09 + Math.random() * 0.12, i % 3 ? 'sine' : 'sawtooth'); const src = c.createBufferSource(); src.buffer = nb; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 1; const g = c.createGain(); g.gain.value = 0.5; src.connect(bp); bp.connect(g); g.connect(out); src.start(t0 + t, 0, 0.18); t += 0.1 + Math.random() * 0.08; }
    tone(1650, 0, t, 0.3); t += 0.35;
    return t;
  }
  function tick() { if (!S().uiSounds) return; const c = ctx(); if (!c) return; const o = c.createOscillator(), g = c.createGain(); o.type = 'square'; o.frequency.value = 1400; const v = vol() * 0.04; g.gain.setValueAtTime(v, c.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.025); o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + 0.03); }
  D.addEventListener('pointerdown', e => { if (e.target.closest && e.target.closest('.mi, .btn, .tb-btn, .start-btn')) tick(); }, true);
  GH.fx = { hdd: hddSound, modem: modemSound, tick };

  /* ===================== busy state + copy / dial dialogs ===================== */
  let busyN = 0;
  function busy(on) { busyN = Math.max(0, busyN + (on ? 1 : -1)); H.classList.toggle('busy', busyN > 0 && !!S().busyCursor); }
  let launching = false;
  function progressDialog(title, icon, lines, ms, onDone, abort) {
    const bar = h('i'), txt = h('div', { class: 'msg', style: { whiteSpace: 'pre-line' }, text: lines[0] });
    const body = h('div', { class: 'dialog-pad', style: { minWidth: '300px' } }, h('div', { class: 'row', style: { alignItems: 'center', gap: '10px' } }, h('img', { src: icon, alt: '', width: 32, height: 32 }), txt), h('div', { class: 'copy-bar' }, bar));
    const W = I.openDialog({ title, icon, content: body, width: 360, buttons: [{ label: 'Cancel', value: 'cancel' }], cancelValue: 'cancel' });
    busy(true);
    const t0 = performance.now(); let dead = false;
    W.result.then(r => { if (r === 'cancel' && !dead) { dead = true; busy(false); launching = false; fxStop(); abort && abort(); } });
    (function step() {
      if (dead) return;
      const f = Math.min(1, (performance.now() - t0) / ms); bar.style.width = Math.round(f * 100) + '%';
      txt.textContent = lines[Math.min(lines.length - 1, Math.floor(f * lines.length))];
      if (f < 1) setTimeout(step, 40); else { dead = true; busy(false); launching = false; W.finish('done'); onDone(); }
    })();
  }
  HOOKS.beforeOpen = (it, go) => {
    if (launching) return true;
    const s = S();
    if (it.id.startsWith('game:') && !wins.has('game-win-' + slug(it.id.slice(5))) && (s.copyDialog || s.theaterSounds)) {
      launching = true;
      const ms = rm() ? 350 : 900 + Math.random() * 700; const secs = hddSound();
      if (!s.copyDialog) { busy(true); setTimeout(() => { busy(false); launching = false; go(); }, Math.min(900, (secs || 0.6) * 1000)); return true; }
      progressDialog('Copying Files…', IC('floppy'), ['Reading ' + it.title + '…', 'Copying ' + it.title + ' to memory…', 'Starting ' + it.title + '…'], ms, go);
      return true;
    }
    const first = it.id === 'app:chat' && store.sget('gh-modem-chat') !== '1';
    if ((it.id === 'app:browser' && !wins.has('app-browser')) || first) {
      if (!s.theaterSounds && !s.copyDialog) return false;
      if (first) store.sset('gh-modem-chat', '1');
      launching = true;
      const secs = modemSound(); const ms = rm() ? 400 : Math.max(2500, (secs || 3.2) * 1000);
      progressDialog('Dial-Up Networking', IC('network'), ['Dialing ColtonNet…', 'Verifying user name and password…', 'Connected at 28800 bps'], ms, go);
      return true;
    }
    return false;
  };

  /* ===================== crash dialog ("illegal operation") ===================== */
  const crashed = new Set();
  D.addEventListener('load', e => {
    const fr = e.target; if (!fr || fr.tagName !== 'IFRAME') return;
    const win = fr.closest && fr.closest('.win'); if (!win || !win.id.startsWith('game-win-')) return;
    try {
      fr.contentWindow.addEventListener('error', ev => {
        if (!S().crashDialogs || crashed.has(win.id)) return;
        const msg = String(ev.message || '');
        if (!msg || /^Script error\.?$/i.test(msg) || /ResizeObserver/i.test(msg)) return;
        crashed.add(win.id);
        const W = wins.get(win.id); if (!W) return;
        const hex = () => Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
        const det = h('textarea', { readonly: true, class: 'field', rows: '5', style: { width: '100%', marginTop: '8px', display: 'none', fontFamily: 'monospace' } });
        det.value = msg + '\n' + (ev.filename ? ev.filename.split('/').pop() : '') + (ev.lineno ? ':' + ev.lineno + ':' + ev.colno : '') + '\n\nMODULE: ' + (W.title || 'GAME') + '\nFAULT: 0167:' + hex() + hex();
        const body = h('div', { class: 'dialog-body', style: { flexDirection: 'column', alignItems: 'stretch' } },
          h('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start' } }, h('img', { class: 'di', src: IC('error'), alt: '', width: 32, height: 32 }), h('div', { class: 'msg', style: { whiteSpace: 'pre-line' }, text: (W.title || 'This program') + ' has performed an illegal operation and will be shut down.\n\nIf the problem persists, contact the program vendor.' })), det);
        I.openDialog({ title: W.title || 'Program Error', icon: IC('error'), content: body, width: 380, buttons: [
          { label: 'Close', value: 'close', default: true, onClick: () => { setTimeout(() => { try { W.close(true); } catch (x) {} crashed.delete(win.id); }, 0); } },
          { label: 'Details >>', value: 'details', onClick: () => { det.style.display = det.style.display === 'none' ? 'block' : 'none'; return false; } },
          { label: 'Ignore', value: 'ignore' }] });
      });
    } catch (x) { /* cross-origin frame */ }
  }, true);
  I.wins && wins.forEach && void 0;

  /* ===================== shutdown / restart / MS-DOS mode ===================== */
  const restart = () => { try { sessionStorage.removeItem('gh-boot-done'); } catch (e) {} location.href = location.pathname + '?restart=' + Date.now(); };
  HOOKS.shutdown = mode => {
    const quick = rm();
    const sc = h('div', { id: 'shutdown-screen', role: 'alertdialog', 'aria-label': 'Shutting down', tabindex: '0', style: { position: 'fixed', inset: '0', zIndex: '2147482000', background: '#008080', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: '22px', padding: '20px', cursor: 'default' } },
      mode === 'dos' ? 'ColtonOS is restarting in MS-DOS mode…' : mode === 'restart' ? 'ColtonOS is restarting…' : 'ColtonOS is shutting down…');
    D.body.append(sc); I.closeMenus(false); fxStop(); hddSound();
    wins.forEach(w => { try { if (w.iframe) w.iframe.src = 'about:blank'; } catch (e) {} });
    const underlay = h('div', { style: { position: 'fixed', inset: '0', zIndex: '2147481999', background: '#000' } });
    const collapse = cb => {
      if (quick) { cb(); return; }
      D.body.append(underlay); sc.classList.add('crt-collapsing');
      setTimeout(() => {
        sc.remove(); const dot = h('div', { style: { position: 'fixed', left: '50%', top: '50%', width: '5px', height: '5px', margin: '-2px 0 0 -2px', borderRadius: '50%', background: '#fff', boxShadow: '0 0 14px 6px rgba(190,255,230,.8)', zIndex: '2147482001', transition: 'opacity 1.1s ease-out, transform 1.1s ease-out' } });
        D.body.append(dot); requestAnimationFrame(() => requestAnimationFrame(() => { dot.style.opacity = '0'; dot.style.transform = 'scale(.2)'; }));
        setTimeout(() => { dot.remove(); cb(); }, 1200);
      }, 880);
    };
    const powerScreen = () => {
      underlay.style.background = '#000'; if (!underlay.isConnected) D.body.append(underlay);
      const msg = h('div', { tabindex: '0', style: { position: 'fixed', inset: '0', zIndex: '2147482002', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '40px', color: '#444', fontSize: '14px', cursor: 'pointer' }, text: 'Click or press any key to turn the power on.' });
      D.body.append(msg); msg.focus(); I.announce('The computer is off. Press any key to turn it on.');
      setTimeout(() => { msg.addEventListener('pointerdown', restart); msg.addEventListener('keydown', restart); }, 400);
    };
    setTimeout(() => {
      if (mode === 'restart') { collapse(restart); return; }
      if (mode === 'dos') { collapse(() => { underlay.remove(); dosScreen(); }); return; }
      sc.style.background = '#000'; sc.style.color = '#ff9a1f'; sc.style.fontSize = '24px';
      sc.replaceChildren(h('div', {}, 'It\'s now safe to turn off', h('br'), 'your computer.'));
      I.announce('It is now safe to turn off your computer.');
      setTimeout(() => collapse(powerScreen), quick ? 200 : 1800);
    }, quick ? 200 : 1400);
    return true;
  };
  function dosScreen() {
    const fr = h('iframe', { src: 'applets/msdos.html?mode=full', title: 'MS-DOS mode' });
    const box = h('div', { class: 'dos-full' }, fr); D.body.append(box);
    const onMsg = e => { if (e.origin === location.origin && e.data && e.data.source === 'msdos' && e.data.action === 'exit') { window.removeEventListener('message', onMsg); restart(); } };
    window.addEventListener('message', onMsg);
    setTimeout(() => { try { fr.contentWindow.focus(); } catch (e) {} }, 300);
  }
  GH.openDosMode = () => HOOKS.shutdown('dos');
})();

/* backup / restore helper: let the System Monitor close every other page's database connections */
(function () {
  const GH = window.GHShell; if (!GH) return;
  GH.releaseFrames = self => { Array.from(document.querySelectorAll('iframe')).forEach(f => { try { if (f.contentWindow !== self) f.src = 'about:blank'; } catch (e) {} }); };
})();
