/* minizip.js — tiny dependency-free ZIP reader/writer exposing the small slice of the JSZip API
 * that the System Monitor backup uses (file(), generateAsync(), loadAsync(), .async()).
 * Uses the browser's built-in CompressionStream / DecompressionStream ("deflate-raw"); falls back to stored entries. */
(function (g) {
  'use strict';
  if (g.JSZip && g.JSZip.__mini !== true && g.JSZip.version) return; // a real JSZip is already present
  var enc = new TextEncoder(), dec = new TextDecoder();
  var T = null;
  function crc32(u8) {
    if (!T) { T = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; T[n] = c >>> 0; } }
    var crc = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) crc = T[(crc ^ u8[i]) & 255] ^ (crc >>> 8); return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  function toU8(d) {
    if (d instanceof Uint8Array) return Promise.resolve(d);
    if (typeof d === 'string') return Promise.resolve(enc.encode(d));
    if (d instanceof ArrayBuffer) return Promise.resolve(new Uint8Array(d));
    if (d && typeof d.arrayBuffer === 'function') return d.arrayBuffer().then(function (b) { return new Uint8Array(b); });
    return Promise.resolve(new Uint8Array(0));
  }
  function pipe(u8, stream) {
    var w = stream.writable.getWriter(); w.write(u8); w.close();
    return new Response(stream.readable).arrayBuffer().then(function (b) { return new Uint8Array(b); });
  }
  function deflate(u8) { return typeof CompressionStream === 'function' ? pipe(u8, new CompressionStream('deflate-raw')) : Promise.resolve(null); }
  function inflate(u8) { if (typeof DecompressionStream !== 'function') return Promise.reject(new Error('This browser cannot read compressed ZIP files.')); return pipe(u8, new DecompressionStream('deflate-raw')); }
  function u16(v, n) { v.push(n & 255, (n >>> 8) & 255); }
  function u32(v, n) { v.push(n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255); }

  function Zip() { this.files = new Map(); }
  Zip.__mini = true;
  Zip.prototype.file = function (name, data) {
    if (arguments.length === 1) { var e = this.files.get(name); return e ? { name: name, async: function (type) { return e.get().then(function (u8) { return type === 'text' || type === 'string' ? dec.decode(u8) : type === 'arraybuffer' ? u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) : type === 'blob' ? new Blob([u8]) : u8; }); } } : null; }
    var cache = null; this.files.set(name, { raw: data, get: function () { return cache || (cache = toU8(data)); } }); return this;
  };
  Zip.prototype.generateAsync = function (opts) {
    var names = Array.from(this.files.keys()), files = this.files, parts = [], central = [], offset = 0, now = new Date();
    var dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1), dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    var chain = Promise.resolve();
    names.forEach(function (name) {
      chain = chain.then(function () { return files.get(name).get(); }).then(function (u8) {
        return deflate(u8).then(function (z) {
          var method = 0, body = u8; if (z && z.length < u8.length) { method = 8; body = z; }
          var nm = enc.encode(name), crc = crc32(u8), h = [];
          u32(h, 0x04034b50); u16(h, 20); u16(h, 0x0800); u16(h, method); u16(h, dosTime); u16(h, dosDate); u32(h, crc); u32(h, body.length); u32(h, u8.length); u16(h, nm.length); u16(h, 0);
          var lh = new Uint8Array(h); parts.push(lh, nm, body);
          var c = []; u32(c, 0x02014b50); u16(c, 20); u16(c, 20); u16(c, 0x0800); u16(c, method); u16(c, dosTime); u16(c, dosDate); u32(c, crc); u32(c, body.length); u32(c, u8.length); u16(c, nm.length); u16(c, 0); u16(c, 0); u16(c, 0); u16(c, 0); u32(c, 0); u32(c, offset);
          central.push(new Uint8Array(c), nm); offset += lh.length + nm.length + body.length;
        });
      });
    });
    return chain.then(function () {
      var csize = central.reduce(function (a, b) { return a + b.length; }, 0), e = [];
      u32(e, 0x06054b50); u16(e, 0); u16(e, 0); u16(e, names.length); u16(e, names.length); u32(e, csize); u32(e, offset); u16(e, 0);
      var blob = new Blob(parts.concat(central, [new Uint8Array(e)]), { type: 'application/zip' });
      return !opts || opts.type === 'blob' ? blob : blob.arrayBuffer().then(function (b) { return opts.type === 'uint8array' ? new Uint8Array(b) : b; });
    });
  };
  Zip.loadAsync = function (src) {
    return toU8(src).then(function (buf) {
      var dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength), eocd = -1;
      for (var i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) { if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
      if (eocd < 0) throw new Error('This file is not a valid ZIP archive.');
      var count = dv.getUint16(eocd + 10, true), p = dv.getUint32(eocd + 16, true), z = new Zip();
      for (var n = 0; n < count; n++) {
        if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('The ZIP directory is damaged.');
        (function (p) {
          var method = dv.getUint16(p + 10, true), csz = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lo = dv.getUint32(p + 42, true);
          var name = dec.decode(buf.subarray(p + 46, p + 46 + nl));
          if (name.slice(-1) === '/') return;
          var lnl = dv.getUint16(lo + 26, true), lel = dv.getUint16(lo + 28, true), start = lo + 30 + lnl + lel, raw = buf.subarray(start, start + csz), cache = null;
          z.files.set(name, { get: function () { return cache || (cache = method === 0 ? Promise.resolve(raw) : inflate(raw)); } });
          p += 0;
        })(p);
        p += 46 + dv.getUint16(p + 28, true) + dv.getUint16(p + 30, true) + dv.getUint16(p + 32, true);
      }
      return z;
    });
  };
  g.JSZip = Zip;
})(window);
