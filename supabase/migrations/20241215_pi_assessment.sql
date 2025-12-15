-- Migration: TF-PI (Drives Comportamentais)
-- Created: 2024-12-15
-- Descrição: Estrutura completa para o teste TF-PI (Perfil Natural x Perfil Adaptado) com eixos: direção, energia social, ritmo, estrutura.

-- Enums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pi_axis') THEN
    CREATE TYPE pi_axis AS ENUM ('direcao', 'energia_social', 'ritmo', 'estrutura');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pi_block') THEN
    CREATE TYPE pi_block AS ENUM ('natural', 'adaptado');
  END IF;
END $$;

-- Assessments
CREATE TABLE IF NOT EXISTS pi_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('draft', 'in_progress', 'completed')) DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  scores_natural JSONB,   -- { direcao, energia_social, ritmo, estrutura }
  scores_adapted JSONB,   -- { direcao, energia_social, ritmo, estrutura }
  gaps JSONB              -- { direcao, energia_social, ritmo, estrutura }
);
CREATE INDEX IF NOT EXISTS pi_assessments_user_idx ON pi_assessments(candidate_user_id);

-- Descritores (lista PI-like)
CREATE TABLE IF NOT EXISTS pi_descriptors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descriptor TEXT NOT NULL,
  axis pi_axis NOT NULL,
  position INT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (descriptor)
);

-- Questões situacionais (4 alternativas, cada uma ligada a um eixo)
CREATE TABLE IF NOT EXISTS pi_situational_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_number INT NOT NULL,
  prompt TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  option_a_axis pi_axis NOT NULL,
  option_b_axis pi_axis NOT NULL,
  option_c_axis pi_axis NOT NULL,
  option_d_axis pi_axis NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (question_number)
);

-- Respostas de descritores (multi-seleção por bloco)
CREATE TABLE IF NOT EXISTS pi_descriptor_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES pi_assessments(id) ON DELETE CASCADE,
  descriptor_id UUID NOT NULL REFERENCES pi_descriptors(id) ON DELETE CASCADE,
  block pi_block NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (assessment_id, descriptor_id, block)
);
CREATE INDEX IF NOT EXISTS pi_descriptor_responses_assessment_idx ON pi_descriptor_responses(assessment_id);

-- Respostas situacionais (escolha única por bloco)
CREATE TABLE IF NOT EXISTS pi_situational_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES pi_assessments(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES pi_situational_questions(id) ON DELETE CASCADE,
  block pi_block NOT NULL,
  selected_axis pi_axis NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (assessment_id, question_id, block)
);
CREATE INDEX IF NOT EXISTS pi_situational_responses_assessment_idx ON pi_situational_responses(assessment_id);

-- RLS
ALTER TABLE pi_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pi_descriptors ENABLE ROW LEVEL SECURITY;
ALTER TABLE pi_situational_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pi_descriptor_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE pi_situational_responses ENABLE ROW LEVEL SECURITY;

-- Policies: leitura autenticada dos bancos de perguntas
CREATE POLICY pi_descriptors_read_authenticated
  ON pi_descriptors
  FOR SELECT
  TO authenticated
  USING (active = TRUE);

CREATE POLICY pi_situational_questions_read_authenticated
  ON pi_situational_questions
  FOR SELECT
  TO authenticated
  USING (active = TRUE);

-- Policies: o próprio usuário gerencia seus assessments
CREATE POLICY pi_assessments_self_select
  ON pi_assessments
  FOR SELECT
  TO authenticated
  USING (candidate_user_id = auth.uid());

CREATE POLICY pi_assessments_self_insert
  ON pi_assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (candidate_user_id = auth.uid());

CREATE POLICY pi_assessments_self_update
  ON pi_assessments
  FOR UPDATE
  TO authenticated
  USING (candidate_user_id = auth.uid())
  WITH CHECK (candidate_user_id = auth.uid());

-- Policies: respostas de descritores
CREATE POLICY pi_descriptor_responses_self_select
  ON pi_descriptor_responses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pi_assessments pa
      WHERE pa.id = pi_descriptor_responses.assessment_id
        AND pa.candidate_user_id = auth.uid()
    )
  );

CREATE POLICY pi_descriptor_responses_self_insert
  ON pi_descriptor_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pi_assessments pa
      WHERE pa.id = assessment_id
        AND pa.candidate_user_id = auth.uid()
    )
  );

CREATE POLICY pi_descriptor_responses_self_update
  ON pi_descriptor_responses
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pi_assessments pa
      WHERE pa.id = pi_descriptor_responses.assessment_id
        AND pa.candidate_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pi_assessments pa
      WHERE pa.id = pi_descriptor_responses.assessment_id
        AND pa.candidate_user_id = auth.uid()
    )
  );

-- Policies: respostas situacionais
CREATE POLICY pi_situational_responses_self_select
  ON pi_situational_responses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pi_assessments pa
      WHERE pa.id = pi_situational_responses.assessment_id
        AND pa.candidate_user_id = auth.uid()
    )
  );

CREATE POLICY pi_situational_responses_self_insert
  ON pi_situational_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pi_assessments pa
      WHERE pa.id = assessment_id
        AND pa.candidate_user_id = auth.uid()
    )
  );

CREATE POLICY pi_situational_responses_self_update
  ON pi_situational_responses
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pi_assessments pa
      WHERE pa.id = pi_situational_responses.assessment_id
        AND pa.candidate_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pi_assessments pa
      WHERE pa.id = pi_situational_responses.assessment_id
        AND pa.candidate_user_id = auth.uid()
    )
  );

-- Seed: descritores (20)
INSERT INTO pi_descriptors (descriptor, axis, position) VALUES
  ('Assume decisões com facilidade', 'direcao', 1),
  ('Prefere liderar do que seguir', 'direcao', 2),
  ('Se sente confortável assumindo responsabilidade', 'direcao', 3),
  ('Questiona ordens quando não fazem sentido', 'direcao', 4),
  ('Gosta de ter autonomia total', 'direcao', 5),

  ('Gosta de convencer pessoas', 'energia_social', 6),
  ('Se sente energizado em interações', 'energia_social', 7),
  ('Fala com facilidade em público', 'energia_social', 8),
  ('Prefere trabalhar em grupo', 'energia_social', 9),
  ('Procura validação externa', 'energia_social', 10),

  ('Trabalha bem sob urgência', 'ritmo', 11),
  ('Alterna tarefas com facilidade', 'ritmo', 12),
  ('Gosta de ambientes dinâmicos', 'ritmo', 13),
  ('Se entedia com rotinas longas', 'ritmo', 14),
  ('Age rapidamente diante de problemas', 'ritmo', 15),

  ('Prefere regras claras', 'estrutura', 16),
  ('Valoriza processos definidos', 'estrutura', 17),
  ('Evita improviso', 'estrutura', 18),
  ('Segue padrões estabelecidos', 'estrutura', 19),
  ('Se sente seguro com previsibilidade', 'estrutura', 20)
ON CONFLICT (descriptor) DO NOTHING;

-- Seed: 30 questões situacionais (A=Direção, B=Energia Social, C=Ritmo, D=Estrutura)
INSERT INTO pi_situational_questions (
  question_number, prompt,
  option_a, option_b, option_c, option_d,
  option_a_axis, option_b_axis, option_c_axis, option_d_axis
) VALUES
  (1, 'Em um projeto com prazo curto e pressão alta, você tende a:', 'Assumir decisões e direcionar o time', 'Mobilizar pessoas para manter engajamento', 'Acelerar o ritmo e atacar o que destrava primeiro', 'Criar um plano com etapas claras para garantir entrega', 'direcao', 'energia_social', 'ritmo', 'estrutura'),
  (2, 'Quando recebe uma tarefa pouco definida, sua reação inicial é:', 'Definir o caminho e seguir adiante', 'Chamar pessoas-chave para alinhar expectativas', 'Começar por um “primeiro passo” rápido para ganhar tração', 'Estruturar requisitos, critérios e sequência antes de iniciar', 'direcao', 'energia_social', 'ritmo', 'estrutura'),
  (3, 'Ao entrar em um time novo, você normalmente:', 'Procura entender onde pode liderar e gerar impacto', 'Faz conexões e constrói relacionamento rapidamente', 'Pega tarefas rápidas para “mostrar serviço”', 'Entende processos, rotinas e combinados do time', 'direcao', 'energia_social', 'ritmo', 'estrutura'),
  (4, 'Quando um problema se repete, você tende a:', 'Tomar controle e cobrar mudança imediata', 'Engajar o grupo para criar compromisso coletivo', 'Testar soluções rápidas até encontrar uma que funcione', 'Padronizar a solução em processo/documentação', 'direcao', 'energia_social', 'ritmo', 'estrutura'),
  (5, 'Em reuniões, você prefere contribuir:', 'Decidindo rumos e eliminando indecisão', 'Garantindo que todos se expressem e estejam alinhados', 'Mantendo ritmo e evitando que a conversa “trave”', 'Registrando decisões e definindo próximos passos claros', 'direcao', 'energia_social', 'ritmo', 'estrutura'),
  (6, 'Quando há conflito entre áreas, você tende a:', 'Definir prioridade e “fechar” a decisão', 'Mediar para preservar relação e acordo', 'Buscar solução rápida para destravar o fluxo', 'Criar regra/fluxo para evitar o mesmo conflito', 'direcao', 'energia_social', 'ritmo', 'estrutura'),
  (7, 'Se o time está desmotivado, você:', 'Reforça metas e responsabilidade', 'Conversa, escuta e reconecta as pessoas ao propósito', 'Cria um desafio curto para recuperar energia', 'Ajusta o processo para reduzir fricções e retrabalho', 'direcao', 'energia_social', 'ritmo', 'estrutura'),
  (8, 'Quando algo foge do plano, você tende a:', 'Redefinir prioridades e comandar a mudança', 'Alinhar com stakeholders para reduzir atrito', 'Improvisar e agir rápido para conter impacto', 'Replanejar com etapas, responsáveis e critérios', 'direcao', 'energia_social', 'ritmo', 'estrutura'),
  (9, 'Ao receber muitos pedidos ao mesmo tempo, você:', 'Decide o que entra e o que não entra', 'Negocia com pessoas para ajustar expectativa', 'Faz triagem rápida e resolve o máximo possível logo', 'Organiza fila, SLA e padrões de atendimento', 'direcao', 'energia_social', 'ritmo', 'estrutura'),
  (10, 'Quando precisa influenciar alguém resistente, você:', 'Enquadra a decisão e define limites', 'Constrói confiança e usa persuasão relacional', 'Cria um piloto rápido para provar valor', 'Leva evidências, regras e critérios objetivos', 'direcao', 'energia_social', 'ritmo', 'estrutura'),
  (11, 'Diante de um erro crítico, você:', 'Assume a frente e coordena a resposta', 'Comunica com cuidado para manter o time coeso', 'Corre para corrigir e restaurar o serviço', 'Faz análise de causa e implementa prevenção', 'direcao', 'energia_social', 'ritmo', 'estrutura'),
  (12, 'Seu jeito mais comum de aumentar performance é:', 'Elevar a barra e cobrar resultado', 'Engajar e fortalecer colaboração', 'Acelerar cadência e reduzir tempo morto', 'Melhorar processo e reduzir variabilidade', 'direcao', 'energia_social', 'ritmo', 'estrutura'),
  (13, 'Ao planejar um projeto, você prioriza:', 'Quem decide o quê e quando', 'Quem precisa estar alinhado e como comunicar', 'O que entrega valor mais rápido', 'Dependências, critérios e governança', 'direcao', 'energia_social', 'ritmo', 'estrutura'),
  (14, 'Se alguém do time está performando abaixo, você:', 'Define expectativa e plano de correção direto', 'Conversa para entender contexto e apoiar', 'Dá metas curtas e acompanhamento frequente', 'Treina padrão, checklist e rotina de execução', 'direcao', 'energia_social', 'ritmo', 'estrutura'),
  (15, 'Quando a empresa muda a direção estratégica, você:', 'Se posiciona e busca influenciar a rota', 'Ajuda as pessoas a processar a mudança', 'Ajusta rápido e parte para execução', 'Redesenha processos para refletir a nova direção', 'direcao', 'energia_social', 'ritmo', 'estrutura'),
  (16, 'Em tarefas repetitivas, você tende a:', 'Delegar/redistribuir para focar no que decide', 'Tornar mais leve com interação e suporte mútuo', 'Criar metas de velocidade para não cair a energia', 'Automatizar e padronizar o máximo possível', 'direcao', 'energia_social', 'ritmo', 'estrutura'),
  (17, 'Quando recebe uma crítica dura, você:', 'Enfrenta e reposiciona o que será feito', 'Busca conversa para manter respeito e vínculo', 'Decide rápido o que ajustar e segue', 'Pede exemplos, critérios e define padrão de melhoria', 'direcao', 'energia_social', 'ritmo', 'estrutura'),
  (18, 'Em um cenário incerto, você prefere:', 'Definir uma direção mesmo com informação incompleta', 'Conversar com pessoas para captar percepções', 'Fazer pequenos testes rápidos', 'Criar critérios e “guardrails” antes de avançar', 'direcao', 'energia_social', 'ritmo', 'estrutura'),
  (19, 'Quando há retrabalho, você:', 'Intervém e redefine responsabilidades', 'Alinha expectativas e reduz ruídos entre pessoas', 'Ataca o gargalo mais urgente', 'Corrige a causa no processo/padrão', 'direcao', 'energia_social', 'ritmo', 'estrutura'),
  (20, 'Ao organizar sua semana, você prioriza:', 'Decisões e pontos que destravam os outros', 'Reuniões-chave e alinhamentos críticos', 'Atividades de impacto imediato', 'Planejamento, rotina e execução consistente', 'direcao', 'energia_social', 'ritmo', 'estrutura'),
  (21, 'Quando precisa negociar prazos, você:', 'Define o limite e fecha o acordo', 'Busca equilíbrio entre necessidades e relação', 'Oferece alternativas rápidas e curtas', 'Replaneja com escopo, etapas e critérios', 'direcao', 'energia_social', 'ritmo', 'estrutura'),
  (22, 'Em uma crise com cliente, você:', 'Assume a frente e dá direção ao atendimento', 'Prioriza empatia, escuta e relação', 'Resolve rápido para conter impacto', 'Formaliza plano de ação, prazos e checkpoints', 'direcao', 'energia_social', 'ritmo', 'estrutura'),
  (23, 'Quando o time está confuso, você:', 'Decide prioridades e tira dúvidas de direção', 'Reúne todos e alinha entendimento comum', 'Define um primeiro passo rápido e “vamos”', 'Documenta e organiza fluxo, papéis e padrões', 'direcao', 'energia_social', 'ritmo', 'estrutura'),
  (24, 'Ao delegar tarefas, você tende a:', 'Delegar com autoridade e ponto de controle', 'Delegar considerando perfil e motivação da pessoa', 'Delegar o que pode ser feito rápido para ganhar velocidade', 'Delegar com instruções, checklist e critérios claros', 'direcao', 'energia_social', 'ritmo', 'estrutura'),
  (25, 'Se você tem liberdade total, você prefere:', 'Conduzir decisões e direcionar projetos', 'Trabalhar com pessoas e influenciar', 'Operar em ritmo acelerado e dinâmico', 'Estruturar sistemas e padrões que sustentam', 'direcao', 'energia_social', 'ritmo', 'estrutura'),
  (26, 'Quando o resultado caiu, você:', 'Redefine meta e cobra execução', 'Engaja o time para recuperar moral e cooperação', 'Cria sprint de recuperação com foco em velocidade', 'Revisa processo e corrige falhas de padrão', 'direcao', 'energia_social', 'ritmo', 'estrutura'),
  (27, 'Ao receber um “não” de uma liderança, você:', 'Argumenta e tenta influenciar a decisão', 'Procura entender a pessoa e construir acordo', 'Busca alternativa rápida e segue em frente', 'Solicita critérios e ajusta para cumprir requisitos', 'direcao', 'energia_social', 'ritmo', 'estrutura'),
  (28, 'Quando você está sobrecarregado, você:', 'Decide cortes e reprioriza com firmeza', 'Pede ajuda e redistribui com diálogo', 'Entra em modo “urgência” e acelera', 'Reorganiza método, rotina e processo de trabalho', 'direcao', 'energia_social', 'ritmo', 'estrutura'),
  (29, 'O que mais te dá sensação de “controle” no trabalho?', 'Ser o decisor do caminho', 'Ter relações sólidas e comunicação fluida', 'Ver as coisas andando rápido', 'Ter processo estável e previsível', 'direcao', 'energia_social', 'ritmo', 'estrutura'),
  (30, 'Quando pensa em carreira, você tende a buscar:', 'Mais autoridade e impacto', 'Mais influência e rede', 'Mais desafios e dinamismo', 'Mais estrutura e consistência', 'direcao', 'energia_social', 'ritmo', 'estrutura')
ON CONFLICT (question_number) DO NOTHING;
