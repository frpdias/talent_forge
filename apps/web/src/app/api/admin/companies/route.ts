import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Buscar todas as empresas (agora em organizations)
    const { data: companies, error } = await supabase
      .from('organizations')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar empresas:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar empresas' },
        { status: 500 }
      );
    }

    return NextResponse.json({ companies: companies || [] });
  } catch (error: any) {
    console.error('Erro no endpoint /api/admin/companies:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      cnpj,
      email,
      phone,
      website,
      address,
      city,
      state,
      industry,
      size,
    } = body;

    // Validações
    if (!name || !cnpj || !email) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, cnpj, email' },
        { status: 400 }
      );
    }

    // Inserir empresa (agora em organizations)
    const { data: company, error } = await supabase
      .from('organizations')
      .insert({
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        cnpj,
        email,
        phone: phone || null,
        website: website || null,
        address: address || null,
        city: city || null,
        state: state || null,
        industry: industry || null,
        size: size || 'small',
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar empresa:', error);
      return NextResponse.json(
        { error: error.message || 'Erro ao criar empresa' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, company });
  } catch (error: any) {
    console.error('Erro no POST /api/admin/companies:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
