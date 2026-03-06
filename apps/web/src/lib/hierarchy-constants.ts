// apps/web/src/lib/hierarchy-constants.ts
// Hierarquia Corporativa - N1 a N11 (TalentForge Framework)
// Fonte: talent_forge_framework_unificado.json

export interface HierarchyLevel {
  code: string;
  name: string;
  order: number;
  description: string;
}

export const HIERARCHY_LEVELS: HierarchyLevel[] = [
  { code: 'N1', name: 'Conselho de Administração', order: 1, description: 'Governança estratégica' },
  { code: 'N2', name: 'Presidência', order: 2, description: 'Alta direção executiva' },
  { code: 'N3', name: 'C-Level', order: 3, description: 'Diretoria executiva (CEO, CFO, CTO)' },
  { code: 'N4', name: 'Diretoria', order: 4, description: 'Direção de áreas' },
  { code: 'N5', name: 'Gerência', order: 5, description: 'Gestão tática' },
  { code: 'N6', name: 'Coordenação', order: 6, description: 'Coordenação operacional' },
  { code: 'N7', name: 'Especialista', order: 7, description: 'Expertise técnica avançada' },
  { code: 'N8', name: 'Analista', order: 8, description: 'Execução e análise' },
  { code: 'N9', name: 'Assistente', order: 9, description: 'Suporte operacional' },
  { code: 'N10', name: 'Auxiliar', order: 10, description: 'Apoio operacional' },
  { code: 'N11', name: 'Estagiário', order: 11, description: 'Aprendizado e desenvolvimento' },
];

export const SENIORITY_LEVELS = [
  { code: 'Júnior', name: 'Júnior', description: 'Início de carreira (0-2 anos)' },
  { code: 'Pleno', name: 'Pleno', description: 'Experiência intermediária (2-5 anos)' },
  { code: 'Sênior', name: 'Sênior', description: 'Experiência avançada (5+ anos)' },
  { code: 'I', name: 'Nível I', description: 'Primeiro nível' },
  { code: 'II', name: 'Nível II', description: 'Segundo nível' },
  { code: 'III', name: 'Nível III', description: 'Terceiro nível' },
];

export const CAREER_TRACKS = [
  { code: 'gestao', name: 'Gestão (Y-Esquerda)', description: 'Trilha de liderança e gestão' },
  { code: 'tecnica', name: 'Técnica (Y-Direita)', description: 'Trilha de especialização técnica' },
];

// Departamentos por nível hierárquico
export const DEPARTMENTS_BY_LEVEL: Record<string, string[]> = {
  'N1': ['Conselho', 'Presidência', 'Diretoria Executiva'],
  'N2': ['Conselho', 'Presidência', 'Diretoria Executiva'],
  'N3': ['Conselho', 'Presidência', 'Diretoria Executiva'],
  'N4': [
    'Administrativo',
    'Financeiro',
    'Recursos Humanos',
    'Tecnologia',
    'Comercial',
    'Marketing',
    'Operações',
    'Jurídico',
    'Compliance',
  ],
  'N5': [
    'Administrativo',
    'Financeiro',
    'Recursos Humanos',
    'Tecnologia',
    'Comercial',
    'Marketing',
    'Operações',
    'Jurídico',
    'Compliance',
  ],
  'N6': [
    'Administrativo',
    'Financeiro',
    'Recursos Humanos',
    'Tecnologia',
    'Comercial',
    'Marketing',
    'Operações',
    'Atendimento',
    'Suporte',
    'Qualidade',
    'Logística',
    'Compras',
    'Produto',
  ],
  'N7': [
    'Administrativo',
    'Financeiro',
    'Recursos Humanos',
    'Tecnologia',
    'Comercial',
    'Marketing',
    'Operações',
    'Atendimento',
    'Suporte',
    'Qualidade',
    'Logística',
    'Compras',
    'Produto',
  ],
  'N8': [
    'Administrativo',
    'Financeiro',
    'Recursos Humanos',
    'Tecnologia',
    'Comercial',
    'Marketing',
    'Operações',
    'Atendimento',
    'Suporte',
    'Qualidade',
    'Logística',
    'Compras',
    'Produto',
  ],
  'N9': [
    'Operações',
    'Atendimento',
    'Suporte',
    'Logística',
    'Produção',
    'Manutenção',
    'Administrativo',
  ],
  'N10': [
    'Operações',
    'Atendimento',
    'Suporte',
    'Logística',
    'Produção',
    'Manutenção',
    'Administrativo',
  ],
  'N11': [
    'Operações',
    'Atendimento',
    'Suporte',
    'Logística',
    'Produção',
    'Manutenção',
    'Administrativo',
  ],
};

// Helper: Obter departamentos para um nível
export function getDepartmentsByLevel(hierarchyLevel: string): string[] {
  return DEPARTMENTS_BY_LEVEL[hierarchyLevel] || [];
}

// Helper: Obter nível por código
export function getHierarchyLevel(code: string): HierarchyLevel | undefined {
  return HIERARCHY_LEVELS.find((level) => level.code === code);
}

// Helper: Verificar se um nível pode ser gestor de outro
export function canBeManager(managerLevel: string, employeeLevel: string): boolean {
  const manager = HIERARCHY_LEVELS.find((l) => l.code === managerLevel);
  const employee = HIERARCHY_LEVELS.find((l) => l.code === employeeLevel);
  
  if (!manager || !employee) return false;
  
  // Gestor deve ter ordem MENOR (nível superior)
  return manager.order < employee.order;
}
