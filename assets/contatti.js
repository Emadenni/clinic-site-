const form = document.querySelector('#contactForm');
const alertBox = document.querySelector('#formAlert');
const btn = document.querySelector('#submitBtn');
const successPane = document.querySelector('#contactSuccess');
const msg = document.querySelector('#message');
const msgHelp = document.querySelector('#msgHelp');
const prefRadios = [...document.querySelectorAll('input[name="pref"]')];
const prefBlocks = [...document.querySelectorAll('.pref-extra [data-pref]')];
const phone = document.querySelector('#phone');
const whatsappNumber = document.querySelector('#whatsappNumber');
const storageKey = 'contactForm.v1';

// --- Mostra/nasconde blocchi extra ---
function showPref(pref) {
  prefBlocks.forEach(b => {
    const show = b.getAttribute('data-pref') === pref;
    b.classList.toggle('hidden', !show);

    const input = b.querySelector('input, select');
    if (input) {
      if (pref === 'Telefono' && input.id === 'phone') {
        input.required = true;
      } else if (pref === 'WhatsApp' && input.id === 'whatsappNumber') {
        input.required = true;
      } else {
        input.required = false;
      }
      input.setAttribute('aria-invalid', 'false');
    }
  });

  if (pref !== 'WhatsApp' && whatsappNumber) whatsappNumber.value = '';
  if (pref !== 'Telefono' && phone) phone.value = '';
}
prefRadios.forEach(r => r.addEventListener('change', e => showPref(e.target.value)));
showPref(prefRadios.find(r => r.checked)?.value || 'Email');

// --- Contatore messaggio ---
function updateCounter() {
  const v = msg.value.length;
  msgHelp.textContent = `${v}/1000`;
}
msg.addEventListener('input', updateCounter);
updateCounter();

// --- Normalizzazione numeri ---
function normalizePhone(v) {
  return v.replace(/[^\d+]/g, '');
}
phone?.addEventListener('input', () => phone.value = normalizePhone(phone.value));
whatsappNumber?.addEventListener('input', () => whatsappNumber.value = normalizePhone(whatsappNumber.value));

// --- Salvataggio bozza ---
function saveDraft() {
  const data = new FormData(form);
  const obj = {};
  for (const [k, v] of data.entries()) obj[k] = v;
  try { localStorage.setItem(storageKey, JSON.stringify(obj)); } catch {}
}
function loadDraft() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    const obj = JSON.parse(raw);
    Object.keys(obj).forEach(k => {
      const el = form.elements[k];
      if (!el) return;
      if (el.type === 'radio') {
        const r = [...form.querySelectorAll(`input[name="${k}"]`)].find(x => x.value === obj[k]);
        if (r) r.checked = true;
      } else if (el.type === 'checkbox') {
        el.checked = !!obj[k];
      } else {
        el.value = obj[k];
      }
    });
    const prefSel = [...prefRadios].find(r => r.checked)?.value;
    showPref(prefSel || 'Email');
    updateCounter();
  } catch {}
}
loadDraft();
form.addEventListener('input', saveDraft);

// --- Validazione ---
function validate() {
  let ok = true;
  const required = ['name','email','message','privacy'];
  required.forEach(id => {
    const el = form.querySelector('#' + id);
    if (!el) return;
    const valid = el.type === 'checkbox' ? el.checked : !!el.value.trim();
    el.setAttribute('aria-invalid', valid ? 'false' : 'true');
    if (!valid) ok = false;
  });

  const pref = [...prefRadios].find(r => r.checked)?.value;
  if (pref === 'Telefono') {
    const tel = form.querySelector('#phone');
    if (tel && !tel.value.trim()) {
      tel.setAttribute('aria-invalid', 'true');
      ok = false;
    }
  }
  if (pref === 'WhatsApp') {
    const wn = form.querySelector('#whatsappNumber');
    if (wn && !wn.value.trim()) {
      wn.setAttribute('aria-invalid', 'true');
      ok = false;
    }
  }
  return ok;
}
function scrollToFirstInvalid() {
  const invalid = form.querySelector('[aria-invalid="true"]');
  if (invalid) invalid.scrollIntoView({behavior: 'smooth', block: 'center'});
}

// --- Submit ---
async function onSubmit(e) {
  e.preventDefault();
  alertBox.className = 'form-alert';
  alertBox.textContent = '';

  if (!validate()) {
    alertBox.className = 'form-alert error';
    alertBox.textContent = 'Controlla i campi evidenziati.';
    scrollToFirstInvalid();
    return;
  }
  const honeypot = form.querySelector('.hp');
  if (honeypot && honeypot.value) return;

  btn.setAttribute('aria-busy', 'true');
  btn.disabled = true;

  try {
    const fd = new FormData(form);
    const payload = {
      topic: fd.get('topic'),
      name: fd.get('name'),
      surname: fd.get('surname'),
      email: fd.get('email'),
      phone: normalizePhone(fd.get('phone') || ''),
      pref: fd.get('pref'),
      callbackTime: fd.get('callbackTime'),
      whatsappNumber: normalizePhone(fd.get('whatsappNumber') || ''),
      message: fd.get('message'),
      privacy: !!fd.get('privacy'),
      marketing: !!fd.get('marketing'),
      meta: { ua: navigator.userAgent, ts: new Date().toISOString() }
    };

    // --- TEST senza backend ---
    await new Promise(r => setTimeout(r, 800)); // simula attesa
    form.hidden = true;
    successPane.hidden = false;
    localStorage.removeItem(storageKey);
    alertBox.className = 'form-alert ok';
    alertBox.textContent = '✅ Messaggio inviato correttamente (modalità test).';

    // Scroll automatico al messaggio di conferma (mobile/desktop) con offset header
    setTimeout(() => {
      const header = document.querySelector('.site-header');
      const offset = header ? header.offsetHeight + 12 : 12;
      const top = successPane.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }, 100);

    /*
    // --- INVIO REALE (riattiva quando hai un backend o un servizio esterno) ---
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Errore invio');
    form.hidden = true;
    successPane.hidden = false;
    localStorage.removeItem(storageKey);

    // Scroll anche qui, se usi l'invio reale
    setTimeout(() => {
      const header = document.querySelector('.site-header');
      const offset = header ? header.offsetHeight + 12 : 12;
      const top = successPane.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }, 100);
    */

  } catch (err) {
    alertBox.className = 'form-alert error';
    alertBox.textContent = 'Si è verificato un problema. Puoi riprovare o scriverci a info@clinica.it';
  } finally {
    btn.removeAttribute('aria-busy');
    btn.disabled = false;
  }
}
form.addEventListener('submit', onSubmit);


document.querySelectorAll('[data-copy]').forEach(btn => {
  btn.addEventListener('click', async () => {
    const text = btn.getAttribute('data-copy');
    try {
      await navigator.clipboard.writeText(text);
      const old = btn.innerHTML;
      btn.innerHTML = '<svg class="btn-ico" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> Copiato!';
      btn.disabled = true;
      setTimeout(() => { btn.innerHTML = old; btn.disabled = false; }, 1500);
    } catch { alert('Indirizzo: ' + text); }
  });
});
