// /assets/chisono.js
document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========
     1) Reveal timeline fluido (no jank)
     ========= */
  (function () {
    const list = document.querySelector('.cv-list');
    if (!list) return;

    if (reduceMotion) { list.classList.add('is-ready'); return; }

    // Attiva la linea quando entra
    const lineObs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        list.classList.add('is-ready');
        lineObs.disconnect();
      }
    }, { rootMargin: '0px 0px -25% 0px', threshold: 0.15 });
    lineObs.observe(list);

    // Rivela gli <li> con piccolo stagger
    const items = Array.from(list.children);
    const itemObs = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const i = items.indexOf(en.target);
        en.target.style.transitionDelay = `${Math.min(i * 80, 480)}ms`;
        en.target.classList.add('is-in');
        itemObs.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    items.forEach(li => itemObs.observe(li));
  })();

  /* =========
     2) Micro-tilt 3D su avatar e card valori (solo mouse)
     ========= */
  (function () {
    const canTilt = window.matchMedia('(pointer: fine)').matches && !reduceMotion;
    if (!canTilt) return;

    function attachTilt(el, maxDeg = 8) {
      let raf = null;

      const onMove = (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;   // 0..1
        const py = (e.clientY - r.top) / r.height;   // 0..1
        const rx = (0.5 - py) * maxDeg;
        const ry = (px - 0.5) * maxDeg;

        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
        });
      };

      const reset = () => {
        el.style.transition = 'transform .28s cubic-bezier(.2,.8,.2,1)';
        el.style.transform = 'rotateX(0) rotateY(0) translateZ(0)';
        setTimeout(() => { el.style.transition = ''; }, 300);
      };

      el.style.transformStyle = 'preserve-3d';
      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', reset);
    }

    const avatar = document.querySelector('.about-photo');
    if (avatar) attachTilt(avatar, 10);

    document.querySelectorAll('.values-grid .v-card').forEach(card => attachTilt(card, 6));
  })();

  /* =========
     3) Re-stagger timeline se l’utente torna indietro
     ========= */
  (function () {
    if (reduceMotion) return;
    const cvList = document.querySelector('.cv-list');
    if (!cvList) return;

    let played = false;
    const again = () => {
      if (played) return;
      played = true;
      const prev = cvList.style.animation;
      cvList.style.animation = 'none';
      void cvList.offsetWidth;
      cvList.style.animation = prev;

      cvList.querySelectorAll('li').forEach((li, i) => {
        const a = li.style.animation;
        li.style.animation = 'none';
        void li.offsetWidth;
        setTimeout(() => { li.style.animation = a; }, i * 80);
      });
    };

    const onceIo = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          again();
          onceIo.disconnect();
        }
      });
    }, { threshold: 0.3 });
    onceIo.observe(cvList);
  })();

(() => {
  const container = document.querySelector('.glam-gallery');
  const track = document.querySelector('.glam-gallery [data-track]');
  if (!container || !track) return;

  // duplica i figli per il loop continuo
  track.innerHTML = track.innerHTML + track.innerHTML;

  // velocità costante (px/sec) configurabile da data-speed
  const pxPerSec = Number(container.dataset.speed || 36); // lento & elegante
  let x = 0;
  let raf = null;
  let running = false;
  let cycleW = 0; // larghezza del mezzo ciclo (contenuto originale)

  const measure = () => {
    const kids = Array.from(track.children);
    const half = Math.floor(kids.length / 2);
    const gap = parseFloat(getComputedStyle(track).gap || 0);
    cycleW = kids.slice(0, half).reduce((acc, el, i) => {
      const w = el.getBoundingClientRect().width;
      return acc + w + (i ? gap : 0);
    }, 0);
  };
  measure();
  addEventListener('resize', measure, { passive:true });

  // curvatura lungo la pista (sinusoide rispetto al viewport)
  const applyArc = () => {
    const amp = parseFloat(getComputedStyle(container).getPropertyValue('--amp')) || 20;
    const vw = Math.max(document.documentElement.clientWidth, innerWidth || 0);
    const kids = track.children;
    for (let i=0;i<kids.length;i++){
      const el = kids[i];
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width/2;
      const t = Math.min(1, Math.max(0, cx / vw)); // 0..1
      // curva a cupola (apice al centro), verso l’alto
      const y = (1 - Math.cos(Math.PI * t)) * 0.5 * amp * -1;
      el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
    }
  };

  // loop con delta-time per velocità vera (indipendente da FPS)
  let lastTs = 0;
  const loop = (ts) => {
    if (!running) return;
    if (!lastTs) lastTs = ts;
    const dt = (ts - lastTs) / 1000; // sec
    lastTs = ts;

    x -= pxPerSec * dt;
    if (-x >= cycleW) x += cycleW;

    track.style.transform = `translate3d(${x}px,0,0)`;
    applyArc();
    raf = requestAnimationFrame(loop);
  };

  // parte/ferma solo quando è in viewport
  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting){
      if (!raf){ running = true; lastTs = 0; raf = requestAnimationFrame(loop); }
    } else {
      running = false;
      if (raf){ cancelAnimationFrame(raf); raf = null; }
    }
  }, { threshold: 0.05 });
  io.observe(container);

  // rispetto prefers-reduced-motion
  const prm = matchMedia('(prefers-reduced-motion: reduce)');
  const syncPRM = () => {
    if (prm.matches){
      running = false;
      if (raf){ cancelAnimationFrame(raf); raf = null; }
      track.style.transform = '';
      Array.from(track.children).forEach(el => el.style.transform = '');
    } else {
      if (!raf){ running = true; lastTs = 0; raf = requestAnimationFrame(loop); }
    }
  };
  prm.addEventListener?.('change', syncPRM);
  syncPRM();
})();
});


// Target: ethics + about
const targets = [
  '.ethics h2',
  '.ethics .e-card',
  '.about-grid .about-photo',
  '.about-grid .about-text > *', // h2, p, ul, .about-cta
  '.about-grid .about-cta > *'   // i due bottoni
].join(',');

const reveals = document.querySelectorAll(targets);

// aggiunge .reveal a tutti i target
reveals.forEach(el => el.classList.add('reveal'));

// preferenze di riduzione movimento
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduceMotion || typeof IntersectionObserver === 'undefined') {
  reveals.forEach(el => el.classList.add('visible'));
} else {
  let order = 0; // stagger globale nell’ordine del DOM
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.style.transitionDelay = `${Math.min(order * 120, 200)}ms`;
      entry.target.classList.add('visible');
      order++;
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });

  reveals.forEach(el => observer.observe(el));
}
