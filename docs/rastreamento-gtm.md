# Rastreamento & Conversão — Guia de Configuração

Este site já está **instrumentado no código** e o container GTM
(**`GTM-5B27V5DF`**) já está instalado em todas as páginas. Falta apenas
**mapear as tags dentro do painel do GTM** (GA4 + Meta Pixel + os acionadores
dos eventos). Nenhuma mudança adicional de código é necessária.

## O que já está no código

- **Container GTM** injetado em todas as páginas (`index.html` + `detalhes/*.html`),
  no `<head>` e como `<noscript>` logo após `<body>`.
- **GA4** (`G-KBQL7JZJ41`) já existente, mantido como estava (pageview automático).
- **`/js/tracking.js`** dispara eventos no `dataLayer` para o GTM consumir:

| Evento (`event`)  | Quando dispara                            | Parâmetros úteis |
|-------------------|-------------------------------------------|------------------|
| `view_content`    | Ao abrir uma página `/detalhes/*.html`    | `procedure_slug`, `procedure_name`, `utm_*`, `gclid`, `fbclid` |
| `whatsapp_click`  | Ao clicar em qualquer botão de WhatsApp   | `procedure_slug`, `procedure_name`, `link_url`, `utm_*`, `gclid`, `fbclid` |

> As UTMs da campanha são capturadas da URL da landing e **persistem na sessão**,
> então aparecem no `whatsapp_click` mesmo que o clique aconteça páginas depois.

## Passo a passo (uma vez só)

### 1. Criar o container GTM ✅ FEITO
Container **`GTM-5B27V5DF`** criado e já instalado no código de todas as páginas
(`<head>` + `<noscript>`). Nada a fazer aqui.

### 2. Meta Pixel — base
No GTM: **Tags → Nova → Meta Pixel** (via template da comunidade "Facebook Pixel"
ou HTML customizado com o `fbq` base). Acionador: **All Pages**. Use o seu Pixel ID.

### 3. Triggers (acionadores) sobre os eventos do dataLayer
Crie dois acionadores do tipo **Evento personalizado**:
- Nome do evento: `view_content`
- Nome do evento: `whatsapp_click`

### 4. Tags de conversão

| Tag                 | Tipo            | Acionador        | Observação |
|---------------------|-----------------|------------------|------------|
| Pixel — ViewContent | Meta Pixel evt  | `view_content`   | `content_name` = `{{dlv - procedure_name}}` |
| Pixel — Contact     | Meta Pixel evt  | `whatsapp_click` | Evento `Contact` (ou `Lead`) |
| GA4 — view_content  | GA4 Event       | `view_content`   | Envia p/ `G-KBQL7JZJ41` |
| GA4 — generate_lead | GA4 Event       | `whatsapp_click` | Envia p/ `G-KBQL7JZJ41` |

> Crie **variáveis de camada de dados** (dlv) para `procedure_name`,
> `procedure_slug`, `utm_source`, `utm_campaign` e use-as como parâmetros das tags.

### 5. Verificar
- Use o **Preview** do GTM + a extensão **Meta Pixel Helper**.
- Abra `/detalhes/botox.html?utm_source=meta&utm_campaign=teste` → deve disparar
  `view_content`. Clique no WhatsApp → deve disparar `whatsapp_click` com a UTM.

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
