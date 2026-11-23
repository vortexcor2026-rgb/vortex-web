/* VORTEX floating WhatsApp button, with a message that depends on the page */
(function () {
  var NUM = '56977054699';
  var path = location.pathname;
  var en = /^\/(en|digital-marketing|talent-selection|people-management|apex-diagnostic)(\/|$)/.test(path);
  var MSG = {
    '/marketing-digital/': 'Hola, quiero saber más sobre sus servicios de marketing digital.',
    '/seleccion-de-talentos/': 'Hola, quiero saber más sobre sus servicios de selección y RRHH.',
    '/gestion-de-personas/': 'Hola, quiero saber más sobre sus servicios de gestión de personas.',
    '/diagnostico-apex/': 'Hola, quiero saber más sobre el Diagnóstico APEX.',
    '/digital-marketing/': 'Hi, I would like to know more about your digital marketing services.',
    '/talent-selection/': 'Hi, I would like to know more about your recruitment and HR services.',
    '/people-management/': 'Hi, I would like to know more about your people management services.',
    '/apex-diagnostic/': 'Hi, I would like to know more about the APEX Diagnostic.'
  };
  var msg = MSG[path] || (en ? 'Hi, I would like to know more about VORTEX.' : 'Hola, quiero saber más sobre VORTEX.');
  var label = en ? 'Chat on WhatsApp' : 'Escríbenos por WhatsApp';
  var a = document.createElement('a');
  a.className = 'vx-wa';
  a.href = 'https://wa.me/' + NUM + '?text=' + encodeURIComponent(msg);
  a.target = '_blank'; a.rel = 'noopener';
  a.setAttribute('aria-label', label);
  a.setAttribute('data-cta-location', 'whatsapp_float');
  a.innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16.04 3C9 3 3.3 8.7 3.3 15.73c0 2.25.6 4.45 1.72 6.38L3.2 28.8l6.85-1.8a12.7 12.7 0 0 0 5.98 1.52h.01c7.03 0 12.74-5.7 12.74-12.73C28.78 8.7 23.07 3 16.04 3zm0 23.26h-.01a10.6 10.6 0 0 1-5.39-1.48l-.39-.23-4.07 1.07 1.09-3.97-.25-.41a10.5 10.5 0 0 1-1.62-5.6c0-5.84 4.75-10.6 10.6-10.6a10.6 10.6 0 0 1 10.6 10.61c0 5.85-4.76 10.6-10.56 10.6zm5.81-7.94c-.32-.16-1.89-.93-2.18-1.04-.29-.1-.5-.16-.72.16-.21.32-.82 1.04-1 1.25-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.9-1.78-2.22-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.1-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66s1.14 3.08 1.3 3.3c.16.21 2.25 3.43 5.44 4.81.76.33 1.35.52 1.82.67.76.24 1.46.21 2.01.13.61-.09 1.89-.77 2.16-1.52.27-.75.27-1.39.19-1.52-.08-.13-.29-.21-.61-.37z"/></svg><span>' + label + '</span>';
  var st = document.createElement('style');
  st.textContent = '.vx-wa{position:fixed;right:20px;bottom:84px;z-index:9998;display:flex;align-items:center;gap:0;height:52px;padding:0 14px;border-radius:999px;background:#25D366;color:#fff;text-decoration:none;font:600 .875rem/1 Inter,system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.18);transition:transform .2s,box-shadow .2s,gap .25s}' +
    '.vx-wa svg{width:24px;height:24px;flex-shrink:0}' +
    '.vx-wa span{max-width:0;overflow:hidden;white-space:nowrap;transition:max-width .3s ease}' +
    '.vx-wa:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(0,0,0,.22);gap:.5rem}' +
    '.vx-wa:hover span{max-width:220px}' +
    '@media (max-width:640px){.vx-wa{right:14px;bottom:76px;height:50px;padding:0 13px}}' +
    '@media print{.vx-wa{display:none}}';
  document.head.appendChild(st);
  (document.body || document.documentElement).appendChild(a);
})();
