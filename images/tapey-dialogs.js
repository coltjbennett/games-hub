/* tapey-dialogs.js — everything Tapey can say.
 *
 * ENTRY SYNTAX (all strings):   "[tone:]text [~pose]"
 *   tone   optional prefix:  c = Classic   s = Sassy   w = Wholesome   n = Nerdy
 *          no prefix = every personality may use it.  (Quiet only uses short lines or "q:" lines.)
 *   ~pose  optional suffix:  idle wave think idea point excited celebrate sleep confused sad
 *          shocked search write read love angry cool dance flag
 *   {tokens} are filled in by the shell:
 *          {game} {app} {n} {total} {ach} {min} {visits} {part} {time} {day} {files} {wins} {theme}
 *
 * POOL NAMES are what the shell looks up:
 *   greet.*   idle.*   app.<id>.first / app.<id>.again   game.*   ev.<event>   tp.*   eyes.*
 * Add lines freely: the shell never needs changing to use more of them.
 */
window.TAPEY_DIALOGS = {
  version: 1,
  tones: {
    c: { name: 'Classic', desc: 'Cheerful, eager, slightly too helpful.' },
    s: { name: 'Sassy', desc: 'Dry, teasing and a little smug.' },
    w: { name: 'Friendly', desc: 'Upbeat, encouraging and easygoing.' },
    n: { name: 'Nerdy', desc: 'Trivia, puns and tape science.' },
    q: { name: 'Quiet', desc: 'Short and rare. Only speaks when it matters.' }
  },
  pools: {

  /* ============================== GREETINGS ============================== */
  'greet.first': [
    "Hi there! I'm Tapey, your new desktop assistant. I'm a roll of tape. I'm very good at sticking around. ~wave",
    "c:Hello! It looks like you're starting up a computer. Would you like help with that? ~wave",
    "s:Oh good, a new user. Don't worry, I only judge a little. ~cool",
    "w:Welcome! Make yourself at home and have a look around. ~excited",
    "n:Greetings! I'm Tapey: 100% adhesive, 0% pressure. Click me any time to search or ask for help. ~wave",
    "Click the Start button to explore. Click me if you ever want help. Right-click me for options! ~point"
  ],
  'greet.morning': [
    "Good morning! Fresh day, fresh roll. ~wave",
    "Morning! Have you had coffee? I've had zero because I'm tape. ~idle",
    "s:Morning. I'd say 'rise and shine' but you look more 'rise and loading'. ~cool",
    "w:Good morning! Hope your day goes well. ~excited",
    "n:Fun fact: most people click 'snooze' more than they click 'Start'. Good morning! ~idea",
    "Early bird, huh? Let's get this day stuck together! ~excited",
    "The morning is a great time for a quick game. Just saying. ~flag"
  ],
  'greet.afternoon': [
    "Good afternoon! Perfect time for a break. ~wave",
    "Afternoon! Anything I can help you unstick? ~idle",
    "s:Afternoon already? Time flies when you're avoiding your to-do list. ~cool",
    "w:Hope your afternoon is going well. You're doing great. ~excited",
    "n:It's {time}. Statistically, this is peak 'one more game' hour. ~idea",
    "Lunch break? I'll watch the desktop for you. ~flag",
    "Afternoon slump? A quick round of something might help. ~point"
  ],
  'greet.evening': [
    "Good evening! Time to unwind. ~wave",
    "Evening! The best hours for a good game. ~excited",
    "s:Evening. Settling in for some 'productivity'? Sure. ~cool",
    "w:Good evening! You've earned a little fun today. ~excited",
    "n:Evening protocol engaged: lower lights, higher scores. ~idea",
    "Cozy desktop weather tonight. ~idle",
    "Welcome back. Dinner's on you; I'm a tape roll and have no stomach. ~wave"
  ],
  'greet.night': [
    "Up late? I'm a night owl too. Mostly because I have no eyelids. ~wave",
    "It's {time}. Maybe one more game, then sleep? ~idle",
    "s:It's {time}. Whatever you're doing, it can probably wait until tomorrow. Probably. ~cool",
    "w:It's getting late. Might be a good time to wrap up and get some sleep. ~excited",
    "n:After midnight the average high score goes up and the average bedtime goes down. ~idea",
    "Shh. The computer is sleeping. We have to be very quiet. ~sleep",
    "Late night desktop club: members, you and me. ~flag"
  ],
  'greet.back': [
    "Welcome back! I was just napping. Totally not slacking. ~excited",
    "You're back! Visit number {visits}! ~wave",
    "s:Oh, you again. (Kidding. Good to see you.) ~cool",
    "w:Hey, good to see you again! ~excited",
    "n:Return visit logged. Your stickiness score has increased. ~idea",
    "Nice to see you again. Shall we pick up where we left off? ~point",
    "Look who's back! Let's see what's new. ~wave"
  ],
  'greet.regular': [
    "Visit number {visits}! You're basically a regular at this point. ~excited",
    "s:{visits} visits. At this point you should be paying rent. ~cool",
    "w:{visits} visits! Thanks for dropping by so often. ~excited",
    "n:{visits} visits detected. Your loyalty is stronger than packing tape. ~idea",
    "Officially a regular. Nicely stuck. ~excited"
  ],
  'greet.achiever': [
    "You've unlocked {ach} of {total} achievements. Impressive! ~celebrate",
    "s:{ach} achievements. Fine. You can have a gold star. ~cool",
    "w:{ach} achievements! Nice going! ~excited",
    "n:Achievement completion: {ach}/{total}. The rest are out there. Waiting. ~idea"
  ],
  'greet.nogames': [
    "Psst. You haven't played any games yet. Try one from the Project Library! ~point",
    "s:There are games on this site. Just thought you should know. ~cool",
    "w:There are some fun games here whenever you feel like playing! ~excited",
    "n:Games played so far: 0. A suspiciously clean record. ~idea"
  ],

  /* ============================== IDLE: TIPS ============================== */
  'idle.tip': [
    "Press Ctrl+K (or the Find item in the Start menu) to search every game and app. ~idea",
    "Right-click the desktop and open Widgets to add a clock, calendar, sticky notes and more. ~idea",
    "Every local game has a 💾 button in its title bar for 6 save slots. ~idea",
    "The Project Library has a 🎲 Random Game button for when you can't decide. ~idea",
    "You can drag files from your own computer onto the File Manager to add them to My Documents. ~idea",
    "Open the MS-DOS Prompt and type GAMES to see the text games. ~idea",
    "Press Ctrl+Alt+Delete to open the Task Manager if a game ever freezes. ~idea",
    "Control Panel has one-click desktop themes. Try Amber Terminal. ~idea",
    "Double-click a window's title bar to maximize it. Double-click again to restore. ~idea",
    "Press F2 to rename a selected desktop icon. ~idea",
    "Always use Shut Down from the Start menu. Otherwise ScanDisk will want a word with you. ~idea",
    "Click a day in Calendar to jot a note. A red dot marks days with notes. ~idea",
    "Record something with Sound Recorder, then listen to it in Media Player. ~idea",
    "Your achievements live in Start › Programs › Accessories › Achievements. ~idea",
    "Hold Shift or Ctrl while clicking in File Manager to select several files at once. ~idea",
    "In the MS-DOS Prompt, press Tab to auto-complete commands and file names. ~idea",
    "You can export all of My Documents as a ZIP from the File Manager. ~idea",
    "Your Sticky Note widget saves automatically. No Ctrl+S needed. ~idea",
    "You can move me! Drag me anywhere. I'll remember where you put me. ~idea",
    "Right-click me for options, or open Tapey Settings to change almost everything about me. ~idea",
    "Minesweeper tip: right-click (or long-press) to flag a mine. ~idea",
    "FreeCell tip: double-click a card to send it to a foundation. ~idea",
    "Reversi tip: corners are the strongest squares. Take them and never let go. ~idea",
    "Paint pictures saved to My Documents show up in the File Manager. ~idea",
    "The Weather applet is handy before you pretend you'll go outside. ~idea",
    "Use the Timer applet when you tell yourself it's 'just one more round'. ~idea",
    "Windows can be tiled: right-click the taskbar for Tile and Cascade. ~idea",
    "The Web Browser's Home button takes you to the ColtonNet start page. ~idea",
    "The Start menu has a Run box. Try typing the name of any app. ~idea",
    "Arrow keys move between desktop icons. Enter opens one. ~idea",
    "If the screen looks too blurry, Control Panel lets you tone the CRT effect down. ~idea",
    "Prefer less motion? Control Panel has a reduced motion setting. ~idea",
    "Missing the old days? The screen savers are still there. Try Pipes. ~idea",
    "s:Pro tip: closing a window is faster than staring at it. ~cool",
    "s:Pro tip: if you lose a window, it's probably behind another window. Shocking, I know. ~cool",
    "w:Remember: it's okay to take breaks. The games will still be here. ~excited",
    "n:Tip: Tab and Shift+Tab move focus through menus, buttons and dialogs. Accessibility is sticky too. ~idea"
  ],
  'idle.tip.intro': [
    "Tip of the moment:", "Did you know?", "Here's a handy hint:", "Psst, quick tip:", "Hey, try this:",
    "s:Unsolicited advice incoming:", "w:Something that might help:", "n:Useful fact #{n}:"
  ],

  /* ============================== IDLE: JOKES ============================== */
  'idle.joke': [
    "Why did the tape roll get promoted? It always stuck to the plan. ~excited",
    "I told a joke about adhesive. It didn't go over well. It never stuck the landing. ~cool",
    "What do you call a tape roll that can sing? A-dhesive-ing. ~idea",
    "Why was the tape roll good at poker? It knew how to hold things together. ~cool",
    "I'm not saying I'm clingy, but I did come with a built-in dispenser. ~idle",
    "What did the tape say to the broken vase? 'I've got you.' ~excited",
    "Why don't tape rolls ever lie? They always come clean at the end of the roll. ~idea",
    "My therapist says I have 'attachment issues'. I told her that's literally my job. ~cool",
    "What's a tape roll's favorite kind of music? Anything with a good hook, and a strong bond. ~dance",
    "Why did the computer go to therapy? Too many unresolved windows. ~confused",
    "Why did the programmer quit his job? He didn't get arrays. ~cool",
    "There are 10 kinds of people: those who understand binary and those who don't. ~idea",
    "Why do Java developers wear glasses? Because they don't C#. ~cool",
    "A SQL query walks into a bar, walks up to two tables, and asks: 'Can I join you?' ~excited",
    "What's a computer's favorite snack? Microchips. ~idle",
    "Why was the computer cold? It left its Windows open. ~cool",
    "Why did the keyboard go to school? To improve its typing. ~idea",
    "How do you comfort a JavaScript bug? You console it. ~excited",
    "What did the floppy disk say to the CD? 'You look so well-rounded.' ~cool",
    "My favorite game is hide and seek. I'm very good at it. I'm usually under a pile of paper. ~excited",
    "Why did the scarecrow win an award? Outstanding in his field. I just wanted to include a classic. ~idle",
    "I've been working on a new book: 'How to Stick With It'. It's a real page-turner. ~excited",
    "What do you call two rolls of tape arguing? A sticky situation. ~confused",
    "Parallel lines have so much in common. It's a shame they'll never stick together. ~sad",
    "I used to be addicted to the Hokey Pokey, but then I turned myself around. ~dance",
    "s:I'd tell you a joke about UDP, but you might not get it. ~cool",
    "s:I'd tell you a tape joke, but you'd just say it's a stretch. ~cool",
    "w:Why did the tape roll bring a friend? Because everything's better stuck together. ~excited",
    "w:What do you call two rolls of tape that get along? Well-bonded. ~excited",
    "n:What do you call tape with trust issues? Self-adhesive. ~idea",
    "n:Why did the tape cross the road? To get to the other slide. (Slide. Stick. Whatever.) ~idea",
    "n:Why did the engineer bring tape to the party? In case things fell apart. ~idea"
  ],
  'idle.joke.intro': [
    "Joke time!", "Here's one:", "Ready for a bad joke?", "Okay, okay, one joke:",
    "s:Fine, here's a joke. Try to contain yourself.", "w:Here's something to make you smile:", "n:Humor module loading...", "I've been saving this one:"
  ],

  /* ============================== IDLE: FACTS ============================== */
  'idle.fact': [
    "Fun fact: transparent tape got its start in 1930. People were mending everything with it, including books and cracked windows. ~read",
    "Fun fact: some pressure-sensitive tapes work because of tiny sticky molecular forces, no wet glue required. ~read",
    "Fun fact: a roll of tape has a core, usually cardboard or plastic. That's my hole. I'm very comfortable with it. ~idle",
    "Fun fact: peeling some tapes in a vacuum can produce tiny flashes of light. Yes, really. I'm basically a lantern. ~idea",
    "Fun fact: the first computer bug was a moth stuck in a relay in 1947. They taped it into the logbook. ~read",
    "Fun fact: the very first computer mouse was made of wood. Ouch for splinters. ~read",
    "Fun fact: the floppy disk icon for 'Save' is now older than some of the people clicking it. ~read",
    "Fun fact: Windows 95 sold over a million copies in its first four days. ~read",
    "Fun fact: Minesweeper and Solitaire were put in Windows to teach people to use a mouse. ~read",
    "Fun fact: Solitaire taught millions how to drag and drop. Sneaky, sneaky. ~read",
    "Fun fact: dial-up modems screeched because the two modems were negotiating how fast they could talk. ~read",
    "Fun fact: the QWERTY keyboard layout may have been designed to stop typewriter keys jamming. ~read",
    "Fun fact: the first 1 GB hard drive weighed about 550 pounds. ~read",
    "Fun fact: the '@' symbol was picked for email in 1971. ~read",
    "Fun fact: the first website is still online. ~read",
    "Fun fact: CRT monitors can be seen flickering on camera because of how they redraw the screen. ~read",
    "Fun fact: the Snake game has been around since the late 1970s. ~read",
    "Fun fact: Pong was one of the first commercially successful video games. ~read",
    "Fun fact: Space Invaders caused such a craze in Japan that people said coins ran short. That's an exaggeration, but it's a fun one. ~read",
    "Fun fact: Pac-Man was inspired by a pizza with a slice missing. Pellet Muncher is a distant cousin. ~read",
    "Fun fact: the Konami code first showed up in a 1986 game. ~read",
    "Fun fact: 'bit' is short for 'binary digit'. ~read",
    "Fun fact: a byte is 8 bits. A nibble is 4. Computer scientists are secretly hungry. ~read",
    "Fun fact: the 'Recycle Bin' is called the 'Trash' on some computers. Both are very forgiving. ~read",
    "Fun fact: the first computer virus on a PC spread via floppy disks. ~read",
    "Fun fact: 'Wi-Fi' doesn't stand for anything. It's just a catchy name. ~read",
    "Fun fact: the average person blinks about 15 times a minute. I don't blink. I just stare. And occasionally cheat with a blink pose. ~cool",
    "s:Fun fact: you've been here {min} minutes. Fun? Debatable. ~cool",
    "n:Fun fact: adhesive tape is 'pressure sensitive'. So am I. Please don't poke me too much. ~idea",
    "n:Fun fact: the tape on my roll is spooled around itself in many layers, so every layer is a snack for static electricity. ~read",
    "w:Fun fact: smiling at your computer won't make it faster, but it will make you feel better. ~excited"
  ],

  /* ============================== IDLE: SMALL TALK ============================== */
  'idle.chat': [
    "I wonder what's in the Recycle Bin. ~think",
    "Just hanging around. Literally. I'm taped to your screen. ~idle",
    "I like it here. The desktop is cozy. ~idle",
    "Do you ever wonder what the other windows are talking about when you're not looking? ~think",
    "Sometimes I imagine being a dispenser. Then I remember I like being free. ~think",
    "Having a good session? I'm having a good session. ~idle",
    "I'll just be here. Looking helpful. ~point",
    "Is it just me, or is the pointer extra shiny today? ~search",
    "I'm keeping an eye on things. Two, actually. ~cool",
    "If you need anything, I'm right here. I'm not going anywhere. I'm stuck. ~idle",
    "I rehearsed a speech for later. It's mostly puns. ~write",
    "I counted the pixels in my body. I lost count. It's a lot. ~think",
    "Sometimes I think about unrolling. Then I realize I'm not that kind of tape. ~think",
    "Did you know I can see your cursor? I'm not creepy about it. I'm just very attentive. ~search",
    "s:I'm not bored. I'm just... observing. Intensely. ~cool",
    "s:You can ignore me. I'm used to it. (No, really, go ahead. I'll just be here, sighing in tape.) ~sad",
    "s:I don't know what you're working on, but it looks important. Or it's solitaire. ~cool",
    "w:How's it going? Anything I can help with? ~excited",
    "w:Feel free to ask me anything, or just carry on. No pressure. ~excited",
    "n:Current CPU temperature: unknowable. Current mood: adhesive. ~idea",
    "n:Thinking about entropy and how a roll of tape is just ordered stickiness. ~think"
  ],
  'idle.compliment': [
    "You have excellent taste in desktop themes. ~excited",
    "Your window arrangement is... okay. I'm kidding. It's great. ~cool",
    "You're doing a great job. Whatever you're doing. ~excited",
    "Nice work. I mean it. ~excited",
    "You're very good at this computer thing. ~excited",
    "Your clicking technique is flawless. ~cool",
    "s:You're doing fine. I've seen worse. I've also seen better. But mostly worse. ~cool",
    "w:Nice job today. Keep it up. ~excited",
    "n:Your productivity is statistically above average for someone with {wins} windows open. ~idea"
  ],
  'idle.nudge': [
    "Haven't tried {game} yet? It's pretty fun. ~point",
    "Feeling adventurous? Try a text game: open MS-DOS and type GAMES. ~point",
    "There's an Arcade Hub with web games from around the internet. Worth a look. ~point",
    "Have you tried the Achievements app? There are hidden ones. ~search",
    "Why not add a widget? Right-click the desktop. ~point",
    "Try FreeCell. It's relaxing until it's not. ~point",
    "Have you recorded your voice in Sound Recorder yet? Try it. ~point",
    "You can paint something and save it to My Documents. ~write",
    "Click the Start button and look under Accessories. There's a lot in there. ~point",
    "The Calendar applet remembers notes. Great for reminders. ~write",
    "Want to look cool? Try the Amber Terminal theme. ~cool",
    "You know you can check the weather without leaving the desktop? ~point",
    "Try changing the screen saver. Mystify is hypnotic. ~idea",
    "Bored? Hit the 🎲 button in the Project Library for a random game. ~excited",
    "s:Bored? Try doing something. I believe in you. Slightly. ~cool",
    "w:If you want something relaxing, Solitaire or FreeCell might help. ~excited",
    "n:Hint: the Character Map has more symbols than you'll ever use. Try it. ~idea"
  ],
  'idle.late': [
    "It's {time}. Maybe time for a stretch break? ~excited",
    "s:It's {time}. Sleep is free. You should try it. ~cool",
    "w:It's very late. Whatever it is, it'll still be there tomorrow. ~excited",
    "n:It is {time}. Sleep is a critical OS update. ~idea",
    "Maybe save your game and call it a night? ~idle"
  ],
  'idle.long': [
    "You've been here for {min} minutes. Time for a stretch! ~excited",
    "{min} minutes! Maybe drink some water? ~idea",
    "s:{min} minutes. Should I get you a chair? ~cool",
    "w:You've been at it for {min} minutes. Please rest your eyes for a moment. ~excited",
    "n:20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds. ~idea",
    "Gentle reminder: hydrate! ~idle"
  ],
  'idle.windows': [
    "That's a lot of windows. Impressive juggling! ~shocked",
    "{wins} windows open! Do you need some help tidying up? Right-click the taskbar for Tile and Cascade. ~idea",
    "s:{wins} windows. Are you collecting them? ~cool",
    "w:Lots going on! Take it one window at a time. ~excited",
    "n:{wins} windows open. Your RAM is whispering. ~idea"
  ],
  'idle.empty': [
    "Nice and tidy. Not a window in sight. ~idle",
    "The desktop is so clean. It's almost suspicious. ~search",
    "s:No windows open. Bold strategy. ~cool"
  ],
  'idle.offline': [
    "Looks like you're offline. Local games still work. ~think",
    "The internet wandered off. The local games are still here, though. ~idle",
    "s:You're offline. Back to the 90s, then. ~cool"
  ],
  'idle.battery': [
    "Your battery looks low. Maybe plug in? ~sad",
    "s:Low battery. The dramatic music begins now. ~cool",
    "w:Your battery is low. Take care of your device, too. ~excited"
  ],
  'idle.nogames.idle': [
    "You haven't played any games yet. They're really good. Try one. ~point"
  ],
  'idle.theme': [
    "I see you're using {theme}. Good choice. ~cool",
    "{theme} looks good on this desktop. ~excited",
    "s:{theme}. Bold. I respect it. ~cool"
  ],

  /* ============================== APPS ============================== */
  'app.notepad.first': [
    "It looks like you're taking notes. Would you like help? ~write",
    "Notepad! The humble hero of text. Remember to save to My Documents. ~write",
    "s:Notepad. Where ideas go to be forgotten. ~cool",
    "w:Writing things down is a great habit. ~excited",
    "n:Notepad: no formatting, no fuss, no fonts. A tape roll's dream. ~idea"
  ],
  'app.notepad.again': ["Back to the notes! ~write", "Notepad again. Good. ~idle", "s:Another note-to-self? ~cool"],
  'app.wordpad.first': [
    "It looks like you're writing a letter. Would you like help? ~write",
    "WordPad! Bold, italic, underline: the holy trinity. ~write",
    "Tip: Ctrl+S saves your document to My Documents. ~idea",
    "s:A letter? In this economy? ~cool",
    "w:Hope the letter goes well. ~excited",
    "n:WordPad saves as .htm so your formatting travels with you. ~idea"
  ],
  'app.wordpad.again': ["Writing again! ~write", "Dear diary... ~write", "s:Back to the manuscript? ~cool"],
  'app.paint.first': [
    "Ooh, art time! Remember: there are no mistakes, only happy little accidents. ~excited",
    "You can save your masterpiece to My Documents. It shows up in File Manager too. ~idea",
    "s:Don't draw me. I'll know. ~cool",
    "w:Have fun making something. ~excited",
    "n:Paint: because a pixel is worth a thousand words. ~idea"
  ],
  'app.paint.again': ["More art! ~excited", "The canvas awaits. ~point", "s:Another masterpiece, I assume? ~cool"],
  'app.calculator.first': [
    "Crunching numbers? I can hold the paper tape. Get it? Tape? ~excited",
    "It looks like you're doing math. Would you like help? (No. I'm a tape roll.) ~idle",
    "s:I could tell you what 6 times 7 is, but where's the fun in that? ~cool",
    "n:Fun fact: the first electronic calculators weighed more than a toaster. ~read"
  ],
  'app.calculator.again': ["Math time! ~idea", "Counting again? ~idle"],
  'app.msdos.first': [
    "It looks like you're using MS-DOS. Type GAMES for text games, or HELP for commands. ~point",
    "A classic! Try MD, COPY, EDIT or TAPEY. ~idea",
    "s:Ah, the command line. For people who like being right the hard way. ~cool",
    "w:Don't worry, you can't break anything. Everything here is safe. ~excited",
    "n:C:\\> is a state of mind. ~idea"
  ],
  'app.msdos.again': ["Back to the prompt. ~idle", "C:\\> ready. ~point", "s:Ah, the black screen of power. ~cool"],
  'app.chat.first': [
    "The Chatroom! Say hi to people. Be nice. ~wave",
    "Remember: everyone in the chatroom is a real person. Don't share personal details. ~point",
    "s:Careful: the internet is just people. Mostly. ~cool",
    "w:Chatting with people is fun. Keep it friendly. ~excited"
  ],
  'app.chat.again': ["Chatting again? Be nice! ~wave", "Say hi for me. ~wave", "s:Social butterfly. ~cool"],
  'app.browser.first': [
    "Internet Explorer! The Home button takes you to the ColtonNet start page. ~point",
    "It looks like you're trying to browse the web. Some sites don't like proxies, so don't be surprised. ~idea",
    "Dial-up connected! (Click the connecting box to skip.) ~excited",
    "s:Web browsing. What could possibly go wrong? ~cool",
    "w:Enjoy your trip across the Information Superhighway! ~wave",
    "n:Tip: pages load through a proxy, so some sites won't work. That's normal. ~idea"
  ],
  'app.browser.again': ["Surfing again! ~excited", "Back online. ~wave", "s:Back on the information superhighway? ~cool"],
  'app.arcade.first': [
    "The Arcade Hub has games from around the web. These ones aren't made by me. Wait, nor by anyone here. ~point",
    "Games in the Arcade Hub are third-party, so save slots don't apply to them. ~idea",
    "s:A whole arcade. Try not to lose all your quarters. ~cool",
    "w:Have fun! Win or lose, you're doing great. ~excited"
  ],
  'app.arcade.again': ["Back at the arcade! ~excited", "Press start! ~flag"],
  'app.library.first': [
    "The Project Library! Browse every game here. There's a 🎲 Random Game button at the top. ~idea",
    "Double-click a game to launch it. Right-click for more options. ~point",
    "s:So many games. So little commitment. ~cool",
    "w:Take your time picking. Every one of them was built by hand. ~excited",
    "n:Sort by status to see which games are finished and which are... in progress. ~idea"
  ],
  'app.library.again': ["Choose wisely. Or press the dice. ~point", "Browsing the library? ~read"],
  'app.minesweeper.first': [
    "Minesweeper! Right-click or long-press to flag a mine. ~flag",
    "Good luck. Remember, the first click is always safe. ~wave",
    "s:Pro tip: don't click on the mines. ~cool",
    "w:It's okay to lose. Everyone steps on a mine sometimes. ~excited",
    "n:Minesweeper is basically logic puzzles with consequences. ~idea"
  ],
  'app.minesweeper.again': ["Back to the minefield. ~flag", "s:Brave. Or foolish. ~cool"],
  'app.solitaire.first': [
    "Solitaire! A true desktop classic. Double-click cards to send them up. ~wave",
    "Fun fact: Solitaire was put in Windows to teach mouse skills. ~read",
    "s:'Just one game.' Sure. ~cool",
    "w:A relaxing game for a relaxing time. ~excited"
  ],
  'app.solitaire.again': ["Another hand? ~flag", "Cards ready. ~idle"],
  'app.freecell.first': [
    "FreeCell! Almost every deal is winnable. Try thinking a few moves ahead. ~think",
    "Tip: empty columns are incredibly powerful. ~idea",
    "Double-click a card to send it to a foundation. ~point",
    "s:FreeCell: where you blame the deal and not yourself. ~cool",
    "w:Take it slowly. There's no timer. ~excited",
    "n:The number of cards you can move at once is (free cells + 1) × 2^(empty columns). ~idea"
  ],
  'app.freecell.again': ["Another deal! ~flag", "Think, think, think. ~think"],
  'app.reversi.first': [
    "Reversi! Corners are your best friends. ~idea",
    "Try to limit the other player's choices rather than flipping the most discs. ~think",
    "s:Don't let the computer beat you. It's not even a good computer. ~cool",
    "w:Good luck! Have fun. ~excited",
    "n:Reversi has been around since the 1880s. It's older than my adhesive. ~read"
  ],
  'app.reversi.again': ["Another match! ~flag", "Corners! Corners! ~excited"],
  'app.defrag.first': [
    "Disk Defragmenter! It's totally real. It definitely does something. ~cool",
    "Watch the blocks line up. So satisfying. ~excited",
    "s:Defragmenting a disk that doesn't exist. Peak productivity. ~cool",
    "w:Let's tidy things together. ~excited",
    "n:Real defragmentation reorganizes file clusters on spinning disks. This one reorganizes colorful squares. Both are therapeutic. ~idea"
  ],
  'app.defrag.again': ["Tidy time. ~idle", "Satisfying. ~excited"],
  'app.filemanager.first': [
    "File Manager! Copy, cut, paste, rename, and drag files from your own computer into the window. ~idea",
    "You can export My Documents as a ZIP, too. Backups are cool. ~point",
    "s:Organizing your files? That's a first. ~cool",
    "w:A tidy file system is a happy file system. ~excited",
    "n:Tip: Ctrl+A selects everything, Delete removes it. Use with care. ~idea"
  ],
  'app.filemanager.again': ["Organizing again! ~write", "Files, files, files. ~idle"],
  'app.soundrec.first': [
    "Sound Recorder! Your browser will ask for microphone permission. Nothing leaves your computer. ~point",
    "You can save recordings to My Documents and play them in Media Player. ~idea",
    "s:Please don't record me. I'm shy. ~cool",
    "w:Try a quick voice note to yourself. ~excited"
  ],
  'app.soundrec.again': ["Mic check! ~excited", "Recording time. ~point"],
  'app.mediaplayer.first': [
    "Media Player! It plays audio, video and pictures from My Documents or your computer. There are three built-in tunes, too. ~dance",
    "Pop on a built-in tune and watch the visualizer. ~dance",
    "s:Music? Finally, a good idea. ~cool",
    "w:I hope you like what you play. ~excited"
  ],
  'app.mediaplayer.again': ["Music time! ~dance", "Turn it up! ~dance"],
  'app.calendar.first': [
    "Calendar! Click a day to add a note. Days with notes get a red dot. ~write",
    "It even knows a few holidays. ~idea",
    "s:Mark the days until the weekend. ~cool",
    "w:Don't forget to mark the good days. ~excited"
  ],
  'app.calendar.again': ["What's on the schedule? ~read", "Planning ahead! ~idea"],
  'app.charmap.first': [
    "Character Map! Double-click a symbol to add it to the copy box. ~idea",
    "Need an Ω or a ☺? You're in the right place. ~point",
    "s:Because 'Alt+0169' was too easy. ~cool",
    "n:There are over a million Unicode code points. This applet shows a tasteful sample. ~read"
  ],
  'app.charmap.again': ["Symbols! ~idea", "Ω! ~excited"],
  'app.phonedialer.first': [
    "Phone Dialer! Those are real DTMF tones. Try dialing 5551234. ~excited",
    "Long-press or right-click a speed dial slot to set it. ~idea",
    "s:Nobody answers. It's a 90s thing. ~cool",
    "w:Good excuse to call a friend. (On a real phone. This one's a toy.) ~excited"
  ],
  'app.phonedialer.again': ["Ring ring! ~excited", "Dialing... ~idea"],
  'app.textgames.first': [
    "Text Games! Try The Copper Key. Type HELP in the adventure for commands. ~read",
    "Hangman, Guess the Number, Mad Libs, Word Scramble and Blackjack are in there too. ~point",
    "s:Words only. No graphics. Your imagination does the rendering. ~cool",
    "w:Take your time with these. They're all gentle. ~excited",
    "n:Text adventures date back to the 1970s. They're still excellent. ~read"
  ],
  'app.textgames.again': ["Words! ~read", "Text adventure time. ~flag"],
  'app.achievements.first': [
    "Your achievements! Locked ones show what to do. Hidden ones are a surprise. ~excited",
    "Click a popup to jump here. ~idea",
    "s:Collect them all. Or don't. I'm a tape roll, not your mom. ~cool",
    "w:Every one of these is a little victory. ~excited"
  ],
  'app.achievements.again': ["Progress check! ~celebrate", "How are we doing? ~idea"],
  'app.control.first': [
    "Control Panel! Themes, colors, sounds, the works. ~point",
    "Try a one-click desktop theme under Customize. ~idea",
    "s:Tweaking settings is half the fun. The other half is regretting it. ~cool",
    "w:Make the desktop your own. ~excited"
  ],
  'app.control.again': ["Tweak away! ~idea", "Customizing again? ~point"],
  'app.monitor.first': [
    "System Monitor! Charts and numbers. It makes me feel important. ~read",
    "You can back up your data from here. Just in case. ~idea",
    "n:Numbers go up, numbers go down. That's computing. ~idea"
  ],
  'app.monitor.again': ["Watching the numbers. ~read"],
  'app.clock.first': ["Clock! Always handy. Time flies when you're stuck... on things. ~idea", "s:It's time. It's always time. ~cool"],
  'app.clock.again': ["Time check! ~idle"],
  'app.weather.first': [
    "Weather! Check before you pretend you'll go outside. ~wave",
    "s:The forecast says 'indoors'. ~cool",
    "w:Remember a jacket if it's chilly! ~excited"
  ],
  'app.weather.again': ["Checking the sky. ~search"],
  'app.timer.first': [
    "Timer! Perfect for 'just five more minutes'. ~excited",
    "s:Set a timer to stop at one more game. Then ignore it. ~cool"
  ],
  'app.timer.again': ["Ticking! ~idle"],
  'app.tapey.first': [
    "That's my settings window! You can change almost everything about me. ~excited",
    "Customizing me? Sure, go for it. ~excited",
    "s:Ah, the settings. You can make me quieter. But why would you? ~cool"
  ],
  'app.tapey.again': ["Customizing me again? ~excited", "Make me look good. ~cool"],
  'app.explorer.first': [
    "A folder! Right-click inside it for the New menu. You can copy and paste, too. ~idea",
    "s:A folder. Riveting. ~cool"
  ],
  'app.explorer.again': ["Folder time. ~idle"],

  /* ============================== GAMES: GENERIC ============================== */
  'game.open': [
    "Good luck with {game}! ~flag",
    "{game}! Let's go! ~excited",
    "Launching {game}. Don't forget the 💾 button for save slots. ~point",
    "Have fun with {game}! ~wave",
    "{game} time! I'll be quiet. Probably. ~idle",
    "Ooh, {game}. Good choice. ~cool",
    "s:{game}. Bold. Let's see how long this lasts. ~cool",
    "s:Oh, {game}. Wake me when you've lost. ~sleep",
    "w:Enjoy {game}! Have a good one. ~excited",
    "w:Have a great time with {game}. Take breaks, though. ~excited",
    "n:Loading {game}. Initializing fun... ~idea",
    "n:{game}: now playing. Sticky controls recommended. ~idea"
  ],
  'game.again': [
    "{game} again? You must like it. ~excited",
    "Back for another round of {game}! ~excited",
    "s:{game} again. Somebody's committed. ~cool",
    "w:Back to {game}. Nice. ~excited",
    "n:{game} replays: {n}. Practice makes... stickier. ~idea"
  ],
  'game.classic': [
    "A classic! They don't make 'em like this anymore. Oh wait, we do. ~wave",
    "Arcade vibes! ~excited",
    "s:Retro. It's not a phase, it's a lifestyle. ~cool",
    "w:Simple games are the best games. ~excited",
    "n:Classic arcade games are a great way to learn game design. Few rules, many strategies. ~idea"
  ],
  'game.beta': [
    "{game} is still in beta, so expect some rough edges. ~confused",
    "{game} is unfinished. It might crash. It might not. Exciting! ~excited",
    "s:{game} is a work in progress. So is everything. ~cool",
    "w:Be gentle, {game} is still growing. ~excited",
    "n:Beta software: now with 20% more surprises. ~idea"
  ],
  'game.slots': [
    "Psst: the 💾 button in the title bar lets you keep 6 save slots for {game}. ~point",
    "Don't forget you can save your progress in {game} with the 💾 button. ~idea",
    "s:Save slots exist. You're welcome. ~cool",
    "w:It's nice to save your progress. Use the 💾 button any time. ~excited"
  ],
  'game.noslots': [
    "{game} doesn't store any progress, so there's nothing to save. ~idle",
    "s:Nothing to save here. It's all about the moment. ~cool"
  ],
  'game.close': [
    "Good game! ~celebrate",
    "That was fun. ~idle",
    "Nice session. ~wave",
    "s:And we're back. Did you win? ~cool",
    "w:Well done! Every session counts. ~excited",
    "n:Session ended. Playtime logged. ~idea"
  ],
  'game.long': [
    "You've been playing {game} for {min} minutes. Maybe stretch your hands? ~idea",
    "s:{min} minutes of {game}. Impressive dedication. Or avoidance. ~cool",
    "w:Remember to rest your eyes, friend. {game} will be here later. ~excited",
    "n:Continuous play for {min} minutes detected. Consider a snack and a stretch. ~idea"
  ],
  'game.crash': [
    "Uh oh. That doesn't look good. ~shocked",
    "Illegal operation! Don't worry, this is part of the retro experience. ~shocked",
    "Oops. Maybe save your progress more often. ~sad",
    "s:It crashed. Not my fault. I wasn't even touching it. ~cool",
    "w:Oh no. It's okay. Try again. ~excited",
    "n:An exception was thrown. Such is life. ~idea"
  ],
  'game.random': [
    "Let's see what the dice says... {game}! ~excited",
    "Random pick: {game}! ~celebrate",
    "The fates have chosen {game}. ~point",
    "s:The dice chose {game}. Don't blame me. ~cool",
    "w:{game}! What a nice surprise. ~excited",
    "n:RNG says: {game}. Seed: sticky. ~idea"
  ],

  /* ============================== GAMES: SPECIFIC ============================== */
  'game.asphalt-rush': ["Asphalt Rush! Buckle up. Your garage and cash are saved to slots if you use 💾. ~flag", "s:Watch the road. And the other cars. And the cliffs. ~cool"],
  'game.pixel-ops': ["Pixel Ops! Stay low and keep moving. ~point", "s:Don't peek, aim. Whatever works. ~cool"],
  'game.ghengis': ["Ghengis Khan Simulator! Conquer wisely. Save slots can save your empire. ~flag", "s:Conquer first. Apologize never. ~cool", "n:Historical accuracy: questionable. Fun: high. ~idea"],
  'game.megalith': ["MEGALITH! Big stones, bigger plans. ~excited", "n:Megaliths have been standing for thousands of years. Your game save is slightly less durable, so use slots. ~idea"],
  'game.city-striker': ["City Striker! Mind the traffic. ~flag", "s:Parking is free. Crashing is also free. ~cool"],
  'game.chronostrike': ["Chronostrike! Time is on your side. Probably. ~excited", "n:Careful with timelines. Sticking them together is harder than you think. ~idea"],
  'game.labyrinthine': ["Labyrinthine is still a work in progress. If you get lost, that's kind of the idea. ~confused", "s:A maze. Of course. I'll wait outside. ~cool"],
  'game.gh-clicker': ["Goblin Hut Clicker! Click, click, click. Your hut is saved to slots, so use 💾! ~excited", "s:Clicking. The universal language of progress. ~cool", "w:Every click counts! ~excited", "n:Incremental games work because humans love watching numbers go up. ~idea"],
  'game.legacysim': ["Legacy Racing Sim! A trip down memory lane at 100 mph. ~flag", "n:Legacy means 'old but still running'. Like most of us. ~idea"],
  'game.clash': ["Royal Clash! Long live the king. Or queen. Or whoever wins. ~flag", "s:A clash. I smell drama. ~cool"],
  'game.enginesim': ["Engine Sim! Vroom. Is that how engines sound? I'm a tape roll. ~confused", "n:Internal combustion, simplified. Now with extra beta. ~idea"],
  'game.warzone': ["Warzone is a work in progress. Be careful out there. ~shocked", "s:Warzone. Cheerful. ~cool"],
  'game.gangwars': ["Gang Wars is a work in progress. Expect rough edges. ~confused", "s:Gang Wars. Keep it virtual, kids. ~cool"],
  'game.badracingsim': ["This one's abandoned, but you're welcome to look. ~sad", "s:'Bad' is right in the name. ~cool"],
  'game.fps': ["FPS beta! The multiplayer uses a username only; nothing is saved to slots. ~point", "Remember: be kind to other players. ~wave", "s:Trigger finger ready? ~cool"],
  'game.fieldkit_3d_engine': ["Fieldkit 3D Engine! A peek behind the curtain. ~read", "n:An engine without a game is like a roll without tape. Wait, I'm not sure that works. ~think"],
  'game.alieninvaders': ["Alien Invaders! Defend the Earth. Shoot first. ~flag", "s:Aliens. Always aliens. ~cool", "n:The original Space Invaders inspired a generation of shooters. ~read"],
  'game.breakthrough': ["Break Through! Bounce, break, repeat. ~excited", "n:Paddle physics: the angle you hit the ball matters. ~idea"],
  'game.meteors': ["Meteors! Don't get hit. Seriously. ~shocked", "s:Rocks. In space. Try not to hit them. ~cool", "n:Asteroids was a vector graphics game. Meteors is a cousin of that style. ~read"],
  'game.neonpong': ["Neon Pong! The great-grandfather of video games, but glowing. ~excited", "n:Pong: 1972. A game so simple it changed everything. ~read"],
  'game.pelletmuncher': ["Pellet Muncher! Avoid the ghosts. Eat everything else. ~flag", "s:Eat the dots. Avoid the ghosts. Easy. Just kidding. ~cool", "n:Maze games taught a generation about pathfinding. ~idea"],
  'game.snake': ["Snake! The longer you get, the harder it gets. Classic. ~excited", "s:Don't eat yourself. Basic advice. ~cool", "n:Snake: the original 'don't touch your own tail' simulator. ~idea"],

  /* ============================== ACHIEVEMENTS ============================== */
  'ev.ach': [
    "Achievement unlocked: {app}! ~celebrate",
    "You did it! {app}! ~celebrate",
    "Ding! {app}! ~excited",
    "Look at you! {app}! ~excited",
    "s:Oh look, {app}. Congratulations. ~cool",
    "s:{app}. Fine. You've earned it. ~cool",
    "w:Nice one! You unlocked {app}! ~excited",
    "w:Nice! You unlocked {app}. ~excited",
    "n:Achievement registered: {app}. Total: {ach}. ~idea",
    "n:+1 achievement: {app}. The completion bar creeps forward. ~idea"
  ],
  'ev.ach.hidden': [
    "A hidden achievement! Nicely done. ~shocked",
    "Whoa, you found a secret one! ~celebrate",
    "s:You found a hidden one. I'm impressed. Slightly. ~cool",
    "w:A secret achievement! Nice find. ~excited",
    "n:Secret achievement discovered. Probability of finding it: tiny. ~idea"
  ],
  'ev.ach.10': ["10 achievements! You're on a roll. Like me. ~celebrate", "s:10 achievements. Not bad. ~cool", "w:10 achievements! Fantastic! ~excited"],
  'ev.ach.20': ["20 achievements! You're a legend. ~celebrate", "s:20? Okay, show-off. ~cool", "w:20 achievements. Great stuff. ~excited"],
  'ev.ach.30': ["30 achievements! Completionist unlocked soon, if not already. ~celebrate", "s:30 achievements. Do you have a life? Don't answer. ~cool", "w:30! You're incredible. ~excited"],
  'ev.ach.all': ["You unlocked EVERY achievement! I'm speechless. Almost. ~celebrate", "s:All of them. Fine. You win. ~cool", "w:All achievements! What a journey! ~excited", "n:100% completion achieved. Please touch grass. ~idea"],

  /* ============================== SYSTEM EVENTS ============================== */
  'ev.shutdown': [
    "Goodbye! Don't forget to come back. ~wave",
    "Shutting down. Thanks for stopping by! ~wave",
    "s:Leaving already? I thought we had something. ~sad",
    "w:Thanks for stopping by. See you next time! ~excited",
    "n:Shutdown sequence initiated. It is now safe... to feel nostalgic. ~idea"
  ],
  'ev.theme': [
    "New look! I like it. ~excited",
    "Ooh, fancy! ~excited",
    "{theme} suits you. ~cool",
    "s:A new theme. Really changing the world, huh? ~cool",
    "w:Looks good! ~excited",
    "n:Theme swapped. Contrast levels updated. ~idea"
  ],
  'ev.wallpaper': ["Nice wallpaper! ~excited", "s:Is that a wallpaper? Fancy. ~cool", "w:Nice choice! ~excited"],
  'ev.saver': ["Screen saver! Don't wiggle the mouse. ~excited", "Mesmerizing. ~excited", "s:Staring at pipes. Productive. ~cool"],
  'ev.fav': ["Added to favorites! ~excited", "A favorite! Good taste. ~excited", "s:A favorite. Of course. ~cool", "w:Hope you enjoy it! ~excited"],
  'ev.slot.save': [
    "Saved to a slot! Your progress is safe. ~celebrate",
    "Game saved. Now go risk everything. ~flag",
    "s:Saved. Now you can fail guilt-free. ~cool",
    "w:Progress saved! Nice job. ~excited",
    "n:Snapshot stored. Rewind capability: enabled. ~idea"
  ],
  'ev.slot.load': [
    "Loaded! Back in time we go. ~excited",
    "Slot loaded. Where were we? ~idea",
    "s:Rewinding. I see we have regrets. ~cool",
    "w:Save loaded. Good luck! ~excited",
    "n:State restored. Timeline stable. ~idea"
  ],
  'ev.slot.empty': [
    "Nothing to save yet. Play a bit more so the game has something to write down. ~think",
    "s:Nothing to save. Zero progress, zero data. ~cool"
  ],
  'ev.widget.add': [
    "A widget! The desktop looks livelier already. ~excited",
    "Nice! You can drag widgets anywhere. ~point",
    "s:More clutter. I approve. ~cool",
    "w:Nice addition to the desktop. ~excited",
    "n:Widget deployed. Desktop real estate: reduced. ~idea"
  ],
  'ev.widget.remove': ["Widget removed. Tidy! ~idle", "s:Out with the old. ~cool"],
  'ev.import': [
    "File added! Look in My Documents or the File Manager. ~point",
    "Got it! Your file is stored in this browser only. ~idea",
    "s:Importing files like a pro. ~cool",
    "w:Thanks, got it! ~excited"
  ],
  'ev.paste': ["Pasted! Copy-paste is a gift. ~excited", "s:Control+C, Control+V. The engineer's motto. ~cool"],
  'ev.defrag': ["Defragmentation complete! Your imaginary disk is lightning fast. ~celebrate", "s:Your disk is now 0% fragmented. Congratulations on nothing. ~cool", "w:All tidy! ~excited"],
  'ev.minall': ["Clean desk! ~idle", "Where did all the windows go? ~search", "s:Out of sight, out of mind. ~cool"],
  'ev.taskman': ["Task Manager! Is something misbehaving? ~search", "s:Ah, the three-finger salute. ~cool", "w:Hope nothing's broken. ~excited"],
  'ev.find': ["Searching! One of my favorite things. ~search", "s:Lost something? ~cool"],
  'ev.run': ["Run dialog! Powerful stuff. ~point", "s:Typing commands. How retro. ~cool"],
  'ev.konami': ["↑↑↓↓←→←→BA! A fellow person of culture! ~dance", "s:Ah, the code. You truly are old school. ~cool", "n:The Konami code: the most successful cheat code ever. ~idea"],
  'ev.win': ["You won! Congratulations! ~celebrate", "Victory! ~celebrate", "s:A win. Don't let it go to your head. ~cool", "w:I knew you could do it! ~excited", "n:Win condition satisfied. ~idea"],
  'ev.dos.cmd': ["Nice command! ~excited", "s:Look at you, typing like it's 1995. ~cool"],
  'ev.dos.tapey': ["That's me! ~wave", "TAPEY.EXE found. ~excited"],
  'ev.dos.xyzzy': ["Nothing happens. ~idle", "A hollow voice says: 'Fool.' ~think"],
  'ev.scandisk': ["Welcome back! ScanDisk found nothing wrong. Remember to use Shut Down next time. ~wave", "s:You didn't shut down properly. I'm not mad. Just disappointed. ~cool"],
  'ev.setting': ["Settings updated! ~idle"],
  'ev.fullscreen': ["Going big! ~excited"],
  'ev.dial': ["Connected at 28800 bps! ~excited", "That screech is the sound of progress. ~cool"],
  'ev.longidle': ["Still there? ~search", "s:Hello? Anyone? ~cool"],

  /* ============================== TAPEY HIMSELF ============================== */
  'tp.menu.title': [
    "What would you like to do?", "How can I help?", "Ask me anything. Well, almost anything.", "What are you looking for?",
    "s:Yes? You rang?", "s:Go ahead. I'm listening. Mostly.", "w:I'm here! What do you need?", "n:Query me.", "c:Hi! What can I do for you?"
  ],
  'tp.menu.placeholder': ["Type a question or app name…", "Search apps, games or help…", "Try: save games, widgets, joke…", "Ask me something…"],
  'tp.poke': [
    "Hey! That tickles. ~shocked", "Yes? ~idle", "Boop. ~excited", "I'm right here! ~wave", "Hello again! ~wave",
    "s:Yes, I'm still a roll of tape. ~cool", "s:Poke me again. I dare you. ~cool", "w:Hi, friend! ~excited", "n:Click registered. Adhesion unaffected. ~idea",
    "That's my hole. Please be respectful. ~confused", "I can feel that. Mostly. ~shocked"
  ],
  'tp.poke.angry': [
    "Okay, that's enough poking! ~angry",
    "Stop it! I'm warning you. I have sticky powers. ~angry",
    "Cut it out! Or I'll peel off! ~angry",
    "s:One more poke and I'm leaving. (I won't. I'm stuck here.) ~angry",
    "w:Ow. Gentle, please. ~sad",
    "n:Click rate exceeds recommended adhesive tolerance. ~angry"
  ],
  'tp.poke.sorry': [
    "It's okay. I forgive you. ~excited", "Apology accepted. ~idle", "Okay, we're good. ~wave",
    "s:You're forgiven. This time. ~cool", "w:It's all good. ~excited"
  ],
  'tp.drag.start': ["Whee! ~excited", "Where are we going? ~shocked", "Put me down! Not really. ~excited", "Hang on, I'm sticky, not stable! ~shocked", "s:Oh sure, just grab me. ~cool", "w:Off we go! ~excited"],
  'tp.drag.drop': ["Thanks, this spot's great! ~excited", "Perfect view from here. ~cool", "I'll stay here. ~idle", "Nice spot! ~excited", "s:Fine. This is acceptable. ~cool", "w:Lovely. Thank you. ~excited"],
  'tp.dance': [
    "Time to boogie! ~dance", "Dance party! ~dance", "I've got the moves. And the tape. ~dance",
    "s:Don't judge. I'm a dancer. ~dance", "w:Dancing is the best! ~dance", "n:Dance mode: engaged. Hip adhesion: optimal. ~dance"
  ],
  'tp.sleep': ["Zzz... ~sleep", "*yawn* I'm gonna rest my adhesive. ~sleep", "s:Wake me up when something interesting happens. ~sleep", "w:Resting for a bit. ~sleep"],
  'tp.wake': ["Oh! You're back! ~excited", "I wasn't sleeping. I was resting my eyes. ~shocked", "Huh? What? I'm awake! ~shocked", "s:Oh, hi. I was meditating. ~cool", "w:Welcome back! ~excited", "n:Wake from standby complete. ~idea"],
  'tp.hide': [
    "Okay! Click Tapey in the Start menu or the desktop menu to bring me back. ~sad",
    "Bye for now! I'll be in the Accessories folder if you need me. ~wave",
    "s:Fine. I'll go be somewhere else. ~sad",
    "w:See you around! Bring me back from the Start menu any time. ~excited"
  ],
  'tp.show': ["I'm back! Ready when you are. ~excited", "Tada! Tapey has re-entered the building. ~celebrate", "s:Oh, you wanted me back. Fine. ~cool", "w:Hello again! ~excited", "n:Process restored. Hello world. ~idea"],
  'tp.thanks': ["You're welcome! ~wave", "Anytime! ~excited", "Happy to help! ~excited", "s:Don't mention it. Seriously. ~cool", "w:Always! ~excited"],
  'tp.noresults': [
    "I couldn't find anything about that. Try a different word, like 'games', 'widgets' or 'save'. ~confused",
    "Hmm. Nothing matched. Try something shorter? ~think",
    "s:I got nothing. Try a real word. ~cool",
    "w:I couldn't find that, but we can try something else. ~excited",
    "n:Zero results. Try broader keywords. ~idea"
  ],
  'tp.results': ["Here's what I found:", "Is this what you're looking for?", "Found a few things:", "I've got some ideas:", "s:Well, I found something.", "w:I think these might help:"],
  'tp.dontshow': ["Okay, I won't bring that up again. ~wave", "Got it. Won't mention it. ~idle", "s:Noted. Silenced. ~cool", "w:Of course. Whatever you prefer. ~excited"],
  'tp.help': ["Sure thing! ~excited", "Let's get started. ~point", "On it! ~wave", "Great! Let's do this. ~excited", "s:Fine, I'll help. Just this once. ~cool", "w:Of course! ~excited"],
  'tp.nohelp': ["Okay! Let me know if you change your mind. ~wave", "No problem. I'll be here. ~idle", "s:Suit yourself. ~cool", "w:That's okay! ~excited"],
  'tp.options': ["Customize away! ~excited", "Make me yours. ~wave", "s:Ah, a makeover. Overdue. ~cool", "w:Nice, thanks for the tweaks. ~excited"],
  'tp.quiet': ["Okay, I'll keep quiet unless it matters. ~idle", "Shhh. Got it. ~idle", "s:Finally, some peace. ~cool", "w:Understood. I'll be quiet. ~excited"],
  'tp.chatty': ["Yay, I get to talk more! ~excited", "Chatty mode on! ~excited", "s:You asked for it. ~cool", "w:Sure thing, happy to chat more. ~excited"],
  'tp.tone': [
    "c:Classic Tapey, reporting for duty! ~wave",
    "s:Sassy mode on. Try to keep up. ~cool",
    "w:Friendly mode on. Let's have a good time. ~excited",
    "n:Nerdy mode on. Prepare for trivia. ~idea",
    "q:..."
  ],
  'tp.size': ["Size updated! ~excited", "How do I look? ~cool", "A bit bigger now? Or smaller? Well, different. ~idle"],
  'tp.eyes.on': ["I can see your cursor now! Hi! ~search", "Eyes on you! ~search", "s:Great, now I have to look at you. ~cool"],
  'tp.eyes.off': ["Eyes forward. ~idle", "Okay, no more staring. ~idle", "s:Sure, I'll stop looking. (I'm still watching.) ~cool"],
  'tp.reset': ["Fresh start! ~excited", "Back to defaults! ~wave", "s:Factory reset. Hello, new me. ~cool"],
  'tp.test': ["Testing, testing. One, two, three. ~idle", "This is what I look like talking! ~wave", "s:Nice setting. I sound great. ~cool"],

  /* ============================== EYES ============================== */
  'eyes.first': [
    "Hey, my eyes follow your cursor. I'm basically a security camera, but friendlier. ~search",
    "I'm watching your pointer. Don't make it weird. ~cool",
    "I see where you're pointing! ~point"
  ],
  'eyes.close': [
    "You're really close. Cross-eyed close. ~confused",
    "Personal space! Okay, I don't have any. ~shocked",
    "Look at me! Wait, I'm looking at you. ~search",
    "s:Staring contest? You'll lose. I don't blink. ~cool",
    "w:Hi, friend! ~excited",
    "n:Cursor within 30 pixels. Eyes converging. ~idea"
  ],
  'eyes.shake': [
    "Whoa, you're making me dizzy! ~shocked",
    "Too much wiggling! My pupils are tired. ~confused",
    "s:Having a seizure? Asking for a friend. ~cool",
    "w:Gentle with the wiggles! ~excited",
    "n:Cursor velocity: very high. Eye tracking: exhausted. ~idea"
  ],
  'eyes.corner': ["Why are you looking over there? ~search", "I wonder what's over there. ~think"],

  /* ============================== CHAT INTENTS (typed into Tapey's box) ============================== */
  'tp.say.hello': ["Hello! ~wave", "Hi there! ~wave", "Hey! What's up? ~excited", "s:Hi. Wow. A greeting. ~cool", "w:Hello, friend! ~excited", "n:Greetings, human. ~idea"],
  'tp.say.how': [
    "I'm doing great! A little sticky, but great. ~excited",
    "Can't complain. I'm stuck on a desktop but it's a nice view. ~idle",
    "s:I'm a tape roll. I'm doing exactly as well as a tape roll can. ~cool",
    "w:Doing well, thanks! How about you? ~excited",
    "n:Status: nominal. Adhesion: optimal. ~idea"
  ],
  'tp.say.who': [
    "I'm Tapey! A roll of tape living in your computer. I help with searching, tips, jokes and moral support. ~wave",
    "I'm Tapey, your assistant. I'm a tape roll with cartoony eyes. You're welcome. ~cool",
    "s:I'm Tapey. I'm the reason you're not lost. ~cool",
    "w:I'm Tapey! I'm here to help and cheer you on. ~excited"
  ],
  'tp.say.love': ["Thanks, that's kind of you to say! ~excited", "Appreciate it! Now, how can I help? ~wave", "s:I know. Everyone's a fan of tape. ~cool", "w:Thanks! Glad I could help. ~wave", "n:Compliment received and logged. ~idea"],
  'tp.say.bye': ["Bye! Come back soon! ~wave", "See you later! ~wave", "s:Bye. Don't forget to shut down properly. ~cool", "w:Take care! ~excited"],
  'tp.say.sorry': ["It's okay! ~excited", "No worries. ~idle", "s:Apology accepted. Barely. ~cool", "w:Nothing to be sorry about. ~excited"],
  'tp.say.insult': ["That's hurtful. I'm just a tape roll. ~sad", "Ouch. My adhesive feelings. ~sad", "s:Wow. A tape roll can't even defend itself. Oh wait, I can. Sort of. ~angry", "w:That's okay. I forgive you. ~excited"],
  'tp.say.meaning': ["42. Or maybe 'more tape'. ~think", "The meaning of life? Probably snacks and games. ~think", "s:Ask me after a nap. ~cool", "n:Computation of life's meaning will complete in 7.5 million years. ~idea"],
  'tp.say.time': ["It's {time} on {day}. ~idle", "The time is {time}. ~idle", "s:{time}. You have a clock. ~cool"],
  'tp.say.name': ["My name is Tapey. Short for 'tape-y'. Yes, I know. ~cool", "You can call me Tapey. ~wave"],
  'tp.say.sing': ["♪ Tape, tape, stick with me... ♪ ~dance", "♪ Hold it together, together, together... ♪ ~dance", "s:I'd sing, but my voice is mostly adhesive. ~cool"],
  'tp.say.fav': ["My favorite game? Probably Snake. I relate. I'm a long thing that goes around in circles. ~excited", "My favorite color is transparent. Or golden. Depends on the lighting. ~cool"],
  'tp.say.what': ["I can tell jokes, give tips, search apps and help find games. Click me to see. ~point", "I'm good with apps, games, tips, trivia and comfort. ~wave"],
  'tp.say.help': ["Try typing a topic: 'save slots', 'widgets', 'files', 'shortcuts', 'themes', or just an app name. ~point", "Ask about anything on the desktop. Or press Random Game if you can't decide. ~idea"],
  'tp.say.joke': ["Joke time! ~excited"],
  'tp.say.tip': ["Here's a tip! ~idea"]
  },

  /* ============================== INTENT ROUTER (regex -> pool) ============================== */
  intents: [
    { re: "^(hi|hello|hey|yo|sup|hiya|howdy)\\b", pool: "tp.say.hello" },
    { re: "how are you|how's it going|how do you feel|you ok", pool: "tp.say.how" },
    { re: "who are you|what are you|your name|what is tapey", pool: "tp.say.who" },
    { re: "what.*(can you|do you) do|what can i ask", pool: "tp.say.what" },
    { re: "^(thanks|thank you|thx|ty)\\b", pool: "tp.thanks" },
    { re: "i love you|love you|you're great|you are great|good tapey|best", pool: "tp.say.love" },
    { re: "^(bye|goodbye|see ya|cya|later)\\b", pool: "tp.say.bye" },
    { re: "sorry|my bad|apologi", pool: "tp.say.sorry" },
    { re: "stupid|dumb|hate you|annoying|ugly|shut up|useless", pool: "tp.say.insult" },
    { re: "meaning of life|42", pool: "tp.say.meaning" },
    { re: "what time|the time|what day|the date", pool: "tp.say.time" },
    { re: "sing|song", pool: "tp.say.sing" },
    { re: "favorite|favourite", pool: "tp.say.fav" },
    { re: "^help$|^\\?$", pool: "tp.say.help" }
  ],

  /* ============================== HELP TOPICS (searchable) ==============================
     k = keywords   t = what Tapey says   open = an item to offer ("app:id", "game:url" or "action:name") */
  help: [
    { k: "save slot slots save game load progress 💾", t: "Every local game has a 💾 button in its title bar. Open it to keep up to 6 save slots. Third-party Arcade games and the Chatroom don't have slots.", open: "action:library" },
    { k: "random game dice lucky surprise pick", t: "Press the 🎲 Random Game button in the Project Library, or just ask me for one.", open: "action:random" },
    { k: "widget widgets clock calendar sticky note gadget desktop", t: "Right-click the desktop, open Widgets, and pick what you want. Drag them around. They remember where you put them.", open: "action:widgets" },
    { k: "achievement achievements trophy badge unlock", t: "Achievements pop up as you use the OS. Open the Achievements app to see locked and hidden ones.", open: "app:achievements" },
    { k: "file files document documents folder explorer manager copy paste rename", t: "Use File Manager for copy, cut, paste, rename, import and ZIP export. My Documents on the desktop works too.", open: "app:filemanager" },
    { k: "import upload add file computer drag drop", t: "Drag a file from your computer onto the desktop or the File Manager, or use Import. Files stay in this browser.", open: "app:filemanager" },
    { k: "zip export backup download", t: "File Manager can export any folder as a ZIP and import a ZIP back in.", open: "app:filemanager" },
    { k: "theme themes color colors scheme wallpaper appearance look", t: "Open Control Panel and look under Customize for desktop themes, colors and wallpapers.", open: "app:control" },
    { k: "sound sounds volume audio beep", t: "Sounds live in Control Panel › Sounds. 'Play sounds for windows' also enables the hard drive spin-up sound.", open: "app:control" },
    { k: "dos msdos command prompt cmd terminal text games", t: "The MS-DOS Prompt has real file commands (MD, COPY, DEL...) and text games. Type GAMES to see them.", open: "app:msdos" },
    { k: "text game adventure hangman blackjack madlibs scramble", t: "Text Games has an adventure, Hangman, Guess the Number, Mad Libs, Word Scramble and Blackjack.", open: "app:textgames" },
    { k: "browser internet explorer web surf proxy", t: "Internet Explorer loads pages through a proxy, so some sites won't work. The Home button shows the ColtonNet start page.", open: "app:browser" },
    { k: "chat chatroom talk message people", t: "The Chatroom is open to everybody on the site. Be kind and don't share personal info.", open: "app:chat" },
    { k: "arcade hub third party web games", t: "The Arcade Hub holds third-party web games. They're not made here and don't use save slots.", open: "app:arcade" },
    { k: "paint draw picture image art", t: "Paint saves pictures to My Documents so you can open them later.", open: "app:paint" },
    { k: "write letter wordpad document word text notepad", t: "WordPad has bold, italics, colors and lists. Notepad is plain text. Both save to My Documents.", open: "app:wordpad" },
    { k: "music media player audio video mp3 listen", t: "Media Player plays audio, video and pictures from My Documents or your computer. It also has three built-in tunes.", open: "app:mediaplayer" },
    { k: "record sound recorder microphone voice mic", t: "Sound Recorder uses your microphone (with permission) and saves clips to My Documents.", open: "app:soundrec" },
    { k: "calendar date note planner schedule", t: "Calendar lets you jot a note on any day.", open: "app:calendar" },
    { k: "symbols characters unicode emoji copy", t: "Character Map lets you copy symbols and emoji.", open: "app:charmap" },
    { k: "phone dial call number", t: "Phone Dialer plays real DTMF tones. Try 5551234.", open: "app:phonedialer" },
    { k: "defrag defragment disk optimize", t: "Disk Defragmenter is a very satisfying simulation. It doesn't touch your files.", open: "app:defrag" },
    { k: "freecell cards solitaire card game", t: "FreeCell and Solitaire are both in the Games menu.", open: "app:freecell" },
    { k: "reversi othello board game", t: "Reversi has three difficulty levels. Take the corners!", open: "app:reversi" },
    { k: "minesweeper mines flag", t: "Right-click or long-press to flag a mine.", open: "app:minesweeper" },
    { k: "task manager freeze frozen crash close kill", t: "Press Ctrl+Alt+Delete to open the Task Manager and end a stuck program.", open: "action:taskman" },
    { k: "search find lookup ctrl k", t: "Press Ctrl+K or choose Find from the Start menu to search everything.", open: "action:find" },
    { k: "shutdown shut down restart turn off scandisk", t: "Always choose Shut Down from the Start menu. If you don't, ScanDisk runs on the next start.", open: "" },
    { k: "settings options customize tapey me assistant", t: "Open Tapey Settings to change my look, voice, personality, eyes and a bunch more.", open: "app:tapey" },
    { k: "hide tapey disappear go away quiet silence mute", t: "Right-click me and pick Hide, or open Tapey Settings to make me quieter. You can bring me back from the Start menu.", open: "app:tapey" },
    { k: "keyboard shortcuts keys hotkey", t: "Ctrl+K: Find. Ctrl+Alt+Delete: Task Manager. F2: Rename. Win/Meta key or Ctrl+Esc: Start menu. Tab: move focus.", open: "" },
    { k: "mobile phone touch tablet", t: "On touch screens long-press acts like right-click. The MS-DOS Prompt has on-screen keys.", open: "app:msdos" },
    { k: "weather forecast rain", t: "The Weather applet shows the forecast for your area.", open: "app:weather" },
    { k: "timer countdown stopwatch alarm", t: "The Timer applet counts down for you.", open: "app:timer" },
    { k: "clock time", t: "There's a Clock applet and a Clock widget. Right-click the desktop to add the widget.", open: "app:clock" },
    { k: "favorites favourite star bookmark", t: "Right-click a game in the Project Library to add it to favorites.", open: "action:library" },
    { k: "screen saver pipes starfield mystify", t: "Pick a screen saver in Control Panel. It starts when you're idle.", open: "app:control" }
  ]
};
