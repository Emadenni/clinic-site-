const GRID = document.getElementById('treatments-grid');

const FALLBACK = [
  { slug:'rinofiller',   title:'Rinofiller',   short:'Profilo armonico senza chirurgia. Esito naturale.', image:'/images/treatments/rinofiller.webp' },
  { slug:'labbra-soft',  title:'Labbra Soft',  short:'Volume controllato e definizione, look credibile.',  image:'/images/treatments/labbra-soft.webp' },
  { slug:'skin-quality', title:'Skin Quality', short:'Texture luminosa e compatta con protocolli su misura.', image:'/images/treatments/skin-quality.webp' },
  { slug:'botulino',     title:'Botulino',     short:'Linee morbide e sguardo riposato.', image:'/images/treatments/botox.webp' },
  { slug:'profilo',      title:'Profiloplastica', short:'Equilibrio di naso, labbra e mento.', image:'/images/treatments/profiloplastic.webp' },
  { slug:'bioriv',       title:'Biorivitalizzazione', short:'Idratazione profonda e glow.', image:'/images/treatments/skinboost.webp' }
];

const card = (t,i) => `
  <article class="tcard sx-reveal" style="--i:${i}">
    <div class="tcard__media">
      <img src="${t.image}" alt="${t.title}" loading="lazy" decoding="async">
      <span class="tcard__frame"></span>
    </div>
    <div class="tcard__body">
      <h3 class="tcard__title">${t.title}</h3>
      <p class="tcard__desc">${t.short || ''}</p>
    </div>
  </article>
`;

function render(list){
  if (!GRID) return;
  const max = parseInt(GRID.dataset.max || '', 10);
  const items = Number.isFinite(max) ? list.slice(0, max) : list;
  GRID.innerHTML = items.map((t,i)=>card(t,i)).join('');
  const io = new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in')})},{threshold:.15});
  GRID.querySelectorAll('.sx-reveal').forEach(el=>io.observe(el));
}

function mapItem(x){
  return {
    slug:  x.slug  || (x.id || x.title?.toLowerCase().replace(/\s+/g,'-') || 'trattamento'),
    title: x.title || x.name || 'Trattamento',
    short: x.short || x.description || '',
    image: x.image || x.img || '/images/treatments/placeholder.webp'
  };
}

function setupCTAReveal(){
  const el = document.querySelector('.treatments__cta');
  if (!el) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches){el.classList.add('is-visible');return}
  const io = new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)el.classList.add('is-visible')})},{threshold:.25});
  io.observe(el);
}

(async () => {
  if (!GRID) return;
  try {
    const res = await fetch('/data/treatments.json', { cache:'no-store' });
    if (!res.ok) throw 0;
    const data = await res.json();
    render(data.map(mapItem));
  } catch {
    render(FALLBACK);
  }
  setupCTAReveal();
})();


/* Boot */
(async () => {
  try {
    const res = await fetch('/data/treatments.json', { cache:'no-store' });
    if (!res.ok) throw 0;
    const data = await res.json();
    render(data.map(mapItem));
  } catch {
    render(FALLBACK);
  }
  setupCTAReveal();
})();

(() => {
  const sec = document.querySelector('.treatments');
  if (!sec) return;

  const DEST = '/trattamenti';

  // --- Tooltip element (unico per desktop+mobile) ---
  const tip = document.createElement('div');
  tip.className = 'treatments-tooltip';
  tip.textContent = 'Vai ai trattamenti';
  document.body.appendChild(tip);

  // Helpers
  const isInteractive = el => !!el.closest('a,button,input,textarea,select,label,[role="button"]');

  const showTipAt = (x, y) => {
    tip.style.left = x + 12 + 'px';
    tip.style.top  = y + 12 + 'px';
    tip.classList.add('show');
    // su mobile auto-hide soft
    if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
      clearTimeout(showTipAt._t);
      showTipAt._t = setTimeout(() => tip.classList.remove('show'), 1200);
    }
  };
  const hideTip = () => tip.classList.remove('show');

  // --- Desktop (hover/mouse) ---
  const isDesktop = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (isDesktop) {
    sec.addEventListener('mouseenter', e => showTipAt(e.pageX, e.pageY));
    sec.addEventListener('mousemove',  e => showTipAt(e.pageX, e.pageY));
    sec.addEventListener('mouseleave', hideTip);
  }

  // --- Mobile/tablet (touch) ---
  // Mostra subito al tocco, segue il dito, non blocca scroll
  sec.addEventListener('touchstart', (e) => {
    if (isInteractive(e.target)) return;           // rispetta elementi interni
    const t = e.touches[0];
    if (!t) return;
    showTipAt(t.pageX, t.pageY);
  }, { passive: true });

  sec.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (!t) return;
    showTipAt(t.pageX, t.pageY);
  }, { passive: true });

  sec.addEventListener('touchend', hideTip,   { passive: true });
  sec.addEventListener('touchcancel', hideTip,{ passive: true });

  // --- Navigazione (tap/click ovunque nella sezione) ---
  // Click desktop: diretto
  sec.addEventListener('click', (e) => {
    if (isInteractive(e.target)) return; // lascia fare ai link interni
    window.location.href = DEST;
  });

  // Accessibilità tastiera
  sec.setAttribute('role','link');
  sec.setAttribute('tabindex','0');
  sec.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.location.href = DEST;
    }
  });
})();
