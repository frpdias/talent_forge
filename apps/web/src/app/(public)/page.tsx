'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Users,
  Target,
  Brain,
  BarChart3,
  CheckCircle2,
  Building2,
  UserCircle,
  Shield,
  Menu,
  X,
  LogIn,
  HeartPulse,
  ClipboardList,
  FileText,
  ChevronRight,
  Activity,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#E5E5DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#141042] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">TF</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[#1F4ED8] font-semibold text-sm tracking-tight">TALENT</span>
                <span className="text-[#F97316] font-bold text-sm tracking-wider">FORGE</span>
              </div>
            </Link>

            {/* Nav Desktop */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#recursos" className="text-[#666666] hover:text-[#141042] transition-colors text-sm font-medium">Recursos</a>
              <a href="#php-module" className="text-[#666666] hover:text-[#141042] transition-colors text-sm font-medium">Módulo PHP</a>
              <a href="#como-funciona" className="text-[#666666] hover:text-[#141042] transition-colors text-sm font-medium">Como Funciona</a>
              <a href="#planos" className="text-[#666666] hover:text-[#141042] transition-colors text-sm font-medium">Planos</a>
            </nav>

            {/* CTA Desktop */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="flex items-center gap-2 px-4 py-2 text-[#141042] hover:bg-[#FAFAF8] rounded-lg transition-colors text-sm font-medium border border-[#E5E5DC]">
                <LogIn className="w-4 h-4" />
                Entrar
              </Link>
              <Link href="/register?type=recruiter" className="flex items-center gap-2 px-4 py-2 bg-[#141042] text-white rounded-lg hover:bg-[#1a1554] transition-colors text-sm font-medium">
                Começar Grátis
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile toggle */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-[#666666] hover:text-[#141042]">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-[#E5E5DC]">
            <nav className="px-4 py-4 space-y-2">
              {['#recursos', '#php-module', '#como-funciona', '#planos'].map((href, i) => (
                <a key={i} href={href} onClick={() => setMobileMenuOpen(false)} className="block py-2 text-[#666666] hover:text-[#141042] font-medium text-sm">
                  {['Recursos', 'Módulo PHP', 'Como Funciona', 'Planos'][i]}
                </a>
              ))}
              <div className="pt-3 border-t border-[#E5E5DC] flex flex-col gap-2">
                <Link href="/login" className="flex items-center justify-center gap-2 py-2.5 text-[#141042] font-medium border border-[#E5E5DC] rounded-lg text-sm">
                  <LogIn className="w-4 h-4" /> Entrar
                </Link>
                <Link href="/register?type=recruiter" className="flex items-center justify-center gap-2 py-2.5 bg-[#141042] text-white rounded-lg text-sm font-medium">
                  Começar Grátis <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">

            <h1 className="font-bold text-[#141042] tracking-tight mb-6 leading-tight" style={{ fontSize: 'clamp(3.96rem, 7.04vw, 7.92rem)' }}>
              Recrute melhor.
              <br />
              <span className="text-[#1F4ED8]">Gerencie pessoas.</span>
              <br />
              <span className="text-[#F97316]">Obtenha resultados.</span>
            </h1>

          <div className="max-w-3xl mx-auto">
            <p className="text-lg text-[#666666] mb-10 leading-relaxed">
              Da atração de talentos à gestão contínua de performance, tudo em uma plataforma multi-tenant com avaliações comportamentais DISC, pipeline Kanban e o módulo PHP de saúde organizacional.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <Link href="/register?type=recruiter" className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-[#141042] text-white rounded-xl font-medium hover:bg-[#1a1554] transition-colors">
                <Building2 className="w-5 h-5" />
                Sou Recrutador
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/register?type=candidate" className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-[#FAFAF8] text-[#141042] border border-[#E5E5DC] rounded-xl font-medium hover:bg-[#F0F0EA] transition-colors">
                <UserCircle className="w-5 h-5" />
                Sou Candidato
              </Link>
            </div>

            </div>
          </div>

          {/* Dashboard Mockup */}
          <div className="relative mx-auto max-w-5xl">
            <div className="absolute -inset-4 bg-[#141042]/4 rounded-3xl blur-2xl" />
            <div className="relative bg-[#141042] rounded-2xl overflow-hidden border border-[#141042]/20 shadow-2xl">
              {/* Mockup Header Bar */}
              <div className="flex items-center gap-2 px-5 py-3 bg-[#0D0B2E] border-b border-white/10">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 mx-4 bg-white/10 rounded text-center text-white/30 text-xs py-1">
                  app.talentforge.com.br/dashboard
                </div>
              </div>

              {/* Mockup Content */}
              <div className="grid grid-cols-[200px_1fr] min-h-[360px]">
                {/* Sidebar */}
                <div className="bg-[#0D0B2E] px-3 py-4 border-r border-white/10">
                  <div className="flex items-center gap-2 mb-6 px-2">
                    <div className="w-6 h-6 bg-white/15 rounded flex items-center justify-center">
                      <span className="text-white text-[8px] font-bold">TF</span>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/90 font-semibold leading-none">TALENT</div>
                      <div className="text-[10px] text-[#F97316] font-bold leading-none">FORGE</div>
                    </div>
                  </div>
                  {[
                    { label: 'Dashboard', active: true },
                    { label: 'Vagas', active: false },
                    { label: 'Candidatos', active: false },
                    { label: 'Pipeline', active: false },
                    { label: 'Empresas', active: false },
                    { label: 'Relatórios', active: false },
                  ].map((item) => (
                    <div key={item.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg mb-0.5 ${item.active ? 'bg-white/15 text-white' : 'text-white/40 hover:bg-white/5'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${item.active ? 'bg-[#10B981]' : 'bg-transparent'}`} />
                      <span className="text-[11px] font-medium">{item.label}</span>
                    </div>
                  ))}
                </div>

                {/* Main Content */}
                <div className="p-5 bg-[#FAFAF8]">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-[#141042]">Dashboard</h3>
                    <p className="text-xs text-[#999999]">Fartech · Março 2026</p>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {[
                      { label: 'Vagas Ativas', value: '12', color: 'text-[#1F4ED8]' },
                      { label: 'Candidatos', value: '84', color: 'text-[#141042]' },
                      { label: 'Em Avaliação', value: '27', color: 'text-[#D97706]' },
                      { label: 'Contratados', value: '6', color: 'text-[#10B981]' },
                    ].map((s) => (
                      <div key={s.label} className="bg-white rounded-lg border border-[#E5E5DC] p-3">
                        <p className="text-[10px] text-[#999999] mb-1">{s.label}</p>
                        <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Pipeline preview */}
                  <div className="bg-white rounded-lg border border-[#E5E5DC] p-3">
                    <p className="text-[10px] font-semibold text-[#141042] mb-2">Pipeline · Desenvolvedor Full-Stack</p>
                    <div className="grid grid-cols-4 gap-2">
                      {['Triagem', 'Entrevista', 'Avaliação', 'Proposta'].map((stage, i) => (
                        <div key={stage} className="bg-[#FAFAF8] rounded border border-[#E5E5DC] p-2">
                          <p className="text-[9px] font-medium text-[#666666] mb-1.5">{stage}</p>
                          {[...Array(i === 0 ? 3 : i === 1 ? 2 : i === 2 ? 2 : 1)].map((_, j) => (
                            <div key={j} className="bg-white border border-[#E5E5DC] rounded p-1.5 mb-1">
                              <div className="w-full h-1.5 bg-[#141042]/10 rounded mb-1" />
                              <div className="w-3/4 h-1 bg-[#E5E5DC] rounded" />
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <div className="bg-[#FAFAF8] border-y border-[#E5E5DC] py-5 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-8 text-sm text-[#666666]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#10B981]" />
            <span>Multi-tenant com RLS</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            <span>LGPD Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-[#1F4ED8]" />
            <span>Avaliações DISC</span>
          </div>
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-[#F97316]" />
            <span>Módulo PHP Premium</span>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#141042]" />
            <span>Analytics em tempo real</span>
          </div>
        </div>
      </div>

      {/* Features */}
      <section id="recursos" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-bold text-[#141042] tracking-tight mb-4" style={{ fontSize: 'clamp(5.6rem, 9vw, 6.75rem)' }}>
              Tudo que seu RH precisa
            </h2>
            <p className="text-lg text-[#666666] max-w-2xl mx-auto">
              Uma plataforma completa — do primeiro contato com o candidato à gestão contínua de performance
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Target,
                title: 'Pipeline Kanban',
                description: 'Gerencie candidatos por etapas com drag-and-drop. Histórico completo de cada movimentação com application_events.',
                color: '#1F4ED8',
                bg: '#EEF2FF',
              },
              {
                icon: Brain,
                title: 'Avaliações DISC',
                description: 'Questionários comportamentais padronizados com análise de perfil DISC para decisões de contratação mais assertivas.',
                color: '#141042',
                bg: '#F0EFFF',
              },
              {
                icon: Building2,
                title: 'Gestão Multi-empresa',
                description: 'Cadastre e gerencie múltiplas empresas clientes. Organogramas, funcionários e módulos por empresa.',
                color: '#10B981',
                bg: '#ECFDF5',
              },
              {
                icon: Users,
                title: 'Equipe Colaborativa',
                description: 'Convide recrutadores com diferentes permissões. Admin, Recrutador ou Visualizador — controle total de acesso.',
                color: '#7C3AED',
                bg: '#F5F3FF',
              },
              {
                icon: FileText,
                title: 'Relatórios e Analytics',
                description: 'Métricas de funil, tempo de contratação e conversão por etapa. Dados exportáveis para tomada de decisão.',
                color: '#D97706',
                bg: '#FFFBEB',
              },
              {
                icon: ClipboardList,
                title: 'Links de Convite',
                description: 'Gere links únicos para candidatos se cadastrarem e realizarem avaliações. Rastreamento de uso por link.',
                color: '#DC2626',
                bg: '#FEF2F2',
              },
            ].map((f, i) => (
              <div key={i} className="bg-[#FAFAF8] border border-[#E5E5DC] rounded-xl p-6 hover:shadow-md hover:border-[#141042]/20 transition-all group">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ backgroundColor: f.bg }}>
                  <f.icon className="w-6 h-6" style={{ color: f.color }} />
                </div>
                <h3 className="text-base font-semibold text-[#141042] mb-2">{f.title}</h3>
                <p className="text-sm text-[#666666] leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PHP Module Highlight */}
      <section id="php-module" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#141042]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-4 bg-[#F97316]/10 border border-[#F97316]/20 rounded-2xl px-12 py-6 mb-4">
              <HeartPulse className="w-12 h-12 text-[#F97316]" />
              <span className="text-[#F97316] font-bold uppercase tracking-wider" style={{ fontSize: 'clamp(3.96rem, 7.04vw, 7.92rem)' }}>Módulo Premium</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
              PHP — People, Health & Performance
            </h2>
            <p className="text-lg text-white/75 max-w-2xl mx-auto">
              A camada de gestão contínua de pessoas que vai além do recrutamento.
              Score integrado de saúde organizacional em 3 pilares.
            </p>
          </div>

          {/* PHP Score Mockup */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-12">
            <div className="lg:col-span-1 bg-gradient-to-br from-[#1F4ED8] to-[#1845B8] rounded-xl p-6 text-white">
              <p className="text-sm font-semibold opacity-80 mb-2">Score PHP Total</p>
              <p className="text-5xl font-bold mb-1">76.4</p>
              <div className="flex items-center gap-1 text-green-300 text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>+4.2 vs mês anterior</span>
              </div>
              <p className="text-xs text-white/50 mt-3">Última atualização: hoje</p>
            </div>
            {[
              { label: 'TFCI', weight: '30%', score: '82.0', desc: 'Comportamento', icon: Activity, color: 'text-green-400' },
              { label: 'NR-1', weight: '40%', score: '71.5', desc: 'Riscos Psicossociais', icon: ShieldAlert, color: 'text-yellow-400' },
              { label: 'COPC', weight: '30%', score: '74.8', desc: 'Performance', icon: BarChart3, color: 'text-blue-400' },
            ].map((p) => (
              <div key={p.label} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-white/80">{p.label}</span>
                  <span className="text-xs text-[#F97316] font-medium">{p.weight}</span>
                </div>
                <p.icon className={`w-6 h-6 mb-2 ${p.color}`} />
                <p className={`text-3xl font-bold mb-1 ${p.color}`}>{p.score}</p>
                <p className="text-xs text-white/65">{p.desc}</p>
              </div>
            ))}
          </div>

          {/* Three Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Activity,
                acronym: 'TFCI',
                name: 'Talent Forge Culture Index',
                weight: '30%',
                description: 'Avaliações comportamentais cíclicas. Mapeie o perfil cultural da equipe com ciclos periódicos e heatmaps de competências.',
                items: ['Ciclos de avaliação por equipe', 'Heatmap de competências', 'Análise de traços comportamentais'],
                color: '#1F4ED8',
              },
              {
                icon: ShieldAlert,
                acronym: 'NR-1',
                name: 'Riscos Psicossociais',
                weight: '40%',
                description: 'Mapeamento e gestão de riscos psicossociais conforme a NR-1 revisada. Compliance com a legislação trabalhista brasileira.',
                items: ['10 dimensões de risco', 'Relatório de compliance', 'Auto-avaliação dos colaboradores'],
                color: '#D97706',
              },
              {
                icon: BarChart3,
                acronym: 'COPC',
                name: 'Customer Operations Performance',
                weight: '30%',
                description: 'Monitore indicadores operacionais e de performance com métricas customizáveis por equipe e período.',
                items: ['Catálogo de métricas COPC', 'Tendências e histórico', 'Dashboard executivo'],
                color: '#10B981',
              },
            ].map((pillar) => (
              <div key={pillar.acronym} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/8 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-lg bg-white/10">
                    <pillar.icon className="w-5 h-5 text-white/80" />
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-full text-[#F97316] bg-[#F97316]/10">
                    Peso {pillar.weight}
                  </span>
                </div>
                <p className="text-lg font-bold text-white mb-0.5">{pillar.acronym}</p>
                <p className="text-xs text-white/70 mb-3">{pillar.name}</p>
                <p className="text-sm text-white/75 leading-relaxed mb-4">{pillar.description}</p>
                <ul className="space-y-2">
                  {pillar.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-white/70">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-white/50" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="como-funciona" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#FAFAF8]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#141042] tracking-tight mb-4">
              Simples de usar
            </h2>
            <p className="text-lg text-[#666666]">Comece a recrutar melhor em três passos</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Crie sua conta',
                description: 'Configure sua organização, convide seu time de recrutamento e adicione suas empresas clientes.',
                icon: Building2,
              },
              {
                step: '02',
                title: 'Publique vagas e avalie',
                description: 'Crie vagas, compartilhe links com candidatos e aplique avaliações DISC automatizadas.',
                icon: ClipboardList,
              },
              {
                step: '03',
                title: 'Contrate e gerencie',
                description: 'Acompanhe o pipeline, tome decisões com dados e ative o módulo PHP para gestão contínua.',
                icon: TrendingUp,
              },
            ].map((s, i) => (
              <div key={i} className="relative text-center">
                <div className="w-16 h-16 bg-[#141042] rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <s.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-bold text-[#141042]/8 mb-1">{s.step}</div>
                <h3 className="text-lg font-semibold text-[#141042] mb-2">{s.title}</h3>
                <p className="text-sm text-[#666666] leading-relaxed">{s.description}</p>
                {i < 2 && (
                  <ArrowRight className="hidden md:block absolute top-8 -right-4 w-6 h-6 text-[#E5E5DC]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#141042] tracking-tight mb-4">
              Planos para cada momento
            </h2>
            <p className="text-lg text-[#666666]">Comece grátis e escale conforme sua necessidade</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Starter',
                price: 'Grátis',
                description: 'Para começar a explorar',
                features: ['Até 3 vagas ativas', 'Até 50 candidatos', 'Pipeline Kanban', 'Avaliações DISC básicas', 'Suporte por email'],
                cta: 'Começar Grátis',
                popular: false,
              },
              {
                name: 'Professional',
                price: 'R$ 199',
                period: '/mês',
                description: 'Para times em crescimento',
                features: ['Vagas ilimitadas', 'Candidatos ilimitados', 'Avaliações DISC completas', 'Multi-empresa', 'Analytics avançado', 'Suporte prioritário'],
                cta: 'Começar Trial',
                popular: true,
              },
              {
                name: 'Enterprise',
                price: 'Sob consulta',
                description: 'Para grandes operações',
                features: ['Tudo do Professional', 'Módulo PHP completo', 'SSO/SAML', 'API dedicada', 'SLA garantido', 'Onboarding dedicado'],
                cta: 'Falar com Vendas',
                popular: false,
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-xl border p-6 transition-all ${
                  plan.popular
                    ? 'bg-[#141042] border-[#141042] md:scale-105 shadow-xl'
                    : 'bg-white border-[#E5E5DC] hover:border-[#141042]/30 hover:shadow-md'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#10B981] text-white px-4 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                    Mais Popular
                  </div>
                )}
                <div className="mb-5">
                  <h3 className={`text-base font-semibold mb-1 ${plan.popular ? 'text-white' : 'text-[#141042]'}`}>{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-bold ${plan.popular ? 'text-white' : 'text-[#141042]'}`}>{plan.price}</span>
                    {plan.period && <span className={`text-sm ${plan.popular ? 'text-white/60' : 'text-[#666666]'}`}>{plan.period}</span>}
                  </div>
                  <p className={`text-xs mt-1 ${plan.popular ? 'text-white/60' : 'text-[#666666]'}`}>{plan.description}</p>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2.5">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${plan.popular ? 'text-[#10B981]' : 'text-green-600'}`} />
                      <span className={`text-sm ${plan.popular ? 'text-white/80' : 'text-[#666666]'}`}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block w-full py-2.5 rounded-lg font-medium text-center text-sm transition-all ${
                    plan.popular
                      ? 'bg-white text-[#141042] hover:bg-[#F0F0EA]'
                      : 'bg-[#141042] text-white hover:bg-[#1a1554]'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#FAFAF8] border-t border-[#E5E5DC]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#141042] tracking-tight mb-4">
            Pronto para transformar seu recrutamento?
          </h2>
          <p className="text-lg text-[#666666] mb-8">
            Crie sua conta gratuitamente e comece hoje mesmo
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register?type=recruiter"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#141042] text-white rounded-xl font-medium hover:bg-[#1a1554] transition-colors"
            >
              Começar Agora
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 border border-[#E5E5DC] text-[#141042] rounded-xl font-medium hover:bg-white transition-colors"
            >
              <LogIn className="w-5 h-5" />
              Já tenho uma conta
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-[#141042]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">TF</span>
                </div>
                <div>
                  <div className="text-[#1F4ED8] font-semibold text-sm leading-none">TALENT</div>
                  <div className="text-[#F97316] font-bold text-sm leading-none">FORGE</div>
                </div>
              </div>
              <p className="text-white/50 text-sm leading-relaxed">
                Plataforma de recrutamento inteligente e gestão de pessoas para empresas modernas.
              </p>
            </div>

            {[
              { title: 'Produto', links: ['Recursos', 'Módulo PHP', 'Planos', 'API'] },
              { title: 'Empresa', links: ['Sobre', 'Blog', 'Carreiras', 'Contato'] },
              { title: 'Legal', links: ['Privacidade', 'Termos', 'LGPD', 'Cookies'] },
            ].map((section) => (
              <div key={section.title}>
                <h4 className="text-white font-medium mb-3 text-sm">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-white/50 hover:text-white transition-colors text-sm">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-sm">
              © 2026 FARTECH. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6">
              {['LinkedIn', 'Instagram'].map((s) => (
                <a key={s} href="#" className="text-white/40 hover:text-white transition-colors text-sm">{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
