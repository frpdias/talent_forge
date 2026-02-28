/**
 * Configuração centralizada da URL da API NestJS.
 * Em produção, define NEXT_PUBLIC_API_BASE_URL no Vercel.
 * Em desenvolvimento local, usa http://localhost:3001 por padrão.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export const API_V1_URL = `${API_BASE_URL}/api/v1`;
