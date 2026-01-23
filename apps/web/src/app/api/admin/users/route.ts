import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Fetch all users from Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform users to a simpler format
    const users = data.users.map((user) => ({
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || null,
      user_type: user.user_metadata?.user_type || 'unknown',
      created_at: user.created_at,
      phone: user.phone || null,
      location: null, // Not available in auth
      email_verified: user.email_confirmed_at ? true : false,
      last_sign_in: user.last_sign_in_at,
    }));

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error in admin users API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
