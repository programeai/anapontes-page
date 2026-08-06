/*
 * Ponte site -> CRM (ProgrameAI) + Meta CAPI — Dra. Ana Pontes
 * ---------------------------------------------------------------------------
 * O site é estático (GitHub Pages), e tanto a chave do CRM quanto o token da
 * CAPI do Meta são segredos que não podem viver no JavaScript da página. Este
 * Worker guarda esses segredos e faz, para cada lead do formulário de
 * qualificação, DUAS coisas independentes:
 *
 *   1. Entrega o lead ao CRM ProgrameAI (POST /api/v1/leads/intake). O CRM abre
 *      o cliente com status Lead e avisa a equipe. É o registro do contato.
 *   2. Dispara o evento `Lead` para o Meta pela Conversions API (server-side).
 *      O ProgrameAI NÃO fala com o Meta, então quem faz o CAPI é este Worker.
 *      Server-side sobrevive ao ITP do Safari (o público é iPhone) e casa por
 *      telefone hasheado, muito melhor que o `fbclid` sozinho.
 *
 * As duas são separadas de propósito: uma pode falhar sem derrubar a outra, e
 * o navegador manda por sendBeacon e ignora a resposta (se algo cair, a
 * paciente vai ao WhatsApp do mesmo jeito: perde-se o registro, nunca a conversa).
 *
 * ATENÇÃO, e isso vale mais que o resto: o lead carrega a resposta de `caso`
 * ("já fiz preenchimento com produto definitivo"), que é dado de saúde.
 *   - No CRM PODE, com consentimento: é registro legítimo de atendimento.
 *   - No Meta NÃO PODE. Os Termos das Ferramentas de Negócios proíbem dado que
 *     revele condição ou tratamento, e a penalidade cai sobre a conta de
 *     anúncios inteira. Por isso o evento do CAPI leva SÓ identificadores
 *     (telefone/nome hasheados, fbc/fbp, IP, UA) e NENHUM campo clínico.
 */

const ALLOWED_ORIGINS = [
  "https://www.draanapontes.com.br",
  "https://draanapontes.com.br",
  "http://localhost:8899"
];

// Campos aceitos do navegador. É allowlist de propósito: sem isso, qualquer um
// pode injetar campo arbitrário fazendo POST direto no endpoint.
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

const META_API = "https://graph.facebook.com/v21.0";

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

// O ProgrameAI quer o WhatsApp com 10 ou 11 dígitos, DDD na frente e SEM o 55.
// Devolve só os dígitos locais (sem código do país) ou null. Se vier com o 55,
// tira; o formato internacional (+55...) é montado à parte, no campo `telefone`.
function normalizaTelefone(raw) {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.length === 12 || d.length === 13) {
    if (d.slice(0, 2) !== "55") { return null; }
    d = d.slice(2);
  }
  if (d.length !== 10 && d.length !== 11) { return null; }
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

// Path da URL da página (sem host, query nem hash), para o campo `pagina` do CRM
// e para o `event_source_url` do CAPI. Limite de 200 como a rota pede.
function caminhoDaPagina(pagina) {
  try { return new URL(pagina).pathname.slice(0, 200); } catch (e) {}
  return String(pagina || "").slice(0, 200);
}

// Rótulo de origem para o CRM (vira tag do cliente e 1ª linha da nota). Ex.:
// "/lp/preenchimento-labial-contorno/" -> "lp/preenchimento-labial-contorno".
function origemDaPagina(pagina) {
  const limpo = caminhoDaPagina(pagina).replace(/\.html.*$/, "").replace(/^\/+|\/+$/g, "");
  return texto(limpo || "site", 60);
}

// Slug curto só para o log (sem dado pessoal).
function slugDaPagina(pagina) {
  const seg = caminhoDaPagina(pagina).replace(/\/+$/, "").split("/").filter(Boolean).pop() || "site";
  return seg.replace(/\.html.*$/, "");
}

/* ---------------------------------------------------------------------------
 * Adaptador do CRM ProgrameAI — a ÚNICA parte que muda de CRM para CRM.
 *
 * A rota /api/v1/leads/intake aceita EXATAMENTE 13 campos e devolve 400 para
 * qualquer chave fora da lista. Só três são obrigatórios (nome, whatsapp,
 * origem). Como ela não tem campos estruturados de UTM nem de quiz, a
 * atribuição da campanha e as respostas (objetivo/prazo/caso) vão dobradas em
 * `resumo` e `cenario`, que é onde a doc manda pôr o que não cabe nos campos.
 *
 * A resposta de `caso` (dado de saúde) fica no CRM com consentimento — nunca
 * no evento do Meta (isso é tratado em enviaMetaCapi, que não a recebe).
 * ------------------------------------------------------------------------ */
function montaRequisicaoCrm(lead, env) {
  const partes = [];
  if (lead.objetivo) { partes.push("Objetivo: " + lead.objetivo + "."); }
  if (lead.prazo) { partes.push("Prazo: " + lead.prazo + "."); }
  if (lead.caso) { partes.push("Situação relatada: " + lead.caso + "."); }

  const atrib = [];
  if (lead.utm_source || lead.utm_medium) { atrib.push((lead.utm_source || "?") + "/" + (lead.utm_medium || "?")); }
  if (lead.utm_campaign) { atrib.push("campanha " + lead.utm_campaign); }
  if (lead.utm_content) { atrib.push(lead.utm_content); }
  if (lead.utm_term) { atrib.push("termo " + lead.utm_term); }
  if (atrib.length) { partes.push("Origem: " + atrib.join(" · ") + "."); }
  if (lead.fbclid) { partes.push("Clique de anúncio no Meta."); }
  else if (lead.gclid) { partes.push("Clique de anúncio no Google."); }

  const corpo = {
    // Obrigatórios.
    nome: lead.nome,
    whatsapp: lead.whatsapp,                  // 10-11 dígitos, sem o 55
    origem: lead.origem,
    // Opcionais aceitos pela rota.
    telefone: "+55" + lead.whatsapp,
    pagina: lead.caminho,
    recebidoEm: lead.consentimento_em,
    cenario: texto(lead.objetivo || lead.caso || "", 160),
    resumo: texto(partes.join(" "), 4000)
  };

  return {
    url: env.CRM_URL,
    metodo: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": "Bearer " + env.CRM_TOKEN,
      "accept": "application/json"
    },
    corpo: corpo
  };
}

// SHA-256 em hex, como o CAPI espera para os campos de identificação.
async function sha256hex(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.prototype.map.call(new Uint8Array(buf), function (b) {
    return b.toString(16).padStart(2, "0");
  }).join("");
}

/* ---------------------------------------------------------------------------
 * Meta Conversions API — evento `Lead` server-side.
 *
 * Leva SÓ identificadores, e todos hasheados quando é PII (telefone, nome).
 * fbc/fbp/IP/UA não são hasheados (é o formato que o Meta espera). NENHUM campo
 * clínico entra aqui: sem objetivo, sem prazo e sem caso. O `event_id` é o
 * mesmo do pixel do navegador, para o Meta deduplicar as duas vias.
 * ------------------------------------------------------------------------ */
async function enviaMetaCapi(lead, env) {
  const user = {};
  user.ph = [await sha256hex("55" + lead.whatsapp)];   // telefone com código do país, hasheado
  const primeiro = String(lead.nome).split(" ")[0].trim().toLowerCase();
  if (primeiro) { user.fn = [await sha256hex(primeiro)]; }
  if (lead.fbc) { user.fbc = lead.fbc; }
  if (lead.fbp) { user.fbp = lead.fbp; }
  if (lead.ip) { user.client_ip_address = lead.ip; }
  if (lead.ua) { user.client_user_agent = lead.ua; }

  const evento = {
    event_name: "Lead",
    event_time: Math.floor(Date.now() / 1000),
    action_source: "website",
    user_data: user
  };
  if (lead.event_id) { evento.event_id = lead.event_id; }
  if (lead.pagina) { evento.event_source_url = lead.pagina; }

  const body = { data: [evento] };
  if (env.META_TEST_EVENT_CODE) { body.test_event_code = env.META_TEST_EVENT_CODE; }

  const url = META_API + "/" + env.META_PIXEL_ID +
    "/events?access_token=" + encodeURIComponent(env.META_CAPI_TOKEN);
  return fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
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
  async fetch(request, env, ctx) {
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
    // específico e destacado. Sem marcação afirmativa, nada é enviado.
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
    lead.caminho = caminhoDaPagina(lead.pagina);
    lead.origem = origemDaPagina(lead.pagina);
    // O Meta espera o clique no formato fb.1.<timestamp>.<fbclid>, não o cru.
    lead.fbc = lead.fbclid ? "fb.1." + Date.now() + "." + lead.fbclid : "";

    if (!env.CRM_URL || !env.CRM_TOKEN) {
      console.log("crm=nao-configurado");
      return json(503, { erro: "crm" });
    }

    // Dispara o CAPI em paralelo, best-effort: não bloqueia a resposta nem
    // depende do CRM. Fica de fora se os segredos do Meta não estiverem no ar.
    if (env.META_PIXEL_ID && env.META_CAPI_TOKEN) {
      const capi = enviaMetaCapi(lead, env)
        .then(function (r) { console.log("meta=" + r.status); })
        .catch(function () { console.log("meta=falha-rede"); });
      if (ctx && ctx.waitUntil) { ctx.waitUntil(capi); }
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
    console.log(
      "crm=" + resposta.status +
      " pagina=" + slugDaPagina(lead.pagina) +
      " campanha=" + (lead.utm_campaign || "-") +
      " atribuicao=" + (lead.fbclid || lead.gclid ? "sim" : "nao")
    );

    if (!resposta.ok) { return json(502, { erro: "crm", status: resposta.status }); }
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
};
