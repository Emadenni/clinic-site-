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
