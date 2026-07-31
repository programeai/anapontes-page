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
    function closeMenu() {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // fecha ao clicar num link
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        closeMenu();
      }
    });
    // fecha ao clicar fora do menu ou do botão
    document.addEventListener("click", function (e) {
      if (!menu.classList.contains("is-open")) return;
      if (menu.contains(e.target) || toggle.contains(e.target)) return;
      closeMenu();
    });
    // fecha ao pressionar Esc
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) {
        closeMenu();
        toggle.focus();
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

  // --- CTA flutuante: na home, só aparece depois que o hero sai de cena ---
  var waFloat = document.querySelector(".dap-wa-float");
  var heroHome = document.querySelector(".hero");
  if (waFloat && heroHome) {
    var waToggle = function () {
      var limit = heroHome.offsetTop + heroHome.offsetHeight - 120;
      waFloat.classList.toggle("is-hidden", window.scrollY < limit);
    };
    window.addEventListener("scroll", waToggle, { passive: true });
    waToggle();
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

  // LPs de dor em /objetivos/ — o eixo é a queixa, não o procedimento, então o
  // nome que entra na mensagem do WhatsApp é o da dor que a paciente reconhece.
  var WA_OBJECTIVES = {
    "nariz-sem-cirurgia": "Rinomodelação (nariz sem cirurgia)",
    "olheira-funda": "Preenchimento de Olheiras",
    "preenchimento-labial-natural": "Preenchimento Labial"
  };

  function pageProcedure() {
    var m = window.location.pathname.match(/\/detalhes\/([^\/.]+)\.html/);
    if (m && WA_PROCEDURES[m[1]]) { return { slug: m[1], name: WA_PROCEDURES[m[1]] }; }
    m = window.location.pathname.match(/\/objetivos\/([^\/.]+)\.html/);
    if (m && WA_OBJECTIVES[m[1]]) { return { slug: m[1], name: WA_OBJECTIVES[m[1]] }; }
    return null;
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

  // Aplica uma mensagem a todos os CTAs de WhatsApp da página. É chamada no
  // carregamento e novamente a cada resposta da micro-qualificação: assim a
  // resposta enriquece também os CTAs que vêm depois do quiz, e não só o
  // botão dele. Sem isso, quem responde e depois converte no CTA final manda
  // uma mensagem genérica, e o caso se perde no caminho.
  function applyWaMessage(msg) {
    waLinks.forEach(function (a) {
      // o botão final do quiz da home é montado pela própria lógica do quiz
      if (a.hasAttribute("data-quiz-send")) return;
      a.href = buildWaHref(a.getAttribute("data-wa-msg") || msg);
    });
  }

  applyWaMessage(pageMsg);

  // ----------------------------------------------------------------
  // Micro-qualificação — a visitante descreve o caso e o prazo, e a mensagem
  // do WhatsApp chega enriquecida, sem sair da página. Aceita um ou mais
  // grupos de pergunta: cada `.qualify` é um grupo independente, nomeado por
  // `data-qualify-group`. As páginas de /detalhes/ usam um grupo (prazo); as
  // LPs de dor em /objetivos/ usam dois (caso + prazo).
  //
  // A resposta nunca gera veredito na tela. Ela só descreve o caso para a
  // médica, porque indicação sem avaliação presencial é ato médico.
  // ----------------------------------------------------------------
  var qualifyBand = document.querySelector("[data-qualify]");
  if (qualifyBand) {
    var qualifyGroups = qualifyBand.querySelectorAll(".qualify");
    var qualifyProc = pageProcedure();

    function upperFirst(s) {
      return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
    }

    // Uma frase por resposta. Juntar as respostas com "e" produziria erro de
    // pontuação quando os sujeitos são diferentes ("minha olheira muda… e
    // pretendo começar…"), então cada uma vira uma sentença própria.
    function qualifyMessage() {
      var msg = "Olá, Dra. Ana! Vim pela página de " +
        (qualifyProc ? qualifyProc.name : "tratamentos") + " no site.";
      qualifyGroups.forEach(function (group) {
        var picked = group.querySelector(".qualify__opt.is-selected");
        if (picked) {
          msg += " " + upperFirst(picked.getAttribute("data-value")) + ".";
        }
      });
      return msg + " Gostaria de agendar uma avaliação individual.";
    }

    qualifyGroups.forEach(function (group) {
      var opts = group.querySelectorAll(".qualify__opt");
      var groupName = group.getAttribute("data-qualify-group") || "prazo";
      opts.forEach(function (opt) {
        opt.addEventListener("click", function () {
          // a troca de seleção é por grupo, não na banda inteira
          opts.forEach(function (o) { o.classList.remove("is-selected"); });
          opt.classList.add("is-selected");
          applyWaMessage(qualifyMessage());
          if (window.dataLayer) {
            var ev = {
              event: "qualify_select",
              qualify_group: groupName,
              qualify_value: opt.textContent.trim(),
              procedure_slug: qualifyProc ? qualifyProc.slug : ""
            };
            // `qualify_prazo` era o nome do parâmetro antes do segundo grupo
            // existir. Continua sendo enviado para não quebrar o que já está
            // montado no GTM e no GA4.
            ev["qualify_" + groupName] = opt.textContent.trim();
            window.dataLayer.push(ev);
          }
        });
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
  // Carrosséis contínuos (home) — depoimentos e tratamentos.
  // Movidos por scrollLeft REAL (não por transform): o WebKit/iOS
  // rasteriza conteúdo rolável de forma confiável, sem as camadas GPU
  // animadas por transform que ficavam em branco no iPhone. Também deixa
  // arrastar com o dedo. Sem auto-scroll em prefers-reduced-motion.
  // ----------------------------------------------------------------
  var marqueeReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  if (!marqueeReduce) {
    // Depoimentos: duas fileiras em direções opostas. Clona os cards de cada
    // fileira (offsetLeft do 1º clone = distância exata de um ciclo).
    var wRows = document.querySelectorAll("[data-tstm-row]");
    Array.prototype.forEach.call(wRows, function (row, i) {
      var n = row.children.length;
      Array.prototype.slice.call(row.children).forEach(function (card) {
        var clone = card.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        row.appendChild(clone);
      });
      autoScroll(row, function () {
        var a = row.children[0], b = row.children[n];
        return (a && b) ? (b.offsetLeft - a.offsetLeft) : 0;
      }, i === 0 ? 1 : -1, 40);
    });

    // Tratamentos: uma esteira. Scroller = .marquee--cards; os cards ficam em
    // .marquee__track, que já traz 2 grupos idênticos no HTML (não clona de novo).
    var tScroller = document.querySelector(".marquee--cards");
    var tTrack = tScroller && tScroller.querySelector(".marquee__track");
    if (tTrack && tTrack.children.length >= 2) {
      autoScroll(tScroller, function () {
        var a = tTrack.children[0], b = tTrack.children[1];
        return (a && b) ? (b.offsetLeft - a.offsetLeft) : 0;
      }, 1, 55);
    }
  }

  // ----------------------------------------------------------------
  // Quiz de recomendação (tratamentos-quiz) — objetivo + prazo →
  // recomenda os tratamentos que melhor se encaixam e monta a
  // mensagem de WhatsApp já qualificada.
  // ----------------------------------------------------------------
  var recoQuiz = document.querySelector("[data-quiz-reco]");
  if (recoQuiz) {
    var RECO_TREATMENTS = {
      "botox": { name: "Botox®", img: "/assets/treatments/botox.webp", blurb: "Suaviza rugas de expressão e previne novas linhas, preservando a naturalidade." },
      "preenchimento-facial": { name: "Preenchimento Facial", img: "/assets/treatments/preenchimento-facial.webp", blurb: "Restaura volume, suaviza rugas e melhora contornos com efeito natural." },
      "radiesse": { name: "Radiesse®", img: "/assets/treatments/radiesse.webp", blurb: "Estimula colágeno, melhora firmeza e qualidade da pele com efeito gradual." },
      "ultrassom-microfocado": { name: "Ultrassom Microfocado", img: "/assets/treatments/ultrassom-microfocado.webp", blurb: "Lifting não cirúrgico que trata a flacidez nas camadas profundas." },
      "fios-de-tracao": { name: "Fios de Tração", img: "/assets/treatments/fios-de-tracao.webp", blurb: "Efeito lifting com reposicionamento dos tecidos, sem cirurgia." },
      "fios-lisos": { name: "Fios PDO Lisos", img: "/assets/treatments/fios-lisos.webp", blurb: "Fios PDO que estimulam colágeno e melhoram a firmeza da pele." },
      "pdrn-injetavel": { name: "PDRN Injetável", img: "/assets/treatments/pdrn-injetavel.webp", blurb: "Regeneração celular que melhora hidratação, firmeza e qualidade da pele." },
      "pdrn-mesoject": { name: "PDRN Mesoject", img: "/assets/treatments/pdrn-mesoject.webp", blurb: "Regeneração celular sem agulhas, com máximo conforto." },
      "lavieen-pdrn": { name: "Lavieen + PDRN", img: "/assets/treatments/lavieen-pdrn.webp", blurb: "Protocolo Glow Repair: laser Lavieen + PDRN para viço e textura da pele." },
      "culote": { name: "Culote", img: "/assets/treatments/culote.webp", blurb: "Injetáveis que ajudam a reduzir medidas e melhorar o contorno corporal." },
      "harmonizacao-glutea": { name: "Harmonização Glútea", img: "/assets/treatments/harmonizacao-glutea.webp", blurb: "Volume, firmeza e contorno para os glúteos, sem cirurgia." }
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

  // --- Destaca o link da seção atual na navbar (scrollspy) ---
  var spyLinks = Array.prototype.slice.call(
    document.querySelectorAll('.nav__menu a[href^="#"]')
  );
  if (spyLinks.length) {
    var spyItems = [];
    spyLinks.forEach(function (link) {
      var id = link.getAttribute("href").slice(1);
      var section = id && document.getElementById(id);
      if (section) spyItems.push({ link: link, section: section });
    });

    if (spyItems.length) {
      var headerEl = document.querySelector(".site-header");
      var activeLink = null;
      var ticking = false;

      function updateActive() {
        ticking = false;
        var offset = (headerEl ? headerEl.offsetHeight : 76) + 24;
        var line = window.scrollY + offset;
        var current = spyItems[0];
        for (var i = 0; i < spyItems.length; i++) {
          var top = spyItems[i].section.getBoundingClientRect().top + window.scrollY;
          if (top <= line) current = spyItems[i];
        }
        // no fim da página, força a última seção
        if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) {
          current = spyItems[spyItems.length - 1];
        }
        if (current.link !== activeLink) {
          if (activeLink) activeLink.classList.remove("is-active");
          current.link.classList.add("is-active");
          activeLink = current.link;
        }
      }

      function onScroll() {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(updateActive);
        }
      }

      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      updateActive();
    }
  }

  // --- Destaca o item da página atual nas demais páginas (sem âncoras próprias) ---
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll(".nav__menu a")
  );
  if (navLinks.length) {
    var normalize = function (p) {
      return p.replace(/\/index\.html$/, "/") || "/";
    };
    var path = normalize(window.location.pathname);
    var isHome = path === "/";
    if (!isHome) {
      // páginas que fazem parte da área de Tratamentos
      var inTreatments =
        path === "/tratamentos.html" ||
        path === "/tratamentos-quiz.html" ||
        path.indexOf("/detalhes/") === 0;
      var match = null;
      navLinks.forEach(function (link) {
        // ignora links que são apenas âncora (pertencem à home)
        if (link.hash && normalize(link.pathname) === "/") return;
        if (normalize(link.pathname) === path && !link.hash) match = link;
      });
      if (!match && inTreatments) {
        navLinks.forEach(function (link) {
          if (normalize(link.pathname) === "/tratamentos.html") match = link;
        });
      }
      if (match) match.classList.add("is-active");
    }
  }
})();
