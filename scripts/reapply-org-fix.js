const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://fjudsjzfnysaztcwlwgm.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDU0MDc2MCwiZXhwIjoyMDgwMTE2NzYwfQ.z-Qc2Y6H_h9nkli5iiCqgFPvQmLf5eVKMJVTuce9MDk';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function fixUserOrg() {
  const email = 'frpdias@icloud.com';
  console.log(`Fixing organization for ${email}...`);

  // 1. Get User ID (Hardcoded from previous successful run to avoid Auth API issues)
  /*
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    console.error('Error listing users:', userError);
    return;
  }
  const user = users.find(u => u.email === email);
  */
  const user = { id: '53e6b41f-1912-4f21-8682-1d1ca719b79a', email: email };
  
  console.log('Using User ID:', user.id);

  // 2. Get or Create Organization
  const orgName = 'Talent Forge Demo Integration';
  let { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', orgName)
    .single();

  if (!org) {
    console.log('Creating organization...');
    const { data: newOrg, error: createError } = await supabase
      .from('organizations')
      .insert([{
        name: orgName,
        org_type: 'company'
      }])
      .select()
      .single();
      
    if (createError) {
        // If it failed because of duplicate slug or something, try fetch again
        console.error('Error creating org:', createError);
        return;
    }
    org = newOrg;
  }

  console.log('Organization ID:', org.id);

  // 3. Add to Org Members
  console.log('Checking org membership...');
  
  const { data: member } = await supabase
    .from('org_members')
    .select('*')
    .eq('user_id', user.id)
    .eq('org_id', org.id)
    .single();

  if (!member) {
      console.log('Inserting into org_members...');
      const { error: insertError } = await supabase
        .from('org_members')
        .insert({
            org_id: org.id,
            user_id: user.id,
            role: 'admin'
        });
      
      if (insertError) console.error('Error adding member:', insertError);
      else console.log('✅ User added to organization members!');
  } else {
      console.log('✅ User is already a member of this organization.');
  }

  // 4. Update Profile Type
  console.log('Updating user_type to recruiter...');
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({ user_type: 'recruiter' })
    .eq('id', user.id);
    
  if (updateError) console.error('Error updating profile type:', updateError);
  else console.log('Profile type updated.');
}

fixUserOrg();
