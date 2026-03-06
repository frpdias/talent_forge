# Autenticação e multi-tenant (Supabase + Nest)

## Supabase Auth
- Supabase gerencia usuários em `auth.users`.
- O frontend usa Supabase client para signup/login e obtém JWT.
- O JWT carrega `sub` (user_id) e claims; podemos usar `app_metadata` para guardar a org ativa ou enviar `x-org-id` no header.

## Contexto de organização
- Cada usuário pode pertencer a múltiplas organizações (consultorias/empresas).
- O backend exige um `org_id` corrente por requisição:
  - Header `x-org-id` com UUID.
  - Backend verifica se `auth.uid()` pertence a `org_id` via tabela `org_members`.
- Alternativa: emitir JWT curta com `org_id` em custom claim quando o usuário troca de organização.

## NestJS guard (esboço)
```ts
// SupabaseAuthGuard: valida JWT usando a chave pública do Supabase
// OrgGuard: verifica membership em org_id (header) antes de acessar handlers
```

### Pseudocódigo
```ts
@Injectable()
class OrgGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const orgId = req.headers['x-org-id'];
    const userId = req.user?.sub;
    if (!orgId || !userId) throw new ForbiddenException('org required');
    const member = await this.prisma.orgMembers.findFirst({ where: { orgId, userId }});
    if (!member) throw new ForbiddenException('not in org');
    req.orgId = orgId;
    return true;
  }
}
```

## Fluxo de criação de organização
1) Usuário cria conta (Supabase).  
2) Chama `POST /organizations` com nome + tipo (`headhunter`/`company`).  
3) Backend cria `organizations` + `org_members` como `admin`.  
4) Todas as rotas subsequentes exigem `x-org-id` ou JWT com claim de org.

## Tokens de serviço
- O backend pode usar a Service Role (Supabase) para rodar migrações/cron e bypass RLS quando necessário (idealmente só em jobs administrativos).
```ts
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false }});
```
