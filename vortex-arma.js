/*!
 * VORTEX "Arma tu plan" widget.
 * Usage: <div data-vx-arma data-line="all|marketing|rrhh"></div>
 * Requires vortex-catalog.js. Uses the page's existing #checkout-modal for payment.
 * The payment function recalculates the total server-side from item ids.
 */
(function () {
  'use strict';
  var C = window.VORTEX_CATALOG;
  if (!C) return;
  var CAR_TOKEN = 'i3d1a9b1b20dfcf2232829658b9f49f3fc336bfc';
  var CALENDLY = 'https://calendly.com/vortexcor/consulta';
  var cart = {};   // id -> qty
  var addons = {}; // id -> bool
  var widgets = [];

  function lang() {
    try { if (typeof LANG !== 'undefined' && (LANG === 'en' || LANG === 'es')) return LANG; } catch (e) {}
    return (document.documentElement.lang || 'es').slice(0, 2) === 'en' ? 'en' : 'es';
  }
  var TX = {
    es: { mkt: 'Marketing', rrhh: 'RRHH', sol: 'Soluciones', comp: 'Complementos', add: 'Agregar', added: 'Agregado', quote: 'Cotizar', from: 'desde',
      cart: 'Tu plan', empty: 'Agrega servicios para ver el resumen.', total: 'Total', pay: 'Pagar con Flow', rec: 'Recomendado', urgent: 'Urgente',
      save: function (p, price, diff) { return 'Con el ' + p + ' pagas ' + price + ' y obtienes esto y más. Ahorras ' + diff + '.'; },
      seePlan: 'Ver plan', note: 'Precios en pesos chilenos, IVA incluido si corresponde.', compSub: 'Para sumar a tu plan o resolver algo puntual.',
      solSub: { marketing: 'Lo que más nos piden las empresas que necesitan resultados ya.', rrhh: 'Para lo que no puede esperar en tu equipo.' } },
    en: { mkt: 'Marketing', rrhh: 'HR', sol: 'Solutions', comp: 'Add-ons', add: 'Add', added: 'Added', quote: 'Get a quote', from: 'from',
      cart: 'Your plan', empty: 'Add services to see your summary.', total: 'Total', pay: 'Request this plan', rec: 'Recommended', urgent: 'Urgent',
      save: function (p, price, diff) { return 'The ' + p + ' costs ' + price + ' and includes this and more. You save ' + diff + '.'; },
      seePlan: 'See plan', note: 'Book a short call and we send you a secure PayPal link for your selection.', compSub: 'To add to your plan or solve something specific.',
      solSub: { marketing: 'What companies ask us most when they need results now.', rrhh: 'For what can’t wait in your team.' } }
  };
  function tx() { return TX[lang()]; }
  function L(o) { return o ? (o[lang()] || o.es) : ''; }
  function money(clp, usd) {
    if (lang() === 'en') return '$' + Number(usd || 0).toLocaleString('en-US');
    return '$' + Number(clp).toLocaleString('es-CL');
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function visible(it) { return !(lang() === 'en' && it.esOnly); }
  function item(id) { return C.items.find(function (x) { return x.id === id; }); }

  // ---------- styles ----------
  function css() {
    if (document.getElementById('vxa-css')) return;
    var st = document.createElement('style'); st.id = 'vxa-css';
    st.textContent = [
      '.vxa{--vx-g:var(--accent,#5aab6e);--vx-g2:var(--accent-hi,#3d8c52);--vx-t:var(--text,#1a1f18);--vx-m:rgba(26,31,24,.6);--vx-b:rgba(0,0,0,.1);--vx-bg2:var(--bg2,#f7f8f5);font-family:inherit;color:var(--vx-t);text-align:left}',
      '.vxa-tabs{display:inline-flex;gap:.25rem;background:var(--vx-bg2);border:1px solid var(--vx-b);border-radius:999px;padding:.3rem;margin-bottom:1.75rem}',
      '.vxa-tab{border:none;background:none;font:inherit;font-weight:600;font-size:.95rem;padding:.6rem 1.4rem;border-radius:999px;cursor:pointer;color:var(--vx-m)}',
      '.vxa-tab.on{background:var(--vx-g);color:#fff}',
      '.vxa-body{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:2rem;align-items:start}',
      '.vxa-h{font-size:.75rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--vx-g2);margin:0 0 .25rem}',
      '.vxa-hsub{font-size:.95rem;color:var(--vx-m);margin:0 0 1rem}',
      '.vxa-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;margin-bottom:2.25rem}',
      '.vxa,.vxa *{text-align:left!important}','.vxa .vxa-fine{text-align:center!important}',
      '.vxa .arma-item.vxa-card{gap:0!important;display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;border:1px solid var(--vx-b);border-radius:14px;padding:1.1rem 1.15rem 1rem;background:#fff;transition:border-color .2s,box-shadow .2s;position:relative;margin:0}',
      '.vxa .arma-item.vxa-card.sel{border-color:var(--vx-g);box-shadow:0 0 0 1px var(--vx-g)}',
      '.vxa-q{font-size:.8rem;font-weight:600;color:var(--vx-g2);margin:0 0 .3rem}',
      '.vxa .arma-item-name{display:block!important;font-size:1.02rem;font-weight:700;line-height:1.3;margin:0 0 .25rem!important;color:var(--vx-t)}',
      '.vxa .arma-item-price{display:block;font-size:1rem;font-weight:700;color:var(--vx-t);margin:0 0 .5rem!important}',
      '.vxa-unit{font-size:.8rem;font-weight:400;color:var(--vx-m)}',
      '.vxa .arma-item-desc{font-size:.85rem;color:var(--vx-m);line-height:1.45;margin:0 0 .5rem!important}',
      '.vxa-inc{list-style:none;padding:0;margin:0 0 .6rem;font-size:.8rem;line-height:1.4}',
      '.vxa-inc li{padding-left:1rem;position:relative;margin-bottom:.15rem}',
      '.vxa-inc li:before{content:"";position:absolute;left:0;top:.55em;width:6px;height:6px;border-radius:50%;background:var(--vx-g)}',
      '.vxa-note{font-size:.75rem;color:var(--vx-g2);background:rgba(90,171,110,.08);border-radius:8px;padding:.5rem .65rem;margin:0 0 .75rem}',
      '.vxa-badge{align-self:flex-start;margin-bottom:.45rem;font-size:.68rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:.25rem .55rem;border-radius:999px;background:rgba(90,171,110,.12);color:var(--vx-g2)}',
      '.vxa-badge.urgent{background:#1a1f18;color:#fff}',
      '.vxa-ctl{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:.75rem}',
      '.vxa-btn{border:1.5px solid var(--vx-g);background:#fff;color:var(--vx-g2);font:inherit;font-weight:700;font-size:.85rem;padding:.55rem 1.1rem;border-radius:999px;cursor:pointer;text-decoration:none;display:inline-block}',
      '.vxa-btn.on{background:var(--vx-g);color:#fff}',
      '.vxa-step{display:inline-flex;align-items:center;border:1px solid var(--vx-b);border-radius:999px;overflow:hidden}',
      '.vxa .arma-qty-btn{border:none;background:#fff;width:34px;height:34px;font-size:1.1rem;cursor:pointer;color:var(--vx-t)}',
      '.vxa .arma-qty-btn:disabled{opacity:.35;cursor:default}',
      '.vxa .arma-qty-val{min-width:28px;text-align:center;font-weight:700;font-size:.9rem}',
      '.vxa-list{border-top:1px solid var(--vx-b)}',
      '.vxa .arma-item.vxa-row{display:grid!important;grid-template-columns:minmax(0,1fr) 170px 112px;align-items:center;gap:1.25rem;padding:1rem 0;border-bottom:1px solid var(--vx-b);margin:0}',
      '.vxa .vxa-row .vxa-rp{margin:0!important;text-align:right!important;white-space:nowrap}',
      '.vxa .vxa-rc{display:flex;justify-content:flex-end}',
      '@media (max-width:640px){.vxa .arma-item.vxa-row{grid-template-columns:minmax(0,1fr) auto;row-gap:.5rem}.vxa .vxa-row .vxa-rp{grid-column:1;grid-row:2;text-align:left!important}.vxa .vxa-rc{grid-column:2;grid-row:1 / span 2}}',
      '.vxa-row .vxa-rb{flex:1;min-width:0}',
      '.vxa-row .arma-item-name{font-size:1rem;margin-bottom:.15rem}',
      '.vxa-row .arma-item-desc{margin:0;font-size:.85rem}',
      '.vxa-row .arma-item-price{font-size:.95rem}',
      '.vxa-addon{margin-top:.5rem;font-size:.82rem;display:flex;gap:.45rem;align-items:center;cursor:pointer}',
      '.vxa-addon input{accent-color:var(--vx-g)}',
      '.vxa-cart{position:sticky;top:96px;border:1px solid var(--vx-b);border-radius:16px;padding:1.4rem;background:#fff;box-shadow:0 10px 30px rgba(0,0,0,.05)}',
      '.vxa-cart h3{font-size:1.05rem;margin:0 0 1rem}',
      '.vxa-line{display:flex;justify-content:space-between;gap:.75rem;font-size:.88rem;padding:.4rem 0;border-bottom:1px dashed var(--vx-b)}',
      '.vxa-line span:last-child{font-weight:700;white-space:nowrap}',
      '.vxa-empty{font-size:.88rem;color:var(--vx-m)}',
      '.vxa-save{margin:1rem 0 0;font-size:.84rem;line-height:1.45;background:#1a1f18;color:#fff;border-radius:10px;padding:.75rem .85rem}',
      '.vxa-save a{color:#9bd8aa;font-weight:700;text-decoration:none;white-space:nowrap}',
      '.vxa-tot{display:flex;justify-content:space-between;align-items:baseline;margin:1rem 0;font-weight:700}',
      '.vxa .arma-total-amount{font-size:1.5rem}',
      '.vxa .arma-pay-btn{width:100%;border:none;background:var(--vx-g);color:#fff;font:inherit;font-weight:700;font-size:1rem;padding:.9rem;border-radius:999px;cursor:pointer}',
      '.vxa .arma-pay-btn:disabled{opacity:.4;cursor:default}',
      '.vxa-fine{font-size:.75rem;color:var(--vx-m);text-align:center;margin:.6rem 0 0}',
      // Layout A: horizontal carousel
      '.vxa--carousel .vxa-grid{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:1rem;padding:2px 2px 1rem;scrollbar-width:thin}',
      '.vxa--carousel .vxa-grid > .arma-item{flex:0 0 285px;scroll-snap-align:start}',
      '.vxa-hrow{display:flex;align-items:flex-end;justify-content:space-between;gap:1rem}',
      '.vxa-arrows{display:none;gap:.4rem;margin-bottom:1rem}',
      '.vxa--carousel .vxa-arrows{display:flex}',
      '.vxa-arrow{width:38px;height:38px;border-radius:50%;border:1px solid var(--vx-b);background:#fff;cursor:pointer;font-size:1.1rem;color:var(--vx-t)}',
      // Layout B: compact 3-column grid
      '.vxa--grid .vxa-grid{grid-template-columns:repeat(3,minmax(0,1fr))}',
      '@media (max-width:1180px){.vxa--grid .vxa-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}',
      '@media (max-width:960px){.vxa-body{grid-template-columns:minmax(0,1fr)}.vxa-cart{position:static}.vxa,.vxa-body>div{min-width:0;max-width:100%}}','@media (max-width:640px){.vxa--carousel .vxa-grid > .arma-item{flex-basis:82%}}',
      '@media (max-width:640px){.vxa-grid{grid-template-columns:1fr}.vxa-tab{padding:.55rem 1rem}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  // ---------- render ----------
  function control(it) {
    var q = cart[it.id] || 0, t = tx();
    if (it.type === 'quote') return '<a class="vxa-btn" href="' + CALENDLY + '" target="_blank" rel="noopener">' + t.quote + '</a>';
    if (it.type === 'once') {
      return '<span class="arma-qty-val" style="display:none">' + q + '</span><button type="button" class="vxa-btn' + (q ? ' on' : '') + '" data-vx-id="' + it.id + '" data-vx-action="' + (q ? 'remove' : 'add') + '">' + (q ? t.added + ' ✓' : t.add) + '</button>';
    }
    return '<div class="vxa-step"><button type="button" class="arma-qty-btn" data-vx-id="' + it.id + '" data-vx-action="remove" aria-label="-" ' + (q ? '' : 'disabled') + '>−</button>' +
      '<span class="arma-qty-val">' + (q || 0) + '</span>' +
      '<button type="button" class="arma-qty-btn" data-vx-id="' + it.id + '" data-vx-action="add" aria-label="+" ' + (q >= (it.max || 20) ? 'disabled' : '') + '>+</button></div>';
  }
  function priceHtml(it) {
    if (it.type === 'quote') return tx().from + ' ' + money(it.priceFrom, it.usdFrom);
    return money(it.price, it.usd) + (it.unit ? ' <span class="vxa-unit">/ ' + esc(L(it.unit)) + '</span>' : '');
  }
  function addonHtml(it) {
    if (!it.addon || !(cart[it.id] > 0) || (lang() === 'en' && it.addon.esOnly)) return '';
    return '<label class="vxa-addon"><input type="checkbox" data-vx-addon="' + it.id + '" ' + (addons[it.id] ? 'checked' : '') + '> + ' +
      esc(L(it.addon.name)) + ' (' + money(it.addon.price, it.addon.usd) + ' / ' + esc(L(it.unit)) + ')</label>';
  }
  function card(it) {
    var t = tx(), q = cart[it.id] || 0;
    var inc = L(it.inc) && L(it.inc).length ? '<ul class="vxa-inc">' + L(it.inc).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '';
    return '<div class="arma-item vxa-card' + (q ? ' sel' : '') + '" role="listitem">' +
      (it.badge ? '<span class="vxa-badge ' + it.badge + '">' + (it.badge === 'urgent' ? t.urgent : t.rec) + '</span>' : '') +
      (L(it.q) ? '<div class="vxa-q">' + esc(L(it.q)) + '</div>' : '') +
      '<span class="arma-item-name">' + esc(L(it.name)) + '</span>' +
      '<span class="arma-item-price">' + priceHtml(it) + '</span>' +
      '<p class="arma-item-desc">' + esc(L(it.desc)) + '</p>' + inc +
      (L(it.note) ? '<p class="vxa-note">' + esc(L(it.note)) + '</p>' : '') +
      '<div class="vxa-ctl">' + control(it) + '</div>' + addonHtml(it) + '</div>';
  }
  function row(it) {
    return '<div class="arma-item vxa-row" role="listitem"><div class="vxa-rb">' +
      '<span class="arma-item-name">' + esc(L(it.name)) + '</span>' +
      '<p class="arma-item-desc">' + esc(L(it.desc)) + '</p>' + addonHtml(it) + '</div>' +
      '<span class="arma-item-price vxa-rp">' + priceHtml(it) + '</span><div class="vxa-rc">' + control(it) + '</div></div>';
  }
  function cartLines() {
    return C.items.filter(function (it) { return cart[it.id] > 0 && visible(it); });
  }
  function totals() {
    var clp = 0, usd = 0;
    cartLines().forEach(function (it) {
      var q = cart[it.id];
      clp += it.price * q; usd += (it.usd || 0) * q;
      if (addons[it.id] && it.addon) { clp += it.addon.price * q; usd += (it.addon.usd || 0) * q; }
    });
    return { clp: clp, usd: usd };
  }
  function planAnchor() {
    var pc = document.querySelector('.plan-card');
    var sec = pc && pc.closest('section[id]');
    return sec ? '#' + sec.id : '/#servicios';
  }
  function savingsHint() {
    var t = tx(), en = lang() === 'en', best = null;
    C.plans.forEach(function (p) {
      var ids = cartLines().filter(function (it) { return p.covers.indexOf(it.id) > -1; });
      if (ids.length < 2) return;
      var sub = ids.reduce(function (s, it) { return s + (en ? it.usd : it.price) * cart[it.id]; }, 0);
      var pp = en ? p.usd : p.price;
      if (sub > pp && (!best || sub - pp > best.diff)) best = { p: p, diff: sub - pp, pp: pp };
    });
    if (!best) return '';
    var price = (en ? '$' + best.pp.toLocaleString('en-US') : '$' + best.pp.toLocaleString('es-CL')) + (best.p.monthly ? (en ? '/month' : '/mes') : '');
    var diff = en ? '$' + best.diff.toLocaleString('en-US') : '$' + best.diff.toLocaleString('es-CL');
    return '<div class="vxa-save">' + t.save(L(best.p.name), price, diff) + ' <a href="' + planAnchor() + '">' + t.seePlan + ' →</a></div>';
  }
  function cartHtml() {
    var t = tx(), lines = cartLines(), tot = totals();
    var body = lines.length ? lines.map(function (it) {
      var q = cart[it.id], clp = it.price * q, usd = (it.usd || 0) * q;
      if (addons[it.id] && it.addon) { clp += it.addon.price * q; usd += (it.addon.usd || 0) * q; }
      return '<div class="vxa-line"><span>' + esc(L(it.name)) + (it.type === 'qty' ? ' × ' + q : '') +
        (addons[it.id] && it.addon ? ' + ' + esc(L(it.addon.name)) : '') + '</span><span>' + money(clp, usd) + '</span></div>';
    }).join('') : '<div class="vxa-empty">' + t.empty + '</div>';
    return '<h3>' + t.cart + '</h3>' + body + savingsHint() +
      '<div class="vxa-tot"><span>' + t.total + '</span><span class="arma-total-amount">' + money(tot.clp, tot.usd) + '</span></div>' +
      '<button type="button" class="arma-pay-btn" ' + (lines.length ? '' : 'disabled') + '>' + t.pay + '</button>' +
      '<p class="vxa-fine">' + t.note + '</p>';
  }
  function section(line, sec) {
    var items = C.items.filter(function (it) { return it.line === line && it.sec === sec && visible(it); });
    if (!items.length) return '';
    var t = tx();
    var arrows = sec === 'sol' ? '<div class="vxa-arrows"><button type="button" class="vxa-arrow" data-vx-scroll="-1" aria-label="prev">←</button><button type="button" class="vxa-arrow" data-vx-scroll="1" aria-label="next">→</button></div>' : '';
    var head = '<div class="vxa-hrow"><div><p class="vxa-h">' + (sec === 'sol' ? t.sol : t.comp) + '</p><p class="vxa-hsub">' + (sec === 'sol' ? t.solSub[line] : t.compSub) + '</p></div>' + arrows + '</div>';
    return sec === 'sol' ? head + '<div class="vxa-grid" role="list">' + items.map(card).join('') + '</div>'
                         : head + '<div class="vxa-list" role="list">' + items.map(row).join('') + '</div>';
  }
  function render(w) {
    var t = tx(), line = w.el.getAttribute('data-line') || 'all';
    var active = line === 'all' ? (w.tab || 'marketing') : line;
    var tabs = line === 'all' ? '<div class="vxa-tabs" role="tablist">' +
      ['marketing', 'rrhh'].map(function (k) { return '<button type="button" role="tab" class="vxa-tab tab-btn' + (k === active ? ' on' : '') + '" data-vx-tab="' + k + '">' + (k === 'marketing' ? t.mkt : t.rrhh) + '</button>'; }).join('') + '</div>' : '';
    var layout = w.el.getAttribute('data-layout') || 'carousel';
    w.el.innerHTML = '<div class="vxa vxa--' + layout + '">' + tabs + '<div class="vxa-body"><div>' + section(active, 'sol') + section(active, 'comp') + '</div>' +
      '<aside class="vxa-cart arma-total-card" aria-live="polite">' + cartHtml() + '</aside></div></div>';
  }
  function renderAll() {
    widgets.forEach(function (w) {
      var g = w.el.querySelector('.vxa-grid'), x = g ? g.scrollLeft : 0;
      render(w);
      var g2 = w.el.querySelector('.vxa-grid'); if (g2) g2.scrollLeft = x;
    });
  }

  // ---------- events ----------
  function onClick(e) {
    var w = widgets.find(function (x) { return x.el.contains(e.target); });
    if (!w) return;
    var sc = e.target.closest('[data-vx-scroll]');
    if (sc) { var g = w.el.querySelector('.vxa-grid'); if (g) g.scrollBy({ left: Number(sc.getAttribute('data-vx-scroll')) * 600, behavior: 'smooth' }); return; }
    var tab = e.target.closest('[data-vx-tab]');
    if (tab) { w.tab = tab.getAttribute('data-vx-tab'); render(w); return; }
    var b = e.target.closest('[data-vx-id]');
    if (b) {
      var it = item(b.getAttribute('data-vx-id')), q = cart[it.id] || 0;
      var max = it.type === 'once' ? 1 : (it.max || 20);
      cart[it.id] = Math.max(0, Math.min(max, q + (b.getAttribute('data-vx-action') === 'add' ? 1 : -1)));
      if (!cart[it.id]) addons[it.id] = false;
      // let tracking (capture-phase listener) read the DOM before re-render
      setTimeout(renderAll, 0);
      return;
    }
    if (e.target.closest('.arma-pay-btn')) pay();
  }
  function onChange(e) {
    var a = e.target.getAttribute && e.target.getAttribute('data-vx-addon');
    if (a) { addons[a] = e.target.checked; renderAll(); }
  }
  function pay() {
    var lines = cartLines();
    if (!lines.length) return;
    if (lang() === 'en') {
      // English site: no Flow (CLP). Book a call; we invoice the selection by PayPal.
      var tot0 = totals();
      var summary = lines.map(function (it) { return L(it.name) + (it.type === 'qty' ? ' x' + cart[it.id] : ''); }).join(', ') + ' | Total USD ' + tot0.usd.toLocaleString('en-US');
      window.open(CALENDLY + '?a1=' + encodeURIComponent('Requested plan: ' + summary), '_blank', 'noopener');
      return;
    }
    var tot = totals();
    window._armaItems = lines.map(function (it) {
      return { id: it.id, qty: cart[it.id], addon: !!(addons[it.id] && it.addon), name: L(it.name), price: it.price };
    });
    window._armaTotal = tot.clp;
    var modal = document.getElementById('checkout-modal');
    if (!modal) return;
    modal.dataset.token = CAR_TOKEN;
    modal.dataset.amount = tot.clp;
    ['checkout-name', 'checkout-email'].forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
    var err = document.getElementById('checkout-error'); if (err) err.textContent = '';
    modal.style.display = 'flex';
    var n = document.getElementById('checkout-name'); if (n) n.focus();
  }

  function init() {
    css();
    document.querySelectorAll('[data-vx-arma]').forEach(function (el) { widgets.push({ el: el, tab: null }); });
    if (!widgets.length) return;
    document.addEventListener('click', onClick);
    document.addEventListener('change', onChange);
    renderAll();
  }
  window.VXArma = { render: renderAll, cart: function () { return { items: window._armaItems, cart: cart }; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
