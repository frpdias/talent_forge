# API MVP (NestJS)

Base: `/api/v1`. Auth: Bearer JWT (Supabase). Header: `x-org-id` obrigatório para rotas autenticadas.

## Auth / Organizations
- `POST /organizations` body `{ name, orgType }` → cria org e membership admin.  
- `GET /organizations` → lista orgs do usuário.  
- `GET /auth/google-calendar/authorize` → retorna URL OAuth do Google Agenda.  
- `GET /auth/google-calendar/callback` → callback OAuth (redirect para settings).  
- `GET /auth/google-calendar/status` → status de conexão + email.  
- `POST /auth/google-calendar/disconnect` → desconecta a agenda.  

## Jobs & Pipeline
- `POST /jobs` body `{ title, description?, location?, salaryMin?, salaryMax?, employmentType?, seniority?, status? }`
- `GET /jobs?status=open|on_hold|closed`
- `PATCH /jobs/:id` body parcial
- `POST /jobs/:id/stages` body `{ name, position }`
- `PATCH /jobs/:id/stages/:stageId` body `{ name?, position? }`

## Candidates
- `POST /candidates` body `{ fullName, email?, phone?, location?, currentRole?, linkedinUrl?, source?, salaryExpectation?, availabilityDate?, tags? }`
- `GET /candidates?search=...&tag=...`
- `PATCH /candidates/:id` body parcial
- `POST /candidates/:id/notes` body `{ note }`
- `GET /candidates/:id/notes`

## Applications (Kanban)
- `POST /applications` body `{ jobId, candidateId }`
- `PATCH /applications/:id/stage` body `{ toStageId, status? }` (cria event e move)
- `GET /applications?jobId=...&status=...`
- `GET /applications/:id/events`

## Assessments (v1)
- `POST /assessments` body `{ candidateId, jobId?, assessmentKind }` → retorna link/ID do teste.
- `GET /assessments/:id`
- Webhook `POST /integrations/assessments/result` (opcional) para receber score do motor de teste.

## Reports (básico)
- `GET /reports/dashboard` → stats + recentActivity + sources (origem de candidatos).
- `GET /reports/pipelines?jobId=...` → distribuições por etapa, tempo médio, conversão.
- `GET /reports/assessments?jobId=...` → média/mediana de score, correlação simples com status.

## DTOs/Respostas (exemplo)
```json
{
  "id": "uuid",
  "jobId": "uuid",
  "candidateId": "uuid",
  "currentStageId": "uuid",
  "status": "in_process",
  "score": 72.5,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

## Erros padrão
- 401 sem token válido
- 403 sem membership na org
- 404 recurso não encontrado dentro da org
- 422 validação
