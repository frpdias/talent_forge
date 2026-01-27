/**
 * Script para corrigir recruiters sem organização
 * Executa: node scripts/fix-recruiters-without-org.js
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Carregar variáveis do .env.local da web
const envPath = path.join(__dirname, '../apps/web/.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function fixRecruitersWithoutOrg() {
  console.log('🔍 Buscando recruiters sem organização...\n');

  // Buscar recruiters sem org_members
  const { data: recruiters, error } = await supabase
    .from('user_profiles')
    .select(`
      id,
      email,
      full_name,
      phone
    `)
    .eq('user_type', 'recruiter');

  if (error) {
    console.error('❌ Erro ao buscar recruiters:', error);
    return;
  }

  if (!recruiters || recruiters.length === 0) {
    console.log('✅ Nenhum recruiter encontrado!');
    return;
  }

  // Filtrar apenas recruiters sem org_members
  const recruitersWithoutOrg = [];
  for (const recruiter of recruiters) {
    const { data: member } = await supabase
      .from('org_members')
      .select('id')
      .eq('user_id', recruiter.id)
      .maybeSingle();
    
    if (!member) {
      recruitersWithoutOrg.push(recruiter);
    }
  }

  if (recruitersWithoutOrg.length === 0) {
    console.log('✅ Todos os recruiters já têm organização!');
    return;
  }

  console.log(`📊 Encontrados ${recruitersWithoutOrg.length} recruiter(s) sem organização:\n`);

  for (const recruiter of recruitersWithoutOrg) {
    console.log(`👤 Processando: ${recruiter.email} (${recruiter.full_name || 'sem nome'})`);

    // Criar organização
    const orgName = `${recruiter.full_name || recruiter.email} - ${recruiter.id.slice(0, 8)}`;
    
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: orgName,
        org_type: 'headhunter',
        status: 'active',
        email: recruiter.email,
        phone: recruiter.phone || null,
      })
      .select()
      .single();

    if (orgError) {
      console.error(`   ❌ Erro ao criar organização:`, orgError.message);
      continue;
    }

    console.log(`   ✅ Organização criada: ${org.name} (${org.id})`);

    // Vincular recruiter à organização
    const { error: memberError } = await supabase
      .from('org_members')
      .insert({
        org_id: org.id,
        user_id: recruiter.id,
        role: 'admin',
        status: 'active',
      });

    if (memberError) {
      console.error(`   ❌ Erro ao vincular à organização:`, memberError.message);
    } else {
      console.log(`   ✅ Recruiter vinculado como admin\n`);
    }
  }

  console.log('\n✅ Processo concluído!');
}

fixRecruitersWithoutOrg().catch(console.error);
