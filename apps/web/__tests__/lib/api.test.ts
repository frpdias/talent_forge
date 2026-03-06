/**
 * Testes unitários para lib/api.ts — apiFetch
 * Cobre: headers, auth, timeout, erros HTTP
 */

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock api-config para URL fixa
jest.mock('@/lib/api-config', () => ({
  API_V1_URL: 'http://localhost:3001/api/v1',
}));

import { apiFetch } from '@/lib/api';

function makeResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
  };
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('apiFetch', () => {
  it('envia Content-Type: application/json por padrão', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, { ok: true }));
    await apiFetch('/test');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/v1/test',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      })
    );
  });

  it('adiciona Authorization header quando token fornecido', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, {}));
    await apiFetch('/test', { token: 'my-token' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer my-token' }),
      })
    );
  });

  it('adiciona x-org-id header quando orgId fornecido', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, {}));
    await apiFetch('/test', { orgId: 'org-123' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ 'x-org-id': 'org-123' }),
      })
    );
  });

  it('retorna dados parseados em resposta 200', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, { id: '1', name: 'Test' }));
    const result = await apiFetch<{ id: string; name: string }>('/test');
    expect(result).toEqual({ id: '1', name: 'Test' });
  });

  it('lança erro com mensagem do body em resposta 4xx', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(401, { message: 'Não autenticado' }));
    await expect(apiFetch('/test')).rejects.toThrow('Não autenticado');
  });

  it('lança erro genérico em resposta 500 sem body message', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(500, {}));
    await expect(apiFetch('/test')).rejects.toThrow(/HTTP error! status: 500/);
  });

  it('lança "Request timed out" em AbortError', async () => {
    mockFetch.mockRejectedValueOnce(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
    await expect(apiFetch('/test')).rejects.toThrow('Request timed out');
  });

  it('repropaga outros erros de rede', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));
    await expect(apiFetch('/test')).rejects.toThrow('Network failure');
  });
});
