const https = require('https');
const crypto = require('crypto');

const FLOW_API_KEY = process.env.FLOW_API_KEY;
const FLOW_SECRET_KEY = process.env.FLOW_SECRET_KEY;
const FLOW_API_URL = 'https://www.flow.cl/api';
const SITE_URL = 'https://vortexcor.com';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const BUSINESS_EMAIL = 'vortexcor2026@gmail.com';

const PLAN_NAMES = {
  'sf91127fd124de7e6421f45317cc66f302b6dc53': 'Pack Inicio',
  't3c9404b5d417e43e5ff7dc5cb7ae340069795be': 'Pack Mantención Mensual',
  'v4fc43f48cb0fa1d5fd75929c8d5b8c86eb5848f': 'Plan Pro',
  'o1a8ee03c1da73ce7273992af333cb7fb9b05356': 'Pack Contratación',
  'na811dc9c556b4b25d7f9692dfef8857f2ef2e6c': 'Pack Desvinculación',
  'i97f46c536ea1cc3f5d65b025f5b3af9ebaff9a8': 'Evaluación de Desempeño',
  'r32645820f813ef56810efcc6210b668ee703917': 'Pack Perfiles de Cargo',
  'i3d1a9b1b20dfcf2232829658b9f49f3fc336bfc': 'Arma tu Plan',
};

const PLAN_AMOUNTS = {
  'sf91127fd124de7e6421f45317cc66f302b6dc53': 790000,
  't3c9404b5d417e43e5ff7dc5cb7ae340069795be': 1000,
  'v4fc43f48cb0fa1d5fd75929c8d5b8c86eb5848f': 590000,
  'o1a8ee03c1da73ce7273992af333cb7fb9b05356': 490000,
  'na811dc9c556b4b25d7f9692dfef8857f2ef2e6c': 290000,
  'i97f46c536ea1cc3f5d65b025f5b3af9ebaff9a8': 590000,
  'r32645820f813ef56810efcc6210b668ee703917': 1000,
  'i3d1a9b1b20dfcf2232829658b9f49f3fc336bfc': 0,  // precio variable según items
};

// Códigos cortos para commerceOrder (Flow acepta máximo 45 caracteres)
const PLAN_CODES = {
  'sf91127fd124de7e6421f45317cc66f302b6dc53': 'INI',
  't3c9404b5d417e43e5ff7dc5cb7ae340069795be': 'MAN',
  'v4fc43f48cb0fa1d5fd75929c8d5b8c86eb5848f': 'PRO',
  'o1a8ee03c1da73ce7273992af333cb7fb9b05356': 'CON',
  'na811dc9c556b4b25d7f9692dfef8857f2ef2e6c': 'DES',
  'i97f46c536ea1cc3f5d65b025f5b3af9ebaff9a8': 'EVA',
  'r32645820f813ef56810efcc6210b668ee703917': 'PER',
  'i3d1a9b1b20dfcf2232829658b9f49f3fc336bfc': 'CAR',
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

function resendPost(emailJson) {
  const emailBody = JSON.stringify(emailJson);
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

const FIRMA = `
<div style="border-top:2px solid #2d6a4f;padding-top:14px;margin-top:20px;">
  <p style="margin:0;font-size:15px;font-weight:bold;color:#1b1b1b;">Carolina Zolezzi</p>
  <p style="margin:4px 0 0;font-size:12px;color:#2d6a4f;letter-spacing:1.5px;text-transform:uppercase;">Vortex Co. &middot; Recursos Humanos</p>
  <p style="margin:6px 0 0;font-size:12px;color:#888;font-style:italic;">Nada se escapa del vortex.</p>
</div>`;

const FIRMA_MKT = `
<div style="border-top:2px solid #2d6a4f;padding-top:14px;margin-top:20px;">
  <p style="margin:0;font-size:15px;font-weight:bold;color:#1b1b1b;">Marcela Zolezzi</p>
  <p style="margin:4px 0 0;font-size:12px;color:#2d6a4f;letter-spacing:1.5px;text-transform:uppercase;">Vortex Co. &middot; Marketing Estratégico</p>
  <p style="margin:6px 0 0;font-size:12px;color:#888;font-style:italic;">Nada se escapa del vortex.</p>
</div>`;

function getBuyerEmail(planCode, name, clpAmount) {
  const style = 'font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#222;max-width:600px;';
  const linkStyle = 'color:#2d6a4f;';
  const hrStyle = 'border:none;border-top:1px solid #eee;margin:24px 0;';
  const hola = `<p>Hola ${name || ''},</p>`;

  if (planCode === 'CON') {
    return `<div style="${style}">${hola}
<p>Gracias por confiar en Vortex Co. para acompañarte en la búsqueda de un nuevo integrante para tu equipo.</p>
<p>Para comenzar, necesitamos que completes estos dos pasos:</p>
<p>1. <a href="https://docs.google.com/forms/d/1MoSZAe8s4sW27_B6dFb8ZgPhLJaVD_BM0qH4rncQD-o/viewform" style="${linkStyle}">Completa el formulario de contratación</a></p>
<p>2. <a href="https://calendly.com/vortexcor2026/new-meeting" style="${linkStyle}">Agenda nuestra primera reunión</a></p>
<hr style="${hrStyle}">
<p>Proceso de selección:</p>
<p><strong>1.</strong> Definición del perfil y publicación: aprox. una semana.</p>
<p><strong>2.</strong> Período de postulaciones: tres semanas.</p>
<p><strong>3.</strong> Evaluación de candidatos: antecedentes y pruebas.</p>
<p><strong>4.</strong> Entrevistas con candidatos preseleccionados.</p>
<p><strong>5.</strong> Carta oferta.</p>
<p><strong>6.</strong> Cierre e incorporación.</p>
<p>Si el candidato no cumple en los primeros tres meses, te ayudamos a encontrar un reemplazo sin costo adicional.</p>
<p>Si tienes alguna duda, puedes responder directamente a este correo.</p>
<p>Nos vemos pronto,</p>${FIRMA}</div>`;
  }

  if (planCode === 'PER') {
    return `<div style="${style}">${hola}
<p>Gracias por confiar en Vortex. Tu pack incluye <strong>3 perfiles de cargo</strong> y los tendrás listos en aproximadamente una semana.</p>
<p>Para comenzar, necesitamos que completes estos dos pasos:</p>
<p>1. <a href="https://docs.google.com/forms/d/1RGCTGP1J9psnUh8avMKI6qoMXzPeOYFRi7sV1RDxJ3A/viewform" style="${linkStyle}">Completa el formulario de perfiles de cargo</a></p>
<p>2. <a href="https://calendly.com/vortexcor2026/new-meeting" style="${linkStyle}">Agenda una reunión para hablar sobre tus perfiles</a></p>
<hr style="${hrStyle}">
<p>Lo que sigue:</p>
<p><strong>1.</strong> Completa el formulario con los detalles de los cargos.</p>
<p><strong>2.</strong> Agendamos una reunión para alinearnos y resolver dudas.</p>
<p><strong>3.</strong> En aproximadamente una semana recibirás los 3 perfiles de cargo listos.</p>
<p><strong>4.</strong> Una vez entregados los perfiles, tienes la opción de solicitar una ronda de ajustes para asegurarte de que cada perfil refleje exactamente lo que necesitas.</p>
<p>Si tienes alguna duda, puedes responder directamente a este correo.</p>
<p>Nos vemos pronto,</p>${FIRMA}</div>`;
  }

  if (planCode === 'EVA') {
    return `<div style="${style}">${hola}
<p>Gracias por confiar en Vortex. Estamos listos para acompañarte en el proceso de Evaluación de Desempeño de tu equipo.</p>
<p>Para comenzar, necesitamos que completes estos dos pasos:</p>
<p>1. <a href="https://docs.google.com/forms/d/e/1FAIpQLSfY6GZE-oSFCY2swwX2ytf-mqanjuh8LSaFEAoKS_UzAjnaQA/viewform" style="${linkStyle}">Completa nuestro formulario de evaluación</a></p>
<p>2. <a href="https://docs.google.com/forms/d/1yYSuZM4770IyFTsFEc1zs64wfqfJXUMCwAzgMY0fFs4/viewform" style="${linkStyle}">Agenda nuestra primera reunión</a></p>
<hr style="${hrStyle}">
<p>¿Cómo será el proceso?</p>
<p><strong>1.</strong> Reunión inicial contigo: definiremos qué evaluar en cada persona y en el equipo como conjunto.</p>
<p><strong>2.</strong> Enviamos un test a cada integrante del equipo para que lo completen.</p>
<p><strong>3.</strong> Realizamos una reunión grupal y una entrevista individual de 30 minutos con cada persona.</p>
<p><strong>4.</strong> Con toda esa información, preparamos la evaluación final con resultados y recomendaciones.</p>
<p>El proceso puede tomar hasta 2 semanas dependiendo de la disponibilidad del equipo.</p>
<p>Si tienes alguna duda, puedes responder directamente a este correo.</p>
<p>Nos vemos pronto,</p>${FIRMA}</div>`;
  }

  if (planCode === 'DES') {
    return `<div style="${style}">${hola}
<p>Gracias por contactar a Vortex Co. para acompañarte en este proceso.</p>
<p>Entendemos que una desvinculación requiere claridad, organización y un manejo cuidadoso de la información.</p>
<p>Para comenzar, necesitamos que completes estos dos pasos:</p>
<p>1. <a href="https://docs.google.com/forms/d/1nHu_trxvrQt0jlhymXe2S_4XJPy9bLdJXegFZAAo4d0/viewform" style="${linkStyle}">Completa el formulario de desvinculación</a></p>
<p>2. <a href="https://calendly.com/vortexcor2026/new-meeting" style="${linkStyle}">Agenda una reunión para revisar el caso</a></p>
<p>Nuestro objetivo es brindarte claridad y acompañamiento en cada etapa. Si existen plazos u obligaciones legales, deberán verificarse según la normativa correspondiente.</p>
<p>Si tienes alguna duda, puedes responder directamente a este correo.</p>
<p>Gracias por confiar en Vortex Co.</p>
<p>Nos vemos pronto,</p>${FIRMA}</div>`;
  }

  if (planCode === 'CAR') {
    return `<div style="${style}">${hola}
<p>Recibimos tu compra. Gracias por confiar en Vortex.</p>
<p>En las próximas 24 horas recibirás un correo con todos los pasos a seguir según los productos que adquiriste.</p>
<p>Si tienes alguna duda, puedes responder directamente a este correo.</p>
<p>Nos vemos pronto,</p>
<div style="border-top:2px solid #2d6a4f;padding-top:14px;margin-top:20px;">
  <p style="margin:0;font-size:15px;font-weight:bold;color:#1b1b1b;">Equipo Vortex</p>
  <p style="margin:4px 0 0;font-size:12px;color:#2d6a4f;letter-spacing:1.5px;text-transform:uppercase;">Vortex Co.</p>
  <p style="margin:6px 0 0;font-size:12px;color:#888;font-style:italic;">Nada se escapa del vortex.</p>
</div>
</div>`;
  }

  if (planCode === 'INI') {
    return `<div style="${style}">${hola}
<p>¡Te damos la bienvenida a Vortex! Nos alegra mucho que nos hayas elegido para acompañarte en esta etapa de crecimiento.</p>
<p>A partir de ahora, trabajaremos en conjunto para construir una marca sólida, coherente y estratégica, que refleje la esencia de tu negocio y te permita conectar con tu público de manera efectiva.</p>
<p>Para comenzar, necesitamos que completes estos dos pasos:</p>
<p>1. <a href="https://docs.google.com/forms/d/1Aqz8zhCPZS6-RxEZCKuNlTbuEVovZlu-cXUyCCyrxyo/viewform" style="${linkStyle}">Completa nuestro formulario de onboarding</a></p>
<p>2. <a href="https://calendly.com/vortexcor2026/new-meeting" style="${linkStyle}">Agenda nuestra primera reunión</a></p>
<hr style="${hrStyle}">
<p>¿Cómo será nuestro proceso de trabajo?</p>
<p><strong>01.</strong> Estrategia y desarrollo de marca: después de nuestra primera reunión, trabajaremos en la propuesta de marca.</p>
<p><strong>02.</strong> Presentación y ajustes: reunión de 30 minutos para presentar la propuesta y revisar ajustes.</p>
<p><strong>03.</strong> Desarrollo digital y materiales: web, materiales y configuración de plataformas. Aproximadamente una semana.</p>
<p><strong>04.</strong> Entrega final y planificación del primer mes: reunión de cierre y calendario de contenidos del primer mes.</p>
<p>Si tienes alguna duda, puedes responder directamente a este correo.</p>
<p>Nos vemos pronto,</p>${FIRMA_MKT}</div>`;
  }

  // MAN y PRO
  return `<div style="${style}">${hola}
<p>¡Te damos la bienvenida a Vortex! Nos alegra mucho que hayas confiado en nosotras para acompañarte en el crecimiento de tu negocio.</p>
<p>Para comenzar, necesitamos que completes estos dos pasos:</p>
<p>1. <a href="https://docs.google.com/forms/d/1Aqz8zhCPZS6-RxEZCKuNlTbuEVovZlu-cXUyCCyrxyo/viewform" style="${linkStyle}">Completa nuestro formulario de onboarding</a></p>
<p>2. <a href="https://calendly.com/vortexcor2026/new-meeting" style="${linkStyle}">Agenda nuestra primera reunión</a></p>
<hr style="${hrStyle}">
<p>Dinámica mensual:</p>
<p><strong>1.</strong> Análisis y optimización: revisaremos resultados e identificaremos oportunidades.</p>
<p><strong>2.</strong> Ejecución del plan mensual: contenido, campañas, plataformas.</p>
<p><strong>3.</strong> Reporte y planificación: reporte de resultados y prioridades del mes siguiente.</p>
<p>Si tienes alguna duda, puedes responder directamente a este correo.</p>
<p>Nos vemos pronto,</p>${FIRMA_MKT}</div>`;
}

async function sendResendEmail(payload) {
  const { name, email, plan, amount, order, date, planCode, items } = payload;
  const clpAmount = Number(amount).toLocaleString('es-CL');
  const fechaStr = new Date(date).toLocaleString('es-CL');

  // Filas extra para Arma tu Plan con detalle de ítems
  let itemsHtml = '';
  if (planCode === 'CAR' && Array.isArray(items) && items.length > 0) {
    const itemRows = items.map(it => {
      const subtotal = Number(it.price * it.qty).toLocaleString('es-CL');
      return `<tr><td style="padding:6px 8px;border:1px solid #ddd">${it.name}</td><td style="padding:6px 8px;border:1px solid #ddd;text-align:center">${it.qty}</td><td style="padding:6px 8px;border:1px solid #ddd;text-align:right">$${subtotal}</td></tr>`;
    }).join('');
    itemsHtml = `
      <tr><td colspan="2" style="padding:8px;border:1px solid #ddd;background:#f5f5f5"><strong>Ítems seleccionados</strong></td><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5"></td></tr>
      <tr><td style="padding:6px 8px;border:1px solid #ddd;font-size:12px;color:#666"><strong>Ítem</strong></td><td style="padding:6px 8px;border:1px solid #ddd;font-size:12px;color:#666;text-align:center"><strong>Cant.</strong></td><td style="padding:6px 8px;border:1px solid #ddd;font-size:12px;color:#666;text-align:right"><strong>Subtotal</strong></td></tr>
      ${itemRows}`;
  }

  // Email interno a Vortex
  await resendPost({
    from: 'Vortex Co <notificaciones@vortexcor.com>',
    to: [BUSINESS_EMAIL],
    subject: `VENTA: ${plan} - ${name || 'Cliente'}`,
    html: `
      <h2>Nueva venta recibida</h2>
      <table style="border-collapse:collapse;width:100%;max-width:500px">
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Plan</strong></td><td style="padding:8px;border:1px solid #ddd" colspan="2">${plan}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Cliente</strong></td><td style="padding:8px;border:1px solid #ddd" colspan="2">${name || '(no indicado)'}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Email</strong></td><td style="padding:8px;border:1px solid #ddd" colspan="2">${email || '(no indicado)'}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Monto</strong></td><td style="padding:8px;border:1px solid #ddd" colspan="2">$${clpAmount} CLP</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Orden</strong></td><td style="padding:8px;border:1px solid #ddd" colspan="2">${order}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Fecha</strong></td><td style="padding:8px;border:1px solid #ddd" colspan="2">${fechaStr}</td></tr>
        ${itemsHtml}
      </table>
    `,
  });

  // Email de confirmación al comprador (solo si tiene email)
  if (email) {
    await resendPost({
      from: 'Vortex Co <notificaciones@vortexcor.com>',
      to: [email],
      subject: `Gracias por tu compra - ${plan}`,
      html: getBuyerEmail(planCode, name, clpAmount),
    });
  }
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
  if (event.httpMethod === 'GET' && !event.path.includes('status') && !event.path.includes('test-email')) {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, apiKey: FLOW_API_KEY ? 'set' : 'MISSING', secretKey: FLOW_SECRET_KEY ? 'set' : 'MISSING' }) };
  }

  // GET /status?token=xxx — consulta estado de pago para gracias.html
  if (event.httpMethod === 'GET' && event.path.includes('status')) {
    const flowToken = event.queryStringParameters && event.queryStringParameters.token;
    if (!flowToken) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing token' }) };

    const params = { token: flowToken, apiKey: FLOW_API_KEY };
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

      // Si pago exitoso (status=2), mandar email a vortex
      if (paymentData.status === 2) {
        const orderId = paymentData.commerceOrder;
        let extra = paymentData.optional || {};
        if (typeof extra === 'string') { try { extra = JSON.parse(extra); } catch(e) { extra = {}; } }
        const orderCode = orderId ? orderId.split('-')[0] : '';
        const planToken = extra.plan || Object.keys(PLAN_CODES).find(t => PLAN_CODES[t] === orderCode);

        await sendResendEmail({
          name: extra.name || '',
          email: extra.email || paymentData.payer || '',
          plan: PLAN_NAMES[planToken] || orderCode,
          planCode: PLAN_CODES[planToken] || orderCode,
          amount: paymentData.amount,
          order: orderId,
          date: new Date().toISOString(),
          items: extra.items || [],
        });
      }

      return { statusCode: 200, headers, body: JSON.stringify({ status: paymentData.status }) };
    } catch(e) {
      console.error('status error', e);
      return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
  }

  // POST / — crear pago
  if (event.httpMethod === 'POST' && !event.path.includes('confirm')) {
    const { token, name, email, amount: bodyAmount, items: bodyItems } = JSON.parse(event.body || '{}');
    if (!token || !PLAN_NAMES[token]) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Token inválido' }) };
    }

    // Para CAR (Arma tu Plan) el monto es variable y viene del frontend
    const finalAmount = (token === 'i3d1a9b1b20dfcf2232829658b9f49f3fc336bfc' && bodyAmount)
      ? bodyAmount
      : PLAN_AMOUNTS[token];

    if (!finalAmount || finalAmount <= 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Monto inválido' }) };
    }

    // Ej: "INI-1793121301228" (17 caracteres)
    const orderId = `${PLAN_CODES[token]}-${Date.now()}`;

    const params = {
      commerceOrder: orderId,
      subject: PLAN_NAMES[token],
      amount: finalAmount,
      email: email || '',
      urlConfirmation: `${SITE_URL}/.netlify/functions/create-payment/confirm`,
      urlReturn: `${SITE_URL}/gracias`,
      urlCancel: `${SITE_URL}/pago-fallido`,
      currency: 'CLP',
      paymentMethod: 9,
      // Flow devuelve este campo en getStatus; así /confirm recupera plan, nombre y email
      // aunque corra en otra instancia de la función (la memoria global no se comparte)
      optional: JSON.stringify({ plan: token, name: name || '', email: email || '', items: bodyItems || [] }),
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
    console.log('CONFIRM HIT - method:', event.httpMethod, 'body:', event.body);
    const body = new URLSearchParams(event.body || '');
    const flowToken = body.get('token');
    console.log('CONFIRM flowToken:', flowToken);
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

      console.log('CONFIRM paymentData status:', paymentData.status, 'order:', paymentData.commerceOrder);
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
          planCode: PLAN_CODES[planToken] || orderCode,
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

  // GET /test-email — verifica que Resend funciona
  if (event.httpMethod === 'GET' && event.path.includes('test-email')) {
    try {
      await resendPost({
        from: 'Vortex Co <notificaciones@vortexcor.com>',
        to: [BUSINESS_EMAIL],
        subject: 'TEST - Resend funcionando',
        html: '<p>Si recibes esto, Resend está configurado correctamente en Netlify.</p>',
      });
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, msg: 'Email enviado a ' + BUSINESS_EMAIL }) };
    } catch(e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
  }

  return { statusCode: 404, body: 'Not found' };
};
