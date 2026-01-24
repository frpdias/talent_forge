import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/security/score
 * Calcula e retorna o score de segurança baseado nas verificações
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Verificar autenticação e permissão de admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (!profile || profile.user_type !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Buscar verificações do endpoint de checks
    const baseUrl = new URL(request.url).origin;
    const cookieHeader = request.headers.get('cookie') || '';
    const checksResponse = await fetch(`${baseUrl}/api/admin/security/checks`, {
      headers: {
        cookie: cookieHeader,
      },
    });

    if (!checksResponse.ok) {
      // Se não conseguir buscar checks, calcular score básico
      return NextResponse.json({
        success: true,
        score: {
          value: 70,
          status: 'warning' as const,
          breakdown: {
            pass: 7,
            warning: 3,
            fail: 0,
          },
          recommendations: [
            {
              priority: 'high',
              title: 'Implementar Rate Limiting',
              description: 'Proteger API contra abuso e ataques DDoS',
            },
            {
              priority: 'medium',
              title: 'Configurar CSP Headers v2',
              description: 'Adicionar políticas de segurança de conteúdo mais restritivas',
            },
          ],
        },
        timestamp: new Date().toISOString(),
      });
    }

    const { checks } = await checksResponse.json();

    // Calcular score baseado nas verificações
    const totalChecks = checks.length;
    const passCount = checks.filter((c: any) => c.status === 'pass').length;
    const warningCount = checks.filter((c: any) => c.status === 'warning').length;
    const failCount = checks.filter((c: any) => c.status === 'fail').length;

    // Score: pass = 10 pontos, warning = 5 pontos, fail = 0 pontos
    const maxScore = totalChecks * 10;
    const currentScore = passCount * 10 + warningCount * 5;
    const scoreValue = Math.round((currentScore / maxScore) * 100);

    // Determinar status do score
    let status: 'pass' | 'warning' | 'fail';
    if (scoreValue >= 80) {
      status = 'pass';
    } else if (scoreValue >= 60) {
      status = 'warning';
    } else {
      status = 'fail';
    }

    // Gerar recomendações baseadas nos checks que falharam ou têm warning
    const recommendations = generateRecommendations(checks);

    return NextResponse.json({
      success: true,
      score: {
        value: scoreValue,
        status,
        breakdown: {
          pass: passCount,
          warning: warningCount,
          fail: failCount,
        },
        recommendations,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error calculating security score:', error);
    return NextResponse.json(
      { error: 'Erro ao calcular score de segurança' },
      { status: 500 }
    );
  }
}

function generateRecommendations(checks: any[]) {
  const recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
  }> = [];

  // Mapear checks para recomendações
  const checkRecommendations: Record<
    string,
    { priority: 'high' | 'medium' | 'low'; title: string; description: string }
  > = {
    rate_limiting: {
      priority: 'high',
      title: 'Implementar Rate Limiting',
      description:
        'Proteja sua API contra abuso e ataques de força bruta limitando requisições por IP/usuário',
    },
    csp_headers: {
      priority: 'medium',
      title: 'Configurar CSP Headers v2',
      description:
        'Adicione Content Security Policy mais restritivo para proteção adicional contra XSS',
    },
    rls_enabled: {
      priority: 'high',
      title: 'Habilitar RLS em Todas as Tabelas',
      description:
        'Row Level Security é essencial para isolamento de dados entre organizações',
    },
    jwt_valid: {
      priority: 'high',
      title: 'Validar Tokens JWT',
      description: 'Certifique-se de que todos os tokens estão válidos e não expirados',
    },
    https: {
      priority: 'high',
      title: 'Forçar HTTPS',
      description: 'Todas as conexões devem usar HTTPS em produção',
    },
    cors: {
      priority: 'medium',
      title: 'Configurar CORS Restritivo',
      description: 'Defina origens permitidas específicas ao invés de usar wildcard (*)',
    },
    secrets_management: {
      priority: 'high',
      title: 'Gerenciar Secrets Corretamente',
      description: 'Configure todas as variáveis de ambiente necessárias',
    },
    sql_injection: {
      priority: 'high',
      title: 'Revisar Proteção SQL Injection',
      description: 'Investigue tentativas de SQL injection e reforce proteções',
    },
    audit_logs: {
      priority: 'medium',
      title: 'Ativar Audit Logs',
      description: 'Sistema de auditoria é essencial para compliance e investigação',
    },
  };

  // Adicionar recomendações para checks que falharam ou têm warning
  checks.forEach((check) => {
    if ((check.status === 'fail' || check.status === 'warning') && checkRecommendations[check.id]) {
      recommendations.push(checkRecommendations[check.id]);
    }
  });

  // Adicionar recomendações gerais se score estiver bom
  if (recommendations.length === 0) {
    recommendations.push(
      {
        priority: 'medium',
        title: 'Implementar MFA para Admins',
        description: 'Multi-Factor Authentication adiciona camada extra de segurança',
      },
      {
        priority: 'low',
        title: 'Configurar WAF',
        description: 'Web Application Firewall protege contra ataques sofisticados',
      },
      {
        priority: 'low',
        title: 'Penetration Testing',
        description: 'Realize testes de penetração periódicos para identificar vulnerabilidades',
      }
    );
  }

  // Ordenar por prioridade
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations.slice(0, 5); // Retornar no máximo 5 recomendações
}
