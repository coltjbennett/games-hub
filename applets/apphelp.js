/* apphelp.js — a tiny shared Help dialog for the game applets (Minesweeper, Solitaire, Reversi, FreeCell).
 *
 *   AppHelp.attach({
 *     id: 'minesweeper',            // used for the achievement/Tapey event  help:open
 *     title: 'Minesweeper Help',
 *     mount: element,               // a "? Help" button is appended here (F1 also opens the dialog)
 *     sections: [ { h: 'Goal', p: ['Paragraph…'] }, { h: 'Controls', ul: ['Item…'] } ]
 *   });
 *
 * Text may use **bold**. Everything is inserted with textContent / createElement, never innerHTML.
 */
(function (g) {
  'use strict';
  var doc = g.document;
  var CSS = [
    '.ah-ov{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;padding:8px}',
    '.ah-win{display:flex;flex-direction:column;width:min(100%,470px);max-height:min(100%,560px);background:#c0c0c0;color:#000;border:2px outset #fff;box-shadow:2px 2px 0 #000;font-family:W95FA,"MS Sans Serif",Tahoma,sans-serif;font-size:13px}',
    '.ah-tb{display:flex;align-items:center;gap:6px;background:linear-gradient(90deg,#000080,#1084d0);color:#fff;padding:2px 3px 2px 6px;font-weight:bold}',
    '.ah-tb span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.ah-x{min-width:20px;height:18px;padding:0;line-height:14px;font-size:12px;color:#000;background:#c0c0c0;border:2px outset #fff;cursor:pointer}',
    '.ah-body{margin:6px;padding:8px 10px;background:#fff;border:2px inset #808080;overflow:auto;flex:1;min-height:0;line-height:1.35}',
    '.ah-body h3{margin:10px 0 3px;font-size:14px;color:#000080}.ah-body h3:first-child{margin-top:0}',
    '.ah-body p{margin:0 0 6px}.ah-body ul{margin:0 0 6px;padding-left:18px}.ah-body li{margin:0 0 3px}',
    '.ah-foot{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:0 6px 6px}',
    '.ah-foot small{color:#444}',
    '.ah-ok{min-width:78px;padding:3px 10px;font:inherit;color:#000;background:#c0c0c0;border:2px outset #fff;cursor:pointer}',
    '.ah-ok:active,.ah-x:active{border-style:inset}',
    '.ah-btn{font:inherit;color:#000;background:#c0c0c0;border:2px outset #fff;padding:2px 8px;cursor:pointer;min-height:22px;touch-action:manipulation}',
    '.ah-btn:active{border-style:inset}'
  ].join('');
  var styled = false;
  function addStyle() {
    if (styled || !doc.head) return; styled = true;
    var s = doc.createElement('style'); s.id = 'ah-style'; s.textContent = CSS; doc.head.appendChild(s);
  }
  /* **bold** -> <b> */
  function rich(el, text) {
    String(text).split(/(\*\*[^*]+\*\*)/).forEach(function (part) {
      if (!part) return;
      if (/^\*\*[^*]+\*\*$/.test(part)) { var b = doc.createElement('b'); b.textContent = part.slice(2, -2); el.appendChild(b); }
      else el.appendChild(doc.createTextNode(part));
    });
  }
  function attach(o) {
    o = o || {}; addStyle();
    var opener = null, ov = null;
    function close() {
      if (!ov) return;
      doc.removeEventListener('keydown', onKey, true);
      if (ov.parentNode) ov.parentNode.removeChild(ov); ov = null;
      try { if (opener && opener.focus) opener.focus(); } catch (e) {}
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
      else if (e.key === 'Tab' && ov) { /* keep focus inside the dialog */
        var f = ov.querySelectorAll('button'); if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    function open() {
      if (ov) return;
      opener = doc.activeElement;
      ov = doc.createElement('div'); ov.className = 'ah-ov';
      var win = doc.createElement('div'); win.className = 'ah-win'; win.setAttribute('role', 'dialog'); win.setAttribute('aria-modal', 'true'); win.setAttribute('aria-labelledby', 'ah-title');
      var tb = doc.createElement('div'); tb.className = 'ah-tb';
      var t = doc.createElement('span'); t.id = 'ah-title'; t.textContent = o.title || 'Help';
      var x = doc.createElement('button'); x.type = 'button'; x.className = 'ah-x'; x.textContent = '×'; x.setAttribute('aria-label', 'Close help'); x.onclick = close;
      tb.appendChild(t); tb.appendChild(x);
      var body = doc.createElement('div'); body.className = 'ah-body'; body.tabIndex = 0;
      (o.sections || []).forEach(function (s) {
        if (s.h) { var h3 = doc.createElement('h3'); h3.textContent = s.h; body.appendChild(h3); }
        (s.p || []).forEach(function (txt) { var p = doc.createElement('p'); rich(p, txt); body.appendChild(p); });
        if (s.ul && s.ul.length) { var ul = doc.createElement('ul'); s.ul.forEach(function (txt) { var li = doc.createElement('li'); rich(li, txt); ul.appendChild(li); }); body.appendChild(ul); }
      });
      var foot = doc.createElement('div'); foot.className = 'ah-foot';
      var hint = doc.createElement('small'); hint.textContent = 'Press F1 any time for this help.';
      var ok = doc.createElement('button'); ok.type = 'button'; ok.className = 'ah-ok'; ok.textContent = 'OK'; ok.onclick = close;
      foot.appendChild(hint); foot.appendChild(ok);
      win.appendChild(tb); win.appendChild(body); win.appendChild(foot); ov.appendChild(win);
      ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
      doc.body.appendChild(ov); doc.addEventListener('keydown', onKey, true);
      try { ok.focus(); } catch (e) {}
      try { g.parent && g.parent !== g && g.parent.GHShell && g.parent.GHShell.emit('help:open', { id: o.id || '' }); } catch (e) {}
    }
    var btn = doc.createElement('button'); btn.type = 'button'; btn.className = 'ah-btn'; btn.textContent = '? Help'; btn.title = 'How to play (F1)';
    btn.setAttribute('aria-haspopup', 'dialog'); btn.onclick = open;
    if (o.mount) o.mount.appendChild(btn);
    doc.addEventListener('keydown', function (e) { if (e.key === 'F1' && !ov) { e.preventDefault(); open(); } });
    return { open: open, close: close, button: btn };
  }
  g.AppHelp = { attach: attach };
})(window);
