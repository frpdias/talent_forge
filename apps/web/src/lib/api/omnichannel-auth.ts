import { NextRequest } from 'next/server';
import { getServiceSupabase } from './auth';

export type OmnichannelRole = 'recrutador' | 'gestor' | 'admin';

export interface OmnichannelContext {
  orgId: string;
  role: OmnichannelRole;
}

const VALID_ROLES: OmnichannelRole[] = ['recrutador', 'gestor', 'admin'];

const ROLE_PERMISSIONS: Record<string, OmnichannelRole[]> = {
  'GET /vagas': ['recrutador', 'gestor', 'admin'],
  'GET /candidatos/busca': ['recrutador', 'gestor', 'admin'],
  'POST /entrevistas': ['recrutador', 'gestor', 'admin'],
  'POST /candidatos/etapa': ['gestor', 'admin'],
  'GET /relatorios/funil': ['recrutador', 'gestor', 'admin'],
};

type AuthSuccess = { context: OmnichannelContext };
type AuthError = { error: string; status: number };

export async function validateOmnichannelRequest(
  request: NextRequest
): Promise<AuthSuccess | AuthError> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Authorization header ausente ou inválido', status: 401 };
  }

  const apiKey = authHeader.replace('Bearer ', '').trim();
  const roleHeader = request.headers.get('x-app-role');
  const role: OmnichannelRole = VALID_ROLES.includes(roleHeader as OmnichannelRole)
    ? (roleHeader as OmnichannelRole)
    : 'recrutador';

  const supabase = getServiceSupabase();
  const { data, error } = await supabase.rpc('validate_omnichannel_key', { p_key: apiKey });

  if (error || !data || data.length === 0) {
    return { error: 'Token inválido', status: 401 };
  }

  const { org_id, valid } = data[0];
  if (!valid) {
    return { error: 'Token revogado', status: 401 };
  }

  return { context: { orgId: org_id, role } };
}

export function checkPermission(role: OmnichannelRole, permissionKey: string): boolean {
  return ROLE_PERMISSIONS[permissionKey]?.includes(role) ?? false;
}
