/*
 * Interações do site — Dra. Ana Pontes (sem dependências)
 * Menu mobile · FAQ accordion · botão voltar-ao-topo · ano do rodapé
 */
(function () {
  "use strict";

  // --- Menu mobile ---
  var toggle = document.querySelector(".nav__toggle");
  var menu = document.getElementById("nav-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // fecha ao clicar num link
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // --- FAQ accordion ---
  var questions = document.querySelectorAll(".faq__q");
  questions.forEach(function (q) {
    q.addEventListener("click", function () {
      var expanded = q.getAttribute("aria-expanded") === "true";
      var answer = q.nextElementSibling;
      // fecha os demais (accordion de item único aberto)
      questions.forEach(function (other) {
        if (other !== q) {
          other.setAttribute("aria-expanded", "false");
          if (other.nextElementSibling) other.nextElementSibling.style.maxHeight = null;
        }
      });
      if (expanded) {
        q.setAttribute("aria-expanded", "false");
        answer.style.maxHeight = null;
      } else {
        q.setAttribute("aria-expanded", "true");
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });

  // --- Voltar ao topo ---
  var toTop = document.querySelector(".to-top");
  if (toTop) {
    var onScroll = function () {
      if (window.scrollY > 600) toTop.classList.add("is-visible");
      else toTop.classList.remove("is-visible");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // --- Ano do rodapé ---
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ----------------------------------------------------------------
  // WhatsApp com mensagem pré-preenchida (qualificação do lead)
  // ----------------------------------------------------------------
  // Reescreve TODO link de WhatsApp para o formato wa.me/<numero>?text=...
  // com uma mensagem contextual: nas páginas de procedimento a mensagem já
  // cita o tratamento, então a Dra. recebe o lead sabendo o interesse.
  var WA_PHONE = "5583991353786";
  var WA_DEFAULT =
    "Olá, Dra. Ana! Vim pelo site e gostaria de agendar uma avaliação individual.";

  var WA_PROCEDURES = {
    "botox": "Toxina Botulínica (Botox)",
    "preenchimento-facial": "Preenchimento Facial",
    "radiesse": "Radiesse (bioestimulador)",
    "pdrn-injetavel": "PDRN Injetável",
    "pdrn-mesoject": "PDRN Mesoject",
    "lavieen-pdrn": "Lavieen + PDRN (Glow Repair)",
    "ultrassom-microfocado": "Ultrassom Microfocado",
    "harmonizacao-glutea": "Harmonização Glútea",
    "culote": "tratamento de Culote",
    "fios-de-tracao": "Fios de Tração",
    "fios-lisos": "Fios PDO Lisos"
  };

  function pageProcedure() {
    var m = window.location.pathname.match(/\/detalhes\/([^\/.]+)\.html/);
    return m && WA_PROCEDURES[m[1]] ? { slug: m[1], name: WA_PROCEDURES[m[1]] } : null;
  }

  function pageWaMessage() {
    var proc = pageProcedure();
    if (proc) {
      return "Olá, Dra. Ana! Vim pela página de " + proc.name +
        " no site e gostaria de agendar uma avaliação individual.";
    }
    return WA_DEFAULT;
  }

  function buildWaHref(msg) {
    return "https://wa.me/" + WA_PHONE + "?text=" + encodeURIComponent(msg || WA_DEFAULT);
  }

  var pageMsg = pageWaMessage();
  var waLinks = document.querySelectorAll(
    'a[href*="wa.me"], a[href*="api.whatsapp.com"], a[href*="whatsapp.com/send"]'
  );
  waLinks.forEach(function (a) {
    // o botão final do quiz é montado dinamicamente pela lógica do quiz
    if (a.hasAttribute("data-quiz-send")) return;
    var msg = a.getAttribute("data-wa-msg") || pageMsg;
    a.href = buildWaHref(msg);
  });

  // ----------------------------------------------------------------
  // Micro-qualificação nas páginas de procedimento — o visitante conta
  // quando pretende começar e a mensagem do WhatsApp chega enriquecida
  // (procedimento + prazo), sem sair da página.
  // ----------------------------------------------------------------
  var qualifyBand = document.querySelector("[data-qualify]");
  if (qualifyBand) {
    var qualifySend = qualifyBand.querySelector("[data-qualify-send]");
    var qualifyOpts = qualifyBand.querySelectorAll(".qualify__opt");
    var qualifyProc = pageProcedure();

    qualifyOpts.forEach(function (opt) {
      opt.addEventListener("click", function () {
        qualifyOpts.forEach(function (o) { o.classList.remove("is-selected"); });
        opt.classList.add("is-selected");
        var part = opt.getAttribute("data-value");
        var msg = "Olá, Dra. Ana! Vim pela página de " +
          (qualifyProc ? qualifyProc.name : "tratamentos") + " no site, " + part +
          " e gostaria de agendar uma avaliação individual.";
        if (qualifySend) qualifySend.href = buildWaHref(msg);
        if (window.dataLayer) {
          window.dataLayer.push({
            event: "qualify_select",
            qualify_prazo: opt.textContent.trim(),
            procedure_slug: qualifyProc ? qualifyProc.slug : ""
          });
        }
      });
    });
  }

  // ----------------------------------------------------------------
  // Reveals no scroll + count-up — só ativam com JS e IO disponíveis;
  // sem JS (ou com prefers-reduced-motion) todo o conteúdo fica visível.
  // ----------------------------------------------------------------
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = document.querySelectorAll("[data-reveal], [data-reveal-group]");
  if (revealEls.length && "IntersectionObserver" in window && !reduceMotion) {
    document.documentElement.classList.add("has-anim");
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        if (el.hasAttribute("data-reveal-group")) {
          Array.prototype.forEach.call(el.children, function (child, i) {
            child.style.transitionDelay = (i * 90) + "ms";
          });
        }
        el.classList.add("in-view");
        revealIO.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { revealIO.observe(el); });
  }

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

  // ----------------------------------------------------------------
  // Carrossel de depoimentos — um por vez, autoplay suave com pausa
  // em hover/foco, dots, setas e swipe; respeita prefers-reduced-motion.
  // ----------------------------------------------------------------
  var tstm = document.querySelector("[data-tstm]");
  if (tstm) {
    var tSlides = tstm.querySelectorAll(".tstm__slide");
    var tDotsWrap = tstm.querySelector("[data-tstm-dots]");
    var tPrev = tstm.querySelector("[data-tstm-prev]");
    var tNext = tstm.querySelector("[data-tstm-next]");
    var tIdx = 0;
    var tTimer = null;
    var tReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

  // ----------------------------------------------------------------
  // Quiz de qualificação — monta a mensagem do WhatsApp com o perfil
  // ----------------------------------------------------------------
  var quiz = document.querySelector("[data-quiz]");
  if (quiz) {
    var steps = quiz.querySelectorAll(".quiz__step");
    var bar = quiz.querySelector("[data-quiz-bar]");
    var backBtn = quiz.querySelector("[data-quiz-back]");
    var sendLink = quiz.querySelector("[data-quiz-send]");
    var summaryEl = quiz.querySelector("[data-quiz-summary]");
    var restartBtn = quiz.querySelector("[data-quiz-restart]");
    var answers = {};
    var TOTAL = 3;
    var current = 1;
    var started = false;

    function showStep(step) {
      steps.forEach(function (s) {
        s.classList.toggle("is-active", Number(s.getAttribute("data-step")) === step);
      });
      current = step;
      if (bar) bar.style.width = (Math.min((step - 1) / TOTAL, 1) * 100) + "%";
      if (backBtn) backBtn.hidden = step <= 1 || step > TOTAL;
    }

    function finish() {
      var msg = "Olá, Dra. Ana! Vim pelo site. Meu principal objetivo é " +
        answers.objetivo + ", na região " + answers.regiao +
        ", e pretendo começar " + answers.prazo +
        ". Gostaria de agendar uma avaliação individual.";
      if (summaryEl) {
        summaryEl.textContent = "Objetivo: " + answers.objetivo +
          "  ·  Região: " + answers.regiao + "  ·  Início: " + answers.prazo;
      }
      if (sendLink) sendLink.href = buildWaHref(msg);
      if (window.dataLayer) {
        window.dataLayer.push({
          event: "quiz_complete",
          quiz_objetivo: answers.objetivo,
          quiz_regiao: answers.regiao,
          quiz_prazo: answers.prazo
        });
      }
      showStep(TOTAL + 1);
      if (bar) bar.style.width = "100%";
    }

    quiz.querySelectorAll(".quiz__opt").forEach(function (opt) {
      opt.addEventListener("click", function () {
        var field = opt.getAttribute("data-field");
        answers[field] = opt.getAttribute("data-value");
        var group = opt.closest(".quiz__options");
        if (group) {
          group.querySelectorAll(".quiz__opt").forEach(function (o) {
            o.classList.remove("is-selected");
          });
        }
        opt.classList.add("is-selected");
        if (!started) {
          started = true;
          if (window.dataLayer) window.dataLayer.push({ event: "quiz_start" });
        }
        if (current < TOTAL) showStep(current + 1);
        else finish();
      });
    });

    if (backBtn) {
      backBtn.addEventListener("click", function () {
        if (current > 1) showStep(current - 1);
      });
    }
    if (restartBtn) {
      restartBtn.addEventListener("click", function () {
        answers = {};
        started = false;
        quiz.querySelectorAll(".quiz__opt").forEach(function (o) {
          o.classList.remove("is-selected");
        });
        showStep(1);
      });
    }

    showStep(1);
  }
})();
