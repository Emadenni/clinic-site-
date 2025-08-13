(function(){
  const cards = document.querySelectorAll('.ba-card');
  if (!cards.length) return;

  cards.forEach(card => {
    const media  = card.querySelector('.ba-media');
    const knob   = media.querySelector('.ba-knob');

    // iniziale dalla figura (es. data-split="60")
    const initial = Number(card.getAttribute('data-split'));
    if (Number.isFinite(initial)) media.style.setProperty('--split', initial + '%');

    let dragging = false;
    let pid = null;
    let raf = 0;

    const setSplit = pct => {
      const v = Math.max(0, Math.min(100, pct));
      media.style.setProperty('--split', v + '%');
    };
    const xToPct = x => {
      const r = media.getBoundingClientRect();
      return ((x - r.left) / r.width) * 100;
    };
    const schedule = x => {
      if (!Number.isFinite(x)) return;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setSplit(xToPct(x)));
    };

    const onDown = e => {
      // drag SOLO se parte dal knob
      if (e.target !== knob) return;
      dragging = true;
      pid = e.pointerId;
      media.setPointerCapture?.(pid);
      e.preventDefault();               // blocca pan/scroll
      schedule(e.clientX);
    };
    const onMove = e => {
      if (!dragging || (pid != null && e.pointerId !== pid)) return;
      e.preventDefault();
      schedule(e.clientX);
    };
    const onUp = e => {
      if (pid != null && e.pointerId !== pid) return;
      dragging = false;
      media.releasePointerCapture?.(pid);
      pid = null;
    };

    knob.addEventListener('pointerdown', onDown, { passive:false });
    window.addEventListener('pointermove', onMove, { passive:false });
    window.addEventListener('pointerup',   onUp,   { passive:true });
    window.addEventListener('pointercancel', onUp, { passive:true });
  });
})();
