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
  Sparkles,
  Building2,
  UserCircle,
  Zap,
  Shield,
  Clock,
  Menu,
  X,
  LogIn
} from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header - Stripe/Apple Style */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <UserAvatar size="lg" />
              <div className="flex flex-col">
                <span className="text-[#1F4ED8] font-semibold text-xl tracking-tight">TALENT</span>
                <span className="text-[#F97316] font-bold text-xl tracking-wider">FORGE</span>
              </div>
            </Link>
            
            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-[#666666] hover:text-[#141042] transition-colors text-sm font-medium">
                Recursos
              </a>
              <a href="#how-it-works" className="text-[#666666] hover:text-[#141042] transition-colors text-sm font-medium">
                Como Funciona
              </a>
              <a href="#pricing" className="text-[#666666] hover:text-[#141042] transition-colors text-sm font-medium">
                Planos
              </a>
            </nav>
            
            {/* CTA - Desktop */}
            <div className="hidden sm:flex items-center space-x-3">
              <Link 
                href="/login" 
                className="flex items-center space-x-2 px-4 py-2 text-[#141042] hover:bg-[#F5F5F0] rounded-lg transition-colors text-sm font-medium"
              >
                <LogIn className="w-4 h-4" />
                <span>Login Recrutador</span>
              </Link>
              <Link 
                href="/register" 
                className="btn-primary text-sm"
              >
                Começar Grátis
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#666666] hover:text-[#141042]"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-[#E5E5DC] shadow-lg">
            <nav className="px-4 py-4 space-y-3">
              <a 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-[#666666] hover:text-[#141042] font-medium"
              >
                Recursos
              </a>
              <a 
                href="#how-it-works" 
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-[#666666] hover:text-[#141042] font-medium"
              >
                Como Funciona
              </a>
              <a 
                href="#pricing" 
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-[#666666] hover:text-[#141042] font-medium"
              >
                Planos
              </a>
              <div className="pt-4 border-t border-[#E5E5DC] space-y-3">
                <Link 
                  href="/login"
                  className="flex items-center justify-center space-x-2 w-full py-3 text-[#141042] font-medium border border-[#E5E5DC] rounded-xl"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login Recrutador</span>
                </Link>
                <Link 
                  href="/register"
                  className="block w-full py-3 text-center bg-[#141042] text-white font-medium rounded-xl"
                >
                  Começar Grátis
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section - Apple Style */}
      <section className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle Background Gradient */}
        <div className="absolute inset-0 bg-linear-to-b from-[#D9D9C6]/20 via-transparent to-transparent" />
        
        <div className="w-full relative">
          <div className="text-center max-w-7xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-[#141042]/5 border border-[#141042]/10 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-6 sm:mb-8">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-[#141042]" />
              <span className="text-[#141042] text-fluid-xs font-medium">Plataforma #1 de Recrutamento Inteligente</span>
            </div>
            
            {/* Main Heading - Apple Typography */}
            <h1 className="text-fluid-display font-semibold text-[#141042] tracking-tight mb-4 sm:mb-6">
              Encontre talentos.
              <br />
              <span className="gradient-text">Construa equipes.</span>
            </h1>
            
            {/* Subheading */}
            <p className="text-fluid-lg text-[#666666] mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
              Transforme seu processo de recrutamento com avaliações comportamentais 
              baseadas em IA e analytics preditivo.
            </p>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6 px-4 sm:px-0">
              <Link 
                href="/register?type=recruiter"
                className="w-full sm:w-auto bg-[#141042] hover:bg-[#1e1860] text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-medium text-fluid-base transition-all flex items-center justify-center space-x-2 sm:space-x-3 glow-hover"
              >
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Sou Recrutador</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <Link 
                href="/register?type=candidate"
                className="w-full sm:w-auto bg-[#D9D9C6] hover:bg-[#C5C5B0] text-[#141042] px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-medium text-fluid-base transition-all flex items-center justify-center space-x-2 sm:space-x-3"
              >
                <UserCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Sou Candidato</span>
              </Link>
            </div>
            
            {/* Login Link */}
            <div className="text-center mb-10 sm:mb-16 px-4 sm:px-0">
              <p className="text-sm sm:text-base text-[#666666]">
                Já tem uma conta?{' '}
                <Link href="/login" className="text-[#141042] font-semibold hover:underline">
                  Fazer login
                </Link>
              </p>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-[#666666]">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                <span className="text-fluid-xs">Grátis para começar</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-[#141042]" />
                <span className="text-fluid-xs">Dados protegidos</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                <span className="text-fluid-xs">Setup em 5 min</span>
              </div>
            </div>
          </div>
          
          {/* Hero Image - Dashboard Preview */}
          <div className="mt-12 sm:mt-20 relative mx-4 sm:mx-0">
            <div className="absolute -inset-4 bg-linear-to-r from-[#141042]/5 via-[#D9D9C6]/20 to-[#141042]/5 rounded-3xl blur-2xl" />
            <div className="relative card-elevated p-1.5 sm:p-2 border border-[#E5E5DC]">
              <div className="bg-linear-to-br from-[#141042] to-[#1e1860] rounded-xl sm:rounded-2xl p-6 sm:p-8 aspect-video flex items-center justify-center">
                <div className="text-center text-white/80">
                  <BarChart3 className="w-10 h-10 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-4 opacity-50" />
                  <p className="text-fluid-xs">Dashboard Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section-fluid px-4 sm:px-6 lg:px-8 bg-white">
        <div className="w-full">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-fluid-h2 font-semibold text-[#141042] tracking-tight mb-3 sm:mb-4">
              Tudo que você precisa
            </h2>
            <p className="text-fluid-lg text-[#666666] max-w-2xl mx-auto px-4 sm:px-0">
              Ferramentas poderosas para modernizar seu processo de recrutamento
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {[
              {
                icon: Brain,
                title: 'Avaliações com IA',
                description: 'Questionários DISC e comportamentais gerados por inteligência artificial para insights profundos.',
                color: '#141042'
              },
              {
                icon: Target,
                title: 'Pipeline Kanban',
                description: 'Visualize e gerencie candidatos em cada etapa do processo seletivo com drag-and-drop.',
                color: '#453931'
              },
              {
                icon: BarChart3,
                title: 'Analytics Preditivo',
                description: 'Métricas avançadas e previsões para tomar decisões de contratação mais assertivas.',
                color: '#666666'
              },
              {
                icon: Users,
                title: 'Gestão de Equipe',
                description: 'Colabore com seu time de RH com permissões e workflows personalizados.',
                color: '#141042'
              },
              {
                icon: Clock,
                title: 'Agendamento Inteligente',
                description: 'Integração com calendários para marcar entrevistas sem fricção.',
                color: '#453931'
              },
              {
                icon: Shield,
                title: 'LGPD Compliant',
                description: 'Seus dados e dos candidatos protegidos com as melhores práticas de segurança.',
                color: '#666666'
              }
            ].map((feature, i) => (
              <div 
                key={i} 
                className="group p-5 sm:p-8 rounded-xl sm:rounded-2xl bg-[#FAFAF8] border border-[#E5E5DC] hover:border-[#141042]/20 transition-all hover:shadow-lg cursor-pointer"
              >
                <div 
                  className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${feature.color}10` }}
                >
                  <feature.icon className="w-5 h-5 sm:w-7 sm:h-7" style={{ color: feature.color }} />
                </div>
                <h3 className="text-fluid-h4 font-semibold text-[#141042] mb-2 sm:mb-3">{feature.title}</h3>
                <p className="text-fluid-sm text-[#666666] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Stripe Style Steps */}
      <section id="how-it-works" className="section-fluid px-4 sm:px-6 lg:px-8 bg-[#141042]">
        <div className="w-full">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-fluid-h2 font-semibold text-white tracking-tight mb-3 sm:mb-4">
              Simples de usar
            </h2>
            <p className="text-fluid-lg text-white/60 max-w-2xl mx-auto">
              Comece a recrutar melhor em três passos simples
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-8">
            {[
              {
                step: '01',
                title: 'Crie sua conta',
                description: 'Configure sua organização e convide seu time de recrutamento em minutos.'
              },
              {
                step: '02',
                title: 'Publique vagas',
                description: 'Crie vagas com avaliações personalizadas e compartilhe com candidatos.'
              },
              {
                step: '03',
                title: 'Contrate melhor',
                description: 'Use insights de IA para identificar os melhores candidatos e fechar contratações.'
              }
            ].map((step, i) => (
              <div key={i} className="relative text-center md:text-left">
                <div className="text-fluid-hero font-bold text-white/10 mb-3 sm:mb-4">{step.step}</div>
                <h3 className="text-fluid-h3 font-semibold text-white mb-2 sm:mb-3">{step.title}</h3>
                <p className="text-fluid-sm text-white/60 leading-relaxed">{step.description}</p>
                {i < 2 && (
                  <ArrowRight className="hidden md:block absolute top-8 -right-4 w-6 h-6 lg:w-8 lg:h-8 text-white/20" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="section-fluid px-4 sm:px-6 lg:px-8 bg-[#FAFAF8]">
        <div className="w-full">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-fluid-h2 font-semibold text-[#141042] tracking-tight mb-3 sm:mb-4">
              Planos para cada momento
            </h2>
            <p className="text-fluid-lg text-[#666666] max-w-2xl mx-auto">
              Comece grátis e escale conforme sua necessidade
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 w-full">
            {[
              {
                name: 'Starter',
                price: 'Grátis',
                description: 'Para começar a explorar',
                features: ['Até 3 vagas ativas', 'Até 50 candidatos', 'Avaliações básicas', 'Suporte por email'],
                cta: 'Começar Grátis',
                popular: false
              },
              {
                name: 'Professional',
                price: 'R$ 199',
                period: '/mês',
                description: 'Para times em crescimento',
                features: ['Vagas ilimitadas', 'Candidatos ilimitados', 'Avaliações com IA', 'Analytics avançado', 'Integrações', 'Suporte prioritário'],
                cta: 'Começar Trial',
                popular: true
              },
              {
                name: 'Enterprise',
                price: 'Sob consulta',
                description: 'Para grandes operações',
                features: ['Tudo do Professional', 'SSO/SAML', 'API dedicada', 'SLA garantido', 'Onboarding dedicado', 'Suporte 24/7'],
                cta: 'Falar com Vendas',
                popular: false
              }
            ].map((plan, i) => (
              <div 
                key={i} 
                className={`relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl transition-all ${
                  plan.popular 
                    ? 'bg-[#141042] text-white md:scale-105 shadow-2xl order-first md:order-0' 
                    : 'bg-white border border-[#E5E5DC] hover:border-[#141042]/20'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 bg-[#D9D9C6] text-[#141042] px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
                    Mais Popular
                  </div>
                )}
                <div className="mb-5 sm:mb-6">
                  <h3 className={`text-fluid-h4 font-semibold mb-2 ${plan.popular ? 'text-white' : 'text-[#141042]'}`}>
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline">
                    <span className={`text-fluid-h1 font-bold ${plan.popular ? 'text-white' : 'text-[#141042]'}`}>
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className={`ml-1 text-fluid-sm ${plan.popular ? 'text-white/60' : 'text-[#666666]'}`}>
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <p className={`text-fluid-xs mt-2 ${plan.popular ? 'text-white/60' : 'text-[#666666]'}`}>
                    {plan.description}
                  </p>
                </div>
                <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center space-x-2 sm:space-x-3">
                      <CheckCircle2 className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${plan.popular ? 'text-[#D9D9C6]' : 'text-green-600'}`} />
                      <span className={`text-sm ${plan.popular ? 'text-white/80' : 'text-[#666666]'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block w-full py-2.5 sm:py-3 px-4 rounded-xl font-medium text-center text-sm sm:text-base transition-all ${
                    plan.popular
                      ? 'bg-white text-[#141042] hover:bg-[#D9D9C6]'
                      : 'bg-[#141042] text-white hover:bg-[#1e1860]'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-fluid px-4 sm:px-6 lg:px-8 bg-[#D9D9C6]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-fluid-h2 font-semibold text-[#141042] tracking-tight mb-4 sm:mb-6">
            Pronto para transformar seu recrutamento?
          </h2>
          <p className="text-fluid-lg text-[#453931] mb-8 sm:mb-10">
            Junte-se a milhares de empresas que já usam TalentForge
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link 
              href="/register"
              className="w-full sm:w-auto bg-[#141042] hover:bg-[#1e1860] text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-medium text-fluid-base transition-all flex items-center justify-center space-x-2"
            >
              <span>Começar Agora</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
            <Link 
              href="#features"
              className="w-full sm:w-auto bg-white/50 hover:bg-white text-[#141042] px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-medium text-fluid-base transition-all"
            >
              Saiba Mais
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-[#141042]">
        <div className="w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-8 sm:mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-4 sm:mb-6 flex items-center space-x-3">
                <UserAvatar size="lg" className="bg-white" />
                <div className="flex flex-col">
                  <span className="text-[#1F4ED8] font-semibold text-xl tracking-tight">TALENT</span>
                  <span className="text-[#F97316] font-bold text-xl tracking-wider">FORGE</span>
                </div>
              </div>
              <p className="text-white/60 text-fluid-xs leading-relaxed">
                Plataforma de recrutamento inteligente para empresas modernas.
              </p>
            </div>
            
            {[
              {
                title: 'Produto',
                links: ['Recursos', 'Preços', 'Integrações', 'API']
              },
              {
                title: 'Empresa',
                links: ['Sobre', 'Blog', 'Carreiras', 'Contato']
              },
              {
                title: 'Legal',
                links: ['Privacidade', 'Termos', 'LGPD', 'Cookies']
              }
            ].map((section, i) => (
              <div key={i}>
                <h4 className="text-white font-medium mb-3 sm:mb-4 text-fluid-sm">{section.title}</h4>
                <ul className="space-y-2 sm:space-y-3">
                  {section.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="text-white/60 hover:text-white transition-colors text-fluid-xs">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="pt-6 sm:pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
            <p className="text-white/40 text-fluid-xs text-center sm:text-left">
              © 2025 FARTECH. Todos os direitos reservados.
            </p>
            <div className="flex items-center space-x-4 sm:space-x-6">
              <a href="#" className="text-white/40 hover:text-white transition-colors text-fluid-xs">
                LinkedIn
              </a>
              <a href="#" className="text-white/40 hover:text-white transition-colors text-fluid-xs">
                Twitter
              </a>
              <a href="#" className="text-white/40 hover:text-white transition-colors text-fluid-xs">
                Instagram
              </a>
              <img 
                src="https://fjudsjzfnysaztcwlwgm.supabase.co/storage/v1/object/public/LOGOS/TALENT%20FORGE%201.png" 
                alt="Talent Forge" 
                className="h-48 w-auto object-contain ml-4 sm:ml-6 opacity-25 hover:opacity-100 hover:grayscale-0 transition-all duration-500 grayscale"
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
