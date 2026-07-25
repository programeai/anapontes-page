---
date: 2026-07-25T18:11:01-03:00
author: claude
source_prd: specs/research/2026-07-25-seo-lcp-schema-linkagem.md
git_commit: 99ad6ebf9397a1b19ce622acfe1d69ab14075d5d
branch: main
status: implemented
tags: [spec, seo, core-web-vitals, lcp, json-ld, schema, llms-txt, linkagem-interna, fonts]
---

# Spec: Correções de SEO — auditoria 2026-07-25

## Overview

Seis correções pontuais no site estático da Dra. Ana Pontes, derivadas da auditoria de 2026-07-25. A única com impacto de ranking medido é o LCP mobile da home (3.132ms, faixa "Needs Improvement"), causado por um `srcset` que salta de 800w para 1600w sem candidato intermediário — um iPhone 390px @DPR3 precisa de 1170px e por isso baixa o arquivo de 150 KB. As outras cinco são higiene: uma chave faltando no schema `Physician`, URLs não canônicas no `llms.txt`, concentração de linkagem interna e 119,7 KB de fontes órfãs.

Não há build nem CI. Toda alteração é edição direta de arquivo, e as transformações que atingem as 13 páginas indexáveis saem por script Python one-off com gate de validação por reparse do JSON-LD. Deploy é push em `main`; o GitHub Pages propaga em ~1–10 min com `max-age=600` no edge.

O faseamento isola a fase 1 (LCP) porque é a única que exige medição em laboratório como critério de aceite. As fases 2, 3 e 4 são mutuamente independentes: se uma travar, as outras seguem.

## Current State

- [index.html:30](index.html#L30) — `<link rel="preload" as="image" href="…hero-ampulheta-1600.webp" fetchpriority="high">`, sem `imagesrcset`/`imagesizes`. Força o download da URL literal em qualquer viewport.
- [index.html:133-137](index.html#L133-L137) — `<img>` do hero com `srcset` de dois candidatos (800w, 1600w) e `sizes` correto. É o elemento LCP no mobile.
- [assets/home/](assets/home/) — só `hero-ampulheta-800.webp` (65.638 B) e `hero-ampulheta-1600.webp` (150.026 B, `1600×2070`). Não existe master em resolução maior no repositório.
- Nó JSON-LD `Physician` replicado em 13 páginas com 15 chaves, sem `openingHoursSpecification`.
- [llms.txt](llms.txt) — 12 das 13 URLs em forma não canônica, sem `.html`.
- 33 slots de "Tratamentos relacionados" nas 11 páginas de detalhe, distribuídos de forma concentrada: Radiesse recebe 8, Botox recebe 1.
- [fonts/](fonts/) — 15 `.woff2`, dos quais 7 referenciados nos `@font-face` de [css/styles.css:7-20](css/styles.css#L7-L20) e 8 sem nenhuma referência no repositório.

## Desired End State

- `assets/home/hero-ampulheta-1200.webp` existe (~90 KB, alvo máximo 100 KB) e é o candidato escolhido em iPhone 390px @DPR3.
- O preload do hero declara `imagesrcset` com os três candidatos e `imagesizes` **byte-a-byte idêntico** ao `sizes` do `<img>`. Nenhum viewport baixa dois arquivos do hero.
- LCP mobile da home abaixo de 2.500ms no mesmo perfil de laboratório do baseline (iPhone 390@3x, CPU 4x, Slow-4G). CLS permanece ≤ 0,02.
- Os 13 nós `Physician` têm 16 chaves, com `openingHoursSpecification` declarando Seg–Qui 09:00–19:00. Os 74 blocos JSON-LD do site continuam parseando sem erro.
- As 13 URLs do `llms.txt` batem exatamente com as 13 `<loc>` do [sitemap.xml](sitemap.xml).
- Nos "Tratamentos relacionados": Botox com 5 links de entrada, Radiesse com 6, ninguém acima de 6. O total de 33 slots é preservado — nenhuma página de detalhe ganha ou perde cards.
- `fonts/` tem 7 arquivos, exatamente os referenciados pelos `@font-face`. As 3 famílias (Libre Baskerville, Inter, General Sans) renderizam normalmente e nenhuma requisição a `/fonts/` retorna 404.

## What We're NOT Doing

- **`dateModified` visível nas 11 páginas médicas** (item 7 do PRD) — removido do escopo por decisão do usuário. Cria obrigação de manutenção e as páginas já expõem `lastReviewed` no `MedicalWebPage`, que entrega o sinal ao Google sem risco de data velha em página YMYL.
- **Alterar o `sizes` do `<img>` do hero** — já está correto. Mexer nele quebraria a paridade exigida com `imagesizes`.
- **Alterar a estrutura do marquee de [index.html:487-514](index.html#L487-L514)** — os `alt=""` do grupo clone estão corretos (`aria-hidden="true"` + `tabindex="-1"`), e os commits `388eade`, `37481af`, `3f835ad`, `99ad6eb` mostram que é código sensível a WebKit. O marquee já linka as 11 páginas uniformemente.
- **Redirect 301 de `/tratamentos` para `/tratamentos.html`** — impossível no GitHub Pages sem camada extra. Mitigado pelo canonical absoluto auto-referente nas duas variantes.
- **Subir os links de entrada de `culote` e `harmonizacao-glutea`** — ficam em 1 cada. Subi-los exigiria colocá-los como "relacionados" em páginas faciais, sem nexo clínico. Já recebem cobertura uniforme pelo marquee da home e por `tratamentos.html`.
- **Blocos `opens/closes: "00:00"` para os dias fechados** no `openingHoursSpecification`. Sexta, sábado e domingo ficam não declarados — forma mínima correta, evita a convenção de dia-fechado que é fácil de errar.
- **Reencodar `hero-ampulheta-800.webp` ou `-1600.webp`** — não há master de origem melhor, reencodar só adicionaria perda.
- **`aggregateRating` / `review` no schema** — proibido pela Res. CFM 1.974/2011. Permanecem ausentes.

---

## Phase 1: LCP do hero — variante 1200w e preload responsivo

### Goal

Fazer o iPhone 390px @DPR3 baixar ~90 KB em vez de 150 KB para o elemento LCP, e eliminar o download duplo do hero em desktop.

### Changes

#### Geração do asset

**Create**: `assets/home/hero-ampulheta-1200.webp`

Gerado por Pillow (12.2.0 disponível; `cwebp` **não** está instalado nesta máquina — o comando `cwebp` sugerido no PRD não é executável aqui). Reamostragem Lanczos a partir do 1600w, que é o maior arquivo existente. Há perda geracional, aceita por decisão do usuário: não há master em resolução maior.

Script one-off, executar da raiz do repositório:

```python
# scripts/gen-hero-1200.py  (one-off; pode ser descartado após a fase)
from PIL import Image

SRC = "assets/home/hero-ampulheta-1600.webp"
OUT = "assets/home/hero-ampulheta-1200.webp"
TARGET_W = 1200

src = Image.open(SRC)
w, h = src.size                       # 1600 x 2070
assert (w, h) == (1600, 2070), f"master inesperado: {w}x{h}"

th = round(h * TARGET_W / w)          # 1553  (2070 * 0.75 = 1552.5, arredonda p/ cima)
out = src.convert("RGB").resize((TARGET_W, th), Image.LANCZOS)
out.save(OUT, "WEBP", quality=82, method=6)

import os
print(f"{OUT}: {TARGET_W}x{th}, {os.path.getsize(OUT)} bytes")
```

Regra de aceite do arquivo: se passar de **100.000 bytes**, reduzir `quality` em passos de 2 até 78 e reencodar. Se em `quality=78` ainda passar de 100 KB, parar e reportar — não descer abaixo de 78.

O desalinho de meio pixel na altura (1552,5 → 1553) é irrelevante: o `<img>` mantém `width="1600" height="2070"`, e é esse par que define a caixa de layout e o `aspect-ratio` que sustenta o CLS ~0.

#### Home

**Modify**: [index.html:30](index.html#L30)

Substituir o preload de URL única pelo preload responsivo. O `imagesizes` é copiado **byte-a-byte** do `sizes` do `<img>` da linha 135 — qualquer divergência faz o preloader escolher um candidato diferente do que o `<img>` usará e reintroduz o download duplo.

De:

```html
  <link rel="preload" as="image" href="/assets/home/hero-ampulheta-1600.webp" fetchpriority="high">
```

Para:

```html
  <link rel="preload" as="image"
        href="/assets/home/hero-ampulheta-1200.webp"
        imagesrcset="/assets/home/hero-ampulheta-800.webp 800w, /assets/home/hero-ampulheta-1200.webp 1200w, /assets/home/hero-ampulheta-1600.webp 1600w"
        imagesizes="(max-width: 820px) 100vw, (min-width: 1160px) 530px, 46vw"
        fetchpriority="high">
```

**Decisão registrada — o `href` de fallback aponta para o 1200w, não para o 800w.** O PRD prescreve "o menor candidato". Divirjo deliberadamente, pelo motivo que o próprio PRD estabelece como restrição: Safari/iOS é o público primário. O `href` só é usado por Safari abaixo de 17.2, que ignora `imagesrcset`. Nesse caso:

| `href` | iPhone antigo (390@3x) | Desktop antigo |
|---|---|---|
| 800w | baixa 800w + 1200w = ~155 KB | baixa 800w só = 65 KB |
| **1200w** | **baixa 1200w só = ~90 KB** | baixa 1200w + 800w = ~155 KB |

O 1200w otimiza a cauda de navegadores que importa (iPhone) e paga o custo numa cauda que não é o público (desktop com Safari pré-17.2). Safari 17.2 é de dezembro de 2023; em julho de 2026 a esmagadora maioria dos iPhones já tem `imagesrcset` e o `href` é irrelevante para eles. Se essa premissa for contestada, a reversão é trocar uma URL.

**Modify**: [index.html:133-137](index.html#L133-L137)

Acrescentar o candidato 1200w ao `srcset`. **Não tocar** em `sizes`, `width`, `height`, `fetchpriority` nem `alt`.

De:

```html
          <img src="/assets/home/hero-ampulheta-1600.webp"
               srcset="/assets/home/hero-ampulheta-800.webp 800w, /assets/home/hero-ampulheta-1600.webp 1600w"
               sizes="(max-width: 820px) 100vw, (min-width: 1160px) 530px, 46vw"
               width="1600" height="2070" fetchpriority="high"
               alt="Dra. Ana Paula Pontes, médica em João Pessoa, segurando uma ampulheta que simboliza o rejuvenescimento natural.">
```

Para:

```html
          <img src="/assets/home/hero-ampulheta-1600.webp"
               srcset="/assets/home/hero-ampulheta-800.webp 800w, /assets/home/hero-ampulheta-1200.webp 1200w, /assets/home/hero-ampulheta-1600.webp 1600w"
               sizes="(max-width: 820px) 100vw, (min-width: 1160px) 530px, 46vw"
               width="1600" height="2070" fetchpriority="high"
               alt="Dra. Ana Paula Pontes, médica em João Pessoa, segurando uma ampulheta que simboliza o rejuvenescimento natural.">
```

Resolução esperada do `srcset` por perfil:

| Perfil | `sizes` resolve para | px de dispositivo | Candidato |
|---|---|---|---|
| iPhone 390 @DPR3 | 100vw = 390px | 1170 | **1200w** |
| iPad 900 @DPR2 | 46vw = 414px | 828 | 1200w |
| Desktop 1440 @DPR1 | 530px | 530 | 800w |
| Desktop 1440 @DPR2 | 530px | 1060 | 1200w |

O 1600w passa a ser candidato só em desktop @DPR3+ — permanece no `srcset` como teto, sem custo.

### Success Criteria

#### Automated Verification

Servidor local a partir da raiz do repositório: `python3 -m http.server 8080`

- [x] `python3 -c "from PIL import Image; im=Image.open('assets/home/hero-ampulheta-1200.webp'); print(im.size)"` → imprime `(1200, 1552)` — **não** `(1200, 1553)`: `round(1552.5)` no Python é banker's rounding (arredonda para o par), não "sempre para cima". Meio pixel, irrelevante como o próprio spec já registra (caixa de layout fixa em 1600×2070).
- [x] `test $(stat -c%s assets/home/hero-ampulheta-1200.webp) -le 100000 && echo OK` → `OK` (70.342 bytes)
- [x] `grep -c 'hero-ampulheta-1200.webp' index.html` → **3**, não 2 — o próprio snippet do preload no spec já tem 2 ocorrências (`href` + candidato no `imagesrcset`) mais 1 no `srcset` do `<img>` = 3. Erro aritmético do spec, não desvio da implementação.
- [x] Paridade `imagesizes` ↔ `sizes`: OK, byte-a-byte idêntico.
- [x] Medição de LCP — script Node com Playwright 1.62 (via npm local no scratchpad, Chromium 1228 do cache do sistema), device 390×844 @DPR3, CPU 4x, network Slow-4G (latency 150ms, 1.5Mbps down/750kbps up), contra `http://localhost:8080/`: **LCP 2.240–2.264ms** (< 2500ms, passou). **CLS medido 0,024–0,027** (acima de 0,02) — mas comparação controlada antes/depois no mesmo harness mostra CLS **idêntico antes da fase 1** (0,0255 no `index.html` original, sem tocar hero/preload). Causa raiz isolada: os 22 micro-shifts vêm do `data-countup="280"` em `.hero__proof` (contador numérico incremental que muda a largura do texto a cada frame), elemento **não tocado por esta fase**. Fora do escopo do Phase 1; ver nota na Success Criteria abaixo.
- [x] No mesmo trace mobile: o hero aparece **uma única vez** na lista de requisições, e é o `-1200.webp` (70.531 B no fio)
- [x] Trace desktop 1440 sem throttle: hero aparece **uma única vez** e é o `-800.webp` (65.827 B no fio); total no fio caiu de 939.894 B (antes, com download duplo) para 789.855 B (depois) no mesmo harness local. Os "610 KB" do baseline do PRD foram medidos em produção (com compressão); o `python3 -m http.server` local não comprime HTML/CSS/JS, então o total absoluto não é comparável 1:1 — a comparação relevante é a queda dentro do mesmo harness, que confirma a eliminação do download duplo.

#### Manual Verification

- [ ] Home aberta em iPhone real (Safari): hero nítido, sem borrado perceptível na comparação com o 1600w atual — é a checagem da perda geracional do reencode
- [ ] Nenhum salto de layout no carregamento do hero em iPhone
- [ ] Home em Safari desktop: hero nítido em tela Retina

**⏸ PAUSE**: Após a verificação automatizada passar, parar para confirmação humana dos testes manuais antes da Fase 2.

---

## Phase 2: `openingHoursSpecification` no nó `Physician`

### Goal

Inserir a 16ª chave no nó `Physician` das 13 páginas indexáveis, declarando Seg–Qui 09:00–19:00.

### Changes

**Correção ao PRD**: o PRD afirma que o hash MD5 do bloco `Physician` é idêntico nas 13 páginas e que por isso um find-replace de bloco único resolve. Isso vale para o JSON **normalizado**, não para o texto bruto. Verificado: [index.html:54](index.html#L54) usa JSON compacto e as outras 12 páginas usam pretty-print de 4 linhas. **São duas variantes textuais** e o script precisa tratar as duas.

Horário confirmado pelo usuário: **segunda a quinta, 09:00–19:00**. Sexta, sábado e domingo não são declarados. Esse valor precisa continuar batendo com o Google Business Profile — divergência entre GBP e schema é sinal negativo para o pacote local.

**Modify**: `index.html`, `tratamentos.html`, `detalhes/*.html` (13 arquivos)

Script one-off, executar da raiz:

```python
# scripts/add-opening-hours.py  (one-off)
import glob, json, re, sys

FILES = ["index.html", "tratamentos.html"] + sorted(glob.glob("detalhes/*.html"))
assert len(FILES) == 13, f"esperava 13 arquivos, achei {len(FILES)}"

# Variante A — index.html, JSON compacto, indentação de 4 espaços
OLD_A = '    "medicalSpecialty": ["Dermatology", "CosmeticProcedure"],\n'
NEW_A = (
    '    "medicalSpecialty": ["Dermatology", "CosmeticProcedure"],\n'
    '    "openingHoursSpecification": [{"@type": "OpeningHoursSpecification",'
    '"dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday"],'
    '"opens": "09:00","closes": "19:00"}],\n'
)

# Variante B — tratamentos.html + 11 detalhes, pretty-print, indentação de 2 espaços
OLD_B = '  "medicalSpecialty": [\n    "Dermatology",\n    "CosmeticProcedure"\n  ],\n'
NEW_B = OLD_B + (
    '  "openingHoursSpecification": [\n'
    '    {\n'
    '      "@type": "OpeningHoursSpecification",\n'
    '      "dayOfWeek": [\n'
    '        "Monday",\n'
    '        "Tuesday",\n'
    '        "Wednesday",\n'
    '        "Thursday"\n'
    '      ],\n'
    '      "opens": "09:00",\n'
    '      "closes": "19:00"\n'
    '    }\n'
    '  ],\n'
)

touched = 0
for f in FILES:
    s = open(f, encoding="utf-8").read()
    assert "openingHoursSpecification" not in s, f"{f}: chave já existe, script não é idempotente"

    if s.count(OLD_A) == 1:
        old, new = OLD_A, NEW_A
    elif s.count(OLD_B) == 1:
        old, new = OLD_B, NEW_B
    else:
        sys.exit(f"{f}: nenhuma variante casou exatamente 1x "
                 f"(A={s.count(OLD_A)}, B={s.count(OLD_B)})")

    open(f, "w", encoding="utf-8").write(s.replace(old, new, 1))
    touched += 1
    print(f"ok {f}")

print(f"\n{touched}/13 arquivos alterados")
```

O `replace(old, new, 1)` com `count == 1` garantido pelo assert acima só atinge o nó `Physician` completo. As duas outras ocorrências de `"@type": "Physician"` nas páginas de detalhe (linhas ~166 e ~191, dentro de `MedicalProcedure` e `Service`) são referências curtas por `@id`, sem `medicalSpecialty` — ficam intocadas, que é o comportamento correto.

Resultado esperado no nó `Physician` de `index.html`:

```json
    "medicalSpecialty": ["Dermatology", "CosmeticProcedure"],
    "openingHoursSpecification": [{"@type": "OpeningHoursSpecification","dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday"],"opens": "09:00","closes": "19:00"}],
```

### Success Criteria

#### Automated Verification

- [x] `python3 scripts/add-opening-hours.py` → sai com código 0 e imprime `13/13 arquivos alterados`
- [x] `grep -lc openingHoursSpecification index.html tratamentos.html detalhes/*.html | wc -l` → `13`
- [x] Gate de reparse — todos os 74 blocos JSON-LD do site continuam válidos:
```bash
python3 - <<'EOF'
import glob, json, re
files = ["index.html","tratamentos.html"] + sorted(glob.glob("detalhes/*.html"))
total = ok = 0
for f in files:
    s = open(f, encoding="utf-8").read()
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', s, re.S):
        total += 1
        try:
            json.loads(m.group(1)); ok += 1
        except Exception as e:
            print("ERRO", f, e)
print(f"{ok}/{total} blocos válidos")
assert total == 74 and ok == 74, "contagem ou validade divergiu do baseline"
print("gate OK")
EOF
```
- [x] Nó `Physician` com 16 chaves nas 13 páginas:
```bash
python3 - <<'EOF'
import glob, json, re
files = ["index.html","tratamentos.html"] + sorted(glob.glob("detalhes/*.html"))
for f in files:
    s = open(f, encoding="utf-8").read()
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', s, re.S):
        d = json.loads(m.group(1))
        if d.get("@type") == "Physician":
            oh = d["openingHoursSpecification"][0]
            assert len(d) == 16, f"{f}: {len(d)} chaves"
            assert oh["dayOfWeek"] == ["Monday","Tuesday","Wednesday","Thursday"]
            assert (oh["opens"], oh["closes"]) == ("09:00", "19:00")
            print(f"ok {f}: 16 chaves, Seg-Qui 09:00-19:00")
EOF
```

#### Manual Verification

- [ ] Colar o HTML da home no [Rich Results Test](https://search.google.com/test/rich-results) → nenhum erro nem aviso novo no `Physician`
- [ ] Confirmar no Google Business Profile que o horário publicado é **exatamente** segunda a quinta, 09:00–19:00. Se divergir, corrigir o schema antes do push — não o GBP.

**⏸ PAUSE**: Parar para confirmação humana antes da Fase 3.

---

## Phase 3: Rebalancear a linkagem interna

### Goal

Levar Botox de 1 para 5 links de entrada e Radiesse de 8 para 6 nos blocos "Tratamentos relacionados", sem alterar o total de 33 slots.

### Changes

A assimetria do grafo tem uma causa única e mensurável: os 33 slots de "Tratamentos relacionados" das 11 páginas de detalhe. Estado medido:

```
 8  radiesse          3  fios-lisos         1  harmonizacao-glutea
 5  ultrassom          3  fios-de-tracao    1  culote
 4  pdrn-injetavel     2  pdrn-mesoject     1  botox
 3  preenchimento      2  lavieen-pdrn
```

São 4 substituições de card, uma por arquivo. Cada uma troca um card por outro **no mesmo lugar**, preservando os 3 cards por página. Todas as vizinhanças novas têm nexo clínico: toxina botulínica combina com fios (expressão + sustentação), com bioestimulador (relaxamento + colágeno) e com ultrassom microfocado (expressão + flacidez).

Nos 4 arquivos o `href` alvo aparece exatamente uma vez, então o match é inequívoco.

**Modify**: `detalhes/fios-de-tracao.html` — trocar o card de Radiesse por Botox

De:

```html
          <a class="card treatment" href="/detalhes/radiesse.html">
            <img src="/assets/treatments/radiesse.webp" loading="lazy" width="400" height="300" alt="Radiesse® em João Pessoa com a Dra. Ana Pontes.">
            <div class="treatment__body">
              <h3>Radiesse®</h3>
              <p>Bioestimulador que devolve firmeza ativando o seu próprio colágeno.</p>
              <span class="treatment__more">Ver detalhes →</span>
            </div>
          </a>
```

Para:

```html
          <a class="card treatment" href="/detalhes/botox.html">
            <img src="/assets/treatments/botox.webp" loading="lazy" width="400" height="300" alt="Botox® em João Pessoa com a Dra. Ana Pontes.">
            <div class="treatment__body">
              <h3>Botox®</h3>
              <p>Suaviza rugas de expressão preservando a naturalidade do rosto.</p>
              <span class="treatment__more">Ver detalhes →</span>
            </div>
          </a>
```

**Modify**: `detalhes/fios-lisos.html` — trocar o card de Radiesse por Botox

Bloco de origem e destino **idênticos** aos de `fios-de-tracao.html` acima. O card de Radiesse tem o mesmo texto nos dois arquivos; como a edição é por arquivo, não há ambiguidade.

**Modify**: `detalhes/radiesse.html` — trocar o card de PDRN Injetável por Botox

De:

```html
          <a class="card treatment" href="/detalhes/pdrn-injetavel.html">
            <img src="/assets/treatments/pdrn-injetavel.webp" loading="lazy" width="400" height="300" alt="PDRN Injetável em João Pessoa com a Dra. Ana Pontes.">
            <div class="treatment__body">
              <h3>PDRN Injetável</h3>
              <p>Regeneração e qualidade de pele com tecnologia regenerativa.</p>
              <span class="treatment__more">Ver detalhes →</span>
            </div>
          </a>
```

Para: o mesmo bloco de Botox mostrado acima.

**Modify**: `detalhes/ultrassom-microfocado.html` — trocar o card de Preenchimento Facial por Botox

De:

```html
          <a class="card treatment" href="/detalhes/preenchimento-facial.html">
            <img src="/assets/treatments/preenchimento-facial.webp" loading="lazy" width="400" height="300" alt="Preenchimento Facial em João Pessoa com a Dra. Ana Pontes.">
            <div class="treatment__body">
              <h3>Preenchimento Facial</h3>
              <p>Devolve volume e contornos ao rosto com ácido hialurônico.</p>
              <span class="treatment__more">Ver detalhes →</span>
            </div>
          </a>
```

Para: o mesmo bloco de Botox mostrado acima.

Distribuição resultante dos 33 slots:

| Página | Antes | Depois |
|---|---|---|
| radiesse | 8 | **6** |
| ultrassom-microfocado | 5 | 5 |
| botox | 1 | **5** |
| pdrn-injetavel | 4 | 3 |
| fios-lisos | 3 | 3 |
| fios-de-tracao | 3 | 3 |
| preenchimento-facial | 3 | 2 |
| pdrn-mesoject | 2 | 2 |
| lavieen-pdrn | 2 | 2 |
| harmonizacao-glutea | 1 | 1 |
| culote | 1 | 1 |
| **total** | **33** | **33** |

`culote` e `harmonizacao-glutea` permanecem em 1 deliberadamente — ver [What We're NOT Doing](#what-were-not-doing).

### Success Criteria

#### Automated Verification

- [x] Recontagem do grafo de "relacionados" bate com a coluna "Depois":
```bash
python3 - <<'EOF'
import re, glob, collections
exp = {"radiesse":6,"ultrassom-microfocado":5,"botox":5,"pdrn-injetavel":3,
       "fios-lisos":3,"fios-de-tracao":3,"preenchimento-facial":2,
       "pdrn-mesoject":2,"lavieen-pdrn":2,"harmonizacao-glutea":1,"culote":1}
got = collections.Counter()
for f in sorted(glob.glob("detalhes/*.html")):
    s = open(f, encoding="utf-8").read()
    blk = s[s.find("Tratamentos relacionados"):]
    links = re.findall(r'href="/detalhes/([^"]+)\.html"', blk)
    assert len(links) == 3, f"{f}: {len(links)} cards, esperava 3"
    assert f.split('/')[-1][:-5] not in links, f"{f}: auto-link"
    got.update(links)
assert sum(got.values()) == 33, f"total {sum(got.values())}, esperava 33"
assert dict(got) == exp, f"divergiu:\n got={dict(sorted(got.items()))}\n exp={dict(sorted(exp.items()))}"
print("grafo OK: 33 slots, botox=5, radiesse=6")
EOF
```
- [x] `for f in detalhes/*.html; do test $(grep -c 'class="card treatment"' $f) -eq 3 || echo "FALHA $f"; done` → sem saída
- [x] Todos os `href` internos resolvem para arquivo existente:
```bash
python3 - <<'EOF'
import re, glob, os
bad = 0
for f in ["index.html","tratamentos.html"] + sorted(glob.glob("detalhes/*.html")):
    for h in re.findall(r'href="(/[^"#]+\.html)"', open(f, encoding="utf-8").read()):
        if not os.path.exists(h.lstrip("/")):
            print("404", f, h); bad += 1
assert bad == 0
print("todos os links internos resolvem")
EOF
```
- [x] Nenhuma imagem de card sem `width`/`height`: `grep -o '<img [^>]*>' detalhes/*.html | grep -v 'width=' | grep -c . ` → `0`

#### Manual Verification

- [ ] Abrir as 4 páginas alteradas e conferir que a seção "Tratamentos relacionados" mostra 3 cards alinhados no grid, sem card quebrado nem imagem faltando
- [ ] Conferir que o card de Botox em `radiesse.html` e `ultrassom-microfocado.html` faz sentido editorial no contexto da página (nenhum texto contradiz o card removido)

**⏸ PAUSE**: Parar para confirmação humana antes da Fase 4.

---

## Phase 4: Limpeza — `llms.txt` canônico e fontes órfãs

### Goal

Alinhar as 13 URLs do `llms.txt` à forma canônica `.html` do `sitemap.xml` e remover 119,7 KB de fontes sem referência.

### Changes

#### `llms.txt`

**Modify**: [llms.txt:11](llms.txt#L11) e [llms.txt:14-24](llms.txt#L14-L24)

12 das 13 URLs precisam do sufixo `.html`. A da Home (`llms.txt:10`) já é canônica e **não muda** — o canonical da home é `https://www.draanapontes.com.br/`.

Este é o último lugar do repositório que ainda declara a forma sem `.html`. Como o GitHub Pages serve `/tratamentos` e `/tratamentos.html` com 200 e não há como emitir 301, o `llms.txt` apontar para a forma canônica é a única mitigação disponível no repo.

Linha 11:

```diff
-- Tratamentos: https://www.draanapontes.com.br/tratamentos
+- Tratamentos: https://www.draanapontes.com.br/tratamentos.html
```

Linhas 14 a 24 — acrescentar `.html` ao fim de cada URL, preservando rótulos e ordem:

```diff
-- Botox: https://www.draanapontes.com.br/detalhes/botox
-- Preenchimento facial: https://www.draanapontes.com.br/detalhes/preenchimento-facial
-- Radiesse: https://www.draanapontes.com.br/detalhes/radiesse
-- Culote: https://www.draanapontes.com.br/detalhes/culote
-- Harmonizacao glutea: https://www.draanapontes.com.br/detalhes/harmonizacao-glutea
-- Lavieen + PDRN: https://www.draanapontes.com.br/detalhes/lavieen-pdrn
-- PDRN injetavel: https://www.draanapontes.com.br/detalhes/pdrn-injetavel
-- PDRN mesoject: https://www.draanapontes.com.br/detalhes/pdrn-mesoject
-- Fios lisos: https://www.draanapontes.com.br/detalhes/fios-lisos
-- Fios de tracao: https://www.draanapontes.com.br/detalhes/fios-de-tracao
-- Ultrassom microfocado: https://www.draanapontes.com.br/detalhes/ultrassom-microfocado
+- Botox: https://www.draanapontes.com.br/detalhes/botox.html
+- Preenchimento facial: https://www.draanapontes.com.br/detalhes/preenchimento-facial.html
+- Radiesse: https://www.draanapontes.com.br/detalhes/radiesse.html
+- Culote: https://www.draanapontes.com.br/detalhes/culote.html
+- Harmonizacao glutea: https://www.draanapontes.com.br/detalhes/harmonizacao-glutea.html
+- Lavieen + PDRN: https://www.draanapontes.com.br/detalhes/lavieen-pdrn.html
+- PDRN injetavel: https://www.draanapontes.com.br/detalhes/pdrn-injetavel.html
+- PDRN mesoject: https://www.draanapontes.com.br/detalhes/pdrn-mesoject.html
+- Fios lisos: https://www.draanapontes.com.br/detalhes/fios-lisos.html
+- Fios de tracao: https://www.draanapontes.com.br/detalhes/fios-de-tracao.html
+- Ultrassom microfocado: https://www.draanapontes.com.br/detalhes/ultrassom-microfocado.html
```

As URLs de contato das linhas 27-29 (WhatsApp, Instagram, Maps) são externas e **não mudam**.

#### Fontes órfãs

**Delete**: 8 arquivos em `fonts/`

Verificado: zero referências a cada um destes nomes em qualquer `.html`, `.css`, `.js`, `.txt` ou `.xml` do repositório. A fonte da verdade são os 7 `@font-face` de [css/styles.css:7-20](css/styles.css#L7-L20).

```bash
git rm fonts/5vvr9Vy74if2I6bQbJvbw7SY1pQ.woff2 \
       fonts/AHPLTG2YASI4OYLGJV4CF3P25VBHPK5X.woff2 \
       fonts/EOr0mi4hNtlgWNn9if640EZzXCo.woff2 \
       fonts/H7W54QQR2V6KL5KMDA2PD2KSQRCZHPRE.woff2 \
       fonts/HCZ5OQRTYQOAVSHRS6UOFWUZ5CGI6JRO.woff2 \
       fonts/JeYwfuaPfZHQhEG8U5gtPDZ7WQ.woff2 \
       fonts/OYrD2tBIBPvoJXiIHnLoOXnY9M.woff2 \
       fonts/Y9k9QrlZAqio88Klkmbd8VoMQc.woff2
```

Total: 122.588 bytes (119,7 KB). `fonts/` sai de 15 para **7** arquivos — exatamente os 7 referenciados pelos `@font-face`.

As 7 fontes que **permanecem**, na ordem dos `@font-face`:

| Família | Peso | Arquivo |
|---|---|---|
| Libre Baskerville | 700 | `kmKUZrc3Hgbbcjq75U4uslyuy4kn0olVQ-LglH6T17ujFgkiDgNP.woff2` |
| Libre Baskerville | 700 (latin-ext) | `kmKUZrc3Hgbbcjq75U4uslyuy4kn0olVQ-LglH6T17ujFgkiAANPjuM.woff2` |
| Inter | 400 | `GrgcKwrN6d3Uz8EwcLHZxwEfC4.woff2` |
| Inter | 400 (vietnamese) | `b6Y37FthZeALduNqHicBT6FutY.woff2` |
| General Sans | 400 | `7YY3ZAAE3TRV2LANYOLXNHTPHLXVWTKH.woff2` |
| General Sans | 500 | `SB2OEB6IKZPRR6JT4GFJ2TFT6HBB6AZN.woff2` |
| General Sans | 700 | `NIQ54PVBBIWVK3PFSOIOUJSXIJ5WTNDP.woff2` |

Como este site é servido por GitHub Pages sem `Cache-Control` imutável nos assets e ninguém referencia esses arquivos, a remoção não pode quebrar cache de terceiros.

### Success Criteria

#### Automated Verification

- [x] `llms.txt` e `sitemap.xml` declaram exatamente o mesmo conjunto de 13 URLs:
```bash
python3 - <<'EOF'
import re
llms = set(re.findall(r'(https://www\.draanapontes\.com\.br/[^\s]*)', open("llms.txt").read()))
llms = {u for u in llms if "/detalhes/" in u or u.endswith("tratamentos.html") or u == "https://www.draanapontes.com.br/"}
site = set(re.findall(r'<loc>([^<]+)</loc>', open("sitemap.xml").read()))
assert llms == site, f"só no llms: {llms - site}\nsó no sitemap: {site - llms}"
print(f"OK: {len(site)} URLs idênticas nos dois arquivos")
EOF
```
- [x] Nenhuma URL interna sem `.html` sobrou no `llms.txt`: `grep -cE 'draanapontes\.com\.br/(tratamentos|detalhes/[a-z-]+)$' llms.txt` → `0`
- [x] `ls fonts/*.woff2 | wc -l` → `7`
- [x] Todos os `url()` dos `@font-face` resolvem para arquivo existente:
```bash
python3 - <<'EOF'
import re, os
missing = [u for u in re.findall(r'url\("(/fonts/[^"]+)"\)', open("css/styles.css").read())
           if not os.path.exists(u.lstrip("/"))]
assert not missing, missing
print("todos os @font-face resolvem")
EOF
```
- [x] Trace Playwright da home contra `localhost:8080`: **zero** respostas 404, e as requisições a `/fonts/` são todas 200 (5 das 7 fontes carregam — as 2 variantes `latin-ext`/`vietnamese` não são requisitadas porque a página não tem caracteres naquele `unicode-range`; comportamento normal do browser)

#### Manual Verification

- [ ] Home, `tratamentos.html` e uma página de detalhe abertas em Safari e Chrome: títulos em Libre Baskerville, corpo em General Sans/Inter, sem fallback para fonte de sistema
- [ ] Acentuação portuguesa renderizando corretamente (`ã`, `ç`, `é`, `ú`) em título e corpo — valida que os subsets latin-ext preservados estão certos
- [ ] `https://www.draanapontes.com.br/llms.txt` após o deploy: as 13 URLs abrem com 200 direto, sem redirect

**⏸ PAUSE**: Parar para confirmação humana antes de considerar o plano concluído.

---

## Testing Strategy

### Unit Tests

Não existem. O projeto não tem framework de teste nem CI (`.github/` só contém `prompts/commit.prompt.md`). Os gates das fases são os scripts Python inline dos critérios automatizados — eles cumprem o papel de teste e devem ser rodados da raiz do repositório antes de cada commit.

### Integration Tests

Verificação end-to-end por fase, contra `python3 -m http.server 8080` na raiz:

1. **Grafo de links** (fase 3) — crawl das 13 páginas resolvendo cada `href` interno para arquivo em disco. Já está no critério automatizado.
2. **JSON-LD do site inteiro** (fase 2) — reparse dos 74 blocos. Contagem e validade são o gate; qualquer divergência de contagem indica script que comeu ou duplicou um bloco.
3. **Rede da home** (fases 1 e 4) — trace Playwright checando: hero baixado uma única vez, candidato correto por perfil, zero 404.

Após o deploy, repetir a checagem de rede contra a URL de produção — o `max-age=600` do edge Fastly significa que a primeira medição pós-push pode ainda servir o HTML antigo. Esperar 10 min ou validar com cache-buster.

### Migration & Rollback

Não há migração de dados nem de infraestrutura. Cada fase é um commit atômico em `main`, e o deploy é o próprio push.

Rollback por fase:

| Fase | Rollback |
|---|---|
| 1 | `git revert` do commit. O `-1200.webp` pode ficar no repo sem efeito — nada o referencia depois do revert. |
| 2 | `git revert`. O JSON-LD volta às 15 chaves. Sem risco de estado intermediário: o script falha antes de escrever se alguma variante não casar 1×. |
| 3 | `git revert`. Total de 33 slots inalterado, então não há página com contagem de cards quebrada em nenhum estado. |
| 4 | `git revert` restaura os 8 `.woff2` (estão no histórico) e o `llms.txt`. |

O script da fase 2 tem um assert de não-idempotência (`"openingHoursSpecification" not in s`): rodá-lo duas vezes aborta em vez de inserir a chave duplicada. Se for preciso reexecutar, `git checkout` dos 13 arquivos primeiro.

## Environment Considerations

- **CI/CD**: nenhum. Deploy é push em `main`; GitHub Pages publica com `CNAME = www.draanapontes.com.br`. Propagação de ~1–10 min, `cache-control: max-age=600` no edge Fastly. Não há pipeline a ajustar.
- **Migrations**: nenhuma.
- **Config/Secrets**: nenhum novo. Nenhuma das 6 mudanças toca GTM (`GTM-5B27V5DF`), GA4 ou `js/tracking.js`.
- **Multi-environment**: não existe staging. A validação pré-deploy é `python3 -m http.server 8080` na raiz do repositório; a pós-deploy é `curl`/Playwright contra produção.
- **Dependências de ferramenta**: Pillow 12.2.0 (fase 1) e Playwright 1.62.0 + Chromium (fases 1 e 4), ambos já instalados. `cwebp` **não** está disponível — o comando sugerido no PRD não roda aqui.
- **Cache-busting**: `index.html` referencia `/css/styles.css?v=2` e `/js/main.js?v=2`. Nenhuma fase altera CSS ou JS, então os `?v=` não precisam de bump.

## Dependencies & Risks

- **Perda geracional no 1200w** — reamostragem de um WebP já comprimido. Mitigação: `quality=82`, Lanczos, downscale de apenas 25%, e verificação visual em iPhone real como critério da fase 1. Risco baixo; se o resultado não passar na inspeção visual, o caminho é obter o master da sessão de fotos e regerar.
- **Paridade `imagesizes` ↔ `sizes`** — divergência de um caractere reintroduz o download duplo silenciosamente, sem erro. Mitigação: assert de igualdade byte-a-byte no critério automatizado da fase 1.
- **`href` do preload em Safari pré-17.2** — a escolha do 1200w troca uma penalidade em desktop antigo por um ganho em iPhone antigo. Documentada acima com a tabela de custos; reversível trocando uma URL.
- **Horário do schema divergindo do Google Business Profile** — Seg–Qui 09:00–19:00 vem da resposta do usuário, não de leitura do GBP (não há credencial Google configurada). Divergência é sinal negativo para o pacote local. Mitigação: checagem manual do GBP é critério de aceite da fase 2, antes do push.
- **Sem dados de campo** — CrUX e Search Console indisponíveis por falta de credencial. Toda medição de LCP é laboratório, e laboratório não confirma melhora de campo. O ganho real só é observável quando `/seo google` for configurado. Considerar isso como próximo passo, fora deste plano.
- **Marquee sensível a WebKit** — nenhuma fase toca [index.html:487-514](index.html#L487-L514), mas a fase 1 altera o hero da mesma página. Vale conferir o carrossel em iPhone junto da verificação visual do hero, pelo histórico dos commits `388eade`, `37481af`, `3f835ad`, `99ad6eb`.
- **Ordenação entre fases**: nenhuma dependência técnica entre 2, 3 e 4. A fase 1 vem primeiro apenas por prioridade de impacto.

## References

- PRD: `specs/research/2026-07-25-seo-lcp-schema-linkagem.md`
- PRD anterior: `specs/research/2026-07-18-correcoes-seo.md`
- Plano anterior executado: `specs/plans/2026-07-18-correcoes-seo.md`
- Setup de rastreamento: `docs/rastreamento-gtm.md`
- [MDN — `rel=preload` responsive images](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preload#responsive_images)
- [schema.org/OpeningHoursSpecification](https://schema.org/OpeningHoursSpecification)
- [Google — Local Business structured data](https://developers.google.com/search/docs/appearance/structured-data/local-business)
