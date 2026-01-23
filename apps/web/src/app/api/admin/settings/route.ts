import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/settings
 * Retorna todas as configurações do sistema ou uma categoria específica
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', session.user.id)
      .single();

    if (!profile || profile.user_type !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Pegar parâmetro de categoria da URL
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Buscar configurações
    let query = supabase
      .from('system_settings')
      .select('*')
      .order('category', { ascending: true })
      .order('key', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data: settings, error } = await query;

    if (error) {
      console.error('Erro ao buscar configurações:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar configurações' },
        { status: 500 }
      );
    }

    // Agrupar por categoria
    const groupedSettings: Record<string, any> = {};
    
    settings?.forEach((setting) => {
      if (!groupedSettings[setting.category]) {
        groupedSettings[setting.category] = {};
      }
      
      // Extrair apenas o nome da chave (sem a categoria)
      const keyName = setting.key.split('.')[1] || setting.key;
      groupedSettings[setting.category][keyName] = {
        ...setting.value,
        _meta: {
          id: setting.id,
          key: setting.key,
          description: setting.description,
          updated_at: setting.updated_at,
          updated_by: setting.updated_by,
        },
      };
    });

    return NextResponse.json({
      success: true,
      settings: groupedSettings,
      total: settings?.length || 0,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Erro no endpoint /api/admin/settings:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Erro ao buscar configurações',
        success: false,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings
 * Atualiza configurações do sistema
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', session.user.id)
      .single();

    if (!profile || profile.user_type !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Pegar configurações do body
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Configurações inválidas' },
        { status: 400 }
      );
    }

    // Atualizar cada configuração
    const updates = [];
    
    for (const [category, categorySettings] of Object.entries(settings)) {
      for (const [key, value] of Object.entries(categorySettings as Record<string, any>)) {
        const fullKey = `${category}.${key}`;
        
        // Usar a função set_setting para atualizar
        const { data, error } = await supabase
          .rpc('set_setting', {
            setting_key: fullKey,
            setting_value: value,
            setting_category: category,
          });

        if (error) {
          console.error(`Erro ao atualizar ${fullKey}:`, error);
        } else {
          updates.push({ key: fullKey, success: !error });
        }
      }
    }

    // Registrar em audit_logs
    try {
      await supabase.from('audit_logs').insert({
        actor_id: session.user.id,
        action: 'settings_updated',
        resource: 'system_settings',
        metadata: {
          categories: Object.keys(settings),
          total_updates: updates.length,
        },
      });
    } catch (auditError) {
      console.error('Erro ao registrar em audit_logs:', auditError);
    }

    return NextResponse.json({
      success: true,
      updated: updates.length,
      updates,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Erro no endpoint /api/admin/settings POST:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Erro ao atualizar configurações',
        success: false,
      },
      { status: 500 }
    );
  }
}
