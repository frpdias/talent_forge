// Script para aplicar a policy de admin para organizations
// Execute com: node scripts/apply-admin-orgs-policy.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL');
  console.log('Please check your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function applyPolicy() {
  console.log('🔧 Applying admin organizations policy...\n');

  // SQL para criar a função e policies
  const sql = `
    -- Create helper function to check if user is admin
    CREATE OR REPLACE FUNCTION is_platform_admin()
    RETURNS BOOLEAN AS $$
    BEGIN
      RETURN (
        SELECT user_type = 'admin'
        FROM user_profiles
        WHERE user_id = auth.uid()
        LIMIT 1
      );
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

    -- Grant execute on the function
    GRANT EXECUTE ON FUNCTION is_platform_admin() TO authenticated;
  `;

  try {
    // Executar via RPC ou diretamente
    const { error: fnError } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (fnError) {
      console.log('⚠️  Could not create function via RPC, trying alternative...');
      
      // Tentar via query direta (admin)
      const { error } = await supabase.from('_exec_sql').select().single();
      console.log('Direct query result:', error);
    }

    // Verificar organizações existentes
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, status');
    
    if (orgsError) {
      console.log('❌ Error fetching organizations:', orgsError.message);
    } else {
      console.log('📊 Organizations in database:', orgs?.length || 0);
      if (orgs && orgs.length > 0) {
        orgs.forEach(org => {
          console.log(`   - ${org.name} (${org.status || 'no status'})`);
        });
      }
    }

    // Verificar user_profiles para ver os admins
    const { data: admins, error: adminsError } = await supabase
      .from('user_profiles')
      .select('id, email, user_type')
      .eq('user_type', 'admin');

    if (adminsError) {
      console.log('❌ Error fetching admins:', adminsError.message);
    } else {
      console.log('\n👤 Admin users:', admins?.length || 0);
      if (admins && admins.length > 0) {
        admins.forEach(admin => {
          console.log(`   - ${admin.email}`);
        });
      }
    }

    console.log('\n✅ Done! Please apply the SQL migration manually via Supabase Dashboard:');
    console.log('   SQL Editor -> Run the content of supabase/migrations/20260203_admin_orgs_policy.sql');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

applyPolicy();
