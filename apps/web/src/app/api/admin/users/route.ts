import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

async function ensureAdmin() {
  const supabase = await createServerClient();
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return { error: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('user_type')
    .eq('id', session.user.id)
    .single();

  const userType = profile?.user_type || (session.user.user_metadata as any)?.user_type;

  if (profileError || !userType || userType !== 'admin') {
    return { error: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }) };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      error: NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY não configurada' },
        { status: 500 }
      ),
    };
  }

  const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return { admin };
}

export async function GET() {
  try {
    const { admin, error: adminError } = await ensureAdmin();
    if (adminError) return adminError;

    // Fetch all users from Supabase Auth
    const { data, error } = await admin.auth.admin.listUsers();

    if (error) {
      console.error('Error fetching users (auth):', error);

      // Fallback: fetch from user_profiles if Auth list fails
      const { data: profiles, error: profilesError } = await admin
        .from('user_profiles')
        .select('id, email, full_name, user_type, created_at, phone, location')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching users (profiles):', profilesError);
        return NextResponse.json({ error: profilesError.message }, { status: 500 });
      }

      const userIds = (profiles || []).map((profile) => profile.id);
      let orgByUserId = new Map<string, { id: string; name: string }[]>();

      if (userIds.length > 0) {
        const { data: memberships, error: membershipsError } = await admin
          .from('org_members')
          .select('user_id, org_id, organizations (name)')
          .in('user_id', userIds);

        if (membershipsError) {
          console.error('Error fetching org memberships:', membershipsError);
        } else {
          orgByUserId = (memberships || []).reduce((acc, item: any) => {
            const org = item.organizations
              ? { id: item.org_id, name: item.organizations.name }
              : null;
            if (!org) return acc;
            const list = acc.get(item.user_id) || [];
            list.push(org);
            acc.set(item.user_id, list);
            return acc;
          }, new Map<string, { id: string; name: string }[]>());
        }
      }

      const fallbackUsers = (profiles || []).map((profile) => ({
        id: profile.id,
        email: profile.email || '',
        full_name: profile.full_name || null,
        user_type: profile.user_type || 'unknown',
        created_at: profile.created_at,
        phone: profile.phone || null,
        location: profile.location || null,
        email_verified: false,
        last_sign_in: null,
        organizations: orgByUserId.get(profile.id) || [],
      }));

      return NextResponse.json(fallbackUsers);
    }

    const userIds = data.users.map((user) => user.id);
    let orgByUserId = new Map<string, { id: string; name: string }[]>();

    if (userIds.length > 0) {
      const { data: memberships, error: membershipsError } = await admin
        .from('org_members')
        .select('user_id, org_id, organizations (name)')
        .in('user_id', userIds);

      if (membershipsError) {
        console.error('Error fetching org memberships:', membershipsError);
      } else {
        orgByUserId = (memberships || []).reduce((acc, item: any) => {
          const org = item.organizations
            ? { id: item.org_id, name: item.organizations.name }
            : null;
          if (!org) return acc;
          const list = acc.get(item.user_id) || [];
          list.push(org);
          acc.set(item.user_id, list);
          return acc;
        }, new Map<string, { id: string; name: string }[]>());
      }
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
      organizations: orgByUserId.get(user.id) || [],
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
