# Ponte site → CRM (ProgrameAI) + Meta CAPI (Cloudflare Worker)

O site é estático no GitHub Pages e dois segredos não podem viver no JavaScript da
página: a chave do canal de captação do CRM e o token da Conversions API do Meta.
Qualquer chave em JS de página é pública. Este Worker guarda esses segredos e, para
cada lead do formulário de qualificação das LPs (`/lp/` e `/objetivos/`), faz duas
coisas independentes.

## O que ele faz, e o que ele não faz

| Faz | Não faz |
|---|---|
| Guarda `CRM_TOKEN` e `META_CAPI_TOKEN` fora do navegador | Não guarda dado nenhum (não há banco) |
| Grava o lead no CRM ProgrameAI (`/api/v1/leads/intake`) | Não registra dado pessoal em log |
| Dispara o evento `Lead` para o Meta pela CAPI (server-side) | Não decide indicação clínica |
| Barra robô, limita envios, tem interruptor | Não manda dado de saúde ao Meta |

**Por que o CAPI vive aqui e não no CRM:** o ProgrameAI é um CRM de captação e
notificação, ele **não tem integração com o Meta**. Então quem dispara o `Lead`
server-side é este Worker. Server-side importa porque o público da Dra. Ana é
majoritariamente iPhone/Safari, onde o ITP limita o `_fbp` do pixel de navegador a
7 dias; o evento do Worker sobrevive a isso e casa por telefone hasheado, muito
melhor que o `fbclid` sozinho. O `event_id` é o mesmo do pixel do navegador, então
o Meta **deduplica** as duas vias.

## ⚠️ A regra que não pode ser quebrada

O lead carrega a **resposta de caso** da paciente, do tipo *"já fiz preenchimento com
produto definitivo"*. Isso é dado pessoal sensível de saúde.

- **No CRM pode**, com consentimento: é registro legítimo de atendimento. Vai dentro
  de `resumo`/`cenario`, porque o ProgrameAI não tem campo estruturado para isso.
- **No Meta não pode.** Os Termos das Ferramentas de Negócios proíbem enviar dado que
  revele condição ou tratamento de saúde, e a penalidade cai sobre a conta de anúncios,
  não sobre o evento. É a mesma decisão de [../docs/rastreamento-gtm.md](../docs/rastreamento-gtm.md)
  §4.4/§4.5.

Por isso o evento do CAPI (`enviaMetaCapi`) leva **só identificadores**: telefone e
nome hasheados (SHA-256), `fbc`, `fbp`, IP e User-Agent. Nenhum campo de quiz
(`objetivo`, `prazo`, `caso`) entra ali. O teste `NENHUM dado de saúde no evento do
Meta` guarda isso; se quebrar, o problema é jurídico antes de técnico.

## Publicar

```bash
cd worker
npx wrangler login
npx wrangler secret put CRM_TOKEN         # chave do canal de captação (crm_...)
npx wrangler secret put META_CAPI_TOKEN   # token da Conversions API (System User)
npx wrangler deploy
```

`CRM_URL` e `META_PIXEL_ID` já estão preenchidos em [wrangler.toml](wrangler.toml) (não
são segredo). Sem `META_CAPI_TOKEN`, o Worker **segue gravando no CRM** e só não dispara
o CAPI, então dá para subir em duas etapas.

Limitação de envios por IP (opcional, recomendada quando o tráfego pago subir):

```bash
npx wrangler kv namespace create RL   # descomentar o bloco kv_namespaces com o id
npx wrangler deploy
```

## Endereço

Sem DNS na Cloudflare, o Worker responde em `https://dap-lead-bridge.<subdominio>.workers.dev`.
Com o domínio na Cloudflare, dá para usar `api.draanapontes.com.br/lead` (bloco `routes`
no `wrangler.toml`). As duas formas funcionam: o navegador manda `text/plain`, que é
requisição simples e não gera preflight de CORS.

A URL escolhida entra em `LP_CONFIG.leadEndpoint`, no topo de [../js/lp.js](../js/lp.js).
**Enquanto ela estiver vazia, o formulário funciona** (valida, dispara os eventos do
dataLayer e leva ao WhatsApp), só não grava o lead nem dispara o CAPI.

## O canal de captação no ProgrameAI

O `CRM_TOKEN` é a **chave de um canal**, criada em **Administração → Captação → Novo
canal**. Vale saber:

- Responsável e fonte do lead são configuração **do canal**, não do payload. Quem
  administra a workspace escolhe quem atende; o Worker não manda isso.
- A chave aparece **uma única vez** ao salvar. Se perder, rotacione (a antiga morre na
  hora, sem convivência) e troque o secret com `wrangler secret put CRM_TOKEN`.
- Crie **um canal por origem** se quiser roteamento diferente; cada canal tem a sua
  chave e revogar uma não derruba as outras.
- A coluna **Último uso** confirma que a integração está viva. "Nunca usada" quase
  sempre é chave errada no Worker.

## Adaptar o payload (`montaRequisicaoCrm`)

A rota `/api/v1/leads/intake` aceita **13 campos** e devolve **400** para qualquer chave
fora da lista (é de propósito: dado descartado em silêncio é pior). Só `nome`,
`whatsapp` e `origem` são obrigatórios. Como ela não tem campos de UTM nem de quiz, a
atribuição e as respostas vão dobradas em `resumo`/`cenario`, que é onde a doc do CRM
manda pôr o que não cabe. Detalhes que o Worker já trata:

- **`whatsapp`**: 10 ou 11 dígitos, DDD na frente, **sem o 55**. `normalizaTelefone`
  tira o `55` se vier. O formato internacional vai no campo `telefone` (`+55...`).
- **`origem`**: o caminho da página (`lp/preenchimento-labial-contorno`). Vira tag do
  cliente e 1ª linha da nota.
- **`cenario`**: o objetivo do quiz, que aparece no aviso de "lead novo".
- **`resumo`**: objetivo + prazo + caso + atribuição, em texto corrido.

## Defesas

| Camada | Comportamento |
|---|---|
| Origem | só `www.draanapontes.com.br`, o domínio sem `www` e `localhost:8899` |
| Allowlist de entrada | o que o navegador manda fora da lista `CAMPOS` é descartado |
| Armadilha | campo escondido `assunto`; preenchido, responde 204 e ignora |
| Tempo no formulário | menos de 1,5 s é robô; mais de 6 h é sessão velha |
| Consentimento | `false` ou ausente, nada é enviado (nem CRM nem Meta) |
| Telefone | normalizado; inválido é barrado antes de qualquer envio |
| Limite | 12 envios por IP a cada 10 min (exige o KV) |
| Interruptor | `PAUSED=1` desliga sem redeploy |

Se aparecer spam mesmo assim, o próximo degrau é o Turnstile da Cloudflare, gratuito e
nativo aqui. Fica de fora por ora para não pôr mais um script na LP.

## Testes

```bash
cd worker && npm test
```

Roda sem dependência nenhuma (Node puro, `fetch` do CRM e do Meta dublados, nada sai
para a rede). As chamadas são separadas por URL: `programeai` é o CRM, `graph.facebook.com`
é o CAPI. Boa parte das asserções guarda **LGPD**: consentimento obrigatório, allowlist,
log sem dado pessoal, telefone/nome hasheados no CAPI e — a mais importante — nenhum dado
de saúde no evento do Meta.

## Diagnóstico

```bash
curl https://<endereco-do-worker>            # {"ok":true,"pausado":false}
npx wrangler tail                            # log ao vivo
```

O log traz `crm=<status> pagina=<slug> campanha=<utm> atribuicao=sim|nao` e `meta=<status>`,
e **nunca** nome, telefone ou resposta de caso. `atribuicao=nao` em tráfego pago é o sinal
de que o `fbclid` não chegou, e portanto de que o evento não vai casar bem no Meta.

Validar o CAPI: pôr um `META_TEST_EVENT_CODE` (de **Events Manager → Testar eventos**) em
`wrangler.toml`, redeployar e enviar um lead de teste; o evento aparece na aba de testes.
Tirar o código depois. O navegador envia por `sendBeacon` e ignora a resposta, de
propósito: se o CRM ou o Meta caírem, a paciente ainda vai ao WhatsApp. O `wrangler tail`
é onde a falha aparece.
