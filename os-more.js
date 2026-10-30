/* os-more.js — ColtonOS shell extensions, part 2 (loaded after os-extras.js).
 *  - GHShell.emit / on         tiny event bus (shell + applets report what the user does)
 *  - Achievements              GHShell.ach   (popups, Achievements applet, progress widget)
 *  - Tapey                     GHShell.tapey (the tape-roll desktop assistant)
 *  - Desktop widgets           GHShell.widgets
 *  - Save slots for the local games (title-bar 💾 button)
 *  - File-system extras        cut/copy/paste/duplicate/download, import files from the computer, drag & drop
 *  - Random game               Start menu, desktop menu, Tapey, widget (and the Project Library button)
 * Everything talks to main.js through GHShell.internals / GHShell.hooks. */
(function () {
  'use strict';
  const GH = window.GHShell, FS = window.ColtonFS;
  if (!GH || !GH.internals) return;
  const I = GH.internals, HOOKS = GH.hooks;
  const { h, $, $$, wins, IC, ITEMS } = I;
  const D = document, H = D.documentElement;
  const S = () => I.settings();
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };
  const rm = () => I.reducedMotion();
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const pad2 = n => (n < 10 ? '0' : '') + n;

  /* ===================== styles ===================== */
  const css = `
  #tapey{position:fixed;z-index:9500;right:18px;bottom:calc(var(--taskbar-h,28px) + 14px);width:var(--tp-size,96px);touch-action:none;user-select:none;-webkit-user-select:none}
  #tapey[hidden]{display:none}
  #tapey .tp-body{display:block;width:100%;aspect-ratio:1;background:none;border:0;padding:0;cursor:pointer;position:relative}
  #tapey .tp-body:focus-visible{outline:2px dotted #000;outline-offset:2px}
  #tapey img{width:100%;height:100%;display:block;pointer-events:none;-webkit-user-drag:none;filter:drop-shadow(1px 3px 2px rgba(0,0,0,.35))}
  #tapey.bob .tp-body img{animation:tpBob 2.6s ease-in-out infinite}
  @keyframes tpBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
  #tapey.dance .tp-body img{animation:tpDance .5s ease-in-out infinite}
  @keyframes tpDance{0%,100%{transform:rotate(-6deg) translateY(0)}50%{transform:rotate(6deg) translateY(-8px)}}
  #tapey.drag img{transform:rotate(-8deg) scale(1.06)}
  .tp-bal{position:absolute;bottom:100%;margin-bottom:8px;min-width:190px;max-width:min(300px,82vw);width:max-content;background:#ffffe1;color:#000;border:1px solid #000;padding:8px 10px;font:13px/1.35 W95FA,"MS Sans Serif",Tahoma,sans-serif;box-shadow:2px 2px 0 rgba(0,0,0,.4);z-index:2}
  .tp-bal.l{left:0}.tp-bal.r{right:0}.tp-bal.below{bottom:auto;top:100%;margin:8px 0 0}
  .tp-bal::after{content:"";position:absolute;bottom:-9px;width:0;height:0;border:8px solid transparent;border-top:9px solid #000;border-bottom:0}
  .tp-bal.l::after{left:34px}.tp-bal.r::after{right:34px}.tp-bal.below::after{bottom:auto;top:-9px;border-top:0;border-bottom:9px solid #000}
  .tp-bal .tp-x{position:absolute;right:2px;top:0;border:0;background:none;font:14px sans-serif;cursor:pointer;color:#000;padding:0 4px;line-height:1.2}
  .tp-bal .tp-t{white-space:pre-wrap;margin-right:6px}
  .tp-bal .tp-h{font-weight:bold;margin-bottom:4px}
  .tp-bal .tp-a{display:flex;flex-direction:column;gap:3px;margin-top:8px}
  .tp-bal .tp-a button,.tp-bal .tp-in{font:12px W95FA,"MS Sans Serif",Tahoma,sans-serif;color:#000;text-align:left;background:#c0c0c0;border:2px outset #fff;padding:3px 7px;cursor:pointer;min-height:24px}
  .tp-bal .tp-a button:active{border-style:inset}
  .tp-bal .tp-in{background:#fff;border:2px inset #808080;cursor:text;width:100%;margin-top:6px}
  #gh-widgets{position:absolute;inset:0;z-index:1;pointer-events:none;overflow:hidden}
  .gh-widget{position:absolute;pointer-events:auto;background:#c0c0c0;color:#000;font:12px W95FA,"MS Sans Serif",Tahoma,sans-serif;box-shadow:inset -1px -1px #000,inset 1px 1px #dfdfdf,inset -2px -2px #808080,inset 2px 2px #fff,2px 3px 0 rgba(0,0,0,.28);padding:3px;touch-action:none;user-select:none;-webkit-user-select:none;color-scheme:light}
  .gh-widget .wg-t{display:flex;align-items:center;gap:4px;background:#000080;color:#fff;font-weight:bold;padding:1px 3px;cursor:move;font-size:11px}
  .gh-widget .wg-t span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .gh-widget .wg-t button{width:14px;height:13px;padding:0;font:bold 9px/1 sans-serif;background:#c0c0c0;color:#000;border:1px outset #fff;cursor:pointer}
  .gh-widget .wg-b{padding:5px;background:#c0c0c0}
  .gh-widget button.wg{font:inherit;color:#000;background:#c0c0c0;border:2px outset #fff;padding:2px 8px;cursor:pointer;min-height:22px}
  .gh-widget button.wg:active{border-style:inset}
  .gh-widget .wg-note{width:100%;height:100%;border:0;resize:none;background:transparent;font:13px/1.3 "Comic Sans MS","Segoe Print",cursive;color:#222;outline:0;user-select:text;-webkit-user-select:text}
  .gh-widget .wg-sunk{background:#fff;box-shadow:inset 1px 1px #808080,inset -1px -1px #fff;padding:3px}
  .gh-widget .wg-bar{height:12px;background:#fff;box-shadow:inset 1px 1px #808080,inset -1px -1px #fff;padding:1px}
  .gh-widget .wg-bar i{display:block;height:100%;background:#000080}
  .gh-widget table.mc{border-collapse:collapse;width:100%;text-align:center;font-size:11px}
  .gh-widget table.mc td{padding:1px;height:16px}.gh-widget table.mc td.t{background:#000080;color:#fff}.gh-widget table.mc th{font-weight:normal;color:#444}
  .gh-ach{position:fixed;z-index:100002;right:12px;bottom:calc(var(--taskbar-h,28px) + 10px);width:min(320px,92vw);background:#c0c0c0;color:#000;font:13px W95FA,"MS Sans Serif",Tahoma,sans-serif;box-shadow:inset -1px -1px #000,inset 1px 1px #dfdfdf,inset -2px -2px #808080,inset 2px 2px #fff,3px 4px 0 rgba(0,0,0,.35);padding:3px;transform:translateY(130%);transition:transform .4s cubic-bezier(.2,.9,.3,1);pointer-events:auto;cursor:pointer}
  .gh-ach.in{transform:none}
  .gh-ach .at{background:linear-gradient(90deg,#000080,#1084d0);color:#fff;font-weight:bold;padding:1px 4px;font-size:12px}
  .gh-ach .ab{display:flex;gap:10px;align-items:center;padding:8px}
  .gh-ach .ab b{display:block}
  .gh-ach .ai{font-size:30px;line-height:1;width:38px;text-align:center}
  .wt-slot{width:18px;height:16px;flex:none;margin-right:3px;padding:0;border:0;background:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}
  .wt-slot img{width:14px;height:14px;display:block}
  .wt-slot:hover,.wt-slot:focus-visible{background:rgba(255,255,255,.3);outline:1px dotted #fff}
  .slot-row{display:grid;grid-template-columns:1fr auto;gap:4px 8px;align-items:center;padding:5px 6px;background:#fff;color:#000;box-shadow:inset 1px 1px #808080,inset -1px -1px #fff;margin-bottom:4px}
  .slot-row .si{font-size:11px;color:#444}
  .slot-row .sb{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end}
  .slot-row .sb button{font:inherit;font-size:12px;color:#000;background:#c0c0c0;border:2px outset #fff;padding:1px 8px;min-height:22px;cursor:pointer}
  .slot-row .sb button:disabled{color:#808080}
  @media (max-width:700px){#tapey{--tp-size:72px}}
  @media (prefers-reduced-motion:reduce){#tapey.bob .tp-body img{animation:none}}
  html.reduced-motion #tapey.bob .tp-body img{animation:none}
  `;
  const st = D.createElement('style'); st.id = 'gh-more-css'; st.textContent = css; D.head.append(st);

  /* ===================== event bus ===================== */
  const subs = [];
  GH.on = fn => { subs.push(fn); return () => { const i = subs.indexOf(fn); if (i >= 0) subs.splice(i, 1); }; };
  GH.emit = (name, data) => { name = String(name || '').slice(0, 60); subs.slice().forEach(f => { try { f(name, data); } catch (e) { /* a listener must never break the shell */ } }); };
  HOOKS.emit = (n, d) => GH.emit(n, d);
  /* applets running inside iframes may also postMessage { gh:'event', name } */
  window.addEventListener('message', e => { if (e.origin !== location.origin || !e.data || e.data.gh !== 'event') return; GH.emit(e.data.name, e.data.data); });
  /* windows opened without a hook (explorer folders etc.) still show up here */
  const catalog = GH.catalog();

  /* ===================== achievements ===================== */
  const AKEY = 'gh-achievements-v1', SKEY = 'gh-ach-stats-v1';
  const ACH = [
    { id: 'first_steps', n: 'First Steps', d: 'Open any program.', i: '👣' },
    { id: 'first_game', n: 'Player One', d: 'Launch your first game.', i: '🎮' },
    { id: 'sampler', n: 'Sampler Platter', d: 'Try 5 different games.', i: '🍽' },
    { id: 'explorer', n: 'Game Explorer', d: 'Try 12 different games.', i: '🧭' },
    { id: 'classic_fan', n: 'Classic Fan', d: 'Play every classic arcade game.', i: '🕹' },
    { id: 'arcade_goer', n: 'Arcade Goer', d: 'Open the Arcade Hub.', i: '🎟' },
    { id: 'chatterbox', n: 'Chatterbox', d: 'Open the Chatroom.', i: '💬' },
    { id: 'surfer', n: 'Information Superhighway', d: 'Open Internet Explorer.', i: '🌐' },
    { id: 'lucky', n: 'Feeling Lucky', d: 'Use the Random Game button.', i: '🎲' },
    { id: 'favorite', n: 'Teacher\'s Pet', d: 'Add a game to your favorites.', i: '⭐' },
    { id: 'collector', n: 'Collector', d: 'Favorite 3 games.', i: '📚' },
    { id: 'save_slot', n: 'Saved by the Slot', d: 'Save a game into a save slot.', i: '💾' },
    { id: 'load_slot', n: 'Time Traveler', d: 'Load a game from a save slot.', i: '⏪' },
    { id: 'decorator', n: 'Interior Decorator', d: 'Change a desktop theme or color scheme.', i: '🎨' },
    { id: 'widget_fan', n: 'Widget Fan', d: 'Put a widget on your desktop.', i: '🧩' },
    { id: 'widget_wall', n: 'Dashboard Dweller', d: 'Have 4 widgets on the desktop at once.', i: '🖥' },
    { id: 'multitasker', n: 'Multitasker', d: 'Have 5 windows open at once.', i: '🗂' },
    { id: 'searcher', n: 'Seek and Ye Shall Find', d: 'Use Find (Ctrl+K).', i: '🔎' },
    { id: 'runner', n: 'Run, Forrest, Run', d: 'Use the Run dialog.', i: '🏃' },
    { id: 'taskman', n: 'Three-Finger Salute', d: 'Open the Task Manager.', i: '🖖' },
    { id: 'desktop_clean', n: 'Clean Desk', d: 'Minimize all windows to show the desktop.', i: '🧹' },
    { id: 'saver', n: 'Screen Saver Savior', d: 'Preview a screen saver.', i: '🌌' },
    { id: 'file_clerk', n: 'File Clerk', d: 'Create a file or folder.', i: '🗃' },
    { id: 'importer', n: 'Moving Day', d: 'Add a file from your computer.', i: '📥' },
    { id: 'copycat', n: 'Copy That', d: 'Copy and paste a file or folder.', i: '📋' },
    { id: 'packrat', n: 'Packrat', d: 'Store 10 files in My Documents.', i: '🎒' },
    { id: 'writer', n: 'Dear Diary', d: 'Save a WordPad document.', i: '✍' },
    { id: 'artist', n: 'Starving Artist', d: 'Save a Paint picture.', i: '🖌' },
    { id: 'recorder', n: 'Sound Engineer', d: 'Save a Sound Recorder clip.', i: '🎙' },
    { id: 'dj', n: 'Disc Jockey', d: 'Play something in Media Player.', i: '🎧' },
    { id: 'defragger', n: 'Tidy Disk, Tidy Mind', d: 'Finish a disk defragmentation.', i: '🧱' },
    { id: 'dialer', n: 'Reach Out', d: 'Dial a number in Phone Dialer.', i: '☎' },
    { id: 'planner', n: 'Planner', d: 'Write a note in Calendar.', i: '📅' },
    { id: 'symbols', n: 'Symbolic Gesture', d: 'Copy a character from Character Map.', i: 'Ω' },
    { id: 'dos_user', n: 'Command Line Hero', d: 'Run 10 commands in the MS-DOS Prompt.', i: '⌨' },
    { id: 'dos_mkdir', n: 'Make Directory', d: 'Create a folder from MS-DOS.', i: '📂' },
    { id: 'text_adv', n: 'Escape the Workshop', d: 'Finish The Copper Key text adventure.', i: '🗝' },
    { id: 'word_nerd', n: 'Word Nerd', d: 'Win Hangman or Word Scramble.', i: '🔤' },
    { id: 'high_roller', n: 'High Roller', d: 'Double your chips in Blackjack.', i: '🃏' },
    { id: 'freecell', n: 'Free at Last', d: 'Win a game of FreeCell.', i: '♠' },
    { id: 'reversi', n: 'Corner Control', d: 'Beat the computer at Reversi.', i: '⚫' },
    { id: 'tapey_hi', n: 'Sticky Situation', d: 'Talk to Tapey.', i: '📼' },
    { id: 'tapey_fan', n: 'Tape Is Great', d: 'Click on Tapey 20 times.', i: '💛' },
    { id: 'regular', n: 'Regular', d: 'Visit on 5 different days.', i: '🗓' },
    { id: 'marathon', n: 'Marathon', d: 'Spend a total of 2 hours on the site.', i: '⏱' },
    { id: 'shutdown', n: 'It\'s Now Safe', d: 'Shut down properly.', i: '🔌' },
    { id: 'tapey_dance', n: 'Boogie Wonderland', d: 'Make Tapey dance.', i: '💃', hidden: true },
    { id: 'konami', n: 'Old School', d: 'Enter a famous cheat code on the desktop.', i: '⬆', hidden: true },
    { id: 'night_owl', n: 'Night Owl', d: 'Be here between midnight and 4 a.m.', i: '🦉', hidden: true },
    { id: 'xyzzy', n: 'Nothing Happens', d: 'Say the magic word.', i: '✨', hidden: true },
    { id: 'tapey_angry', n: 'Sticky Fingers', d: 'Poke Tapey way too many times.', i: '😠', hidden: true },
    { id: 'completionist', n: 'Completionist', d: 'Unlock 30 achievements.', i: '🏆' }
  ];
  const AIDX = {}; ACH.forEach(a => { AIDX[a.id] = a; });
  let unlocked = LS.get(AKEY, {}), stats = LS.get(SKEY, null) || { games: [], classics: [], favs: [], dos: 0, clicks: 0, pokes: 0, minutes: 0, days: [], widgets: 0 };
  const saveStats = () => LS.set(SKEY, stats);
  const addTo = (arr, v) => { if (arr.indexOf(v) < 0) { arr.push(v); return true; } return false; };
  const queue = []; let popping = false;
  function pop() {
    if (popping || !queue.length) return; popping = true;
    const a = queue.shift();
    const el = h('div', { class: 'gh-ach', role: 'status', 'aria-live': 'polite', title: 'Click to see all achievements' },
      h('div', { class: 'at', text: '🏆 Achievement Unlocked!' }), h('div', { class: 'ab' }, h('div', { class: 'ai', text: a.i }), h('div', {}, h('b', { text: a.n }), h('span', { text: a.d }))));
    D.body.append(el); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
    el.addEventListener('click', () => { GH.openItem('app:achievements'); close(); });
    let done = false; const close = () => { if (done) return; done = true; el.classList.remove('in'); setTimeout(() => { el.remove(); popping = false; pop(); }, 450); };
    setTimeout(close, 5200);
  }
  function unlock(id) {
    const a = AIDX[id]; if (!a || unlocked[id]) return false;
    unlocked[id] = Date.now(); LS.set(AKEY, unlocked);
    queue.push(a); pop(); I.playSound && I.playSound('tada');
    GH.emit('ach', a);
    if (Object.keys(unlocked).length >= 30) unlock('completionist');
    return true;
  }
  GH.ach = {
    list: () => ACH.map(a => Object.assign({}, a, { at: unlocked[a.id] || 0 })),
    unlock, count: () => Object.keys(unlocked).length, total: () => ACH.length,
    stats: () => JSON.parse(JSON.stringify(stats)),
    reset: () => { unlocked = {}; stats = { games: [], classics: [], favs: [], dos: 0, clicks: 0, pokes: 0, minutes: 0, days: [], widgets: 0 }; LS.set(AKEY, unlocked); saveStats(); GH.emit('ach_reset'); }
  };
  const APPID = w => (/^app-/.test(w.id) ? w.id.slice(4) : w.id);
  function checkFiles() {
    if (!FS) return;
    const all = FS.all(); if (all.length) unlock('file_clerk');
    if (all.filter(m => m.parent === 'docs' && m.kind !== 'folder').length >= 10) unlock('packrat');
    if (all.some(m => m.kind === 'image')) unlock('artist');
  }
  GH.on((name, d) => {
    if (name === 'win_open') {
      const W = d; if (!W || (W.o && W.o.dialog)) return;
      unlock('first_steps'); const id = APPID(W);
      if (id === 'chat' || W.id === 'chat-window') unlock('chatterbox');
      if (id === 'browser') unlock('surfer');
      if (id === 'arcade') unlock('arcade_goer');
      if (Array.from(wins.values()).filter(w => w.visible && !w.minimized && !w.o.dialog).length >= 5) unlock('multitasker');
    } else if (name === 'game') {
      unlock('first_game'); addTo(stats.games, d.url); if (d.classic) addTo(stats.classics, d.url); saveStats();
      if (stats.games.length >= 5) unlock('sampler'); if (stats.games.length >= 12) unlock('explorer');
      if (catalog.classics.length && catalog.classics.every(c => stats.classics.indexOf(c.url) >= 0)) unlock('classic_fan');
    } else if (name === 'random') unlock('lucky');
    else if (name === 'fav') { unlock('favorite'); setTimeout(() => { if (GH.favoritesCount() >= 3) unlock('collector'); }, 50); }
    else if (name === 'slot:save') unlock('save_slot');
    else if (name === 'slot:load') unlock('load_slot');
    else if (name === 'setting' && /^(scheme|desktopColor|wallpaper|titleGradient|crt|saver)$/.test(d.key)) unlock('decorator');
    else if (name === 'find') unlock('searcher');
    else if (name === 'run') unlock('runner');
    else if (name === 'taskman') unlock('taskman');
    else if (name === 'minall') unlock('desktop_clean');
    else if (name === 'saver') unlock('saver');
    else if (name === 'shutdown') unlock('shutdown');
    else if (name === 'fs:import') unlock('importer');
    else if (name === 'fs:paste') unlock('copycat');
    else if (name === 'wordpad:save') unlock('writer');
    else if (name === 'soundrec:save') unlock('recorder');
    else if (name === 'media:play') unlock('dj');
    else if (name === 'defrag:complete') unlock('defragger');
    else if (name === 'phone:dial') unlock('dialer');
    else if (name === 'calendar:note') unlock('planner');
    else if (name === 'charmap:copy') unlock('symbols');
    else if (name === 'dos:md') unlock('dos_mkdir');
    else if (name === 'dos:xyzzy') unlock('xyzzy');
    else if (/^dos:/.test(name) && !/^dos:(win:|textgame)/.test(name)) { stats.dos++; saveStats(); if (stats.dos >= 10) unlock('dos_user'); }
    else if (/^(dos:)?win:adventure$/.test(name)) unlock('text_adv');
    else if (/^(dos:)?win:(hangman|scramble)$/.test(name)) unlock('word_nerd');
    else if (/^(dos:)?win:blackjack$/.test(name)) unlock('high_roller');
    else if (name === 'win:freecell') unlock('freecell');
    else if (name === 'win:reversi') unlock('reversi');
    else if (name === 'tapey:talk') unlock('tapey_hi');
    else if (name === 'tapey:click') { stats.clicks++; saveStats(); if (stats.clicks >= 20) unlock('tapey_fan'); }
    else if (name === 'tapey:poke') { stats.pokes++; saveStats(); if (stats.pokes >= 3) unlock('tapey_angry'); }
    else if (name === 'tapey:dance') unlock('tapey_dance');
    else if (name === 'widget:add') { unlock('widget_fan'); if (GH.widgets && GH.widgets.count() >= 4) unlock('widget_wall'); }
    if (/^dos:tapey$/.test(name)) unlock('tapey_hi');
  });
  if (FS) { FS.ready().then(() => { checkFiles(); FS.onChange(() => setTimeout(checkFiles, 200)); }); }
  /* visits, play time, night owl, cheat code */
  (function () {
    const today = new Date().toISOString().slice(0, 10);
    if (addTo(stats.days, today)) { stats.days = stats.days.slice(-60); saveStats(); }
    if (stats.days.length >= 5) unlock('regular');
    const tickA = () => {
      if (!D.hidden) { stats.minutes += 0.5; saveStats(); if (stats.minutes >= 120) unlock('marathon'); }
      const hr = new Date().getHours(); if (hr < 4) unlock('night_owl');
    };
    setInterval(tickA, 30000); setTimeout(tickA, 4000);
    const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']; let pos = 0;
    D.addEventListener('keydown', e => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || '') || (e.target && e.target.isContentEditable)) { pos = 0; return; }
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === code[pos]) { pos++; if (pos === code.length) { pos = 0; unlock('konami'); GH.tapey && GH.tapey.dance('↑↑↓↓←→←→BA — 30 extra lives!'); } } else pos = k === code[0] ? 1 : 0;
    });
  })();

  /* ===================================================================
   *  TAPEY: the tape-roll desktop assistant
   *  - dialogs live in images/tapey-dialogs.js (pools of lines, filtered by personality)
   *  - 20 poses (images/tapey/tapey-*.svg, 128x128), rendered inline so the pupils can move
   * =================================================================== */
  const POSES = ['idle', 'blink', 'wave', 'think', 'idea', 'point', 'excited', 'celebrate', 'sleep', 'confused', 'sad', 'shocked', 'search', 'write', 'read', 'love', 'angry', 'cool', 'dance', 'flag'];
  const TKEY = 'gh-tapey-v2';
  const TDEF = {
    enabled: true, tone: 'c', userName: '',
    size: 96, opacity: 100, hue: 0, saturate: 100, flip: false, shadow: true, glow: false,
    onTop: true, snap: true, hideSmall: false, pos: null,
    balloon: 'classic', fontSize: 13, balloonPos: 'auto', readSpeed: 100, showClose: true,
    eyes: true, eyeStrength: 100, eyeSmooth: 55, eyeFrames: true, crossEyed: true, eyeBlink: true,
    bob: true, blink: true, poseAnim: true, sleep: true, sleepAfter: 150,
    chatty: 60, interval: 150, greeting: true, reactions: true, appTips: true, gameTips: true, achTalk: true, clippyOffers: true,
    quietGames: true, quietDialogs: true,
    catTip: true, catJoke: true, catFact: true, catChat: true, catCompliment: true, catNudge: true, catContext: true,
    sounds: false, soundVol: 40, voicePitch: 100
  };
  let T = Object.assign({}, TDEF, LS.get(TKEY, {}) || {});
  if (!(T.tone in { c: 1, s: 1, w: 1, n: 1, q: 1 })) T.tone = 'c';
  const tsubs = [];
  const saveT = () => LS.set(TKEY, T);
  const TS = LS.get('gh-tapey-state-v1', null) || { seen: {}, muted: {}, played: {}, visits: 0, eyesIntro: false, firstRun: true };
  const saveTS = () => LS.set('gh-tapey-state-v1', TS);
  if (!sessionStorage.getItem('gh-tapey-session')) { try { sessionStorage.setItem('gh-tapey-session', '1'); } catch (e) {} TS.visits++; saveTS(); }
  const SESSION_START = Date.now();

  /* ---- dialog data ---- */
  let DLG = null; const parsed = {}; const recent = [];
  const FALLBACK = { pools: { 'greet.back': ['Welcome back! ~wave'], 'idle.tip': ['Right-click the desktop for widgets. ~idea'], 'tp.menu.title': ['What would you like to do?'], 'tp.poke': ['Hi! ~wave'], 'tp.noresults': ['Nothing found. ~confused'], 'tp.results': ['Here you go:'] }, intents: [], help: [] };
  function loadScript(src) { return new Promise(res => { const sc = D.createElement('script'); sc.src = src; sc.async = true; sc.onload = () => res(true); sc.onerror = () => res(false); D.head.append(sc); }); }
  function loadDialogs() {
    return (window.TAPEY_DIALOGS ? Promise.resolve(true) : loadScript('images/tapey-dialogs.js')).then(ok => {
      if (!ok || !window.TAPEY_DIALOGS) { DLG = FALLBACK; return; }
      return loadScript('images/tapey-dialogs-more.js').then(() => { DLG = window.TAPEY_DIALOGS; });
    });
  }
  const ENTRY_RX = /^(?:([csnwq]):\s*)?([\s\S]*?)(?:\s+~([a-z]+))?\s*$/;
  function pool(name) {
    if (parsed[name]) return parsed[name];
    const src = (DLG && DLG.pools && DLG.pools[name]) || []; const out = [];
    src.forEach(s => { const m = ENTRY_RX.exec(s); if (m) out.push({ tone: m[1] || '', t: m[2], pose: m[3] && POSES.indexOf(m[3]) >= 0 ? m[3] : '' }); });
    return (parsed[name] = out);
  }
  const hasPool = n => pool(n).length > 0;
  /* ---- context: what is the user doing right now? ---- */
  function themeName() { const s = String(S().scheme || 'standard'); return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' '); }
  function visibleWins() { return Array.from(wins.values()).filter(w => w.visible && !w.minimized && !(w.o && w.o.dialog)); }
  function activeWin() { return Array.from(wins.values()).find(w => w.el && w.el.classList.contains('active') && !(w.o && w.o.dialog)) || null; }
  const isGameWin = w => !!(w && /^game-win-/.test(w.id));
  function gameTitle(w) { return (w && w.title) || ''; }
  let lastGame = '', lastBattery = null, online = navigator.onLine;
  try { navigator.getBattery && navigator.getBattery().then(b => { lastBattery = b; }); } catch (e) {}
  window.addEventListener('online', () => { online = true; }); window.addEventListener('offline', () => { online = false; });
  function ctx(extra) {
    const now = new Date(), hr = now.getHours();
    const c = {
      part: hr < 5 ? 'night' : hr < 12 ? 'morning' : hr < 18 ? 'afternoon' : hr < 22 ? 'evening' : 'night', hour: hr,
      time: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), day: now.toLocaleDateString([], { weekday: 'long' }),
      visits: TS.visits, min: Math.max(1, Math.round((Date.now() - SESSION_START) / 60000)), ach: GH.ach.count(), total: GH.ach.total(),
      wins: visibleWins().length, files: FS ? FS.all().length : 0, theme: themeName(), game: lastGame, app: '', n: Object.keys(TS.played || {}).length, user: T.userName || '', ver: GH.version || ''
    };
    return Object.assign(c, extra || {});
  }
  const fill = (s, c) => String(s).replace(/\{(\w+)\}/g, (m, k) => (c[k] != null && c[k] !== '' ? c[k] : (k === 'game' ? 'this game' : k === 'app' ? 'this' : k === 'theme' ? 'this theme' : '')));
  /* pick a line from a pool, honoring personality and avoiding repeats */
  function pickLine(name, c) {
    let list = pool(name); if (!list.length) return null;
    const tone = T.tone;
    let el = list.filter(e => tone === 'q' ? (e.tone === 'q' || (!e.tone && e.t.length <= 52)) : (!e.tone || e.tone === tone || (e.tone === 'c' && false)));
    if (!el.length) el = list.filter(e => !e.tone);
    if (!el.length) return null;
    let fresh = el.filter(e => recent.indexOf(e.t) < 0); if (!fresh.length) fresh = el;
    const weighted = []; fresh.forEach(e => { const w = e.tone === tone ? 3 : 1; for (let i = 0; i < w; i++) weighted.push(e); });
    const e = pick(weighted); recent.push(e.t); if (recent.length > 60) recent.shift();
    return { text: fill(e.t, c || ctx()), pose: e.pose };
  }

  /* ---- DOM ---- */
  const desk = $('#desktop');
  const root = h('div', { id: 'tapey', class: 'bob', role: 'complementary', 'aria-label': 'Tapey the tape roll, desktop assistant', hidden: true });
  const art = h('div', { class: 'tp-art', style: { width: '100%', height: '100%' } });
  const body = h('button', { type: 'button', class: 'tp-body', 'aria-label': 'Tapey. Press Enter to ask for help.', title: 'Tapey (click for help, drag to move)' }, art);
  root.append(body); D.body.append(root);
  let bal = null, balTimer = 0, curPose = 'idle', basePose = 'idle', poseTimer = 0, speaking = false, sleeping = false, lastSpoke = 0, lastActivity = Date.now();
  const svgCache = {}, svgLoading = {};
  function loadSvg(name) {
    if (svgCache[name]) return Promise.resolve(svgCache[name]);
    if (svgLoading[name]) return svgLoading[name];
    return (svgLoading[name] = fetch('images/tapey/tapey-' + name + '.svg').then(r => r.ok ? r.text() : Promise.reject()).then(t => {
      const doc = new DOMParser().parseFromString(t, 'image/svg+xml'), el = doc.documentElement;
      if (!el || el.nodeName.toLowerCase() !== 'svg') throw 0;
      const node = D.importNode(el, true); node.setAttribute('width', '100%'); node.setAttribute('height', '100%'); node.setAttribute('aria-hidden', 'true'); node.style.display = 'block'; node.style.overflow = 'visible';
      // unique gradient ids per pose so inline SVGs never collide
      const html = node.outerHTML.replace(/id="(tg|cg)"/g, (m, i) => 'id="' + i + '-' + name + '"').replace(/url\(#(tg|cg)\)/g, (m, i) => 'url(#' + i + '-' + name + ')');
      const holder = D.createElement('div'); holder.innerHTML = html; return (svgCache[name] = holder.firstChild);
    }).catch(() => { delete svgLoading[name]; return null; }));
  }
  let pupils = [];
  function renderPose(name) {
    curPose = name;
    return loadSvg(name).then(node => {
      if (curPose !== name) return;
      if (!node) { art.replaceChildren(h('img', { src: 'images/tapey/tapey-' + name + '.svg', alt: '', draggable: 'false', style: { width: '100%', height: '100%' } })); pupils = []; return; }
      art.replaceChildren(node);
      pupils = Array.from(node.querySelectorAll('.pupil')).map(p => {
        const eyeEl = p.parentNode.querySelector('ellipse'), face = p.closest('.face');
        return { el: p, eye: eyeEl, bx: +p.dataset.bx || 0, by: +p.dataset.by || 0, mx: +p.dataset.mx || 4, my: +p.dataset.my || 5, rot: face ? (+face.dataset.rot || 0) : 0, cx: 0, cy: 0 };
      });
      applyEyes(true);
    });
  }
  function setPose(name, hold) {
    if (POSES.indexOf(name) < 0) name = 'idle';
    clearTimeout(poseTimer);
    if (!T.poseAnim && name !== 'sleep' && name !== 'idle') name = 'idle';
    basePose = name; renderPose(name);
    if (hold && name !== 'idle') poseTimer = setTimeout(() => { if (!sleeping) setPose('idle'); }, hold);
  }
  /* ---- eye tracking ---- */
  let tx = innerWidth / 2, ty = innerHeight / 2, lastMove = 0, shakeAcc = 0, shakeAt = 0, eyeRaf = 0, hoverSince = 0, lastEyeLine = 0, px0 = null, py0 = null;
  function setTarget(x, y) {
    tx = x; ty = y; lastMove = Date.now();
    if (px0 != null) { shakeAcc += Math.abs(x - px0) + Math.abs(y - py0); }
    px0 = x; py0 = y;
    if (!eyeRaf) eyeRaf = requestAnimationFrame(eyeStep);
  }
  D.addEventListener('pointermove', e => setTarget(e.clientX, e.clientY), { passive: true, capture: true });
  D.addEventListener('pointerdown', e => setTarget(e.clientX, e.clientY), { passive: true, capture: true });
  function watchFrame(fr) {
    try {
      const w = fr.contentWindow; if (!w || w.__tpEyes) return; w.__tpEyes = true;
      const f = e => { if (!T.eyes || !T.eyeFrames) return; const r = fr.getBoundingClientRect(); setTarget(e.clientX + r.left, e.clientY + r.top); };
      w.addEventListener('pointermove', f, { passive: true });
    } catch (e) { /* cross-origin frame: eyes simply stop following inside it */ }
  }
  D.addEventListener('load', e => { if (e.target && e.target.tagName === 'IFRAME') watchFrame(e.target); }, true);
  setInterval(() => { D.querySelectorAll('iframe').forEach(watchFrame); }, 4000);
  function applyEyes(snap) {
    if (!pupils.length) return;
    const size = root.getBoundingClientRect().width || T.size, k = clampN(T.eyeStrength, 0, 100) / 100;
    pupils.forEach(p => {
      if (!p.eye) return;
      const r = p.eye.getBoundingClientRect(); const ex = r.left + r.width / 2, ey = r.top + r.height / 2;
      let dx = tx - ex, dy = ty - ey; const dist = Math.hypot(dx, dy) || 1;
      let mag = T.eyes ? Math.min(1, dist / (size * (T.crossEyed ? 0.7 : 1.4))) : 0;
      let ux = dx / dist * mag, uy = dy / dist * mag;
      if (T.flip) ux = -ux;
      // undo the face rotation and the mirror so the pupil moves toward the cursor on screen
      const a = -p.rot * Math.PI / 180, rx = ux * Math.cos(a) - uy * Math.sin(a), ry = ux * Math.sin(a) + uy * Math.cos(a);
      const tr = T.eyes ? 1 : 0, wantX = p.bx * (1 - k * tr) + rx * p.mx * k * tr, wantY = p.by * (1 - k * tr) + ry * p.my * k * tr;
      const sm = snap ? 0 : clampN(T.eyeSmooth, 0, 95) / 100;
      p.cx += (wantX - p.cx) * (1 - sm); p.cy += (wantY - p.cy) * (1 - sm);
      if (snap) { p.cx = wantX; p.cy = wantY; }
      p.el.setAttribute('transform', 'translate(' + p.cx.toFixed(2) + ' ' + p.cy.toFixed(2) + ')');
      p._done = Math.abs(wantX - p.cx) < 0.05 && Math.abs(wantY - p.cy) < 0.05;
    });
  }
  function eyeStep() {
    eyeRaf = 0;
    if (root.hidden || sleeping || D.hidden) return;
    applyEyes(false);
    if (pupils.some(p => !p._done) || Date.now() - lastMove < 200) eyeRaf = requestAnimationFrame(eyeStep);
    // hovering over Tapey / wiggling the mouse
    const r = root.getBoundingClientRect(), over = tx >= r.left && tx <= r.right && ty >= r.top && ty <= r.bottom, now = Date.now();
    if (over && !dragging) { if (!hoverSince) hoverSince = now; else if (now - hoverSince > 4000 && now - lastEyeLine > 90000 && !balOpen()) { lastEyeLine = now; react('eyes.close', {}, { chance: 1, kind: 'eyes' }); } } else hoverSince = 0;
    if (now - shakeAt > 1500) { if (shakeAcc > 5200 && now - lastEyeLine > 60000 && !dragging && !balOpen() && T.eyes) { lastEyeLine = now; react('eyes.shake', {}, { chance: 1, kind: 'eyes' }); } shakeAcc = 0; shakeAt = now; }
  }
  const clampN = (v, a, b) => Math.max(a, Math.min(b, +v || 0));

  /* ---- layout / position ---- */
  const taskH = () => { const t = $('#taskbar'); return t && t.offsetHeight ? t.offsetHeight : 28; };
  function defaultPos() { return { c: 'br', ox: 18, oy: 14 }; }
  function place() {
    const s = clampN(T.size, 48, 200), p = T.pos || defaultPos(), W = innerWidth, Hh = innerHeight - (H.classList.contains('taskbar-autohide') ? 0 : taskH());
    let x = p.c[1] === 'r' ? W - s - p.ox : p.ox, y = p.c[0] === 'b' ? Hh - s - p.oy : p.oy;
    x = clampN(x, 0, Math.max(0, W - s)); y = clampN(y, 0, Math.max(0, Hh - s));
    root.style.left = x + 'px'; root.style.top = y + 'px'; root.style.right = 'auto'; root.style.bottom = 'auto';
  }
  function styleT() {
    root.style.setProperty('--tp-size', clampN(T.size, 48, 200) + 'px'); root.style.width = clampN(T.size, 48, 200) + 'px';
    root.style.opacity = String(clampN(T.opacity, 25, 100) / 100);
    const f = []; if (T.hue) f.push('hue-rotate(' + (+T.hue) + 'deg)'); if (T.saturate !== 100) f.push('saturate(' + (+T.saturate / 100) + ')'); if (T.glow) f.push('drop-shadow(0 0 8px rgba(255,235,120,.9))');
    art.style.filter = f.join(' '); art.style.transform = T.flip ? 'scaleX(-1)' : '';
    root.classList.toggle('bob', !!T.bob && !rm()); body.querySelectorAll('svg,img').forEach(n => { n.style.filter = T.shadow ? 'drop-shadow(1px 3px 2px rgba(0,0,0,.35))' : 'none'; });
    root.style.zIndex = T.onTop ? '9500' : '1';
    if (T.onTop) { if (root.parentNode !== D.body) { D.body.append(root); root.style.position = 'fixed'; } } else if (desk && root.parentNode !== desk) { desk.append(root); root.style.position = 'absolute'; }
    root.style.setProperty('--tp-fs', clampN(T.fontSize, 10, 22) + 'px');
    if (bal) bal.dataset.theme = T.balloon;
    const small = innerWidth < 640 && T.hideSmall;
    root.hidden = !T.enabled || small;
    place();
  }
  window.addEventListener('resize', () => { place(); });
  /* ---- balloon themes (extra css) ---- */
  const bcss = D.createElement('style'); bcss.textContent = `
  .tp-bal{font-size:var(--tp-fs,13px)}
  .tp-bal[data-theme=white]{background:#fff}.tp-bal[data-theme=dark]{background:#1e1e1e;color:#eee;border-color:#888}.tp-bal[data-theme=dark]::after{border-top-color:#888}
  .tp-bal[data-theme=pink]{background:#ffd9ec}.tp-bal[data-theme=blue]{background:#d6ecff}
  .tp-bal[data-theme=terminal]{background:#000;color:#3f3;border:1px solid #3f3;font-family:"Courier New",monospace}.tp-bal[data-theme=terminal]::after{border-top-color:#3f3}
  .tp-bal[data-theme=dark] .tp-x,.tp-bal[data-theme=terminal] .tp-x{color:inherit}
  #tapey.drag .tp-body{cursor:grabbing}#tapey.sleeping .tp-body{opacity:.85}
  .tp-bal.below::after{border-top-color:transparent}
  .tp-bal[data-theme=dark].below::after{border-bottom-color:#888}.tp-bal[data-theme=terminal].below::after{border-bottom-color:#3f3}
  `; D.head.append(bcss);

  /* ---- sounds (optional, tiny synthesized blips; also needs the browser to allow audio) ---- */
  let actx = null;
  function blip(kind) {
    if (!T.sounds) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume();
      const v = clampN(T.soundVol, 0, 100) / 100 * 0.12, f0 = 520 * (T.voicePitch / 100), t0 = actx.currentTime;
      const seq = kind === 'cheer' ? [1, 1.25, 1.5, 2] : kind === 'sad' ? [1, 0.84, 0.7] : kind === 'poke' ? [1.4, 1.1] : [1, 1.2];
      seq.forEach((m, i) => { const o = actx.createOscillator(), g = actx.createGain(); o.type = 'triangle'; o.frequency.value = f0 * m; g.gain.setValueAtTime(0.0001, t0 + i * 0.08); g.gain.exponentialRampToValueAtTime(v, t0 + i * 0.08 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.08 + 0.12); o.connect(g); g.connect(actx.destination); o.start(t0 + i * 0.08); o.stop(t0 + i * 0.08 + 0.14); });
    } catch (e) {}
  }

  /* ---- balloon ---- */
  const balOpen = () => !!bal;
  function closeBal(returnPose) {
    clearTimeout(balTimer); if (bal) { bal.remove(); bal = null; }
    speaking = false; if (returnPose !== false && !sleeping && basePose !== 'idle' && !poseTimer) setPose('idle');
  }
  function say(text, o) {
    o = o || {}; if (!T.enabled || root.hidden) return null;
    closeBal(false); clearTimeout(poseTimer);
    const c = h('div', { class: 'tp-t', text: text }); bal = h('div', { class: 'tp-bal', role: 'status', 'aria-live': 'polite', 'data-theme': T.balloon }, c);
    if (T.showClose || o.actions || o.input) bal.append(h('button', { type: 'button', class: 'tp-x', 'aria-label': 'Close speech balloon', text: '×', on: { click: () => closeBal() } }));
    if (o.title) bal.insertBefore(h('div', { class: 'tp-h', text: o.title }), c);
    let inputEl = null;
    if (o.input) {
      inputEl = h('input', { type: 'text', class: 'tp-in', placeholder: o.placeholder || '', 'aria-label': o.placeholder || 'Ask Tapey', enterkeyhint: 'search', autocomplete: 'off', spellcheck: 'false' });
      inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); o.input(inputEl.value.trim()); } else if (e.key === 'Escape') { e.stopPropagation(); closeBal(); } });
      bal.append(inputEl);
    }
    if (o.actions && o.actions.length) {
      const a = h('div', { class: 'tp-a' });
      o.actions.forEach(x => a.append(h('button', { type: 'button', text: x.label, on: { click: () => { if (!x.keep) closeBal(false); x.fn && x.fn(); } } })));
      bal.append(a);
    }
    bal.addEventListener('keydown', e => { if (e.key === 'Escape') { closeBal(); body.focus(); } });
    root.append(bal); placeBal();
    speaking = true; lastSpoke = Date.now();
    setPose(o.pose || 'idle', 0); blip(/celebrate|excited|dance|love/.test(o.pose || '') ? 'cheer' : /sad|angry/.test(o.pose || '') ? 'sad' : 'talk');
    if (inputEl) setTimeout(() => inputEl.focus(), 30);
    const sticky = o.sticky || o.input || (o.actions && o.actions.length);
    if (!sticky && o.ttl !== 0) {
      const ms = (o.ttl || (2600 + text.length * 55)) * (clampN(T.readSpeed, 40, 300) / 100);
      const arm = () => { clearTimeout(balTimer); balTimer = setTimeout(() => { if (bal && (bal.matches(':hover') || bal.contains(D.activeElement))) { arm(); return; } closeBal(); }, ms); };
      arm();
    }
    return bal;
  }
  function placeBal() {
    if (!bal) return; const r = root.getBoundingClientRect(); bal.classList.remove('l', 'r', 'below');
    bal.classList.add(r.left + r.width / 2 < innerWidth / 2 ? 'l' : 'r');
    const below = T.balloonPos === 'below' || (T.balloonPos === 'auto' && r.top < 170); if (T.balloonPos === 'above') bal.classList.remove('below'); else if (below) bal.classList.add('below');
  }
  /* ---- when may Tapey talk? ---- */
  function openDialogs() { return Array.from(wins.values()).some(w => w.o && w.o.dialog && w.visible); }
  function canSpeak(kind) {
    if (!T.enabled || root.hidden || sleeping && kind !== 'user') return false;
    if (kind === 'user') return true;
    if (T.tone === 'q' && !/^(greet|ach|crash|shutdown|eyes0)$/.test(kind)) return false;
    if (T.quietGames && isGameWin(activeWin()) && !/^(ach|crash|shutdown|greet)$/.test(kind)) return false;
    if (T.quietDialogs && openDialogs() && !/^(crash|ach)$/.test(kind)) return false;
    if (balOpen() && !/^(ach|crash|shutdown|user)$/.test(kind)) return false;
    return true;
  }
  /* say a line from a pool; chance (0..1) is scaled by the chattiness setting */
  function react(poolName, extra, o) {
    o = o || {}; if (!T.enabled) return false;
    if (o.kind !== 'user' && o.kind !== 'ach' && o.kind !== 'crash' && o.chance !== 1) { if (Math.random() > (o.chance == null ? 1 : o.chance) * (T.chatty / 70)) return false; }
    if (!canSpeak(o.kind || 'react')) return false;
    const c = ctx(extra), L = pickLine(poolName, c); if (!L) return false;
    let text = L.text; if (T.userName && /^greet\./.test(poolName) && Math.random() < 0.45) text = text.replace(/^(Good (?:morning|afternoon|evening)|Welcome back|Hi there|Hello)(!?)/, (m, a) => a + ', ' + T.userName + '!');
    say(text, Object.assign({ pose: L.pose || o.pose || 'idle' }, o.say || {})); return true;
  }
  const afterDelay = (fn, ms) => setTimeout(fn, rm() ? Math.min(ms, 400) : ms);

  /* ---- search / menu ---- */
  function scoreItem(it, toks) {
    const title = String(it.title || '').toLowerCase(), kw = (String(it.keywords || '') + ' ' + String(it.desc || '') + ' ' + String(it.type || '')).toLowerCase(); let sc = 0;
    toks.forEach(t => { if (title === t) sc += 8; else if (title.indexOf(t) === 0) sc += 6; else if (title.indexOf(t) >= 0) sc += 4; if (kw.indexOf(t) >= 0) sc += 1.5; });
    return sc;
  }
  function runOpen(o) {
    if (!o) return;
    if (o === 'action:random') return GH.randomGame();
    if (o === 'action:widgets') return GH.widgets.menu();
    if (o === 'action:taskman') return GH.openItem('app:taskmgr');
    if (o === 'action:find') return GH.openFind();
    if (o === 'action:library') return GH.openItem('app:library');
    if (/^(app|game|sys|folder):/.test(o)) return GH.openItem(o);
  }
  let pending = null;
  function bestItem(name, onlyGames) {
    const toks = String(name).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(t => t.length > 1 && !/^(the|a|an|my|up|app|game|please|me|to)$/.test(t)); if (!toks.length) return null;
    let best = null, bs = 0;
    ITEMS.forEach(it => { if (!it || !it.id || it.vfs || !/^(app|game|sys|folder):/.test(it.id)) return; if (onlyGames && !/^game:/.test(it.id)) return; const s = scoreItem(it, toks); if (s > bs) { bs = s; best = it; } });
    return bs >= 4 ? best : null;
  }
  function tryCalc(low) {
    let e = low.replace(/^(what is|what's|whats|calculate|calc|solve|compute|how much is|=)\s*/, '').replace(/(\d+(?:\.\d+)?)\s*%\s*of\s*(\d+(?:\.\d+)?)/g, '(($1/100)*$2)').replace(/\?+$/, '').replace(/\bplus\b/g, '+').replace(/\bminus\b/g, '-').replace(/\b(times|multiplied by)\b/g, '*').replace(/\b(divided by|over)\b/g, '/').replace(/[×x](?=\s*[\d(])/g, '*').replace(/÷/g, '/').replace(/\^/g, '**').replace(/,/g, '');
    if (!/^[\d\s+\-*/().%]+$/.test(e) || !/\d/.test(e) || !/[+\-*/%]/.test(e.replace(/^\s*-/, ''))) return null;
    if (/[*/+\-]{4,}|\*\*\s*\d{3,}/.test(e)) return null;
    try { const v = Function('"use strict";return (' + e.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)') + ')')(); if (typeof v !== 'number' || !isFinite(v)) return 'NaN'; return String(+v.toPrecision(12)); } catch (x) { return 'NaN'; }
  }
  function sayPool(pn, extra, o) { const L = pickLine(pn, ctx(extra)); if (!L) return false; say(L.text, Object.assign({ pose: L.pose || 'idle' }, o || {})); return true; }
  function runAct(it, low, m) {
    const act = it.act || '';
    if (act === 'quiet') { sayPool(it.pool); setTimeout(() => setT({ tone: 'q' }, true), 50); return true; }
    if (act === 'chatty') { setT({ chatty: Math.min(100, T.chatty + 25), interval: Math.max(30, T.interval - 45) }, true); sayPool(it.pool); return true; }
    if (act === 'bigger' || act === 'smaller') { setT({ size: clampN(T.size + (act === 'bigger' ? 24 : -24), 48, 200) }, true); sayPool(it.pool); return true; }
    if (/^tone:/.test(act)) { setT({ tone: act.slice(5) }); return true; }
    if (act === 'eyes') { setT({ eyes: !/off|stop/.test(low) }); return true; }
    if (act === 'coin') return sayPool(Math.random() < 0.5 ? 'tp.say.coin.heads' : 'tp.say.coin.tails');
    if (act === 'dice') { const mm = /d(\d+)/.exec(low); const n = mm ? Math.max(2, Math.min(1000, +mm[1])) : 6; return sayPool('tp.say.dice', { x: 1 + Math.floor(Math.random() * n) }); }
    if (act === 'number') { const mm = /between (\d+) and (\d+)/.exec(low); let a = 1, b = 100; if (mm) { a = Math.min(+mm[1], +mm[2]); b = Math.max(+mm[1], +mm[2]); } return sayPool('tp.say.number', { x: a + Math.floor(Math.random() * (b - a + 1)) }); }
    if (act === 'open' || act === 'play') {
      const name = low.replace(/^(open|launch|start|run|go to|show me|take me to|play|let'?s play|i want to play|i wanna play)\s+/, ''); const hit = bestItem(name, act === 'play');
      if (!hit) { if (act === 'play') { sayPool('tp.say.notfound', { x: name }); return true; } return false; }
      sayPool('tp.say.open', { x: hit.title }, { ttl: 2600 }); setTimeout(() => GH.openItem(hit.id), 500); return true;
    }
    if (act === 'about') {
      const name = (m && m[m.length - 1]) || ''; const hit = bestItem(name, false); if (!hit || !hit.desc) return false;
      say(fill('{x}: {y}', { x: hit.title, y: hit.desc }), { pose: 'read', actions: [{ label: 'Open ' + hit.title, fn: () => GH.openItem(hit.id) }] }); return true;
    }
    return false;
  }
  function ask(q) {
    q = String(q || '').trim(); if (!q) return;
    GH.emit('tapey:talk'); const low = q.toLowerCase().replace(/[!.]+$/g, '').trim(), c = ctx();
    if (pending && Date.now() - pending.t > 90000) pending = null;
    if (pending) {
      const p = pending.s; pending = null;
      if (p === 'knock1') { pending = { s: 'knock2', t: Date.now() }; const L = pickLine('tp.say.knock.2', ctx({ x: q.replace(/[?.!]+$/, '') })); return say(L ? L.text : '…who?', { pose: 'think', input: ask, placeholder: 'Finish the joke…', sticky: true }); }
      if (p === 'knock2') return sayPool('tp.say.knock.3');
    }
    const calc = tryCalc(low); if (calc != null) return calc === 'NaN' ? sayPool('tp.say.calcfail') : sayPool('tp.say.calc', { x: calc });
    if (/^(joke|tell me a joke|make me laugh|another joke|one more joke|more jokes)\b/.test(low) || /\btell (me )?(a )?joke\b/.test(low)) return tellJoke();
    if (/^(tip|hint|advice|give me a tip|another tip|tips)\b/.test(low) || /\b(give|tell) me (a )?(tip|hint)\b/.test(low)) return tellTip();
    if (/^(fact|trivia|tell me a fact|fun fact|another fact)\b/.test(low) || /\b(fun fact|random fact|tell me a fact)\b/.test(low)) return tellFact();
    if (/\b(random game|surprise me|pick (a )?game|something to play|what should i play|recommend (a )?game|suggest (a )?game)\b/.test(low)) return GH.randomGame();
    if (/\b(dance|boogie|show me your moves)\b/.test(low)) return dance();
    if (/\b(hide|go away|leave me alone|disappear|vanish)\b/.test(low) && !/\bhide (the )?(window|icon)/.test(low)) return hideT(true);
    if (/\b(sleep|nap|go to sleep)\b/.test(low) && /^(go to |take a )?(sleep|nap)|you (should|can) (sleep|nap)/.test(low)) return gotoSleep();
    if (/\b(show|open|see) (my )?(stats|progress)\b/.test(low) || /^achievements?$/.test(low)) { GH.openItem('app:achievements'); return sayPool('tp.say.stats', { ach: GH.ach.count(), total: GH.ach.total(), min: ctx().min }); }
    for (const it of (DLG.intents || [])) {
      let re; try { re = new RegExp(it.re, 'i'); } catch (e) { continue; } const m = re.exec(low); if (!m) continue;
      if (it.state === 'knock1') { pending = { s: 'knock1', t: Date.now() }; const L = pickLine('tp.say.knock', c); return say(L ? L.text : "Who's there?", { pose: 'wave', input: ask, placeholder: 'Who\'s there? Type here…', sticky: true }); }
      if (it.act && runAct(it, low, m)) return;
      if (!it.act) { const L = pickLine(it.pool, ctx({ ver: GH.version || '' })); if (L) return say(L.text, { pose: L.pose || 'idle' }); }
    }
    const toks = low.replace(/[^a-z0-9💾🎲 ]+/g, ' ').split(/\s+/).filter(t => t.length > 1 && !/^(the|and|how|can|do|you|what|where|when|why|for|with|about|please|help|me|my|to|of|in|on|is|it|a|an|i|am|are|get|use|want|need|would|like)$/.test(t));
    if (!toks.length) return sayPool('tp.say.dontknow', {}, { actions: [{ label: 'Tell me a joke', fn: () => tellJoke() }, { label: 'Random game 🎲', fn: () => GH.randomGame() }] });
    const topics = (DLG.help || []).map(x => ({ x, s: toks.reduce((a, t) => a + (x.k.toLowerCase().split(' ').indexOf(t) >= 0 ? 4 : x.k.toLowerCase().indexOf(t) >= 0 ? 2 : 0) + (x.t.toLowerCase().indexOf(t) >= 0 ? 1 : 0), 0) })).filter(z => z.s >= 2).sort((a, b) => b.s - a.s).slice(0, 2);
    const items = Array.from(ITEMS.values()).filter(it => !it.vfs && it.id && !/^(file:)/.test(it.id)).map(it => ({ it, s: scoreItem(it, toks) })).filter(z => z.s >= 3).sort((a, b) => b.s - a.s).slice(0, 4);
    if (!topics.length && !items.length) return sayPool('tp.say.dontknow', {}, { pose: 'confused', actions: [{ label: 'Open Find…', fn: () => GH.openFind() }, { label: 'Random game 🎲', fn: () => GH.randomGame() }, { label: 'Tell me a joke', fn: () => tellJoke() }] });
    const actions = []; const seen = new Set();
    topics.forEach(z => { if (z.x.open && !seen.has(z.x.open)) { seen.add(z.x.open); actions.push({ label: 'Open: ' + labelFor(z.x.open), fn: () => runOpen(z.x.open) }); } });
    items.forEach(z => { if (!seen.has(z.it.id)) { seen.add(z.it.id); actions.push({ label: (/^game:/.test(z.it.id) ? '🎮 ' : '') + z.it.title, fn: () => GH.openItem(z.it.id) }); } });
    const intro = pickLine('tp.results', c);
    say(topics.length ? topics[0].x.t : (intro ? intro.text : 'Here you go:'), { pose: 'idea', actions: actions.slice(0, 5), title: topics.length && intro ? intro.text : '' });
  }
  function labelFor(o) { if (o === 'action:random') return 'Random Game'; if (o === 'action:widgets') return 'Widgets'; if (o === 'action:taskman') return 'Task Manager'; if (o === 'action:find') return 'Find'; if (o === 'action:library') return 'Project Library'; const it = ITEMS.get(o); return it ? it.title : o; }
  function menu() {
    GH.emit('tapey:talk'); const c = ctx(), L = pickLine('tp.menu.title', c), P = pickLine('tp.menu.placeholder', c);
    say(L ? L.text : 'What would you like to do?', {
      pose: 'wave', input: ask, placeholder: P ? P.text : 'Ask me something…', sticky: true,
      actions: [
        { label: '💡 Tip', fn: () => tellTip() }, { label: '😄 Tell me a joke', fn: () => tellJoke() },
        { label: '🎲 Random game', fn: () => GH.randomGame() }, { label: '🏆 Achievements', fn: () => GH.openItem('app:achievements') },
        { label: '🧩 Widgets…', fn: () => GH.widgets.menu() }, { label: '⚙ Tapey Settings…', fn: () => GH.openItem('app:tapey') }, { label: '🙈 Hide Tapey', fn: () => hideT(true) }]
    });
  }
  function tellJoke() { const c = ctx(), i = pickLine('idle.joke.intro', c), j = pickLine('idle.joke', c); if (!j) return; say((i ? i.text + '\n\n' : '') + j.text, { pose: j.pose || 'excited', actions: [{ label: 'Another one!', fn: () => tellJoke(), keep: false }], ttl: 0, sticky: true }); }
  function tellTip() { const c = ctx(Object.assign({ n: (TS.tipN = (TS.tipN || 0) + 1) })), i = pickLine('idle.tip.intro', c), j = pickLine('idle.tip', c); saveTS(); if (!j) return; say((i ? fill(i.text, c) + '\n' : '') + j.text, { pose: j.pose || 'idea', actions: [{ label: 'Another tip', fn: () => tellTip() }], sticky: true }); }
  function tellFact() { const j = pickLine('idle.fact'); if (j) say(j.text, { pose: j.pose || 'read', actions: [{ label: 'Another fact', fn: () => tellFact() }], sticky: true }); }
  function dance(text) { GH.emit('tapey:dance'); const L = pickLine('tp.dance'); sleeping = false; root.classList.remove('sleeping'); root.classList.add('dance'); say(text || (L ? L.text : 'Dance!'), { pose: 'dance', ttl: 4200 }); blip('cheer'); setTimeout(() => { root.classList.remove('dance'); setPose('idle'); }, 5200); }
  function gotoSleep() { if (sleeping) return; sleeping = true; closeBal(false); const L = pickLine('tp.sleep'); setPose('sleep'); root.classList.add('sleeping'); if (L && T.tone !== 'q') { /* a last mumble before dozing off */ const b = say(L.text, { pose: 'sleep', ttl: 2200 }); } }
  function wake(silent) {
    if (!sleeping) return; sleeping = false; root.classList.remove('sleeping'); setPose('idle');
    if (!silent && T.tone !== 'q' && T.reactions && Math.random() < 0.8) { const L = pickLine('tp.wake'); if (L) say(L.text, { pose: L.pose || 'shocked' }); }
  }
  function hideT(say_) {
    if (say_ && T.tone !== 'q') { const L = pickLine('tp.hide'); if (L) { say(L.text, { pose: L.pose || 'wave', ttl: 3500 }); setTimeout(() => setT({ enabled: false }), 3600); return; } }
    setT({ enabled: false });
  }
  function showT() {
    if (!T.enabled) setT({ enabled: true });
    setTimeout(() => { if (T.tone !== 'q') { const L = pickLine('tp.show'); if (L) say(L.text, { pose: L.pose || 'excited' }); } }, 200);
  }
  /* ---- settings API ---- */
  function setT(o, silent) {
    const before = Object.assign({}, T); Object.keys(o).forEach(k => { if (k in TDEF) T[k] = o[k]; }); saveT();
    styleT(); if (!T.eyes) applyEyes(true); else if (!eyeRaf) eyeRaf = requestAnimationFrame(eyeStep);
    if (before.enabled !== T.enabled && !T.enabled) closeBal(false);
    if (!T.sleep && sleeping) wake(true);
    if (!T.blink) { /* nothing */ }
    tsubs.slice().forEach(f => { try { f(T, before); } catch (e) {} });
    if (!silent) {
      if (o.tone && o.tone !== before.tone) { const L = pickLine('tp.tone'); if (L) say(L.text, { pose: L.pose || 'wave' }); }
      else if (o.eyes != null && o.eyes !== before.eyes) { const L = pickLine(o.eyes ? 'tp.eyes.on' : 'tp.eyes.off'); if (L) say(L.text, { pose: L.pose || 'search' }); }
      else if (o.size != null && o.size !== before.size) { /* resizing live: stay quiet while dragging a slider */ }
    }
    GH.emit('tapey:settings');
  }
  GH.tapey = {
    get: () => Object.assign({}, T), defaults: () => Object.assign({}, TDEF), set: (k, v, silent) => setT({ [k]: v }, silent), setMany: (o, silent) => setT(o, silent),
    reset: () => { const keep = { enabled: T.enabled }; T = Object.assign({}, TDEF, keep); saveT(); styleT(); const L = pickLine('tp.reset'); tsubs.slice().forEach(f => f(T, T)); if (L) say(L.text, { pose: L.pose || 'excited' }); },
    resetPosition: () => { setT({ pos: null }, true); },
    show: showT, hide: () => hideT(false), toggle: () => (T.enabled ? hideT(true) : showT()), isOn: () => T.enabled,
    say: (t, o) => say(t, o), pose: (n, ms) => { wake(true); setPose(n, ms || 3500); }, poses: POSES.slice(), menu, ask, joke: tellJoke, tip: tellTip, fact: tellFact, dance, sleep: gotoSleep, wake: () => wake(false),
    test: () => { const L = pickLine(pickRand(['idle.chat', 'idle.joke', 'idle.compliment'])); const C = pickLine('tp.test'); say((C ? C.text + '\n\n' : '') + (L ? L.text : ''), { pose: L && L.pose || 'wave' }); },
    tones: () => (DLG && DLG.tones) || {}, stats: () => ({ seen: Object.assign({}, TS.seen), visits: TS.visits, lines: DLG ? Object.keys(DLG.pools).reduce((a, k) => a + DLG.pools[k].length, 0) : 0, pools: DLG ? Object.keys(DLG.pools).length : 0 }),
    forgetTips: () => { TS.seen = {}; TS.muted = {}; saveTS(); }, onChange: fn => { tsubs.push(fn); return () => { const i = tsubs.indexOf(fn); if (i >= 0) tsubs.splice(i, 1); }; }, ready: () => dlgReady
  };
  const pickRand = pick;
  /* ---- interaction: click, drag, keyboard ---- */
  let dragging = false, clicks = [], pokeAngry = 0;
  body.addEventListener('pointerdown', e => {
    if (e.button > 0) return; const sx = e.clientX, sy = e.clientY, r = root.getBoundingClientRect(), ox = r.left, oy = r.top; let moved = false;
    try { body.setPointerCapture(e.pointerId); } catch (x) {}
    const mv = ev => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (!moved) { if (Math.hypot(dx, dy) < 6) return; moved = true; dragging = true; root.classList.add('drag'); closeBal(false); if (sleeping) wake(true); setPose('shocked'); const L = Math.random() < 0.5 && pickLine('tp.drag.start'); if (L) say(L.text, { pose: 'shocked', ttl: 1600 }); }
      const s = r.width; root.style.left = clampN(ox + dx, 0, innerWidth - s) + 'px'; root.style.top = clampN(oy + dy, 0, innerHeight - taskH() - s) + 'px'; if (bal) placeBal();
    };
    const up = () => {
      body.removeEventListener('pointermove', mv); body.removeEventListener('pointerup', up); body.removeEventListener('pointercancel', up);
      if (moved) { dragging = false; root.classList.remove('drag'); savePos(); setPose('excited', 1600); const L = Math.random() < 0.6 && pickLine('tp.drag.drop'); if (L) say(L.text, { pose: L.pose || 'excited', ttl: 2200 }); }
      else poke();
    };
    body.addEventListener('pointermove', mv); body.addEventListener('pointerup', up); body.addEventListener('pointercancel', up);
  });
  function savePos() {
    const r = root.getBoundingClientRect(), W = innerWidth, Hh = innerHeight - taskH(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const c = (cy < Hh / 2 ? 't' : 'b') + (cx < W / 2 ? 'l' : 'r'); let ox = c[1] === 'l' ? r.left : W - r.right, oy = c[0] === 't' ? r.top : Hh - r.bottom;
    if (T.snap) { if (ox < 24) ox = 4; if (oy < 24) oy = 4; }
    setT({ pos: { c, ox: Math.round(ox), oy: Math.round(oy) } }, true);
  }
  function poke() {
    const now = Date.now(); clicks = clicks.filter(t => now - t < 6000); clicks.push(now); GH.emit('tapey:click');
    if (sleeping) { wake(false); return; }
    if (clicks.length >= 6) { GH.emit('tapey:poke'); const L = pickLine('tp.poke.angry'); if (L) say(L.text, { pose: 'angry', ttl: 3200 }); blip('poke'); pokeAngry = now; clicks = []; return; }
    if (clicks.length >= 3 && Math.random() < 0.7) { const L = pickLine('tp.poke'); if (L) say(L.text, { pose: L.pose || 'shocked', ttl: 2200 }); blip('poke'); return; }
    if (pokeAngry && now - pokeAngry < 20000) { pokeAngry = 0; const L = pickLine('tp.poke.sorry'); if (L) { say(L.text, { pose: L.pose || 'love', ttl: 2600 }); return; } }
    if (bal && bal.querySelector('.tp-in')) { closeBal(); return; }
    menu();
  }
  body.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); menu(); } else if (e.key === 'Escape') closeBal(); else if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) { e.preventDefault(); const r = root.getBoundingClientRect(); ctxMenu(r.left + r.width / 2, r.top + r.height / 2); } });
  function ctxMenu(x, y) {
    I.showContextMenu([
      { label: '&Ask Tapey…', onClick: () => menu() }, { label: 'Tip of the &Day', onClick: () => tellTip() }, { label: 'Tell a &Joke', onClick: () => tellJoke() }, { label: '&Animate!', onClick: () => animate() }, { sep: true },
      { label: 'Play &Random Game', onClick: () => GH.randomGame() }, { label: '&Widgets', submenu: () => GH.widgets.menuItems() }, { sep: true },
      { label: 'Eyes &Follow Cursor', checked: !!T.eyes, onClick: () => setT({ eyes: !T.eyes }) }, { label: '&Quiet Mode', checked: T.tone === 'q', onClick: () => setT({ tone: T.tone === 'q' ? 'c' : 'q' }) },
      { label: '&Personality', submenu: () => Object.keys((DLG && DLG.tones) || {}).map(k => ({ label: DLG.tones[k].name, checked: T.tone === k, onClick: () => setT({ tone: k }) })) }, { sep: true },
      { label: 'Tapey &Settings…', onClick: () => GH.openItem('app:tapey') }, { label: '&Hide Tapey', onClick: () => hideT(true) }
    ], x, y);
  }
  root.addEventListener('contextmenu', e => { e.preventDefault(); e.stopPropagation(); ctxMenu(e.clientX, e.clientY); });
  let touchHold = 0;
  body.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') touchHold = setTimeout(() => { ctxMenu(e.clientX, e.clientY); }, 650); });
  ['pointerup', 'pointercancel', 'pointermove'].forEach(ev => body.addEventListener(ev, () => clearTimeout(touchHold)));
  function animate() { const picks = ['wave', 'dance', 'think', 'idea', 'cool', 'love', 'excited', 'search']; const p = pick(picks); if (p === 'dance') return dance(); wake(true); setPose(p, 2600); const L = pickLine('idle.chat'); }
  /* ---- Clippy-style offer when a text editor opens ---- */
  function writingOffer(kind) {
    const text = kind === 'wordpad' ? "It looks like you're writing a letter.\nWould you like help?" : "It looks like you're taking some notes.\nWould you like help?";
    say(text, { pose: 'write', sticky: true, actions: [
      { label: kind === 'wordpad' ? 'Get help with writing the letter' : 'Get help with taking notes', fn: () => { const L = pickLine('tp.help'); say((L ? L.text : 'Sure!') + '\n\nTip: Ctrl+S saves to My Documents. Open the File Manager any time to see your files.', { pose: 'excited', ttl: 6000 }); return false; } },
      { label: 'Just type the ' + (kind === 'wordpad' ? 'letter' : 'note') + ' without help', fn: () => { const L = pickLine('tp.nohelp'); setTimeout(() => say(L ? L.text : 'Okay!', { pose: 'wave', ttl: 2200 }), 50); return false; } },
      { label: "Don't show me this tip again", fn: () => { TS.muted['offer.' + kind] = 1; saveTS(); const L = pickLine('tp.dontshow'); setTimeout(() => say(L ? L.text : 'Okay.', { pose: 'wave', ttl: 2200 }), 50); return false; } }
    ] });
  }

  /* ---- context-aware reactions ---- */
  const lastReact = {};
  const cool = (k, ms) => { const n = Date.now(); if (lastReact[k] && n - lastReact[k] < ms) return false; lastReact[k] = n; return true; };
  function appKey(W) {
    const id = String(W.id || ''); if (/^app-/.test(id)) return id.slice(4);
    if (id === 'library') return 'library'; if (/chat/.test(id)) return 'chat'; if (/^(explorer|folder)/.test(id)) return 'explorer';
    return '';
  }
  const slug = u => String(u || '').split('/').pop().replace(/\.html?$/i, '');
  const SLOT_GAMES = { 'asphalt-rush': 1, 'city-striker': 1, 'gh-clicker': 1, 'ghengis': 1, 'megalith': 1, 'pixel-ops': 1 };
  const gameStart = {}, sessionGames = new Set();
  let ghostN = 0;
  GH.on((name, d) => {
    if (!T.enabled || !DLG) return;
    switch (name) {
      case 'win_open': {
        const W = d; if (!W) return;
        if (W.o && W.o.dialog) { if (/error\.svg/.test(String(W.o.icon || '')) && T.reactions) react('game.crash', {}, { kind: 'crash', chance: 1, pose: 'shocked' }); return; }
        if (isGameWin(W)) { gameStart[W.id] = Date.now(); return; }
        if (!T.appTips || !T.reactions) return;
        const k = appKey(W); if (!k) return; const seen = TS.seen['app.' + k] || 0; TS.seen['app.' + k] = seen + 1; saveTS();
        if ((k === 'wordpad' || k === 'notepad') && T.clippyOffers && !TS.muted['offer.' + k] && cool('offer.' + k, 1800000)) { afterDelay(() => { if (canSpeak('react') && !isGameWin(activeWin())) writingOffer(k); }, 1400); return; }
        const pn = seen === 0 ? 'app.' + k + '.first' : 'app.' + k + '.again'; if (!hasPool(pn)) return;
        if (seen > 0 && (seen > 6 || !cool('again.' + k, 600000))) return;
        afterDelay(() => react(pn, { app: W.title }, { kind: 'app', chance: seen === 0 ? 0.95 : 0.3 }), 1100);
        break;
      }
      case 'game': {
        const sl = slug(d.url), played = TS.played[sl] || 0, firstEver = !Object.keys(TS.played).length; TS.played[sl] = played + 1; saveTS(); lastGame = d.title; sessionGames.add(sl);
        if (!T.gameTips || !T.reactions) return;
        const ex = { game: d.title, n: played + 1 };
        const proj = (I.PROJECTS || []).find(p => p.url === d.url), st = proj && proj.statusKey;
        const plan = []; if (firstEver) plan.push(['ev.first.game', 1]); else if (played === 0 && hasPool('game.' + sl)) plan.push(['game.' + sl, 1]); else if (played > 0) plan.push(['game.again', 0.4]); else plan.push(['game.open', 0.7]);
        if (firstEver && hasPool('game.' + sl)) plan.push(['game.' + sl, 0.8]);
        if (played + 1 === 5) plan.push(['ev.devoted', 1]); else if (sessionGames.size === 3 && played === 0 && cool('variety', 3600000)) plan.push(['ev.variety', 1]);
        if (d.classic && played === 0) plan.push(['game.classic', 0.4]);
        if (st && /beta|wip|legacy/i.test(st) && played === 0) plan.push(['game.beta', 0.8]);
        if (SLOT_GAMES[sl] && (TS.slotHints || 0) < 4 && played < 3) plan.push(['game.slots', 0.9]);
        else if (d.classic === false && !SLOT_GAMES[sl] && sl !== 'fps' && played === 0 && cool('noslots', 1200000)) plan.push(['game.noslots', 0.3]);
        plan.forEach((p, i) => afterDelay(() => { if (p[0] === 'game.slots') { TS.slotHints = (TS.slotHints || 0) + 1; saveTS(); } react(p[0], ex, { kind: 'react', chance: p[1] }); }, 1600 + i * 9000));
        break;
      }
      case 'win_close': {
        const W = d; if (!W || !isGameWin(W)) return; const t0 = gameStart[W.id]; delete gameStart[W.id];
        if (t0 && Date.now() - t0 > 180000 && T.reactions) react('game.close', { game: W.title }, { kind: 'react', chance: 0.5 });
        break;
      }
      case 'ach': {
        if (!T.achTalk) return; const total = GH.ach.total(), n = GH.ach.count(), hidden = d.hidden;
        const pn = n >= total ? 'ev.ach.all' : n === 1 ? 'ev.first.ach' : (n === 10 || n === 20 || n === 30) ? 'ev.ach.' + n : hidden ? 'ev.ach.hidden' : 'ev.ach';
        const chance = pn === 'ev.ach' ? 0.75 : 1; afterDelay(() => react(pn, { app: d.n }, { kind: 'ach', chance: chance, pose: 'celebrate' }), 900); break;
      }
      case 'random': react('game.random', { game: d && d.title }, { kind: 'react', chance: 1 }); break;
      case 'slot:save': case 'slot:load': case 'slot:empty': { const first = name === 'slot:save' && !TS.slotFirst; if (first) { TS.slotFirst = 1; saveTS(); } react(first ? 'ev.slot.first' : 'ev.' + name.replace(':', '.'), {}, { kind: 'react', chance: 0.95 }); break; }
      case 'widget:add': case 'widget:remove': { const first = name === 'widget:add' && !TS.widgetFirst; if (first) { TS.widgetFirst = 1; saveTS(); } if (cool('widget', 6000)) react(first ? 'ev.widget.first' : 'ev.' + name.replace(':', '.'), {}, { kind: 'react', chance: first ? 1 : 0.7 }); break; }
      case 'media:play': if (cool('media', 600000)) react('ev.media', {}, { kind: 'react', chance: 0.5 }); break;
      case 'soundrec:save': react('ev.soundrec', {}, { kind: 'react', chance: 0.8 }); break;
      case 'wordpad:save': if (cool('wpsave', 300000)) react('ev.wordpad.save', {}, { kind: 'react', chance: 0.5 }); break;
      case 'phone:dial': if (cool('phone', 300000)) react('ev.phone', {}, { kind: 'react', chance: 0.6 }); break;
      case 'calendar:note': if (cool('calnote', 300000)) react('ev.calendar', {}, { kind: 'react', chance: 0.5 }); break;
      case 'charmap:copy': if (cool('charmap', 300000)) react('ev.charmap', {}, { kind: 'react', chance: 0.5 }); break;
      case 'fs:new': react('ev.fs.new', {}, { kind: 'react', chance: 0.6 }); break;
      case 'fs:import': react('ev.import', {}, { kind: 'react', chance: 0.8 }); break;
      case 'fs:paste': if (cool('paste', 120000)) react('ev.paste', {}, { kind: 'react', chance: 0.4 }); break;
      case 'defrag:complete': react('ev.defrag', {}, { kind: 'react', chance: 1 }); break;
      case 'minall': if (cool('minall', 300000)) react('ev.minall', {}, { kind: 'react', chance: 0.35 }); break;
      case 'taskman': if (cool('taskman', 600000)) react('ev.taskman', {}, { kind: 'react', chance: 0.5 }); break;
      case 'find': if (cool('find', 600000)) react('ev.find', {}, { kind: 'react', chance: 0.35 }); break;
      case 'run': if (cool('run', 600000)) react('ev.run', {}, { kind: 'react', chance: 0.35 }); break;
      case 'saver': if (cool('saver', 300000)) react('ev.saver', {}, { kind: 'react', chance: 0.5 }); break;
      case 'fav': if (cool('fav', 60000)) react('ev.fav', {}, { kind: 'react', chance: 0.6 }); break;
      case 'setting': {
        if (d.key === 'scheme' && cool('theme', 20000)) { clearTimeout(react._t); react._t = setTimeout(() => react('ev.theme', { theme: themeName() }, { kind: 'react', chance: 0.7 }), 1500); }
        else if (d.key === 'wallpaper' && cool('wp', 20000)) { clearTimeout(react._t2); react._t2 = setTimeout(() => react('ev.wallpaper', {}, { kind: 'react', chance: 0.5 }), 1500); }
        break;
      }
      case 'dos:xyzzy': react('ev.dos.xyzzy', {}, { kind: 'react', chance: 1 }); break;
      case 'dos:tapey': react('ev.dos.tapey', {}, { kind: 'react', chance: 1 }); break;
      case 'dos:help': if (cool('doscmd', 900000)) react('ev.dos.cmd', {}, { kind: 'react', chance: 0.3 }); break;
      default: {
        let m;
        if ((m = /^(?:dos:)?win:(\w+)$/.exec(name)) && cool('win', 5000)) {
          const id = m[1]; const pn = hasPool('ev.tgwin.' + id) ? 'ev.tgwin.' + id : hasPool('ev.win.' + id) ? 'ev.win.' + id : 'ev.win'; react(pn, {}, { kind: 'react', chance: 0.95 });
        } else if ((m = /^textgame:(\w+)$/.exec(name))) {
          const key = 'tg.' + m[1], seenN = TS.seen[key] || 0; TS.seen[key] = seenN + 1; saveTS(); if (hasPool('ev.tg.' + m[1])) afterDelay(() => react('ev.tg.' + m[1], {}, { kind: 'app', chance: seenN === 0 ? 0.9 : 0.2 }), 800);
        } else if ((m = /^dos:(\w+)$/.exec(name))) {
          if (hasPool('ev.dos.' + m[1]) && cool('dos.' + m[1], 240000)) react('ev.dos.' + m[1], {}, { kind: 'react', chance: 0.5 });
        }
      }
    }
  });
  /* ---- idle chatter, sleeping and blinking ---- */
  let nextIdle = Date.now() + 60000; const nextDelay = () => { const base = clampN(T.interval, 15, 900) * 1000, f = 1.5 - clampN(T.chatty, 0, 100) / 100; return base * f * (0.75 + Math.random() * 0.5); };
  function unplayedGame() { const all = (catalog.games || []).concat(catalog.classics || []).filter(g => !TS.played[slug(g.url)] && !/badracing|fieldkit/.test(g.url)); const g = all.length ? pick(all) : null; return g ? g.title : ''; }
  /* date / time / situation contexts (each returns [pool, weight] pairs; cooldowns stop repeats) */
  function dateCtx(c) {
    const now = new Date(), mo = now.getMonth(), dt = now.getDate(), dow = now.getDay(), hr = now.getHours(), out = [];
    if (mo === 0 && dt === 1) out.push(['ctx.newyear', 9]); if (mo === 9 && dt === 31) out.push(['ctx.halloween', 9]); if (mo === 11 && dt >= 23 && dt <= 26) out.push(['ctx.xmas', 9]); if (mo === 3 && dt === 1) out.push(['ctx.aprilfools', 9]);
    if (mo === 10 && dow === 4 && dt >= 22 && dt <= 28) out.push(['ctx.thanksgiving', 9]);
    if (dow === 1 && hr < 14) out.push(['ctx.monday', 3]); if (dow === 5) out.push([hr >= 14 ? 'ctx.fridayafternoon' : 'ctx.friday', 3]); if (dow === 0 || dow === 6) out.push(['ctx.weekend', 3]); if (dow === 0 && hr >= 18) out.push(['ctx.sundaynight', 3]);
    if (hr >= 11 && hr < 14) out.push(['ctx.lunch', 2]); if (hr >= 22) out.push(['ctx.bedtime', 3]); if (hr === 0 && now.getMinutes() < 6) out.push(['ctx.midnight', 8]);
    if (mo >= 5 && mo <= 7) out.push(['ctx.summer', 1]); if (mo === 11 || mo <= 1) out.push(['ctx.winter', 1]);
    return out;
  }
  function situationCtx(c) {
    const out = [], plays = Object.keys(TS.played).map(k => [k, TS.played[k]]).sort((a, b) => b[1] - a[1]);
    try { if (matchMedia('(pointer:coarse)').matches) out.push(['ctx.touch', 2]); } catch (e) {}
    if (c.files >= 15) out.push(['ctx.files', 2]); if (c.files === 0 && c.min >= 5) out.push(['ctx.nofiles', 2]);
    if ([8, 9, 18, 19, 28, 29].indexOf(c.ach) >= 0) out.push(['ctx.ach.near', 3]);
    if (plays[0] && plays[0][1] >= 5) { const g = (catalog.games || []).concat(catalog.classics || []).find(x => slug(x.url) === plays[0][0]); if (g) { c.game = g.title; out.push(['ctx.fav.game', 3]); } }
    if (sessionGames.size >= 3) { c.n = sessionGames.size; out.push(['ctx.many.games', 2]); }
    const d = (LS.get('gh-ach-stats-v1', {}) || {}).days || []; if (d.length >= 3) { const t = Date.now(), ok = [0, 1, 2].every(i => d.indexOf(new Date(t - i * 86400000).toISOString().slice(0, 10)) >= 0); if (ok) out.push(['ctx.streak', 2]); }
    if (c.min >= 90) out.push(['ctx.session.long', 2]);
    return out;
  }
  document.addEventListener('visibilitychange', () => { if (D.hidden) { hiddenAt = Date.now(); } else if (hiddenAt && Date.now() - hiddenAt > 300000 && T.reactions) { hiddenAt = 0; setTimeout(() => react('ctx.returned', {}, { kind: 'react', chance: 0.8 }), 900); } });
  let hiddenAt = 0;
  function tickIdle() {
    if (!T.enabled || root.hidden || !DLG) return; const now = Date.now();
    if (T.sleep && T.sleepAfter > 0 && !sleeping && !dragging && now - lastActivity > T.sleepAfter * 1000 && !balOpen()) gotoSleep();
    if (sleeping || T.interval <= 0 || T.tone === 'q' || now < nextIdle) return;
    if (!canSpeak('idle')) { nextIdle = now + 20000; return; }
    const c = ctx(), o = [];
    if (T.catContext) {
      if (c.hour < 4 && cool('late', 1800000)) o.push(['idle.late', 6]);
      if (c.min >= 45 && cool('long', 2700000)) o.push(['idle.long', 6]);
      if (c.wins >= 7 && cool('wins', 900000)) o.push(['idle.windows', 6]);
      if (c.wins === 0 && cool('empty', 900000)) o.push(['idle.empty', 3]);
      if (!online && cool('offline', 900000)) o.push(['idle.offline', 8]);
      if (lastBattery && !lastBattery.charging && lastBattery.level < 0.2 && cool('battery', 1200000)) o.push(['idle.battery', 8]);
      if (!Object.keys(TS.played).length && c.min >= 3 && cool('nogames', 1200000)) o.push(['idle.nogames.idle', 5]);
      if (Math.random() < 0.15 && cool('themeline', 3600000)) o.push(['idle.theme', 3]);
      const aw = activeWin(); if (isGameWin(aw) && gameStart[aw.id] && now - gameStart[aw.id] > 1800000 && cool('glong.' + aw.id, 1800000)) { c.game = gameTitle(aw); c.min = Math.round((now - gameStart[aw.id]) / 60000); o.push(['game.long', 20]); }
    }
    if (T.catContext) { dateCtx(c).forEach(x => { if (cool('d.' + x[0], 3 * 3600000)) o.push(x); }); situationCtx(c).forEach(x => { if (cool('s.' + x[0], 2 * 3600000)) o.push(x); }); }
    if (T.catTip) o.push(['idle.tip', 4]); if (T.catJoke) o.push(['idle.joke', 3]); if (T.catFact) o.push(['idle.fact', 3]); if (T.catChat) o.push(['idle.chat', 3]); if (T.catCompliment) o.push(['idle.compliment', 2]); if (T.catNudge) o.push(['idle.nudge', 3]);
    nextIdle = now + nextDelay(); if (!o.length) return;
    const bag = []; o.forEach(x => { for (let i = 0; i < x[1]; i++) bag.push(x[0]); }); const choice = pick(bag);
    const ex = { game: /^idle\.nudge$/.test(choice) ? (unplayedGame() || 'a game') : (c.game || unplayedGame() || 'a game'), min: c.min, n: c.n, ach: c.ach };
    if (choice === 'idle.tip' || choice === 'idle.joke') { const L = pickLine(choice, c), I2 = Math.random() < 0.5 && pickLine(choice + '.intro', c); if (L && canSpeak('idle')) say((I2 ? I2.text + '\n\n' : '') + L.text, { pose: L.pose || (choice === 'idle.joke' ? 'excited' : 'idea') }); return; }
    react(choice, ex, { kind: 'idle', chance: 1 });
  }
  setInterval(tickIdle, 5000);
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev => D.addEventListener(ev, () => { lastActivity = Date.now(); if (sleeping && ev !== 'wheel') wake(false); }, { passive: true, capture: true }));
  D.addEventListener('pointermove', e => { if (!sleeping) { lastActivity = Date.now(); return; } const r = root.getBoundingClientRect(); if (Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) < r.width * 0.9) wake(false); }, { passive: true, capture: true });
  (function blinkLoop() {
    setTimeout(() => {
      if (T.enabled && T.eyeBlink && T.blink && !root.hidden && !sleeping && !dragging && basePose === 'idle' && curPose === 'idle') { renderPose('blink'); setTimeout(() => { if (basePose === 'idle' && curPose === 'blink') renderPose('idle'); }, 130); }
      blinkLoop();
    }, 2400 + Math.random() * 3800);
  })();
  /* ---- greeting + boot ---- */
  function greet() {
    if (!T.greeting || !T.enabled || !DLG) return;
    if (TS.firstRun) { TS.firstRun = false; saveTS(); react('greet.first', {}, { kind: 'greet', chance: 1, say: { ttl: 11000 } }); return; }
    const c = ctx(), bag = [['greet.' + c.part, 4], ['greet.back', 3]];
    dateCtx(c).slice(0, 3).forEach(x => { if (/ctx\.(newyear|halloween|xmas|aprilfools|thanksgiving)/.test(x[0])) bag.push([x[0], 8]); else if (/monday|friday|weekend/.test(x[0])) bag.push([x[0], 2]); });
    if (TS.visits >= 10) bag.push(['greet.regular', 2]); if (c.ach >= 5) bag.push(['greet.achiever', 2]); if (!Object.keys(TS.played).length) bag.push(['greet.nogames', 2]);
    const b = []; bag.forEach(x => { for (let i = 0; i < x[1]; i++) b.push(x[0]); }); react(pick(b), {}, { kind: 'greet', chance: 1 });
  }
  function tosOpen() { const t = $('#tos-modal-overlay'); try { return !!t && getComputedStyle(t).display !== 'none'; } catch (e) { return false; } }
  function startGreeting() {
    let tries = 0; const go = () => { if (tosOpen() && tries++ < 90) return setTimeout(go, 1000); afterDelay(greet, 1800); };
    if (window.__ghBooting) window.addEventListener('gh-boot-complete', () => setTimeout(go, 2500), { once: true }); else setTimeout(go, 1800);
  }
  const dlgReady = loadDialogs().then(() => {
    styleT(); setPose('idle'); nextIdle = Date.now() + clampN(T.interval, 15, 900) * 700;
    setTimeout(() => POSES.forEach(p => loadSvg(p)), 1500);
    if (T.eyes && !TS.eyesIntro && T.enabled) { TS.eyesIntro = true; saveTS(); setTimeout(() => { if (canSpeak('react') && !balOpen()) react('eyes.first', {}, { kind: 'eyes', chance: 1 }); }, 90000); }
    startGreeting();
  });

  /* ===================== random game ===================== */
  GH.randomGame = function () {
    const p = GH.pickRandomGame(); if (!p) return;
    GH.emit('random', p); I.toast('🎲 Random pick: ' + p.title + '!');
    setTimeout(() => GH.openItem('game:' + p.url), 600);
  };

  /* ===================== desktop widgets ===================== */
  const WKEY = 'gh-widgets-v1'; let WS = LS.get(WKEY, {}) || {};
  const wlayer = h('div', { id: 'gh-widgets' }); desk.insertBefore(wlayer, $('#windows-layer'));
  const wsave = () => LS.set(WKEY, WS);
  const instances = {};
  const DEF = {
    clock: { title: 'Clock', w: 148, build(b) {
      const NS = 'http://www.w3.org/2000/svg'; let ticks = ''; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; ticks += `<line x1="${60 + Math.sin(a) * 48}" y1="${60 - Math.cos(a) * 48}" x2="${60 + Math.sin(a) * 54}" y2="${60 - Math.cos(a) * 54}" stroke="#000" stroke-width="${i % 3 ? 1.5 : 3}"/>`; }
      b.innerHTML = `<svg viewBox="0 0 120 120" width="130" height="130" style="display:block;margin:0 auto" aria-hidden="true"><circle cx="60" cy="60" r="57" fill="#fff" stroke="#000" stroke-width="2"/>${ticks}<line id="wh" x1="60" y1="60" x2="60" y2="34" stroke="#000" stroke-width="4" stroke-linecap="round"/><line id="wm" x1="60" y1="60" x2="60" y2="20" stroke="#000" stroke-width="3" stroke-linecap="round"/><line id="ws" x1="60" y1="66" x2="60" y2="14" stroke="#c00" stroke-width="1.5"/><circle cx="60" cy="60" r="3.5" fill="#000"/></svg><div class="wg-sunk" style="text-align:center;margin-top:4px"><b class="wd"></b><div class="wdt" style="font-size:11px"></div></div>`;
      const hh = $('#wh', b), mm = $('#wm', b), ss = $('#ws', b), wd = $('.wd', b), wdt = $('.wdt', b);
      return { tick() { const n = new Date(), s = n.getSeconds(), m = n.getMinutes() + s / 60, hr = (n.getHours() % 12) + m / 60; hh.setAttribute('transform', `rotate(${hr * 30} 60 60)`); mm.setAttribute('transform', `rotate(${m * 6} 60 60)`); ss.setAttribute('transform', `rotate(${s * 6} 60 60)`); wd.textContent = n.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }); wdt.textContent = n.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }); } };
    } },
    calendar: { title: 'Calendar', w: 176, build(b) {
      let off = 0; const hd = h('div', { style: { display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' } }), lab = h('b', { style: { flex: '1', textAlign: 'center' } }), tb = h('div', { class: 'wg-sunk' });
      const pv = h('button', { type: 'button', class: 'wg', 'aria-label': 'Previous month', text: '◀' }), nx = h('button', { type: 'button', class: 'wg', 'aria-label': 'Next month', text: '▶' }); hd.append(pv, lab, nx); b.append(hd, tb);
      function draw() { const n = new Date(), d = new Date(n.getFullYear(), n.getMonth() + off, 1); lab.textContent = d.toLocaleString([], { month: 'short', year: 'numeric' }); const first = d.getDay(), dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); let t = '<table class="mc"><tr>' + 'SMTWTFS'.split('').map(x => '<th>' + x + '</th>').join('') + '</tr><tr>'; for (let i = 0; i < first; i++) t += '<td></td>'; for (let day = 1; day <= dim; day++) { if ((first + day - 1) % 7 === 0 && day > 1) t += '</tr><tr>'; const today = off === 0 && day === n.getDate(); t += '<td' + (today ? ' class="t"' : '') + '>' + day + '</td>'; } tb.innerHTML = t + '</tr></table>'; }
      pv.onclick = () => { off--; draw(); }; nx.onclick = () => { off++; draw(); }; draw(); return { tick() { if (off === 0 && new Date().getHours() === 0 && new Date().getMinutes() === 0) draw(); } };
    } },
    note: { title: 'Sticky Note', w: 190, h: 170, colors: ['#ffff88', '#ffc8e0', '#bfe3ff', '#c9f5c0'], build(b, el) {
      const NK = 'gh-widget-note', CK = 'gh-widget-note-color'; const ta = h('textarea', { class: 'wg-note', 'aria-label': 'Sticky note', placeholder: 'Write something…', spellcheck: 'false' });
      ta.value = LS.get(NK, '') || ''; let ci = LS.get(CK, 0) || 0; const apply = () => { b.style.background = DEF.note.colors[ci % 4]; }; apply(); b.style.height = '132px'; b.append(ta);
      let to = 0; ta.addEventListener('input', () => { clearTimeout(to); to = setTimeout(() => LS.set(NK, ta.value), 300); });
      const c = h('button', { type: 'button', title: 'Change color', 'aria-label': 'Change note color', text: '◐', on: { click: () => { ci = (ci + 1) % 4; LS.set(CK, ci); apply(); } } }); el.querySelector('.wg-t').insertBefore(c, el.querySelector('.wg-t button:last-child'));
      return {};
    } },
    system: { title: 'System', w: 176, build(b) {
      const box = h('div', { class: 'wg-sunk', style: { fontFamily: '"Courier New",monospace', fontSize: '11px', lineHeight: '1.5', whiteSpace: 'pre' } }); b.append(box);
      let fps = 0, frames = 0, last = performance.now(), est = '', alive = true;
      (function loop() { if (!alive) return; frames++; const n = performance.now(); if (n - last >= 1000) { fps = Math.round(frames * 1000 / (n - last)); frames = 0; last = n; } requestAnimationFrame(loop); })();
      const upd = () => { try { navigator.storage && navigator.storage.estimate && navigator.storage.estimate().then(e => { est = ((e.usage || 0) / 1048576).toFixed(1) + ' MB'; }); } catch (x) {} };
      upd(); setInterval(() => { if (alive) upd(); }, 15000);
      return { tick() { const mem = performance && performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB' : 'n/a'; box.textContent = ['FPS:      ' + fps, 'JS heap:  ' + mem, 'Storage:  ' + (est || '…'), 'Windows:  ' + visibleWins().length, 'Network:  ' + (online ? 'online' : 'OFFLINE'), 'Uptime:   ' + Math.round((Date.now() - SESSION_START) / 60000) + ' min'].join('\n'); }, destroy() { alive = false; } };
    } },
    progress: { title: 'Progress', w: 176, build(b) {
      const box = h('div', { class: 'wg-sunk' }); b.append(box); const draw = () => { const n = GH.ach.count(), t = GH.ach.total(), s = GH.ach.stats(); box.innerHTML = `<b>🏆 ${n} / ${t}</b><div class="wg-bar" style="margin:3px 0"><i style="width:${Math.round(n / t * 100)}%"></i></div>Games tried: ${s.games.length}<br>Time here: ${Math.floor(s.minutes / 60)}h ${Math.round(s.minutes % 60)}m`; };
      draw(); const off = GH.on(nm => { if (nm === 'ach' || nm === 'ach_reset' || nm === 'game') draw(); }); return { tick() { draw(); }, destroy() { off(); } };
    } },
    lucky: { title: 'Feeling Lucky?', w: 168, build(b) {
      const last = h('div', { class: 'wg-sunk', style: { textAlign: 'center', minHeight: '34px', marginBottom: '5px' }, text: 'Can\'t decide what to play?' });
      const go = h('button', { type: 'button', class: 'wg', style: { width: '100%' }, text: '🎲 Random Game' }); go.onclick = () => { const p = GH.pickRandomGame(); if (!p) return; last.textContent = p.title; go.textContent = '▶ Play ' + p.title.slice(0, 16); go.onclick = () => { GH.randomGameFrom && 0; GH.emit('random', p); GH.openItem('game:' + p.url); go.textContent = '🎲 Another one'; go.onclick = () => { GH.randomGame(); }; }; };
      b.append(last, go); return {};
    } },
    tip: { title: 'Tip of the Day', w: 200, build(b) {
      const box = h('div', { class: 'wg-sunk', style: { minHeight: '60px' } }), nx = h('button', { type: 'button', class: 'wg', style: { marginTop: '4px' }, text: 'Next tip' }); b.append(box, nx);
      let i = Math.floor(Date.now() / 86400000); const draw = () => { const l = (DLG && DLG.pools && DLG.pools['idle.tip']) || ['Right-click the desktop for widgets.']; box.textContent = String(l[i % l.length]).replace(/^(?:[csnwq]:\s*)?/, '').replace(/\s+~[a-z]+$/, ''); }; nx.onclick = () => { i++; draw(); }; dlgReady.then(draw); draw(); return {};
    } }
  };
  const WORDER = ['clock', 'calendar', 'note', 'system', 'progress', 'lucky', 'tip'];
  function wlayout(id, el, d) {
    const w = (WS[id] && WS[id].x != null) ? WS[id] : null; let x, y;
    if (w) { x = w.x; y = w.y; } else { const idx = Object.keys(instances).length; x = Math.max(8, innerWidth - d.w - 16 - (idx > 3 ? 190 : 0)); y = 12 + (idx % 4) * 150; }
    el.style.left = Math.max(0, Math.min(x, innerWidth - 60)) + 'px'; el.style.top = Math.max(0, Math.min(y, innerHeight - 90)) + 'px';
  }
  function wopen(id, silent) {
    const d = DEF[id]; if (!d || instances[id]) return;
    const el = h('div', { class: 'gh-widget', role: 'group', 'aria-label': d.title + ' widget', style: { width: d.w + 'px' } });
    const close = h('button', { type: 'button', title: 'Close widget', 'aria-label': 'Close ' + d.title + ' widget', text: '×' });
    const tb = h('div', { class: 'wg-t' }, h('span', { text: d.title }), close), bd = h('div', { class: 'wg-b' }); el.append(tb, bd); wlayer.append(el);
    const api = d.build(bd, el) || {}; instances[id] = { el, api }; wlayout(id, el, d);
    close.addEventListener('click', () => wclose(id));
    tb.addEventListener('pointerdown', e => {
      if (e.target.closest('button') || (e.button > 0 && e.pointerType === 'mouse')) return;
      const sx = e.clientX, sy = e.clientY, ox = el.offsetLeft, oy = el.offsetTop; try { tb.setPointerCapture(e.pointerId); } catch (x) {} el.style.zIndex = '5';
      const mv = ev => { el.style.left = Math.max(-el.offsetWidth + 60, Math.min(innerWidth - 60, ox + ev.clientX - sx)) + 'px'; el.style.top = Math.max(0, Math.min(innerHeight - 70, oy + ev.clientY - sy)) + 'px'; };
      const up = () => { tb.removeEventListener('pointermove', mv); tb.removeEventListener('pointerup', up); tb.removeEventListener('pointercancel', up); el.style.zIndex = ''; WS[id] = Object.assign(WS[id] || {}, { on: true, x: el.offsetLeft, y: el.offsetTop }); wsave(); };
      tb.addEventListener('pointermove', mv); tb.addEventListener('pointerup', up); tb.addEventListener('pointercancel', up);
    });
    WS[id] = Object.assign(WS[id] || {}, { on: true }); wsave(); api.tick && api.tick();
    if (!silent) GH.emit('widget:add', id);
  }
  function wclose(id, silent) { const i = instances[id]; if (!i) return; try { i.api.destroy && i.api.destroy(); } catch (e) {} i.el.remove(); delete instances[id]; WS[id] = Object.assign(WS[id] || {}, { on: false }); wsave(); if (!silent) GH.emit('widget:remove', id); }
  setInterval(() => { if (D.hidden) return; Object.keys(instances).forEach(id => { try { instances[id].api.tick && instances[id].api.tick(); } catch (e) {} }); }, 1000);
  window.addEventListener('resize', () => { Object.keys(instances).forEach(id => wlayout(id, instances[id].el, DEF[id])); });
  GH.widgets = {
    list: () => WORDER.map(id => ({ id, title: DEF[id].title, on: !!instances[id] })), isOn: id => !!instances[id], count: () => Object.keys(instances).length,
    toggle: id => { instances[id] ? wclose(id) : wopen(id); }, open: id => wopen(id), close: id => wclose(id),
    closeAll: () => Object.keys(instances).forEach(id => wclose(id, true)),
    reset: () => { WS = {}; wsave(); Object.keys(instances).forEach(id => { wlayout(id, instances[id].el, DEF[id]); }); },
    menuItems: () => WORDER.map(id => ({ label: DEF[id].title, checked: !!instances[id], onClick: () => GH.widgets.toggle(id) })).concat([{ sep: true }, { label: '&Close All Widgets', onClick: () => GH.widgets.closeAll() }, { label: 'Reset &Positions', onClick: () => { WS = {}; wsave(); const on = Object.keys(instances); on.forEach(id => wclose(id, true)); on.forEach(id => wopen(id, true)); } }]),
    menu: () => I.showContextMenu(GH.widgets.menuItems(), Math.max(10, innerWidth / 2 - 80), Math.max(10, innerHeight / 2 - 140))
  };
  Object.keys(WS).forEach(id => { if (WS[id] && WS[id].on && DEF[id]) wopen(id, true); });

  /* ===================== save slots (local games only) ===================== */
  const SLKEY = 'gh-slots-v1', NSLOT = 6;
  const PREFIX = { 'games/asphalt-rush.html': ['ar_'], 'games/city-striker.html': ['driving_sim'], 'games/gh-clicker.html': ['goblinSaveData'], 'games/ghengis.html': ['gk_'], 'games/megalith.html': ['megalith_'], 'games/pixel-ops.html': ['po_'] };
  const SHELLKEY = /^(gh-|project-launcher|colton-launcher|coltonos|chat|mqtt|__|ruffle|localforage)/i;
  const slotsAll = () => LS.get(SLKEY, {}) || {};
  const snapLS = () => { const m = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); m[k] = localStorage.getItem(k); } } catch (e) {} return m; };
  const gameSrc = W => String((W.frameSrc || (W.iframe && W.iframe.getAttribute('src')) || '')).replace(/^.*?(games\/)/, '$1').split('?')[0].split('#')[0];
  function ownedKeys(W) {
    const set = new Set(), src = gameSrc(W), pre = PREFIX[src] || [], now = snapLS();
    Object.keys(now).forEach(k => { if (pre.some(p => k.indexOf(p) === 0)) set.add(k); });
    (W._ghOwned || []).forEach(k => { if (k in now) set.add(k); });
    if (!pre.length) { const base = W._ghBase || {}; Object.keys(now).forEach(k => { if (!SHELLKEY.test(k) && base[k] !== now[k]) set.add(k); }); }
    return Array.from(set);
  }
  function watchGame(W) {
    W._ghBase = snapLS(); W._ghOwned = new Set();
    const f = W.iframe; if (!f) return;
    f.addEventListener('load', () => { try { const w = f.contentWindow; if (!w || !w.Storage || w.__ghSlot) return; w.__ghSlot = true; const o = w.Storage.prototype.setItem; w.Storage.prototype.setItem = function (k) { try { if (this === w.localStorage) W._ghOwned.add(String(k)); } catch (e) {} return o.apply(this, arguments); }; } catch (e) {} });
    W._ghOwned = { add(k) { (this.list = this.list || []).indexOf(k) < 0 && this.list.push(k); }, forEach(fn) { (this.list || []).forEach(fn); } };
  }
  const flush = W => new Promise(res => { try { const w = W.iframe.contentWindow; ['pagehide', 'beforeunload', 'visibilitychange', 'blur'].forEach(n => { try { w.dispatchEvent(new w.Event(n)); } catch (e) {} }); try { w.document.dispatchEvent(new w.Event('visibilitychange')); } catch (e) {} } catch (e) {} setTimeout(res, 140); });
  const fmtSize = n => n < 1024 ? n + ' B' : (n / 1024).toFixed(1) + ' KB';
  function decorate(W) {
    if (!isGameWin(W) || W._ghSlotBtn || !W.el) return; const src = gameSrc(W); if (!/^games\//.test(src) || /^games\/(chat|arcade)/.test(src)) return;
    const closeB = W.el.querySelector('.c-close') || W.el.querySelector('.c-max'); if (!closeB || !closeB.parentNode) return;
    watchGame(W);
    const b = h('button', { type: 'button', class: 'wt-slot', title: 'Save Slots', 'aria-label': 'Save slots for ' + W.title }, h('img', { src: IC('save-slot'), alt: '' }));
    b.addEventListener('pointerdown', e => e.stopPropagation()); b.addEventListener('click', e => { e.stopPropagation(); openSlots(W); });
    closeB.parentNode.insertBefore(b, closeB.parentNode.firstChild); W._ghSlotBtn = b;
  }
  GH.on((n, W) => { if (n === 'win_open' && W && isGameWin(W)) setTimeout(() => decorate(W), 0); });
  setTimeout(() => wins.forEach(w => decorate(w)), 500);
  function doSave(W, i, redraw) {
    flush(W).then(() => {
      const keys = ownedKeys(W), url = gameSrc(W);
      if (!keys.length) { GH.emit('slot:empty'); return I.msgBox('No saved progress was found for ' + W.title + ' yet.\n\nPlay a little longer so the game writes its progress, then try again. Some games (like the classics) don\'t store progress at all.', { title: 'Save Slots', icon: 'info' }); }
      const data = {}; keys.forEach(k => { data[k] = localStorage.getItem(k); });
      const all = slotsAll(), prev = (all[url] || {})[i]; const nm = prev ? prev.name : 'Slot ' + i;
      (all[url] = all[url] || {})[i] = { name: nm, ts: Date.now(), data, size: JSON.stringify(data).length };
      if (!LS.set(SLKEY, all)) return I.msgBox('There is not enough browser storage left to save this slot.', { title: 'Save Slots', icon: 'error' });
      I.toast('Saved to slot ' + i + '.'); GH.emit('slot:save', { url }); redraw();
    });
  }
  function doLoad(W, i) {
    const url = gameSrc(W), s = (slotsAll()[url] || {})[i]; if (!s) return;
    I.msgBox('Load "' + s.name + '"?\n\nYour current progress in ' + W.title + ' will be replaced by this slot.', { title: 'Load Slot', icon: 'question', buttons: ['Yes', 'No'], def: 1, cancel: 'no' }).then(r => {
      if (r !== 'yes') return; const f = W.iframe, src = f.getAttribute('src') || W.frameSrc, mine = ownedKeys(W);
      const go = () => { try { mine.forEach(k => { if (!(k in s.data)) localStorage.removeItem(k); }); Object.keys(s.data).forEach(k => { localStorage.setItem(k, s.data[k]); }); } catch (e) { return I.msgBox('Could not restore this slot: ' + e.message, { title: 'Load Slot', icon: 'error' }); } setTimeout(() => { f.src = src; }, 60); I.toast('Loaded "' + s.name + '".'); GH.emit('slot:load', { url }); };
      let done = false; const once = () => { if (done) return; done = true; f.removeEventListener('load', once); setTimeout(go, 80); }; f.addEventListener('load', once); f.src = 'about:blank'; setTimeout(once, 900);
    });
  }
  function openSlots(W) {
    const url = gameSrc(W), list = h('div', { role: 'list' }), note = h('div', { class: 'si', style: { margin: '0 0 6px', fontSize: '12px' } }, 'Up to ' + NSLOT + ' save slots for ' + W.title + '. Slots are stored in this browser. Third-party Arcade games and the Chatroom don\'t use them.');
    const imp = h('input', { type: 'file', accept: '.json,application/json', hidden: true });
    const draw = () => {
      list.replaceChildren(); const mine = slotsAll()[url] || {};
      for (let i = 1; i <= NSLOT; i++) {
        const s = mine[i], row = h('div', { class: 'slot-row', role: 'listitem' });
        const info = h('div', {}, h('b', { text: s ? s.name : 'Slot ' + i + ' (empty)' }), h('div', { class: 'si', text: s ? new Date(s.ts).toLocaleString() + '  •  ' + fmtSize(s.size || 0) : 'Nothing saved here yet' }));
        const sb = h('div', { class: 'sb' },
          h('button', { type: 'button', text: 'Save', on: { click: () => { if (s) { I.msgBox('Overwrite "' + s.name + '"?', { title: 'Save Slot', icon: 'question', buttons: ['Yes', 'No'], def: 1, cancel: 'no' }).then(r => { if (r === 'yes') doSave(W, i, draw); }); } else doSave(W, i, draw); } } }),
          h('button', { type: 'button', text: 'Load', disabled: !s, on: { click: () => doLoad(W, i) } }),
          h('button', { type: 'button', text: 'Rename', disabled: !s, on: { click: () => { const n = prompt('Name for this slot:', s.name); if (n) { const a = slotsAll(); a[url][i].name = n.slice(0, 40); LS.set(SLKEY, a); draw(); } } } }),
          h('button', { type: 'button', text: 'Export', disabled: !s, on: { click: () => { const blob = new Blob([JSON.stringify({ format: 'gh-save-slot', version: 1, game: url, title: W.title, slot: s })], { type: 'application/json' }); const a = h('a', { href: URL.createObjectURL(blob), download: (W.title + ' - ' + s.name).replace(/[^\w .-]+/g, '') + '.json' }); D.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); } } }),
          h('button', { type: 'button', text: 'Delete', disabled: !s, on: { click: () => { I.msgBox('Delete "' + s.name + '"? This cannot be undone.', { title: 'Delete Slot', icon: 'warning', buttons: ['Yes', 'No'], def: 1, cancel: 'no' }).then(r => { if (r === 'yes') { const a = slotsAll(); delete a[url][i]; LS.set(SLKEY, a); draw(); } }); } } }));
        row.append(info, sb); list.append(row);
      }
    };
    imp.addEventListener('change', () => {
      const f = imp.files[0]; imp.value = ''; if (!f) return;
      f.text().then(t => { const j = JSON.parse(t); if (!j || j.format !== 'gh-save-slot' || j.game !== url || !j.slot || !j.slot.data) throw 0; const a = slotsAll(); const mine = a[url] = a[url] || {}; let i = 1; while (i <= NSLOT && mine[i]) i++; if (i > NSLOT) i = 1; mine[i] = Object.assign({}, j.slot, { name: (j.slot.name || 'Imported') }); LS.set(SLKEY, a); I.toast('Imported into slot ' + i + '.'); draw(); }).catch(() => I.msgBox('That file is not a save slot for ' + W.title + '.', { title: 'Import Slot', icon: 'warning' }));
    });
    draw();
    const body = h('div', { class: 'dialog-pad', style: { minWidth: '320px', maxHeight: '60vh', overflow: 'auto' } }, note, list, h('div', { style: { marginTop: '4px' } }, h('button', { type: 'button', class: 'btn', text: 'Import slot file…', on: { click: () => imp.click() } }), imp));
    I.openDialog({ title: 'Save Slots - ' + W.title, icon: IC('save-slot'), content: body, width: 470, buttons: [{ label: 'Close', value: 'close', default: true }] });
  }
  GH.slots = { open: id => { const W = wins.get(id); if (W) openSlots(W); }, list: () => slotsAll() };

  /* ===================== file-system extras ===================== */
  const clip = () => (window.__ghClip = window.__ghClip || { mode: null, ids: [] });
  function pasteInto(parent) {
    const c = clip(); if (!FS || !c.ids.length) return;
    const jobs = c.ids.map(id => { const m = FS.meta(id); if (!m) return null; if (c.mode === 'cut') return m.parent === parent ? null : FS.move(id, parent); return FS.copy(id, parent); }).filter(Boolean);
    Promise.all(jobs).then(() => { if (c.mode === 'cut') { c.ids = []; c.mode = null; } I.toast('Pasted ' + jobs.length + ' item(s).'); GH.emit('fs:paste'); });
  }
  function importPicker(parent) {
    const f = h('input', { type: 'file', multiple: true, hidden: true }); D.body.append(f);
    f.addEventListener('change', () => { const files = Array.from(f.files); Promise.all(files.map(x => FS.importFile(x, parent))).then(() => { I.toast('Added ' + files.length + ' file(s).'); GH.emit('fs:import'); }); setTimeout(() => f.remove(), 500); });
    f.click();
  }
  HOOKS.itemMenu = it => {
    if (!it || !it.vfs || !FS) return [];
    const id = it.vfs.id, folder = it.vfsFolder, c = clip(), out = [
      { label: 'Cu&t', onClick: () => { c.mode = 'cut'; c.ids = [id]; I.toast('Cut. Use Paste in another folder.'); } },
      { label: '&Copy', onClick: () => { c.mode = 'copy'; c.ids = [id]; I.toast('Copied. Use Paste in a folder.'); } },
      { label: 'D&uplicate', onClick: () => { const m = FS.meta(id); if (m) FS.copy(id, m.parent).then(() => GH.emit('fs:paste')); } }];
    if (folder) out.push({ label: '&Paste Into Folder', disabled: !c.ids.length, onClick: () => pasteInto(id) }, { label: 'Export as &ZIP…', onClick: () => FS.zipFolder(id).then(b => { const a = h('a', { href: URL.createObjectURL(b), download: (it.vfs.name || 'Folder') + '.zip' }); D.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }).catch(e => I.toast(e.message)) });
    else out.push({ label: 'Down&load', onClick: () => FS.download(id) });
    return out;
  };
  HOOKS.pasteMenu = parent => [{ label: '&Paste', disabled: !clip().ids.length, onClick: () => pasteInto(parent) }];
  const origNew = HOOKS.newMenu;
  HOOKS.newMenu = parent => {
    const base = origNew ? origNew(parent) : [];
    return base.concat([{ sep: true }, { label: '&WordPad Document', onClick: () => FS.create({ parent, name: 'New WordPad Document.htm', kind: 'file', mime: 'text/html', data: '<!DOCTYPE html><html><body></body></html>' }).then(m => { GH.emit('fs:new'); }) }, { label: '&Import File from Computer…', onClick: () => importPicker(parent) }]);
  };
  /* drag files from the host computer onto the desktop */
  const hasFiles = e => e.dataTransfer && Array.from(e.dataTransfer.types || []).indexOf('Files') >= 0;
  desk.addEventListener('dragover', e => { if (hasFiles(e) && !e.target.closest('.win')) e.preventDefault(); });
  desk.addEventListener('drop', e => {
    if (!hasFiles(e) || e.target.closest('.win') || !FS) return; e.preventDefault();
    const files = Array.from(e.dataTransfer.files); Promise.all(files.map(f => FS.importFile(f, 'desktop'))).then(() => { I.toast('Added ' + files.length + ' file(s) to the desktop.'); GH.emit('fs:import'); });
  });
  /* desktop right-click and Start menu additions */
  HOOKS.desktopExtra = () => [
    { label: '&Paste', disabled: !clip().ids.length, onClick: () => pasteInto('desktop') },
    { label: 'Wi&dgets', submenu: () => GH.widgets.menuItems() },
    { label: '&Tapey', submenu: () => [{ label: T.enabled ? '&Hide Tapey' : '&Show Tapey', onClick: () => GH.tapey.toggle() }, { label: 'Tapey &Settings…', onClick: () => GH.openItem('app:tapey') }, { label: 'Ask Tapey…', disabled: !T.enabled, onClick: () => menu() }] },
    { label: 'Play &Random Game', onClick: () => GH.randomGame() }
  ];
  HOOKS.startPrograms = () => [
    { label: 'Play &Random Game', icon: IC('dice'), onClick: () => GH.randomGame() },
    { label: 'File &Manager', icon: IC('filemanager'), onClick: () => GH.openItem('app:filemanager') }
  ];
  HOOKS.startSettings = () => [
    { label: 'Desktop &Widgets', icon: IC('widgets'), submenu: () => GH.widgets.menuItems() },
    { label: '&Tapey Settings…', icon: 'images/tapey/tapey-idle.svg', onClick: () => GH.openItem('app:tapey') },
    { label: 'A&chievements', icon: IC('achievements'), onClick: () => GH.openItem('app:achievements') }
  ];
  /* a few Run-box / Find aliases */
  if (GH.fx) GH.fx.randomGame = GH.randomGame;
  GH.emit('os-more:ready');
})();
