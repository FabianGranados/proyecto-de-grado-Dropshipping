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
     7. Carrusel "Referentes del sector" — tira deslizable (swipe / drag)
        Fila de tarjetas con scroll horizontal real + scroll-snap ("imán").
        Swipe en táctil, arrastrar con el mouse en desktop, botones, puntos,
        contador y filtro por idioma. Se renderiza desde window.REFERENTES.
  ---------------------------------------------------------------------- */
  (function () {
    var data = window.REFERENTES || [];
    var root = document.getElementById("refCarousel");
    var track = document.getElementById("refTrack");
    if (!root || !track || !data.length) return;

    var viewport = root.querySelector(".carousel__viewport");
    var counter = document.getElementById("refCounter");
    var dotsWrap = document.getElementById("refDots");
    var prevBtn = root.querySelector(".carousel__btn--prev");
    var nextBtn = root.querySelector(".carousel__btn--next");
    var filterBtns = Array.prototype.slice.call(document.querySelectorAll(".ref-filter"));

    var filter = "all";
    var items = [];
    var perView = 1;
    var smooth = prefersReduced ? "auto" : "smooth";

    function computePerView() {
      return 1; // pantalla completa: una tarjeta por vista
    }
    function cardWidth() {
      var first = track.children[0];
      return first ? first.getBoundingClientRect().width : (viewport.clientWidth || 1);
    }
    function activeIndex() {
      return Math.max(0, Math.min(items.length - 1, Math.round(viewport.scrollLeft / cardWidth())));
    }
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
              '<img class="ref-card__avatar" src="' + esc(r.imagen) + '" alt="Foto de ' + esc(r.nombre) + '" width="120" height="120" loading="lazy" decoding="async" draggable="false" />' +
              '<h3 class="ref-card__name">' + esc(r.nombre) + "</h3>" +
              '<p class="ref-card__role">' + esc(r.especialidad) + "</p>" +
              '<div class="ref-card__stars" role="img" aria-label="Calificación: ' + (parseInt(r.estrellas, 10) || 0) + ' de 5 estrellas">' + stars(r.estrellas) + "</div>" +
              '<p class="ref-card__desc">' + esc(r.descripcion) + "</p>" +
              '<a class="btn btn--primary ref-card__btn" href="biografia.html?ref=' + encodeURIComponent(r.slug) + '">Ver biografía <span aria-hidden="true">&rarr;</span></a>' +
              '<span class="ref-card__platform">' + platform(r.enlace) + "</span>" +
            "</article>" +
          "</li>"
        );
      }).join("");
      renderDots();
      viewport.scrollLeft = 0;
      updateUI();
    }

    function renderDots() {
      dotsWrap.innerHTML = items.map(function (r, i) {
        return '<button class="carousel__dot" type="button" data-i="' + i + '" aria-label="Ir al referente ' + (i + 1) + ": " + esc(r.nombre) + '"></button>';
      }).join("");
    }

    function updateUI() {
      var idx = activeIndex();
      if (counter) counter.textContent = (idx + 1) + " / " + items.length;
      Array.prototype.forEach.call(dotsWrap.children, function (d, i) {
        var on = i === idx;
        d.classList.toggle("is-active", on);
        d.setAttribute("aria-current", on ? "true" : "false");
      });
    }

    function scrollToIndex(i) {
      i = Math.max(0, Math.min(items.length - 1, i));
      viewport.scrollTo({ left: i * cardWidth(), behavior: smooth });
    }

    nextBtn.addEventListener("click", function () { scrollToIndex(activeIndex() + 1); });
    prevBtn.addEventListener("click", function () { scrollToIndex(activeIndex() - 1); });
    dotsWrap.addEventListener("click", function (e) {
      var b = e.target.closest("[data-i]");
      if (b) scrollToIndex(parseInt(b.getAttribute("data-i"), 10));
    });

    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); scrollToIndex(activeIndex() + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); scrollToIndex(activeIndex() - 1); }
    });

    // Actualizar puntos/contador mientras se desplaza
    var ticking = false;
    viewport.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () { updateUI(); ticking = false; });
      }
    }, { passive: true });

    // Arrastrar con el mouse (en táctil se usa el scroll nativo del navegador)
    var down = false, startX = 0, startLeft = 0, moved = false;
    viewport.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse") return;
      down = true; moved = false;
      startX = e.clientX; startLeft = viewport.scrollLeft;
      viewport.classList.add("is-dragging");
    });
    window.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      viewport.scrollLeft = startLeft - dx;
    });
    window.addEventListener("pointerup", function () {
      if (!down) return;
      down = false;
      viewport.classList.remove("is-dragging");
      scrollToIndex(activeIndex()); // re-imanta a la tarjeta más cercana
    });
    // Evitar que un arrastre dispare el click del botón "Ver biografía"
    viewport.addEventListener("click", function (e) {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
    }, true);

    // Filtro por idioma (es / en / todos)
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filter = btn.getAttribute("data-filter");
        filterBtns.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-pressed", on ? "true" : "false");
        });
        applyFilter();
        render();
      });
    });

    // Recalcular cuántas tarjetas por vista al cambiar el tamaño
    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        var old = perView;
        perView = computePerView();
        if (old !== perView) render(); else updateUI();
      }, 150);
    });

    // Datos estructurados (schema.org) con todos los referentes
    (function injectSchema() {
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
    })();

    applyFilter();
    render();
  })();
})();
