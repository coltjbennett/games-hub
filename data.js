// data.js

const siteData = {
  version: "v4.4.0",
  author: "COLTON BENNETT",
  location: "Waukesha, WI",
  heroTitle: "Project Launcher",
  heroCopy: "<strong>Welcome to my catalog!</strong> These are the projects I have been building lately.",
  heroNote: "These are all made by me over the last year, and I do hope you enjoy!<br>Please excuse any bugs you find; I am still ironing things out.",
  marqueeText: "★★★ WELCOME TO COLTON'S PROJECT LAUNCHER ★★★ &nbsp;|&nbsp; BEST VIEWED IN 1024x768 &nbsp;|&nbsp; NETSCAPE NAVIGATOR 4.0 RECOMMENDED &nbsp;|&nbsp; ★★★ SIGN MY GUESTBOOK ★★★",
  footerCopyright: "© 2026 Colton Bennett",
  footerLastUpdated: "October 29, 2026"
};

const announcements = [
  {
    title: "v4.4.0 — Tapey, achievements, widgets and a lot of classics",
    content: "Meet <b>Tapey</b>, a roll of tape with eyes that follow your cursor, almost 1,900 lines of dialog, five personalities and loads of settings. Also new: <b>achievements</b>, desktop <b>widgets</b>, <b>save slots</b> for the local games (💾 in the title bar), a <b>Random Game</b> button in the Project Library, File Manager, WordPad, Media Player, Sound Recorder, Calendar, Character Map, Phone Dialer, Disk Defragmenter, FreeCell, Reversi and text games. Internet Explorer got a retro makeover and a ColtonNet start page, and the MS-DOS Prompt no longer loses the keyboard on phones."
  },
  {
    title: "v4.1.x — Storage & performance upgrade",
    content: "Persistent cache writes are bounded, chat history is compacted and compressed, media uploads are size-limited, the System Monitor includes Storage Manager diagnostics, and Low Power Mode pauses nonessential work while preserving features. A massive improvement has made the chatroom cause next to no performance draw, compared to previous versions that ran so slow they impacted playing games even if chat was closed."
  },
  {
    title: "v4.0.x — Desktop upgrade",
    content: "The launcher now has a Control Panel, System Monitor, Timer, command palette, favorites, recent-project tracking, keyboard shortcuts, offline/PWA support, a live network indicator, and a more resilient Arcade cache."
  },
  {
    title: "New releases",
    content: " - <b>NEW GAME:</b> <i>Asphalt Rush</i>. A <i>Need For Speed</i>-inspired street racing game with corrupt police, buying and upgrading and customizing your cars, and racing through the city at night to earn your respect amongst the other racers and become the best.<br> - A Universal Chatroom has been fully implemented, press the 'chat' button in the bottom right to open it! It connects all users that are currently on the site. Private messages to individual users, audio messages, file sharing, and replying to messages have all been added.<br> - A new beta is now out for a super advanced 3D engine and physics system that I plan to use in many of my games. A demo that runs using it is available as <i>FIELDKIT 3D ENGINE</i>.<br> - New beta out for a multiplayer PvP FPS game"
  },
  {
    title: "Game updates",
    content: " - Ghengis Khan Simulator has recieved a major expansion, adding unit animations, significantly improving unit model detailing, adding new units, and implementing dynamic campaing level layouts, as well as a split-screen 2-player versus mode!"
  },
  {
    title: "Site updates",
    content: " - The Chatroom has been made significantly more performant, efficient, and smooth, and now syncs messages seamlessly without slowing down the rest of the site."
  }
];

const projects = [
  {
    title: 'Asphalt Rush',
    url: 'games/asphalt-rush.html',
    image: 'images/IMG_2376.jpeg',
    alt: 'Asphalt Rush',
    statusKey: 'new',
    type: 'Racing',
    tags: ['Street Racing', 'Customization', 'Driving', 'Racing', 'City', 'Underground', 'Under development', 'Top Pick'],
    description: 'Race through the night city to earn your respect amongst the other racers, take down the corrupt police, and buy, customize, and upgrade your rides to stay competitive!',
    featured: false
  },
  {
    title: 'Pixel Ops',
    url: 'games/pixel-ops.html',
    image: 'images/IMG_1941.jpeg',
    alt: 'Pixel Ops',
    statusKey: 'complete',
    type: 'FPS',
    tags: ['Shooter', 'Military', 'Top Pick'],
    description: 'A shoot-em-up FPS across conquered lands. Pick your deployment location and take out as many hostiles as possible using your vast arsenal!',
    featured: false
  },
  {
    title: 'Ghengis Khan Simulator',
    url: 'games/ghengis.html',
    image: 'images/IMG_1987.jpeg',
    alt: 'Ghengis Khan Simulator',
    statusKey: 'beta',
    type: 'Simulation',
    tags: ['War', 'Historical', 'Under development', 'Top Pick'],
    description: 'Become the legendary Mongol leader and lead the Mongol Horde to conquer China! Use strategic placements to ensure your victory!',
    featured: true
  },
  {
    title: 'MEGALITH',
    url: 'games/megalith.html',
    image: 'images/IMG_1923.jpeg',
    alt: 'MEGALITH',
    statusKey: 'complete',
    type: 'Endless',
    tags: ['Endless', 'Mobile', 'Top Pick'],
    description: 'Roll through a void of platforms, collect crystals, navigate changing sectors, and go for high scores in this fast-paced endless runner!',
    featured: false
  },
  {
    title: 'City Striker',
    url: 'games/city-striker.html',
    image: 'images/IMG_1891.jpeg',
    alt: 'City Striker',
    statusKey: 'complete',
    type: 'Driving',
    tags: ['Driving', 'Chase'],
    description: 'The police are after you! Weave through traffic and between buildings to make them crash! Keep driving for as long as possible and your score will skyrocket!',
    featured: false
  },
  {
    title: 'Chronostrike',
    url: 'games/chronostrike.html',
    image: 'images/IMG_1605.jpeg',
    alt: 'Chronostrike',
    statusKey: 'complete',
    type: 'FPS',
    tags: ['FPS', 'Time Control'],
    description: 'Time only moves when you move! Use it to dodge, weave, or just line up a shot in this (definetly not a clone of another game that I can\'t name due to copyright) unique game!',
    featured: false
  },
  {
    title: 'Labyrinthine',
    url: 'games/labyrinthine.html',
    image: 'images/IMG_1922.jpeg',
    alt: 'Labyrinthine',
    statusKey: 'wipBuggy',
    type: 'Horror',
    tags: ['Horror', 'Survival', 'Development on hold'],
    description: 'You are trapped in a maze with entities that want only one thing: your head... on a plate! Shine your flashlight to freeze them, and use your weapons to survive.',
    featured: false
  },
  {
    title: 'Goblin Hut Clicker',
    url: 'games/gh-clicker.html',
    image: 'images/IMG_1677.jpeg',
    alt: 'Goblin Hut Clicker',
    statusKey: 'complete',
    type: 'Clicker',
    tags: ['Clicker', 'Idle'],
    description: 'Click to get goblins and grow your tribe! Buy buildings, sacrifice goblins to science, and conquer the universe! Note: Progress saves to your browser automatically.',
    featured: false
  },
  {
    title: 'Legacy Racing Sim',
    url: 'games/legacysim.html',
    image: 'images/IMG_1669.jpeg',
    alt: 'Legacy Racing Sim',
    statusKey: 'legacy',
    type: 'Racing',
    tags: ['Racing', 'Tracks', 'Sim'],
    description: 'Playable racing sim with classic arcade physics, a real track, and timing. The graphics are mimicking 3d using 2d (this was made before i knew about three.js)',
    featured: false
  },
  {
    title: 'Royal Clash',
    url: 'games/clash.html',
    image: 'images/IMG_1002.jpeg',
    alt: 'Legacy Racing Sim',
    statusKey: 'legacy',
    type: 'Tower Defense',
    tags: ['Strategy', 'Defense', 'Clash'],
    description: 'The very first HTML game I ever made, long before this website. It\'s a very archaic clone of a certain popular mobile game, with some gameplay tweaks.',
    featured: false
  },
  {
    title: 'Engine Sim',
    url: 'games/enginesim.html',
    image: 'images/IMG_1691.jpeg', 
    alt: 'Engine Sim',
    statusKey: 'beta',
    type: 'Sim',
    tags: ['Sim', 'Physics'],
    description: 'You can tune anything, from the shape and cylinder count down to the turbo tuning (yes, there is turbo flutter!), and it will all affect your engine! Warning: the engine DOES have sound effects, be mindful of your device\'s volume.',
    featured: false
  },
  {
    title: 'Warzone',
    url: 'games/warzone.html',
    image: 'images/IMG_1723.jpeg',
    alt: 'Warzone',
    statusKey: 'wipBuggy',
    type: 'Military',
    tags: ['Military', 'Vehicles'],
    description: 'Pick a famous wartime vehicle, get a target lock and destroy enemies, and use maneuvers and flares to avoid missiles in this action-packed military sim!',
    featured: false
  },
  {
    title: 'Gang Wars',
    url: 'games/gangwars.html',
    image: 'images/IMG_1625.jpeg',
    alt: 'Gang Wars',
    statusKey: 'wipBuggy',
    type: 'Arcade',
    tags: ['Arcade', 'Top-Down'],
    description: 'Your gang has sent you on a mission: clear out the rivals. Drop all the thugs, take their straps, and make your way to the bottom right to advance!',
    featured: false
  },
  {
    title: 'Racing Sim',
    url: 'games/badracingsim.html',
    image: 'images/IMG_1604.jpeg',
    alt: 'Racing Sim',
    statusKey: 'abandoned',
    type: 'Driving',
    tags: ['Driving', 'Physics'],
    description: 'Not much to talk about here: It\'s extremely incomplete. If you want a playable racing game, play the legacy one.',
    featured: false
  },
  {
    title: 'FPS beta',
    url: 'games/fps.html',
    image: 'images/missing.png',
    alt: 'FPS beta',
    statusKey: 'beta',
    type: 'FPS',
    tags: ['Shooter', 'Multiplayer', 'Under development'],
    description: 'THIS IS NOT A COMPLETE GAME; THIS IS A TEST OF A NEW ENGINE I AM ROLLING OUT FOR MULTIPLAYER FPS GAMES',
    featured: false
  },
  {
    title: 'Fieldkit 3D Engine',
    url: 'games/fieldkit_3d_engine.html',
    image: 'images/missing.png',
    alt: 'Fieldkit 3D Engine',
    statusKey: 'beta',
    type: 'Engine / Sandbox',
    tags: ['3D', 'Physics', 'Sandbox', 'Game Engine', 'Under development'],
    description: 'A single-file 3D game engine and physics sandbox with rendering, character and vehicle controllers, object interaction, touch controls, and a configurable world. Built as a starting point for creating more games.',
    featured: false
  }
];

const classics = [
  {
    title: "Alien Invaders",
    url: "games/classics/alieninvaders.html",
    image: "images/IMG_1802.jpeg",
    alt: "Alien Invaders"
  },
  {
    title: "Break Through",
    url: "games/classics/breakthrough.html",
    image: "images/IMG_1806.jpeg",
    alt: "Classic placeholder 2"
  },
  {
    title: "Meteors",
    url: "games/classics/meteors.html",
    image: "images/IMG_1671.jpeg",
    alt: "Meteors"
  },
  {
    title: "Neon Pong",
    url: "games/classics/neonpong.html",
    image: "images/IMG_1808.jpeg",
    alt: "Neon Pong"
  },
  {
    title: "Pellet Muncher",
    url: "games/classics/pelletmuncher.html",
    image: "images/IMG_1803.jpeg",
    alt: "Pellet Muncher"
  },
  {
    title: "Snake",
    url: "games/classics/snake.html",
    image: "images/IMG_1804.jpeg",
    alt: "Snake"
  }
];

/* ---------------------------------------------------------------------
 * Applets (desktop accessories). Unlike games they have no tags or status and
 * never appear in the Project Library — only in the Accessories folder, Start
 * menu and Find. main.js auto-detects every entry here; use applets/makedata.html
 * (Applet mode) to generate new ones.
 *   title, description, icon (path), url (applets/xxx.html)
 *   optional: w, h (window size), keep (stay loaded when closed), group ('games' puts it in Start > Programs > Games)
 * ------------------------------------------------------------------ */
const applets = [
  { title: 'Calculator', description: 'Scientific calculator', icon: 'images/icons/calculator.png', url: 'applets/calculator.html', w: 360, h: 520 },
  { title: 'Clock', description: 'Clock, stopwatch and alarms', icon: 'images/icons/clock.png', url: 'applets/clock.html', w: 600, h: 480 },
  { title: 'Notepad', description: 'Create and save .txt files into My Documents', icon: 'images/icons/notes.png', url: 'applets/notepad.html', w: 520, h: 420 },
  { title: 'Paint', description: 'Canvas drawing program; save pictures to My Documents', icon: 'images/icons/paint.png', url: 'applets/paint.html', w: 780, h: 580 },
  { title: 'MS-DOS Prompt', description: 'Command line: DIR your games and type a name to launch it', icon: 'images/icons/run.svg', url: 'applets/msdos.html', w: 640, h: 400 },
  { title: 'Weather', description: 'Weather dashboard', icon: 'images/icons/weather.png', url: 'applets/weather.html', w: 660, h: 580 },
  { title: 'Timer', description: 'Countdown timer', icon: 'images/icons/hourglass.svg', url: 'applets/timer.html', w: 460, h: 520, keep: true },
  { title: 'Internet Explorer', description: 'Retro proxy web browser with a ColtonNet start page, favorites and history', icon: 'images/icons/globe.svg', url: 'applets/web_proxy_browser_applet.html', w: 940, h: 660 },
  { title: 'File Manager', description: 'Copy, move, import, export and search your files', icon: 'images/icons/filemanager.svg', url: 'applets/filemanager.html', w: 760, h: 520 },
  { title: 'WordPad', description: 'Word processor with fonts, colors and lists', icon: 'images/icons/wordpad.svg', url: 'applets/wordpad.html', w: 660, h: 520 },
  { title: 'Character Map', description: 'Copy symbols, arrows and emoji', icon: 'images/icons/charmap.svg', url: 'applets/charmap.html', w: 520, h: 440 },
  { title: 'Calendar', description: 'Month view with notes and holidays', icon: 'images/icons/calendar.svg', url: 'applets/calendar.html', w: 620, h: 440 },
  { title: 'Sound Recorder', description: 'Record from your microphone and save to My Documents', icon: 'images/icons/soundrec.svg', url: 'applets/soundrec.html', w: 380, h: 340 },
  { title: 'Media Player', description: 'Play audio, video and pictures, plus built-in tunes', icon: 'images/icons/mediaplayer.svg', url: 'applets/mediaplayer.html', w: 640, h: 440 },
  { title: 'Phone Dialer', description: 'Dial with real touch tones and speed dial', icon: 'images/icons/phone.svg', url: 'applets/phonedialer.html', w: 360, h: 560 },
  { title: 'Disk Defragmenter', description: 'Watch your imaginary disk get tidy', icon: 'images/icons/defrag.svg', url: 'applets/defrag.html', w: 560, h: 420 },
  { title: 'Achievements', description: 'Trophies you earn by exploring ColtonOS', icon: 'images/icons/achievements.svg', url: 'applets/achievements.html', w: 640, h: 520 },
  { title: 'Tapey Settings', description: 'Customize Tapey, your tape-roll desktop assistant', icon: 'images/tapey/tapey-idle.svg', url: 'applets/tapey.html', w: 560, h: 600 },
  { title: 'Text Games', description: 'Text adventure, Hangman, Mad Libs, Blackjack and more', icon: 'images/icons/textgames.svg', url: 'applets/textgames.html', w: 700, h: 460, group: 'games' },
  { title: 'FreeCell', description: 'Classic card solitaire with numbered deals', icon: 'images/icons/freecell.svg', url: 'applets/freecell.html', w: 720, h: 560, group: 'games' },
  { title: 'Reversi', description: 'Flip discs and take the corners', icon: 'images/icons/reversi.svg', url: 'applets/reversi.html', w: 460, h: 540, group: 'games' },
  { title: 'Minesweeper', description: 'Find the mines without stepping on one', icon: 'images/icons/warning.svg', url: 'applets/minesweeper.html', w: 340, h: 420, group: 'games' },
  { title: 'Solitaire', description: 'Klondike card game (original card art)', icon: 'images/icons/star.svg', url: 'applets/solitaire.html', w: 620, h: 540, group: 'games' }
];
