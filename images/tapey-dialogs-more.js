/* tapey-dialogs-more.js — second dialog pack for Tapey (loaded right after tapey-dialogs.js).
 * Same entry syntax:  "[tone:]text [~pose]"   tones: c s w n (friendly = w) · tokens: {game} {app} {n} {total} {ach} {min} {visits} {part} {time} {day} {files} {wins} {theme} {user}
 * It ADDS lines to existing pools and defines new pools for extra context (holidays, weekdays, first-time events, DOS commands,
 * text games, touch screens...), plus many more typed-question intents and help topics. */
(function () {
  var D = window.TAPEY_DIALOGS; if (!D) return;
  var P = D.pools;
  function add(k, a) { P[k] = (P[k] || []).concat(a); }

  /* ================= GREETINGS (more variety) ================= */
  add('greet.first', [
    "Hey! I'm Tapey, the roll of tape who lives on your desktop. Click me if you get stuck. Get it? Stuck? ~wave",
    "s:A new face. Let me guess, you clicked the first thing you saw? ~cool",
    "n:System check: one desktop, one user, one very enthusiastic tape roll. Let's go. ~idea",
    "w:Hi! Feel free to poke around. Nothing here can break. ~wave",
    "Tip: drag me anywhere, right-click me for options, or click me to search for things. ~point",
    "Welcome to ColtonOS! The Start button is bottom-left. I'm bottom-right. We've got it covered. ~flag"
  ]);
  add('greet.morning', [
    "Morning! New day, new high score. ~excited", "Good morning. The best time to find a game you'll want to finish. ~idea",
    "s:Morning. I'd offer you coffee, but I'm tape. ~cool", "w:Morning! Hope you slept well. ~wave", "n:Morning boot sequence complete. Humans online. ~idea",
    "Rise and shine! Let's get this day stuck together. ~excited", "It's a fresh morning. Perfect for a quick game and a long to-do list. ~point",
    "Good morning! It's {day}. ~wave", "Morning, {day}! Let's make it a good one. ~excited"
  ]);
  add('greet.afternoon', [
    "Afternoon! How's the day treating you? ~wave", "Hey, it's {time}. Snack break? ~idle", "s:Afternoon. The workday is half over, or so I'm told. ~cool",
    "w:Good afternoon! Hope it's going well. ~wave", "n:{time}: statistically the best time for a game of Minesweeper. I made that up. ~idea",
    "Afternoon! It's {day}. ~wave", "Midday desktop check: all windows present and accounted for. ~point", "Good afternoon! Anything I can help you find? ~search"
  ]);
  add('greet.evening', [
    "Evening! Kick back, the desktop's open. ~wave", "Good evening. Anything fun planned? ~idle", "s:Evening. Time to pretend you're done with work. ~cool",
    "w:Good evening! Hope you had a decent day. ~wave", "n:Evening mode active. Screen glow: optimal. ~idea", "Evening! {day} night vibes. ~cool",
    "Hey! Perfect time for a game or two. ~flag", "Good evening! Let me know if you want a game suggestion. ~point"
  ]);
  add('greet.night', [
    "Still up? Me too. Technically I never sleep. ~cool", "Late night session! I respect it. ~cool", "s:It's {time}. Your bed called. It left a voicemail. ~cool",
    "w:Late one tonight. Don't forget to get some rest. ~idle", "n:After {time}, the logic gets weird and the high scores get better. ~idea",
    "Night owl mode. I'll keep the desktop warm. ~idle", "It's {time}. One more game, then bed? ~point", "Quiet night. Good time for a text adventure. ~read"
  ]);
  add('greet.back', [
    "Welcome back! Let's pick up where we left off. ~wave", "You're back! Anything new today? ~wave", "Back again. Good. The desktop's all set. ~idle",
    "s:Back so soon? Not that I'm complaining. ~cool", "w:Hey, welcome back! ~wave", "n:Returning user detected. Cache warmed. ~idea",
    "Ah, there you are. Ready when you are. ~flag", "Hey, welcome back! ~excited"
  ]);
  add('greet.regular', [
    "Visit number {visits}. You know your way around. ~cool", "{visits} visits and counting. Respect. ~excited", "s:{visits} visits. You might as well pay rent. ~cool",
    "w:Visit {visits}! Great to see you around so much. ~wave", "n:Visit #{visits}. You've been here more than most of my tape. ~idea"
  ]);

  /* ================= DATE / TIME CONTEXT ================= */
  add('ctx.monday', ["It's Monday. Be gentle with yourself. And with the mouse. ~idle", "Monday! Fresh start. Or fresh snooze. ~idea", "s:Monday. We all feel it. ~cool", "w:Happy Monday! One step at a time. ~wave", "n:Monday: statistically the least favorite day. Let's improve the stats with a game. ~idea"]);
  add('ctx.friday', ["It's Friday! Almost there. ~excited", "Friday! The weekend is calling. ~excited", "s:Friday. Productivity levels: optional. ~cool", "w:Happy Friday! You made it. ~wave", "n:Friday: the day the high scores go up. ~idea"]);
  add('ctx.weekend', ["Weekend! Time for games. ~excited", "It's the weekend. No rush. ~idle", "s:Weekend. Finally. Do absolutely nothing. ~cool", "w:Enjoy your weekend! ~wave", "n:Weekend detected. Free time: maximum. ~idea", "Saturday and Sunday: the two best days of the week. ~flag"]);
  add('ctx.lunch', ["Lunchtime! Don't forget to eat something that isn't a tape roll. ~idea", "It's around noon. Food break? ~idle", "s:Lunch? You can pause the game. It won't mind. ~cool", "w:Hope you get a good lunch. ~wave", "n:Noon. Blood sugar check recommended. ~idea"]);
  add('ctx.bedtime', ["It's getting late. Maybe a good time to wind down? ~idle", "Bedtime is calling. Politely. ~sleep", "s:Pretty sure the sun went down a while ago. ~cool", "w:It's late. Sleep is a great power-up. ~idle", "n:Sleep deficit accumulating. Recommend: bed. ~idea"]);
  add('ctx.midnight', ["It's midnight! A new day starts now. ~excited", "Midnight. The witching hour of game development. ~cool", "s:Midnight. Bold of you. ~cool", "n:00:00. Date rollover complete. ~idea"]);
  add('ctx.newyear', ["Happy New Year! ~celebrate", "New year, new high scores. ~celebrate", "s:New year, same you. In a good way, probably. ~cool", "w:Happy New Year! Wishing you a good one. ~wave", "n:Year counter incremented. No overflow detected. ~idea"]);
  add('ctx.halloween', ["Happy Halloween! I'm dressed as a tape roll. Very scary. ~excited", "Spooky season! Try a text adventure in the dark. ~idea", "s:Halloween. I'm scary because I'm sticky. ~cool", "w:Happy Halloween! Have fun and stay safe. ~wave", "n:Halloween fact: tape comes in orange and black for exactly one reason. ~idea", "Boo! Did that work? I can't tell. I have no eyelids. ~shocked"]);
  add('ctx.xmas', ["Happy holidays! I'm available for gift wrapping. ~excited", "It's the holiday season. I'm basically a gift-wrap professional. ~excited", "s:Holidays. Time to use me for wrapping presents and nothing else. ~cool", "w:Happy holidays! Hope it's a good one. ~wave", "n:Gift wrapping consumes a lot of tape every year. I feel useful. ~idea", "Wrap it, tape it, give it. That's my season. ~flag"]);
  add('ctx.aprilfools', ["It's April 1st. I'd tell you a joke, but you'd think it's a prank. ~cool", "Happy April Fools' Day! Nothing on this desktop is fake. Mostly. ~idea", "s:April 1st. I'm not telling you anything true today. ~cool"]);
  add('ctx.thanksgiving', ["Happy Thanksgiving! I'm thankful for adhesive. ~excited", "Thanksgiving! Enjoy the food and the games. ~wave"]);
  add('ctx.summer', ["Summer! Stay hydrated and keep that screen out of direct sunlight. ~idea", "It's summer. Perfect for indoor gaming. ~cool"]);
  add('ctx.winter', ["Winter! Cozy desktop weather. ~idle", "It's cold out. The computer is warm. ~idle"]);

  /* ================= IDLE: TIPS (+) ================= */
  add('idle.tip', [
    "Drag any window by its title bar and drop it near the screen edge. It will snap into place. ~idea",
    "Right-click a game in the Project Library to add it to your favorites. ~idea",
    "You can change what the screen saver looks like and how long it waits in Control Panel. ~idea",
    "The Timer applet can count down your 'just one more game' sessions. ~idea",
    "On a phone or tablet, long-press acts like a right-click. ~idea",
    "The Task Manager shows every open window. You can end one that's stuck. ~idea",
    "Open the System Monitor from Control Panel to see real charts. ~idea",
    "You can use the File Manager's search box with wildcards, like *.txt. ~idea",
    "The Start menu's Documents entry shows your recently opened files. ~idea",
    "My Computer shows the drives. My Documents shows your files. They're real, stored in this browser. ~idea",
    "Press Esc to close menus, dialogs and my speech balloon. ~idea",
    "Most windows can be resized by dragging their edges or corners. ~idea",
    "Alt+Tab-style switching: click a window's button on the taskbar to bring it to the front. ~idea",
    "The tray in the bottom right shows the clock. Click it to see a calendar. ~idea",
    "In Paint, hold Shift while dragging a line to keep it perfectly straight. ~idea",
    "Wallpapers can be tiled, centered or stretched. Right-click the desktop and open Properties. ~idea",
    "Some desktop themes also change the window title bars. Try a few! ~idea",
    "Save slots store only your local game progress. Chat and Arcade games are left out on purpose. ~idea",
    "A save slot is a copy of the game's saved data. You can export one to a file and import it later. ~idea",
    "You can keep a game running in the background by minimizing its window. ~idea",
    "Use the Find box with the name of a game, an app, or a file. It searches all of them. ~idea",
    "Widgets can be dragged anywhere on the desktop, and they remember where you left them. ~idea",
    "The Progress widget shows your achievement count and play time at a glance. ~idea",
    "The Sticky Note widget changes color. Click the ◐ in its title bar. ~idea",
    "The Lucky widget picks a random game. It's like the Library's dice button, but on your desktop. ~idea",
    "MS-DOS has a COPY command that works on your real files in MYDOCS. ~idea",
    "In MS-DOS, EDIT file.txt opens that file in Notepad. ~idea",
    "TYPE changelog in MS-DOS shows the latest changes. ~idea",
    "Press the Windows key (or Ctrl+Esc) to open the Start menu from the keyboard. ~idea",
    "Press Enter on a selected icon to open it. Arrow keys move the selection. ~idea",
    "You can drag icons around the desktop. Right-click for the 'Line Up Icons' options. ~idea",
    "Folders can be nested. Make as many as you like in My Documents. ~idea",
    "You can drop images straight onto the File Manager from your computer. ~idea",
    "Text Games in MS-DOS: ADVENT, HANGMAN, GUESS, MADLIBS, SCRAMBLE and BLACKJACK. ~idea",
    "Calculator has a scientific mode if you're feeling brave. ~idea",
    "FreeCell game numbers let you replay the same deal. Pick a number with the Game # button. ~idea",
    "s:Tip: pressing the same button harder does not help. It's a mouse, not a lever. ~cool",
    "s:Tip: you can close me. I won't be offended. I'll be a little offended. ~cool",
    "w:Tip: if something doesn't work, try again. It usually does. ~idea",
    "w:Tip: small steps count. Even one game of Minesweeper is progress. ~idea",
    "n:Tip: the Esc key is the universal 'nope, cancel that'. ~idea",
    "n:Tip: Ctrl+C, Ctrl+X, Ctrl+V work in the File Manager. Old habits die hard. ~idea"
  ]);

  /* ================= IDLE: JOKES (+) ================= */
  add('idle.joke', [
    "What did the tape roll say when it saw a broken toy? 'Don't worry, I'll fix that. Just give me a second.' ~excited",
    "How did the tape roll get such a great workout? It did a lot of reps. And a lot of rolls. ~cool",
    "What's a tape roll's favorite game? Sticky-tac-toe. ~excited",
    "Why did the tape roll go to the party? To bond with everyone. ~excited",
    "I'd tell you a construction joke, but I'm still working on it. ~idle",
    "What do you call a tape roll in a bad mood? Un-stuck-up. ~idea",
    "Why did the tape refuse to share? It had a strong attachment to its stuff. ~cool",
    "What did one roll of tape say to the other? 'I'm stuck on you.' (Don't read into that.) ~idle",
    "I tried to make a tape roll joke about wrapping up, but it's a wrap. ~cool",
    "Why was the tape roll so good at fixing relationships? It always found the common bond. ~idea",
    "I don't get tired of puns. I get stuck on them. ~excited",
    "What do you call a tape roll that retires? Out of stick. ~cool",
    "My doctor said I have a lot of potential. I said I'm just a roll of tape. He said 'stick with it'. ~excited",
    "Why did the tape roll start a band? It wanted to be on a roll. ~dance",
    "A computer walks into a bar and orders a screen. The bartender says 'we don't serve hardware.' ~cool",
    "Why do programmers prefer dark mode? Because light attracts bugs. ~idea",
    "What's a ghost's favorite programming language? Boo-lean. ~cool",
    "Why did the developer go broke? Because he used up all his cache. ~excited",
    "How many programmers does it take to change a light bulb? None. That's a hardware problem. ~cool",
    "Why did the file go to the doctor? It had too many bytes. ~idle",
    "What do you call a computer that sings? A Dell. ~excited",
    "What do computers snack on? Cookies. And chips. ~idea",
    "Why was the mouse sad? Its girlfriend left it. It wasn't clicking. (I'm sorry. That one was bad.) ~sad",
    "Why did the Windows user bring a ladder? To get to the higher-level language. ~cool",
    "A byte walks into a bar looking miserable. The bartender asks what's wrong. 'Parity error.' 'Ah, I thought you looked a bit off.' ~idea",
    "I'd tell you a joke about the pixel, but it's a bit rough around the edges. ~cool",
    "What's the difference between a tape roll and a lie? One sticks around. ~idea",
    "What do you get if you cross a tape roll with a tractor? A sticky-trailer. ~excited",
    "Why did the screen saver take up so much space? It had a lot of pipes. ~cool",
    "Why don't tape rolls ever win at hide and seek? They're always sticking out. ~excited",
    "s:A tape roll walks into a bar. The bartender says 'what'll it be?' It says 'nothing. I'm just here to hold it together.' ~cool",
    "s:I'm going to tell you a joke. Don't laugh. That would make it too easy for me. ~cool",
    "w:What's a tape roll's favorite thing about summer? Everything sticks. ~excited",
    "w:Why is tape so good at friendships? It sticks with you through thick and thin. ~excited",
    "n:There are two hard problems in computer science: cache invalidation, naming things, and off-by-one errors. ~idea",
    "n:Why did the tape roll pass the exam? It had the right adhesion to the material. ~idea"
  ]);

  /* ================= IDLE: FACTS (+) ================= */
  add('idle.fact', [
    "Fun fact: the Windows 95 startup sound was composed by Brian Eno and is about 3 seconds long. ~read",
    "Fun fact: the first computer game, Spacewar!, was made in 1962. ~read",
    "Fun fact: the first video game console to sell a lot was the Magnavox Odyssey, in 1972. ~read",
    "Fun fact: Tetris was created in 1984 by a Soviet engineer named Alexey Pajitnov. ~read",
    "Fun fact: Minesweeper first shipped with Windows 3.1 in 1992. ~read",
    "Fun fact: the 3.5-inch floppy held 1.44 MB. That's about one MP3 at low quality. ~read",
    "Fun fact: the first email was sent in 1971. The content has been forgotten, probably 'QWERTYUIOP'. ~read",
    "Fun fact: the term 'bug' for glitches predates computers. Edison used it in the 1870s. ~read",
    "Fun fact: a mouse wheel scroll is an ancient technology from 1995. ~read",
    "Fun fact: the 'blue screen of death' has existed since at least Windows 3.1. ~read",
    "Fun fact: the original Pac-Man was called 'Puck Man' in Japan. ~read",
    "Fun fact: Donkey Kong's hero was originally named Jumpman. ~read",
    "Fun fact: the Konami code was invented because the developer found a game too hard to test. ~read",
    "Fun fact: the first computer password was probably used in the 1960s at MIT. ~read",
    "Fun fact: 640K of memory was famously 'enough for anyone'. A quote that was probably never said. ~read",
    "Fun fact: the Y2K bug was a real problem that was mostly fixed before it hit. ~read",
    "Fun fact: the 'Start' button was a big part of Windows 95's marketing. ~read",
    "Fun fact: CRT stands for cathode ray tube. ~read",
    "Fun fact: the dial-up handshake tones were negotiating the fastest possible speed. ~read",
    "Fun fact: the typical 90s monitor was 14 to 17 inches. ~read",
    "Fun fact: the first webcam watched a coffee pot at Cambridge University. ~read",
    "Fun fact: MIDI files are tiny because they store notes, not sound. ~read",
    "Fun fact: PNG was created partly as a patent-free alternative to GIF. ~read",
    "Fun fact: a GIF is pronounced 'jif' by the creator. The internet disagrees. ~read",
    "Fun fact: tape comes in clear, matte, double-sided, masking, duct and washi varieties. I'm clear. ~read",
    "Fun fact: masking tape was invented to help painters mask off car panels. ~read",
    "Fun fact: duct tape was originally made for sealing ammo boxes in WWII. ~read",
    "Fun fact: post-it adhesive was a failed experiment that became a hit. Persistence pays. ~read",
    "Fun fact: velcro was inspired by burrs stuck to a dog. ~read",
    "Fun fact: some geckos stick to walls using microscopic hairs. Tape has envy. ~read",
    "s:Fun fact: the average person spends years of their life looking at screens. You're doing great. ~cool",
    "w:Fun fact: taking short breaks can actually help you focus better. ~read",
    "n:Fun fact: ASCII only had 128 characters. Unicode has over a million. Character Map has a sample. ~read",
    "n:Fun fact: the number 42 is the answer to life, the universe and everything, according to a famous book. ~read"
  ]);

  /* ================= IDLE: SMALL TALK / COMPLIMENTS / NUDGES (+) ================= */
  add('idle.chat', [
    "Is anyone else hearing that hard drive hum? Oh wait, that's just me thinking. ~think",
    "I should organize my pose collection. It's mostly 'idle'. ~think",
    "I wonder what the other taskbar buttons think about. ~think",
    "Pro tip: I'm very good at holding things together. Emotionally, not physically. ~cool",
    "Sometimes I just stare at the Start button. It stares back. ~search",
    "If I could walk, I'd roll. If I could roll, I'd... well, I'd roll. ~idle",
    "I've been practicing my winks. I don't have eyelids, so it's mostly just squinting. ~cool",
    "Fun hobby: counting the pixels on the screen. Currently at 'a lot'. ~think",
    "I was going to say something wise, but I forgot. Tape memory isn't great. ~confused",
    "Do you ever get the feeling someone's watching you? That's me. Sorry. ~search",
    "I love the sound of a mouse click. It sounds like progress. ~excited",
    "Every window on this desktop has a story. Most of them are 'untitled'. ~read",
    "I've been thinking about what to put on my business card. 'Tapey: Adhesive Consultant'. ~write",
    "Sometimes a good plan is just a good roll of tape and a deep breath. ~idea",
    "Do you think the Recycle Bin gets bored? ~think",
    "Sometimes I wish I had a tape dispenser vacation home. ~idle",
    "I'm a professional at hanging out on desktops. It's my best skill. ~cool",
    "Quiet moment. I'll use it to polish my cardboard core. ~idle",
    "s:I'm not saying I'm bored. I'm saying I've counted every pixel twice. ~cool",
    "s:Don't mind me. I'll just be over here, holding the screen together. ~cool",
    "s:You know I can hear you thinking? It's mostly 'what should I do next'. ~cool",
    "w:Doing alright over here. How about you? ~wave",
    "w:Remember: it's fine to take your time on this. There's no rush. ~idle",
    "n:Thought experiment: if a tape roll has no stickiness left, is it still tape? ~think",
    "n:I computed pi to 3 digits. I'm now very tired. ~confused",
    "n:Observation: the cursor is just a very small arrow with a big job. ~idea",
    "I'll just hang out here. As usual. ~idle",
    "Thinking about snacks. I don't eat, so it's all theoretical. ~think",
    "Another minute, another click. Good work. ~idle",
    "Hmm, I'm getting an idea. Give me a second. ...No, it's gone. ~think",
    "I keep an eye on things. Technically two. ~search"
  ]);
  add('idle.compliment', [
    "Nice window management. I like the cut of your taskbar. ~cool", "You're navigating this OS like a pro. ~excited",
    "That's some solid clicking. ~cool", "Great choice of wallpaper. Or lack thereof. Either way, bold. ~cool", "You're picking this up quickly. ~excited",
    "Your taste in games is impeccable. ~cool", "You've got a good eye for apps. ~search", "Good job exploring. Seriously. ~excited",
    "s:Compliment: you haven't closed me yet. That's something. ~cool", "s:You're not bad at this. Don't tell anyone I said that. ~cool",
    "w:Nice work today. Keep it up. ~wave", "w:You're doing well. Seriously. ~wave", "n:Your productivity metrics are sticking around. Statistically. ~idea"
  ]);
  add('idle.nudge', [
    "Have you tried the {game} yet? It's worth a look. ~point", "How about trying {game}? ~point", "You haven't opened {game} yet. Today could be the day. ~flag",
    "Try the MS-DOS Prompt and type TAPEY. It does something. ~point", "Have you recorded your voice in Sound Recorder? It's a fun one. ~point",
    "Draw something in Paint and save it to My Documents. ~write", "Open Media Player and try one of the built-in tunes. ~dance",
    "Have you tried the text adventure? The Copper Key is a good one. ~read", "Try dialing 5551234 in Phone Dialer. Someone might pick up. ~point",
    "There's a Defrag tool that looks very important. It does nothing. It's wonderful. ~cool", "If you want a challenge, try FreeCell on a random game number. ~flag",
    "Try changing your desktop theme in Control Panel. ~point", "Have you checked the weather? Might be nice out. ~point",
    "Try the Character Map. You can copy symbols like Ω and ☺. ~point", "Hit that 🎲 and see what you get. ~excited",
    "s:Might I suggest doing literally anything in {game}? ~cool", "w:If you're looking for something chill, {game} might be a good pick. ~wave", "n:Statistically, you've got more unplayed games than played ones. Fix that with {game}. ~idea"
  ]);
  add('idle.late', ["It's {time}. Late nights are okay now and then. ~idle", "{time}. If you're winning, carry on. If not, bed. ~cool", "s:{time}. The game isn't going anywhere. You should be. ~cool", "w:It's late. Good night when you're ready. ~wave", "n:{time}: your circadian rhythm sends its regards. ~idea"]);
  add('idle.long', ["{min} minutes in. Water break? ~idea", "You've been here {min} minutes. Maybe stand up for a second? ~idle", "s:{min} minutes. I've counted. Every. Single. One. ~cool", "w:{min} minutes! Stretch your hands a little. ~wave", "n:{min} minutes of screen time. Blink rate: unknown. Please blink. ~idea"]);
  add('idle.windows', ["{wins} windows. That's a full desktop. ~shocked", "You've got {wins} windows open. Need help tiling them? Right-click the taskbar. ~idea", "s:{wins} windows. Is this a competition? ~cool", "w:That's a lot open! Close a few if it gets overwhelming. ~wave", "n:{wins} windows. Memory pressure: rising. ~idea"]);

  /* ================= CONTEXT-ONLY POOLS ================= */
  add('ctx.touch', ["On a touch screen, long-press acts as right-click. ~idea", "Tap and hold on the desktop for the menu. ~idea", "Double-tap an icon to open it. ~point", "Pinch isn't supported here, but tapping is. ~idea", "Drag me with your finger. I don't mind. ~wave"]);
  add('ctx.files', ["You've got {files} items in your file system. Impressive. ~read", "{files} files! Time to organize with folders? ~write", "s:{files} files. Do you ever delete anything? ~cool", "n:{files} objects in storage. Index rebuild recommended. ~idea"]);
  add('ctx.nofiles', ["Your My Documents folder is empty. WordPad or Paint can fix that. ~point", "No files yet. Make something in Notepad, WordPad, Paint or Sound Recorder. ~point", "s:Empty My Documents. Bold minimalism. ~cool"]);
  add('ctx.ach.near', ["You're one achievement away from a milestone. ~excited", "Almost at a milestone! ~excited", "s:Almost there. Don't mess it up. ~cool", "n:{ach} achievements. The next milestone is near. ~idea"]);
  add('ctx.fav.game', ["You play {game} a lot. It's your favorite, isn't it? ~cool", "{game} again? You must really like it. ~excited", "s:Let me guess: {game}. Again. ~cool", "n:{game} is your most-played game. The data does not lie. ~idea"]);
  add('ctx.session.long', ["You've been on for a while. The desktop is comfy. ~idle", "Long session! Let's see how far you get. ~flag"]);
  add('ctx.many.games', ["You've tried {n} games. That's a good variety. ~excited", "{n} games and counting. ~excited", "s:{n} games. Commitment issues? ~cool", "n:{n} distinct games launched. Diversified portfolio. ~idea"]);
  add('ctx.returned', ["Welcome back to the tab! ~wave", "Oh, you're back. I was keeping things warm. ~wave", "s:There you are. I was talking to myself. ~cool", "w:Hey, back again! ~wave", "n:Tab visibility restored. ~idea"]);

  /* ================= FIRST-TIME EVENTS ================= */
  add('ev.first.game', ["Your first game! May the odds be ever in your favor. ~celebrate", "First game launched! Hope it's a good one. ~excited", "s:First game. They always start with the easy ones. ~cool", "w:Nice choice for a first game. Have fun! ~wave", "n:First game: logged. Statistical significance: pending. ~idea"]);
  add('ev.first.ach', ["Your first achievement! There are plenty more. ~celebrate", "First achievement! The collection begins. ~excited", "s:One down. The rest are slightly harder. ~cool", "w:Nice! That's the first of many. ~wave", "n:Achievement #1. The first of many. Or the only one. ~idea"]);
  add('ev.slot.first', ["First save slot! Your progress is safe. ~celebrate", "Slot saved! Now you can try risky stuff without worry. ~flag", "s:Smart. Saving before disaster for once. ~cool"]);
  add('ev.widget.first', ["Your first widget! There are seven to try. ~excited", "A widget. Right-click the desktop for more. ~point", "s:Widgets: because the desktop wasn't busy enough. ~cool"]);
  add('ev.variety', ["Three different games this session. You like variety! ~excited", "Game hopping! I respect the energy. ~dance", "s:Can't commit to just one, can you? ~cool", "n:Three distinct games this session: variety index rising. ~idea"]);
  add('ev.devoted', ["Fifth round of {game}. You're hooked! ~cool", "{game} for the fifth time. That's dedication. ~excited", "s:Fifth time? Maybe it's a good game. ~cool", "n:{game} launch count: 5. ~idea"]);
  add('ev.return', P['ctx.returned']);

  /* ================= APPS / FEATURE EVENTS ================= */
  add('ev.media', ["Music! Turn it up. ~dance", "Now playing! The visualizer is worth watching. ~dance", "s:Is that a bop? ~cool", "w:Good tune! ~wave", "n:Audio stream active. Visualizer engaged. ~idea"]);
  add('ev.soundrec', ["Recording saved! Open it in Media Player to listen. ~idea", "Saved your sound. Hope it's not a bad singing voice. ~cool", "s:Recorded. I'll never hear it. Out of tape. ~cool"]);
  add('ev.wordpad.save', ["Document saved to My Documents. ~write", "Saved! Your words are safe. ~write", "s:Saved. That's the hardest part. ~cool", "n:Save complete: HTML-based, so formatting survives. ~idea"]);
  add('ev.phone', ["Ring ring! ~excited", "Dialing... hope someone picks up. ~idea", "s:Nobody answers. That's the 90s for you. ~cool", "n:DTMF tones transmitted. ~idea"]);
  add('ev.calendar', ["Note added! Don't forget it. ~write", "Good idea to jot that down. ~write", "s:A note to self. Typical. ~cool"]);
  add('ev.charmap', ["Copied! Paste it anywhere. ~idea", "Symbol copied. Ω yeah. ~cool"]);
  add('ev.fs.new', ["New file created. ~write", "New document ready. Right-click it to rename. ~idea"]);
  add('ev.dial', ["Dialing in... ~idea", "28.8k. Fast enough for anything. ~cool"]);
  add('ev.cheat', ["The classics never die. ~dance"]);

  /* ================= DOS COMMANDS ================= */
  add('ev.dos.dir', ["Directory listing. Classic. ~read", "DIR: the original file browser. ~cool"]);
  add('ev.dos.cd', ["Changing directories like it's 1995. ~cool", "CD: the fastest way to get lost. ~idea"]);
  add('ev.dos.copy', ["COPY works on your real files in MYDOCS. ~idea", "File copied. Cloning is easy when you're a computer. ~cool"]);
  add('ev.dos.del', ["DEL only touches MYDOCS. Your real stuff is safe. ~idea", "Careful with DEL. There's no Recycle Bin for DOS. ~shocked"]);
  add('ev.dos.md', ["New directory! Look at you, organizing. ~excited"]);
  add('ev.dos.format', ["Don't worry, nothing here can actually be formatted. ~cool", "FORMAT C:? Bold. Safe, but bold. ~shocked"]);
  add('ev.dos.deltree', ["That command is far too scary. It does nothing, I promise. ~shocked"]);
  add('ev.dos.ver', ["That's the version. I like it. ~idea", "VER: the one thing everyone types first. ~cool"]);
  add('ev.dos.mem', ["Plenty of memory. 640K isn't enough for anyone, but it's fine here. ~cool"]);
  add('ev.dos.games', ["Text games! Try ADVENT first. ~read", "GAMES lists the text games. ADVENT is a good start. ~point"]);
  add('ev.dos.matrix', ["Follow the white rabbit. ~cool", "Welcome to the Matrix. I'm a tape roll. ~confused"]);
  add('ev.dos.doom', ["Not enough memory for DOOM. Never was. ~cool"]);
  add('ev.dos.ping', ["Pong. ~cool", "Ping works on localhost. That's about it. ~cool"]);
  add('ev.dos.edit', ["Opening the editor. ~write"]);
  add('ev.dos.tree', ["A directory tree. Very organized. ~read"]);
  add('ev.dos.cls', ["Clean slate. ~idle"]);
  add('ev.dos.color', ["Color change! Green on black is the classic. ~cool"]);
  add('ev.dos.fortune', ["Fortune time. ~idea"]);
  add('ev.dos.hello', ["Hello, human. ~wave"]);
  add('ev.dos.who', ["Colton Bennett built this. Probably at 2 a.m. ~cool"]);

  /* ================= TEXT GAMES ================= */
  add('ev.tg.adventure', ["The Copper Key! Tip: read the note in the study. And bring an apple. ~read", "A tiny adventure. Type HELP if you get stuck. ~read", "s:Beware the troll. He's grumpy about snacks. ~cool", "n:Hint: light the lamp before going down to the cellar. ~idea"]);
  add('ev.tg.hangman', ["Hangman! The words are computer-themed. ~read", "Hangman time. Vowels first. ~idea"]);
  add('ev.tg.guess', ["Guess the number! Try halving the range each time. ~idea", "Binary search is your friend here. ~idea"]);
  add('ev.tg.madlibs', ["Mad Libs! Be as silly as you can. ~excited", "Prepare for nonsense. ~excited"]);
  add('ev.tg.scramble', ["Word Scramble! You can type SKIP. ~read", "Unscramble them all. ~read"]);
  add('ev.tg.blackjack', ["Blackjack! Stand on 17 or above. ~cool", "Reach 200 chips to win. ~flag"]);
  add('ev.tgwin.adventure', ["You escaped with the Golden Tape Roll! The best treasure. ~celebrate", "THE END. Excellent adventuring. ~celebrate"]);
  add('ev.tgwin.hangman', ["You solved it! ~celebrate", "Hangman cleared! ~excited"]);
  add('ev.tgwin.guess', ["Number guessed! ~celebrate"]);
  add('ev.tgwin.madlibs', ["That's a masterpiece of nonsense. ~excited"]);
  add('ev.tgwin.scramble', ["All five unscrambled! ~celebrate"]);
  add('ev.tgwin.blackjack', ["Doubled your chips! ~celebrate"]);
  add('ev.win.freecell', ["You solved FreeCell! That's actual skill. ~celebrate", "FreeCell cleared! ~celebrate"]);
  add('ev.win.reversi', ["You beat the computer at Reversi! ~celebrate", "Corners well taken. ~cool"]);
  add('ev.win.adventure', ["Adventure complete! ~celebrate"]);

  /* ================= APP POOLS (+) ================= */
  add('app.notepad.first', ["Notepad: quick, plain, reliable. ~write", "Pro tip: Ctrl+S saves to My Documents. ~idea"]);
  add('app.notepad.again', ["Another note. ~write", "Notes! ~write", "w:Writing things down helps. ~wave"]);
  add('app.wordpad.first', ["WordPad can do bold, italics and colors. Notepad is plain text only. ~idea", "Save as .htm to keep your formatting. ~idea"]);
  add('app.wordpad.again', ["Time to write. ~write", "Words incoming. ~write", "n:Word count visible at the bottom. ~idea"]);
  add('app.paint.first', ["Paint! Use the pencil for details and the fill bucket for big areas. ~idea", "Remember to save your masterpiece. ~write"]);
  add('app.paint.again', ["More art! ~excited", "Blank canvas. ~write", "w:Draw whatever you like. ~wave"]);
  add('app.calculator.again', ["Math time. ~idea", "n:Calculations in progress. ~idea", "Crunching more numbers. ~idle"]);
  add('app.msdos.first', ["C:\\> Welcome to the command line. ~idea", "DOS commands for real files work only inside MYDOCS. ~point", "On a phone? There's an on-screen key bar at the bottom. ~idea"]);
  add('app.msdos.again', ["C:\\> ~idle", "The prompt awaits. ~point", "s:Ah, the command line again. ~cool"]);
  add('app.chat.first', ["Be polite in the chatroom. Don't share personal info. ~point", "Chat is public. Keep it friendly. ~wave"]);
  add('app.chat.again', ["Chatroom time. Say hi. ~wave", "Hello, chatters. ~wave"]);
  add('app.browser.first', ["Internet Explorer! Use the Favorites menu to bookmark pages. ~idea", "Back, Forward and Home work like you'd expect. ~point", "Type words into the address bar to search. ~idea"]);
  add('app.browser.again', ["Surf's up. ~excited", "Browsing time. ~wave", "s:Back on the web. ~cool"]);
  add('app.arcade.again', ["Arcade time. ~flag", "Insert coin. ~excited"]);
  add('app.library.again', ["Pick a game, any game. ~point", "Browsing the library. ~read"]);
  add('app.minesweeper.again', ["Mines again. ~flag", "Flag them all. ~flag"]);
  add('app.solitaire.again', ["Shuffle up. ~flag", "Another game of Solitaire. ~idle"]);
  add('app.filemanager.first', ["File Manager! Shift-click to select a range. ~idea", "You can drag files from your computer into the list. ~point"]);
  add('app.mediaplayer.first', ["Media Player! The built-in tunes are 'Desktop Daydream', 'Dial-Up Disco' and 'Blue Screen Blues'. ~dance"]);
  add('app.achievements.first', ["Some achievements are hidden. Keep exploring. ~search"]);
  add('app.control.first', ["Control Panel! The Customize section has desktop themes. ~point", "You can make the desktop your own here. ~idea"]);
  add('app.control.again', ["Customizing again? ~point"]);
  add('app.monitor.first', ["System Monitor! Charts that go up and down. ~read"]);
  add('app.clock.again', ["What time is it? ~idle"]);
  add('app.weather.again', ["What's the weather like? ~search"]);
  add('app.timer.again', ["Timer's on. ~idle"]);

  /* ================= GAMES (+) ================= */
  add('game.open', ["{game} it is. Good luck! ~flag", "Starting {game}. May the odds be ever in your favor. ~wave", "s:{game}. This should be interesting. ~cool", "w:Enjoy {game}! ~wave", "n:{game} loaded. Fun module online. ~idea", "Launching {game}! ~excited", "Hope you have a good time with {game}. ~wave", "{game}! One of my favorites. I have too many favorites. ~cool"]);
  add('game.again', ["{game} again! Back for more. ~excited", "Round {n} of {game}. ~flag", "s:{game}. For the {n} time. ~cool", "w:Back to {game}. Nice. ~wave"]);
  add('game.classic', ["Arcade classics never go out of style. ~cool", "Short, simple and fun. That's a classic. ~wave", "s:Classic arcade. Pixels, bleeps, and regret. ~cool"]);
  add('game.close', ["Game closed. How'd it go? ~idle", "Nice run. ~wave", "s:And that's the end of that. ~cool", "n:Game session closed. Stats saved. ~idea", "w:Thanks for playing. ~wave"]);
  add('game.crash', ["Hmm. That didn't go as planned. ~shocked", "A game crashed. It's okay. These things happen. ~sad", "s:A crash. I didn't do it. ~cool", "n:Unhandled exception. Classic. ~idea"]);
  add('game.random', ["The dice have spoken: {game}! ~excited", "Let's roll with {game}. ~flag", "s:Random pick: {game}. No complaints. ~cool", "n:RNG chose {game}. ~idea"]);
  add('game.asphalt-rush', ["Asphalt Rush: save your garage with the 💾 button. ~idea", "Tip: nitro is for straights, not corners. ~point", "n:Mind your tire wear. ~idea"]);
  add('game.pixel-ops', ["Pixel Ops: use cover and check your corners. ~point", "Reload before you have to. ~idea"]);
  add('game.ghengis', ["Keep your armies fed. An empty stomach loses wars. ~idea", "Your empire saves to slots. Use 💾. ~point"]);
  add('game.megalith', ["Place stones carefully. Gravity doesn't forgive. ~idea", "MEGALITH progress can be saved to slots. ~point"]);
  add('game.city-striker', ["Mind the pedestrians. And the lampposts. ~shocked", "Parallel parking is just a rumor. ~cool"]);
  add('game.gh-clicker', ["Upgrade early, click often. ~idea", "Your goblin hut is saved to slots too. ~point"]);
  add('game.chronostrike', ["Chronostrike: watch the timer. ~idea"]);
  add('game.fps', ["FPS is multiplayer. Be nice to the other players. ~wave"]);
  add('game.alieninvaders', ["Shoot the bottom row first. Or the top. Both work. ~idea", "Use cover! Oh wait, that's another game. ~cool"]);
  add('game.breakthrough', ["Angle the ball with the edge of the paddle. ~idea", "Clear a column to get behind the wall. ~idea"]);
  add('game.meteors', ["Short taps for thrust. Long taps for chaos. ~idea", "Watch the edges: you wrap around. ~point"]);
  add('game.neonpong', ["Keep your eye on the ball, not the paddle. ~idea"]);
  add('game.pelletmuncher', ["Learn the ghost patterns. ~idea", "Power pellets are for revenge. ~cool"]);
  add('game.snake', ["Don't box yourself in. ~idea", "Plan your turns two steps ahead. ~think"]);

  /* ================= SYSTEM EVENTS (+) ================= */
  add('ev.ach', ["Achievement get: {app}! ~celebrate", "{app} unlocked! ~excited", "New achievement: {app}. ~excited", "s:{app}. Hurray. ~cool", "w:Nice! {app} is yours. ~wave", "n:{app} added to the collection. ~idea"]);
  add('ev.theme', ["Theme changed. Fresh look! ~excited", "New theme. That's a good one. ~cool", "Ooh, {theme}. Not bad. ~cool", "s:{theme}. Interesting choice. ~cool", "w:Nice theme! ~wave", "n:Theme swapped to {theme}. Contrast verified. ~idea"]);
  add('ev.wallpaper', ["New wallpaper. The desktop looks different now. ~excited", "Nice backdrop. ~cool"]);
  add('ev.saver', ["Screen saver preview! Move the mouse to exit. ~idle", "Pipes are best. Don't @ me. ~cool"]);
  add('ev.fav', ["Favorite added. ~excited", "That's a good pick. ~cool", "s:A favorite. Of course it is. ~cool"]);
  add('ev.slot.save', ["Slot saved. ~celebrate", "Progress stored. ~flag", "w:Saved! ~wave"]);
  add('ev.slot.load', ["Slot loaded. Rewind complete. ~idea", "Back in time. ~excited"]);
  add('ev.widget.add', ["Widget added. Drag it anywhere. ~point", "Nice! Widgets update live. ~idea"]);
  add('ev.import', ["File imported into your browser's storage. ~idea", "Got it. Nothing leaves your computer. ~idea"]);
  add('ev.paste', ["Pasted! ~excited"]);
  add('ev.defrag', ["Defrag done. Everything is neatly in order. ~celebrate"]);
  add('ev.minall', ["Desktop cleared. ~idle", "Everything minimized. Nice clean look. ~cool"]);
  add('ev.taskman', ["Task Manager. Need to end something? ~search"]);
  add('ev.find', ["Find is fast. Try typing the name of a game. ~search"]);
  add('ev.run', ["Run dialog! Try typing 'notepad'. ~point"]);
  add('ev.win', ["Victory! ~celebrate", "You won! ~celebrate", "s:A win. Not bad. ~cool", "n:Win condition reached. ~idea"]);
  add('ev.shutdown', ["Shutting down. See you next time. ~wave"]);

  /* ================= TAPEY HIMSELF (+) ================= */
  add('tp.poke', ["Hey! ~shocked", "Yes? ~wave", "That tickles. ~shocked", "I'm sticky, not ticklish. ~confused", "Boop received. ~excited", "Need something? ~idle", "I'm listening. ~wave", "s:Yes? I'm working here. ~cool", "n:Click detected. Adhesion at 100%. ~idea", "w:Hi there! ~wave"]);
  add('tp.poke.angry', ["Enough with the poking! ~angry", "Seriously, stop. ~angry", "That's the sixth time. ~angry", "s:I'm going to start charging per click. ~angry", "n:Poke count: too high. ~angry"]);
  add('tp.drag.start', ["Wheee! ~excited", "Careful! ~shocked", "I'm moving! ~shocked", "Hang on tight! ~excited", "s:Okay, okay, I'm moving. ~cool"]);
  add('tp.drag.drop', ["Nice spot. ~cool", "Thanks! ~excited", "This'll do. ~idle", "Good view from here. ~cool", "s:Fine. This will do. ~cool"]);
  add('tp.dance', ["Let's dance! ~dance", "I've got rhythm. ~dance", "Groove time! ~dance", "s:Don't watch. Okay, watch. ~dance", "w:Dance break! ~dance"]);
  add('tp.wake', ["Oh! Hi. ~shocked", "I'm awake. ~shocked", "*yawn* Back to work. ~idle", "Huh? Nap's over? ~confused", "s:Nap over. Back to ignoring you. ~cool"]);
  add('tp.sleep', ["Zzz... ~sleep", "Time for a nap. ~sleep", "*yawn* ~sleep", "s:Wake me when something happens. ~sleep"]);
  add('tp.hide', ["Okay! Bring me back from the Start menu. ~wave", "Hiding! I'll be in Settings. ~wave", "See you later. ~wave", "s:Fine. ~sad"]);
  add('tp.show', ["Ta-da! ~celebrate", "I'm back! ~excited", "Hello again! ~wave"]);
  add('tp.thanks', ["You're welcome! ~wave", "No problem! ~excited", "Anytime. ~wave", "Happy to help. ~wave", "s:Don't mention it. ~cool"]);
  add('tp.noresults', ["Hmm, nothing found. Try different words. ~confused", "I came up empty. Try 'games', 'files', or 'widgets'. ~think", "No luck. Maybe try the Find box (Ctrl+K)? ~search", "s:Nothing. Try typing real words. ~cool"]);
  add('tp.menu.title', ["What can I do for you?", "Need something?", "Ask away.", "How can I help?", "What's up?", "s:What do you want?", "w:What's on your mind?", "n:Query interface open."]);
  add('tp.menu.placeholder', ["Ask me anything…", "Search or ask a question…", "Try: play snake, 2+2, tell me a joke…", "Try: open notepad, flip a coin, weather…"]);
  add('tp.help', ["Sure! ~excited", "On it! ~wave", "Let's do it. ~flag"]);
  add('tp.nohelp', ["Okay, I'll be here. ~wave", "No worries. ~idle"]);
  add('tp.dontshow', ["Noted. ~wave", "Okay, no more of that. ~idle"]);
  add('tp.test', ["Testing my voice! ~wave", "Check, check. ~wave"]);

  /* ================= EYES (+) ================= */
  add('eyes.first', ["My eyes follow your cursor. You can turn that off in Tapey Settings. ~search", "I'm keeping an eye on your cursor. Both eyes, actually. ~search", "Yes, my eyes follow you. It's a feature. ~cool"]);
  add('eyes.close', ["Personal space, please. Oh wait. ~confused", "Whoa, that's close. I'm going cross-eyed. ~confused", "Staring contest? ~search", "s:You're very close. It's a little weird. ~cool", "n:Distance to cursor: minimal. Cross-eyed mode: engaged. ~idea"]);
  add('eyes.shake', ["Whoa, stop shaking the mouse! ~shocked", "You'll wear out your pointer. ~shocked", "s:Having fun? ~cool", "n:Mouse velocity: extreme. ~idea"]);
  add('eyes.far', ["Following you everywhere. ~search", "I'm tracking the cursor. ~search"]);
  add('eyes.corner', ["Something over there? ~search", "I'm looking where you're looking. ~search"]);

  /* ================= INTENT-REPLY POOLS (what Tapey says to typed input) ================= */
  var Q = {
    'tp.say.laugh': ["Glad you liked it! ~excited", "Ha! I'll take it. ~cool", "I have about 80 more of those. ~excited", "s:Laughing at my jokes? Brave. ~cool", "n:Humor module: success. ~idea", "w:Glad that made you smile. ~wave"],
    'tp.say.ack': ["Cool. ~cool", "Great. ~wave", "Right on. ~excited", "Alright. ~idle", "Sure thing. ~wave"],
    'tp.say.yes': ["Okay! ~excited", "Great, let's do it. ~flag", "Sounds good. ~wave"],
    'tp.say.no': ["Okay, no problem. ~idle", "Fair enough. ~idle", "Got it. ~wave"],
    'tp.say.why': ["Good question. I'm a tape roll, so my answer is 'because it sticks'. ~think", "Why? Because reasons. ~cool", "That's the million-dollar question. ~think", "n:Why: an excellent question. Insufficient data. ~idea"],
    'tp.say.boring': ["Bored? Try the 🎲 Random Game. ~point", "Let's fix that. How about a game, a text adventure, or Paint? ~idea", "s:Bored? Welcome to being a human. ~cool", "n:Boredom detected. Recommended: game. ~idea"],
    'tp.say.sad': ["Sorry you're having a rough time. Maybe a game will help? ~sad", "That's no fun. I'm here if you want a joke or a distraction. ~sad", "s:Hey, it happens. Want a joke? ~cool", "w:Sorry to hear that. I hope things get better soon. ~sad"],
    'tp.say.tired': ["Sounds like you could use some rest. ~idle", "A short break might help. Water, stretch, snack. ~idea", "s:Tired? Close the laptop. Like, close it. ~cool", "w:Take a break when you can. ~idle"],
    'tp.say.happy': ["Great to hear! ~excited", "Glad you're having a good time! ~excited", "Awesome! ~celebrate", "s:Happy? Suspicious. ~cool", "n:Mood: positive. Logging. ~idea"],
    'tp.say.stressed': ["That sounds tough. A few minutes away from the screen might help. ~idle", "Take a breath. The desktop will wait. ~idle", "s:Close some windows. Close your eyes. Reopen later. ~cool", "w:Hope things settle down soon. ~wave"],
    'tp.say.hungry': ["Go get a snack! I'll hold the fort. ~excited", "I've never eaten. Snacks sound great though. ~think", "s:Lunch break. Go. ~cool"],
    'tp.say.gm': ["Good morning! ~wave", "Morning! ~wave", "s:Morning. Coffee first. ~cool"],
    'tp.say.gn': ["Good night! Sleep well. ~sleep", "Night! Shut down properly. ~wave", "s:Good night. Save your games first. ~cool", "n:Sleep mode recommended. ~idea"],
    'tp.say.doing': ["Just hanging around. Literally. ~cool", "Watching your cursor. ~search", "Keeping the desktop company. ~idle", "s:Judging your window arrangement. ~cool", "n:Idling at optimal adhesion. ~idea"],
    'tp.say.real': ["I'm a roll of tape. As real as pixels get. ~cool", "I'm just a little program with big eyes. ~wave", "s:As real as your desktop wallpaper. ~cool", "n:I'm a JavaScript program wearing a tape costume. ~idea"],
    'tp.say.ai': ["I'm a scripted assistant. I don't think, I just have a lot of lines. About 1,700 now. ~idea", "Not an AI. Just a lot of pre-written dialog and a good attitude. ~cool", "n:I'm a rules engine with a tape roll for a face. ~idea"],
    'tp.say.eyes': ["I have two eyes. They follow your cursor. You can turn that off in my settings. ~search", "Yes, I can see your cursor. Not your face. ~search", "s:Yes, I'm watching. Behave. ~cool"],
    'tp.say.age': ["I'm about as old as this desktop. Or maybe a few minutes. Hard to say. ~think", "Age? I'm a roll of tape. Old enough to stick. ~cool", "n:Uptime: {min} minutes. ~idea"],
    'tp.say.where': ["I live in the bottom-right corner. Or wherever you put me. ~point", "In the browser. Right here. ~point", "n:Process: tapey. Location: os-more.js. ~idea"],
    'tp.say.color': ["Gold. Or amber, depending on the light. You can change my color in my settings. ~idea", "Transparent, technically. But gold. ~cool"],
    'tp.say.food': ["I don't eat. If I did, I'd eat cardboard. It's my favorite core. ~think", "Tape doesn't eat. Tape holds. ~cool"],
    'tp.say.music': ["Anything with a good beat. Try Media Player's built-in tunes. ~dance", "I like chiptune. It's on-brand. ~dance"],
    'tp.say.clippy': ["Clippy and I are not related. We just share a job description. ~cool", "I'm not Clippy. I'm taller. And stickier. ~cool", "s:Clippy had a good run. I'm the sequel. ~cool", "n:Office assistants: a proud tradition. ~idea"],
    'tp.say.creator': ["Colton Bennett built this OS. I was added later, with tape. ~idea", "This whole desktop is the work of Colton. I just live here. ~wave"],
    'tp.say.version': ["This is ColtonOS {ver}. ~idea"],
    'tp.say.quiet': ["Okay, I'll be quieter. You can change this in Tapey Settings. ~idle", "Shhh. Got it. ~idle", "s:Finally. Some peace and quiet. ~cool"],
    'tp.say.bigger': ["Bigger! ~excited", "Super-size me. ~excited"],
    'tp.say.smaller': ["Smaller! ~idle", "Mini-Tapey. ~excited"],
    'tp.say.knock': ["Who's there? ~wave"],
    'tp.say.knock.2': ["{x} who? ~think"],
    'tp.say.knock.3': ["Ha! Good one. I'm still thinking about it. ~excited", "Classic. 10/10. ~cool", "That's a great one. ~excited", "s:Knock knock jokes are my least favorite. But that was fine. ~cool"],
    'tp.say.rude': ["That's not very nice. I'm just a roll of tape. ~sad", "Let's keep it friendly. ~idle", "s:Wow. A tape roll can't even defend itself. ~cool", "n:Language filter: engaged. ~idea"],
    'tp.say.dontknow': ["I'm not sure about that one. Try the Find box (Ctrl+K). ~think", "That's beyond my tape. Try searching for an app or a game. ~confused", "Hmm, I don't have an answer for that. Try asking about games, apps, files or settings. ~think", "s:I'm a tape roll, not a search engine. Try the Find box. ~cool", "w:I don't know that one, sorry. Let me know if I can help with anything else! ~wave", "n:Query unrecognized. Try keywords like 'save', 'widgets', or an app name. ~idea"],
    'tp.say.coin.heads': ["Heads! ~excited"],
    'tp.say.coin.tails': ["Tails! ~excited"],
    'tp.say.dice': ["You rolled a {x}. ~excited"],
    'tp.say.number': ["How about {x}? ~idea"],
    'tp.say.calc': ["That's {x}. ~idea", "{x}. Easy. ~cool", "The answer is {x}. ~idea", "n:Result: {x}. ~idea"],
    'tp.say.calcfail': ["I can only do basic arithmetic: + - * / and parentheses. ~think"],
    'tp.say.8ball': ["Yes. ~cool", "No. ~cool", "Definitely. ~excited", "Probably not. ~think", "Ask again later. ~sleep", "It looks promising. ~idea", "I wouldn't count on it. ~sad", "Absolutely. ~celebrate", "Hmm, my sources say no. ~confused", "Without a doubt. ~excited", "The tape says maybe. ~think", "s:I'm a tape roll. Why are you asking me? ~cool"],
    'tp.say.stats': ["You've unlocked {ach} of {total} achievements, tried {n} games, and spent {min} minutes here this session. ~read"],
    'tp.say.time': ["It's {time} on {day}. ~idle", "The time is {time}. ~idle"],
    'tp.say.open': ["Opening {x}. ~point", "On it. {x} coming up. ~excited", "Launching {x}! ~flag", "s:{x}. Fine. ~cool"],
    'tp.say.notfound': ["I couldn't find an app or game called \"{x}\". Try the Find box (Ctrl+K). ~confused", "Nothing named \"{x}\". Try a different name? ~think"],
    'tp.say.settings.tone': ["Switching to {x} mode. ~wave"],
    'tp.say.settings.eyes': ["Eyes {x}. ~search"],
    'tp.say.about': ["About {x}: {y} ~read"]
  };
  Object.keys(Q).forEach(function (k) { add(k, Q[k]); });

  /* ================= INTENTS (typed input → pool). Earlier entries win. ================= */
  var NEWI = [
    { re: "^(knock knock)\\b", pool: "tp.say.knock", state: "knock1" },
    { re: "\\b(lol|lmao|haha+|hehe|rofl|that'?s funny|funny)\\b", pool: "tp.say.laugh" },
    { re: "^(ok|okay|k|cool|nice|great|alright|sure|fine|got it|i see|oh)$", pool: "tp.say.ack" },
    { re: "^(yes|yeah|yep|yup|sure thing|ya)$", pool: "tp.say.yes" },
    { re: "^(no|nope|nah|never)$", pool: "tp.say.no" },
    { re: "^why\\b|\\bwhy\\?$", pool: "tp.say.why" },
    { re: "\\b(bored|boring|nothing to do|i'?m bored)\\b", pool: "tp.say.boring" },
    { re: "\\b(i'?m sad|feel sad|feeling sad|depressed|upset|lonely|down today|bad day|rough day)\\b", pool: "tp.say.sad" },
    { re: "\\b(i'?m tired|so tired|sleepy|exhausted|need sleep)\\b", pool: "tp.say.tired" },
    { re: "\\b(i'?m happy|feel happy|good day|great day|having fun|i'?m good|feeling good)\\b", pool: "tp.say.happy" },
    { re: "\\b(stressed|anxious|overwhelmed|too much|panic)\\b", pool: "tp.say.stressed" },
    { re: "\\b(hungry|starving|i want food|snack)\\b", pool: "tp.say.hungry" },
    { re: "^(good morning|gm|morning)\\b", pool: "tp.say.gm" },
    { re: "^(good night|gn|night night|nighty night|sweet dreams)\\b", pool: "tp.say.gn" },
    { re: "what are you doing|what'?s up|wassup|whatcha doing|what are you up to", pool: "tp.say.doing" },
    { re: "are you (real|alive|sentient|a person|human)", pool: "tp.say.real" },
    { re: "are you (an? )?(ai|bot|robot|chatbot|chatgpt|claude|gpt)|do you use ai", pool: "tp.say.ai" },
    { re: "can you see me|do you see me|are you watching|are you looking|do you have eyes|why are you (staring|looking)|stop (staring|looking|watching|following)", pool: "tp.say.eyes" },
    { re: "how old are you|your age|when were you (born|made|created)", pool: "tp.say.age" },
    { re: "where do you live|where are you from|where are you", pool: "tp.say.where" },
    { re: "(your )?favou?rite colou?r|what colou?r are you", pool: "tp.say.color" },
    { re: "(your )?favou?rite (food|snack)|what do you eat|do you eat", pool: "tp.say.food" },
    { re: "(your )?favou?rite (music|song|band)|do you like music", pool: "tp.say.music" },
    { re: "clippy|clippit|paperclip|office assistant", pool: "tp.say.clippy" },
    { re: "who (made|built|created|coded|wrote|developed) (this|you|it)|who is colton|who'?s colton|who is the (creator|developer)|your (creator|maker|developer)", pool: "tp.say.creator" },
    { re: "what version|which version|what'?s the version|version number", pool: "tp.say.version" },
    { re: "\\b(be quiet|quieter|shush|shh+|stop talking|talk less|less talking|mute)\\b", pool: "tp.say.quiet", act: "quiet" },
    { re: "\\b(talk more|be chattier|chattier|say more|more talking)\\b", pool: "tp.chatty", act: "chatty" },
    { re: "\\b(bigger|larger|grow|make yourself bigger|enlarge)\\b", pool: "tp.say.bigger", act: "bigger" },
    { re: "\\b(smaller|shrink|tiny|make yourself smaller)\\b", pool: "tp.say.smaller", act: "smaller" },
    { re: "\\b(be |go )?sassy\\b", pool: "tp.tone", act: "tone:s" },
    { re: "\\b(be |go )?(friendly|nice|kind)\\b", pool: "tp.tone", act: "tone:w" },
    { re: "\\b(be |go )?nerdy\\b|\\bnerd mode\\b", pool: "tp.tone", act: "tone:n" },
    { re: "\\b(be |go )?classic\\b|\\bnormal mode\\b|\\bregular mode\\b", pool: "tp.tone", act: "tone:c" },
    { re: "(turn|switch) (off|on) (your )?eyes|stop following( my)? (cursor|mouse|pointer)|(eyes|eye tracking) (off|on)", pool: "tp.say.settings.eyes", act: "eyes" },
    { re: "(fuck|shit|damn|bitch|asshole|crap|stfu|wtf)", pool: "tp.say.rude" },
    { re: "^(what time is it|time|what'?s the time|date|what'?s the date|what day is it|today)\\??$", pool: "tp.say.time" },
    { re: "(am i|have i) .*(achievement|progress|stats|played|games)|how many (achievements|games)|my (stats|progress|score)", pool: "tp.say.stats" },
    { re: "^(flip (a )?coin|coin( flip| toss)?|heads or tails)", pool: "tp.say.coin", act: "coin" },
    { re: "^(roll (a )?(die|dice)|dice|roll)\\b", pool: "tp.say.dice", act: "dice" },
    { re: "(random|pick|choose) (a )?number|number between (\\d+) and (\\d+)", pool: "tp.say.number", act: "number" },
    { re: "^(should i|will i|can i|is it|do you think|am i|would it|is there|are there|does|will it).*\\?$", pool: "tp.say.8ball" },
    { re: "^(open|launch|start|run|go to|show me|take me to) .+", pool: "tp.say.open", act: "open" },
    { re: "^(play|let'?s play|i want to play|i wanna play) .+", pool: "tp.say.open", act: "play" },
    { re: "^(what is|what'?s|tell me about|about|info on|describe) (the )?(.+)$", pool: "tp.say.about", act: "about" }
  ];
  D.intents = NEWI.concat(D.intents || []);

  /* ================= MORE HELP TOPICS (searchable) ================= */
  D.help = (D.help || []).concat([
    { k: "snap window edge tile cascade arrange", t: "Right-click the taskbar for Tile and Cascade. Dragging a window to a screen edge also snaps it.", open: "" },
    { k: "maximize minimize restore title bar double click", t: "Double-click a title bar to maximize or restore. The buttons in the corner minimize, maximize and close.", open: "" },
    { k: "taskbar button window switch", t: "Every open window has a button on the taskbar. Click it to bring the window to the front or minimize it.", open: "" },
    { k: "recycle bin delete restore trash", t: "Deleting desktop icons moves them to the Recycle Bin, where you can restore them. Files in My Documents are deleted for good, so be careful.", open: "" },
    { k: "my computer drives system", t: "My Computer shows the drives and system folders. My Documents holds your own files.", open: "folder:computer" },
    { k: "screen saver idle wait timeout", t: "Open Control Panel to choose a screen saver and how long it waits.", open: "app:control" },
    { k: "display resolution crt scanlines effect blur", t: "Control Panel lets you tone down or turn off the CRT effect.", open: "app:control" },
    { k: "reduce motion animation accessibility", t: "There's a reduced motion setting in Control Panel. Tapey also respects your system's setting.", open: "app:control" },
    { k: "font size text larger accessibility zoom", t: "Control Panel has display and font options. Tapey's text size is in Tapey Settings.", open: "app:control" },
    { k: "dark mode theme dark", t: "Try the dark and terminal themes under Control Panel › Customize.", open: "app:control" },
    { k: "clock calendar date tray", t: "Click the clock in the tray to see the calendar.", open: "app:calendar" },
    { k: "notepad notes text txt", t: "Notepad saves plain .txt files to My Documents.", open: "app:notepad" },
    { k: "calculator math calculate", t: "The Calculator handles everyday math. I can also do quick sums: type '12*7' right in my box.", open: "app:calculator" },
    { k: "paint draw brush pencil bitmap", t: "Paint has pencil, brush, fill, shapes and text. Save pictures to My Documents.", open: "app:paint" },
    { k: "game controls keys wasd arrow", t: "Most games use the arrow keys or WASD, and Space or the mouse to act. Check each game's own instructions.", open: "app:library" },
    { k: "game not loading blank black screen stuck", t: "If a game won't load, close it and relaunch. The Task Manager can end a stuck window. A browser refresh fixes most hiccups.", open: "action:taskman" },
    { k: "fullscreen full screen maximize game", t: "Maximize the game window for more room. Some games also have their own fullscreen key, often F.", open: "" },
    { k: "lag slow performance fps fast", t: "If things feel slow, close unused windows, lower the CRT effect, and check System Monitor.", open: "app:monitor" },
    { k: "storage space quota local storage limit browser", t: "Files and saves live in your browser's storage. System Monitor can show you how much you use.", open: "app:monitor" },
    { k: "clear data reset wipe delete everything start over", t: "Your data is in this browser's storage. Clearing site data resets the OS. Export a ZIP from the File Manager first if you want to keep your files.", open: "app:filemanager" },
    { k: "privacy data tracking cookies safe", t: "Your files, saves and settings stay in your browser. The Chatroom and Arcade Hub connect to other services, so don't share personal info there.", open: "" },
    { k: "offline install pwa app", t: "ColtonOS can work offline after the first load. Your browser may offer to install it as an app.", open: "" },
    { k: "mobile phone touch tablet long press", t: "On touch screens, long-press is right-click. The MS-DOS prompt has a key bar for Tab, Esc and arrows.", open: "app:msdos" },
    { k: "keyboard shortcut hotkey ctrl", t: "Ctrl+K: Find. Ctrl+Alt+Delete: Task Manager. F2: Rename. Delete: delete. Win key or Ctrl+Esc: Start. Esc: close menus.", open: "" },
    { k: "game saves lost progress deleted missing", t: "Game progress lives in your browser's storage. Clearing site data removes it. Save slots can be exported to a file for safekeeping.", open: "action:library" },
    { k: "export slot file backup save", t: "In a game's 💾 window, use Export on a slot to download it, and Import to bring it back.", open: "action:library" },
    { k: "chat rules username name nickname", t: "The Chatroom asks for a username. Use something friendly and keep personal info out of it.", open: "app:chat" },
    { k: "report bug issue problem feedback", t: "Found a bug? Check the changelog, then let the developer know through the project's contact info.", open: "" },
    { k: "changelog whats new updates version news", t: "Type TYPE CHANGELOG in the MS-DOS prompt to read the latest changes.", open: "app:msdos" },
    { k: "credits about developer colton author", t: "ColtonOS and the games here were made by Colton Bennett.", open: "" },
    { k: "tapey who what tape roll assistant", t: "I'm Tapey, a roll of tape who lives on your desktop. I do tips, jokes, searches and small chores.", open: "app:tapey" },
    { k: "personality sassy friendly nerdy classic quiet mode tone", t: "You can switch my personality in Tapey Settings or the right-click menu: Classic, Sassy, Friendly, Nerdy or Quiet.", open: "app:tapey" },
    { k: "eyes follow cursor staring turn off", t: "Tapey Settings › Eyes controls how my eyes behave. You can turn off tracking or just make it subtler.", open: "app:tapey" },
    { k: "size bigger smaller position move tapey", t: "Drag me where you want. Size and opacity are in Tapey Settings › Appearance.", open: "app:tapey" },
    { k: "color tape hue blue pink green appearance", t: "Tapey Settings › Appearance has a hue slider. Slide it to make me blue, pink, green or whatever.", open: "app:tapey" },
    { k: "balloon speech bubble style text", t: "Tapey Settings › Speech changes the balloon style, text size and how long balloons stay.", open: "app:tapey" },
    { k: "sound blip voice tapey noise", t: "Tapey Settings › Sounds has optional tiny blips. They're off by default.", open: "app:tapey" },
    { k: "reset restore defaults tapey settings", t: "Tapey Settings has a Restore Defaults button at the bottom.", open: "app:tapey" },
    { k: "sleep wake tapey nap idle", t: "I fall asleep when you're idle. Tapey Settings › General has the timing. Moving the mouse near me wakes me up.", open: "app:tapey" },
    { k: "hide quiet during games gaming focus", t: "By default I stay quiet while a game is focused. You can change that in Tapey Settings › Personality.", open: "app:tapey" },
    { k: "snake classic arcade", t: "Snake is one of the arcade classics. Open the Project Library and look under Classics.", open: "action:library" },
    { k: "racing driving car game", t: "Asphalt Rush and City Striker are the driving games. Both save to slots.", open: "action:library" },
    { k: "shooter fps gun game", t: "Pixel Ops and the FPS beta are the shooters. Pixel Ops saves to slots.", open: "action:library" },
    { k: "strategy empire game conquer", t: "Ghengis Khan Simulator and Megalith are the strategy-ish games.", open: "action:library" },
    { k: "idle clicker incremental game", t: "Goblin Hut Clicker is the incremental game. Its progress saves to slots.", open: "action:library" },
    { k: "puzzle brain game", t: "FreeCell, Solitaire, Minesweeper and Reversi are the puzzle picks. The text games are good too.", open: "app:freecell" }
  ]);

  /* ================= BATCH 3: more context, more variety ================= */
  add('greet.nogames', ["No games played yet. The Project Library is right there. ~point", "Try a game! Snake is a good start. ~flag", "s:Zero games. A tape roll could do better. ~cool", "n:Games played: 0. Opportunity: infinite. ~idea"]);
  add('greet.achiever', ["{ach} achievements so far. Nicely done. ~excited", "You've got {ach} of {total} achievements. ~cool", "s:{ach} achievements. Don't get cocky. ~cool"]);
  add('idle.empty', ["No windows open. Open a game or an app! ~point", "A clean desktop. Fresh start. ~idle", "n:Windows open: 0. Possibilities: many. ~idea"]);
  add('idle.offline', ["No internet connection. Local games still work fine. ~idea", "You're offline. Text games and classics don't need a connection. ~point", "n:Network: offline. Local mode active. ~idea"]);
  add('idle.battery', ["Battery's low. Plug in before the next round. ~sad", "Low battery! Save your game. ~shocked", "n:Battery critical. Persist your state. ~idea"]);
  add('idle.theme', ["Looking good in {theme}. ~cool", "{theme} is a solid choice. ~cool", "n:Current theme: {theme}. ~idea"]);
  add('idle.nogames.idle', ["Still no games played. They're free! ~point", "I could suggest one. Say 'random game'. ~excited", "s:Games: 0. Tape rolls: 1. We're winning. ~cool"]);
  add('game.long', ["{min} minutes of {game}. Stretch time. ~idea", "You've been in {game} for {min} minutes. Take a quick break? ~idle", "n:Session length: {min} min. ~idea", "s:{min} minutes. Impressive. Or concerning. ~cool"]);
  add('game.slots', ["Don't forget the 💾 button to save {game}'s progress. ~point", "You can save {game} to up to 6 slots. Look for 💾 in the title bar. ~idea", "w:Pro tip: save before trying something risky in {game}. ~wave"]);
  add('game.noslots', ["{game} doesn't save progress, so there are no slots for it. ~idle", "Nothing to save in {game}. It's all about the run. ~cool"]);
  add('game.beta', ["{game} is a work in progress. Expect rough edges. ~confused", "Fair warning: {game} is unfinished. ~shocked", "w:{game} is still being built. Be patient with it. ~wave"]);
  add('game.fieldkit_3d_engine', ["Fieldkit is a tech demo for the engine. Look around. ~read"]);
  add('game.legacysim', ["Legacy Racing Sim: old-school driving. ~flag"]);
  add('game.clash', ["Royal Clash: pick your fights. ~flag"]);
  add('game.enginesim', ["Engine Sim: rev it up. ~excited"]);
  add('game.warzone', ["Warzone: keep your head down. ~shocked"]);
  add('game.gangwars', ["Gang Wars: unfinished, so expect surprises. ~confused"]);
  add('game.labyrinthine', ["Labyrinthine: if you're lost, that's the game. ~confused", "Maze tip: follow one wall. ~idea"]);
  add('game.badracingsim', ["Abandoned, but you can still poke around. ~sad"]);
  add('ev.ach.hidden', ["A secret one! Not many find those. ~shocked", "Hidden achievement unlocked. Sneaky. ~cool", "n:Hidden achievement discovered. ~idea"]);
  add('ev.ach.10', ["10 achievements! Double digits. ~celebrate", "w:10 achievements! Nice work. ~wave"]);
  add('ev.ach.20', ["20! You're really getting into this. ~celebrate", "s:20 achievements. You do this a lot, don't you? ~cool"]);
  add('ev.ach.30', ["30 achievements! Almost there. ~celebrate"]);
  add('ev.ach.all', ["100%! You did it. ~celebrate", "Every achievement. That's commitment. ~celebrate"]);
  add('ev.konami', ["↑↑↓↓←→←→BA. A person of culture. ~dance", "Cheat code accepted! ~dance", "n:Konami code detected. Lives: 30. ~idea"]);
  add('ev.setting', ["Setting changed. ~idle"]);
  add('ev.fullscreen', ["Fullscreen! Enjoy the view. ~excited"]);
  add('ev.longidle', ["Still there? ~search", "Hello? ~search", "n:Idle detected. ~idea"]);
  add('tp.menu.title', ["Hi! Need a hand?", "What's the plan?", "Ready when you are.", "Looking for something?", "What can I help you find?", "n:Awaiting input.", "s:Go ahead, I'm all ears. (I don't have ears.)"]);
  add('tp.tone', ["c:Classic mode. Let's go! ~wave", "s:Sassy mode. Buckle up. ~cool", "w:Friendly mode. Good vibes only. ~wave", "n:Nerdy mode. Prepare for facts. ~idea"]);
  add('tp.size', ["Resized! ~excited", "How's this size? ~cool", "A new me. ~excited"]);
  add('tp.eyes.on', ["Eyes on. I'll follow your cursor. ~search", "Tracking enabled. ~search"]);
  add('tp.eyes.off', ["Tracking off. Eyes forward. ~idle", "Okay, no more cursor-following. ~idle"]);
  add('tp.reset', ["Defaults restored. ~wave", "Back to factory settings. ~excited"]);
  add('tp.quiet', ["Quiet mode. I'll only speak up when it counts. ~idle", "Okay. Shhh. ~idle"]);
  add('tp.chatty', ["More talking, got it. ~excited", "I'll chat more. ~wave"]);
  add('tp.options', ["Settings time. ~wave", "Make me your own. ~excited"]);
  add('tp.say.hello', ["Hey there! ~wave", "Hi! How can I help? ~wave", "Hello! ~wave", "Hey! ~excited", "s:Hi. What do you need? ~cool", "w:Hello! Good to chat. ~wave", "n:Greetings. ~idea"]);
  add('tp.say.how', ["Doing good. Stuck, but good. ~cool", "All good! You? ~wave", "Can't complain. Got a nice view. ~idle", "s:Fine. Stuck on a desktop. The usual. ~cool"]);
  add('tp.say.who', ["I'm Tapey, a roll of tape with eyes and a lot of opinions. ~wave", "Tapey, your desktop assistant. Tape included. ~wave"]);
  add('tp.say.what', ["I can search, tell jokes, give tips, do quick math, flip coins, open apps, and chat. Try 'open notepad' or '12*7'. ~idea", "Ask me to open an app, play a game, flip a coin, or tell a joke. ~point"]);
  add('tp.say.help', ["Try: 'open paint', 'play snake', 'tell me a joke', '15*3', 'flip a coin', 'save slots', or 'widgets'. ~point"]);
  add('tp.say.bye', ["See you later! ~wave", "Bye! ~wave", "Take it easy. ~wave", "n:Session end detected. ~idea"]);
  add('tp.say.sorry', ["No problem. ~wave", "It's fine. ~idle", "All good. ~wave"]);
  add('tp.say.insult', ["Ouch. ~sad", "That's a bit harsh. ~sad", "I'm just doing my job. Which is sticking around. ~cool"]);
  add('tp.say.meaning', ["42. ~cool", "Probably snacks. And tape. ~think"]);
  add('tp.say.name', ["I'm Tapey. ~wave", "Tapey. You can call me that. ~wave"]);
  add('tp.say.sing', ["♪ Stick together, stick together ♪ ~dance", "♪ Roll, roll, roll your tape... ♪ ~dance", "♪ La la la... I only know the chorus. ♪ ~dance"]);
  add('tp.say.fav', ["I like Snake. I relate to the long, winding shape. ~cool", "My favorite game changes by the minute. Right now, Reversi. ~think"]);
  add('tp.say.joke', ["Okay, one joke coming up. ~excited"]);
  add('tp.say.tip', ["A tip? Sure. ~idea"]);
  add('tp.say.love', ["Thanks, that's nice to hear. ~excited", "Thanks! Glad you're enjoying this. ~wave"]);
  add('tp.thanks', ["Glad I could help. ~wave", "Sure thing. ~excited", "Anytime. ~wave"]);
  add('tp.dontshow', ["Okay, I'll skip that one next time. ~wave"]);
  add('tp.results', ["Here's what I've got:", "How about these?", "These might help:", "Found some matches:", "s:Okay, here you go.", "n:Search results:"]);
  add('tp.dance', ["Showtime! ~dance", "Cutting a rug. ~dance"]);
  add('tp.wake', ["Oh, hey. ~wave", "What did I miss? ~confused", "I was just resting my eyes. ~shocked"]);
  add('tp.sleep', ["Nap time. ~sleep", "Zzz. ~sleep", "Five minutes. ~sleep"]);
  add('app.explorer.first', ["Right-click inside a folder to create files and folders. ~idea", "You can copy and paste between folders. ~idea"]);
  add('app.explorer.again', ["More folders! ~idle", "Browsing. ~read"]);
  add('app.textgames.first', ["Text Games! Click one on the left to start. ~read", "Type your commands in the box at the bottom. ~point"]);
  add('app.textgames.again', ["Back to words. ~read", "Text adventures: no graphics, all imagination. ~idea"]);
  add('app.defrag.first', ["Press Start and watch. ~idea", "Pure vibes. ~cool"]);
  add('app.reversi.first', ["Reversi: take corners, avoid giving them away. ~idea", "Three difficulties: Easy, Normal and Hard. ~point"]);
  add('app.freecell.first', ["FreeCell: use the free cells sparingly. ~idea", "Almost every deal can be solved. ~wave"]);
  add('app.soundrec.first', ["Click Record, speak, then Stop. Save it to My Documents. ~point"]);
  add('app.calendar.first', ["Pick a day, type a note. ~write", "Holidays appear in the corner. ~idea"]);
  add('app.charmap.first', ["Pick a group, click a symbol, double-click to add it to the copy box. ~idea"]);
  add('app.phonedialer.first', ["Dial any number. 5551234 is special. ~idea", "Press the keys for real DTMF tones. ~point"]);
  add('app.filemanager.again', ["Organizing files. ~write", "Copy, cut, paste. ~idle"]);
  add('app.wordpad.first', ["Press Ctrl+S to save. ~write"]);
  add('app.mediaplayer.again', ["Turn up the volume. ~dance"]);
  add('app.achievements.again', ["Checking the trophies. ~read"]);
  add('app.monitor.again', ["System status. ~read"]);
  add('ctx.fridayafternoon', ["Friday afternoon. You made it. ~celebrate", "n:Friday PM: productivity trending down. Fun trending up. ~idea"]);
  add('ctx.sundaynight', ["Sunday night. Enjoy the last bit of weekend. ~idle", "s:Sunday night. The Monday dread begins. ~cool"]);
  add('ctx.sessions.many', ["You've been here {visits} times. Welcome home. ~wave"]);
  add('ctx.streak', ["Welcome back! That's a few days in a row. ~excited", "A streak! Keep it going. ~excited", "n:Visit streak detected. ~idea"]);
  add('ctx.idle.return', ["Oh, there you are. ~wave", "Still here? Good. ~wave"]);
  add('ev.slot.empty', ["There's nothing to save yet. Play a little first. ~think", "No saved data found. Some games only save after a milestone. ~think"]);
  add('ev.import', ["File added to your browser's storage. ~idea", "Imported! You can find it in My Documents. ~point"]);
  add('ev.theme', ["Theme changed. It suits the desktop. ~cool"]);
  add('ev.random', ["Rolling the dice... ~excited"]);
  add('ev.taskman', ["Opening the Task Manager. ~search"]);
  add('ev.minall', ["All windows minimized. ~idle"]);
  add('ev.run', ["Run dialog: type the name of an app. ~point"]);
  add('ev.saver', ["Screen saver time. Move the mouse to wake it up. ~idle"]);
  add('ev.dos.cmd', ["Nice command. ~cool", "DOS ready. ~idea"]);
  add('ev.dos.help', ["HELP lists the commands. ~read"]);
  add('ev.dos.type', ["TYPE shows the contents of a text file. ~read"]);
  add('ev.dos.echo', ["Echo! Echo! Echo! ~excited"]);
  add('ev.dos.date', ["Today's date. ~idle"]);
  add('ev.dos.time', ["The time. ~idle"]);
  add('ev.dos.vol', ["That's the volume label. ~idle"]);
  add('ev.dos.ren', ["Renamed! ~idea"]);
  add('ev.dos.move', ["Moved. ~idea"]);
  add('ev.dos.rd', ["Directory removed. ~idea"]);
  add('ev.dos.run', ["Launching from DOS! ~flag"]);
  add('ev.dos.win', ["Returning to the desktop. ~wave"]);
  add('ev.dos.exit', ["Exiting. ~wave"]);
  add('ev.dos.cdrom', ["No disc in D:. ~sad"]);

  /* more typed-input coverage */
  D.intents = [
    { re: "^(thanks|thank you|thx|ty|cheers|appreciate it)\\b", pool: "tp.thanks" },
    { re: "^(hello|hi|hey|yo|sup|howdy|greetings|hiya|ahoy|heya)\\b", pool: "tp.say.hello" },
    { re: "^(what'?s your name|your name|name\\?)", pool: "tp.say.name" },
    { re: "(do you|can you) (sleep|dream)", pool: "tp.say.real" },
    { re: "(tell me|say) (something|anything)( funny| interesting)?", pool: "tp.say.what" },
    { re: "^(joke|another joke|one more joke|more jokes)$", pool: "tp.say.joke" },
    { re: "^(another|one more|more|again)$", pool: "tp.say.ack" },
    { re: "^(sorry|oops|my bad)\\b", pool: "tp.say.sorry" }
  ].concat(D.intents);
})();
