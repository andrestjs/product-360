#!/bin/bash
# ============================================================
#  Optimizador de video dual (macOS) — HD + ligero
#  Arrastra uno o varios videos sobre este archivo.
#  Crea DOS archivos junto a cada original:
#     "<nombre>-1080p.mp4"  -> HD para escritorio (nitidez)
#     "<nombre>-720p.mp4"   -> ligero para movil
#  Ambos con keyframe en cada fotograma (scrub fluido).
# ============================================================

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FFMPEG_DIR="$SCRIPT_DIR/ffmpeg"
FFMPEG="$FFMPEG_DIR/ffmpeg"
CRF=23

echo ""
echo "=== Optimizador de video dual (macOS): HD + ligero ==="

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
  echo "  Se generaran \"<nombre>-1080p.mp4\" y \"<nombre>-720p.mp4\""
  echo "  junto al original."
  echo ""
  read -r -p "  Pulsa Enter para cerrar... " _
  exit 0
fi

# --- Procesar cada archivo arrastrado (HD + ligero en una pasada) ---
for ENTRADA in "$@"; do
  if [ ! -f "$ENTRADA" ]; then continue; fi
  DIR="$(dirname "$ENTRADA")"
  BASE="$(basename "$ENTRADA")"
  NOMBRE="${BASE%.*}"
  SALIDA_HD="$DIR/$NOMBRE-1080p.mp4"
  SALIDA_LIG="$DIR/$NOMBRE-720p.mp4"
  echo ""
  echo "  Procesando: $BASE  (HD + ligero en una sola pasada)"
  "$FFMPEG" -y -v error -stats -i "$ENTRADA" \
    -filter_complex "[0:v]split=2[vhd][vsmall];[vsmall]scale=w='min(1280,iw)':h=-2[vsmall2]" \
    -map "[vhd]" -an -c:v libx264 -profile:v high -pix_fmt yuv420p \
    -crf "$CRF" -preset slow -g 1 -keyint_min 1 -sc_threshold 0 \
    -movflags +faststart "$SALIDA_HD" \
    -map "[vsmall2]" -an -c:v libx264 -profile:v high -pix_fmt yuv420p \
    -crf "$CRF" -preset slow -g 1 -keyint_min 1 -sc_threshold 0 \
    -movflags +faststart "$SALIDA_LIG"
  if [ $? -eq 0 ]; then
    echo "  Listo: $NOMBRE-1080p.mp4  y  $NOMBRE-720p.mp4"
  else
    echo "  ERROR al procesar $BASE (se omite)."
  fi
done

echo ""
echo "  Proceso finalizado."
read -r -p "  Pulsa Enter para cerrar... " _
