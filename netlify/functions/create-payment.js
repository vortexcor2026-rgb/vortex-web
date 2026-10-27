const https = require('https');
const crypto = require('crypto');

const FLOW_API_KEY = process.env.FLOW_API_KEY;
const FLOW_SECRET_KEY = process.env.FLOW_SECRET_KEY;
const FLOW_API_URL = 'https://www.flow.cl/api';
const SITE_URL = 'https://vortexcor.com';

const ZAPIER_WEBHOOKS = {
  'sf91127fd124de7e6421f45317cc66f302b6dc53': process.env.ZAPIER_PACK_INICIO,
  't3c9404b5d417e43e5ff7dc5cb7ae340069795be': process.env.ZAPIER_PACK_MANTENCION,
  'v4fc43f48cb0fa1d5fd75929c8d5b8c86eb5848f': process.env.ZAPIER_PLAN_PRO,
  'o1a8ee03c1da73ce7273992af333cb7fb9b05356': process.env.ZAPIER_PACK_CONTRATACION,
  'na811dc9c556b4b25d7f9692dfef8857f2ef2e6c': process.env.ZAPIER_PACK_DESVINCULACION,
};

const PLAN_NAMES = {
  'sf91127fd124de7e6421f45317cc66f302b6dc53': 'Pack Inicio',
  't3c9404b5d417e43e5ff7dc5cb7ae340069795be': 'Pack Mantención Mensual',
  'v4fc43f48cb0fa1d5fd75929c8d5b8c86eb5848f': 'Plan Pro',
  'o1a8ee03c1da73ce7273992af333cb7fb9b05356': 'Pack Contratación',
  'na811dc9c556b4b25d7f9692dfef8857f2ef2e6c': 'Pack Desvinculación',
};

const PLAN_AMOUNTS = {
  'sf91127fd124de7e6421f45317cc66f302b6dc53': 790000,
  't3c9404b5d417e43e5ff7dc5cb7ae340069795be': 390000,
  'v4fc43f48cb0fa1d5fd75929c8d5b8c86eb5848f': 590000,
  'o1a8ee03c1da73ce7273992af333cb7fb9b05356': 490000,
  'na811dc9c556b4b25d7f9692dfef8857f2ef2e6c': 290000,
};

function signParams(params) {
  const keys = Object.keys(params).sort();
  let toSign = '';
  keys.forEach(k => { toSign += k + params[k]; });
  return crypto.createHmac('sha256', FLOW_SECRET_KEY).update(toSign).digest('hex');
}

function postToFlow(path, params) {
  params.apiKey = FLOW_API_KEY;
  params.s = signParams(params);
  const body = new URLSearchParams(params).toString();

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'www.flow.cl',
      path: `/api${path}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function notifyZapier(url, payload) {
  const body = JSON.stringify(payload);
  return new Promise((resolve) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, resolve);
    req.on('error', () => resolve());
    req.write(body);
    req.end();
  });
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  // POST / — crear pago
  if (event.httpMethod === 'POST' && !event.path.includes('confirm')) {
    const { token, name, email } = JSON.parse(event.body || '{}');
    if (!token || !PLAN_NAMES[token]) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Token inválido' }) };
    }

    const orderId = `${token}-${Date.now()}`;

    // Guardar nombre+email temporalmente por orderId para usarlo en /confirm
    global._leadStore = global._leadStore || {};
    global._leadStore[orderId] = { name: name || '', email: email || '' };

    const params = {
      commerceOrder: orderId,
      subject: PLAN_NAMES[token],
      amount: PLAN_AMOUNTS[token],
      email: email || '',
      urlConfirmation: `${SITE_URL}/.netlify/functions/create-payment/confirm`,
      urlReturn: `${SITE_URL}/gracias`,
      urlCancel: `${SITE_URL}/pago-fallido`,
      currency: 'CLP',
      paymentMethod: 9,
    };

    try {
      const result = await postToFlow('/payment/create', params);
      if (result.url && result.token) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ url: `${result.url}?token=${result.token}` })
        };
      }
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Error Flow', detail: result }) };
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
  }

  // POST /confirm — Flow confirma pago
  if (event.httpMethod === 'POST' && event.path.includes('confirm')) {
    const body = new URLSearchParams(event.body || '');
    const flowToken = body.get('token');
    if (!flowToken) return { statusCode: 400, body: 'Missing token' };

    const params = { token: flowToken };
    params.apiKey = FLOW_API_KEY;
    params.s = signParams(params);
    const query = new URLSearchParams(params).toString();

    try {
      const paymentData = await new Promise((resolve, reject) => {
        https.get(`${FLOW_API_URL}/payment/getStatus?${query}`, (res) => {
          let data = '';
          res.on('data', c => data += c);
          res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
        }).on('error', reject);
      });

      if (paymentData.status === 2) {
        const orderId = paymentData.commerceOrder;
        const planToken = orderId.split('-')[0];
        const zapierUrl = ZAPIER_WEBHOOKS[planToken];

        // Recuperar nombre guardado al crear el pago
        const lead = (global._leadStore || {})[orderId] || {};

        if (zapierUrl) {
          await notifyZapier(zapierUrl, {
            name: lead.name || '',
            email: lead.email || paymentData.payer || '',
            plan: PLAN_NAMES[planToken] || planToken,
            amount: paymentData.amount,
            order: orderId,
            date: new Date().toISOString(),
          });
        }

        // Limpiar memoria
        if (global._leadStore) delete global._leadStore[orderId];
      }
    } catch (e) {
      console.error('confirm error', e);
    }

    return { statusCode: 200, body: 'OK' };
  }

  return { statusCode: 404, body: 'Not found' };
};
