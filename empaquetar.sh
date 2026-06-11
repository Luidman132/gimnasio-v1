#!/usr/bin/env bash
# Genera un paquete .tar.gz limpio del sistema para entregar al compañero
# que lo desplegará. Excluye secretos (.env), dependencias (node_modules),
# el historial de git y archivos temporales.
set -euo pipefail

PROY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FECHA="$(date +%Y%m%d)"
STAGE_BASE="$(mktemp -d)"
STAGE="$STAGE_BASE/gimnasio-v1"
SALIDA="$PROY_DIR/../gimnasio-v1-actualizado-${FECHA}.tar.gz"

echo "→ Copiando archivos (sin secretos ni dependencias)…"
mkdir -p "$STAGE"
rsync -a \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='build_api' \
  --exclude='.env' \
  --exclude='*.log' \
  --exclude='.DS_Store' \
  --exclude='backup_*.sql' \
  --exclude='*.bak' \
  --exclude='*.dump' \
  --exclude='empaquetar.sh' \
  "$PROY_DIR/" "$STAGE/"

echo "→ Comprimiendo…"
tar -czf "$SALIDA" -C "$STAGE_BASE" gimnasio-v1
rm -rf "$STAGE_BASE"

echo
echo "✅ Paquete listo:"
echo "   $(cd "$(dirname "$SALIDA")" && pwd)/$(basename "$SALIDA")"
echo "   Tamaño: $(du -h "$SALIDA" | cut -f1)"
echo
echo "Entrégaselo a tu compañero junto con la indicación de leer ACTUALIZAR.md"
