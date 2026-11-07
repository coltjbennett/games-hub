/* _arcade.js: tiny shared helpers for the newer classic games (neon theme, high scores, swipes, shell events). */
(function (g) {
  'use strict';
  var css = '@font-face{font-family:W95FA;src:url("../../images/w95f.woff2") format("woff2")}' +
    'html,body{margin:0;padding:0;width:100%;height:100%;background:#c0c0c0;color:#000;font-family:W95FA,"MS Sans Serif",Tahoma,Geneva,sans-serif;font-size:14px;overflow:hidden;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}' +
    'body{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px}' +
    'canvas{background:#000;border:2px solid;border-color:#808080 #fff #fff #808080;box-shadow:inset 1px 1px 0 #000;max-width:100%;max-height:78vh;image-rendering:pixelated}' +
    '.hud{display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;font-size:14px;padding:3px 8px;background:#c0c0c0;border:2px solid;border-color:#808080 #fff #fff #808080}.hud b{color:#000080}' +
    '.hud select,select{font:inherit;color:#000;background:#fff;border:2px solid;border-color:#808080 #fff #fff #808080;padding:1px 2px}' +
    '.ab{font:inherit;color:#000;background:#c0c0c0;border:2px solid;border-color:#fff #404040 #404040 #fff;box-shadow:inset -1px -1px 0 #808080,inset 1px 1px 0 #dfdfdf;padding:4px 14px;cursor:pointer;touch-action:manipulation;min-height:28px}' +
    '.ab:active{border-color:#404040 #fff #fff #404040;box-shadow:inset 1px 1px 0 #808080;padding:5px 13px 3px 15px}.ab:focus-visible{outline:1px dotted #000;outline-offset:-5px}.ab:disabled{color:#808080;text-shadow:1px 1px 0 #fff}' +
    '.msg{min-height:20px;color:#000;text-align:center;font-size:14px;padding:2px 8px;background:#c0c0c0;border:1px solid;border-color:#808080 #fff #fff #808080}.dim{color:#404040;font-size:12px}' +
    '@media (hover:hover) and (pointer:fine){canvas{max-height:84vh}}';
  var st = document.createElement('style'); st.textContent = css; var hd = document.head || document.documentElement; hd.insertBefore(st, hd.firstChild); /* first, so a game's own CSS wins */
  var Arc = {
    emit: function (name, data) { try { g.parent && g.parent !== g && g.parent.GHShell && g.parent.GHShell.emit(name, data); } catch (e) {} },
    hs: function (id) {
      var k = 'gh-hs-' + id;
      return { get: function () { try { return +localStorage.getItem(k) || 0; } catch (e) { return 0; } },
        set: function (v, lowerIsBetter) { try { var o = +localStorage.getItem(k) || 0; if (!o || (lowerIsBetter ? v < o : v > o)) { localStorage.setItem(k, String(v)); return true; } } catch (e) {} return false; } };
    },
    swipe: function (el, fn, min) {
      var sx = 0, sy = 0, on = false; min = min || 24;
      el.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; on = true; });
      el.addEventListener('pointerup', function (e) { if (!on) return; on = false; var dx = e.clientX - sx, dy = e.clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) < min) return; fn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')); });
    },
    el: function (tag, props, kids) { var e = document.createElement(tag); Object.keys(props || {}).forEach(function (k) { if (k === 'text') e.textContent = props[k]; else if (k === 'class') e.className = props[k]; else e.setAttribute(k, props[k]); }); (kids || []).forEach(function (c) { e.appendChild(c); }); return e; }
  };
  g.Arc = Arc;
})(window);
