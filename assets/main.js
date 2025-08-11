document.getElementById('year').textContent = new Date().getFullYear();
const btn = document.getElementById('openBooking');
const panel = document.getElementById('booking');
btn?.addEventListener('click', () => {
  const hidden = panel.classList.toggle('hidden');
  panel.setAttribute('aria-hidden', String(hidden));
  panel.scrollIntoView({behavior: 'smooth', block: 'start'});
});

