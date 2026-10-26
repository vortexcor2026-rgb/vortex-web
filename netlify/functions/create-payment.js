const https = require('https');
const crypto = require('crypto');

// Flow API credentials (set these in Netlify environment variables)
const FLOW_API_KEY = process.env.FLOW_API_KEY;
const FLOW_SECRET_KEY = process.env.FLOW_SECRET_KEY;
const FLOW_API_URL = 'https://www.flow.cl/api';

// Zapier webhook URLs per plan (set these in Netlify environment variables)
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

function signParams(params) {
  const keys = Object.keys(params).sort();
  let toSign = '';
  keys.forEach(k => { toSign += k + params[k]; });
  return crypto.createHmac('sha256', FLOW_SECRET_KEY).update(toSign).digest('hex');
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' } };
  }

  // Handle Flow confirmation (payment confirmed)
  if (event.httpMethod === 'POST' && event.path.includes('confirm')) {
    const body = new URLSearchParams(event.body);
    const token = body.get('token');

    // Get payment status from Flow
    const params = { apiKey: FLOW_API_KEY, token };
    params.s = signParams(params);
    const query = new URLSearchParams(params).toString();

    const paymentData = await new Promise((resolve, reject) => {
      https.get(`${FLOW_API_URL}/payment/getStatus?${query}`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    if (paymentData.status === 2) { // 2 = pagado
      const planToken = paymentData.commerceOrder.split('-')[0];
      const zapierUrl = ZAPIER_WEBHOOKS[planToken];

      if (zapierUrl) {
        // Notify Zapier
        const payload = JSON.stringify({
          email: paymentData.payer,
          plan: PLAN_NAMES[planToken] || 'Plan desconocido',
          amount: paymentData.amount,
          order: paymentData.commerceOrder,
          date: new Date().toISOString(),
        });

        await new Promise((resolve) => {
          const url = new URL(zapierUrl);
          const req = https.request({
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': payload.length }
          }, resolve);
          req.write(payload);
          req.end();
        });
      }
    }

    return { statusCode: 200, body: 'OK' };
  }

  return { statusCode: 404, body: 'Not found' };
};
