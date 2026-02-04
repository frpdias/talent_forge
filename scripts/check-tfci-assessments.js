const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fjudsjzfnysaztcwlwgm.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  console.log('=== Checking tfci_assessments table ===\n');
  
  // Buscar um sample
  const { data, error } = await supabase
    .from('tfci_assessments')
    .select('*')
    .limit(3);
  
  if (error) {
    console.log('Error:', error);
    return;
  }
  
  console.log('Sample data:', JSON.stringify(data, null, 2));
  
  if (data && data.length > 0) {
    console.log('\nColumns:', Object.keys(data[0]));
  } else {
    console.log('\nNo data in tfci_assessments');
  }
  
  // Verificar policies
  const { data: policies, error: polError } = await supabase.rpc('get_policies_for_table', { 
    table_name: 'tfci_assessments' 
  });
  
  if (polError) {
    console.log('\nCould not fetch policies directly');
  } else {
    console.log('\nPolicies:', policies);
  }
}

check().catch(console.error);
