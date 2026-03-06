const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Carrega env correto
require('dotenv').config({ path: path.resolve(__dirname, '../apps/web/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Credenciais não encontradas.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("🔍 Verificando dados de CBO...");
  
  // Tenta buscar o Programador (2124-20)
  const code = '2124-20';
  const { data, error } = await supabase
    .from('ref_cbo')
    .select('*')
    .eq('code', code)
    .single();

  if (error) {
    console.error("❌ Erro ao buscar:", error.message);
    return;
  }

  console.log("✅ Dados encontrados:", data);
  if (data.avg_salary_min && data.avg_salary_max) {
      console.log("💰 Salários OK!");
  } else {
      console.error("⚠️ Colunas de salário vazias ou inexistentes no retorno.");
  }
}

check();