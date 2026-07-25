---
date: 2026-07-25T17:35:38-03:00
researcher: claude
git_commit: 99ad6ebf9397a1b19ce622acfe1d69ab14075d5d
branch: main
topic: "Plano de ação da auditoria SEO 2026-07-25 — LCP mobile do hero, preload responsivo, openingHours no Physician, URLs do llms.txt, linkagem interna e fontes órfãs"
tags: [research, seo, core-web-vitals, lcp, json-ld, schema, llms-txt, linkagem-interna, performance]
status: complete
---

# Research: Correções de SEO — auditoria 2026-07-25

## Research Question

A auditoria `/seo audit https://www.draanapontes.com.br` (2026-07-25) produziu um plano de ação de 9 itens. Este PRD mapeia o contexto de implementação de cada um.

**Duas correções à auditoria original, verificadas durante esta pesquisa** (detalhadas em [Achados que Invalidam Itens do Plano](#achados-que-invalidam-itens-do-plano)):

- O item "11 imagens sem alt na home" (classificado como High) **não é um defeito**. Os `alt=""` estão no grupo clone `aria-hidden="true"` do marquee — prática correta.
- O item "apex não redireciona para www" (Medium) **não é um defeito**. O apex responde 301. A medição original usou `curl -L`, que reporta o status final do destino.

Escopo real remanescente: **7 itens**.

| # | Item | Prioridade | Arquivos |
|---|---|---|---|
| 1 | Variante `hero-ampulheta-1200.webp` + `srcset` | High | `index.html`, `assets/home/` |
| 2 | `imagesrcset`/`imagesizes` no preload do hero | Medium | `index.html:30` |
| 3 | `openingHoursSpecification` no `Physician` | Medium | 13 arquivos HTML |
| 4 | URLs do `llms.txt` para forma canônica `.html` | Medium | `llms.txt` |
| 5 | Rebalancear linkagem interna | Medium | `index.html`, `tratamentos.html`, `detalhes/*.html` |
| 6 | Remover 8 fontes órfãs (119 KB) | Low | `fonts/` |
| 7 | `dateModified` visível nas páginas médicas | Low | 11 arquivos `detalhes/*.html` |

## Summary

O site é HTML/CSS/JS estático puro, sem build e sem framework, publicado por GitHub Pages a partir de `main` com `CNAME = www.draanapontes.com.br`. Não há workflow de CI em `.github/` — só `.github/prompts/commit.prompt.md`. Deploy é push direto na branch. Isso significa que **toda alteração é edição direta de arquivo, sem etapa de compilação**, e que qualquer transformação repetitiva deve ser feita por script Python one-off aplicado às 11 (ou 13) páginas.

A uniformidade estrutural documentada no PRD anterior (`specs/research/2026-07-18-correcoes-seo.md`) **se mantém e foi reverificada**: o bloco JSON-LD `Physician` tem hash MD5 idêntico (`95cc9b90`, 15 chaves) nas 13 páginas indexáveis, e nas 11 páginas de detalhe ele está sempre na linha 93. Isso torna o item 3 um find-replace seguro de bloco único.

O único item com impacto medido em ranking é o 1. Medição em laboratório (Playwright, iPhone 390px @DPR3, CPU 4x, Slow-4G) deu **LCP de 3.132ms na home** — faixa "Needs Improvement" (2.500–4.000ms). As demais páginas estão saudáveis (`/tratamentos.html` 616ms, `/detalhes/botox.html` 1.400ms) e o CLS é praticamente zero em todo o site (0,0005–0,0116). Não há dados de campo: não existe credencial Google configurada, então CrUX e Search Console não puderam ser consultados.

## Codebase Map

### Arquivos Afetados

| Arquivo | Papel | Relevância |
|---|---|---|
| [index.html:30](index.html#L30) | `<link rel="preload">` do hero | Itens 1 e 2 — preload hardcoded no 1600w |
| [index.html:133-137](index.html#L133-L137) | `<img>` do hero, LCP element | Item 1 — `srcset` só tem 800w e 1600w |
| [index.html:44](index.html#L44) | Bloco JSON-LD `Physician` | Item 3 |
| [index.html:487-514](index.html#L487-L514) | Marquee de tratamentos (2 grupos) | Item 5 — origem dos links internos da home |
| [tratamentos.html:33](tratamentos.html#L33) | Bloco JSON-LD `Physician` | Item 3 |
| `detalhes/*.html:93` | Bloco JSON-LD `Physician` (11 arquivos) | Item 3 — mesma linha nos 11 |
| [llms.txt](llms.txt) | Perfil GEO, 13 URLs | Item 4 |
| [fonts/](fonts/) | 15 `.woff2`, 7 usados | Item 6 |
| [css/styles.css](css/styles.css) | 7 blocos `@font-face` | Item 6 — fonte da verdade do que é usado |
| [assets/home/](assets/home/) | `hero-ampulheta-800.webp` (68 KB), `-1600.webp` (148 KB) | Item 1 — falta variante intermediária |

### Padrões Existentes a Seguir

**Padrão: `<img>` responsivo com dimensões explícitas**

```html
<!-- index.html:133-137 -->
<img src="/assets/home/hero-ampulheta-1600.webp"
     srcset="/assets/home/hero-ampulheta-800.webp 800w, /assets/home/hero-ampulheta-1600.webp 1600w"
     sizes="(max-width: 820px) 100vw, (min-width: 1160px) 530px, 46vw"
     width="1600" height="2070" fetchpriority="high"
     alt="Dra. Ana Paula Pontes, médica em João Pessoa, segurando uma ampulheta que simboliza o rejuvenescimento natural.">
```

**Por que importa**: todas as 195 imagens do site têm `width`/`height` explícitos — é essa disciplina que mantém o CLS em ~0. Qualquer imagem nova precisa manter o mesmo par de atributos. O `sizes` já está correto e **não deve ser alterado** no item 1; só o `srcset` ganha o novo candidato.

**Padrão: marquee com grupo clone acessível**

```html
<!-- index.html:489 --> <div class="marquee__group">
<!--   11 cards com alt descritivo geo-modificado -->
<!-- index.html:502 --> <div class="marquee__group" aria-hidden="true">
<!--   11 cards clonados: alt="" + tabindex="-1" -->
```

**Por que importa**: o grupo clone existe para a animação de esteira contínua. `alt=""` + `tabindex="-1"` + `aria-hidden="true"` é o tratamento correto — impede leitor de tela e navegação por teclado de percorrer o conteúdo duas vezes. **Não alterar.** Ver commits `99ad6eb`, `37481af`, `388eade`, que ajustaram esse carrossel especificamente para Safari/iOS.

**Padrão: alt text descritivo com modificador geográfico**

```html
alt="Preenchimento Facial em João Pessoa com a Dra. Ana Pontes."
alt="Radiesse® em João Pessoa com a Dra. Ana Pontes."
```

**Por que importa**: convenção consistente nas 184 imagens de conteúdo. Serve de molde caso o item 7 gere novos elementos com imagem.

**Padrão: bloco `Physician` idêntico e replicado**

```json
{
  "@type": "Physician",
  "@id": "https://www.draanapontes.com.br/#physician",
  "name": "Dra. Ana Pontes | Rejuvenescimento Natural & Estética",
  "telephone": "+55-83-99135-3786",
  "priceRange": "$$$",
  "address": { "@type": "PostalAddress", "streetAddress": "Av. Gov. Flávio Ribeiro Coutinho, 500 - Sala 624 - Liv Mall Shopping", "...": "..." },
  "geo": { "@type": "GeoCoordinates", "latitude": -7.101488, "longitude": -34.831804 },
  "sameAs": ["https://www.instagram.com/draanapontesoficial/", "https://maps.app.goo.gl/pT12Ccnzezx1nJDb7"],
  "medicalSpecialty": ["Dermatology", "CosmeticProcedure"]
}
```

**Por que importa**: 15 chaves, hash MD5 `95cc9b90` idêntico nas 13 páginas. O item 3 insere uma 16ª chave. Como o bloco é literalmente o mesmo texto, um script que monte a string de `openingHoursSpecification` e faça replace exato do trecho `"medicalSpecialty"` (ou insira antes dele) atinge as 13 de uma vez, com validação por hash pós-edição.

### Grafo de Linkagem Interna (estado atual)

Links internos de entrada por página, contando `index.html`, `tratamentos.html` e as 11 de detalhe:

```
 15  /tratamentos.html
 14  /
 10  /detalhes/radiesse.html
  7  /detalhes/ultrassom-microfocado.html
  6  /detalhes/pdrn-injetavel.html
  5  /detalhes/fios-de-tracao.html
  5  /detalhes/fios-lisos.html
  5  /detalhes/preenchimento-facial.html
  4  /detalhes/lavieen-pdrn.html
  4  /detalhes/pdrn-mesoject.html
  3  /detalhes/botox.html            <- menor entrada, maior volume de busca provável
  3  /detalhes/culote.html
  3  /detalhes/harmonizacao-glutea.html
  1  /tratamentos-quiz.html          (noindex, esperado)
  0  /404.html                       (noindex, esperado)
```

Cada página de detalhe emite 5 links internos; `index.html` e `tratamentos.html` emitem 13 cada. A assimetria vem de links contextuais no corpo das páginas de detalhe — não do marquee, que linka as 11 uniformemente.

## Pesquisa Externa

### Preload responsivo (`imagesrcset` / `imagesizes`)

Um `<link rel="preload" as="image">` sem `imagesrcset` força o download da URL literal em `href`, ignorando o `srcset` do `<img>` correspondente. Quando o `srcset` resolve para outro candidato, o navegador baixa **os dois arquivos**.

```html
<link rel="preload" as="image"
      href="/assets/home/hero-ampulheta-800.webp"
      imagesrcset="/assets/home/hero-ampulheta-800.webp 800w,
                   /assets/home/hero-ampulheta-1200.webp 1200w,
                   /assets/home/hero-ampulheta-1600.webp 1600w"
      imagesizes="(max-width: 820px) 100vw, (min-width: 1160px) 530px, 46vw"
      fetchpriority="high">
```

`imagesizes` precisa ser **idêntico** ao `sizes` do `<img>`; qualquer divergência faz o preloader escolher um candidato diferente do que o `<img>` usará, reintroduzindo o download duplo. Suporte: Chrome/Edge 73+, Safari 17.2+, Firefox 78+. Em Safari abaixo de 17.2 o `imagesrcset` é ignorado e o `href` é usado como fallback — por isso o `href` deve apontar para o **menor** candidato, não o maior.

Referência: [MDN — `rel=preload` responsive images](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preload#responsive_images)

### Schema.org `openingHoursSpecification`

```json
"openingHoursSpecification": [{
  "@type": "OpeningHoursSpecification",
  "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
  "opens": "08:00",
  "closes": "18:00"
}]
```

`dayOfWeek` aceita array. `opens`/`closes` em `HH:MM` 24h. Múltiplos blocos no array para horários distintos por dia. Google usa esse campo como sinal do pacote local e para exibir status aberto/fechado.

Referência: [schema.org/OpeningHoursSpecification](https://schema.org/OpeningHoursSpecification) · [Google — Local Business structured data](https://developers.google.com/search/docs/appearance/structured-data/local-business)

### Geração da variante 1200w

Nenhuma dependência nova necessária se `cwebp` estiver disponível. A partir do master de maior resolução:

```bash
cwebp -q 82 -resize 1200 0 <origem> -o assets/home/hero-ampulheta-1200.webp
```

Alvo de tamanho: ~90 KB (interpolando entre 68 KB @800w e 148 KB @1600w). Se o resultado passar de ~100 KB, reduzir `-q` até 78 antes de considerar o item resolvido.

**Atenção**: não existe master em resolução maior no repositório — `hero-ampulheta-1600.webp` é o maior arquivo disponível. Reamostrar de 1600w já comprimido para 1200w gera perda geracional. Ver [Perguntas em Aberto](#perguntas-em-aberto).

## Contexto Histórico

`specs/research/2026-07-18-correcoes-seo.md` + `specs/plans/2026-07-18-correcoes-seo.md` cobriram 13 correções de SEO uma semana antes. Itens já resolvidos lá que **não devem ser reabertos**:

- Domínio canônico `www` unificado nas 240 URLs absolutas (commit `51723a5`)
- Breadcrumb JSON-LD `/tratamentos` → `/tratamentos.html`
- Merge dos dois blocos `MedicalWebPage`
- Titles ≤62ch e descriptions ≤160ch
- `404.html` criado; `tratamentos-quiz.html` com `noindex,follow`
- GTM real `GTM-5B27V5DF` (commits `80188e1`, `bf8c39a`)

Aquele PRD registrou o apex respondendo **301 → www** em 2026-07-18. Reverificado hoje: continua 301. Confirma que o item de redirect da nova auditoria era falso positivo de medição, não uma regressão.

Commits `388eade`, `37481af`, `3f835ad`, `99ad6eb` são uma sequência de correções de carrossel específicas para Safari/iOS (mask-image, transform, lazy loading inicial). O marquee da home é código sensível a WebKit — alterações estruturais ali têm histórico de quebrar em iPhone.

`docs/rastreamento-gtm.md` documenta o setup de GTM/GA4. Nenhum dos 7 itens toca rastreamento.

## Restrições e Considerações

- **Sem build.** Edição direta de HTML. Transformações repetitivas por script Python one-off, não por template.
- **Sem CI.** Não há teste automatizado nem lint. Verificação é manual: `curl` + parse do HTML publicado.
- **Deploy por push em `main`.** Propagação do GitHub Pages leva ~1–10 min; `cache-control: max-age=600` no edge Fastly.
- **Safari/iOS é o alvo primário.** Público usa iPhone. O item 2 depende de `imagesrcset`, suportado só a partir do Safari 17.2 — o `href` de fallback precisa ser o candidato menor.
- **CFM 1.974/2011.** Publicidade médica proíbe antes/depois, depoimento e promessa de resultado. `aggregateRating`/`review` no schema devem permanecer ausentes. O item 7 (`dateModified`) é seguro; qualquer coisa que soe como prova de eficácia não é.
- **Sem credencial Google.** CrUX e Search Console indisponíveis. Toda validação de performance é laboratório até que `/seo google` seja configurado — e laboratório não confirma melhora de campo.
- **JSON-LD hoje é 100% válido** (76 blocos, zero erros de parse). Qualquer script que edite os 13 arquivos precisa revalidar o parse dos 76 blocos como gate de saída.
- **O bloco `Physician` aparece 3× por página de detalhe** (linhas 93, 166, 191), mas só a ocorrência da linha 93 é o nó completo de 15 chaves; as outras duas são referências aninhadas mais curtas dentro de `MedicalProcedure`/`Service`. Um replace ingênuo por `"@type": "Physician"` atinge as três.

## Baseline de Medição

Capturado em 2026-07-25, commit `99ad6eb`, para comparação pós-implementação.

| Página | Perfil | LCP | CLS | FCP | Transferido |
|---|---|---|---|---|---|
| `/` | iPhone 390@3x, CPU 4x, Slow-4G | **3.132ms** | 0,0116 | 648ms | 446 KB |
| `/tratamentos.html` | idem | 616ms | 0,0012 | 616ms | 238 KB |
| `/detalhes/botox.html` | idem | 1.400ms | 0,0005 | 632ms | 191 KB |
| `/` | Desktop 1440, sem throttle | 804ms | 0,0086 | 176ms | **610 KB** |

Elemento LCP da home no mobile: `hero-ampulheta-1600.webp`. TTFB 44ms em todos os perfis.

Os 610 KB do desktop contra 446 KB do mobile são a evidência do download duplo do item 2: no desktop o `srcset` resolve para 800w enquanto o preload já buscou o 1600w.

## Achados que Invalidam Itens do Plano

### O `alt=""` da home está correto — item removido do escopo

O marquee de [index.html:487-514](index.html#L487-L514) tem dois grupos:

| Grupo | Linha | `aria-hidden` | imgs | alt preenchido | alt vazio |
|---|---|---|---|---|---|
| visível | 489 | não | 11 | **11** | 0 |
| clone | 502 | **sim** | 11 | 0 | 11 |

O grupo visível tem alt descritivo geo-modificado nas 11 imagens. O grupo clone existe só para a animação contínua e é corretamente removido da árvore de acessibilidade com `aria-hidden="true"` + `tabindex="-1"`. Preencher `alt` ali faria o leitor de tela anunciar os 11 tratamentos duas vezes.

A auditoria contou `alt=""` sem inspecionar o elemento pai. Não há trabalho a fazer.

### O apex já redireciona — item removido do escopo

```
https://draanapontes.com.br/       301 -> https://www.draanapontes.com.br/
http://draanapontes.com.br/        301 -> https://www.draanapontes.com.br/
http://www.draanapontes.com.br/    301 -> https://www.draanapontes.com.br/
```

A medição original usou `curl -L`, que segue a cadeia e reporta o 200 do destino. Consistente com o registrado em `specs/research/2026-07-18-correcoes-seo.md`.

**O que permanece verdadeiro**: `/tratamentos` e `/tratamentos.html` retornam ambos 200 — GitHub Pages serve as duas formas. É duplicação real de URL, mitigada pelo canonical absoluto auto-referente presente nas duas variantes. Não há como emitir 301 em GitHub Pages sem camada extra (Cloudflare/Netlify). Isso reforça o item 4: o `llms.txt` é o único lugar do repo que ainda declara a forma não-canônica.

## Perguntas em Aberto

1. **Existe master do hero em resolução maior que 1600w?** Fora do repositório — arquivo original da sessão de fotos. Sem ele, o 1200w sai de um reencode do 1600w já comprimido, com perda geracional. Aceitável na prática, mas se o master existir o resultado é melhor.

2. **Qual o horário real de funcionamento do consultório?** Necessário para o item 3. Precisa bater exatamente com o que está publicado no Google Business Profile — divergência entre GBP e schema é sinal negativo para o pacote local. Inclui sábado?

3. **A prioridade de linkagem interna do item 5 confere?** A hipótese é que Botox tem o maior volume de busca do conjunto e está com apenas 3 links de entrada. Sem Search Console ou dados de keyword, é inferência. Se a Dra. Ana tem procedimento de maior margem ou foco comercial diferente, o alvo do rebalanceamento muda.

4. **Item 7 tem valor suficiente?** `dateModified` visível é sinal de E-E-A-T para YMYL, mas cria obrigação de manutenção: data velha em página médica é pior que data ausente. Confirmar se haverá revisão periódica antes de implementar.

## Índice de Referências de Código

- [index.html:30](index.html#L30) — `<link rel="preload">` do hero, sem `imagesrcset` (itens 1, 2)
- [index.html:44](index.html#L44) — nó JSON-LD `Physician`, 15 chaves (item 3)
- [index.html:133-137](index.html#L133-L137) — `<img>` do hero, elemento LCP (item 1)
- [index.html:487](index.html#L487) — container `marquee--cards`
- [index.html:489](index.html#L489) — grupo visível do marquee, 11 alts preenchidos
- [index.html:502](index.html#L502) — grupo clone `aria-hidden`, 11 `alt=""` corretos
- [index.html:503-513](index.html#L503-L513) — os 11 cards clonados
- [tratamentos.html:33](tratamentos.html#L33) — nó `Physician` (item 3)
- `detalhes/*.html:93` — nó `Physician` completo nos 11 arquivos (item 3)
- `detalhes/*.html:166,191` — refs `Physician` aninhadas; **não** são o nó completo
- [css/styles.css](css/styles.css) — 7 blocos `@font-face`, fonte da verdade do item 6
- [llms.txt](llms.txt) — 13 URLs em forma não-canônica sem `.html` (item 4)
- [sitemap.xml](sitemap.xml) — 13 URLs em forma canônica `.html`, referência para o item 4
- `specs/research/2026-07-18-correcoes-seo.md` — PRD anterior, contexto de domínio/JSON-LD
- `specs/plans/2026-07-18-correcoes-seo.md` — plano anterior executado
