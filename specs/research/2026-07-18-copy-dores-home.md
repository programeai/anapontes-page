---
date: 2026-07-18T01:35:43-03:00
researcher: claude
git_commit: 389df0df4a3440eee7a2ae33841f1a6c2f86613b
branch: new-design
topic: "Reforçar uso de dores na copy da home: seção de dor/empatia, subtítulo do hero com gatilho, benefícios como antídotos de medo"
tags: [research, copy, home, index-html, cro, cfm]
status: complete
---

# Research: Copy de Dores na Home (index.html)

## Research Question

Reforçar o uso das dores conhecidas do público na copy da home, com 3 mudanças já aprovadas pelo usuário (opções recomendadas A / A / C da análise de copywriting):

1. **Nova seção de dor/empatia** entre o trustbar e o quiz — headline aprovada: **"Não é vaidade. É se olhar no espelho e não se reconhecer mais."**
2. **Subtítulo do hero afiado** com gatilho de dor — opção aprovada: **"Para quando o espelho começa a mostrar um cansaço que você não sente. Um plano sob medida da Dra. Ana Pontes, na dose certa para o seu rosto — Botox®, bioestimuladores e protocolos regenerativos."**
3. **Benefícios reenquadrados como antídotos de medo** — header aprovado: **"O medo não é do procedimento. É de cair na mão errada."** + 3 cards reescritos.

Restrições: CFM-safe (sem promessa de resultado, sem antes/depois), reusar componentes existentes, não mexer no design.

## Summary

A home ([index.html](../../index.html), 526 linhas) é HTML/CSS/JS puro (zero Framer desde o rebuild de 2026-07-15) — editar o HTML altera o visível diretamente. As 3 mudanças são de **texto + 1 bloco novo**, e o bloco novo **não precisa de CSS nem componente novo**: as 11 páginas `detalhes/*.html` já têm a "Seção de identificação (dor)" pronta (`.pain-cards` + `.pain-bridge`, CSS em `css/styles.css:550-553`), com cards de citação em 1ª pessoa entre aspas e ponte com CTA. É copiar a estrutura de `detalhes/botox.html:320-345` e adaptar a copy para a home, apontando a ponte para `#avaliacao` (quiz) em vez de WhatsApp direto.

As animações de entrada são automáticas: qualquer elemento com `data-reveal` / `data-reveal-group` é observado por IntersectionObserver em `js/main.js:183-196` — o bloco novo só precisa carregar esses atributos como os vizinhos. O tracking de WhatsApp usa event delegation sobre `a[href*="wa.me"]`, então um CTA interno para `#avaliacao` não exige nada no `js/tracking.js`.

Pontos de atenção: (a) o subtítulo do hero tem um `<span class="hero__lead-more">` que é **ocultado no mobile** (`css/styles.css:210`) — a reescrita deve manter a cauda de keywords dentro desse span para preservar o comportamento responsivo e o SEO desktop; (b) há um spec de SEO pendente ([specs/plans/2026-07-18-correcoes-seo.md](../plans/2026-07-18-correcoes-seo.md)) que também edita `index.html` (canonical www, titles) — coordenar ordem de implementação para evitar conflito; (c) alternância de fundos: trustbar é cream e o quiz tem gradiente cream, então a seção nova deve ser `.section` branca (sem `--cream`) para manter o ritmo visual — diferente das detalhes, onde a seção de dor é cream.

## Copy Aprovada (fonte da verdade para o /spec)

### 1. Seção de dor/empatia (novo bloco)

- **Eyebrow:** `Talvez você se reconheça aqui`
- **H2:** `Não é vaidade. É se olhar no espelho e não se reconhecer mais.`
- **Corpo (espelhamento):**
  > Você olha uma foto de alguns anos atrás e sente que o rosto mudou mais do que devia. De manhã, o espelho parece mais sério, mais caído — mesmo quando você está bem. Já pensou em fazer algo, mas trava: tem medo de exagerar, de ficar com uma "cara de vento" que não é a sua, de virar aquela história de harmonização que deu errado.
- **Ponte pro quiz (fecho):**
  > O primeiro passo não é escolher um procedimento. É entender o que está acontecendo com o seu rosto — e o que dá pra fazer respeitando as suas expressões.
- **CTA da ponte:** âncora para `#avaliacao` (quiz), não WhatsApp direto.
- **Formato sugerido pela pesquisa:** o corpo pode ser vertido em 3 cards de citação em 1ª pessoa (padrão `.pain-cards` das detalhes) — ex.: espelho/foto, "parecem que estou cansada/brava", medo de exagerar/cara de vento — com a ponte em `.pain-bridge`. Decisão fina de diagramação fica para o /spec.

### 2. Subtítulo do hero (substitui `index.html:132`)

> Para quando o espelho começa a mostrar um cansaço que você não sente. Um plano sob medida da Dra. Ana Pontes, na dose certa para o seu rosto — <span hero__lead-more>Botox®, bioestimuladores e protocolos regenerativos.</span>

(H1 atual `index.html:131` **não muda**.)

### 3. Benefícios como antídotos de medo (`index.html:238-262`)

- **Header da seção (H2, `index.html:242`):** `O medo não é do procedimento. É de cair na mão errada.`
  - Eyebrow atual "Por que com a Dra. Ana" pode manter ou ajustar no /spec.
- **Card 1** (era "Ela desenha antes de aplicar"):
  - H3: `Você aprova antes de qualquer agulha`
  - P: `Na consulta, a Dra. Ana explica — e muitas vezes desenha — o que imagina para o seu rosto. Você vê o plano inteiro e decide com calma. Nada acontece sem o seu "sim".`
- **Card 2** (era "Médica do início ao fim", card destaque `card--feature`):
  - H3: `Uma médica, do começo ao fim`
  - P: `Avaliação, indicação e aplicação com a própria Dra. Ana Pontes (CRM 16743 PB), em consultório. Sem protocolo de esteira, sem atendimento dividido, sem terceirizar o seu rosto.`
- **Card 3** (era "O cuidado não termina na porta"):
  - H3: `Você não fica sozinha depois`
  - P: `Retorno para acompanhar a evolução e canal direto para dúvidas no pós. O cuidado continua depois que você sai da sala.`

## Codebase Map

### Affected Files & Modules

| File | Role | Relevance |
|------|------|-----------|
| `index.html:131-132` | Hero: H1 + subtítulo (`.hero__lead` com span `.hero__lead-more`) | Mudança 2 — reescrever o `<p>`, manter H1 e o span responsivo |
| `index.html:155-162` | Trust bar (`.section--cream`) | A seção nova entra logo **depois** dela |
| `index.html:164-235` | Seção quiz `#avaliacao` | A seção nova entra logo **antes**; a ponte aponta para cá |
| `index.html:237-262` | Seção benefícios `#beneficios` (header + 3 `.card`) | Mudança 3 — reescrever H2 e os 3 cards |
| `detalhes/botox.html:320-345` | Seção de dor existente (padrão a copiar) | Fonte da estrutura HTML da mudança 1 |
| `css/styles.css:550-553` | `.pain-cards` / `.pain-bridge` | CSS já existe — zero CSS novo |
| `css/styles.css:184,209-210` | `.hero__lead` + `.hero__lead-more` (oculto ≤820px) | Constraint da mudança 2 |
| `js/main.js:183-196` | IntersectionObserver de `data-reveal`/`data-reveal-group` | Animações automáticas para o bloco novo |
| `js/tracking.js` | Delegation de cliques wa.me | Sem mudança (CTA da ponte é âncora interna) |

### Existing Patterns to Follow

**Pattern: Seção de identificação (dor) — de `detalhes/botox.html:320-345`**
```html
<section class="section section--cream">
  <div class="container">
    <div class="section__head" data-reveal>
      <span class="eyebrow eyebrow--plain">Você se identifica?</span>
      <h2>O que costuma trazer pacientes até aqui</h2>
    </div>
    <div class="grid grid--3 pain-cards" data-reveal-group>
      <div class="card">
        <div class="card__icon"><svg><!-- ícone de aspas --></svg></div>
        <p>"Vivem me perguntando se estou cansada ou brava — mesmo quando dormi bem e está tudo ótimo."</p>
      </div>
      <!-- ... 3 cards no total, citações em 1ª pessoa entre aspas ... -->
    </div>
    <div class="pain-bridge" data-reveal>
      <p>Se você se reconheceu em algum desses pontos, uma <strong>avaliação médica individual</strong> mostra se o Botox® é o caminho certo...</p>
      <a class="btn btn--primary" href="...">Agendar minha avaliação</a>
    </div>
  </div>
</section>
```
**Why this matters:** é o componente exato pedido ("reusar componentes existentes"). O ícone de aspas (SVG inline, mesmo path do `.tstm__mark`) já é o padrão das 11 detalhes. Na home, trocar: fundo para `.section` branca (alternância trustbar-cream → dor-branca → quiz-cream), CTA da ponte para `href="#avaliacao"`.

**Pattern: Hero lead com cauda responsiva — `index.html:132`**
```html
<p class="hero__lead">Texto principal. <span class="hero__lead-more">Cauda com keywords, oculta no mobile.</span></p>
```
`css/styles.css:210` → `@media` mobile: `.hero__lead-more { display: none; }`. A frase principal precisa se sustentar sozinha no mobile.

**Pattern: Cards de benefício — `index.html:245-259`**
`article.card` com `.card__icon` (SVG stroke) + h3 + p; card do meio usa `.card--feature` (fundo bronze). Mudança 3 é só texto — manter ícones e classes.

### Data Flow (conversão)

Orgânico/SEO → hero (dor no subtítulo) → trustbar → **[NOVA] seção de dor** → ponte `#avaliacao` → quiz 3 perguntas (`js/main.js`, eventos `quiz_start`/`quiz_complete`) → `data-quiz-send` monta wa.me pré-preenchido → WhatsApp. Links `wa.me` são reescritos por `js/main.js` para `https://wa.me/5583991353786?text=...`; cliques trackeados por delegation em `js/tracking.js`.

## Historical Context

- [docs/copy-conversao.md](../../docs/copy-conversao.md) — regras CFM (Res. 2.336/2023) e princípios de copy do projeto. A nota "colar no Framer" no topo está **obsoleta** (rebuild removeu o Framer; editar HTML funciona). As regras CFM seguem válidas: sem antes/depois, sem promessa/garantia, sem superlativo comparativo; pode autoridade (CRM), avaliação individual, depoimentos reais.
- Template dor→resultado→qualificação já aplicado nas 11 detalhes (memória `template-conversao-detalhes`); esta tarefa leva o mesmo princípio à home.
- Quiz e oferta "avaliação individual personalizada" (CFM-safe, sem gratuidade/escassez) implementados em 2026-07-16.
- [specs/plans/2026-07-18-correcoes-seo.md](../plans/2026-07-18-correcoes-seo.md) — spec de SEO **pendente** que também edita `index.html` (domínio www, titles, JSON-LD). Não conflita semanticamente com esta tarefa, mas tocam o mesmo arquivo.

## Constraints & Considerations

- **CFM (Res. 2.336/2023):** dor descrita/espelhada é permitida; a copy aprovada não promete resultado ("o que dá pra fazer", "entender o que está acontecendo"). Manter exatamente esse enquadramento. Cuidado apenas para não escorregar em sensacionalismo ao diagramar (ex.: não dramatizar com imagens).
- **Fundo da seção nova:** usar `.section` (branca) — trustbar acima é cream e `.quiz-section` abaixo é gradiente cream (`css/styles.css:335`). Nas detalhes a seção de dor é cream porque os vizinhos são brancos.
- **Mobile:** `.hero__lead-more` some ≤820px — a primeira frase do novo subtítulo precisa funcionar sozinha (funciona: dor + "plano sob medida da Dra. Ana Pontes, na dose certa").
- **Animações:** herdar `data-reveal` / `data-reveal-group` (automático via `js/main.js:183`). O hero tem delays próprios em CSS (`css/styles.css:422-427`) — sem mudança.
- **H2 da seção nova termina em ponto final** ("...não se reconhecer mais.") — consistente com o H2 do hero e de tratamentos ("Cada incômodo tem um caminho. Estes são os mais procurados.").
- **Sem JSON-LD afetado:** as mudanças não tocam FAQ nem schema (o FAQ JSON-LD `index.html:85-93` duplica a seção `#duvidas`, que não muda).
- **Âncoras/menu:** a seção nova não precisa de `id` nem de item no menu (é narrativa de passagem, não destino de navegação). Se ganhar `id`, verificar `scroll-margin-top`.
- **Coordenação:** implementar antes ou depois do spec de SEO pendente, não em paralelo, para evitar conflito em `index.html`.

## Open Questions

- **Diagramação da seção de dor:** verter o corpo em 3 cards de citação (padrão `.pain-cards` das detalhes, mais escaneável e reusa componente) **ou** manter como parágrafo corrido no `.section__head` + `.pain-bridge` (mais próximo do texto aprovado)? Recomendação da pesquisa: 3 cards de citação + ponte — decisão final no /spec.
- **Eyebrow da seção de benefícios:** manter "Por que com a Dra. Ana" ou trocar (ex.: "Segurança em primeiro lugar")? Default: manter.

## Code References Index

- `index.html:131` — H1 do hero (não muda)
- `index.html:132` — subtítulo do hero (mudança 2)
- `index.html:155-162` — trustbar (seção nova entra depois)
- `index.html:164-235` — quiz `#avaliacao` (destino da ponte)
- `index.html:238-262` — seção benefícios (mudança 3)
- `index.html:242` — H2 de benefícios
- `index.html:245-259` — os 3 cards de benefício
- `detalhes/botox.html:320-345` — seção de dor modelo (mudança 1)
- `css/styles.css:70-72` — `.section--cream`, `.section__head`
- `css/styles.css:184,209-210` — `.hero__lead`, `.hero__lead-more` (oculto no mobile)
- `css/styles.css:335` — gradiente da `.quiz-section`
- `css/styles.css:422-427` — delays de animação do hero
- `css/styles.css:550-553` — `.pain-cards`, `.pain-bridge`
- `js/main.js:183-196` — IntersectionObserver de reveal
- `docs/copy-conversao.md:7-21` — regras CFM
- `specs/plans/2026-07-18-correcoes-seo.md` — spec pendente que também edita index.html
