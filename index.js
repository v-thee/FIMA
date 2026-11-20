// e-FUND landing page interactions
(() => {
  // Always start at the top of the landing page (no restored scroll or #hash)
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  window.scrollTo(0, 0);
  window.addEventListener('pageshow', () => window.scrollTo(0, 0));

  // Loading screen: runs at least ~1.8s, finishes once the page has loaded
  const loader = document.getElementById('loader');
  const ring = document.getElementById('ringFill');
  const pct = document.getElementById('loaderPct');
  let progress = 0, loaded = document.readyState === 'complete', minDone = false, hidden = false;
  const hideLoader = () => {
    if (hidden) return; hidden = true;
    ring.style.strokeDashoffset = 0; pct.textContent = 100;
    setTimeout(() => {
      window.scrollTo(0, 0);
      loader.classList.add('done');
      document.body.classList.remove('loading');
      setTimeout(() => loader.remove(), 700);
    }, 250);
  };
  const tickLoader = setInterval(() => {
    // ease toward 90% while waiting, then jump to 100% when ready
    progress += (90 - progress) * 0.06 + 0.4;
    if (progress > 90) progress = 90;
    ring.style.strokeDashoffset = 100 - progress; pct.textContent = Math.floor(progress);
    if (loaded && minDone) { clearInterval(tickLoader); hideLoader(); }
  }, 60);
  setTimeout(() => { minDone = true; }, 1800);
  window.addEventListener('load', () => { loaded = true; });
  setTimeout(() => { loaded = true; minDone = true; }, 6000); // failsafe


  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // Footer year
  const yr = $('#year');
  if (yr) yr.textContent = new Date().getFullYear();

  // Mobile menu
  const menuBtn = $('#menuBtn');
  const navLinks = $('#navLinks');
  menuBtn?.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
  });
  $$('#navLinks a').forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuBtn?.setAttribute('aria-expanded', 'false');
  }));

  // Scroll-spy for nav links
  const links = $$('#navLinks a');
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(l => {
    const t = $(l.getAttribute('href'));
    if (t) spy.observe(t);
  });

  // Reveal on scroll
  const reveal = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  $$('.reveal').forEach(el => reveal.observe(el));

  // Count-up numbers
  $$('[data-count]').forEach(el => {
    const target = +el.dataset.count;
    let n = 0;
    const tick = () => {
      n += 1;
      el.textContent = n;
      if (n < target) setTimeout(tick, 900 / target);
    };
    setTimeout(tick, 500);
  });


  // Feature roadmap slideshow: auto-advances every 3s (clicking a step is optional)
  const fx = $('#fx');
  if (fx) {
    const lis = $$('.road li', fx);
    const nodes = $$('.node', fx);
    const panels = $$('.fx-panel', fx);
    const info = $('.fx-info', fx);
    const fill = $('#roadFill');
    const bar = $('#fxTime');
    const N = lis.length, DELAY = 3000;
    let cur = 0, timer = null, inView = true;

    const restartBar = () => { bar.classList.remove('run'); void bar.offsetWidth; bar.classList.add('run'); };
    const show = i => {
      cur = (i + N) % N;
      lis.forEach((li, k) => { li.classList.toggle('done', k < cur); li.classList.toggle('active', k === cur); });
      panels.forEach((p, k) => p.classList.toggle('active', k === cur));
      fill.style.width = (cur / (N - 1) * 100) + '%';
      fx.dataset.c = lis[cur].dataset.c;
      info.classList.add('swap');
      setTimeout(() => {
        $('#fxNo').textContent = String(cur + 1).padStart(2, '0');
        $('#fxTitle').textContent = nodes[cur].dataset.title;
        $('#fxDesc').textContent = nodes[cur].dataset.desc;
        info.classList.remove('swap');
      }, 220);
      restartBar();
    };
    const loop = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { if (inView && !document.hidden) show(cur + 1); loop(); }, DELAY);
    };
    nodes.forEach((n, i) => n.addEventListener('click', () => { show(i); loop(); }));
    // only play while the section is on screen
    new IntersectionObserver(([e]) => {
      inView = e.isIntersecting; fx.classList.toggle('off', !inView);
      if (inView) { show(cur); loop(); }
    }, { threshold: 0.3 }).observe(fx);
    show(0); loop();
  }

  // UI preview tabs
  const tabs = $$('.tab');
  const img = $('#shotImg');
  const cap = $('#shotCap');
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    img.style.opacity = 0;
    setTimeout(() => {
      img.src = tab.dataset.img;
      img.alt = tab.textContent + ' preview';
      cap.innerHTML = tab.dataset.cap;
      img.style.opacity = 1;
    }, 200);
  }));

  // Animate the sample request stepper (loops through the approval stages)
  const steps = $$('#stepper li');
  let idx = 2;
  const status = $('.status');
  const labels = ['Submitted', 'Documents received', 'Under review', 'Approved', 'Released'];
  setInterval(() => {
    idx = (idx + 1) % steps.length;
    steps.forEach((s, i) => {
      s.classList.toggle('done', i < idx || idx === steps.length - 1 && i <= idx);
      s.classList.toggle('current', i === idx && idx !== steps.length - 1);
    });
    if (status) status.textContent = labels[idx];
  }, 1100);

  // Subtle pointer-follow tilt on the hero card (desktop only)
  const card = $('.req-card');
  if (card && matchMedia('(hover:hover)').matches) {
    const vis = $('.hero-visual');
    vis.addEventListener('mousemove', e => {
      const r = vis.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `rotate(${-3 + x * 4}deg) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
    });
    vis.addEventListener('mouseleave', () => { card.style.transform = ''; });
  }

  // Hide broken logo images gracefully (e.g. if a file name differs)
  $$('img.logo').forEach(i => i.addEventListener('error', () => { i.style.visibility = 'hidden'; i.style.width = '0'; }));
})();