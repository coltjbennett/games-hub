/* textgames-core.js — shared text-game engine (Text Games applet + MS-DOS Prompt).
 * TextGames.list()                -> [{id,name,desc}]
 * TextGames.start(id, io)         -> game  (io = { print(text), event(name) })
 * game.input(line)                -> feeds one line of player input
 * game.done                       -> true once the game has ended (player returned to the menu/prompt)
 */
(function (g) {
  'use strict';
  var rnd = function (n) { return Math.floor(Math.random() * n); };
  var pick = function (a) { return a[rnd(a.length)]; };
  var WORDS = ['COMPUTER', 'KEYBOARD', 'MONITOR', 'FLOPPY', 'MODEM', 'WINDOW', 'DESKTOP', 'PROGRAM', 'CURSOR', 'ICON', 'FOLDER', 'DIALUP', 'NETWORK', 'PIXEL', 'JOYSTICK', 'ARCADE', 'CARTRIDGE', 'SCREEN', 'MEMORY', 'BROWSER', 'SCOTCH', 'CLIPBOARD', 'TASKBAR', 'SHORTCUT', 'POLYGON', 'ANTIVIRUS', 'SPREADSHEET', 'BACKUP', 'WALLPAPER', 'HIGHSCORE'];

  /* ---------------- The Copper Key (adventure) ---------------- */
  function adventure(io) {
    var R = {
      porch: { n: 'Front Porch', d: 'You stand on the creaky porch of an abandoned workshop. A sign reads: "BACK IN 5 MINUTES" (it has clearly been longer). The front door is open to the north. A gravel path leads east.', x: { n: 'hall', e: 'garden' } },
      garden: { n: 'Overgrown Garden', d: 'Weeds crowd a broken fountain. Something shiny winks at the bottom of the fountain. A shed stands to the south; the porch is west.', x: { w: 'porch', s: 'shed' }, items: ['coin'] },
      shed: { n: 'Tool Shed', d: 'Rusty tools hang from hooks. A coil of rope sits in the corner. The garden is north.', x: { n: 'garden' }, items: ['rope', 'lamp'] },
      hall: { n: 'Entrance Hall', d: 'Dusty portraits of famous tape dispensers line the walls. Doors lead east and west; stairs go up. The porch is south. A trapdoor in the floor is boarded shut... mostly.', x: { s: 'porch', e: 'kitchen', w: 'study', u: 'attic', d: 'cellar' }, items: [] },
      kitchen: { n: 'Kitchen', d: 'Pots hang from the ceiling. A bowl of surprisingly fresh apples sits on the counter. The hall is west.', x: { w: 'hall' }, items: ['apple'] },
      study: { n: 'Study', d: 'A big desk, a bigger bookshelf. A faded NOTE is pinned to the desk. The hall is east.', x: { e: 'hall' }, items: ['note'] },
      attic: { n: 'Attic', d: 'Cobwebs everywhere. A tiny window lets in a beam of light. Something glints in a trunk. The stairs lead down.', x: { d: 'hall' }, items: ['key'] },
      cellar: { n: 'Dark Cellar', d: 'The air is cold and damp. Tunnels lead north. Stairs go up.', x: { u: 'hall', n: 'tunnel' }, dark: true },
      tunnel: { n: 'Narrow Tunnel', d: 'The tunnel narrows. A grumpy TROLL blocks the way north, chewing on nothing in particular. The cellar is south.', x: { s: 'cellar', n: 'vault' }, dark: true, troll: true },
      vault: { n: 'The Vault', d: 'A heavy iron door stands open. Inside, on a velvet cushion, rests the legendary GOLDEN TAPE ROLL!', x: { s: 'tunnel' }, items: ['treasure'], locked: true }
    };
    var NAMES = { lamp: 'a brass lamp', rope: 'a coil of rope', coin: 'a gold coin', apple: 'a shiny apple', note: 'a faded note', key: 'a copper key', treasure: 'the Golden Tape Roll' };
    var cur = 'porch', inv = [], moves = 0, lit = false, trollGone = false, doorOpen = false, score = 0, ended = false;
    R.hall.locked = false; var cellarDoor = false;
    var self = { done: false };
    function p(s) { io.print(s); }
    function describe(full) {
      var r = R[cur];
      if (r.dark && !(inv.indexOf('lamp') >= 0 && lit)) { p('\n== ' + 'Darkness' + ' ==\nIt is pitch black. You might be eaten by a grue. (Try LIGHT LAMP, or go back.)'); return; }
      p('\n== ' + r.n + ' ==');
      if (full !== false) p(r.d);
      if (cur === 'tunnel' && trollGone) p('(The troll has wandered off, munching happily.)');
      var it = (r.items || []).filter(Boolean); if (it.length) p('You see: ' + it.map(function (i) { return NAMES[i]; }).join(', ') + '.');
      var ex = Object.keys(r.x).join(', ').toUpperCase(); p('Exits: ' + ex);
    }
    function find(word) { word = (word || '').toLowerCase(); if (!word) return null; for (var k in NAMES) { if (k === word || NAMES[k].indexOf(word) >= 0) return k; } return null; }
    function go(dir) {
      var d = { n: 'n', s: 's', e: 'e', w: 'w', u: 'u', d: 'd', north: 'n', south: 's', east: 'e', west: 'w', up: 'u', down: 'd' }[dir]; var r = R[cur];
      if (!d || !r.x[d]) { p("You can't go that way."); return; }
      var to = r.x[d];
      if (cur === 'hall' && d === 'd' && !cellarDoor) { p('The trapdoor is held shut by a copper lock. You need a key.'); return; }
      if (cur === 'tunnel' && d === 'n' && !trollGone) { p('The troll growls and blocks your way. "NOBODY PASSES WITHOUT A SNACK!"'); return; }
      if (to === 'vault' && !doorOpen) { p('The vault door is shut tight.'); return; }
      cur = to; moves++; describe();
    }
    function take(w) {
      var r = R[cur], k = find(w); if (!k) { p('Take what?'); return; }
      if (r.dark && !lit) { p("You can't see a thing."); return; }
      var i = (r.items || []).indexOf(k); if (i < 0) { p("You don't see that here."); return; }
      if (cur === 'garden' && k === 'coin' && inv.indexOf('rope') < 0 && !self._fount) { p('The coin is at the bottom of the fountain, just out of reach. If only you had a rope to lower yourself... (hint: bring rope)'); return; }
      r.items.splice(i, 1); inv.push(k); p('Taken: ' + NAMES[k] + '.');
      if (k === 'treasure') { score += 50; win(); }
    }
    function win() {
      ended = true; p('\n*** You grab the Golden Tape Roll. It hums with sticky power! ***\nThe floor trembles, and you sprint out of the workshop into the sunshine.\nIt was worth every step.\n\nYou finished in ' + moves + ' moves, score ' + (score + Math.max(0, 40 - moves)) + '/100.\nTHE END. (Tapey is very proud of you.)');
      io.event && io.event('win:adventure'); self.done = true;
    }
    self.intro = function () { p('THE COPPER KEY\nA tiny text adventure. Type HELP for commands, QUIT to leave.'); describe(); };
    self.input = function (line) {
      if (self.done) return;
      var w = line.trim().toLowerCase().split(/\s+/), v = w[0], o = w.slice(1).join(' ');
      if (!v) return;
      if (/^(n|s|e|w|u|d|north|south|east|west|up|down)$/.test(v)) return go(v);
      switch (v) {
        case 'go': case 'walk': case 'move': return go(o);
        case 'look': case 'l': return describe();
        case 'inventory': case 'i': case 'inv': return p(inv.length ? 'You carry: ' + inv.map(function (x) { return NAMES[x]; }).join(', ') + '.' : 'You are empty-handed.');
        case 'take': case 'get': case 'grab': return take(o);
        case 'drop': { var k = find(o); var i = inv.indexOf(k); if (i < 0) return p("You don't have that."); inv.splice(i, 1); (R[cur].items = R[cur].items || []).push(k); return p('Dropped.'); }
        case 'read': if (find(o) === 'note' && inv.indexOf('note') >= 0) return p('The note says: "Trolls love apples. The vault never opens without the copper key. Light your way below." -T'); return p('Read what?');
        case 'light': case 'turn': case 'use': {
          var t = find(o.replace(/^on\s+/, ''));
          if (t === 'lamp' && inv.indexOf('lamp') >= 0) { lit = true; p('The lamp glows warmly.'); if (R[cur].dark) describe(); return; }
          if (t === 'key' && inv.indexOf('key') >= 0) { if (cur === 'hall') { cellarDoor = true; return p('Click! The trapdoor lock springs open.'); } if (cur === 'tunnel' && trollGone) { doorOpen = true; return p('Click! The vault door swings open.'); } return p('Nothing to unlock here.'); }
          if (t === 'rope' && inv.indexOf('rope') >= 0 && cur === 'garden') { self._fount = true; return p('You tie the rope to the fountain and fish out the coin. Now you can TAKE COIN.'); }
          return p("That doesn't do anything.");
        }
        case 'unlock': case 'open': if (inv.indexOf('key') < 0) return p('You need a key.'); if (cur === 'hall') { cellarDoor = true; return p('Click! The trapdoor lock springs open.'); } if (cur === 'tunnel') { if (!trollGone) return p('The troll is in the way.'); doorOpen = true; return p('Click! The vault door swings open.'); } return p('Nothing to open here.');
        case 'give': case 'feed': case 'throw': { var k2 = find(o.replace(/ to .*$/, '')); if (cur !== 'tunnel') return p('There is no one here to give things to.'); if (k2 === 'apple' && inv.indexOf('apple') >= 0) { inv.splice(inv.indexOf('apple'), 1); trollGone = true; score += 20; return p('The troll snatches the apple. "MMM. CRUNCH." He wanders off, happy. The way north is clear!'); } if (k2 === 'coin' && inv.indexOf('coin') >= 0) return p('The troll bites the coin and spits it out. "NOT A SNACK."'); return p("The troll isn't interested."); }
        case 'help': case '?': return p('Commands: N S E W U D, LOOK, TAKE/DROP item, INVENTORY, READ item, LIGHT LAMP, USE item, OPEN, GIVE item, QUIT.');
        case 'quit': case 'exit': case 'q': p('You wander off. Goodbye!'); self.done = true; return;
        case 'xyzzy': return p('A hollow voice says "Fool."');
        case 'tape': case 'tapey': return p('A friendly roll of tape peeks out from a crack in the wall and gives you a thumbs-up. (You have no thumbs, but you feel encouraged.)');
        default: p("I don't understand that. Type HELP.");
      }
    };
    return self;
  }

  /* ---------------- Hangman ---------------- */
  function hangman(io) {
    var word = pick(WORDS), got = {}, miss = 0, MAX = 7, self = { done: false };
    var ART = ['', '  O', '  O\n  |', '  O\n /|', '  O\n /|\\', '  O\n /|\\\n /', '  O\n /|\\\n / \\', '  X\n /|\\\n / \\   (hanged!)'];
    function show() { return word.split('').map(function (c) { return got[c] ? c : '_'; }).join(' '); }
    function status() { io.print('\n' + (miss ? ART[miss] + '\n' : '') + '\nWord: ' + show() + '\nMisses: ' + Object.keys(got).filter(function (c) { return word.indexOf(c) < 0; }).join(' ') + '  (' + (MAX - miss) + ' left)'); }
    self.intro = function () { io.print('HANGMAN\nGuess the computer-themed word one letter at a time. Type QUIT to leave.'); status(); };
    self.input = function (line) {
      var s = line.trim().toUpperCase(); if (!s) return;
      if (s === 'QUIT') { io.print('The word was ' + word + '.'); self.done = true; return; }
      if (s.length > 1) { if (s === word) { io.print('YES! The word was ' + word + '!'); io.event && io.event('win:hangman'); self.done = true; return; } miss++; io.print('Nope, that is not the word.'); }
      else if (!/[A-Z]/.test(s)) { io.print('Type a letter.'); return; }
      else if (got[s]) { io.print('You already tried ' + s + '.'); return; }
      else { got[s] = 1; if (word.indexOf(s) < 0) miss++; }
      if (word.split('').every(function (c) { return got[c]; })) { status(); io.print('\nYou win! The word was ' + word + '.'); io.event && io.event('win:hangman'); self.done = true; return; }
      if (miss >= MAX) { status(); io.print('\nYou lose. The word was ' + word + '.'); self.done = true; return; }
      status();
    };
    return self;
  }

  /* ---------------- Guess the number ---------------- */
  function guess(io) {
    var n = 1 + rnd(100), tries = 0, self = { done: false };
    self.intro = function () { io.print('GUESS THE NUMBER\nI am thinking of a number from 1 to 100. You have 8 tries. Type QUIT to leave.'); };
    self.input = function (line) {
      var s = line.trim(); if (/^quit$/i.test(s)) { io.print('It was ' + n + '.'); self.done = true; return; }
      var v = parseInt(s, 10); if (isNaN(v) || v < 1 || v > 100) { io.print('Enter a number from 1 to 100.'); return; }
      tries++;
      if (v === n) { io.print('Correct! You got it in ' + tries + ' ' + (tries === 1 ? 'try' : 'tries') + '!'); io.event && io.event('win:guess' + (tries <= 5 ? ':fast' : '')); self.done = true; return; }
      if (tries >= 8) { io.print('Out of tries! The number was ' + n + '.'); self.done = true; return; }
      io.print((v < n ? 'Too low.' : 'Too high.') + ' (' + (8 - tries) + ' left)');
    };
    return self;
  }

  /* ---------------- Mad Libs ---------------- */
  var LIBS = [
    { t: 'Yesterday my {adjective} computer {past-tense verb} all over the {noun}. I had to call {name} and say, "{exclamation}!" Now I only use a {adjective} {noun}.', title: 'Computer Trouble' },
    { t: 'Welcome to {place}! Today you will {verb} a giant {noun} while wearing {plural noun}. Please remain {adjective} at all times, and do not feed the {animal}.', title: 'Theme Park' },
    { t: 'Dear {name}, I am writing to tell you that my {animal} has learned to {verb}. It is very {adjective}. Please send {number} {plural noun} immediately. Sincerely, {name}.', title: 'Letter Home' }
  ];
  function madlibs(io) {
    var L = pick(LIBS), slots = L.t.match(/\{[^}]+\}/g), vals = [], self = { done: false };
    function ask() { io.print('Give me ' + (/^\{[aeiou]/i.test(slots[vals.length]) ? 'an ' : 'a ') + slots[vals.length].slice(1, -1) + ':'); }
    self.intro = function () { io.print('MAD LIBS: ' + L.title + '\nI will ask for some words. Type QUIT to leave.\n'); ask(); };
    self.input = function (line) {
      var s = line.trim(); if (/^quit$/i.test(s)) { self.done = true; return; } if (!s) return;
      vals.push(s); if (vals.length < slots.length) return ask();
      var i = 0; io.print('\n' + L.t.replace(/\{[^}]+\}/g, function () { return vals[i++].toUpperCase(); }) + '\n'); io.event && io.event('win:madlibs'); self.done = true;
    };
    return self;
  }

  /* ---------------- Word scramble ---------------- */
  function scramble(io) {
    var round = 0, score = 0, word = '', self = { done: false }, ROUNDS = 5;
    function nextWord() { word = pick(WORDS); var a = word.split(''), s; do { for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } s = a.join(''); } while (s === word); round++; io.print('\nWord ' + round + '/' + ROUNDS + ':  ' + s + '   (type SKIP to pass)'); }
    self.intro = function () { io.print('WORD SCRAMBLE\nUnscramble ' + ROUNDS + ' words. Type QUIT to leave.'); nextWord(); };
    self.input = function (line) {
      var s = line.trim().toUpperCase(); if (!s) return;
      if (s === 'QUIT') { self.done = true; return; }
      if (s === 'SKIP') io.print('It was ' + word + '.'); else if (s === word) { score++; io.print('Correct!'); } else { io.print('Nope, it was ' + word + '.'); }
      if (round >= ROUNDS) { io.print('\nFinal score: ' + score + '/' + ROUNDS + '.'); if (score === ROUNDS) io.event && io.event('win:scramble'); self.done = true; return; }
      nextWord();
    };
    return self;
  }

  /* ---------------- Blackjack ---------------- */
  function blackjack(io) {
    var self = { done: false }, deck = [], ph = [], dh = [], chips = 100, bet = 10, state = 'bet';
    function fresh() { deck = []; ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'].forEach(function (r) { for (var i = 0; i < 4; i++) deck.push(r); }); for (var i = deck.length - 1; i > 0; i--) { var j = rnd(i + 1), t = deck[i]; deck[i] = deck[j]; deck[j] = t; } }
    function val(h) { var t = 0, a = 0; h.forEach(function (c) { if (c === 'A') { a++; t += 11; } else if ('JQK'.indexOf(c) >= 0 || c === '10') t += 10; else t += +c; }); while (t > 21 && a) { t -= 10; a--; } return t; }
    function draw() { if (deck.length < 10) fresh(); return deck.pop(); }
    function showHands(hide) { io.print('Dealer: ' + (hide ? dh[0] + ' ?' : dh.join(' ') + ' (' + val(dh) + ')') + '\nYou:    ' + ph.join(' ') + ' (' + val(ph) + ')'); }
    function deal() { fresh(); ph = [draw(), draw()]; dh = [draw(), draw()]; state = 'play'; io.print('\nChips: ' + chips + '  Bet: ' + bet); showHands(true); if (val(ph) === 21) { io.print('Blackjack!'); settle('bj'); } else io.print('(H)it or (S)tand?'); }
    function settle(how) {
      var r;
      if (how === 'bj') { chips += Math.floor(bet * 1.5); r = 'Blackjack pays 3 to 2!'; }
      else { while (val(dh) < 17) dh.push(draw()); showHands(false); var p = val(ph), d = val(dh); if (p > 21) { chips -= bet; r = 'Bust! You lose.'; } else if (d > 21 || p > d) { chips += bet; r = 'You win!'; } else if (p === d) r = 'Push.'; else { chips -= bet; r = 'Dealer wins.'; } }
      io.print(r + '  Chips: ' + chips);
      if (chips >= 200) { io.print('You doubled your chips! The house is impressed.'); io.event && io.event('win:blackjack'); }
      if (chips <= 0) { io.print('You are out of chips. Game over.'); self.done = true; return; }
      state = 'bet'; bet = Math.min(bet, chips); io.print('\nBet? (current ' + bet + ', or QUIT)');
    }
    self.intro = function () { io.print('BLACKJACK\nStart with 100 chips. Reach 200 to win. Type QUIT to leave.'); deal(); };
    self.input = function (line) {
      var s = line.trim().toLowerCase(); if (s === 'quit') { io.print('You cash out with ' + chips + ' chips.'); self.done = true; return; }
      if (state === 'bet') { var n = parseInt(s, 10); if (!isNaN(n) && n > 0) bet = Math.min(n, chips); return deal(); }
      if (s === 'h' || s === 'hit') { ph.push(draw()); if (val(ph) > 21) { showHands(false); settle(); } else { showHands(true); io.print('(H)it or (S)tand?'); } }
      else if (s === 's' || s === 'stand') settle(); else io.print('H to hit, S to stand.');
    };
    return self;
  }

  var G = {
    adventure: { name: 'The Copper Key', desc: 'A tiny text adventure', make: adventure },
    hangman: { name: 'Hangman', desc: 'Guess the computer word', make: hangman },
    guess: { name: 'Guess the Number', desc: '1 to 100 in 8 tries', make: guess },
    madlibs: { name: 'Mad Libs', desc: 'Fill in the blanks', make: madlibs },
    scramble: { name: 'Word Scramble', desc: 'Unscramble 5 words', make: scramble },
    blackjack: { name: 'Blackjack', desc: 'Beat the dealer', make: blackjack }
  };
  g.TextGames = {
    list: function () { return Object.keys(G).map(function (k) { return { id: k, name: G[k].name, desc: G[k].desc }; }); },
    has: function (id) { return !!G[id]; },
    start: function (id, io) { var o = G[id].make(io); o.id = id; return o; }
  };
})(typeof window !== 'undefined' ? window : this);
