const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://fjudsjzfnysaztcwlwgm.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDU0MDc2MCwiZXhwIjoyMDgwMTE2NzYwfQ.z-Qc2Y6H_h9nkli5iiCqgFPvQmLf5eVKMJVTuce9MDk';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function debugData() {
  console.log('--- DEBUGGING DB STATE ---');

  // 1. Check User
  // List all users to see what we have
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  console.log('Total users found:', users.length);
  users.forEach(u => console.log(` - ${u.email} (${u.id})`));
  
  const email = 'frpdias@icloud.com';
  const user = users.find(u => u.email === email);
  
  if (!user) {
    console.log('CRITICAL: User not found in Auth!');
    return;
  }
  console.log(`User Found: ${user.email} (ID: ${user.id})`);

  // 2. Check Org Members
  console.log('\nChecking matches in org_members...');
  const { data: members, error: memberError } = await supabase
    .from('org_members')
    .select('*, organizations(name)')
    .eq('user_id', user.id);

  if (memberError) console.error('Error fetching members:', memberError);
  if (members && members.length > 0) {
    console.log('✅ User is member of:', JSON.stringify(members, null, 2));
  } else {
    console.log('❌ User is NOT in org_members table.');
    
    // Attempt to fix again if missing
    console.log('Attempting to fix missing membership...');
    
    // Get an org
    const { data: orgs } = await supabase.from('organizations').select('id, name').limit(1);
    if (orgs && orgs.length > 0) {
        const org = orgs[0];
        console.log(`Adding to org: ${org.name} (${org.id})`);
        
        const { error: insertError } = await supabase.from('org_members').insert({
            user_id: user.id,
            org_id: org.id,
            role: 'admin'
        });
        
        if (insertError) console.error('Insert failed:', insertError);
        else console.log('✅ Inserted successfully.');
    } else {
        console.log('No organizations found to join.');
    }
  }

  // 3. User Profile Check
  console.log('\nChecking user_profiles...');
  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
  console.log('Profile:', profile);

}

debugData();
