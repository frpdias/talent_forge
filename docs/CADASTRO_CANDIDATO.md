# 🎯 Sistema de Cadastro Completo de Candidatos - TalentForge

## ✅ O que foi implementado

### 1. 📊 Banco de Dados (Supabase)

Criado arquivo de migration: [`/supabase/migrations/20241212_candidate_profiles.sql`](../supabase/migrations/20241212_candidate_profiles.sql)

**Novas Tabelas:**

#### `candidate_profiles` - Perfil Principal
- **Dados Pessoais:**
  - Nome completo
  - CPF (único, com validação)
  - Email
  - Telefone (com máscara)
  - Data de nascimento
  - Cidade e Estado

- **Dados Profissionais:**
  - Cargo atual
  - Área de atuação
  - Nível de senioridade (8 opções)
  - Pretensão salarial (opcional)
  - Tipos de contratação (CLT, PJ, Estágio, etc.) - Múltipla escolha

- **Controle de Cadastro:**
  - `onboarding_completed` (boolean)
  - `onboarding_step` (1-5, para retomar de onde parou)
  - `profile_completion_percentage` (0-100%)

- **Currículo:**
  - `resume_url` (link do arquivo)
  - `resume_filename` (nome original)

#### `candidate_education` - Formação Acadêmica
- Grau de escolaridade (8 níveis)
- Nome do curso
- Instituição
- Ano início/término
- Flag "cursando atualmente"
- **Múltiplos registros** por candidato (botão "+")

#### `candidate_experience` - Experiências Profissionais
- Nome da empresa
- Cargo
- Data início/término (mês/ano)
- Flag "trabalho aqui atualmente"
- Descrição das atividades
- **Múltiplos registros** por candidato (botão "+")

### 2. 🎨 Interface de Onboarding (Wizard Multi-Step)

Arquivo: [`/apps/web/src/app/(candidate)/onboarding/page.tsx`](../apps/web/src/app/(candidate)/onboarding/page.tsx)

**5 Etapas Visuais:**

```
┌─────────────────────────────────────────────────────────────┐
│  [●]────[●]────[●]────[○]────[○]                           │
│   1      2      3      4      5                              │
│ Dados  Prof.  Form.  Exp.  Curríc.                          │
└─────────────────────────────────────────────────────────────┘
```

#### Step 1: Dados Pessoais 👤
- Nome completo *
- CPF * (formato automático: 000.000.000-00)
- Email *
- Telefone * (formato automático: (00) 00000-0000)
- Data de nascimento *
- Cidade * + Estado * (dropdown UF)

**Validações:**
- CPF com algoritmo verificador completo
- Email regex padrão
- Campos obrigatórios
- Data válida

#### Step 2: Dados Profissionais 💼
- Cargo atual *
- Área de atuação *
- Nível de senioridade * (dropdown):
  - Estagiário
  - Júnior
  - Pleno
  - Sênior
  - Tech Lead
  - Gerente
  - Diretor
  - C-Level
- Pretensão salarial (opcional, apenas número)
- Disponibilidade * (multi-select com botões):
  - CLT
  - PJ
  - Estágio
  - Freelancer
  - Cooperado

**Validações:**
- Pelo menos 1 tipo de contratação selecionado
- Todos campos obrigatórios preenchidos

#### Step 3: Formação Acadêmica 🎓
- Lista dinâmica de formações
- **Botão "+ Adicionar"** para múltiplas formações
- **Botão "X"** para remover (mínimo 1)

**Cada formação:**
- Grau de escolaridade * (dropdown):
  - Ensino Fundamental
  - Ensino Médio
  - Técnico
  - Graduação
  - Pós-Graduação
  - Mestrado
  - Doutorado
  - MBA
- Nome do curso *
- Instituição *
- Ano de início
- Ano de conclusão (desabilitado se "Cursando")
- ☑ Cursando atualmente

**Validações:**
- Pelo menos 1 formação completa
- Anos válidos (1950-2030)

#### Step 4: Experiência Profissional 📝
- Lista dinâmica de experiências
- **Botão "+ Adicionar"** para múltiplas experiências
- **Botão "X"** para remover (mínimo 1)

**Cada experiência:**
- Nome da empresa *
- Cargo *
- Data de início * (mês/ano)
- Data de término (desabilitado se "Trabalho aqui")
- ☑ Trabalho aqui atualmente
- Descrição das atividades (textarea, 4 linhas)

**Validações:**
- Pelo menos 1 experiência completa
- Datas válidas

#### Step 5: Upload de Currículo 📄
- Área de drag & drop
- **Opcional** (pode pular)
- Formatos aceitos: PDF, DOC, DOCX
- Tamanho máximo: 5MB
- Preview do nome do arquivo
- Botão "Remover arquivo"

**Validações:**
- Tamanho < 5MB
- Extensão permitida

### 3. 🔄 Fluxo de Navegação

```
Registro → Confirmação Email → Login → Onboarding → Dashboard Candidato
   ↓                              ↓          ↓
[type=candidate]            [callback]  [5 steps]
```

**Arquivos Atualizados:**

1. **[`/apps/web/src/app/(auth)/register/page.tsx`](../apps/web/src/app/(auth)/register/page.tsx)**
   - Mantém `user_type` nos metadados do Supabase Auth
   - Redirect para callback após confirmação

2. **[`/apps/web/src/app/auth/callback/page.tsx`](../apps/web/src/app/auth/callback/page.tsx)** (NOVO)
   - Verifica tipo de usuário
   - Se candidato → verifica se completou onboarding
   - Redireciona para `/candidate/onboarding` ou `/candidate`

3. **[`/apps/web/src/app/(auth)/login/page.tsx`](../apps/web/src/app/(auth)/login/page.tsx)**
   - Atualizado para usar mesma lógica de redirect
   - Verifica `candidate_profiles.onboarding_completed`

### 4. ✨ Features Implementadas

#### Salvamento Progressivo
- Cada step salva automaticamente ao clicar "Próximo"
- Usuário pode sair e voltar depois
- Retoma do último step salvo (`onboarding_step`)
- Carrega dados já preenchidos

#### Validações em Tempo Real
- CPF: Formatação automática + verificação de dígitos
- Telefone: Máscara (00) 00000-0000
- Email: Regex padrão
- Campos obrigatórios com mensagens claras
- Estados brasileiros (27 UFs)

#### UX/UI
- **Barra de progresso** visual com % exato
- **Stepper horizontal** com ícones
- **Indicadores visuais:**
  - ✓ Verde para steps concluídos
  - ● Azul escuro para step atual
  - ○ Cinza para steps pendentes
- **Botões de navegação:**
  - "Voltar" (desabilitado no step 1)
  - "Próximo" (steps 1-4)
  - "Concluir Cadastro" (step 5, verde)
- **Loading states** com spinner
- **Mensagens de erro** em destaque vermelho
- **Responsive design** mobile-first

#### Gerenciamento Dinâmico
- **Formações:** Adicionar/remover ilimitadas (mín. 1)
- **Experiências:** Adicionar/remover ilimitadas (mín. 1)
- IDs únicos por item (timestamp)
- Cards visuais com fundo diferenciado

### 5. 🔐 Segurança (RLS)

Todas as tabelas protegidas:
- Usuário só acessa seus próprios dados
- Policies baseadas em `auth.uid()`
- Storage com pastas isoladas por user_id

### 6. 📱 Responsividade

**Mobile First:**
- Grid adaptativo (1 col → 2 cols → 3 cols)
- Stepper compacto em mobile (apenas ícones)
- Formulários empilham em telas pequenas
- Botões full-width em mobile
- Espaçamentos fluidos (text-fluid-*)

**Breakpoints:**
- `sm:` 640px+
- `lg:` 1024px+

## 🚀 Como Usar

### 1. Aplicar Migration no Supabase

**Siga as instruções em:** [`INSTRUCOES_MIGRATION.md`](../INSTRUCOES_MIGRATION.md)

Resumo:
1. Acesse Supabase Dashboard
2. SQL Editor → New Query
3. Cole o conteúdo de `20241212_candidate_profiles.sql`
4. Execute (Run)
5. Execute o código do storage bucket
6. Verifique se criou as 3 tabelas + bucket

### 2. Testar Localmente

```bash
# Já está rodando em:
npm run dev

# Acesse:
http://localhost:3000/register?type=candidate
```

### 3. Fluxo de Teste

1. **Registro:**
   - Acesse: `http://localhost:3000/register?type=candidate`
   - Use email **real** (Gmail, Outlook, etc.)
   - Senha: mínimo 6 caracteres
   - Confirme email (verifique caixa de entrada)

2. **Login:**
   - Faça login com as credenciais
   - Sistema detecta que é candidato
   - Redireciona para onboarding automaticamente

3. **Onboarding:**
   - Complete os 5 steps
   - Teste adicionar múltiplas formações/experiências
   - Teste voltar e avançar
   - Opcional: faça upload de currículo PDF

4. **Dashboard:**
   - Após concluir, vai para `/candidate`
   - Dashboard já existe com vagas e candidaturas

### 4. Verificar no Banco

No Supabase → Table Editor:

```sql
-- Ver perfil criado
SELECT * FROM candidate_profiles;

-- Ver formações
SELECT * FROM candidate_education;

-- Ver experiências
SELECT * FROM candidate_experience;

-- Ver arquivos
SELECT * FROM storage.objects WHERE bucket_id = 'resumes';
```

## 🎨 Screenshots (Estrutura)

### Onboarding Step 1
```
┌────────────────────────────────────────┐
│  Complete seu perfil                  │
│  Preencha suas informações...         │
│                                        │
│  [●]─[○]─[○]─[○]─[○]  40%            │
│                                        │
│  👤 Dados Pessoais                     │
│  ┌──────────────────────────────────┐ │
│  │ Nome completo *                  │ │
│  │ [________________]               │ │
│  │                                  │ │
│  │ CPF *          Nasc. *           │ │
│  │ [000.000.000-00] [____]          │ │
│  │                                  │ │
│  │ Email *        Telefone *        │ │
│  │ [____]         [(00) 00000-0000] │ │
│  │                                  │ │
│  │ Cidade *              Estado *   │ │
│  │ [________________]    [UF ▼]     │ │
│  └──────────────────────────────────┘ │
│                                        │
│  [◄ Voltar]            [Próximo ►]    │
└────────────────────────────────────────┘
```

### Onboarding Step 3 (Múltiplas Formações)
```
┌────────────────────────────────────────┐
│  🎓 Formação Acadêmica  [+ Adicionar]  │
│                                        │
│  ┌─ Formação 1 ──────────────── [X] ─┐│
│  │ Grau: [Graduação ▼]               ││
│  │ Curso: [Ciência da Computação]    ││
│  │ Instituição: [USP]                ││
│  │ Início: [2018] Fim: [2022]        ││
│  │ ☐ Cursando atualmente             ││
│  └────────────────────────────────────┘│
│                                        │
│  ┌─ Formação 2 ──────────────── [X] ─┐│
│  │ Grau: [MBA ▼]                     ││
│  │ Curso: [Gestão de Projetos]       ││
│  │ ...                               ││
│  └────────────────────────────────────┘│
│                                        │
│  [◄ Voltar]            [Próximo ►]    │
└────────────────────────────────────────┘
```

## 📋 Checklist de Requisitos

### ✅ Requisitos Funcionais

- [x] Cadastro dividido em etapas (wizard/stepper)
- [x] Salvamento progressivo
- [x] **Dados pessoais**
  - [x] Nome completo
  - [x] CPF
  - [x] E-mail
  - [x] Telefone (com máscara)
  - [x] Data de nascimento
  - [x] Cidade e estado
- [x] **Dados profissionais**
  - [x] Cargo atual
  - [x] Área de atuação
  - [x] Nível de senioridade
  - [x] Pretensão salarial (opcional)
  - [x] Disponibilidade (CLT, PJ, estágio, etc.)
- [x] **Formação acadêmica**
  - [x] Grau de escolaridade
  - [x] Curso
  - [x] Instituição
  - [x] Ano de conclusão
  - [x] **Múltiplas formações** (botão +)
- [x] **Experiência profissional**
  - [x] Empresa
  - [x] Cargo
  - [x] Período
  - [x] Descrição das atividades
  - [x] **Múltiplas experiências** (botão +)
- [x] **Anexos**
  - [x] Upload de currículo (PDF/DOC)
  - [x] Validação de tamanho (máx. 5MB)

### ✅ Comportamento e UX

- [x] Validações em tempo real
  - [x] CPF com algoritmo verificador
  - [x] E-mail regex
  - [x] Campos obrigatórios
- [x] Barra de progresso indicando avanço
- [x] Possibilidade de salvar rascunho
- [x] Possibilidade de continuar depois
- [x] Feedback visual claro de erros
- [x] Feedback visual de sucesso
- [x] Interface limpa e corporativa
- [x] Design SaaS B2B
- [x] Totalmente responsivo

### ✅ Banco de Dados

- [x] Tabelas criadas no Supabase
- [x] RLS habilitado
- [x] Policies de segurança
- [x] Storage bucket configurado
- [x] Relacionamentos corretos

### ✅ Navegação

- [x] Redirect após registro
- [x] Detecção de tipo de usuário
- [x] Onboarding apenas para candidatos
- [x] Skip onboarding se já completo
- [x] Dashboard após conclusão

## 🎯 Próximos Passos Sugeridos

1. **Email de Boas-Vindas**
   - Enviar após conclusão do onboarding
   - Template personalizado

2. **Edição de Perfil**
   - Página para editar dados depois
   - Reutilizar componentes do onboarding

3. **Busca de Vagas**
   - Filtros por área, senioridade, salário
   - Match score com perfil

4. **Candidaturas**
   - Aplicar para vagas
   - Tracking de status

5. **Analytics**
   - Taxa de conclusão do onboarding
   - Steps com mais abandono
   - Tempo médio por step

## 🐛 Troubleshooting

### "Table already exists"
- Normal se já rodou migration antes
- Pode ignorar

### "Failed to fetch" no cadastro
- Verificar se migration foi aplicada
- Verificar conexão com Supabase
- Verificar se projeto não está pausado

### Não redireciona após login
- Limpar cache do browser (Ctrl+Shift+R)
- Verificar console do navegador
- Conferir se `user_metadata.user_type` está setado

### Upload não funciona
- Verificar se criou bucket "resumes"
- Verificar policies do storage
- Conferir tamanho do arquivo (< 5MB)

## 📚 Documentação Técnica

### Tipos TypeScript

```typescript
type SeniorityLevel = 'estagiario' | 'junior' | 'pleno' | 'senior' | 
                      'lead' | 'gerente' | 'diretor' | 'c-level';

type DegreeLevel = 'ensino_fundamental' | 'ensino_medio' | 'tecnico' | 
                   'graduacao' | 'pos_graduacao' | 'mestrado' | 
                   'doutorado' | 'mba';

type EmploymentType = 'CLT' | 'PJ' | 'Estágio' | 'Freelancer' | 'Cooperado';
```

### Funções Principais

- `validateCPF(cpf: string)` - Algoritmo completo de validação
- `formatCPF(value: string)` - Máscara 000.000.000-00
- `formatPhone(value: string)` - Máscara (00) 00000-0000
- `validateStep()` - Validação por step
- `saveStep()` - Persistência incremental
- `handleFinish()` - Upload + conclusão

### Estados do Componente

- `currentStep` - Step atual (1-5)
- `personalData` - Objeto com dados step 1
- `professionalData` - Objeto com dados step 2
- `educations` - Array de formações
- `experiences` - Array de experiências
- `resumeFile` - Arquivo selecionado
- `loading` - Estado de carregamento
- `error` - Mensagem de erro
- `profileId` - ID do perfil no banco

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique o console do navegador (F12)
2. Verifique logs do Supabase
3. Confira se migration foi aplicada corretamente
4. Teste com usuário novo (email diferente)

---

**Desenvolvido com ❤️ para TalentForge - FO Consulting**
