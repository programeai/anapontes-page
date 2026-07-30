# Rastreamento & Conversão — Guia de Configuração

Este site já está **instrumentado no código** e o container GTM
(**`GTM-5B27V5DF`**) já está instalado em todas as páginas. Falta
**mapear as tags dentro do painel do GTM** — GA4 (passos 2-3) e Meta Pixel
`4167985703499554` (passo 4), mais os acionadores dos eventos.

Nenhuma mudança de código é necessária para as tags: os eventos já estão no
`dataLayer`, o pixel entra inteiro pelo GTM. A única pendência de código do
rastreamento é a **página de política de privacidade** (ver o final do documento).

## O que já está no código

- **Container GTM** (`GTM-5B27V5DF`) injetado em todas as páginas, no `<head>` e
  como `<noscript>` logo após `<body>`.
- **GA4** (`G-KBQL7JZJ41`) **não é mais carregado por código** — o `gtag.js`
  hardcoded foi removido de todas as páginas (2026-07-18) e o GA4 passou a ser
  **gerenciado 100% pelo GTM** (pageview + eventos). Fonte única de rastreamento.
- **`/js/tracking.js`** e **`/js/main.js`** disparam eventos no `dataLayer`:

| Evento (`event`)  | Quando dispara                            | Parâmetros úteis |
|-------------------|-------------------------------------------|------------------|
| `view_content`    | Ao abrir uma página `/detalhes/*.html`    | `procedure_slug`, `procedure_name`, `utm_*`, `gclid`, `fbclid` |
| `whatsapp_click`  | Ao clicar em qualquer botão de WhatsApp   | `procedure_slug`, `procedure_name`, `link_url`, `utm_*` |
| `qualify_select`  | Ao escolher o prazo no bloco da home      | `qualify_prazo`, `procedure_slug` |
| `quiz_start`      | Ao iniciar o quiz de qualificação         | `quiz_variant` |
| `quiz_complete`   | Ao terminar o quiz                        | `quiz_objetivo`, `quiz_regiao`, `quiz_prazo` |

> As UTMs da campanha são capturadas da URL da landing e **persistem na sessão**,
> então aparecem no `whatsapp_click` mesmo que o clique aconteça páginas depois.

## Passo a passo (uma vez só)

### 1. Criar o container GTM ✅ FEITO
Container **`GTM-5B27V5DF`** criado e instalado no código de todas as páginas.

### 2. GA4 — pageview (substitui o gtag removido)
No GTM: **Tags → Nova → Google (Google Tag)**.
- **ID da tag:** `G-KBQL7JZJ41`
- **Acionador:** `Initialization - All Pages` (ou `All Pages`)
- Isso restabelece o pageview do GA4, agora via GTM. Publicar **antes** de subir
  o código que remove o gtag, para não ficar sem medição.

### 3. GA4 — eventos (uma tag repassa os 5)
- **Variáveis** (tipo *Variável da camada de dados*): `procedure_slug`,
  `procedure_name`, `quiz_objetivo`, `quiz_regiao`, `quiz_prazo`.
- **Acionador** (Evento personalizado, com regex): nome do evento
  `view_content|whatsapp_click|quiz_start|qualify_select|quiz_complete` →
  nomear `Eventos do site`.
- **Tag** GA4 Event: Measurement ID `G-KBQL7JZJ41`; **Nome do evento** = `{{Event}}`
  (variável interna, repassa o nome real); parâmetros mapeados às variáveis acima;
  acionador `Eventos do site`.

### 4. Meta Pixel — `4167985703499554`

Todo o pixel entra **pelo GTM**, nenhuma linha no HTML. Mesma decisão que valeu para
o GA4 (o `gtag.js` hardcoded foi removido em 2026-07-18): fonte única de rastreamento,
um lugar para mexer, sem editar 13 arquivos a cada mudança de tag.

#### 4.1 Tag base

**Tags → Nova → HTML personalizado**, nome `Meta Pixel — Base`:

```html
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '4167985703499554');
fbq('track', 'PageView');
</script>
```

- **Acionador:** `Initialization — All Pages`.
- Deixe **"Suportar document.write" desmarcado**.
- **O `<noscript>` do código que o Meta entrega não vai aqui.** O GTM só executa com
  JavaScript ativo — um visitante sem JS não carrega o container e portanto não
  carregaria o pixel de qualquer forma. Dentro de uma tag de HTML personalizado
  aquele bloco é peso morto.

> **Não use "sequenciamento de tags"** para amarrar a base às tags de evento. A base
> já dispara no `Initialization`, que o GTM processa antes de qualquer evento — e
> sequenciamento em cima disso faz a base disparar de novo, gerando **PageView
> duplicado**. Uma coisa ou outra, nunca as duas.

Por que `Initialization` e não `All Pages`: os `dataLayer.push` de `tracking.js`
(carregado com `defer`) acontecem depois do snippet do GTM no `<head>`, então a ordem
real é `Initialization` → `gtm.js` → `view_content`. A base está sempre no ar antes do
primeiro `fbq('track', ...)`.

#### 4.2 Variáveis (tipo *Variável da camada de dados*)

As mesmas do passo 3, mais uma:

| Variável | Nome do dataLayer | Valor padrão |
|---|---|---|
| `dlv - quiz_variant` | `quiz_variant` | **`home`** |

O padrão é obrigatório: o quiz da home dispara `quiz_start`/`quiz_complete` **sem**
`quiz_variant` (só a variante de `tratamentos-quiz.html` manda o campo). Sem valor
padrão, todo evento da home chega com a variável vazia e os dois quizzes ficam
indistinguíveis no relatório.

Na mesma linha: `quiz_regiao` só existe no quiz da home; a variante `tratamentos-quiz`
não coleta região. Esperado, não é bug.

#### 4.3 Tags de evento

Uma tag de HTML personalizado por evento, cada uma no acionador de evento
personalizado correspondente (os mesmos criados no passo 3).

> **O GTM não descobre os eventos do `dataLayer` sozinho** — não há lista para
> escolher. Cada acionador se cria na mão: **Acionadores → Novo → tipo "Evento
> personalizado"** (seção *Outros* do seletor), digitando o **nome do evento** exato
> (`view_content`, `whatsapp_click`, `quiz_complete`, `quiz_start`) e marcando *Todos
> os eventos personalizados*. Idem para as variáveis do 4.2. Antes de existirem, a
> caixa "Escolher um acionador" só mostra os embutidos (`All Pages`, `Initialization`).

| Tag | Acionador (evento personalizado) | Evento no Meta |
|---|---|---|
| `Meta — ViewContent` | `view_content` | `ViewContent` (padrão) |
| `Meta — Contact` | `whatsapp_click` | `Contact` (padrão) |
| `Meta — Lead` | `quiz_complete` | `Lead` (padrão) |
| `Meta — QuizStart` | `quiz_start` | `QuizStart` (personalizado) |

Conteúdo de cada uma:

```html
<!-- Meta — ViewContent -->
<script>
  if (window.fbq) fbq('track', 'ViewContent');
</script>
```

```html
<!-- Meta — Contact -->
<script>
  if (window.fbq) fbq('track', 'Contact');
</script>
```

```html
<!-- Meta — Lead -->
<script>
  if (window.fbq) fbq('track', 'Lead');
</script>
```

```html
<!-- Meta — QuizStart -->
<script>
  if (window.fbq) fbq('trackCustom', 'QuizStart');
</script>
```

O `if (window.fbq)` é rede de proteção: com a base no `Initialization` ela sempre
dispara primeiro, mas se alguém pausar ou reconfigurar a tag base algum dia, o guard
evita `fbq is not defined` no console em vez de quebrar em silêncio ruidoso.

As tags vão **sem parâmetros de propósito** — ver 4.4.

`qualify_select` fica **fora** do pixel de propósito — é micro-evento de meio de
funil, útil no GA4 para entender a qualificação, mas no Meta só adiciona ruído à
otimização. Sem valor incremental para a campanha.

#### 4.4 Não mande `procedure_slug`/`procedure_name` como parâmetro do pixel

Essa é a única decisão do setup que não é mecânica, então vale o registro.

Os eventos do site carregam `procedure_slug` e `procedure_name` (`botox`,
`harmonizacao-glutea`, `Preenchimento Facial`...). É tentador repassar como
`content_name`/`content_category` no `fbq`, mas:

- Os **Termos das Ferramentas de Negócios do Meta** proíbem enviar dados que revelem
  condição ou tratamento de saúde de uma pessoa. O filtro automatizado do Events
  Manager sinaliza parâmetros "potencialmente sensíveis", e a penalidade cai sobre o
  **dataset/conta de anúncios**, não sobre o evento isolado.
- **Não muda nada na otimização.** O Meta otimiza pelo volume e pela qualidade do
  sinal de conversão, não pelo nome do procedimento. A segmentação por procedimento
  se resolve na **estrutura de campanha** (um conjunto por procedimento, com a URL da
  landing correspondente) — não em parâmetro de evento.
- O dado continua disponível onde é útil: **no GA4**, via os mesmos eventos.

Ou seja: custo zero para omitir, risco real para incluir. A URL da página já vai no
pixel de forma inerente (`/detalhes/botox.html`) e isso não há como evitar — o que se
evita aqui é o parâmetro explícito, que é o que o filtro do Meta lê.

### 5. Verificar
- **Preview** do GTM + **Tag Assistant** (GA4) e **Meta Pixel Helper** (Pixel).
- Abra `/detalhes/botox.html?utm_source=meta&utm_campaign=teste` → dispara
  `view_content`. Clique no WhatsApp → `whatsapp_click` com a UTM. Faça o quiz →
  `quiz_complete`. Confirme o pageview no **GA4 → Tempo real**.
- **Pixel:** `Meta Pixel Helper` deve mostrar **um** `PageView` por página (dois =
  base disparando duas vezes, revise o sequenciamento) e o evento correspondente.
- **Events Manager → Testar eventos:** cole a URL de teste com o código de teste e
  percorra home → detalhe → WhatsApp → quiz. Confere `PageView`, `ViewContent`,
  `Contact`, `Lead` chegando em tempo real, direto na fonte.
- Percorra o quiz **nas duas variantes** (home e `tratamentos-quiz.html`) e confirme
  que `quiz_variant` chega como `home` na primeira e `tratamentos-quiz` na segunda.

### 5.1 Verificação em produção — 2026-07-30

Feita com Chromium headless (Playwright) contra `https://www.draanapontes.com.br`,
após o container ser publicado.

**Confirmado no ar:**

| Item | Resultado |
|---|---|
| Container `GTM-5B27V5DF` | publicado e carregando |
| GA4 `G-KBQL7JZJ41` | `page_view`, `view_content`, `quiz_start`, `quiz_complete`, `whatsapp_click` — todos chegando |
| `view_content` com parâmetros | `procedure_slug=botox`, `procedure_name=Toxina Botulínica` ✓ |
| Tag `Meta Pixel — Base` | dispara: `fbevents.js` 200, `signals/config/4167985703499554` 200, pixel inicializado, `eventCount` incrementa no PageView |
| Erros de console | nenhum |

> A dúvida sobre o GA4 estar sem medição desde a remoção do `gtag.js` (`bf8c39a`)
> está **resolvida: o GA4 está medindo normalmente.**

**Não verificável por automação:** os beacons `POST/GET https://www.facebook.com/tr/`
não saem em navegador automatizado. O pixel aceita os eventos (`eventCount` sobe), mas
não os transmite. Causa provável: `navigator.webdriver === true` combinado com
`enableEventSuppression: true`, que vem na própria config do pixel — o fbevents.js se
recusa a transmitir de um contexto de automação.

Descartado como falso positivo do método: um beacon de controle disparado à mão
(`new Image().src = '...facebook.com/tr/?...'`) **foi** capturado, provando que o
caminho de rede e a instrumentação funcionam. A supressão é interna ao `fbevents.js`.

**Portanto a validação dos eventos do Meta tem de ser feita em navegador real** — ver
passo 5. Não há como fechar essa checagem por script.

---

## Antes de subir verba

Três pendências fora do setup de tags. As duas primeiras se resolvem no Meta Business
Manager e afetam diretamente a qualidade da medição; a terceira é código.

### 1. Verificar o domínio no Meta Business Manager

`draanapontes.com.br` precisa estar verificado, e os eventos priorizados
configurados em **Events Manager → Medição de eventos agregados** (limite de 8, em
ordem de prioridade). Sugestão de ordem: `Lead` → `Contact` → `ViewContent` →
`PageView`.

Isso **não é opcional neste projeto**: o público da Dra. Ana é majoritariamente
iPhone/Safari, exatamente onde a ATT e a Medição de Eventos Agregados do Meta atuam.
Sem domínio verificado, a atribuição de conversão pós-clique no iOS degrada muito.

### 2. Aceitar a limitação de atribuição no Safari/iOS

Ainda com tudo configurado, o ITP do Safari limita o cookie `_fbp` a **7 dias**. Numa
jornada de estética — em que a paciente pesquisa, pensa e só depois chama no WhatsApp
— parte das conversões vai cair fora da janela e o Meta vai **subnotificar**.

Consequência prática: o número do Gerenciador de Anúncios será menor que o real. O
**`whatsapp_click` no GA4 é a referência de volume**; o número do Meta serve para
otimizar o algoritmo, não para medir resultado absoluto. Não tente reconciliar os dois
— eles medem coisas diferentes. A correção de verdade seria a **Conversions API**, que
exige servidor: o site é estático no GitHub Pages, então hoje não há onde rodar.

### 3. Aviso de privacidade (LGPD)

O site **não tem página de política de privacidade** nem aviso de tratamento de dados.
Com pixel de remarketing instalado e verba rodando, isso passa a ser exposição real: a
LGPD exige base legal e transparência, e os próprios Termos das Ferramentas de
Negócios do Meta obrigam o anunciante a informar o visitante sobre a coleta.

Criar uma página simples de política de privacidade (com menção a GA4, Meta Pixel e
finalidade) e linkar no rodapé resolve. **Isso sim é trabalho no repositório** — é o
único item de código pendente do rastreamento, e não estava mapeado até agora.

## Otimização de campanha (lembrete de estratégia)

- Comece otimizando por **ViewContent / Landing Page Views** (evento frequente),
  não por "mensagens" — evita a campanha travar na fase de aprendizado com verba baixa.
- Migre para **Lead/Contact** conforme o volume de conversões cresce (~50/semana).
- Remarketing: público de quem disparou `view_content` mas **não** `whatsapp_click`.

## Atribuição do WhatsApp — nota

O link atual (`wa.me/message/CÓDIGO`) **não** carrega UTM até dentro do WhatsApp
(a plataforma descarta query params). A atribuição de qual campanha gerou a conversa
é feita **pelos eventos** (`whatsapp_click` + UTMs), visível no GA4/Meta — não dentro
do chat. Se um dia quiser ver a origem já na 1ª mensagem, dá para trocar por
`wa.me/NÚMERO?text=...` com uma tag na mensagem pré-preenchida.
