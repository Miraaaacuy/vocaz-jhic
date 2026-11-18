#!/usr/bin/env bash
# Build & (re)start VocAZ on the VPS. Jalankan dari folder project: bash scripts/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "▶ Install dependencies"
npm ci

echo "▶ Migrasi database"
npx prisma migrate deploy

echo "▶ Build Next.js (standalone)"
npm run build

# standalone server tidak menyertakan folder static & public — salin manual
cp -r public .next/standalone/ 2>/dev/null || true
mkdir -p .next/standalone/.next && cp -r .next/static .next/standalone/.next/
cp .env .next/standalone/.env 2>/dev/null || true
mkdir -p logs

echo "▶ Restart PM2"
if pm2 describe vocaz >/dev/null 2>&1; then
  pm2 reload ecosystem.config.js --update-env
else
  pm2 start ecosystem.config.js
  pm2 save
fi

echo "✅ Deploy selesai. Cek: pm2 logs vocaz"
