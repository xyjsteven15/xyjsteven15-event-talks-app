/* =============================================
   STATE
   ============================================= */
let allEntries = [];
let activeCategory = 'all';
let toastTimer = null;

/* =============================================
   CATEGORY COLOUR MAP
   ============================================= */
const CAT_CLASS = {
  feature:      'cat-feature',
  announcement: 'cat-announcement',
  changed:      'cat-changed',
  deprecated:   'cat-deprecated',
  issue:        'cat-issue',
  fix:          'cat-fix',
};

function catClass(label) {
  return CAT_CLASS[label.toLowerCase()] ?? 'cat-default';
}

/* =============================================
   RELATIVE DATE
   ============================================= */
function relativeDate(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    const diff = Date.now() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0)  return 'Today';
    if (days === 1)  return 'Yesterday';
    if (days < 7)   return `${days} days ago`;
    if (days < 30)  return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
    if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`;
    return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? 's' : ''} ago`;
  } catch { return ''; }
}

/* =============================================
   LOAD RELEASE NOTES
   ============================================= */
async function loadNotes() {
  const btn = document.getElementById('refreshBtn');
  const icon = document.getElementById('refreshIcon');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const grid = document.getElementById('cardsGrid');
  const filterBar = document.getElementById('filterBar');

  // Start spinner
  btn.disabled = true;
  btn.classList.add('spinning');
  statusDot.className = 'status-dot loading';
  statusText.textContent = 'Fetching…';

  // Show skeleton placeholders
  renderSkeletons(grid, 6);
  filterBar.style.display = 'none';

  try {
    const res = await fetch('/api/release-notes');
    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error ?? `HTTP ${res.status}`);
    }

    allEntries = data.entries;
    activeCategory = 'all';

    buildFilterChips(allEntries);
    renderCards(allEntries);

    statusDot.className = 'status-dot live';
    statusText.textContent = `${data.count} entries`;
    filterBar.style.display = '';
    showToast(`✓ Loaded ${data.count} release notes`);

  } catch (err) {
    console.error(err);
    grid.innerHTML = `
      <div class="error-card">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ea4335" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h3>Failed to load release notes</h3>
        <p>${escapeHtml(err.message)}</p>
      </div>`;
    statusDot.className = 'status-dot error';
    statusText.textContent = 'Error';
  } finally {
    btn.disabled = false;
    btn.classList.remove('spinning');
  }
}

/* =============================================
   SKELETON PLACEHOLDERS
   ============================================= */
function renderSkeletons(grid, count) {
  grid.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const sk = document.createElement('div');
    sk.className = 'skeleton-card';
    sk.style.animationDelay = `${i * 0.06}s`;
    sk.innerHTML = `
      <div class="skeleton-line h20 medium"></div>
      <div class="skeleton-line short"></div>
      <div class="skeleton-line full"></div>
      <div class="skeleton-line long"></div>
      <div class="skeleton-line medium"></div>
      <div class="skeleton-line full"></div>
    `;
    grid.appendChild(sk);
  }
}

/* =============================================
   BUILD FILTER CHIPS
   ============================================= */
function buildFilterChips(entries) {
  const catSet = new Set();
  entries.forEach(e => e.categories.forEach(c => catSet.add(c)));

  const container = document.getElementById('categoryFilter');
  container.innerHTML = '<button class="chip active" data-cat="all" onclick="filterByCategory(this)">All</button>';

  [...catSet].sort().forEach(cat => {
    const btn = document.createElement('button');
    btn.className = `chip`;
    btn.dataset.cat = cat;
    btn.textContent = cat;
    btn.onclick = function() { filterByCategory(this); };
    container.appendChild(btn);
  });
}

/* =============================================
   FILTER
   ============================================= */
function filterByCategory(chipEl) {
  activeCategory = chipEl.dataset.cat;

  // Update chip active state
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  chipEl.classList.add('active');

  const filtered = activeCategory === 'all'
    ? allEntries
    : allEntries.filter(e => e.categories.some(c => c.toLowerCase() === activeCategory.toLowerCase()));

  renderCards(filtered);
}

/* =============================================
   RENDER CARDS
   ============================================= */
function renderCards(entries) {
  const grid = document.getElementById('cardsGrid');
  const count = document.getElementById('resultsCount');

  count.textContent = `${entries.length} result${entries.length !== 1 ? 's' : ''}`;

  if (entries.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(66,133,244,0.5)" stroke-width="1.5" stroke-linecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <h2 class="empty-title">No results found</h2>
        <p class="empty-desc">No entries match the selected filter.</p>
      </div>`;
    return;
  }

  grid.innerHTML = '';
  entries.forEach((entry, idx) => {
    const card = buildCard(entry, idx);
    grid.appendChild(card);
  });

  // Mouse-tracking glow effect
  grid.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    });
  });
}

/* =============================================
   BUILD A SINGLE CARD
   ============================================= */
function buildCard(entry, idx) {
  const card = document.createElement('article');
  card.className = 'card';
  card.style.animationDelay = `${Math.min(idx * 0.05, 0.4)}s`;
  card.dataset.id = entry.id;

  const badgesHtml = entry.categories.map(c => `
    <span class="cat-badge ${catClass(c)}">${escapeHtml(c)}</span>
  `).join('');

  card.innerHTML = `
    <div class="card-header">
      <div class="card-date-group">
        <span class="card-date">${escapeHtml(entry.title)}</span>
        <span class="card-date-rel">${relativeDate(entry.updated)}</span>
      </div>
      <div class="card-cats">${badgesHtml}</div>
    </div>

    <div class="card-content" id="content-${idx}">
      ${entry.content_html}
    </div>

    <div class="card-footer">
      <button class="btn-expand" id="expand-${idx}" onclick="toggleExpand(${idx})" aria-expanded="false" aria-controls="content-${idx}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
        Show more
      </button>
      <div class="card-footer-right">
        ${entry.link ? `<a href="${escapeAttr(entry.link)}" target="_blank" rel="noopener noreferrer" class="btn-link" aria-label="View full release notes for ${escapeAttr(entry.title)}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          Docs
        </a>` : ''}
        <button class="btn-copy" id="copy-${idx}" onclick="copyToClipboard('${escapeAttr(entry.id)}', ${idx})" aria-label="Copy release note to clipboard">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copy
        </button>
        <button class="btn-tweet" onclick="openTweetModal(${idx})" aria-label="Tweet about ${escapeAttr(entry.title)}">
          <svg width="13" height="13" viewBox="0 0 1200 1227" fill="none">
            <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.163 519.284ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.828Z" fill="currentColor"/>
          </svg>
          Tweet
        </button>
      </div>
    </div>
  `;

  return card;
}

/* =============================================
   EXPAND / COLLAPSE CARD
   ============================================= */
function toggleExpand(idx) {
  const content = document.getElementById(`content-${idx}`);
  const btn = document.getElementById(`expand-${idx}`);
  const isExpanded = content.classList.toggle('expanded');
  btn.classList.toggle('expanded', isExpanded);
  btn.setAttribute('aria-expanded', String(isExpanded));
  btn.querySelector('svg + text, span')?.remove();
  btn.childNodes.forEach(n => { if (n.nodeType === 3) n.remove(); });
  // Update text node
  const textNode = [...btn.childNodes].find(n => n.nodeType === Node.TEXT_NODE);
  if (textNode) textNode.textContent = isExpanded ? ' Show less' : ' Show more';
}

/* =============================================
   TWEET MODAL
   ============================================= */
function openTweetModal(idx) {
  const entry = allEntries.find((e, i) => {
    // find by rendered card index within current filter
    return false;
  }) ?? (() => {
    // Fallback: find by card DOM order
    const cards = document.querySelectorAll('.card');
    const card = cards[idx] ?? cards[0];
    const id = card?.dataset?.id;
    return allEntries.find(e => e.id === id);
  })();

  if (!entry) return;

  const textarea = document.getElementById('tweetText');
  textarea.value = entry.tweet_text;
  updateCharCount();

  document.getElementById('modalOverlay').classList.add('open');
  setTimeout(() => textarea.focus(), 300);
}

// Called from card button with card's entry id
function openTweetModalById(entryId) {
  const entry = allEntries.find(e => e.id === entryId);
  if (!entry) return;

  const textarea = document.getElementById('tweetText');
  textarea.value = entry.tweet_text;
  updateCharCount();

  document.getElementById('modalOverlay').classList.add('open');
  setTimeout(() => textarea.focus(), 300);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function openTwitter() {
  const text = document.getElementById('tweetText').value;
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer,width=550,height=420');
  closeModal();
  showToast('🐦 Opening X to post your tweet…');
}

function updateCharCount() {
  const textarea = document.getElementById('tweetText');
  const countEl = document.getElementById('charCount');
  const warnEl = document.getElementById('charWarn');
  const len = textarea.value.length;
  countEl.textContent = `${len} / 280`;
  countEl.className = 'char-count';
  warnEl.textContent = '';

  if (len > 280) {
    countEl.classList.add('over');
    warnEl.textContent = `${len - 280} chars over limit`;
    document.getElementById('tweetBtn').disabled = true;
  } else if (len > 240) {
    countEl.classList.add('near');
    document.getElementById('tweetBtn').disabled = false;
  } else {
    document.getElementById('tweetBtn').disabled = false;
  }
}

/* =============================================
   REBUILD card tweet buttons to use IDs
   ============================================= */
// Override buildCard to wire up by entry id
const _origBuildCard = buildCard;
// Patch: rewrite openTweetModal to accept card DOM index but look up by id
function openTweetModal(idx) {
  const cards = document.querySelectorAll('.card');
  const card = cards[idx];
  if (!card) return;
  openTweetModalById(card.dataset.id);
}

/* =============================================
   COPY TO CLIPBOARD
   ============================================= */
function copyToClipboard(entryId, idx) {
  const entry = allEntries.find(e => e.id === entryId);
  if (!entry) return;

  // Build a clean, readable plain-text block
  const text = [
    `BigQuery Release Notes — ${entry.title}`,
    `Date: ${entry.formatted_date}`,
    `Categories: ${entry.categories.join(', ') || 'N/A'}`,
    ``,
    entry.plain_text,
    ``,
    `Source: ${entry.link}`,
  ].join('\n');

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById(`copy-${idx}`);
    if (btn) {
      btn.classList.add('copied');
      btn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        Copied!
      `;
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = `
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copy
        `;
      }, 2000);
    }
    showToast('📋 Copied to clipboard!');
  }).catch(() => {
    showToast('⚠️ Could not access clipboard.');
  });
}

/* =============================================
   EXPORT TO CSV
   ============================================= */
function exportToCSV() {
  // Export whichever entries are currently visible (respects active filter)
  const visibleEntries = activeCategory === 'all'
    ? allEntries
    : allEntries.filter(e =>
        e.categories.some(c => c.toLowerCase() === activeCategory.toLowerCase())
      );

  if (visibleEntries.length === 0) {
    showToast('⚠️ No entries to export.');
    return;
  }

  const headers = ['Date', 'Formatted Date', 'Categories', 'Summary', 'Docs URL'];

  const rows = visibleEntries.map(e => [
    e.updated,
    e.formatted_date,
    e.categories.join('; '),
    e.plain_text,
    e.link,
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${String(field ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const filterLabel = activeCategory === 'all' ? 'all' : activeCategory.toLowerCase();
  a.href     = url;
  a.download = `bigquery-release-notes-${filterLabel}-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`✅ Exported ${visibleEntries.length} entries to CSV`);
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

/* =============================================
   HELPERS
   ============================================= */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  if (!str) return '';
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* =============================================
   THEME MANAGEMENT
   ============================================= */
function initTheme() {
  const saved = localStorage.getItem('bq-theme');
  // Default to dark; apply light only if explicitly saved
  if (saved === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    document.getElementById('themeToggle').checked = true;
  }
}

function toggleTheme(checkbox) {
  if (checkbox.checked) {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('bq-theme', 'light');
    showToast('☀️ Light mode on');
  } else {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('bq-theme', 'dark');
    showToast('🌙 Dark mode on');
  }
}

/* =============================================
   EVENT LISTENERS
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
  // Restore saved theme before first paint
  initTheme();

  // Textarea live char count
  document.getElementById('tweetText').addEventListener('input', updateCharCount);

  // Close modal on overlay click
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Close modal on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  // Auto-load on startup
  loadNotes();
});
