// nav-fix.js
// 动态同步导航高度到 CSS 变量 --nav-height，修复固定导航遮挡问题
// 同时实现简单的移动端菜单开/关逻辑（如果存在 .mobile-menu）
// 需在模板中以 <script src="/js/nav-fix.js" defer></script> 引入

(function () {
  'use strict';

  function syncNavHeight() {
    var nav = document.querySelector('nav');
    if (!nav) return;
    // 获取实际高度（包括边框与内边距）
    var height = nav.offsetHeight;
    // 最小值保护（防止 0）
    if (!height || height < 48) height = 64;
    // 写回到 :root CSS 变量
    document.documentElement.style.setProperty('--nav-height', height + 'px');
    // 兼容性：同步 html scroll-padding-top 和 body padding-top（防止被遮挡）
    document.documentElement.style.scrollPaddingTop = height + 'px';
    document.body.style.paddingTop = height + 'px';
  }

  function initMobileMenuToggle() {
    var btn = document.getElementById('mobile-menu-button');
    var menu = document.querySelector('.mobile-menu');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      if (!menu) {
        // 如果没有显式 .mobile-menu 元素，可以尝试切换 body 类以供样式处理
        document.body.classList.toggle('mobile-menu-open');
      } else {
        menu.classList.toggle('open');
      }
    });

    // 点击菜单外部区域时自动关闭（若存在 .mobile-menu）
    document.addEventListener('click', function (e) {
      if (!menu || !btn) return;
      if (menu.classList.contains('open')) {
        var isClickInside = menu.contains(e.target) || btn.contains(e.target);
        if (!isClickInside) {
          menu.classList.remove('open');
          btn.setAttribute('aria-expanded', 'false');
        }
      }
    }, true);
  }

  // 防抖 helper
  function debounce(fn, wait) {
    var t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, wait || 100);
    };
  }

  document.addEventListener('DOMContentLoaded', function () {
    syncNavHeight();
    initMobileMenuToggle();
  });

  // 在 resize 或字体加载变动时重新测量（例如 logo 文本换行）
  window.addEventListener('resize', debounce(syncNavHeight, 120));
  window.addEventListener('load', debounce(syncNavHeight, 120));
})();