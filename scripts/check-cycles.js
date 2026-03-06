const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1];

const supabase = createClient('https://fjudsjzfnysaztcwlwgm.supabase.co', key);

async function test() {
  const userId = '53e6b41f-1912-4f21-8682-1d1ca719b79a';
  
  // 1. Verificar orgs do usuário
  const { data: orgs } = await supabase
    .from('org_members')
    .select('org_id, organizations(id, name)')
    .eq('user_id', userId)
    .eq('status', 'active');
    
  console.log('=== Orgs do usuário ===');
  console.log(JSON.stringify(orgs, null, 2));
  
  // 2. Verificar ciclos em cada org
  console.log('\n=== Ciclos por org ===');
  for (const org of orgs || []) {
    const { data: cycles, error } = await supabase
      .from('tfci_cycles')
      .select('id, name, status')
      .eq('org_id', org.org_id);
    
    const orgName = org.organizations?.name || org.org_id;
    console.log(`${orgName}: ${cycles?.length || 0} ciclos`);
    if (cycles?.length) console.log(JSON.stringify(cycles, null, 2));
    if (error) console.log('Erro:', error);
  }
  
  // 3. Verificar TODOS os ciclos
  console.log('\n=== TODOS os ciclos na tabela ===');
  const { data: allCycles, count } = await supabase
    .from('tfci_cycles')
    .select('id, name, status, org_id', { count: 'exact' });
  console.log('Total de ciclos:', count || allCycles?.length || 0);
  if (allCycles?.length) console.log(JSON.stringify(allCycles, null, 2));
}

test().catch(console.error);
