# Fluxos UX (MVP)

## Criar organização e primeira vaga
1) Signup/login (Supabase client).  
2) Tela “Criar organização”: nome + tipo (headhunter/empresa).  
3) Selecionar org ativa (header/selector).  
4) Criar vaga: título, localização, faixa salarial, senioridade, descrição.  
5) Configurar pipeline: etapas padrão (Triagem, Entrevista, Cliente, Oferta). Editar ordem via drag-and-drop.

## Cadastrar candidato e aplicar em vaga
1) Botão “Novo candidato”: nome, email, telefone, LinkedIn, tags.  
2) Upload de currículo para bucket `org_id/cv/{candidateId}.pdf`.  
3) Lista de vagas → “Adicionar ao pipeline”: escolhe vaga, cria `application` na primeira etapa.

## Kanban de aplicações
1) Board por vaga. Colunas = `pipeline_stages`.  
2) Drag-and-drop move cards e chama `PATCH /applications/:id/stage`.  
3) Cada card mostra: nome, etapa, score do teste (se existir), data da última atualização.  
4) Sidebar de detalhes: notas, histórico de eventos, botão “Enviar teste”.

## Teste comportamental v1
1) Headhunter clica “Enviar teste” no card; backend cria `assessment` e gera link curto (Supabase Function ou link local).  
2) Candidato responde questionário rápido (página pública).  
3) Motor calcula `raw_score` e `normalized_score`; salva em `assessments.traits` (jsonb).  
4) Kanban exibe score; relatório simples disponível no drawer do candidato.

## Portal da empresa (v1 simples)
1) Empresa recebe convite (será etapa 3); para MVP, acesso via mesma org ou compartilhamento de link protegido.  
2) Empresa vê lista de candidatos enviados; pode aprovar/recusar (atualiza `application.status`).  
3) Histórico básico no card (application_events).

## Relatórios simples
1) Página “Reports”: seleção de vaga.  
2) KPIs: tempo médio por etapa, conversão por etapa, distribuição de scores.  
3) Export CSV (opcional) via endpoint `/reports/pipelines`.
