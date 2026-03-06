# Mapa de Implantação — IAM/Policy/Tenant (Nova Camada)

## Objetivo
Implantar a nova camada de IAM, Policy Engine e Control Plane de tenants sem interromper o ATS atual.

---

## 1) Visão de componentes
- **Auth/SSO (OIDC/MFA)**: provedor externo + integração no BFF.
- **Policy Engine (RBAC/ABAC)**: avaliação de permissões centralizada.
- **Tenant Control Plane**: orgs, planos, quotas, billing.
- **Audit/Telemetry**: logs imutáveis + integração SIEM.
- **API Gateway/WAF**: rate limit + IP allowlist.
- **Vault**: rotação de segredos.
- **LGPD**: export/delete + retention.

---

## 2) Fases de implantação (sequência segura)

### Fase 0 — Preparação
- Definir provedor OIDC (ex.: Auth0/Okta/Entra).
- Provisionar **Gateway/WAF**.
- Provisionar **Vault** e **SIEM/Logs**.
- Criar ambiente **staging** com variáveis de ambiente completas.

### Fase 1 — Base IAM + RBAC
- Criar tabelas `tenants`, `tenant_users`, `roles`, `permissions`, `role_permissions`.
- Criar `policies` (ABAC) e `api_keys`.
- Implementar endpoints MVP de tenant/roles/permissions.
- Adicionar middleware de autorização no BFF.

### Fase 2 — Audit + Security Events
- Criar `audit_logs` e `security_events`.
- Registrar eventos críticos (login, alterações de perfil, políticas, permissões).
- Integrar com SIEM (export/stream).

### Fase 3 — Gateway/WAF + Rate Limit
- Ativar rate limit por tenant/endpoint.
- IP allowlist para rotas administrativas.
- Métricas de bloqueio e alarmes.

### Fase 4 — Billing/Quotas
- Implementar quotas no Control Plane.
- Medição de consumo por tenant.
- Alertas de limite.

### Fase 5 — LGPD
- Exportar dados por tenant/usuário.
- Delete/retention com job agendado.
- Registro de auditoria para cada ação.

---

## 3) Dependências críticas
- **IAM → Policy → Audit** (ordem obrigatória).
- **Gateway/WAF** depende de políticas definidas.
- **Billing/Quotas** depende de telemetry e eventos confiáveis.
- **LGPD** depende de audit e mapeamento de dados.

---

## 4) Checklist de deploy (produção)
- [ ] Variáveis de ambiente (OIDC, Vault, SIEM, Gateway)
- [ ] Migrations aplicadas em produção
- [ ] Feature flags habilitadas (IAM/Policy)
- [ ] Testes de login, RBAC e admin console
- [ ] Monitoramento ativo (alertas e logs)

---

## 5) Rollback
- Desativar feature flags IAM/Policy
- Restaurar rotas antigas de auth
- Desabilitar enforcement do gateway

---

## 6) Itens MVP (90 dias)
- SSO + RBAC + audit básico
- Gateway + rate limit + WAF
- Console admin (tenants, users, roles)
- Logs centralizados + alertas críticos
- Vault + rotação de secrets
- LGPD (export/delete + retention)
