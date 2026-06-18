/* ==========================================================================
   Dropship · Proyecto de grado
   Interacciones de la página
   --------------------------------------------------------------------------
   Vanilla JS, sin dependencias. Cada bloque es independiente, así que es
   fácil de mover a módulos cuando el proyecto crezca a un sitio completo.
   ========================================================================== */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------------------------------------
     1. Año dinámico en el footer
  ---------------------------------------------------------------------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ----------------------------------------------------------------------
     2. Estado de la barra de navegación al hacer scroll
  ---------------------------------------------------------------------- */
  var nav = document.getElementById("nav");
  var toTop = document.getElementById("toTop");
  var progress = document.getElementById("scrollProgress");

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;

    if (nav) nav.classList.toggle("is-scrolled", y > 8);
    if (toTop) toTop.classList.toggle("is-visible", y > 600);

    if (progress) {
      var docH = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docH > 0 ? (y / docH) * 100 : 0;
      progress.style.width = pct + "%";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ----------------------------------------------------------------------
     3. Menú móvil
  ---------------------------------------------------------------------- */
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");

  function closeMenu() {
    if (!toggle || !links) return;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menú");
    links.classList.remove("is-open");
  }

  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Abrir menú" : "Cerrar menú");
      links.classList.toggle("is-open", !open);
    });

    // Cerrar al pulsar un enlace o al tocar fuera
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ----------------------------------------------------------------------
     4. Reveal de elementos al entrar en viewport
  ---------------------------------------------------------------------- */
  var revealEls = document.querySelectorAll(".reveal");

  if (prefersReduced || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry, i) {
        if (entry.isIntersecting) {
          // pequeño escalonado para grupos de tarjetas
          var delay = Math.min(i * 60, 240);
          setTimeout(function () { entry.target.classList.add("is-visible"); }, delay);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    revealEls.forEach(function (el) { revObserver.observe(el); });
  }

  /* ----------------------------------------------------------------------
     5. Contadores animados
  ---------------------------------------------------------------------- */
  var counters = document.querySelectorAll("[data-count]");

  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count")) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    var duration = 1400;

    if (prefersReduced || target === 0) {
      el.textContent = target + suffix;
      return;
    }

    var start = null;
    function tick(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      // easing easeOutCubic
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if ("IntersectionObserver" in window) {
    var countObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countObserver.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  /* ----------------------------------------------------------------------
     6. Resaltado del enlace activo según la sección visible
  ---------------------------------------------------------------------- */
  var navAnchors = Array.prototype.slice.call(
    document.querySelectorAll('.nav__links a[href^="#"]')
  );
  var sections = navAnchors
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.getAttribute("id");
        navAnchors.forEach(function (a) {
          a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ----------------------------------------------------------------------
     7. Carrusel de "Referentes del sector"
        Renderiza las tarjetas desde window.REFERENTES (js/referentes.js):
        navegación prev/next, puntos, contador, filtro por idioma,
        auto-scroll con pausa, teclado y datos estructurados (JSON-LD).
  ---------------------------------------------------------------------- */
  (function () {
    var data = window.REFERENTES || [];
    var root = document.getElementById("refCarousel");
    var track = document.getElementById("refTrack");
    if (!root || !track || !data.length) return;

    var counter = document.getElementById("refCounter");
    var dotsWrap = document.getElementById("refDots");
    var prevBtn = root.querySelector(".carousel__btn--prev");
    var nextBtn = root.querySelector(".carousel__btn--next");
    var filterBtns = Array.prototype.slice.call(document.querySelectorAll(".ref-filter"));

    var filter = "all";
    var items = [];
    var index = 0;
    var perView = 1;
    var timer = null;
    var AUTO_MS = 5000;

    function computePerView() {
      var w = window.innerWidth;
      if (w >= 992) return 3;
      if (w >= 600) return 2;
      return 1;
    }
    function maxIndex() { return Math.max(0, items.length - perView); }
    function badge(lang) { return lang === "en" ? "Angloparlante" : "Hispanohablante"; }
    function platform(url) {
      if (/linkedin\./i.test(url)) return "LinkedIn";
      if (/youtube\.|youtu\.be/i.test(url)) return "YouTube";
      return "Sitio web";
    }
    function stars(n) {
      n = Math.max(0, Math.min(5, parseInt(n, 10) || 0));
      return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
    }
    function esc(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    }

    function applyFilter() {
      items = filter === "all" ? data.slice() : data.filter(function (r) { return r.idioma === filter; });
    }

    function render() {
      perView = computePerView();
      track.style.setProperty("--per-view", perView);
      track.innerHTML = items.map(function (r, i) {
        return (
          '<li class="carousel__slide" role="group" aria-roledescription="diapositiva" aria-label="' + (i + 1) + " de " + items.length + '">' +
            '<article class="ref-card">' +
              '<span class="ref-card__badge ref-card__badge--' + esc(r.idioma) + '">' + badge(r.idioma) + "</span>" +
              '<img class="ref-card__avatar" src="' + esc(r.imagen) + '" alt="Foto de ' + esc(r.nombre) + '" width="120" height="120" loading="lazy" decoding="async" />' +
              '<h3 class="ref-card__name">' + esc(r.nombre) + "</h3>" +
              '<p class="ref-card__role">' + esc(r.especialidad) + "</p>" +
              '<div class="ref-card__stars" role="img" aria-label="Calificación: ' + (parseInt(r.estrellas, 10) || 0) + ' de 5 estrellas">' + stars(r.estrellas) + "</div>" +
              '<p class="ref-card__desc">' + esc(r.descripcion) + "</p>" +
              '<a class="btn btn--primary ref-card__btn" href="' + esc(r.enlace) + '" target="_blank" rel="noopener noreferrer">Ver biografía <span aria-hidden="true">&rarr;</span><span class="sr-only"> (se abre en una pestaña nueva)</span></a>' +
              '<span class="ref-card__platform">' + platform(r.enlace) + "</span>" +
            "</article>" +
          "</li>"
        );
      }).join("");
      if (index > maxIndex()) index = maxIndex();
      renderDots();
      update();
    }

    function renderDots() {
      var n = maxIndex() + 1;
      var html = "";
      for (var i = 0; i < n; i++) {
        html += '<button class="carousel__dot" type="button" data-i="' + i + '" aria-label="Ir a la posición ' + (i + 1) + '"></button>';
      }
      dotsWrap.innerHTML = html;
    }

    function update() {
      track.style.transform = "translateX(" + (-index * (100 / perView)) + "%)";
      if (counter) counter.textContent = (index + 1) + " / " + (maxIndex() + 1);
      Array.prototype.forEach.call(dotsWrap.children, function (d, i) {
        var active = i === index;
        d.classList.toggle("is-active", active);
        d.setAttribute("aria-current", active ? "true" : "false");
      });
    }

    function go(i) {
      var max = maxIndex();
      if (i < 0) i = max;
      else if (i > max) i = 0;
      index = i;
      update();
    }

    function startAuto() {
      if (prefersReduced) return;
      stopAuto();
      if (items.length > perView) timer = setInterval(function () { go(index + 1); }, AUTO_MS);
    }
    function stopAuto() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() { startAuto(); }

    nextBtn.addEventListener("click", function () { go(index + 1); restart(); });
    prevBtn.addEventListener("click", function () { go(index - 1); restart(); });
    dotsWrap.addEventListener("click", function (e) {
      var b = e.target.closest("[data-i]");
      if (b) { go(parseInt(b.getAttribute("data-i"), 10)); restart(); }
    });

    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); go(index + 1); restart(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(index - 1); restart(); }
    });

    // Pausar auto-scroll al interactuar
    root.addEventListener("mouseenter", stopAuto);
    root.addEventListener("mouseleave", startAuto);
    root.addEventListener("focusin", stopAuto);
    root.addEventListener("focusout", startAuto);
    root.addEventListener("touchstart", stopAuto, { passive: true });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stopAuto(); else startAuto();
    });

    // Filtro por idioma (es / en / todos)
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filter = btn.getAttribute("data-filter");
        filterBtns.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-pressed", on ? "true" : "false");
        });
        index = 0;
        applyFilter();
        render();
        restart();
      });
    });

    // Recalcular cuántas tarjetas por vista al cambiar el tamaño
    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        var old = perView;
        perView = computePerView();
        if (old !== perView) render(); else update();
      }, 150);
    });

    // Datos estructurados (schema.org) con todos los referentes
    function injectSchema() {
      try {
        var json = {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Referentes del sector del dropshipping",
          itemListElement: data.map(function (r, i) {
            return {
              "@type": "ListItem",
              position: i + 1,
              item: { "@type": "Person", name: r.nombre, jobTitle: r.especialidad, description: r.descripcion, url: r.enlace }
            };
          })
        };
        var s = document.createElement("script");
        s.type = "application/ld+json";
        s.textContent = JSON.stringify(json);
        document.head.appendChild(s);
      } catch (e) { /* sin bloqueo si falla */ }
    }

    applyFilter();
    render();
    injectSchema();
    startAuto();
  })();
})();
