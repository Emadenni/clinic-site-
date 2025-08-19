(function () {
  "use strict";

  /* ----------------------------------------
     CONFIG
     ---------------------------------------- */
  const CONFIG = {
    autoOpenDelayMs: 10000,   
    closeOnBackdrop: true,
    closeOnEsc: true,
    autoCloseAfterSuccessMs: null, // null = non chiudere in automatico
    backendUrl: "/api/newsletter",
    showOnce: {
      scope: "session",   // "session" | "local"
      ttlMs: null         
    },
    emailJs: {
      enabled: false,
      publicKey: "PUB_xxxxxxxx",
      serviceId: "service_xxxxxxxx",
      templateAdmin: "template_admin_xxxx",
      templateUser: "template_user_xxxx",
      userAutoReply: {
        discount: "20%",
        coupon: "WELCOME20",
        subject: "Il tuo sconto -20%",
        message: "Grazie per l’iscrizione! Ecco il tuo sconto del 20%."
      }
    }
  };

  /* ----------------------------------------
     ELEMENTI
     ---------------------------------------- */
  let BACKDROP, CLOSE, FORM, MSG, SUBMIT;
  let lastFocusedEl = null;
  let listenersBound = false;
  let promoTimerId = null;
  let LAUNCHER = null;

  function bindEls() {
    BACKDROP = document.getElementById("promo-backdrop");
    CLOSE    = document.getElementById("promo-close");
    FORM     = document.getElementById("promo-form");
    MSG      = document.getElementById("promo-msg");
    SUBMIT   = FORM?.querySelector('[type="submit"]');
    LAUNCHER = document.getElementById("promo-launcher") || LAUNCHER;
  }

  /* ----------------------------------------
     INIETTA MARKUP SE MANCANTE
     ---------------------------------------- */
  function ensurePromoMarkup() {
    if (!document.getElementById("promo-backdrop")) {
      const html = `
<div id="promo-backdrop" class="promo-backdrop" hidden>
  <div class="promo-modal" role="dialog" aria-modal="true" aria-labelledby="promo-title">
    <button class="promo-close" id="promo-close" aria-label="Chiudi">×</button>
    <div class="promo-body">
      <img src="/images/logo-transparent-hamb.png" alt="logo-transparent-hamb" class="promo-logo" />
      <h2 id="promo-title">Iscriviti e ricevi <span class="u-accent">-20%</span></h2>
      <p class="promo-sub">
        Lasciaci i tuoi dati per ricevere <strong>offerte</strong>, <strong>novità</strong> e un
        <strong>buono sconto del 20%</strong> direttamente via email.
      </p>
      <form id="promo-form" novalidate>
        <div class="promo-grid">
          <label class="promo-field">
            <span>Nome</span>
            <input type="text" name="firstName" autocomplete="given-name" required />
          </label>
          <label class="promo-field">
            <span>Cognome</span>
            <input type="text" name="lastName" autocomplete="family-name" required />
          </label>
          <label class="promo-field promo-field--full">
            <span>Email</span>
            <input type="email" name="email" autocomplete="email" required />
          </label>
          <label class="promo-field promo-field--full">
            <span>Telefono</span>
            <input type="tel" name="phone" autocomplete="tel" inputmode="tel" />
          </label>
          <label class="promo-check promo-field--full">
            <input type="checkbox" name="consent" required />
            <span>
              Acconsento a ricevere comunicazioni su offerte e nuovi trattamenti.  
              Confermo di aver letto e accettato la 
              <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" class="privacy-policy-link">Privacy Policy</a>.
            </span>
          </label>
        </div>
        <button class="btn btn-primary promo-submit" type="submit">Invia e ottieni -20%</button>
        <p class="promo-note">Riceverai il codice sconto via email dopo la registrazione.</p>
        <p class="promo-msg" id="promo-msg" role="status" aria-live="polite"></p>
      </form>
    </div>
  </div>
</div>`;
      const wrapper = document.createElement("div");
      wrapper.innerHTML = html;
      document.body.appendChild(wrapper.firstElementChild);
    }

    if (!document.getElementById("promo-launcher")) {
      const btn = document.createElement("button");
      btn.id = "promo-launcher";
      btn.type = "button";
      btn.setAttribute("aria-label", "Apri l’offerta -20%");
      btn.title = "Apri l’offerta -20%";
      btn.innerHTML = `
<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="22" height="22">
  <path d="M20 7h-2.18A3 3 0 0 0 12 5.5 3 3 0 0 0 6.18 7H4a1 1 0 0 0-1 1v3h18V8a1 1 0 0 0-1-1ZM9 7a1.5 1.5 0 1 1 3 0H9Zm-6 6v6a2 2 0 0 0 2 2h6v-8H3Zm10 0v8h6a2 2 0 0 0 2-2v-6h-8Z"/>
</svg>`;
      btn.addEventListener("click", () => openPromo());
      document.body.appendChild(btn);
    }
  }

  /* ----------------------------------------
     STORAGE UTILS
     ---------------------------------------- */
  const SHOWN_KEY = "promo:shown";

  function getStore() {
    try {
      return CONFIG.showOnce.scope === "local" ? window.localStorage : window.sessionStorage;
    } catch {
      return {
        _mem: {},
        getItem(k){ return this._mem[k] ?? null; },
        setItem(k,v){ this._mem[k]=v; },
        removeItem(k){ delete this._mem[k]; }
      };
    }
  }

  function hasPromoShown() {
    const store = getStore();
    const raw = store.getItem(SHOWN_KEY);
    if (!raw) return false;
    if (raw === "1") return true;

    try {
      const obj = JSON.parse(raw);
      if (!obj || typeof obj.ts !== "number") return true;
      if (CONFIG.showOnce.ttlMs == null) return true;
      const expired = (Date.now() - obj.ts) > CONFIG.showOnce.ttlMs;
      if (expired) {
        store.removeItem(SHOWN_KEY);
        return false;
      }
      return true;
    } catch {
      return true;
    }
  }

  function markPromoShown() {
    const store = getStore();
    if (CONFIG.showOnce.ttlMs == null) {
      try { store.setItem(SHOWN_KEY, "1"); } catch {}
    } else {
      const payload = JSON.stringify({ ts: Date.now() });
      try { store.setItem(SHOWN_KEY, payload); } catch {}
    }
  }

  /* ----------------------------------------
     UTILITY
     ---------------------------------------- */
  const $clean   = v => (v || "").trim();
  const $isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($clean(v));
  const $isPhone = v => /^[0-9+\-\s]{6,}$/.test($clean(v));

  function setMessage(text, type) {
    if (!MSG) return;
    MSG.textContent = text || "";
    MSG.className = "promo-msg";
    if (type === "ok") MSG.classList.add("promo-msg--ok");
    if (type === "err") MSG.classList.add("promo-msg--err");
  }

  function setLoading(isLoading) {
    if (!SUBMIT) return;
    SUBMIT.disabled = !!isLoading;
    if (isLoading) {
      SUBMIT.dataset._label = SUBMIT.textContent;
      SUBMIT.textContent = "Invio in corso…";
    } else if (SUBMIT.dataset._label) {
      SUBMIT.textContent = SUBMIT.dataset._label;
      delete SUBMIT.dataset._label;
    }
  }

  /* ----------------------------------------
     OPEN / CLOSE
     ---------------------------------------- */
  function hideLauncher(){
    if (!LAUNCHER) return;
    LAUNCHER.style.opacity = "0";
    setTimeout(() => { if (LAUNCHER) LAUNCHER.style.display = "none"; }, 120);
  }

  function showLauncher(){
    if (!LAUNCHER) return;
    LAUNCHER.style.display = "flex";
    requestAnimationFrame(() => { LAUNCHER.style.opacity = "1"; });
  }

  function openPromo() {
    if (!BACKDROP || !FORM) {
      ensurePromoMarkup();
      bindEls();
    }
    if (!BACKDROP) return;
    lastFocusedEl = document.activeElement;
    BACKDROP.hidden = false;
    document.body.style.overflow = "hidden";
    const firstInput = FORM?.querySelector('input[name="firstName"]');
    if (firstInput) firstInput.focus();
    if (CONFIG.closeOnEsc) window.addEventListener("keydown", onEscClose);
  }

  function closePromo() {
    if (!BACKDROP) return;
    BACKDROP.hidden = true;
    document.body.style.overflow = "";
    if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
      lastFocusedEl.focus();
    }
    window.removeEventListener("keydown", onEscClose);
    showLauncher(); // sempre visibile
    markPromoShown();
  }

  function onEscClose(e) {
    if (e.key === "Escape" && BACKDROP && !BACKDROP.hidden) closePromo();
  }

  /* ----------------------------------------
     LISTENERS
     ---------------------------------------- */
  function bindListenersOnce() {
    if (listenersBound) return;
    listenersBound = true;

    document.addEventListener("click", (e) => {
      if (!CONFIG.closeOnBackdrop) return;
      if (!BACKDROP) return;
      if (e.target === BACKDROP) closePromo();
    });

    document.addEventListener("click", (e) => {
      if (e.target && e.target.id === "promo-close") closePromo();
    });

    document.addEventListener("submit", async (e) => {
      if (e.target?.id !== "promo-form") return;
      e.preventDefault();
      setMessage("", "");
      setLoading(true);

      const data = {
        firstName: $clean(e.target.firstName.value),
        lastName:  $clean(e.target.lastName.value),
        email:     $clean(e.target.email.value),
        phone:     $clean(e.target.phone.value),
        consent:   e.target.consent.checked === true
      };

      const check = validateForm(data);
      if (!check.ok) {
        setLoading(false);
        setMessage(check.msg, "err");
        return;
      }

      try {
        await sendToBackend(CONFIG.backendUrl, data);
        await sendWithEmailJs(data);
        setMessage("Grazie! Controlla la tua email: riceverai il codice sconto del 20%.", "ok");
        if (typeof CONFIG.autoCloseAfterSuccessMs === "number") {
          setTimeout(() => closePromo(), CONFIG.autoCloseAfterSuccessMs);
        }
      } catch (err) {
        console.warn("Errore iscrizione:", err);
        setMessage("Si è verificato un errore. Riprova tra poco.", "err");
      } finally {
        setLoading(false);
      }
    });
  }

  /* ----------------------------------------
     COOKIE → AVVIO TIMER
     ---------------------------------------- */
  function startPromoTimerIfEligible() {
    if (promoTimerId || hasPromoShown()) return;
    if (typeof CONFIG.autoOpenDelayMs !== "number") return;
    promoTimerId = setTimeout(() => {
      try { openPromo(); } finally { promoTimerId = null; }
    }, CONFIG.autoOpenDelayMs);
  }

  window.addEventListener("cookieConsentClosed", startPromoTimerIfEligible);

  /* ----------------------------------------
     VALIDAZIONE
     ---------------------------------------- */
  function validateForm(data) {
    if (!data.firstName) return { ok: false, msg: "Inserisci il nome." };
    if (!data.lastName)  return { ok: false, msg: "Inserisci il cognome." };
    if (!data.email || !$isEmail(data.email)) return { ok: false, msg: "Inserisci un'email valida." };
    if (data.phone && !$isPhone(data.phone)) return { ok: false, msg: "Inserisci un numero di telefono valido." };
    if (!data.consent) return { ok: false, msg: "Devi accettare per continuare." };
    return { ok: true };
  }

  /* ----------------------------------------
     INVIO DATI
     ---------------------------------------- */
  async function sendToBackend(url, payload) {
    if (!url) return { ok: true };
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) throw new Error("Errore invio backend");
    return { ok: true };
  }

  async function sendWithEmailJs(data) {
    if (!CONFIG.emailJs.enabled) return { ok: true };
    return { ok: true };
  }

  /* ----------------------------------------
     BOOT
     ---------------------------------------- */
  function boot() {
    ensurePromoMarkup();
    bindEls();
    bindListenersOnce();
    showLauncher(); // sempre visibile dal primo boot
    const cc = window.CookieConsent;
    if (cc) {
      if (cc.accepted === true || cc.rejected === true) {
        startPromoTimerIfEligible();
      }
    } else {
      startPromoTimerIfEligible();
    }
  }

  if (document.readyState === "complete") {
    boot();
  } else {
    window.addEventListener("load", boot, { once: true });
  }

  /* ----------------------------------------
     API GLOBALI
     ---------------------------------------- */
  window.openPromoModal  = openPromo;
  window.closePromoModal = closePromo;
})();
