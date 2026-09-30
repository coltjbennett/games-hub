# Games Hub v4.1 — storage/performance changes

## Main persistent-storage fix

The service worker no longer caches every navigation response back into Cache Storage. It now uses a small versioned core cache, only caches eligible static assets under 768 KiB, and explicitly avoids game pages and preview-image directories. Older `games-hub-*` caches are removed when the new worker activates.

The Arcade Hub no longer keeps a second Cache Storage copy of its GitHub directory snapshot; its existing localStorage snapshot remains the fallback.

## Chat storage

Chat history now uses gzip via `CompressionStream` when available, with LZString as the fallback, instead of writing the full structured history object uncompressed. History persistence is capped at 16 MiB per stored history record and automatically compacted. The chat settings expose 7/30/90-day/forever retention and `text-only`, `attachments`, or `full-media` storage modes.

Images are recompressed lossy only when they exceed 1 MiB. Oversized videos are transcoded to WebM when the browser supports `captureStream()`/`MediaRecorder` and are capped at 2 MiB; otherwise the upload is rejected instead of being stored as a large original. Voice recording targets low-bitrate Opus/WebM audio and is capped at 1 MiB. Other attachments are capped at 2 MiB rather than silently being modified.

## Diagnostics

System Monitor now includes Storage Manager: Cache Storage is enumerated, local/session storage are directly measured, IndexedDB database names are listed when exposed, and total origin usage comes from `navigator.storage.estimate()`. Browser APIs do not expose exact per-IndexedDB-database byte counts, so that bucket is shown as an estimated remainder.

## Performance

Low Power Mode (and automatic low-power detection for Data Saver / low-memory / low-core devices) disables CRT/shadows/marquee animation, uses visibility-aware background timers, pauses nonessential hidden applets, avoids eager image decoding, and uses content-visibility for large grids. Chat presence and manifest polling are suppressed while hidden or in low-power mode.

## UI

The desktop now has eight Windows-era themes: Windows 95 Blue, Windows Gray, Windows 98 Teal, Olive Desktop, Plum Desktop, DOS Amber, Blue-Gray NT, and Midnight DOS. Theme packs, desktop layout save/restore, session layout restoration, and a more hierarchical Start menu are included.

### Browser-specific note

`navigator.storage.estimate()` reports persistent origin storage, not every category of browser-managed cache/temporary disk space. If an OS-level monitor still reports a large change after this patch, System Monitor's bucket view can separate site storage from browser/OS cache accounting.
