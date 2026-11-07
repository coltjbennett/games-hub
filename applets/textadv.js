/* textadv.js: a small text-adventure engine for ColtonOS (used by textgames.html and the MS-DOS Prompt).
 *
 *  TextAdv.make(def, io) -> { intro(), input(line), done, id }
 *  - io.print(text) prints a line; io.art(text) (optional) prints monospace ASCII art; io.event(name) tells the shell about wins.
 *  - Progress saves automatically after every turn (localStorage 'gh-adv-save-<id>') and resumes next time.
 *    Endings you have reached are remembered separately ('gh-adv-end-<id>'), so you can chase all of them.
 *
 *  An adventure definition (see textadv-games.js):
 *    { id, title, start, rooms:{ id:{ n:'Name', d:'text' | fn(S), x:{ n:'room' | {to,need}, ... }, items:['id'], art:'key', dark:true } },
 *      items:{ id:{ n:'a brass lamp', w:'lamp brass', d:'examine text', fixed:true, hide:true } },
 *      art:{ key:'ascii' }, endings:{ id:'Title' }, init(S,api), act(verb,a,b,S,api) -> true if handled, tick(S,api), enter(room,S,api),
 *      guard(room,dir,to,S,api) -> message string if the move is blocked, hint(S), notes(S), light(S), intro:'text', introArt:'key' }
 */
(function (g) {
  'use strict';
  var DIRS = { n: 'n', s: 's', e: 'e', w: 'w', u: 'u', d: 'd', north: 'n', south: 's', east: 'e', west: 'w', up: 'u', down: 'd', ne: 'ne', nw: 'nw', se: 'se', sw: 'sw', northeast: 'ne', northwest: 'nw', southeast: 'se', southwest: 'sw', 'in': 'in', out: 'out', inside: 'in', outside: 'out', enter: 'in', exit: 'out' };
  var DNAME = { n: 'North', s: 'South', e: 'East', w: 'West', u: 'Up', d: 'Down', ne: 'Northeast', nw: 'Northwest', se: 'Southeast', sw: 'Southwest', 'in': 'In', out: 'Out' };
  var ARTICLE = /^(the|a|an|my|some|that|this|at|to|on|up|with|from|into|in|onto|over)$/;
  var VSYN = { get: 'take', grab: 'take', carry: 'take', x: 'examine', inspect: 'examine', check: 'examine', study: 'examine', l: 'look', i: 'inventory', inv: 'inventory', q: 'quit', exit: 'quit',
    go: 'go', walk: 'go', run: 'go', move: 'go', climb: 'go', head: 'go', discard: 'drop', put: 'put', place: 'put', talk: 'talk', speak: 'talk', chat: 'talk', hit: 'attack', fight: 'attack', kill: 'attack', stab: 'attack', shoot: 'attack', z: 'wait', rest: 'wait', sleep: 'wait',
    unlock: 'open', inspect2: 'examine', shout: 'say', yell: 'say', whisper: 'say', give: 'give', hand: 'give', offer: 'give', feed: 'give', throw: 'give', turn: 'use', light: 'use', switch: 'use', press: 'push', pull: 'push', flip: 'push', activate: 'use', equip: 'use', wear: 'use', eat: 'eat', consume: 'eat', drink: 'eat', ask: 'ask', question: 'ask', interrogate: 'ask', quiz: 'ask', hint: 'hint', help: 'help', '?': 'help' };

  function words(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9:'\s-]/g, ' ').split(/\s+/).filter(Boolean); }

  function make(def, io) {
    var KEY = 'gh-adv-save-' + def.id, EK = 'gh-adv-end-' + def.id, S, self = { done: false, id: def.id }, api = {}, confirm = '', ended = false;
    var LS = { get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) {} }, del: function (k) { try { window.localStorage.removeItem(k); } catch (e) {} } };
    function p(t) { io.print(t); }
    function art(k) { var a = def.art && def.art[k]; if (a) (io.art || io.print)(a.replace(/^\n/, '').replace(/\n$/, '')); }
    function ev(n, d) { io.event && io.event(n, d); }
    function endingsSeen() { try { return JSON.parse(LS.get(EK) || '[]') || []; } catch (e) { return []; } }
    function fresh() {
      S = { room: def.start, inv: [], f: {}, loc: {}, turns: 0, score: 0, scored: {}, over: false, v: 1 };
      Object.keys(def.rooms).forEach(function (id) { S.loc[id] = (def.rooms[id].items || []).slice(); });
      def.init && def.init(S, api);
    }
    function persist() { if (S.over) LS.del(KEY); else LS.set(KEY, JSON.stringify(S)); }

    /* ---------- helpers for adventure authors ---------- */
    api.p = p; api.art = art; api.S = function () { return S; };
    api.has = function (id) { return S.inv.indexOf(id) >= 0; };
    api.here = function (id) { return (S.loc[S.room] || []).indexOf(id) >= 0; };
    api.near = function (id) { return api.has(id) || api.here(id); };
    api.add = function (id) { if (!api.has(id)) { api.rm(id); S.inv.push(id); } };
    api.rm = function (id) { var i = S.inv.indexOf(id); if (i >= 0) S.inv.splice(i, 1); Object.keys(S.loc).forEach(function (r) { var j = S.loc[r].indexOf(id); if (j >= 0) S.loc[r].splice(j, 1); }); };
    api.put = function (id, room) { api.rm(id); (S.loc[room || S.room] = S.loc[room || S.room] || []).push(id); };
    api.f = function (k, v) { if (v === undefined) return S.f[k]; S.f[k] = v; return v; };
    api.score = function (n, key) { if (key) { if (S.scored[key]) return; S.scored[key] = 1; } S.score += n; };
    api.rand = function (n) { return Math.floor(Math.random() * n); };
    api.pick = function (a) { return a[api.rand(a.length)]; };
    api.item = function (noun) { return find(noun); };
    api.go = function (room) { S.room = room; look(true); def.enter && def.enter(room, S, api); };
    api.look = function () { look(true); };
    api.end = function (id, title, text, artKey) {
      if (artKey) art(artKey);
      p('\n' + text + '\n\n*** THE END: ' + title + ' ***');
      var seen = endingsSeen(); if (seen.indexOf(id) < 0) { seen.push(id); LS.set(EK, JSON.stringify(seen)); }
      var total = def.endings ? Object.keys(def.endings).length : 0;
      p('Moves: ' + S.turns + '   Score: ' + Math.min(S.score, def.maxScore || 100) + '/' + (def.maxScore || 100) + (total ? '   Endings found: ' + seen.length + '/' + total : ''));
      if (total && seen.length < total) p('(There are other ways this story can end. Press Enter or pick the game again to start a new run.)');
      S.over = true; self.done = true; ended = true; persist();
      ev('adv:ending', { adv: def.id, ending: id, n: seen.length, total: total }); ev('adv:' + def.id + ':' + id);
      if (def.win && def.win.indexOf(id) >= 0) ev('win:adventure');
      if (total && seen.length >= total) ev('adv:allendings');
    };

    /* ---------- world ---------- */
    function room() { return def.rooms[S.room]; }
    function lit() { var r = room(); return !r.dark || (def.light ? def.light(S) : true); }
    function itemName(id) { return (def.items[id] && def.items[id].n) || id; }
    function exitInfo(r, d) {
      var x = r.x && r.x[d]; if (!x) return null; if (typeof x === 'string') return { to: x };
      if (x.need && !S.f[x.need]) return null; return x;
    }
    function look(full) {
      var r = room();
      if (!lit()) { p('\n== Darkness ==\nIt is pitch black. You can\'t see a thing.'); return; }
      if (r.art) art(r.art);
      p('\n== ' + r.n + ' ==');
      var d = typeof r.d === 'function' ? r.d(S, api) : r.d; if (full !== false && d) p(d);
      var shown = (S.loc[S.room] || []).filter(function (id) { var it = def.items[id]; return it && !it.hide && !it.fixed; }).map(itemName);
      if (shown.length) p('You see: ' + shown.join(', ') + '.');
      var ex = Object.keys(DNAME).filter(function (d2) { return exitInfo(r, d2); }).map(function (d2) { return DNAME[d2].toUpperCase(); });
      p('Exits: ' + (ex.length ? ex.join(', ') : 'none'));
    }
    function find(noun) {
      var t = words(noun).filter(function (w) { return !ARTICLE.test(w); }); if (!t.length) return null;
      var pools = [S.inv, S.loc[S.room] || []], i, j, k;
      for (i = 0; i < pools.length; i++) for (j = 0; j < pools[i].length; j++) {
        var it = def.items[pools[i][j]]; if (!it) continue; var al = words(it.w || pools[i][j]).concat(words(pools[i][j]));
        var ok = true; for (k = 0; k < t.length; k++) if (al.indexOf(t[k]) < 0) { ok = false; break; } if (ok) return pools[i][j];
      }
      return null;
    }
    function splitNouns(rest) {
      var m = /^(.*?)\s+(?:on|to|with|in|into|onto|about|at|from|for|against)\s+(.*)$/.exec(rest);
      return m ? [m[1], m[2]] : [rest, ''];
    }

    /* ---------- the turn ---------- */
    function move(dir) {
      var r = room(), d = DIRS[dir]; var x = d && exitInfo(r, d);
      if (!x) { p('You can\'t go that way.'); return false; }
      var to = x.to, why = def.guard && def.guard(S.room, d, to, S, api); if (why) { p(why); return true; }
      S.room = to; look(true); def.enter && def.enter(to, S, api); return true;
    }
    function meta(v, rest) {
      switch (v) {
        case 'inventory': p(S.inv.length ? 'You are carrying: ' + S.inv.map(itemName).join(', ') + '.' : 'You are empty-handed.'); return true;
        case 'score': p('Score: ' + Math.min(S.score, def.maxScore || 100) + '/' + (def.maxScore || 100) + ' in ' + S.turns + ' moves.'); return true;
        case 'hint': p(def.hint ? def.hint(S) : 'No hints for this one.'); return true;
        case 'notes': case 'journal': case 'notebook': p(def.notes ? def.notes(S) : 'You have no notes.'); return true;
        case 'save': p('Your progress saves automatically after every move. Come back any time and you will pick up right here.'); return true;
        case 'endings': { var seen = endingsSeen(), all = def.endings || {}; p('Endings found: ' + seen.length + '/' + Object.keys(all).length); Object.keys(all).forEach(function (k) { p('  ' + (seen.indexOf(k) >= 0 ? '[x] ' + all[k] : '[ ] ???')); }); return true; }
        case 'quit': p('Your progress is saved. Goodbye!'); self.done = true; return true;
        case 'restart': case 'new': case 'newgame': if (confirm !== 'restart') { confirm = 'restart'; p('This erases your saved progress. Type RESTART again to confirm.'); return true; } confirm = ''; LS.del(KEY); fresh(); p('\n--- A fresh start ---'); self.intro(true); return true;
        case 'help': p('Commands: N S E W U D (or GO NORTH), LOOK, EXAMINE thing, TAKE/DROP thing (TAKE ALL), INVENTORY, USE thing (ON thing), OPEN thing, GIVE thing TO someone, TALK TO someone, ASK someone ABOUT topic, READ thing, WAIT, SCORE, HINT, ENDINGS, RESTART, QUIT.' + (def.help ? '\n' + def.help : '') + '\nYour progress saves automatically.'); return true;
      }
      return false;
    }
    self.input = function (line) {
      if (self.done) return;
      var w = words(line); if (!w.length) return;
      var v0 = w[0], v = VSYN[v0] || v0, rest = w.slice(1).join(' ');
      if (v0 === 'look' && /^(at|in|inside)\b/.test(rest)) { v = 'examine'; rest = rest.replace(/^(at|in|inside)\s+/, ''); }
      if (v0 === 'pick' && /^up\b/.test(rest)) { v = 'take'; rest = rest.replace(/^up\s+/, ''); }
      if (v0 === 'turn' && /^(on|off)\b/.test(rest)) rest = rest.replace(/^(on|off)\s+/, '');
      if (v !== 'restart' && v !== 'new') confirm = '';
      if (meta(v, rest)) { if (!self.done) persist(); return; }
      var dir = DIRS[v0] || (v === 'go' && DIRS[rest.replace(/^(to the|to|the)\s+/, '').split(' ')[0]]);
      var used = true;
      if (DIRS[v0] && !(v0 === 'enter' || v0 === 'exit') || (v === 'go' && dir)) used = move(dir || DIRS[v0]);
      else if ((v0 === 'enter' || v0 === 'exit') && !rest) used = move(v0);
      else {
        var nn = splitNouns(rest), a = nn[0], b = nn[1];
        if (def.act && def.act(v, a, b, S, api, rest)) used = true;
        else used = standard(v, a, b, rest);
      }
      if (used !== false && !self.done) { S.turns++; def.tick && def.tick(S, api); }
      if (!ended) persist();
    };
    function standard(v, a, b, rest) {
      var id;
      switch (v) {
        case 'look': look(true); return false;
        case 'wait': p('Time passes.'); return true;
        case 'examine': id = find(a || rest); if (!id) { p(a ? 'You don\'t see that here.' : 'Examine what?'); return false; } if (!lit() && !api.has(id)) { p('It is too dark to see.'); return false; } p(def.items[id].d || 'Nothing special.'); return true;
        case 'take': {
          if (/^(all|everything)$/.test(a)) { if (!lit()) { p('It is too dark.'); return false; } var l = (S.loc[S.room] || []).filter(function (x) { var it = def.items[x]; return it && !it.fixed && !it.hide; }); if (!l.length) { p('There is nothing here to take.'); return false; } l.forEach(function (x) { takeOne(x); }); return true; }
          id = find(a); if (!id) { p(a ? 'You don\'t see that here.' : 'Take what?'); return false; } return takeOne(id);
        }
        case 'drop': id = find(a); if (!id || !api.has(id)) { p('You don\'t have that.'); return false; } api.put(id, S.room); p('Dropped.'); return true;
        case 'put': { id = find(a); if (id && api.has(id) && /^(down|here)$/.test(b || 'down')) { api.put(id, S.room); p('Dropped.'); return true; } p('You can\'t do that.'); return false; }
        case 'read': id = find(a); if (id && def.items[id].d) { p(def.items[id].d); return true; } p('There is nothing to read.'); return false;
        case 'talk': p('There is no one to talk to here.'); return false;
        case 'eat': p('That\'s not a good idea.'); return false;
        case 'say': p('Nothing happens.'); return true;
        case 'xyzzy': p('A hollow voice says "Fool."'); return true;
        case 'use': case 'open': case 'push': case 'give': case 'attack': case 'ask': p(def.deflt || 'That doesn\'t seem to do anything.'); return false;
      }
      p('I don\'t understand that. Type HELP for commands.'); return false;
    }
    function takeOne(id) {
      var it = def.items[id];
      if (!lit()) { p('You can\'t see a thing.'); return false; }
      if (api.has(id)) { p('You already have that.'); return false; }
      if (!api.here(id)) { p('You don\'t see that here.'); return false; }
      if (it.fixed) { p(it.noTake || 'You can\'t take that.'); return false; }
      var r = def.take && def.take(id, S, api); if (r) { p(r); return false; }
      api.rm(id); S.inv.push(id); p('Taken: ' + it.n + '.'); def.taken && def.taken(id, S, api); return true;
    }

    self.intro = function (silent) {
      if (!silent) {
        var saved = LS.get(KEY), loaded = false;
        if (saved) { try { var o = JSON.parse(saved); if (o && o.room && def.rooms[o.room]) { S = o; loaded = true; } } catch (e) {} }
        if (!loaded) fresh();
        if (loaded) { if (def.introArt) art(def.introArt); p(def.title.toUpperCase() + '\n(Welcome back! Your saved progress was restored. Type RESTART for a fresh start, or ENDINGS to see what you have found.)'); look(true); return; }
      }
      if (def.introArt) art(def.introArt);
      p(def.title.toUpperCase() + '\n' + (def.intro || '') + '\nType HELP for commands. Progress saves automatically.');
      look(true); def.enter && def.enter(S.room, S, api);
    };
    return self;
  }
  g.TextAdv = { make: make, games: g.TextAdv && g.TextAdv.games || {}, endings: function (id) { try { return JSON.parse(window.localStorage.getItem('gh-adv-end-' + id) || '[]'); } catch (e) { return []; } } };
})(typeof window !== 'undefined' ? window : this);
