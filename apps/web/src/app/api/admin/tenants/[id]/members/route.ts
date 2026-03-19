import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/admin/tenants/[id]/members
 * Lista membros de um tenant
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: members, error } = await admin
      .from('org_members')
      .select('user_id, role')
      .eq('org_id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Buscar emails dos usuários
    const userIds = (members || []).map(m => m.user_id);
    const enriched = await Promise.all(
      (members || []).map(async (m) => {
        const { data: { user } } = await admin.auth.admin.getUserById(m.user_id);
        return {
          user_id: m.user_id,
          role: m.role,
          email: user?.email || '',
          full_name: user?.user_metadata?.full_name || user?.user_metadata?.name || null,
        };
      })
    );

    return NextResponse.json({ success: true, data: enriched });
  } catch (error: any) {
    console.error('Error fetching tenant members:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
