/* Service pages: fade cards and steps in as they enter the screen */
(function () {
  if (!('IntersectionObserver' in window)) return;
  var els = document.querySelectorAll('.service-card, .step');
  if (!els.length) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var t = e.target; t.classList.add('in');
      setTimeout(function () { t.style.transitionDelay = ''; }, 800);
      io.unobserve(e.target);
    });
  }, { threshold: 0.15 });
  els.forEach(function (el, i) {
    el.classList.add('vx-reveal');
    el.style.transitionDelay = (i % 3) * 70 + 'ms';
    io.observe(el);
  });
})();

/* Plan cards: collapse the feature list behind a "See what's included" button */
(function () {
  var en = (document.documentElement.lang || 'es').slice(0, 2) === 'en';
  var L = en ? { show: 'See what’s included', hide: 'Hide' } : { show: 'Ver qué incluye', hide: 'Ocultar' };
  var cards = document.querySelectorAll('.plan-card:not(.plan-enterprise), .pack-card');
  cards.forEach(function (card) {
    var ul = card.querySelector('.plan-features, .pack-features');
    if (!ul || card.querySelector('.vx-feat-toggle')) return;
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'vx-feat-toggle'; btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span>' + L.show + '</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
    ul.parentNode.insertBefore(btn, ul);
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      var group = window.innerWidth > 640 && card.parentNode ? card.parentNode.querySelectorAll('.plan-card:not(.plan-enterprise), .pack-card') : [card];
      group.forEach(function (c) {
        var b = c.querySelector('.vx-feat-toggle'), u = c.querySelector('.plan-features, .pack-features');
        if (!b || !u) return;
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
        b.querySelector('span').textContent = open ? L.hide : L.show;
        u.classList.toggle('vx-open', open);
      });
    });
  });
})();

/* Hero background: slow rotating circles inspired by the VORTEX logo */
(function () {
  var hero = document.querySelector('.hero');
  if (!hero || !window.HTMLCanvasElement) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var c = document.createElement('canvas'); c.className = 'vx-hero-bg'; c.setAttribute('aria-hidden', 'true');
  hero.insertBefore(c, hero.firstChild);
  var ctx = c.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2), W = 0, H = 0, rings = [], dots = [], raf = 0, visible = true, t0 = 0;
  var G = '90,171,110';
  function size() {
    var r = hero.getBoundingClientRect(); W = r.width; H = r.height;
    c.width = W * dpr; c.height = H * dpr; c.style.width = W + 'px'; c.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var small = W < 640;
    rings = [
      { x: W * (small ? 0.02 : 0.08), y: H * 0.78, R: small ? 90 : 150, sp: 0.00012, ph: 0.4, dx: 0.004, dy: 0.003 },
      { x: W * (small ? 0.98 : 0.9), y: H * 0.22, R: small ? 80 : 130, sp: -0.00016, ph: 2.1, dx: -0.003, dy: 0.004 },
      { x: W * (small ? 0.85 : 0.72), y: H * 1.02, R: small ? 50 : 80, sp: 0.0002, ph: 4.0, dx: 0.003, dy: -0.002 },
      { x: W * (small ? 0.12 : 0.28), y: H * 0.02, R: small ? 40 : 60, sp: -0.00022, ph: 1.2, dx: -0.002, dy: 0.003 }
    ];
    dots = [];
    var n = small ? 14 : 26;
    for (var i = 0; i < n; i++) dots.push({ x: Math.random() * W, y: Math.random() * H, a: Math.random() * Math.PI * 2, r: 1 + Math.random() * 1.5, s: 0.15 + Math.random() * 0.25 });
  }
  function cluster(g, t) {
    var x = g.x + Math.sin(t * g.dx * 0.06 + g.ph) * 18, y = g.y + Math.cos(t * g.dy * 0.06 + g.ph) * 14, R = g.R, rot = g.ph + t * g.sp;
    ctx.save(); ctx.translate(x, y);
    ctx.setLineDash([4, 6]); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(' + G + ',.22)';
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    [[0.82, 0.32, 1.6], [0.62, 0.36, 1.6], [0.42, 0.42, 1.8]].forEach(function (a, k) {
      ctx.strokeStyle = 'rgba(' + G + ',' + a[1] + ')'; ctx.lineWidth = a[2]; ctx.lineCap = 'round';
      var start = rot * (1 + k * 0.35); ctx.beginPath(); ctx.arc(0, 0, R * a[0], start, start + Math.PI * 1.05); ctx.stroke();
    });
    ctx.strokeStyle = 'rgba(' + G + ',.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, R * 0.22, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(' + G + ',.45)'; ctx.beginPath(); ctx.arc(0, 0, Math.max(2.5, R * 0.035), 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function draw(ts) {
    var t = reduce ? 0 : (ts || 0) - t0;
    ctx.clearRect(0, 0, W, H);
    rings.forEach(function (g) { cluster(g, t); });
    dots.forEach(function (d) {
      var y = d.y + Math.sin(t * 0.0004 * d.s + d.a) * 10, x = d.x + Math.cos(t * 0.0003 * d.s + d.a) * 10;
      ctx.fillStyle = 'rgba(' + G + ',.28)'; ctx.beginPath(); ctx.arc(x, y, d.r, 0, Math.PI * 2); ctx.fill();
    });
    if (!reduce && visible) raf = requestAnimationFrame(draw);
  }
  size(); if (reduce) draw(0); else raf = requestAnimationFrame(function (ts) { t0 = ts; draw(ts); });
  var tm; window.addEventListener('resize', function () { clearTimeout(tm); tm = setTimeout(function () { size(); if (reduce) draw(0); }, 150); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) {
    var v = e[0].isIntersecting;
    if (v && !visible && !reduce) { visible = true; raf = requestAnimationFrame(draw); } else if (!v) { visible = false; cancelAnimationFrame(raf); }
  }).observe(hero);
})();
