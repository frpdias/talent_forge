/**
 * LLM Router — TalentForge
 *
 * Roteia chamadas de IA com base no plano da organização:
 *   - 'free'                  → Ollama (local via Cloudflare Tunnel)
 *   - 'pro' | 'enterprise'   → OpenAI GPT-4o
 *
 * O SDK OpenAI é totalmente compatível com a API do Ollama
 * (basta apontar `baseURL` para o endpoint do Ollama).
 */

import OpenAI from 'openai';

export type OrgPlan = 'free' | 'pro' | 'enterprise';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResult {
  text: string;
  model: string;       // ex: 'gpt-4o' ou 'ollama/gemma3:4b'
  provider: 'openai' | 'ollama';
}

// ─── Configuração dos modelos ─────────────────────────────────────────────────

const OPENAI_MODEL  = 'gpt-4o';
const OLLAMA_MODEL  = process.env.OLLAMA_MODEL ?? 'gemma3:4b';
const OLLAMA_URL    = process.env.OLLAMA_BASE_URL; // URL pública via Cloudflare Tunnel

// ─── Função principal ─────────────────────────────────────────────────────────

export async function callLLM(params: {
  orgPlan: OrgPlan;
  messages: LLMMessage[];
  maxTokens?: number;
  temperature?: number;
}): Promise<LLMResult> {
  const { orgPlan, messages, maxTokens = 1500, temperature = 0.7 } = params;

  const useOllama = orgPlan === 'free' && !!OLLAMA_URL;

  if (useOllama) {
    return callOllama(messages, maxTokens, temperature);
  } else {
    return callOpenAI(messages, maxTokens, temperature);
  }
}

// ─── Ollama via API compatível OpenAI ─────────────────────────────────────────

async function callOllama(
  messages: LLMMessage[],
  maxTokens: number,
  temperature: number,
): Promise<LLMResult> {
  if (!OLLAMA_URL) {
    throw new Error('OLLAMA_BASE_URL não configurada. Configure o Cloudflare Tunnel.');
  }

  // O SDK OpenAI funciona nativamente com Ollama apontando o baseURL
  const client = new OpenAI({
    baseURL: `${OLLAMA_URL}/v1`,
    apiKey:  'ollama', // Ollama não valida a key, mas o SDK exige algo
  });

  const completion = await client.chat.completions.create({
    model:       OLLAMA_MODEL,
    messages,
    max_tokens:  maxTokens,
    temperature,
  });

  const text = completion.choices[0]?.message?.content ?? '';
  return {
    text,
    model:    `ollama/${OLLAMA_MODEL}`,
    provider: 'ollama',
  };
}

// ─── OpenAI GPT-4o ───────────────────────────────────────────────────────────

async function callOpenAI(
  messages: LLMMessage[],
  maxTokens: number,
  temperature: number,
): Promise<LLMResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não configurada.');
  }

  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model:       OPENAI_MODEL,
    messages,
    max_tokens:  maxTokens,
    temperature,
  });

  const text = completion.choices[0]?.message?.content ?? '';
  return {
    text,
    model:    OPENAI_MODEL,
    provider: 'openai',
  };
}
