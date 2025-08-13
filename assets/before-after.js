(function(){
  document.querySelectorAll('.ba-card').forEach(card => {
    const media = card.querySelector('.ba-media');
    const knob = card.querySelector('.ba-knob');

    let isDragging = false;

    const setSplit = (clientX) => {
      const rect = media.getBoundingClientRect();
      let percent = ((clientX - rect.left) / rect.width) * 100;
      percent = Math.max(0, Math.min(100, percent));
      media.style.setProperty('--split', `${percent}%`);
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      e.preventDefault(); // blocca solo mentre drag
      setSplit(e.clientX);
    };

    const onPointerUp = () => {
      isDragging = false;
      document.removeEventListener('pointermove', onPointerMove, { passive: false });
      document.removeEventListener('pointerup', onPointerUp);
    };

    const onPointerDown = (e) => {
      isDragging = true;
      e.preventDefault(); // blocca scroll SOLO durante drag
      setSplit(e.clientX);
      document.addEventListener('pointermove', onPointerMove, { passive: false });
      document.addEventListener('pointerup', onPointerUp);
    };

    // 🔹 Listener solo sul knob, non sul contenitore
    knob.addEventListener('pointerdown', onPointerDown, { passive: false });
  });
})();
