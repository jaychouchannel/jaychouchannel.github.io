// Lightweight enhancements for article pages:
// - reading progress bar
// - auto TOC (desktop)
// - code copy buttons
// - image lightbox
// - smooth anchor scrolling (accounting for nav height)

document.addEventListener('DOMContentLoaded', () => {
  initReadingProgress();
  initTOC();
  initCodeCopy();
  initImageLightbox();
  initSmoothAnchors();
  observeActiveHeading();
});

/* ---------- reading progress ---------- */
function initReadingProgress() {
  const progress = document.getElementById('reading-progress');
  const article = document.querySelector('.article-content');
  if (!progress || !article) return;

  const update = () => {
    const articleRect = article.getBoundingClientRect();
    const articleTop = window.scrollY + articleRect.top;
    const articleHeight = article.offsetHeight;
    const scrollPos = window.scrollY;
    const progressVal = Math.min(100, Math.max(0, ((scrollPos - articleTop) / articleHeight) * 100));
    progress.style.width = `${progressVal}%`;
  };

  window.addEventListener('scroll', throttle(update, 50));
  window.addEventListener('resize', throttle(update, 150));
  update();
}

/* ---------- TOC generation ---------- */
function initTOC() {
  const content = document.querySelector('.article-content');
  if (!content) return;
  const headings = content.querySelectorAll('h2, h3');
  if (!headings.length) return;

  // Create TOC container and insert into DOM (right side)
  // Find a container element, or inject into page layout
  const toc = document.createElement('nav');
  toc.className = 'toc';
  toc.setAttribute('aria-label', '文章目录');
  toc.innerHTML = '<h4>目录</h4><ul></ul>';
  const ul = toc.querySelector('ul');

  headings.forEach(h => {
    if (!h.id) {
      // generate id from text
      h.id = slugify(h.textContent);
    }
    const a = document.createElement('a');
    a.href = `#${h.id}`;
    a.textContent = (h.tagName.toLowerCase() === 'h2' ? '• ' : '↳ ') + h.textContent;
    a.dataset.targetId = h.id;
    const li = document.createElement('li');
    li.appendChild(a);
    ul.appendChild(li);
  });

  // Try to insert toc: if page has a aside or layout, place it; otherwise append to article parent
  const articleWrapper = document.querySelector('.article-wrapper');
  if (articleWrapper) {
    // create a two-column layout wrapper if not present
    const parent = articleWrapper.parentElement;
    const layout = document.createElement('div');
    layout.className = 'container mx-auto px-4';
    layout.style.display = 'grid';
    layout.style.gridTemplateColumns = `1fr ${getComputedStyle(document.documentElement).getPropertyValue('--toc-width') || '260px'}`;
    layout.style.gap = '24px';

    // move articleWrapper into layout and add toc
    parent.replaceChild(layout, articleWrapper);
    layout.appendChild(articleWrapper);
    layout.appendChild(toc);
  } else {
    // fallback: append to body
    document.body.appendChild(toc);
  }

  // smooth scroll on click
  toc.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const id = a.dataset.targetId;
      const el = document.getElementById(id);
      if (!el) return;
      smoothScrollToElement(el);
    });
  });
}

/* ---------- highlight active heading in toc ---------- */
function observeActiveHeading() {
  const content = document.querySelector('.article-content');
  if (!content) return;
  const headings = content.querySelectorAll('h2, h3');
  if (!headings.length) return;

  const options = {
    root: null,
    rootMargin: `-40% 0px -40% 0px`,
    threshold: 0
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        document.querySelectorAll('.toc a').forEach(a => a.classList.toggle('active', a.dataset.targetId === id));
      }
    });
  }, options);

  headings.forEach(h => observer.observe(h));
}

/* ---------- code copy buttons ---------- */
function initCodeCopy() {
  document.querySelectorAll('.article-content pre').forEach(pre => {
    // skip if already has a button
    if (pre.querySelector('.code-copy-btn')) return;

    const btn = document.createElement('button');
    btn.className = 'code-copy-btn';
    btn.type = 'button';
    btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 9H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>复制</span>';

    btn.addEventListener('click', async () => {
      const codeEl = pre.querySelector('code');
      if (!codeEl) return;
      const text = codeEl.innerText;
      try {
        await navigator.clipboard.writeText(text);
        btn.innerHTML = '已复制';
        setTimeout(() => {
          btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 9H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>复制</span>';
        }, 1500);
      } catch (err) {
        console.error('复制失败', err);
      }
    });

    pre.appendChild(btn);
  });
}

/* ---------- image lightbox ---------- */
function initImageLightbox() {
  // create lightbox element
  const lightbox = document.createElement('div');
  lightbox.className = 'img-lightbox';
  lightbox.innerHTML = '<div class="inner" role="dialog" aria-modal="true"><img src="" alt=""><div class="caption"></div></div>';
  document.body.appendChild(lightbox);

  const imgEl = lightbox.querySelector('img');
  const captionEl = lightbox.querySelector('.caption');

  document.querySelectorAll('.article-content img').forEach(img => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => {
      imgEl.src = img.src;
      imgEl.alt = img.alt || '';
      captionEl.textContent = img.getAttribute('data-caption') || img.alt || '';
      lightbox.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    });
  });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target === imgEl) {
      lightbox.style.display = 'none';
      document.body.style.overflow = '';
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      lightbox.style.display = 'none';
      document.body.style.overflow = '';
    }
  });
}

/* ---------- smooth anchors (account for fixed nav) ---------- */
function initSmoothAnchors() {
  const nav = document.querySelector('nav');
  const navHeight = nav ? nav.offsetHeight : parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 64;

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (!href || href === '#') return;
      const el = document.querySelector(href);
      if (!el) return;
      e.preventDefault();
      smoothScrollToElement(el, navHeight + 12);
    });
  });
}

/* ---------- utilities ---------- */
function smoothScrollToElement(el, offset = null) {
  const nav = document.querySelector('nav');
  const navHeight = offset !== null ? offset : (nav ? nav.offsetHeight : parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 64);
  const top = window.scrollY + el.getBoundingClientRect().top - navHeight - 8;
  window.scrollTo({ top, behavior: 'smooth' });
}

function slugify(text) {
  return text.toString().toLowerCase().trim()
    .replace(/[\s+~\/]/g, '-')
    .replace(/[^
      w-]+/g, '')
    .replace(/--+/g, '-');
}

function throttle(fn, wait) {
  let last = 0;
  return function(...args) {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn.apply(this, args);
    }
  };
}