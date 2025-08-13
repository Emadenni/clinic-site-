
(function(){
  const cards = document.querySelectorAll('.ba-card');

  cards.forEach(card => {
    const media  = card.querySelector('.ba-media');
    const after  = media.querySelector('.ba-img--after');
    const handle = media.querySelector('.ba-handle');

    // posizione iniziale dalla data-attr (se presente) o 50
    const start = Number(card.getAttribute('data-split')) || 50;
    setSplit(start);

    let dragging = false;

    function setSplit(pct){
      const clamped = Math.max(0, Math.min(100, pct));
      // un'unica fonte di verità: --split
      media.style.setProperty('--split', clamped + '%');
    }

    function xToPct(clientX){
      const r = media.getBoundingClientRect();
      return ((clientX - r.left) / r.width) * 100;
    }

    function onPointerDown(e){
      dragging = true;
      // catturo il puntatore sul contenitore per non perderlo
      media.setPointerCapture?.(e.pointerId);
      move(e);
    }
    function onPointerMove(e){
      if (!dragging) return;
      // clientX esiste per pointer/mouse; su touch è emulato nei pointer events
      const pct = xToPct(e.clientX);
      setSplit(pct);
    }
    function onPointerUp(e){
      dragging = false;
      media.releasePointerCapture?.(e.pointerId);
    }

    // Importantissimo su mobile: evitare che il browser prenda lo scroll
    media.addEventListener('pointerdown', (e)=>{ e.preventDefault(); onPointerDown(e); }, {passive:false});
    media.addEventListener('pointermove', (e)=>{ e.preventDefault(); onPointerMove(e); }, {passive:false});
    window.addEventListener('pointerup',   onPointerUp, {passive:true});
    window.addEventListener('pointercancel', onPointerUp, {passive:true});

    // Anche il knob deve avviare il drag
    const knob = media.querySelector('.ba-knob');
    knob.addEventListener('pointerdown', (e)=>{ e.preventDefault(); onPointerDown(e); }, {passive:false});
  });
})();

