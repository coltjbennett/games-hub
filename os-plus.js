/* os-plus.js — ColtonOS extras, loaded after os-more.js
 *  - File Manager becomes the explorer for the whole drive (My Computer, C:, Games, Documents, Desktop, saves)
 *  - every game gets  C:\Games\<Game>\saves\  showing its save slots; slot files open in the Text Viewer
 *  - Tapey tray icon (call him back after he steps aside), "Open Saves Folder" on game icons
 *  - Alt+Shift+Arrow window snapping, Ctrl+Alt+E opens My Computer */
(function () {
  'use strict';
  const GH = window.GHShell; if (!GH || !GH.internals) return;
  const I = GH.internals, HOOKS = GH.hooks, D = document;
  const { h, $, wins, createWindow, showWin, IC, toast } = I;

  /* ---------- File Manager as the system explorer ---------- */
  const FM_SRC = 'applets/filemanager.html';
  const toLoc = fid => fid === 'documents' ? 'vfs:docs' : /^vfs:/.test(fid) ? fid : 'shell:' + fid;
  function findFM(loc) { let hit = null; wins.forEach(W => { try { if (!hit && !W.closed && W.iframe && W.iframe.contentWindow && W.iframe.contentWindow.__fmLoc === loc) hit = W; } catch (e) { /* cross-origin never happens here */ } }); return hit; }
  function openFM(loc, opener, forceNew) {
    loc = loc || 'shell:my-computer';
    if (!forceNew) { const ex = findFM(loc); if (ex) { showWin(ex); return ex; } }
    let id = 'app-filemanager', n = 1; while (wins.has(id)) id = 'app-filemanager-' + (++n);
    const W = createWindow({ id, title: 'File Manager', icon: IC('filemanager'), width: 800, height: 540, minWidth: 440, minHeight: 300, frame: { src: FM_SRC + '?dir=' + encodeURIComponent(loc) } });
    W.opener = opener; showWin(W); GH.emit('fm:open', { loc }); return W;
  }
  HOOKS.fm = (fid, opener) => { if (fid === 'recycle') return false; openFM(toLoc(fid), opener); return true; };
  GH.openFM = openFM;
  /* called by the File Manager every time it navigates, so the window title and icon follow the folder */
  GH.fmReport = (win, loc, title, icon) => {
    let W = null; wins.forEach(x => { if (x.iframe && x.iframe === win.frameElement) W = x; }); if (!W) return;
    W.setTitle(title); const src = icon || IC('filemanager');
    const wi = W.el.querySelector('.wt-icon'); if (wi) wi.src = src; const ti = W.taskBtn && W.taskBtn.querySelector('img'); if (ti) ti.src = src;
  };
  GH.openSaves = url => openFM(url ? 'saves:' + url : 'shell:games');
  function slotLabel(url, i) {
    const all = (GH.slots && GH.slots.list()) || {}, s = (all[url] || {})[i], p = (I.PROJECTS || []).find(x => x.url === url);
    return ((p ? p.title : url) + ' - ' + (s ? s.name : 'Slot ' + i)).replace(/[\\/:*?"<>|]+/g, '');
  }
  GH.openSlotFile = (url, i) => {
    const id = 'slotfile-' + String(url).replace(/[^\w]+/g, '-') + '-' + i;
    const W = createWindow({ id, title: slotLabel(url, i) + '.sav - Text Viewer', icon: IC('document'), width: 620, height: 460, minWidth: 260, frame: { src: 'applets/textviewer.html?slot=' + encodeURIComponent(url) + '&n=' + i } });
    showWin(W); GH.emit('fm:slotview', { url, n: i }); return W;
  };

  /* game icons: Open Saves Folder */
  const prevItemMenu = HOOKS.itemMenu;
  HOOKS.itemMenu = (it, many) => {
    const base = (prevItemMenu ? prevItemMenu(it, many) : []) || [];
    if (it && it.project && /^games\//.test(it.project.url) && !many) base.push({ label: 'Open Saves &Folder', onClick: () => GH.openSaves(it.project.url) });
    return base;
  };

  /* ---------- Tapey in the tray: bring him back after he steps aside ---------- */
  const tray = $('#tb-tray');
  if (tray && GH.tapey) {
    const img = h('img', { src: 'images/tapey/tray.svg', alt: '', width: 16, height: 16 }); img.style.imageRendering = 'pixelated';
    const btn = h('button', { type: 'button', class: 'tray-btn', title: 'Tapey', 'aria-label': 'Tapey' }, img);
    const refresh = () => { const on = GH.tapey.isOn(), t = GH.tapey.isTucked(); img.style.opacity = on ? (t ? '.55' : '1') : '.35'; btn.title = !on ? 'Tapey is hidden - click to bring him back' : t ? 'Tapey stepped aside - click to call him back' : 'Tapey - click to say hi'; };
    btn.addEventListener('click', () => { if (!GH.tapey.isOn()) GH.tapey.show(); else { GH.tapey.summon(); GH.tapey.pose('wave', 1600); } setTimeout(refresh, 80); });
    btn.addEventListener('contextmenu', e => {
      e.preventDefault(); const r = btn.getBoundingClientRect();
      I.showContextMenu([{ label: '&Ask Tapey…', disabled: !GH.tapey.isOn(), onClick: () => GH.tapey.menu() }, { label: 'What\'s &this window?', disabled: !GH.tapey.isOn(), onClick: () => GH.tapey.explain() }, { sep: true },
        { label: GH.tapey.isOn() ? '&Hide Tapey' : '&Show Tapey', onClick: () => GH.tapey.toggle() }, { label: 'Tapey &Settings…', onClick: () => GH.openItem('app:tapey') }], r.left, r.top - 4);
    });
    tray.insertBefore(btn, tray.firstChild); refresh(); setInterval(refresh, 1500);
  }

  /* ---------- keyboard: Ctrl+Alt+E = My Computer, Alt+Shift+Arrows = snap the active window ---------- */
  function activeW() { let a = null; wins.forEach(W => { if (W.el && W.el.classList.contains('active') && !W.closed && !(W.o && W.o.dialog)) a = W; }); return a; }
  function snap(dir) {
    const W = activeW(); if (!W || W.o.resizable === false) return false; const host = W.el.parentElement.getBoundingClientRect();
    if (dir === 'Up') { if (!W.maximized) W.toggleMax(); return true; }
    if (W.maximized) W.toggleMax(); if (dir === 'Down') { W.minimize(); return true; }
    const w = Math.floor(host.width / 2), hh = Math.floor(host.height);
    W.el.style.width = w + 'px'; W.el.style.height = hh + 'px'; W.el.style.top = '0px'; W.el.style.left = (dir === 'Left' ? 0 : host.width - w) + 'px'; return true;
  }
  D.addEventListener('keydown', e => {
    if (e.ctrlKey && e.altKey && !e.shiftKey && (e.key === 'e' || e.key === 'E')) { e.preventDefault(); GH.openItem('sys:my-computer'); }
    else if (e.altKey && e.shiftKey && !e.ctrlKey && /^Arrow(Left|Right|Up|Down)$/.test(e.key)) { if (snap(e.key.slice(5))) e.preventDefault(); }
  });
  GH.snapWindow = snap;
})();
