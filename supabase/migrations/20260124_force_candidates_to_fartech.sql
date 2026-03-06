-- FIX FINAL DE ORGANIZAÇÃO
-- Força todos os candidatos a pertencerem à organização FARTECH
-- Isso resolve o erro "Candidate not found" ao salvar notas

UPDATE candidates
SET owner_org_id = 'c318c4aa-6e70-4bbc-991d-5126b14b4631' -- ID da FARTECH obtido nos logs
WHERE owner_org_id IS NULL 
   OR owner_org_id != 'c318c4aa-6e70-4bbc-991d-5126b14b4631';

-- Verifica o resultado
SELECT 
  'Candidatos atualizados para FARTECH' as status,
  COUNT(*) as total
FROM candidates
WHERE owner_org_id = 'c318c4aa-6e70-4bbc-991d-5126b14b4631';