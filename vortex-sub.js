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
  var cards = document.querySelectorAll('.plan-card:not(.plan-enterprise)');
  cards.forEach(function (card) {
    var ul = card.querySelector('.plan-features');
    if (!ul || card.querySelector('.vx-feat-toggle')) return;
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'vx-feat-toggle'; btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span>' + L.show + '</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
    ul.parentNode.insertBefore(btn, ul);
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      var group = window.innerWidth > 640 && card.parentNode ? card.parentNode.querySelectorAll('.plan-card:not(.plan-enterprise)') : [card];
      group.forEach(function (c) {
        var b = c.querySelector('.vx-feat-toggle'), u = c.querySelector('.plan-features');
        if (!b || !u) return;
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
        b.querySelector('span').textContent = open ? L.hide : L.show;
        u.classList.toggle('vx-open', open);
      });
    });
  });
})();
