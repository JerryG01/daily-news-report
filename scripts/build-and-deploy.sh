#!/bin/bash
# build-and-deploy.sh
# Vite 构建后，将 public/ 下的 JSON 和 SVG 复制到 report/（构建输出目录）
# Cloudflare Pages 服务 report/ 目录，因此所有静态资源必须在这里

set -euo pipefail

cd "$(dirname "$0")/.."

echo "[build] Running vite build..."
npm run build

echo "[build] Copying public assets to report/..."
cp public/*.json report/ 2>/dev/null || true
cp public/*.svg report/ 2>/dev/null || true

echo "[build] Done. report/ contents:"
ls -la report/
