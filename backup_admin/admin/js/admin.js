// Bhavya Agro Admin - Auth Guard, Navigation, Cursor, Toast, Modals
window.showToast = function(message, type = 'info') {
  const container = document.querySelector('.toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const iconMap = {
    success: 'check-circle',
    error: 'alert-circle',
    info: 'info'
  };
  
  toast.innerHTML = `
    <i data-lucide="${iconMap[type]}" class="toast-icon"></i>
    <span class="toast-message">${message}</span>
  `;
  
  container.appendChild(toast);
  lucide.createIcons();
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Auto dismiss
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

function createToastContainer() {
  const container = document.createElement('div');
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

window.showConfirm = function(title, message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `
    <div class="modal-panel" style="max-width: 400px;">
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div style="text-align: center; padding: 24px 0;">
        <i data-lucide="alert-triangle" style="width: 48px; height: 48px; color: var(--clay); margin-bottom: 16px;"></i>
        <p style="color: var(--light-text); margin-bottom: 24px;">${message}</p>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button class="btn btn-clay" onclick="confirmAction()">Delete</button>
          <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  lucide.createIcons();
  
  window.confirmAction = function() {
    onConfirm();
    overlay.remove();
  };
};

// Custom Cursor
document.addEventListener('DOMContentLoaded', function() {
  const cursor = document.createElement('div');
  cursor.className = 'custom-cursor';
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  document.body.appendChild(cursor);
  document.body.appendChild(ring);
  
  let mouseX = 0, mouseY = 0;
  let ringX = 0, ringY = 0;
  
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';
  });
  
  function animateRing() {
    ringX += (mouseX - ringX) * 0.13;
    ringY += (mouseY - ringY) * 0.13;
    ring.style.left = ringX + 'px';
    ring.style.top = ringY + 'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();
  
  // Hide cursor when leaving window
  document.addEventListener('mouseleave', () => {
    cursor.style.display = 'none';
    ring.style.display = 'none';
  });
  
  document.addEventListener('mouseenter', () => {
    cursor.style.display = 'block';
    ring.style.display = 'block';
  });
});

// Auth Guard - Disabled for direct access
function checkAuth() {
  return true; // Always allow access
}

// Navigation
function initNavigation() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navItems = document.querySelectorAll('.sidebar-nav-item');
  
  navItems.forEach(item => {
    const href = item.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      item.classList.add('active');
    }
  });
}

// Logout
function logout() {
  sessionStorage.clear();
  window.location.href = 'login.html';
}

// Mobile Block Check
function checkMobile() {
  if (window.innerWidth < 900) {
    const existingBlock = document.querySelector('.mobile-block');
    if (!existingBlock) {
      const block = document.createElement('div');
      block.className = 'mobile-block';
      block.innerHTML = `
        <div>
          <i data-lucide="monitor"></i>
          <h2>Desktop Required</h2>
          <p>Admin Panel requires a desktop browser for full functionality.</p>
        </div>
      `;
      document.body.appendChild(block);
      lucide.createIcons();
    }
    return true;
  }
  
  const existingBlock = document.querySelector('.mobile-block');
  if (existingBlock) {
    existingBlock.remove();
  }
  return false;
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  if (!checkAuth()) return;
  
  checkMobile();
  window.addEventListener('resize', checkMobile);
  initNavigation();
  
  // Initialize Lucide icons
  lucide.createIcons();
  
  // Seed data if needed
  BA.seed();
});
