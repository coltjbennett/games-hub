/* vfs.js — ColtonOS virtual file system (IndexedDB "ColtonOS-fs").
 * Shared by the desktop shell and applets (Notepad, Paint, MS-DOS Prompt).
 * Roots: 'docs' = My Documents, 'desktop' = files/folders on the desktop.
 * Node meta: { id, parent, name, kind:'folder'|'text'|'image', mime, size, mtime, ctime }.
 * File bytes live in a separate store so listing is cheap. */
(function (g) {
  'use strict';
  var DB = 'ColtonOS-fs', STORES = { nodes: 'nodes', data: 'data' };
  var dbp = null, cache = new Map(), listeners = [], chan = null, readyP = null;
  try { chan = new BroadcastChannel('coltonos-fs'); } catch (e) {}

  function db() {
    return dbp || (dbp = new Promise(function (res, rej) {
      var r = indexedDB.open(DB, 1);
      r.onupgradeneeded = function () { var d = r.result; d.createObjectStore('nodes', { keyPath: 'id' }); d.createObjectStore('data'); };
      r.onsuccess = function () { r.result.onversionchange = function () { try { r.result.close(); } catch (e) {} dbp = null; }; res(r.result); };
      r.onerror = function () { rej(r.error); };
    }));
  }
  function done(tx) { return new Promise(function (res, rej) { tx.oncomplete = res; tx.onerror = tx.onabort = function () { rej(tx.error); }; }); }
  function req(r) { return new Promise(function (res, rej) { r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; }); }
  function uid() { return 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  function reload() {
    return db().then(function (d) { return req(d.transaction('nodes').objectStore('nodes').getAll()); }).then(function (all) {
      cache = new Map(); all.forEach(function (m) { cache.set(m.id, m); });
      return all;
    });
  }
  function fire() { listeners.forEach(function (f) { try { f(); } catch (e) {} }); }
  function changed() { fire(); if (chan) try { chan.postMessage('changed'); } catch (e) {} }
  if (chan) chan.onmessage = function () { reload().then(fire).catch(function () {}); };

  var FS = g.ColtonFS = {
    ready: function () { return readyP || (readyP = reload().catch(function () { return []; })); },
    onChange: function (f) { listeners.push(f); },
    cache: function () { return cache; },
    all: function () { return Array.from(cache.values()); },
    meta: function (id) { return cache.get(id) || null; },
    children: function (parent) {
      return FS.all().filter(function (m) { return m.parent === parent; })
        .sort(function (a, b) { return (a.kind === 'folder' ? 0 : 1) - (b.kind === 'folder' ? 0 : 1) || a.name.localeCompare(b.name); });
    },
    isFolderId: function (id) { return id === 'docs' || id === 'desktop' || (cache.get(id) && cache.get(id).kind === 'folder'); },
    pathOf: function (id) {
      var parts = [], cur = id, guard = 0;
      while (cur && guard++ < 40) {
        if (cur === 'docs') { parts.unshift('My Documents'); break; }
        if (cur === 'desktop') { parts.unshift('Desktop'); break; }
        var m = cache.get(cur); if (!m) break; parts.unshift(m.name); cur = m.parent;
      }
      return 'C:\\' + parts.join('\\');
    },
    uniqueName: function (parent, name, ignoreId) {
      var taken = new Set(FS.children(parent).filter(function (m) { return m.id !== ignoreId; }).map(function (m) { return m.name.toLowerCase(); }));
      if (!taken.has(name.toLowerCase())) return name;
      var dot = name.lastIndexOf('.'), base = dot > 0 ? name.slice(0, dot) : name, ext = dot > 0 ? name.slice(dot) : '';
      for (var i = 2; i < 999; i++) { var n = base + ' (' + i + ')' + ext; if (!taken.has(n.toLowerCase())) return n; }
      return base + '-' + uid() + ext;
    },
    clean: function (name, kind) {
      name = String(name || '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '').trim().slice(0, 60) || (kind === 'folder' ? 'New Folder' : 'Untitled');
      if (kind === 'text' && !/\.txt$/i.test(name)) name += '.txt';
      if (kind === 'image' && !/\.png$/i.test(name)) name += '.png';
      return name;
    },
    create: function (o) {
      return FS.ready().then(db).then(function (d) {
        var now = Date.now(), kind = o.kind || 'text';
        var meta = { id: uid(), parent: o.parent || 'docs', name: FS.uniqueName(o.parent || 'docs', FS.clean(o.name, kind)), kind: kind, mime: o.mime || (kind === 'image' ? 'image/png' : 'text/plain'), size: 0, ctime: now, mtime: now };
        var data = kind === 'folder' ? null : (o.data == null ? (kind === 'text' ? '' : new Blob([])) : o.data);
        meta.size = data == null ? 0 : (typeof data === 'string' ? data.length : data.size || 0);
        var tx = d.transaction(['nodes', 'data'], 'readwrite'); tx.objectStore('nodes').put(meta);
        if (data != null) tx.objectStore('data').put(data, meta.id);
        return done(tx).then(function () { cache.set(meta.id, meta); changed(); return meta; });
      });
    },
    /* overwrite the bytes of an existing file (optionally rename / move) */
    write: function (id, data, o) {
      o = o || {};
      return FS.ready().then(db).then(function (d) {
        var m = Object.assign({}, cache.get(id)); if (!m.id) throw new Error('No such file');
        if (o.name) m.name = FS.uniqueName(o.parent || m.parent, FS.clean(o.name, m.kind), id);
        if (o.parent) m.parent = o.parent;
        m.size = typeof data === 'string' ? data.length : (data && data.size) || 0; m.mtime = Date.now();
        var tx = d.transaction(['nodes', 'data'], 'readwrite'); tx.objectStore('nodes').put(m); tx.objectStore('data').put(data, id);
        return done(tx).then(function () { cache.set(id, m); changed(); return m; });
      });
    },
    read: function (id) { return db().then(function (d) { return req(d.transaction('data').objectStore('data').get(id)); }); },
    rename: function (id, name) {
      return FS.ready().then(db).then(function (d) {
        var m = Object.assign({}, cache.get(id)); if (!m.id) return null;
        m.name = FS.uniqueName(m.parent, FS.clean(name, m.kind), id); m.mtime = Date.now();
        var tx = d.transaction('nodes', 'readwrite'); tx.objectStore('nodes').put(m);
        return done(tx).then(function () { cache.set(id, m); changed(); return m; });
      });
    },
    move: function (id, parent) {
      return FS.ready().then(db).then(function (d) {
        var m = Object.assign({}, cache.get(id)); if (!m.id || m.id === parent) return null;
        for (var p = parent, n = 0; p && n < 40; n++) { if (p === id) return null; var pm = cache.get(p); p = pm && pm.parent; } // no moving a folder into itself
        m.parent = parent; m.name = FS.uniqueName(parent, m.name, id);
        var tx = d.transaction('nodes', 'readwrite'); tx.objectStore('nodes').put(m);
        return done(tx).then(function () { cache.set(id, m); changed(); return m; });
      });
    },
    remove: function (id) {
      return FS.ready().then(db).then(function (d) {
        var ids = [id], i = 0;
        while (i < ids.length) { FS.children(ids[i]).forEach(function (c) { ids.push(c.id); }); i++; }
        var tx = d.transaction(['nodes', 'data'], 'readwrite');
        ids.forEach(function (x) { tx.objectStore('nodes').delete(x); tx.objectStore('data').delete(x); });
        return done(tx).then(function () { ids.forEach(function (x) { cache.delete(x); }); changed(); });
      });
    },

    /* Open / Save As dialog drawn inside the calling document.
       opts: { mode:'open'|'save', kind:'text'|'image', name:'', title:'' } -> Promise<{meta?, parent, name}|null> */
    dialog: function (opts) {
      var doc = opts.doc || document, kind = opts.kind || 'text', save = opts.mode === 'save';
      return FS.ready().then(function () {
        return new Promise(function (resolve) {
          var cur = opts.parent || 'docs', sel = null;
          var ov = doc.createElement('div');
          ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;font:12px W95FA,"MS Sans Serif",Tahoma,sans-serif;color:#000;color-scheme:light';
          var box = doc.createElement('div');
          box.style.cssText = 'background:#c0c0c0;padding:3px;width:min(380px,96vw);box-shadow:inset -1px -1px #000,inset 1px 1px #dfdfdf,inset -2px -2px #808080,inset 2px 2px #fff';
          var tb = doc.createElement('div'); tb.textContent = opts.title || (save ? 'Save As' : 'Open'); tb.style.cssText = 'background:#000080;color:#fff;font-weight:bold;padding:2px 4px';
          var body = doc.createElement('div'); body.style.cssText = 'padding:8px;display:flex;flex-direction:column;gap:6px';
          var where = doc.createElement('div'); var up = doc.createElement('button'); up.textContent = '▲ Up';
          var path = doc.createElement('span'); path.style.cssText = 'margin-left:6px;font-weight:bold';
          where.append(up, path);
          var list = doc.createElement('div'); list.style.cssText = 'height:160px;overflow:auto;background:#fff;box-shadow:inset 1px 1px #808080,inset -1px -1px #fff;padding:2px;user-select:none';
          var nameIn = doc.createElement('input'); nameIn.type = 'text'; nameIn.value = opts.name || ''; nameIn.placeholder = save ? 'File name' : ''; nameIn.style.cssText = 'font:inherit;color:#000;background:#fff;border:2px inset #808080;padding:2px 4px;width:100%';
          var row = doc.createElement('div'); row.style.cssText = 'display:flex;gap:6px;justify-content:flex-end';
          var ok = doc.createElement('button'); ok.textContent = save ? 'Save' : 'Open';
          var no = doc.createElement('button'); no.textContent = 'Cancel';
          var nf = doc.createElement('button'); nf.textContent = 'New Folder'; nf.style.marginRight = 'auto';
          [up, ok, no, nf].forEach(function (b) { b.style.cssText += ';font:inherit;color:#000;background:#c0c0c0;border:2px outset #fff;padding:3px 12px;cursor:pointer'; });
          row.append(nf, ok, no); body.append(where, list); if (save) body.append(nameIn); body.append(row);
          box.append(tb, body); ov.append(box); doc.body.append(ov);
          function close(v) { ov.remove(); resolve(v); }
          function paint() {
            path.textContent = FS.pathOf(cur); list.replaceChildren(); sel = null;
            var kids = FS.children(cur).filter(function (m) { return m.kind === 'folder' || m.kind === kind; });
            if (!kids.length) { var e = doc.createElement('div'); e.textContent = '(empty)'; e.style.cssText = 'color:#808080;padding:4px'; list.append(e); }
            kids.forEach(function (m) {
              var it = doc.createElement('div'); it.textContent = (m.kind === 'folder' ? '📁 ' : m.kind === 'image' ? '🖼 ' : '📄 ') + m.name; it.style.cssText = 'padding:2px 4px;cursor:default;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
              it.onclick = function () {
                Array.from(list.children).forEach(function (c) { c.style.background = ''; c.style.color = ''; });
                it.style.background = '#000080'; it.style.color = '#fff'; sel = m; if (m.kind !== 'folder') nameIn.value = m.name;
              };
              it.ondblclick = function () { if (m.kind === 'folder') { cur = m.id; paint(); } else go(); };
              list.append(it);
            });
          }
          function go() {
            if (save) {
              var nm = FS.clean(nameIn.value, kind); if (!nameIn.value.trim()) { nameIn.focus(); return; }
              var ex = FS.children(cur).filter(function (m) { return m.kind === kind && m.name.toLowerCase() === nm.toLowerCase(); })[0];
              if (ex && !doc.defaultView.confirm('"' + nm + '" already exists.\nDo you want to replace it?')) return;
              close({ parent: cur, name: nm, meta: ex || null });
            } else {
              if (!sel) return; if (sel.kind === 'folder') { cur = sel.id; paint(); return; }
              close({ meta: sel, parent: sel.parent, name: sel.name });
            }
          }
          up.onclick = function () { if (cur === 'docs' || cur === 'desktop') return; var m = cache.get(cur); cur = m ? m.parent : 'docs'; paint(); };
          nf.onclick = function () { var n = doc.defaultView.prompt('New folder name:', 'New Folder'); if (n) FS.create({ parent: cur, name: n, kind: 'folder' }).then(paint); };
          ok.onclick = go; no.onclick = function () { close(null); };
          ov.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(null); else if (e.key === 'Enter' && e.target !== list) go(); });
          paint(); (save ? nameIn : ok).focus();
        });
      });
    }
  };
  FS.ready();
})(window);
