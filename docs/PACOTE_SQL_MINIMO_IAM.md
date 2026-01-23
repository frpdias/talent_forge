# Pacote SQL mínimo — IAM (remoto)

Objetivo: aplicar somente o necessário para a camada IAM + leitura de DISC no dashboard.

## Ordem de execução (SQL Editor)

1. IAM Core (tabelas e RLS mínima)
- [supabase/migrations/20260122_iam_core.sql](../supabase/migrations/20260122_iam_core.sql)

2. Leitura DISC por recrutador (RLS)
- [supabase/migrations/20260122_fix_org_read_disc_results.sql](../supabase/migrations/20260122_fix_org_read_disc_results.sql)

## Observações
- Não inclui scripts de dados específicos nem backfills extensos.
- Após aplicar, validar endpoints `/api/v1/tenants`, `/api/v1/roles`, `/api/v1/permissions`, `/api/v1/policies`.
- Se o DISC ainda não aparecer, aplicar o pacote completo de backfills na sequência combinada.
