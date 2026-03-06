const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Carrega variáveis de ambiente (prioridade para apps/api/.env que tem a Service Key)
require('dotenv').config({ path: path.resolve(__dirname, '../apps/api/.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../apps/web/.env.local') });

// Configuração - Se não achar as keys, avisa
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente SUPABASE_URL ou SUPABASE_KEY não encontradas.');
  console.log('Certifique-se de ter um arquivo .env ou apps/web/.env.local configurado.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const cboData = [
  // Tecnologia
  { 
    code: '2124-05', 
    title: 'Analista de desenvolvimento de sistemas', 
    synonyms: ['desenvolvedor', 'programador', 'developer', 'engenheiro de software', 'full stack'],
    avg_salary_min: 5000,
    avg_salary_max: 15000
  },
  { 
    code: '2124-20', 
    title: 'Programador de sistemas de informação', 
    synonyms: ['coder', 'dev'],
    avg_salary_min: 4000,
    avg_salary_max: 12000
  },
  { 
    code: '2123-05', 
    title: 'Administrador de banco de dados', 
    synonyms: ['dba', 'database admin'],
    avg_salary_min: 6000,
    avg_salary_max: 16000
  },
  { 
    code: '2122-15', 
    title: 'Engenheiro de sistemas operacionais em computação', 
    synonyms: ['devops', 'sre', 'infraestrutura'],
    avg_salary_min: 7000,
    avg_salary_max: 18000
  },
  { 
    code: '1425-05', 
    title: 'Gerente de tecnologia da informação', 
    synonyms: ['cto', 'vp of engineering', 'tech lead', 'coordenador de ti'],
    avg_salary_min: 15000,
    avg_salary_max: 35000
  },
  { 
    code: '3171-10', 
    title: 'Programador de internet', 
    synonyms: ['web developer', 'frontend', 'backend'],
    avg_salary_min: 4500,
    avg_salary_max: 13000
  },
  { 
    code: '2124-10', 
    title: 'Analista de redes e de comunicação de dados', 
    synonyms: ['analista de redes', 'infra'],
    avg_salary_min: 4000,
    avg_salary_max: 10000
  },
  
  // RH e Administrativo
  { 
    code: '2524-05', 
    title: 'Analista de recursos humanos', 
    synonyms: ['rh', 'human resources', 'gestão de pessoas'],
    avg_salary_min: 3500,
    avg_salary_max: 8000
  },
  { 
    code: '1232-05', 
    title: 'Diretor de recursos humanos', 
    synonyms: ['chro', 'head de pessoas', 'diretor de rh'],
    avg_salary_min: 18000,
    avg_salary_max: 40000
  },
  { 
    code: '1422-05', 
    title: 'Gerente de recursos humanos', 
    synonyms: ['gerente de rh', 'bp', 'business partner'],
    avg_salary_min: 10000,
    avg_salary_max: 22000
  },
  { 
    code: '4110-10', 
    title: 'Assistente administrativo', 
    synonyms: ['auxiliar administrativo', 'secretária'],
    avg_salary_min: 2000,
    avg_salary_max: 4000
  },
  { 
    code: '4110-05', 
    title: 'Auxiliar de escritório', 
    synonyms: [],
    avg_salary_min: 1800,
    avg_salary_max: 3500
  },
  { 
    code: '2522-10', 
    title: 'Contador', 
    synonyms: ['contabilidade'],
    avg_salary_min: 4000,
    avg_salary_max: 9000
  },
  
  // Design e Produto
  { 
    code: '2624-10', 
    title: 'Designer gráfico', 
    synonyms: ['visual designer', 'ui designer'],
    avg_salary_min: 3000,
    avg_salary_max: 8000
  },
  { 
    code: '2624-05', 
    title: 'Designer industrial', 
    synonyms: ['product designer', 'ux designer'],
    avg_salary_min: 5000,
    avg_salary_max: 14000
  },
  { 
    code: '1423-05', 
    title: 'Gerente de marketing', 
    synonyms: ['marketing manager', 'cmo'],
    avg_salary_min: 12000,
    avg_salary_max: 28000
  },
];

async function seedCbo() {
  console.log('🚀 Iniciando carga de dados CBO para TalentForge...');
  console.log(`📡 Conectando em: ${supabaseUrl}`);

  let s = 0;
  let e = 0;

  for (const item of cboData) {
    const { error } = await supabase
      .from('ref_cbo')
      .upsert({
        code: item.code,
        title: item.title,
        synonyms: item.synonyms,
        avg_salary_min: item.avg_salary_min,
        avg_salary_max: item.avg_salary_max
      }, { onConflict: 'code' });

    if (error) {
      console.error(`❌ Erro ao inserir ${item.title}:`, error.message);
      e++;
    } else {
      console.log(`✅ Inserido: [${item.code}] ${item.title}`);
      s++;
    }
  }

  console.log('------------------------------------------------');
  console.log(`🏁 Processo finalizado.`);
  console.log(`✅ Sucessos: ${s}`);
  console.log(`❌ Falhas: ${e}`);
}

seedCbo();
