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

// ===== RENDER LISTS =====
function renderAnnouncements() {
  announcementList.innerHTML = announcements.map(a => `
    <article class="announcement-item">
      <h3>${esc(a.title)}</h3>
      <p>${a.content}</p>
    </article>
  `).join('');
}

function renderClassics() {
  if (classics.length === 0) return;
  classicList.innerHTML = classics.map(c => `
    <a href="${esc(c.url)}" class="classic-item" aria-label="Play ${esc(c.title)}">
      <img src="${esc(c.image)}" alt="${esc(c.alt)}" width="80" height="80" />
      <div class="classic-info"><h3>${esc(c.title)}</h3></div>
    </a>
  `).join('');
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
      <img src="${featured.image}" alt="${esc(featured.alt)} featured preview" loading="eager" />
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
  projectGrid.innerHTML = items.length ?
    items.map(project => {
      const status = getStatusMeta(project.statusKey);
      return `
        <article class="project-card">
          <div class="card-image">
            <img src="${project.image}" alt="${esc(project.alt)}" loading="lazy" />
          </div>
          <div class="card-body">
            <div class="card-top">
              <span class="status ${status.className}">${esc(status.label)}</span>
              <span class="tag">${esc(project.type)}</span>
            </div>
            <h3>${esc(project.title)}</h3>
            <div class="tags">${project.tags.map(tag => `<span class="tag ${tag.includes('Top Pick') ? 'tag--featured' : tag === 'Under development' ? 'tag--dev' : ''}">${esc(tag)}</span>`).join('')}</div>
            <p>${esc(project.description)}</p>
            <div class="card-actions">
              <a class="play-btn" href="${project.url}" target="_blank" rel="noopener noreferrer" aria-label="Play ${esc(project.title)}">PLAY NOW</a>
            </div>
          </div>
        </article>
      `;
  }).join('') : `
    <div class="announcement-item no-matches">
      <h3>No matches found</h3>
      <p>Try a different search term or clear the status filter.</p>
    </div>
  `;
  sortToggle.textContent = sortMode === 'type' ? 'Sort: type' : 'Sort by type';
  sortToggle.setAttribute('aria-pressed', sortMode === 'type' ? 'true' : 'false');
  updateHelperText(items.length);
}

// ===== WINDOW BUTTON LOGIC =====
function setupWindowButtons() {
  document.querySelectorAll('.btn-minimize').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const panel = e.target.closest('.panel') || e.target.closest('.panel-dark');
      if (panel) panel.classList.toggle('minimized');
    });
  });

  document.querySelectorAll('.btn-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const panel = e.target.closest('.panel') || e.target.closest('.panel-dark');
      if (panel) panel.style.display = 'none';
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

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  renderSiteData();
  renderAnnouncements();
  renderClassics();
  renderStats();
  renderFeatured();
  renderProjects();
  setupWindowButtons();
  setupVisitorCounter();
  setupToSModal();
});

sortToggle.addEventListener('click', () => {
  sortMode = sortMode === 'type' ? 'default' : 'type';
  safeSet(SORT_KEY, sortMode);
  renderProjects();
});

searchInput.addEventListener('input', () => {
  searchTerm = searchInput.value;
  safeSet(SEARCH_KEY, searchTerm);
  renderProjects();
});

statusFilter.addEventListener('change', () => {
  statusValue = statusFilter.value;
  safeSet(STATUS_KEY, statusValue);
  renderProjects();
});

function setupToSModal() {
  const tosOverlay = document.getElementById("tos-modal-overlay");
  const acceptBtn = document.getElementById("tos-accept-btn");

  if (!tosOverlay || !acceptBtn) return;

  // Check if user has already accepted using your existing safeGet wrapper
  if (!safeGet("tosAccepted")) {
    tosOverlay.style.display = "flex";
    document.body.style.overflow = "hidden"; // Prevent background scrolling
  }

  acceptBtn.addEventListener("click", () => {
    // Save acceptance using your existing safeSet wrapper
    safeSet("tosAccepted", "true");
    
    // Hide modal and restore scrolling
    tosOverlay.style.display = "none";
    document.body.style.overflow = "auto";
  });
}
