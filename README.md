# product-360

Presentación interactiva de automóvil con video sincronizado (scrub por
`currentTime`), HTML + SCSS + JavaScript.

## Páginas

| Página | Interacción |
|---|---|
| [`index.html`](index.html) | **v1** — video sincronizado con el **scroll** (GSAP + ScrollTrigger, pin + scrub) con textos en 3 fases |
| [`index-v2.html`](index-v2.html) | **v2** — video de fondo controlado con **arrastre** del mouse/dedo (pointer events + rAF), sin textos; responsive con `<source media>` (1080p escritorio / 720p móvil) |

## Estructura

```
index.html / index-v2.html   páginas de cada versión
css/main.css                 CSS compilado (desde src/scss con npm run build)
src/scss/                    estilos fuente (SCSS)
js/                          scripts (scroll v1, drag v2, vendor gsap)
video/                       videos optimizados (all-intra para scrub fluido)
herramientas/optimizar-video scripts para optimizar videos (Windows/Mac)
optimizaVideo.md             guía de optimización de videos
```

## Desarrollo

```bash
npm install
npm run build   # compila SCSS → css/main.css
npm run watch   # compila en modo watch
```

Los videos para scrub deben codificarse con keyframe en cada fotograma
(`-g 1`); ver `optimizaVideo.md` o usar los scripts de `herramientas/optimizar-video/`.
