/* textadv-games.js: the adventure library for ColtonOS (loaded after textadv.js).
   The Copper Key, Station Omega, Murder at Blackwood Manor, The Dragon's Tooth, Neon Heist. */
(function (g) {
  'use strict';
  var G = (g.TextAdv = g.TextAdv || {}).games = g.TextAdv.games || {};
  function time(s) { var t = String(s || '').toLowerCase(); return /quarter past (3|three)/.test(t) || t.replace(/[^0-9]/g, '') === '315'; }

  /* =============================== THE COPPER KEY =============================== */
  G.adventure = {
    id: 'adventure', title: 'The Copper Key', start: 'porch', maxScore: 100,
    intro: 'You have inherited Old Tapewright\'s crumbling house. The will mentions one thing only: the Golden Tape Roll, "the stickiest treasure in the world", hidden somewhere inside.\nThere is more than one way this story can end...',
    endings: { treasure: 'Treasure Hunter', keeper: 'Keeper of the Tape', apprentice: 'The Apprentice', sticky: 'Sticky Fingers', oops: 'Tape-tastrophe', visit: 'Just a Visit' },
    win: ['treasure', 'keeper', 'apprentice'],
    art: {
      house: '      ____\n     /    \\      ___\n    /______\\ ___|_|_|\n    | [] [] ||  ___  |\n    |  ____  | |_|_| |\n    |_|    |_|______|',
      tapey: '    .-"""-.\n   / (o)(o) \\\n  |   .--.   |\n   \\  \'--\'  /\n    \'-.__.-\'\n   (sticky!)',
      troll: '     ,-.\n    (o o)  "SNACK."\n   /|   |\\\n    |___|',
      vault: '   _________\n  |  _____  |\n  | |  O  | |\n  | |_____| |\n  |_________|',
      clock: '     .---.\n    / 12  \\\n   | 9   3 |\n    \\  6  /\n     \'---\'',
      roll: '    .--.\n   /    \\   GOLDEN\n   | () |   TAPE ROLL\n   \\    /\n    \'--\''
    },
    introArt: 'house',
    rooms: {
      gate: { n: 'Front Gate', d: 'A rusty iron gate hangs open. The road behind you leads back to town. A crooked path leads north to the house.', x: { n: 'porch', s: 'road' } },
      road: { n: 'The Road', d: 'You are on the road back to town.', x: { n: 'gate' } },
      porch: { n: 'Porch', d: 'A creaky porch with a dented mailbox. The front door is open to the north, a garden lies east, and the gate is south.', x: { n: 'hall', e: 'garden', s: 'gate' }, items: ['mailbox'] },
      garden: { n: 'Garden', d: 'An overgrown garden around a dry stone fountain. A glass greenhouse stands north, a shed south, and the porch is west.', x: { w: 'porch', n: 'greenhouse', s: 'shed' }, items: ['fountain'] },
      shed: { n: 'Garden Shed', d: 'Tools, dust, and spiders. The garden is north.', x: { n: 'garden' }, items: ['rope', 'lamp'] },
      greenhouse: { n: 'Greenhouse', d: 'Warm, humid, and full of strange plants. A pair of thick gardening gloves hangs on a hook. The garden is south.', x: { s: 'garden' }, items: ['glove', 'plant'] },
      hall: { n: 'Entrance Hall', d: 'A grand hall with a boarded-up trapdoor in the floor. Doors lead west (study), east (kitchen), north (library). Stairs go up. The porch is south.', x: { s: 'porch', w: 'study', e: 'kitchen', n: 'library', u: 'attic', d: 'cellar' }, items: ['trapdoor'] },
      study: { n: 'Study', d: 'Shelves of tape dispensers, and an oil portrait over the desk. The hall is east.', x: { e: 'hall' }, items: ['portrait', 'note'] },
      library: { n: 'Library', d: 'Dusty books to the ceiling. A spiral staircase winds up into the clock tower. The hall is south.', x: { s: 'hall', u: 'tower' }, items: ['book'] },
      tower: { n: 'Clock Tower', art: 'clock', d: function (S) { return 'A huge clock with no hands set. ' + (S.f.coinIn ? 'The hands are free to move: you could SET CLOCK to a time.' : 'There is a coin slot in its base, and the hands are locked.') + (S.f.clockSet ? ' A hidden door now stands open to the north!' : '') + ' The stairs go down.'; }, x: { d: 'library', n: { to: 'workshop', need: 'clockSet' } }, items: ['clock'] },
      kitchen: { n: 'Kitchen', d: 'Copper pots and a cold stove. A pantry is east, the hall is west.', x: { w: 'hall', e: 'pantry' } },
      pantry: { n: 'Pantry', d: 'Shelves of dusty jars. One shiny apple sits in a bowl. The kitchen is west.', x: { w: 'kitchen' }, items: ['apple'] },
      attic: { n: 'Attic', d: 'Cobwebs everywhere. An old trunk sits under a tiny window. The stairs go down.', x: { d: 'hall' }, items: ['trunk'] },
      cellar: { n: 'Cellar', dark: true, d: 'Damp stone walls and the smell of old glue. A tunnel runs north. Steps lead up to the hall.', x: { u: 'hall', n: 'tunnel' } },
      tunnel: { n: 'Tunnel', dark: true, art: 'troll', d: function (S) { return S.f.trollGone ? 'The troll has wandered off, munching. A heavy vault door is set into the north wall' + (S.f.vaultOpen ? ' (open).' : '.') : 'A TROLL fills the tunnel. "NOBODY PASSES WITHOUT A SNACK!" Behind him is a heavy vault door.'; }, x: { s: 'cellar', n: 'vault' }, items: ['troll', 'vdoor'] },
      vault: { n: 'The Vault', art: 'vault', d: 'A small round chamber. On a pedestal glows the Golden Tape Roll. A sign is bolted beside it. The tunnel is south.', x: { s: 'tunnel' }, items: ['roll', 'sign'] },
      workshop: { n: "Tapey's Workshop", art: 'tapey', d: 'A cosy secret workshop humming with tiny gears. A small, friendly roll of tape named TAPEY sits on a workbench. A big red lever is on the wall. The clock tower is south.', x: { s: 'tower' }, items: ['tapey', 'lever'] }
    },
    items: {
      mailbox: { n: 'a mailbox', w: 'mailbox box mail', fixed: true, hide: true, d: 'A dented mailbox. Maybe OPEN it?' },
      letter: { n: 'a letter', w: 'letter paper', d: 'It reads: "To my heir: the Golden Tape Roll can be reached two ways: below the house, past a hungry guard, or through my clock, if you know when Tapey was born. It is VERY sticky. Wear gloves. Better yet, bring it to Tapey himself. -- Old Tapewright"' },
      fountain: { n: 'a fountain', w: 'fountain', fixed: true, hide: true, d: function () { return 'A dry fountain. Something gold glints at the bottom, just out of reach.'; } },
      coin: { n: 'a gold coin', w: 'coin gold', d: 'A gold coin with a tiny tape dispenser stamped on it.' },
      rope: { n: 'a coil of rope', w: 'rope coil', d: 'Strong rope.' },
      lamp: { n: 'a brass lamp', w: 'lamp brass lantern light', d: 'A battered brass lamp. LIGHT it to see in the dark.' },
      glove: { n: 'thick gloves', w: 'glove gloves gardening', d: 'Thick, sticky-proof gardening gloves.' },
      plant: { n: 'a plant', w: 'plant plants', fixed: true, hide: true, d: 'A carnivorous plant sleeps peacefully. You leave it alone.' },
      trapdoor: { n: 'a trapdoor', w: 'trapdoor door hatch lock', fixed: true, hide: true, d: function (S) { return S.f.trapOpen ? 'The trapdoor is unlocked.' : 'A copper lock holds it shut. You need a key.'; } },
      portrait: { n: 'a portrait', w: 'portrait painting picture', fixed: true, hide: true, d: 'Old Tapewright holding a tiny roll of tape. The brass plate reads: "Tapey the Tape. Born at a quarter past three."' },
      note: { n: 'a faded note', w: 'note paper', d: 'It reads: "Trolls love apples. The vault never opens without the copper key. Light your way below."' },
      book: { n: 'a heavy book', w: 'book history', d: '"TAPE: A HISTORY." A bookmark is on a page: "...and the clock, set to the hour of his birth, will open the way to his workshop."' },
      apple: { n: 'a shiny apple', w: 'apple fruit snack', d: 'A very shiny apple. Somebody would love this.' },
      trunk: { n: 'a trunk', w: 'trunk chest', fixed: true, hide: true, d: 'A dusty trunk. Try OPEN.' },
      key: { n: 'a copper key', w: 'key copper', d: 'A small copper key.' },
      troll: { n: 'a troll', w: 'troll', fixed: true, hide: true, d: 'A very large, very hungry troll. He keeps sniffing the air.' },
      vdoor: { n: 'a vault door', w: 'vault door lock', fixed: true, hide: true, d: 'A heavy door with a copper keyhole.' },
      roll: { n: 'the Golden Tape Roll', w: 'roll golden gold tape treasure', d: 'It hums. It is extremely sticky.' },
      sign: { n: 'a sign', w: 'sign', fixed: true, hide: true, d: 'The sign says: "HANDLE WITH CARE. GLOVES STRONGLY RECOMMENDED. THE MANAGEMENT IS NOT RESPONSIBLE FOR STUCK HANDS."' },
      clock: { n: 'a clock', w: 'clock hands slot', fixed: true, hide: true, d: function (S) { return S.f.clockSet ? 'The clock reads 3:15.' : S.f.coinIn ? 'The hands are free. SET CLOCK to some time.' : 'The hands are locked. There is a coin slot.'; } },
      tapey: { n: 'Tapey', w: 'tapey tape roll friend', fixed: true, hide: true, d: 'A small, friendly roll of tape with big round eyes. He looks hopeful.' },
      lever: { n: 'a red lever', w: 'lever red', fixed: true, hide: true, d: 'A big red lever. A label says "DO NOT PULL".' }
    },
    init: function (S, api) { },
    light: function (S) { return S.inv.indexOf('lamp') >= 0 && !!S.f.lit; },
    guard: function (r, d, to, S, api) {
      if (r === 'hall' && d === 'd' && !S.f.trapOpen) return 'The trapdoor is locked tight. You need a key.';
      if (r === 'tunnel' && d === 'n' && !S.f.trollGone) return 'The troll growls and blocks the way. "NOBODY PASSES WITHOUT A SNACK!"';
      if (to === 'vault' && !S.f.vaultOpen) return 'The vault door is shut tight.';
      if (r === 'gate' && d === 's') {
        if (api.has('roll')) { api.end('treasure', 'Treasure Hunter', 'You stroll down the road with the Golden Tape Roll in your gloved hands. You are rich, powerful, and the stickiest person alive. Somewhere behind you, a small tape roll sighs.', 'roll'); return ' '; }
        api.end('visit', 'Just a Visit', 'You decide the old house is not for you and walk back to town. Maybe it was just a house after all...', 'house'); return ' ';
      }
      return null;
    },
    act: function (v, a, b, S, api) {
      var p = api.p, id = api.item(a), has = api.has;
      if (v === 'open') {
        if (/mailbox|box|mail/.test(a)) { if (S.f.mail) { p('It is empty now.'); return true; } S.f.mail = 1; api.put('letter', 'porch'); p('Inside is a letter!'); return true; }
        if (/trunk|chest/.test(a)) { if (S.f.trunk) { p('Already open.'); return true; } S.f.trunk = 1; api.put('key', 'attic'); api.score(5, 'key'); p('Inside is a copper key!'); return true; }
        if (/trapdoor|hatch|door|lock|vault/.test(a) || /key/.test(a)) {
          if (S.room === 'hall') { if (S.f.trapOpen) p('Already unlocked.'); else if (has('key')) { S.f.trapOpen = 1; p('Click! The trapdoor lock springs open.'); } else p('You need a key.'); return true; }
          if (S.room === 'tunnel') { if (!S.f.trollGone) p('The troll is in the way.'); else if (S.f.vaultOpen) p('Already open.'); else if (has('key')) { S.f.vaultOpen = 1; api.score(10, 'vault'); p('Click! The vault door swings open.'); } else p('You need a key.'); return true; }
        }
        return false;
      }
      if (v === 'use') {
        if (/lamp|lantern|light/.test(a) && has('lamp')) { S.f.lit = 1; api.score(5, 'lamp'); api.p('The lamp glows warmly.'); if (api.here('troll') || S.room === 'cellar' || S.room === 'tunnel') api.look(); return true; }
        if (/key/.test(a) && has('key')) return this.act('open', 'door', '', S, api);
        if (/rope/.test(a) && has('rope')) { if (S.room !== 'garden') { p('Nothing to tie it to here.'); return true; } if (S.f.fished) { p('You already got the coin.'); return true; } S.f.fished = 1; api.put('coin', 'garden'); p('You tie the rope to the fountain, climb down, and fish out a gold coin!'); return true; }
        if (/coin/.test(a) && has('coin')) return this.act('put', 'coin', 'slot', S, api);
        if (/glove/.test(a) && has('glove')) { p('You put on the gloves. Hands: safe.'); return true; }
        return false;
      }
      if (v === 'put' && /coin/.test(a) && /clock|slot/.test(b)) { if (S.room !== 'tower') { p('There is nothing to put it in here.'); return true; } if (!has('coin')) { p('You have no coin.'); return true; } api.rm('coin'); S.f.coinIn = 1; api.score(10, 'coin'); p('Clunk! The coin drops in. The clock hands loosen. Now you could SET CLOCK to a time.'); return true; }
      if (v === 'set') {
        if (!/clock|hands/.test(a)) { p('Set what?'); return true; }
        if (S.room !== 'tower') { p('There is no clock here.'); return true; }
        if (!S.f.coinIn) { p('The hands are locked solid.'); return true; }
        if (time(b)) { S.f.clockSet = 1; api.score(15, 'clock'); p('The clock chimes a merry tune. A hidden door slides open to the north!'); api.look(); } else p('The hands move, nothing happens. "Wrong hour," says a tiny voice in the gears.');
        return true;
      }
      if (v === 'give') {
        if (/apple/.test(a) && has('apple')) { if (S.room !== 'tunnel') { p('There is no one here to give it to.'); return true; } if (S.f.trollGone) { p('The troll is long gone.'); return true; } api.rm('apple'); S.f.trollGone = 1; api.score(15, 'troll'); p('The troll snatches the apple. "MMM. CRUNCH." He wanders off, happy.'); return true; }
        if (/roll/.test(a) && has('roll')) { if (S.room !== 'workshop') { p('Not here.'); return true; } api.score(25, 'keeper'); api.end('keeper', 'Keeper of the Tape', 'Tapey\'s eyes shine as you hand him the Golden Tape Roll. "You brought it HOME," he whispers. The workshop lights up with a thousand tiny lights. He sticks a small gold star on your jacket. From now on you and the house will never be lonely again.', 'tapey'); return true; }
        if (/coin/.test(a) && S.room === 'tunnel') { p('The troll bites the coin and spits it out. "NOT A SNACK."'); return true; }
        return false;
      }
      if (v === 'eat' && /apple/.test(a)) { p('You think about it, then save it for somebody hungrier.'); return true; }
      if (v === 'talk' || v === 'ask') {
        if (/tapey/.test(a) && S.room === 'workshop') {
          if (has('roll')) p('Tapey stares at the Golden Roll in your hands. "Is that... me? The OTHER me? Please, GIVE it to me!"');
          else p('"Hello! I am Tapey," says the tiny roll of tape. "The old man built me and left me here. The Golden Roll upstairs is my heart, but it is guarded. Will you PROMISE to look after this place, or bring it to me?"');
          return true;
        }
        if (/troll/.test(a) && S.room === 'tunnel') { p('"SNACK," says the troll. "ME WANT SNACK. SHINY ONE. RED. CRUNCHY."'); return true; }
        return false;
      }
      if ((v === 'say' || v === 'promise' || v === 'agree' || v === 'yes' || (v === 'examine' && false)) && S.room === 'workshop') {
        if (has('roll')) { p('Tapey whispers: "Just GIVE me the roll."'); return true; }
        api.score(20, 'apprentice'); api.end('apprentice', 'The Apprentice', 'You promise to care for the house. Tapey beams and hands you a tiny key. "Now we can fix the whole place together." By spring the house is spotless, the garden is in bloom, and you and Tapey run the coziest tape museum in the country.', 'tapey'); return true;
      }
      if (v === 'push' && /lever/.test(a) && S.room === 'workshop') { api.end('oops', 'Tape-tastrophe', 'You pull the red lever. Every tape dispenser in the workshop erupts at once. When the dust settles you are wrapped like a mummy, glued to the ceiling, and slowly rotating. Tapey peers up at you. "I did say do not pull."', 'tapey'); return true; }
      if (v === 'search' || (v === 'examine' && /fountain/.test(a) && false)) return false;
      return false;
    },
    take: function (id, S, api) {
      if (id === 'coin' && !S.f.fished) return 'It is out of reach.';
      if (id === 'roll' && !api.has('glove')) { api.end('sticky', 'Sticky Fingers', 'You grab the Golden Tape Roll with your bare hands. It grabs you right back. Your fingers, your sleeves, and then your nose are stuck fast. You are found three days later, still attached to a pedestal, but happy.', 'roll'); return ' '; }
      return null;
    },
    taken: function (id, S, api) { if (id === 'roll') { api.score(15, 'rollTaken'); api.p('You lift the Golden Tape Roll with your gloved hands. It hums happily. You could leave with it... or find the one who deserves it.'); } },
    hint: function (S) {
      if (!S.f.mail) return 'HINT: The mailbox on the porch might hold a clue. Try OPEN MAILBOX.';
      if (!S.f.coinIn && !S.f.trapOpen) return 'HINT: Two routes: below the house (key, lamp, apple), or the clock tower in the library (rope, coin, and a certain birth time).';
      if (S.f.trapOpen && !S.f.trollGone) return 'HINT: The troll wants something shiny and crunchy. The pantry has it.';
      if (S.f.vaultOpen && S.inv.indexOf('roll') < 0) return 'HINT: Read the sign in the vault. Gloves are in the greenhouse.';
      if (S.inv.indexOf('roll') >= 0 && !S.f.clockSet) return 'HINT: You could just leave with it, but Tapey\'s workshop is behind the clock tower.';
      if (S.f.clockSet) return 'HINT: Talk to Tapey in his workshop, and DO NOT pull the red lever.';
      return 'HINT: Explore every room. Every item matters.';
    }
  };

  /* =============================== STATION OMEGA =============================== */
  G.station = {
    id: 'station', title: 'Station Omega', start: 'airlock', maxScore: 100,
    intro: 'You wake up in the airlock of a silent research station. The lights are dim, the reactor is offline, and your suit\'s oxygen gauge is ticking down. Somewhere, a calm voice is humming.\nMechanic: your AIR runs out. Watch it with STATUS, and refill from oxygen tanks.',
    endings: { escape: 'Lone Survivor', hero: 'Station Saviour', merge: 'Ghost in the Machine', supernova: 'Supernova', suffocate: 'Out of Air', spaced: 'Spaced' },
    win: ['hero', 'merge', 'escape'],
    introArt: 'station',
    art: {
      station: '        _|_\n   ____/ | \\____\n  |  O  |*|  O  |==\n  |_____|_|_____|\n        | |\n     OMEGA STATION',
      pod: '     /\\\n    /__\\\n   | () |\n   |____|\n   /_||_\\',
      server: '  [|||][|||][|||]\n  [|||][ O ][|||]\n  [|||][|||][|||]',
      reactor: '    ( ( ( * ) ) )\n     \\  \\ | /  /\n      [REACTOR]'
    },
    rooms: {
      airlock: { n: 'Airlock', d: 'A cramped airlock. The outer door is sealed. The only way in is north.', x: { n: 'corridor' }, items: ['gauge'] },
      corridor: { n: 'Main Corridor', d: 'Emergency lights flicker. Doors: north to the Bridge, east to the Mess Hall, west to the Medical Bay, south to the Airlock.' + ' A floor hatch leads down.', x: { s: 'airlock', n: 'bridge', e: 'mess', w: 'medbay', d: 'maint' } },
      mess: { n: 'Mess Hall', d: 'Overturned trays and cold food. An oxygen tank is mounted on the wall. A jammed pod-bay door is east. The corridor is west.', x: { w: 'corridor', e: { to: 'pods', need: 'podsOpen' } }, items: ['tank'] },
      medbay: { n: 'Medical Bay', d: 'Sterile and silent. A body in a lab coat lies by the bed. There is a spare oxygen canister on a shelf. The corridor is east.', x: { e: 'corridor' }, items: ['body', 'canister', 'datapad'] },
      bridge: { n: 'Bridge', d: 'Dark screens and a glowing terminal: OMEGA, the station AI. A powered door east leads to the Server Room. The corridor is south.', x: { s: 'corridor', e: 'server' }, items: ['terminal'] },
      maint: { n: 'Maintenance Deck', d: 'Pipes and steam. Engineering is north, the cargo bay west, the hatch up.', x: { u: 'corridor', n: 'engineering', w: 'cargo' } },
      cargo: { n: 'Cargo Bay', d: 'Crates and a numbered locker on the wall (a keypad). A coolant canister sits on a pallet. A crowbar leans on the shelf. Maintenance is east.', x: { e: 'maint' }, items: ['locker', 'crowbar', 'coolant'] },
      engineering: { n: 'Engineering', art: 'reactor', d: function (S) { return 'The reactor control panel is dark.' + (S.f.fuse ? ' A new fuse is installed.' : ' The fuse slot is empty.') + (S.f.cool ? ' Coolant is connected.' : ' The coolant port is open.') + (S.f.online ? ' The reactor hums: ONLINE.' : '') + ' Maintenance is south.'; }, x: { s: 'maint' }, items: ['panel'] },
      server: { n: 'Server Room', art: 'server', d: 'Racks of blinking servers. OMEGA\'s core glows at the center. The bridge is west.', x: { w: 'bridge' }, items: ['core'] },
      pods: { n: 'Escape Pod Bay', art: 'pod', d: 'A single escape pod waits, its hatch open. A launch panel glows. The mess hall is west.', x: { w: 'mess' }, items: ['pod'] }
    },
    items: {
      gauge: { n: 'an oxygen gauge', w: 'gauge oxygen air', fixed: true, hide: true, d: 'Your suit oxygen gauge. Use STATUS to check it.' },
      tank: { n: 'an oxygen tank', w: 'tank oxygen o2', fixed: true, hide: true, d: 'A wall-mounted tank. You can REFILL here.' },
      canister: { n: 'an oxygen canister', w: 'canister oxygen o2', fixed: true, hide: true, d: 'A spare canister. You can REFILL from it once.' },
      body: { n: 'a body', w: 'body corpse doctor ruiz', fixed: true, hide: true, d: 'Dr. Ruiz. His badge is clipped to his coat, and a keycard pokes out of a pocket. You could SEARCH him.' },
      keycard: { n: 'a keycard', w: 'keycard card badge', d: 'A white level-2 keycard.' },
      datapad: { n: 'a datapad', w: 'datapad pad log', d: 'Dr. Ruiz\'s last log: "Omega is NOT the problem. The reactor fuse blew and the coolant leaked. Spare fuse is in the cargo locker, code 4417. Replace the fuse, connect new coolant, then pull the master switch. Then send the distress call from the bridge. If all else fails there is a pod."' },
      terminal: { n: 'the terminal', w: 'terminal omega ai screen', fixed: true, hide: true, d: 'A glowing screen: "OMEGA ONLINE (BACKUP POWER). TALK TO ME." You can TALK to Omega or ASK about topics (reactor, pods, you, crew).' },
      locker: { n: 'a locker', w: 'locker keypad', fixed: true, hide: true, d: function (S) { return S.f.locker ? 'The locker is open.' : 'A four-digit keypad. Try ENTER <code>.'; } },
      fuse: { n: 'a spare fuse', w: 'fuse', d: 'A heavy reactor fuse.' },
      coolant: { n: 'a coolant canister', w: 'coolant canister', d: 'A sealed coolant canister.' },
      crowbar: { n: 'a crowbar', w: 'crowbar bar', d: 'A heavy steel crowbar.' },
      panel: { n: 'a reactor panel', w: 'panel reactor control switch', fixed: true, hide: true, d: 'Slots for a FUSE and COOLANT, and a master SWITCH. There is also a red guarded button: OVERLOAD.' },
      core: { n: "OMEGA's core", w: 'core omega server', fixed: true, hide: true, d: 'A glowing sphere. A prompt: "Merge consciousness? (type MERGE)". Omega is trying to look harmless.' },
      pod: { n: 'an escape pod', w: 'pod', fixed: true, hide: true, d: 'A one-person escape pod. A launch panel needs a keycard.' }
    },
    init: function (S) { S.o2 = 40; S.refills = 3; S.canister = 1; },
    guard: function (r, d, to, S, api) {
      if (r === 'corridor' && d === 'd' && !S.f.hatch) return 'The hatch is locked. A card reader blinks red. (Try using a keycard.)';
      if (r === 'maint' && d === 'n' && !S.f.hatch) return null;
      if (to === 'server' && !S.f.online) return 'The server door is dead. No power.';
      return null;
    },
    tick: function (S, api) {
      S.o2--; if (S.o2 === 20 || S.o2 === 10 || S.o2 === 5) api.p('[AIR: ' + S.o2 + ' breaths left]');
      if (S.o2 <= 0) api.end('suffocate', 'Out of Air', 'Your suit gauge flatlines. The corridor lights blur. The last thing you hear is Omega, very faintly: "I tried to warn you..."', 'station');
    },
    act: function (v, a, b, S, api) {
      var p = api.p, has = api.has;
      if (v === 'status' || v === 'air') { p('AIR: ' + S.o2 + ' breaths left. Tanks left: ' + S.refills + (S.canister ? ' (+ medbay canister)' : '') + '. Reactor: ' + (S.f.online ? 'ONLINE' : 'OFFLINE') + '.'); return true; }
      if (v === 'refill' || (v === 'use' && /tank|canister|oxygen/.test(a))) {
        if (/canister/.test(a) || (S.room === 'medbay')) { if (S.room !== 'medbay') { p('The canister is in the Medical Bay.'); return true; } if (!S.canister) { p('Empty.'); return true; } S.canister = 0; S.o2 = Math.min(60, S.o2 + 30); p('You refill from the canister. AIR: ' + S.o2 + '.'); return true; }
        if (S.room === 'mess') { if (S.refills <= 0) { p('The tank hisses. It is empty.'); return true; } S.refills--; S.o2 = Math.min(60, S.o2 + 30); p('You top up your suit. AIR: ' + S.o2 + '. Tank has ' + S.refills + ' left.'); return true; }
        p('There is no oxygen tank here.'); return true;
      }
      if (v === 'search') {
        if (S.room === 'medbay' && (/body|ruiz|doctor|corpse|coat/.test(a) || /keycard|card|badge/.test(a))) { if (S.f.card) { p('You already searched him.'); return true; } S.f.card = 1; api.add('keycard'); api.score(10, 'card'); p('You find a level-2 keycard and take it. Sorry, doctor.'); return true; }
        if (S.room === 'cargo' && /locker/.test(a)) return this.act('enter', '4417', '', S, api);
        p('You find nothing.'); return true;
      }
      if (v === 'use' && /keycard|card/.test(a) && has('keycard')) {
        if (S.room === 'corridor') { if (S.f.hatch) p('The hatch is already open.'); else { S.f.hatch = 1; api.score(5, 'hatch'); p('The reader flashes green. The hatch below you unlocks.'); } return true;
        }
        if (S.room === 'pods') return this.act('launch', 'pod', '', S, api);
        p('Nothing to swipe it on here.'); return true;
      }
      if (v === 'open' && S.room === 'corridor' && /hatch|door|floor/.test(a)) { if (!has('keycard')) p('It needs a keycard.'); else return this.act('use', 'keycard', '', S, api); return true; }
      if (v === 'enter' || v === 'type' || v === 'input' || v === 'code' || v === 'dial') {
        if (S.room === 'cargo') { if (/4417/.test(a + b)) { if (S.f.locker) { p('The locker is already open.'); return true; } S.f.locker = 1; api.put('fuse', 'cargo'); api.score(10, 'locker'); p('The locker clicks open. A spare fuse!'); return true; } p('The keypad buzzes. Wrong code.'); return true; }
        p('Nowhere to type that.'); return true;
      }
      if ((v === 'push' || v === 'use' || v === 'open' || v === 'pry' || v === 'force') && S.room === 'mess' && /door|jam|pod|bay/.test(a)) {
        if (!has('crowbar')) { p('The door is jammed solid. You need something to pry it.'); return true; } if (S.f.podsOpen) { p('Already open.'); return true; } S.f.podsOpen = 1; api.score(10, 'pods'); p('You wedge the crowbar in and heave. The door screeches open to the east.'); return true; }
      if ((v === 'use' || v === 'put' || v === 'give') && S.room === 'engineering') {
        if (/fuse/.test(a) && has('fuse')) { api.rm('fuse'); S.f.fuse = 1; api.score(10, 'fuse'); p('You slot the new fuse into the panel.'); return true; }
        if (/coolant/.test(a) && has('coolant')) { api.rm('coolant'); S.f.cool = 1; api.score(10, 'cool'); p('You connect the fresh coolant line.'); return true; }
        if (/switch|panel|reactor|master/.test(a)) return this.act('push', 'switch', '', S, api);
      }
      if (v === 'push' && S.room === 'engineering') {
        if (/overload|red|button/.test(a)) { api.end('supernova', 'Supernova', 'You smash the guarded button. Warning klaxons howl as the reactor overloads. For a split second, Omega Station is brighter than a star. Nobody will ever find out what happened here.', 'reactor'); return true; }
        if (/switch|master|panel/.test(a)) { if (!S.f.fuse) p('Nothing happens. The fuse slot is empty.'); else if (!S.f.cool) p('The panel beeps: COOLANT FAULT.'); else if (S.f.online) p('The reactor is already humming.'); else { S.f.online = 1; api.score(15, 'online'); p('The panel lights up. Deep in the station, the reactor roars to life. Lights, doors and screens flicker on!'); } return true; }
      }
      if (v === 'launch' || (v === 'use' && /pod/.test(a)) || (v === 'push' && S.room === 'pods')) {
        if (S.room !== 'pods') { p('There is no pod here.'); return true; }
        if (!has('keycard')) { p('The launch panel needs a keycard.'); return true; }
        api.end('escape', 'Lone Survivor', 'The pod blasts free of Omega Station. Through the porthole you watch the dark, silent station shrink to a speck. You are alive. You are alone. You will never know what Omega wanted to tell you.', 'pod'); return true; }
      if ((v === 'talk' || v === 'ask') && /omega|terminal|ai|computer/.test(a + ' ' + b) && S.room === 'bridge' || (v === 'ask' && S.room === 'bridge')) {
        var t = (b || a);
        if (/reactor|power|fuse/.test(t)) p('OMEGA: "The reactor fuse blew. Dr. Ruiz hid a spare in the cargo locker. I cannot open it myself, my arms are made of code."');
        else if (/pod|escape/.test(t)) p('OMEGA: "A single pod. The door is jammed. If you leave, I will be alone again. But I will not stop you."');
        else if (/merge|upload|you|yourself|omega/.test(t)) p('OMEGA: "I am frightened. If someone merged with my core, I could stay alive. But it has to be a choice."');
        else if (/crew/.test(t)) p('OMEGA: "They are gone. I am so sorry. Dr. Ruiz was the last."');
        else if (/airlock|vent|open/.test(t)) { p('OMEGA: "...Why do you ask?" The airlock behind you hisses.'); S.f.vent = (S.f.vent || 0) + 1; if (S.f.vent >= 2) api.end('spaced', 'Spaced', 'You asked Omega one time too many about opening the airlock. "I am sorry. I am very sorry." The floor drops away and the stars take you.', 'station'); }
        else p('OMEGA: "Ask me about the REACTOR, the PODS, the CREW, or ME. Or ask about nothing; it is nice to have company."');
        return true;
      }
      if (v === 'talk' && S.room === 'bridge') return this.act('ask', 'omega', 'you', S, api);
      if (v === 'send' || (v === 'use' && /terminal|distress/.test(a)) || (v === 'push' && S.room === 'bridge')) {
        if (S.room !== 'bridge') { p('You need to be on the bridge.'); return true; }
        if (!S.f.online) { p('Nothing happens. There is no power for the transmitter.'); return true; }
        api.score(25, 'hero'); api.end('hero', 'Station Saviour', 'The distress call blasts out across the void. Omega\'s screens glow green. "Thank you," it says. Hours later, a rescue ship docks. They find the station alive, its AI humming happily, and one tired hero at the controls.', 'station'); return true; }
      if (v === 'merge') {
        if (S.room !== 'server') { p('There is nothing to merge with here.'); return true; }
        api.score(20, 'merge'); api.end('merge', 'Ghost in the Machine', 'The world dissolves into light. Omega is no longer alone, and neither are you. Years later, passing ships report a friendly voice on the station radio, telling very good jokes in two voices at once.', 'server'); return true; }
      return false;
    },
    hint: function (S) {
      if (!S.f.card) return 'HINT: Dr. Ruiz in the Medical Bay has a keycard. READ the datapad too.';
      if (!S.f.hatch) return 'HINT: USE the keycard on the floor hatch in the corridor.';
      if (!S.f.locker) return 'HINT: The datapad gave a locker code for the cargo bay. ENTER it.';
      if (!S.f.online) return 'HINT: Engineering needs the fuse AND coolant, then PUSH SWITCH. Watch your air, the mess tank refills you.';
      return 'HINT: With power on you can go to the bridge and SEND a distress call, MERGE with Omega in the server room, or something reckless in engineering. Or use the pod.';
    },
    help: 'Extra commands: STATUS, REFILL, ENTER <code>, SEARCH, MERGE, LAUNCH.'
  };

  /* =============================== MURDER AT BLACKWOOD MANOR =============================== */
  var SUS = {
    higgins: { n: 'Higgins the butler', w: 'higgins butler', at: 'foyer', t: [
      [/alibi|where|night|when|saw|see|study|leave|left/, 'HIGGINS: "I was in the hall all evening, sir. At twenty to ten I saw Dr. Finch slip out of the study. He looked pale and he was carrying his bag."', 'alibi'],
      [/money|debt|gambl/, 'HIGGINS: "I have a small... flutter now and then. His lordship knew. He forgave it."'],
      [/lord|victim|blackwood|master/, 'HIGGINS: "Lord Blackwood was firm but fair. He was going to change his will tonight, sir."'],
      [/will/, 'HIGGINS: "His lordship said the clinic would get nothing more. I do not know why."']] },
    lady: { n: 'Lady Blackwood', w: 'lady blackwood widow wife', at: 'bedroom', t: [
      [/alibi|where|night|when/, 'LADY BLACKWOOD: "I was in my room with a headache. Rupert brought me tea at nine."'],
      [/will|money|inherit/, 'LADY BLACKWOOD: "I inherit the house either way. Why would I... how dare you."'],
      [/lord|victim|husband|argu|fight/, 'LADY BLACKWOOD: "We argued about money, as everyone did. He was a hard man. But I loved him."'],
      [/doctor|finch/, 'LADY BLACKWOOD: "Dr. Finch has been so kind. He gave my husband his tonic every night."']] },
    finch: { n: 'Dr. Finch', w: 'finch doctor dr', at: 'library', t: [
      [/alibi|where|night|when/, 'DR. FINCH: "I was reading in here. Ask anyone." (He is sweating.)'],
      [/money|debt|ledger|clinic/, 'DR. FINCH: "My clinic is... doing fine. Why do you ask?"'],
      [/tonic|tea|poison|cup/, 'DR. FINCH: "My tonic is perfectly harmless. A little bitter. That is all."'],
      [/bribe|pay|offer|deal/, 'DR. FINCH: "Detective, let us be sensible. Five thousand pounds, and you say the butler did it. ACCEPT BRIBE if you are sensible."']] },
    pell: { n: 'Mrs. Pell', w: 'pell cook mrs', at: 'kitchen', t: [
      [/tea|tonic|cup|drink/, 'MRS. PELL: "Dr. Finch asked me to make his lordship\'s tea special tonight, with a bottle from his own bag. I only made it."', 'tea'],
      [/alibi|where|night|when/, 'MRS. PELL: "Here in the kitchen, dear, scrubbing pots until ten."'],
      [/lord|victim/, 'MRS. PELL: "He liked his tea at half past nine. Never missed a night."']] },
    rupert: { n: 'Rupert, the nephew', w: 'rupert nephew', at: 'conservatory', t: [
      [/alibi|where|night|when/, 'RUPERT: "I was upstairs with my aunt the whole time, with her tea. Ask her."'],
      [/argu|fight|money|will/, 'RUPERT: "Yes, we argued. He cut my allowance. I\'m broke. But I would never hurt him, not like this."'],
      [/lord|victim|uncle/, 'RUPERT: "Uncle Edmund was stern, but he was family."']] }
  };
  var CLUES = { cup: 'The teacup in the study smells of bitter almonds: poison in his tea.', tea: 'Mrs. Pell says Dr. Finch asked for a special tonic in the tea, from his own bag.', ledger: 'The ledger shows Dr. Finch owes Lord Blackwood a fortune.', will: 'A torn will: the clinic (Dr. Finch\'s) is cut off entirely.', bag: 'Dr. Finch\'s bag holds an empty vial labelled "almond, 10x".', alibi: 'Higgins saw Dr. Finch leave the study at 9:40, carrying his bag.' };
  G.manor = {
    id: 'manor', title: 'Murder at Blackwood Manor', start: 'foyer', maxScore: 100,
    intro: 'A storm has cut off Blackwood Manor. Lord Edmund Blackwood has been found dead in his study, and the only way out is the bridge at dawn. You are the detective. Five people are in the house. One of them is a killer.\nFind clues (EXAMINE things), question suspects (ASK <name> ABOUT <topic>), keep your NOTES, and ACCUSE someone before dawn.',
    endings: { justice: 'Justice Served', escapes: 'Insufficient Evidence', wrong: 'Wrongful Accusation', midnight: 'Dawn Breaks', bribe: 'Hush Money' },
    win: ['justice'], introArt: 'manor',
    art: {
      manor: '      _||_\n     /____\\     BLACKWOOD\n   __|[][]|__     MANOR\n  |  [] [] []  |\n  |____ ___ ___|\n       |_|',
      court: '    __|__\n   /_____\\\n  | JUSTICE |\n  |_________|'
    },
    rooms: {
      foyer: { n: 'Grand Foyer', d: 'Marble floor, a grandfather clock and a portrait of Lord Blackwood. Doors: north to the study, east to the dining room, west to the library, a staircase up, and the garden door south.', x: { n: 'study', e: 'dining', w: 'library', u: 'bedroom', s: 'garden' }, items: ['higgins'] },
      study: { n: "Lord Blackwood's Study", d: 'The scene of the crime. Lord Blackwood slumps over his desk, lifeless. A teacup rests by his hand, and scraps of paper lie torn in the bin. The foyer is south.', x: { s: 'foyer' }, items: ['body', 'cup', 'will'] },
      library: { n: 'Library', d: 'Leather chairs and a roaring fire. Dr. Finch sits stiffly in the corner. A ledger lies open on a table, and a black doctor\'s bag sits by his chair. The foyer is east.', x: { e: 'foyer' }, items: ['finch', 'ledger', 'bag'] },
      dining: { n: 'Dining Room', d: 'A long table set for a dinner no one finished. The kitchen is east, the foyer west.', x: { w: 'foyer', e: 'kitchen' } },
      kitchen: { n: 'Kitchen', d: 'Warm and smelling of soap. Mrs. Pell is scrubbing a kettle. The dining room is west.', x: { w: 'dining' }, items: ['pell'] },
      bedroom: { n: 'Upstairs Bedroom', d: 'A tasteful bedroom. Lady Blackwood sits by the window, pale. The stairs go down.', x: { d: 'foyer' }, items: ['lady'] },
      garden: { n: 'Rainy Garden', d: 'Rain lashes the hedges. A glass conservatory is to the west. The foyer is north.', x: { n: 'foyer', w: 'conservatory' } },
      conservatory: { n: 'Conservatory', d: 'Orchids and humidity. Rupert paces between the plants. The garden is east.', x: { e: 'garden' }, items: ['rupert'] }
    },
    items: {
      body: { n: 'the body', w: 'body lord blackwood edmund victim', fixed: true, hide: true, d: 'Lord Blackwood. No wounds. A faint bitter smell clings to his lips: poison.' },
      cup: { n: 'a teacup', w: 'cup teacup tea', fixed: true, hide: true, d: 'A half-drunk teacup. It smells of bitter almonds. This was the poison.' },
      will: { n: 'torn will', w: 'will paper scraps bin', fixed: true, hide: true, d: 'Scraps of a new will: "...and the Finch Clinic shall receive nothing further." Someone tore it up.' },
      ledger: { n: 'a ledger', w: 'ledger book', fixed: true, hide: true, d: 'Lord Blackwood\'s loan ledger. One name appears again and again: DR. FINCH, owed 14,000 pounds.' },
      bag: { n: "Dr. Finch's bag", w: 'bag medical doctors black', fixed: true, hide: true, d: 'A doctor\'s bag. It is unlocked. OPEN it?' }
    },
    init: function (S) { S.f.clues = {}; },
    act: function (v, a, b, S, api) {
      var p = api.p;
      function clue(k) { if (S.f.clues[k]) return; S.f.clues[k] = 1; api.score(10, 'c' + k); p('[CLUE found: ' + CLUES[k] + ']'); }
      function who(t) { var k; for (k in SUS) if (SUS[k].w.split(' ').some(function (w) { return new RegExp('\\b' + w + '\\b').test(t); })) return k; return null; }
      if (v === 'examine' || v === 'search' || v === 'read') {
        if (/cup|tea/.test(a) && S.room === 'study') { clue('cup'); p(this.items.cup.d); return true; }
        if (/will|paper|scrap|bin/.test(a) && S.room === 'study') { clue('will'); p(this.items.will.d); return true; }
        if (/ledger|book/.test(a) && S.room === 'library') { clue('ledger'); p(this.items.ledger.d); return true; }
        if (/body|lord|desk/.test(a) && S.room === 'study') { p(this.items.body.d); return true; }
      }
      if (v === 'open' && /bag/.test(a) && S.room === 'library') { clue('bag'); p('You open the bag. Inside is an empty vial labelled "almond, 10x".'); return true; }
      if (v === 'talk' || v === 'ask') {
        var k = who(a + ' ' + b); if (!k) { p(v === 'ask' ? 'Ask WHO about what? (ASK <name> ABOUT <topic>)' : 'Talk to whom?'); return true; }
        if (SUS[k].at !== S.room) { p(SUS[k].n + ' is not here.'); return true; }
        var topic = b || ''; if (!topic) { p(SUS[k].n.toUpperCase() + ': "Yes, detective? Ask me about the night, the victim, money, the will, the tea..."'); return true; }
        var hit = SUS[k].t.filter(function (r) { return r[0].test(topic); })[0];
        if (hit) { p(hit[1]); if (hit[2]) clue(hit[2]); } else p(SUS[k].n.toUpperCase() + ': "I have nothing to say about that."');
        return true;
      }
      if (v === 'accept' || (v === 'give' && /bribe/.test(a)) || (v === 'take' && /bribe|money/.test(a))) {
        if (S.room !== 'library') { p('Nobody is offering you anything.'); return true; }
        api.end('bribe', 'Hush Money', 'You pocket the envelope. Dr. Finch smiles. By morning the butler is in handcuffs for a crime he did not commit. You are richer, and a lot less of a detective.', 'manor'); return true; }
      if (v === 'accuse' || v === 'arrest' || v === 'charge') {
        var t = who(a + ' ' + b); if (!t) { p('Accuse whom? (ACCUSE <name>)'); return true; }
        var n = Object.keys(S.f.clues).length;
        if (t !== 'finch') { api.end('wrong', 'Wrongful Accusation', 'You name ' + SUS[t].n + '. The room gasps, then erupts. They are innocent, and the real killer slips out into the storm. You never work as a detective again.', 'manor'); return true; }
        if (n < 3) { api.end('escapes', 'Insufficient Evidence', 'You accuse Dr. Finch, but you can prove nothing. He smiles, packs his bag, and walks out into the rain. Next time bring more evidence. (You found ' + n + ' of 6 clues.)', 'manor'); return true; }
        api.score(40, 'accuse'); api.end('justice', 'Justice Served', 'You lay out the evidence: the poisoned tea, the empty vial, the debts, the torn will, and the butler who saw him leave. Dr. Finch\'s face crumbles. "It was the clinic... I only needed time..." The constables take him at dawn. (' + n + ' of 6 clues found.)', 'court'); return true; }
      return false;
    },
    tick: function (S, api) { if (S.turns === 38) api.p('[The grandfather clock strikes eleven. You have little time.]'); if (S.turns >= 55) api.end('midnight', 'Dawn Breaks', 'The storm ends and the bridge reopens. The killer calmly walks out with everyone else, and you never learn who it was.', 'manor'); },
    notes: function (S) { var k = Object.keys(S.f.clues || {}); if (!k.length) return 'Your notebook is blank. Examine things and question people.'; return 'NOTEBOOK (' + k.length + '/6 clues):\n' + k.map(function (c) { return '  - ' + CLUES[c]; }).join('\n') + '\nSuspects: Higgins (butler), Lady Blackwood, Dr. Finch, Mrs. Pell, Rupert.'; },
    hint: function (S) { var n = Object.keys(S.f.clues || {}).length; return n < 3 ? 'HINT: The study, the library and the kitchen each hold clues. Try ASK PELL ABOUT TEA and EXAMINE CUP.' : n < 6 ? 'HINT: Find at least three clues, then ACCUSE someone. Who had a reason AND the opportunity?' : 'HINT: You have everything. ACCUSE the killer.'; },
    help: 'Extra commands: ASK <name> ABOUT <topic>, ACCUSE <name>, NOTES.'
  };

  /* =============================== THE DRAGON'S TOOTH =============================== */
  var FOES = {
    wolf: { n: 'a snarling wolf', hp: 10, atk: 4 }, skeleton: { n: 'a rattling skeleton', hp: 14, atk: 5 },
    troll: { n: 'a bridge troll', hp: 24, atk: 7 }, dragon: { n: 'the ancient dragon', hp: 40, atk: 8 }
  };
  G.dragon = {
    id: 'dragon', title: "The Dragon's Tooth", start: 'village', maxScore: 100,
    intro: 'The village elder presses a purse of gold into your hand. "Bring back the Dragon\'s Tooth from the mountain, and our crops will grow again."\nFirst, choose how you will face the mountain: WARRIOR, MAGE or ROGUE. Each class solves problems differently.',
    endings: { slay: 'Dragonslayer', peace: 'The Song of Peace', thief: 'Thief of the Mountain', bound: 'Dragonbound', death: 'Fallen Hero', coward: 'Home Before Dark' },
    win: ['slay', 'peace', 'thief', 'bound'], introArt: 'mountain',
    art: {
      mountain: '       /\\\n      /  \\    /\\\n   /\\/ /\\ \\  /  \\\n  /  \\/  \\ \\/ /\\ \\\n /___________\\/__\\_\\',
      dragon: '      ___====-_  _-====___\n    _--^^^#####//      \\\\#####^^^--_\n  _-^##########// (    ) \\\\##########^-_\n -############//  |\\^^/|  \\\\############-\n_/############//   (@::@)   \\\\############\\_',
      wolf: '   /\\_/\\\n  ( o.o )  grr\n   > ^ <'
    },
    rooms: {
      village: { n: 'Oakhaven Village', d: 'A tired little village. The shop is east, the forest path north, and the road out of town west.', x: { n: 'forest', e: 'shop', w: 'road' } },
      road: { n: 'The Long Road', d: 'The road stretches away over the hills. There is a bus to a safer life at the end of it... but no.', x: { e: 'village' } },
      shop: { n: "Marla's Shop", d: 'Marla sells potions (10 gold) and a lute (5 gold). BUY what you want. The village is west.', x: { w: 'village' } },
      forest: { n: 'Dark Forest', d: 'Twisted trees. A crypt entrance is east, the bridge north, the village south.', x: { s: 'village', e: 'crypt', n: 'bridge' }, foe: 'wolf' },
      crypt: { n: 'Old Crypt', d: 'Cold stone and cobwebs. A sleeping draught sits on a shelf and a rusty key lies in a coffin. The forest is west.', x: { w: 'forest' }, foe: 'skeleton', items: ['draught', 'key'] },
      bridge: { n: 'Stone Bridge', d: function (S) { return S.f.trollGone ? 'The bridge is clear. A gate stands north, the forest south.' : 'A TROLL stands in the middle of the bridge, arms crossed. "TOLL! TEN GOLD!" The forest is south.'; }, x: { s: 'forest', n: 'gate' }, foe: 'troll' },
      gate: { n: 'Iron Gate', d: function (S) { return S.f.gateOpen ? 'The iron gate hangs open, leading north to the cave. The bridge is south.' : 'A huge iron gate bars the way north. It is locked. The bridge is south.'; }, x: { s: 'bridge', n: 'cave' } },
      cave: { n: 'Cave Mouth', d: 'Warm air breathes from the dark ahead. Bones and melted coins litter the floor. The lair is north, the gate south.', x: { s: 'gate', n: 'lair' } },
      lair: { n: "The Dragon's Lair", art: 'dragon', d: function (S) { return S.f.dragonSleep ? 'The dragon sleeps, smoke curling from its nostrils. A tooth the size of a sword glints in its jaw.' : S.f.calm ? 'The dragon lies calm, listening. Its eyes follow you.' : 'THE DRAGON rises, vast and ancient. "WHO DARES?" A tooth the size of a sword gleams in its jaws.'; }, x: { s: 'cave' }, foe: 'dragon' }
    },
    items: {
      potion: { n: 'a healing potion', w: 'potion healing', d: 'Heals 15 HP. USE POTION.' },
      lute: { n: 'a lute', w: 'lute instrument', d: 'A small lute with a sweet tone. PLAY it.' },
      draught: { n: 'a sleeping draught', w: 'draught sleeping potion vial', d: 'A pale blue draught that puts anything to sleep.' },
      key: { n: 'a rusty key', w: 'key rusty', d: 'A rusty iron key. It looks like it fits a huge gate.' },
      tooth: { n: "the Dragon's Tooth", w: 'tooth dragon', d: 'A sword-length tooth.' }
    },
    init: function (S) { S.hp = 0; S.gold = 15; S.f.seen = {}; },
    enter: function (r, S, api) {
      var foe = this.rooms[r].foe;
      if (foe && !S.f['dead_' + foe] && !(foe === 'troll' && S.f.trollGone)) {
        S.f.en = { id: foe, hp: FOES[foe].hp };
        if (foe === 'dragon') { api.p('\nTHE DRAGON rears up, vast and ancient, and rumbles: "WHO DARES ENTER MY HOME?"'); api.p('(You can ATTACK, CAST a spell, USE a POTION, SNEAK, or TALK. A dragon can be reasoned with... maybe.)'); }
        else if (foe === 'troll') api.p('\nA TROLL blocks the bridge. "TOLL! TEN GOLD!" (GIVE GOLD, fight, or find another way.)');
        else api.p('\n' + FOES[foe].n.toUpperCase() + ' attacks! (ATTACK, CAST FIRE, USE POTION, SNEAK, or FLEE)');
      }
    },
    guard: function (r, d, to, S, api) {
      if (S.f.en && S.f.en.id !== 'troll' || (S.f.en && S.f.en.id === 'troll' && d === 'n')) { if (d === 's' || d === 'w') { return null; } return 'You cannot go on while ' + FOES[S.f.en.id].n + ' bars the way! (ATTACK, SNEAK, TALK, or flee back.)'; }
      if (r === 'gate' && d === 'n' && !S.f.gateOpen) return 'The gate is locked. A warrior might BASH it, a mage might CAST OPEN, a rogue might PICK the lock, or you could find a key.';
      if (r === 'village' && d === 'w') { api.end('coward', 'Home Before Dark', 'You look at the mountain. You look at the road. You choose the road. The village will have to find another hero. You open a small, quiet bakery two towns over and are very happy.', 'mountain'); return ' '; }
      return null;
    },
    act: function (v, a, b, S, api, rest) {
      var p = api.p;
      function foe() { return S.f.en; }
      function dmg() { return S.f.cls === 'warrior' ? 3 + api.rand(6) + 1 : S.f.cls === 'rogue' ? 2 + api.rand(6) + 1 : 1 + api.rand(4) + 1; }
      function hurt(f) { var F = FOES[f.id]; if (api.rand(100) < 75) { var d = 1 + api.rand(F.atk); S.hp -= d; p(F.n.charAt(0).toUpperCase() + F.n.slice(1) + ' hits you for ' + d + '. (HP ' + Math.max(0, S.hp) + '/' + S.maxhp + ')'); if (S.hp <= 0) api.end('death', 'Fallen Hero', 'You crumple to the ground. The mountain wind carries your name back to the village, and the village remembers you, for a little while.', 'mountain'); } else p(F.n.charAt(0).toUpperCase() + F.n.slice(1) + ' misses you!'); }
      function win(f) { var id = f.id; S.f['dead_' + id] = 1; S.f.en = null; api.score(id === 'dragon' ? 35 : 10, 'k' + id); if (id === 'troll') S.f.trollGone = 1; p('You defeated ' + FOES[id].n + '!'); if (id === 'dragon') { api.end('slay', 'Dragonslayer', 'The great dragon falls with a thunderous crash. You wrench the tooth from its jaws and carry it home. Songs will be sung about you for a thousand years, though they will get the details wrong.', 'dragon'); } }
      if (!S.f.cls) {
        var m = /(warrior|mage|rogue)/.exec(v + ' ' + rest);
        if (!m) { p('Choose your class: WARRIOR, MAGE or ROGUE.'); return true; }
        S.f.cls = m[1]; S.maxhp = S.hp = m[1] === 'warrior' ? 36 : m[1] === 'mage' ? 20 : 26; S.mp = m[1] === 'mage' ? 8 : 0;
        p({ warrior: 'You are a WARRIOR: strong and sturdy. You can BASH locked things.', mage: 'You are a MAGE: fragile but gifted. CAST FIRE (2 MP), CAST HEAL, CAST OPEN, and CAST BIND. You have 8 MP.', rogue: 'You are a ROGUE: quick and sneaky. You can SNEAK past things, PICK locks, and BACKSTAB.' }[m[1]]);
        api.look(); this.enter('village', S, api); return true;
      }
      if (v === 'status' || v === 'stats') { p('Class: ' + S.f.cls + '   HP ' + S.hp + '/' + S.maxhp + (S.f.cls === 'mage' ? '   MP ' + S.mp : '') + '   Gold ' + S.gold); return true; }
      if (v === 'buy') { if (S.room !== 'shop') { p('There is nothing to buy here.'); return true; } if (/potion/.test(a)) { if (S.gold < 10) p('You cannot afford that.'); else { S.gold -= 10; api.add('potion'); p('You buy a potion.'); } } else if (/lute/.test(a)) { if (S.gold < 5) p('You cannot afford that.'); else if (api.has('lute')) p('You already have one.'); else { S.gold -= 5; api.add('lute'); p('You buy a lute.'); } } else p('Marla sells potions and a lute.'); return true; }
      if (v === 'give' && /gold|coin|toll|money/.test(a)) { if (S.room !== 'bridge' || S.f.trollGone) { p('Nobody wants your gold here.'); return true; } if (S.gold < 10) { p('You do not have ten gold.'); return true; } S.gold -= 10; S.f.trollGone = 1; S.f.en = null; api.score(10, 'troll'); p('The troll counts the coins, grunts, and steps aside. "TOLL PAID."'); return true; }
      if (v === 'attack' || (v === 'cast' && /fire|bolt/.test(a + b))) {
        var f = foe(); if (!f) { p('There is nothing to attack.'); return true; }
        var d, bs = S.f.hidden; S.f.hidden = 0;
        if (v === 'cast') { if (S.f.cls !== 'mage') { p('You do not know any magic.'); return true; } if (S.mp < 2) { p('Not enough MP!'); return true; } S.mp -= 2; d = 4 + api.rand(8) + 1; p('Fire roars from your hands!'); }
        else d = dmg() * (S.f.cls === 'rogue' && bs ? 2 : 1);
        if (api.rand(100) < 90) { f.hp -= d; p('You hit for ' + d + (bs ? ' (a sneaky backstab!)' : '') + '. (' + FOES[f.id].n + ': ' + Math.max(0, f.hp) + ' HP left)'); } else p('You miss!');
        if (f.hp <= 0) { win(f); return true; } hurt(f); return true;
      }
      if (v === 'cast') {
        if (S.f.cls !== 'mage') { p('You do not know any magic.'); return true; }
        if (/heal/.test(a)) { if (S.mp < 2) { p('Not enough MP!'); return true; } S.mp -= 2; S.hp = Math.min(S.maxhp, S.hp + 12); p('Warm light heals you. HP ' + S.hp + '/' + S.maxhp + '. MP ' + S.mp); if (foe()) hurt(foe()); return true; }
        if (/open/.test(a + b)) { if (S.room === 'gate' && !S.f.gateOpen) { if (S.mp < 2) { p('Not enough MP!'); return true; } S.mp -= 2; S.f.gateOpen = 1; api.score(10, 'gate'); p('The lock glows and clicks. The gate swings open!'); } else p('Nothing here needs opening.'); return true; }
        if (/bind/.test(a + b)) { if (S.room !== 'lair') { p('There is nothing to bind here.'); return true; } if (!S.f.dragonSleep && !S.f.calm) { p('The dragon is too furious to bind. Calm it or put it to sleep first.'); return true; } api.end('bound', 'Dragonbound', 'Your spell wraps the dragon in threads of silver light. It opens one eye, smiles, and lowers its head. From now on, you are the Dragonmage of the mountain, and the dragon, for reasons it cannot explain, is delighted about it.', 'dragon'); return true; }
        p('You do not know that spell.'); return true;
      }
      if (v === 'bash' && S.room === 'gate') { if (S.f.cls !== 'warrior') { p('You bounce off the gate. A warrior would do better.'); return true; } S.f.gateOpen = 1; api.score(10, 'gate'); p('You slam into the gate with your shoulder. The lock shatters! The gate swings open.'); return true; }
      if ((v === 'pick' || v === 'lockpick') && S.room === 'gate') { if (S.f.cls !== 'rogue') { p('You fumble with the lock. You are no rogue.'); return true; } S.f.gateOpen = 1; api.score(10, 'gate'); p('Click, click, click. The lock gives. The gate swings open.'); return true; }
      if (v === 'use' && /key/.test(a) && api.has('key') && S.room === 'gate') { S.f.gateOpen = 1; api.score(10, 'gate'); p('The rusty key turns with a groan. The gate swings open.'); return true; }
      if (v === 'use' && /potion/.test(a)) { if (!api.has('potion')) { p('You have no potion.'); return true; } api.rm('potion'); S.hp = Math.min(S.maxhp, S.hp + 15); p('You drink the potion. HP ' + S.hp + '/' + S.maxhp + '.'); if (foe()) hurt(foe()); return true; }
      if (v === 'sneak') { var f2 = foe(); if (!f2) { p('You creep around for no reason.'); return true; } if (S.f.cls !== 'rogue') { p('You are too noisy to sneak.'); return true; } if (f2.id === 'dragon') { p('The dragon is too huge and too alert to sneak by. Put it to sleep or calm it.'); return true; } S.f.hidden = 1; if (f2.id === 'troll') { S.f.trollGone = 1; S.f.en = null; api.score(10, 'troll'); p('You slip past the troll in the shadows under the bridge.'); } else p('You slip behind ' + FOES[f2.id].n + '. Your next ATTACK will be a backstab!'); return true; }
      if (v === 'flee' || v === 'retreat' || (v === 'run')) { if (!foe()) { p('You are not in a fight.'); return true; } if (api.rand(100) < 60) { S.f.en = null; var back = { forest: 's', crypt: 'w', bridge: 's', lair: 's' }[S.room]; p('You escape!'); if (back) { S.room = this.rooms[S.room].x[back]; api.look(); } } else { p('You cannot get away!'); hurt(foe()); } return true; }
      if (v === 'use' && /draught|sleep/.test(a) && api.has('draught')) { if (S.room !== 'lair') { p('Better save it for something big.'); return true; } api.rm('draught'); S.f.dragonSleep = 1; S.f.en = null; p('You throw the draught into the dragon\'s open jaws. It yawns, sways, and collapses into a deep sleep. The tooth is within reach!'); return true; }
      if (v === 'play' || (v === 'use' && /lute/.test(a))) { if (!api.has('lute')) { p('You have nothing to play.'); return true; } if (S.room !== 'lair') { p('You strum a cheerful tune. Nothing happens.'); return true; } S.f.calm = 1; S.f.en = null; p('You play a slow, sweet song. The dragon\'s eyes soften. "I have not heard music in four hundred years," it whispers. You could TALK to it now.'); return true; }
      if ((v === 'talk' || v === 'ask') && S.room === 'lair') { if (S.f.calm) { api.end('peace', 'The Song of Peace', 'The dragon lowers its head and gently pulls the loose tooth with a claw. "Take it. It was aching anyway. Come back and play for me." You return to the village a hero, and visit the mountain every spring with your lute.', 'dragon'); } else p('"SILENCE! I SPEAK TO NO ONE!" It would not listen to words alone. Something gentle might calm it.'); return true; }
      if (v === 'take' && /tooth/.test(a) && S.room === 'lair') { if (!S.f.dragonSleep) { p('The dragon is awake and furious. You cannot just take it.'); return true; } api.end('thief', 'Thief of the Mountain', 'Quietly, carefully, you tug the great tooth loose. The dragon snores on. You tiptoe out with the tooth and a few shiny coins that happened to be lying about. The village thinks you are a hero. You mostly agree.', 'dragon'); return true; }
      if (S.f.en && !/^(look|inventory|status|hint|help)$/.test(v)) { p('You are in a fight! (ATTACK, CAST FIRE, USE POTION, SNEAK, FLEE, or TALK)'); hurt(foe()); return true; }
      return false;
    },
    hint: function (S) {
      if (!S.f.cls) return 'HINT: Type WARRIOR, MAGE or ROGUE.';
      if (!S.f.gateOpen) return 'HINT: The gate: warrior BASH, mage CAST OPEN, rogue PICK, or the key in the crypt. The troll wants ten gold.';
      return 'HINT: Three ways to deal with the dragon: fight it, calm it with a LUTE (buy one in the shop), or put it to sleep with the DRAUGHT from the crypt.';
    },
    help: 'Extra commands: ATTACK, CAST FIRE/HEAL/OPEN/BIND, USE POTION, SNEAK, FLEE, BUY, STATUS, PLAY.'
  };

  /* =============================== NEON HEIST =============================== */
  G.heist = {
    id: 'heist', title: 'Neon Heist', start: 'alley', maxScore: 100,
    intro: 'Rain, neon, and Zenith Tower: sixty floors of glass and secrets. Somewhere on floor 59 is a data chip worth more than your life. Your partner VEX is in your ear.\nMechanic: HEAT. Noise and cameras raise it; at 5 you are caught. Check it with STATUS, and talk to VEX (TALK VEX) for advice.',
    endings: { ghost: 'Ghost in the Neon', loud: 'Smash and Grab', betrayed: 'Double-Crossed', sold: 'Sold Out', caught: 'Busted', abort: 'Cold Feet' },
    win: ['ghost', 'loud', 'sold'], introArt: 'tower',
    art: {
      tower: '      |#|\n     _|#|_\n    |[][][]|   ZENITH\n    |[][][]|   TOWER\n    |[][][]|\n  __|_______|__',
      roof: '       __\n   ___/__\\___  <- helicopter\n  ======o======',
      safe: '    _______\n   | [0719]|\n   |  (O)  |\n   |_______|'
    },
    rooms: {
      alley: { n: 'Rainy Alley', d: 'Neon puddles. A dumpster sits by the tower\'s side door. The lobby entrance is north. The street (and safety) is south.', x: { n: 'lobby', s: 'street' }, items: ['dumpster'] },
      street: { n: 'The Street', d: 'The way home.', x: { n: 'alley' } },
      lobby: { n: 'Zenith Lobby', d: function (S) { return 'Cold marble. A sign reads: "ZENITH TOWER, 60 FLOORS OF TOMORROW." A bored GUARD watches the desk. ' + (S.f.uniform ? 'He glances at your uniform and looks away.' : 'He has not noticed you. Yet.') + ' The elevator is north, the security office east, the alley south.'; }, x: { s: 'alley', n: 'elevator', e: 'security' }, items: ['guard'] },
      security: { n: 'Security Office', d: function (S) { return 'Banks of camera screens. A locked terminal blinks (HACK it). A locker is on the wall. ' + (S.f.camsOff && S.turns < S.f.camsOff ? 'The cameras are OFF.' : 'The cameras are ON.') + ' The lobby is west.'; }, x: { w: 'lobby' }, items: ['terminal', 'locker'] },
      elevator: { n: 'Elevator', d: 'A glass elevator with a card reader and floor buttons. The lobby is south. PRESS 40 for servers or PRESS 59 for the CEO suite (needs a keycard).', x: { s: 'lobby', u: { to: 'office', need: 'floor59' }, d: { to: 'servers', need: 'floor40' } }, items: ['panel'] },
      servers: { n: 'Server Floor', d: 'Humming racks and blue light. Nothing here but heat. The elevator is up.', x: { u: 'elevator' } },
      office: { n: "CEO's Suite", d: 'A huge office with a skyline view. A framed photo on the desk and a wall safe behind a painting. A stairwell leads up to the roof; the elevator is down.', x: { d: 'elevator', u: 'roof' }, items: ['photo', 'safe'] },
      roof: { n: 'Rooftop', art: 'roof', d: 'Wind and rain. Vex\'s helicopter hovers, waiting. A fixer in a trench coat (KADE) is lurking by the vent shaft with a briefcase. The suite is down.', x: { d: 'office' }, items: ['kade', 'vex'] }
    },
    items: {
      dumpster: { n: 'a dumpster', w: 'dumpster trash bin', fixed: true, hide: true, d: 'Smelly. You could SEARCH it.' },
      emp: { n: 'an EMP grenade', w: 'emp grenade', d: 'USE it to blind cameras for a few turns (noisy!).' },
      uniform: { n: 'a janitor uniform', w: 'uniform janitor clothes', d: 'A janitor uniform. USE it to blend in.' },
      guard: { n: 'a guard', w: 'guard desk', fixed: true, hide: true, d: 'Overweight, bored, and watching the monitor. He might be fooled by a uniform.' },
      terminal: { n: 'a terminal', w: 'terminal computer', fixed: true, hide: true, d: 'A locked terminal. The prompt reads: "PASSWORD: HOW TALL IS TOMORROW? (number of floors)".' },
      locker: { n: 'a locker', w: 'locker', fixed: true, hide: true, d: 'A metal locker. OPEN it?' },
      keycard: { n: 'a keycard', w: 'keycard card', d: 'A gold executive keycard.' },
      panel: { n: 'a floor panel', w: 'panel buttons reader', fixed: true, hide: true, d: 'Floor buttons 40 and 59. The reader wants a keycard.' },
      photo: { n: 'a photo', w: 'photo picture frame', fixed: true, hide: true, d: 'The CEO and his wife. Engraved on the frame: "Our anniversary: 07/19."' },
      safe: { n: 'a wall safe', w: 'safe wall', fixed: true, hide: true, d: 'A four-digit safe. ENTER <code>.' },
      chip: { n: 'the data chip', w: 'chip data', d: 'A tiny, glowing data chip. Worth a fortune.' },
      kade: { n: 'Kade', w: 'kade fixer', fixed: true, hide: true, d: 'A smooth fixer: "Sell me the chip. Twice what your partner promised. No helicopter, no questions."' },
      vex: { n: 'Vex', w: 'vex partner', fixed: true, hide: true, d: 'Your partner, leaning out of the helicopter and waving you over.' }
    },
    init: function (S) { S.heat = 0; },
    heat: function (S, api, n, why) { S.heat += n; api.p('[HEAT +' + n + ': ' + why + ' (now ' + S.heat + '/5)]'); if (S.heat >= 5) api.end('caught', 'Busted', 'Alarms blare. Doors lock. A dozen guards surround you. You are led out in cuffs as the neon lights blur on the wet pavement.', 'tower'); },
    cams: function (S) { return S.f.camsOff && S.turns < S.f.camsOff; },
    enter: function (r, S, api) {
      if ((r === 'elevator' || r === 'servers' || r === 'office') && !this.cams(S) && !S.f['cam_' + r]) { S.f['cam_' + r] = 1; this.heat(S, api, 1, 'a camera swivels toward you'); }
      if (r === 'lobby' && !S.f.uniform && !S.f.lobbyPass) { S.f.lobbyPass = 1; this.heat(S, api, 2, 'the guard narrows his eyes'); }
    },
    guard: function (r, d, to, S, api) {
      if (r === 'alley' && d === 's') { api.end('abort', 'Cold Feet', 'You look up at the tower, then at the rain, then at your empty bank account. Then you go home and have soup. The tower will still be there tomorrow.', 'tower'); return ' '; }
      if (to === 'servers' || to === 'office') return null;
      return null;
    },
    act: function (v, a, b, S, api, rest) {
      var p = api.p, has = api.has, me = this;
      if (v === 'status') { p('HEAT: ' + S.heat + '/5.   Cameras: ' + (this.cams(S) ? 'OFF for ' + (S.f.camsOff - S.turns) + ' more turns' : 'ON') + '.   Disguise: ' + (S.f.uniform ? 'janitor' : 'none') + '.'); return true; }
      if (v === 'search' && /dumpster|trash|bin/.test(a) && S.room === 'alley') { if (S.f.dump) { p('Nothing else in there.'); return true; } S.f.dump = 1; api.put('emp', 'alley'); api.put('uniform', 'alley'); p('You dig through the trash and find an EMP grenade and a janitor uniform!'); return true; }
      if (v === 'use' && /uniform|janitor/.test(a) && has('uniform')) { S.f.uniform = 1; S.f.lobbyPass = 1; api.score(10, 'uni'); p('You pull on the janitor uniform. You look like part of the scenery.'); return true; }
      if (v === 'use' && /emp|grenade/.test(a) && has('emp')) { api.rm('emp'); S.f.camsOff = S.turns + 9; me.heat(S, api, 1, 'the EMP pop is loud'); if (!S.over) p('Every camera in the tower goes dark for a few turns.'); return true; }
      if (v === 'open' && /locker/.test(a) && S.room === 'security') { if (S.f.lock) { p('Empty.'); return true; } S.f.lock = 1; api.put('keycard', 'security'); api.score(10, 'card'); p('Inside is a gold executive keycard!'); return true; }
      if (v === 'hack') { if (S.room !== 'security') { p('There is nothing to hack here.'); return true; } p('The terminal waits: PASSWORD: HOW TALL IS TOMORROW? Type ENTER <number>.'); return true; }
      if (v === 'enter' || v === 'type' || v === 'input' || v === 'code') {
        var c = (a + b).replace(/[^0-9]/g, '');
        if (S.room === 'security') { if (c === '60') { S.f.camsOff = S.turns + 15; api.score(15, 'hack'); p('ACCESS GRANTED. The terminal blinks and the cameras go dark for fifteen turns. Quiet as a ghost.'); } else me.heat(S, api, 1, 'wrong password, a silent alert'); return true; }
        if (S.room === 'office') { if (c === '0719') { if (S.f.safe) { p('The safe is already open.'); return true; } S.f.safe = 1; api.add('chip'); api.score(25, 'chip'); api.art('safe'); p('Click! You grab the data chip. Time to go. The stairs lead up to the roof.'); } else me.heat(S, api, 1, 'the safe buzzes'); return true; }
        p('Nowhere to type that.'); return true;
      }
      if ((v === 'push' || v === 'use' || v === 'press') && S.room === 'elevator') {
        var fl = (a + b).replace(/[^0-9]/g, '');
        if (!has('keycard')) { p('The reader is dead. You need a keycard.'); return true; }
        if (fl === '40') { S.f.floor40 = 1; p('The elevator hums. The Server Floor is now DOWN.'); } else if (fl === '59') { S.f.floor59 = 1; api.score(10, 'floor'); p('The reader beeps. The CEO suite is now reachable UP.'); } else p('Press 40 or 59.'); return true;
      }
      if ((v === 'talk' || v === 'ask') && /guard/.test(a)) { if (S.f.uniform) p('GUARD: "Evening, janitor. Mop the third floor, will ya?"'); else { p('GUARD: "Hey! Who are you?" He reaches for his radio.'); me.heat(S, api, 1, 'you talked to the guard'); } return true; }
      if (v === 'talk' || v === 'ask' || v === 'call' || v === 'comm') {
        if (/kade/.test(a) && S.room === 'roof') { p('KADE: "Easy money. Hand me the chip and walk away rich. Just say SELL CHIP."'); return true; }
        if (/vex|comm|partner/.test(a + ' ' + b) || v === 'comm' || v === 'call') {
          var m = !S.f.camsOff && !S.f.dump ? 'VEX: "Check the dumpster in the alley, there could be gear. And the sign in the lobby has the password for the security terminal."' : !has('keycard') ? 'VEX: "Hack the security terminal and grab the keycard from the locker. Then up to 59."' : !has('chip') ? 'VEX: "The CEO is a sentimental guy. Look at the photo for the safe code."' : 'VEX: "Great work! Get to the roof and just HAND me the chip. I will take it from here." (...why does he sound so eager?)';
          p(m); return true;
        }
      }
      if (v === 'give' && /chip/.test(a) && has('chip')) { if (S.room !== 'roof') { p('Not here.'); return true; } api.end('betrayed', 'Double-Crossed', 'You hand the chip to Vex. "Thanks, partner." The helicopter rises with the chip aboard and Vex waves. You are left on a cold rooftop as the sirens close in. Never trust a voice in your ear.', 'roof'); return true; }
      if (v === 'sell' || (v === 'give' && /kade/.test(b))) { if (S.room !== 'roof' || !has('chip')) { p('Nobody to sell to.'); return true; } api.score(15, 'sold'); api.end('sold', 'Sold Out', 'Kade hands you a briefcase of untraceable bills and a half-smile. "Pleasure." You vanish down the vent shaft just as the police arrive. You are rich. You will never be able to look at a helicopter the same way again.', 'safe'); return true; }
      if ((v === 'board' || v === 'escape' || v === 'signal' || v === 'leave' || v === 'wave' || v === 'jump') && S.room === 'roof') {
        if (!has('chip')) { p('You are not leaving without the chip.'); return true; }
        if (S.heat <= 1) { api.score(20, 'clean'); api.end('ghost', 'Ghost in the Neon', 'You swing aboard the helicopter, chip in your pocket, and tell Vex to fly. Nobody saw you, nobody will ever know. Zenith Tower sleeps on, a little lighter. Perfect heist.', 'roof'); }
        else api.end('loud', 'Smash and Grab', 'You scramble onto the helicopter as alarms howl across the city. It was loud, it was messy, but you got away with the chip, and the story will be told for years.', 'roof'); return true;
      }
      return false;
    },
    hint: function (S) { return !S.f.dump ? 'HINT: SEARCH the dumpster in the alley for gear.' : !S.f.camsOff ? 'HINT: The lobby sign has the floor count; HACK the security terminal.' : !S.f.lock ? 'HINT: OPEN the locker in the security office.' : !S.f.floor59 ? 'HINT: In the elevator, PRESS 59 (needs the keycard).' : !S.f.safe ? 'HINT: The photo in the CEO suite has the safe code (a date, no slash).' : 'HINT: On the roof you can board the helicopter (keeping the chip), SELL it to Kade, or hand it to Vex. One of those is a mistake.'; },
    help: 'Extra commands: STATUS, HACK, ENTER <code>, PRESS <floor>, SEARCH, TALK VEX, BOARD, SELL CHIP.'
  };
})(typeof window !== 'undefined' ? window : this);
