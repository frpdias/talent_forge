# Supabase

## Aplicar schema e RLS
1) Crie o projeto no Supabase.  
2) No SQL Editor ou CLI, rode na ordem:
   - `docs/data-model.sql`
   - `docs/rls-policies.sql`
3) Confirme que RLS está ON em todas as tabelas.

## CLI (exemplo)
```bash
# instalar supabase cli se não tiver (requer rede):
# brew install supabase/tap/supabase

# setar envs
export SUPABASE_ACCESS_TOKEN=...
export SUPABASE_DB_PASSWORD=...

# aplicar migrations locais
supabase db push --file docs/data-model.sql
supabase db push --file docs/rls-policies.sql
```

## Buckets
- Criar buckets: `cv` e `videos` (privados).
- Padrão de path: `org_id/{resource}/{uuid}.ext` (ex.: `org_id/cv/{candidateId}.pdf`).

## Service role
- Guarde a `SERVICE_ROLE_KEY` para o backend realizar tarefas administrativas (migrations, cron). Evite expor no frontend.
