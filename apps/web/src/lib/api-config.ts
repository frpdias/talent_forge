/**
 * Configuração centralizada da URL da API.
 * Anteriormente apontava para NestJS (localhost:3001), agora usa rotas
 * Next.js API Routes locais (/api/v1) que são mais estáveis.
 * Em produção, as API routes são servidas pelo mesmo domínio do frontend.
 */
export const API_BASE_URL = '';

export const API_V1_URL = `${API_BASE_URL}/api/v1`;
