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

