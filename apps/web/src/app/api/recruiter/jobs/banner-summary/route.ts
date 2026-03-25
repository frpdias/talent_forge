import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const { title, description, requirements, benefits, seniority } =
      await req.json();

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json(
        { error: 'OpenAI não configurado' },
        { status: 500 },
      );
    }

    const openai = new OpenAI({ apiKey: openaiKey });

    const seniorityLabel: Record<string, string> = {
      junior: 'Júnior',
      pleno: 'Pleno',
      senior: 'Sênior',
    };
    const nivel = seniority ? ` (${seniorityLabel[seniority] ?? seniority})` : '';

    const prompt = `Você é especialista em marketing de recrutamento. Crie um resumo otimizado para banner de rede social (Instagram/LinkedIn) para a vaga abaixo, em português brasileiro.

Vaga: ${title}${nivel}

DESCRIÇÃO:
${description || 'Não informada'}

REQUISITOS:
${requirements || 'Não informados'}

BENEFÍCIOS:
${benefits || 'Não informados'}

REGRAS OBRIGATÓRIAS:
- description: 2 frases curtas e impactantes sobre o papel. Máx 180 chars total. Sem bullet points. Sem quebra de linha.
- requirements: selecione os 3 mais importantes. Cada item: máx 60 chars, objetivo e direto. Sem "•", "-" ou numeração.
- benefits: selecione os 3 mais atrativos. Cada item: máx 60 chars, objetivo e direto. Sem "•", "-" ou numeração.
- Tom profissional e convidativo. Português brasileiro formal.
- Retorne SOMENTE JSON válido, sem markdown, sem comentários.

JSON esperado:
{"description":"...","requirements":["...","...","..."],"benefits":["...","...","..."]}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.4,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);

    return NextResponse.json({
      description:
        typeof parsed.description === 'string' ? parsed.description : null,
      requirements: Array.isArray(parsed.requirements)
        ? parsed.requirements.slice(0, 3)
        : [],
      benefits: Array.isArray(parsed.benefits)
        ? parsed.benefits.slice(0, 3)
        : [],
    });
  } catch (err) {
    console.error('[banner-summary]', err);
    return NextResponse.json({ error: 'Erro ao gerar resumo' }, { status: 500 });
  }
}
