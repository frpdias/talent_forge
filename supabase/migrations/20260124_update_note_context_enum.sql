-- ATUALIZAR ENUM note_context
-- Garante que o banco aceite todas as categorias de notas usadas no Frontend

-- Adiciona valores se não existirem (Safe for Postgres 12+)
ALTER TYPE note_context ADD VALUE IF NOT EXISTS 'profile';
ALTER TYPE note_context ADD VALUE IF NOT EXISTS 'resume';
ALTER TYPE note_context ADD VALUE IF NOT EXISTS 'assessments';
ALTER TYPE note_context ADD VALUE IF NOT EXISTS 'interview';
ALTER TYPE note_context ADD VALUE IF NOT EXISTS 'general';

-- Verificar valores finais
SELECT enum_range(NULL::note_context);