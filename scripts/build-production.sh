#!/usr/bin/env bash
set -euo pipefail

: "${VITE_API_URL:=https://steppe-navigator.kz}"
export VITE_API_URL

echo "Building production frontend with VITE_API_URL=${VITE_API_URL}"
npm run build
