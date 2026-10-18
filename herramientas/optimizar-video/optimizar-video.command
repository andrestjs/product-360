#!/bin/bash
# ============================================================
#  Optimizador de video para web (scrub fluido) — macOS
#  Arrastra uno o varios videos sobre este archivo.
#  Crea junto a cada uno un "<nombre>-optimizado.mp4" con
#  keyframe en cada fotograma y calidad HD (CRF 23, sin escalar).
# ============================================================

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FFMPEG_DIR="$SCRIPT_DIR/ffmpeg"
FFMPEG="$FFMPEG_DIR/ffmpeg"
CRF=23

echo ""
echo "=== Optimizador de video para el sitio web (macOS) ==="

# --- Buscar ffmpeg: portable primero, luego el del sistema ---
if [ ! -x "$FFMPEG" ]; then
  if command -v ffmpeg >/dev/null 2>&1; then
    FFMPEG="$(command -v ffmpeg)"
  else
    echo ""
    echo "  Primera vez que se usa esta herramienta."
    echo "  Se descargara ffmpeg portatil junto a este archivo (~75 MB)..."
    ARCH="$(uname -m)"
    case "$ARCH" in
      arm64)   FFMPEG_URL="https://github.com/eugeneware/ffmpeg-static/releases/download/b6.0/ffmpeg-darwin-arm64" ;;
      x86_64)  FFMPEG_URL="https://github.com/eugeneware/ffmpeg-static/releases/download/b6.0/ffmpeg-darwin-x64" ;;
      *) echo "  ERROR: arquitectura no soportada: $ARCH"; exit 1 ;;
    esac
    mkdir -p "$FFMPEG_DIR"
    curl -L -o "$FFMPEG" "$FFMPEG_URL"
    chmod +x "$FFMPEG"
    if [ ! -x "$FFMPEG" ]; then
      echo ""
      echo "  ERROR: no se pudo descargar ffmpeg. Comprueba tu conexion."
      echo ""
      read -r -p "  Pulsa Enter para cerrar... " _
      exit 1
    fi
    echo "  ffmpeg listo."
  fi
fi

# --- Sin archivos arrastrados: mostrar instrucciones ---
if [ $# -eq 0 ]; then
  echo ""
  echo "  USO: arrastra uno o varios videos sobre este archivo."
  echo "  El resultado sera \"<nombre>-optimizado.mp4\" junto al original."
  echo ""
  read -r -p "  Pulsa Enter para cerrar... " _
  exit 0
fi

# --- Procesar cada archivo arrastrado ---
for ENTRADA in "$@"; do
  if [ ! -f "$ENTRADA" ]; then continue; fi
  DIR="$(dirname "$ENTRADA")"
  BASE="$(basename "$ENTRADA")"
  NOMBRE="${BASE%.*}"
  SALIDA="$DIR/$NOMBRE-optimizado.mp4"
  echo ""
  echo "  Procesando: $BASE"
  "$FFMPEG" -y -v error -stats -i "$ENTRADA" -an \
    -c:v libx264 -profile:v high -pix_fmt yuv420p \
    -crf "$CRF" -preset slow \
    -g 1 -keyint_min 1 -sc_threshold 0 \
    -movflags +faststart "$SALIDA"
  if [ $? -eq 0 ]; then
    echo "  Listo: $NOMBRE-optimizado.mp4"
  else
    echo "  ERROR al procesar $BASE (se omite)."
  fi
done

echo ""
echo "  Proceso finalizado."
read -r -p "  Pulsa Enter para cerrar... " _
