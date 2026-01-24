/**
 * Testes para API de Audit Logs
 * Prioridade: P3
 */

import { POST } from '@/app/api/admin/audit-logs/route';
import { NextRequest } from 'next/server';

describe('/api/admin/audit-logs', () => {
  describe('POST', () => {
    it('should reject unauthenticated requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/audit-logs', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create',
          resource: 'user',
          metadata: { userId: '123' }
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/audit-logs', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
        }),
      });

      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });
});
