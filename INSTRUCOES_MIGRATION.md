# Instruções para Aplicar Migration de Perfil de Candidato

## Passo a Passo

### 1. Acessar o Supabase Dashboard
1. Acesse [https://supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione o projeto **TalentForge** (`fjudsjzfnysaztcwlwgm`)

### 2. Executar a Migration SQL
1. No menu lateral, clique em **SQL Editor**
2. Clique em **+ New query**
3. Abra o arquivo `/supabase/migrations/20241212_candidate_profiles.sql`
4. Copie TODO o conteúdo do arquivo
5. Cole no editor SQL do Supabase
6. Clique em **Run** (ou pressione Ctrl/Cmd + Enter)

### 3. Criar Bucket de Storage para Currículos

Ainda no SQL Editor, execute o seguinte código:

```sql
-- Criar bucket para currículos
insert into storage.buckets (id, name, public) 
values ('resumes', 'resumes', false);

-- Políticas de acesso ao storage
create policy "Users can upload their own resume"
  on storage.objects for insert
  with check (
    bucket_id = 'resumes' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read their own resume"
  on storage.objects for select
  using (
    bucket_id = 'resumes' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own resume"
  on storage.objects for update
  using (
    bucket_id = 'resumes' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own resume"
  on storage.objects for delete
  using (
    bucket_id = 'resumes' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 4. Verificar se deu certo

Execute este SQL para verificar:

```sql
-- Verificar tabelas criadas
select table_name 
from information_schema.tables 
where table_schema = 'public' 
and table_name in ('candidate_profiles', 'candidate_education', 'candidate_experience');

-- Verificar bucket criado
select * from storage.buckets where id = 'resumes';
```

Você deve ver as 3 tabelas listadas e 1 linha do bucket.

## O que foi criado?

### Tabelas

1. **candidate_profiles** - Perfil principal do candidato
   - Dados pessoais (nome, CPF, telefone, cidade, estado)
   - Dados profissionais (cargo, área, senioridade, pretensão salarial)
   - Controle de onboarding (step atual, % completude)
   - Link para currículo

2. **candidate_education** - Formação acadêmica
   - Múltiplas formações por candidato
   - Grau, curso, instituição, anos

3. **candidate_experience** - Experiências profissionais
   - Múltiplas experiências por candidato
   - Empresa, cargo, período, descrição

### Storage Bucket

- **resumes** - Armazenamento de currículos em PDF/DOC
  - Cada usuário só acessa seus próprios arquivos
  - Organizado por user_id

### Segurança (RLS)

Todas as tabelas têm Row Level Security habilitado:
- Usuários só veem/editam seus próprios dados
- Políticas baseadas em `auth.uid()`

## Próximos Passos

Após executar a migration:

1. Reinicie o servidor de desenvolvimento:
```bash
npm run dev
```

2. Teste o fluxo completo:
   - Registre-se como candidato em `/register?type=candidate`
   - Complete o onboarding em 5 etapas
   - Verifique o dashboard em `/candidate`

## Troubleshooting

### Erro: "relation already exists"
- Algumas tabelas já existem, ignore este erro

### Erro: "bucket already exists"
- O bucket já foi criado anteriormente, ignore

### Erro de permissão
- Certifique-se de estar logado como owner do projeto Supabase

## Estrutura do Fluxo

```
Registro → Email confirmado → Login → Onboarding (5 steps) → Dashboard Candidato
```

### Etapas do Onboarding:
1. 📋 Dados Pessoais (nome, CPF, email, telefone, cidade)
2. 💼 Dados Profissionais (cargo, área, senioridade, pretensão, disponibilidade)
3. 🎓 Formação Acadêmica (grau, curso, instituição) - Múltiplas
4. 📝 Experiências (empresa, cargo, período, descrição) - Múltiplas
5. 📄 Upload de Currículo (opcional, PDF/DOC)

## Validações Implementadas

- ✅ CPF válido com algoritmo verificador
- ✅ Email formato correto
- ✅ Telefone com máscara (00) 00000-0000
- ✅ Campos obrigatórios em cada step
- ✅ Salvamento progressivo (pode sair e voltar depois)
- ✅ Barra de progresso visual
- ✅ Upload limitado a 5MB

## Features Especiais

- **Botão "Mais +"** para adicionar múltiplas formações/experiências
- **Checkbox "Cursando/Trabalho atualmente"** desabilita data final
- **Máscaras automáticas** em CPF e telefone
- **Salvamento automático** a cada step
- **Responsive design** mobile-first
- **Validação em tempo real**
