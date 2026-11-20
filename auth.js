// e-FUND — login & sign-up (front-end demo).
// NOTE: accounts are stored in this browser's localStorage only. A real deployment needs a
// server / Google sign-in (OAuth) for authentication; this file is a UI prototype.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const USERS = 'efund_users', SESSION = 'efund_session', FLASH = 'efund_flash';
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

  async function hash(text) {
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('efund::' + text));
      return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
    } catch { return 'x' + btoa(unescape(encodeURIComponent(text))); }
  }
  const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  const startSession = u => {
    write(SESSION, { name: u.name, email: u.email, role: u.role, committee: u.committee || '', at: Date.now() });
    location.href = 'dashboard.html';
  };

  const alertBox = $('#alert');
  const showAlert = (msg, type = 'err') => {
    if (!alertBox) return;
    alertBox.className = 'alert show ' + type;
    $('#alertMsg').textContent = msg;
    alertBox.querySelector('use').setAttribute('href', type === 'ok' ? '#i-check' : '#i-alert');
  };
  const setBad = (id, bad) => { const el = $('#' + id); if (el) el.classList.toggle('bad', bad); return bad; };

  // Already signed in? go straight to the dashboard (login only)
  if (read(SESSION, null) && $('#loginForm')) location.replace('dashboard.html');

  // flash message from sign-up
  try {
    const f = sessionStorage.getItem(FLASH);
    if (f) { showAlert(f, 'ok'); sessionStorage.removeItem(FLASH); }
  } catch {}

  // show / hide password
  $$('.pw-toggle').forEach(b => b.addEventListener('click', () => {
    const inp = document.getElementById(b.dataset.target);
    const show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    b.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    b.querySelector('use').setAttribute('href', show ? '#i-eyeoff' : '#i-eye');
  }));

  // clear errors while typing
  $$('input').forEach(i => i.addEventListener('input', () => {
    i.closest('.field')?.classList.remove('bad');
    if (i.id === 'privacy') $('#fPriv').classList.remove('bad');
    alertBox?.classList.remove('show');
  }));
  $('#privacy')?.addEventListener('change', () => $('#fPriv').classList.remove('bad'));

  /* ---------------- LOGIN ---------------- */
  const loginForm = $('#loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email = $('#email').value.trim().toLowerCase();
      const pass = $('#password').value;
      let bad = false;
      bad = setBad('fEmail', !validEmail(email)) || bad;
      bad = setBad('fPass', !pass) || bad;
      bad = setBad('fPriv', !$('#privacy').checked) || bad;
      if (bad) { if (!$('#privacy').checked && validEmail(email) && pass) showAlert('Please acknowledge the Data Privacy Policy to continue.'); return; }

      const btn = $('#submitBtn'); btn.disabled = true;
      const user = read(USERS, []).find(u => u.email === email);
      const ok = user && user.pw === await hash(pass);
      if (!ok) { btn.disabled = false; return showAlert('Incorrect email or password. If you are new, create an account first.'); }
      startSession(user);
    });

    const needsPrivacy = () => {
      if ($('#privacy').checked) return false;
      $('#fPriv').classList.add('bad'); showAlert('Please acknowledge the Data Privacy Policy to continue.'); return true;
    };
    // Google button (demo: signs in as the demo officer; real version = Google OAuth)
    $('#googleBtn').addEventListener('click', () => {
      if (needsPrivacy()) return;
      startSession({ name: 'Demo Officer', email: 'officer@demo.efund', role: 'officer', committee: 'Demo Committee' });
    });
    $$('[data-demo]').forEach(b => b.addEventListener('click', () => {
      if (needsPrivacy()) return;
      const admin = b.dataset.demo === 'admin';
      startSession(admin
        ? { name: 'Demo COMMFIMA', email: 'admin@demo.efund', role: 'admin', committee: 'COMMFIMA' }
        : { name: 'Demo Officer', email: 'officer@demo.efund', role: 'officer', committee: 'Demo Committee' });
    }));
  }

  /* ---------------- SIGN UP ---------------- */
  const signupForm = $('#signupForm');
  if (signupForm) {
    const pw = $('#password'), meter = $('#meter'), txt = $('#meterTxt');
    const score = v => {
      let s = 0;
      if (v.length >= 8) s++;
      if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
      if (/\d/.test(v)) s++;
      if (/[^A-Za-z0-9]/.test(v) || v.length >= 12) s++;
      return v ? Math.max(1, s) : 0;
    };
    const labels = ['Use 8+ characters with letters and numbers.', 'Weak', 'Fair', 'Good', 'Strong'];
    pw.addEventListener('input', () => { const s = score(pw.value); meter.dataset.s = s; txt.textContent = labels[s]; });

    signupForm.addEventListener('submit', async e => {
      e.preventDefault();
      const name = $('#name').value.trim();
      const email = $('#email').value.trim().toLowerCase();
      const committee = $('#committee').value.trim();
      const role = $('input[name=role]:checked').value;
      const p = pw.value, c = $('#confirm').value;
      let bad = false;
      bad = setBad('fName', name.length < 2) || bad;
      bad = setBad('fEmail', !validEmail(email)) || bad;
      bad = setBad('fCommittee', committee.length < 2) || bad;
      bad = setBad('fPass', p.length < 8) || bad;
      bad = setBad('fConfirm', c !== p || !c) || bad;
      bad = setBad('fPriv', !$('#privacy').checked) || bad;
      if (bad) return showAlert(!$('#privacy').checked ? 'Please fix the highlighted fields and acknowledge the Data Privacy Policy.' : 'Please fix the highlighted fields.');

      const users = read(USERS, []);
      if (users.some(u => u.email === email)) { setBad('fEmail', true); return showAlert('An account with this email already exists. Try signing in.'); }
      const btn = $('#submitBtn'); btn.disabled = true;
      users.push({ name, email, committee, role, pw: await hash(p), created: Date.now() });
      if (!write(USERS, users)) { btn.disabled = false; return showAlert('Could not save your account (browser storage is blocked).'); }
      try { sessionStorage.setItem(FLASH, 'Account created! Sign in to continue.'); } catch {}
      location.href = 'login.html';
    });
  }
})();
