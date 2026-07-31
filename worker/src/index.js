/*
 * Ponte site -> CRM — Dra. Ana Pontes
 * ---------------------------------------------------------------------------
 * O site é estático (GitHub Pages), e o CRM entrega um token que não pode ser
 * exposto: qualquer chave em JavaScript de página é pública. Este Worker existe
 * só para guardar esse token e repassar o lead da banda de qualificação.
 *
 * Ele NÃO fala com o Meta. O CRM tem integração nativa de CAPI e é ele que
 * dispara os eventos a partir do estágio do lead (novo -> agendou -> compareceu).
 * O papel do Worker é entregar ao CRM os dados de atribuição que essa integração
 * precisa para casar o evento com o clique no anúncio.
 *
 * ATENÇÃO, e isso vale mais que o resto: o lead carrega a resposta de caso da
 * paciente ("já fiz preenchimento com produto definitivo"), que é dado de saúde.
 * Ela pode ficar no CRM, com consentimento, mas NÃO pode ser enviada ao Meta.
 * Os Termos das Ferramentas de Negócios proíbem dado que revele condição ou
 * tratamento, e a penalidade cai sobre a conta de anúncios inteira. Ver o README.
 */

const ALLOWED_ORIGINS = [
  "https://www.draanapontes.com.br",
  "https://draanapontes.com.br",
  "http://localhost:8899"
];

// Campos aceitos do navegador. É allowlist de propósito: sem isso, qualquer um
// pode injetar campo arbitrário no CRM fazendo POST direto no endpoint.
const CAMPOS = [
  "nome", "whatsapp", "consentimento",
  "objetivo", "caso", "prazo",
  "pagina", "event_id",
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "gclid", "fbclid", "fbp"
];

const LIMITE_JANELA_S = 600;
const LIMITE_ENVIOS = 12;
const MIN_MS_NO_FORM = 1500;   // menos que isso é robô, não é gente digitando
const MAX_MS_NO_FORM = 6 * 60 * 60 * 1000;

function json(status, body) {
  return new Response(body ? JSON.stringify(body) : null, {
    status: status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

function corsHeaders(origin) {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    "vary": "Origin"
  };
}

// Normaliza para o formato que o CAPI usa para casar telefone: só dígitos, com
// código do país. 10 ou 11 dígitos vêm sem o 55 e recebem o prefixo.
function normalizaTelefone(raw) {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.length === 10 || d.length === 11) { d = "55" + d; }
  if (d.slice(0, 2) !== "55") { return null; }
  if (d.length !== 12 && d.length !== 13) { return null; }
  return d;
}

function limpaNome(raw) {
  const n = String(raw || "").replace(/\s+/g, " ").trim();
  if (n.length < 2 || n.length > 80) { return null; }
  if (!/[a-zà-ÿ]/i.test(n)) { return null; }   // só números ou símbolos não é nome
  return n;
}

function texto(raw, max) {
  const s = String(raw == null ? "" : raw).trim();
  return s.length > max ? s.slice(0, max) : s;
}

/* ---------------------------------------------------------------------------
 * Adaptador do CRM — a ÚNICA parte que muda de CRM para CRM.
 *
 * Confirmar três coisas no painel antes de publicar:
 *   1. a URL de criação de lead e o método;
 *   2. o esquema de autenticação (Bearer, header próprio, chave em query);
 *   3. os nomes dos campos personalizados (`caso`, `prazo`, `fbclid`, `fbp`),
 *      porque campo que não existe no CRM costuma ser descartado em silêncio.
 * ------------------------------------------------------------------------ */
function montaRequisicaoCrm(lead, env) {
  return {
    url: env.CRM_URL,
    metodo: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": "Bearer " + env.CRM_TOKEN,
      "accept": "application/json"
    },
    corpo: {
      name: lead.nome,
      phone: lead.whatsapp,
      source: "site-objetivos",
      // origem da campanha: é o que a integração de CAPI do CRM usa para casar
      // o evento com o clique. Sem isso o evento chega ao Meta sem âncora.
      utm_source: lead.utm_source,
      utm_medium: lead.utm_medium,
      utm_campaign: lead.utm_campaign,
      utm_content: lead.utm_content,
      utm_term: lead.utm_term,
      gclid: lead.gclid,
      fbclid: lead.fbclid,
      fbc: lead.fbc,
      fbp: lead.fbp,
      event_id: lead.event_id,
      event_source_url: lead.pagina,
      client_ip_address: lead.ip,
      client_user_agent: lead.ua,
      // Campos de contexto clínico. NÃO devem sair do CRM para o Meta.
      custom_fields: {
        objetivo: lead.objetivo,
        caso: lead.caso,
        prazo: lead.prazo,
        consentimento_em: lead.consentimento_em
      }
    }
  };
}

async function limitado(env, ip) {
  if (!env.RL || !ip) { return false; }   // sem KV vinculado, segue sem limite
  const chave = "rl:" + ip;
  const atual = parseInt((await env.RL.get(chave)) || "0", 10);
  if (atual >= LIMITE_ENVIOS) { return true; }
  await env.RL.put(chave, String(atual + 1), { expirationTtl: LIMITE_JANELA_S });
  return false;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const permitida = ALLOWED_ORIGINS.indexOf(origin) !== -1;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(permitida ? origin : "null") });
    }

    // Verificação de saúde, sem tocar no CRM.
    if (request.method === "GET") {
      return json(200, { ok: true, pausado: env.PAUSED === "1" });
    }

    if (request.method !== "POST") {
      return json(405, { erro: "metodo" });
    }
    if (!permitida) {
      return json(403, { erro: "origem" });
    }

    // Interruptor de emergência: se o endpoint virar alvo de spam, `PAUSED=1`
    // desliga sem redeploy. Responde 204 para não ensinar o robô.
    if (env.PAUSED === "1") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // O navegador manda via sendBeacon com text/plain de propósito: é requisição
    // simples, então não há preflight, e o envio sobrevive à página sendo
    // trocada pelo WhatsApp. O corpo é JSON mesmo assim.
    let dados;
    try {
      const bruto = await request.text();
      if (!bruto || bruto.length > 8000) { return json(413, { erro: "tamanho" }); }
      dados = JSON.parse(bruto);
    } catch (e) {
      return json(400, { erro: "json" });
    }
    if (!dados || typeof dados !== "object") { return json(400, { erro: "corpo" }); }

    // Armadilha de robô: campo escondido que gente não preenche.
    if (texto(dados.assunto, 1)) {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    const decorrido = Number(dados.ms_no_form);
    if (!isFinite(decorrido) || decorrido < MIN_MS_NO_FORM || decorrido > MAX_MS_NO_FORM) {
      return json(422, { erro: "tempo" });
    }

    // Consentimento é requisito, não detalhe: a resposta de caso é dado pessoal
    // sensível de saúde (LGPD, art. 5º, II) e depende de consentimento
    // específico e destacado. Sem marcação afirmativa, nada é enviado ao CRM.
    if (dados.consentimento !== true) {
      return json(422, { erro: "consentimento" });
    }

    const nome = limpaNome(dados.nome);
    const whatsapp = normalizaTelefone(dados.whatsapp);
    if (!nome) { return json(422, { erro: "nome" }); }
    if (!whatsapp) { return json(422, { erro: "whatsapp" }); }

    const ip = request.headers.get("CF-Connecting-IP") || "";
    if (await limitado(env, ip)) {
      return json(429, { erro: "limite" });
    }

    const lead = {};
    CAMPOS.forEach(function (c) { lead[c] = texto(dados[c], 300); });
    lead.nome = nome;
    lead.whatsapp = whatsapp;
    lead.ip = ip;
    lead.ua = request.headers.get("User-Agent") || "";
    lead.consentimento_em = new Date().toISOString();
    // O Meta espera o clique no formato fb.1.<timestamp>.<fbclid>, e não o
    // fbclid cru. Montar aqui evita depender de o CRM saber fazer isso.
    lead.fbc = lead.fbclid ? "fb.1." + Date.now() + "." + lead.fbclid : "";

    if (!env.CRM_URL || !env.CRM_TOKEN) {
      console.log("crm=nao-configurado");
      return json(503, { erro: "crm" });
    }

    const req = montaRequisicaoCrm(lead, env);
    let resposta;
    try {
      resposta = await fetch(req.url, {
        method: req.metodo,
        headers: req.headers,
        body: JSON.stringify(req.corpo)
      });
    } catch (e) {
      console.log("crm=falha-rede");
      return json(502, { erro: "crm" });
    }

    // Log sem dado pessoal, de propósito: nome, telefone e resposta de caso
    // nunca vão para o log do Worker. Da página vai só o slug.
    const slug = (lead.pagina || "").split("/").pop().replace(/\.html.*$/, "") || "?";
    console.log(
      "crm=" + resposta.status +
      " pagina=" + slug +
      " campanha=" + (lead.utm_campaign || "-") +
      " atribuicao=" + (lead.fbclid || lead.gclid ? "sim" : "nao")
    );

    if (!resposta.ok) { return json(502, { erro: "crm", status: resposta.status }); }
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
};
