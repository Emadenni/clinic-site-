// Caricamento dinamico dei trattamenti + UI/UX modal
const GRID = document.getElementById("t-grid");
const MODAL_BACKDROP = document.getElementById("t-modal-backdrop");
const MODAL_IMG = document.getElementById("t-modal-img");
const MODAL_TITLE = document.getElementById("t-modal-title");
const MODAL_META = document.getElementById("t-modal-meta");
const MODAL_LONG = document.getElementById("t-modal-long");
const MODAL_BOOK = document.getElementById("t-modal-book");
const CONTACT_BTN = document.getElementById("t-modal-contact"); // ← cambiato
const MODAL_CLOSE = document.getElementById("t-modal-close");
const SEARCH = document.getElementById("search");
const CHIPS = document.getElementById("quick-chips");
const MODAL_LIST = document.getElementById("t-modal-list");
const MODAL_WHY = document.getElementById("t-modal-why");

let TREATMENTS = [];
let lastFocusedEl = null;

// Util: crea elemento con classi e contenuto
function el(tag, className, html) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (html !== undefined) n.innerHTML = html;
  return n;
}

async function loadTreatments() {
  try {
    const res = await fetch("/data/treatments.json", { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("Impossibile caricare treatments.json");
    TREATMENTS = await res.json();
    renderGrid(TREATMENTS);
    // Se c'è uno slug nell'URL, apri direttamente
    const url = new URL(location.href);
    const slug = url.searchParams.get("t");
    if (slug) {
      const item = TREATMENTS.find((t) => t.slug === slug);
      if (item) openModal(item);
    }
  } catch (err) {
    GRID.innerHTML = `<div class="t-error">Errore nel caricamento dei trattamenti. Riprova più tardi.</div>`;
    console.error(err);
  }
}

function pill(label) {
  return `<span class="t-pill">${label}</span>`;
}

function card(item) {
  const a11yLabel = `${item.title}: durata ${item.duration}, dolore ${item.pain}. ${item.short}`;
  const c = el("article", "t-card");

  const media = el("div", "t-card__media");
  const img = new Image();
  img.src = `/${item.image}`.replace(/\/+/g, "/");
  img.alt = item.title;
  img.loading = "lazy";
  media.appendChild(img);
  if (item.featured) {
    media.insertAdjacentHTML("beforeend", `<span class="t-card__badge">In evidenza</span>`);
  }

  const body = el("div", "t-card__body");
  const title = el("h3", "t-card__title", item.title);
  const pills = el("div", "t-pills", `${pill(item.duration)} ${pill("Dolore: " + item.pain)}`);
  const shortP = el("p", "t-short", item.short);
  const btnWrap = el("div", "t-more");
  const btn = el("button", "btn btn-primary");
  btn.type = "button";
  btn.textContent = "Dettagli";
  btn.setAttribute("aria-label", a11yLabel);
  btn.addEventListener("click", () => openModal(item));

  btnWrap.appendChild(btn);
  body.append(title, pills, shortP, btnWrap);
  c.append(media, body);
  return c;
}

function renderGrid(list) {
  GRID.innerHTML = "";
  if (!list.length) {
    GRID.innerHTML = "<p>Nessun trattamento trovato.</p>";
    return;
  }
  const frag = document.createDocumentFragment();
  for (const t of list) {
    frag.appendChild(card(t));
  }
  GRID.appendChild(frag);
}

function openModal(item) {
  lastFocusedEl = document.activeElement;

  MODAL_IMG.src = `/${item.image}`.replace(/\/+/g, "/");
  MODAL_IMG.alt = item.title;
  MODAL_TITLE.textContent = item.title;

  // Reset meta
  MODAL_META.innerHTML = "";
  const meta = [
    ["Durata", item.duration],
    ["Dolore", item.pain],
    ["Risultato", item.result || "—"],
    ["Prezzo", item.price || "Su valutazione"],
  ];
  meta.forEach(([k, v]) => {
    const li = el("li", "", `<strong>${k}:</strong> ${v}`);
    MODAL_META.appendChild(li);
  });

  // Testo lungo
  MODAL_LONG.textContent = item.long || "";

  // Lista puntata opzionale
  if (typeof MODAL_LIST !== "undefined") {
    MODAL_LIST.innerHTML = "";
    if (item.bulletPoints && item.bulletPoints.length > 0) {
      item.bulletPoints.forEach(text => {
        const li = document.createElement("li");
        li.textContent = text;
        MODAL_LIST.appendChild(li);
      });
      MODAL_LIST.hidden = false;
    } else {
      MODAL_LIST.hidden = true;
    }
  }

  if (MODAL_WHY) {
  MODAL_WHY.innerHTML = "";
  if (Array.isArray(item.whyChoose) && item.whyChoose.length > 0) {
    item.whyChoose.forEach(text => {
      const li = document.createElement("li");
      li.textContent = text;
      MODAL_WHY.appendChild(li);
    });
    MODAL_WHY.hidden = false;
  } else {
    MODAL_WHY.hidden = true;
  }
}

  // Link azioni
  MODAL_BOOK.href = "https://calendly.com/mambylysolutions/consulenza-gratuita";
  MODAL_BOOK.target = "_blank";
  MODAL_BOOK.rel = "noopener noreferrer";
  if (CONTACT_BTN) CONTACT_BTN.href = `/contatti.html`;

  // Mostra modal
  MODAL_BACKDROP.hidden = false;
  document.body.style.overflow = "hidden";
  MODAL_CLOSE.focus();

  // Aggiorna URL (deep-linking)
  const url = new URL(location.href);
  url.searchParams.set("t", item.slug);
  history.replaceState({}, "", url);
}


function closeModal() {
  MODAL_BACKDROP.hidden = true;
  document.body.style.overflow = "";
  // Ripulisci parametro URL
  const url = new URL(location.href);
  url.searchParams.delete("t");
  history.replaceState({}, "", url);
  // Focus back
  if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
    lastFocusedEl.focus();
  }
}

// Eventi modal
MODAL_BACKDROP?.addEventListener("click", (e) => {
  if (e.target === MODAL_BACKDROP) closeModal();
});
MODAL_CLOSE?.addEventListener("click", closeModal);
window.addEventListener("keydown", (e) => {
  if (!MODAL_BACKDROP.hidden && e.key === "Escape") closeModal();
});

// Ricerca live
SEARCH?.addEventListener("input", () => {
  const q = SEARCH.value.trim().toLowerCase();
  const filtered = TREATMENTS.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      (t.short && t.short.toLowerCase().includes(q)) ||
      (t.long && t.long.toLowerCase().includes(q))
  );
  renderGrid(filtered);
});

// Chips veloci
CHIPS?.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-chip]");
  if (!btn) return;
  const type = btn.dataset.chip;
  CHIPS.querySelectorAll("button").forEach((b) => b.classList.toggle("is-active", b === btn));

  let filtered = TREATMENTS.slice();
  if (type === "featured") filtered = filtered.filter((t) => t.featured);
  if (type === "basso") filtered = filtered.filter((t) => (t.pain || "").toLowerCase().includes("basso"));
  if (type === "medio") filtered = filtered.filter((t) => (t.pain || "").toLowerCase().includes("medio"));
  renderGrid(filtered);
});

// Inizializza
loadTreatments();

// Extra: aggiorna anno footer se presente
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();
