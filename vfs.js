/* vfs.js — ColtonOS virtual file system (IndexedDB "ColtonOS-fs").
 * Shared by the desktop shell and applets (Notepad, Paint, MS-DOS Prompt).
 * Roots: 'docs' = My Documents, 'desktop' = files/folders on the desktop.
 * Node meta: { id, parent, name, kind:'folder'|'text'|'image'|'file', mime, size, mtime, ctime }.
 * kind 'file' = any other file (documents made in WordPad, sound recordings, imported files...).
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
    /* guess the node kind for a file name / mime type: text -> 'text', PNG -> 'image', everything else -> 'file' */
    kindOf: function (name, mime) {
      name = String(name || '').toLowerCase(); mime = String(mime || '').toLowerCase();
      if (/\.(txt|log|ini|bat|cfg|md|csv)$/.test(name) || mime === 'text/plain') return 'text';
      if (/\.png$/.test(name) || mime === 'image/png') return 'image';
      return 'file';
    },
    mimeOf: function (name, fallback) {
      var e = (/\.([a-z0-9]+)$/i.exec(name || '') || [])[1]; e = e && e.toLowerCase();
      var M = { txt: 'text/plain', md: 'text/plain', csv: 'text/plain', htm: 'text/html', html: 'text/html', rtf: 'text/html', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp', svg: 'image/svg+xml', mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', webm: 'audio/webm', m4a: 'audio/mp4', mp4: 'video/mp4', pdf: 'application/pdf', json: 'application/json', zip: 'application/zip' };
      return (e && M[e]) || fallback || 'application/octet-stream';
    },
    create: function (o) {
      return FS.ready().then(db).then(function (d) {
        var now = Date.now(), kind = o.kind || 'text';
        var meta = { id: uid(), parent: o.parent || 'docs', name: FS.uniqueName(o.parent || 'docs', FS.clean(o.name, kind)), kind: kind, mime: o.mime || (kind === 'image' ? 'image/png' : kind === 'file' ? FS.mimeOf(o.name) : 'text/plain'), size: 0, ctime: now, mtime: now };
        var data = kind === 'folder' ? null : (o.data == null ? (kind === 'text' ? '' : new Blob([])) : o.data);
        if (kind === 'file' && typeof data === 'string') data = new Blob([data], { type: meta.mime });
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

    /* ---- extra file-system helpers (File Manager, desktop menus, MS-DOS) ---- */
    isInside: function (id, ancestor) { for (var p = id, n = 0; p && n < 60; n++) { if (p === ancestor) return true; var m = cache.get(p); p = m && m.parent; } return false; },
    /* copy a node (recursively for folders) into another folder; resolves with the new top-level meta */
    copy: function (id, parent, newName) {
      var src = cache.get(id); if (!src) return Promise.resolve(null);
      if (src.kind === 'folder') {
        if (FS.isInside(parent, id)) return Promise.resolve(null);
        return FS.create({ parent: parent, name: newName || src.name, kind: 'folder' }).then(function (top) {
          var kids = FS.children(id), chain = Promise.resolve();
          kids.forEach(function (k) { chain = chain.then(function () { return FS.copy(k.id, top.id); }); });
          return chain.then(function () { return top; });
        });
      }
      return FS.read(id).then(function (data) { return FS.create({ parent: parent, name: newName || src.name, kind: src.kind, mime: src.mime, data: data }); });
    },
    sizeOf: function (id) { var m = cache.get(id); if (!m) return 0; if (m.kind !== 'folder') return m.size || 0; return FS.children(id).reduce(function (a, c) { return a + FS.sizeOf(c.id); }, 0); },
    countIn: function (id) { var f = 0, d = 0; (function walk(i) { FS.children(i).forEach(function (c) { if (c.kind === 'folder') { d++; walk(c.id); } else f++; }); })(id); return { files: f, folders: d }; },
    usage: function () { var b = 0, n = 0; cache.forEach(function (m) { if (m.kind !== 'folder') { b += m.size || 0; n++; } }); return { bytes: b, files: n, folders: cache.size - n }; },
    search: function (q, scope) {
      q = String(q || '').toLowerCase().trim(); if (!q) return [];
      var rx = null; if (q.indexOf('*') >= 0 || q.indexOf('?') >= 0) rx = new RegExp('^' + q.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
      return FS.all().filter(function (m) { return (!scope || FS.isInside(m.id, scope)) && (rx ? rx.test(m.name.toLowerCase()) : m.name.toLowerCase().indexOf(q) >= 0); });
    },
    /* turn a browser File into a node (text -> .txt, PNG -> picture, anything else -> generic file) */
    importFile: function (file, parent) {
      var kind = FS.kindOf(file.name, file.type);
      var done = kind === 'text' ? file.text() : Promise.resolve(file);
      return done.then(function (data) { return FS.create({ parent: parent || 'docs', name: file.name, kind: kind, mime: file.type || FS.mimeOf(file.name), data: data }); });
    },
    /* hand a file to the user as a download */
    download: function (id) {
      var m = cache.get(id); if (!m || m.kind === 'folder') return Promise.resolve(false);
      return FS.read(id).then(function (data) {
        var blob = data instanceof Blob ? data : new Blob([data == null ? '' : data], { type: m.mime || 'text/plain' });
        var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = m.name; document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); return true;
      });
    },
    /* zip a whole folder tree (needs minizip.js / JSZip on the page) */
    zipFolder: function (id) {
      if (!g.JSZip) return Promise.reject(new Error('ZIP support is not loaded.'));
      var z = new g.JSZip(), jobs = [];
      (function walk(i, pre) { FS.children(i).forEach(function (c) { if (c.kind === 'folder') walk(c.id, pre + c.name + '/'); else jobs.push(FS.read(c.id).then(function (d) { z.file(pre + c.name, d == null ? '' : d); })); }); })(id, '');
      return Promise.all(jobs).then(function () { return z.generateAsync({ type: 'blob' }); });
    },
    unzipInto: function (blob, parent) {
      if (!g.JSZip) return Promise.reject(new Error('ZIP support is not loaded.'));
      return g.JSZip.loadAsync(blob).then(function (z) {
        var names = Array.from(z.files.keys()), made = {}, n = 0, chain = Promise.resolve();
        function dirFor(parts) {
          var cur = parent, key = '', p = Promise.resolve(parent);
          parts.forEach(function (seg) { key += '/' + seg; p = p.then(function (par) { if (made[key]) return made[key]; return FS.create({ parent: par, name: seg, kind: 'folder' }).then(function (m) { made[key] = m.id; return m.id; }); }); });
          return p;
        }
        names.forEach(function (nm) { chain = chain.then(function () { var parts = nm.split('/').filter(Boolean), file = parts.pop(); if (!file) return; return dirFor(parts).then(function (par) { return z.file(nm).async('arraybuffer').then(function (buf) { var kind = FS.kindOf(file); var mime = FS.mimeOf(file); var data = kind === 'text' ? new TextDecoder().decode(buf) : new Blob([buf], { type: mime }); n++; return FS.create({ parent: par, name: file, kind: kind, mime: mime, data: data }); }); }); }); });
        return chain.then(function () { return n; });
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
            var kinds = opts.kinds || [kind], kids = FS.children(cur).filter(function (m) { return m.kind === 'folder' || kinds.indexOf(m.kind) >= 0; });
            if (!kids.length) { var e = doc.createElement('div'); e.textContent = '(empty)'; e.style.cssText = 'color:#808080;padding:4px'; list.append(e); }
            kids.forEach(function (m) {
              var it = doc.createElement('div'); it.textContent = (m.kind === 'folder' ? '📁 ' : m.kind === 'image' ? '🖼 ' : m.kind === 'file' ? '📎 ' : '📄 ') + m.name; it.style.cssText = 'padding:2px 4px;cursor:default;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
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
              var ex = FS.children(cur).filter(function (m) { return m.name.toLowerCase() === nm.toLowerCase(); })[0];
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
