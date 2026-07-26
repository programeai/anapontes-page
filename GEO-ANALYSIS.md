# GEO / AI Search — draanapontes.com.br

**Data da análise:** 2026-07-25
**Escopo:** 13 URLs indexáveis (home, tratamentos, 11 páginas de detalhe) + robots.txt, sitemap.xml, llms.txt
**Método:** inspeção do HTML servido (live + working tree), JSON-LD parseado, busca de menções de marca

> Enquadramento: seguindo a posição oficial do Google (`developers.google.com/search/docs/fundamentals/ai-optimization-guide`), GEO/AEO **não é uma disciplina separada** — é SEO aplicado às superfícies de resposta generativa. Os achados abaixo estão organizados nesse enquadramento.

---

## 1. GEO Readiness Score: 66/100

| Dimensão | Peso | Nota | Ponderado |
|---|---|---|---|
| Citabilidade (passagens) | 25% | 72/100 | 18,0 |
| Legibilidade estrutural | 20% | 75/100 | 15,0 |
| Conteúdo multimodal | 15% | 53/100 | 8,0 |
| Autoridade e sinais de marca | 20% | 40/100 | 8,0 |
| Acessibilidade técnica | 20% | 85/100 | 17,0 |
| **Total** | | | **66,0** |

**Leitura em uma frase:** o site está tecnicamente muito bem preparado para ser lido e citado por sistemas de IA — o que trava a visibilidade não é o HTML, é a **ausência quase total de entidade fora do domínio próprio**.

---

## 2. Breakdown por plataforma

| Superfície | Score | Por quê |
|---|---|---|
| **Google AI Overviews** | 62/100 | AIO cita majoritariamente páginas que já rankeiam (92% vêm do top-10). Base técnica e de passagens está pronta; o gargalo é posição orgânica de um domínio novo. |
| **Google AI Mode** | 55/100 | Superfície distinta (só 13,7% de sobreposição de URLs com AIO). Pesa frescor e autoridade de entidade — as duas fraquezas atuais: **nenhum `dateModified`/`datePublished` no site inteiro** e entidade off-site inexistente. |
| **ChatGPT (web search)** | 35/100 | Fontes dominantes são Wikipedia (47,9%) e Reddit (11,3%). Zero presença nas duas. Para consultas locais o modelo tende a puxar diretórios médicos (Doctoralia, rsaude, CatalogoMed) — onde a marca também não aparece. |
| **Perplexity** | 32/100 | 46,7% das citações vêm do Reddit. Sem presença em comunidade, a chance de citação é quase só via ranqueamento direto. |
| **Bing Copilot** | 50/100 | Site é estático e crawlável, mas não há IndexNow implementado — indexação no Bing depende de descoberta passiva. |

---

## 3. Status de acesso dos crawlers de IA

`robots.txt` servido em produção:

```
User-agent: *
Allow: /

Sitemap: https://www.draanapontes.com.br/sitemap.xml
```

| Crawler | Status | Observação |
|---|---|---|
| GPTBot (OpenAI) | ✅ Permitido | via wildcard |
| OAI-SearchBot | ✅ Permitido | via wildcard |
| ChatGPT-User | ✅ Permitido | ignora robots.txt por design |
| ClaudeBot | ✅ Permitido | via wildcard |
| PerplexityBot | ✅ Permitido | via wildcard |
| Google-Extended | ✅ Permitido | **importante** — não bloquear; é o opt-in de grounding do Gemini/AI Mode |
| CCBot | ✅ Permitido | treino; bloquear é opcional |
| Bytespider / cohere-ai | ✅ Permitido | via wildcard |

**Veredito: nenhum crawler de IA está bloqueado.** Esse é o estado correto. Não há nada a corrigir aqui — e vale registrar: **não adicione bloqueios "por segurança"**, cada bloqueio remove uma superfície de citação.

Controle de aparência em AI Overviews / AI Mode: as 13 páginas indexáveis usam `max-snippet:-1` e `max-image-preview:large` — ou seja, snippet irrestrito, que é o ideal para elegibilidade a citação. `tratamentos-quiz.html` está corretamente com `noindex,follow`.

---

## 4. llms.txt

**Presente** em `/llms.txt` (~1,9 KB), bem estruturado: título, sumário para sistemas de IA, lista completa das 13 páginas, entidades de contato (WhatsApp, Instagram, Maps), CRM e nota de segurança médica.

**Peso atribuído na pontuação: zero.** Não por defeito do arquivo, mas porque a evidência primária é clara:

- O guia de otimização para IA do Google (atualizado em 2026-06-29) afirma explicitamente que arquivos `llms.txt` **não são necessários** e que "não prejudicam (nem ajudam)" a visibilidade no Google Search, incluindo os recursos generativos — o Search simplesmente os ignora.
- John Mueller chamou o caso de uso de descoberta via `llms.txt` de "beco sem saída".

**Recomendação: manter o arquivo** (custo zero, pode ser útil para serviços de IA não-Google) e **não investir mais tempo nele**. Um ajuste barato: o arquivo está todo em ASCII sem acentos ("estetica", "Joao Pessoa", "medica"). Não quebra nada, mas normalizar para UTF-8 acentuado alinha as strings do arquivo com as do site e do schema, o que ajuda casamento de entidade.

**RSL 1.0:** não implementado. Para um site clínico de captação local, isso é irrelevante — não recomendo.

---

## 5. Análise de menções de marca (o gargalo real)

Menções de marca correlacionam ~3x mais com visibilidade em IA do que backlinks (Ahrefs, dez/2025 — 75 mil marcas). Estado atual:

| Plataforma | Correlação com citações | Presença | Nota |
|---|---|---|---|
| Wikipedia / Wikidata | Alta | ❌ Ausente | Inviável e inadequado para consultório individual — **ignorar** |
| YouTube | ~0,737 (mais forte) | ❌ Ausente | **Maior oportunidade não explorada** |
| Reddit | Alta | ❌ Ausente | Baixa aderência ao público (mulheres 30-50, João Pessoa) — baixa prioridade |
| LinkedIn | Moderada | ❌ Ausente | Barato de resolver, vale fazer |
| Instagram | — | ✅ `@draanapontesoficial` | Único perfil no `sameAs` |
| Google Maps / GBP | — | ✅ Perfil existe | Segundo item do `sameAs` |
| Doctoralia / rsaude / CatalogoMed | — | ❌ Ausente | Esses são os diretórios que **efetivamente aparecem** nas buscas de "dermatologista João Pessoa" |

**Teste empírico realizado:** três buscas na web por `"Dra. Ana Pontes" + João Pessoa`, `"Ana Pontes" + harmonização facial + João Pessoa` e pelo domínio/handle. **Nenhuma retornou o site, o Instagram ou qualquer menção da profissional.** Os resultados foram dominados por Doctoralia, rsaude, CatalogoMed, Clínica Consulta e concorrentes locais (Maryanna Menezes, Juliana Fontes, Viotto).

Isso é o achado mais importante do relatório: **para um LLM, a entidade "Dra. Ana Pontes de João Pessoa" hoje praticamente não existe fora do próprio domínio.** Schema impecável não compensa ausência de corroboração externa — os modelos precisam de fontes independentes para confiar numa afirmação sobre um profissional de saúde.

O `sameAs` do `Physician` tem apenas 2 URLs. Deveria ter 6-8.

---

## 6. Citabilidade em nível de passagem

**Extensão ideal para citação: 134-167 palavras por bloco autocontido.** ~44% das citações de IA vêm dos primeiros 30% da página (SE Ranking).

Estado atual das páginas:

| Página | Palavras | `<p>` | Média/parágrafo | Parágrafos >60 palavras |
|---|---|---|---|---|
| index.html | 1.975 | 60 | 24 | 3 |
| tratamentos.html | 818 | 30 | 19 | 1 |
| detalhes/*.html (11) | 1.643-1.730 | 40-43 | 25-29 | 1-2 |

**O que já está bom:**
- Parágrafos curtos (média 19-29 palavras) — formato ideal para extração.
- Definições canônicas presentes: *"Botox® é o nome comercial mais conhecido para a Toxina Botulínica tipo A, uma proteína purificada de origem biológica."* — exatamente o padrão `X é...` que sistemas de IA extraem.
- Dados numéricos específicos e verificáveis nas páginas de detalhe: sessão 15-20 min, início 48-72 h, efeito pleno 10-15 dias, duração 4-6 meses, prevenção a partir de 25-30 anos.
- FAQ real em todas as 13 páginas (5-6 pares Q&A), com `FAQPage` schema espelhando o texto visível.
- 47 dos 155 H2 do site (~30%) estão em formato de pergunta.

**O que trava a citação:**

1. **A home enterra a resposta.** Os primeiros 200 palavras são copy emocional ("Para quando o espelho começa a mostrar um cansaço que você não sente"). Excelente para conversão, inútil para extração — não há nenhuma frase autocontida que responda "quem é Ana Pontes / o que ela faz / onde". Os 30% iniciais da página, onde nasce 44% das citações, estão gastos com storytelling.

2. **Zero tabelas em todo o site** (`<table>` = 0 em 13 páginas). O bloco "Informações importantes sobre o Botox®" (duração, desconforto, início, resultado, duração do efeito, quem realiza) é *conteúdo tabular renderizado como H3 + parágrafos*. Convertido em `<table>`, vira a passagem mais citável do site — é dado comparativo estruturado, que é precisamente o que AI Overviews extrai.

3. **Blocos abaixo de 134 palavras.** Com média de 25-29 palavras por parágrafo e H2 a cada 2-3 parágrafos, as seções ficam em ~60-90 palavras — curtas demais para serem autocontidas. Falta contexto interno (a seção "O que é o Procedimento" não repete que é em João Pessoa, nem quem executa), então o trecho extraído perde as âncoras de entidade.

4. **Nenhum dado proprietário.** "+280 pacientes em João Pessoa" é o único número original do site. Não há nada que só esta fonte possa fornecer — e originalidade é o que gera badge "Highly Cited" e citação repetida.

---

## 7. Server-Side Rendering

✅ **Aprovado, sem ressalvas.**

- Site 100% estático (HTML/CSS/JS puro, GitHub Pages) — todo o conteúdo textual está no HTML servido. Crawlers de IA não executam JavaScript; aqui não precisam.
- `js/main.js` (30 KB) toca apenas comportamento: carrosséis, quiz, um `innerHTML` em grid de tratamentos relacionados. Nenhum texto de valor depende de JS.
- Verificação cruzada: o WebFetch da home e de `detalhes/botox.html` (que não executa JS) retornou H1, H2s, FAQ, definições e todos os números — confirmação direta de que o conteúdo é acessível sem renderização.
- 13 JSON-LD válidos parseados sem erro.
- `loading="lazy"` em 29 imagens da home / 10-11 nas internas — não afeta indexação de texto.

Único ponto de atenção: 11 de 178 `<img>` estão com `alt=""`. Se forem decorativas, está correto; se forem fotos de resultado/procedimento, é sinal multimodal desperdiçado.

---

## 8. Top 5 mudanças de maior impacto

### 1. Construir presença de entidade fora do domínio — `sameAs` de 2 → 7 URLs
**Impacto: alto | Esforço: médio | Prazo: 2-4 semanas**

Ordem de execução, por relação custo/retorno:
1. **Doctoralia** — é o resultado #1 e #2 para "dermatologista João Pessoa". Perfil verificado com CRM 16743 PB, mesmo NAP do schema.
2. **Google Business Profile** — já existe; garantir descrição, categorias e serviços idênticos ao `hasOfferCatalog`.
3. **LinkedIn** profissional com CRM e formação.
4. **rsaude.com.br** e **CatalogoMed** — diretórios locais que aparecem nas buscas.
5. **YouTube** (ver item 2).

Depois, refletir tudo no `sameAs` do `Physician` em `index.html`. O `sameAs` é como o modelo conecta "esse site" a "essa pessoa que aparece em outros lugares" — com 2 URLs, a reconciliação de entidade não acontece.

> Restrição CFM: nada de antes/depois, promessa de resultado ou preço. Perfis de diretório e conteúdo educativo estão dentro das regras.

### 2. Canal no YouTube com 6-10 vídeos curtos educativos
**Impacto: alto | Esforço: médio-alto | Prazo: 4-8 semanas**

Menções no YouTube têm a correlação mais forte com citações em IA (~0,737) — mais forte que qualquer outro sinal medido. Um vídeo de 60-90s por procedimento ("O que o Botox faz e o que ele não faz", "Quanto tempo dura um preenchimento"), com transcrição na descrição, resolve simultaneamente: sinal de marca, conteúdo multimodal e corroboração de expertise. Embedar os vídeos nas páginas de detalhe correspondentes eleva a nota multimodal de 53 para ~80.

### 3. Adicionar datas — `datePublished` + `dateModified` em todas as 13 páginas
**Impacto: alto | Esforço: baixo | Prazo: 1 dia**

Hoje o site tem **zero** propriedades de data. O único sinal temporal é `lastReviewed: "2026-04-26"` nas 11 páginas de detalhe (3 meses atrás). Conteúdo com menos de 3 meses tem ~3x mais chance de citação; a partir de 6 meses parados, a elegibilidade cai (SE Ranking, estudo com 1,3 mi de citações). Isso pesa especialmente no **AI Mode**, onde frescor supera posição.

Ações:
- Adicionar `datePublished` e `dateModified` no `MedicalWebPage` (detalhe) e criar um `WebPage` com datas na home e em `tratamentos.html`.
- Exibir a data visivelmente: *"Revisado por Dra. Ana Pontes (CRM 16743 PB) em 26/04/2026"* — sinal para leitores e para o teste Who/How/Why do Google.
- Estabelecer ciclo de revisão trimestral e atualizar `dateModified` + `lastmod` do sitemap junto.

### 4. Bloco-resposta de 140-160 palavras no topo de cada página
**Impacto: alto | Esforço: baixo-médio | Prazo: 2-3 dias**

Inserir, logo após o H1 e antes da copy emocional, um parágrafo autocontido que responda diretamente à pergunta da página, com entidade + local + credencial + números. A copy de conversão continua logo abaixo — não se perde nada de CRO, ganha-se a faixa dos 30% iniciais onde nascem 44% das citações. Modelos no item 10.

### 5. Converter os blocos "Informações importantes" em `<table>`
**Impacto: médio-alto | Esforço: baixo | Prazo: 1 dia**

11 páginas × 6 atributos de dado já escritos, hoje em H3+parágrafo. Como `<table>` viram dado comparativo extraível — o formato que AI Overviews prefere para respostas do tipo "quanto tempo dura", "quantas sessões", "dói". Custo: uma refatoração de markup, zero conteúdo novo.

---

## 9. Recomendações de schema

**O que já está certo (não mexer):**
- `Physician` completo com endereço, geo, telefone, horários, `alternateName` (9 variantes — excelente para casamento de entidade), `hasOfferCatalog` com 9 serviços.
- `@id` consistente entre páginas (`#physician`, `#website`) — grafo bem ligado.
- `MedicalProcedure` + `MedicalWebPage` + `MedicalAudience` + `SpeakableSpecification` nas 11 páginas de detalhe. Cobertura acima da média do setor.
- `FAQPage` espelhando texto visível.
- `BreadcrumbList`, `ItemList` em tratamentos, `disclaimer` médico. Correto e em conformidade com CFM.

**Lacunas a fechar:**

| Prioridade | Ação |
|---|---|
| Alta | `datePublished` + `dateModified` em todas as páginas (ver item 8.3) |
| Alta | Expandir `sameAs` do `Physician` de 2 → 6-8 URLs conforme o item 8.1 |
| Média | Enriquecer o nó `Person` do `founder`: hoje só `name`, `jobTitle`, `identifier`. Adicionar `alumniOf`, `knowsAbout` (lista dos procedimentos), `hasCredential` (`EducationalOccupationalCredential` com o CRM) e `sameAs` próprio |
| Média | `Physician.memberOf` se houver filiação (SBD, SBME) — sinal forte de E-E-A-T médico |
| Média | Adicionar `WebPage` com `datePublished`/`dateModified`/`about` na home e em `tratamentos.html` (hoje só `WebSite` + `FAQPage`) |
| Baixa | `VideoObject` nas páginas de detalhe quando o YouTube estiver no ar |
| Baixa | `AggregateRating` **não recomendado** — exige avaliações verificáveis no próprio site e é área sensível em publicidade médica. Deixar as avaliações no GBP |

---

## 10. Reformulações de conteúdo (passagens específicas)

### 10.1 Home — bloco-resposta após o H1

Atual (primeiras palavras do body): *"Para quando o espelho começa a mostrar um cansaço que você não sente..."*

Inserir **antes** dessa copy, como parágrafo próprio:

> A Dra. Ana Pontes é médica (CRM 16743 PB) em João Pessoa, na Paraíba, com atuação em rejuvenescimento facial e estética avançada. O consultório fica em Manaíra, no Liv Mall Shopping, e atende procedimentos injetáveis e regenerativos: toxina botulínica (Botox®), preenchimento com ácido hialurônico, bioestimuladores de colágeno (Radiesse®), PDRN injetável e Mesoject, fios de PDO lisos e de tração, ultrassom microfocado e harmonização glútea. A proposta clínica é o rejuvenescimento natural — devolver vitalidade ao rosto sem alterar as expressões —, com plano individualizado definido em avaliação presencial e acompanhamento pós-procedimento pela própria médica. Mais de 280 pacientes atendidas em João Pessoa desde a abertura do consultório.

*(~148 palavras — dentro da faixa 134-167. Contém: entidade, credencial, localização, catálogo de serviços, diferencial, número proprietário. É extraível sem contexto algum.)*

### 10.2 Páginas de detalhe — abertura autocontida

O padrão atual abre com dor ("Linhas na testa, entre as sobrancelhas..."). Manter — mas inserir logo depois um bloco no molde:

> **O que é:** [Procedimento] é [definição técnica em uma frase]. **Para quem:** [indicação principal em uma frase]. **Como funciona:** [mecanismo em uma frase]. **Números:** sessão de [X] min, efeito visível em [Y], resultado pleno em [Z], duração de [W]. **Quem realiza:** exclusivamente a Dra. Ana Pontes, médica (CRM 16743 PB), em João Pessoa (PB), após avaliação clínica individual.

Cada página de detalhe já tem todos esses dados espalhados — a mudança é **concentrá-los em um bloco único**, porque a citação extrai um trecho contíguo, não a página inteira. Repetir "João Pessoa" e "CRM 16743 PB" dentro do bloco é intencional: garante que o trecho extraído carregue as âncoras de entidade.

### 10.3 Tabela de especificações (11 páginas)

Substituir os H3 "Duração da sessão / Desconforto / Início dos efeitos / Resultado final / Duração do efeito / Quem realiza" por:

| Aspecto | Botox® com a Dra. Ana Pontes |
|---|---|
| Duração da sessão | 15 a 20 minutos |
| Desconforto | Mínimo (anestésico tópico) |
| Início dos efeitos | 48 a 72 horas |
| Resultado final | 10 a 15 dias |
| Duração do efeito | 4 a 6 meses |
| Quem realiza | Dra. Ana Pontes, médica — CRM 16743 PB |

### 10.4 `tratamentos.html` está subdimensionada

818 palavras contra 1.643-1.730 das páginas de detalhe. É a página-hub por objetivo e a que mais tende a ser puxada para consultas comparativas ("qual tratamento para flacidez", "diferença entre bioestimulador e preenchimento"). Falta ali exatamente o que a torna citável: **uma tabela comparativa** dos 11 procedimentos (indicação principal × início do efeito × duração × invasividade). Isso é conteúdo comparativo original, o formato de maior taxa de extração.

### 10.5 Perguntas que ninguém responde na região

As buscas realizadas mostram que os concorrentes de João Pessoa não têm conteúdo respondendo consultas de intenção informacional local. Espaço aberto para blocos de FAQ ou seções curtas (150 palavras, com dado específico):

- "Quanto tempo antes de um evento devo fazer Botox?"
- "Bioestimulador ou preenchimento: qual a diferença?"
- "Posso fazer PDRN e Botox na mesma sessão?"
- "Com quantos anos começar a prevenção?" (o site já tem o dado: 25-30 anos)
- "Quanto tempo dura o inchaço depois do preenchimento?"

---

## 11. Ganhos rápidos (execução em 1-2 dias)

1. `datePublished` + `dateModified` em todas as páginas, e data de revisão visível no rodapé de cada página de detalhe.
2. Bloco-resposta de ~148 palavras na home (10.1).
3. Converter os 11 blocos de especificação em `<table>` (10.3).
4. Expandir `sameAs` do `Physician` com as URLs que já existem (GBP, Instagram) + as criadas.
5. Auditar os 11 `alt=""` — se forem imagens de conteúdo, escrever alt descritivo.
6. Normalizar `llms.txt` para UTF-8 acentuado.
7. Implementar IndexNow para o Bing (feed do Copilot) — o site é estático, dá para disparar no deploy via GitHub Actions.
8. **Preferred Sources:** o Google já permite que usuários marquem fontes preferidas em respostas de IA (disponível em todos os idiomas desde 30/04/2026, com sinal de ranqueamento em desenvolvimento). Vale uma chamada no Instagram pedindo às pacientes que adicionem o site como fonte preferida — é gratuito e diretamente acionável com a audiência que já existe.

---

## 12. O que **não** fazer

- **Não investir mais em `llms.txt`.** Está pronto, o Google ignora, não é alavanca.
- **Não bloquear crawlers de IA** no robots.txt. Cada bloqueio é uma superfície de citação a menos.
- **Não perseguir Wikipedia.** Consultório individual não atende critério de notabilidade; a tentativa desperdiça tempo e pode gerar remoção.
- **Não implementar `AggregateRating`** sem avaliações verificáveis e sem revisar conformidade com a publicidade médica do CFM.
- **Não reescrever a copy emocional para "ficar mais citável".** Ela converte. A recomendação é **adicionar** blocos extraíveis, não substituir o que já funciona.
- **Não usar antes/depois** para conteúdo multimodal — vedado pelo CFM. Vídeo educativo e ilustração de mecanismo resolvem o sinal multimodal sem risco.

---

## 13. Fontes das referências usadas

- Google, *AI Optimization Guide* (Search Central, atualizado 2026-06-29) — GEO/AEO como SEO; `llms.txt` ignorado pelo Search
- Google, *AI features and your website* — controle de aparência via `nosnippet`/`max-snippet`/`noindex`; não existe opt-out específico de IA
- Ahrefs (dez/2025, 75.000 marcas) — menções de marca ~3x mais correlacionadas com visibilidade em IA que backlinks; YouTube ~0,737
- Ahrefs (540 mil pares de consultas) — AI Mode e AI Overviews citam as mesmas URLs em apenas 13,7% dos casos
- SE Ranking (1,3 mi de citações) — faixa de 134-167 palavras; ~44% das citações vindas dos primeiros 30% da página; frescor <3 meses ≈ 3x mais citações
- Distribuição de fontes por plataforma (ChatGPT: Wikipedia 47,9% / Reddit 11,3%; Perplexity: Reddit 46,7%)
