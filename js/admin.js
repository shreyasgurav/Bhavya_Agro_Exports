import { db, auth, collection, getDocs, query, orderBy, signInWithEmailAndPassword, onAuthStateChanged, signOut, doc, updateDoc, deleteDoc, storage, ref, uploadBytesResumable, getDownloadURL } from './firebase-config.js';
import { fetchAllProducts, sortProducts, saveProduct as fsaveProduct, deleteProductById, updateProductStatus } from './products-service.js';

// ════════════════════════════════════════════════
// VYANKYAA ADMIN — COMPLETE INTERACTION ENGINE
// ════════════════════════════════════════════════

window.firebaseSignOut = () => signOut(auth);

// ── DOM REFS ──
const loginOverlay  = document.getElementById('loginOverlay');
const loginForm     = document.getElementById('loginForm');
const loginError    = document.getElementById('loginError');
const loginErrorTxt = document.getElementById('loginErrorText');
const logoutBtn     = document.getElementById('logoutBtn');
const filterSearch  = document.getElementById('filterSearch');
const filterStatus  = document.getElementById('filterStatus');
const filterType    = document.getElementById('filterType');
const filterSort    = document.getElementById('filterSort');

// ── GLOBAL STATE ──
window.enquiriesData = [];
let currentPage      = 1;
const PAGE_SIZE      = 10;
let currentPageData  = [];
let currentModalItem = null;
let pendingDeleteFn  = null;
let dashboardLoaded  = false;

// ── SAFE DATA STORE (indexed array, avoids JSON.stringify in templates) ──
window._itemStore = [];
function storeItem(item) {
  const existing = window._itemStore.findIndex(i => i.id === item.id && i.collection === item.collection);
  if (existing > -1) { window._itemStore[existing] = item; return existing; }
  window._itemStore.push(item);
  return window._itemStore.length - 1;
}
function getItem(idx) { return window._itemStore[parseInt(idx, 10)]; }

// ── LOCAL PRODUCT CACHE (refreshed from Firestore) ──
window._adminProducts = [];
async function loadAdminProducts() {
  window._adminProducts = await fetchAllProducts();
  renderProductsTable();
}
function getAdminProducts() { return window._adminProducts; }
function populateCategorySelect() {
  const sel = document.getElementById('prodCategorySelect');
  if (!sel) return;
  const products = getAdminProducts();
  const cats = new Map();
  // Standard defaults
  cats.set('oils', 'Premium Oils');
  cats.set('grains', 'Grains & Sugar');
  cats.set('cakes', 'Oil Seed Cakes');
  cats.set('spices', 'Spices');
  cats.set('seeds', 'Seeds');
  // Add any custom ones from products
  products.forEach(p => { if (p.category) cats.set(p.category, p.categoryLabel || p.category); });
  
  sel.innerHTML = '<option value="" disabled selected>Select category...</option>' +
    Array.from(cats.entries()).map(([key, label]) => `<option value="${esc(key)}" data-label="${esc(label)}">${esc(label)}</option>`).join('') +
    '<option value="NEW_CAT" class="font-bold text-emerald-600">+ Add New Category...</option>';
}

// Visual Catalogue State
let _isSorting = false;

// ════════════════════════════════════════════════
// AUTHENTICATION
// ════════════════════════════════════════════════
onAuthStateChanged(auth, user => {
  if (user) {
    loginOverlay.style.display = 'none';
    const se = document.getElementById('settingEmail');
    if (se) se.value = user.email || '';
    if (!dashboardLoaded) { dashboardLoaded = true; loadDashboard(); }
  } else {
    loginOverlay.style.display = 'flex';
    dashboardLoaded = false;
  }
});

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  loginError.style.display = 'none';
  btn.disabled = true;
  btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Verifying...';
  try {
    await signInWithEmailAndPassword(auth,
      document.getElementById('adminEmail').value,
      document.getElementById('adminPassword').value
    );
  } catch (err) {
    loginErrorTxt.textContent = ['auth/wrong-password','auth/user-not-found','auth/invalid-credential'].includes(err.code)
      ? 'Wrong email or password.' : 'Login failed: ' + err.message;
    loginError.style.display = 'flex';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Login to Dashboard';
  }
});

logoutBtn.addEventListener('click', e => {
  e.preventDefault();
  dashboardLoaded = false;
  signOut(auth);
});

// ════════════════════════════════════════════════
// DATA LOADING
// ════════════════════════════════════════════════
async function loadDashboard() {
  try {
    const [snapQ, snapC] = await Promise.all([
      getDocs(query(collection(db, 'quotations'), orderBy('timestamp', 'desc'))),
      getDocs(query(collection(db, 'contacts'),   orderBy('timestamp', 'desc')))
    ]);
    const quotes   = snapQ.docs.map(d => ({ id:d.id, collection:'quotations', status:'pending', ...d.data() }));
    const contacts = snapC.docs.map(d => ({ id:d.id, collection:'contacts',   status:'new',     ...d.data() }));

    window.enquiriesData = [...quotes, ...contacts].sort((a,b) =>
      (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)
    );

    // Pre-index all items
    window._itemStore = [];
    window.enquiriesData.forEach(item => storeItem(item));

    updateStats();
    updateBadge();
    renderRecentTable(window.enquiriesData.slice(0, 6));
    filterAndRender();
    renderQuotesTable(quotes);
    renderContactsTable(contacts);
    renderProductsTable(); // show skeleton
    loadAdminProducts();   // async: loads from Firestore
    // Pre-cache sortProducts globally for Sortable usage
    window.sortProducts = sortProducts;
  } catch (err) {
    console.error('Load error:', err);
    window.showToast('Failed to load data. Check connection.', 'error');
    ['dashRecentTable','fullEnquiriesTable','quotesTable','contactsTable'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = `<tr><td colspan="7" class="px-5 py-8 text-center text-red-400"><i class='bx bxs-error-circle mr-2'></i>${err.message}</td></tr>`;
    });
  }
}

// ════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════
function statusClass(s) {
  return { new:'status-new', pending:'status-pending', resolved:'status-resolved', contacted:'status-contacted', closed:'status-closed' }[s] || 'status-pending';
}
function fmtDate(ts) {
  if (!ts?.seconds) return '—';
  return new Date(ts.seconds * 1000).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}
function initials(name) { return (name || '?').charAt(0).toUpperCase(); }
function esc(str) { return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ════════════════════════════════════════════════
// STATS & BADGE
// ════════════════════════════════════════════════
function updateStats() {
  const d = window.enquiriesData;
  const set = (id, v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
  set('m-enq', d.length);
  set('m-quo', d.filter(i => i.collection === 'quotations').length);
  set('m-pen', d.filter(i => ['new','pending'].includes(i.status || 'pending')).length);
  set('m-con', d.filter(i => i.status === 'resolved').length);
}
function updateBadge() {
  const pending = window.enquiriesData.filter(i => ['new','pending'].includes(i.status || 'pending')).length;
  const b = document.getElementById('badge-enq');
  if (b) { b.textContent = pending; b.classList.toggle('hidden', pending === 0); }
}

// ════════════════════════════════════════════════
// CENTRALIZED ACTION DISPATCHER (data-action pattern)
// ════════════════════════════════════════════════
document.addEventListener('click', function(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  // If clicking inside an actions column (data-no-row-click), skip row-level 'view'
  if (btn.dataset.action === 'view' && e.target.closest('[data-no-row-click]') && !e.target.closest('button')) return;
  e.stopPropagation();
  e.preventDefault();
  const action = btn.dataset.action;
  const idx    = btn.dataset.idx;
  const id     = btn.dataset.id;
  const coll   = btn.dataset.coll;
  const item   = (idx !== undefined) ? getItem(idx) : null;

  switch (action) {
    case 'view':     if (item) openItemModal(item); break;
    case 'resolve':  if (id && coll) quickMark(id, coll, 'resolved'); break;
    case 'contact':  if (id && coll) quickMark(id, coll, 'contacted'); break;
    case 'delete':   if (id && coll) confirmDeleteItem(id, coll); break;
    case 'quote':    if (item) openMakeQuoteModal(item); break;
    case 'reply':    if (item) doReply(item.email, item.name, item.product || item.enquiryType); break;
    case 'edit-prod': editProduct(id); break;
    case 'del-prod':  deleteProduct(id); break;
    case 'modal-close': closeModal(btn.dataset.modal); break;
    case 'modal-open':  openModal(btn.dataset.modal); break;
    case 'nav':      switchNav(btn.dataset.target); break;
    case 'mark-resolved': markAsFromModal('resolved'); break;
    case 'mark-contacted': markAsFromModal('contacted'); break;
    case 'save-note': saveNote(); break;
    case 'reply-modal': replyToUser(); break;
    case 'send-quote': sendQuotation(); break;
    case 'save-product': saveProduct(); break;
    case 'save-settings': saveSettings(); break;
    case 'reset-filters': resetFilters(); break;
    case 'export-csv': window.generateReport(); break;
    case 'new-quote': openMakeQuoteModal(null); break;
    case 'add-product': openAddProductModal(); break;
    case 'sign-out': if(window.firebaseSignOut) window.firebaseSignOut(); break;
  }
});

// Category Dropdown Logic
document.getElementById('prodCategorySelect')?.addEventListener('change', function() {
  const wrap = document.getElementById('newCategoryWrap');
  if (this.value === 'NEW_CAT') {
    wrap.style.display = 'block';
    document.getElementById('prodCategory').value = '';
    document.getElementById('prodCatLabel').value = '';
    document.getElementById('prodCatOrder').value = '99';
    document.getElementById('prodCatLabel').focus();
  } else {
    wrap.style.display = 'none';
    const opt = this.options[this.selectedIndex];
    document.getElementById('prodCategory').value = this.value;
    document.getElementById('prodCatLabel').value = opt.getAttribute('data-label') || '';
    
    // Find existing order for this category
    const p = getAdminProducts().find(x => x.category === this.value);
    document.getElementById('prodCatOrder').value = p ? (p.categoryOrder || 99) : 99;
  }
});

// Auto-Apply Category Key from Label
document.getElementById('prodCatLabel')?.addEventListener('input', function() {
  if (document.getElementById('prodCategorySelect')?.value === 'NEW_CAT') {
    const slug = this.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    document.getElementById('prodCategory').value = slug;
  }
});

// ════════════════════════════════════════════════
// ACTION ROW BUILDER (safe, uses data-idx)
// ════════════════════════════════════════════════
function actionBtns(item) {
  const idx = storeItem(item);
  const resolved = item.status === 'resolved';
  return `
    <div class="flex gap-1 justify-end flex-wrap" data-no-row-click="1">
      <button class="action-btn btn-view" data-action="view" data-idx="${idx}" title="View details">
        <i class='bx bx-show'></i> View
      </button>
      ${!resolved ? `<button class="action-btn btn-contact" data-action="contact" data-id="${esc(item.id)}" data-coll="${esc(item.collection)}" title="Mark Contacted">
        <i class='bx bx-phone-call'></i>
      </button>` : ''}
      <button class="action-btn btn-resolve" data-action="resolve" data-id="${esc(item.id)}" data-coll="${esc(item.collection)}" title="Mark Resolved" ${resolved?'disabled':''}>
        <i class='bx bx-check'></i>
      </button>
      <button class="action-btn btn-delete" data-action="delete" data-id="${esc(item.id)}" data-coll="${esc(item.collection)}" title="Archive/Delete">
        <i class='bx bx-trash'></i>
      </button>
    </div>`;
}

// ════════════════════════════════════════════════
// RECENT DASHBOARD TABLE
// ════════════════════════════════════════════════
function renderRecentTable(items) {
  const tb = document.getElementById('dashRecentTable');
  if (!tb) return;
  if (!items.length) {
    tb.innerHTML = '<tr><td colspan="6" class="px-5 py-8 text-center text-slate-400">No recent activity.</td></tr>';
    return;
  }
  tb.innerHTML = items.map(item => {
    const idx = storeItem(item);
    return `<tr class="hover:bg-slate-50 transition cursor-pointer" data-action="view" data-idx="${idx}">
      <td class="px-5 py-3 text-slate-500 text-xs">${fmtDate(item.timestamp)}</td>
      <td class="px-5 py-3"><span class="type-badge ${item.collection==='quotations'?'type-quote':'type-contact'}">${item.collection==='quotations'?'QUOTE':'MSG'}</span></td>
      <td class="px-5 py-3 font-medium text-slate-800">${esc(item.product || item.enquiryType || 'General')}</td>
      <td class="px-5 py-3">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold">${initials(item.name)}</div>
          <span>${esc(item.name)}</span>
        </div>
      </td>
      <td class="px-5 py-3"><span class="status-badge ${statusClass(item.status)}">${(item.status||'PENDING').toUpperCase()}</span></td>
      <td class="px-5 py-3 text-right"><button class="action-btn btn-view" data-action="view" data-idx="${idx}">Review</button></td>
    </tr>`;
  }).join('');
}

// ════════════════════════════════════════════════
// FULL ENQUIRIES TABLE — FILTER, SORT, PAGINATE
// ════════════════════════════════════════════════
window.filterAndRender = filterAndRender;
function filterAndRender() {
  let data = [...window.enquiriesData];
  const search = (filterSearch?.value || '').toLowerCase().trim();
  const status = filterStatus?.value || '';
  const type   = filterType?.value   || '';
  const sort   = filterSort?.value   || 'newest';

  if (search) data = data.filter(i =>
    [i.name, i.email, i.city, i.product, i.enquiryType, i.phone].some(v => (v||'').toLowerCase().includes(search))
  );
  if (status) data = data.filter(i => (i.status || 'pending') === status);
  if (type)   data = data.filter(i => i.collection === type);
  if (sort === 'oldest') data.sort((a,b) => (a.timestamp?.seconds||0)-(b.timestamp?.seconds||0));

  currentPageData = data;
  currentPage = 1;
  renderPagedTable();
}

function renderPagedTable() {
  const data  = currentPageData;
  const start = (currentPage - 1) * PAGE_SIZE;
  const slice = data.slice(start, start + PAGE_SIZE);
  const total = data.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const countEl = document.getElementById('tableCount');
  const piEl    = document.getElementById('pageIndicator');
  const prevBtn = document.getElementById('btnPrev');
  const nextBtn = document.getElementById('btnNext');

  if (countEl) countEl.textContent = total ? `Showing ${start+1}–${Math.min(start+PAGE_SIZE,total)} of ${total}` : 'No results';
  if (piEl)    piEl.textContent = `${currentPage} / ${pages}`;
  if (prevBtn) prevBtn.disabled = currentPage <= 1;
  if (nextBtn) nextBtn.disabled = currentPage >= pages;

  const tb = document.getElementById('fullEnquiriesTable');
  if (!tb) return;
  if (!slice.length) {
    tb.innerHTML = '<tr><td colspan="6" class="px-5 py-8 text-center text-slate-400">No results found. <button class="text-blue-500 underline ml-1" data-action="reset-filters">Clear filters</button></td></tr>';
    return;
  }
  tb.innerHTML = slice.map(item => {
    const idx = storeItem(item);
    return `<tr class="hover:bg-slate-50 transition cursor-pointer enquiry-row" data-idx="${idx}">
      <td class="px-5 py-3 text-xs text-slate-500">${fmtDate(item.timestamp)}</td>
      <td class="px-5 py-3">
        <div class="font-semibold text-slate-800">${esc(item.name)}</div>
        <div class="text-xs text-slate-400">${esc(item.email||'—')}</div>
      </td>
      <td class="px-5 py-3">
        <span class="type-badge ${item.collection==='quotations'?'type-quote':'type-contact'} mr-1">${item.collection==='quotations'?'Q':'M'}</span>
        ${esc(item.productInterest || item.product || (item.enquiryType==='General Enquiry'?'General':item.enquiryType) || '—')}
      </td>
      <td class="px-5 py-3 text-slate-600">${esc(item.city||'—')}</td>
      <td class="px-5 py-3"><span class="status-badge ${statusClass(item.status)}" id="row-status-${esc(item.id)}">${(item.status||'PENDING').toUpperCase()}</span></td>
      <td class="px-5 py-3">${actionBtns(item)}</td>
    </tr>`;
  }).join('');

  // Attach row click (opens modal) — but ONLY if click was NOT on an action button
  tb.querySelectorAll('tr.enquiry-row').forEach(row => {
    row.addEventListener('click', function(e) {
      if (e.target.closest('[data-no-row-click]') || e.target.closest('button')) return;
      const item = getItem(this.dataset.idx);
      if (item) openItemModal(item);
    });
  });
}

window.changePage = function(dir) { currentPage += dir; renderPagedTable(); };

window.resetFilters = function() {
  if (filterSearch) filterSearch.value = '';
  if (filterStatus) filterStatus.value = '';
  if (filterType)   filterType.value   = '';
  if (filterSort)   filterSort.value   = 'newest';
  filterAndRender();
};

// Attach filter events
[filterSearch, filterStatus, filterType, filterSort].forEach(el => {
  if (el) el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', filterAndRender);
});

// ════════════════════════════════════════════════
// QUOTATIONS TABLE
// ════════════════════════════════════════════════
function renderQuotesTable(quotes) {
  const tb = document.getElementById('quotesTable');
  if (!tb) return;
  if (!quotes.length) { tb.innerHTML = '<tr><td colspan="7" class="px-5 py-8 text-center text-slate-400">No quotation requests yet.</td></tr>'; return; }
  tb.innerHTML = quotes.map(q => {
    const idx = storeItem(q);
    const resolved = q.status === 'resolved';
    return `<tr class="hover:bg-slate-50 transition cursor-pointer quote-row" data-idx="${idx}">
      <td class="px-5 py-3 text-xs text-slate-500">${fmtDate(q.timestamp)}</td>
      <td class="px-5 py-3">
        <div class="font-semibold">${esc(q.name)}</div>
        <div class="text-xs text-slate-400">${esc(q.email||'—')}</div>
      </td>
      <td class="px-5 py-3 font-medium text-slate-800">${esc(q.productInterest || q.product || '—')}</td>
      <td class="px-5 py-3 text-slate-600">${esc(q.city||'—')}</td>
      <td class="px-5 py-3"><span class="status-badge ${statusClass(q.status)}" id="row-status-${esc(q.id)}">${(q.status||'PENDING').toUpperCase()}</span></td>
      <td class="px-5 py-3">
        <div class="flex gap-1 justify-end" data-no-row-click="1">
          <button class="action-btn btn-view" data-action="view" data-idx="${idx}">View</button>
          <button class="action-btn" style="background:#fdf2f8;color:#be185d;" data-action="quote" data-idx="${idx}" title="Send Quote"><i class='bx bx-send'></i> Quote</button>
          <button class="action-btn btn-resolve" data-action="resolve" data-id="${esc(q.id)}" data-coll="quotations" ${resolved?'disabled':''} title="Resolve"><i class='bx bx-check'></i></button>
          <button class="action-btn btn-contact" data-action="contact" data-id="${esc(q.id)}" data-coll="quotations" title="Mark Contacted"><i class='bx bx-phone-call'></i></button>
          <button class="action-btn btn-delete" data-action="delete" data-id="${esc(q.id)}" data-coll="quotations" title="Archive"><i class='bx bx-trash'></i></button>
        </div>
      </td>
    </tr>`;
  }).join('');

  // Row click opens modal — ignores action buttons
  tb.querySelectorAll('tr.quote-row').forEach(row => {
    row.addEventListener('click', function(e) {
      if (e.target.closest('[data-no-row-click]') || e.target.closest('button')) return;
      const item = getItem(this.dataset.idx);
      if (item) openItemModal(item);
    });
  });
}

// ════════════════════════════════════════════════
// CONTACTS TABLE
// ════════════════════════════════════════════════
function renderContactsTable(contacts) {
  const tb = document.getElementById('contactsTable');
  if (!tb) return;
  if (!contacts.length) { tb.innerHTML = '<tr><td colspan="7" class="px-5 py-8 text-center text-slate-400">No messages yet.</td></tr>'; return; }
  tb.innerHTML = contacts.map(c => {
    const idx = storeItem(c);
    const resolved = c.status === 'resolved';
    return `<tr class="hover:bg-slate-50 transition cursor-pointer contact-row" data-idx="${idx}">
      <td class="px-5 py-3 text-xs text-slate-500">${fmtDate(c.timestamp)}</td>
      <td class="px-5 py-3 font-semibold">${esc(c.name)}</td>
      <td class="px-5 py-3 text-xs text-slate-500">${esc(c.email||'—')}</td>
      <td class="px-5 py-3">${esc(c.enquiryType||'General')}</td>
      <td class="px-5 py-3">${esc(c.city||'—')}</td>
      <td class="px-5 py-3"><span class="status-badge ${statusClass(c.status)}" id="row-status-${esc(c.id)}">${(c.status||'NEW').toUpperCase()}</span></td>
      <td class="px-5 py-3">
        <div class="flex gap-1 justify-end" data-no-row-click="1">
          <button class="action-btn btn-view" data-action="view" data-idx="${idx}">View</button>
          <button class="action-btn btn-reply" data-action="reply" data-idx="${idx}"><i class='bx bx-mail-send'></i> Reply</button>
          <button class="action-btn btn-contact" data-action="contact" data-id="${esc(c.id)}" data-coll="contacts" ${resolved?'disabled':''} title="Mark Contacted"><i class='bx bx-phone-call'></i></button>
          <button class="action-btn btn-resolve" data-action="resolve" data-id="${esc(c.id)}" data-coll="contacts" ${resolved?'disabled':''} title="Resolve"><i class='bx bx-check'></i></button>
          <button class="action-btn btn-delete" data-action="delete" data-id="${esc(c.id)}" data-coll="contacts" title="Archive"><i class='bx bx-trash'></i></button>
        </div>
      </td>
    </tr>`;
  }).join('');

  // Row click opens modal — ignores action buttons
  tb.querySelectorAll('tr.contact-row').forEach(row => {
    row.addEventListener('click', function(e) {
      if (e.target.closest('[data-no-row-click]') || e.target.closest('button')) return;
      const item = getItem(this.dataset.idx);
      if (item) openItemModal(item);
    });
  });
}

// ════════════════════════════════════════════════
// LEADS TABLE
// ════════════════════════════════════════════════
window.renderLeads = function() {
  const tb = document.getElementById('leadsTable');
  if (!tb) return;
  const seen = new Map();
  window.enquiriesData.forEach(i => {
    const key = (i.email || i.phone || i.name || '').toLowerCase();
    if (!seen.has(key)) seen.set(key, { ...i, count: 0 });
    seen.get(key).count++;
  });
  const leads = [...seen.values()];
  if (!leads.length) { tb.innerHTML = '<tr><td colspan="7" class="px-5 py-8 text-center text-slate-400">No leads yet.</td></tr>'; return; }
  const tagColors = { hot:'background:#fee2e2;color:#dc2626', warm:'background:#fff7ed;color:#c2410c', cold:'background:#eff6ff;color:#1d4ed8' };
  tb.innerHTML = leads.map(l => {
    const idx = storeItem(l);
    const savedTag = localStorage.getItem('tag_' + (l.email || l.name)) || 'warm';
    return `<tr class="hover:bg-slate-50 transition">
      <td class="px-5 py-3 font-semibold">${esc(l.name||'—')}</td>
      <td class="px-5 py-3 text-xs text-slate-500">${esc(l.email||'—')}</td>
      <td class="px-5 py-3 text-xs">${esc(l.phone||'—')}</td>
      <td class="px-5 py-3">${esc(l.city||'—')}</td>
      <td class="px-5 py-3 text-center font-bold text-slate-700">${l.count}</td>
      <td class="px-5 py-3">
        <select onchange="window.tagLead('${esc(l.email||l.name)}', this.value)" class="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none bg-white">
          ${['hot','warm','cold'].map(t => `<option value="${t}" ${savedTag===t?'selected':''}>${t.charAt(0).toUpperCase()+t.slice(1)}</option>`).join('')}
        </select>
      </td>
      <td class="px-5 py-3 text-right">
        <button class="action-btn btn-view mr-1" data-action="view" data-idx="${idx}">History</button>
        <button class="action-btn btn-reply" data-action="reply" data-idx="${idx}"><i class='bx bx-mail-send'></i></button>
      </td>
    </tr>`;
  }).join('');
};

window.tagLead = function(id, tag) {
  localStorage.setItem('tag_' + id, tag);
  window.showToast('Lead tagged as ' + tag, 'success');
};

// ════════════════════════════════════════════════
// PRODUCTS TABLE + CRUD (Firestore-backed)
// ════════════════════════════════════════════════
// ════════════════════════════════════════════════
// NEW: VISUAL CATALOGUE (Categorized Cards + Drag & Drop)
// ════════════════════════════════════════════════
function renderProductsTable() {
  const container = document.getElementById('categoryContainer');
  const searchInput = document.getElementById('productSearch');
  if (!container) return;
  
  let products = getAdminProducts();
  const query = (searchInput?.value || '').toLowerCase().trim();

  // 0. Filter by Search
  if (query) {
    products = products.filter(p => 
      (p.name || '').toLowerCase().includes(query) || 
      (p.categoryLabel || '').toLowerCase().includes(query)
    );
  }
  
  if (!products.length && query) {
    container.innerHTML = `<div class="py-20 text-center text-slate-400 italic"><i class="bx bx-search text-4xl mb-3"></i><p>No products match "${esc(query)}"</p></div>`;
    return;
  }

  if (!products.length) {
    container.innerHTML = '<div class="py-20 text-center text-slate-400 italic"><i class="bx bx-loader-alt bx-spin text-4xl mb-3"></i><p>Loading products…</p></div>';
    return;
  }

  // 1. Group products by Category
  const categories = {};
  products.forEach(p => {
    const cid = p.category || 'uncategorized';
    if (!categories[cid]) {
      categories[cid] = {
        id: cid,
        label: p.categoryLabel || cid.charAt(0).toUpperCase() + cid.slice(1),
        order: p.categoryOrder || 99,
        items: []
      };
    }
    categories[cid].items.push(p);
  });

  // 2. Sort categories by order
  const sortedCategories = Object.values(categories).sort((a,b) => a.order - b.order);

  // 3. Render HTML
  container.innerHTML = sortedCategories.map(cat => `
    <div class="category-block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" data-id="${esc(cat.id)}">
      <div class="category-header bg-slate-50 px-6 py-4 border-b flex justify-between items-center cursor-move">
        <div class="flex items-center gap-3">
          <i class='bx bx-dots-vertical-rounded text-slate-300 text-xl'></i>
          <h3 class="font-bold text-slate-800 flex items-center gap-2">
            ${esc(cat.label)} 
            <button onclick="window.renameCategory('${esc(cat.id)}', '${esc(cat.label)}')" class="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-emerald-600 transition-colors" title="Rename Category"><i class='bx bx-edit-alt text-sm'></i></button>
            <span class="bg-white/80 border border-slate-200 text-slate-500 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-tighter">${cat.items.length} Items</span>
          </h3>
        </div>
        <div class="flex items-center gap-2">
           <button onclick="window.quickAddProduct('${esc(cat.id)}', '${esc(cat.label)}')" class="text-[11px] font-bold text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 bg-white transition-all">+ Quick Add</button>
        </div>
      </div>
      
      <div class="product-grid p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-cat="${esc(cat.id)}">
        ${cat.items.sort((a,b)=>(a.order||99)-(b.order||99)).map(p => `
          <div class="product-card group relative bg-white border border-slate-100 rounded-xl p-3 flex flex-col gap-3 hover:shadow-xl hover:border-emerald-200 transition-all cursor-move ${p.status==='unavailable'?'opacity-70':''}" data-id="${esc(p.id)}">
            <div class="relative w-full aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-50">
              <img src="${esc(p.imageUrl || p.image || '')}" alt="" class="w-full h-full object-cover transition-transform group-hover:scale-105" onerror="this.src='';">
              
              <!-- Quick Actions Overlay -->
              <div class="absolute inset-x-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 animate-in fade-in slide-in-from-bottom-2">
                <button onclick="window.editProduct('${esc(p.id)}')" class="flex-1 bg-white/95 backdrop-blur shadow-lg py-2 rounded-lg text-slate-700 hover:text-emerald-600 transition-colors flex items-center justify-center gap-1.5 text-xs font-bold"><i class='bx bx-edit'></i> Edit</button>
                <button onclick="window.deleteProduct('${esc(p.id)}')" class="bg-white/95 backdrop-blur shadow-lg w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 transition-colors"><i class='bx bx-trash'></i></button>
              </div>

              <!-- Status Badge (Click to Toggle) -->
              <div class="absolute top-2 right-2">
                <button onclick="window.toggleQuickStatus('${esc(p.id)}', '${esc(p.status)}')" class="text-[9px] font-black uppercase px-2 py-1 rounded bg-white/90 backdrop-blur shadow-sm hover:scale-105 transition-transform ${p.status==='available'?'text-emerald-600':'text-red-500'}">
                  ${p.status || 'AVAILABLE'}
                </button>
              </div>

              <!-- Quick Image Upload -->
              <input type="file" id="img-upload-${p.id}" accept="image/jpeg,image/png,image/webp" class="hidden" onchange="window.handleProductImageUpload(event, '${p.id}')">
              <button onclick="document.getElementById('img-upload-${p.id}').click()" class="absolute top-2 left-2 w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 z-10" title="Change Photo"><i class='bx bx-camera'></i></button>
            </div>

            <div class="px-1 text-center">
              <h4 class="font-bold text-slate-800 truncate text-sm mb-0.5">${esc(p.name)}</h4>
              <p class="text-xs text-slate-500 font-medium">${esc(p.price || 'On Request')}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  // 4. Initialize Drag & Drop
  initSortable();
}
window.renderProductsTable = renderProductsTable;

function initSortable() {
  if (typeof Sortable === 'undefined') return;

  // Reorder categories
  const container = document.getElementById('categoryContainer');
  if (container) {
    Sortable.create(container, {
      animation: 150,
      handle: '.category-header',
      ghostClass: 'opacity-40',
      onEnd: async function() {
        _isSorting = true;
        const newOrder = this.toArray();
        const updates = [];
        newOrder.forEach((catId, index) => {
          // Update all products in this category with new categoryOrder
          getAdminProducts().filter(p => p.category === catId).forEach(p => {
            p.categoryOrder = index + 1;
            updates.push(window.fsaveProduct(p));
          });
        });
        await Promise.all(updates);
        window.showToast('Category layout saved!', 'success');
        _isSorting = false;
      }
    });
  }

  // Reorder products within stacks
  document.querySelectorAll('.product-grid').forEach(el => {
    Sortable.create(el, {
      animation: 150,
      group: 'products',
      ghostClass: 'opacity-40',
      onEnd: async function(evt) {
        _isSorting = true;
        const targetCatId = evt.to.dataset.cat;
        const newOrder = this.toArray();
        const updates = [];
        
        // When moving between categories, we need a template to sync labels/order
        const targetTemplate = getAdminProducts().find(x => x.category === targetCatId);

        newOrder.forEach((pid, index) => {
          const p = getAdminProducts().find(x => x.id === pid);
          if (p) {
            p.order = index + 1;
            p.category = targetCatId; 
            
            if (targetTemplate) {
              p.categoryLabel = targetTemplate.categoryLabel || p.categoryLabel;
              p.categoryOrder = targetTemplate.categoryOrder || p.categoryOrder;
            }
            
            updates.push(window.fsaveProduct(p));
          }
        });
        await Promise.all(updates);
        window.showToast('Product positions saved!', 'success');
        _isSorting = false;
      }
    });
  });
}

window.quickAddProduct = function(catId, catLabel) {
  window.openAddProductModal();
  document.getElementById('prodCategorySelect').value = catId;
  // Trigger change event to set hidden fields
  const event = new Event('change');
  document.getElementById('prodCategorySelect').dispatchEvent(event);
};

window.toggleQuickStatus = async function(id, current) {
  const next = current === 'available' ? 'unavailable' : 'available';
  try {
    await updateProductStatus(id, next);
    const p = window._adminProducts.find(x => x.id === id);
    if (p) p.status = next;
    renderProductsTable();
    window.showToast(`Status changed to ${next}`, 'success');
  } catch(e) { window.showToast('Failed to toggle status', 'error'); }
};

window.renameCategory = async function(catId, currentLabel) {
  const newLabel = prompt(`Rename category "${currentLabel}" to:`, currentLabel);
  if (!newLabel || newLabel === currentLabel) return;

  try {
    const products = getAdminProducts().filter(p => p.category === catId);
    const updates = products.map(p => {
      p.categoryLabel = newLabel;
      return window.fsaveProduct(p);
    });
    await Promise.all(updates);
    renderProductsTable();
    window.showToast('Category renamed successfully!', 'success');
  } catch(e) { window.showToast('Failed to rename category', 'error'); }
};

window.changeProductStatus = async function(id, status) {
  try {
    await updateProductStatus(id, status);
    const p = window._adminProducts.find(x => x.id === id);
    if (p) p.status = status;
    renderProductsTable();
    window.showToast('Status updated on website!', 'success');
  } catch(e) { window.showToast('Update failed: ' + e.message, 'error'); }
};

window.editProduct = function(id) {
  const p = getAdminProducts().find(x => x.id === id);
  if (!p) return;
  document.getElementById('productModalTitle').textContent = 'Edit Product';
  document.getElementById('prodEditId').value     = p.id;
  document.getElementById('prodName').value       = p.name;
  document.getElementById('prodCategory').value   = p.category || (p.categoryLabel||'').toLowerCase().replace(/[^a-z]/g,'') || '';
  document.getElementById('prodCatLabel').value   = p.categoryLabel || '';
  document.getElementById('prodCatOrder').value   = p.categoryOrder || 99;
  document.getElementById('prodPrice').value      = p.price || '';
  document.getElementById('prodDesc').value       = p.description || '';
  document.getElementById('prodImage').value      = p.image || '';
  document.getElementById('prodTag').value        = p.tag || '';
  document.getElementById('prodStatus').value     = p.status || 'available';
  document.getElementById('prodOrder').value      = p.order || 99;
  
  populateCategorySelect();
  const sel = document.getElementById('prodCategorySelect');
  if (sel) {
    const cat = p.category || '';
    // Check if category exists in dropdown
    let exists = false;
    for(let i=0; i<sel.options.length; i++) { if(sel.options[i].value === cat) { exists = true; break; } }
    
    if (exists) {
      sel.value = cat;
      document.getElementById('newCategoryWrap').style.display = 'none';
    } else {
      sel.value = 'NEW_CAT';
      document.getElementById('newCategoryWrap').style.display = 'block';
    }
  }

  // Modal Preview handling
  const preview = document.getElementById('modalImgPreview');
  const placeholder = document.getElementById('modalImgPlaceholder');
  if (preview && placeholder) {
    const url = p.imageUrl || p.image || '';
    if (url) {
      preview.src = url;
      preview.classList.remove('hidden');
      placeholder.classList.add('hidden');
    } else {
      preview.classList.add('hidden');
      placeholder.classList.remove('hidden');
    }
  }
  // Reset file input
  const fileInput = document.getElementById('prodImgFile');
  if (fileInput) fileInput.value = '';

  openModal('productModal');
};

window.handleModalImageChange = function(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const preview = document.getElementById('modalImgPreview');
  const placeholder = document.getElementById('modalImgPlaceholder');
  
  if (preview && placeholder) {
    const reader = new FileReader();
    reader.onload = (event) => {
      preview.src = event.target.result;
      preview.classList.remove('hidden');
      placeholder.classList.add('hidden');
    };
    reader.readAsDataURL(file);
  }
};

// ════════════════════════════════════════════════
// IMAGE UPLOAD (Storage)
// ════════════════════════════════════════════════
window.handleProductImageUpload = function(e, productId) {
  const file = e.target.files[0];
  if (!file) return;

  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const errorEl = document.getElementById(`img-error-${productId}`);
  const showError = (msg) => {
    errorEl.textContent = msg;
    errorEl.style.opacity = '1';
    setTimeout(() => errorEl.style.opacity = '0', 3000);
    e.target.value = '';
  };

  if (!validTypes.includes(file.type)) return showError("JPG, PNG or WebP only");
  if (file.size > 5 * 1024 * 1024) return showError("Under 5MB only");

  const inputEl    = e.target;
  const overlayEl  = document.getElementById(`img-overlay-${productId}`);
  const iconEl     = document.getElementById(`img-icon-${productId}`);
  const progressEl = document.getElementById(`img-progress-${productId}`);
  const displayEl  = document.getElementById(`img-display-${productId}`);

  inputEl.disabled = true;
  overlayEl.style.opacity = '1';
  iconEl.classList.add('hidden');
  progressEl.classList.remove('hidden');
  progressEl.textContent = '0%';

  const uploadRef = ref(storage, `products/${productId}/main.jpg`);
  const uploadTask = uploadBytesResumable(uploadRef, file);

  uploadTask.on('state_changed', 
    (snapshot) => {
      const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      progressEl.textContent = Math.round(prog) + '%';
    },
    (err) => {
      showError("Failed. Try again.");
      inputEl.disabled = false;
      overlayEl.style.opacity = '';
      iconEl.classList.remove('hidden');
      progressEl.classList.add('hidden');
    },
    async () => {
      try {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        await updateDoc(doc(db, 'products', productId), { imageUrl: url });
        displayEl.src = url;
        progressEl.textContent = '✓';
        progressEl.classList.replace('text-[10px]', 'text-sm');
        setTimeout(() => {
          inputEl.disabled = false;
          overlayEl.style.opacity = '';
          iconEl.classList.remove('hidden');
          progressEl.classList.add('hidden');
          progressEl.classList.replace('text-sm', 'text-[10px]');
          // Also update the local cached item so a rerender doesn't lose it
          const p = window._adminProducts.find(x => x.id === productId);
          if (p) p.imageUrl = url;
        }, 2000);
      } catch (err) {
        showError("Failed saving URL.");
        inputEl.disabled = false;
      }
    }
  );
};

window.deleteProduct = function(id) {
  pendingDeleteFn = async () => {
    try {
      await deleteProductById(id);
      window._adminProducts = window._adminProducts.filter(p => p.id !== id);
      renderProductsTable();
      closeModal('deleteModal');
      window.showToast('Product deleted from website', 'success');
    } catch(e) { window.showToast('Delete failed: ' + e.message, 'error'); closeModal('deleteModal'); }
  };
  openModal('deleteModal');
};

window.saveProduct = async function() {
  const saveBtn = document.querySelector('[data-action="save-product"]');
  if (saveBtn) { saveBtn.textContent = 'Saving…'; saveBtn.disabled = true; }
  
  const rawId   = document.getElementById('prodEditId').value.trim();
  const name    = document.getElementById('prodName').value.trim();
  const cat     = document.getElementById('prodCategory').value.trim();
  const catLbl  = document.getElementById('prodCatLabel')?.value.trim() || cat;
  const catOrd  = parseInt(document.getElementById('prodCatOrder')?.value || '99', 10);
  const priceV  = document.getElementById('prodPrice').value.trim();
  const desc    = document.getElementById('prodDesc')?.value.trim() || '';
  let   image   = document.getElementById('prodImage')?.value.trim() || '';
  const tag     = document.getElementById('prodTag')?.value.trim() || '';
  const status  = document.getElementById('prodStatus').value;
  const order   = parseInt(document.getElementById('prodOrder')?.value || '99', 10);
  
  const fileInput = document.getElementById('prodImgFile');
  const file = fileInput?.files[0];

  if (!name || !cat) { 
    window.showToast('Name and category are required', 'error'); 
    if(saveBtn){saveBtn.textContent='Save Product';saveBtn.disabled=false;} 
    return; 
  }

  // Generate ID from name if new
  const id = rawId || name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

  try {
    // 1. Handle Image Upload if needed
    if (file) {
      const loadingOverlay = document.getElementById('modalImgLoading');
      if (loadingOverlay) loadingOverlay.classList.remove('hidden');
      
      const uploadRef = ref(storage, `products/${id}/main.jpg`);
      await uploadBytesResumable(uploadRef, file);
      image = await getDownloadURL(uploadRef);
      
      if (loadingOverlay) loadingOverlay.classList.add('hidden');
    }

    // 2. Save Product Data
    const product = { 
      id, name, category:cat, categoryLabel:catLbl, categoryOrder:catOrd, 
      price:priceV||'On Request', description:desc, image, imageUrl: image, tag, status, order 
    };

    await fsaveProduct(product);
    const idx = window._adminProducts.findIndex(p => p.id === id);
    if (idx > -1) window._adminProducts[idx] = product; else window._adminProducts.push(product);
    window._adminProducts = sortProducts(window._adminProducts);
    renderProductsTable();
    closeModal('productModal');
    window.showToast(rawId ? 'Product updated on website!' : 'Product added to website!', 'success');
  } catch(e) { 
    console.error('Save error:', e);
    window.showToast('Save failed: ' + e.message, 'error'); 
  }
  finally { if(saveBtn){saveBtn.textContent='Save Product';saveBtn.disabled=false;} }
};

window.openAddProductModal = function() {
  document.getElementById('productModalTitle').textContent = 'Add Product';
  ['prodEditId','prodName','prodCategory','prodCatLabel','prodCatOrder','prodPrice','prodDesc','prodImage','prodTag', 'prodOrder', 'prodImgFile'].forEach(id => {
    const el = document.getElementById(id); if(el) el.value = '';
  });
  
  // Reset preview
  const preview = document.getElementById('modalImgPreview');
  const placeholder = document.getElementById('modalImgPlaceholder');
  if (preview && placeholder) {
    preview.src = '';
    preview.classList.add('hidden');
    placeholder.classList.remove('hidden');
  }

  const ps = document.getElementById('prodStatus'); if(ps) ps.value = 'available';
  populateCategorySelect();
  const sel = document.getElementById('prodCategorySelect'); if(sel) sel.value = '';
  document.getElementById('newCategoryWrap').style.display = 'none';
  openModal('productModal');
};

// ════════════════════════════════════════════════
// DELETE CONFIRMATION
// ════════════════════════════════════════════════
document.getElementById('btnConfirmDelete')?.addEventListener('click', () => {
  if (typeof pendingDeleteFn === 'function') pendingDeleteFn();
  pendingDeleteFn = null;
});

function confirmDeleteItem(id, coll) {
  pendingDeleteFn = async () => {
    try {
      await deleteDoc(doc(db, coll, id));
      window.enquiriesData = window.enquiriesData.filter(i => !(i.id === id && i.collection === coll));
      window._itemStore = [];
      window.enquiriesData.forEach(item => storeItem(item));
      updateStats(); updateBadge(); filterAndRender();
      renderRecentTable(window.enquiriesData.slice(0, 6));
      closeModal('deleteModal');
      window.showToast('Record deleted permanently', 'success');
    } catch(e) {
      console.error('Delete failed:', e);
      window.showToast('Error: Delete failed', 'error');
    }
  };
  openModal('deleteModal');
}
window.confirmDelete = confirmDeleteItem; // keep old name working

// ════════════════════════════════════════════════
// STATUS UPDATES
// ════════════════════════════════════════════════
async function updateFirebaseStatus(coll, id, status) {
  try { await updateDoc(doc(db, coll, id), { status }); }
  catch(e) { console.warn('Firebase write skipped:', e.message); }
}

function localUpdateStatus(id, coll, newStatus) {
  const item = window.enquiriesData.find(i => i.id === id && i.collection === coll);
  if (item) {
    item.status = newStatus;
    // Update stored copy too
    const storeIdx = window._itemStore.findIndex(i => i.id === id && i.collection === coll);
    if (storeIdx > -1) window._itemStore[storeIdx].status = newStatus;
  }
  updateStats(); updateBadge();
}

async function quickMark(id, coll, status) {
  localUpdateStatus(id, coll, status);
  filterAndRender();
  renderRecentTable(window.enquiriesData.slice(0, 6));
  // Update quotations/contacts specific tables too
  const quotes   = window.enquiriesData.filter(i => i.collection === 'quotations');
  const contacts = window.enquiriesData.filter(i => i.collection === 'contacts');
  renderQuotesTable(quotes);
  renderContactsTable(contacts);
  await updateFirebaseStatus(coll, id, status);
  window.showToast(`Marked as ${status}`, 'success');
}
window.quickMark = quickMark;

async function markAsFromModal(status) {
  if (!currentModalItem) return;
  const btnId = status === 'resolved' ? 'btnResolve' : (status === 'contacted' ? 'btnContactedMod' : 'btnMarkNew');
  const btn = document.getElementById(btnId);
  if (btn) { btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i>'; btn.disabled = true; }
  
  localUpdateStatus(currentModalItem.id, currentModalItem.collection, status);
  filterAndRender();
  renderRecentTable(window.enquiriesData.slice(0, 6));
  
  const sb = document.getElementById('mod-status-badge');
  if (sb) { sb.textContent = status.toUpperCase(); sb.className = `status-badge ${statusClass(status)}`; }
  
  await updateFirebaseStatus(currentModalItem.collection, currentModalItem.id, status);
  window.showToast(`Status updated to ${status}!`, 'success');
  
  // Re-run modal button logic to refresh visibility/states
  const item = window.enquiriesData.find(i => i.id === currentModalItem.id && i.collection === currentModalItem.collection);
  if (item) openItemModal(item);
}
window.markAs = markAsFromModal;

// ════════════════════════════════════════════════
// ENQUIRY DETAIL MODAL
// ════════════════════════════════════════════════
function openItemModal(item) {
  currentModalItem = item;
  const isQ = item.collection === 'quotations';

  const tb = document.getElementById('mod-type-badge');
  if (tb) { tb.className = `type-badge ${isQ?'type-quote':'type-contact'}`; tb.innerHTML = isQ ? "<i class='bx bxs-quote-left'></i> QUOTATION" : "<i class='bx bx-envelope'></i> CONTACT"; }

  const sb = document.getElementById('mod-status-badge');
  if (sb) { sb.className = `status-badge ${statusClass(item.status)}`; sb.textContent = (item.status||'PENDING').toUpperCase(); }

  const set = (id, v) => { const el = document.getElementById(id); if(el) el.textContent = v; };
  set('mod-date',    'Received: ' + fmtDate(item.timestamp));
  set('mod-avatar',  initials(item.name));
  set('mod-name',    item.name || 'Unknown');
  set('mod-city',    item.city || '—');
  set('mod-email',   item.email || '—');
  set('mod-phone',   item.phone || '—');
  set('mod-subject-label', isQ ? 'PRODUCT' : 'MESSAGE SUBJECT');
  set('mod-product', isQ ? (item.productInterest || item.product || '—') : (item.enquiryType||'General Enquiry'));
  set('mod-message', item.message || 'No message provided.');

  // Email link
  const emailEl = document.getElementById('mod-email');
  if (emailEl && item.email) { emailEl.style.cursor = 'pointer'; emailEl.onclick = () => doReply(item.email, item.name); }

  const notes = document.getElementById('mod-notes');
  if (notes) notes.value = localStorage.getItem('note_' + item.id) || '';

  const btnR = document.getElementById('btnResolve');
  if (btnR) {
    btnR.disabled = item.status === 'resolved';
    btnR.innerHTML = item.status === 'resolved' ? '<i class="bx bx-check"></i> Resolved' : '<i class="bx bx-check"></i> Resolve';
  }
  const btnC = document.getElementById('btnContactedMod');
  if (btnC) { 
    btnC.disabled = item.status === 'contacted'; 
    btnC.innerHTML = item.status === 'contacted' ? '<i class="bx bx-check"></i> Contacted' : '<i class="bx bx-phone-call"></i> Mark Contacted'; 
  }

  const btnN = document.getElementById('btnMarkNew');
  if (btnN) {
    btnN.style.display = (item.status && item.status !== 'new') ? 'flex' : 'none';
    btnN.disabled = false;
    btnN.innerHTML = "<i class='bx bx-undo'></i> Mark as New";
  }

  openModal('enquiryModal');
}
window.openItemModal = openItemModal;

// ════════════════════════════════════════════════
// NOTES
// ════════════════════════════════════════════════
window.saveNote = function() {
  if (!currentModalItem) return;
  const v = document.getElementById('mod-notes')?.value || '';
  localStorage.setItem('note_' + currentModalItem.id, v);
  window.showToast('Note saved!', 'success');
};

// ════════════════════════════════════════════════
// REPLY / EMAIL
// ════════════════════════════════════════════════
function doReply(email, name, subject) {
  if (!email) { window.showToast('No email address found', 'error'); return; }
  const sub  = encodeURIComponent(`Re: ${subject||'Your Enquiry'} — Vyankyaa Foods`);
  const body = encodeURIComponent(`Dear ${name||'Customer'},\n\nThank you for reaching out to Vyankyaa Foods.\n\nBest regards,\nVyankyaa Foods Team`);
  window.open(`mailto:${email}?subject=${sub}&body=${body}`, '_blank');
  window.showToast('Email client opened', 'info');
}
window.replyToUser = function() {
  if (currentModalItem) doReply(currentModalItem.email, currentModalItem.name, currentModalItem.product || currentModalItem.enquiryType);
};
window.replyTo = (o) => doReply(o.email, o.name, o.subject);

// ════════════════════════════════════════════════
// SEND QUOTATION MODAL
// ════════════════════════════════════════════════
window.openMakeQuoteModal = function(item) {
  const qe = document.getElementById('qEmail');
  const qp = document.getElementById('qProduct');
  
  // Populate dropdown first
  if (qp) {
    const prods = getAdminProducts() || [];
    qp.innerHTML = '<option value="" disabled selected>Select a product...</option>' + 
      prods.map(p => `<option value="${esc(p.name)}">${esc(p.name)}</option>`).join('');
  }

  if (item) {
    if (qe) qe.value = item.email  || '';
    if (qp) {
      const prodName = item.productInterest || item.product || '';
      // If we have a product name, set it. If it doesn't exist in the dropdown, the browser won't select it.
      qp.value = prodName;
      
      // Fallback: if product from enquiry isn't in our curated list, add it temporarily or just leave as is
      if (prodName && qp.value !== prodName) {
        const opt = document.createElement('option');
        opt.value = prodName;
        opt.textContent = prodName;
        qp.appendChild(opt);
        qp.value = prodName;
      }
    }
  } else {
    if (qe) qe.value = '';
    if (qp) qp.value = '';
  }
  ['qQty','qPrice','qNotes'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  openModal('quoteModal');
};

window.sendQuotation = function() {
  const email   = document.getElementById('qEmail')?.value.trim();
  const product = document.getElementById('qProduct')?.value.trim();
  const qty     = document.getElementById('qQty')?.value;
  const price   = document.getElementById('qPrice')?.value;
  const notes   = document.getElementById('qNotes')?.value || '';
  if (!email || !product) { window.showToast('Email and product name are required', 'error'); return; }
  const total = (qty && price) ? `\nTotal Estimate: ₹${(qty * price).toLocaleString('en-IN')}` : '';
  const body  = encodeURIComponent(`Dear Customer,\n\nThank you for your enquiry with Vyankyaa Foods.\n\nQUOTATION DETAILS:\nProduct: ${product}\nQuantity: ${qty||'TBD'} MT\nPrice/MT: ₹${price||'TBD'}${total}\n\n${notes}\n\nValid for 7 days. GST extra.\n\nBest regards,\nVyankyaa Foods Export Division\ncertifications@vyankyaafoods.com`);
  const sub   = encodeURIComponent(`Quotation: ${product} — Vyankyaa Foods`);
  window.open(`mailto:${email}?subject=${sub}&body=${body}`, '_blank');
  closeModal('quoteModal');
  window.showToast('Quotation email prepared!', 'success');
};

// ════════════════════════════════════════════════
// SETTINGS
// ════════════════════════════════════════════════
window.saveSettings = function() {
  const name  = document.getElementById('settingName')?.value;
  const notif = document.getElementById('settingNotifEmail')?.value;
  if (name)  localStorage.setItem('adminName', name);
  if (notif) localStorage.setItem('adminNotifEmail', notif);
  window.showToast('Settings saved!', 'success');
};

// ════════════════════════════════════════════════
// REPORTS
// ════════════════════════════════════════════════
window.renderReports = function() {
  const data = window.enquiriesData;
  if (!data.length) {
    ['chartTypeBreakdown','chartStatusBreakdown','chartTopProducts','chartCityBreakdown']
      .forEach(id => { const el = document.getElementById(id); if(el) el.innerHTML = '<p class="text-sm text-slate-400 italic">No data yet. Enquiries will appear here.</p>'; });
    return;
  }
  function barChart(containerId, entries, color) {
    const el = document.getElementById(containerId);
    if (!el || !entries.length) return;
    const max = Math.max(...entries.map(e => e[1]), 1);
    el.innerHTML = entries.map(([label, count]) => `
      <div class="flex items-center gap-3">
        <span class="text-xs text-slate-600 w-28 truncate font-medium">${esc(label)}</span>
        <div class="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
          <div class="${color} h-2 rounded-full" style="width:${((count/max)*100).toFixed(0)}%;transition:width .6s ease"></div>
        </div>
        <span class="text-xs font-bold text-slate-700 w-6 text-right">${count}</span>
      </div>`).join('');
  }
  barChart('chartTypeBreakdown', [
    ['Quotations', data.filter(d => d.collection==='quotations').length],
    ['Messages',   data.filter(d => d.collection==='contacts').length]
  ], 'bg-pink-400');
  barChart('chartStatusBreakdown', [
    ['Pending',   data.filter(d => ['new','pending'].includes(d.status||'pending')).length],
    ['Resolved',  data.filter(d => d.status==='resolved').length],
    ['Contacted', data.filter(d => d.status==='contacted').length]
  ], 'bg-blue-400');
  const pc = {};
  data.filter(d => d.productInterest || d.product).forEach(d => { 
    const pName = d.productInterest || d.product;
    pc[pName] = (pc[pName]||0)+1; 
  });
  barChart('chartTopProducts', Object.entries(pc).sort((a,b)=>b[1]-a[1]).slice(0,5), 'bg-emerald-400');
  const cc = {};
  data.filter(d => d.city).forEach(d => { cc[d.city] = (cc[d.city]||0)+1; });
  barChart('chartCityBreakdown', Object.entries(cc).sort((a,b)=>b[1]-a[1]).slice(0,8), 'bg-purple-400');
};

// ════════════════════════════════════════════════
// GENERATE REPORT / CSV
// ════════════════════════════════════════════════
window.generateReport = function() {
  if (!window.enquiriesData?.length) { window.showToast('No data to export yet', 'info'); return; }
  const rows = [['Date','Type','Customer','Email','Phone','City','Product/Subject','Message','Status']];
  window.enquiriesData.forEach(d => rows.push([
    fmtDate(d.timestamp), d.collection, d.name||'', d.email||'', d.phone||'', d.city||'',
    d.product||d.enquiryType||'', (d.message||'').replace(/\n/g,' '), d.status||'pending'
  ]));
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = `vyankyaa-enquiries-${Date.now()}.csv`;
  a.click();
  window.showToast('CSV downloaded!', 'success');
};

// ════════════════════════════════════════════════
// GLOBAL SEARCH (from topbar)
// ════════════════════════════════════════════════
document.getElementById('globalSearch')?.addEventListener('input', function() {
  const val = this.value.trim();
  if (val) {
    switchNav('dash-enquiries');
    if (filterSearch) { filterSearch.value = val; filterAndRender(); }
  }
});

// ════════════════════════════════════════════════
// PHASE 8 — QA SELF-TEST (runs after 2s)
// ════════════════════════════════════════════════
setTimeout(() => {
  let broken = 0;
  document.querySelectorAll('button, a[href="#"], [data-action]').forEach(el => {
    const hasHandler = el.onclick || el.dataset.action || el.type === 'submit' ||
      el.closest('form') || el.href?.startsWith('http') || el.href?.startsWith('mailto') ||
      el.href?.startsWith('/') || el.dataset.target;
    if (!hasHandler) {
      console.warn('[QA] Unhandled interactive element:', el.outerHTML.slice(0,80));
      broken++;
    }
  });
  if (broken === 0) console.info('[QA] ✅ All interactive elements have handlers.');
  else console.warn(`[QA] ⚠ ${broken} elements lack handlers — check console above.`);
}, 2000);

// ════════════════════════════════════════════════
// HELPERS exposed to HTML inline
// ════════════════════════════════════════════════
function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
window.openModal  = openModal;
window.closeModal = closeModal;
window.switchNav  = window.switchNav || function() {}; // set from HTML inline script
