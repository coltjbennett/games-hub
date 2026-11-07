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
  /* Big word pool: applets/words.js (25,000+ words) when loaded, otherwise the small themed list above. */
  function bigWord(min, max) {
    var P = g.GH_WORDS && g.GH_WORDS.p;
    if (!P || rnd(6) === 0) return pick(WORDS).toUpperCase();      /* now and then, a computer-themed word */
    for (var i = 0; i < 40; i++) { var w = pick(P); if (w.length >= min && w.length <= max) return w.toUpperCase(); }
    return pick(WORDS).toUpperCase();
  }

  /* ---------------- Hangman ---------------- */
  function hangman(io) {
    var word = bigWord(5, 12), got = {}, miss = 0, MAX = 7, self = { done: false };
    var ART = ['', '  O', '  O\n  |', '  O\n /|', '  O\n /|\\', '  O\n /|\\\n /', '  O\n /|\\\n / \\', '  X\n /|\\\n / \\   (hanged!)'];
    function show() { return word.split('').map(function (c) { return got[c] ? c : '_'; }).join(' '); }
    function status() { io.print('\n' + (miss ? ART[miss] + '\n' : '') + '\nWord: ' + show() + '\nMisses: ' + Object.keys(got).filter(function (c) { return word.indexOf(c) < 0; }).join(' ') + '  (' + (MAX - miss) + ' left)'); }
    self.intro = function () { io.print('HANGMAN\nGuess the word one letter at a time (the pool has thousands of words, so there are no repeats to memorise). Type QUIT to leave.'); status(); };
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
    function nextWord() { word = bigWord(5, 9); var a = word.split(''), s; do { for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } s = a.join(''); } while (s === word); round++; io.print('\nWord ' + round + '/' + ROUNDS + ':  ' + s + '   (type SKIP to pass)'); }
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
    hangman: { name: 'Hangman', desc: 'Guess the word, thousands to pick from', make: hangman },
    guess: { name: 'Guess the Number', desc: '1 to 100 in 8 tries', make: guess },
    madlibs: { name: 'Mad Libs', desc: 'Fill in the blanks', make: madlibs },
    scramble: { name: 'Word Scramble', desc: 'Unscramble 5 words', make: scramble },
    blackjack: { name: 'Blackjack', desc: 'Beat the dealer', make: blackjack }
  };
  /* The text adventures live in textadv.js / textadv-games.js */
  var ADV = { adventure: 'Multi-path puzzle adventure, 6 endings', station: 'Sci-fi survival: oxygen, power and a lonely AI', manor: 'Detective mystery: clues, suspects, an accusation', dragon: 'Fantasy RPG: three classes, combat, six endings', heist: 'Cyber stealth: heat, hacking and a betrayal' };
  if (g.TextAdv && g.TextAdv.games) {
    var AG = {}; Object.keys(ADV).forEach(function (id) { var d = g.TextAdv.games[id]; if (d) AG[id] = { name: d.title, desc: ADV[id], make: function (io) { return g.TextAdv.make(d, io); } }; });
    Object.keys(G).forEach(function (k) { AG[k] = G[k]; }); G = AG;
  }
  g.TextGames = {
    list: function () { return Object.keys(G).map(function (k) { return { id: k, name: G[k].name, desc: G[k].desc }; }); },
    has: function (id) { return !!G[id]; },
    start: function (id, io) { var o = G[id].make(io); o.id = id; return o; }
  };
})(typeof window !== 'undefined' ? window : this);
