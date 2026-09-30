// main.js

const sortToggle = document.getElementById('sort-toggle');
const featuredCard = document.getElementById('featured-card');
const projectGrid = document.getElementById('project-grid');
const statsRow = document.getElementById('stats-row');
const projectHelper = document.getElementById('project-helper');
const searchInput = document.getElementById('search-input');
const statusFilter = document.getElementById('status-filter');
const announcementList = document.getElementById('announcement-list');
const classicList = document.getElementById('classic-list');

const SORT_KEY = 'project-launcher-sort';
const SEARCH_KEY = 'project-launcher-search';
const STATUS_KEY = 'project-launcher-status';
const FAVORITES_KEY = 'project-launcher-favorites-v1';
const RECENTS_KEY = 'project-launcher-recents-v1';
const THEME_KEY = 'project-launcher-theme-v1';
const REDUCED_MOTION_KEY = 'project-launcher-reduced-motion-v1';
const COMPACT_MODE_KEY = 'project-launcher-compact-v1';
const HIGH_CONTRAST_KEY = 'project-launcher-high-contrast-v1';
const LOW_POWER_KEY = 'project-launcher-low-power-v1';
const DESKTOP_LAYOUT_KEY = 'project-launcher-layout-v2';
const CHAT_USERNAME_KEY = 'mqtt_chat_username_v1';
const TRUSTED_ORIGIN = window.location.origin;

function isTrustedSameOriginMessage(event, expectedSource = null) {
  if (event.origin !== TRUSTED_ORIGIN) return false;
  if (expectedSource && event.source !== expectedSource) return false;
  return true;
}

function postToFrame(frame, message) {
  if (frame && frame.contentWindow) frame.contentWindow.postMessage(message, TRUSTED_ORIGIN);
}

let highestZIndex = 1000;

// ===== SITE ACTIVITY / ACTIVE WINDOW SYNC =====
// The browser does not expose the operating-system's active application to web
// pages. This activity layer therefore tracks the site's own floating windows
// and nested iframes, then shares that state with the chatroom.
let activeWindowState = null;

function getFloatingWindowActivityName(win, fallback = "Application") {
  if (!win) return fallback;
  const titleEl = win.querySelector('.applet-win-title');
  const title = titleEl ? titleEl.textContent.trim() : "";
  return win.__activityNameOverride || title || fallback;
}

function getFloatingWindowActivityKind(win) {
  if (!win) return "window";
  return win.dataset.activityKind || "window";
}

function isFloatingWindowVisible(win) {
  return !!win && !win.hidden && !win.classList.contains('minimized');
}

function getTopmostVisibleFloatingWindow(excludeWin = null) {
  const windows = Array.from(document.querySelectorAll('.floating-window'))
    .filter(win => win !== excludeWin && isFloatingWindowVisible(win));

  windows.sort((a, b) => {
    const az = parseInt(a.style.zIndex || "0", 10) || 0;
    const bz = parseInt(b.style.zIndex || "0", 10) || 0;
    return bz - az;
  });

  return windows[0] || null;
}

function sendActivityStateToChat() {
  const chatFrame = document.getElementById('chat-frame');
  const chatWindow = document.getElementById('chat-window');

  if (!chatFrame || !chatFrame.contentWindow) return;

  const chatWindowOpen = isFloatingWindowVisible(chatWindow);
  const activeWindow = activeWindowState ? { ...activeWindowState } : null;

  postToFrame(chatFrame, {
    source: 'parent-shell',
    action: 'activityState',
    activeWindow,
    chatWindowOpen,
    isHomepage: !chatWindowOpen && !activeWindow
  });
}

function setActiveFloatingWindow(win, explicitName = "") {
  if (!win || !isFloatingWindowVisible(win)) return;

  const nextState = {
    id: win.id,
    kind: getFloatingWindowActivityKind(win),
    name: explicitName || getFloatingWindowActivityName(win)
  };

  const changed =
    !activeWindowState ||
    activeWindowState.id !== nextState.id ||
    activeWindowState.kind !== nextState.kind ||
    activeWindowState.name !== nextState.name;

  activeWindowState = nextState;

  if (changed) {
    sendActivityStateToChat();
  }
}

function clearActiveFloatingWindow(win = null) {
  if (win && activeWindowState && activeWindowState.id !== win.id) {
    return;
  }

  const fallback = getTopmostVisibleFloatingWindow(win);

  if (fallback) {
    setActiveFloatingWindow(fallback, getFloatingWindowActivityName(fallback));
    return;
  }

  if (activeWindowState !== null) {
    activeWindowState = null;
    sendActivityStateToChat();
  }
}

function refreshActiveFloatingWindow() {
  if (activeWindowState) {
    const current = document.getElementById(activeWindowState.id);
    if (isFloatingWindowVisible(current)) {
      setActiveFloatingWindow(current, getFloatingWindowActivityName(current));
      return;
    }
  }

  const fallback = getTopmostVisibleFloatingWindow();
  if (fallback) {
    setActiveFloatingWindow(fallback, getFloatingWindowActivityName(fallback));
  } else {
    clearActiveFloatingWindow();
  }
}

function setupActiveWindowTracking() {
  document.addEventListener('mousedown', (event) => {
    const win = event.target.closest ? event.target.closest('.floating-window') : null;

    if (win) {
      if (isFloatingWindowVisible(win)) {
        setActiveFloatingWindow(win, getFloatingWindowActivityName(win));
      }
      return;
    }

    // Clicking the desktop/page itself means there is no active site window.
    // Taskbar/start-menu clicks are intentionally left alone so the button
    // handlers can open/focus their target window immediately afterward.
    if (event.target.closest('.taskbar, #start-menu')) return;

    clearActiveFloatingWindow();
  }, true);
}

function setupActivityMessaging() {
  window.addEventListener('message', (event) => {
    const data = event.data || {};
    if (!isTrustedSameOriginMessage(event)) return;
    if (data.source !== 'arcade-hub') return;

    const arcadeFrame = document.getElementById('arcade-frame');
    const arcadeWindow = document.getElementById('arcade-window');

    if (!arcadeFrame || !arcadeWindow || event.source !== arcadeFrame.contentWindow) return;

    if (data.active === false) {
      arcadeWindow.__activityNameOverride = "";
      if (activeWindowState && activeWindowState.id === arcadeWindow.id) {
        clearActiveFloatingWindow(arcadeWindow);
      }
      return;
    }

    const activityName = typeof data.name === 'string' && data.name.trim()
      ? data.name.trim()
      : 'Arcade Hub';

    arcadeWindow.__activityNameOverride = activityName === 'Arcade Hub' ? "" : activityName;
    setActiveFloatingWindow(arcadeWindow, activityName);
  });
}

const STATUS_META = {
  complete:   { label: 'Complete',      className: 'status--complete',   bucket: 'complete' },
  beta:       { label: 'Beta Release',  className: 'status--beta',       bucket: 'progress' },
  new:        { label: 'NEW!!!',        className: 'status--new',        bucket: 'progress' },
  wipPlayable:{ label: 'WIP-Playable',  className: 'status--wip',        bucket: 'progress' },
  wipBuggy:   { label: 'WIP - Buggy',   className: 'status--buggy',      bucket: 'progress' },
  unfinished: { label: 'Unfinished',    className: 'status--unfinished', bucket: 'progress' },
  legacy:     { label: 'Legacy',        className: 'status--legacy',     bucket: 'legacy' },
  abandoned:  { label: 'Abandoned',     className: 'status--abandoned',  bucket: 'legacy' }
};

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeGet(key) {
  try { return localStorage.getItem(key); } catch (e) { console.warn("Storage restricted."); return null; }
}

function safeSet(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { console.warn("Storage restricted."); }
}

function safeJsonGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (e) {
    return fallback;
  }
}

function safeJsonSet(key, value) {
  safeSet(key, JSON.stringify(value));
}

function devicePrefersLowPower() {
  return !!(navigator.connection?.saveData ||
    (Number.isFinite(navigator.deviceMemory) && navigator.deviceMemory <= 2) ||
    (Number.isFinite(navigator.hardwareConcurrency) && navigator.hardwareConcurrency <= 2));
}

function applyPerformanceMode() {
  const html = document.documentElement;
  const forced = safeGet(LOW_POWER_KEY) === 'true';
  const auto = devicePrefersLowPower();
  html.classList.toggle('auto-low-power', auto);
  html.classList.toggle('low-power', forced || auto);
  return forced || auto;
}

function saveDesktopLayout() {
  const windows = {};
  document.querySelectorAll('.floating-window').forEach(win => {
    windows[win.id] = { hidden: !!win.hidden, minimized: win.classList.contains('minimized'), top: win.style.top || '', left: win.style.left || '', width: win.style.width || '', height: win.style.height || '', right: win.style.right || '', bottom: win.style.bottom || '', transform: win.style.transform || '', zIndex: win.style.zIndex || '' };
  });
  safeJsonSet(DESKTOP_LAYOUT_KEY, { version: 2, timestamp: Date.now(), windows });
}

function restoreDesktopLayout() {
  const state = safeJsonGet(DESKTOP_LAYOUT_KEY, null);
  if (!state || !state.windows) return;
  Object.entries(state.windows).forEach(([id, saved]) => {
    const win = document.getElementById(id);
    if (!win || !saved) return;
    ['top','left','width','height','right','bottom','transform'].forEach(prop => { if (saved[prop] !== undefined) win.style[prop] = saved[prop]; });
    if (saved.zIndex) win.style.zIndex = saved.zIndex;
    if (saved.hidden === false) { win.hidden = false; win.classList.toggle('minimized', !!saved.minimized); }
  });
}

function exportThemePack() {
  return { format:'games-hub-theme-pack', version:1, theme:safeGet(THEME_KEY) || 'win95-blue', reducedMotion:safeGet(REDUCED_MOTION_KEY)==='true', compactMode:safeGet(COMPACT_MODE_KEY)==='true', highContrast:safeGet(HIGH_CONTRAST_KEY)==='true', lowPower:safeGet(LOW_POWER_KEY)==='true', crt:safeGet('project-launcher-no-crt') !== 'true' };
}

function importThemePack(pack) {
  if (!pack || pack.format !== 'games-hub-theme-pack') return false;
  const themes = new Set(['win95-blue','windows-gray','win98-teal','olive','plum','dos-amber','blue-gray-nt','midnight-dos','classic','gray','midnight']);
  if (!themes.has(pack.theme)) return false;
  const theme = pack.theme === 'classic' ? 'win95-blue' : pack.theme === 'gray' ? 'windows-gray' : pack.theme === 'midnight' ? 'midnight-dos' : pack.theme;
  safeSet(THEME_KEY, theme); safeSet(REDUCED_MOTION_KEY, String(!!pack.reducedMotion)); safeSet(COMPACT_MODE_KEY, String(!!pack.compactMode)); safeSet(HIGH_CONTRAST_KEY, String(!!pack.highContrast)); safeSet(LOW_POWER_KEY, String(!!pack.lowPower)); safeSet('project-launcher-no-crt', pack.crt === false ? 'true' : 'false');
  applySavedAppearance(); return true;
}

function isFavorite(url) {
  return Array.isArray(favorites) && favorites.includes(url);
}

function toggleFavorite(url) {
  const next = isFavorite(url) ? favorites.filter(item => item !== url) : [...favorites, url];
  favorites = next.slice(-100);
  safeJsonSet(FAVORITES_KEY, favorites);
  renderFeatured();
  renderProjects();
}

function addRecentProject(url, title, type = 'Game') {
  if (!url) return;
  const entry = { url, title: title || 'Project', type, timestamp: Date.now() };
  recentProjects = [entry, ...(Array.isArray(recentProjects) ? recentProjects : []).filter(item => item && item.url !== url)].slice(0, 12);
  safeJsonSet(RECENTS_KEY, recentProjects);
}

function getStatusMeta(statusKey) {
  return STATUS_META[statusKey] || { label: statusKey, className: 'status--legacy', bucket: 'legacy' };
}

function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

let sortMode = safeGet(SORT_KEY) || 'default';
let searchTerm = safeGet(SEARCH_KEY) || '';
let statusValue = safeGet(STATUS_KEY) || 'all';
let projectViewMode = 'all';
let favorites = safeJsonGet(FAVORITES_KEY, []);
let recentProjects = safeJsonGet(RECENTS_KEY, []);
let deferredInstallPrompt = null;

if (searchInput) searchInput.value = searchTerm;
if (statusFilter) statusFilter.value = statusValue;

// ===== INJECT DYNAMIC SITE DATA =====
function renderSiteData() {
  document.getElementById('site-version').textContent = siteData.version;
  document.getElementById('top-banner-text').textContent = `✦ MADE BY ${siteData.author} ✦ ${siteData.location} ✦`;
  document.getElementById('hero-title').textContent = siteData.heroTitle;
  document.getElementById('hero-copy').innerHTML = siteData.heroCopy;
  document.getElementById('hero-note').innerHTML = siteData.heroNote;
  document.getElementById('marquee-text').innerHTML = siteData.marqueeText;
  document.getElementById('footer-copyright').textContent = siteData.footerCopyright;
  document.getElementById('footer-updated').textContent = `Last updated: ${siteData.footerLastUpdated}`;
}

// ===== SAFE TEMPLATE RENDER LISTS =====
function renderAnnouncements() {
  const template = document.getElementById('announcement-template');
  if (!template) return;
  
  announcementList.innerHTML = '';
  announcements.forEach(a => {
    const clone = template.content.cloneNode(true);
    clone.querySelector('h3').textContent = a.title;
    clone.querySelector('p').innerHTML = a.content;
    announcementList.appendChild(clone);
  });
}

function renderClassics() {
  if (classics.length === 0) return;
  const template = document.getElementById('classic-template');
  if (!template) return;

  classicList.innerHTML = '';
  classics.forEach(c => {
    const clone = template.content.cloneNode(true);
    const link = clone.querySelector('a');
    link.href = c.url;
    link.setAttribute('aria-label', `Play ${c.title}`);
    
    const img = clone.querySelector('img');
    img.src = c.image;
    img.alt = c.alt;
    img.onerror = function() { this.src = 'images/missing.png'; };
    
    clone.querySelector('h3').textContent = c.title;
    classicList.appendChild(clone);
  });
}

function renderStats() {
  const complete = projects.filter(p => p.statusKey === 'complete').length;
  const inProgress = projects.filter(p => ['beta', 'new', 'wipPlayable', 'wipBuggy', 'unfinished'].includes(p.statusKey)).length;
  document.getElementById('stat-projects').textContent = projects.length;
  document.getElementById('stat-complete').textContent = complete;
  document.getElementById('stat-progress').textContent = inProgress;
  document.getElementById('stat-classics').textContent = classics.length;
}

function renderFeatured() {
  const featured = projects.find(project => project.featured) || projects[0];
  if (!featured) return;
  const status = getStatusMeta(featured.statusKey);
  featuredCard.innerHTML = `
    <div class="featured-media">
      <img src="${featured.image}" alt="${esc(featured.alt)} featured preview" loading="eager" onerror="this.src='images/missing.png';" />
    </div>
    <div class="featured-content">
      <span class="status ${status.className}">${esc(status.label)}</span>
      <h3>${esc(featured.title)}</h3>
      <p>${esc(featured.description)}</p>
      <div class="featured-meta">${featured.tags.map(tag => `<span class="tag ${tag.includes('Top Pick') ? 'tag--featured' : ''}">${esc(tag)}</span>`).join('')}</div>
      <a class="play-btn" href="${featured.url}" target="_blank" rel="noopener noreferrer" aria-label="Play ${esc(featured.title)}" style="font-family: 'W95FA', 'MS Sans Serif', sans-serif !important;">Launch</a>
      <button type="button" class="card-tool-btn favorite-project-btn" data-url="${esc(featured.url)}" aria-label="${isFavorite(featured.url) ? 'Remove from favorites' : 'Add to favorites'}" aria-pressed="${isFavorite(featured.url) ? 'true' : 'false'}">${isFavorite(featured.url) ? '★' : '☆'}</button>
      <button type="button" class="card-tool-btn copy-project-btn" data-url="${esc(new URL(featured.url, window.location.href).href)}" data-title="${esc(featured.title)}" aria-label="Copy project link">Copy</button>
    </div>
  `;
}

function sortedProjects() {
  const featured = projects.find(project => project.featured);
  const others = projects.filter(project => !project.featured);
  if (sortMode === 'type') {
    others.sort((a, b) => a.type.localeCompare(b.type) || a.title.localeCompare(b.title));
  }
  return featured ? [featured, ...others] : others;
}

function projectMatches(project) {
  const term = searchTerm.trim().toLowerCase();
  const statusMatch = statusValue === 'all' || project.statusKey === statusValue;
  const searchMatch = !term || [project.title, project.type, getStatusMeta(project.statusKey).label, project.description, ...(project.tags || [])].join(' ').toLowerCase().includes(term);
  return statusMatch && searchMatch;
}

function filteredProjects() {
  return sortedProjects().filter(project => {
    if (project.featured) return false;
    if (!projectMatches(project)) return false;
    if (projectViewMode === 'favorites' && !isFavorite(project.url)) return false;
    if (projectViewMode === 'recent') {
      const recentUrls = new Set((Array.isArray(recentProjects) ? recentProjects : []).map(item => item && item.url).filter(Boolean));
      if (!recentUrls.has(project.url)) return false;
    }
    return true;
  });
}

function featuredMatchesFilters() {
  const featured = projects.find(project => project.featured);
  return featured ? projectMatches(featured) : false;
}

function updateHelperText(count) {
  const total = projects.filter(p => !p.featured).length;
  const modeText = sortMode === 'type' ? 'Sorted alphabetically by project type.' : 'Kept in curated order.';
  const filterText = [];
  if (searchTerm.trim()) filterText.push(`Search: ${searchTerm.trim()}`);
  if (statusValue !== 'all') filterText.push(`Status: ${getStatusMeta(statusValue).label}`);
  const viewText = projectViewMode === 'favorites' ? 'Favorites only.' : projectViewMode === 'recent' ? 'Recently launched.' : '';
  const featuredNote = featuredMatchesFilters() ? ' Featured project matches your current search and filter and is shown above.' : '';
  projectHelper.textContent = `${modeText} ${viewText} ${filterText.length ? filterText.join(' · ') + ' · ' : ''}${count} of ${total} projects shown.${featuredNote}`;
}

function renderProjects() {
  const items = filteredProjects();
  const template = document.getElementById('project-template');
  
  projectGrid.innerHTML = '';
  
  if (items.length && template) {
    items.forEach(project => {
      const clone = template.content.cloneNode(true);
      const status = getStatusMeta(project.statusKey);
      
      const img = clone.querySelector('.card-image img');
      img.src = project.image;
      img.alt = project.alt;
      img.onerror = function() { this.src = 'images/missing.png'; };
      
      const statusSpan = clone.querySelector('.status');
      statusSpan.className = `status ${status.className}`;
      statusSpan.textContent = status.label;
      
      clone.querySelector('.card-top .tag').textContent = project.type;
      clone.querySelector('h3').textContent = project.title;
      clone.querySelector('p').textContent = project.description;
      
      const tagsWrapper = clone.querySelector('.tags');
      tagsWrapper.innerHTML = '';
      project.tags.forEach(tag => {
        const span = document.createElement('span');
        span.className = `tag ${tag.includes('Top Pick') ? 'tag--featured' : tag === 'Under development' ? 'tag--dev' : ''}`;
        span.textContent = tag;
        tagsWrapper.appendChild(span);
      });
      
      const playBtn = clone.querySelector('.play-btn');
      playBtn.href = project.url;
      playBtn.setAttribute('aria-label', `Play ${project.title}`);

      const favoriteBtn = clone.querySelector('.favorite-project-btn');
      if (favoriteBtn) {
        favoriteBtn.dataset.url = project.url;
        favoriteBtn.setAttribute('aria-pressed', isFavorite(project.url) ? 'true' : 'false');
        favoriteBtn.setAttribute('aria-label', isFavorite(project.url) ? `Remove ${project.title} from favorites` : `Add ${project.title} to favorites`);
        favoriteBtn.textContent = isFavorite(project.url) ? '★' : '☆';
      }

      const copyBtn = clone.querySelector('.copy-project-btn');
      if (copyBtn) {
        copyBtn.dataset.url = new URL(project.url, window.location.href).href;
        copyBtn.dataset.title = project.title;
      }
      
      projectGrid.appendChild(clone);
    });
  } else {
    projectGrid.innerHTML = `
      <div class="announcement-item no-matches">
        <h3>No matches found</h3>
        <p>Try a different search term or clear the status filter.</p>
      </div>
    `;
  }
  
  sortToggle.textContent = sortMode === 'type' ? 'Sort: type' : 'Sort by type';
  sortToggle.setAttribute('aria-pressed', sortMode === 'type' ? 'true' : 'false');
  updateHelperText(items.length);
}

// ===== WINDOW MANAGER UTILS =====
function updateCRTState() {
  const anyMaximized = document.querySelectorAll('.app-window.maximized:not([hidden]):not(.minimized)').length > 0;
  if (anyMaximized) {
    document.documentElement.classList.add('temp-no-crt');
  } else {
    document.documentElement.classList.remove('temp-no-crt');
  }
}

// ===== IN-PAGE WINDOW BUTTONS (FOR REGULAR PAGE PANELS) =====
function setupWindowButtons() {
  document.querySelectorAll('.page-shell .btn-minimize').forEach((btn) => {
    const panel = btn.closest('.panel') || btn.closest('.panel-dark');
    if (panel && panel.id !== 'ping-banner') {
      btn.addEventListener('click', () => {
        panel.classList.toggle('minimized');
      });
    }
  });

  document.querySelectorAll('.page-shell .btn-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const panel = e.target.closest('.panel') || e.target.closest('.panel-dark');
      if (panel) {
        panel.style.display = 'none';
        panel.classList.remove('minimized');
      }
    });
  });
}

// ===== DRAGGABLE & RESIZABLE FLOATING WINDOW ENGINE =====
function makeWindowDraggableAndResizable(win) {
  const titleBar = win.querySelector('.panel-title-bar');
  const iframe = win.querySelector('iframe');

  win.addEventListener('mousedown', () => {
    setActiveFloatingWindow(win, getFloatingWindowActivityName(win));

    if (!win.classList.contains('maximized')) {
      highestZIndex++;
      win.style.zIndex = highestZIndex;
    }
  });

  const directions = ['e', 's', 'w', 'se', 'sw'];
  directions.forEach(dir => {
    let handle = win.querySelector(`.win-resize-handle-${dir}`);
    if (!handle) {
      handle = document.createElement('div');
      handle.className = `win-resize-handle win-resize-handle-${dir}`;
      win.appendChild(handle);
    }

    let isResizing = false;
    let startX, startY, startW, startH, startLeft, startTop;

    const startResize = (e) => {
      if (win.classList.contains('maximized')) return;
      e.stopPropagation();
      if (e.cancelable) e.preventDefault();
      isResizing = true;

      const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

      startX = clientX;
      startY = clientY;

      const rect = win.getBoundingClientRect();
      startW = rect.width;
      startH = rect.height;
      startLeft = rect.left;
      startTop = rect.top;

      win.style.left = startLeft + 'px';
      win.style.top = startTop + 'px';
      win.style.right = 'auto';
      win.style.bottom = 'auto';

      if (iframe) iframe.style.pointerEvents = 'none';
      highestZIndex++;
      win.style.zIndex = highestZIndex;

      document.addEventListener('mousemove', onResize);
      document.addEventListener('mouseup', stopResize);
      document.addEventListener('touchmove', onResize, { passive: false });
      document.addEventListener('touchend', stopResize);
    };

    const onResize = (e) => {
      if (!isResizing) return;
      if (e.cancelable) e.preventDefault();

      const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

      const dx = clientX - startX;
      const dy = clientY - startY;

      const minW = 280;
      const minH = 200;

      if (dir.includes('e')) win.style.width = Math.max(minW, startW + dx) + 'px';
      if (dir.includes('s')) win.style.height = Math.max(minH, startH + dy) + 'px';
      if (dir.includes('w')) {
        const newW = Math.max(minW, startW - dx);
        if (newW > minW) {
          win.style.width = newW + 'px';
          win.style.left = (startLeft + dx) + 'px';
        }
      }
    };

    const stopResize = () => {
      if (!isResizing) return;
      isResizing = false;
      if (iframe) iframe.style.pointerEvents = 'auto';
      document.removeEventListener('mousemove', onResize);
      document.removeEventListener('mouseup', stopResize);
      document.removeEventListener('touchmove', onResize);
      document.removeEventListener('touchend', stopResize);
    };

    handle.addEventListener('mousedown', startResize);
    handle.addEventListener('touchstart', startResize, { passive: false });
  });

  if (titleBar) {
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    const startDrag = (e) => {
      if (e.target.closest('button')) return;
      if (win.classList.contains('maximized')) return;
      isDragging = true;

      const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

      startX = clientX;
      startY = clientY;

      const rect = win.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      win.style.left = initialLeft + 'px';
      win.style.top = initialTop + 'px';
      win.style.right = 'auto';
      win.style.bottom = 'auto';

      if (iframe) iframe.style.pointerEvents = 'none';
      highestZIndex++;
      win.style.zIndex = highestZIndex;

      document.addEventListener('mousemove', onDrag);
      document.addEventListener('mouseup', stopDrag);
      document.addEventListener('touchmove', onDrag, { passive: false });
      document.addEventListener('touchend', stopDrag);
    };

    const onDrag = (e) => {
      if (!isDragging) return;
      if (e.cancelable) e.preventDefault();

      const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

      const dx = clientX - startX;
      const dy = clientY - startY;

      win.style.left = Math.max(0, Math.min(window.innerWidth - 80, initialLeft + dx)) + 'px';
      win.style.top = Math.max(0, Math.min(window.innerHeight - 30, initialTop + dy)) + 'px';
    };

    const stopDrag = () => {
      if (!isDragging) return;
      isDragging = false;
      if (iframe) iframe.style.pointerEvents = 'auto';
      document.removeEventListener('mousemove', onDrag);
      document.removeEventListener('mouseup', stopDrag);
      document.removeEventListener('touchmove', onDrag);
      document.removeEventListener('touchend', stopDrag);
    };

    titleBar.addEventListener('mousedown', startDrag);
    titleBar.addEventListener('touchstart', startDrag, { passive: false });
  }
}

// ===== UNIVERSAL DYNAMIC APPLET WINDOW CREATOR =====
function createAppletWindow(appletPath, options = {}) {
  const targetSrc = options.isRootPath ? appletPath : (appletPath.startsWith('applets/') ? appletPath : `applets/${appletPath}`);
  const winId = options.id || ('applet-win-' + Math.random().toString(36).substring(2, 9));
  const frameId = options.iframeId || (winId + '-frame');
  const initialTitle = options.title || 'Applet';
  const keepAlive = options.keepAlive || false; // Used to prevent iframe destruction

  const win = document.createElement('div');
  win.id = winId;
  win.className = `app-window panel floating-window ${options.className || ''}`;
  win.dataset.activityKind = options.activityKind || (
    winId === 'chat-window' ? 'chatroom' :
    winId === 'arcade-window' ? 'arcade' :
    winId.startsWith('game-win-') ? 'game' :
    'window'
  );
  win.role = 'dialog';
  win.setAttribute('aria-labelledby', `${winId}-title`);
  win.hidden = options.hidden !== undefined ? options.hidden : true;

  if (options.width) win.style.width = options.width;
  if (options.height) win.style.height = options.height;

  const titleBar = document.createElement('div');
  titleBar.className = 'panel-title-bar';
  titleBar.style.fontFamily = "'W95FA', 'MS Sans Serif', sans-serif";

  const titleGroup = document.createElement('span');
  titleGroup.style.display = 'flex';
  titleGroup.style.alignItems = 'center';

  if (options.icon) {
    const icon = document.createElement('img');
    icon.src = options.icon;
    icon.className = 'win-title-icon';
    icon.alt = '';
    icon.onerror = () => { icon.style.display = 'none'; };
    titleGroup.appendChild(icon);
  }

  const titleSpan = document.createElement('span');
  titleSpan.id = `${winId}-title`;
  titleSpan.className = 'applet-win-title';
  titleSpan.style.fontFamily = "'W95FA', 'MS Sans Serif', sans-serif";
  titleSpan.textContent = initialTitle;
  titleGroup.appendChild(titleSpan);

  const windowButtons = document.createElement('span');
  windowButtons.className = 'win-btns';
  windowButtons.style.display = 'flex';
  windowButtons.style.gap = '4px';

  const makeWindowButton = (className, label, text) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `win-btn ${className}`;
    button.setAttribute('aria-label', label);
    button.textContent = text;
    return button;
  };

  const refreshBtn = makeWindowButton('btn-refresh', 'Refresh', '↻');
  const maxBtn = makeWindowButton('btn-maximize', 'Maximize', '□');
  const closeBtn = makeWindowButton('btn-close', 'Close', '✕');
  windowButtons.append(refreshBtn, maxBtn, closeBtn);
  titleBar.append(titleGroup, windowButtons);

  const body = document.createElement('div');
  body.className = 'app-window-body';

  const iframe = document.createElement('iframe');
  iframe.id = frameId;
  iframe.className = 'app-frame';
  iframe.src = targetSrc;
  iframe.title = initialTitle;
  iframe.loading = keepAlive ? 'eager' : 'lazy';
  iframe.referrerPolicy = 'no-referrer';
  body.appendChild(iframe);

  win.append(titleBar, body);
  document.body.appendChild(win);

  window.addEventListener('blur', () => {
    setTimeout(() => {
      if (document.activeElement === iframe) {
        setActiveFloatingWindow(win, getFloatingWindowActivityName(win));

        if (!win.classList.contains('maximized')) {
          highestZIndex++;
          win.style.zIndex = highestZIndex;
        }
      }
    }, 0);
  });

  iframe.addEventListener('load', () => {
    try {
      if (iframe.contentDocument && iframe.contentDocument.title) {
        const docTitle = iframe.contentDocument.title.trim();
        if (docTitle) {
          titleSpan.textContent = docTitle;
          iframe.title = docTitle;
        }
      }

      if (!win.__activityNameOverride && activeWindowState && activeWindowState.id === win.id) {
        setActiveFloatingWindow(win, getFloatingWindowActivityName(win));
      }

      iframe.contentWindow.addEventListener('focus', () => {
        setActiveFloatingWindow(win, getFloatingWindowActivityName(win));
      });

      iframe.contentWindow.addEventListener('mousedown', () => {
        setActiveFloatingWindow(win, getFloatingWindowActivityName(win));

        if (!win.classList.contains('maximized')) {
          highestZIndex++;
          win.style.zIndex = highestZIndex;
        }
      });

      iframe.contentWindow.addEventListener('touchstart', () => {
        setActiveFloatingWindow(win, getFloatingWindowActivityName(win));

        if (!win.classList.contains('maximized')) {
          highestZIndex++;
          win.style.zIndex = highestZIndex;
        }
      });
    } catch (e) {
      // Cross-origin frames may not allow direct event injection. The parent
      // window's blur/document.activeElement path still handles normal iframe focus.
      if (!win.__activityNameOverride && activeWindowState && activeWindowState.id === win.id) {
        setActiveFloatingWindow(win, getFloatingWindowActivityName(win));
      }
    }
  });

  makeWindowDraggableAndResizable(win);

  let isMaximized = false;
  let savedStyle = { top: '', left: '', width: '', height: '', right: '', bottom: '', transform: '' };

  function toggleMaximize() {
    if (!isMaximized) {
      savedStyle.top = win.style.top;
      savedStyle.left = win.style.left;
      savedStyle.width = win.style.width;
      savedStyle.height = win.style.height;
      savedStyle.right = win.style.right;
      savedStyle.bottom = win.style.bottom;
      savedStyle.transform = win.style.transform;

      win.classList.add('maximized');
      isMaximized = true;
      if (maxBtn) maxBtn.setAttribute('aria-label', 'Restore');
    } else {
      win.classList.remove('maximized');
      win.style.top = savedStyle.top;
      win.style.left = savedStyle.left;
      win.style.width = savedStyle.width;
      win.style.height = savedStyle.height;
      win.style.right = savedStyle.right;
      win.style.bottom = savedStyle.bottom;
      win.style.transform = savedStyle.transform;

      isMaximized = false;
      if (maxBtn) maxBtn.setAttribute('aria-label', 'Maximize');
    }
    updateCRTState();
  }

  // --- TERMINATION AND RELOAD LOGIC ---
  function terminateIframe() {
    if (!keepAlive) {
      iframe.src = 'about:blank'; // Forcefully destroys page memory and audio
    }
  }

  function restoreIframe() {
    if (!keepAlive && iframe.src.includes('about:blank')) {
      iframe.src = targetSrc;
    }
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      iframe.src = 'about:blank'; // Terminate
      setTimeout(() => { iframe.src = targetSrc; }, 50); // Relaunch immediately after GC
    });
  }

  if (maxBtn) {
    maxBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMaximize();
    });
  }

  let triggerBtn = null;
  if (options.triggerBtnId) {
    triggerBtn = document.getElementById(options.triggerBtnId);
  }

  function updateBtnState() {
    if (triggerBtn) {
      const isVisible = !win.hidden && !win.classList.contains('minimized');
      triggerBtn.classList.toggle('active', isVisible);
      triggerBtn.setAttribute('aria-expanded', isVisible ? 'true' : 'false');
    }
  }

  function openWin() {
    restoreIframe(); // Boots the app if it was closed previously
    win.hidden = false;
    win.classList.remove('minimized');
    highestZIndex++;
    win.style.zIndex = highestZIndex;
    setActiveFloatingWindow(win, getFloatingWindowActivityName(win));
    updateBtnState();
    updateCRTState();
  }

  function closeWin() {
    win.hidden = true;
    win.classList.remove('minimized');
    terminateIframe(); // Kills audio and resources, unless keepAlive is true

    if (activeWindowState && activeWindowState.id === win.id) {
      clearActiveFloatingWindow(win);
    } else {
      sendActivityStateToChat();
    }

    updateBtnState();
    updateCRTState();
  }

  function minimizeWin() {
    // Normal mode keeps hidden applets alive; Low Power Mode pauses non-essential iframes.
    win.classList.add('minimized');
    win.hidden = true;
    if (document.documentElement.classList.contains('low-power') && !keepAlive) terminateIframe();

    if (activeWindowState && activeWindowState.id === win.id) {
      clearActiveFloatingWindow(win);
    } else {
      sendActivityStateToChat();
    }

    updateBtnState();
    updateCRTState();
  }

  function toggleWin() {
    if (win.hidden || win.classList.contains('minimized')) {
      openWin();
    } else {
      const currentZ = parseInt(win.style.zIndex || "0", 10) || 0;

      if (currentZ < highestZIndex) {
        highestZIndex++;
        win.style.zIndex = highestZIndex;
        setActiveFloatingWindow(win, getFloatingWindowActivityName(win));
      } else {
        minimizeWin();
      }
    }
  }

  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeWin();
  });

  if (triggerBtn) {
    triggerBtn.addEventListener('click', toggleWin);
    triggerBtn.setAttribute('aria-expanded', 'false');
  }

  return { win, iframe, open: openWin, close: closeWin, minimize: minimizeWin, toggle: toggleWin, toggleMaximize: toggleMaximize };
}

// ===== UNIVERSAL GAME WINDOW LAUNCHER =====
const activeGameWindows = {};

function openGameWindow(url, title) {
  addRecentProject(url, title, 'Game');
  if (activeGameWindows[url]) {
    activeGameWindows[url].open();
  } else {
    const slug = url.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const winObj = createAppletWindow(url, {
      id: 'game-win-' + slug,
      title: title,
      className: 'arcade-window',
      activityKind: 'game',
      isRootPath: true,
      keepAlive: false // Games will terminate when closed to stop audio
    });
    activeGameWindows[url] = winObj;
    winObj.open();
  }
}

function setupGameLaunchers() {
  document.addEventListener('click', (e) => {
    const playBtn = e.target.closest('.play-btn');
    if (playBtn) {
      e.preventDefault();
      const url = playBtn.getAttribute('href');
      if (!url) return;
      const card = playBtn.closest('.project-card, .featured-card');
      const title = card && card.querySelector('h3') ? card.querySelector('h3').textContent.trim() : 'Game';
      openGameWindow(url, title);
    }

    const classicItem = e.target.closest('.classic-item');
    if (classicItem) {
      e.preventDefault();
      const url = classicItem.getAttribute('href');
      if (!url) return;
      const title = classicItem.querySelector('h3') ? classicItem.querySelector('h3').textContent.trim() : 'Classic Game';
      openGameWindow(url, title);
    }
  });
}

// ===== TASKBAR & APPLETS INITIALIZATION =====
function setupAppletsAndFloatingWindows() {
  createAppletWindow('games.html', {
    id: 'arcade-window',
    iframeId: 'arcade-frame',
    className: 'arcade-window',
    activityKind: 'arcade',
    triggerBtnId: 'arcade-launcher-btn',
    isRootPath: true,
    title: 'Arcade Hub',
    keepAlive: false // Arcade hub can be terminated and reloaded safely
  });

  createAppletWindow('chatroom.html', {
    id: 'chat-window',
    iframeId: 'chat-frame',
    className: 'chat-window',
    activityKind: 'chatroom',
    triggerBtnId: 'chat-launcher-btn',
    icon: 'images/icons/chatroom.png',
    title: 'Chatroom',
    keepAlive: true // CRITICAL: Exempts chat from termination so it receives pings while closed
  });

  createAppletWindow('paint.html', {
    id: 'paint-window',
    iframeId: 'paint-frame',
    triggerBtnId: 'taskbar-paint-btn',
    icon: 'images/icons/paint.png',
    keepAlive: false
  });

  createAppletWindow('weather.html', {
    id: 'weather-window',
    iframeId: 'weather-frame',
    triggerBtnId: 'taskbar-weather-btn',
    icon: 'images/icons/weather.png',
    keepAlive: false
  });

  createAppletWindow('notes.html', {
    id: 'notes-window',
    iframeId: 'notes-frame',
    triggerBtnId: 'taskbar-notes-btn',
    icon: 'images/icons/notes.png',
    keepAlive: false
  });

  createAppletWindow('calculator.html', {
    id: 'calculator-window',
    iframeId: 'calculator-frame',
    triggerBtnId: 'taskbar-calculator-btn',
    icon: 'images/icons/calculator.png',
    keepAlive: false
  });

  createAppletWindow('clock.html', {
    id: 'clock-window',
    iframeId: 'clock-frame',
    triggerBtnId: 'taskbar-clock-btn',
    icon: 'images/icons/clock.png',
    keepAlive: false
  });

  createAppletWindow('web_proxy_browser_applet.html', {
    id: 'browser-window',
    iframeId: 'browser-frame',
    triggerBtnId: 'taskbar-browser-btn',
    title: 'Web Browser',
    width: 'min(900px, calc(100vw - 36px))',
    height: 'min(620px, calc(100vh - 110px))',
    keepAlive: false
  });

  createAppletWindow('control-panel.html', {
    id: 'control-panel-window',
    iframeId: 'control-panel-frame',
    triggerBtnId: 'taskbar-control-btn',
    title: 'Control Panel',
    width: 'min(760px, calc(100vw - 36px))',
    height: 'min(660px, calc(100vh - 110px))',
    icon: 'images/icon.JPG',
    keepAlive: true
  });

  createAppletWindow('system-monitor.html', {
    id: 'system-monitor-window',
    iframeId: 'system-monitor-frame',
    triggerBtnId: 'taskbar-monitor-btn',
    title: 'System Monitor',
    width: 'min(760px, calc(100vw - 36px))',
    height: 'min(640px, calc(100vh - 110px))',
    keepAlive: true
  });

  createAppletWindow('timer.html', {
    id: 'timer-window',
    iframeId: 'timer-frame',
    triggerBtnId: 'taskbar-timer-btn',
    title: 'Timer',
    width: 'min(460px, calc(100vw - 36px))',
    height: 'min(520px, calc(100vh - 110px))',
    keepAlive: true
  });

  createAppletWindow('changelog.txt', {
    id: 'changelog-window',
    iframeId: 'changelog-frame',
    triggerBtnId: 'changelog-btn',
    title: 'Site Changelog',
    width: 'min(760px, calc(100vw - 36px))',
    height: 'min(600px, calc(100vh - 110px))',
    keepAlive: false,
    isRootPath: true
  });
}

// ===== START MENU =====
function setupStartMenu() {
  const startBtn = document.getElementById('taskbar-start-btn');
  const startMenu = document.getElementById('start-menu');
  
  if (!startBtn || !startMenu) return;

  startBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = window.getComputedStyle(startMenu).display === 'none';
    startMenu.style.display = isHidden ? 'flex' : 'none';
  });

  document.addEventListener('click', (e) => {
    if (!startMenu.contains(e.target) && e.target !== startBtn) {
      startMenu.style.display = 'none';
    }
  });

  startMenu.querySelectorAll('.start-item').forEach(item => {
    item.addEventListener('click', () => {
      startMenu.style.display = 'none';
      const command = item.dataset.command;
      if (command === 'Control Panel') document.getElementById('taskbar-control-btn')?.click();
      else if (command === 'System Monitor') document.getElementById('taskbar-monitor-btn')?.click();
      else if (command === 'Timer') document.getElementById('taskbar-timer-btn')?.click();
      else if (command === 'Keyboard Shortcuts') showShortcutToast();
    });
  });
}

// ===== VISITOR COUNTER =====
function setupVisitorCounter() {
  try {
    const KEY = 'colton-launcher-visits';
    const SESSION_KEY = 'colton-launcher-session';
    const rawCount = safeGet(KEY);
    
    let count = (rawCount && !isNaN(rawCount)) ? parseInt(rawCount, 10) : 0;
    
    let hasSession = false;
    try { hasSession = sessionStorage.getItem(SESSION_KEY) === '1'; } catch (e) {}
    if (!hasSession) {
      count += 1;
      safeSet(KEY, count);
      try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (e) {}
    }
    
    const el = document.getElementById('visit-count');
    if (el) el.textContent = String(count).padStart(6, '0');
  } catch(e) {
    const el = document.getElementById('visit-count');
    if (el) el.textContent = '000001';
  }
}

// ===== CRT TOGGLE BUTTON FEATURE =====
function setupCRTToggle() {
  const crtToggleBtn = document.getElementById('crt-toggle-btn');
  if (!crtToggleBtn) return;

  if (safeGet('project-launcher-no-crt') === 'true') {
    document.documentElement.classList.add('no-crt');
  }

  crtToggleBtn.addEventListener('click', () => {
    const isNoCrt = document.documentElement.classList.toggle('no-crt');
    safeSet('project-launcher-no-crt', isNoCrt ? 'true' : 'false');
  });
}

// ===== LIVE DESKTOP TASKBAR CLOCK MOUNT =====
function updateTaskbarClock() {
  const now = new Date();
  
  const timeOptions = {
    timeZone: 'America/Chicago',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  
  const dateOptions = {
    timeZone: 'America/Chicago',
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  };

  const clockEl = document.getElementById('taskbar-clock');
  const dateEl = document.getElementById('taskbar-date');

  if (clockEl) clockEl.textContent = now.toLocaleTimeString('en-US', timeOptions);
  if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', dateOptions);
}

// ===== CHATROOM WIDGET =====
function setupChatWidget() {
  const launcherBtn = document.getElementById('chat-launcher-btn');
  const pendingDot = document.getElementById('chat-pending-dot');
  const chatWindow = document.getElementById('chat-window');
  const chatFrame = document.getElementById('chat-frame');
  const onlineCountEl = document.getElementById('online-count');

  if (!launcherBtn || !chatWindow || !chatFrame) return;

  function sendWindowStateToFrame(isOpen) {
    if (chatFrame && chatFrame.contentWindow) {
      postToFrame(chatFrame, {
        source: 'parent-shell',
        action: isOpen ? 'chatWindowOpened' : 'chatWindowClosed',
        activeWindow: activeWindowState ? { ...activeWindowState } : null,
        chatWindowOpen: isOpen,
        isHomepage: !isOpen && !activeWindowState
      });

      sendActivityStateToChat();
    }
  }

  function windowIsVisibleAndOpen() {
    return !chatWindow.hidden && !chatWindow.classList.contains('minimized');
  }

  function setPendingDot(show) {
    if (pendingDot) pendingDot.hidden = !show;
  }

  launcherBtn.addEventListener('click', () => {
    const isOpen = windowIsVisibleAndOpen();
    launcherBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    if (isOpen) setPendingDot(false);
    sendWindowStateToFrame(isOpen);
  });

  chatFrame.addEventListener('load', () => {
    sendWindowStateToFrame(windowIsVisibleAndOpen());
  });

  window.addEventListener('message', (event) => {
    const data = event.data || {};
    if (!isTrustedSameOriginMessage(event, chatFrame.contentWindow)) return;
    if (data.source !== 'universal-chat') return;

    if (data.kind === 'activityRequest') {
      sendActivityStateToChat();
      return;
    }

    if (data.kind === 'presence') {
      if (onlineCountEl) onlineCountEl.textContent = String(data.count);
    } else if (data.kind === 'unread') {
      if (!windowIsVisibleAndOpen()) {
        setPendingDot(true);
      }
    } else if (data.kind === 'ping') {
      showPingBanner(data.text);
    }
  });
}

let pingBannerHideTimer = null;

function hidePingBanner() {
  const banner = document.getElementById('ping-banner');
  if (!banner) return;
  banner.style.top = '-140px';
  clearTimeout(pingBannerHideTimer);
  pingBannerHideTimer = null;
}

function showPingBanner(text) {
  const banner = document.getElementById('ping-banner');
  const bannerText = document.getElementById('ping-banner-text');
  if (!banner || !bannerText) return;

  bannerText.textContent = text;
  banner.style.top = '10px';

  // Reset the auto-dismiss timer so a fresh ping always gets its own full 3s.
  clearTimeout(pingBannerHideTimer);
  pingBannerHideTimer = setTimeout(hidePingBanner, 3000);
}

function setupPingBannerDismiss() {
  const banner = document.getElementById('ping-banner');
  if (!banner) return;
  banner.addEventListener('click', hidePingBanner);
}

function setupToSModal() {
  const tosOverlay = document.getElementById("tos-modal-overlay");
  const acceptBtn = document.getElementById("tos-accept-btn");

  if (!tosOverlay || !acceptBtn) return;

  if (!safeGet("tosAccepted")) {
    tosOverlay.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  acceptBtn.addEventListener("click", () => {
    safeSet("tosAccepted", "true");
    tosOverlay.style.display = "none";
    document.body.style.overflow = "auto";
  });
}


// ===== V4 UX / CONVENIENCE LAYER =====
function applySavedAppearance() {
  const html = document.documentElement;
  const theme = safeGet(THEME_KEY) || 'win95-blue';
  html.dataset.theme = theme;
  html.classList.toggle('reduced-motion', safeGet(REDUCED_MOTION_KEY) === 'true');
  html.classList.toggle('compact-mode', safeGet(COMPACT_MODE_KEY) === 'true');
  html.classList.toggle('high-contrast', safeGet(HIGH_CONTRAST_KEY) === 'true');
  applyPerformanceMode();
}

function persistAppearanceSetting(key, value) {
  safeSet(key, String(value));
  applySavedAppearance();
}

function setupNetworkStatus() {
  const el = document.getElementById('network-status');
  if (!el) return;
  const paint = () => {
    const online = navigator.onLine;
    el.textContent = online ? 'NETWORK: ONLINE' : 'NETWORK: OFFLINE';
    el.classList.toggle('network-status--offline', !online);
    el.classList.toggle('network-status--online', online);
    el.title = online ? 'Browser reports an online connection.' : 'Browser reports no network connection. Local apps may still work.';
  };
  window.addEventListener('online', paint);
  window.addEventListener('offline', paint);
  paint();
}

function openCommandPalette(initialQuery = '') {
  const overlay = document.getElementById('command-palette');
  const input = document.getElementById('command-palette-input');
  if (!overlay || !input) return;
  overlay.hidden = false;
  input.value = initialQuery;
  input.focus();
  renderCommandPaletteResults();
}

function closeCommandPalette() {
  const overlay = document.getElementById('command-palette');
  if (overlay) overlay.hidden = true;
}

function commandPaletteCommands() {
  const commands = [
    { name: 'Home', keywords: 'home launcher desktop', action: () => document.getElementById('hero-title-anchor')?.scrollIntoView() },
    { name: 'Announcements', keywords: 'news updates announcements', action: () => document.getElementById('announcements-anchor')?.scrollIntoView() },
    { name: 'Featured Game', keywords: 'featured game launch', action: () => document.getElementById('featured-anchor')?.scrollIntoView() },
    { name: 'Project Library', keywords: 'games projects library', action: () => document.getElementById('projects-anchor')?.scrollIntoView() },
    { name: 'Classic Games', keywords: 'classic retro games', action: () => document.getElementById('classic-anchor')?.scrollIntoView() },
    { name: 'Control Panel', keywords: 'settings preferences theme crt appearance', action: () => document.getElementById('taskbar-control-btn')?.click() },
    { name: 'System Monitor', keywords: 'performance fps cpu memory network storage diagnostics', action: () => document.getElementById('taskbar-monitor-btn')?.click() },
    { name: 'Timer', keywords: 'countdown stopwatch alarm timer', action: () => document.getElementById('taskbar-timer-btn')?.click() },
    { name: 'Chatroom', keywords: 'chat messages dm community', action: () => document.getElementById('chat-launcher-btn')?.click() },
    { name: 'Arcade Hub', keywords: 'arcade web games repository', action: () => document.getElementById('arcade-launcher-btn')?.click() },
    { name: 'Web Browser', keywords: 'browser web proxy internet', action: () => document.getElementById('taskbar-browser-btn')?.click() },
    { name: 'Paint', keywords: 'paint drawing canvas', action: () => document.getElementById('taskbar-paint-btn')?.click() },
    { name: 'Weather', keywords: 'weather forecast', action: () => document.getElementById('taskbar-weather-btn')?.click() },
    { name: 'Notes', keywords: 'notes scratchpad writing', action: () => document.getElementById('taskbar-notes-btn')?.click() },
    { name: 'Calculator', keywords: 'calculator math', action: () => document.getElementById('taskbar-calculator-btn')?.click() },
    { name: 'Clock', keywords: 'clock time', action: () => document.getElementById('taskbar-clock-btn')?.click() },
    { name: 'Toggle CRT', keywords: 'crt scanlines visual effects', action: () => document.getElementById('crt-toggle-btn')?.click() },
    { name: 'Toggle Favorites', keywords: 'favorites starred games', action: () => setProjectViewMode(projectViewMode === 'favorites' ? 'all' : 'favorites') },
    { name: 'Show Recent Projects', keywords: 'recent history last played', action: () => setProjectViewMode('recent') },
    { name: 'Keyboard Shortcuts', keywords: 'shortcuts hotkeys keyboard help', action: () => showShortcutToast() }
  ];

  for (const project of projects) {
    commands.push({
      name: project.title,
      keywords: `${project.title} ${project.type} ${(project.tags || []).join(' ')}`,
      action: () => openGameWindow(project.url, project.title)
    });
  }
  return commands;
}

let commandPaletteIndex = 0;
function renderCommandPaletteResults() {
  const input = document.getElementById('command-palette-input');
  const results = document.getElementById('command-palette-results');
  if (!input || !results) return;
  const term = input.value.trim().toLowerCase();
  const matches = commandPaletteCommands().filter(command => !term || `${command.name} ${command.keywords}`.toLowerCase().includes(term)).slice(0, 12);
  commandPaletteIndex = Math.min(commandPaletteIndex, Math.max(0, matches.length - 1));
  results.replaceChildren();
  matches.forEach((command, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `command-result${index === commandPaletteIndex ? ' selected' : ''}`;
    button.setAttribute('role', 'option');
    button.setAttribute('aria-selected', index === commandPaletteIndex ? 'true' : 'false');
    button.innerHTML = `<strong>${esc(command.name)}</strong><span>${esc(command.keywords)}</span>`;
    button.addEventListener('click', () => { closeCommandPalette(); command.action(); });
    results.appendChild(button);
  });
  if (!matches.length) {
    const empty = document.createElement('div');
    empty.className = 'command-empty';
    empty.textContent = 'No matching commands or games.';
    results.appendChild(empty);
  }
}

function executeSelectedCommand() {
  const input = document.getElementById('command-palette-input');
  if (!input) return;
  const term = input.value.trim().toLowerCase();
  const matches = commandPaletteCommands().filter(command => !term || `${command.name} ${command.keywords}`.toLowerCase().includes(term)).slice(0, 12);
  const selected = matches[commandPaletteIndex] || matches[0];
  if (!selected) return;
  closeCommandPalette();
  selected.action();
}

function setupCommandPalette() {
  const overlay = document.getElementById('command-palette');
  const input = document.getElementById('command-palette-input');
  const closeBtn = document.getElementById('command-palette-close');
  const openBtn = document.getElementById('command-palette-btn');
  if (!overlay || !input) return;

  openBtn?.addEventListener('click', () => openCommandPalette());
  closeBtn?.addEventListener('click', closeCommandPalette);
  overlay.addEventListener('click', event => { if (event.target === overlay) closeCommandPalette(); });
  input.addEventListener('input', () => { commandPaletteIndex = 0; renderCommandPaletteResults(); });
  input.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const results = document.querySelectorAll('.command-result');
      if (!results.length) return;
      commandPaletteIndex = event.key === 'ArrowDown'
        ? Math.min(commandPaletteIndex + 1, results.length - 1)
        : Math.max(commandPaletteIndex - 1, 0);
      renderCommandPaletteResults();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      executeSelectedCommand();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeCommandPalette();
    }
  });
  document.addEventListener('keydown', event => {
    const tag = document.activeElement?.tagName;
    const inEditable = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || document.activeElement?.isContentEditable;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      openCommandPalette();
      return;
    }
    if (!inEditable && event.key === '/' && overlay.hidden) {
      event.preventDefault();
      openCommandPalette();
    }
    if (event.key === 'Escape' && !overlay.hidden) closeCommandPalette();
  });
}

function showShortcutToast() {
  showGlobalToast('Shortcuts: Ctrl+K = Quick Launch · / = Quick Launch · Esc = close windows/dialogs');
}

let toastTimer;
function showGlobalToast(message) {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.className = 'global-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3600);
}

function setProjectViewMode(mode) {
  projectViewMode = ['all','favorites','recent'].includes(mode) ? mode : 'all';
  document.getElementById('favorites-toggle')?.setAttribute('aria-pressed', projectViewMode === 'favorites' ? 'true' : 'false');
  document.getElementById('recent-toggle')?.setAttribute('aria-pressed', projectViewMode === 'recent' ? 'true' : 'false');
  const fav = document.getElementById('favorites-toggle');
  if (fav) fav.textContent = projectViewMode === 'favorites' ? '★ Favorites' : '☆ Favorites';
  renderProjects();
}

function setupProjectTools() {
  document.getElementById('favorites-toggle')?.addEventListener('click', () => setProjectViewMode(projectViewMode === 'favorites' ? 'all' : 'favorites'));
  document.getElementById('recent-toggle')?.addEventListener('click', () => setProjectViewMode(projectViewMode === 'recent' ? 'all' : 'recent'));
  document.getElementById('clear-project-filters')?.addEventListener('click', () => {
    projectViewMode = 'all';
    searchTerm = '';
    statusValue = 'all';
    safeSet(SEARCH_KEY, '');
    safeSet(STATUS_KEY, 'all');
    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = 'all';
    setProjectViewMode('all');
  });
  document.addEventListener('click', async event => {
    const favorite = event.target.closest('.favorite-project-btn');
    if (favorite) {
      event.preventDefault();
      event.stopPropagation();
      toggleFavorite(favorite.dataset.url || '');
      showGlobalToast(isFavorite(favorite.dataset.url || '') ? 'Added to favorites.' : 'Removed from favorites.');
      return;
    }
    const copy = event.target.closest('.copy-project-btn');
    if (copy) {
      event.preventDefault();
      event.stopPropagation();
      const url = copy.dataset.url;
      if (!url) return;
      try {
        await navigator.clipboard.writeText(url);
        showGlobalToast(`Copied link for ${copy.dataset.title || 'project'}.`);
      } catch (error) {
        showGlobalToast('Copy failed. Your browser blocked clipboard access.');
      }
    }
  });
}

function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    showGlobalToast('Install option is available in Control Panel.');
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    showGlobalToast('Games Hub was installed as an app.');
  });
  window.__gamesHubInstall = async () => {
    if (!deferredInstallPrompt) {
      showGlobalToast('Your browser is not offering app installation right now.');
      return false;
    }
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return true;
  };
}

function setupFrameCommands() {
  window.addEventListener('message', event => {
    const data = event.data || {};
    if (!isTrustedSameOriginMessage(event)) return;
    if (data.source === 'control-panel') {
      if (data.action === 'setTheme' && ['classic','gray','midnight'].includes(data.value)) {
        persistAppearanceSetting(THEME_KEY, data.value);
      } else if (data.action === 'setToggle' && [REDUCED_MOTION_KEY, COMPACT_MODE_KEY, HIGH_CONTRAST_KEY].includes(data.key)) {
        persistAppearanceSetting(data.key, Boolean(data.value));
      } else if (data.action === 'resetUi') {
        [THEME_KEY, REDUCED_MOTION_KEY, COMPACT_MODE_KEY, HIGH_CONTRAST_KEY, LOW_POWER_KEY].forEach(key => safeSet(key, key === THEME_KEY ? 'win95-blue' : 'false'));
        applySavedAppearance();
        showGlobalToast('Interface preferences reset.');
      } else if (data.action === 'clearRecents') {
        recentProjects = [];
        safeJsonSet(RECENTS_KEY, recentProjects);
        showGlobalToast('Recent project history cleared.');
      } else if (data.action === 'clearFavorites') {
        favorites = [];
        safeJsonSet(FAVORITES_KEY, favorites);
        renderProjects();
        showGlobalToast('Favorites cleared.');
      } else if (data.action === 'setLowPower') {
        safeSet(LOW_POWER_KEY, String(Boolean(data.value))); applyPerformanceMode();
        showGlobalToast(data.value ? 'Low Power Mode enabled.' : 'Low Power Mode disabled.');
      } else if (data.action === 'exportTheme') {
        const blob = new Blob([JSON.stringify(exportThemePack(), null, 2)], {type:'application/json'});
        const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'games-hub-theme.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 0);
      } else if (data.action === 'importTheme') {
        showGlobalToast(importThemePack(data.value) ? 'Theme pack imported.' : 'Theme pack rejected.');
      } else if (data.action === 'saveLayout') {
        saveDesktopLayout(); showGlobalToast('Desktop layout saved.');
      } else if (data.action === 'restoreLayout') {
        restoreDesktopLayout(); showGlobalToast('Desktop layout restored.');
      } else if (data.action === 'install') {
        window.__gamesHubInstall?.();
      } else if (data.action === 'quickLaunch') {
        openCommandPalette();
      }
    }
  });
}

function setupLandingPerformance() {
  if (document.documentElement.classList.contains('low-power')) return;
  const images = Array.from(document.querySelectorAll('img[loading="lazy"]'));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        if ('decode' in img) img.decode().catch(() => {});
        observer.unobserve(img);
      });
    }, { rootMargin: '240px' });
    images.forEach(img => observer.observe(img));
    return;
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  renderSiteData();
  renderAnnouncements();
  renderClassics();
  renderStats();
  renderFeatured();
  renderProjects();
  setupWindowButtons();
  setupStartMenu();
  setupVisitorCounter();
  setupToSModal();
  setupCRTToggle();
  setupActivityMessaging();
  setupActiveWindowTracking();
  setupAppletsAndFloatingWindows();
  restoreDesktopLayout();
  setupGameLaunchers();
  setupChatWidget();
  setupPingBannerDismiss();
  applySavedAppearance();
  window.addEventListener('beforeunload', saveDesktopLayout);
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveDesktopLayout(); });
  setupNetworkStatus();
  setupCommandPalette();
  setupProjectTools();
  setupInstallPrompt();
  setupFrameCommands();
  setupLandingPerformance();
  updateTaskbarClock();
  let clockTimer = null;
  const syncClockTimer = () => { clearInterval(clockTimer); clockTimer = document.hidden ? null : setInterval(updateTaskbarClock, 1000); };
  document.addEventListener('visibilitychange', syncClockTimer);
  syncClockTimer();
});

if (sortToggle) {
  sortToggle.addEventListener('click', () => {
    sortMode = sortMode === 'type' ? 'default' : 'type';
    safeSet(SORT_KEY, sortMode);
    renderProjects();
  });
}

if (searchInput) {
  searchInput.addEventListener('input', debounce(() => {
    searchTerm = searchInput.value;
    safeSet(SEARCH_KEY, searchTerm);
    renderProjects();
  }, 250));
}

if (statusFilter) {
  statusFilter.addEventListener('change', () => {
    statusValue = statusFilter.value;
    safeSet(STATUS_KEY, statusValue);
    renderProjects();
  });
}
