# 🎯 TALENT FORGE - Guia de Uso Demo

## Bem-vindo ao Talent Forge!

Este guia apresenta as principais funcionalidades da plataforma de recrutamento inteligente com testes comportamentais.

---

## 📋 Índice

1. [Credenciais de Acesso](#credenciais-de-acesso)
2. [Área do Recrutador](#área-do-recrutador)
3. [Área do Candidato](#área-do-candidato)
4. [Testes Comportamentais](#testes-comportamentais)
5. [Relatórios](#relatórios)
6. [Funcionalidades Principais](#funcionalidades-principais)

---

## 🔐 Credenciais de Acesso

### Usuário Admin
- **Email:** demo-admin@talentforge.com
- **Senha:** Demo@2026!
- **Acesso:** Dashboard completo + Configurações

### Usuário Recrutador
- **Email:** demo-recruiter@talentforge.com
- **Senha:** Demo@2026!
- **Acesso:** Dashboard de recrutamento

### Usuário Candidato
- **Email:** demo-candidato@talentforge.com
- **Senha:** Demo@2026!
- **Acesso:** Portal do candidato

---

## 👔 Área do Recrutador

### Dashboard Principal
**URL:** /dashboard

O dashboard apresenta:
- **KPIs em tempo real** - Vagas abertas, candidatos, aplicações
- **Atividade recente** - Últimas movimentações
- **Acesso rápido** - Links para as principais funcionalidades

### Gestão de Vagas
**URL:** /dashboard/jobs

Funcionalidades:
- ✅ Criar novas vagas com integração CBO
- ✅ Definir faixa salarial (com sugestão automática)
- ✅ Gerenciar status (Aberta, Em pausa, Fechada)
- ✅ Visualizar candidaturas por vaga
- ✅ Editar informações da vaga

### Gestão de Candidatos
**URL:** /dashboard/candidates

Funcionalidades:
- ✅ Visualizar lista de candidatos
- ✅ Acessar perfil detalhado
- ✅ Ver resultados de assessments
- ✅ Adicionar notas e observações
- ✅ Acompanhar histórico de aplicações

### Pipeline Kanban
**URL:** /dashboard/pipeline

Funcionalidades:
- ✅ Visualização em quadro Kanban
- ✅ Arrastar e soltar candidatos entre etapas
- ✅ Etapas: Aplicado → Triagem → Entrevista → Proposta → Contratado

### Assessments
**URL:** /dashboard/assessments

Funcionalidades:
- ✅ Dashboard de avaliações
- ✅ Visualizar status (pendente/completo)
- ✅ Acessar resultados detalhados
- ✅ Enviar convites para novos testes

---

## 👤 Área do Candidato

### Dashboard do Candidato
**URL:** /candidate

O candidato pode:
- ✅ Visualizar seu perfil
- ✅ Acompanhar status das aplicações
- ✅ Ver resultados dos testes comportamentais
- ✅ Receber notificações

### Minhas Aplicações
- Lista de vagas aplicadas
- Status de cada candidatura
- Etapa atual no processo

---

## 🧠 Testes Comportamentais

O Talent Forge oferece três tipos de avaliação:

### 1. Teste DISC
**URL:** /disc

- **Duração:** ~10 minutos
- **Perguntas:** 24 questões de múltipla escolha
- **Resultado:** Perfil comportamental em 4 dimensões
  - **D** - Dominância (vermelho)
  - **I** - Influência (amarelo)
  - **S** - Estabilidade (verde)
  - **C** - Consciência (azul)

### 2. Color Assessment
**URL:** /color-test

- **Duração:** ~5 minutos
- **Resultado:** Perfil por cores representando estilo de trabalho

### 3. Predictive Index (PI)
**URL:** /pi-test

- **Duração:** ~8 minutos
- **Resultado:** Eixos comportamentais para fit cultural

### Resultados dos Testes
Cada teste gera:
- ✅ Perfil principal e secundário
- ✅ Gráficos de scores
- ✅ Pontos fortes identificados
- ✅ Desafios e áreas de desenvolvimento
- ✅ Estilo de trabalho e comunicação
- ✅ Opção de download/impressão

---

## 📊 Relatórios

### Relatórios Gerais
**URL:** /dashboard/reports

Disponíveis:
- ✅ KPIs do recrutamento
- ✅ Funil de conversão
- ✅ Tempo médio de contratação
- ✅ Efetividade das fontes
- ✅ Estatísticas gerais
- ✅ **Exportação PDF completo**
- ✅ **Exportação Excel**

### Relatórios DISC
**URL:** /dashboard/reports/disc

Disponíveis:
- ✅ Distribuição de perfis na equipe
- ✅ Análise de dinâmica de equipe
- ✅ Insights automáticos
- ✅ Recomendações baseadas nos dados

---

## ⚡ Funcionalidades Principais

### Integração CBO
- Busca inteligente de ocupações brasileiras
- Sugestão de faixa salarial baseada no CBO
- Dados atualizados do mercado

### Pipeline de Recrutamento
- Etapas customizáveis
- Drag & Drop intuitivo
- Histórico de movimentações

### Multi-tenancy
- Isolamento de dados por organização
- Permissões por tipo de usuário
- Segurança com Row Level Security

### Exportações
- Relatórios em PDF profissional
- Dados em Excel para análise
- Impressão otimizada

---

## 🆘 Limitações da Demo

Esta versão demo possui algumas limitações:

1. **Dados fictícios** - Candidatos e vagas são exemplos
2. **Email desabilitado** - Notificações por email não funcionam
3. **Reset automático** - Dados podem ser resetados periodicamente
4. **Armazenamento** - Upload de arquivos pode estar limitado

---

## 📞 Suporte

Para dúvidas ou suporte:
- **Email:** suporte@talentforge.com
- **Documentação:** /docs

---

**Versão Demo:** 1.0  
**Última atualização:** Janeiro 2026
