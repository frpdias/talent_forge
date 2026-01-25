# STATUS DO PROJETO - Sprint 5: Sistema de Notas

**Atualizado em:** 24 de janeiro de 2026, 15:45  
**Sprint Atual:** Sprint 5 - Sistema de Notas com Contexto

---

## 🎯 OBJETIVO ATUAL

Implementar sistema de notas contextual para recrutadores avaliarem candidatos, com 3 abas (Perfil, Currículo, Testes) e painel lateral para anotações em cada contexto.

---

## ✅ COMPLETO

### Backend (100%)
- ✅ **Migration SQL** `20260124_enhanced_notes_system.sql`
  - Enum `note_context` (profile, resume, assessments, interview, general)
  - Campo `context` na tabela `candidate_notes`
  - Campo `updated_at` com trigger automático
  - View `v_candidate_notes_enriched` com join de autor
  - Function `get_candidate_notes_with_context()`
  - RLS policies atualizadas

- ✅ **API NestJS** `/candidates/:id/notes`
  - POST - Criar nota com context
  - GET - Listar notas (filtro por context opcional)
  - PATCH - Atualizar nota
  - DELETE - Excluir nota
  - Validação de ownership (autor)
  - Verificação de org membership
  - DTOs com context field

- ✅ **lib/api.ts** - Métodos cliente
  - `candidates.getNotes(id, token, orgId, context?)`
  - `candidates.createNote(id, data, token, orgId)`
  - `candidates.updateNote(candidateId, noteId, data, token, orgId)`
  - `candidates.deleteNote(candidateId, noteId, token, orgId)`

### Frontend - Estrutura (90%)
- ✅ **Dialog Modal** com 3 tabs (Perfil, Currículo, Testes)
- ✅ **NotesPanel Component** (Design System compliant)
  - Palette oficial: `var(--tf-warning)`, `var(--border)`
  - Componentes: Card, CardHeader, Button (shadcn/ui)
  - Estados: loading, saving, editing
  - CRUD completo (add, edit, delete)
  - Indicador "(editado)" quando nota modificada
  - Empty state com ilustração
- ✅ **Layout 2/3 + 1/3** - Conteúdo principal + NotesPanel lateral
- ✅ **Autenticação** - Token e orgId via Supabase
- ✅ **Context Switching** - NotesPanel muda conforme aba ativa

---

## ⚠️ PROBLEMAS ATUAIS (BLOQUEADORES)

### 🔴 CRÍTICO 1: Candidatos sem `owner_org_id`
**Erro:** `"Candidate not found"` na API de notas

**Causa Raiz:**  
Backend (`candidates.service.ts` linha 90) valida:
```typescript
.eq('owner_org_id', orgId)
```

Mas alguns candidatos foram criados **sem** `owner_org_id`, causando falha na query.

**Solução:**  
Execute `DEBUG_CANDIDATES_NOTES.sql` no Supabase SQL Editor:
```sql
-- Corrigir candidates sem owner_org_id
UPDATE candidates
SET owner_org_id = (
  SELECT id FROM organizations WHERE status = 'active' LIMIT 1
),
updated_at = NOW()
WHERE owner_org_id IS NULL;
```

### 🔴 CRÍTICO 2: Candidatos sem `user_id`
**Erro:** Testes PI e Color não aparecem

**Logs Console:**
```
[loadCandidateDetails] Sem user_id, pulando testes de cores
[loadCandidateDetails] Sem user_id, pulando testes PI
```

**Causa Raiz:**  
Queries de `color_assessments` e `pi_assessments` usam:
```typescript
.eq('candidate_user_id', candidate.user_id)
```

Mas `candidate.user_id` está **NULL** para alguns registros.

**Solução:**  
Execute `FIX_CANDIDATE_USER_ID.sql` no Supabase SQL Editor:
```sql
-- Popular user_id usando auth.users
UPDATE candidates c
SET user_id = u.id,
    updated_at = NOW()
FROM auth.users u
WHERE c.user_id IS NULL
  AND c.email = u.email;

-- Popular user_id usando candidate_profiles
UPDATE candidates c
SET user_id = cp.user_id,
    updated_at = NOW()
FROM candidate_profiles cp
WHERE c.user_id IS NULL
  AND c.email = cp.email
  AND cp.user_id IS NOT NULL;
```

---

## 🔧 DEBUGGING EM ANDAMENTO

### Logs Implementados

**Frontend (`page.tsx`):**
```typescript
[loadCandidateDetails] Carregando dados do candidato: { id, user_id, email }
[loadCandidateDetails] Profiles por email: X
[loadCandidateDetails] Experiências: X
[loadCandidateDetails] Educação: X
[loadCandidateDetails] Testes DISC: X
[loadCandidateDetails] Testes de Cores: X (ou "Sem user_id")
[loadCandidateDetails] Testes PI: X (ou "Sem user_id")
[loadCandidateDetails] Total de testes combinados: X
```

**NotesPanel (`NotesPanel.tsx`):**
```typescript
[NotesPanel] useEffect triggered: { candidateId, context, token, orgId }
[NotesPanel] Token obtido
[NotesPanel] User ID: xxx
[NotesPanel] Org ID obtido: xxx
[NotesPanel] Loading notes: { candidateId, context, orgId }
[NotesPanel] Loaded notes: [...]
[NotesPanel] Adding note: { candidateId, context, noteLength }
[NotesPanel] Note created successfully
```

### Como Verificar
1. Abra DevTools (F12) → Console
2. Clique em "Ver Detalhes" de um candidato
3. Procure por erros:
   - ❌ `[NotesPanel] Failed to load notes: Candidate not found` → Problema owner_org_id
   - ❌ `Sem user_id, pulando testes de cores/PI` → Problema user_id NULL
   - ✅ `[NotesPanel] Loaded notes: [...]` → API funcionando

---

## 📋 PRÓXIMOS PASSOS (ORDEM DE EXECUÇÃO)

### 1. EXECUTAR SQLs (URGENTE)
```bash
# No Supabase SQL Editor:
1. Abrir DEBUG_CANDIDATES_NOTES.sql
2. Executar queries 1-6 sequencialmente
3. Verificar output: "X candidatos atualizados"

4. Abrir FIX_CANDIDATE_USER_ID.sql
5. Executar queries 1-6 sequencialmente
6. Verificar: "X candidatos com user_id"
```

### 2. TESTAR SISTEMA DE NOTAS
- [ ] Recarregar página (F5)
- [ ] Abrir modal de candidato
- [ ] Verificar console sem erros
- [ ] Adicionar nota na aba "Perfil"
- [ ] Adicionar nota na aba "Currículo"
- [ ] Adicionar nota na aba "Testes"
- [ ] Editar uma nota
- [ ] Excluir uma nota
- [ ] Verificar persistência (reabrir modal)

### 3. VALIDAR DADOS COMPLETOS
- [ ] Currículo mostra todas experiências
- [ ] Currículo mostra toda educação
- [ ] Aba Testes mostra:
  - [ ] Teste DISC (2 resultados esperados)
  - [ ] Teste das 5 Cores (se candidato fez)
  - [ ] TF-PI Comportamental (se candidato fez)
- [ ] Cores e PI mostram detalhes:
  - [ ] Color: círculo colorido + cor primária/secundária
  - [ ] PI: resumo do perfil + fator dominante
  - [ ] DISC: pontuação com barra de progresso

### 4. FEATURES PENDENTES (PÓS-FIX)
- [ ] **Status Management**
  - Dropdown para mudar status (applied → in_process → hired/rejected)
  - Endpoint PATCH `/applications/:id/status`
  - Log em `application_events`
  
- [ ] **Teste Details Enhancement**
  - DISC: mostrar scores D/I/S/C individuais
  - Color: mostrar percentuais de todas as 5 cores
  - PI: mostrar gráfico de 4 fatores (Direção, Energia, Ritmo, Estrutura)
  
- [ ] **Performance**
  - Loading skeleton durante fetch
  - Error boundaries se Supabase falhar
  - Optimistic updates nas notas (UI instant, sync depois)
  
- [ ] **UX Improvements**
  - Cache de candidateDetails para evitar re-fetch
  - Animação de transição entre tabs
  - Toast notifications (sucesso/erro) em vez de alert()

---

## 📊 MÉTRICAS DE PROGRESSO

| Componente | Status | % |
|------------|--------|---|
| **Backend API** | ✅ Completo | 100% |
| **SQL Migration** | ✅ Aplicada | 100% |
| **NotesPanel UI** | ✅ Completo | 100% |
| **Modal Layout** | ✅ Completo | 100% |
| **Data Loading** | ⚠️ Bug user_id | 75% |
| **API Integration** | ⚠️ Bug owner_org_id | 80% |
| **Design System** | ✅ Compliant | 100% |
| **Status Manager** | ⏳ Não iniciado | 0% |
| **Test Details** | ⏳ Básico implementado | 40% |
| **TOTAL SPRINT 5** | | **82%** |

---

## 🐛 BUGS CONHECIDOS

### Alta Prioridade
1. **owner_org_id NULL** - Bloqueia API de notas ❌
2. **user_id NULL** - Bloqueia testes Color/PI ❌

### Média Prioridade
3. Loading infinito se candidato não tem profile ⚠️
4. Error não tratado se Supabase query falha ⚠️
5. Alert() genérico em vez de toast notification ⚠️

### Baixa Prioridade
6. Sem validação de tamanho máximo de nota 📝
7. Sem rate limiting no backend 📝
8. Sem paginação de notas (lista completa sempre) 📝

---

## 🔍 VALIDATION CHECKLIST

### Antes de Considerar Sprint 5 Completa
- [ ] Zero erros no console ao abrir modal
- [ ] Todas as 3 abas carregam dados completos
- [ ] NotesPanel salva e carrega notas em cada contexto
- [ ] Edit/delete funcionando sem erros
- [ ] Testes PI/DISC/Color aparecem (se existirem)
- [ ] Design 100% conforme ARQUITETURA_CANONICA.md
- [ ] Todos SQLs executados sem erros
- [ ] `owner_org_id` populado em 100% dos candidatos
- [ ] `user_id` populado em candidatos com auth

---

## 📞 SUPORTE

**Se encontrar erro "Candidate not found":**
1. Verificar console: qual `candidateId` está sendo usado?
2. No Supabase SQL Editor:
   ```sql
   SELECT id, full_name, owner_org_id FROM candidates WHERE id = 'SEU_ID';
   ```
3. Se `owner_org_id` for NULL → executar `DEBUG_CANDIDATES_NOTES.sql`

**Se testes não aparecem:**
1. Verificar console: "Sem user_id"?
2. No Supabase SQL Editor:
   ```sql
   SELECT id, full_name, user_id FROM candidates WHERE email = 'CANDIDATO@EMAIL';
   ```
3. Se `user_id` for NULL → executar `FIX_CANDIDATE_USER_ID.sql`

**Logs úteis:**
- Frontend: `apps/web/src/app/(dashboard)/dashboard/candidates/page.tsx` linha 79+
- NotesPanel: `apps/web/src/components/candidates/NotesPanel.tsx` linha 59+
- Backend: Terminal onde `npm run dev` está rodando

---

## 📄 ARQUIVOS RELACIONADOS

### SQL (executar na ordem)
1. `supabase/migrations/20260124_enhanced_notes_system.sql` ✅ Aplicada
2. `supabase/DEBUG_CANDIDATES_NOTES.sql` ⏳ Aguardando execução
3. `supabase/FIX_CANDIDATE_USER_ID.sql` ⏳ Aguardando execução

### Backend
- `apps/api/src/candidates/candidates.service.ts` (linhas 198-245: notes methods)
- `apps/api/src/candidates/candidates.controller.ts` (endpoints de notas)
- `apps/api/src/candidates/dto/` (DTOs)

### Frontend
- `apps/web/src/components/candidates/NotesPanel.tsx` ✅ Completo
- `apps/web/src/app/(dashboard)/dashboard/candidates/page.tsx` ⚠️ Bug data loading
- `apps/web/src/lib/api.ts` (linhas 148-172: métodos de notas)

---

## 🎨 DESIGN SYSTEM COMPLIANCE

### Cores Oficiais (NÃO ALTERAR)
```css
--tf-primary: #141042     /* Roxo escuro */
--tf-accent: #3B82F6      /* Azul */
--tf-success: #10B981     /* Verde */
--tf-warning: #F59E0B     /* Laranja/Amarelo */
--tf-error: #EF4444       /* Vermelho */
--border: #E5E5DC         /* Borda padrão */
```

### Componentes Permitidos
- ✅ Card, CardHeader, CardTitle, CardDescription, CardContent
- ✅ Button (variants: primary, secondary, success, destructive)
- ✅ Badge
- ✅ Dialog, DialogContent, DialogHeader, DialogTitle
- ✅ Tabs, TabsList, TabsTrigger, TabsContent
- ❌ Custom divs com classes tailwind arbitrárias
- ❌ Cores fora da palette oficial

### Tipografia
- Font: Montserrat (via `var(--font-montserrat)`)
- Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

---

**ÚLTIMA AÇÃO:** Corrigidos SQLs (removidos caracteres UTF-8), aguardando execução pelo usuário e teste do sistema de notas.
