/*!
 * VORTEX catalog: single source of truth for "Arma tu plan" items and prices.
 * Used by the website widget (vortex-arma.js) and by the payment function
 * (netlify/functions/create-payment.js), which recalculates the total server-side.
 * Prices: CLP (price) for the Spanish site, USD (usd) for the English site.
 */
(function (root) {
  var CATALOG = {
    // Plans used for the "you save" hint in the cart (must match the plan cards)
    plans: [
      { id: 'inicio', line: 'marketing', price: 790000, usd: 1500, anchor: '#servicios',
        name: { es: 'Pack Inicio', en: 'Starter Package' },
        covers: ['landing', 'idvisual', 'diagmarca', 'gbp', 'medicion', 'lanzamiento'] },
      { id: 'mantencion', line: 'marketing', price: 390000, usd: 1200, anchor: '#servicios', monthly: true,
        name: { es: 'plan Mantención', en: 'Maintenance plan' },
        covers: ['packcont', 'pieza', 'reel', 'gestion', 'reporte', 'reunion30', 'reunion60', 'gbp'] },
      { id: 'contratacion', line: 'rrhh', price: 490000, usd: 1500, anchor: '#servicios',
        name: { es: 'pack Contratación', en: 'Hiring package' },
        covers: ['aviso', 'busqueda', 'entrevista', 'psicolab'] }
    ],
    items: [
      // ───────── MARKETING · Soluciones ─────────
      { id: 'auditoria', line: 'marketing', sec: 'sol', type: 'once', price: 290000, usd: 650, badge: 'rec',
        q: { es: '¿Tus anuncios gastan y no venden?', en: 'Spending on ads with no sales?' },
        name: { es: 'Auditoría y rescate de campaña', en: 'Ad account audit and rescue' },
        desc: { es: 'Revisamos tu cuenta de Google Ads o Meta, cortamos el gasto que no sirve y te entregamos un plan de ajustes.', en: 'We review your Google Ads or Meta account, cut wasted spend and hand you a clear fix plan.' },
        inc: { es: ['Revisión completa de campañas, keywords y audiencias', 'Informe con lo que está fallando y por qué', 'Plan de ajustes priorizado'], en: ['Full review of campaigns, keywords and audiences', 'Report on what is failing and why', 'Prioritized fix plan'] },
        note: { es: 'Si contratas un plan mensual dentro de 30 días, te descontamos el valor de la auditoría.', en: 'Hire a monthly plan within 30 days and we credit the audit fee.' } },
      { id: 'landing', line: 'marketing', sec: 'sol', type: 'once', price: 390000, usd: 870,
        q: { es: '¿Necesitas una página web ya?', en: 'Need a website now?' },
        name: { es: 'Landing page express', en: 'Express landing page' },
        desc: { es: 'Una página clara y rápida, pensada para vender un servicio y recibir contactos.', en: 'A clear, fast page built to sell one service and capture leads.' },
        inc: { es: ['Diseño y textos orientados a conversión', 'Adaptada a celular', 'Formulario o botón de contacto conectado'], en: ['Conversion-focused design and copy', 'Mobile-ready', 'Contact form or button connected'] } },
      { id: 'gbp', line: 'marketing', sec: 'sol', type: 'once', price: 120000, usd: 270,
        q: { es: '¿No apareces en Google?', en: 'Not showing up on Google?' },
        name: { es: 'Perfil de Google para tu empresa', en: 'Google Business Profile' },
        desc: { es: 'Creamos y optimizamos tu perfil para que aparezcas en Google y Maps cuando te buscan.', en: 'We create and optimize your profile so you appear on Google Search and Maps.' },
        inc: { es: ['Perfil creado o corregido y verificado', 'Categorías, servicios, fotos y horarios', 'Estrategia simple para conseguir reseñas'], en: ['Profile created or fixed and verified', 'Categories, services, photos and hours', 'Simple plan to get reviews'] } },
      { id: 'medicion', line: 'marketing', sec: 'sol', type: 'once', price: 250000, usd: 560,
        q: { es: '¿No sabes qué está funcionando?', en: "Don't know what's working?" },
        name: { es: 'Configuración de medición', en: 'Measurement setup' },
        desc: { es: 'Dejamos medido tu sitio para saber de dónde vienen tus clientes y qué canal vende.', en: 'We set up tracking so you know where customers come from and which channel sells.' },
        inc: { es: ['Google Analytics 4 y Tag Manager', 'Conversiones clave (contactos y ventas)', 'Google Search Console conectado'], en: ['Google Analytics 4 and Tag Manager', 'Key conversions (leads and sales)', 'Google Search Console connected'] } },
      { id: 'fecha', line: 'marketing', sec: 'sol', type: 'qty', max: 4, price: 490000, usd: 1090,
        unit: { es: 'campaña', en: 'campaign' },
        q: { es: '¿Viene una fecha comercial y no tienes nada?', en: 'A key sales date coming up?' },
        name: { es: 'Campaña para fecha comercial', en: 'Seasonal sales campaign' },
        desc: { es: 'Navidad, CyberDay, Día de la Madre: piezas, anuncios y gestión de la campaña de principio a fin.', en: 'Christmas, Black Friday, Mother’s Day: creative, ads and full campaign management.' },
        inc: { es: ['Piezas gráficas y reel para la campaña', 'Anuncios en Google o Meta', 'Gestión durante toda la fecha'], en: ['Graphics and a reel for the campaign', 'Ads on Google or Meta', 'Managed for the whole period'] } },
      { id: 'packcont', line: 'marketing', sec: 'sol', type: 'qty', max: 12, price: 340000, usd: 750,
        unit: { es: 'mes', en: 'month' },
        q: { es: '¿No tienes contenido para este mes?', en: 'No content for this month?' },
        name: { es: 'Pack de contenido mensual', en: 'Monthly content pack' },
        desc: { es: '4 piezas gráficas y 2 reels listos para publicar, adaptados a 2 formatos cada uno.', en: '4 graphics and 2 reels ready to post, each adapted to 2 formats.' },
        inc: { es: ['4 piezas gráficas', '2 reels editados', 'Textos para cada publicación'], en: ['4 graphics', '2 edited reels', 'Captions for every post'] } },
      { id: 'diagmarca', line: 'marketing', sec: 'sol', type: 'once', price: 190000, usd: 420,
        q: { es: '¿Tu marca no se diferencia?', en: 'Brand not standing out?' },
        name: { es: 'Diagnóstico de marca', en: 'Brand diagnosis' },
        desc: { es: 'Analizamos cómo te percibe tu cliente frente a tu competencia y dónde estás perdiendo oportunidades.', en: 'How customers see you versus competitors, and where you are losing opportunities.' } },
      { id: 'idvisual', line: 'marketing', sec: 'sol', type: 'once', price: 290000, usd: 650,
        q: { es: '¿Tu imagen no se ve profesional?', en: 'Brand looks unprofessional?' },
        name: { es: 'Identidad visual', en: 'Visual identity' },
        desc: { es: 'Logo, paleta de colores, tipografías y una guía simple para usarlos siempre igual.', en: 'Logo, color palette, typography and a simple guide to use them consistently.' } },
      { id: 'plancont', line: 'marketing', sec: 'sol', type: 'once', price: 190000, usd: 420,
        q: { es: '¿No sabes qué publicar?', en: "Don't know what to post?" },
        name: { es: 'Plan de contenido trimestral', en: 'Quarterly content plan' },
        desc: { es: 'Qué publicar, en qué formato y cuándo, durante 3 meses.', en: 'What to post, in which format and when, for 3 months.' } },

      // ───────── MARKETING · Complementos ─────────
      { id: 'pieza', line: 'marketing', sec: 'comp', type: 'qty', max: 20, price: 49000, usd: 110,
        unit: { es: 'pieza', en: 'piece' },
        name: { es: 'Pieza gráfica para redes', en: 'Social media graphic' },
        desc: { es: 'Diseño listo para publicar, adaptado a 2 formatos.', en: 'Ready-to-post design in 2 formats.' } },
      { id: 'reel', line: 'marketing', sec: 'comp', type: 'qty', max: 20, price: 89000, usd: 200,
        unit: { es: 'reel', en: 'reel' },
        name: { es: 'Reel editado', en: 'Edited reel' },
        desc: { es: 'Video corto editado y listo para subir, adaptado a 2 formatos.', en: 'Short edited video in 2 formats.' } },
      { id: 'lanzamiento', line: 'marketing', sec: 'comp', type: 'qty', max: 3, price: 150000, usd: 330,
        unit: { es: 'plataforma', en: 'platform' },
        name: { es: 'Lanzamiento de campaña', en: 'Campaign launch' },
        desc: { es: 'Creamos tu cuenta publicitaria y dejamos 1 campaña configurada y funcionando.', en: 'We set up your ad account and launch 1 campaign.' } },
      { id: 'gestion', line: 'marketing', sec: 'comp', type: 'qty', max: 12, price: 150000, usd: 330,
        unit: { es: 'mes', en: 'month' },
        name: { es: 'Gestión mensual de Google Ads o Meta', en: 'Monthly Google Ads or Meta management' },
        desc: { es: 'Optimizamos tus campañas en 1 plataforma todo el mes. El presupuesto de avisos es aparte.', en: 'Ongoing optimization on 1 platform. Ad spend not included.' } },
      { id: 'reporte', line: 'marketing', sec: 'comp', type: 'qty', max: 12, price: 120000, usd: 270,
        unit: { es: 'mes', en: 'month' },
        name: { es: 'Reporte mensual con recomendaciones', en: 'Monthly report with recommendations' },
        desc: { es: 'Qué funcionó, qué no y qué cambiar el mes siguiente.', en: 'What worked, what didn’t and what to change next month.' } },
      { id: 'reunion30', line: 'marketing', sec: 'comp', type: 'qty', max: 12, price: 50000, usd: 110,
        unit: { es: 'reunión', en: 'meeting' },
        name: { es: 'Reunión de seguimiento (30 min)', en: 'Follow-up meeting (30 min)' },
        desc: { es: 'Videollamada para revisar avances y decidir próximos pasos.', en: 'Video call to review progress and agree next steps.' } },
      { id: 'reunion60', line: 'marketing', sec: 'comp', type: 'qty', max: 12, price: 90000, usd: 200,
        unit: { es: 'reunión', en: 'meeting' },
        name: { es: 'Reunión de seguimiento (60 min)', en: 'Follow-up meeting (60 min)' },
        desc: { es: 'Videollamada para revisar avances y decidir próximos pasos.', en: 'Video call to review progress and agree next steps.' } },

      // ───────── RRHH · Soluciones ─────────
      { id: 'expres', line: 'rrhh', sec: 'sol', type: 'qty', max: 3, price: 640000, usd: 1420, badge: 'urgent',
        unit: { es: 'proceso', en: 'search' },
        q: { es: '¿Necesitas contratar rápido?', en: 'Need to hire fast?' },
        name: { es: 'Selección exprés', en: 'Express hiring' },
        desc: { es: 'Proceso prioritario de principio a fin, con plazo de entrega comprometido por escrito desde el inicio.', en: 'Priority end-to-end search with a delivery date committed in writing from day one.' },
        inc: { es: ['Aviso y búsqueda activa de candidatos', 'Entrevistas por competencias y evaluación psicolaboral', 'Terna de finalistas con informe por candidato'], en: ['Job ad and active sourcing', 'Competency interviews and assessments', 'Shortlist with a report per candidate'] } },
      { id: 'karin', line: 'rrhh', sec: 'sol', type: 'quote', esOnly: true, priceFrom: 390000,
        q: { es: '¿No sabes si cumples la Ley Karin?', en: '' },
        name: { es: 'Implementación Ley Karin', en: '' },
        desc: { es: 'Te ayudamos a implementar el protocolo de prevención del acoso laboral, sexual y la violencia en el trabajo, y a difundirlo en tu equipo.', en: '' },
        inc: { es: ['Revisión de lo que tienes hoy', 'Implementación y difusión del protocolo', 'Capacitación para tu equipo'], en: [] } },
      { id: 'clima', line: 'rrhh', sec: 'sol', type: 'once', price: 590000, usd: 1310,
        q: { es: '¿Tu equipo está desgastado o se te va la gente?', en: 'Team burnt out or people leaving?' },
        name: { es: 'Diagnóstico de clima y rotación', en: 'Team climate and turnover diagnosis' },
        desc: { es: 'Entendemos qué está pasando en tu equipo y te entregamos acciones concretas.', en: 'We find out what is happening in your team and give you concrete actions.' },
        inc: { es: ['Encuesta de clima', 'Entrevistas con el equipo', 'Informe con plan de acción'], en: ['Climate survey', 'Team interviews', 'Report with an action plan'] } },
      { id: 'psicolab', line: 'rrhh', sec: 'sol', type: 'qty', max: 20, price: 90000, usd: 200,
        unit: { es: 'candidato', en: 'candidate' },
        q: { es: '¿Necesitas saber si este candidato sirve?', en: 'Is this candidate the right fit?' },
        name: { es: 'Evaluación psicolaboral', en: 'Psychological job assessment' },
        desc: { es: 'Pruebas aplicadas por psicóloga laboral, con informe individual por candidato.', en: 'Tests run by an occupational psychologist, with an individual report.' } },
      { id: 'perfil1', line: 'rrhh', sec: 'sol', type: 'qty', max: 10, price: 90000, usd: 200,
        unit: { es: 'perfil', en: 'profile' },
        q: { es: '¿No tienes claro qué debe hacer el cargo?', en: 'Unclear what the role should do?' },
        name: { es: 'Perfil de cargo Esencial', en: 'Job profile: Essential' },
        desc: { es: 'Redacción de funciones, responsabilidades, requisitos y experiencia. La información la entrega el cliente.', en: 'Duties, responsibilities, requirements and experience, based on information you provide.' } },
      { id: 'perfil2', line: 'rrhh', sec: 'sol', type: 'qty', max: 10, price: 220000, usd: 490,
        unit: { es: 'perfil', en: 'profile' },
        name: { es: 'Perfil de cargo Completo', en: 'Job profile: Complete' },
        desc: { es: 'Entrevista de levantamiento, objetivos, funciones, competencias y documento final con una ronda de ajustes.', en: 'Discovery interview, objectives, duties, competencies and final document with one revision.' } },
      { id: 'perfil3', line: 'rrhh', sec: 'sol', type: 'qty', max: 10, price: 360000, usd: 800,
        unit: { es: 'perfil', en: 'profile' },
        name: { es: 'Perfil de cargo por competencias', en: 'Job profile: Competency-based' },
        desc: { es: 'Análisis profundo, competencias técnicas y conductuales, indicadores de desempeño y perfil listo para selección.', en: 'In-depth analysis, technical and behavioural competencies, KPIs and a hiring-ready profile.' } },

      // ───────── RRHH · Complementos ─────────
      { id: 'aviso', line: 'rrhh', sec: 'comp', type: 'qty', max: 5, price: 70000, usd: 160,
        unit: { es: 'aviso', en: 'post' },
        name: { es: 'Aviso de trabajo en LinkedIn', en: 'LinkedIn job post' },
        desc: { es: 'Redactamos y publicamos tu aviso para atraer a los candidatos correctos.', en: 'We write and publish your job post to attract the right candidates.' } },
      { id: 'busqueda', line: 'rrhh', sec: 'comp', type: 'qty', max: 5, price: 150000, usd: 330,
        unit: { es: 'búsqueda', en: 'search' },
        name: { es: 'Búsqueda activa de candidatos', en: 'Active candidate sourcing' },
        desc: { es: 'Buscamos en LinkedIn y portales y te entregamos una lista de perfiles que cumplen los requisitos.', en: 'We search LinkedIn and job boards and send you a list of matching profiles.' } },
      { id: 'entrevista', line: 'rrhh', sec: 'comp', type: 'qty', max: 20, price: 80000, usd: 180,
        unit: { es: 'candidato', en: 'candidate' },
        name: { es: 'Entrevista por competencias', en: 'Competency interview' },
        desc: { es: 'Entrevistamos a tus candidatos y te entregamos un resumen con nuestra recomendación.', en: 'We interview your candidates and send a summary with our recommendation.' },
        addon: { id: 'ingles', price: 35000, usd: 80, esOnly: true,
          name: { es: 'Entrevista en inglés', en: 'English interview' },
          desc: { es: 'Conducimos la entrevista íntegramente en inglés.', en: '' } } },
      { id: 'salida', line: 'rrhh', sec: 'comp', type: 'qty', max: 10, price: 60000, usd: 130,
        unit: { es: 'entrevista', en: 'interview' },
        name: { es: 'Entrevista de salida', en: 'Exit interview' },
        desc: { es: 'Conversamos con quien se va y te entregamos aprendizajes concretos para retener a tu equipo.', en: 'We talk to the leaving employee and share concrete lessons to retain your team.' } }
    ]
  };

  // Server-side total. lines: [{ id, qty, addon }]. Returns { total, lines } or throws.
  CATALOG.priceCart = function (lines, lang) {
    var en = lang === 'en', total = 0, out = [];
    if (!Array.isArray(lines) || !lines.length) throw new Error('empty');
    lines.forEach(function (l) {
      var it = CATALOG.items.find(function (x) { return x.id === l.id; });
      if (!it || it.type === 'quote' || (en && it.esOnly)) throw new Error('bad item ' + l.id);
      var max = it.type === 'once' ? 1 : (it.max || 20);
      var qty = Math.floor(Number(l.qty));
      if (!(qty >= 1 && qty <= max)) throw new Error('bad qty ' + l.id);
      // Flow always charges CLP; the English site only displays USD reference prices
      var unit = it.price;
      var sub = unit * qty;
      if (l.addon && it.addon && !(en && it.addon.esOnly)) sub += it.addon.price * qty;
      total += sub;
      out.push({ id: it.id, name: it.name[en ? 'en' : 'es'], qty: qty, price: unit, subtotal: sub, addon: !!(l.addon && it.addon) });
    });
    return { total: total, lines: out };
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = CATALOG;
  else root.VORTEX_CATALOG = CATALOG;
})(typeof window !== 'undefined' ? window : this);
