// === HOME: Trattamenti (solo 6 featured + CTA) ===

const GRID = document.getElementById('treatments-grid');
const BACKDROP = document.getElementById('quick-backdrop');
const TITLE = document.getElementById('quick-title');
const CONTENT = document.getElementById('quick-content');
const CLOSE = document.getElementById('quick-close');

const PLACEHOLDER_IMG = new URL('../images/seo-section-img.webp', import.meta.url).href;

let DATA = [];
let lastFocused = null;

/* ---------- REVEAL: setup unico ---------- */
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const revealObserver = !prefersReduced
  ? new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 })
  : null;

function attachReveals(container) {
  if (!container) return;
  const cards = Array.from(container.querySelectorAll('.card'));
  cards.forEach((card, i) => {
    card.classList.add('sx-reveal');
    card.style.setProperty('--i', i); // delay progressivo
    if (revealObserver) revealObserver.observe(card);
    else card.classList.add('in');     // se reduce motion, mostra subito
  });
}
/* ----------------------------------------- */

init().catch(err => {
  console.error('Init error:', err);
  if (GRID) GRID.innerHTML = `<p class="notice">Non è stato possibile caricare i trattamenti.</p>`;
});

async function init() {
  // 1) Carica JSON via fetch (niente import JSON)
  const res = await fetch('/data/treatments.json', { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} su /data/trattamenti.json`);
  DATA = await res.json();

  // 2) Prendi solo 6 featured (fallback se meno di 6)
  let subset = DATA.filter(t => t.featured === true);
  if (subset.length < 6) {
    subset = subset.concat(
      DATA.filter(t => !t.featured).slice(0, 6 - subset.length)
    );
  }
  subset = subset.slice(0, 6);

  // 3) Render + CTA
  renderGrid(subset);
  injectCTA();

  // 4) Deep-link ?quick=slug
  const params = new URLSearchParams(location.search);
  const quick = params.get('quick');
  if (quick) openModal(quick, false);

  // 5) Back/forward
  window.addEventListener('popstate', () => {
    const p = new URLSearchParams(location.search).get('quick');
    if (p) openModal(p, false);
    else closeModal(false);
  });

  // 6) Chiusure modal
  BACKDROP?.addEventListener('click', (e) => { if (e.target === BACKDROP) closeModal(); });
  CLOSE?.addEventListener('click', () => closeModal());
  document.addEventListener('keydown', (e) => {
    if (!BACKDROP.hidden && e.key === 'Escape') closeModal();
  });
}

function renderGrid(items) {
  if (!GRID) return;
  GRID.innerHTML = items.map(toCardHTML).join('');

  // 👉 attiva il reveal sulle card appena renderizzate
  attachReveals(GRID);

  // quick view
  GRID.querySelectorAll('[data-quick]').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.quick, true));
  });
}

function toCardHTML(item) {
  const { slug, title, image, short, duration, pain, result, price } = item;
  const imgSrc = image || PLACEHOLDER_IMG;
  return `
    <article class="card">
      <a class="card__media-link" href="/trattamenti/${slug}.html" aria-label="${title}">
        <img class="card__media" src="${imgSrc}" alt="${title}"
             loading="lazy"
             onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}'">
      </a>
      <div class="card__body">
        <h3 class="card__title"><a href="/trattamenti/${slug}.html">${title}</a></h3>
        <p class="card__short">${short ?? ''}</p>
        <ul class="pill-list" aria-label="Informazioni rapide">
          <li class="pill"><span class="pill__label">Durata</span> <span class="pill__val">${duration}</span></li>
          <li class="pill"><span class="pill__label">Dolore</span> <span class="pill__val">${pain}</span></li>
          <li class="pill"><span class="pill__label">Risultati</span> <span class="pill__val">${result}</span></li>
        </ul>
        <div class="card__footer">
          <span class="price">${price}</span>
          <div class="actions">
            <button class="btn" data-quick="${slug}" aria-haspopup="dialog">Dettagli veloci</button>
            <a class="btn btn--ghost" href="/trattamenti/${slug}.html">Vai alla pagina</a>
          </div>
        </div>
      </div>
    </article>
  `;
}

function injectCTA() {
  const wrap = document.createElement('div');

  GRID.parentElement.appendChild(wrap);
}


(()=>{const b=document.querySelector('.cta-button');if(!b)return;
const max=12, lerp=(a,b,t)=>a+(b-a)*t; let tx=0,ty=0,cx=0,cy=0;
function loop(){cx=lerp(cx,tx,.16); cy=lerp(cy,ty,.16); b.style.transform=`translate(${cx}px,${cy}px)`; requestAnimationFrame(loop)}
loop();
function onMove(e){const r=b.getBoundingClientRect(), p=e.touches?e.touches[0]:e;
  const x=((p.clientX-(r.left+r.width/2))/(r.width/2)); const y=((p.clientY-(r.top+r.height/2))/(r.height/2));
  tx=Math.max(-1,Math.min(1,x))*max; ty=Math.max(-1,Math.min(1,y))*max;}
function reset(){tx=0;ty=0;}
b.addEventListener('mousemove',onMove,{passive:true});
b.addEventListener('mouseleave',reset,{passive:true});
b.addEventListener('touchmove',onMove,{passive:true});
b.addEventListener('touchend',reset,{passive:true});})();



function setupCTAReveal(){
  const el = document.querySelector('.treatments__cta');
  if (!el) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce){
    el.classList.add('is-visible');
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) el.classList.add('is-visible');
      // se vuoi che si spenga quando esce, usa else remove
    });
  }, { threshold: 0.35 });
  io.observe(el);
}


function openModal(slug, push = true) {
  if (!BACKDROP) return;
  const item = DATA.find(x => x.slug === slug);
  if (!item) return;

  TITLE.textContent = item.title;
  CONTENT.innerHTML = modalContent(item);

  lastFocused = document.activeElement;
  BACKDROP.hidden = false;
  CLOSE?.focus();

  if (push) {
    const url = new URL(location.href);
    url.searchParams.set('quick', slug);
    history.pushState({ quick: slug }, '', url);
  }
}

function closeModal(push = true) {
  if (!BACKDROP || BACKDROP.hidden) return;
  BACKDROP.hidden = true;
  if (lastFocused) lastFocused.focus();

  if (push) {
    const url = new URL(location.href);
    url.searchParams.delete('quick');
    history.pushState({}, '', url);
  }
}

function modalContent(item) {
  const { image, title, long, duration, pain, result, price, slug } = item;
  const imgSrc = image || PLACEHOLDER_IMG;
  return `
    <figure class="quick__figure">
      <img class="quick__img" src="${imgSrc}" alt="${title}"
           onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}'">
    </figure>
    <ul class="kv-list">
      <li><span>Durata</span><strong>${duration}</strong></li>
      <li><span>Dolore</span><strong>${pain}</strong></li>
      <li><span>Risultati</span><strong>${result}</strong></li>
      <li><span>Prezzo</span><strong>${price}</strong></li>
    </ul>
    <div class="prose">${long ? `<p>${long}</p>` : ''}</div>
    <div class="quick__actions">
      <a class="btn" href="/prenota?trattamento=${slug}">Prenota ora</a>
      <a class="btn btn--ghost" href="/trattamenti/${slug}.html">Vai alla pagina</a>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('.before-after-gallery');
  if (!root) return;

  const pool = [
    '/images/treatments/botulino.webp',
    '/images/treatments/labbra.webp',
    '/images/treatments/rinofiller.webp',
    '/images/treatments/rughe.webp',
    '/images/treatments/biorivitalizzazione.webp'
  ];

  const imgs = Array.from(root.querySelectorAll('.ba-bubble img'));
  if (!imgs.length) return;

  // Precarica (log se path rotti)
  pool.forEach(src => { const im = new Image(); im.onerror = () => console.error('[ba]', src); im.src = src; });

  const N = imgs.length;
  const M = pool.length;
  const period = 3600;  // + alto = più lento
  const fadeMs = 260;

  // Stato: indice immagine corrente per ogni bolla
  const current = new Array(N);

  // Inizializza con indici tutti diversi (finché possibile)
  imgs.forEach((img, i) => {
    const idx = i % M;
    current[i] = idx;
    img.src = pool[idx];
    img.style.objectFit = 'cover';
    img.style.transition = `opacity ${fadeMs}ms ease, transform ${Math.round(fadeMs*1.6)}ms ease`;
  });

  // Trova il prossimo indice non usato dagli altri (se possibile)
  function nextDistinctIndex(i) {
    const used = new Set(current.filter((_, j) => j !== i));
    // prova i successivi in ordine circolare finché non trovi un buco
    for (let step = 1; step <= M; step++) {
      const candidate = (current[i] + step) % M;
      if (!used.has(candidate)) return candidate;
    }
    // se tutto occupato (pool troppo piccolo), ritorna il successivo normale
    return (current[i] + 1) % M;
  }

  // Swap coordinato
  function swapOne(i) {
    const img = imgs[i];
    let nextIdx = nextDistinctIndex(i);
    const nextSrc = pool[nextIdx] + '?v=' + Date.now(); // cache-bust

    img.style.opacity = '0';
    img.style.transform = 'scale(0.985)';

    setTimeout(() => {
      img.onerror = () => {
        // se fallisce, prova un altro indice libero
        for (let tries = 0; tries < M; tries++) {
          nextIdx = (nextIdx + 1) % M;
          if (!current.includes(nextIdx)) break;
        }
        img.src = pool[nextIdx] + '?v=' + Date.now();
      };
      img.onload = () => {
        img.style.opacity = '1';
        img.style.transform = 'scale(1)';
      };
      img.src = nextSrc;
      current[i] = nextIdx; // aggiorna lo stato condiviso
    }, fadeMs);
  }

  // Avvia con sfasamento tra le bolle
  imgs.forEach((_, i) => {
    setTimeout(() => {
      swapOne(i);
      setInterval(() => swapOne(i), period);
    }, i * 500);
  });

  // Click: vai alla pagina
  root.addEventListener('click', () => {
    window.location.href = '/prima-dopo.html';
  });
});

/* ===== Micro-interazione: tilt sul portrait (facoltativo) ===== */
(() => {
  const card = document.querySelector('.doctor-preview__portrait[data-tilt]');
  if (!card) return;
  const max = 6; // gradi max
  const lerp = (a,b,t)=>a+(b-a)*t;
  let rx=0, ry=0, tx=0, ty=0;

  const onMove = (e) => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top)  / r.height;
    tx = lerp(-max, max, px);
    ty = lerp(max, -max, py);
    card.classList.add('tilting');
    card.style.transform = `rotateY(${tx.toFixed(2)}deg) rotateX(${ty.toFixed(2)}deg)`;
  };
  const onLeave = () => {
    card.classList.remove('tilting');
    card.style.transform = '';
  };

  card.addEventListener('mousemove', onMove, {passive:true});
  card.addEventListener('mouseleave', onLeave, {passive:true});
})();
