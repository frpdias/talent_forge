// TEMPORÁRIO — remover após validação
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function GET() {
  const host = process.env.BREVO_SMTP_HOST
  const port = parseInt(process.env.BREVO_SMTP_PORT || '587')
  const user = process.env.BREVO_SMTP_USER
  const pass = process.env.BREVO_SMTP_PASS

  const vars = {
    BREVO_SMTP_HOST: host || 'AUSENTE',
    BREVO_SMTP_PORT: process.env.BREVO_SMTP_PORT || 'AUSENTE',
    BREVO_SMTP_USER: user || 'AUSENTE',
    BREVO_SMTP_PASS: pass ? `SET (${pass.length} chars)` : 'AUSENTE',
    BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL || 'AUSENTE',
    BREVO_SENDER_NAME: process.env.BREVO_SENDER_NAME || 'AUSENTE',
  }

  if (!user || !pass) {
    return NextResponse.json({ status: 'ERRO - vars faltando', vars })
  }

  try {
    const transporter = nodemailer.createTransport({
      host: host || 'smtp-relay.brevo.com',
      port,
      secure: false,
      auth: { user, pass },
    })
    const start = Date.now()
    await transporter.verify()
    return NextResponse.json({
      status: 'SMTP OK ✅',
      latency: `${Date.now() - start}ms`,
      vars,
    })
  } catch (error) {
    return NextResponse.json({
      status: 'SMTP ERRO ❌',
      error: error instanceof Error ? error.message : String(error),
      vars,
    })
  }
}
