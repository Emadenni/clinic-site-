(function(){
  "use strict";

  // ====== CONFIG / STORAGE ======
  const STORAGE_KEY_STATUS = "cc:status";   // "all" | "necessary" | "none"
  const STORAGE_KEY_PREFS  = "cc:prefs";    // JSON categorie
  const STORAGE_KEY_VER    = "cc:version";  // invalidamento
  const BANNER_VERSION     = "v1";

  // Mappa categorie (estendibile)
  function prefsFor(status){
    if (status === "all") {
      return { necessary:true, analytics:true, marketing:true, preferences:true };
    }
    return { necessary:true, analytics:false, marketing:false, preferences:false };
  }

  // ====== AUTO-INIEZIONE MARKUP ======
  function ensureCookieMarkup(){
    if (document.getElementById("cc-backdrop")) return;

    const html = `
<div id="cc-backdrop" class="cc-backdrop" hidden>
  <div class="cc-modal" role="dialog" aria-modal="true" aria-labelledby="cc-title" aria-describedby="cc-desc">
    <div class="cc-content">
      <h2 id="cc-title" class="cc-title">Cookie</h2>
      <p id="cc-desc" class="cc-text">
        Usiamo cookie per migliorare la tua esperienza. Puoi accettare tutti, consentire solo i necessari oppure rifiutare.
        Puoi cambiare scelta in qualsiasi momento dal footer.
      </p>
      <div class="cc-actions">
        <button class="cc-btn cc-btn-secondary" id="cc-reject" type="button">Rifiuta</button>
        <button class="cc-btn cc-btn-ghost" id="cc-necessary" type="button">Solo necessari</button>
        <button class="cc-btn cc-btn-primary" id="cc-accept" type="button">Accetta tutti</button>
      </div>
      <p class="cc-links"><a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a></p>
    </div>
  </div>
</div>`;
    const wrap = document.createElement("div");
    wrap.innerHTML = html;
    document.body.appendChild(wrap.firstElementChild);
  }

  // ====== LS utils ======
  const ls = {
    get(k){ try{ return localStorage.getItem(k); }catch{ return null; } },
    set(k,v){ try{ localStorage.setItem(k,v); }catch{} },
    del(k){ try{ localStorage.removeItem(k); }catch{} }
  };

  function isValidStoredChoice(){
    const ver = ls.get(STORAGE_KEY_VER);
    const s = ls.get(STORAGE_KEY_STATUS);
    return ver === BANNER_VERSION && (s === "all" || s === "necessary" || s === "none");
  }

  // ====== DOM refs (post-iniezione) ======
  let $backdrop, $acceptAll, $necessary, $reject;

  function queryEls(){
    $backdrop  = document.getElementById("cc-backdrop");
    $acceptAll = document.getElementById("cc-accept");
    $necessary = document.getElementById("cc-necessary");
    $reject    = document.getElementById("cc-reject");
  }

  // ====== Open/Close ======
  function openBanner(){
    if (!$backdrop) return;
    $backdrop.hidden = false;
    document.body.classList.add("no-scroll");
    setTimeout(() => { try{ ($acceptAll || $necessary || $reject)?.focus(); }catch{} }, 0);
  }

  function closeBanner(){
    if ($backdrop) {
      $backdrop.hidden = true;
      document.body.classList.remove("no-scroll");
    }
    // 👇 Notifica la CHIUSURA del banner, indipendentemente dalla scelta
    try { window.dispatchEvent(new Event("cookieConsentClosed")); } catch {}
  }

  // ====== API / Eventi ======
  function emitAccepted(status, prefs){
    // stato globale semplice
    window.CookieConsent = window.CookieConsent || {};
    window.CookieConsent.accepted  = true;
    window.CookieConsent.status    = status;
    window.CookieConsent.prefs     = prefs;
    window.CookieConsent.version   = BANNER_VERSION;
    window.CookieConsent.open      = openBanner;
    window.CookieConsent.close     = closeBanner;
    window.CookieConsent.getStatus = () => status;
    window.CookieConsent.getPrefs  = () => ({...prefs});

    // evento per chi vuole ascoltare la decisione (opzionale)
    try { window.dispatchEvent(new Event("cookieConsentAccept")); } catch {}
  }

  function applyChoice(status){
    const prefs = prefsFor(status);
    ls.set(STORAGE_KEY_STATUS, status);
    ls.set(STORAGE_KEY_PREFS, JSON.stringify(prefs));
    ls.set(STORAGE_KEY_VER, BANNER_VERSION);
    emitAccepted(status, prefs);
    closeBanner(); // emette anche cookieConsentClosed
  }

  // Espongo API per bottone footer
  window.CookieConsent = window.CookieConsent || {};
  window.CookieConsent.open = openBanner;
  window.CookieConsent.close = closeBanner;
  window.CookieConsent.accepted = false;
  window.CookieConsent.getStatus = () => ls.get(STORAGE_KEY_STATUS);
  window.CookieConsent.getPrefs  = () => {
    try { return JSON.parse(ls.get(STORAGE_KEY_PREFS) || "{}"); } catch { return {}; }
  };

  // ====== Boot ======
  function boot(){
    ensureCookieMarkup();  // crea HTML se manca
    queryEls();            // aggancia elementi

    // bind dopo che esistono i nodi
    $acceptAll?.addEventListener("click", () => applyChoice("all"));
    $necessary?.addEventListener("click", () => applyChoice("necessary"));
    $reject?.addEventListener("click", () => applyChoice("none"));

    if (isValidStoredChoice()){
      // ripristina stato subito (niente banner)
      const s = ls.get(STORAGE_KEY_STATUS);
      emitAccepted(s, prefsFor(s));
      closeBanner(); // 👉 emette anche cookieConsentClosed, utile per far partire la promo dopo 10s
    } else {
      openBanner();
    }
  }

  if (document.readyState === "complete") boot();
  else window.addEventListener("load", boot, { once:true });
})();
