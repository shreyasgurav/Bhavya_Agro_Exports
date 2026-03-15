/* ═══════════════════════════════════════════
   Bhavya Agro Exports — SHARED JS
   ═══════════════════════════════════════════ */

/**
 * LOAD COMPONENTS (NAV, FOOTER)
 */
function loadComponent(id, url, callback) {
  const el = document.getElementById(id);
  if (!el) return;
  fetch(url)
    .then(r => r.text())
    .then(html => {
      el.outerHTML = html;
      
      // Re-initialize icon libraries for dynamic content
      if (typeof feather !== 'undefined') feather.replace();
      if (typeof lucide !== 'undefined') lucide.createIcons();
      if (typeof boxicons !== 'undefined' && boxicons.init) boxicons.init();

      if (callback) callback();
      if (id === 'nav-placeholder') initNav();
    })
    .catch(err => console.error('Error loading component:', err));
}

/**
 * INITIALIZE NAVIGATION
 * This function is called after nav.html is fetched or as soon as DOM is ready
 */
function initNav() {

  const nav = document.getElementById('mainNav');
  if (!nav) return;

  // Nav scroll effect
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 50);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Active link state
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-drawer a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}

// Global Event Delegation for Hamburger and Drawer
document.addEventListener('click', (e) => {
  const burger = e.target.closest('#navBurger');
  const drawer = document.getElementById('mobileDrawer');
  
  if (burger && drawer) {
    const burgerSpans = burger.querySelectorAll('span');
    const isOpen = drawer.classList.toggle('open');
    
    drawer.style.display = isOpen ? 'flex' : 'none';
    if (isOpen) {
      requestAnimationFrame(() => drawer.style.opacity = '1');
      document.body.style.overflow = 'hidden';
      // Burger icon animation
      burgerSpans[0].style.transform = 'rotate(45deg) translate(5px, 6px)';
      burgerSpans[1].style.opacity = '0';
      burgerSpans[2].style.transform = 'rotate(-45deg) translate(5px, -6px)';
    } else {
      drawer.style.opacity = '0';
      document.body.style.overflow = '';
      // Reset burger icon
      burgerSpans.forEach(s => { s.style.transform = ''; s.style.opacity = '1'; });
    }
    return;
  }

  // Close drawer when clicking a link
  const navLink = e.target.closest('.mobile-drawer a');
  if (navLink && drawer) {
    drawer.classList.remove('open');
    drawer.style.display = 'none';
    drawer.style.opacity = '0';
    document.body.style.overflow = '';
    const burgerEl = document.getElementById('navBurger');
    if (burgerEl) {
      const spans = burgerEl.querySelectorAll('span');
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = '1'; });
    }
    return;
  }

  // Close drawer when clicking outside
  if (drawer && drawer.classList.contains('open') && !e.target.closest('#mobileDrawer') && !e.target.closest('#navBurger')) {
    drawer.classList.remove('open');
    drawer.style.display = 'none';
    drawer.style.opacity = '0';
    document.body.style.overflow = '';
    const burgerEl = document.getElementById('navBurger');
    if (burgerEl) {
      const spans = burgerEl.querySelectorAll('span');
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = '1'; });
    }
  }
});

/* ── PRE-FETCH PRODUCTS & POPULATE MARQUEE ── */
// Only try if not on admin page (to avoid module conflicts)
if (!window.location.pathname.includes('admin')) {
  import('./products-service.js')
    .then(async m => {
      // 1. Prefetch for other pages
      m.prefetchProducts();
      
      // 2. Populate Product Marquees if they exist (Home & Products Pages)
      const isProductPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('products.html') || window.location.pathname === '/';
      const marqueeTracks = document.querySelectorAll('.marquee-track');
      
      if (marqueeTracks.length > 0 && isProductPage) {
        const products = await m.fetchPublicProducts();
        if (products && products.length > 0) {
          const itemsHtml = products.map(p => `<span class="marquee-item">${p.name}</span>`).join('');
          
          marqueeTracks.forEach(track => {
            // Only replace if it looks like the product marquee (contains current hardcoded items)
            // or if it's the main one on the home page.
            const currentContent = track.innerHTML.toLowerCase();
            if (currentContent.includes('oil') || currentContent.includes('rice') || currentContent.includes('wheat')) {
              track.innerHTML = itemsHtml + itemsHtml;
            }
          });
          
          console.info(`[Marquee] Dynamically updated ${marqueeTracks.length} product strip(s).`);
        }
      }
    })
    .catch(e => console.warn('Product initialization skipped:', e));
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize nav if it's already in DOM (e.g. static pages)
  initNav();

  /* ── SCROLL REVEAL ── */
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ── COUNT-UP ── */
  function countUp(el, target, suffix) {
    let count = 0;
    const step = target / 55;
    const t = setInterval(() => {
      count = Math.min(count + step, target);
      el.textContent = (target >= 1000
        ? (count / 1000).toFixed(0) + 'K'
        : Math.floor(count)) + suffix;
      if (count >= target) clearInterval(t);
    }, 22);
  }
  const statObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.querySelectorAll('.val').forEach(n => {
        const raw = n.textContent.trim();
        const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
        const suffix = raw.replace(/[0-9.]/g, '');
        if (!isNaN(num)) countUp(n, num, suffix);
      });
      statObserver.unobserve(e.target);
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.stats-row, .about-stats').forEach(el => statObserver.observe(el));

  /* ── FILTER TABS ── */
  document.addEventListener('click', (e) => {
    const tab = e.target.closest('.filter-tab');
    if (!tab) return;
    
    const parent = tab.closest('.filter-tabs');
    parent.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const cat = tab.dataset.filter;
    document.querySelectorAll('[data-category]').forEach(card => {
      card.style.display = (cat === 'all' || card.dataset.category === cat) ? '' : 'none';
    });
  });
});
