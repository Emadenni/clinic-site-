// /assets/chisono.js
document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========
     1) Reveal / replay animazioni quando l’elemento entra in viewport
     ========= */
// Reveal fluido timeline (no jank)
(function(){
  const list = document.querySelector('.cv-list');
  if (!list) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { list.classList.add('is-ready'); return; }

  // 1) attiva la linea quando la lista entra
  const lineObs = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) {
      list.classList.add('is-ready');
      lineObs.disconnect();
    }
  }, { rootMargin: '0px 0px -25% 0px', threshold: 0.15 });
  lineObs.observe(list);

  // 2) rivela gli elementi con uno stagger leggero
  const items = Array.from(list.children);
  const itemObs = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const i = items.indexOf(en.target);
      // delay progressivo ma cap limitato
      en.target.style.transitionDelay = `${Math.min(i * 80, 480)}ms`;
      en.target.classList.add('is-in');
      itemObs.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

  items.forEach(li => itemObs.observe(li));
})();


  /* =========
     2) Micro-tilt 3D su avatar e card valori (solo dispositivi con mouse)
     ========= */
  const canTilt = window.matchMedia('(pointer: fine)').matches && !reduceMotion;

  function attachTilt(el, maxDeg = 8) {
    let raf = null;

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;   // 0..1
      const py = (e.clientY - r.top) / r.height;   // 0..1
      const rx = ((0.5 - py) * maxDeg).toFixed(2); // X rot
      const ry = ((px - 0.5) * maxDeg).toFixed(2); // Y rot

      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
      });
    };

    const reset = () => {
      el.style.transition = 'transform .28s cubic-bezier(.2,.8,.2,1)';
      el.style.transform = 'rotateX(0deg) rotateY(0deg) translateZ(0)';
      setTimeout(() => { el.style.transition = ''; }, 300);
    };

    el.style.transformStyle = 'preserve-3d';
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', reset);
  }

  if (canTilt) {
    // Avatar (contenitore rotondo)
    const avatar = document.querySelector('.about-photo');
    if (avatar) attachTilt(avatar, 10);

    // Card Valori
    document.querySelectorAll('.values-grid .v-card').forEach(card => attachTilt(card, 6));
  }

  /* =========
     3) Bonus: re-stagger della timeline se l’utente torna indietro con scroll
     ========= */
  const cvList = document.querySelector('.cv-list');
  if (cvList && !reduceMotion) {
    let played = false;
    const again = () => {
      if (played) return;
      played = true;
      // riavvia la crescita della linea
      const prev = cvList.style.animation;
      cvList.style.animation = 'none';
      void cvList.offsetWidth;
      cvList.style.animation = prev;

      // riavvia ogni <li> con una piccola cascata manuale
      cvList.querySelectorAll('li').forEach((li, i) => {
        const a = li.style.animation;
        li.style.animation = 'none';
        void li.offsetWidth;
        // piccola attesa crescente
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
  }
});
