import { test, expect } from '@playwright/test';

/**
 * FASE 2 — E2E: API Routes — autenticação obrigatória
 * Verifica que rotas protegidas retornam 401 sem token Bearer.
 */

test('GET /api/v1/php/teams returns 401 without auth', async ({ request }) => {
  const response = await request.get('/api/v1/php/teams', {
    headers: { 'x-org-id': '00000000-0000-0000-0000-000000000000' },
  });
  expect(response.status()).toBe(401);
});

test('POST /api/v1/php/employees returns 401 without auth', async ({ request }) => {
  const response = await request.post('/api/v1/php/employees', {
    data: {},
    headers: { 'x-org-id': '00000000-0000-0000-0000-000000000000' },
  });
  expect(response.status()).toBe(401);
});

test('GET /api/v1/php/nr1/invitations returns 401 without auth', async ({ request }) => {
  const response = await request.get('/api/v1/php/nr1/invitations', {
    headers: { 'x-org-id': '00000000-0000-0000-0000-000000000000' },
  });
  expect(response.status()).toBe(401);
});

test('GET /api/v1/applications returns 401 without auth (or 404 pré-deploy)', async ({ request }) => {
  const response = await request.get('/api/v1/applications', {
    headers: { 'x-org-id': '00000000-0000-0000-0000-000000000000' },
  });
  // 401 quando rota existir em produção; 404 antes do deploy da nova rota
  expect([401, 404]).toContain(response.status());
});
