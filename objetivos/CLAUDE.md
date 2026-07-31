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
4. `#avaliacao` `cta-band` com `[data-qualify]` — micro-qualificação de dois grupos
   (ver abaixo). Vem **logo depois dos limites**, e não no fim: em `/detalhes/` ela
   fecha a página, aqui ela precisa acontecer antes de o tráfego pago desistir de rolar
5. "Visão geral" — `info-grid` com 6 cards (o último é sempre "Quem realiza")
6. Bloco da médica (`.doctor`) — por que com uma médica, com o risco real nomeado
7. `#conteudo` `.prose` — profundidade de SEO, com `mid-cta` no fim
8. `section--cream` "Resultados esperados" — 4–6 cards + `card--feature` + ressalva
9. Depoimentos (`[data-tstm]`) — **idêntico ao de `/detalhes/`**
10. `#duvidas` — FAQ em acordeão, espelhando 1:1 o JSON-LD `FAQPage`
11. `cta-band` final (sem `[data-qualify]`) + link discreto para o hub em `/detalhes/`

## Micro-qualificação (a banda `[data-qualify]`)

`main.js` faz `querySelector("[data-qualify]")` — **só pode existir uma banda** por
página. Dentro dela, cada `.qualify` é um grupo de pergunta independente, nomeado por
`data-qualify-group`. As LPs de dor usam **dois grupos, nesta ordem**:

| Grupo | Pergunta | Por que existe |
|---|---|---|
| `caso` | específica da dor da página | é o que a Dra. precisa saber antes da consulta |
| `prazo` | "Quando você pretende começar?" | separa quem decide de quem pesquisa |

A pergunta de `caso` é o coração da qualificação, e cada página tem a sua: o que mais
incomoda no nariz, se a olheira muda com a luz, se já houve produto definitivo nos
lábios. Escolha uma que **mude a conduta clínica ou desmarque a consulta**, não uma que
só engaje.

Regras do mecanismo:

- **A resposta nunca vira veredito na tela.** Ela só descreve o caso na mensagem do
  WhatsApp. Dizer à paciente o que ela tem, sem exame, é ato médico (vale a política
  geral do site: quiz entrega caminhos, nunca diagnóstico).
- **Nenhuma resposta pode soar como exclusão.** Onde o risco existe, o `.qualify__hint`
  do grupo desarma ("a maioria dos casos é mista, então nenhuma resposta aqui exclui
  você"). Sem isso a qualificação vira porta fechada.
- **Responder é opcional** e a página diz isso: quem está decidida manda a mensagem
  direto pelos CTAs de cima.
- Ao responder, `applyWaMessage()` reescreve **todos** os CTAs de WhatsApp da página,
  não só o botão da banda. É o que evita perder o caso quando a paciente responde e
  converte no CTA final. Links com `data-wa-msg` próprio são preservados.
- Cada resposta é uma frase própria na mensagem. Juntar com "e" geraria erro de vírgula
  quando os sujeitos são diferentes ("minha olheira muda… e pretendo começar…").
- O evento `qualify_select` leva `qualify_group` e `qualify_value`, mais um
  `qualify_<grupo>`. O `qualify_prazo` antigo continua sendo enviado de propósito, para
  não quebrar o que já está montado no GTM e no GA4.

## Modo campanha (`.is-campaign`)

Estas páginas servem tráfego pago e busca orgânica na mesma URL, e menu de header é rota
de fuga numa LP paga. Um script inline no `<head>` marca `.is-campaign` no `<html>`
quando a URL tem `fbclid`, `gclid`, `ttclid`, `msclkid` ou `utm_medium` pago, e persiste
a marca na sessão. O CSS então esconde o menu do header, o botão do hambúrguer e o que
estiver com `[data-campaign-hide]` (a coluna "Navegue" do rodapé).

- O script é **inline no `<head>`**, não em `main.js`: precisa rodar antes da primeira
  pintura, senão o menu aparece e desaparece na cara da visitante.
- **Não é cloaking:** o conteúdo é idêntico nos dois modos, muda só a navegação. Busca
  orgânica e Googlebot nunca têm esses parâmetros, então veem o site inteiro navegável.
- O logo continua levando à home nos dois modos: nunca existe beco sem saída.
- No mobile, o header em modo campanha fica só com o logo, porque o CSS do site já
  esconde o CTA do header abaixo de 900px. O botão flutuante do WhatsApp cobre isso.

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
- Script inline do modo campanha no `<head>` e `data-campaign-hide` na coluna "Navegue"
  do rodapé — sem os dois a LP paga fica com o menu do site inteiro
- Uma pergunta de `caso` própria na banda `[data-qualify]`, com o `.qualify__hint` que
  impede que a resposta soe como exclusão
- Uma ficha nova em `../docs/objetivos/` e uma linha no índice acima

**Não** adicionar ao rodapé, ao menu, a `tratamentos.html` nem à home: estas páginas
são pontas de campanha e de cauda longa, não itens de catálogo.

## Rastreamento

Mesmo mecanismo de `/detalhes/`, com `content_type: "objective"` em vez de
`"procedure"` — é o que permite ler o funil pago separado do funil de busca por
procedimento. Detalhes em `../docs/rastreamento-gtm.md`.
