/*!
 * VORTEX event tracking (vortexcor.com)
 * Pushes standardized events to window.dataLayer for GTM -> GA4, Google Ads, Meta.
 * Install: <script src="/vortex-tracking.js" defer></script> on every page, after the GTM snippet.
 * Events use GA4 recommended names so they map cleanly to Google Ads and Meta.
 */
(function () {
  'use strict';
  var w = window, d = document;
  w.dataLayer = w.dataLayer || [];

  // ---------- helpers ----------
  var LS = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var SS = {
    get: function (k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  function txt(el) { return el ? (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
  function parsePrice(s) {
    var m = (s || '').match(/\$\s?([\d.,]+)/);
    return m ? parseInt(m[1].replace(/[.,]/g, ''), 10) || 0 : 0;
  }
  var path = location.pathname.replace(/\/+$/, '/') || '/';
  var lang = (d.documentElement.lang || 'es').slice(0, 2);
  var CURRENCY = 'CLP';

  function pageService() {
    if (/marketing-digital|digital-marketing/.test(path)) return 'marketing';
    if (/seleccion-de-talentos|talent-selection|gestion-de-personas|people-management/.test(path)) return 'rrhh';
    if (/diagnostico-apex|apex-diagnostic/.test(path)) return 'apex';
    return null;
  }
  function serviceFromName(name) {
    var n = (name || '').toLowerCase();
    if (/apex|score|diagn/.test(n)) return 'apex';
    if (/inicio|mantenci|maintenance|pro\b|starter|web|ads|contenido|content|redes|social/.test(n)) return 'marketing';
    if (/contrataci|hiring|evaluaci|assessment|desvincul|offboarding|outplacement|candidat|linkedin|perfil|entrevista|interview|psicolab|referencia/.test(n)) return 'rrhh';
    return null;
  }
  function sectionOf(el) {
    var s = el.closest('section[id],header[id],footer,nav,[id^="modal"],[class*="modal"]');
    if (!s) return 'body';
    if (s.tagName === 'FOOTER') return 'footer';
    if (s.tagName === 'NAV' || s.closest('nav')) return 'nav';
    return s.id || 'modal';
  }
  function serviceOf(el, fallbackName) {
    var sec = sectionOf(el);
    return pageService() || (sec === 'apex' ? 'apex' : null) || serviceFromName(fallbackName) ||
      serviceFromName(txt(el.closest('[class*="tab-panel"],[class*="panel"]'))) || 'general';
  }

  // ---------- attribution (organic vs paid) ----------
  function classify(p, ref) {
    var med = (p.utm_medium || '').toLowerCase(), src = (p.utm_source || '').toLowerCase();
    if (p.gclid || p.gbraid || p.wbraid || /^(cpc|ppc|paid|paid_search|sem)$/.test(med)) return 'paid_search';
    if (/^(paid_social|paidsocial|social_paid|cpm|display|retargeting)$/.test(med) || (p.fbclid && /paid|cpc|cpm/.test(med))) return 'paid_social';
    if (med === 'email' || src === 'email') return 'email';
    if (/^(social|organic_social)$/.test(med) || p.fbclid) return 'organic_social';
    if (med) return med;
    if (!ref) return 'direct';
    var h = ''; try { h = new URL(ref).hostname; } catch (e) {}
    if (h === location.hostname) return null; // internal navigation, keep previous
    if (/google\.|bing\.|duckduckgo\.|yahoo\.|ecosia\.|brave\./.test(h)) return 'organic_search';
    if (/instagram\.|facebook\.|fb\.|linkedin\.|lnkd\.in|t\.co|twitter\.|x\.com|tiktok\.|whatsapp\.|wa\.me/.test(h)) return 'organic_social';
    return 'referral';
  }
  function readAttribution() {
    var q = new URLSearchParams(location.search), p = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'gbraid', 'wbraid', 'fbclid'].forEach(function (k) {
      var v = q.get(k); if (v) p[k] = v.slice(0, 150);
    });
    var type = classify(p, d.referrer);
    var now = Date.now(), TTL = 90 * 864e5;
    var first = LS.get('vx_first_touch');
    var last = LS.get('vx_last_touch');
    if (type) {
      var refHost = ''; try { refHost = d.referrer ? new URL(d.referrer).hostname : ''; } catch (e) {}
      var touch = {
        traffic_type: type,
        source: p.utm_source || (p.gclid || p.gbraid || p.wbraid ? 'google' : '') || refHost || '(direct)',
        medium: p.utm_medium || (type === 'paid_search' ? 'cpc' : type === 'organic_search' ? 'organic' : type === 'direct' ? '(none)' : type),
        campaign: p.utm_campaign || '',
        content: p.utm_content || '',
        term: p.utm_term || '',
        landing_page: path,
        ts: now
      };
      if (!first || now - first.ts > TTL) { first = touch; LS.set('vx_first_touch', first); }
      // direct visits never overwrite a known channel (last non-direct click)
      if (type !== 'direct' || !last || now - last.ts > TTL) { last = touch; LS.set('vx_last_touch', last); }
    }
    return { first: first || {}, last: last || {} };
  }
  var attr = readAttribution();

  function base(el) {
    return {
      page_language: lang,
      page_type: pageService() ? 'service_page' : (path === '/' || path === '/en/' ? 'home' : 'other'),
      traffic_type: attr.last.traffic_type || 'direct',
      first_traffic_type: attr.first.traffic_type || 'direct',
      campaign: attr.last.campaign || '',
      cta_location: el ? sectionOf(el) : undefined
    };
  }
  function push(event, params, ecommerce) {
    var o = Object.assign({ event: event }, params);
    if (ecommerce) { w.dataLayer.push({ ecommerce: null }); o.ecommerce = ecommerce; }
    w.dataLayer.push(o);
  }
  w.vxTrack = push; // manual use: vxTrack('event_name', {...})

  // Attribution context for every tag in GTM
  w.dataLayer.push({
    event: 'vx_context',
    traffic_type: attr.last.traffic_type || 'direct',
    first_traffic_type: attr.first.traffic_type || 'direct',
    page_language: lang
  });

  // ---------- Calendly links carry the original source ----------
  function decorateCalendly() {
    d.querySelectorAll('a[href*="calendly.com"]').forEach(function (a) {
      try {
        var u = new URL(a.href);
        u.searchParams.set('utm_source', attr.last.source || '(direct)');
        u.searchParams.set('utm_medium', attr.last.medium || '(none)');
        u.searchParams.set('utm_campaign', attr.last.campaign || 'vortexcor-web');
        u.searchParams.set('utm_content', sectionOf(a) + '_' + lang);
        if (attr.last.term) u.searchParams.set('utm_term', attr.last.term);
        a.href = u.toString();
      } catch (e) {}
    });
  }

  // ---------- item builders ----------
  function itemFromCard(btn) {
    var card = btn.closest('.plan-card, .rrhh-item-card');
    if (!card) return null;
    var name = txt(card.querySelector('.plan-name, .rrhh-item-name')) || txt(btn);
    var priceEl = card.querySelector('.price-num, .rrhh-item-price');
    var price = parsePrice(txt(priceEl));
    return {
      item_id: name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      item_name: name,
      item_category: serviceOf(btn, name),
      item_variant: /mes|month/i.test(txt(card.querySelector('.price-unit'))) ? 'subscription' : 'one_time',
      price: price,
      quantity: 1
    };
  }
  function itemsFromArma() {
    var items = [];
    d.querySelectorAll('.arma-item').forEach(function (it) {
      var q = parseInt(txt(it.querySelector('.arma-qty-val')), 10) || 0;
      if (!q) return;
      var name = txt(it.querySelector('.arma-item-name'));
      items.push({ item_id: 'arma-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), item_name: name,
        item_category: serviceFromName(name) || 'custom', item_list_name: 'arma_tu_plan',
        price: parsePrice(txt(it.querySelector('.arma-item-price'))), quantity: q });
    });
    return items;
  }
  function sum(items) { return items.reduce(function (s, i) { return s + i.price * i.quantity; }, 0); }

  // ---------- click tracking (delegated, capture phase so it fires before navigation) ----------
  d.addEventListener('click', function (e) {
    var el = e.target.closest('a, button');
    if (!el) return;
    var href = el.getAttribute('href') || '';
    var label = txt(el).slice(0, 80);
    var p = base(el);

    // 1. Meeting intent (Calendly)
    if (/calendly\.com/.test(href)) {
      var cardItem = itemFromCard(el);
      return push('generate_lead', Object.assign(p, {
        lead_type: 'meeting_click', cta_text: label,
        service_line: serviceOf(el, cardItem && cardItem.item_name),
        plan_name: cardItem ? cardItem.item_name : undefined,
        cta_style: (el.className || '').split(' ')[0] || 'link'
      }));
    }

    // 2. Checkout start: plan cards, RRHH items, "Arma tu plan"
    if (el.matches('.plan-cta, .rrhh-item-btn, .arma-pay-btn') || /flow\.cl/.test(href)) {
      var items = el.matches('.arma-pay-btn') ? itemsFromArma() : [itemFromCard(el)].filter(Boolean);
      if (!items.length) return;
      var value = el.matches('.arma-pay-btn') ? (parsePrice(txt(d.querySelector('.arma-total-amount'))) || sum(items)) : sum(items);
      var eco = { currency: CURRENCY, value: value, items: items };
      var store = { ecommerce: eco, service_line: items[0].item_category, ts: Date.now() };
      SS.set('vx_checkout', store); LS.set('vx_checkout', store);
      return push('begin_checkout', Object.assign(p, {
        service_line: items[0].item_category, checkout_source: el.matches('.arma-pay-btn') ? 'arma_tu_plan' : 'plan_card'
      }), eco);
    }

    // 3. "Arma tu plan" quantity changes
    if (el.matches('.arma-qty-btn, [data-vx-action]')) {
      var it = el.closest('.arma-item');
      if (!it) return;
      var nm = txt(it.querySelector('.arma-item-name'));
      var pr = parsePrice(txt(it.querySelector('.arma-item-price')));
      var add = el.dataset.vxAction ? el.dataset.vxAction === 'add' : /\+/.test(label);
      return push(add ? 'add_to_cart' : 'remove_from_cart', p,
        { currency: CURRENCY, value: pr, items: [{ item_name: nm, item_category: serviceFromName(nm) || 'custom', item_list_name: 'arma_tu_plan', price: pr, quantity: 1 }] });
    }

    // 4. Service tabs (Marketing / RRHH / APEX)
    if (el.matches('.tab-btn')) {
      return push('select_content', Object.assign(p, { content_type: 'service_tab', content_id: label.toLowerCase(), service_line: serviceFromName(label) || label.toLowerCase() }));
    }

    // 5. FAQ
    if (el.matches('.faq-q')) {
      return push('faq_open', Object.assign(p, { faq_question: label }));
    }

    // 6. Language switch
    if (/^(ES|EN)$/.test(label)) {
      return push('language_switch', Object.assign(p, { language_to: label.toLowerCase() }));
    }

    // 7. Internal service-page links ("Conocer más", nav)
    if (/^\/(marketing-digital|digital-marketing|seleccion-de-talentos|talent-selection|gestion-de-personas|people-management|diagnostico-apex|apex-diagnostic)\//.test(href.replace(location.origin, ''))) {
      return push('select_item', Object.assign(p, { item_list_name: p.cta_location, service_line: serviceFromName(href) || (/apex/.test(href) ? 'apex' : /talent|talento|personas|people/.test(href) ? 'rrhh' : 'marketing'), cta_text: label }));
    }

    // 8. Social profiles and outbound links
    var host = ''; try { host = new URL(el.href).hostname; } catch (err) {}
    if (host && host !== location.hostname) {
      var social = (host.match(/linkedin|instagram|facebook|tiktok|youtube|wa\.me|whatsapp/) || [])[0];
      if (social) return push('social_click', Object.assign(p, { social_network: social.replace('wa.me', 'whatsapp'), cta_text: label }));
      return push('outbound_click', Object.assign(p, { link_domain: host, cta_text: label }));
    }
  }, true);

  // ---------- section views (scroll engagement on key sections) ----------
  function observeSections() {
    if (!('IntersectionObserver' in w)) return;
    var seen = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !seen[en.target.id]) {
          seen[en.target.id] = 1;
          push('section_view', Object.assign(base(), { section_id: en.target.id }));
        }
      });
    }, { threshold: 0.5 });
    ['como', 'servicios', 'arma', 'apex', 'about', 'faq'].forEach(function (id) {
      var s = d.getElementById(id); if (s) io.observe(s);
    });
  }

  // ---------- page-level events ----------
  function pageEvents() {
    var svc = pageService();
    if (svc) {
      push('view_item', Object.assign(base(), { service_line: svc }),
        { currency: CURRENCY, value: 0, items: [{ item_id: 'service-' + svc, item_name: d.title.split('|')[0].trim(), item_category: svc }] });
    }
    // Payment confirmed (Flow return page)
    // Flow returns buyers to /?pago=ok (urlReturn in create-payment.js); /gracias kept as fallback
    if (/^\/(en\/)?(gracias|thank-you)/.test(path) || new URLSearchParams(location.search).get('pago') === 'ok') {
      var c = SS.get('vx_checkout') || LS.get('vx_checkout');
      var q = new URLSearchParams(location.search);
      var tid = q.get('token') || q.get('order') || q.get('commerceOrder') || ('vx-' + Date.now());
      var done = LS.get('vx_purchases') || [];
      if (c && done.indexOf(tid) === -1 && Date.now() - c.ts < 864e5) {
        push('purchase', Object.assign(base(), { service_line: c.service_line }),
          Object.assign({ transaction_id: tid }, c.ecommerce));
        done.push(tid); LS.set('vx_purchases', done.slice(-20));
        try { localStorage.removeItem('vx_checkout'); sessionStorage.removeItem('vx_checkout'); } catch (e) {}
      }
    }
    if (/^\/(en\/)?(pago-fallido|payment-failed)/.test(path)) {
      var cf = SS.get('vx_checkout') || LS.get('vx_checkout');
      push('payment_failed', Object.assign(base(), { service_line: cf ? cf.service_line : 'unknown', value: cf ? cf.ecommerce.value : 0 }));
    }
    // Meeting booked (Calendly redirect page)
    if (/^\/(en\/)?(reunion-agendada|meeting-booked)/.test(path)) {
      var q2 = new URLSearchParams(location.search);
      var key = q2.get('invitee_uuid') || q2.get('event_start_time') || String(Date.now());
      var booked = LS.get('vx_bookings') || [];
      if (booked.indexOf(key) === -1) {
        push('schedule_meeting', Object.assign(base(), {
          lead_type: 'meeting_booked',
          meeting_type: (q2.get('event_type_name') || '').slice(0, 80),
          service_line: serviceFromName(q2.get('event_type_name') || '') || 'general'
        }));
        booked.push(key); LS.set('vx_bookings', booked.slice(-20));
      }
    }
  }

  // Calendly inline/popup embeds (if ever used) report bookings via postMessage
  w.addEventListener('message', function (e) {
    if (e.origin.indexOf('calendly.com') === -1 || !e.data || !e.data.event) return;
    if (e.data.event === 'calendly.event_scheduled') push('schedule_meeting', Object.assign(base(), { lead_type: 'meeting_booked', meeting_type: 'embed' }));
  });

  // Checkout form submitted (name + email entered, buyer sent to Flow). No personal data is pushed.
  d.addEventListener('submit', function (e) {
    if (!e.target || e.target.id !== 'checkout-form') return;
    var c = SS.get('vx_checkout') || LS.get('vx_checkout');
    push('add_payment_info', Object.assign(base(e.target), { payment_type: 'flow', service_line: c ? c.service_line : 'unknown' }),
      c ? c.ecommerce : undefined);
  }, true);

  function init() { decorateCalendly(); observeSections(); pageEvents(); }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init); else init();
})();
