#!/usr/bin/env node

// Script para verificar dados do usuário no Supabase
// IMPORTANTE: Configure as variáveis de ambiente antes de executar
// Execute: export SUPABASE_URL=xxx && export SUPABASE_ANON_KEY=xxx

const email = process.argv[2] || 'frpdias@icloud.com';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas!');
  console.error('   Configure: SUPABASE_URL, SUPABASE_ANON_KEY');
  process.exit(1);
}

async function checkUser() {
  console.log(`\n🔍 Procurando usuário: ${email}\n`);
  
  try {
    // Fetch user from auth table via REST API
    const authResponse = await fetch(
      `${supabaseUrl}/rest/v1/auth.users?email=eq.${encodeURIComponent(email)}`,
      {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        }
      }
    );

    if (!authResponse.ok) {
      console.log('❌ Não foi possível buscar usuário auth');
      return;
    }

    const authUsers = await authResponse.json();
    console.log('📋 Auth Users encontrados:', authUsers.length);
    
    if (authUsers.length === 0) {
      console.log('❌ Usuário não encontrado no auth.users');
      return;
    }

    const authUser = authUsers[0];
    console.log('✅ Usuário encontrado:');
    console.log('   ID:', authUser.id);
    console.log('   Email:', authUser.email);
    console.log('   Criado em:', authUser.created_at);

    // Now check candidate_profiles
    console.log(`\n🔍 Procurando candidate_profiles para: ${authUser.id}\n`);
    
    const candidateResponse = await fetch(
      `${supabaseUrl}/rest/v1/candidate_profiles?user_id=eq.${authUser.id}`,
      {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        }
      }
    );

    if (!candidateResponse.ok) {
      console.log('❌ Erro ao buscar candidate_profiles');
      return;
    }

    const profiles = await candidateResponse.json();
    console.log('📋 Candidate profiles encontrados:', profiles.length);

    if (profiles.length === 0) {
      console.log('⚠️  Nenhum candidate_profile encontrado!');
      console.log('    → Usuário vai ser redirecionado para onboarding');
      return;
    }

    const profile = profiles[0];
    console.log('✅ Candidate profile encontrado:');
    console.log('   ID:', profile.id);
    console.log('   Nome:', profile.full_name);
    console.log('   Onboarding completo?:', profile.onboarding_completed);
    console.log('   Passo do onboarding:', profile.onboarding_step);
    console.log('   Completude do perfil:', profile.profile_completion_percentage + '%');

    if (profile.onboarding_completed) {
      console.log('\n✅ REDIRECIONAMENTO ESPERADO: /candidate');
    } else {
      console.log('\n⏳ REDIRECIONAMENTO ESPERADO: /onboarding');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkUser();
