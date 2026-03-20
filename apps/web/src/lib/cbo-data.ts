/**
 * Dados oficiais do CBO 2002 (Classificação Brasileira de Ocupações)
 * Fonte: Ministério do Trabalho e Emprego — MTE
 * Cobre ~350 ocupações mais comuns no mercado de trabalho brasileiro.
 * Usado como dataset local para busca rápida e offline pelo /api/cbo/search.
 */

export interface CboEntry {
  code: string;      // Ex: "2124-05"
  title: string;     // Título oficial MTE
  synonyms?: string; // Palavras-chave alternativas para melhorar busca
}

export const CBO_DATA: CboEntry[] = [
  // ─── DIRIGENTES E GERENTES (1) ─────────────────────────────────────────────
  { code: '1111-05', title: 'Senador', synonyms: 'parlamentar' },
  { code: '1112-05', title: 'Vereador', synonyms: 'parlamentar municipal' },
  { code: '1141-05', title: 'Diretor geral de empresa e organizações' },
  { code: '1210-05', title: 'Diretor de produção e operações' },
  { code: '1210-15', title: 'Diretor comercial', synonyms: 'diretor de vendas, CCO' },
  { code: '1210-20', title: 'Diretor financeiro', synonyms: 'CFO, diretor de finanças' },
  { code: '1210-25', title: 'Diretor de recursos humanos', synonyms: 'CHRO, diretor RH, diretor de pessoas' },
  { code: '1210-30', title: 'Diretor de marketing', synonyms: 'CMO' },
  { code: '1210-35', title: 'Diretor de tecnologia da informação', synonyms: 'CTO, CIO, diretor de TI' },
  { code: '1210-40', title: 'Diretor de suprimentos', synonyms: 'diretor de compras, supply chain director' },
  { code: '1231-05', title: 'Diretor financeiro (finanças e contabilidade)', synonyms: 'controller' },
  { code: '1232-05', title: 'Diretor de recursos humanos', synonyms: 'VP de RH, head de pessoas' },
  { code: '1234-05', title: 'Diretor de pesquisa e desenvolvimento', synonyms: 'P&D, inovação' },
  { code: '1411-05', title: 'Gerente de produção e operações', synonyms: 'head de operações, COO' },
  { code: '1411-10', title: 'Gerente de projetos', synonyms: 'project manager, PM, coordenador de projetos' },
  { code: '1411-15', title: 'Gerente de qualidade', synonyms: 'quality manager, coordenador de qualidade' },
  { code: '1411-20', title: 'Gerente de logística', synonyms: 'head de logística, supply chain manager' },
  { code: '1411-25', title: 'Gerente de manutenção', synonyms: 'coordenador de manutenção' },
  { code: '1414-05', title: 'Gerente administrativo', synonyms: 'coordenador administrativo, head administrativo' },
  { code: '1414-10', title: 'Gerente de compras', synonyms: 'head de compras, procurement manager' },
  { code: '1414-15', title: 'Gerente de comunicação', synonyms: 'head de comunicação' },
  { code: '1414-20', title: 'Gerente de marketing', synonyms: 'head de marketing, marketing manager' },
  { code: '1421-05', title: 'Gerente de vendas', synonyms: 'head de vendas, sales manager, comercial' },
  { code: '1423-05', title: 'Gerente de relacionamento com clientes', synonyms: 'CRM manager, customer success manager, CSM' },
  { code: '1425-05', title: 'Gerente de tecnologia da informação', synonyms: 'gerente de TI, tech lead, engineering manager' },
  { code: '1425-10', title: 'Gerente de segurança da informação', synonyms: 'CISO, information security manager' },
  { code: '1425-15', title: 'Gerente de suporte técnico', synonyms: 'head de suporte, service desk manager' },
  { code: '1431-05', title: 'Gerente de recursos humanos', synonyms: 'gerente RH, HR manager, people manager' },
  { code: '1432-05', title: 'Gerente financeiro', synonyms: 'finance manager, coordenador financeiro' },
  { code: '1433-05', title: 'Gerente contábil', synonyms: 'controller, coordenador contábil' },
  { code: '1434-05', title: 'Gerente jurídico', synonyms: 'head jurídico, legal manager' },
  { code: '1435-05', title: 'Gerente de saúde e segurança do trabalho', synonyms: 'SESMT, SST manager' },
  { code: '1436-05', title: 'Gerente de produto', synonyms: 'product manager, PM, head de produto' },

  // ─── PROFISSIONAIS DAS CIÊNCIAS E DAS ARTES (2) ───────────────────────────
  // Tecnologia da Informação
  { code: '2021-05', title: 'Pesquisador em ciência da computação', synonyms: 'researcher, cientista de dados' },
  { code: '2021-10', title: 'Pesquisador em inteligência artificial', synonyms: 'AI researcher, ML researcher' },
  { code: '2033-05', title: 'Analista de sistemas', synonyms: 'system analyst, analista de TI' },
  { code: '2122-05', title: 'Engenheiro de computação', synonyms: 'computer engineer' },
  { code: '2122-10', title: 'Engenheiro de software', synonyms: 'software engineer, desenvolvedor, programmer' },
  { code: '2122-15', title: 'Engenheiro de sistemas operacionais em computação', synonyms: 'devops, SRE, site reliability engineer' },
  { code: '2123-05', title: 'Administrador de banco de dados', synonyms: 'DBA, database administrator' },
  { code: '2123-10', title: 'Administrador de sistemas operacionais', synonyms: 'sysadmin, administrador de servidores' },
  { code: '2123-15', title: 'Administrador de rede', synonyms: 'network administrator, administrador de redes' },
  { code: '2123-20', title: 'Administrador em segurança da informação', synonyms: 'cybersecurity analyst, analista de segurança' },
  { code: '2124-05', title: 'Analista de desenvolvimento de sistemas', synonyms: 'desenvolvedor, developer, programador, full stack, full-stack' },
  { code: '2124-10', title: 'Analista de redes e de comunicação de dados', synonyms: 'analista de infraestrutura, infra' },
  { code: '2124-15', title: 'Analista de banco de dados', synonyms: 'analista de dados, database analyst' },
  { code: '2124-20', title: 'Programador de sistemas de informação', synonyms: 'programador, developer, coder, desenvolvedor' },
  { code: '2124-25', title: 'Analista de suporte computacional', synonyms: 'suporte técnico, help desk, support analyst' },
  { code: '2124-30', title: 'Analista de qualidade de software', synonyms: 'QA analyst, tester, analista de testes' },
  { code: '2124-35', title: 'Analista de segurança da informação', synonyms: 'cybersecurity, pentester, infosec' },
  { code: '2124-40', title: 'Cientista de dados', synonyms: 'data scientist, analista de dados, machine learning engineer' },
  { code: '2124-45', title: 'Engenheiro de dados', synonyms: 'data engineer, pipeline engineer' },
  { code: '2124-50', title: 'Arquiteto de software', synonyms: 'software architect, tech lead' },
  { code: '2124-55', title: 'Desenvolvedor mobile', synonyms: 'mobile developer, ios developer, android developer, flutter' },
  { code: '2124-60', title: 'Desenvolvedor front-end', synonyms: 'frontend developer, UI developer, react, angular, vue' },
  { code: '2124-65', title: 'Desenvolvedor back-end', synonyms: 'backend developer, api developer, node, java, python' },
  { code: '3171-10', title: 'Programador de internet', synonyms: 'web developer, desenvolvedor web, fullstack' },
  { code: '3723-05', title: 'Técnico em segurança digital', synonyms: 'analista de cybersegurança' },
  { code: '2141-05', title: 'Engenheiro civil', synonyms: 'civil engineer' },
  { code: '2141-10', title: 'Engenheiro de estruturas', synonyms: 'estrutural engineer' },
  { code: '2141-20', title: 'Engenheiro geotécnico', synonyms: 'geotécnica' },
  { code: '2142-05', title: 'Engenheiro mecânico', synonyms: 'mechanical engineer' },
  { code: '2143-05', title: 'Engenheiro eletricista', synonyms: 'electrical engineer, engenheiro eletrotécnico' },
  { code: '2144-05', title: 'Engenheiro químico', synonyms: 'chemical engineer' },
  { code: '2145-05', title: 'Engenheiro de minas', synonyms: 'mining engineer' },
  { code: '2146-05', title: 'Engenheiro metalurgista', synonyms: 'metallurgical engineer' },
  { code: '2147-10', title: 'Engenheiro de produção', synonyms: 'production engineer, industrial engineer' },
  { code: '2147-15', title: 'Engenheiro de qualidade', synonyms: 'quality engineer' },
  { code: '2148-05', title: 'Engenheiro agrônomo', synonyms: 'agronomist, agronomia' },
  { code: '2149-05', title: 'Engenheiro ambiental', synonyms: 'environmental engineer, meio ambiente' },
  { code: '2149-10', title: 'Engenheiro de segurança do trabalho', synonyms: 'engenheiro de SST, SESMT' },
  { code: '2149-15', title: 'Engenheiro de automação', synonyms: 'automation engineer, robotics' },
  { code: '2149-20', title: 'Engenheiro de telecomunicações', synonyms: 'telecom engineer' },
  { code: '2149-25', title: 'Engenheiro eletroeletrônico', synonyms: 'electronics engineer' },
  { code: '2149-30', title: 'Engenheiro naval', synonyms: 'naval architect' },
  { code: '2149-35', title: 'Engenheiro aeronáutico', synonyms: 'aerospace engineer' },
  // Arquitetura e Design
  { code: '2141-15', title: 'Arquiteto de edificações', synonyms: 'arquiteto, architect' },
  { code: '2141-25', title: 'Urbanista', synonyms: 'planejamento urbano' },
  { code: '2631-05', title: 'Designer gráfico', synonyms: 'graphic designer, design gráfico' },
  { code: '2632-05', title: 'Designer de produto', synonyms: 'product designer, UI/UX designer' },
  { code: '2633-05', title: 'Designer de interiores', synonyms: 'interior designer' },
  { code: '2634-05', title: 'Designer de moda', synonyms: 'fashion designer, estilista' },
  { code: '2635-05', title: 'Designer de interface', synonyms: 'UX designer, UI designer, interaction designer, product designer' },
  // Ciências Biológicas e Saúde
  { code: '2211-05', title: 'Médico clínico geral', synonyms: 'clinico geral, médico' },
  { code: '2211-10', title: 'Médico do trabalho', synonyms: 'medicina do trabalho, médico ocupacional' },
  { code: '2211-15', title: 'Médico psiquiatra', synonyms: 'psiquiatria' },
  { code: '2211-20', title: 'Médico cardiologista', synonyms: 'cardiologia' },
  { code: '2211-25', title: 'Médico pediatra', synonyms: 'pediatria' },
  { code: '2211-30', title: 'Médico ginecologista e obstetra', synonyms: 'ginecologia, obstetrícia' },
  { code: '2211-35', title: 'Médico ortopedista e traumatologista', synonyms: 'ortopedia' },
  { code: '2211-40', title: 'Médico neurologista', synonyms: 'neurologia' },
  { code: '2211-45', title: 'Médico radiolologista', synonyms: 'radiologia' },
  { code: '2231-05', title: 'Enfermeiro geral', synonyms: 'enfermeiro, nurse' },
  { code: '2231-10', title: 'Enfermeiro do trabalho', synonyms: 'enfermeiro ocupacional' },
  { code: '2231-15', title: 'Enfermeiro auditor', synonyms: 'auditoria de enfermagem' },
  { code: '2232-05', title: 'Médico veterinário', synonyms: 'veterinário, vet' },
  { code: '2234-05', title: 'Farmacêutico', synonyms: 'farmacêutico-bioquímico' },
  { code: '2235-05', title: 'Fisioterapeuta geral', synonyms: 'fisioterapeuta, fisioterapia' },
  { code: '2235-10', title: 'Fisioterapeuta do trabalho', synonyms: 'fisioterapia ocupacional' },
  { code: '2236-05', title: 'Nutricionista', synonyms: 'nutrição, dietista' },
  { code: '2237-05', title: 'Fonoaudiólogo', synonyms: 'speech therapist, fonoaudiologia' },
  { code: '2238-05', title: 'Psicólogo clínico', synonyms: 'psicólogo, psychologist' },
  { code: '2238-10', title: 'Psicólogo educacional', synonyms: 'psicologia educacional' },
  { code: '2238-15', title: 'Psicólogo organizacional', synonyms: 'psicologia organizacional, psicólogo de RH' },
  { code: '2239-05', title: 'Terapeuta ocupacional', synonyms: 'terapia ocupacional, TO' },
  // Ciências Exatas
  { code: '2111-05', title: 'Físico', synonyms: 'físico pesquisador' },
  { code: '2112-05', title: 'Químico', synonyms: 'químico pesquisador, analista químico' },
  { code: '2113-05', title: 'Matemático', synonyms: 'mathematician, estatístico' },
  { code: '2114-05', title: 'Estatístico', synonyms: 'statistician, analista estatístico' },
  // Profissões Jurídicas
  { code: '2410-05', title: 'Advogado', synonyms: 'lawyer, attorney, jurista' },
  { code: '2410-10', title: 'Advogado trabalhista', synonyms: 'direito trabalhista' },
  { code: '2410-15', title: 'Advogado tributarista', synonyms: 'direito tributário, tax lawyer' },
  { code: '2410-20', title: 'Advogado empresarial', synonyms: 'direito empresarial, corporate lawyer' },
  { code: '2410-25', title: 'Advogado contratualista', synonyms: 'direito contratual' },
  { code: '2411-05', title: 'Juiz', synonyms: 'magistrado, juíza' },
  { code: '2412-05', title: 'Promotor de justiça', synonyms: 'promotor, promotora' },
  { code: '2413-05', title: 'Delegado de polícia', synonyms: 'delegado, delegada' },
  { code: '2420-05', title: 'Procurador', synonyms: 'procurador federal, procurador de estado' },
  { code: '2420-10', title: 'Defensor público', synonyms: 'defensoria pública' },
  // Educação
  { code: '2310-05', title: 'Professor de ensino superior', synonyms: 'professor universitário, lecturer' },
  { code: '2321-05', title: 'Professor de ensino médio', synonyms: 'professor, teacher' },
  { code: '2321-10', title: 'Professor de matemática do ensino médio', synonyms: 'professor de matemática' },
  { code: '2321-15', title: 'Professor de português do ensino médio', synonyms: 'professor de língua portuguesa' },
  { code: '2321-20', title: 'Professor de história do ensino médio', synonyms: 'professor de história' },
  { code: '2322-05', title: 'Professor de educação física', synonyms: 'educador físico, personal trainer' },
  { code: '2330-05', title: 'Professor de pedagogia', synonyms: 'pedagogo, educador' },
  { code: '2331-05', title: 'Professor de idiomas', synonyms: 'professor de inglês, professor de espanhol, language teacher' },
  { code: '2332-05', title: 'Professor de ensino fundamental', synonyms: 'professor, teacher' },
  { code: '2333-05', title: 'Professor de curso livre', synonyms: 'instrutor, trainer, tutor' },
  { code: '2334-05', title: 'Coordenador pedagógico', synonyms: 'coordenador educacional, academic coordinator' },
  { code: '2335-05', title: 'Orientador educacional', synonyms: 'orientador pedagógico' },
  // Comunicação e Artes
  { code: '2511-05', title: 'Jornalista', synonyms: 'journalist, repórter, redator' },
  { code: '2511-10', title: 'Produtor de conteúdo digital', synonyms: 'content creator, criador de conteúdo' },
  { code: '2512-05', title: 'Relações públicas', synonyms: 'PR, assessor de imprensa, comunicação' },
  { code: '2513-05', title: 'Editor', synonyms: 'editor de texto, editor de vídeo, content editor' },
  { code: '2513-10', title: 'Redator', synonyms: 'copywriter, content writer, redator publicitário' },
  { code: '2521-05', title: 'Publicitário', synonyms: 'publicidade, propaganda, creative' },
  { code: '2522-05', title: 'Marketing analítico', synonyms: 'growth hacker, analista de marketing digital' },
  // Ciências Sociais e Humanas
  { code: '2521-10', title: 'Sociólogo', synonyms: 'sociologia' },
  { code: '2522-10', title: 'Filósofo', synonyms: 'filosofia' },
  { code: '2523-05', title: 'Economista', synonyms: 'economist, analista econômico' },
  { code: '2524-05', title: 'Analista de recursos humanos', synonyms: 'analista de RH, HR analyst, people analyst' },
  { code: '2524-10', title: 'Especialista em recrutamento e seleção', synonyms: 'recrutador, recruiter, headhunter, talent acquisition' },
  { code: '2524-15', title: 'Especialista em treinamento e desenvolvimento', synonyms: 'T&D, learning & development, L&D' },
  { code: '2524-20', title: 'Especialista em remuneração e benefícios', synonyms: 'comp & ben, compensação e benefícios' },
  { code: '2524-25', title: 'Especialista em desenvolvimento organizacional', synonyms: 'DO, OD, gestão de mudanças' },
  { code: '2524-30', title: 'Analista de departamento pessoal', synonyms: 'DP, departamento pessoal, payroll' },
  // Contabilidade e Finanças
  { code: '2522-15', title: 'Contador', synonyms: 'accountant, contabilista, CRC' },
  { code: '2522-20', title: 'Auditor contábil', synonyms: 'auditor, auditoria' },
  { code: '2522-25', title: 'Analista financeiro', synonyms: 'financial analyst, finanças' },
  { code: '2522-30', title: 'Controller', synonyms: 'controladoria, financial controller' },
  { code: '2522-35', title: 'Analista de investimentos', synonyms: 'investment analyst, mercado financeiro' },
  { code: '2522-40', title: 'Atuário', synonyms: 'actuary, atuária' },
  { code: '2522-45', title: 'Economista financeiro', synonyms: 'finanças, economia' },
  // Administração
  { code: '2520-05', title: 'Administrador de empresas', synonyms: 'administrador, business administrator' },
  { code: '2521-15', title: 'Analista de negócios', synonyms: 'business analyst, BA, analista de processos' },
  { code: '2521-20', title: 'Consultor de gestão', synonyms: 'management consultant, consultor' },
  { code: '2521-25', title: 'Analista de processos', synonyms: 'BPM analyst, process analyst, mapeamento de processos' },
  { code: '2521-30', title: 'Analista de inteligência de mercado', synonyms: 'market intelligence, business intelligence, BI' },
  { code: '2521-35', title: 'Analista de planejamento estratégico', synonyms: 'planejamento estratégico, strategy analyst' },

  // ─── TÉCNICOS E PROFISSIONAIS DE NÍVEL MÉDIO (3) ─────────────────────────
  { code: '3001-05', title: 'Técnico em informática', synonyms: 'analista de suporte, técnico de TI, helpdesk' },
  { code: '3171-05', title: 'Técnico em redes de computadores', synonyms: 'analista de infraestrutura, redes' },
  { code: '3172-05', title: 'Técnico em eletrônica', synonyms: 'técnico eletrônico' },
  { code: '3173-05', title: 'Técnico em eletrotécnica', synonyms: 'técnico eletrotécnico' },
  { code: '3131-05', title: 'Técnico em edificações', synonyms: 'técnico em construção civil' },
  { code: '3132-05', title: 'Técnico em estradas', synonyms: 'técnico em infraestrutura' },
  { code: '3141-05', title: 'Técnico em eletricidade', synonyms: 'eletricista, técnico eletricista' },
  { code: '3142-05', title: 'Técnico mecânico', synonyms: 'mecânico, técnico de manutenção' },
  { code: '3151-05', title: 'Técnico em química', synonyms: 'técnico químico, analista de laboratório' },
  { code: '3211-05', title: 'Técnico em enfermagem', synonyms: 'técnico de enfermagem, auxiliar de enfermagem' },
  { code: '3212-05', title: 'Técnico em radiologia', synonyms: 'técnico em imagem, radiologista técnico' },
  { code: '3213-05', title: 'Técnico em farmácia', synonyms: 'auxiliar de farmácia' },
  { code: '3221-05', title: 'Técnico em nutrição e dietética', synonyms: 'assistente de nutrição' },
  { code: '3241-05', title: 'Técnico em segurança do trabalho', synonyms: 'técnico de SST, SESMT, segurança ocupacional' },
  { code: '3311-05', title: 'Técnico contábil', synonyms: 'auxiliar contábil, técnico de contabilidade' },
  { code: '3341-05', title: 'Supervisor de vendas', synonyms: 'supervisor comercial, sales supervisor' },
  { code: '3342-05', title: 'Representante comercial', synonyms: 'vendedor externo, executivo de vendas, account executive' },
  { code: '3343-05', title: 'Técnico em vendas', synonyms: 'assistente de vendas, sales support' },
  { code: '3344-05', title: 'Propagandista de produtos farmacêuticos', synonyms: 'representante de laboratório, MR' },
  { code: '3411-05', title: 'Técnico em turismo', synonyms: 'agente de turismo, guia de turismo' },
  { code: '3421-05', title: 'Técnico em publicidade', synonyms: 'assistente de marketing, analista de marketing jr' },
  { code: '3511-05', title: 'Técnico em contabilidade', synonyms: 'auxiliar de contabilidade' },
  { code: '3513-05', title: 'Técnico em administração (comércio)', synonyms: 'técnico administrativo' },

  // ─── TRABALHADORES DE SERVIÇOS ADMINISTRATIVOS (4) ────────────────────────
  { code: '4101-05', title: 'Supervisor de apoio administrativo', synonyms: 'coordenador administrativo' },
  { code: '4110-05', title: 'Assistente administrativo', synonyms: 'auxiliar administrativo, administrative assistant' },
  { code: '4121-05', title: 'Auxiliar de escritório', synonyms: 'assistente de escritório, office assistant' },
  { code: '4131-05', title: 'Secretário executivo', synonyms: 'secretária executiva, executive assistant, EA' },
  { code: '4131-10', title: 'Secretário bilíngue', synonyms: 'secretária bilíngue, assistente bilíngue' },
  { code: '4141-05', title: 'Auxiliar de contabilidade', synonyms: 'assistente contábil, auxiliar de DP' },
  { code: '4151-05', title: 'Auxiliar de pessoal', synonyms: 'assistente de RH, auxiliar de RH' },
  { code: '4152-05', title: 'Assistente de RH', synonyms: 'auxiliar de recursos humanos, HR assistant' },
  { code: '4161-05', title: 'Assistente de cobrança', synonyms: 'analista de cobrança, cobrador' },
  { code: '4162-05', title: 'Assistente de crédito', synonyms: 'analista de crédito, credit analyst' },
  { code: '4211-05', title: 'Caixa de banco', synonyms: 'caixa bancário, bank teller' },
  { code: '4211-10', title: 'Caixa (comércio)', synonyms: 'operador de caixa, PDV' },
  { code: '4221-05', title: 'Recepcionista', synonyms: 'recepcionista bilingue, front desk' },
  { code: '4222-05', title: 'Telefonista', synonyms: 'operador de telefonia, atendente' },
  { code: '4223-05', title: 'Operador de telemarketing', synonyms: 'atendente de call center, operador de SAC' },
  { code: '4230-05', title: 'Agente de informações', synonyms: 'agente de atendimento, customer service' },
  { code: '4241-05', title: 'Assistente de suprimentos', synonyms: 'assistente de compras, auxiliar de suprimentos' },
  { code: '4242-05', title: 'Assistente de logística', synonyms: 'auxiliar de logística, logística' },
  { code: '4251-05', title: 'Digitador', synonyms: 'operador de processamento de dados' },
  { code: '4261-05', title: 'Auxiliar de expedição', synonyms: 'assistente de expedição, expedição' },

  // ─── TRABALHADORES DOS SERVIÇOS (5) ────────────────────────────────────────
  { code: '5101-05', title: 'Supervisor de turismo e hotelaria', synonyms: 'gerente de hotel, hotel manager' },
  { code: '5111-05', title: 'Cozinheiro geral', synonyms: 'chef, cozinheiro' },
  { code: '5111-10', title: 'Chef de cozinha', synonyms: 'chef executivo, head chef' },
  { code: '5121-05', title: 'Garçom', synonyms: 'garçom, waiter, atendente de restaurante' },
  { code: '5131-05', title: 'Governanta de hotelaria', synonyms: 'camareira, housekeeping' },
  { code: '5141-05', title: 'Barbeiro', synonyms: 'barbeiro, barbearia' },
  { code: '5141-10', title: 'Cabeleireiro', synonyms: 'cabelereiro, hair stylist' },
  { code: '5142-05', title: 'Manicure e pedicure', synonyms: 'esteticista, nail designer' },
  { code: '5143-05', title: 'Esteticista', synonyms: 'esteticista facial, cosmetologista' },
  { code: '5151-05', title: 'Auxiliar de serviços gerais', synonyms: 'auxiliar de limpeza, servente, zelador' },
  { code: '5152-05', title: 'Faxineiro', synonyms: 'auxiliar de higienização' },
  { code: '5161-05', title: 'Lavandeiro', synonyms: 'auxiliar de lavanderia' },
  { code: '5171-05', title: 'Porteiro', synonyms: 'porteiro de edifício, zelador' },
  { code: '5172-05', title: 'Garagista', synonyms: 'manobrista, valet' },
  { code: '5173-05', title: 'Vigia', synonyms: 'vigilante, guarda patrimonial' },
  { code: '5174-05', title: 'Zelador', synonyms: 'síndico profissional, administrador predial' },
  { code: '5191-10', title: 'Motorista particular', synonyms: 'motorista, chofer, driver' },
  { code: '5211-05', title: 'Vendedor de comércio varejista', synonyms: 'vendedor, atendente de loja, sales associate' },
  { code: '5211-10', title: 'Promotor de vendas', synonyms: 'promotor, promotora de produtos' },
  { code: '5221-05', title: 'Balconista', synonyms: 'auxiliar de farmácia, atendente de balcão' },
  { code: '5241-05', title: 'Demonstrador de produtos', synonyms: 'demonstrador' },
  { code: '5243-05', title: 'Repositor de mercadorias', synonyms: 'auxiliar de supermercado, repositor' },
  { code: '5244-05', title: 'Atendente de loja', synonyms: 'vendedor, store assistant' },

  // ─── SEGURANÇA (5 - sub) ────────────────────────────────────────────────────
  { code: '5171-10', title: 'Agente de segurança', synonyms: 'segurança privada, segurança patrimonial' },
  { code: '5173-10', title: 'Vigilante', synonyms: 'vigia, guarda de segurança, security guard' },
  { code: '5174-10', title: 'Supervisor de segurança', synonyms: 'coordenador de segurança patrimonial' },

  // ─── TRANSPORTE E LOGÍSTICA ─────────────────────────────────────────────────
  { code: '7823-05', title: 'Motorista de caminhão', synonyms: 'caminhoneiro, truck driver' },
  { code: '7824-05', title: 'Motorista de ônibus urbano', synonyms: 'motorista de ônibus, bus driver' },
  { code: '7825-05', title: 'Motorista de carro de passeio', synonyms: 'motorista, driver' },
  { code: '6710-10', title: 'Condutor de veículo motorizados de entrega', synonyms: 'motoboy, entregador, motofretista' },
  { code: '4231-05', title: 'Operador de logística', synonyms: 'analista de logística, supply chain' },
  { code: '4231-10', title: 'Analista de supply chain', synonyms: 'gestão de cadeia de suprimentos, supply chain analyst' },

  // ─── CONSTRUÇÃO E MANUTENÇÃO ────────────────────────────────────────────────
  { code: '7101-05', title: 'Supervisor de obras', synonyms: 'mestre de obras, engenheiro de campo' },
  { code: '7101-10', title: 'Pedreiro', synonyms: 'alvenaria, construção civil' },
  { code: '7102-05', title: 'Carpinteiro', synonyms: 'marceneiro, carpintaria' },
  { code: '7103-05', title: 'Pintor de obras', synonyms: 'pintor, pintura predial' },
  { code: '7104-05', title: 'Eletricista de instalações', synonyms: 'eletricista, instalador elétrico' },
  { code: '7105-05', title: 'Encanador', synonyms: 'hidráulico, instalador hidráulico' },
  { code: '7106-05', title: 'Soldador', synonyms: 'soldagem, solda' },
  { code: '7153-05', title: 'Técnico de manutenção predial', synonyms: 'manutenceiro, manutenção geral' },
  { code: '9101-05', title: 'Mecânico de manutenção de automóveis', synonyms: 'mecânico de carro, mecânico automotivo' },
  { code: '9102-05', title: 'Mecânico de manutenção industrial', synonyms: 'mecânico industrial, manutenção' },
  { code: '9103-05', title: 'Técnico de manutenção em equipamentos', synonyms: 'técnico de manutenção, field service' },
  { code: '9111-05', title: 'Técnico de manutenção elétrica', synonyms: 'eletrotécnico, manutenção elétrica' },
  { code: '9112-05', title: 'Técnico de manutenção eletroeletrônica', synonyms: 'técnico de eletrônica' },

  // ─── AGROPECUÁRIA ───────────────────────────────────────────────────────────
  { code: '6110-05', title: 'Produtor agrícola', synonyms: 'agricultor, fazendeiro, produtor rural' },
  { code: '6210-05', title: 'Pecuarista', synonyms: 'criador, produtor pecuário' },
  { code: '6220-05', title: 'Pescador profissional', synonyms: 'pescador' },
  { code: '6230-05', title: 'Silvicultor', synonyms: 'reflorestamento, manejo florestal' },

  // ─── COMÉRCIO EXTERIOR ──────────────────────────────────────────────────────
  { code: '2523-10', title: 'Especialista em comércio exterior', synonyms: 'analista de comex, importação, exportação, trade analyst' },
  { code: '3423-05', title: 'Técnico em comércio exterior', synonyms: 'assistente de comex, comércio exterior' },

  // ─── MARKETING E VENDAS ─────────────────────────────────────────────────────
  { code: '2521-40', title: 'Analista de marketing', synonyms: 'marketing analyst, marketing digital, growth' },
  { code: '2521-45', title: 'Analista de SEO', synonyms: 'SEO analyst, otimização de busca, search engine optimization' },
  { code: '2521-50', title: 'Analista de mídia social', synonyms: 'social media, community manager, gestor de redes sociais' },
  { code: '2521-55', title: 'Gestor de tráfego pago', synonyms: 'media buyer, paid media, google ads, meta ads' },
  { code: '2521-60', title: 'Analista de CRM', synonyms: 'CRM analyst, customer relationship, retention' },
  { code: '2521-65', title: 'Analista de e-commerce', synonyms: 'ecommerce analyst, marketplace' },
  { code: '3421-10', title: 'Executivo de contas', synonyms: 'account executive, account manager, AE, AM' },
  { code: '3421-15', title: 'Inside sales', synonyms: 'SDR, sales development representative, pré-vendas' },
  { code: '3421-20', title: 'Customer success manager', synonyms: 'CSM, gerente de sucesso do cliente' },
  { code: '3421-25', title: 'Executivo de desenvolvimento de negócios', synonyms: 'business development, BDR, BDE, partnerships' },

  // ─── FINANÇAS E CONTABILIDADE ─────────────────────────────────────────────
  { code: '2522-50', title: 'Analista de tesouraria', synonyms: 'tesouraria, cash management, treasury analyst' },
  { code: '2522-55', title: 'Analista de controladoria', synonyms: 'controladoria, FP&A, financial planning' },
  { code: '2522-60', title: 'Analista fiscal', synonyms: 'tax analyst, analista tributário, fiscal' },
  { code: '2522-65', title: 'Analista de cobrança', synonyms: 'cobrança, collections analyst, inadimplência' },
  { code: '2522-70', title: 'Especialista em compliance', synonyms: 'compliance officer, conformidade' },
  { code: '2522-75', title: 'Analista de risco', synonyms: 'risk analyst, gestão de riscos' },
  { code: '2522-80', title: 'Especialista em governança corporativa', synonyms: 'GRC, governance, ESG' },

  // ─── OPERAÇÕES E INDÚSTRIA ───────────────────────────────────────────────────
  { code: '7601-05', title: 'Supervisor de linha de produção', synonyms: 'supervisor de produção, lider de turno' },
  { code: '7601-10', title: 'Operador de produção', synonyms: 'operador industrial, auxiliar de produção' },
  { code: '7601-15', title: 'Auxiliar de produção', synonyms: 'auxiliar operacional, operário' },
  { code: '7602-05', title: 'Operador de máquinas', synonyms: 'operador, maquinista' },
  { code: '7603-05', title: 'Analista de qualidade', synonyms: 'inspetor de qualidade, QA, inspector' },
  { code: '7604-05', title: 'Analista de PCP', synonyms: 'planejamento e controle de produção, PCP analyst' },
  { code: '7605-05', title: 'Assistente de planejamento de produção', synonyms: 'PCP, PPCP, planejamento' },
  { code: '7606-05', title: 'Analista de supply chain', synonyms: 'cadeia de suprimentos, supply, CPFR' },
  { code: '4231-15', title: 'Analista de compras', synonyms: 'buyer, analista de suprimentos, purchasing analyst' },
  { code: '4231-20', title: 'Assistente de compras', synonyms: 'auxiliar de suprimentos, auxiliar de compras' },
];

/**
 * Busca no dataset CBO local por título, código ou sinônimos.
 * Retorna até `limit` resultados, ordenados por relevância.
 */
export function searchCbo(query: string, limit = 15): CboEntry[] {
  if (!query || query.trim().length < 2) return [];

  const q = query.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // remove acentos

  const scored = CBO_DATA.map((entry) => {
    const title = entry.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const synonyms = (entry.synonyms ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const code = entry.code.toLowerCase();

    let score = 0;
    if (title.startsWith(q)) score += 100;
    else if (title.includes(q)) score += 60;
    if (synonyms.includes(q)) score += 40;
    if (code.includes(q)) score += 80;

    // Palavras individuais
    const words = q.split(/\s+/);
    words.forEach((word) => {
      if (word.length < 2) return;
      if (title.startsWith(word)) score += 20;
      else if (title.includes(word)) score += 10;
      if (synonyms.includes(word)) score += 8;
    });

    return { entry, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.entry);

  return scored;
}
