// Apri automaticamente la FAQ se c'è un hash (#id)
const openFromHash = () => {
  if (!location.hash) return;
  const el = document.querySelector(location.hash);
  if (el && el.tagName.toLowerCase() === 'details') el.open = true;
};
window.addEventListener('hashchange', openFromHash);
openFromHash();
