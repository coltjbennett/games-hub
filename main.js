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
const CHAT_USERNAME_KEY = 'mqtt_chat_username_v1';

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

function getStatusMeta(statusKey) {
  return STATUS_META[statusKey] || { label: statusKey, className: 'status--legacy', bucket: 'legacy' };
}

// Native JavaScript debounce utility function 
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

searchInput.value = searchTerm;
statusFilter.value = statusValue;

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
      <a class="play-btn" href="${featured.url}" target="_blank" rel="noopener noreferrer" aria-label="Play ${esc(featured.title)}">PLAY NOW</a>
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
  return sortedProjects().filter(project => !project.featured && projectMatches(project));
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
  const featuredNote = featuredMatchesFilters() ? ' Featured project matches your current search and filter and is shown above.' : '';
  projectHelper.textContent = `${modeText} ${filterText.length ? filterText.join(' · ') + ' · ' : ''}${count} of ${total} projects shown.${featuredNote}`;
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

// ===== WINDOW BUTTON LOGIC FOR PAGE PANELS =====
function setupWindowButtons() {
  // Regular page panels window-shade when minimized.
  document.querySelectorAll('.btn-minimize').forEach((btn) => {
    const panel = btn.closest('.panel') || btn.closest('.panel-dark');
    if (panel && panel.id !== 'ping-banner' && !panel.classList.contains('app-window')) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.toggle('minimized');
      });
    }
  });

  document.querySelectorAll('.btn-close').forEach(btn => {
    const panel = btn.closest('.panel') || btn.closest('.panel-dark');
    if (panel && panel.id !== 'ping-banner' && !panel.classList.contains('app-window')) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.style.display = 'none';
        panel.classList.remove('minimized');
      });
    }
  });
}

// ===== MULTITASKING APP WINDOWS (DRAG, RESIZE, LAUNCH) =====
function setupAppWindows() {
  const windows = document.querySelectorAll('.app-window');
  
  windows.forEach(win => {
    const titleBar = win.querySelector('.panel-title-bar');
    if (!titleBar) return;
    
    // --- Drag Logic ---
    let isDragging = false;
    let dragStartX, dragStartY, initialLeft, initialTop;

    titleBar.addEventListener('mousedown', (e) => {
      if (e.target.closest('.win-btns')) return;
      isDragging = true;
      
      const rect = win.getBoundingClientRect();
      win.style.left = rect.left + 'px';
      win.style.top = rect.top + 'px';
      win.style.right = 'auto';
      win.style.bottom = 'auto';
      
      initialLeft = rect.left;
      initialTop = rect.top;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      
      bringToFront(win);
      win.classList.add('interacting');
    });

    // --- Resize Logic ---
    const handles = win.querySelectorAll('.resize-handle');
    let isResizing = false;
    let currentHandle = '';
    let initialWidth, initialHeight;

    handles.forEach(handle => {
      handle.addEventListener('mousedown', (e) => {
        isResizing = true;
        currentHandle = handle.dataset.resize;
        const rect = win.getBoundingClientRect();
        
        win.style.left = rect.left + 'px';
        win.style.top = rect.top + 'px';
        win.style.right = 'auto';
        win.style.bottom = 'auto';
        
        initialWidth = rect.width;
        initialHeight = rect.height;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        
        bringToFront(win);
        win.classList.add('interacting');
        e.preventDefault();
      });
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        win.style.left = (initialLeft + (e.clientX - dragStartX)) + 'px';
        win.style.top = (initialTop + (e.clientY - dragStartY)) + 'px';
      } else if (isResizing) {
        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;
        
        if (currentHandle.includes('e')) {
          win.style.width = Math.max(200, initialWidth + dx) + 'px';
        }
        if (currentHandle.includes('s')) {
          win.style.height = Math.max(150, initialHeight + dy) + 'px';
        }
      }
    });

    document.addEventListener('mouseup', () => {
      if (isDragging || isResizing) {
        isDragging = false;
        isResizing = false;
        win.classList.remove('interacting');
      }
    });
    
    // Ensure clicking window brings it to front
    win.addEventListener('mousedown', () => bringToFront(win));
    
    // --- Window State Buttons ---
    const minBtn = win.querySelector('.btn-minimize');
    const closeBtn = win.querySelector('.btn-close');
    
    // Completely hide windows when minimized (they won't show on taskbar)
    if (minBtn) {
      minBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        win.hidden = true;
        if (win.id === 'chat-window') updateChatLauncherState(false);
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        win.hidden = true;
        if (win.id === 'chat-window') updateChatLauncherState(false);
      });
    }
  });
  
  // Connect Quick Launch Taskbar Applets
  const qlPaint = document.getElementById('ql-paint');
  const qlWeather = document.getElementById('ql-weather');
  
  if (qlPaint) qlPaint.addEventListener('click', () => toggleAppWindow('paint-window'));
  if (qlWeather) qlWeather.addEventListener('click', () => toggleAppWindow('weather-window'));
}

function toggleAppWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  if (win.hidden) {
    win.hidden = false;
    bringToFront(win);
  } else {
    win.hidden = true;
  }
}

function bringToFront(el) {
  document.querySelectorAll('.app-window').forEach(w => w.style.zIndex = 998);
  el.style.zIndex = 999;
}

function updateChatLauncherState(isOpen) {
  const launcherBtn = document.getElementById('chat-launcher-btn');
  const chatFrame = document.getElementById('chat-frame');
  if (launcherBtn) launcherBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  if (chatFrame && chatFrame.contentWindow) {
    chatFrame.contentWindow.postMessage({
      source: 'parent-shell',
      action: isOpen ? 'chatWindowOpened' : 'chatWindowClosed'
    }, '*');
  }
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
    });
  });
}

// ===== VISITOR COUNTER =====
function setupVisitorCounter() {
  try {
    const KEY = 'colton-launcher-visits';
    const SESSION_KEY = 'colton-launcher-session';
    const rawCount = localStorage.getItem(KEY);
    
    let count = (rawCount && !isNaN(rawCount)) ? parseInt(rawCount, 10) : 0;
    
    if (!sessionStorage.getItem(SESSION_KEY)) {
      count += 1;
      localStorage.setItem(KEY, count);
      sessionStorage.setItem(SESSION_KEY, '1');
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

// ===== CHATROOM WIDGET (launcher button, floating window, pending dot, online counter, ping banner) =====
function setupChatWidget() {
  const launcherBtn = document.getElementById('chat-launcher-btn');
  const pendingDot = document.getElementById('chat-pending-dot');
  const chatWindow = document.getElementById('chat-window');
  const chatFrame = document.getElementById('chat-frame');
  const onlineCountEl = document.getElementById('online-count');

  if (!launcherBtn || !chatWindow || !chatFrame) return;

  function windowIsVisibleAndOpen() {
    return !chatWindow.hidden;
  }

  function setPendingDot(show) {
    pendingDot.hidden = !show;
  }

  // Handle open toggle using centralized App Window function
  launcherBtn.addEventListener('click', () => {
    if (chatWindow.hidden) {
      chatWindow.hidden = false;
      bringToFront(chatWindow);
      setPendingDot(false);
      updateChatLauncherState(true);
    } else {
      chatWindow.hidden = true;
      updateChatLauncherState(false);
    }
  });

  chatFrame.addEventListener('load', () => {
    updateChatLauncherState(windowIsVisibleAndOpen());
  });

  window.addEventListener('message', (event) => {
    const data = event.data || {};
    if (data.source !== 'universal-chat') return;

    if (data.kind === 'presence') {
      if (onlineCountEl) onlineCountEl.textContent = String(data.count);
    } else if (data.kind === 'unread') {
      if (!windowIsVisibleAndOpen()) {
        setPendingDot(true);
      }
    } else if (data.kind === 'ping') {
      const banner = document.getElementById('ping-banner');
      const bannerText = document.getElementById('ping-banner-text');
      if (banner && bannerText) {
        bannerText.textContent = data.text;
        banner.style.top = '10px';
        setTimeout(() => { banner.style.top = '-100px'; }, 3000);
      }
    }
  });
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
  setupAppWindows();
  setupStartMenu();
  setupVisitorCounter();
  setupToSModal();
  setupCRTToggle();
  setupChatWidget();
  updateTaskbarClock();
  setInterval(updateTaskbarClock, 1000);
});

sortToggle.addEventListener('click', () => {
  sortMode = sortMode === 'type' ? 'default' : 'type';
  safeSet(SORT_KEY, sortMode);
  renderProjects();
});

searchInput.addEventListener('input', debounce(() => {
  searchTerm = searchInput.value;
  safeSet(SEARCH_KEY, searchTerm);
  renderProjects();
}, 250));

statusFilter.addEventListener('change', () => {
  statusValue = statusFilter.value;
  safeSet(STATUS_KEY, statusValue);
  renderProjects();
});

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
