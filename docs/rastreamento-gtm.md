# Rastreamento & Conversão — Guia de Configuração

Este site já está **instrumentado no código** e o container GTM
(**`GTM-5B27V5DF`**) já está instalado em todas as páginas. Falta apenas
**mapear as tags dentro do painel do GTM** (GA4 + Meta Pixel + os acionadores
dos eventos). Nenhuma mudança adicional de código é necessária.

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

### 4. Meta Pixel
- **Base:** Tag **Google tag template / HTML customizado** com o `fbq` base do seu
  Pixel ID; acionador **All Pages**.
- **Eventos:** tag Meta Pixel para `whatsapp_click` → evento `Contact` (ou `Lead`);
  `view_content` → `ViewContent`. Usa os mesmos acionadores/variáveis.

### 5. Verificar
- **Preview** do GTM + **Tag Assistant** (GA4) e **Meta Pixel Helper** (Pixel).
- Abra `/detalhes/botox.html?utm_source=meta&utm_campaign=teste` → dispara
  `view_content`. Clique no WhatsApp → `whatsapp_click` com a UTM. Faça o quiz →
  `quiz_complete`. Confirme o pageview no **GA4 → Tempo real**.

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
