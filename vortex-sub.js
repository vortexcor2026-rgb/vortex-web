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
