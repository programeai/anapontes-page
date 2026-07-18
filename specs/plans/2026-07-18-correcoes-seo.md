---
date: 2026-07-18T01:35:00-03:00
author: claude
source_prd: specs/research/2026-07-18-correcoes-seo.md
git_commit: 389df0df4a3440eee7a2ae33841f1a6c2f86613b
branch: new-design
status: implemented
tags: [spec, seo, json-ld, sitemap, canonical]
---

# Spec: Correções de SEO — draanapontes.com.br

## Overview

Aplicar as 11 correções de SEO aprovadas da auditoria de 2026-07-18 (o item GTM foi removido do escopo — ID indisponível; o footer `<h4>` será mantido por decisão do usuário). A estratégia central: como as 11 páginas de `detalhes/` são estruturalmente idênticas, as transformações de JSON-LD são feitas por **script Python único** aplicado às 11, com gate de verificação `json.loads` em todos os blocos de todas as páginas. A migração de domínio (sem-www → www) roda **por último** (Fase 4), para nunca existir estado misto: todo texto novo escrito nas Fases 1–3 usa a forma sem-www atual e é convertido pelo replace global.

Decisões fechadas com o usuário (2026-07-18):
- Domínio canônico: `https://www.draanapontes.com.br` (CNAME intocado)
- `isPartOf` → `#website` pendurado: **remover** (não adicionar nó WebSite nas internas)
- Dois `MedicalWebPage` → **mesclar** em um único nó `@id ...#webpage`
- Footer `<h4>` (14 páginas): **manter**; corrigir apenas o salto h1→h3 do hero de `tratamentos.html`
- GTM `GTM-XXXXXXX`: **fora do escopo** (permanece placeholder)
- Titles: copy proposta nesta spec (tabela na Fase 2)

## Current State

Ver PRD (`specs/research/2026-07-18-correcoes-seo.md`) para o inventário completo. Resumo: 240 ocorrências de `https://draanapontes.com.br` (sem-www) em 17 arquivos e zero com www; 11 páginas de detalhe com 7 blocos JSON-LD uniformes (2 `MedicalWebPage` duplicados, breadcrumb para URL inexistente `/tratamentos`, imagem relativa no `Physician`, `performer.name` divergente); titles de 70–87ch em 12 páginas; description de 214ch em `tratamentos.html`; sitemap com `lastmod` 2026-04-26; sem `404.html`; quiz com `noindex,nofollow` + canonical cruzado; salto h1→h3 no hero de `tratamentos.html`.

## Desired End State

- Todas as URLs absolutas do repo (canonical, hreflang, og:url, JSON-LD, sitemap, robots, llms.txt) usam `https://www.draanapontes.com.br`; `grep -rI 'https://draanapontes\.com\.br'` retorna zero em todos os arquivos rastreados.
- Cada página de detalhe tem exatamente 6 blocos JSON-LD (`FAQPage`, `Physician`, `MedicalProcedure`, `Service`, `BreadcrumbList`, `MedicalWebPage#webpage`), todos parseáveis, sem `@id` duplicado, sem referência a `#website`, breadcrumb apontando para `/tratamentos.html`, imagem do Physician absoluta, `performer.name = "Dra. Ana Pontes"`.
- Todos os titles ≤62ch com "João Pessoa" e "Dra. Ana Pontes"; `<title>` = `og:title` = `twitter:title` em cada página; description de `tratamentos.html` ≤160ch sincronizada nas 3 tags.
- `tratamentos-quiz.html` com `noindex,follow` e sem canonical.
- Hero de `tratamentos.html` sem salto de heading (h1→h2), visual inalterado.
- `404.html` na raiz com header/nav/footer padrão, `noindex`, fora do sitemap.
- `sitemap.xml` com `lastmod=2026-07-18` nas 13 URLs.

## What We're NOT Doing

- **GTM**: placeholder `GTM-XXXXXXX` permanece nas 14 páginas (28 ocorrências) — bloqueado por falta do ID real. Quando disponível: find-replace global de `GTM-XXXXXXX`.
- **Footer h4**: mantido nas 14 páginas (decisão do usuário; impacto SEO baixo).
- **Acentuação nos campos GEO do JSON-LD** (`"Botox em Joao Pessoa"`, `abstract` sem acentos): texto ASCII intencional/pré-existente; corrigir mudaria conteúdo além do escopo da auditoria.
- **`lastReviewed` (2026-04-26)** no bloco mesclado: mantido — é a data da última revisão médica do conteúdo pela Dra.; esta mudança é de metadados, não de conteúdo clínico.
- **Pretty URLs** (remover `.html`): mudança de arquitetura de hospedagem, fora do escopo.
- **Alterar `CNAME`**: é a âncora da decisão de domínio.
- **`alternateName` do Physician**: "Dra. Ana Paula Pontes" permanece na lista (variação de busca intencional).

---

## Phase 1: Schema JSON-LD das 11 páginas de detalhe

### Goal
Corrigir os 5 defeitos de structured data (breadcrumb, merge MedicalWebPage, isPartOf, imagem relativa, performer.name) nas 11 páginas via script único.

### Changes

#### Script de transformação (executar via Bash, não commitar)

**Create** (temporário, no scratchpad): `fix_jsonld.py` — aplicar a `detalhes/*.html`:

```python
import re, json, glob

for f in sorted(glob.glob('detalhes/*.html')):
    s = open(f, encoding='utf-8').read()

    # (a) breadcrumb: /tratamentos -> /tratamentos.html (robusto a whitespace)
    s = re.sub(r'("item":\s*"https://draanapontes\.com\.br/tratamentos)(")', r'\1.html\2', s)

    # (b) imagem relativa do Physician -> absoluta (sem-www; Fase 4 converte p/ www)
    s = s.replace('"image": "../assets/77vrPACUVmjWbHcIpAUfWLuRSyw.webp"',
                  '"image": "https://draanapontes.com.br/assets/77vrPACUVmjWbHcIpAUfWLuRSyw.webp"')

    # (c) performer.name (NAO toca o alternateName, que nao tem prefixo "name":)
    s = s.replace('"name": "Dra. Ana Paula Pontes"', '"name": "Dra. Ana Pontes"')

    # (d) merge dos dois MedicalWebPage em um #webpage, sem isPartOf
    blocks = list(re.finditer(r'<script type="application/ld\+json">\s*(\{.*?\})\s*</script>\n?', s, re.S))
    geo = next(b for b in blocks if '#geo-summary' in b.group(1))
    med = next(b for b in blocks if '#medical-context' in b.group(1))
    g, m = json.loads(geo.group(1)), json.loads(med.group(1))
    merged = {**g, **{k: v for k, v in m.items() if k not in g}}
    merged['@id'] = merged['url'] + '#webpage'
    merged.pop('isPartOf', None)
    new_block = ('<script type="application/ld+json">\n'
                 + json.dumps(merged, ensure_ascii=False, indent=2)
                 + '\n</script>\n')
    # substitui o bloco geo pelo merged e remove o bloco medical-context
    s = s[:geo.start()] + new_block + s[geo.end():med.start()] + s[med.end():]
    open(f, 'w', encoding='utf-8').write(s)
    print(f'{f}: ok')
```

Notas de implementação:
- Os dois blocos `MedicalWebPage` são **adjacentes e os últimos** do `<head>` em todas as 11 páginas (ordem: FAQPage, Physician, MedicalProcedure, Service, BreadcrumbList, geo-summary, medical-context) — o slice acima assume `geo` antes de `med`; validar com assert `geo.start() < med.start()`.
- Merge preserva do `#geo-summary`: `url, name, inLanguage, about, mentions, speakable, abstract, publisher`; adiciona do `#medical-context`: `audience, lastReviewed, reviewedBy, disclaimer`. Chaves em comum (`@context, @type, url, about`) são idênticas nos dois blocos.
- `@id` final: `https://draanapontes.com.br/detalhes/<slug>.html#webpage`.

### Success Criteria

#### Automated Verification
- [x] `python3 -c` gate: para cada um dos 11 arquivos, todos os blocos `ld+json` passam em `json.loads` e a sequência de `@type` é exatamente `['FAQPage','Physician','MedicalProcedure','Service','BreadcrumbList','MedicalWebPage']`
- [x] `grep -rL 'tratamentos.html"' detalhes/ | wc -l` → 0 e `grep -rn '"item": "https://draanapontes.com.br/tratamentos"' detalhes/` → vazio
- [x] `grep -rn '\.\./assets' detalhes/*.html | grep 'ld+json' -c` → 0 (nenhuma URL relativa em JSON-LD; conferir com grep de `"image": "../` nos arquivos)
- [x] `grep -rn '"name": "Dra. Ana Paula Pontes"' detalhes/` → vazio; `grep -c '"Dra. Ana Paula Pontes"' detalhes/botox.html` → 1 (só o alternateName)
- [x] `grep -rn '#geo-summary\|#medical-context\|#website' detalhes/` → vazio
- [x] `git diff --stat` toca exatamente os 11 arquivos de `detalhes/`

#### Manual Verification
- [ ] Colar o `<head>` de `detalhes/botox.html` no https://validator.schema.org/ — 0 erros, 1 único MedicalWebPage
- [ ] Abrir a página no navegador — render idêntico (mudanças só em `<script>` do head)

**⏸ PAUSE**: confirmar com o usuário antes da Fase 2.

---

## Phase 2: Titles e descriptions

### Goal
Encurtar titles para ≤62ch (13 páginas indexáveis) e a description de `tratamentos.html` para ≤160ch, sincronizando `<title>`/`og:title`/`twitter:title` (e `description`/`og:description`/`twitter:description` onde a description mudar).

### Changes

#### Tabela de titles (copy final — validada ≤62ch, keyword local + marca, linguagem CFM)

| Arquivo | Novo title | ch |
|---|---|---|
| `index.html` | Dra. Ana Pontes \| Botox e Preenchimento em João Pessoa | 54 |
| `tratamentos.html` | Tratamentos Estéticos em João Pessoa \| Dra. Ana Pontes | 54 |
| `detalhes/botox.html` | Botox em João Pessoa \| Naturalidade \| Dra. Ana Pontes | 53 |
| `detalhes/culote.html` | Tratamento para Culote em João Pessoa \| Dra. Ana Pontes | 55 |
| `detalhes/fios-de-tracao.html` | Fios de Tração em João Pessoa \| Lifting \| Dra. Ana Pontes | 57 |
| `detalhes/fios-lisos.html` | Fios PDO Lisos em João Pessoa \| Firmeza \| Dra. Ana Pontes | 57 |
| `detalhes/harmonizacao-glutea.html` | Harmonização Glútea em João Pessoa \| Dra. Ana Pontes | 52 |
| `detalhes/lavieen-pdrn.html` | Lavieen + PDRN em João Pessoa \| Glow Repair \| Dra. Ana Pontes | 61 |
| `detalhes/pdrn-injetavel.html` | PDRN Injetável em João Pessoa \| Regeneração \| Dra. Ana Pontes | 61 |
| `detalhes/pdrn-mesoject.html` | PDRN Mesoject sem Agulhas em João Pessoa \| Dra. Ana Pontes | 58 |
| `detalhes/preenchimento-facial.html` | Preenchimento Facial em João Pessoa \| Dra. Ana Pontes | 53 |
| `detalhes/radiesse.html` | Radiesse em João Pessoa \| Bioestimulador \| Dra. Ana Pontes | 58 |
| `detalhes/ultrassom-microfocado.html` | Ultrassom Microfocado em João Pessoa \| Dra. Ana Pontes | 54 |

(`tratamentos-quiz.html` não muda — noindex, title 52ch ok.)

**Modify** em cada arquivo da tabela — 3 tags recebem a MESMA string nova (localização de referência em `detalhes/botox.html`: `<title>` L6, `og:title` L17, `twitter:title` L22; home e tratamentos têm as mesmas tags no head):
```html
<title>{novo}</title>
<meta property="og:title" content="{novo}">
<meta name="twitter:title" content="{novo}">
```
Implementar via script Python com dict `{arquivo: title}` substituindo o conteúdo atual exato das 3 tags (o texto atual do title é idêntico nas 3 tags de cada página — replace da string antiga pela nova cobre as 3 ocorrências).

**Modify**: `tratamentos.html` — nova description (153ch) nas 3 tags (`name="description"`, `og:description`, `twitter:description`):
> Botox, Preenchimento, Radiesse, PDRN, Fios PDO e Ultrassom Microfocado em Manaíra, João Pessoa. Conheça os tratamentos da Dra. Ana Pontes (CRM 16743 PB).

Atenção: a description atual de `tratamentos.html` pode diferir entre a tag principal e og/twitter (a twitter costuma ser truncada) — substituir cada tag individualmente pelo mesmo texto novo, não por replace único.

### Success Criteria

#### Automated Verification
- [x] Script de auditoria: todos os `<title>` ≤62ch; todos contêm "João Pessoa" (exceto quiz) e "Dra. Ana Pontes"; `<title>` == `og:title` == `twitter:title` em cada uma das 13 páginas
- [x] Description de `tratamentos.html` ≤160ch e idêntica nas 3 tags
- [x] Nenhum title duplicado entre páginas (`sort | uniq -d` → vazio)

#### Manual Verification
- [ ] Ler a tabela renderizada de titles nas SERPs simuladas (qualquer snippet preview tool) — sem truncamento

**⏸ PAUSE**: confirmar com o usuário antes da Fase 3.

---

## Phase 3: Quiz, headings do hero, 404.html e sitemap

### Goal
Corrigir sinais conflitantes do quiz, o salto de heading de `tratamentos.html`, criar página 404 e atualizar o sitemap.

### Changes

**Modify**: `tratamentos-quiz.html:9-10`
```html
<!-- antes -->
<meta name="robots" content="noindex,nofollow">
<link rel="canonical" href="https://draanapontes.com.br/tratamentos.html">
<!-- depois (a linha do canonical é REMOVIDA) -->
<meta name="robots" content="noindex,follow">
```

**Modify**: `tratamentos.html:251,257,263,269` — os 4 `<h3>` dos goal-cards do hero viram `<h2>` (fecha o salto h1→h3; os `<h3>` dos cards de tratamento nas seções abaixo ficam corretos sob os `<h2>` de seção):
```html
<h3>Rugas e expressão</h3>      →  <h2>Rugas e expressão</h2>
<h3>Flacidez e firmeza</h3>     →  <h2>Flacidez e firmeza</h2>
<h3>Qualidade da pele</h3>      →  <h2>Qualidade da pele</h2>
<h3>Contorno corporal</h3>      →  <h2>Contorno corporal</h2>
```

**Modify**: `css/styles.css:478` — acompanhar a mudança de tag para manter o visual (o seletor define font-family/size próprios, sobrepondo o h2 base):
```css
/* antes */
.goal-card h3 { font-family: var(--font-ui); font-size: 1.12rem; margin-bottom: .3rem; }
/* depois */
.goal-card h2 { font-family: var(--font-ui); font-size: 1.12rem; margin-bottom: .3rem; }
```

**Create**: `404.html` (raiz) — esqueleto reusando header (`tratamentos.html:229-240`), footer (`tratamentos.html:472-506`), `/css/styles.css` e `/js/main.js`. Head mínimo:
```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Página não encontrada | Dra. Ana Pontes</title>
  <meta name="robots" content="noindex">
  <link rel="icon" href="/assets/Oe8gElcp7S2A4gVo5BDhFv0xsqE.png">
  <link rel="stylesheet" href="/css/styles.css">
</head>
```
Body: header padrão copiado + `<main>` com `<h1>Página não encontrada</h1>`, parágrafo curto e 3 links — `/` (Início), `/tratamentos.html` (Ver tratamentos), CTA WhatsApp (`https://wa.me/message/44CXA4J53PNUC1`, mesmo padrão de classe de botão das outras páginas) — + footer padrão copiado + `<script src="/js/main.js" defer></script>`. Sem canonical, sem OG, sem JSON-LD, sem GTM, **não adicionar ao sitemap**.

**Modify**: `sitemap.xml` — todas as 13 tags `<lastmod>2026-04-26</lastmod>` → `<lastmod>2026-07-18</lastmod>` (todas as páginas são tocadas nas Fases 1–4).

### Success Criteria

#### Automated Verification
- [x] `grep -n 'canonical\|robots' tratamentos-quiz.html` → apenas `noindex,follow`, sem canonical
- [x] Script de headings: sequência de headings do `<main>` de `tratamentos.html` sem saltos (h1→h2→h3)
- [x] `grep -c 'goal-card h2' css/styles.css` → 1 e `grep -c 'goal-card h3' css/styles.css` → 0
- [x] `test -f 404.html` e `grep -q 'noindex' 404.html` e `grep -vq '404' sitemap.xml`
- [x] `grep -c '2026-07-18' sitemap.xml` → 13; `grep -c '2026-04-26' sitemap.xml` → 0
- [x] `python3 -c "import xml.dom.minidom, sys; xml.dom.minidom.parse('sitemap.xml')"` — XML válido

#### Manual Verification
- [ ] `python3 -m http.server` → abrir `/tratamentos.html`: goal-cards do hero visualmente idênticos (fonte, tamanho, espaçamento)
- [ ] Abrir `/404.html`: header/nav/footer funcionam, links corretos, visual consistente com o site

**⏸ PAUSE**: confirmar com o usuário antes da Fase 4.

---

## Phase 4: Migração de domínio (www) + verificação final

### Goal
Converter todas as URLs absolutas para o domínio canônico `www` e rodar a bateria completa de verificação do site.

### Changes

**Modify** (find-replace global): em todos os `*.html` (raiz + `detalhes/` + `404.html` se tiver URL absoluta — não deve ter), `sitemap.xml`, `robots.txt`, `llms.txt`:
```bash
grep -rIl 'https://draanapontes\.com\.br' --include='*.html' --include='*.xml' --include='*.txt' . \
  | grep -v node_modules \
  | xargs sed -i 's|https://draanapontes\.com\.br|https://www.draanapontes.com.br|g'
```
- O padrão inclui o protocolo — não colide com `wa.me`, `googletagmanager.com`, `instagram.com`, `maps.app.goo.gl` nem com o texto `draanapontes.com.br - GEO profile` do llms.txt (linha 1, sem protocolo — **verificar após o replace se essa menção textual deve permanecer sem www; sim, é título descritivo, manter**).
- `CNAME` não é tocado (não tem protocolo e não bate no padrão).

### Success Criteria

#### Automated Verification
- [x] `grep -rIn 'https://draanapontes\.com\.br' --include='*.html' --include='*.xml' --include='*.txt' . | grep -v node_modules` → vazio
- [x] `grep -c 'https://www.draanapontes.com.br' sitemap.xml` → 13
- [x] Gate JSON-LD completo: todos os blocos de TODAS as 14 páginas parseiam; nenhuma URL sem-www dentro de JSON-LD; `@id` únicos por página
- [x] Script de consistência por página indexável: `canonical` == `og:url` == URL do sitemap correspondente (com www)
- [x] `cat CNAME` → `www.draanapontes.com.br` (inalterado)
- [x] Re-rodar auditoria completa da conversa (titles, alts, width/height, links internos) — zero regressões

#### Manual Verification
- [ ] `python3 -m http.server` → navegar home → tratamentos → 2 detalhes → quiz: navegação, quiz e CTAs WhatsApp funcionando
- [ ] Após deploy: `curl -I https://www.draanapontes.com.br/sitemap.xml` → 200 com URLs www; reenviar sitemap no Google Search Console (propriedade www)

**⏸ PAUSE**: revisão final com o usuário.

---

## Testing Strategy

### Unit Tests
Projeto sem framework de testes (HTML estático). A "unidade" é o gate de verificação por fase (scripts Python/grep listados acima), executado após cada fase e novamente ao final.

### Integration Tests
- Smoke manual via `python3 -m http.server`: home → tratamentos → detalhe → quiz → 404 (URL inválida).
- Validação externa pós-merge: https://validator.schema.org/ (botox + home), Google Rich Results Test (FAQ + Breadcrumb).

### Migration & Rollback
- Trabalho no branch `new-design`; cada fase = 1 commit isolado (padrão Solarz PT-BR) → rollback por `git revert` de fase.
- Pós-deploy: reenviar `sitemap.xml` no Search Console na propriedade `https://www.draanapontes.com.br`. O Google reprocessa canonicals gradualmente; nenhum redirect novo é necessário (o 301 sem-www→www já existe na hospedagem).

## Environment Considerations
- **CI/CD**: nenhum pipeline; deploy é push do branch de produção (GitHub Pages).
- **Config/Secrets**: nenhum. GTM fica pendente de ID (fora do escopo).
- **Search Console**: garantir que a propriedade verificada cubra `www` (domínio ou prefixo www) antes de reenviar o sitemap.

## Dependencies & Risks
- **Ordem obrigatória**: Fase 4 (replace de domínio) por último — Fases 1–3 escrevem URLs novas na forma sem-www de propósito.
- **Risco do merge JSON-LD**: mitigado pelo gate `json.loads` + assert de ordem dos blocos; as 11 páginas têm hash de estrutura idêntico (PRD).
- **Risco visual do h3→h2**: mitigado pela atualização do seletor `.goal-card` em `css/styles.css:478` (o seletor já define font-size/family próprios).
- **Replace de domínio**: padrão com protocolo completo; único texto sem protocolo (`llms.txt` linha 1) fica intencionalmente como está.
- **SERP durante transição**: encurtamento de titles pode oscilar CTR por alguns dias; monitorar no Search Console.

## References
- PRD: `specs/research/2026-07-18-correcoes-seo.md`
- Docs do projeto: `docs/rastreamento-gtm.md` (GTM pendente), `docs/copy-conversao.md` (tom de copy/CFM)
