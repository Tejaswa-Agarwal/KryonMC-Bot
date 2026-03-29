(function () {
  const sidebarKey = 'axion-sidebar-collapsed';

  function setSidebarCollapsed(v) {
    document.body.classList.toggle('sidebar-collapsed', v);
    localStorage.setItem(sidebarKey, v ? '1' : '0');
  }

  const saved = localStorage.getItem(sidebarKey) === '1';
  setSidebarCollapsed(saved);

  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('[data-sidebar-toggle]');
    if (toggle) {
      setSidebarCollapsed(!document.body.classList.contains('sidebar-collapsed'));
      return;
    }

    const tab = e.target.closest('[data-tab-btn]');
    if (tab) {
      const group = tab.getAttribute('data-tab-group');
      const target = tab.getAttribute('data-tab-btn');
      document.querySelectorAll(`[data-tab-btn][data-tab-group="${group}"]`).forEach(b => b.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll(`[data-tab-panel][data-tab-group="${group}"]`).forEach(p => {
        p.classList.toggle('active', p.getAttribute('data-tab-panel') === target);
      });
      return;
    }
  });

  const wrap = document.createElement('div');
  wrap.className = 'toast-wrap';
  document.body.appendChild(wrap);

  window.axionToast = function (message, type) {
    const el = document.createElement('div');
    el.className = `toast ${type || 'ok'}`;
    el.textContent = message;
    wrap.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(4px)';
      setTimeout(() => el.remove(), 180);
    }, 2600);
  };

  window.axionSetSaving = function (btn, saving) {
    if (!btn) return;
    if (saving) {
      btn.dataset.prev = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="loading-dot"></span> Saving...';
    } else {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.prev || 'Save';
    }
  };
})();
