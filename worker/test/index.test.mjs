/*
 * Testa o Worker de ponte site -> CRM, com o fetch do CRM dublado para nada
 * sair para a rede.
 *
 * Roda com: npm test  (ou node test/index.test.mjs), sem dependência nenhuma.
 *
 * Boa parte das asserções guarda comportamento de LGPD: consentimento
 * obrigatório, allowlist de campos e log sem dado pessoal. Se alguma delas
 * quebrar, o problema é jurídico antes de ser técnico.
 */
import worker from "../src/index.js";

const ORIGIN = "https://www.draanapontes.com.br";
const ENV = { CRM_URL: "https://crm.exemplo/api/leads", CRM_TOKEN: "segredo-que-nao-vaza", PAUSED: "0" };

let capturado = null;
const fetchReal = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  capturado = { url, init, corpo: JSON.parse(init.body) };
  return new Response(JSON.stringify({ id: "lead_1" }), { status: 201 });
};

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
  capturado = null;
  const r = await worker.fetch(post(leadValido, { Origin: "https://site-clonado.com" }), ENV);
  ok("origem estranha é barrada", r.status === 403 && capturado === null);
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
  capturado = null;
  const r = await worker.fetch(post({ ...leadValido, assunto: "viagra" }), ENV);
  ok("armadilha de robô: 204 silencioso e nada vai ao CRM", r.status === 204 && capturado === null);
}
{
  const r = await worker.fetch(post({ ...leadValido, ms_no_form: 200 }), ENV);
  ok("preenchimento instantâneo é robô", r.status === 422 && (await r.json()).erro === "tempo");
}
{
  capturado = null;
  const r = await worker.fetch(post({ ...leadValido, consentimento: false }), ENV);
  ok("sem consentimento nada é enviado (LGPD)", r.status === 422 && capturado === null, (await r.json()).erro);
}
{
  capturado = null;
  const r = await worker.fetch(post({ ...leadValido, consentimento: "true" }), ENV);
  ok("consentimento tem de ser booleano true, não string", r.status === 422 && capturado === null);
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
  const r = await worker.fetch(post(leadValido), { ...ENV, PAUSED: "1" });
  ok("interruptor PAUSED desliga sem redeploy", r.status === 204);
}
{
  capturado = null;
  const r = await worker.fetch(post(leadValido), { PAUSED: "0" });
  ok("sem CRM configurado devolve 503 em vez de vazar erro", r.status === 503 && capturado === null);
}

logReal("\n=== caminho feliz ===");
{
  capturado = null;
  const r = await worker.fetch(post(leadValido), ENV);
  ok("responde 204", r.status === 204);
  const c = capturado.corpo;
  ok("token vai no header e não no corpo",
    capturado.init.headers.authorization === "Bearer segredo-que-nao-vaza" &&
    JSON.stringify(c).indexOf("segredo-que-nao-vaza") === -1);
  ok("telefone normalizado para o formato do CAPI", c.phone === "5583988776655", c.phone);
  ok("nome com espaços colapsados", c.name === "Maria Clara Souza");
  ok("fbc montado no formato fb.1.<ts>.<fbclid>", /^fb\.1\.\d{13}\.IwAR_xyz$/.test(c.fbc), c.fbc);
  ok("fbp repassado como veio", c.fbp === leadValido.fbp);
  ok("atribuição completa chega ao CRM",
    c.utm_campaign === "labios-julho" && c.utm_source === "meta" && c.event_id === "ev-abc-123");
  ok("ip e user-agent vão explícitos (senão o CAPI casa contra o IP do CRM)",
    "client_ip_address" in c && "client_user_agent" in c);
  ok("resposta de caso fica isolada em custom_fields",
    c.custom_fields.caso === leadValido.caso && !("caso" in c),
    JSON.stringify(c.custom_fields));
  ok("data do consentimento é registrada", !!Date.parse(c.custom_fields.consentimento_em));
}

logReal("\n=== log não pode conter dado pessoal (LGPD) ===");
{
  const tudo = logs.join(" | ");
  ok("log sem nome", tudo.indexOf("Maria") === -1);
  ok("log sem telefone", tudo.indexOf("988776655") === -1 && tudo.indexOf("5583988776655") === -1);
  ok("log sem resposta de caso", tudo.toLowerCase().indexOf("pmma") === -1);
  ok("log traz diagnóstico útil", /crm=201/.test(tudo) && /pagina=preenchimento-labial-natural/.test(tudo) && /campanha=labios-julho/.test(tudo) && /atribuicao=sim/.test(tudo), tudo);
}

logReal("\n=== campo não previsto não passa para o CRM ===");
{
  capturado = null;
  await worker.fetch(post({ ...leadValido, admin: true, role: "owner", valor_pago: 9999 }), ENV);
  const s = JSON.stringify(capturado.corpo);
  ok("allowlist descarta campo injetado",
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
