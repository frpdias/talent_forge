import { test, expect } from '@playwright/test';

/**
 * FASE 2 — E2E: Proteção de rotas autenticadas
 * Usuário não autenticado deve ser redirecionado para login.
 */

test('dashboard redirects unauthenticated users to login', async ({ page }) => {
  const response = await page.goto('/dashboard');

  // Deve ter redirecionado para /login
  expect(page.url()).toContain('/login');

  // Status final deve ser 200 (a página de login carregou)
  expect(response?.status() ?? 200).toBeLessThan(400);
});

test('admin redirects unauthenticated users to login', async ({ page }) => {
  await page.goto('/admin');

  // Deve ter redirecionado para /login
  expect(page.url()).toContain('/login');
});
