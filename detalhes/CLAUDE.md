# Páginas de detalhe de procedimento

Cada arquivo aqui é uma página de procedimento publicada em `/detalhes/<slug>.html`.
São as páginas de maior intenção do site: recebem tráfego de busca por procedimento
e existem para levar ao WhatsApp com a paciente já qualificada.

**Antes de editar qualquer página, leia a ficha do procedimento** em
`../docs/procedimentos/<slug>.md`. Ela tem o conteúdo clínico, a dor trabalhada na
copy, as objeções e os números divulgados — sem ela é fácil escrever algo que
contradiz a própria página ou a política de publicidade médica.

## Índice

| Slug | Procedimento | Categoria | Objetivo no quiz | Ficha |
|---|---|---|---|---|
| `botox` | Botox® (Toxina Botulínica) | Rosto | `rugas` | [botox.md](../docs/procedimentos/botox.md) |
| `preenchimento-facial` | Preenchimento Facial | Rosto | `rugas`, `volume` | [preenchimento-facial.md](../docs/procedimentos/preenchimento-facial.md) |
| `radiesse` | Radiesse® (Bioestimulador) | Rosto e Corpo | `flacidez`, `volume` | [radiesse.md](../docs/procedimentos/radiesse.md) |
| `ultrassom-microfocado` | Ultrassom Microfocado | Rosto e Corpo | `flacidez` | [ultrassom-microfocado.md](../docs/procedimentos/ultrassom-microfocado.md) |
| `fios-de-tracao` | Fios de Tração (Lifting) | Rosto | `flacidez` | [fios-de-tracao.md](../docs/procedimentos/fios-de-tracao.md) |
| `fios-lisos` | Fios PDO Lisos | Rosto | `flacidez` | [fios-lisos.md](../docs/procedimentos/fios-lisos.md) |
| `pdrn-injetavel` | PDRN Injetável | Pele | `pele` | [pdrn-injetavel.md](../docs/procedimentos/pdrn-injetavel.md) |
| `pdrn-mesoject` | PDRN Mesoject (sem agulhas) | Pele | `pele` | [pdrn-mesoject.md](../docs/procedimentos/pdrn-mesoject.md) |
| `lavieen-pdrn` | Protocolo Glow Repair (Lavieen + PDRN) | Pele | `pele` | [lavieen-pdrn.md](../docs/procedimentos/lavieen-pdrn.md) |
| `culote` | Tratamento Injetável para Culote | Corpo | `corporal` | [culote.md](../docs/procedimentos/culote.md) |
| `harmonizacao-glutea` | Harmonização Glútea sem Cirurgia | Corpo | `corporal` | [harmonizacao-glutea.md](../docs/procedimentos/harmonizacao-glutea.md) |

## Estrutura da página (ordem fixa)

Todas as 11 seguem o mesmo esqueleto. Ao criar ou revisar uma, mantenha a ordem:

1. `page-hero--overlap` — back-link, eyebrow `Tratamentos · <Categoria>`, `h1`,
   `page-hero__lead`, CTA duplo (WhatsApp + âncora `#conteudo`), trustbar, imagem LCP
2. `section--cream` "Você se identifica?" — 3 `pain-cards` na voz da paciente + `pain-bridge`
3. "Visão geral" — `info-grid` com 6 cards (o último é sempre "Quem realiza")
4. `#conteudo` `.prose` — O que é / Para quem é indicado / Como é realizado /
   Recuperação e cuidados, com um `mid-cta` no fim
5. `section--cream` "Resultados esperados" — 4–6 cards + `card--feature` com frase da Dra.
   + linha de ressalva ("Os resultados variam de pessoa para pessoa…")
6. Bloco da médica (`.doctor`) — por que com uma médica
7. Depoimentos (`[data-tstm]`) — **idêntico em todas as páginas**
8. `#duvidas` — FAQ em acordeão, espelhando 1:1 o JSON-LD `FAQPage`
9. `cta-band` com `[data-qualify]` — micro-quiz de prazo que pré-preenche o WhatsApp
10. "Tratamentos relacionados" — 3 cards para outros `/detalhes/`

## Regras que não podem ser quebradas

**Publicidade médica (CFM):**
- Nada de antes/depois, nada de foto de resultado de paciente.
- Nada de preço na página. A FAQ "Quanto custa…" sempre responde que depende de
  avaliação individual e que o orçamento sai na consulta.
- Nunca prometer resultado. Toda indicação é condicionada a avaliação médica
  individual, e a `pain-bridge` diz explicitamente que a Dra. também indica quando
  o procedimento **não** é o caminho.
- CRM 16743 PB visível: no trustbar, no card "Quem realiza", no bloco da médica e no rodapé.
- O JSON-LD `MedicalWebPage` carrega `disclaimer` e `lastReviewed` — mantenha o
  `lastReviewed` atualizado quando o conteúdo clínico mudar.

**Coerência interna:** título, `<meta description>`, `og:*`, `twitter:*` e o
`h1`/lead precisam contar a mesma história. As 6 perguntas do acordeão têm que ser
exatamente as 6 do `FAQPage`.

**Paths são absolutos** (`/css/styles.css`, `/detalhes/…`, `/assets/…`). Não use
relativos — o mesmo markup é reaproveitado entre páginas em profundidades diferentes.

## Ao criar um procedimento novo

O slug aparece em mais lugares do que parece. Além do HTML novo:

- `../sitemap.xml` e `../llms.txt` — listar a URL
- `../tratamentos.html` — card no grupo de objetivo correspondente
- `../index.html` — se entrar na vitrine da home
- `../js/tracking.js` → `PROCEDURES` — sem isso o `view_content` vai ao GA4/Meta
  com o slug cru em vez do nome legível
- `../js/main.js` → `RECO_TREATMENTS` e `RECO_MAP` — sem isso o quiz nunca recomenda
- Cards "Tratamentos relacionados" das páginas vizinhas (a linkagem é manual)
- `hasOfferCatalog` no JSON-LD `Physician` (replicado em todas as páginas)
- Uma ficha nova em `../docs/procedimentos/` e uma linha no índice acima

## Rastreamento

`view_content` dispara sozinho ao abrir a página: o `tracking.js` lê o slug de
`/detalhes/<slug>.html` e resolve o nome pelo mapa `PROCEDURES`. `whatsapp_click`
usa delegação no document, então cobre qualquer CTA — inclusive os injetados pelo
quiz. Detalhes em `../docs/rastreamento-gtm.md`.
