
(function () {
  "use strict";

  /* ----------------------------------------
     CONFIG
     ---------------------------------------- */
  const CONFIG = {
    autoOpenDelayMs: 10000,  // mostra la modale 1s dopo load
    closeOnBackdrop: true,
    closeOnEsc: true,
    autoCloseAfterSuccessMs: null, // null = non chiudere in automatico
    backendUrl: "/api/newsletter",
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
  const BACKDROP = document.getElementById("promo-backdrop");
  const CLOSE    = document.getElementById("promo-close");
  const FORM     = document.getElementById("promo-form");
  const MSG      = document.getElementById("promo-msg");
  const SUBMIT   = FORM?.querySelector('[type="submit"]');

  let lastFocusedEl = null;

  /* ----------------------------------------
     UTILITY
     ---------------------------------------- */
  const $clean   = v => (v || "").trim();
  const $isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($clean(v));
  const $isPhone = v => /^[0-9+\-\s]{6,}$/.test($clean(v));

  function setMessage(text, type) {
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
  function openPromo() {
    // 🔒 Se vuoi NON riaprire più dopo invio, togli i commenti:
    /*
    if (localStorage.getItem("promo:done") === "1") {
      return; // già completato → non aprire
    }
    */
    lastFocusedEl = document.activeElement;
    BACKDROP.hidden = false;
    document.body.style.overflow = "hidden";
    const firstInput = FORM?.querySelector('input[name="firstName"]');
    if (firstInput) firstInput.focus();
    if (CONFIG.closeOnEsc) window.addEventListener("keydown", onEscClose);
  }

  function closePromo() {
    BACKDROP.hidden = true;
    document.body.style.overflow = "";
    if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
      lastFocusedEl.focus();
    }
    window.removeEventListener("keydown", onEscClose);
  }

  function onEscClose(e) {
    if (e.key === "Escape" && !BACKDROP.hidden) closePromo();
  }

  if (CONFIG.closeOnBackdrop && BACKDROP) {
    BACKDROP.addEventListener("click", e => {
      if (e.target === BACKDROP) closePromo();
    });
  }

  CLOSE?.addEventListener("click", () => closePromo());

  window.addEventListener("load", () => {
    if (typeof CONFIG.autoOpenDelayMs === "number") {
      setTimeout(openPromo, CONFIG.autoOpenDelayMs);
    }
  });

  /* ----------------------------------------
     VALIDAZIONE
     ---------------------------------------- */
  function validateForm(data) {
    if (!data.firstName) return { ok: false, msg: "Inserisci il nome." };
    if (!data.lastName)  return { ok: false, msg: "Inserisci il cognome." };
    if (!data.email || !$isEmail(data.email)) {
      return { ok: false, msg: "Inserisci un'email valida." };
    }
    if (data.phone && !$isPhone(data.phone)) {
      return { ok: false, msg: "Inserisci un numero di telefono valido." };
    }
    if (!data.consent) {
      return { ok: false, msg: "Devi accettare per continuare." };
    }
    return { ok: true };
  }

  /* ----------------------------------------
     INVIO DATI – BACKEND
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

  /* ----------------------------------------
     INVIO DATI – EMAILJS (commentato)
     ---------------------------------------- */
  async function sendWithEmailJs(data) {
    if (!CONFIG.emailJs.enabled) return { ok: true };
    /* 
    // Assicurati di avere incluso lo script:
    // <script src="https://cdn.jsdelivr.net/npm/emailjs-com@3/dist/email.min.js"></script>

    emailjs.init(CONFIG.emailJs.publicKey);

    const adminParams = {
      firstName: data.firstName,
      lastName:  data.lastName,
      email:     data.email,
      phone:     data.phone,
      page_url:  location.href
    };

    const userParams = {
      to_email: data.email,
      to_name:  `${data.firstName} ${data.lastName}`,
      discount: CONFIG.emailJs.userAutoReply.discount,
      coupon:   CONFIG.emailJs.userAutoReply.coupon,
      subject:  CONFIG.emailJs.userAutoReply.subject,
      message:  CONFIG.emailJs.userAutoReply.message
    };

    await emailjs.send(CONFIG.emailJs.serviceId, CONFIG.emailJs.templateAdmin, adminParams);
    await emailjs.send(CONFIG.emailJs.serviceId, CONFIG.emailJs.templateUser, userParams);
    */
    return { ok: true };
  }

  /* ----------------------------------------
     SUBMIT
     ---------------------------------------- */
  FORM?.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMessage("", "");
    setLoading(true);

    const data = {
      firstName: $clean(FORM.firstName.value),
      lastName:  $clean(FORM.lastName.value),
      email:     $clean(FORM.email.value),
      phone:     $clean(FORM.phone.value),
      consent:   FORM.consent.checked === true
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

      // 🔒 Se vuoi segnare completato e NON riaprire più:
      // localStorage.setItem("promo:done", "1");

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

  /* ----------------------------------------
     API GLOBALI
     ---------------------------------------- */
  window.openPromoModal  = openPromo;
  window.closePromoModal = closePromo;
})();

