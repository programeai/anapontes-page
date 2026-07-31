# LPs de dor específica

Cada arquivo aqui é publicado em `/objetivos/<slug>.html` e existe para **um único
incômodo** que a paciente reconhece com as próprias palavras — não para um procedimento.

São páginas de dupla função: destino de campanha paga no Meta **e** página indexada
para busca no Google. As duas exigências brigam entre si, e a ordem das seções é o
que resolve o conflito (ver abaixo).

**Antes de editar, leia a ficha** em `../docs/objetivos/<slug>.md`.

## Índice

| Slug | Dor trabalhada | Procedimento por trás | Ficha |
|---|---|---|---|
| `nariz-sem-cirurgia` | "Queria mexer no nariz, mas não quero cirurgia" | Preenchimento facial (rinomodelação) | [nariz-sem-cirurgia.md](../docs/objetivos/nariz-sem-cirurgia.md) |
| `olheira-funda` | "Durmo bem e continuo com cara de cansada" | Preenchimento facial (sulco lacrimal) | [olheira-funda.md](../docs/objetivos/olheira-funda.md) |
| `preenchimento-labial-natural` | "Quero volume, mas não quero parecer preenchida" | Preenchimento facial (lábios) | [preenchimento-labial-natural.md](../docs/objetivos/preenchimento-labial-natural.md) |

## Diferença para `/detalhes/`

| | `detalhes/` | `objetivos/` |
|---|---|---|
| Eixo | Procedimento | Dor |
| Visitante | Já sabe o nome do procedimento | Não sabe o nome de nada |
| Back-link no hero | Tem | **Não tem** — tráfego pago não deve ter porta de saída no topo |
| "Tratamentos relacionados" | Tem | **Não tem** — é o que mantém a página monotemática |
| Bloco de limites ("o que não faz") | Não tem | **Obrigatório** |
| Link para o hub | — | Um só, discreto, no CTA final |

## Estrutura da página (ordem fixa)

A ordem não é estética: ela serve dois públicos na mesma URL. Quem vem do anúncio
converte nos passos 1–6 e nunca rola até o 7. Quem vem do Google cai no mesmo gancho
e encontra a profundidade que o ranqueamento exige logo abaixo.

1. `page-hero--overlap` — eyebrow `Objetivos · <Categoria>`, `h1` **na dor** (nunca no
   nome do procedimento), lead, CTA duplo, trustbar, imagem LCP
2. `section--cream` "Você se identifica?" — 3 `pain-cards` na voz da paciente + `pain-bridge`
3. `#limites` "O que faz e o que não faz" — `grid--2`, duas colunas honestas
4. "Visão geral" — `info-grid` com 6 cards (o último é sempre "Quem realiza")
5. Bloco da médica (`.doctor`) — por que com uma médica, com o risco real nomeado
6. `cta-band` com `[data-qualify]` — micro-quiz de prazo que pré-preenche o WhatsApp
7. `#conteudo` `.prose` — profundidade de SEO, com `mid-cta` no fim
8. `section--cream` "Resultados esperados" — 4–6 cards + `card--feature` + ressalva
9. Depoimentos (`[data-tstm]`) — **idêntico ao de `/detalhes/`**
10. `#duvidas` — FAQ em acordeão, espelhando 1:1 o JSON-LD `FAQPage`
11. `cta-band` final (sem `[data-qualify]`) + link discreto para o hub em `/detalhes/`

`main.js` faz `querySelector("[data-qualify]")` — **só pode existir um** por página.

## Regras que não podem ser quebradas

Valem todas as de [../detalhes/CLAUDE.md](../detalhes/CLAUDE.md) (CFM: sem antes/depois,
sem preço, sem promessa de resultado, CRM visível), mais estas:

- **Uma dor por página.** Nunca citar as outras dores do catálogo. No instante em que
  a página lista alternativas, ela vira o hub e perde o motivo de existir.
- **O bloco de limites é obrigatório** e vem antes de qualquer aprofundamento. Ele é o
  que qualifica o lead e o que evita consulta perdida.
- **Meta:** o criativo que aponta para cá não pode conter antes/depois — é proibido pela
  política de Saúde Pessoal e Aparência, independentemente do CFM. Imagens de agulha
  também têm risco de reprovação; vale manter uma variação sem o momento da injeção.

## Ao criar uma LP nova

- `../sitemap.xml` e `../llms.txt` — listar a URL
- `../js/tracking.js` → `OBJECTIVES` — sem isso o `view_content` vai com o slug cru
- `../js/main.js` → `WA_OBJECTIVES` — sem isso a mensagem do WhatsApp sai genérica
- Link do hub correspondente em `../detalhes/` apontando para a LP
- Uma ficha nova em `../docs/objetivos/` e uma linha no índice acima

**Não** adicionar ao rodapé, ao menu, a `tratamentos.html` nem à home: estas páginas
são pontas de campanha e de cauda longa, não itens de catálogo.

## Rastreamento

Mesmo mecanismo de `/detalhes/`, com `content_type: "objective"` em vez de
`"procedure"` — é o que permite ler o funil pago separado do funil de busca por
procedimento. Detalhes em `../docs/rastreamento-gtm.md`.
