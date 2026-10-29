const https = require('https');
const crypto = require('crypto');

const FLOW_API_KEY = process.env.FLOW_API_KEY;
const FLOW_SECRET_KEY = process.env.FLOW_SECRET_KEY;
const FLOW_API_URL = 'https://www.flow.cl/api';
const SITE_URL = 'https://vortexcor.com';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFY_EMAIL = 'marce.zolezzi@gmail.com';

const PLAN_NAMES = {
  'sf91127fd124de7e6421f45317cc66f302b6dc53': 'Pack Inicio',
  't3c9404b5d417e43e5ff7dc5cb7ae340069795be': 'Pack Mantención Mensual',
  'v4fc43f48cb0fa1d5fd75929c8d5b8c86eb5848f': 'Plan Pro',
  'o1a8ee03c1da73ce7273992af333cb7fb9b05356': 'Pack Contratación',
  'na811dc9c556b4b25d7f9692dfef8857f2ef2e6c': 'Pack Desvinculación',
  'i97f46c536ea1cc3f5d65b025f5b3af9ebaff9a8': 'Evaluación de Desempeño',
  'p84a12b3c9d7e2f1a6b5c4d3e2f1a6b5c4d3e2f1': 'Pack Perfiles de Cargo',
};

const PLAN_AMOUNTS = {
  'sf91127fd124de7e6421f45317cc66f302b6dc53': 790000,
  't3c9404b5d417e43e5ff7dc5cb7ae340069795be': 1000,
  'v4fc43f48cb0fa1d5fd75929c8d5b8c86eb5848f': 590000,
  'o1a8ee03c1da73ce7273992af333cb7fb9b05356': 490000,
  'na811dc9c556b4b25d7f9692dfef8857f2ef2e6c': 290000,
  'i97f46c536ea1cc3f5d65b025f5b3af9ebaff9a8': 590000,
  'p84a12b3c9d7e2f1a6b5c4d3e2f1a6b5c4d3e2f1': 1000,
};

// Códigos cortos para commerceOrder (Flow acepta máximo 45 caracteres)
const PLAN_CODES = {
  'sf91127fd124de7e6421f45317cc66f302b6dc53': 'INI',
  't3c9404b5d417e43e5ff7dc5cb7ae340069795be': 'MAN',
  'v4fc43f48cb0fa1d5fd75929c8d5b8c86eb5848f': 'PRO',
  'o1a8ee03c1da73ce7273992af333cb7fb9b05356': 'CON',
  'na811dc9c556b4b25d7f9692dfef8857f2ef2e6c': 'DES',
  'i97f46c536ea1cc3f5d65b025f5b3af9ebaff9a8': 'EVA',
  'p84a12b3c9d7e2f1a6b5c4d3e2f1a6b5c4d3e2f1': 'PER',
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
      timeout: 8000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(new Error('Invalid JSON from Flow: ' + data)); } });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('Flow request timeout')); });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function sendResendEmail(payload) {
  const { name, email, plan, amount, order, date } = payload;
  const clpAmount = Number(amount).toLocaleString('es-CL');
  const emailBody = JSON.stringify({
    from: 'Vortex Co <notificaciones@vortexcor.com>',
    to: [NOTIFY_EMAIL],
    subject: `Nuevo pago: ${plan}`,
    html: `
      <h2>Nuevo pago recibido</h2>
      <table style="border-collapse:collapse;width:100%;max-width:500px">
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Plan</strong></td><td style="padding:8px;border:1px solid #ddd">${plan}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Cliente</strong></td><td style="padding:8px;border:1px solid #ddd">${name || '(no indicado)'}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Email</strong></td><td style="padding:8px;border:1px solid #ddd">${email || '(no indicado)'}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Monto</strong></td><td style="padding:8px;border:1px solid #ddd">$${clpAmount} CLP</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Orden</strong></td><td style="padding:8px;border:1px solid #ddd">${order}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Fecha</strong></td><td style="padding:8px;border:1px solid #ddd">${new Date(date).toLocaleString('es-CL')}</td></tr>
      </table>
    `,
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(emailBody),
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { console.log('Resend response:', res.statusCode, data); resolve(); });
    });
    req.on('error', (e) => { console.error('Resend error:', e); resolve(); });
    req.write(emailBody);
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

  // GET /ping — health check
  if (event.httpMethod === 'GET') {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, apiKey: FLOW_API_KEY ? 'set' : 'MISSING', secretKey: FLOW_SECRET_KEY ? 'set' : 'MISSING' }) };
  }

  // POST / — crear pago
  if (event.httpMethod === 'POST' && !event.path.includes('confirm')) {
    const { token, name, email } = JSON.parse(event.body || '{}');
    if (!token || !PLAN_NAMES[token]) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Token inválido' }) };
    }

    // Ej: "INI-1793121301228" (17 caracteres)
    const orderId = `${PLAN_CODES[token]}-${Date.now()}`;

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
      // Flow devuelve este campo en getStatus; así /confirm recupera plan, nombre y email
      // aunque corra en otra instancia de la función (la memoria global no se comparte)
      optional: JSON.stringify({ plan: token, name: name || '', email: email || '' }),
    };

    try {
      const result = await postToFlow('/payment/create', params);
      console.log('Flow response:', JSON.stringify(result));
      if (result.url && result.token) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ url: `${result.url}?token=${result.token}` })
        };
      }
      return { statusCode: 200, headers, body: JSON.stringify({ error: result.message || result.code || 'Error Flow', detail: result }) };
    } catch (e) {
      console.error('Flow error:', e.message);
      return { statusCode: 200, headers, body: JSON.stringify({ error: e.message }) };
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

        let extra = paymentData.optional || {};
        if (typeof extra === 'string') {
          try { extra = JSON.parse(extra); } catch (e) { extra = {}; }
        }

        const orderCode = orderId.split('-')[0];
        const planToken = extra.plan || Object.keys(PLAN_CODES).find(t => PLAN_CODES[t] === orderCode);
        await sendResendEmail({
          name: extra.name || '',
          email: extra.email || paymentData.payer || '',
          plan: PLAN_NAMES[planToken] || planToken,
          amount: paymentData.amount,
          order: orderId,
          date: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error('confirm error', e);
    }

    return { statusCode: 200, body: 'OK' };
  }

  return { statusCode: 404, body: 'Not found' };
};
