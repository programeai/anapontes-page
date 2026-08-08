# Site Dra. Ana Pontes — convenções gerais

Site estático (GitHub Pages) de uma clínica de estética em João Pessoa/PB.
Médica: **Dra. Ana Paula Pontes · CRM 16743 PB**. WhatsApp `5583991353786`.

Cada área tem o próprio guia — leia o mais específico antes de editar:

- [detalhes/CLAUDE.md](detalhes/CLAUDE.md) — páginas de procedimento (`/detalhes/`)
- [objetivos/CLAUDE.md](objetivos/CLAUDE.md) — LPs de dor, pago + orgânico (`/objetivos/`)
- [lp/CLAUDE.md](lp/CLAUDE.md) — LPs de campanha paga, isoladas e agrupadas por
  região tratada (`/lp/<grupo>/<slug>/`)
- [docs/rastreamento-gtm.md](docs/rastreamento-gtm.md) — GTM, GA4, Meta Pixel, Worker

## Regras de escrita (pt-BR)

Valem para **todo texto que o visitante ou o buscador lê**: corpo das páginas,
títulos (`<title>`), `meta`, `og:*`, `alt`, `aria-label`, legendas e microcopy.

- **Nunca usar travessão (`—`) nem meia-risca (`–`) no texto.** É um tell de IA e
  quebra o tom humano do site. No lugar dele, use a pontuação pt-BR adequada ao caso:
  - **vírgula** para aposto ou pausa leve;
  - **dois-pontos** para explicação ou enumeração que se segue;
  - **parênteses** para aparte ou sigla;
  - **ponto** quando dá para separar em duas frases (costuma ser o mais forte).
  - Em título/`<title>`, separe marca e assunto com `|` ou `·`, nunca com `—`.
- Português do Brasil correto: acentuação, concordância, crase e regência revisadas.
  Registro é o "você" acolhedor (o "te" informal já aparece no site e é aceitável),
  sem gíria e sem infantilizar.
- Sem hype vazio nem promessa de resultado (ver as regras de CFM nos guias de área).

> Exceção: **comentários de código** (JS/CSS) seguem o estilo já existente do repo,
> que usa `—`. A regra acima é sobre texto publicado, não sobre comentário interno.
> Ao gerar copy nova a partir das specs/docs (que ainda contêm `—`), aplique a regra
> na página final mesmo que a fonte tenha travessão.
