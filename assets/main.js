

// ===== Footer year =========================================================
document.getElementById('year').textContent = new Date().getFullYear();



// ===== DOM refs ============================================================
const header    = document.querySelector('[data-header]');
const navEl     = document.querySelector('[data-nav]');
const links     = Array.from(document.querySelectorAll('[data-nav] a')); // tutte le voci
const wrap      = document.querySelector('[data-mobile-wrap]');
const panel     = document.querySelector('.mobile-panel');
const hamburger = document.querySelector('[data-hamburger]');

// ===== Active ink (desktop) ===============================================
function moveInkTo(el){
  if (!navEl || !el) return;
  const nr = navEl.getBoundingClientRect();
  const r  = el.getBoundingClientRect();
  navEl.style.setProperty('--ink-left',  `${r.left - nr.left}px`);
  navEl.style.setProperty('--ink-width', `${r.width}px`);
  navEl.style.setProperty('--ink-top',   `${r.top  - nr.top + r.height/2}px`);
  navEl.style.setProperty('--sparkle-x', `${r.left - nr.left + r.width - 10}px`);
  navEl.style.setProperty('--sparkle-y', `${r.top  - nr.top + r.height/2}px`);
}

// attiva la voce giusta in base alla pagina
function getActiveLinkByPath(){
  if (!links.length) return null;
  const path = (location.pathname.replace(/\/+$/,'') || '/index.html');
  const match = links.find(a => {
    let href = a.getAttribute('href') || '';
    try { href = new URL(href, location.origin).pathname.replace(/\/+$/,''); } catch(e){}
    return href === path || (href === '/index.html' && (path === '/' || path === ''));
  });
  return match || links[0];
}
function syncActiveTo(el){
  if (!el) return;
  links.forEach(a => a.classList.toggle('is-active', a === el));
  moveInkTo(el);
}

function initInk(){
  const active = getActiveLinkByPath() || links[0];
  syncActiveTo(active);
}
initInk();
window.addEventListener('resize', initInk, {passive:true});
document.fonts?.ready.then(initInk);
if ('ResizeObserver' in window && navEl) new ResizeObserver(initInk).observe(navEl);

// --- HOVER INTENT + niente snap-back tra le voci ---
const HOVER_INTENT = 160;
let hoverTimer = 0;
let pending = null;

links.forEach(a => {
  a.addEventListener('mouseenter', () => {
    pending = a;
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => {
      if (pending === a) moveInkTo(a);
    }, HOVER_INTENT);
  });

  a.addEventListener('mouseleave', () => {
    // non torniamo all'attivo qui: evitiamo jitter tra le voci
    pending = null;
    clearTimeout(hoverTimer);
  });
});

// quando esco dall'intera NAV → torna alla voce attiva (per pagina)
navEl?.addEventListener('mouseleave', () => {
  syncActiveTo(getActiveLinkByPath());
});


// ===== Header: visibile SOLO in cima ======================================
function updateHeaderTopOnly(){
  if (!header) return;
  (window.scrollY <= 10) ? header.classList.add('show') : header.classList.remove('show');
}
updateHeaderTopOnly();
window.addEventListener('scroll', updateHeaderTopOnly, { passive:true });
window.addEventListener('resize', updateHeaderTopOnly, { passive:true });

// ===== Mobile/Tablet menu (robusto) =======================================
const openMenu = () => {
  document.body.classList.add('menu-open');
  hamburger?.setAttribute('aria-expanded','true');
  header?.classList.add('show');
  wrap && (wrap.hidden = false);
  document.documentElement.style.overflow = 'hidden';
};
const closeMenu = () => {
  document.body.classList.remove('menu-open');
  hamburger?.setAttribute('aria-expanded','false');
  wrap && (wrap.hidden = true);
  document.documentElement.style.overflow = '';
  updateHeaderTopOnly();
};
hamburger?.addEventListener('click', (e) => {
  e.preventDefault();
  (hamburger.getAttribute('aria-expanded') === 'true') ? closeMenu() : openMenu();
});
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
wrap?.addEventListener('click', (e) => {
  if (e.target.closest('[data-close]')) { e.preventDefault(); closeMenu(); return; }
  if (panel && !panel.contains(e.target)) closeMenu();
}, { passive:false });
Array.from(document.querySelectorAll('#mobileMenu a')).forEach(a => {
  a.addEventListener('click', () => closeMenu());
});

// ===== Custom cursor — SOLO su CTA, MAI in navbar/menu ====================
(() => {
  const mediaOK = window.matchMedia('(hover:hover) and (pointer:fine)');
  const reduce  = window.matchMedia('(prefers-reduced-motion:reduce)');
  if (!mediaOK.matches || reduce.matches) return;

  // elementi dove il cursore è permesso (CTA)
  const allowSel = '.btn, [data-cta], img';         // aggiungi qui eventuali altri selettori
  const excludeSel = '.site-header, .mobile-panel, .mobile-topbar';

  const root = document.createElement('div');
  root.id = 'lux-cursor';
  root.innerHTML = `<div class="c-ring"></div><div class="c-dot"></div>`;
  document.body.appendChild(root);

  const ring = root.querySelector('.c-ring');
  const dot  = root.querySelector('.c-dot');

  const isAllowed = el => !!el.closest(allowSel) && !el.closest(excludeSel);

  let x=-100,y=-100, rx=-100,ry=-100;
  const ease=.18;

  const tick = () => {
    rx += (x - rx) * ease; ry += (y - ry) * ease;
    ring.style.setProperty('--cx', rx + 'px');
    ring.style.setProperty('--cy', ry + 'px');
    dot .style.setProperty('--dx', x  + 'px');
    dot .style.setProperty('--dy', y  + 'px');
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  window.addEventListener('mousemove', (e) => {
    x = e.clientX; y = e.clientY;
    const ok = isAllowed(e.target) && !document.body.classList.contains('menu-open');
    root.classList.toggle('is-hidden', !ok);
  }, { passive:true });

  window.addEventListener('mouseleave', () => root.classList.add('is-hidden'), { passive:true });
  window.addEventListener('mouseenter', () => root.classList.remove('is-hidden'), { passive:true });
  window.addEventListener('mousedown', () => root.classList.add('is-down'), { passive:true });
  window.addEventListener('mouseup',   () => root.classList.remove('is-down'), { passive:true });

  // stato "link" solo sulle CTA
  document.addEventListener('mouseover', (e) => {
    root.classList.toggle('is-link', isAllowed(e.target));
  }, { passive:true });
  document.addEventListener('mouseout', () => {
    root.classList.remove('is-link');
  }, { passive:true });

  mediaOK.addEventListener?.('change', (e) => { if (!e.matches) root.remove(); });
})();

// Reveal per la sezione SEO
(() => {
  const io = new IntersectionObserver((es) => {
    es.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
  }, { threshold: 0.15 });
  document.querySelectorAll('.sx-reveal').forEach(el => io.observe(el));
})();

// Parallax soft sull’immagine (se ti piace)
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  if (reduce) return;
  const visual = document.querySelector('.sx-visual[data-parallax]');
  if (!visual) return;
  const loop = () => {
    const r = visual.getBoundingClientRect();
    const y = ((r.top + r.height * .5) / innerHeight - .5) * -14;
    visual.style.transform = `translateY(${y.toFixed(2)}px)`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();

(function(){
  function onReady(fn){
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', fn, {once:true});
    }else{ fn(); }
  }

  function safeLS(){
    return {
      get(k){ try{ return localStorage.getItem(k); }catch{ return null; } },
      set(k,v){ try{ localStorage.setItem(k,v); }catch{} },
      sget(k){ try{ return sessionStorage.getItem(k); }catch{ return null; } },
      sset(k,v){ try{ sessionStorage.setItem(k,v); }catch{} }
    };
  }

  function tween(el, from, to, dur=900){
    const start = performance.now();
    const fmt = n => n.toLocaleString('it-IT');
    function frame(t){
      const k = Math.min(1, (t-start)/dur);
      const e = 1 - Math.pow(1-k, 3);
      el.textContent = fmt(Math.round(from + (to-from)*e));
      if(k < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  onReady(() => {
    const el = document.getElementById('site-views-count');
    if(!el) return;

    const store = safeLS();
    const BASE = 5500;
    const KEY  = 'pv_local_count_v1';
    const LAST = 'pv_last_seen';

    let n = parseInt(store.get(KEY)||'0',10);
    if(!Number.isFinite(n)) n = 0;
    n += 1;
    store.set(KEY, String(n));

    const current = BASE + n;
    const lastSeen = parseInt(store.sget(LAST)||'0',10);
    store.sset(LAST, String(current));

    // se qualcosa va storto con RAF, almeno mostriamo il numero
    try{
      const from = Number.isFinite(lastSeen)&&lastSeen>0 ? lastSeen : Math.max(0, current-7);
      tween(el, from, current);
    }catch{
      el.textContent = current.toLocaleString('it-IT');
    }
  });
})();

document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.querySelector("[data-hamburger]");
  const wrap = document.querySelector("[data-mobile-wrap]");
  const closeBtn = document.querySelector("[data-close]");
  const panel = document.querySelector(".mobile-panel");

  function openMenu() {
    wrap.hidden = false;
    requestAnimationFrame(() => {
      wrap.classList.add("is-open");
      document.body.classList.add("no-scroll");
    });
  }

  function closeMenu() {
    wrap.classList.remove("is-open");
    document.body.classList.remove("no-scroll");
    // aspetta la fine della transizione del PANNELLO
    panel.addEventListener("transitionend", () => {
      if (!wrap.classList.contains("is-open")) {
        wrap.hidden = true;
      }
    }, { once: true });
  }

  hamburger.addEventListener("click", () => {
    wrap.classList.contains("is-open") ? closeMenu() : openMenu();
  });

  closeBtn.addEventListener("click", closeMenu);

  wrap.addEventListener("click", (e) => {
    if (e.target === wrap) closeMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && wrap.classList.contains("is-open")) {
      closeMenu();
    }
  });
});

(function(){
    const LANG_KEY = 'lang';
    const state = {
      lang: localStorage.getItem(LANG_KEY) || 'it',
      ruReady: false // quando avrai le traduzioni: metti true
    };

    function setLang(lang){
      state.lang = lang;
      localStorage.setItem(LANG_KEY, lang);
      document.documentElement.setAttribute('lang', lang); // utile per SEO/a11y
      document.body.dataset.lang = lang; // se vuoi stili condizionali
      // Qui potresti anche chiamare la tua funzione di i18n quando sarà pronta
      refreshAllSwitchers();
    }

    function buildDesktop(container){
      container.innerHTML = `
        <button class="lang-btn" data-lang="it" aria-pressed="false" title="Italiano">
          <span class="flag">🇮🇹</span><span class="code">IT</span>
        </button>
        <span class="sep">|</span>
        <button class="lang-btn" data-lang="ru" aria-pressed="false" title="Русский">
          <span class="flag">🇷🇺</span><span class="code">RU</span>
        </button>
        <div class="lang-notice" role="status" hidden>
          Stiamo lavorando alla traduzione in russo. Presto sarà disponibile.
        </div>
      `;
      container.addEventListener('click', (e)=>{
        const btn = e.target.closest('.lang-btn');
        if(!btn) return;
        const lang = btn.dataset.lang;
        setLang(lang);
      });
    }

    function buildMobile(container){
      container.innerHTML = `
        <div class="lang-menu-item">
          <label for="lang-select">Lingua</label>
          <select id="lang-select">
            <option value="it">🇮🇹 Italiano</option>
            <option value="ru">🇷🇺 Русский</option>
          </select>
          <div class="lang-notice" role="status" hidden>
            Stiamo lavorando alla traduzione in russo. Presto sarà disponibile.
          </div>
        </div>
      `;
      container.querySelector('select').addEventListener('change', (e)=>{
        setLang(e.target.value);
      });
    }

    function refreshSwitcher(container){
      const isMobile = container.classList.contains('lang-switch--mobile');
      const notice = container.querySelector('.lang-notice');

      if(isMobile){
        const select = container.querySelector('select');
        if(select) select.value = state.lang;
      } else {
        container.querySelectorAll('.lang-btn').forEach(btn=>{
          const active = btn.dataset.lang === state.lang;
          btn.classList.toggle('active', active);
          btn.setAttribute('aria-pressed', String(active));
        });
      }

      // Mostra avviso se RU non pronta
      const showNotice = state.lang === 'ru' && !state.ruReady;
      if(notice){
        notice.hidden = !showNotice;
      }
    }

    function refreshAllSwitchers(){
      document.querySelectorAll('.lang-switch').forEach(refreshSwitcher);
    }

    // Init
    document.addEventListener('DOMContentLoaded', ()=>{
      const desktop = document.getElementById('lang-switch-desktop');
      const mobile = document.getElementById('lang-switch-mobile');
      if(desktop) buildDesktop(desktop);
      if(mobile) buildMobile(mobile);
      setLang(state.lang); // applica stato iniziale e render
    });
  })();

  document.addEventListener("DOMContentLoaded", () => {
  const switchers = document.querySelectorAll(".lang-switch");

  switchers.forEach(switcher => {
    const notice = switcher.querySelector(".lang-notice");

    switcher.addEventListener("click", e => {
      const btn = e.target.closest(".lang-btn");
      if (!btn) return;

      const lang = btn.dataset.lang;

      if (lang === "ru") {
        // mostra la nuvoletta
        notice.hidden = false;
        notice.classList.add("show");

        // nasconde dopo 3 secondi
        setTimeout(() => {
          notice.classList.remove("show");
          notice.hidden = true;
        }, 3000);
      } else {
        // se torno a IT chiudo subito la notice
        notice.classList.remove("show");
        notice.hidden = true;
      }
    });
  });
});
