import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vagas de Emprego | TalentForge — Oportunidades em todo o Brasil',
  description:
    'Encontre vagas de emprego nas melhores empresas do Brasil. Filtre por salário, modalidade (remoto, híbrido, presencial), tipo de contrato (CLT, PJ, estágio) e área de atuação.',
  keywords: [
    'vagas de emprego', 'emprego', 'trabalho', 'vagas CLT', 'vagas PJ',
    'trabalho remoto', 'vagas home office', 'vagas híbrido',
    'TalentForge', 'portal de vagas',
  ],
  openGraph: {
    title: 'Vagas de Emprego | TalentForge',
    description: 'Conectamos candidatos às melhores oportunidades em todo o Brasil.',
    type: 'website',
    url: 'https://talentforge.com.br/vagas',
    siteName: 'TalentForge',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vagas de Emprego | TalentForge',
    description: 'Encontre a vaga ideal para o seu perfil. Empresas de todo o Brasil em um só lugar.',
  },
  alternates: {
    canonical: 'https://talentforge.com.br/vagas',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function VagasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
