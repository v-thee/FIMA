// e-FUND — dashboard (front-end demo).
// Data + session live in this browser's localStorage. A real deployment needs a backend / database.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const SESSION = 'efund_session', DATA = 'efund_data_v1';
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  /* ---------- session guard ---------- */
  const me = read(SESSION, null);
  if (!me) { location.replace('login.html'); return; }
  const isAdmin = me.role === 'admin';
  const first = (me.name || 'there').split(' ')[0];

  /* ---------- helpers ---------- */
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => 'PHP ' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
  const short = n => n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : n >= 1e3 ? (n / 1e3).toFixed(n % 1e3 ? 1 : 0).replace(/\.0$/, '') + 'k' : String(n);
  const fdate = ts => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const fshort = ts => { const d = new Date(ts); return d.toLocaleDateString('en-US', d.getFullYear() === new Date().getFullYear() ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: '2-digit' }); };
  const ago = ts => {
    const m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1) return 'just now'; if (m < 60) return m + 'm ago';
    const h = Math.floor(m / 60); if (h < 24) return h + 'h ago';
    const d = Math.floor(h / 24); return d < 7 ? d + 'd ago' : fdate(ts);
  };
  const slug = s => s.replace(/\s+/g, '-');
  const STATUSES = ['Pending', 'Under review', 'Approved', 'Released', 'Returned'];
  const FLOW = ['Pending', 'Under review', 'Approved', 'Released'];
  const stChip = s => `<em class="st st-${slug(s)}">${s}</em>`;

  /* ---------- data ---------- */
  const DAY = 864e5;
  function seed() {
    const t = Date.now(), o = 'officer@demo.efund';
    return {
      seq: 7,
      requests: [
        { id: 1, project: 'Leadership Training Seminar', committee: 'Committee on Academic Affairs', amount: 25000, purpose: 'Venue, materials and certificates for the annual student leaders seminar.', status: 'Approved', date: t - 9 * DAY, owner: o, ownerName: 'Demo Officer', docs: { resolution: 'resolution-seminar.pdf', signature: 'signature.png' }, remarks: 'All requirements complete. Approved.' },
        { id: 2, project: 'Community Outreach Drive', committee: 'Committee on Social Welfare', amount: 18500, purpose: 'Supplies and transport for the barangay outreach program.', status: 'Released', date: t - 16 * DAY, owner: o, ownerName: 'Demo Officer', docs: { resolution: 'resolution-outreach.pdf', signature: 'signature.png' }, remarks: 'Check released.', check: 1 },
        { id: 3, project: 'Tech Fair Booth Setup', committee: 'Committee on Technology', amount: 32000, purpose: 'Booth materials, banners and equipment rental.', status: 'Under review', date: t - 4 * DAY, owner: o, ownerName: 'Demo Officer', docs: { resolution: 'resolution-techfair.pdf', signature: 'signature.png' }, remarks: '' },
        { id: 4, project: 'Orientation Program', committee: 'Committee on Student Affairs', amount: 12000, purpose: 'Printing, snacks and venue for freshmen orientation.', status: 'Pending', date: t - 1 * DAY, owner: o, ownerName: 'Demo Officer', docs: { resolution: 'resolution-orientation.pdf', signature: null }, remarks: '' },
        { id: 5, project: 'Sports Fest Medals', committee: 'Committee on Sports', amount: 8500, purpose: 'Medals and trophies for the intramurals.', status: 'Returned', date: t - 12 * DAY, owner: o, ownerName: 'Demo Officer', docs: { resolution: null, signature: 'signature.png' }, remarks: 'Missing approved resolution. Please attach and resubmit.' },
        { id: 6, project: 'Foundation Day Program', committee: 'Committee on Culture and Arts', amount: 15000, purpose: 'Stage, sound system and decorations.', status: 'Released', date: t - 25 * DAY, owner: o, ownerName: 'Demo Officer', docs: { resolution: 'resolution-foundation.pdf', signature: 'signature.png' }, remarks: 'Check released.', check: 2 }
      ],
      notifs: [
        { id: 1, for: o, title: 'Deadline reminder', desc: 'Orientation Program: signature is still missing.', ts: t - 3 * 36e5, read: false, k: 'bell' },
        { id: 2, for: o, title: 'Status updated', desc: 'Leadership Training Seminar was approved.', ts: t - 2 * DAY, read: false, k: 'check' },
        { id: 3, for: o, title: 'New remarks', desc: 'COMMFIMA left a remark on Sports Fest Medals.', ts: t - 3 * DAY, read: true, k: 'file' },
        { id: 4, for: 'admin', title: 'New request', desc: 'Orientation Program is waiting for review.', ts: t - 1 * DAY, read: false, k: 'send' },
        { id: 5, for: 'admin', title: 'Request updated', desc: 'Tech Fair Booth Setup is under review.', ts: t - 4 * DAY, read: true, k: 'clock' }
      ],
      log: [
        { id: 1, ts: t - 1 * DAY, text: 'Orientation Program submitted', owner: o },
        { id: 2, ts: t - 4 * DAY, text: 'Tech Fair Booth Setup moved to Under review', owner: o },
        { id: 3, ts: t - 9 * DAY, text: 'Leadership Training Seminar approved', owner: o },
        { id: 4, ts: t - 12 * DAY, text: 'Sports Fest Medals returned with remarks', owner: o },
        { id: 5, ts: t - 16 * DAY, text: 'Community Outreach Drive: check released', owner: o }
      ]
    };
  }
  let db = read(DATA, null) || seed();
  const save = () => write(DATA, db);
  save();

  const mine = r => isAdmin || r.owner === me.email;
  const visible = () => db.requests.filter(mine).sort((a, b) => b.date - a.date);
  const myNotifs = () => db.notifs.filter(n => isAdmin ? n.for === 'admin' : n.for === me.email).sort((a, b) => b.ts - a.ts);
  const myLog = () => db.log.filter(l => isAdmin || l.owner === me.email).sort((a, b) => b.ts - a.ts);
  const byId = id => db.requests.find(r => r.id === id);
  const addLog = (text, owner) => db.log.push({ id: ++db.seq, ts: Date.now(), text, owner });
  const addNotif = (to, title, desc, k = 'bell') => db.notifs.push({ id: ++db.seq, for: to, title, desc, ts: Date.now(), read: false, k });

  /* ---------- toast ---------- */
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.innerHTML = icon('check') + `<span>${esc(msg)}</span>`;
    $('#toasts').appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = 0; setTimeout(() => t.remove(), 300); }, 2800);
  }

  /* ---------- shell ---------- */
  const initial = (me.name || '?').trim()[0].toUpperCase();
  $('#uAv').textContent = initial; $('#uAv2').textContent = initial;
  $('#uName').textContent = me.name;
  $('#uRole').textContent = isAdmin ? 'COMMFIMA Admin' : 'SSC Officer';

  const TITLES = { home: 'Home', requests: 'Request Fund', vouchers: 'Disbursement Voucher', checks: 'Checks', projects: 'Projects' };
  let view = 'home', filter = 'All', query = '';

  const sidebar = $('#sidebar'), scrim = $('#scrim');
  const openMenu = o => { sidebar.classList.toggle('open', o); scrim.classList.toggle('show', o); };
  $('#menuBtn').addEventListener('click', () => openMenu(true));
  $('#sbClose').addEventListener('click', () => openMenu(false));
  scrim.addEventListener('click', () => openMenu(false));
  $$('#nav button').forEach(b => b.addEventListener('click', () => go(b.dataset.view)));
  $('#logout').addEventListener('click', () => { try { localStorage.removeItem(SESSION); } catch {} location.href = 'login.html'; });

  function go(v) {
    if (!TITLES[v]) v = 'home';
    view = v; if (v !== 'requests') { filter = 'All'; query = ''; }
    $$('#nav button').forEach(b => b.classList.toggle('active', b.dataset.view === v));
    $('#pageTitle').textContent = TITLES[v];
    history.replaceState(null, '', '#' + v);
    openMenu(false); render();
    window.scrollTo({ top: 0 });
  }

  function render() {
    const root = $('#view');
    root.style.animation = 'none'; void root.offsetWidth; root.style.animation = '';
    ({ home: renderHome, requests: renderRequests, vouchers: renderVouchers, checks: renderChecks, projects: renderProjects }[view])(root);
    refreshChrome();
  }

  function refreshChrome() {
    const pend = visible().filter(r => r.status === 'Pending' || r.status === 'Under review').length;
    $('#cReq').textContent = pend || '';
    const un = myNotifs().filter(n => !n.read).length;
    const b = $('#bellBadge'); b.hidden = !un; b.textContent = un;
    renderPop();
  }

  /* ---------- notifications popover ---------- */
  const nIcon = k => `<span class="f-ico ${k === 'bell' ? 'g' : k === 'file' ? 'o' : ''}">${icon(k)}</span>`;
  const notifItem = n => `<li class="${n.read ? '' : 'unread'}">${nIcon(n.k)}<div><b>${esc(n.title)}</b><p>${esc(n.desc)}</p><time>${ago(n.ts)}</time></div></li>`;
  function renderPop() {
    const l = myNotifs().slice(0, 6);
    $('#popList').innerHTML = l.length ? `<ul class="feed">${l.map(notifItem).join('')}</ul>` : '<div class="empty"><b>No notifications</b>You are all caught up.</div>';
  }
  const pop = $('#pop');
  $('#bellBtn').addEventListener('click', e => { e.stopPropagation(); pop.hidden = !pop.hidden; $('#bellBtn').setAttribute('aria-expanded', !pop.hidden); });
  document.addEventListener('click', e => { if (!pop.hidden && !pop.contains(e.target)) pop.hidden = true; });
  $('#markRead').addEventListener('click', () => { myNotifs().forEach(n => n.read = true); save(); refreshChrome(); if (view === 'home') renderHome($('#view')); });

  /* ---------- shared pieces ---------- */
  const rqRow = r => `<button class="rq" data-open="${r.id}">
      <div class="who"><span class="dot-ico">${icon('file')}</span><div><b>${esc(r.project)}</b><small>${esc(r.committee)}${isAdmin ? ' · ' + esc(r.ownerName || '') : ''}</small></div></div>
      <div class="amt">${money(r.amount)}<small>Requested</small></div>
      <div class="dt">${fshort(r.date)}<small>Submitted</small></div>
      ${stChip(r.status)}<span class="chev">${icon('arrow')}</span></button>`;
  const emptyReq = () => `<div class="empty">${icon('send')}<b>No fund requests yet</b>${isAdmin ? 'Requests submitted by SSC officers will show up here.' : 'Start by submitting your first fund request.'}${isAdmin ? '' : '<br><button class="btn btn-primary sm" data-new>' + icon('plus') + ' New fund request</button>'}</div>`;
  const bindOpen = root => $$('[data-open]', root).forEach(b => b.addEventListener('click', () => openDetail(+b.dataset.open)));
  const bindNew = root => $$('[data-new]', root).forEach(b => b.addEventListener('click', openNew));
  const countUp = (el, to) => { const dur = 700, t0 = performance.now(); const step = t => { const p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); };

  /* ---------- HOME ---------- */
  function renderHome(root) {
    const rs = visible();
    const funds = rs.filter(r => r.status === 'Approved' || r.status === 'Released').reduce((s, r) => s + r.amount, 0);
    const projects = new Set(rs.map(r => r.project.toLowerCase())).size;
    const pending = rs.filter(r => r.status === 'Pending' || r.status === 'Under review').length;
    const counts = Object.fromEntries(STATUSES.map(s => [s, rs.filter(r => r.status === s).length]));
    const total = rs.length || 1;
    const log = myLog().slice(0, 5), ns = myNotifs().slice(0, 4);
    const demo = me.email.endsWith('@demo.efund');

    root.innerHTML = `
      ${demo ? `<div class="demo-note">${icon('alert')}<span>Demo data &mdash; saved only in this browser.</span><button id="resetDemo">Reset demo data</button></div>` : ''}
      <div class="hello">
        <div><h2>Welcome back, ${esc(first)}!</h2><p>${isAdmin ? 'Review incoming fund requests and keep every record in order.' : 'Track your fund requests and keep your documents organized.'}</p></div>
        ${isAdmin ? '' : `<button class="btn btn-primary" data-new>${icon('plus')} New fund request</button>`}
      </div>

      <div class="stats">
        <div class="tile glass-s"><div class="icon-tile t-sky">${icon('wallet')}</div><small>Total funds</small><b>PHP ${short(funds)}</b><span>Approved &amp; released</span></div>
        <div class="tile glass-s"><div class="icon-tile t-orange">${icon('send')}</div><small>Total requests</small><b data-n="${rs.length}">0</b><span>${isAdmin ? 'From all officers' : 'Submitted by you'}</span></div>
        <div class="tile glass-s"><div class="icon-tile t-gold">${icon('brief')}</div><small>Total projects</small><b data-n="${projects}">0</b><span>With fund requests</span></div>
        <div class="tile glass-s"><div class="icon-tile t-sky">${icon('clock')}</div><small>In progress</small><b data-n="${pending}">0</b><span>Pending or under review</span></div>
      </div>

      <div class="cols">
        <div class="col">
          <section class="panel glass-s">
            <div class="p-head"><h3>${icon('send')} Recent requests</h3><button class="p-link" data-go="requests">View all</button></div>
            ${rs.length ? `<div class="rq-list">${rs.slice(0, 5).map(rqRow).join('')}</div>` : emptyReq()}
          </section>
          <section class="panel glass-s">
            <div class="p-head"><h3>${icon('chart')} Request status</h3></div>
            <div class="sbar">${STATUSES.map(s => `<span class="c-${slug(s)}" style="width:${(counts[s] / total * 100).toFixed(1)}%" title="${s}"></span>`).join('')}</div>
            <div class="legend">${STATUSES.map(s => `<div><i class="c-${slug(s)}"></i>${s}<b>${counts[s]}</b></div>`).join('')}</div>
          </section>
        </div>
        <div class="col">
          <section class="panel glass-s">
            <div class="p-head"><h3>${icon('bell')} Notifications</h3></div>
            ${ns.length ? `<ul class="feed">${ns.map(notifItem).join('')}</ul>` : '<div class="empty"><b>No notifications</b>You are all caught up.</div>'}
          </section>
          <section class="panel glass-s">
            <div class="p-head"><h3>${icon('shield')} Audit trail</h3></div>
            ${log.length ? `<ul class="feed log">${log.map(l => `<li><span class="d"></span>${esc(l.text)}<time>${ago(l.ts)}</time></li>`).join('')}</ul>` : '<div class="empty"><b>No activity yet</b>Actions are recorded here.</div>'}
          </section>
        </div>
      </div>`;
    $$('[data-n]', root).forEach(el => countUp(el, +el.dataset.n));
    $$('[data-go]', root).forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
    $('#resetDemo', root)?.addEventListener('click', () => { if (confirm('Reset all demo requests and notifications?')) { db = seed(); save(); render(); toast('Demo data reset'); } });
    bindOpen(root); bindNew(root);
  }

  /* ---------- REQUESTS ---------- */
  function renderRequests(root) {
    const all = visible();
    root.innerHTML = `
      <div class="hello"><div><h2>${isAdmin ? 'Fund requests' : 'Your fund requests'}</h2><p>Search, filter and open any request to see its documents and status.</p></div>
        ${isAdmin ? '' : `<button class="btn btn-primary" data-new>${icon('plus')} New fund request</button>`}</div>
      <div class="toolbar"><label class="search">${icon('search')}<input id="q" type="search" placeholder="Search by project or committee…" value="${esc(query)}" aria-label="Search requests" /></label></div>
      <div class="fchips" id="chips">${['All', ...STATUSES].map(s => `<button class="fchip ${s === filter ? 'on' : ''}" data-f="${s}">${s}<em>${s === 'All' ? all.length : all.filter(r => r.status === s).length}</em></button>`).join('')}</div>
      <div class="rq-list" id="rqList"></div>`;
    const draw = () => {
      const q = query.trim().toLowerCase();
      const rs = all.filter(r => (filter === 'All' || r.status === filter) && (!q || (r.project + ' ' + r.committee).toLowerCase().includes(q)));
      $('#rqList').innerHTML = rs.length ? rs.map(rqRow).join('') : (all.length ? `<div class="empty">${icon('search')}<b>No matching requests</b>Try a different search or filter.</div>` : emptyReq());
      bindOpen($('#rqList')); bindNew($('#rqList'));
    };
    draw();
    $('#q').addEventListener('input', e => { query = e.target.value; draw(); });
    $$('#chips .fchip').forEach(c => c.addEventListener('click', () => { filter = c.dataset.f; $$('#chips .fchip').forEach(x => x.classList.toggle('on', x === c)); draw(); }));
    bindNew(root);
  }

  /* ---------- VOUCHERS ---------- */
  const folderSvg = '<svg class="big" viewBox="0 0 86 70" aria-hidden="true"><defs><linearGradient id="fg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd062"/><stop offset="1" stop-color="#EEA61C"/></linearGradient></defs><path d="M4 12a6 6 0 0 1 6-6h20l8 9h38a6 6 0 0 1 6 6v39a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6z" fill="url(#fg)"/><path d="M4 26h78v33a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6z" fill="#fff" fill-opacity=".35"/></svg>';
  function renderVouchers(root) {
    const rs = visible().filter(r => r.status === 'Approved' || r.status === 'Released');
    root.innerHTML = `<div class="hello"><div><h2>Disbursement vouchers</h2><p>A folder is created for every approved or released request.</p></div></div>` +
      (rs.length ? `<div class="folders">${rs.map(r => `<button class="folder glass-s" data-open="${r.id}">${folderSvg}<b>${esc(r.project)}</b><small>${money(r.amount)}</small>${stChip(r.status)}</button>`).join('')}</div>`
        : `<div class="empty glass-s panel">${icon('folder')}<b>No vouchers yet</b>Approved requests will appear here as folders.</div>`);
    bindOpen(root);
  }

  /* ---------- CHECKS ---------- */
  function renderChecks(root) {
    const rs = visible().filter(r => r.status === 'Released');
    root.innerHTML = `<div class="hello"><div><h2>Checks</h2><p>Funds that have been released by COMMFIMA.</p></div></div>` +
      (rs.length ? `<div class="rq-list">${rs.map(r => `<button class="chk" data-open="${r.id}"><span class="no">CHK-${String(r.check || r.id).padStart(4, '0')}</span><div><b>${esc(r.project)}</b><small>${esc(r.committee)}</small></div><b>${money(r.amount)}</b>${stChip('Released')}</button>`).join('')}</div>`
        : `<div class="empty glass-s panel">${icon('card')}<b>No checks released</b>Released requests will be listed here.</div>`);
    bindOpen(root);
  }

  /* ---------- PROJECTS ---------- */
  function renderProjects(root) {
    const rs = visible(); const pct = { Pending: 20, 'Under review': 50, Approved: 75, Released: 100, Returned: 20 };
    root.innerHTML = `<div class="hello"><div><h2>Projects</h2><p>Every project with a fund request and how far along it is.</p></div></div>` +
      (rs.length ? `<div class="proj-grid">${rs.map(r => `<button class="proj glass-s" data-open="${r.id}">${stChip(r.status)}<h3>${esc(r.project)}</h3><small>${esc(r.committee)}</small><div class="prog"><span style="width:${pct[r.status]}%"></span></div><div class="meta"><span>${pct[r.status]}% complete</span><span>${money(r.amount)}</span></div></button>`).join('')}</div>`
        : `<div class="empty glass-s panel">${icon('brief')}<b>No projects yet</b>Projects appear here once you submit a fund request.</div>`);
    bindOpen(root);
  }

  /* ---------- MODALS ---------- */
  const mroot = $('#modalRoot');
  function openModal(html) {
    mroot.innerHTML = `<div class="modal-frame" role="dialog" aria-modal="true"><div class="modal">${html}</div></div>`;
    mroot.hidden = false; document.body.style.overflow = 'hidden';
    mroot.querySelector('.x-btn')?.addEventListener('click', closeModal);
    return mroot.querySelector('.modal');
  }
  function closeModal() { mroot.hidden = true; mroot.innerHTML = ''; document.body.style.overflow = ''; }
  mroot.addEventListener('click', e => { if (e.target === mroot) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (!mroot.hidden) closeModal(); pop.hidden = true; } });

  function openDetail(id) {
    const r = byId(id); if (!r) return;
    const m = openModal(detailHtml(r));
    bindDetail(m, r);
  }
  const DOCS = [['resolution', 'Approved Resolution'], ['signature', 'Signature']];
  function detailHtml(r) {
    const idx = FLOW.indexOf(r.status);
    const steps = ['Submitted', 'Documents', 'Review', 'Approved', 'Released'];
    const cur = r.status === 'Returned' ? 2 : { Pending: 1, 'Under review': 2, Approved: 3, Released: 4 }[r.status];
    const stp = steps.map((s, i) => `<li class="${r.status === 'Returned' && i === 2 ? 'ret done' : r.status === 'Released' ? 'done' : i < cur ? 'done' : i === cur ? 'cur' : ''}"><i></i>${s}</li>`).join('');
    const docsOk = DOCS.every(([k]) => r.docs[k]);
    const canAttach = !isAdmin && r.owner === me.email && (r.status === 'Pending' || r.status === 'Returned');
    const docRows = DOCS.map(([k, label]) => `<div class="docrow">${icon('file')}<span>${label}${r.docs[k] ? ' &mdash; ' + esc(r.docs[k]) : ''}</span>${r.docs[k] ? '<em class="ok">Attached</em>' : (canAttach ? `<label class="mini-btn">Attach<input type="file" data-doc="${k}" hidden /></label>` : '<em class="miss">Missing</em>')}</div>`).join('');

    let actions = '', hint = '';
    if (isAdmin) {
      if (r.status === 'Pending') actions = `<button class="btn btn-primary sm" data-act="review">${icon('search')} Start review</button>`;
      if (r.status === 'Under review') {
        actions = `<button class="btn btn-danger sm" data-act="return">Return</button><button class="btn btn-primary sm" data-act="approve" ${docsOk ? '' : 'disabled'}>${icon('check')} Approve</button>`;
        if (!docsOk) hint = 'Waiting for the required documents before this can be approved.';
      }
      if (r.status === 'Approved') actions = `<button class="btn btn-primary sm" data-act="release">${icon('card')} Release funds</button>`;
    } else if (r.status === 'Returned' && r.owner === me.email) {
      actions = `<button class="btn btn-primary sm" data-act="resubmit" ${docsOk ? '' : 'disabled'}>${icon('send')} Resubmit</button>`;
      if (!docsOk) hint = 'Attach the missing documents, then resubmit.';
    }
    const remarkBox = isAdmin && (r.status === 'Pending' || r.status === 'Under review') ? `<div class="f-field" style="margin-top:14px"><label for="rm">Remarks (optional)</label><textarea id="rm" placeholder="Add a remark for the officer…"></textarea></div>` : '';

    return `<div class="m-top"><div><small>Fund request #${String(r.id).padStart(4, '0')}</small><h2>${esc(r.project)}</h2></div><div style="display:flex;gap:10px;align-items:center">${stChip(r.status)}<button class="x-btn" aria-label="Close">${icon('x')}</button></div></div>
      <div class="info"><div><small>Committee</small><b>${esc(r.committee)}</b></div><div><small>Amount</small><b>${money(r.amount)}</b></div><div><small>Submitted</small><b>${fdate(r.date)}</b></div><div><small>Requested by</small><b>${esc(r.ownerName || r.owner)}</b></div></div>
      <div class="purpose">${esc(r.purpose)}</div>
      <p class="m-sec">Progress</p><ol class="stp">${stp}</ol>
      <p class="m-sec">Documents</p><div class="docs">${docRows}</div>
      ${r.remarks ? `<p class="m-sec">COMMFIMA remarks</p><div class="remark"><small>Remark</small>${esc(r.remarks)}</div>` : ''}
      ${remarkBox}
      ${hint ? `<p class="hint">${hint}</p>` : ''}
      ${actions ? `<div class="m-actions">${actions}</div>` : ''}`;
  }
  function bindDetail(m, r) {
    $$('[data-doc]', m).forEach(inp => inp.addEventListener('change', () => {
      const f = inp.files[0]; if (!f) return;
      r.docs[inp.dataset.doc] = f.name; addLog(`${r.project}: document attached (${f.name})`, r.owner); save();
      m.innerHTML = detailHtml(r); bindDetail(m, r); m.querySelector('.x-btn').addEventListener('click', closeModal); render(); toast('Document attached');
    }));
    $$('[data-act]', m).forEach(b => b.addEventListener('click', () => {
      const act = b.dataset.act, remark = ($('#rm', m)?.value || '').trim();
      const to = r.owner;
      if (act === 'review') { r.status = 'Under review'; if (remark) r.remarks = remark; addLog(`${r.project} moved to Under review`, to); addNotif(to, 'Status updated', `${r.project} is now under review.`, 'clock'); toast('Review started'); }
      if (act === 'approve') { r.status = 'Approved'; r.remarks = remark || 'All requirements complete. Approved.'; addLog(`${r.project} approved`, to); addNotif(to, 'Request approved', `${r.project} was approved.`, 'check'); toast('Request approved'); }
      if (act === 'return') { r.status = 'Returned'; r.remarks = remark || 'Returned for revision.'; addLog(`${r.project} returned with remarks`, to); addNotif(to, 'New remarks', `COMMFIMA returned ${r.project}.`, 'file'); toast('Request returned'); }
      if (act === 'release') { r.status = 'Released'; r.check = 1 + Math.max(0, ...db.requests.map(x => x.check || 0)); r.remarks = 'Check released.'; addLog(`${r.project}: check released`, to); addNotif(to, 'Funds released', `Check issued for ${r.project}.`, 'card'); toast('Funds released'); }
      if (act === 'resubmit') { r.status = 'Pending'; r.date = Date.now(); r.remarks = ''; addLog(`${r.project} resubmitted`, to); addNotif('admin', 'Request resubmitted', `${r.project} was resubmitted.`, 'send'); toast('Request resubmitted'); }
      save(); closeModal(); render();
    }));
  }

  function openNew() {
    const m = openModal(`<div class="m-top"><div><small>New fund request</small><h2>Request funds</h2></div><button class="x-btn" aria-label="Close">${icon('x')}</button></div>
      <form id="nf" novalidate>
        <div class="f-field" id="g1"><label for="np">Project name</label><input id="np" type="text" placeholder="e.g. Leadership Training Seminar" /><span class="e">Enter the project name.</span></div>
        <div class="f-2">
          <div class="f-field" id="g2"><label for="nc">Committee</label><input id="nc" type="text" value="${esc(me.committee || '')}" placeholder="Your committee" /><span class="e">Enter your committee.</span></div>
          <div class="f-field" id="g3"><label for="na">Amount (PHP)</label><input id="na" type="number" min="1" step="0.01" placeholder="0.00" /><span class="e">Enter an amount greater than 0.</span></div>
        </div>
        <div class="f-field" id="g4"><label for="nu">Purpose</label><textarea id="nu" placeholder="What will the funds be used for?"></textarea><span class="e">Describe the purpose.</span></div>
        <p class="m-sec">Supporting documents</p>
        <div class="docs">
          <label class="filebox">${icon('upload')}<span data-name="resolution">Upload the approved resolution</span><input type="file" data-f="resolution" /></label>
          <label class="filebox">${icon('upload')}<span data-name="signature">Upload signature</span><input type="file" data-f="signature" /></label>
        </div>
        <div class="m-actions"><button type="button" class="btn btn-ghost sm" id="nCancel">Cancel</button><button type="submit" class="btn btn-primary sm">${icon('send')} Submit request</button></div>
      </form>`);
    const files = {};
    $$('[data-f]', m).forEach(i => i.addEventListener('change', () => { const f = i.files[0]; files[i.dataset.f] = f ? f.name : null; $(`[data-name=${i.dataset.f}]`, m).textContent = f ? f.name : 'Choose a file'; }));
    $('#nCancel', m).addEventListener('click', closeModal);
    $$('input,textarea', m).forEach(i => i.addEventListener('input', () => i.closest('.f-field')?.classList.remove('bad')));
    $('#nf', m).addEventListener('submit', e => {
      e.preventDefault();
      const v = { project: $('#np', m).value.trim(), committee: $('#nc', m).value.trim(), amount: parseFloat($('#na', m).value), purpose: $('#nu', m).value.trim() };
      const bad = { g1: !v.project, g2: !v.committee, g3: !(v.amount > 0), g4: !v.purpose };
      Object.entries(bad).forEach(([id, b]) => $('#' + id, m).classList.toggle('bad', b));
      if (Object.values(bad).some(Boolean)) return;
      const r = { id: ++db.seq, ...v, status: 'Pending', date: Date.now(), owner: me.email, ownerName: me.name, docs: { resolution: files.resolution || null, signature: files.signature || null }, remarks: '' };
      db.requests.push(r);
      addLog(`${r.project} submitted`, me.email);
      addNotif('admin', 'New request', `${r.project} is waiting for review.`, 'send');
      if (!r.docs.resolution || !r.docs.signature) addNotif(me.email, 'Documents needed', `${r.project}: attach all required documents.`, 'bell');
      save(); closeModal(); toast('Fund request submitted'); go('requests');
    });
    $('#np', m).focus();
  }

  /* ---------- go ---------- */
  go(TITLES[location.hash.slice(1)] ? location.hash.slice(1) : 'home');
})();
