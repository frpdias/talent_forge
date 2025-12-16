## Talent Forge API (Python) - FastAPI

### Environment variables (Production)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET` (ou `JWT_SECRET`)
- `ACCESS_TOKEN_EXPIRE_MIN` (opcional, padrão 60)
- `REFRESH_TOKEN_EXPIRE_DAYS` (opcional, padrão 7)
- `ALLOWED_ORIGINS` (lista separada por vírgula ou `*`)

### Endpoints principais
- `GET /` – status básico
- `GET /health` – health check
- `POST /v1/auth/login` – email/password (Supabase Auth) → access/refresh
- `POST /v1/auth/refresh` – refresh token → novo access
- Rotas versionadas `/v1/color/...` e `/v1/disc/...` (protegidas via Bearer)

### Comandos locais
```
pip install -r requirements.txt
uvicorn api.index:app --reload
```
