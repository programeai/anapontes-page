# Ponte site → CRM (Cloudflare Worker)

O site é estático no GitHub Pages e o CRM entrega um token que não pode ser exposto:
qualquer chave em JavaScript de página é pública. Este Worker existe só para guardar
esse token e repassar o lead da banda de qualificação das LPs em `/objetivos/`.

## O que ele faz, e o que ele não faz

| Faz | Não faz |
|---|---|
| Guarda o `CRM_TOKEN` fora do navegador | **Não** fala com o Meta |
| Valida, normaliza e repassa o lead ao CRM | Não guarda dado nenhum (não há banco) |
| Entrega ao CRM a atribuição da campanha | Não registra dado pessoal em log |
| Barra robô, limita envios, tem interruptor | Não decide indicação clínica |

**Quem dispara os eventos de conversão é o CRM**, pela integração nativa de CAPI, a
partir do estágio do lead (novo → agendou → compareceu). É isso que resolve o problema
de o site medir clique em vez de conversa: o evento passa a nascer de um registro real
e do estágio dele, não de um `click` no navegador.

## ⚠️ A regra que não pode ser quebrada

O lead carrega a **resposta de caso** da paciente, do tipo *"já fiz preenchimento com
produto definitivo"* ou *"tenho bolsa ou inchaço na região"*. Isso é dado pessoal
sensível de saúde.

- **No CRM pode**, com consentimento: é registro legítimo de atendimento.
- **No Meta não pode.** Os Termos das Ferramentas de Negócios proíbem enviar dado que
  revele condição ou tratamento de saúde, e a penalidade cai sobre a conta de anúncios,
  não sobre o evento. É a mesma decisão registrada em
  [../docs/rastreamento-gtm.md](../docs/rastreamento-gtm.md), seção 4.4, que já barrou
  `procedure_name` no pixel.

O Worker isola esses campos em `custom_fields` justamente para facilitar a conferência.
**Antes de ligar a integração de CAPI do CRM, verificar no painel dele quais campos ele
inclui no evento.** Vários CRMs mandam todos os campos personalizados por padrão. O
evento pode ir; a resposta de caso, não.

## Publicar

```bash
cd worker
npx wrangler login
npx wrangler secret put CRM_TOKEN     # cola o token do CRM, não vai para o git
npx wrangler deploy
```

Antes do primeiro deploy, preencher `CRM_URL` em [wrangler.toml](wrangler.toml).

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

A URL escolhida entra no `main.js` do site. **Enquanto ela não estiver publicada e o
formulário não estiver na página, este Worker fica inerte:** nada no site o chama.

## Adaptar ao CRM

Só uma função muda: `montaRequisicaoCrm()` em [src/index.js](src/index.js). Confirmar
três coisas no painel do CRM:

1. URL e método de criação de lead;
2. esquema de autenticação (hoje está `Authorization: Bearer <token>`);
3. nomes dos campos personalizados. Campo que não existe no CRM costuma ser
   descartado em silêncio, e aí o lead entra sem a atribuição, o que quebra o casamento
   do evento no Meta sem dar erro nenhum.

## Defesas

| Camada | Comportamento |
|---|---|
| Origem | só `www.draanapontes.com.br`, o domínio sem `www` e `localhost:8899` |
| Allowlist de campos | o que não está na lista é descartado, para ninguém injetar campo no CRM |
| Armadilha | campo escondido `assunto`; preenchido, responde 204 e ignora |
| Tempo no formulário | menos de 1,5 s é robô; mais de 6 h é sessão velha |
| Consentimento | `false` ou ausente, nada é enviado ao CRM |
| Telefone | normalizado para dígitos com código do país, como o CAPI espera |
| Limite | 12 envios por IP a cada 10 min (exige o KV) |
| Interruptor | `PAUSED=1` desliga sem redeploy |

Se aparecer spam mesmo assim, o próximo degrau é o Turnstile da Cloudflare, que é
gratuito e nativo aqui. Fica de fora por ora para não colocar mais um script na LP, que
é página de LCP sensível.

## Testes

```bash
cd worker && npm test
```

Roda sem dependência nenhuma (Node puro, `fetch` do CRM dublado, nada sai para a rede).
Boa parte das asserções guarda comportamento de **LGPD**, não de código: consentimento
obrigatório, allowlist de campos, log sem dado pessoal e a resposta de caso isolada em
`custom_fields`. Se uma delas quebrar, o problema é jurídico antes de ser técnico.

## Diagnóstico

```bash
curl https://<endereco-do-worker>            # {"ok":true,"pausado":false}
npx wrangler tail                            # log ao vivo
```

O log traz `crm=<status> pagina=<slug> campanha=<utm> atribuicao=sim|nao`, e **nunca**
nome, telefone ou resposta de caso. `atribuicao=nao` em tráfego pago é o sinal de que o
`fbclid` não chegou, e portanto de que o evento do CRM não vai casar no Meta.

O navegador envia por `sendBeacon` e ignora a resposta, de propósito: se o CRM estiver
fora do ar, a paciente ainda vai para o WhatsApp. Perde-se o registro, nunca a conversa.
Por isso o `wrangler tail` e o painel do CRM são o único lugar onde uma falha aparece.
