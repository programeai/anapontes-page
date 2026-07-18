---
date: 2026-07-18T01:35:43-03:00
author: claude
source_prd: specs/research/2026-07-18-copy-dores-home.md
git_commit: 389df0df4a3440eee7a2ae33841f1a6c2f86613b
branch: new-design
status: implemented
tags: [spec, copy, home, index-html, cro, cfm]
---

# Spec: Copy de Dores na Home (index.html)

## Overview

Reforçar o uso das dores conhecidas do público na home, hoje escondidas dentro dos botões do quiz. Três mudanças de copy (só texto + 1 bloco novo, **zero CSS/JS novo**), reusando componentes existentes: (1) subtítulo do hero afiado com gatilho de dor; (2) nova seção de dor/empatia em 3 cards de citação entre o trustbar e o quiz, fazendo a ponte para o quiz; (3) os 3 cards de benefícios reenquadrados de "qualidades da médica" para "antídotos de medo".

Estratégia: seguir o template dor→resultado→qualificação já aplicado nas 11 páginas `detalhes/*`, trazendo-o para a home. A seção nova copia a estrutura `.pain-cards`/`.pain-bridge` de `detalhes/botox.html:320-345`, com fundo branco (em vez de cream) e ponte apontando para o quiz (`#avaliacao`) em vez de WhatsApp direto.

Tudo CFM-safe (Res. 2.336/2023): dor espelhada é permitida; nenhuma promessa de resultado, superlativo comparativo ou antes/depois.

## Current State

- `index.html:131-132` — Hero com H1 forte + subtítulo suave ("mais descansada") que não usa gatilho de dor.
- `index.html:155-162` — Trustbar (`.section--cream`), seguido direto pela seção quiz `#avaliacao` (`index.html:164`).
- `index.html:238-262` — Seção benefícios `#beneficios`: 3 cards vendendo qualidades da médica.
- Componente de dor pronto e em uso nas 11 detalhes (`.pain-cards`/`.pain-bridge`, CSS em `css/styles.css:550-553`).

## Desired End State

1. Subtítulo do hero abre com dor ("cansaço que você não sente"), mantendo a cauda de keywords no `.hero__lead-more` (oculto no mobile).
2. Entre trustbar e quiz existe uma seção branca com eyebrow + H2 de dor + 3 cards de citação em 1ª pessoa + ponte com CTA âncora para `#avaliacao`.
3. A seção de benefícios tem H2 "O medo não é do procedimento. É de cair na mão errada." e 3 cards reescritos como antídotos de medo, mantendo ícones, classes (`.card`, `.card--feature`) e o eyebrow atual.

Verificável: home renderiza as 3 mudanças, animações de reveal funcionam, o CTA da seção de dor rola até o quiz, e o ritmo de fundos alterna cream(trustbar) → branco(dor) → cream-gradiente(quiz).

## What We're NOT Doing

- **Não** alteramos o H1 do hero (`index.html:131`) — já é forte contra o medo do artificial.
- **Não** criamos CSS nem JS — todos os componentes e o IntersectionObserver de reveal já existem.
- **Não** adicionamos `id` nem item de menu para a seção de dor (é passagem narrativa, não destino de navegação).
- **Não** tocamos em JSON-LD, FAQ, quiz, tracking ou nas páginas `detalhes/*`.
- **Não** mudamos o eyebrow de benefícios ("Por que com a Dra. Ana" — decisão do usuário).
- **Não** implementamos junto com o spec de SEO pendente (`specs/plans/2026-07-18-correcoes-seo.md`) — ambos editam `index.html`; rodar um de cada vez.

---

## Phase 1: Subtítulo do hero

### Goal
Afiar o subtítulo do hero para abrir com gatilho de dor, preservando a cauda de keywords responsiva.

### Changes

#### Hero

**Modify**: `index.html:132`

De:
```html
          <p class="hero__lead">Um plano sob medida pela Dra. Ana Pontes para você se olhar no espelho e se reconhecer — só que mais descansada. <span class="hero__lead-more">Botox®, bioestimuladores e protocolos regenerativos na dose certa para o seu rosto.</span></p>
```

Para:
```html
          <p class="hero__lead">Para quando o espelho começa a mostrar um cansaço que você não sente. Um plano sob medida da Dra. Ana Pontes, na dose certa para o seu rosto. <span class="hero__lead-more">Botox®, bioestimuladores e protocolos regenerativos.</span></p>
```

Notas:
- A primeira frase (dor) + a segunda ("Um plano sob medida... para o seu rosto.") se sustentam sozinhas no mobile, onde `.hero__lead-more` some (`css/styles.css:210`).
- Keywords SEO (Botox®, bioestimuladores, protocolos regenerativos) preservadas no span.

### Success Criteria

#### Automated Verification
- [x] `grep -q "cansaço que você não sente" index.html` — nova copy presente
- [x] `grep -q "mais descansada" index.html; test $? -ne 0` — copy antiga removida
- [x] `grep -c "hero__lead-more" index.html` retorna `1` — span responsivo mantido

#### Manual Verification
- [ ] Abrir a home no navegador (desktop): subtítulo mostra dor + plano + cauda de keywords em uma frase coesa.
- [ ] Redimensionar para ≤820px: a cauda de keywords some e o texto restante ainda faz sentido.

**⏸ PAUSE**: Após verificação automática, parar para confirmação manual antes da Fase 2.

---

## Phase 2: Nova seção de dor/empatia

### Goal
Inserir uma seção de dor em 3 cards de citação entre o trustbar e o quiz, fazendo a ponte para o quiz.

### Changes

#### Seção de dor (novo bloco)

**Modify**: `index.html` — inserir um novo `<section>` entre o fechamento do trustbar (`index.html:162`, `</div>` que fecha `.section--cream`) e a abertura da seção quiz (`index.html:164`, `<!-- QUIZ / QUALIFICAÇÃO -->`).

Bloco a inserir:
```html
    <!-- DOR / IDENTIFICAÇÃO -->
    <section class="section">
      <div class="container">
        <div class="section__head" data-reveal>
          <span class="eyebrow eyebrow--plain">Talvez você se reconheça aqui</span>
          <h2>Não é vaidade. É se olhar no espelho e não se reconhecer mais.</h2>
        </div>
        <div class="grid grid--3 pain-cards" data-reveal-group>
          <div class="card">
            <div class="card__icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7.2 5C4.9 6.4 3.2 8.9 3.2 12v7h7v-7H6.4c0-2 .9-3.6 2.8-4.8L7.2 5zm10 0c-2.3 1.4-4 3.9-4 7v7h7v-7h-3.8c0-2 .9-3.6 2.8-4.8L17.2 5z"/></svg></div>
            <p>"Olho uma foto de alguns anos atrás e sinto que meu rosto mudou mais do que devia."</p>
          </div>
          <div class="card">
            <div class="card__icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7.2 5C4.9 6.4 3.2 8.9 3.2 12v7h7v-7H6.4c0-2 .9-3.6 2.8-4.8L7.2 5zm10 0c-2.3 1.4-4 3.9-4 7v7h7v-7h-3.8c0-2 .9-3.6 2.8-4.8L17.2 5z"/></svg></div>
            <p>"De manhã, o espelho parece mais sério e mais caído — mesmo quando estou bem e descansada."</p>
          </div>
          <div class="card">
            <div class="card__icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7.2 5C4.9 6.4 3.2 8.9 3.2 12v7h7v-7H6.4c0-2 .9-3.6 2.8-4.8L7.2 5zm10 0c-2.3 1.4-4 3.9-4 7v7h7v-7h-3.8c0-2 .9-3.6 2.8-4.8L17.2 5z"/></svg></div>
            <p>"Quero fazer algo, mas travo com medo de exagerar e ficar com uma cara de vento que não é a minha."</p>
          </div>
        </div>
        <div class="pain-bridge" data-reveal>
          <p>O primeiro passo não é escolher um procedimento. É entender o que está acontecendo com o seu rosto — e o que dá pra fazer respeitando as suas expressões.</p>
          <a class="btn btn--primary" href="#avaliacao">Descobrir por onde começar</a>
        </div>
      </div>
    </section>
```

Notas:
- `class="section"` (branca) — trustbar acima é cream, quiz abaixo é gradiente cream (`css/styles.css:335`); mantém alternância. **Não** usar `.section--cream`.
- `data-reveal` / `data-reveal-group` herdam as animações automáticas (`js/main.js:183-196`).
- Ícone SVG de aspas: mesmo path usado nas detalhes e no `.tstm__mark`.
- CTA da ponte: âncora interna `#avaliacao` (rola até o quiz), classe `btn btn--primary`, texto igual ao CTA do hero para consistência. Sem `target`/`rel` (é âncora, não link externo).

### Success Criteria

#### Automated Verification
- [x] `grep -q "Não é vaidade" index.html` — H2 presente
- [x] `grep -q 'pain-cards' index.html` — bloco de dor presente na home
- [x] `grep -q 'class="pain-bridge"' index.html && grep -q 'href="#avaliacao">Descobrir por onde começar' index.html` — ponte com CTA para o quiz
- [x] Ordem correta: a linha do `pain-cards` aparece **antes** do comentário `QUIZ / QUALIFICAÇÃO` — verificar com `grep -n 'pain-cards\|QUIZ / QUALIFICAÇÃO' index.html`

#### Manual Verification
- [ ] A seção de dor aparece entre o trustbar e o quiz, com fundo branco entre dois blocos cream.
- [ ] Os 3 cards animam ao entrar na viewport (reveal).
- [ ] Clicar em "Descobrir por onde começar" rola suavemente até o quiz `#avaliacao`.
- [ ] Mobile: os 3 cards empilham corretamente (grid `grid--3` responsivo).

**⏸ PAUSE**: Parar para confirmação manual antes da Fase 3.

---

## Phase 3: Benefícios como antídotos de medo

### Goal
Reenquadrar o H2 e os 3 cards da seção de benefícios de "qualidades da médica" para "antídotos de medo", mantendo estrutura, ícones e eyebrow.

### Changes

#### Seção benefícios

**Modify**: `index.html:242` — H2 do header (o eyebrow em `index.html:241` **não muda**).

De:
```html
          <h2>Três coisas que as pacientes contam sobre ser cuidada aqui</h2>
```
Para:
```html
          <h2>O medo não é do procedimento. É de cair na mão errada.</h2>
```

**Modify**: `index.html:247-248` — Card 1 (h3 + p).

De:
```html
            <h3>Ela desenha antes de aplicar</h3>
            <p>Na consulta, a Dra. Ana explica — e muitas vezes desenha — o que imagina para o seu rosto. Você entende o plano inteiro antes de decidir qualquer coisa.</p>
```
Para:
```html
            <h3>Você aprova antes de qualquer agulha</h3>
            <p>Na consulta, a Dra. Ana explica — e muitas vezes desenha — o que imagina para o seu rosto. Você vê o plano inteiro e decide com calma. Nada acontece sem o seu "sim".</p>
```

**Modify**: `index.html:252-253` — Card 2 (`.card--feature`, h3 + p).

De:
```html
            <h3>Médica do início ao fim</h3>
            <p>Avaliação, indicação e aplicação com a própria Dra. Ana Pontes (CRM 16743 PB), em consultório — nada de protocolo de esteira nem atendimento dividido.</p>
```
Para:
```html
            <h3>Uma médica, do começo ao fim</h3>
            <p>Avaliação, indicação e aplicação com a própria Dra. Ana Pontes (CRM 16743 PB), em consultório. Sem protocolo de esteira, sem atendimento dividido, sem terceirizar o seu rosto.</p>
```

**Modify**: `index.html:257-258` — Card 3 (h3 + p).

De:
```html
            <h3>O cuidado não termina na porta</h3>
            <p>Retorno para acompanhar a evolução e canal direto para dúvidas depois do procedimento. Você não fica sozinha no pós.</p>
```
Para:
```html
            <h3>Você não fica sozinha depois</h3>
            <p>Retorno para acompanhar a evolução e canal direto para dúvidas no pós. O cuidado continua depois que você sai da sala.</p>
```

Notas:
- Ícones SVG, classes `.card`/`.card--feature` e o eyebrow "Por que com a Dra. Ana" **inalterados**.
- CFM: nenhum card promete resultado; falam de processo, autoridade e acompanhamento (permitido).

### Success Criteria

#### Automated Verification
- [x] `grep -q "cair na mão errada" index.html` — novo H2 presente
- [x] `grep -q "Você aprova antes de qualquer agulha" index.html` — card 1
- [x] `grep -q "sem terceirizar o seu rosto" index.html` — card 2
- [x] `grep -q "Você não fica sozinha depois" index.html` — card 3
- [x] `grep -q "Três coisas que as pacientes contam" index.html; test $? -ne 0` — H2 antigo removido
- [x] `grep -q 'Por que com a Dra. Ana' index.html` — eyebrow mantido

#### Manual Verification
- [ ] Seção de benefícios mostra o novo H2 e os 3 cards reescritos, com o card do meio em destaque (bronze) intacto.
- [ ] Ícones dos 3 cards inalterados.

**⏸ PAUSE**: Parar para confirmação manual final.

---

## Testing Strategy

### Unit Tests
- N/A — projeto é HTML/CSS/JS estático sem suíte de testes.

### Integration Tests
- Fluxo de conversão na home: hero (dor) → seção de dor → CTA "Descobrir por onde começar" rola até `#avaliacao` → quiz responde e dispara `quiz_start`/`quiz_complete` no dataLayer → `data-quiz-send` gera wa.me pré-preenchido. Verificar que a seção nova não quebra o scroll nem a navegação por âncora.
- Verificar console sem erros de JS após inserção do bloco.

### Migration & Rollback
- Sem migração de dados. Rollback = `git checkout index.html` (ou reverter o commit). Mudanças confinadas a `index.html`.

## Environment Considerations
- **CI/CD**: site estático (GitHub Pages via CNAME); publicação por push. Sem novos passos de build.
- **Migrations**: nenhuma.
- **Config/Secrets**: nenhum.
- **Multi-environment**: sem diferença dev/prod.

## Dependencies & Risks
- **Ordenação:** o spec de SEO pendente (`specs/plans/2026-07-18-correcoes-seo.md`) também edita `index.html`. Implementar um de cada vez para evitar conflito de merge. Não há sobreposição de linhas (SEO mexe em head/canonical/titles; este mexe em hero/body), mas coordenar mesmo assim.
- **Baixo risco:** mudanças puramente textuais + 1 bloco reusando CSS existente; sem novo CSS/JS.

## References
- PRD: `specs/research/2026-07-18-copy-dores-home.md`
- Componente modelo: `detalhes/botox.html:320-345`
- Regras CFM: `docs/copy-conversao.md:7-21`
- Spec relacionado (coordenar): `specs/plans/2026-07-18-correcoes-seo.md`
