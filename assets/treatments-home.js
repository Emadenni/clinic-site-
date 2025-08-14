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
  const isDesktop = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  // Tooltip unico
  const tip = document.createElement('div');
  tip.className = 'treatments-tooltip';
  tip.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" fill="currentColor" style="margin-right:6px;vertical-align:middle" viewBox="0 0 16 16">
    <path d="M8 0a8 8 0 1 0 8 8A8.009 8.009 0 0 0 8 0Zm0 12a4 4 0 1 1 4-4 4.005 4.005 0 0 1-4 4Z"/>
  </svg>
  Vai ai trattamenti
`;
  document.body.appendChild(tip);

  const isInteractive = el => !!el.closest('a,button,input,textarea,select,label,[role="button"]');

  // mostra/nascondi
  const show = () => tip.classList.add('show');
  const hide = () => tip.classList.remove('show', 'is-centered');

  // posiziona: desktop segue il mouse; mobile sta centrato
  const showTipAt = (x, y) => {
    if (isDesktop) {
      tip.classList.remove('is-centered');
      // posizionamento rispetto alla viewport
      tip.style.left = (x + 14) + 'px';
      tip.style.top  = (y + 14) + 'px';
      show();
    } else {
      tip.classList.add('is-centered'); // CSS lo centra
      show();
      clearTimeout(showTipAt._t);
      showTipAt._t = setTimeout(hide, 1200);
    }
  };

  // DESKTOP
  if (isDesktop) {
    let raf = null;
    sec.addEventListener('mouseenter', e => showTipAt(e.clientX, e.clientY));
    sec.addEventListener('mousemove',  e => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => showTipAt(e.clientX, e.clientY));
    });
    sec.addEventListener('mouseleave', hide);
  }

  // MOBILE/TABLET
  sec.addEventListener('touchstart', e => {
    if (isInteractive(e.target)) return;
    showTipAt(); // nessuna coord: resta centrato
  }, { passive: true });

  ['touchend','touchcancel'].forEach(ev =>
    sec.addEventListener(ev, hide, { passive: true })
  );

  // Navigazione
  sec.addEventListener('click', (e) => {
    if (isInteractive(e.target)) return;
    window.location.href = DEST;
  });

  // A11y
  sec.setAttribute('role','link');
  sec.setAttribute('tabindex','0');
  sec.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.location.href = DEST;
    }
  });
})();
