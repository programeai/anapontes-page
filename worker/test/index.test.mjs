/*
 * Testa o Worker de ponte site -> CRM (ProgrameAI) + Meta CAPI, com o fetch
 * dublado para nada sair para a rede. As chamadas são classificadas por URL:
 * o que vai para `programeai` é o CRM; o que vai para `graph.facebook.com` é
 * o CAPI.
 *
 * Roda com: npm test  (ou node test/index.test.mjs), sem dependência nenhuma.
 *
 * Boa parte das asserções guarda comportamento de LGPD: consentimento
 * obrigatório, allowlist de campos, log sem dado pessoal e — a mais importante —
 * NENHUM dado de saúde (objetivo/prazo/caso) no evento do Meta. Se alguma delas
 * quebrar, o problema é jurídico antes de ser técnico.
 */
import worker from "../src/index.js";

const ORIGIN = "https://www.draanapontes.com.br";
const ENV = {
  CRM_URL: "https://crm.programeai.com.br/api/v1/leads/intake",
  CRM_TOKEN: "crm_segredo-que-nao-vaza",
  PAUSED: "0"
};
const ENV_META = Object.assign({}, ENV, {
  META_PIXEL_ID: "507462508767501",
  META_CAPI_TOKEN: "meta_token_secreto"
});

// Campos que a rota /leads/intake aceita. Qualquer chave fora disto faz o
// ProgrameAI responder 400, então o corpo do CRM precisa ser um subconjunto.
const CRM_ALLOW = [
  "nome", "whatsapp", "origem", "telefone", "email", "empresa",
  "cidade", "mensagem", "pagina", "recebidoEm", "resumo", "cenario", "qualificacao"
];

let chamadas = [];
const fetchReal = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  const corpo = init && init.body ? JSON.parse(init.body) : null;
  chamadas.push({ url: String(url), init: init, corpo: corpo });
  if (String(url).indexOf("graph.facebook.com") !== -1) {
    return new Response(JSON.stringify({ events_received: 1 }), { status: 200 });
  }
  return new Response(JSON.stringify({ status: "criado", clientId: "cli_1" }), { status: 200 });
};
function crmCall() { return chamadas.filter((c) => c.url.indexOf("programeai") !== -1).pop() || null; }
function metaCall() { return chamadas.filter((c) => c.url.indexOf("graph.facebook.com") !== -1).pop() || null; }
function ctxColetor() {
  const ps = [];
  return { waitUntil: (p) => ps.push(p), done: () => Promise.all(ps) };
}

// silencia o console.log do Worker para o output do teste ficar legível
const logs = [];
const logReal = console.log;
console.log = (...a) => logs.push(a.join(" "));

function post(body, headers = {}) {
  const h = Object.assign({ Origin: ORIGIN, "content-type": "text/plain" }, headers);
  return new Request("https://w.dev/lead", { method: "POST", headers: h, body: typeof body === "string" ? body : JSON.stringify(body) });
}

const leadValido = {
  nome: "Maria Clara Souza",
  whatsapp: "(83) 98877-6655",
  consentimento: true,
  objetivo: "preenchimento-labial-natural",
  caso: "já fiz preenchimento labial com produto definitivo, do tipo PMMA",
  prazo: "pretendo começar o quanto antes",
  pagina: "https://www.draanapontes.com.br/objetivos/preenchimento-labial-natural.html",
  event_id: "ev-abc-123",
  utm_source: "meta", utm_medium: "cpc", utm_campaign: "labios-julho",
  fbclid: "IwAR_xyz", fbp: "fb.1.1690000000000.1234567890",
  ms_no_form: 9000
};

let falhas = 0;
function ok(label, cond, extra) {
  logReal((cond ? "  ok   " : "  FALHA") + "  " + label + (extra !== undefined ? "\n         " + extra : ""));
  if (!cond) falhas++;
}

logReal("\n=== rejeições ===");
{
  const r = await worker.fetch(new Request("https://w.dev/lead", { method: "OPTIONS", headers: { Origin: ORIGIN } }), ENV);
  ok("OPTIONS responde 204 com CORS", r.status === 204 && r.headers.get("access-control-allow-origin") === ORIGIN);
}
{
  const r = await worker.fetch(new Request("https://w.dev/lead", { method: "GET" }), ENV);
  const b = await r.json();
  ok("GET é verificação de saúde e não toca no CRM", r.status === 200 && b.ok === true);
}
{
  chamadas = [];
  const r = await worker.fetch(post(leadValido, { Origin: "https://site-clonado.com" }), ENV);
  ok("origem estranha é barrada", r.status === 403 && crmCall() === null);
}
{
  const r = await worker.fetch(new Request("https://w.dev/lead", { method: "PUT", headers: { Origin: ORIGIN } }), ENV);
  ok("método errado é barrado", r.status === 405);
}
{
  const r = await worker.fetch(post("isso não é json"), ENV);
  ok("corpo inválido é barrado", r.status === 400);
}
{
  const r = await worker.fetch(post({ ...leadValido, nome: "x".repeat(9000) }), ENV);
  ok("corpo gigante é barrado antes do parse", r.status === 413);
}
{
  chamadas = [];
  const r = await worker.fetch(post({ ...leadValido, assunto: "viagra" }), ENV);
  ok("armadilha de robô: 204 silencioso e nada vai ao CRM", r.status === 204 && crmCall() === null);
}
{
  const r = await worker.fetch(post({ ...leadValido, ms_no_form: 200 }), ENV);
  ok("preenchimento instantâneo é robô", r.status === 422 && (await r.json()).erro === "tempo");
}
{
  chamadas = [];
  const r = await worker.fetch(post({ ...leadValido, consentimento: false }), ENV);
  ok("sem consentimento nada é enviado (LGPD)", r.status === 422 && crmCall() === null, (await r.json()).erro);
}
{
  chamadas = [];
  const r = await worker.fetch(post({ ...leadValido, consentimento: "true" }), ENV);
  ok("consentimento tem de ser booleano true, não string", r.status === 422 && crmCall() === null);
}
{
  const r = await worker.fetch(post({ ...leadValido, nome: "123456" }), ENV);
  ok("nome sem letra é barrado", r.status === 422 && (await r.json()).erro === "nome");
}
{
  const r = await worker.fetch(post({ ...leadValido, whatsapp: "998" }), ENV);
  ok("telefone curto é barrado", r.status === 422 && (await r.json()).erro === "whatsapp");
}
{
  const r = await worker.fetch(post({ ...leadValido, whatsapp: "5583988776655" }), ENV);
  const c = (chamadas = [], await worker.fetch(post({ ...leadValido, whatsapp: "5583988776655" }), ENV), crmCall());
  ok("55 na frente é aceito e removido", c && c.corpo.whatsapp === "83988776655", c && c.corpo.whatsapp);
}
{
  const r = await worker.fetch(post(leadValido), { ...ENV, PAUSED: "1" });
  ok("interruptor PAUSED desliga sem redeploy", r.status === 204);
}
{
  chamadas = [];
  const r = await worker.fetch(post(leadValido), { PAUSED: "0" });
  ok("sem CRM configurado devolve 503 em vez de vazar erro", r.status === 503 && crmCall() === null);
}

logReal("\n=== caminho feliz (CRM ProgrameAI) ===");
{
  chamadas = [];
  const r = await worker.fetch(post(leadValido), ENV);
  ok("responde 204", r.status === 204);
  const call = crmCall();
  const c = call.corpo;
  ok("vai para o endpoint do ProgrameAI", call.url === ENV.CRM_URL, call.url);
  ok("token vai no header Bearer e não no corpo",
    call.init.headers.authorization === "Bearer crm_segredo-que-nao-vaza" &&
    JSON.stringify(c).indexOf("crm_segredo-que-nao-vaza") === -1);
  ok("whatsapp com 10-11 dígitos, sem o 55 (formato do ProgrameAI)", c.whatsapp === "83988776655", c.whatsapp);
  ok("telefone internacional no campo próprio", c.telefone === "+5583988776655", c.telefone);
  ok("nome com espaços colapsados", c.nome === "Maria Clara Souza");
  ok("origem é o caminho da página (vira tag)", c.origem === "objetivos/preenchimento-labial-natural", c.origem);
  ok("pagina é só o path", c.pagina === "/objetivos/preenchimento-labial-natural.html", c.pagina);
  ok("cenario carrega o objetivo (aparece no aviso de lead novo)", c.cenario === "preenchimento-labial-natural", c.cenario);
  ok("resumo dobra quiz + atribuição (o ProgrameAI não tem campo de UTM)",
    c.resumo.indexOf("preenchimento-labial-natural") !== -1 &&
    c.resumo.indexOf("o quanto antes") !== -1 &&
    c.resumo.indexOf("PMMA") !== -1 &&
    c.resumo.indexOf("labios-julho") !== -1, c.resumo);
  ok("data do recebimento é registrada", !!Date.parse(c.recebidoEm));
  ok("corpo só tem campos que o ProgrameAI aceita (o resto daria 400)",
    Object.keys(c).every((k) => CRM_ALLOW.indexOf(k) !== -1), Object.keys(c).join(","));
  ok("caso NÃO é chave de topo, nem existe custom_fields",
    !("caso" in c) && !("custom_fields" in c) && !("event_id" in c) && !("fbp" in c));
}

logReal("\n=== Meta CAPI (evento Lead server-side) ===");
{
  // Valores-sentinela para o quiz, propositalmente diferentes de qualquer coisa
  // que apareça na URL, para que o teste de vazamento não confunda o conteúdo
  // do quiz com o `event_source_url` (que é a URL da página e vai ao pixel de
  // forma inerente e legítima).
  const leadSaude = Object.assign({}, leadValido, {
    objetivo: "ZZOBJETIVOZZ",
    caso: "ZZCASOZZ-produto-definitivo",
    prazo: "ZZPRAZOZZ",
    pagina: "https://www.draanapontes.com.br/lp/preenchimento-labial-contorno/"
  });
  chamadas = [];
  const ctx = ctxColetor();
  const r = await worker.fetch(post(leadSaude), ENV_META, ctx);
  await ctx.done();
  ok("responde 204 mesmo com o CAPI ligado", r.status === 204);
  const call = metaCall();
  ok("chama o graph do Meta com pixel e token", !!call &&
    call.url.indexOf("/507462508767501/events") !== -1 &&
    call.url.indexOf("access_token=meta_token_secreto") !== -1, call && call.url);
  const ev = call.corpo.data[0];
  ok("evento é Lead, website, com o mesmo event_id do pixel (dedup)",
    ev.event_name === "Lead" && ev.action_source === "website" && ev.event_id === "ev-abc-123");
  ok("telefone vai HASHEADO (sha-256 hex), nunca cru",
    /^[a-f0-9]{64}$/.test(ev.user_data.ph[0]) &&
    JSON.stringify(call.corpo).indexOf("83988776655") === -1, ev.user_data.ph[0]);
  ok("nome vai hasheado", /^[a-f0-9]{64}$/.test(ev.user_data.fn[0]) &&
    JSON.stringify(call.corpo).indexOf("Maria") === -1);
  ok("fbc montado e fbp repassado (não hasheados, é o formato do Meta)",
    /^fb\.1\.\d{13}\.IwAR_xyz$/.test(ev.user_data.fbc) && ev.user_data.fbp === leadSaude.fbp);
  const s = JSON.stringify(call.corpo);
  ok("NENHUM dado de saúde no evento do Meta (respostas do quiz não vazam)",
    s.indexOf("ZZOBJETIVOZZ") === -1 &&
    s.indexOf("ZZCASOZZ") === -1 &&
    s.indexOf("ZZPRAZOZZ") === -1, s);
}
{
  chamadas = [];
  await worker.fetch(post(leadValido), ENV);   // sem segredos do Meta
  ok("sem token do Meta configurado, nenhum evento é disparado", metaCall() === null);
}

logReal("\n=== log não pode conter dado pessoal (LGPD) ===");
{
  const tudo = logs.join(" | ");
  ok("log sem nome", tudo.indexOf("Maria") === -1);
  ok("log sem telefone", tudo.indexOf("988776655") === -1 && tudo.indexOf("5583988776655") === -1);
  ok("log sem resposta de caso", tudo.toLowerCase().indexOf("pmma") === -1);
  ok("log traz diagnóstico útil", /crm=200/.test(tudo) && /pagina=preenchimento-labial-natural/.test(tudo) && /campanha=labios-julho/.test(tudo) && /atribuicao=sim/.test(tudo), tudo);
}

logReal("\n=== campo não previsto não passa adiante ===");
{
  chamadas = [];
  await worker.fetch(post({ ...leadValido, admin: true, role: "owner", valor_pago: 9999 }), ENV);
  const s = JSON.stringify(crmCall().corpo);
  ok("allowlist de entrada descarta campo injetado",
    s.indexOf("admin") === -1 && s.indexOf("valor_pago") === -1 && s.indexOf("owner") === -1);
}

logReal("\n=== limite por IP (KV vinculado) ===");
{
  const mem = new Map();
  const envRL = { ...ENV, RL: {
    get: async (k) => mem.get(k) || null,
    put: async (k, v) => { mem.set(k, v); }
  }};
  let ultimo = 0;
  for (let i = 0; i < 14; i++) {
    const req = new Request("https://w.dev/lead", {
      method: "POST",
      headers: { Origin: ORIGIN, "content-type": "text/plain", "CF-Connecting-IP": "203.0.113.7" },
      body: JSON.stringify(leadValido)
    });
    ultimo = (await worker.fetch(req, envRL)).status;
  }
  ok("13º envio do mesmo IP é bloqueado", ultimo === 429, "último status: " + ultimo);
}

console.log = logReal;
globalThis.fetch = fetchReal;
logReal(falhas === 0 ? "\nTODOS OS TESTES PASSARAM" : "\n" + falhas + " FALHA(S)");
process.exit(falhas ? 1 : 0);
