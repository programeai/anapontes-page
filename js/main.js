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
          // devolve as transições de hover dos filhos após o reveal
          setTimeout(function () {
            Array.prototype.forEach.call(el.children, function (child) {
              child.style.transitionDelay = "";
            });
            el.classList.add("reveal-done");
          }, el.children.length * 90 + 700);
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
  // Quiz de recomendação (tratamentos-quiz) — objetivo + prazo →
  // recomenda os tratamentos que melhor se encaixam e monta a
  // mensagem de WhatsApp já qualificada.
  // ----------------------------------------------------------------
  var recoQuiz = document.querySelector("[data-quiz-reco]");
  if (recoQuiz) {
    var RECO_TREATMENTS = {
      "botox": { name: "Botox®", img: "/assets/dW22U9uHPjKc5fsxnSc4lH6t4.webp", blurb: "Suaviza rugas de expressão e previne novas linhas, preservando a naturalidade." },
      "preenchimento-facial": { name: "Preenchimento Facial", img: "/assets/bzyVP31HieeS10KXo4IWdchPOk.webp", blurb: "Restaura volume, suaviza rugas e melhora contornos com efeito natural." },
      "radiesse": { name: "Radiesse®", img: "/assets/Js3HXjggO2qljwDprcZd6s2mYY.webp", blurb: "Estimula colágeno, melhora firmeza e qualidade da pele com efeito gradual." },
      "ultrassom-microfocado": { name: "Ultrassom Microfocado", img: "/assets/stM4cjrGLCfiynBeoCV36BoTA.webp", blurb: "Lifting não cirúrgico que trata a flacidez nas camadas profundas." },
      "fios-de-tracao": { name: "Fios de Tração", img: "/assets/Wu8I1GxBZcWATLMlfJChKNv968.webp", blurb: "Efeito lifting com reposicionamento dos tecidos, sem cirurgia." },
      "fios-lisos": { name: "Fios PDO Lisos", img: "/assets/otE3FZZV1upj51ZCIX8EW2xyzc.webp", blurb: "Fios PDO que estimulam colágeno e melhoram a firmeza da pele." },
      "pdrn-injetavel": { name: "PDRN Injetável", img: "/assets/KmKoqLIoP9VWc7ypQAsjKlfgc.webp", blurb: "Regeneração celular que melhora hidratação, firmeza e qualidade da pele." },
      "pdrn-mesoject": { name: "PDRN Mesoject", img: "/assets/VupnLanKE9nf0216TtpzZwVqRa8.webp", blurb: "Regeneração celular sem agulhas, com máximo conforto." },
      "lavieen-pdrn": { name: "Lavieen + PDRN", img: "/assets/KvtSNI4Ewfp8A44w3JC24kqH4Y.webp", blurb: "Protocolo Glow Repair: laser Lavieen + PDRN para viço e textura da pele." },
      "culote": { name: "Culote", img: "/assets/na1B0GxqftU7Y00SZgK1AU8I.webp", blurb: "Injetáveis que ajudam a reduzir medidas e melhorar o contorno corporal." },
      "harmonizacao-glutea": { name: "Harmonização Glútea", img: "/assets/vX9TpIzfqH1h451GI43uuFH1aSA.webp", blurb: "Volume, firmeza e contorno para os glúteos, sem cirurgia." }
    };
    var RECO_MAP = {
      "rugas": ["botox", "preenchimento-facial"],
      "flacidez": ["radiesse", "ultrassom-microfocado", "fios-de-tracao", "fios-lisos"],
      "volume": ["preenchimento-facial", "radiesse"],
      "pele": ["pdrn-injetavel", "pdrn-mesoject", "lavieen-pdrn"],
      "corporal": ["culote", "harmonizacao-glutea"],
      "orientacao": []
    };
    var RECO_SECTIONS = {
      "rugas": { eyebrow: "Objetivo · Rosto", title: "Para rugas e linhas de expressão", desc: "Linhas que marcam a testa, a região dos olhos ou o contorno da boca — para o seu objetivo, a Dra. Ana costuma avaliar estes caminhos, sempre preservando as suas expressões." },
      "flacidez": { eyebrow: "Objetivo · Rosto e pescoço", title: "Para flacidez e firmeza", desc: "Quando a pele começa a ceder e o contorno perde definição — para o seu objetivo, a Dra. Ana costuma avaliar estas tecnologias que estimulam o seu próprio colágeno." },
      "volume": { eyebrow: "Objetivo · Rosto", title: "Para volume e contorno do rosto", desc: "Áreas que \"afundaram\", maçãs do rosto e linha da mandíbula — para o seu objetivo, a Dra. Ana costuma avaliar estes caminhos de reposição com naturalidade." },
      "pele": { eyebrow: "Objetivo · Pele", title: "Para qualidade e viço da pele", desc: "Viço, textura, manchas e hidratação profunda — para o seu objetivo, a Dra. Ana costuma avaliar estes tratamentos regenerativos." },
      "corporal": { eyebrow: "Objetivo · Corpo", title: "Para contorno corporal", desc: "Gordura localizada que resiste a dieta e treino — para o seu objetivo, a Dra. Ana costuma avaliar estes caminhos, sem cirurgia." },
      "orientacao": { eyebrow: "Avaliação individual", title: "A Dra. Ana te orienta no melhor caminho", desc: "Cada rosto e cada história pedem um plano próprio. Na avaliação individual, a Dra. Ana entende o que te incomoda e monta o caminho certo para o seu caso — sem pressa e sem compromisso." }
    };

    var rSteps = recoQuiz.querySelectorAll(".quiz__step");
    var rBar = recoQuiz.querySelector("[data-quiz-bar]");
    var rBack = recoQuiz.querySelector("[data-quiz-back]");
    var rRestart = recoQuiz.querySelector("[data-quiz-restart]");
    var rResult = document.querySelector("[data-reco-result]");
    var rEyebrow = document.querySelector("[data-reco-eyebrow]");
    var rH2 = document.querySelector("[data-reco-h2]");
    var rDesc = document.querySelector("[data-reco-desc]");
    var rGrid = document.querySelector("[data-reco-grid]");
    var rSend = document.querySelector("[data-reco-send]");
    var rAnswers = {};
    var R_TOTAL = 2;
    var rCurrent = 1;
    var rStarted = false;

    function rShowStep(step) {
      rSteps.forEach(function (s) {
        s.classList.toggle("is-active", Number(s.getAttribute("data-step")) === step);
      });
      rCurrent = step;
      if (rBar) rBar.style.width = (Math.min((step - 1) / R_TOTAL, 1) * 100) + "%";
      if (rBack) rBack.hidden = step <= 1 || step > R_TOTAL;
    }

    function rTreatmentCard(slug) {
      var t = RECO_TREATMENTS[slug];
      if (!t) return null;
      var a = document.createElement("a");
      a.className = "card treatment";
      a.href = "/detalhes/" + slug + ".html";
      a.innerHTML =
        '<img src="' + t.img + '" loading="lazy" width="400" height="300" alt="' + t.name + ' em João Pessoa com a Dra. Ana Pontes.">' +
        '<div class="treatment__body"><h3>' + t.name + "</h3><p>" + t.blurb + "</p>" +
        '<span class="treatment__more">Saiba mais →</span></div>';
      return a;
    }

    function rFinish() {
      var key = rAnswers.recoKey;
      var slugs = RECO_MAP[key] || [];
      var section = RECO_SECTIONS[key];
      if (rResult && section) {
        if (rEyebrow) rEyebrow.textContent = section.eyebrow;
        if (rH2) rH2.textContent = section.title;
        if (rDesc) rDesc.textContent = section.desc;
        if (rGrid) {
          rGrid.innerHTML = "";
          slugs.forEach(function (slug) {
            var card = rTreatmentCard(slug);
            if (card) rGrid.appendChild(card);
          });
          rGrid.hidden = slugs.length === 0;
        }
        rResult.hidden = false;
      }
      var msg = "Olá, Dra. Ana! Vim pela página de tratamentos. Meu objetivo é " +
        rAnswers.objetivo + ", pretendo começar " + rAnswers.prazo +
        " e gostaria de agendar uma avaliação individual.";
      if (rSend) rSend.href = buildWaHref(msg);
      if (window.dataLayer) {
        window.dataLayer.push({
          event: "quiz_complete",
          quiz_variant: "tratamentos-quiz",
          quiz_objetivo: rAnswers.objetivo,
          quiz_prazo: rAnswers.prazo
        });
      }
      rShowStep(R_TOTAL + 1);
      if (rBar) rBar.style.width = "100%";
      if (rResult) {
        var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        rResult.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      }
    }

    recoQuiz.querySelectorAll(".quiz__opt").forEach(function (opt) {
      opt.addEventListener("click", function () {
        var field = opt.getAttribute("data-field");
        rAnswers[field] = opt.getAttribute("data-value");
        if (field === "objetivo") rAnswers.recoKey = opt.getAttribute("data-reco");
        var group = opt.closest(".quiz__options");
        if (group) {
          group.querySelectorAll(".quiz__opt").forEach(function (o) { o.classList.remove("is-selected"); });
        }
        opt.classList.add("is-selected");
        if (!rStarted) {
          rStarted = true;
          if (window.dataLayer) window.dataLayer.push({ event: "quiz_start", quiz_variant: "tratamentos-quiz" });
        }
        if (rCurrent < R_TOTAL) rShowStep(rCurrent + 1);
        else rFinish();
      });
    });

    if (rBack) rBack.addEventListener("click", function () { if (rCurrent > 1) rShowStep(rCurrent - 1); });
    if (rRestart) {
      rRestart.addEventListener("click", function () {
        rAnswers = {};
        rStarted = false;
        recoQuiz.querySelectorAll(".quiz__opt").forEach(function (o) { o.classList.remove("is-selected"); });
        if (rResult) rResult.hidden = true;
        rShowStep(1);
      });
    }

    rShowStep(1);
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
