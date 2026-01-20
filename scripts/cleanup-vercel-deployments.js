#!/usr/bin/env node

/**
 * Script para limpar deploys não utilizados no Vercel
 * Mantém apenas os 3 últimos deploys
 * 
 * Uso: node scripts/cleanup-vercel-deployments.js
 * 
 * Requer: VERCEL_TOKEN configurado nas variáveis de ambiente
 */

const https = require('https');
const readline = require('readline');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const TEAM_ID = process.env.VERCEL_TEAM_ID;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const KEEP_COUNT = 3; // Manter os 3 últimos

if (!VERCEL_TOKEN) {
  console.error('❌ Erro: VERCEL_TOKEN não está configurado');
  console.error('Defina a variável de ambiente: export VERCEL_TOKEN=sua_token');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function listDeployments() {
  console.log('📦 Buscando deploys...\n');
  
  try {
    const path = TEAM_ID 
      ? `/v6/deployments?teamId=${TEAM_ID}`
      : '/v6/deployments';

    const response = await makeRequest('GET', path);
    
    if (response.status !== 200) {
      throw new Error(`Erro ao listar deploys: ${response.status}`);
    }

    const deployments = response.data.deployments || [];
    
    if (deployments.length === 0) {
      console.log('ℹ️  Nenhum deploy encontrado');
      return [];
    }

    // Ordenar por data (mais recente primeiro)
    const sorted = deployments.sort((a, b) => 
      new Date(b.created) - new Date(a.created)
    );

    // Mostrar todos os deploys
    console.log(`✅ Total de ${sorted.length} deploy(s) encontrado(s)\n`);
    console.log('RECENTES (manter):');
    sorted.slice(0, KEEP_COUNT).forEach((deploy, idx) => {
      const date = new Date(deploy.created).toLocaleString('pt-BR');
      console.log(`  ${idx + 1}. ${deploy.id} - ${date} - ${deploy.url}`);
    });

    if (sorted.length > KEEP_COUNT) {
      console.log('\nPARA DELETAR:');
      const toDelete = sorted.slice(KEEP_COUNT);
      toDelete.forEach((deploy, idx) => {
        const date = new Date(deploy.created).toLocaleString('pt-BR');
        console.log(`  ${KEEP_COUNT + idx + 1}. ${deploy.id} - ${date} - ${deploy.url}`);
      });
    }

    return sorted;
  } catch (error) {
    console.error('❌ Erro ao buscar deploys:', error.message);
    process.exit(1);
  }
}

async function deleteDeployment(deploymentId) {
  const path = TEAM_ID
    ? `/v13/deployments/${deploymentId}?teamId=${TEAM_ID}`
    : `/v13/deployments/${deploymentId}`;

  const response = await makeRequest('DELETE', path);
  return response.status === 204 || response.status === 200;
}

async function main() {
  console.log('🧹 Limpador de Deploys do Vercel');
  console.log('================================\n');

  const deployments = await listDeployments();

  if (deployments.length <= KEEP_COUNT) {
    console.log(`\n✅ Nenhuma limpeza necessária (${deployments.length} <= ${KEEP_COUNT})\n`);
    rl.close();
    return;
  }

  const toDelete = deployments.slice(KEEP_COUNT);
  const confirm = await question(`\n⚠️  Confirma a exclusão de ${toDelete.length} deploy(s)? (s/n): `);

  if (confirm.toLowerCase() !== 's') {
    console.log('\n❌ Operação cancelada');
    rl.close();
    return;
  }

  console.log('\n🗑️  Deletando deploys...\n');

  let deleted = 0;
  let failed = 0;

  for (const deploy of toDelete) {
    try {
      const success = await deleteDeployment(deploy.id);
      if (success) {
        console.log(`  ✅ Deletado: ${deploy.id}`);
        deleted++;
      } else {
        console.log(`  ❌ Falha ao deletar: ${deploy.id}`);
        failed++;
      }
    } catch (error) {
      console.log(`  ❌ Erro ao deletar ${deploy.id}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Resultado: ${deleted} deletado(s), ${failed} falha(s)`);
  console.log(`✅ Mantidos os ${KEEP_COUNT} deploys mais recentes\n`);

  rl.close();
}

main().catch(error => {
  console.error('❌ Erro:', error);
  rl.close();
  process.exit(1);
});
