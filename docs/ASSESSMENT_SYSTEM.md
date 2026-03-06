# Sistema de Assessments DISC - Documentação

## 📋 O que foi criado

### 1. **Database (Supabase)**
- Migration: `20241213_assessment_system_disc.sql`
- Tabelas:
  - `assessments` - Avaliações principais
  - `disc_assessments` - Resultados DISC detalhados
  - `disc_questions` - 24 perguntas DISC
  - `disc_responses` - Respostas do candidato
  - `assessment_invitations` - Convites para avaliações

### 2. **Páginas do Candidato**

#### `/disc` - Teste DISC
- Interface interativa com 24 perguntas
- Progress bar
- Navegação entre perguntas
- Cálculo automático de scores (D, I, S, C)
- Salva respostas no banco de dados

#### `/disc-results/[id]` - Resultados Personalizados
- Mostra perfil principal (D, I, S ou C)
- Gráficos de distribuição de scores
- Pontos fortes específicos do perfil
- Áreas de desenvolvimento
- Estilo de trabalho e comunicação
- Perfil secundário
- Opção de download/impressão

### 3. **Páginas do Recrutador**

#### `/dashboard/assessments` - Dashboard de Assessments
- Busca de candidatos por nome/email/tipo de teste
- Lista de todas as avaliações com status
- Card com scores DISC resumidos
- Botão "Ver Detalhes" para abrir análise completa
- Botão "Baixar Relatório"
- Botão "Enviar Convite" para novo candidato

#### `/dashboard/candidates/[id]/results` - Detalhes do Candidato
- Informações completas do candidato
- Todos os dados DISC detalhados
- Comparação visual de scores
- Histórico de todas as avaliações
- Download do relatório completo

#### `/dashboard/reports/disc` - Dashboard de Relatórios
- Total de avaliações realizadas
- Distribuição de perfis (D, I, S, C)
- Gráficos de percentuais
- Análise de dinâmica de equipe
- Insights automáticos
- Recomendações baseadas nos dados
- Impressão de relatório

### 4. **Modal de Convites**
- Componente reutilizável: `InviteAssessmentModal`
- Integrado no dashboard de assessments
- Criação automática de candidatos
- Geração de token único
- Validade de 30 dias
- Envio por email (preparado para integração)

## 🚀 Como Implementar

### Passo 1: Executar Migration no Supabase

1. Acesse: https://supabase.com/dashboard/project/fjudsjzfnysaztcwlwgm/sql/new
2. Copie todo o conteúdo de [20241213_assessment_system_disc.sql](supabase/migrations/20241213_assessment_system_disc.sql)
3. Cole no SQL Editor
4. Execute

### Passo 2: Verificar Componentes de UI

Os componentes usados:
- `@/components/ui/card`
- `@/components/ui/button`
- `@/components/ui/input`
- `@/components/ui/progress`
- `@/components/ui/dialog`

Se não tiver alguns deles, execute:
```bash
cd apps/web
npm install
```

### Passo 3: Testar o Sistema

#### Como Candidato:
1. Faça login em http://localhost:3000/login
2. Vá para http://localhost:3000/disc
3. Responda as 24 perguntas
4. Veja seus resultados em `/disc-results/[assessment-id]`

#### Como Recrutador:
1. Crie uma conta de recrutador
2. Acesse http://localhost:3000/dashboard/assessments
3. Clique "Enviar Convite" para convidar candidatos
4. Visualize resultados conforme os candidatos completarem
5. Acesse relatórios em http://localhost:3000/dashboard/reports/disc

## 📊 Estrutura DISC

### Os 4 Perfis:
- **D (Dominância)**: Líder, direto, focado em resultados
- **I (Influência)**: Entusiasmado, sociável, inspirador
- **S (Estabilidade)**: Cooperativo, confiável, paciente
- **C (Consciência)**: Detalhista, qualidade, lógico

### Scoring:
- 24 perguntas, cada uma com 4 opções (D, I, S, C)
- Cada resposta = 1 ponto no perfil escolhido
- Normalizado para percentual (0-100%)
- Perfil primário = maior score
- Perfil secundário = segundo maior score

## 🔐 Segurança

### RLS Policies:
- Candidatos veem apenas suas próprias avaliações
- Recrutadores veem apenas candidatos de sua organização
- Convites são protegidos por token
- Avaliações não podem ser alteradas após conclusão

## 📧 Próximos Passos (Para Integrar)

1. **Envio de Email:**
   - Integrar Resend ou SendGrid
   - Template para convite com link único
   - Notificação quando avaliação é concluída

2. **Mais Testes:**
   - MBTI (Myers-Briggs)
   - Testes Técnicos
   - Big Five

3. **Relatórios Avançados:**
   - Comparação entre candidatos
   - Tendências ao longo do tempo
   - Análise de compatibilidade de equipe

4. **Mobile:**
   - Responsivo já está implementado
   - Pode ser convertido para app nativo

## 📱 Responsividade

Todos os componentes são responsivos:
- Desktop (1024px+)
- Tablet (768px-1023px)
- Mobile (< 768px)

## 🎨 Customização

### Cores dos Perfis:
```tsx
D = Vermelho (#EF4444)
I = Amarelo (#FBBF24)
S = Verde (#22C55E)
C = Azul (#3B82F6)
```

## 🔗 URLs Principais

- Teste: `/disc`
- Resultados: `/disc-results/[id]`
- Dashboard Recruiter: `/dashboard/assessments`
- Detalhes Candidato: `/dashboard/candidates/[id]/results`
- Relatórios: `/dashboard/reports/disc`

## ✅ Checklist Final

- [ ] Migration executada no Supabase
- [ ] Componentes de UI instalados
- [ ] Servidores rodando (npm run dev)
- [ ] Testar como candidato
- [ ] Testar como recrutador
- [ ] Verificar RLS policies
- [ ] Configurar envio de email
- [ ] Fazer backup do banco

---

**Criado em:** 13 de dezembro de 2025  
**Status:** ✅ Pronto para uso
