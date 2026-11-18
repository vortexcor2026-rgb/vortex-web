// PayPal checkout for the English site (USD).
// POST /.netlify/functions/paypal/create  { kind: 'plan', plan } | { kind: 'cart', items: [{ id, qty }] }
//   -> creates a PayPal order with the amount calculated here (never trusted from the browser)
//   -> returns { url } (PayPal approval page)
// GET  /.netlify/functions/paypal/return?token=ORDER_ID  (PayPal sends the buyer back here)
//   -> captures the payment, emails the business, redirects to /en/?pago=ok or /en/?pago=error
// Needs Netlify env vars: PAYPAL_CLIENT_ID, PAYPAL_SECRET (Live app from developer.paypal.com)
const https = require('https');
const CATALOG = require('../../vortex-catalog.js');

const SITE_URL = 'https://vortexcor.com';
const API_HOST = process.env.PAYPAL_ENV === 'sandbox' ? 'api-m.sandbox.paypal.com' : 'api-m.paypal.com';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const BUSINESS_EMAIL = 'vortexcor2026@gmail.com';

function request(method, host, path, headers, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({ method, host, path, headers }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        let json = null;
        try { json = d ? JSON.parse(d) : null; } catch (e) { /* keep raw */ }
        resolve({ status: res.statusCode, json, raw: d });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function accessToken() {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64');
  const r = await request('POST', API_HOST, '/v1/oauth2/token',
    { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' }, 'grant_type=client_credentials');
  if (r.status !== 200 || !r.json || !r.json.access_token) throw new Error('PayPal auth failed: ' + r.status);
  return r.json.access_token;
}

function money(n) { return Number(n).toFixed(2); }

function buildOrder(body) {
  let lines, description, code;
  if (body.kind === 'plan') {
    const p = CATALOG.enPlans[body.plan];
    if (!p) throw new Error('bad plan');
    lines = [{ id: body.plan, name: p.name, qty: 1, price: p.usd }];
    description = p.name;
    code = 'PLAN-' + body.plan;
  } else {
    const priced = CATALOG.priceCartUSD(body.items);
    lines = priced.lines;
    description = 'Build your plan';
    code = 'CART';
  }
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
  return {
    intent: 'CAPTURE',
    purchase_units: [{
      reference_id: code,
      custom_id: lines.map((l) => `${l.id}:${l.qty}`).join('|').slice(0, 127),
      description: `VORTEX Consultoría | ${description}`.slice(0, 127),
      amount: {
        currency_code: 'USD',
        value: money(total),
        breakdown: { item_total: { currency_code: 'USD', value: money(total) } }
      },
      items: lines.map((l) => ({
        name: l.name.slice(0, 127), quantity: String(l.qty), category: 'DIGITAL_GOODS',
        unit_amount: { currency_code: 'USD', value: money(l.price) }
      }))
    }],
    payment_source: {
      paypal: {
        experience_context: {
          brand_name: 'VORTEX Consultoría',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
          return_url: `${SITE_URL}/.netlify/functions/paypal/return`,
          cancel_url: `${SITE_URL}/en/`
        }
      }
    }
  };
}

async function notify(order) {
  if (!RESEND_API_KEY) return;
  const pu = (order.purchase_units || [])[0] || {};
  const cap = (((pu.payments || {}).captures) || [])[0] || {};
  const payer = order.payer || {};
  const name = [((payer.name || {}).given_name || ''), ((payer.name || {}).surname || '')].join(' ').trim();
  const html = `<h2>New PayPal payment (English site)</h2>
    <p><b>Amount:</b> USD ${cap.amount ? cap.amount.value : ''}</p>
    <p><b>Order:</b> ${order.id} | <b>Capture:</b> ${cap.id || ''}</p>
    <p><b>Customer:</b> ${name} (${payer.email_address || ''})</p>
    <p><b>Detail:</b> ${(pu.description || '')} | ${(pu.custom_id || '')}</p>`;
  const body = JSON.stringify({ from: 'VORTEX Consultoría <notificaciones@vortexcor.com>', to: [BUSINESS_EMAIL], subject: `PayPal payment USD ${cap.amount ? cap.amount.value : ''}`, html });
  try {
    await request('POST', 'api.resend.com', '/emails', { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }, body);
  } catch (e) { console.error('resend error', e); }
}

exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  const configured = !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_SECRET);

  if (event.httpMethod === 'POST' && event.path.endsWith('/create')) {
    if (!configured) return { statusCode: 503, headers, body: JSON.stringify({ error: 'PayPal not configured' }) };
    let order;
    try { order = buildOrder(JSON.parse(event.body || '{}')); }
    catch (e) { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid selection. Please reload the page and try again.' }) }; }
    try {
      const token = await accessToken();
      const body = JSON.stringify(order);
      const r = await request('POST', API_HOST, '/v2/checkout/orders',
        { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }, body);
      const link = r.json && (r.json.links || []).find((l) => l.rel === 'payer-action' || l.rel === 'approve');
      if (!link) { console.error('paypal create', r.status, r.raw); throw new Error('no approval link'); }
      return { statusCode: 200, headers, body: JSON.stringify({ url: link.href }) };
    } catch (e) {
      console.error(e);
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Could not connect to PayPal. Please try again.' }) };
    }
  }

  if (event.path.endsWith('/return')) {
    const orderId = (event.queryStringParameters || {}).token;
    let dest = '/en/?pago=error';
    if (orderId && configured) {
      try {
        const token = await accessToken();
        const r = await request('POST', API_HOST, `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
          { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Content-Length': 0 }, '');
        if (r.json && r.json.status === 'COMPLETED') { dest = '/en/?pago=ok'; await notify(r.json); }
        else console.error('paypal capture', r.status, r.raw);
      } catch (e) { console.error(e); }
    }
    return { statusCode: 303, headers: { Location: SITE_URL + dest, 'Cache-Control': 'no-store' }, body: '' };
  }

  return { statusCode: 200, headers, body: JSON.stringify({ ok: true, configured }) };
};
