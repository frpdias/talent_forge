import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "sonner";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "TalentForge - Recrutamento Inteligente",
  description: "Plataforma de recrutamento com testes comportamentais e IA para prever fit, retenção e performance.",
  keywords: ["recrutamento", "RH", "headhunter", "DISC", "assessment", "talentos"],
  authors: [{ name: "FARTECH" }],
  openGraph: {
    title: "TalentForge - Recrutamento Inteligente",
    description: "Plataforma de recrutamento com testes comportamentais e IA",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="font-sans antialiased bg-white">
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
