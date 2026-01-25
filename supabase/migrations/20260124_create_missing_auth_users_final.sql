-- SCRIPT CORRIGIDO E DEFINITIVO
-- Objetivo: Vincular user_id em candidatos, criando usuários apenas se necessário
-- Proteções: Evita erro de coluna gerada e evita erro de e-mails duplicados

DO $$
DECLARE
    r_candidato RECORD;
    v_user_id UUID;
    v_password TEXT := 'senha_temporaria_123';
BEGIN
    -- 1. Primeiro passo: Tenta vincular quem JÁ tem usuário (pode ter sido criado na tentativa anterior)
    UPDATE candidates c
    SET user_id = u.id,
        updated_at = NOW()
    FROM auth.users u
    WHERE c.user_id IS NULL 
    AND c.email = u.email;
    
    RAISE NOTICE 'Passo 1: Vinculados usuários já existentes.';

    -- 2. Segundo passo: Cria usuários apenas para e-mails DISTINTOS que ainda não têm user_id
    -- O GROUP BY email impede que tentemos criar o mesmo usuário duas vezes
    FOR r_candidato IN 
        SELECT email, MAX(full_name) as nome_exemplo
        FROM candidates 
        WHERE user_id IS NULL
        GROUP BY email
    LOOP
        -- Verificação paranoica: checa se usuário existe antes de tentar inserir
        SELECT id INTO v_user_id FROM auth.users WHERE email = r_candidato.email;

        IF v_user_id IS NULL THEN
            -- Insere novo usuário na tabela auth.users
            -- REMOVIDO: confirmed_at (coluna gerada)
            INSERT INTO auth.users (
                instance_id,
                id,
                aud,
                role,
                email,
                encrypted_password,
                email_confirmed_at,
                raw_app_meta_data,
                raw_user_meta_data,
                created_at,
                updated_at
            )
            VALUES (
                '00000000-0000-0000-0000-000000000000',
                gen_random_uuid(),
                'authenticated',
                'authenticated',
                r_candidato.email,
                crypt(v_password, gen_salt('bf')),
                NOW(), -- email_confirmed_at (timestamp normal)
                '{"provider":"email","providers":["email"]}',
                jsonb_build_object('full_name', r_candidato.nome_exemplo),
                NOW(),
                NOW()
            )
            RETURNING id INTO v_user_id;
            
            RAISE NOTICE 'Criado novo usuário para: %', r_candidato.email;
        ELSE
            RAISE NOTICE 'Usuário já existia para: %', r_candidato.email;
        END IF;

        -- Atualiza TODOS os candidatos que possuem este e-mail
        UPDATE candidates 
        SET user_id = v_user_id,
            updated_at = NOW()
        WHERE email = r_candidato.email;
        
    END LOOP;
END $$;

-- Verificação final
SELECT 
  'Candidatos RESTANTES sem user_id' as status,
  COUNT(*) as total
FROM candidates
WHERE user_id IS NULL;
