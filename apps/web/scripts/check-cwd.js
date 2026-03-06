#!/usr/bin/env node
/**
 * Proteção contra execução de `next dev` fora do diretório apps/web.
 * 
 * O Next.js usa o cwd para localizar o diretório `app/` ou `pages/`.
 * Se executado da raiz do monorepo, falha com:
 *   "Couldn't find any `pages` or `app` directory"
 *
 * Este script é chamado via `predev` no package.json e bloqueia a execução
 * antes que o Next.js tente iniciar.
 *
 * Incidente: 2026-03-02 — Documentado na Arquitetura Canônica.
 */

const path = require('path');
const fs = require('fs');

const cwd = process.cwd();
const appDir = path.join(cwd, 'src', 'app');
const packageJson = path.join(cwd, 'package.json');

// Verifica se o diretório src/app existe no cwd atual
if (!fs.existsSync(appDir)) {
  console.error('\n\x1b[31m╔══════════════════════════════════════════════════════════════╗');
  console.error('║  ❌ ERRO: next dev executado fora de apps/web!              ║');
  console.error('║                                                              ║');
  console.error('║  O diretório src/app/ não foi encontrado no cwd atual:       ║');
  console.error(`║  ${cwd.substring(0, 58).padEnd(58)} ║`);
  console.error('║                                                              ║');
  console.error('║  Use um dos comandos corretos:                               ║');
  console.error('║    npm run dev:web          (da raiz do monorepo)            ║');
  console.error('║    cd apps/web && npm run dev  (direto no workspace)         ║');
  console.error('║                                                              ║');
  console.error('║  📖 Docs: docs/ARQUITETURA_CANONICA.md → Troubleshooting    ║');
  console.error('╚══════════════════════════════════════════════════════════════╝\x1b[0m\n');
  process.exit(1);
}

// Verifica se o package.json é o de apps/web (name === 'tf-web')
try {
  const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
  if (pkg.name !== 'tf-web') {
    console.error('\n\x1b[31m╔══════════════════════════════════════════════════════════════╗');
    console.error('║  ❌ ERRO: next dev executado no package.json errado!        ║');
    console.error(`║  Encontrado: "${(pkg.name || 'unknown').substring(0, 44).padEnd(44)}" ║`);
    console.error('║  Esperado:   "tf-web"                                       ║');
    console.error('║                                                              ║');
    console.error('║  Use: npm run dev:web (da raiz do monorepo)                 ║');
    console.error('╚══════════════════════════════════════════════════════════════╝\x1b[0m\n');
    process.exit(1);
  }
} catch {
  // Se não conseguir ler o package.json, o first check já pegou
}
