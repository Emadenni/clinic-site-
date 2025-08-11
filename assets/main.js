// anno footer
document.getElementById('year').textContent = new Date().getFullYear();

const header = document.querySelector('[data-header]');
const hero   = document.querySelector('.hero');
const navEl  = document.querySelector('[data-nav]');
const links  = Array.from(document.querySelectorAll('[data-nav] a[href^="#"]'));
const BREAKPOINT = 960;
let lastY = window.scrollY;
const NAV_HIDE_THRESHOLD = 80;

// ===== Utils per l'ink dinamico =====
function moveInkTo(el){
  if (!navEl || !el) return;
  const nr = navEl.getBoundingClientRect();
  const r  = el.getBoundingClientRect();
  const left = r.left - nr.left;
  const width = r.width;
  const topCenter = r.top - nr.top + r.height/2;

  navEl.style.setProperty('--ink-left', `${left}px`);
  navEl.style.setProperty('--ink-width', `${width}px`);
  navEl.style.setProperty('--ink-top', `${topCenter}px`);
  navEl.style.setProperty('--sparkle-x', `${left + width - 10}px`);
  navEl.style.setProperty('--sparkle-y', `${topCenter}px`);
}
function setActive(id){
  links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`));
  const current = links.find(a => a.classList.contains('is-active')) || links[0];
  moveInkTo(current);
}

// ===== Header state (over-hero / not-over) + hide-only-nav on scroll down
function updateHeaderState(){
  if (!header || !hero) return;

  // con header fixed, over-hero finché il fondo della hero sta sotto il bordo inferiore dell’header
  const rect = hero.getBoundingClientRect();
  const headerH = header.offsetHeight || 0;
  const overHero = rect.bottom > headerH;
  header.classList.toggle('over-hero', overHero);
  header.classList.toggle('not-over', !overHero);

  const y = window.scrollY;
  const scrollingDown = y > lastY;
  const shouldHideNav = (window.innerWidth >= BREAKPOINT) && scrollingDown && y > NAV_HIDE_THRESHOLD;
  header.classList.toggle('hide-nav', shouldHideNav);
  lastY = y;
}

// ===== Inizializzazione =====
function initInk(){
  setActive('home');
  moveInkTo(links[0]);
}
initInk();
updateHeaderState();

// ricalcola su scroll/resize/load
window.addEventListener('scroll', () => { updateHeaderState(); }, { passive:true });
window.addEventListener('resize', () => {
  const current = links.find(a=>a.classList.contains('is-active')) || links[0];
  moveInkTo(current);
  updateHeaderState();
}, { passive:true });
window.addEventListener('load', () => {
  const current = links.find(a=>a.classList.contains('is-active')) || links[0];
  moveInkTo(current);
});

// se i font cambiano dimensioni, riallinea l'ink
if (document.fonts && document.fonts.ready){
  document.fonts.ready.then(() => {
    const current = links.find(a=>a.classList.contains('is-active')) || links[0];
    moveInkTo(current);
  });
}

// ResizeObserver sul nav per adattarsi a restringimenti
if ('ResizeObserver' in window && navEl){
  const ro = new ResizeObserver(() => {
    const current = links.find(a=>a.classList.contains('is-active')) || links[0];
    moveInkTo(current);
  });
  ro.observe(navEl);
}

// ===== Scroll-spy (attiva la voce corretta mentre scorri)
const sections = links
  .map(a => ({ a, id: a.getAttribute('href').slice(1), el: document.getElementById(a.getAttribute('href').slice(1)) }))
  .filter(x => x.el);

if ('IntersectionObserver' in window){
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) setActive(entry.target.id); });
  }, {
    root: null,
    rootMargin: `-${(header?.offsetHeight || 0) + 10}px 0px -60% 0px`,
    threshold: 0
  });
  sections.forEach(({el}) => spy.observe(el));
}

// ===== Hover-follow (ink segue hover, poi torna all'attivo)
let hoverTimeout = null;
links.forEach(a => {
  a.addEventListener('mouseenter', () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    moveInkTo(a);
  });
  a.addEventListener('mouseleave', () => {
    hoverTimeout = setTimeout(() => {
      const current = links.find(x => x.classList.contains('is-active')) || links[0];
      moveInkTo(current);
    }, 80);
  });
});

// ===== Mobile menu =====
const hamburger = document.querySelector('[data-hamburger]');
const wrap = document.querySelector('[data-mobile-wrap]');
const panel = document.querySelector('.mobile-panel');
const closeBtn = document.querySelector('[data-close]');

const openMenu = () => {
  document.body.classList.add('menu-open');
  hamburger?.setAttribute('aria-expanded', 'true');
  if (wrap) wrap.hidden = false;
  closeBtn?.focus();
  // blocca scroll sotto
  document.documentElement.style.overflow = 'hidden';
};
const closeMenu = () => {
  document.body.classList.remove('menu-open');
  hamburger?.setAttribute('aria-expanded', 'false');
  if (wrap) wrap.hidden = true;
  hamburger?.focus();
  document.documentElement.style.overflow = '';
};
hamburger?.addEventListener('click', () => {
  const expanded = hamburger.getAttribute('aria-expanded') === 'true';
  expanded ? closeMenu() : openMenu();
});
closeBtn?.addEventListener('click', closeMenu);
wrap?.addEventListener('click', (e) => {
  // chiudi se clic fuori dal pannello
  if (panel && !panel.contains(e.target)) closeMenu();
});
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

// click su nav: chiudi mobile e set active immediato
Array.from(document.querySelectorAll('#mobileMenu a[href^="#"]')).forEach(a => {
  a.addEventListener('click', () => { setActive(a.getAttribute('href').slice(1)); closeMenu(); });
});

// click su nav desktop: attiva subito
links.forEach(a => a.addEventListener('click', () => setActive(a.getAttribute('href').slice(1))));
