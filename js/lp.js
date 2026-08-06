/*
 * Interações das LPs de campanha (/lp/*) — Dra. Ana Pontes
 * ---------------------------------------------------------------------------
 * Sem dependências. Página isolada: não usa header, footer nem main.js do site.
 *
 * O que faz:
 *   1. Formulário de qualificação em passos (4 perguntas → contato) que, ao
 *      enviar, repassa o lead à Ponte site→CRM (worker/) por sendBeacon E leva
 *      a paciente ao WhatsApp com a mensagem já preenchida.
 *   2. Antes/depois: comparador (arrastar o divisor) dentro de um carrossel
 *      contínuo (mesmo motor autoScroll dos marquees do site). Em
 *      prefers-reduced-motion não rola e vira par de imagens lado a lado.
 *   3. Carrossel de depoimentos (.tstm) + contador (countup), idênticos ao
 *      "Quem já confiou" das páginas de procedimento (portados do main.js).
 *   4. Reveals no scroll + o traço de contorno que "se desenha".
 *
 * Eventos no dataLayer (mesmos nomes que o GTM já ouve — zero reconfiguração):
 *   quiz_start · qualify_select · quiz_complete · whatsapp_click
 *
 * REGRA (LGPD): a resposta de caso é dado de saúde. Ela vai ao CRM com
 * consentimento e vai ao WhatsApp da própria paciente — NUNCA como parâmetro
 * de pixel. Ver docs/rastreamento-gtm.md §4.5 e worker/README.md.
 */
(function () {
  "use strict";

  // Config por página: cada LP declara o próprio ângulo nos data-lp-* do <body>
  // (ver /lp/CLAUDE.md). Os padrões abaixo são os da LP de contorno, então uma
  // página sem os atributos continua funcionando como antes.
  var pageCfg = document.body ? document.body.dataset : {};
  var LP_CONFIG = {
    angulo: pageCfg.lpAngulo || "contorno",
    // Nome da página na mensagem do WhatsApp e nos eventos.
    pagina: pageCfg.lpPagina || "contorno labial",
    quizVariant: pageCfg.lpVariant || "lp-contorno",
    // Número no formato do wa.me (só dígitos, com DDI).
    whatsapp: "5583991353786",
    // Ponte site→CRM (worker/), publicada na Cloudflare. Grava o lead no CRM
    // ProgrameAI e dispara o Lead do Meta (CAPI) quando o META_CAPI_TOKEN
    // estiver no ar. Ver worker/README.md.
    leadEndpoint: "https://dap-lead-bridge.anapontes.workers.dev"
  };

  window.dataLayer = window.dataLayer || [];
  function push(obj) { try { window.dataLayer.push(obj); } catch (e) {} }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Ano do rodapé.
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---- Atribuição de campanha (a mesma que tracking.js persiste na sessão) ----
  var ATTR_KEYS = ["utm_source","utm_medium","utm_campaign","utm_content","utm_term","gclid","fbclid"];
  function readAttribution() {
    var out = {};
    try {
      var raw = sessionStorage.getItem("dap_attribution");
      if (raw) out = JSON.parse(raw) || {};
    } catch (e) {}
    // Fallback: lê direto da URL caso tracking.js não tenha rodado ainda.
    try {
      var p = new URLSearchParams(window.location.search);
      ATTR_KEYS.forEach(function (k) { if (!out[k] && p.get(k)) out[k] = p.get(k); });
    } catch (e) {}
    return out;
  }
  function readFbp() {
    var m = document.cookie.match(/(?:^|;\s*)_fbp=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  }
  function newEventId() {
    try { if (window.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
    return "lp-" + Date.now() + "-" + Math.floor(Math.random() * 1e9).toString(36);
  }

  function upperFirst(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  function buildWaHref(msg) {
    return "https://wa.me/" + LP_CONFIG.whatsapp + "?text=" + encodeURIComponent(msg);
  }

  // ================================================================
  // Formulário de qualificação
  // ================================================================
  // Inicializa UM quiz. Roda para cada [data-qualify-form] da página, então
  // as duas instâncias (a do hero e a da seção 9) funcionam de forma
  // independente: a visitante conclui as 4 perguntas e chega ao WhatsApp
  // sem sair do lugar, seja pelo de cima, seja pelo de baixo.
  function initQualify(form) {
    var stepEls = form.querySelectorAll("[data-qf-step]");
    var bar = form.querySelector("[data-qf-bar]");
    var backBtn = form.querySelector("[data-qf-back]");
    var submitBtn = form.querySelector("[data-qf-submit]");
    var doneEl = form.querySelector("[data-qf-done]");
    var openBtn = form.querySelector("[data-qf-open]");
    var formEl = form.querySelector("form");
    var TOTAL = stepEls.length; // 4
    var current = 1;
    var started = false;
    var startTime = Date.now();

    var answers = {};   // { caso, objetivo, prazo } → vão para o CRM e a mensagem

    function showStep(n) {
      current = Math.max(1, Math.min(n, TOTAL));
      stepEls.forEach(function (s) {
        s.classList.toggle("is-active", Number(s.getAttribute("data-qf-step")) === current);
      });
      if (bar) bar.style.transform = "scaleX(" + (current / TOTAL) + ")";
      if (backBtn) backBtn.hidden = current <= 1;
      // foca o primeiro elemento interativo do passo (acessibilidade)
      var active = form.querySelector('[data-qf-step="' + current + '"]');
      var focusable = active && active.querySelector("input, button.qf__opt");
      if (focusable && current > 1) { try { focusable.focus({ preventScroll: true }); } catch (e) {} }
    }

    // --- Perguntas de múltipla escolha (P1–P3) ---
    var groups = form.querySelectorAll("[data-qf-group]");
    groups.forEach(function (group) {
      var groupName = group.getAttribute("data-qf-group");
      var opts = group.querySelectorAll(".qf__opt");
      opts.forEach(function (opt) {
        opt.addEventListener("click", function () {
          opts.forEach(function (o) { o.classList.remove("is-selected"); o.setAttribute("aria-pressed", "false"); });
          opt.classList.add("is-selected");
          opt.setAttribute("aria-pressed", "true");
          answers[groupName] = opt.getAttribute("data-value");

          if (!started) {
            started = true;
            push({ event: "quiz_start", quiz_variant: LP_CONFIG.quizVariant });
          }
          // Micro-evento de qualificação (fica no GA4; fora do pixel de propósito).
          var qEv = {
            event: "qualify_select",
            quiz_variant: LP_CONFIG.quizVariant,
            qualify_group: groupName,
            qualify_value: opt.textContent.trim()
          };
          qEv["qualify_" + groupName] = opt.textContent.trim();
          push(qEv);

          // Avança sozinho após a escolha (leva ~1s no total).
          var delay = reduceMotion ? 0 : 180;
          setTimeout(function () { showStep(current + 1); }, delay);
        });
      });
    });

    if (backBtn) backBtn.addEventListener("click", function () { showStep(current - 1); });

    // --- Passo de contato (P4) ---
    var nomeInput = formEl.querySelector('[name="nome"]');
    var waInput = formEl.querySelector('[name="whatsapp"]');
    var consentInput = formEl.querySelector('[name="consentimento"]');
    var trapInput = formEl.querySelector('[name="assunto"]');

    function digits(s) { return String(s || "").replace(/\D/g, ""); }
    function validName() { return String(nomeInput.value).trim().length >= 2; }
    function validPhone() {
      var d = digits(waInput.value);
      if (d.slice(0, 2) === "55") d = d.slice(2);
      return d.length === 10 || d.length === 11;
    }
    function validConsent() { return consentInput.checked; }

    function setError(name, on) {
      var el = form.querySelector('[data-qf-error="' + name + '"]');
      var input = formEl.querySelector('[name="' + name + '"]');
      if (el) el.classList.toggle("is-shown", on);
      if (input) input.setAttribute("aria-invalid", on ? "true" : "false");
    }

    function refreshSubmit() {
      var ok = validName() && validPhone() && validConsent();
      submitBtn.disabled = !ok;
    }
    [nomeInput, waInput].forEach(function (el) {
      el.addEventListener("input", function () { setError(el.name, false); refreshSubmit(); });
      el.addEventListener("blur", function () {
        if (el === nomeInput) setError("nome", !validName());
        if (el === waInput) setError("whatsapp", !validPhone());
      });
    });
    consentInput.addEventListener("change", refreshSubmit);

    // --- Envio ---
    function qualifyMessage(nome) {
      var msg = "Olá, Dra. Ana! Vim pela página de " + LP_CONFIG.pagina + ".";
      if (answers.caso) msg += " " + upperFirst(answers.caso) + ".";
      if (answers.objetivo) msg += " " + upperFirst(answers.objetivo) + ".";
      if (answers.prazo) msg += " " + upperFirst(answers.prazo) + ".";
      if (nome) msg += " Meu nome é " + nome + ".";
      msg += " Gostaria de agendar minha avaliação.";
      return msg;
    }

    function sendLead(payload) {
      if (!LP_CONFIG.leadEndpoint) {
        // Worker ainda não publicado: segue sem gravar (nunca bloqueia a conversa).
        if (window.console) console.info("[lp] leadEndpoint vazio — lead não gravado no CRM (ver js/lp.js).");
        return;
      }
      try {
        var body = new Blob([JSON.stringify(payload)], { type: "text/plain;charset=UTF-8" });
        if (navigator.sendBeacon && navigator.sendBeacon(LP_CONFIG.leadEndpoint, body)) return;
      } catch (e) {}
      // Fallback quando sendBeacon falha/indisponível.
      try {
        fetch(LP_CONFIG.leadEndpoint, {
          method: "POST", keepalive: true,
          headers: { "content-type": "text/plain;charset=UTF-8" },
          body: JSON.stringify(payload)
        });
      } catch (e) {}
    }

    formEl.addEventListener("submit", function (e) {
      e.preventDefault();

      setError("nome", !validName());
      setError("whatsapp", !validPhone());
      refreshSubmit();
      if (!validName() || !validPhone() || !validConsent()) {
        var firstBad = !validName() ? nomeInput : (!validPhone() ? waInput : consentInput);
        try { firstBad.focus(); } catch (er) {}
        return;
      }

      var nome = String(nomeInput.value).trim();
      var eventId = newEventId();
      var attribution = readAttribution();
      var waMsg = qualifyMessage(nome);
      var waHref = buildWaHref(waMsg);

      // 1) Repassa o lead ao CRM (com a resposta de caso, sob consentimento).
      var payload = {
        nome: nome,
        whatsapp: waInput.value,
        consentimento: true,
        objetivo: answers.objetivo || "",
        caso: answers.caso || "",
        prazo: answers.prazo || "",
        pagina: window.location.href,
        event_id: eventId,
        fbp: readFbp(),
        assunto: trapInput ? trapInput.value : "",
        ms_no_form: Date.now() - startTime
      };
      ATTR_KEYS.forEach(function (k) { payload[k] = attribution[k] || ""; });
      sendLead(payload);

      // 2) Sinais de conversão do navegador (o Lead autoritativo vem do CRM/CAPI).
      push({
        event: "quiz_complete",
        quiz_variant: LP_CONFIG.quizVariant,
        quiz_caso: answers.caso || "",
        quiz_objetivo: answers.objetivo || "",
        quiz_prazo: answers.prazo || "",
        event_id: eventId
      });
      push({
        event: "whatsapp_click",
        content_type: "lp",
        procedure_slug: "lp-" + LP_CONFIG.angulo,
        procedure_name: "LP " + LP_CONFIG.pagina,
        link_url: waHref
      });

      // 3) Leva ao WhatsApp. Abre em nova aba (gesto do usuário → sem bloqueio);
      //    a LP fica atrás com a tela de sucesso e um botão de reforço.
      if (openBtn) openBtn.href = waHref;
      var win = window.open(waHref, "_blank");
      if (doneEl) {
        stepEls.forEach(function (s) { s.classList.remove("is-active"); });
        if (backBtn) backBtn.hidden = true;
        doneEl.hidden = false;
        if (bar) bar.style.transform = "scaleX(1)";
      }
      if (!win) { // popup bloqueado: navega na própria aba
        window.location.href = waHref;
      }
    });

    // --- Link de fuga (pula o quiz e vai direto ao WhatsApp) ---
    // Não bloqueia quem odeia formulário, mas o clique precisa ao menos contar
    // como conversão de WhatsApp (antes ele saía da página sem nenhum evento).
    var directLink = form.querySelector("[data-qf-direct]");
    if (directLink) {
      directLink.addEventListener("click", function () {
        push({
          event: "whatsapp_click",
          content_type: "lp",
          procedure_slug: "lp-" + LP_CONFIG.angulo,
          procedure_name: "LP " + LP_CONFIG.pagina,
          link_url: directLink.href,
          quiz_skipped: true
        });
      });
    }

    showStep(1);
  }

  // Liga o motor em cada quiz da página (hero + seção 9). Cada um é autônomo.
  var qualifyForms = document.querySelectorAll("[data-qualify-form]");
  Array.prototype.forEach.call(qualifyForms, initQualify);

  // ================================================================
  // CTA fixo no mobile
  // ----------------------------------------------------------------
  // Aparece depois que o hero sai da tela e some quando QUALQUER um dos
  // quizzes está à vista (o do topo #comecar ou o da seção 9), para nunca
  // cobrir o botão de enviar. Escondido no desktop pelo CSS.
  // ================================================================
  var stickyCta = document.querySelector("[data-sticky-cta]");
  if (stickyCta) {
    stickyCta.hidden = false; // deixa o CSS assumir o controle da visibilidade
    var heroCta = document.querySelector(".lp-hero__cta");
    var topQuizSec = document.getElementById("comecar");
    var qualifySec = document.getElementById("qualificacao");
    var watched = [heroCta, topQuizSec, qualifySec].filter(Boolean);
    if ("IntersectionObserver" in window && watched.length) {
      var zones = { hero: false, topQuiz: false, form: false };
      function syncSticky() {
        // Só aparece quando nenhum quiz e nem o CTA do hero estão na tela.
        stickyCta.classList.toggle("is-visible", !zones.hero && !zones.topQuiz && !zones.form);
      }
      var scio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.target === heroCta) zones.hero = entry.isIntersecting;
          if (entry.target === topQuizSec) zones.topQuiz = entry.isIntersecting;
          if (entry.target === qualifySec) zones.form = entry.isIntersecting;
        });
        syncSticky();
      }, { threshold: 0 });
      watched.forEach(function (el) { scio.observe(el); });
    } else {
      stickyCta.classList.add("is-visible");
    }
  }

  // ================================================================
  // Comparador antes/depois
  // ================================================================
  var baEls = document.querySelectorAll("[data-ba]");
  baEls.forEach(function (ba) {
    if (reduceMotion) { ba.classList.add("ba--static"); return; }
    var range = ba.querySelector(".ba__range");
    if (!range) return;
    function apply() { ba.style.setProperty("--pos", range.value + "%"); }
    range.addEventListener("input", apply);
    apply();
  });

  // ================================================================
  // Carrossel contínuo do antes/depois — mesmo motor dos marquees do
  // site (rola scrollLeft REAL, não transform: o WebKit/iOS rasteriza
  // conteúdo rolável de forma confiável). Pausa em hover/foco/toque e em
  // aba oculta; respeita prefers-reduced-motion. Portado do main.js.
  // ================================================================
  function autoScroll(scroller, getLoopDist, dir, speed) {
    var loopDist = getLoopDist();
    function norm(p) {
      if (loopDist <= 0) return 0;
      p = p % loopDist;
      return p < 0 ? p + loopDist : p;
    }
    var pos = dir < 0 ? loopDist : 0;
    scroller.scrollLeft = pos;
    pos = scroller.scrollLeft; // reata caso o navegador tenha limitado o scroll

    var paused = false, last = 0;
    function frame(t) {
      if (!last) last = t;
      var dt = (t - last) / 1000; last = t;
      if (dt > 0.1) dt = 0.1; // evita salto ao voltar de aba oculta
      if (!paused && loopDist > 0) {
        pos = norm(pos + dir * speed * dt);
        scroller.scrollLeft = pos;
      }
      window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);

    function pause() { paused = true; }
    function resume() { pos = norm(scroller.scrollLeft); last = 0; paused = false; }
    scroller.addEventListener("mouseenter", pause);
    scroller.addEventListener("mouseleave", resume);
    scroller.addEventListener("focusin", pause);
    scroller.addEventListener("focusout", resume);
    scroller.addEventListener("touchstart", pause, { passive: true });
    scroller.addEventListener("touchend", function () { setTimeout(resume, 1500); }, { passive: true });
    scroller.addEventListener("scroll", function () { if (paused) pos = scroller.scrollLeft; }, { passive: true });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) paused = true; else resume();
    });
    var rz;
    window.addEventListener("resize", function () {
      clearTimeout(rz);
      rz = setTimeout(function () {
        var ratio = loopDist > 0 ? pos / loopDist : 0;
        loopDist = getLoopDist();
        pos = norm(loopDist * ratio);
        scroller.scrollLeft = pos;
      }, 200);
    });
  }

  var baMarquee = document.querySelector("[data-ba-marquee]");
  if (baMarquee && !reduceMotion) {
    var baTrack = baMarquee.querySelector(".marquee__track");
    var baGroup = baTrack && baTrack.querySelector(".marquee__group");
    if (baGroup) {
      // Clona o grupo (aria-hidden) para fechar o loop, como o marquee de
      // tratamentos. Os clones são decorativos: sem foco por Tab e sem
      // reinit do comparador (removo o data-ba para o init não pegá-los).
      var baClone = baGroup.cloneNode(true);
      baClone.setAttribute("aria-hidden", "true");
      Array.prototype.forEach.call(baClone.querySelectorAll("[data-ba]"), function (el) { el.removeAttribute("data-ba"); });
      Array.prototype.forEach.call(baClone.querySelectorAll(".ba__range"), function (el) { el.setAttribute("tabindex", "-1"); });
      baTrack.appendChild(baClone);
      autoScroll(baMarquee, function () {
        var a = baTrack.children[0], b = baTrack.children[1];
        return (a && b) ? (b.offsetLeft - a.offsetLeft) : 0;
      }, 1, 40);
    }
  }

  // ================================================================
  // Contador que sobe (countup) — igual ao main.js do site
  // ================================================================
  var countEls = document.querySelectorAll("[data-countup]");
  if (countEls.length && "IntersectionObserver" in window && !reduceMotion) {
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        countIO.unobserve(el);
        var target = parseInt(el.getAttribute("data-countup"), 10);
        if (!target) return;
        var t0 = null;
        var DUR = 1200;
        function step(ts) {
          if (t0 === null) t0 = ts;
          var p = Math.min((ts - t0) / DUR, 1);
          var eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
          el.textContent = Math.round(eased * target);
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    countEls.forEach(function (el) { countIO.observe(el); });
  }

  // ================================================================
  // Carrossel de depoimentos — idêntico ao "Quem já confiou" das
  // páginas de procedimento (portado do main.js). Um por vez, autoplay
  // suave com pausa em hover/foco, dots, setas e swipe; respeita
  // prefers-reduced-motion.
  // ================================================================
  var tstm = document.querySelector("[data-tstm]");
  if (tstm) {
    var tSlides = tstm.querySelectorAll(".tstm__slide");
    var tDotsWrap = tstm.querySelector("[data-tstm-dots]");
    var tPrev = tstm.querySelector("[data-tstm-prev]");
    var tNext = tstm.querySelector("[data-tstm-next]");
    var tIdx = 0;
    var tTimer = null;
    var tReduce = reduceMotion;
    var tDots = [];

    tSlides.forEach(function (_, i) {
      var d = document.createElement("button");
      d.type = "button";
      d.className = "tstm__dot";
      d.setAttribute("aria-label", "Depoimento " + (i + 1) + " de " + tSlides.length);
      d.addEventListener("click", function () { tGo(i, true); });
      if (tDotsWrap) tDotsWrap.appendChild(d);
      tDots.push(d);
    });

    function tGo(i, user) {
      tIdx = (i + tSlides.length) % tSlides.length;
      tSlides.forEach(function (s, j) {
        s.classList.toggle("is-active", j === tIdx);
        s.setAttribute("aria-hidden", j === tIdx ? "false" : "true");
      });
      tDots.forEach(function (d, j) {
        d.classList.toggle("is-active", j === tIdx);
        if (j === tIdx) d.setAttribute("aria-current", "true");
        else d.removeAttribute("aria-current");
      });
      if (user) tRestart();
    }

    function tRestart() {
      if (tTimer) clearInterval(tTimer);
      if (!tReduce) tTimer = setInterval(function () { tGo(tIdx + 1); }, 7000);
    }
    function tPause() { if (tTimer) clearInterval(tTimer); }

    if (tPrev) tPrev.addEventListener("click", function () { tGo(tIdx - 1, true); });
    if (tNext) tNext.addEventListener("click", function () { tGo(tIdx + 1, true); });
    tstm.addEventListener("mouseenter", tPause);
    tstm.addEventListener("mouseleave", tRestart);
    tstm.addEventListener("focusin", tPause);
    tstm.addEventListener("focusout", tRestart);

    // swipe (mobile)
    var tX = null;
    tstm.addEventListener("touchstart", function (e) { tX = e.touches[0].clientX; tPause(); }, { passive: true });
    tstm.addEventListener("touchend", function (e) {
      if (tX === null) return;
      var dx = e.changedTouches[0].clientX - tX;
      if (Math.abs(dx) > 40) tGo(tIdx + (dx < 0 ? 1 : -1), true);
      tX = null;
      tRestart();
    }, { passive: true });

    tGo(0);
    tRestart();
  }

  // ================================================================
  // Reveals + traço de contorno que se desenha
  // ================================================================
  var revealEls = document.querySelectorAll("[data-reveal], [data-reveal-group]");
  // Assinatura visual de cada LP: o traço de contorno numa, a régua na outra.
  var drawEls = document.querySelectorAll(".contour--draw, .scale--draw");
  if ("IntersectionObserver" in window && !reduceMotion) {
    document.documentElement.classList.add("has-anim");

    function reveal(el) {
      if (el.classList.contains("in-view")) return;
      if (el.hasAttribute("data-reveal-group")) {
        Array.prototype.forEach.call(el.children, function (child, i) {
          child.style.transitionDelay = (i * 90) + "ms";
        });
      }
      el.classList.add("in-view");
    }

    // threshold 0 + margem generosa: qualquer pixel que entra já dispara.
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: "0px 0px -10% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });

    // Rede de segurança: numa LP paga, conteúdo NUNCA pode ficar invisível.
    // O que o observer não pegou (aba oculta, scroll estranho) aparece assim
    // mesmo, sem animação. Melhor visível sem transição do que invisível.
    setTimeout(function () { revealEls.forEach(reveal); }, 2600);

    // O traço do herói está acima da dobra: dispara já, sem esperar o scroll.
    drawEls.forEach(function (el) {
      // reinicia a animação agora que .has-anim existe
      el.classList.remove("in-view");
      requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add("in-view"); }); });
    });
  } else {
    // Sem IO ou com movimento reduzido: tudo visível, traço sólido.
    revealEls.forEach(function (el) { el.classList.add("in-view"); });
    drawEls.forEach(function (el) { el.classList.add("in-view"); });
  }
})();
