# Landing pages de campanha paga (`/lp/`)

Cada pasta aqui é uma LP publicada em `/lp/<slug>/` e existe para **um único
conjunto de anúncio**: recebe o tráfego pago, qualifica em 4 perguntas e leva ao
WhatsApp com o lead já registrado no CRM.

**Antes de editar, leia a spec** em `../specs/plans/spec-01-lp-contorno.md`
(contorno) e `spec-02-lp-volume.md` (volume).

## Diferença para `/objetivos/` e `/detalhes/`

| | `objetivos/` | `lp/` |
|---|---|---|
| Público | pago **e** busca orgânica | **só pago** |
| Indexação | `index,follow` | **`noindex,follow`** |
| Header/footer do site | Sim (modo campanha esconde o menu) | **Nenhum** — página isolada, rodapé legal próprio |
| Qualificação | micro-banda que só reescreve a mensagem do WhatsApp | **formulário que grava lead no CRM** e leva ao WhatsApp |
| CSS/JS | `styles.css` + `main.js` + `tracking.js` | `styles.css` + **`lp.css`** + **`lp.js`** + `tracking.js` |

As duas LPs são **irmãs visuais**: mesmos tokens, mesmo grid, mesma `lp.css` e o
mesmo `lp.js`. Diferem em copy, imagem e na assinatura visual (o "traço de
contorno" na contorno; a "régua da medida certa" na volume).

## Estrutura (ordem fixa, ver a spec)

1 Hero (2 colunas; imagem depois do CTA no mobile) · **1.5 Quiz do topo
(`#comecar`)** · 2 Espelho da dor · 3 Por que acontece (autoridade) ·
4 Solução + 3 diferenciais + CTA · 5 Quem é a médica · 5.5 Depoimentos ·
**6 Resultados (condicional)** · 7 Como funciona · 8 FAQ (`<details>`) ·
9 Qualificação (`#qualificacao`) · 10 Rodapé legal.

A seção 6 fica **entre 3 e 4** nas duas LPs: é o respiro visual no ponto em que o
texto mais pesa no celular, e a ordem de leitura fica dor → causa → prova →
solução. O CTA do hero aponta para o quiz do topo (`#comecar`); os
intermediários (fim das seções 2, 4 e 6), para `#qualificacao`. Todo
caminho leva a um dos formulários; só o formulário (e o link de fuga sob ele) vai
ao WhatsApp.

**Duas instâncias do quiz por página** (a do topo e a da seção 9), ambas com
`[data-qualify-form]` e autônomas. Ao editar perguntas ou `data-value`, alterar
as DUAS: valor diferente vira mensagem de WhatsApp e registro de CRM diferentes.

## Formulário de qualificação → Ponte site→CRM

`lp.js` (`[data-qualify-form]`) roda 4 passos: **caso → objetivo → prazo →
contato** (nome + WhatsApp + consentimento). Ao enviar:

1. `sendBeacon` (`text/plain`, sem preflight) do lead para o **Worker** em
   [`../worker/`](../worker/), que guarda o token do CRM e repassa o lead.
2. `dataLayer`: `quiz_complete` + `whatsapp_click` (mesmos nomes que o GTM já ouve).
3. Abre o WhatsApp com a mensagem montada a partir das respostas.

Campos enviados batem 1:1 com a allowlist `CAMPOS` do Worker (`nome`, `whatsapp`,
`consentimento`, `objetivo`, `caso`, `prazo`, `pagina`, `event_id`, `utm_*`,
`gclid`, `fbclid`, `fbp`, mais `assunto` (honeypot) e `ms_no_form`). Mudar um nome
aqui exige mudar a allowlist lá — campo fora da lista é descartado em silêncio.

### ⚠️ Ligar o Worker (passo obrigatório antes de subir verba)

Enquanto `LP_CONFIG.leadEndpoint` (topo de `../js/lp.js`) estiver **vazio**, o
formulário funciona (valida, dispara eventos, leva ao WhatsApp) mas **não grava o
lead no CRM** — nunca bloqueia a conversa, só perde o registro. Para ligar:

1. Publicar o Worker (`cd worker && npx wrangler deploy`, ver `../worker/README.md`).
2. Colar a URL publicada em `LP_CONFIG.leadEndpoint`.
3. Adicionar a origem `https://www.draanapontes.com.br` já está no `ALLOWED_ORIGINS`
   do Worker; conferir se o domínio de teste também precisa entrar.

## Seção 6 — Resultados (antes/depois): OCULTA por padrão

A seção `[data-lp-results]` nasce com `hidden`. O comparador (arrastar o divisor,
`prefers-reduced-motion` → par lado a lado) já está pronto para receber as fotos.
(As **duas** LPs estão hoje com a seção VISÍVEL, em modo de preview de layout, com
as imagens de exemplo `assets/lp/preview-*.svg`. Ver o comentário no HTML: não
subir assim, trocar pelas fotos autorizadas ou readicionar o `hidden`.)

**Só ativar com termo de autorização de imagem ASSINADO por cada paciente.**
Ativar = remover `hidden`, trocar as imagens `assets/lp/REPLACE-*.webp` pelas reais
(mesmo ângulo/luz, dimensões explícitas) e apagar o bloco `.lp-results-empty`.

- **CFM:** antes/depois é sensível. Na landing, com termo assinado e disclaimer
  visível, é defensável. Sem termo, **não entra**.
- **Meta (mídia paga):** mesmo com autorização, a política de Saúde Pessoal e
  Aparência proíbe antes/depois **no criativo do anúncio**, e a penalidade cai
  sobre a conta inteira. A seção pode viver na LP; **o anúncio que aponta para cá
  não pode conter antes/depois**. Ver `../objetivos/CLAUDE.md`.

## Rastreamento

`tracking.js` reconhece `/lp/<slug>/` e dispara `view_content` com
`content_type: "lp"` (funil pago lido separado do orgânico). O mapa de slugs fica
em `LANDINGS` (`../js/tracking.js`). Eventos reusam os nomes que o GTM já ouve:
`view_content`, `quiz_start`, `qualify_select`, `quiz_complete`, `whatsapp_click`
— **nenhuma reconfiguração de GTM é necessária**. Detalhes em
`../docs/rastreamento-gtm.md`.

**Nunca** mande a resposta de `caso` ao Meta como parâmetro: é dado de saúde
(LGPD + Termos do Meta). Ela vai só ao CRM (com consentimento) e ao WhatsApp da
própria paciente. Ver `rastreamento-gtm.md` §4.5.

## Ao criar uma LP nova em `/lp/`

- `../js/tracking.js` → `LANDINGS` (senão o `view_content` vai com o slug cru)
- **Config da página vive no `<body>`**, não no JS: `data-lp-angulo`,
  `data-lp-pagina` e `data-lp-variant` alimentam o `LP_CONFIG` do `lp.js`
  (mensagem do WhatsApp, `quiz_variant` e nome nos eventos). Sem os atributos, o
  `lp.js` cai nos padrões da LP de contorno. O número do WhatsApp e o
  `leadEndpoint` seguem no `lp.js`, iguais para todas as LPs.
- **Não** adicionar ao `sitemap.xml`, `llms.txt`, menu, rodapé ou home: são pontas
  de campanha `noindex`, não itens de catálogo.
- Validar com a médica os `TODO` do HTML (formação, citação) antes de publicar.
