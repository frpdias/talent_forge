# Templates de E-mail — Supabase Auth (via Brevo)

Todos os e-mails transacionais da aplicação saem pelo **Brevo SMTP**, eliminando o limite de 2 e-mails/dia do Supabase free.

---

## 1. Configurar SMTP no Supabase

**Painel Supabase → Project Settings → Auth → SMTP Settings**

| Campo | Valor |
|---|---|
| Enable Custom SMTP | ✅ Ativado |
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| User | `<seu-login-brevo>` |
| Password | `<BREVO_SMTP_PASS>` (SMTP Key do painel Brevo) |
| Sender name | `TalentForge` |
| Sender email | `noreply@talentforge.com.br` |

---

## 2. Aplicar os Templates

**Painel Supabase → Authentication → Email Templates**

Para cada template abaixo, copie o conteúdo do arquivo HTML correspondente e cole no campo **Message body** do Supabase:

| Template no Supabase | Arquivo neste projeto | Assunto sugerido |
|---|---|---|
| **Confirm signup** | `confirm-signup.html` | `Confirme seu e-mail — TalentForge` |
| **Reset password** | `reset-password.html` | `Redefinição de senha — TalentForge` |
| **Magic Link** | `magic-link.html` | `Seu link de acesso — TalentForge` |
| **Change email address** | `email-change.html` | `Confirme a troca de e-mail — TalentForge` |
| **Invite user** | `invite-user.html` | `Você foi convidado para o TalentForge` |

---

## 3. Variáveis do Supabase (já incluídas nos templates)

| Variável | Usado em |
|---|---|
| `{{ .ConfirmationURL }}` | confirm-signup, reset-password, email-change, invite-user |
| `{{ .MagicLink }}` | magic-link |

---

## Resumo do fluxo completo de e-mails

```
Evento                          → Remetente         → Template
──────────────────────────────────────────────────────────────────
Cadastro de usuário             → Supabase Auth      → confirm-signup.html
Reset de senha                  → Supabase Auth      → reset-password.html
Magic link                      → Supabase Auth      → magic-link.html
Troca de e-mail                 → Supabase Auth      → email-change.html
Convite admin (Supabase)        → Supabase Auth      → invite-user.html
Convite candidato (InviteLink)  → NestJS EmailService → invite-candidate.hbs
Entrevista agendada             → NestJS EmailService → interview-scheduled.hbs
Link de assessment              → NestJS EmailService → assessment-link.hbs
Novo usuário (admin create)     → NestJS EmailService → welcome-user.hbs
Alerta NR-1 crítico             → NestJS EmailService → php-nr1-alert.hbs
```

Todos saem pelo Brevo após a configuração acima.
