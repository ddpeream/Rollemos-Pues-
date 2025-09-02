# Rollemos Pues!!! — App MPA de patinaje

Aplicación front-end (MPA) en HTML, CSS y JavaScript vanilla sobre la temática de patinaje. Incluye 5 vistas: Inicio, Patinadores, Parches, Spots (mapa diferido) y Galería.

## Requisitos y tecnologías
- HTML5, CSS3, JavaScript (ES2020+)
- Sin frameworks ni build
- CDNs: Google Fonts, Remixicon, Leaflet (solo en Spots y bajo demanda)

## Cómo ejecutar
Para evitar problemas de CORS con `fetch` de archivos JSON locales, usa un servidor estático. Sugerido:

Opcional (VS Code Live Server):
1. Instala la extensión "Live Server".
2. Abre `index.html` y ejecuta "Open with Live Server".

O con Python (opcional):
```
python -m http.server 5500
```
Luego abre http://localhost:5500/

## Estructura
- `index.html`: Landing con hero, carrusel, destacados y newsletter.
- `skaters.html`: Filtros y explorador de patinadores (desde `/data/skaters.json`).
- `parches.html`: Directorio de parches con filtros y detalle en modal.
- `spots.html`: Listado y mapa Leaflet cargado bajo demanda (desde `/data/spots.json`).
- `galeria.html`: Masonry + lightbox básico y crónicas/eventos.

## Datos mock
Nota: Actualmente los datos están limitados únicamente a Medellín (MDE) y usan imágenes placeholder (Unsplash/Picsum). Puedes ampliarlos a otras ciudades cuando quieras editando los JSON.
Edita los JSON en `/data/` para cambiar contenido:
- `skaters.json`: { id, nombre, ciudad, disciplinas[], nivel, foto, bioCorta, redes{}, destacado? }
- `parches.json`: { id, nombre, ciudad, foto, disciplinas[], descripcion, contacto?, miembrosAprox? }
- `spots.json`: { id, nombre, lat, lng, tipo, ciudad, dificultad, foto, descripcion }

## Diseño y theming
- Tipografías: Poppins (titulares), Inter (texto) — en `assets/css/styles.css`.
- Paleta y variables en `assets/css/utilities.css` (colores, radios, sombras).
- Cambia los gradientes, radios o sombras modificando variables CSS.

## Accesibilidad y rendimiento
- Navegación por teclado, foco visible, roles/aria básicos.
- `prefers-reduced-motion` respetado para transiciones.
- Imágenes `loading="lazy"` donde aplica.
- Mapa Leaflet se carga al presionar "Abrir mapa" o al llegar a la sección.

## Funciones clave
- `assets/js/main.js`: menú móvil, tema, utilidades (qs, qsa, debounce), toasts, reveal por IntersectionObserver, scroll-top.
- `assets/js/skaters.js`: carga/caché JSON, filtros, paginación, modal de perfil.
- `assets/js/parches.js`: filtros, detalle en modal/subpágina, link profundo a spots.
- `assets/js/spots.js`: filtros, carga diferida de Leaflet, marcadores y sincronización lista→mapa.
- `assets/js/galeria.js`: masonry, lightbox simple y filtros por tag.

## SEO
Cada página incluye `<title>`, meta description y OG/Twitter placeholders. Actualiza URLs y previews al desplegar.

## Licencia y contenidos
Imágenes de ejemplo con URLs de Unsplash/Picsum. Reemplaza por tus propios recursos según derechos aplicables.
