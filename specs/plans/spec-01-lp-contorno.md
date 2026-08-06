# SPEC 01 — LP "Contorno" · /lp/preenchimento-labial-contorno/

**Dor:** perda de definição do contorno labial / batom que escorre
**Público:** mulheres 40-60, região de atuação da clínica
**Conjunto de anúncio:** `utm_content=dor_contorno`
**Tom de voz:** respeitoso, adulto, sem infantilizar e sem dramatizar o envelhecimento. Nunca usar "flacidez", "boca envelhecida", "sinais da idade" como acusação — a página descreve a situação como processo natural com solução técnica. A leitora deve se sentir **entendida**, não diagnosticada.

**Título/description:**
- `<title>` Contorno labial com critério médico — Dra. {Nome}
- `description` O batom que escorre pelos cantinhos tem explicação e tem tratamento. Avaliação com a Dra. {Nome} em {Cidade}.

---

## Seção 1 — HERO

```
[logo pequeno, sem link]

H1:  Seu batom começou a escorrer
     pelos cantinhos dos lábios?

SUB: A perda de contorno labial tem explicação — e tem tratamento
     médico que devolve a definição sem mudar quem você é.

[CTA] Quero entender meu caso  →  âncora #qualificacao
[micro-texto sob o CTA] Avaliação presencial com a própria médica
```

**Layout:** duas colunas no desktop (texto à esquerda, imagem à direita); empilhado no mobile com a imagem **depois** do CTA (texto primeiro = LCP de texto, mais rápido).
**Imagem hero:** retrato da médica em contexto de consultório, olhando para a câmera, luz natural — **não** foto de banco de lábios. O rosto dela é o diferencial competitivo; foto de stock é o que as concorrentes usam. WebP, `fetchpriority="high"`, dimensões explícitas.
**H1:** `--fonte-display`, `clamp(1.9rem, 5.5vw, 3rem)`, duas linhas no mobile. Quebra de linha controlada (`<br>` ou `text-wrap: balance`).

## Seção 2 — ESPELHO DA DOR

Eyebrow: **"Você percebeu que…"**

Quatro itens curtos, layout em lista com marcador discreto (traço na `--cor-acento`, não emoji, não ícone genérico):

1. O batom migra para os risquinhos ao redor da boca, mesmo os de boa qualidade.
2. O desenho dos lábios foi ficando "apagado" nas fotos — o contorno que existia já não se vê.
3. Retocar o batom várias vezes ao dia virou rotina, e mesmo assim não fica como antes.
4. Delinear a boca ajuda por algumas horas, mas parece maquiagem demais para o dia a dia.

Fecho da seção (uma linha, itálico ou peso maior):
> Se você se reconheceu em pelo menos um desses pontos, o que vem a seguir explica o porquê.

**Regra de copy:** nenhum item pode culpar a leitora ("você deixou de cuidar") nem prometer nada ainda. Só reconhecimento.

## Seção 3 — POR QUE ISSO ACONTECE (autoridade)

Fundo `--cor-fundo-suave`. Largura de texto `--largura-texto`. 3 parágrafos:

> **Não é o batom. É o contorno.**
>
> Com o passar dos anos, a produção de colágeno na região ao redor da boca diminui naturalmente. O arco do cupido — aquele desenho na parte central do lábio superior — perde definição, e a pele perilabial forma sulcos finos e verticais. É por esses sulcos que o batom migra.
>
> Ou seja: o problema não é estético no sentido superficial. É estrutural — e por isso nenhum batom, primer ou lápis resolve de forma duradoura. A boa notícia é que estrutura se trata.
>
> Esse processo é natural e acontece com todas as mulheres em ritmos diferentes. Identificar em que estágio ele está no seu caso é exatamente o papel de uma avaliação médica.

## Seção 4 — A SOLUÇÃO COM CRITÉRIO MÉDICO

Eyebrow: **"O tratamento"**

> **Preenchimento de contorno: definição, não volume.**
>
> Existe uma diferença técnica importante que quase ninguém explica: preencher para dar **volume** e preencher para devolver **contorno e sustentação** são planejamentos diferentes, com pontos de aplicação e quantidades diferentes.
>
> No seu caso, o objetivo não é uma boca maior — é a **sua** boca, com o desenho recuperado: o batom no lugar, o contorno visível nas fotos, e a naturalidade preservada. Quem convive com você percebe que você está bem. Não percebe procedimento.

Bloco de 3 diferenciais (cards discretos, sem ícones genéricos — usar apenas tipografia e o traço da marca):

| | |
|---|---|
| **Avaliação pela própria médica** | Do planejamento à aplicação, você é atendida pela Dra. {Nome} — não por vendedora ou aplicadora. |
| **Planejamento de proporção** | O rosto inteiro é considerado, não só os lábios. A quantidade certa é a que harmoniza, não a máxima que cabe. |
| **Material e técnica com registro** | Ácido hialurônico com registro na Anvisa, técnica adequada ao seu caso, ambiente clínico. |

## Seção 5 — QUEM É A MÉDICA

Layout: foto (diferente do hero — mais próxima, sorrindo) + texto ao lado.

> **Dra. {Nome Completo}**
> Médica · CRM-RN XXXXX {· RQE se houver}
>
> {Formação: graduação, pós-graduação em Dermatologia em andamento/concluída — redigir conforme o que ela pode legalmente declarar.} Atende em consultório próprio em {Cidade} há {X} anos, com foco em tratamentos de pele e harmonização com naturalidade.
>
> *"Meu compromisso é que ninguém olhe para você e pense 'fez preenchimento'. Pensem: 'ela está ótima'."* — citação real dela, validar o texto antes de publicar.

**Compliance:** títulos e especialidade exatamente como o CRM permite. Sem "especialista em" se não houver RQE.

## Seção 6 — RESULTADOS (condicional — só com termos assinados)

Eyebrow: **"Resultados reais, com naturalidade"**

- 2 casos, ambos de **contorno em paciente madura** (espelhar a dor da página).
- Componente: slider de comparação (arrastar divisor vertical). JS puro: um `input[type=range]` sobreposto controlando `clip-path` da imagem "depois". `prefers-reduced-motion`: substituir por par de imagens lado a lado.
- Legenda por caso: "Preenchimento de contorno labial. Resultado individual — cada tratamento é planejado na avaliação."
- Disclaimer visível imediatamente sob a seção: *"Imagens autorizadas pelas pacientes, sem edição. Resultados variam conforme características individuais. A avaliação médica presencial é indispensável."*
- Lazy loading; dimensões explícitas; fotos padronizadas (mesmo ângulo/luz).

**Se não houver material autorizado no lançamento: omitir a seção inteira.** A página fecha sem ela.

## Seção 7 — COMO FUNCIONA A AVALIAÇÃO

Três passos numerados (aqui a numeração é legítima — é sequência real):

1. **Você responde 4 perguntas rápidas** aqui na página — leva menos de um minuto.
2. **A equipe te chama no WhatsApp** para agendar sua avaliação presencial com a Dra. {Nome}.
3. **Na consulta, vocês definem juntas o plano** — o que faz sentido para o seu caso, quanto custa e quando fazer. Sem compromisso de fechar na hora.

Micro-copy sob o passo 3: "O valor do tratamento depende do planejamento individual e é apresentado na avaliação."
(→ Isso neutraliza a pergunta de preço sem escondê-la, e filtra caçadora de promoção.)

## Seção 8 — PERGUNTAS FREQUENTES (accordion)

`<details>/<summary>` nativos, estilizados. 4 itens:

1. **Vou ficar com a boca artificial?** — Não, e esse é justamente o ponto do planejamento de contorno: o objetivo é devolver a definição que os seus lábios tinham, não criar uma boca nova. A quantidade de produto e os pontos de aplicação são definidos para o seu rosto.
2. **Dói?** — O procedimento é feito com anestesia tópica e o produto contém anestésico. A maioria das pacientes relata desconforto leve e tolerável.
3. **Quanto tempo dura o resultado?** — Em média de 8 a 12 meses, variando com o organismo e o estilo de vida de cada pessoa. Na avaliação, a Dra. {Nome} explica o que esperar no seu caso.
4. **Qualquer profissional pode fazer preenchimento?** — Procedimentos injetáveis no rosto exigem conhecimento de anatomia e conduta para intercorrências. Por isso a avaliação e a aplicação aqui são feitas pela própria médica.

## Seção 9 — QUALIFICAÇÃO (`#qualificacao`)

Título: **"Vamos entender o seu caso?"**
Sub: "Responda 4 perguntas rápidas e agende sua avaliação pelo WhatsApp."

Estrutura, perguntas, validação, eventos: **SPEC 00 §5** (`LP_CONFIG.angulo = "contorno"`).
Botão final: "Quero agendar minha avaliação".
Sob o botão: ícone WhatsApp monocromático + "Você será direcionada ao WhatsApp da clínica."

## Seção 10 — RODAPÉ LEGAL

Conforme SPEC 00 §8.

---

## Notas de design específicas desta LP

- **Assinatura visual da página:** o motivo do "traço de contorno" — um filete fino na `--cor-acento` que sublinha o H1 (desenhado como um traço orgânico em SVG inline, não `border-bottom` reto) e reaparece como marcador nas listas e divisor de seções. Ele materializa o tema da página (contorno/definição) sem custo de performance. É o único elemento decorativo; todo o resto é tipografia e espaço.
- Densidade de texto maior é aceitável (público 40+ lê mais antes de decidir), mas parágrafos de no máx. 3 linhas no mobile.
- Corpo de texto neste público: considerar `--texto-base` em 17-18px.
- CTAs intermediários: repetir o CTA âncora ao fim das seções 4 e 6 ("Quero entender meu caso"), mesmo estilo, para encurtar o caminho de quem já se convenceu.
