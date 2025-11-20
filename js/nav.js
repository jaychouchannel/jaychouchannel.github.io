// Modern nav interactions: sliding indicator + ripple click effect
(function(){
  function initNav() {
    var navContainer = document.querySelector('.nav-container');
    var links = Array.from(document.querySelectorAll('.nav-links a'));
    if (!navContainer || links.length === 0) return;

    // Create indicator
    var indicator = document.createElement('div');
    indicator.className = 'nav-indicator';
    navContainer.appendChild(indicator);

    // Position indicator to active link or first link
    function placeIndicator(el, animate) {
      if (!el) return;
      var rect = el.getBoundingClientRect();
      var parentRect = navContainer.getBoundingClientRect();
      var left = rect.left - parentRect.left + (el.offsetWidth/10);
      var width = rect.width - (el.offsetWidth/5);
      if (!animate) {
        indicator.style.transition = 'none';
      } else {
        indicator.style.transition = '';
      }
      indicator.style.width = width + 'px';
      indicator.style.transform = 'translateX(' + left + 'px)';
      // restore transition after forcing layout
      if (!animate) {
        // force reflow then restore
        void indicator.offsetWidth;
        indicator.style.transition = '';
      }
    }

    var active = links.find(function(a){ return a.classList.contains('active'); }) || links[0];
    placeIndicator(active, false);

    // Hover interactions
    links.forEach(function(a){
      a.addEventListener('mouseenter', function(){ placeIndicator(a, true); });
      a.addEventListener('focus', function(){ placeIndicator(a, true); });
      a.addEventListener('click', function(e){
        // ripple effect
        var ripple = document.createElement('span');
        ripple.className = 'nav-ripple';
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '999px';
        ripple.style.pointerEvents = 'none';
        ripple.style.background = 'rgba(255,255,255,0.12)';
        ripple.style.transform = 'scale(0)';
        ripple.style.transition = 'transform 360ms ease, opacity 360ms ease';
        // append to the link
        a.style.position = 'relative';
        a.appendChild(ripple);
        // size and position
        var rect = a.getBoundingClientRect();
        var size = Math.max(rect.width, rect.height) * 1.4;
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (rect.width/2 - size/2) + 'px';
        ripple.style.top = (rect.height/2 - size/2) + 'px';
        // trigger
        requestAnimationFrame(function(){ ripple.style.transform = 'scale(1)'; ripple.style.opacity = '1'; });
        setTimeout(function(){ ripple.style.opacity = '0'; ripple.style.transform = 'scale(1.1)'; }, 300);
        setTimeout(function(){ if (ripple && ripple.parentNode) ripple.parentNode.removeChild(ripple); }, 700);
      });
    });

    // When leaving nav area, return indicator to active
    navContainer.addEventListener('mouseleave', function(){
      var activeNow = links.find(function(a){ return a.classList.contains('active'); }) || links[0];
      placeIndicator(activeNow, true);
    });

    // Responsiveness: on resize, reposition
    window.addEventListener('resize', function(){
      var activeNow = links.find(function(a){ return a.classList.contains('active'); }) || links[0];
      placeIndicator(activeNow, false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
})();
