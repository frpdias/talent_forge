import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import nodemailer from 'nodemailer';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', session.user.id)
      .single();
    if (profile?.user_type !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const start = Date.now();
    const transporter = nodemailer.createTransport({
      host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.BREVO_SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASS,
      },
      connectionTimeout: 6000,
      greetingTimeout: 6000,
      socketTimeout: 6000,
    });

    await transporter.verify();
    const latency = Date.now() - start;

    return NextResponse.json({
      ok: true,
      latency,
      host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.BREVO_SMTP_PORT || '587'),
      user: process.env.BREVO_SMTP_USER || '—',
      sender: process.env.BREVO_SENDER_EMAIL || '—',
      senderName: process.env.BREVO_SENDER_NAME || '—',
      provider: 'Brevo (Sendinblue)',
      checkedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha na conexão SMTP';
    return NextResponse.json({ ok: false, error: message, checkedAt: new Date().toISOString() }, { status: 200 });
  }
}
