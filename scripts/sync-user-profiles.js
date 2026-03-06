#!/usr/bin/env node

/**
 * Script to create missing user_profiles for existing auth.users
 * Run: node scripts/sync-user-profiles.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase credentials
const SUPABASE_URL = 'https://fjudsjzfnysaztcwlwgm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqdWRzanpmbnlzYXp0Y3dsd2dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NDA3NjAsImV4cCI6MjA4MDExNjc2MH0.RVfvnu7Cp9X5wXefvXtwOu20hSsR4B6mGkypssMtUyE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function syncUserProfiles() {
  console.log('🔍 Syncing user profiles...\n');

  try {
    // Read and execute the migration SQL
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260120_fix_existing_user_profiles.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Executing migration SQL...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });

    if (error) {
      console.error('❌ Error executing migration:', error.message);
      console.log('\n⚠️  Note: RPC function may not be available. Trying alternative approach...\n');
      
      // Alternative: Manually check and create profiles
      await manualSync();
      return;
    }

    console.log('✅ Migration executed successfully!');
    console.log('📊 Result:', data);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.log('\n⚠️  Trying manual sync approach...\n');
    await manualSync();
  }
}

async function manualSync() {
  console.log('🔄 Checking for users without profiles...\n');

  // This would require service role key for auth.users access
  // For now, we'll just verify existing profiles
  
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('id, full_name, user_type, created_at');

  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError.message);
    return;
  }

  console.log(`\n📊 Found ${profiles.length} user profiles:\n`);
  
  profiles.forEach((profile, index) => {
    console.log(`${index + 1}. ${profile.full_name || 'Unknown'} (${profile.user_type}) - ${profile.id}`);
  });

  console.log('\n✅ Profile sync check complete!');
  console.log('\n💡 To create missing profiles for existing users:');
  console.log('   1. Go to Supabase Dashboard > SQL Editor');
  console.log('   2. Run the migration: supabase/migrations/20260120_fix_existing_user_profiles.sql');
  console.log('   3. Or use Supabase CLI: supabase db push\n');
}

// Run the script
syncUserProfiles();
