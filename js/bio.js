/* ==========================================================================
   Dropship · Proyecto de grado
   Biografía dinámica — biografia.html?ref=<slug>
   --------------------------------------------------------------------------
   Lee el parámetro ?ref= (o ?id=), busca el referente en window.REFERENTES
   y construye la ficha técnica, la gráfica ASCII, el análisis con notación
   matemática y las redes sociales. Vanilla JS, sin dependencias.
   ========================================================================== */
(function () {
  "use strict";

  /* --- utilidades pequeñas (año, progreso, volver arriba) --- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  var toTop = document.getElementById("toTop");
  var progress = document.getElementById("scrollProgress");
  window.addEventListener("scroll", function () {
    var y = window.scrollY || window.pageYOffset;
    if (toTop) toTop.classList.toggle("is-visible", y > 500);
    if (progress) {
      var docH = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (docH > 0 ? (y / docH) * 100 : 0) + "%";
    }
  }, { passive: true });
  if (toTop) toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });

  /* --- helpers de texto --- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  // Convierte comandos LaTeX simples a símbolos
  function latex(x) {
    return x
      .replace(/\\geq/g, "≥").replace(/\\leq/g, "≤")
      .replace(/\\times/g, "×").replace(/\\approx/g, "≈")
      .replace(/\\cdot/g, "·").replace(/\\to/g, "→")
      .replace(/\\,/g, " ").replace(/\\ /g, " ");
  }
  // Escapa HTML y renderiza notación matemática inline $...$
  // (ignora importes en dólares como $20M: '$' seguido de dígito no abre fórmula)
  function math(s) {
    return esc(s).replace(/\$(?!\d)([^$]+?)\$/g, function (_, inner) {
      return '<span class="tex">' + latex(inner) + "</span>";
    });
  }

  function badge(lang) { return lang === "en" ? "Angloparlante" : "Hispanohablante"; }

  /* --- localizar el referente --- */
  var data = window.REFERENTES || [];
  var params = new URLSearchParams(location.search);
  var ref = params.get("ref");
  var id = params.get("id");
  var r = null;
  if (ref) r = data.filter(function (x) { return x.slug === ref; })[0];
  if (!r && id) r = data.filter(function (x) { return String(x.id) === String(id); })[0];

  var mount = document.getElementById("bio");

  if (!r) {
    document.title = "Referente no encontrado · Dropship";
    mount.innerHTML =
      '<section class="section"><div class="container container--narrow" style="text-align:center">' +
      '<span class="section-tag">// 404</span>' +
      '<h1 class="section-title">No encontramos ese referente</h1>' +
      '<p class="section-sub">El enlace no corresponde a ningún perfil disponible.</p>' +
      '<a class="btn btn--primary" href="index.html#referentes">← Volver a Referentes</a>' +
      "</div></section>";
    return;
  }

  /* --- SEO / título --- */
  document.title = r.nombre + " — Biografía · Dropship";
  var md = document.querySelector('meta[name="description"]');
  if (md) md.setAttribute("content", r.nombre + ": " + r.descripcion);

  /* --- bloques --- */
  var socialHTML = (r.redes || []).map(function (s) {
    return '<a class="bio-social__link" href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer"' +
      (s.verificar ? ' title="Enlace por verificar"' : "") + ">" +
      esc(s.red) + ' <span aria-hidden="true">↗</span></a>';
  }).join("");

  var metricsHTML = (r.metricas || []).map(function (m) {
    return "<li>" + math(m) + "</li>";
  }).join("");

  var asciiHTML = (r.distribucion && r.distribucion.ascii || []).map(esc).join("\n");

  var proseHTML = (r.trayectoria || []).map(function (p) {
    return "<p>" + math(p) + "</p>";
  }).join("");

  mount.innerHTML =
    /* ===== HERO ===== */
    '<section class="bio-hero">' +
      '<div class="bio-hero__aurora" aria-hidden="true"></div>' +
      '<div class="container bio-hero__inner">' +
        '<a class="bio-back" href="index.html#referentes">← Volver a Referentes</a>' +
        '<div class="bio-id">' +
          '<img class="bio-avatar" src="' + esc(r.imagen) + '" alt="Foto de ' + esc(r.nombre) + '" width="148" height="148" decoding="async" />' +
          '<div class="bio-id__main">' +
            '<span class="ref-card__badge ref-card__badge--' + esc(r.idioma) + ' bio-badge">' + badge(r.idioma) + "</span>" +
            '<h1 class="bio-name">' + esc(r.nombre) + "</h1>" +
            '<p class="bio-role">' + esc(r.especialidad) + "</p>" +
            '<div class="bio-stars" role="img" aria-label="Calificación: ' + (parseInt(r.estrellas, 10) || 0) + ' de 5 estrellas">' +
              "★★★★★".slice(0, Math.max(0, Math.min(5, parseInt(r.estrellas, 10) || 0))) +
              "☆☆☆☆☆".slice(0, 5 - (parseInt(r.estrellas, 10) || 0)) + "</div>" +
            '<p class="bio-desc">' + math(r.descripcion) + "</p>" +
          "</div>" +
        "</div>" +
        '<div class="bio-kpis">' +
          '<div class="bio-kpi"><span class="bio-kpi__label">Métrica principal</span><span class="bio-kpi__value">' + math(r.metrica_principal || "—") + "</span></div>" +
          '<div class="bio-kpi"><span class="bio-kpi__label">Ingreso / valoración (est.)</span><span class="bio-kpi__value">' + math(r.ingreso_estimado || "—") + "</span></div>" +
        "</div>" +
        '<div class="bio-social"><span class="bio-social__label">Redes:</span>' + socialHTML + "</div>" +
      "</div>" +
    "</section>" +

    /* ===== FICHA DE RENDIMIENTO ===== */
    '<section class="section bio-section">' +
      '<div class="container container--narrow">' +
        '<span class="section-tag">// ficha de rendimiento</span>' +
        '<h2 class="section-title">Ficha de datos de rendimiento</h2>' +
        '<div class="bio-ficha">' +
          '<div class="bio-ficha__row"><span class="bio-ficha__k">Modelo de negocio primario</span>' +
            '<div class="bio-ficha__v">' + math(r.modelo_negocio || "—") + "</div></div>" +
          '<div class="bio-ficha__row"><span class="bio-ficha__k">Métricas de impacto</span>' +
            '<ul class="bio-metrics">' + metricsHTML + "</ul></div>" +
        "</div>" +
        (asciiHTML
          ? '<h3 class="bio-graph__title">' + esc(r.distribucion.titulo || "Distribución estimada") + "</h3>" +
            '<pre class="bio-graph" role="img" aria-label="Gráfica de distribución estimada">' + asciiHTML + "</pre>" +
            '<p class="bio-graph__note">' + esc(r.distribucion.nota || "") + "</p>"
          : "") +
      "</div>" +
    "</section>" +

    /* ===== TRAYECTORIA Y ANÁLISIS ===== */
    '<section class="section section--alt bio-section">' +
      '<div class="container container--narrow">' +
        '<span class="section-tag">// trayectoria</span>' +
        '<h2 class="section-title">Trayectoria y análisis técnico</h2>' +
        '<div class="bio-prose">' + proseHTML + "</div>" +
        '<div class="bio-cta">' +
          '<a class="btn btn--primary" href="index.html#referentes">← Volver a Referentes</a>' +
          (r.enlace ? '<a class="btn btn--ghost" href="' + esc(r.enlace) + '" target="_blank" rel="noopener noreferrer">Sitio oficial ↗</a>' : "") +
        "</div>" +
      "</div>" +
    "</section>";
})();
