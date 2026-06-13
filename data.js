// data.js

const siteData = {
  version: "v2.2",
  author: "COLTON BENNETT",
  location: "WAUKESHA, WI",
  heroTitle: "Project Launcher",
  heroCopy: "<strong>Welcome to my catalog!</strong> These are the projects I have been building lately.",
  heroNote: "Feel free to browse the current lineup, see what's there, and if anything's changed.<br>Please excuse any bugs you find; I am still learning.",
  marqueeText: "★★★ WELCOME TO COLTON'S PROJECT LAUNCHER ★★★ &nbsp;|&nbsp; BEST VIEWED IN 1024x768 &nbsp;|&nbsp; NETSCAPE NAVIGATOR 4.0 RECOMMENDED &nbsp;|&nbsp; ★★★ SIGN MY GUESTBOOK ★★★",
  footerCopyright: "© 2026 Colton Bennett",
  footerLastUpdated: "June 13, 2026, 00:21:47"
};

const announcements = [
  {
    title: "New releases",
    content: "Nothing's been published recently."
  },
  {
    title: "Game updates",
    content: "Ghengis Khan Simulator now has secret content to unlock after beating lv. 100, plus some UI and UX improvements and a level select menu, as well as fixing some unit model innacuracies. - (06/11/2026)"
  },
  {
    title: "Site updates",
    content: " - It's been over a week since moving to Github becuase of a prime example of the 'Scunthorpe Problem' on OneCompiler.com, and it's been going great! Github is also easier to manage.<br> - AN APOLOGY TO ALL USERS: The move from OneCompiler to Github made the LocalStorage that holds your data on OneCompiler inaccessible. I am very sorry about this, but OneCompiler forced my hand to leave it by not letting me upload my games anymore. But your data <i>should</i> be safe from now on (as long as you don't clear your browser data, but that's on you if you do that...) - (06/11/26)<br> - THE SITE IS NOW 90's GEOCITIES THEMED BECAUSE WHY NOT! - (06/10/2026)<br> - CLASSIC GAMES ARE BACK! I finally moved them over from OneCompiler. Sorry for the delay on them, I was ironing out a few more pressing issues on the site. - (06/13/2026)"
  }
];

const projects = [
  {
    title: 'Pixel Ops',
    url: 'games/pixel-ops.html',
    image: 'images/IMG_1941.jpeg',
    alt: 'Pixel Ops',
    statusKey: 'complete',
    type: 'FPS',
    tags: ['Shooter', 'Military'],
    description: 'A shoot-em-up FPS across conquered lands. Pick your deployment location and take out as many hostiles as possible using your vast arsenal!',
    featured: false
  },
  {
    title: 'Ghengis Khan Simulator',
    url: 'games/ghengis.html',
    image: 'images/IMG_1987.jpeg',
    alt: 'Ghengis Khan Simulator',
    statusKey: 'new',
    type: 'Simulation',
    tags: ['War', 'Historical', 'Under development'],
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
    statusKey: 'new',
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
    statusKey: 'new',
    type: 'Horror',
    tags: ['Horror', 'Survival', 'Under development'],
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
  }
];

const classics = [
  {
    title: "Alien Invaders",
    url: "games/classics/alieninvaders.html",
    image: "images/IMG_1802.jpeg", // Add image path when ready
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
