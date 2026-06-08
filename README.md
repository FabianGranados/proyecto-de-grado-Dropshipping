# Dropship — Página informativa sobre dropshipping

Página web informativa que explica el modelo de negocio del **dropshipping** de
principio a fin: qué es, cómo funciona, sus ventajas y retos, cómo empezar, las
herramientas del ecosistema y las preguntas frecuentes.

Proyecto de grado · Comercio electrónico.

## ✨ Características

- Diseño moderno y responsive (móvil, tablet, escritorio).
- Hero con fondo *aurora* animado.
- Animaciones de entrada al hacer scroll (reveal) y contadores animados.
- Navegación fija con menú móvil y resaltado de la sección activa.
- Barra de progreso de lectura y botón "volver arriba".
- Accesibilidad: salto al contenido, foco visible y respeto a
  `prefers-reduced-motion`.
- **Sin dependencias ni build**: es HTML, CSS y JavaScript puro.

## 🗂️ Estructura

```
proyecto-de-grado-Dropshipping/
├── index.html          # Página principal (landing informativa)
├── css/
│   └── styles.css      # Sistema de diseño + componentes (organizado por bloques)
├── js/
│   └── main.js         # Interacciones (nav, reveal, contadores, etc.)
├── assets/
│   └── favicon.svg     # Ícono del sitio (e imágenes futuras)
└── README.md
```

## 🚀 Cómo verla en local

No requiere instalación. Cualquiera de estas opciones funciona:

- **Abrir directo**: doble clic en `index.html`.
- **Con un servidor local** (recomendado, para que carguen bien las rutas):

  ```bash
  # Python 3
  python3 -m http.server 8000
  # luego abre http://localhost:8000
  ```

  ```bash
  # Node (si tienes npx)
  npx serve .
  ```

## 🌱 Cómo convertirla en un sitio completo

La base está pensada para crecer **sin reescribir lo existente**:

1. **Más páginas** — crea una carpeta `pages/` (o archivos en la raíz) como
   `pages/glosario.html`, `pages/casos.html`, etc., reutilizando el mismo
   `css/styles.css` y `js/main.js`. La navegación ya está lista para añadir
   enlaces.
2. **Datos separados del diseño** — cuando haya contenido dinámico (ej. un
   catálogo o un blog), mueve los datos a un `js/data.js` o a un JSON y
   genera las tarjetas desde ahí. Más adelante eso puede venir de una base de
   datos (p. ej. Supabase).
3. **Componentes** — los bloques del CSS (`.card`, `.btn`, `.steps`, etc.) ya
   funcionan como componentes reutilizables; al separar archivos, divide
   `styles.css` en `base.css`, `components.css` y `layout.css`.
4. **Despliegue** — al ser estática, se publica tal cual en GitHub Pages,
   Vercel, Netlify o Cloudflare Pages.

## 📝 Nota académica

Las cifras de la sección de estadísticas son **referenciales** y se usan con
fines ilustrativos. Para el documento final, verifica y cita fuentes
actualizadas del sector.
