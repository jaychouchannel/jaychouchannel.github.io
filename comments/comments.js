/* comments.js
   通用评论组件（支持 Firestore 回退到 localStorage）
   使用方式：
     1. 在文章页面放入 <div id="comments-root" data-page="/articles/xxx.html"></div>
     2. 在页面引入 /comments/styles.css
     3. 在页面引入 this 脚本（建议放在 body 末尾）： <script src="/comments/comments.js" defer></script>
     4. 可选：在页面头部或 /comments/config.js 中提供 window.FIREBASE_CONFIG
*/

(function () {
  if (window.__COMMENTS_LOADED__) return;
  window.__COMMENTS_LOADED__ = true;

  const ROOT_ID = 'comments-root';
  const root = document.getElementById(ROOT_ID);
  if (!root) {
    // nothing to mount
    return;
  }

  // Determine page identifier (prefer data-page attribute or location.pathname)
  const pageId = root.dataset.page || location.pathname || 'unknown_page';
  const localKey = 'comments:local:' + encodeURIComponent(pageId);

  // Basic DOM structure
  root.innerHTML = `
    <div class="comments-widget">
      <div class="comments-header">
        <h3>评论</h3>
        <div class="comments-sub">支持 Firebase（跨设备）或 localStorage 回退</div>
      </div>

      <div class="comments-form" id="cw-form">
        <div class="cw-row">
          <input id="cw-name" placeholder="昵称 (必填)" />
          <input id="cw-email" placeholder="邮箱 (不会公开，仅用于识别)" />
          <button id="cw-save-identity" class="cw-btn">保存身份</button>
        </div>
        <textarea id="cw-content" rows="4" placeholder="写下你的评论..." ></textarea>
        <div class="cw-actions">
          <div class="cw-note">你可以保存昵称与邮箱以便下次快速发表评论。</div>
          <div>
            <button id="cw-submit" class="cw-btn primary">发布评论</button>
            <button id="cw-clear" class="cw-btn">清空</button>
          </div>
        </div>
      </div>

      <div id="cw-list" class="comments-list">
        <div class="cw-empty">加载中...</div>
      </div>
    </div>
  `;

  // Elements
  const nameEl = root.querySelector('#cw-name');
  const emailEl = root.querySelector('#cw-email');
  const saveIdentityBtn = root.querySelector('#cw-save-identity');
  const contentEl = root.querySelector('#cw-content');
  const submitBtn = root.querySelector('#cw-submit');
  const clearBtn = root.querySelector('#cw-clear');
  const listEl = root.querySelector('#cw-list');

  // Utility: show toast (simple)
  function toast(msg) {
    // simple alert fallback
    try {
      const t = document.createElement('div');
      t.className = 'cw-toast';
      t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(() => t.classList.add('show'), 10);
      setTimeout(() => t.classList.remove('show'), 2500);
      setTimeout(() => document.body.removeChild(t), 3000);
    } catch (e) {
      console.log('[comments] ', msg);
    }
  }

  // Identity local storage
  function loadIdentity() {
    try {
      const raw = localStorage.getItem('comments:identity');
      if (!raw) return;
      const o = JSON.parse(raw);
      if (o.name) nameEl.value = o.name;
      if (o.email) emailEl.value = o.email;
    } catch (e) { /* ignore */ }
  }
  function saveIdentity() {
    try {
      const o = { name: nameEl.value.trim(), email: emailEl.value.trim() };
      localStorage.setItem('comments:identity', JSON.stringify(o));
      toast('已保存昵称与邮箱');
    } catch (e) {
      console.warn(e);
      toast('保存失败');
    }
  }

  saveIdentityBtn && saveIdentityBtn.addEventListener('click', (e) => { e.preventDefault(); saveIdentity(); });

  clearBtn && clearBtn.addEventListener('click', (e) => {
    e.preventDefault();
    nameEl.value = '';
    emailEl.value = '';
    contentEl.value = '';
  });

  // Simple render function for comments list
  function renderList(items) {
    if (!items || !items.length) {
      listEl.innerHTML = '<div class="cw-empty">还没有评论，成为第一个评论的人吧！</div>';
      return;
    }
    // items should be array of { name, email, content, createdAt (number|Date|string) }
    const html = items.map(it => {
      const date = it.createdAt ? new Date(it.createdAt).toLocaleString() : '';
      const safeContent = escapeHtml(it.content || '');
      const safeName = escapeHtml(it.name || '匿名');
      return `
        <div class="cw-item">
          <div class="cw-meta">
            <div class="cw-author">${safeName}</div>
            <div class="cw-time">${date}</div>
          </div>
          <div class="cw-body">${safeContent}</div>
        </div>
      `;
    }).join('');
    listEl.innerHTML = html;
  }

  function escapeHtml(s) {
    if (!s) return '';
    return s.replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    }).replace(/\n/g, '<br/>');
  }

  // Local storage backend
  function loadLocalComments() {
    try {
      const raw = localStorage.getItem(localKey);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      // Ensure sort by createdAt desc
      return arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch (e) {
      console.warn(e);
      return [];
    }
  }
  function saveLocalComment(obj) {
    try {
      const arr = loadLocalComments();
      arr.push(obj);
      localStorage.setItem(localKey, JSON.stringify(arr));
      return true;
    } catch (e) {
      console.warn(e);
      return false;
    }
  }

  // Firebase backend (using compat if possible)
  let useRemote = false;
  let firebaseInitialized = false;

  async function loadFirebaseCompat() {
    // load firebase app compat and firestore compat
    const appSrc = 'https://www.gstatic.com/firebasejs/9.20.0/firebase-app-compat.js';
    const fsSrc = 'https://www.gstatic.com/firebasejs/9.20.0/firebase-firestore-compat.js';

    function loadScript(src) {
      return new Promise((resolve, reject) => {
        if (document.querySelector('script[src="' + src + '"]')) return resolve();
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('加载脚本失败: ' + src));
        document.head.appendChild(s);
      });
    }

    if (!window.firebase) {
      await loadScript(appSrc);
    }
    if (!window.firebase || !window.firebase.firestore) {
      await loadScript(fsSrc);
    }
  }

  async function initFirebaseIfConfigured() {
    try {
      const cfg = window.FIREBASE_CONFIG;
      if (!cfg || !cfg.apiKey) return false;
      await loadFirebaseCompat();
      try {
        if (!firebase.apps || !firebase.apps.length) {
          firebase.initializeApp(cfg);
        }
      } catch (e) {
        // ignore
      }
      if (!firebase.firestore) return false;
      firebaseInitialized = true;
      useRemote = true;
      return true;
    } catch (e) {
      console.warn('initFirebaseIfConfigured failed', e);
      return false;
    }
  }

  // Remote read/write
  async function fetchRemoteComments() {
    if (!firebaseInitialized) return [];
    try {
      const db = firebase.firestore();
      const q = await db.collection('comments').where('page', '==', pageId).orderBy('createdAt', 'desc').limit(200).get();
      const items = [];
      q.forEach(doc => {
        const d = doc.data();
        items.push({
          id: doc.id,
          name: d.name,
          email: d.email,
          content: d.content,
          createdAt: d.createdAt ? (d.createdAt.toMillis ? d.createdAt.toMillis() : (new Date(d.createdAt)).getTime()) : Date.now()
        });
      });
      return items;
    } catch (e) {
      console.warn('fetchRemoteComments err', e);
      return [];
    }
  }

  async function postRemoteComment(obj) {
    if (!firebaseInitialized) throw new Error('firebase not initialized');
    const db = firebase.firestore();
    // Add createdAt as Timestamp
    const payload = Object.assign({}, obj, { page: pageId, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    const ref = await db.collection('comments').add(payload);
    // read back to get createdAt value
    const snap = await ref.get();
    const data = snap.data();
    return {
      id: ref.id,
      name: data.name,
      email: data.email,
      content: data.content,
      createdAt: data.createdAt ? (data.createdAt.toMillis ? data.createdAt.toMillis() : Date.now()) : Date.now()
    };
  }

  // Load comments strategy: try remote, fallback to local
  async function loadComments() {
    listEl.innerHTML = '<div class="cw-empty">加载评论中…</div>';
    // if FIREBASE_CONFIG exists, try remote
    if (window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey) {
      const ok = await initFirebaseIfConfigured().catch(() => false);
      if (ok) {
        const remote = await fetchRemoteComments().catch(() => []);
        if (remote && remote.length) {
          renderList(remote);
          return;
        } else {
          // remote empty but initialized: show empty
          renderList([]);
          return;
        }
      }
    }
    // fallback local
    const local = loadLocalComments();
    renderList(local);
  }

  // submit handler
  let submitting = false;
  submitBtn && submitBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (submitting) return;
    const name = nameEl.value.trim();
    const email = emailEl.value.trim();
    const content = contentEl.value.trim();
    if (!name) {
      toast('请填写昵称');
      return;
    }
    if (!content) {
      toast('请填写评论内容');
      return;
    }

    submitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = '发布中...';

    const obj = {
      name,
      email,
      content,
      createdAt: Date.now()
    };

    try {
      if (window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey) {
        const ok = await initFirebaseIfConfigured().catch(() => false);
        if (ok) {
          // remote post
          await postRemoteComment(obj);
          // refresh list from remote
          const remote = await fetchRemoteComments();
          renderList(remote);
          toast('已发布（发布到云端）');
          contentEl.value = '';
          submitting = false;
          submitBtn.disabled = false;
          submitBtn.textContent = '发布评论';
          return;
        }
      }

      // fallback local
      saveLocalComment(obj);
      const local = loadLocalComments();
      renderList(local);
      toast('已保存到本地（仅此设备可见）');
      contentEl.value = '';
    } catch (err) {
      console.error(err);
      toast('发布失败，请稍后重试');
    } finally {
      submitting = false;
      submitBtn.disabled = false;
      submitBtn.textContent = '发布评论';
    }
  });

  // init
  loadIdentity();
  loadComments();
})();