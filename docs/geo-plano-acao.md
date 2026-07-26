# GEO — plano de ação

**Criado em:** 2026-07-25
**Base:** [`GEO-ANALYSIS.md`](../GEO-ANALYSIS.md) (score atual **66/100**)
**Status:** backlog — nada executado ainda

Documento de trabalho. Triagem do que é código, do que depende de informação da médica e do que não se resolve no repositório.

---

## Teto realista

Executar **tudo** que é código leva o score de 66 para **~75-78**. O teto sem presença off-site fica aí: as duas dimensões mais fracas — autoridade 40/100 e multimodal 53/100 — dependem de ativos que não existem no repositório (perfis em diretórios médicos, YouTube). Vale fazer os itens de código, mas eles **não substituem** a conversa com a médica.

---

## A. Resolvível no repositório

Sem dependência externa. Estimativas de esforço, não de valor.

| # | Item | Arquivos | Esforço | Impacto |
|---|---|---|---|---|
| A1 | `datePublished` + `dateModified` nas 13 páginas + data de revisão visível no rodapé dos detalhes | JSON-LD de todas | ~1h | **Alto** |
| A2 | Bloco-resposta de ~148 palavras na home (texto pronto em GEO-ANALYSIS §10.1) | `index.html` | ~30min | **Alto** |
| A3 | Bloco autocontido "O que é / Para quem / Como funciona / Números / Quem realiza" nas 11 páginas de detalhe (molde em §10.2) | `detalhes/*.html` | ~2h | **Alto** |
| A4 | Converter os 11 blocos "Informações importantes" de H3+parágrafo para `<table>` (§10.3) | `detalhes/*.html` + CSS | ~1h | Médio-alto |
| A5 | Tabela comparativa dos 11 procedimentos (indicação × início × duração × invasividade) | `tratamentos.html` | ~1h | Médio-alto |
| A6 | Nó `WebPage` com datas e `about` na home e em tratamentos | JSON-LD | ~15min | Médio |
| A7 | Auditar os 11 `alt=""` (de 178 `<img>`) — descritivo se for imagem de conteúdo | `index.html`, `detalhes/*.html` | ~20min | Baixo-médio |
| A8 | Normalizar `llms.txt` para UTF-8 acentuado | `llms.txt` | 5min | Baixo |
| A9 | Novas perguntas de FAQ + `FAQPage` (lista em §10.5) | `detalhes/*.html` | ~1h | Médio |

**Caminho curto sugerido:** A1 + A2 + A4. Meia jornada de trabalho, pega os três ganhos mais mecânicos.

### Por que A1 é o de melhor custo/benefício

O site tem hoje **zero** propriedades de data. O único sinal temporal é `lastReviewed: "2026-04-26"` nas 11 páginas de detalhe. Conteúdo com menos de 3 meses tem ~3x mais chance de citação; acima de 6 meses parado, a elegibilidade cai. Pesa especialmente no **AI Mode**, onde frescor supera posição orgânica. É uma hora de trabalho.

Junto disso vale definir o **ciclo de revisão trimestral**: atualizar `dateModified` + `lastmod` do sitemap na mesma passada.

---

## B. Resolvível no repositório, mas bloqueado por informação

Posso implementar assim que o dado existir. Perguntas para a médica:

| # | Item | O que falta saber |
|---|---|---|
| B1 | Expandir `sameAs` do `Physician` (hoje só 2 URLs: Instagram e Maps; deveria ter 6-8) | As URLs dos perfis novos — só existem depois de C1/C2 |
| B2 | Enriquecer o nó `founder` / `Person` com `alumniOf`, `hasCredential`, `knowsAbout` | Onde se formou; quais especializações declarar formalmente |
| B3 | `Physician.memberOf` | É filiada a SBD, SBME ou outra sociedade? Sinal forte de E-E-A-T médico |

Nada disso pode ser preenchido por inferência — é dado sobre uma pessoa real, em área regulada.

---

## C. Fora do repositório

Os de **maior impacto** no score de autoridade, e nenhum é código.

| # | Item | Por quê | Prazo |
|---|---|---|---|
| C1 | Perfil no **Doctoralia** (verificado, CRM 16743 PB, NAP idêntico ao schema) | É o resultado #1 e #2 para "dermatologista João Pessoa" | 2-4 sem |
| C2 | **LinkedIn** profissional + perfis em rsaude e CatalogoMed | Diretórios que aparecem nas buscas locais | 2-4 sem |
| C3 | **Canal no YouTube** — 6-10 vídeos de 60-90s, um por procedimento, com transcrição na descrição | Menções no YouTube têm a correlação mais forte com citação em IA (~0,737), acima de qualquer outro sinal medido. Resolve autoridade **e** multimodal de uma vez | 4-8 sem |
| C4 | **Google Business Profile** — revisar descrição, categorias e serviços para bater com o `hasOfferCatalog` | Perfil já existe, só desalinhado | 1 sem |
| C5 | Campanha de **Preferred Sources** — pedir no Instagram que pacientes marquem o site como fonte preferida no Google | Gratuito, acionável com a audiência que já existe, e o Google trabalha para transformar em sinal de ranqueamento | 1 dia |

> Todos dentro das restrições do CFM: sem antes/depois, sem promessa de resultado, sem preço. Perfis de diretório e vídeo educativo estão em conformidade.

---

## D. Meio-termo — IndexNow

Alimenta o índice do Bing, que é o que abastece o Copilot. Implementável aqui, mas **não é one-liner**: o repositório não tem `.github/workflows/` (o deploy é GitHub Pages direto do branch). Exige criar o primeiro workflow e gerar/hospedar a chave.

Esforço: ~2h. Impacto: médio, restrito ao Copilot.

---

## E. Decidido não fazer

Registrado para não voltar à discussão:

- **Mais investimento em `llms.txt`.** Está pronto e bem estruturado. O Google declara explicitamente que ignora o arquivo no Search, incluindo os recursos generativos. Manter (custo zero, pode servir a IAs não-Google), não evoluir. Só o A8 cosmético.
- **Bloquear crawlers de IA no robots.txt.** Hoje nenhum está bloqueado — esse é o estado correto. Cada bloqueio remove uma superfície de citação.
- **Wikipedia.** Consultório individual não atende critério de notabilidade. A tentativa desperdiça tempo e tende a ser removida.
- **`AggregateRating` no schema.** Exige avaliações verificáveis no próprio site e é área sensível na publicidade médica. Avaliações ficam no GBP.
- **Reddit.** Correlação alta em geral, mas baixa aderência ao público (mulheres 30-50, João Pessoa).
- **Reescrever a copy emocional para "ficar mais citável".** Ela converte. A estratégia é **adicionar** blocos extraíveis acima/abaixo dela, nunca substituir.

---

## Sobreposição com o spec em aberto

[`specs/plans/2026-07-25-seo-lcp-schema-linkagem.md`](../specs/plans/2026-07-25-seo-lcp-schema-linkagem.md) (não commitado) já cobre LCP do hero, `openingHoursSpecification`, rebalanceamento de linkagem interna e limpeza do `llms.txt`.

**Atenção ao conflito:** a Phase 4 daquele spec mexe no `llms.txt` — o item A8 aqui deve ser feito *dentro* dela, não em paralelo, para não gerar edições concorrentes no mesmo arquivo. As demais fases não colidem com este plano.

---

## Como medir depois

Reexecutar `/seo-geo https://www.draanapontes.com.br/` e comparar contra o baseline de 66/100 registrado em `GEO-ANALYSIS.md`. Métricas que devem se mover primeiro:

- Acessibilidade técnica 85 → 90+ (com A1 e A6)
- Citabilidade 72 → 85+ (com A2, A3, A4, A5)
- Autoridade 40 → 65+ **só depois de C1-C4**
- Multimodal 53 → 80 **só depois de C3**

Teste independente do score: repetir as buscas por `"Dra. Ana Pontes" João Pessoa`. Hoje **nenhuma** retorna o site, o Instagram ou qualquer menção. No dia em que retornarem, a alavanca de autoridade destravou.
