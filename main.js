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
    // content contains raw safe markup tags like <br> and <i> requiring innerHTML parsing
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

// ===== WINDOW BUTTON & TASKBAR LOGIC =====
function setupWindowButtons() {
  document.querySelectorAll('.btn-minimize').forEach((btn) => {
    const panel = btn.closest('.panel') || btn.closest('.panel-dark');
    if (panel) {
      btn.addEventListener('click', (e) => {
        panel.classList.toggle('minimized');
        updateTaskbarApps();
      });
    }
  });

  document.querySelectorAll('.btn-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const panel = e.target.closest('.panel') || e.target.closest('.panel-dark');
      if (panel) {
        panel.style.display = 'none';
        panel.classList.remove('minimized');
        updateTaskbarApps();
      }
    });
  });
}

function updateTaskbarApps() {
  const container = document.getElementById('taskbar-apps');
  if (!container) return;
  container.innerHTML = '';

  document.querySelectorAll('.minimized').forEach(panel => {
    if (panel.style.display === 'none') return; // Skip completely closed panels

    const titleSpan = panel.querySelector('.panel-title-bar span:first-child');
    const titleText = titleSpan ? titleSpan.textContent.trim() : 'W';
    const letter = titleText.charAt(0).toUpperCase();

    const appBtn = document.createElement('div');
    appBtn.className = 'taskbar-app';
    appBtn.textContent = letter;
    appBtn.setAttribute('title', titleText);
    
    appBtn.addEventListener('click', () => {
      panel.classList.remove('minimized');
      updateTaskbarApps();
    });
    
    container.appendChild(appBtn);
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
  updateTaskbarClock();
  setInterval(updateTaskbarClock, 1000);
});

sortToggle.addEventListener('click', () => {
  sortMode = sortMode === 'type' ? 'default' : 'type';
  safeSet(SORT_KEY, sortMode);
  renderProjects();
});

// Wrapped input listener in 250ms delay debounce wrapper function
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
