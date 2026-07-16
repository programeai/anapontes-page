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
})();
