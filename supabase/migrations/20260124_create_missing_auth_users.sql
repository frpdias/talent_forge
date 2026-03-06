-- SCRIPT: 20260124_create_missing_auth_users.sql
-- OBJETIVO: Criar usuários na tabela auth.users para candidatos existentes que não possuem um.
-- ISSO É NECESSÁRIO para corrigir a integridade de dados e permitir o carregamento
-- de assessments (PI, Cores) que dependem do user_id.

DO $$
DECLARE
    -- Variável para armazenar cada candidato encontrado sem usuário correspondente.
    candidato_sem_usuario RECORD;
    -- ID do novo usuário criado.
    novo_user_id UUID;
    -- Senha padrão para os novos usuários. Em um ambiente real, seria algo mais seguro
    -- ou um fluxo de "reset de senha" seria iniciado.
    senha_padrao TEXT := 'senha_temporaria_123';
BEGIN
    RAISE NOTICE 'Iniciando a verificação de candidatos sem usuários em auth.users...';

    -- 1. Itera sobre cada candidato que não tem um e-mail correspondente em auth.users.
    FOR candidato_sem_usuario IN 
        SELECT id, email, full_name
        FROM candidates
        WHERE user_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM auth.users WHERE email = candidates.email)
    LOOP
        RAISE NOTICE 'Processando candidato: % (%)', candidato_sem_usuario.full_name, candidato_sem_usuario.email;

        -- 2. Cria um novo usuário em auth.users para o e-mail do candidato.
        -- A função signup da Supabase não está disponível diretamente no SQL do servidor,
        -- então inserimos diretamente e usamos a extensão pgcrypto para hashear a senha.
        -- NOTA: Esta é uma operação de nível de administrador.
        INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_sent_at)
        VALUES (
            '00000000-0000-0000-0000-000000000000', -- instance_id padrão
            gen_random_uuid(), -- Gera um novo UUID para o usuário
            'authenticated', -- Audience padrão
            'authenticated', -- Role padrão
            candidato_sem_usuario.email, -- Email do candidato
            crypt(senha_padrao, gen_salt('bf')), -- Senha hasheada
            NOW(), -- Confirma o e-mail imediatamente
            NULL, NULL, NULL, -- Campos de recuperação
            '{"provider":"email","providers":["email"]}', -- raw_app_meta_data
            jsonb_build_object('full_name', candidato_sem_usuario.full_name), -- raw_user_meta_data
            NOW(), NOW(), -- Timestamps
            NULL, '', NULL -- Outros campos padrão
        )
        RETURNING id INTO novo_user_id;

        RAISE NOTICE ' -> Usuário criado em auth.users com ID: %', novo_user_id;

        -- 3. Atualiza a tabela 'candidates' com o ID do usuário recém-criado.
        UPDATE candidates
        SET user_id = novo_user_id,
            updated_at = NOW()
        WHERE id = candidato_sem_usuario.id;

        RAISE NOTICE ' -> Tabela candidates atualizada para o candidato ID: %', candidato_sem_usuario.id;

    END LOOP;

    RAISE NOTICE 'Verificação e criação de usuários concluída.';

    -- 4. Roda o script de fix novamente para garantir que todos os user_ids foram populados
    RAISE NOTICE 'Repopulando user_ids para garantir consistência...';
    UPDATE candidates c
    SET user_id = u.id,
        updated_at = NOW()
    FROM auth.users u
    WHERE c.user_id IS NULL
      AND c.email = u.email;

    RAISE NOTICE 'Repopulação finalizada.';
END $$;

-- Relatório Final: Verifica se ainda existe algum candidato sem user_id.
-- O resultado esperado é 0.
SELECT 
  'Candidatos restantes sem user_id' as status,
  COUNT(*) as total,
  STRING_AGG(email, ', ') as emails
FROM candidates
WHERE user_id IS NULL;
