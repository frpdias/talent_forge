-- FIX ORGANIZATION MEMBERSHIP MANUALLY
-- Run this in Supabase SQL Editor

DO $$ 
DECLARE
  -- O ID do seu usuário encontrado anteriormente
  v_user_id uuid := '53e6b41f-1912-4f21-8682-1d1ca719b79a';
  v_org_id uuid;
BEGIN
  -- 1. Garante que a Organização existe
  SELECT id INTO v_org_id FROM organizations WHERE name = 'Talent Forge Demo Integration';
  
  IF v_org_id IS NULL THEN
    INSERT INTO organizations (name, org_type) 
    VALUES ('Talent Forge Demo Integration', 'company')
    RETURNING id INTO v_org_id;
  END IF;

  -- 2. Garante que você é membro dela
  IF NOT EXISTS (SELECT 1 FROM org_members WHERE user_id = v_user_id AND org_id = v_org_id) THEN
    INSERT INTO org_members (org_id, user_id, role)
    VALUES (v_org_id, v_user_id, 'admin');
  END IF;
  
  -- 3. Garante que seu perfil é de Recrutador
  UPDATE user_profiles 
  SET user_type = 'recruiter'
  WHERE id = v_user_id;
  
  RAISE NOTICE 'Correction applied! Org ID: %', v_org_id;
END $$;
