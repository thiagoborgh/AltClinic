#!/bin/sh
set -e

# Express API — porta 3000 (interna)
echo "Iniciando Express API na porta 3000..."
node src/server.js &
EXPRESS_PID=$!

# Aguardar Express inicializar (health check)
echo "Aguardando Express ficar disponivel..."
until curl -sf http://localhost:3000/health > /dev/null 2>&1; do
  sleep 1
done
echo "Express pronto"

# Next.js — porta 8080 (publica, PORT do fly.toml)
echo "Iniciando Next.js na porta 8080..."
cd web && PORT=8080 node_modules/.bin/next start -p 8080
