#!/usr/bin/env node
/**
 * TalentForge MCP Server
 * Entry point do Model Context Protocol — expõe tools de RH para agentes de IA
 *
 * Conforme DA: conexão direta ao Supabase via service role (NestJS API não exposta aqui)
 * Transporte: stdio (padrão MCP para integração com Claude Desktop / claude-code)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// ── Tools: Recrutamento ────────────────────────────────────────────────────
import {
  SearchCandidatesInput,
  GetPipelineStatusInput,
  MoveCandidateInput,
  GetCandidateProfileInput,
  searchCandidates,
  getPipelineStatus,
  moveCandidate,
  getCandidateProfile,
} from './tools/recruitment.js';

// ── Tools: Assessments / Comportamental ───────────────────────────────────
import {
  AnalyzeDiscProfileInput,
  CompareCandidatesInput,
  GetTeamHealthInput,
  analyzeDiscProfile,
  compareCandidates,
  getTeamHealth,
} from './tools/assessments.js';

// ── Tools: People Analytics ────────────────────────────────────────────────
import {
  GetRecruitmentMetricsInput,
  GetEmployeeListInput,
  PredictRetentionRiskInput,
  getRecruitmentMetrics,
  getEmployeeList,
  predictRetentionRisk,
} from './tools/people.js';

// ─────────────────────────────────────────────────────────────────────────────
// DEFINIÇÃO DAS TOOLS EXPOSTAS AO AGENTE
// Naming: kebab-case para o agente, camelCase internamente
// ─────────────────────────────────────────────────────────────────────────────

const TOOLS = [
  // ── Recrutamento ──────────────────────────────────────────────────────────
  {
    name: 'search-candidates',
    description:
      'Busca candidatos da organização por texto livre, tags ou localização. ' +
      'Retorna lista com dados básicos e assessments mais recentes.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        org_id: { type: 'string', format: 'uuid', description: 'UUID da organização' },
        query: { type: 'string', description: 'Texto livre: nome, skills, localização' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags para filtrar' },
        location: { type: 'string', description: 'Cidade ou estado' },
        limit: { type: 'number', description: 'Máximo de resultados (1-50, padrão 20)' },
      },
      required: ['org_id'],
    },
  },
  {
    name: 'get-pipeline-status',
    description:
      'Retorna o status do pipeline de recrutamento de uma vaga específica, ' +
      'com todos os estágios e candidatos em cada etapa.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        org_id: { type: 'string', format: 'uuid', description: 'UUID da organização' },
        job_id: { type: 'string', format: 'uuid', description: 'UUID da vaga' },
      },
      required: ['org_id', 'job_id'],
    },
  },
  {
    name: 'move-candidate',
    description:
      'Move um candidato para outro estágio do pipeline de recrutamento. ' +
      'Registra evento de auditoria automaticamente (conforme DA).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        org_id: { type: 'string', format: 'uuid', description: 'UUID da organização' },
        application_id: { type: 'string', format: 'uuid', description: 'UUID da candidatura' },
        stage_id: { type: 'string', format: 'uuid', description: 'UUID do estágio de destino' },
        notes: { type: 'string', description: 'Nota sobre a movimentação (opcional)' },
      },
      required: ['org_id', 'application_id', 'stage_id'],
    },
  },
  {
    name: 'get-candidate-profile',
    description:
      'Retorna o perfil completo de um candidato: dados pessoais, assessments, ' +
      'candidaturas e notas registradas.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        org_id: { type: 'string', format: 'uuid', description: 'UUID da organização' },
        candidate_id: { type: 'string', format: 'uuid', description: 'UUID do candidato' },
      },
      required: ['org_id', 'candidate_id'],
    },
  },

  // ── Assessments / Comportamental ──────────────────────────────────────────
  {
    name: 'analyze-disc-profile',
    description:
      'Analisa o perfil DISC de um candidato: traço primário/secundário, pontos fortes, ' +
      'pontos de atenção e interpretação comportamental completa.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        org_id: { type: 'string', format: 'uuid', description: 'UUID da organização' },
        candidate_id: { type: 'string', format: 'uuid', description: 'UUID do candidato' },
      },
      required: ['org_id', 'candidate_id'],
    },
  },
  {
    name: 'compare-candidates',
    description:
      'Compara múltiplos candidatos (2-10) por score de assessment, ranking e perfil DISC. ' +
      'Ideal para apoiar decisão de seleção entre finalistas.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        org_id: { type: 'string', format: 'uuid', description: 'UUID da organização' },
        candidate_ids: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          minItems: 2,
          maxItems: 10,
          description: 'Lista de UUIDs dos candidatos a comparar',
        },
        job_id: {
          type: 'string',
          format: 'uuid',
          description: 'UUID da vaga para comparação de fit (opcional)',
        },
      },
      required: ['org_id', 'candidate_ids'],
    },
  },
  {
    name: 'get-team-health',
    description:
      'Retorna o score de saúde de equipe/organização: score integrado PHP (TFCI + NR-1 + COPC), ' +
      'último ciclo de pesquisa e última avaliação de risco psicossocial NR-1.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        org_id: { type: 'string', format: 'uuid', description: 'UUID da organização' },
        team_id: {
          type: 'string',
          format: 'uuid',
          description: 'UUID do time (opcional — se omitido, retorna score geral da org)',
        },
      },
      required: ['org_id'],
    },
  },

  // ── People Analytics ──────────────────────────────────────────────────────
  {
    name: 'get-recruitment-metrics',
    description:
      'Retorna métricas de recrutamento do período: vagas criadas/abertas/fechadas, ' +
      'novos candidatos, candidaturas, taxa de conversão e tempo médio de contratação.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        org_id: { type: 'string', format: 'uuid', description: 'UUID da organização' },
        period_days: {
          type: 'number',
          minimum: 7,
          maximum: 365,
          description: 'Período em dias para análise (7-365, padrão 30)',
        },
      },
      required: ['org_id'],
    },
  },
  {
    name: 'get-employee-list',
    description:
      'Lista colaboradores ativos da organização com filtros opcionais por departamento ou time. ' +
      'Retorna dados básicos: nome, cargo, departamento, nível hierárquico.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        org_id: { type: 'string', format: 'uuid', description: 'UUID da organização' },
        team_id: {
          type: 'string',
          format: 'uuid',
          description: 'Filtra por time específico (opcional)',
        },
        department: { type: 'string', description: 'Filtra por departamento — busca parcial (opcional)' },
        limit: { type: 'number', description: 'Máximo de resultados (1-100, padrão 50)' },
      },
      required: ['org_id'],
    },
  },
  {
    name: 'predict-retention-risk',
    description:
      'Identifica colaboradores com risco de turnover/burnout usando scores PHP integrados ' +
      '(TFCI + NR-1 + COPC). Se não houver scores calculados, usa avaliações NR-1 como proxy.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        org_id: { type: 'string', format: 'uuid', description: 'UUID da organização' },
        employee_id: {
          type: 'string',
          format: 'uuid',
          description: 'UUID do colaborador específico (opcional — se omitido, retorna top 10 em risco)',
        },
      },
      required: ['org_id'],
    },
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// SERVIDOR MCP
// ─────────────────────────────────────────────────────────────────────────────

const server = new Server(
  {
    name: 'talentforge-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ── Handler: lista de tools disponíveis ──────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

// ── Handler: execução de tool ────────────────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: unknown;

    switch (name) {
      // ── Recrutamento ──────────────────────────────────────────────────────
      case 'search-candidates':
        result = await searchCandidates(SearchCandidatesInput.parse(args));
        break;
      case 'get-pipeline-status':
        result = await getPipelineStatus(GetPipelineStatusInput.parse(args));
        break;
      case 'move-candidate':
        result = await moveCandidate(MoveCandidateInput.parse(args));
        break;
      case 'get-candidate-profile':
        result = await getCandidateProfile(GetCandidateProfileInput.parse(args));
        break;

      // ── Assessments / Comportamental ──────────────────────────────────────
      case 'analyze-disc-profile':
        result = await analyzeDiscProfile(AnalyzeDiscProfileInput.parse(args));
        break;
      case 'compare-candidates':
        result = await compareCandidates(CompareCandidatesInput.parse(args));
        break;
      case 'get-team-health':
        result = await getTeamHealth(GetTeamHealthInput.parse(args));
        break;

      // ── People Analytics ──────────────────────────────────────────────────
      case 'get-recruitment-metrics':
        result = await getRecruitmentMetrics(GetRecruitmentMetricsInput.parse(args));
        break;
      case 'get-employee-list':
        result = await getEmployeeList(GetEmployeeListInput.parse(args));
        break;
      case 'predict-retention-risk':
        result = await predictRetentionRisk(PredictRetentionRiskInput.parse(args));
        break;

      default:
        throw new Error(`Tool desconhecida: ${name}`);
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [
        {
          type: 'text' as const,
          text: `Erro ao executar tool '${name}': ${message}`,
        },
      ],
      isError: true,
    };
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// INICIALIZAÇÃO
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Stdio transport — não logar no stdout (polui o protocolo MCP)
  process.stderr.write('TalentForge MCP server running (stdio)\n');
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
