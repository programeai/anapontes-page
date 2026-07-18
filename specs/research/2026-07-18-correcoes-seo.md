---
date: 2026-07-18T01:22:01-03:00
researcher: claude
git_commit: 389df0df4a3440eee7a2ae33841f1a6c2f86613b
branch: new-design
topic: "Correções e ajustes de SEO da auditoria (domínio www, JSON-LD, titles, sitemap, 404, quiz, headings, GTM)"
tags: [research, seo, json-ld, sitemap, canonical, gtm]
status: complete
---

# Research: Correções de SEO — draanapontes.com.br

## Research Question

Auditoria de SEO (2026-07-18) identificou 13 correções. Decisão já tomada pelo usuário/auditoria: **manter `www.draanapontes.com.br` como domínio canônico** (alinhado ao DNS/CNAME atual) e atualizar todos os arquivos do repo.

1. Alinhar domínio canônico www vs sem-www em todos os arquivos
2. Corrigir breadcrumb JSON-LD `/tratamentos` → `/tratamentos.html` (11 páginas de detalhe)
3. Mesclar os dois blocos `MedicalWebPage` (`#geo-summary` + `#medical-context`) em um por página
4. Resolver referência pendurada `isPartOf` → `#website` (nó `WebSite` só existe na home)
5. Imagem relativa `../assets/...` → URL absoluta no JSON-LD `Physician` das páginas de detalhe
6. Unificar `"Dra. Ana Paula Pontes"` → `"Dra. Ana Pontes"` no `performer` do `MedicalProcedure`
7. Encurtar titles >70ch para ≤62ch (atualizar também `og:title` e `twitter:title`)
8. Encurtar meta description de `tratamentos.html` (214ch) para ≤160ch
9. Atualizar `lastmod` do `sitemap.xml` (está 2026-04-26)
10. Criar `404.html` com marca e navegação
11. `tratamentos-quiz.html`: remover canonical cruzado; `noindex,nofollow` → `noindex,follow`
12. Corrigir saltos de hierarquia de headings em `tratamentos.html`
13. Substituir placeholder `GTM-XXXXXXX` pelo ID real (**bloqueado: precisa do ID do usuário**)

## Summary

O site é HTML/CSS/JS estático puro (zero build, zero framework), hospedado com `CNAME` = `www.draanapontes.com.br`. O site ao vivo responde `301` de `draanapontes.com.br` → `www.draanapontes.com.br` (verificado via curl em 2026-07-18), mas **todas as 240 ocorrências** de URL absoluta no repo usam a forma sem `www` — não existe nenhuma ocorrência de `www.draanapontes.com.br` em código (apenas no `CNAME`). Isso significa que a correção do domínio é um find-replace global seguro de `https://draanapontes.com.br` → `https://www.draanapontes.com.br`.

As 11 páginas de detalhe são **100% uniformes em estrutura**: mesma sequência de 7 blocos JSON-LD (`FAQPage`, `Physician`, `MedicalProcedure`, `Service`, `BreadcrumbList`, `MedicalWebPage#geo-summary`, `MedicalWebPage#medical-context`), mesmo conjunto de chaves nos blocos (hash md5 idêntico nas 11), GTM nas mesmas linhas (32 e 292), footer idêntico. Qualquer transformação pode ser escrita uma vez e aplicada às 11 via script Python.

O GTM placeholder `GTM-XXXXXXX` está nas **14 páginas** (2 ocorrências por página: script no head e noscript no body), não apenas na home. O item 13 fica bloqueado até o usuário fornecer o ID real do container GTM.

## Codebase Map

### Affected Files & Modules

| File | Role | Relevance |
|------|------|-----------|
| `index.html` | Home | 14 URLs sem-www; title 72ch; GTM L38/L97; JSON-LD: Physician, BreadcrumbList, WebSite, FAQPage |
| `tratamentos.html` | Página canônica de tratamentos | 22 URLs sem-www; title 78ch; description 214ch; heading jump h1→h3 (L245→L251); GTM L26/L227 |
| `tratamentos-quiz.html` | LP B (quiz), noindex | robots L9 `noindex,nofollow`; canonical cruzado L10 → `tratamentos.html`; 1 URL sem-www; GTM L18/L25 |
| `detalhes/*.html` (11 arquivos) | Páginas de procedimento | 29 URLs sem-www cada; 7 blocos JSON-LD cada; GTM L32/L292; titles 70–87ch |
| `sitemap.xml` | Sitemap | 13 URLs sem-www; todos `lastmod=2026-04-26` |
| `robots.txt` | Robots | 2 URLs sem-www (Sitemap: e comentário llms.txt) |
| `llms.txt` | Perfil GEO/LLM | 14 URLs sem-www |
| `CNAME` | Config GitHub Pages | Conteúdo: `www.draanapontes.com.br` (fonte da verdade da decisão de domínio; **não alterar**) |
| `404.html` | **Não existe** | Criar (item 10) |
| `js/main.js`, `css/styles.css` | JS/CSS globais | Sem URLs absolutas do domínio (verificado); não precisam de alteração |

### Inventário de ocorrências `https://draanapontes.com.br` (sem-www)

```
29 × cada um dos 11 detalhes/*.html  (total 319)
22   tratamentos.html
14   index.html
14   llms.txt
13   sitemap.xml
 2   robots.txt
 1   tratamentos-quiz.html
```
Zero ocorrências de `https://www.draanapontes.com.br` em qualquer arquivo. Nenhuma ocorrência do domínio em `js/` ou `css/`.

### Estrutura JSON-LD das páginas de detalhe (uniforme nas 11)

Sequência de blocos `<script type="application/ld+json">` (botox.html como referência, offsets ~2883–12020):

1. `FAQPage` — espelha o FAQ visível da página
2. `Physician` — `@id: .../#physician`; **`"image": "../assets/77vrPACUVmjWbHcIpAUfWLuRSyw.webp"` (relativa — item 5)**; inclui `alternateName` (com "Dra. Ana Paula Pontes" — intencional para variações de busca), address, geo, sameAs, hasOfferCatalog
3. `MedicalProcedure` — `@id: ...#procedure`; **`performer.name: "Dra. Ana Paula Pontes"` (item 6)**
4. `Service` — `@id: ...#service`; areaServed João Pessoa; ServiceChannel → `https://wa.me/message/44CXA4J53PNUC1`
5. `BreadcrumbList` — item 2: **`"item": "https://draanapontes.com.br/tratamentos"` (sem `.html` — item 2 da lista)**
6. `MedicalWebPage` `@id: ...#geo-summary` — chaves: `url, name, inLanguage, isPartOf, about, mentions, speakable, abstract, publisher`
7. `MedicalWebPage` `@id: ...#medical-context` — chaves: `url, about, audience, lastReviewed (2026-04-26), reviewedBy, disclaimer, isPartOf`

**`isPartOf: {"@id": ".../#website"}`** aparece nos dois blocos MedicalWebPage; o nó `WebSite` (`@id: .../#website`) só é definido em `index.html` (item 4).

Merge (item 3): união dos dois conjuntos de campos em um único `MedicalWebPage` (sugestão de `@id`: `...#webpage`), sem perda de propriedade — não há chave conflitante entre os dois blocos além de `url`/`about`/`isPartOf`, que são idênticos.

### Titles atuais (com tamanho) e metas do item 7

| Página | Title atual | ch | Ação |
|---|---|---|---|
| index.html | Dra. Ana Pontes \| Botox, Preenchimento e Bioestimuladores em João Pessoa | 72 | encurtar ≤62 |
| tratamentos.html | Tratamentos em João Pessoa — Botox, Radiesse, PDRN, Fios PDO \| Dra. Ana Pontes | 78 | encurtar ≤62 |
| tratamentos-quiz.html | Qual tratamento é ideal para você? \| Dra. Ana Pontes | 52 | ok (noindex) |
| botox.html | Botox em João Pessoa \| Suavização de Rugas com Naturalidade \| Dra. Ana Pontes | 77 | encurtar ≤62 |
| culote.html | Tratamento para Culote em João Pessoa \| Redução de Gordura Localizada \| Dra. Ana Pontes | 87 | encurtar ≤62 |
| fios-de-tracao.html | Fios de Tração em João Pessoa \| Efeito Lifting sem Cirurgia \| Dra. Ana Pontes | 77 | encurtar ≤62 |
| fios-lisos.html | Fios PDO Lisos em João Pessoa \| Bioestimulação e Firmeza \| Dra. Ana Pontes | 74 | encurtar ≤62 |
| harmonizacao-glutea.html | Harmonização Glútea em João Pessoa \| Volume e Contorno sem Cirurgia \| Dra. Ana Pontes | 85 | encurtar ≤62 |
| lavieen-pdrn.html | Lavieen + PDRN em João Pessoa \| Glow Repair e Regeneração da Pele \| Dra. Ana Pontes | 83 | encurtar ≤62 |
| pdrn-injetavel.html | PDRN Injetável em João Pessoa \| Regeneração Celular da Pele \| Dra. Ana Pontes | 77 | encurtar ≤62 |
| pdrn-mesoject.html | PDRN Mesoject em João Pessoa \| Regeneração sem Agulhas \| Dra. Ana Pontes | 72 | encurtar ≤62 |
| preenchimento-facial.html | Preenchimento Facial em João Pessoa \| Contorno e Harmonia \| Dra. Ana Pontes | 75 | encurtar ≤62 |
| radiesse.html | Radiesse em João Pessoa \| Bioestimulador de Colágeno \| Dra. Ana Pontes | 70 | encurtar ≤62 |
| ultrassom-microfocado.html | Ultrassom Microfocado em João Pessoa \| Lifting e Firmeza da Pele \| Dra. Ana Pontes | 82 | encurtar ≤62 |

Padrão atual: `{Tratamento} em João Pessoa | {benefício} | Dra. Ana Pontes` — o segmento do meio é o que deve ser encurtado/removido. Em **cada** página, o mesmo texto do `<title>` se repete em `og:title` e `twitter:title` (e a description em `og:description`/`twitter:description`) — as três tags devem ser atualizadas juntas.

Meta description de `tratamentos.html` (214ch, item 8):
> "Conheça os tratamentos da Dra. Ana Pontes em Manaíra, João Pessoa: Botox, Preenchimento, Radiesse, PDRN, Lavieen, Fios PDO, Harmonização Glútea, Ultrassom Microfocado. Estética regenerativa com tecnologia avançada."

### Headings (item 12)

`tratamentos.html` — únicos saltos do site no `<main>`:
- `h1` (L245 "Tratamentos em João Pessoa") → `h3` ×4 (L251, 257, 263, 269 — cards de categoria do hero: "Rugas e expressão", "Flacidez e firmeza", "Qualidade da pele", "Contorno corporal"). Correção: h3→h2 nos cards, ou rebaixar para elemento não-heading; se virarem h2, os h3 dos cards de tratamento (L300+) já ficam corretos.
- Footer: `h4` ×3 (L481 "Navegue", L492 "Onde estamos", L497 "Minhas redes") — **padrão presente em TODAS as 14 páginas** (3 h4 por footer). Se for corrigir o salto h2→h4 do footer, a mudança é global (footer é copiado em cada arquivo). Alternativa de menor risco: manter h4 no footer (prática comum, impacto SEO baixo) e corrigir só o hero de tratamentos.html.

### GTM (item 13)

`GTM-XXXXXXX` em 2 pontos por página × 14 páginas (28 ocorrências):
- Script no `<head>` (ex.: `index.html:38`, `detalhes/*.html:32`, `tratamentos.html:26`, `tratamentos-quiz.html:18`)
- `<noscript>` iframe no `<body>` (ex.: `index.html:97`, `detalhes/*.html:292`, `tratamentos.html:227`, `tratamentos-quiz.html:25`)

Find-replace global de `GTM-XXXXXXX` → ID real resolve tudo. **Bloqueado até o usuário fornecer o ID.**

### tratamentos-quiz.html (item 11)

```
L9:  <meta name="robots" content="noindex,nofollow">
L10: <link rel="canonical" href="https://draanapontes.com.br/tratamentos.html">
```
Requisito: remover L10 (canonical cruzado conflita com noindex) e trocar L9 para `noindex,follow` (preserva equity dos links internos que a página recebe da home). Página corretamente fora do `sitemap.xml`. Não tem hreflang nem og:url próprios que precisem de ajuste de domínio além da L10.

### Estrutura para o 404.html (item 10)

Reusar o esqueleto das páginas existentes: `<link rel="stylesheet" href="/css/styles.css">` (index.html:31), `<header class="site-header">` com `<nav class="nav__menu" id="nav-menu">` (index.html:100–123), footer padrão, `<script src="/js/main.js" defer></script>` (index.html:523). Deve ter `<meta name="robots" content="noindex">`, sem canonical, sem entrada no sitemap. GitHub Pages serve `404.html` da raiz automaticamente.

### Sitemap (item 9)

13 URLs, todas com `lastmod=2026-04-26`, `changefreq=monthly`, priorities 1.0/0.9/0.8. Requisito: atualizar `lastmod` para a data do deploy das correções (2026-07-18) — todas as páginas serão tocadas pelo find-replace de domínio, então um único valor novo para todas é factual.

## External Research

Não necessário — todas as correções são de arquivos estáticos locais com padrões bem estabelecidos (canonical/OG/JSON-LD/sitemap). Verificação ao vivo já realizada:
- `curl -I https://draanapontes.com.br/` → `301` → `https://www.draanapontes.com.br/` (HTTP e HTTPS)
- `https://www.draanapontes.com.br/` → `200`, servindo a versão atual do repo (title confere)
- `https://www.draanapontes.com.br/sitemap.xml` e `/detalhes/botox.html` → `200`

## Historical Context

- Memória do projeto: site reconstruído em HTML/CSS/JS puro (zero Framer); páginas `detalhes/*` seguem template de conversão dor→resultado→qualificação; `tratamentos-quiz.html` é LP B intencionalmente noindex; rastreamento GTM implementado com placeholder aguardando ID real (`docs/rastreamento-gtm.md`).
- `docs/rastreamento-gtm.md` e `docs/copy-conversao.md` documentam tracking e copy — o primeiro menciona o placeholder GTM.
- Constraint CFM (publicidade médica): não usar antes/depois nem promessas de resultado — relevante ao redigir novos titles/descriptions (item 7/8): manter linguagem de avaliação/indicação individual, sem superlativos de resultado.
- `specs/` não existia; criado agora com este documento.

## Constraints & Considerations

- **Ordem das operações importa**: o find-replace de domínio (item 1) deve rodar ANTES ou JUNTO das edições de JSON-LD/canonical (itens 2–6, 11), para não gerar arquivos meio-www meio-sem-www. Alternativa segura: aplicar itens 2–6 primeiro e o replace global por último (o replace pega tudo, inclusive texto novo se escrito sem www — mais simples: escrever tudo novo já com www e rodar o replace global no final da fase 1).
- **`CNAME` não deve ser alterado** — é a âncora da decisão (www).
- **`alternateName` do Physician mantém "Dra. Ana Paula Pontes"** — é variação de busca intencional; o item 6 só padroniza o campo `performer.name` do `MedicalProcedure`.
- Uniformidade das 11 páginas de detalhe permite (e recomenda) transformação via script único (Python/sed) em vez de edições manuais — menor risco de divergência.
- JSON-LD após edição deve continuar parseável — validar com `json.loads` em todos os blocos de todas as páginas como gate de verificação.
- `wa.me`, `googletagmanager.com`, `instagram.com`, `maps.app.goo.gl` NÃO devem ser tocados pelo replace de domínio (o padrão `https://draanapontes.com.br` não colide com eles, mas o script deve usar o padrão completo com protocolo para garantir).
- Titles novos (item 7): preservar keyword local "em João Pessoa" + marca "Dra. Ana Pontes"; linguagem compatível com CFM; sincronizar `<title>`, `og:title`, `twitter:title`.
- O site ao vivo já serve a versão deste repo — as correções entram em produção no próximo push/merge para o branch de deploy.

## Open Questions

1. **ID real do GTM** (item 13) — bloqueado; sem ele o placeholder permanece. Encaminhar ao usuário.
2. **Copy final dos titles encurtados** (item 7) — a pesquisa documenta os atuais e o padrão; a redação final é decisão de /spec (sugerido: cortar/encurtar o segmento do meio, ex. "Tratamento para Culote em João Pessoa | Dra. Ana Pontes" = 56ch).
3. **Footer h4 (site-wide)**: corrigir globalmente (14 arquivos) ou manter h4 e corrigir só o hero de tratamentos.html? Impacto SEO do h4 no footer é baixo; decisão de escopo para /spec.
4. **Nó `WebSite` nas páginas internas** (item 4): duas opções válidas — (a) remover `isPartOf` do MedicalWebPage mesclado (mais simples), ou (b) adicionar nó `WebSite` mínimo em cada página (mais completo). Decisão para /spec; a auditoria original inclinou para (a).

## Code References Index

- `CNAME:1` — `www.draanapontes.com.br` (fonte da decisão de domínio)
- `index.html:31` — stylesheet global `/css/styles.css`
- `index.html:38,97` — GTM placeholder (head script / noscript)
- `index.html:100-123` — header/nav padrão (base para 404.html)
- `index.html:523` — `/js/main.js` defer
- `tratamentos.html:26,227` — GTM placeholder
- `tratamentos.html:245` — h1; `:251,257,263,269` — h3 do hero (salto h1→h3)
- `tratamentos.html:481,492,497` — h4 do footer (padrão em todas as 14 páginas)
- `tratamentos-quiz.html:9-10` — robots noindex,nofollow + canonical cruzado
- `tratamentos-quiz.html:18,25` — GTM placeholder
- `detalhes/botox.html:32,292` — GTM placeholder (mesmas linhas nos 11 arquivos)
- `detalhes/botox.html` blocos JSON-LD (chars ~2883–12020) — sequência FAQPage, Physician, MedicalProcedure, Service, BreadcrumbList, MedicalWebPage×2 (idêntica nas 11 páginas)
- `sitemap.xml` — 13 URLs sem-www, lastmod 2026-04-26
- `robots.txt:4,7` — Sitemap URL e comentário llms.txt (sem-www)
- `llms.txt` — 14 URLs sem-www
- `docs/rastreamento-gtm.md` — doc do tracking/placeholder GTM
