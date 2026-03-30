'use client';

import { X, ExternalLink, CheckCircle2 } from 'lucide-react';
import type { ChannelCode } from '@/lib/publisher/types';

interface Step {
  title: string;
  description: string;
  url?: { label: string; href: string };
  note?: string;
}

interface ChannelGuide {
  name: string;
  icon: string;
  intro: string;
  requirements: string[];
  steps: Step[];
  credentialsSummary: string[];
  helpUrl?: string;
}

const GUIDES: Record<ChannelCode, ChannelGuide> = {
  gupy: {
    name: 'Gupy',
    icon: '🟣',
    intro: 'A Gupy disponibiliza uma API REST para integração com sistemas ATS. Para usá-la você precisa de uma conta Enterprise ativa.',
    requirements: [
      'Conta Gupy no plano Enterprise ou Superior',
      'Acesso ao painel de administrador da conta',
    ],
    steps: [
      {
        title: 'Acesse o painel da Gupy',
        description: 'Entre no painel da Gupy com sua conta de administrador (portal.gupy.io).',
      },
      {
        title: 'Vá em Configurações → Integrações',
        description: 'No menu lateral esquerdo, clique em "Configurações" e depois em "Integrações & API".',
      },
      {
        title: 'Crie uma nova aplicação de API',
        description: 'Clique em "Nova aplicação", dê um nome (ex: TalentForge) e salve.',
        note: 'O sistema irá gerar automaticamente o Client ID e Client Secret.',
      },
      {
        title: 'Copie o Client ID e Client Secret',
        description: 'Guarde esses dois valores com segurança — o Client Secret só é exibido uma vez.',
        note: 'Se perder o Client Secret, será necessário gerar um novo par de credenciais.',
      },
      {
        title: 'Localize o Company ID',
        description: 'O Company ID aparece na URL do painel quando você está navegando pela sua empresa: .../companies/{COMPANY_ID}/...',
      },
      {
        title: 'Cole as credenciais no TalentForge',
        description: 'Volte aqui, clique em "Configurar" no canal Gupy e preencha os três campos: Client ID, Client Secret e Company ID.',
      },
    ],
    credentialsSummary: ['Client ID', 'Client Secret', 'Company ID'],
  },

  vagas: {
    name: 'Vagas.com',
    icon: '🔵',
    intro: 'O Vagas.com oferece uma API para empresas parceiras anunciarem vagas diretamente. O acesso à API requer contato comercial.',
    requirements: [
      'Conta Vagas.com for Business ativa',
      'Contrato de parceria de integração assinado',
    ],
    steps: [
      {
        title: 'Entre em contato com o Vagas.com',
        description: 'A API do Vagas.com não é de acesso público. É necessário solicitar acesso através do time comercial deles.',
        url: { label: 'Contato comercial', href: 'https://www.vagas.com.br/empresas' },
        note: 'Informe que deseja integração via API para publicação automática de vagas.',
      },
      {
        title: 'Assine o contrato de parceria',
        description: 'O Vagas.com enviará um contrato de integração ATS. Após assinatura, o acesso à API é liberado.',
      },
      {
        title: 'Receba sua API Key',
        description: 'Após aprovação, o Vagas.com enviará por e-mail sua API Key exclusiva.',
        note: 'Guarde com segurança — essa chave autentica todas as publicações em seu nome.',
      },
      {
        title: 'Cole a API Key no TalentForge',
        description: 'Volte aqui, clique em "Configurar" no canal Vagas.com e cole sua API Key no campo indicado.',
      },
    ],
    credentialsSummary: ['API Key'],
    helpUrl: 'https://www.vagas.com.br/empresas',
  },

  linkedin: {
    name: 'LinkedIn Jobs',
    icon: '💼',
    intro: 'O LinkedIn Job Posting API exige participação no LinkedIn Talent Solutions Partner Program — um processo de aprovação formal que pode levar 60 a 90 dias.',
    requirements: [
      'Conta LinkedIn com Página de Empresa verificada',
      'Aprovação no LinkedIn Talent Solutions Partner Program',
      'Acordo de termos de uso de API assinado',
    ],
    steps: [
      {
        title: 'Crie uma Página de Empresa no LinkedIn',
        description: 'Se ainda não tiver, crie uma Página de Empresa verificada no LinkedIn.',
        url: { label: 'Criar página', href: 'https://www.linkedin.com/company/setup/new/' },
      },
      {
        title: 'Crie um aplicativo no LinkedIn Developer Portal',
        description: 'Acesse o portal de desenvolvedores e crie um novo aplicativo vinculado à sua Página de Empresa.',
        url: { label: 'Developer Portal', href: 'https://developer.linkedin.com/product-catalog/talent' },
      },
      {
        title: 'Solicite acesso ao Talent Solutions Partner Program',
        description: 'Na página do produto "Job Postings", clique em "Request Access" e preencha o formulário com os detalhes da sua empresa e caso de uso.',
        note: 'O processo de aprovação costuma levar de 30 a 90 dias.',
      },
      {
        title: 'Configure o OAuth 2.0',
        description: 'Após aprovação, configure as permissões do seu app: r_liteprofile, w_member_social e rw_jobs. Gere o Access Token via OAuth 2.0.',
      },
      {
        title: 'Localize o Company ID',
        description: 'Acesse sua Página de Empresa no LinkedIn. O Company ID está na URL: linkedin.com/company/{COMPANY_ID}/',
      },
      {
        title: 'Cole as credenciais no TalentForge',
        description: 'Volte aqui e preencha o Access Token e o Company ID.',
        note: 'O Access Token expira a cada 60 dias e precisará ser renovado.',
      },
    ],
    credentialsSummary: ['Access Token (OAuth 2.0)', 'Company ID'],
    helpUrl: 'https://developer.linkedin.com/product-catalog/talent',
  },

  indeed: {
    name: 'Indeed',
    icon: '🔷',
    intro: 'A integração com o Indeed está em desenvolvimento. Em breve será possível publicar vagas diretamente nesta plataforma.',
    requirements: [],
    steps: [
      {
        title: 'Em breve disponível',
        description: 'Estamos trabalhando na integração com o Indeed. Você será notificado quando estiver disponível.',
      },
    ],
    credentialsSummary: [],
  },

  catho: {
    name: 'Catho',
    icon: '🟠',
    intro: 'A integração com a Catho está em desenvolvimento.',
    requirements: [],
    steps: [
      {
        title: 'Em breve disponível',
        description: 'Estamos trabalhando na integração com a Catho.',
      },
    ],
    credentialsSummary: [],
  },

  infojobs: {
    name: 'InfoJobs',
    icon: '🟡',
    intro: 'A integração com o InfoJobs está em desenvolvimento.',
    requirements: [],
    steps: [
      {
        title: 'Em breve disponível',
        description: 'Estamos trabalhando na integração com o InfoJobs.',
      },
    ],
    credentialsSummary: [],
  },

  facebook: {
    name: 'Facebook',
    icon: '🔹',
    intro: 'A publicação no Facebook é feita via Meta Graph API usando OAuth. Você precisa de uma Página do Facebook e de um Meta App aprovado para pages_manage_posts.',
    requirements: [
      'Página do Facebook vinculada à empresa',
      'Meta App criado no Meta for Developers',
      'Aprovação para pages_manage_posts (14-28 dias)',
    ],
    steps: [
      {
        title: 'Crie um Meta App',
        description: 'Acesse Meta for Developers, crie um novo app do tipo "Business" e vincule à sua Página do Facebook.',
        url: { label: 'Meta for Developers', href: 'https://developers.facebook.com/apps' },
      },
      {
        title: 'Solicite as permissões',
        description: 'No painel do app, vá em Permissões e Recursos e solicite pages_manage_posts e pages_read_engagement.',
        note: 'O processo de revisão do Meta costuma levar de 14 a 28 dias.',
      },
      {
        title: 'Configure o TalentForge',
        description: 'Em Configurações → Canais de Publicação, clique em Configurar no canal Facebook e depois em "Conectar com Facebook". Você será redirecionado para autorizar o acesso.',
      },
    ],
    credentialsSummary: ['Page Access Token (obtido via OAuth)', 'Page ID'],
    helpUrl: 'https://developers.facebook.com/docs/pages/getting-started',
  },

  instagram: {
    name: 'Instagram',
    icon: '📸',
    intro: 'A publicação no Instagram requer uma conta Instagram Business vinculada a uma Página do Facebook e aprovação para instagram_content_publish.',
    requirements: [
      'Conta Instagram Business (não conta pessoal)',
      'Página do Facebook vinculada à conta Instagram',
      'Meta App aprovado para instagram_content_publish',
    ],
    steps: [
      {
        title: 'Converta para conta Business',
        description: 'No app do Instagram, vá em Configurações → Conta → Mudar para conta profissional e selecione "Empresa".',
      },
      {
        title: 'Vincule ao Facebook',
        description: 'Em Configurações do Instagram, vá em "Conta vinculada" e conecte à sua Página do Facebook.',
      },
      {
        title: 'Solicite instagram_content_publish',
        description: 'No painel do Meta App, solicite a permissão instagram_content_publish.',
        note: 'O processo de revisão costuma levar de 14 a 28 dias.',
        url: { label: 'Meta for Developers', href: 'https://developers.facebook.com/apps' },
      },
      {
        title: 'Conecte no TalentForge',
        description: 'Em Configurações → Canais de Publicação, clique em Configurar no canal Instagram e autorize via Facebook.',
      },
    ],
    credentialsSummary: ['Page Access Token (obtido via OAuth)', 'Instagram Account ID'],
  },

  custom: {
    name: 'Canal Personalizado',
    icon: '🔧',
    intro: 'Configure uma integração personalizada com qualquer sistema que aceite autenticação por API Key.',
    requirements: ['API Key do sistema externo'],
    steps: [
      {
        title: 'Obtenha a API Key do sistema externo',
        description: 'Acesse o painel do sistema externo, vá em Integrações ou API e gere uma chave de acesso.',
      },
      {
        title: 'Cole a API Key no TalentForge',
        description: 'Volte aqui, clique em Configurar e insira a API Key.',
      },
    ],
    credentialsSummary: ['API Key'],
  },
};

interface ChannelGuideModalProps {
  channelCode: ChannelCode;
  isOpen: boolean;
  onClose: () => void;
}

export function ChannelGuideModal({ channelCode, isOpen, onClose }: ChannelGuideModalProps) {
  if (!isOpen) return null;

  const guide = GUIDES[channelCode];

  return (
    <>
      <div
        className="fixed inset-0 z-70 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-71 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{guide.icon}</span>
              <div>
                <h2 className="text-sm font-semibold text-[#141042]">Como obter as credenciais</h2>
                <p className="text-xs text-gray-400">{guide.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Conteúdo scrollável */}
          <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">

            {/* Intro */}
            <p className="text-sm text-gray-600 leading-relaxed">{guide.intro}</p>

            {/* Pré-requisitos */}
            {guide.requirements.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-amber-800 mb-2">Pré-requisitos</p>
                <ul className="space-y-1">
                  {guide.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-amber-700">
                      <span className="mt-0.5 shrink-0">•</span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Passo a passo */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Passo a passo</p>
              {guide.steps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-[#141042] text-white text-xs flex items-center justify-center font-semibold mt-0.5">
                    {i + 1}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold text-[#141042]">{step.title}</p>
                    <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
                    {step.url && (
                      <a
                        href={step.url.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-[#3B82F6] hover:underline mt-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {step.url.label}
                      </a>
                    )}
                    {step.note && (
                      <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-1">
                        ⚠️ {step.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Resumo das credenciais necessárias */}
            {guide.credentialsSummary.length > 0 && (
              <div className="bg-[#141042]/5 border border-[#141042]/10 rounded-xl p-4">
                <p className="text-xs font-semibold text-[#141042] mb-2">Você vai precisar de:</p>
                <ul className="space-y-1">
                  {guide.credentialsSummary.map((cred, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-[#141042]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                      {cred}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-100 shrink-0 flex items-center justify-between">
            {guide.helpUrl ? (
              <a
                href={guide.helpUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-xs text-[#3B82F6] hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Documentação oficial
              </a>
            ) : (
              <div />
            )}
            <button
              onClick={onClose}
              className="text-xs px-4 py-2 rounded-lg bg-[#141042] text-white hover:bg-[#1a1554] transition-colors"
            >
              Entendi
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
