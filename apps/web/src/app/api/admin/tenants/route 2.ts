import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Verificar se usuário está autenticado
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Usar service role para verificar perfil e buscar dados (bypass RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // Verificar se é admin - primeiro via metadata, depois via profile
    const metadataUserType = user.user_metadata?.user_type;
    let isAdmin = metadataUserType === 'admin';

    // Se não for admin via metadata, verifica no profile
    if (!isAdmin) {
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('user_type')
        .eq('user_id', user.id)
        .single();
      
      isAdmin = profile?.user_type === 'admin';
      console.log('[Admin Tenants API] User:', user.email, 'Metadata:', metadataUserType, 'Profile:', profile?.user_type, 'isAdmin:', isAdmin);
    } else {
      console.log('[Admin Tenants API] User:', user.email, 'Admin via metadata:', metadataUserType);
    }

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    // Buscar organizações
    const { data: orgs, error: orgsError } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .order('name', { ascending: true });

    if (orgsError) {
      console.error('Error fetching organizations:', orgsError);
      return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
    }

    // Buscar contagens para cada organização
    const tenantsWithCounts = await Promise.all(
      (orgs || []).map(async (org) => {
        const [usersResult, jobsResult, phpResult] = await Promise.all([
          supabaseAdmin
            .from('org_members')
            .select('id', { count: 'exact', head: true })
            .eq('org_id', org.id),
          supabaseAdmin
            .from('jobs')
            .select('id', { count: 'exact', head: true })
            .eq('org_id', org.id),
          supabaseAdmin
            .from('php_module_activations')
            .select('id')
            .eq('org_id', org.id)
            .eq('is_active', true)
            .maybeSingle(),
        ]);

        return {
          id: org.id,
          name: org.name,
          slug: org.slug || org.name.toLowerCase().replace(/\s+/g, '-'),
          status: org.status || 'active',
          plan_id: org.plan_id,
          created_at: org.created_at,
          updated_at: org.updated_at,
          users_count: usersResult.count || 0,
          jobs_count: jobsResult.count || 0,
          php_active: !!phpResult.data,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: tenantsWithCounts,
      total: tenantsWithCounts.length
    });

  } catch (error) {
    console.error('Error in tenants API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
