import React from 'react';
import { healthApi } from '@/lib/api';

async function getStatus() {
  try {
    const [root, health] = await Promise.all([healthApi.root(), healthApi.health()]);
    return { ok: true, root, health };
  } catch (error: any) {
    return { ok: false, error: error?.message || 'Erro ao consultar API' };
  }
}

export default async function ApiTestPage() {
  const result = await getStatus();

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Teste de API</h1>
      {result.ok ? (
        <div className="space-y-2">
          <pre className="bg-gray-900 text-gray-100 p-4 rounded">
            {JSON.stringify(result.root, null, 2)}
          </pre>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded">
            {JSON.stringify(result.health, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="text-red-500">Falha: {result.error}</div>
      )}
    </main>
  );
}
