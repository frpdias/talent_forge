import { test, expect } from '@playwright/test';

/**
 * FASE 2 — E2E: Páginas públicas de autenticação
 * Testa que login e register renderizam corretamente sem credenciais.
 */

test('login page renders with email and password fields', async ({ page }) => {
  await page.goto('/login');

  // A página deve carregar sem erro 500
  await expect(page).not.toHaveURL(/500|error/);

  // Deve ter campos de email e senha
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
  const passwordInput = page.locator('input[type="password"]');

  await expect(emailInput.first()).toBeVisible();
  await expect(passwordInput.first()).toBeVisible();
});

test('register page renders with registration form', async ({ page }) => {
  await page.goto('/register');

  await expect(page).not.toHaveURL(/500|error/);

  // Pelo menos um campo de email deve existir
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
  await expect(emailInput.first()).toBeVisible();
});
