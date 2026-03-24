#!/usr/bin/env node
/**
 * scripts/import-it-test-questions.js
 * 
 * Importa as questões do Teste de Informática do arquivo CSV para o banco.
 * 
 * Uso:
 *   node scripts/import-it-test-questions.js [caminho-do-csv]
 * 
 * Exemplo:
 *   node scripts/import-it-test-questions.js ./scripts/Teste_de_Informatica.csv
 * 
 * O CSV deve ter as colunas (com ou sem cabeçalho repetido entre níveis):
 *   nivel,categoria,pergunta,alternativa_a,alternativa_b,alternativa_c,alternativa_d,resposta
 */

const fs   = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.resolve(__dirname, '../apps/api/.env') });

const SUPABASE_URL      = process.env.SUPABASE_URL      || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SR_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SR_KEY) {
  console.error('❌  Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no apps/api/.env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SR_KEY);

function parseCSV(content) {
  const lines  = content.split('\n').map(l => l.trim()).filter(Boolean);
  const questions = [];
  let order = 0;

  for (let line of lines) {
    // Remover aspas que envolvem a linha inteira: "Junior,Windows,..." → Junior,Windows,...
    if (line.startsWith('"') && line.endsWith('"')) {
      line = line.slice(1, -1);
    }

    // Pular linhas de cabeçalho (repetidas entre blocos de nível)
    if (line.toLowerCase().startsWith('nivel') || line.toLowerCase().startsWith('nível')) {
      continue;
    }

    // Split por vírgula respeitando aspas internas
    const cols = splitCSVLine(line);
    if (cols.length < 8) continue;

    const [nivel, categoria, pergunta, a, b, c, d, resposta] = cols.map(s => s.trim().replace(/^"|"$/g, ''));
    
    const nivelNorm = nivel.toLowerCase().trim();
    if (!['junior', 'pleno', 'senior'].includes(nivelNorm)) continue;

    const respostaNorm = resposta.toUpperCase().trim();
    if (!['A','B','C','D'].includes(respostaNorm)) {
      console.warn(`⚠️  Resposta inválida "${resposta}" na linha: ${line.substring(0, 60)}`);
      continue;
    }

    questions.push({
      nivel:         nivelNorm,
      categoria:     categoria,
      pergunta:      pergunta,
      alternativa_a: a,
      alternativa_b: b,
      alternativa_c: c,
      alternativa_d: d,
      resposta:      respostaNorm,
      display_order: order++,
    });
  }

  return questions;
}

function splitCSVLine(line) {
  const result = [];
  let current  = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error('❌  Informe o caminho do CSV como argumento.');
    console.error('    Exemplo: node scripts/import-it-test-questions.js ./scripts/Teste_de_Informatica.csv');
    process.exit(1);
  }

  const absolutePath = path.resolve(csvPath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`❌  Arquivo não encontrado: ${absolutePath}`);
    process.exit(1);
  }

  console.log(`📂  Lendo CSV: ${absolutePath}`);
  const content   = fs.readFileSync(absolutePath, 'utf-8');
  const questions = parseCSV(content);

  const byLevel = questions.reduce((acc, q) => {
    acc[q.nivel] = (acc[q.nivel] || 0) + 1;
    return acc;
  }, {});

  console.log(`\n📊  Questões encontradas:`);
  Object.entries(byLevel).forEach(([nivel, count]) => {
    console.log(`    • ${nivel}: ${count} questões`);
  });
  console.log(`    • Total: ${questions.length} questões\n`);

  if (questions.length === 0) {
    console.error('❌  Nenhuma questão válida encontrada. Verifique o formato do CSV.');
    process.exit(1);
  }

  // Limpar questões antigas
  console.log('🗑️   Removendo questões existentes...');
  const { error: delErr } = await supabase.from('it_test_questions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delErr) {
    console.error('❌  Erro ao remover questões:', delErr.message);
    process.exit(1);
  }

  // Inserir em lotes de 100
  const BATCH = 100;
  let inserted = 0;
  for (let i = 0; i < questions.length; i += BATCH) {
    const batch = questions.slice(i, i + BATCH);
    const { error } = await supabase.from('it_test_questions').insert(batch);
    if (error) {
      console.error(`❌  Erro ao inserir lote ${i / BATCH + 1}:`, error.message);
      process.exit(1);
    }
    inserted += batch.length;
    console.log(`✅  Inseridas ${inserted}/${questions.length} questões`);
  }

  // Verificar
  const { count } = await supabase.from('it_test_questions').select('*', { count: 'exact', head: true });
  console.log(`\n🎉  Importação concluída! ${count} questões no banco.`);
}

main().catch(e => { console.error(e); process.exit(1); });
