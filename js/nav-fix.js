// 动态同步导航高度到 CSS 变量 --nav-height，并实现移动菜单开/关逻辑
(function () {
  function setNavHeight() {
    var nav = document.getElementById('site-nav');
    if (!nav) return;
    // Use scrollHeight to include wrapping content; offsetHeight is fine too
    var h = nav.offsetHeight || nav.scrollHeight || 64;
    if (h < 48) h = 64;
    document.documentElement.style.setProperty('--nav-height', h + 'px');
    // Also ensure body padding top (defensive)
    document.body.style.paddingTop = h + 'px';
  }

  function setupMobileMenu() {
    var btn = document.getElementById('mobile-menu-button');
    var menu = document.getElementById('mobile-menu');
    var closeBtn = document.getElementById('mobile-close');

    function openMenu() {
      if (menu) menu.classList.add('open');
      if (btn) btn.setAttribute('aria-expanded', 'true');
      if (menu) menu.setAttribute('aria-hidden', 'false');
      document.documentElement.style.overflow = 'hidden';
    }
    function closeMenu() {
      if (menu) menu.classList.remove('open');
      if (btn) btn.setAttribute('aria-expanded', 'false');
      if (menu) menu.setAttribute('aria-hidden', 'true');
      document.documentElement.style.overflow = '';
    }

    if (btn && menu) {
      btn.addEventListener('click', function (e) {
        var opened = btn.getAttribute('aria-expanded') === 'true';
        if (opened) closeMenu();
        else openMenu();
      });
    }
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);

    // click outside to close
    document.addEventListener('click', function (e) {
      if (!menu || !menu.classList.contains('open')) return;
      var inside = menu.contains(e.target) || (btn && btn.contains(e.target));
      if (!inside) closeMenu();
    }, true);

    // close on escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeMenu();
      }
    });
  }

  // debounce util
  function debounce(fn, wait) {
    var t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, wait || 100);
    };
  }

  document.addEventListener('DOMContentLoaded', function () {
    setNavHeight();
    setupMobileMenu();
    // observe nav size changes (logo font load, dynamic wrap)
    var nav = document.getElementById('site-nav');
    if (nav && window.ResizeObserver) {
      var ro = new ResizeObserver(debounce(setNavHeight, 80));
      ro.observe(nav);
    }
  });

  window.addEventListener('load', function () { setNavHeight(); });
  window.addEventListener('resize', debounce(setNavHeight, 120));
})();