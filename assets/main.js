// anno footer
document.getElementById('year').textContent = new Date().getFullYear();

const header = document.querySelector('[data-header]');
const hero   = document.querySelector('.hero');
const BREAKPOINT = 960;

// Header: passa da "over-hero" (trasparente) a "not-over" (chiaro) quando superi la hero
function updateHeaderState(){
  if (!header || !hero) return;
  const rect = hero.getBoundingClientRect();
  const overHero = rect.bottom > 0; // finché la hero è sotto l'header
  header.classList.toggle('over-hero', overHero);
  header.classList.toggle('not-over', !overHero);
}
updateHeaderState();
window.addEventListener('scroll', updateHeaderState, { passive:true });
window.addEventListener('resize', updateHeaderState, { passive:true });

// ===== Mobile menu =====
const hamburger = document.querySelector('[data-hamburger]');
const wrap = document.querySelector('[data-mobile-wrap]');
const panel = document.getElementById('mobileMenu');

const openMenu = () => {
  document.body.classList.add('menu-open');
  hamburger?.setAttribute('aria-expanded', 'true');
  if (wrap) wrap.hidden = false;
};
const closeMenu = () => {
  document.body.classList.remove('menu-open');
  hamburger?.setAttribute('aria-expanded', 'false');
  if (wrap) wrap.hidden = true;
};
hamburger?.addEventListener('click', () => {
  const expanded = hamburger.getAttribute('aria-expanded') === 'true';
  expanded ? closeMenu() : openMenu();
});
wrap?.addEventListener('click', (e) => { if (!panel.contains(e.target)) closeMenu(); });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
panel?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
window.addEventListener('resize', () => { if (window.innerWidth >= BREAKPOINT) closeMenu(); }, { passive:true });

// fade-in hero copy
const heroCopy = document.querySelector('.hero-content');
if ('IntersectionObserver' in window && heroCopy){
  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting){
      heroCopy.style.transition = 'opacity .65s ease, transform .65s ease';
      heroCopy.style.opacity = '1';
      heroCopy.style.transform = 'translateY(0)';
      io.disconnect();
    }
  }, { threshold: .2 });
  heroCopy.style.opacity = '0';
  heroCopy.style.transform = 'translateY(12px)';
  io.observe(heroCopy);
} else if (heroCopy) {
  heroCopy.style.opacity = '1';
  heroCopy.style.transform = 'none';
}
