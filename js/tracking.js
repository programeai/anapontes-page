/*
 * Rastreamento de conversão — Dra. Ana Pontes
 * ------------------------------------------------------------------
 * Dispara eventos no dataLayer para o GTM roteá-los ao Meta Pixel e ao GA4:
 *   - view_content    : ao abrir uma página de procedimento (/detalhes/*.html)
 *                       ou uma LP de dor (/objetivos/*.html)
 *   - whatsapp_click  : ao clicar em qualquer botão/link que leve ao WhatsApp
 *
 * O campo content_type distingue "procedure" de "objective", para que o funil
 * de campanha paga não se misture com o funil de busca por procedimento.
 *
 * Também captura os parâmetros de campanha (utm_*, gclid, fbclid) da landing
 * e os anexa aos eventos, permitindo saber qual campanha gerou cada conversa.
 * A atribuição é persistida na sessão, então sobrevive à navegação entre páginas.
 */
(function () {
  "use strict";
  window.dataLayer = window.dataLayer || [];

  var ATTR_KEYS = [
    "utm_source", "utm_medium", "utm_campaign",
    "utm_content", "utm_term", "gclid", "fbclid"
  ];

  // 1) Captura e persiste a atribuição de campanha durante a sessão.
  function captureAttribution() {
    var stored = {};
    try {
      var params = new URLSearchParams(window.location.search);
      var found = {};
      var has = false;
      ATTR_KEYS.forEach(function (k) {
        var v = params.get(k);
        if (v) { found[k] = v; has = true; }
      });
      if (has) {
        sessionStorage.setItem("dap_attribution", JSON.stringify(found));
      }
      var raw = sessionStorage.getItem("dap_attribution");
      if (raw) { stored = JSON.parse(raw); }
    } catch (e) { /* sessionStorage indisponível — segue sem atribuição */ }
    return stored;
  }

  var attribution = captureAttribution();

  // Mapa slug -> nome legível do procedimento (usado nos eventos).
  var PROCEDURES = {
    "botox": "Toxina Botulínica",
    "preenchimento-facial": "Preenchimento Facial",
    "radiesse": "Radiesse (Bioestimulador)",
    "pdrn-injetavel": "PDRN Injetável",
    "pdrn-mesoject": "PDRN Mesoject",
    "lavieen-pdrn": "Lavieen PDRN",
    "ultrassom-microfocado": "Ultrassom Microfocado",
    "harmonizacao-glutea": "Harmonização Glútea",
    "culote": "Culote",
    "fios-de-tracao": "Fios de Tração",
    "fios-lisos": "Fios Lisos"
  };

  // Mapa slug -> nome legível das LPs de dor em /objetivos/. Elas usam um
  // content_type próprio ("objective") para que o funil de campanha possa ser
  // lido separado do funil de procedimento no GA4 e no Meta.
  var OBJECTIVES = {
    "nariz-sem-cirurgia": "Rinomodelação (nariz sem cirurgia)"
  };

  function currentProcedure() {
    var path = window.location.pathname;
    var m = path.match(/\/detalhes\/([^\/.]+)\.html/);
    if (m) {
      return { slug: m[1], name: PROCEDURES[m[1]] || m[1], type: "procedure" };
    }
    m = path.match(/\/objetivos\/([^\/.]+)\.html/);
    if (m) {
      return { slug: m[1], name: OBJECTIVES[m[1]] || m[1], type: "objective" };
    }
    return null;
  }

  var proc = currentProcedure();

  function withAttribution(obj) {
    for (var k in attribution) {
      if (Object.prototype.hasOwnProperty.call(attribution, k)) {
        obj[k] = attribution[k];
      }
    }
    return obj;
  }

  // 2) ViewContent — nas páginas de procedimento e nas LPs de dor.
  if (proc) {
    window.dataLayer.push(withAttribution({
      event: "view_content",
      content_type: proc.type,
      procedure_slug: proc.slug,
      procedure_name: proc.name
    }));
  }

  // 3) Contact/Lead — ao clicar em qualquer link de WhatsApp.
  // Usa event delegation no document (fase de captura): o site é gerado pelo
  // Framer, que re-renderiza (hidrata) os nós do DOM após o carregamento —
  // listeners presos a nós individuais se perderiam. A delegação sobrevive a
  // qualquer troca de nós e cobre botões adicionados dinamicamente.
  var WA_SELECTOR =
    'a[href*="wa.me"], a[href*="api.whatsapp.com"], a[href*="whatsapp.com/send"]';

  document.addEventListener("click", function (e) {
    var el = e.target;
    if (el && el.nodeType === 3) { el = el.parentElement; } // nó de texto -> elemento
    if (!el || !el.closest) { return; }
    var link = el.closest(WA_SELECTOR);
    if (!link) { return; }
    window.dataLayer.push(withAttribution({
      event: "whatsapp_click",
      content_type: proc ? proc.type : "home",
      procedure_slug: proc ? proc.slug : "home",
      procedure_name: proc ? proc.name : "Home",
      link_url: link.href
    }));
  }, true);
})();
