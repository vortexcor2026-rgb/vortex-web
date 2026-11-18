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

/* Hero background: slow drifting dots joined by faint lines */
(function () {
  var hero = document.querySelector('.hero');
  if (!hero || !window.HTMLCanvasElement) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var c = document.createElement('canvas'); c.className = 'vx-hero-bg'; c.setAttribute('aria-hidden', 'true');
  hero.insertBefore(c, hero.firstChild);
  var ctx = c.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2), W = 0, H = 0, pts = [], raf = 0, visible = true;
  function size() {
    var r = hero.getBoundingClientRect(); W = r.width; H = r.height;
    c.width = W * dpr; c.height = H * dpr; c.style.width = W + 'px'; c.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(Math.min(70, Math.max(24, W * H / 16000)));
    pts = [];
    for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, r: 1 + Math.random() * 1.6 });
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    var max = 130;
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      if (!reduce) { p.x += p.vx; p.y += p.vy; if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10; if (p.y < -10) p.y = H + 10; if (p.y > H + 10) p.y = -10; }
      for (var j = i + 1; j < pts.length; j++) {
        var q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < max) { ctx.strokeStyle = 'rgba(90,171,110,' + (0.16 * (1 - d / max)).toFixed(3) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
      }
      ctx.fillStyle = 'rgba(90,171,110,0.38)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    if (!reduce && visible) raf = requestAnimationFrame(draw);
  }
  size(); draw();
  var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { cancelAnimationFrame(raf); size(); draw(); }, 150); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) {
    var v = e[0].isIntersecting; if (v && !visible && !reduce) { visible = true; draw(); } else if (!v) { visible = false; cancelAnimationFrame(raf); }
  }).observe(hero);
})();
