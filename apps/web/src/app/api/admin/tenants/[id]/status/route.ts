import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * PATCH /api/admin/tenants/[id]/status
 * Atualiza status de um tenant (active/inactive)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido. Use: active, inactive, suspended' },
        { status: 400 }
      );
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await admin
      .from('organizations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, name, status')
      .single();

    if (error) {
      console.error('Error updating tenant status:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error in PATCH tenant status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
