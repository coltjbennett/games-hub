/* tapey-dialogs-plus.js — third dialog pack for Tapey (loaded after tapey-dialogs-more.js).
 * Adds the File Manager / save-folder / Registry Editor / "stepping aside" lines. Same entry syntax: "[tone:]text [~pose]". */
(function () {
  var D = window.TAPEY_DIALOGS; if (!D) return;
  var P = D.pools;
  function add(k, a) { P[k] = (P[k] || []).concat(a); }

  /* ---------- File Manager ---------- */
  add('app.filemanager.first', [
    "The File Manager is the whole computer now. Drives, games, saves, documents. Everything. ~idea",
    "Fancy! Click a folder in the left tree, or double-click one in the list. ~point",
    "s:Oh, you found the good explorer. Don't tell the old one. ~cool",
    "n:File Manager online. Tip: press F2 to rename and Backspace to go up. ~read",
    "w:Welcome to the File Manager! Look inside Games, every game has a folder with a saves folder in it. ~wave"
  ]);
  add('app.filemanager.again', [
    "Browsing the drive again. ~search", "Back in the files. ~idle", "n:Preview pane: View menu. ~read"
  ]);
  add('ev.fm.saves', [
    "These are your save slots. Double-click one and it opens in the Text Viewer. ~read",
    "Your saves live here. Reading them is safe, deleting them is forever. ~think",
    "s:Nice little vault you have. Try not to delete the good ones. ~cool",
    "n:Save slots detected. Format: plain text with a key and value per line. ~read"
  ]);
  add('ev.fm.saves.empty', [
    "Nothing saved for this game yet. Click the 💾 button in its title bar to make a slot. ~point",
    "Empty folder! Play a bit, then use the 💾 button on the game window. ~idea",
    "w:No saves yet. That's okay, there's a floppy icon in the game's title bar when you're ready. ~wave"
  ]);
  add('ev.fm.slotview', [
    "That's the raw data. It looks like gibberish, but the game can read it. ~read",
    "Look but don't touch! Editing a slot file here won't change the real save. ~think",
    "s:So that's what 40 hours of progress looks like. A wall of text. ~cool"
  ]);
  add('ev.fm.slotdel', [
    "Slot deleted. Poof. ~shocked", "That save is gone for good. ~sad", "n:Slot removed from storage. ~read"
  ]);
  add('ev.fm.drive', [
    "That's your disk usage. It's all stored in this browser, nothing leaves your computer. ~idea",
    "Disk space is a pie chart. I like pie. ~love"
  ]);
  add('ev.fm.newwin', ["Two windows, double the browsing. ~cool", "Another File Manager! Drag files between them. ~point"]);

  /* ---------- saves awareness ---------- */
  add('game.close.nosave', [
    "You played {x} minutes and never made a save slot. The 💾 button in the title bar is there for next time. ~idea",
    "Quick tip for next time: the 💾 button saves your progress into a slot. ~point",
    "s:{x} minutes with no save. Bold. Wasteful, but bold. ~cool"
  ]);
  add('game.close.saved', [
    "Your slot is safe in {game}'s saves folder. ~flag", "Saved and closed. Responsible. ~cool"
  ]);
  add('game.saveage', [
    "You have {n} save slots for {game}. The last one is {x} old. ~read",
    "{game} has {n} save slot(s). Open them from the game's folder in Games. ~point"
  ]);

  /* ---------- Registry Editor ---------- */
  add('app.regedit.first', [
    "The Registry Editor! Here's where I keep my feelings. Also your settings. ~read",
    "Careful in here. Every key is a real value stored by this site. ~think",
    "s:You can break things in here. That's a feature. ~cool",
    "n:Registry Editor: HKEY_LOCAL_MACHINE is this browser's local storage. Export before you edit. ~read"
  ]);
  add('app.regedit.again', ["Poking around in the registry again. ~search", "Edit with care! ~think"]);
  add('ev.regedit.edit', ["Value changed. I hope you meant that. ~think", "Edited! If something breaks, Export first next time. ~idea"]);
  add('ev.regedit.export', ["Exported a .reg file. Smart backup. ~flag", "Backed up! Good habit. ~celebrate"]);

  /* ---------- typed answers ---------- */
  add('tp.say.saves.open', ["Here are the saves for {game}. ~point", "Opening the saves folder. ~point", "There they are. ~point"]);
  add('tp.say.saves.none', ["I'll open the Games folder, every game has a saves folder inside. ~point", "Every game with a save slot has a 'saves' folder in C:\\Games. ~point"]);
  add('tp.say.files.open', ["Opening My Computer. ~point", "File Manager, coming up. ~point"]);
  add('tp.say.disk', ["You're using {x} of the 50 MB the file manager shows. ~read", "Disk check: {x} used. ~read"]);
  add('tp.say.explain.none', ["Nothing is open, so I'm explaining the desktop. It's teal. ~wave", "No window is active. Click one and ask again! ~point"]);
  add('tp.say.politer', [
    "Okay, okay. I'll keep it down. You can change this in Tapey Settings under Manners. ~sad",
    "Sorry! I'll speak less and stay out of your way. ~sad",
    "s:Fair. I'll shut up. For a while. ~cool",
    "n:Chattiness reduced. Hourly limit lowered. ~read"
  ]);
  add('tp.say.stepaside', [
    "When a window covers me I slide off-screen so I'm never on top of your game controls. I come back when there's room, or click my icon in the tray. ~point"
  ]);

  /* ---------- help topics + intents ---------- */
  (D.help = D.help || []).push(
    { k: 'save saves slot slots state states file files folder', t: 'Every game has a folder in C:\\Games and a saves folder inside it. Double-click a save to read it in the Text Viewer.', open: 'sys:my-computer' },
    { k: 'file manager explorer my computer drive files browse', t: 'My Computer, My Documents, Games and the drives all open in the File Manager now.', open: 'app:filemanager' },
    { k: 'registry regedit settings keys storage', t: 'The Registry Editor shows every setting the site stores and lets you export a .reg backup.', open: 'app:regedit' },
    { k: 'hide slide away overlap covers window controls', t: 'When a window covers me I slide off the screen so I never sit on game controls. Click my tray icon to bring me back.' }
  );
})();
