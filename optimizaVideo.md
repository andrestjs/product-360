# Optimización de videos para scrub con ScrollTrigger

Guía del flujo de trabajo para que los videos grabados por clientes funcionen de
forma fluida en la sección `.car-showcase` (scrub por scroll con `currentTime`).

---

## 1. Por qué un video normal se ve entrecortado al hacer scroll

Los navegadores solo pueden hacer **seek** a los **keyframes** (fotogramas
independientes) de un video. Entre keyframes, el navegador debe decodificar
todos los fotogramas intermedios desde el keyframe anterior.

Un video grabado típicamente tiene keyframes cada **5–10 segundos**
(120–250 fotogramas a 24 fps). Cada pulso de scroll obliga a decodificar
cientos de fotogramas → saltos y gel.

| Factor | ¿Afecta a la fluidez del scrub? |
|---|---|
| Espaciado de keyframes (GOP) | ✅ Causa real del problema |
| Peso / tamaño del archivo | ❌ No afecta directamente; sí la carga y el buffer |

**Conclusión:** un video HD de 40 MB con keyframe en cada frame será fluido.
Un video de 5 MB con keyframes cada 10 s seguirá entrecortado.

## 2. Los keyframes los decide quien comprime, no quien graba

La cámara o el teléfono del cliente no configura esto. Al grabar, el
dispositivo ya comprime con su codificador interno (con keyframes espaciados),
pero **siempre se vuelve a comprimir el archivo antes de subirlo a la web**.
En esa segunda compresión sí se eligen los keyframes.

```
Cliente graba (cualquier cámara/teléfono, máxima calidad)
        ↓
Entrega el archivo (.mp4, .mov, lo que sea)
        ↓
Se transcodifica para web (receta ffmpeg, ver §3)
        ↓
Se sube la versión optimizada a WordPress
```

El cliente **puede grabar sin preocuparse por nada**. El truco está
siempre en el paso de transcodificación.

## 3. Receta de optimización (ffmpeg)

```bash
# Receta con prioridad de nitidez (1080p nativo, sin escalar):
ffmpeg -i entrada.mov -an -c:v libx264 -pix_fmt yuv420p \
  -crf 23 -preset slow -g 1 -keyint_min 1 -sc_threshold 0 \
  -movflags +faststart salida.mp4

# Variante ligera (solo si el peso es un problema):
# añadir -vf "scale=1280:-2" y subir el CRF a 25
```

| Parámetro | Función |
|---|---|
| `-g 1 -keyint_min 1 -sc_threshold 0` | Keyframe en **cada** fotograma (lo mágico del scrub fluido) |
| *(sin `-vf scale`)* | Conserva la resolución nativa → máxima nitidez |
| `-crf 23` | Calidad: menor número = mejor y más peso (21–28 rango útil; **21–23 = nítido**) |
| `-movflags +faststart` | Cabecera al inicio del archivo; empieza a decodificar antes |
| `-an` | Sin audio (no aporta en scrub) |

**Puntos de calidad/tamaño observados en pruebas** (prioridad: nitidez):

- **1080p nativo, CRF 21 ≈ 58 MB** ← configuración actual de `video/car.mp4`;
  SSIM 0.98 respecto al original (visiblemente idéntico). Prioriza nitidez.
- 1080p all-intra CRF 23 ≈ 40–45 MB (default de los `.bat`; casi igual de nítido, algo más ligero)
- 720p all-intra CRF 25 ≈ 18 MB (solo si el peso es un problema real; se nota algo de suavizado en detalles finos)

> **Regla de oro de nitidez**: si el peso no es un problema, mantener
> **1080p nativo (sin escalar) con CRF 21–23**. Bajar la resolución es lo
> que más se percibe como "borroso"; subir el CRF se percibe mucho menos.
> Reducir 1080p → 720p ahorra ~60 % de peso pero cuesta detalle fino en
> llantas, rejillas y texturas.

## 4. Herramientas para optimizar sin terminal

### Shutter Encoder (recomendada, gratis)

1. Arrastrar el video a la aplicación.
2. Elegir *H.264*.
3. En *Advanced settings* poner **Keyframes = 1** ← lo importante.
4. **Calidad (RF) = 21–23** (prioridad nitidez). Conformar: **vacío** si el
   origen ya es 1080p, o ancho máx. 1920 si es 4K. No bajar a 1280 salvo
   que el peso sea un problema real (ver §3, regla de oro).
5. Audio → **Disable**.
6. Exportar y subir ese archivo a WordPress.

### HandBrake ⚠️

La interfaz gráfica de HandBrake **no expone el intervalo de keyframes**
(limitación conocida; solo disponible en su modo CLI). Exportar con HandBrake
normal produce keyframes cada ~10 s y el problema persiste. **No es la opción
gráfica adecuada** para este caso.

### Script `.bat` de arrastre y soltar (la más cómoda a diario) ✅ implementada

Herramienta lista en **`herramientas/optimizar-video/`**:

| Archivo | Función |
|---|---|
| `optimizar-video-dual.bat` | **Windows — recomendado** genera `<nombre>-1080p.mp4` + `<nombre>-720p.mp4` en una sola pasada (CRF 23, all-intra) |
| `optimizar-video-dual.command` | **macOS — recomendado** misma función dual; descarga ffmpeg portátil según arquitectura |
| `optimizar-video-1080p.bat` | Windows — solo HD (ancho máx. 1920 px, CRF 23) |
| `optimizar-video-720p.bat` | Windows — solo ligero (ancho máx. 1280 px, CRF 23) |
| `optimizar-video.command` | macOS — solo HD |
| `descargar-ffmpeg.ps1` | Descarga ffmpeg portátil en Windows la primera vez (~90 MB, una sola vez) |
| `LEEME.txt` | Instrucciones para el cliente (Windows y Mac) |
| `ffmpeg/` | Carpeta donde queda el ffmpeg portátil tras la primera ejecución |

El flujo dual encaja con el patrón de servir 1080p a escritorio y 720p a
móvil (`<source media>` en el HTML del bloque).

Uso: arrastrar uno o varios videos sobre el `.bat`; crea
`<nombre>-optimizado.mp4` junto al original. Probado de extremo a extremo:
un video de prueba con keyframes cada 2 s salió con los 144 frames como
keyframes (scrub fluido garantizado). La carpeta es portable: se copia a
cualquier Windows sin instalar nada.

## 5. Integración con WordPress + ACF (opción futura)

Si en lugar de optimizar a mano se quisiera automatizar al subir al bloque ACF:

```
Cliente sube video (campo ACF del bloque)
        ↓
Hook (acf/save_post o wp_handle_upload) intercepta la subida
        ↓
PHP lanza ffmpeg en el servidor
        ↓
Genera versión optimizada en /uploads/optimized/
        ↓
El bloque usa la versión optimizada; el original queda de respaldo
```

Consideraciones críticas:

- **ffmpeg debe estar en el hosting** (VPS/Docker sí; hosting compartido
  normalmente no, o `shell_exec` está deshabilitado). Verificar antes de
  prometer la feature.
- **Timeouts**: transcender en la petición de guardado puede romper el
  guardado. Usar cola en background (Action Scheduler / WP Background
  Processing) y un meta `video_status = procesando | listo`.
- **Fallback**: si la versión optimizada aún no existe, el bloque se muestra
  estático (`.car-showcase--static`, video en pausa) — ya implementado en
  `js/car-showcase.js`.

**Alternativas si el hosting no permite ffmpeg:** Mux / Cloudflare Stream /
Bunny Stream (API externa, con coste), botón manual "Optimizar" en wp-admin,
o el flujo manual con `.bat` / Shutter Encoder descrito arriba.

## 6. Flujo de trabajo recomendado (producción)

```
Cliente graba en máxima calidad
        ↓
Se arrastra el archivo sobre optimizar-video.bat (o Shutter Encoder)
        ↓
Se sube la versión optimizada al bloque ACF en WordPress
        ↓
El bloque hace scrub fluido, sin nada especial en el servidor
```

## 7. Recomendaciones finales

1. Pedir a los clientes grabación a **máxima calidad y frame-rate constante**
   (24–30 fps). De ahí se baja; lo contrario (subir calidad) no se puede.
2. Mantener el original (`car-source.mp4` en este proyecto) como respaldo.
3. Recargar con **Ctrl+F5** tras sustituir un video para evitar la caché.
4. Si aun con all-intra el scrub se siente lento, revisar que el servidor
   sirva el video con soporte de rangos (`Accept-Ranges: bytes`) para que los
   seeks parciales funcionen.
