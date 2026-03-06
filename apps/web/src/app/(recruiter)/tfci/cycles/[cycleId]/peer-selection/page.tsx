import { Metadata } from 'next';
import { PeerSelectionPage } from './PeerSelectionPage';

export const metadata: Metadata = {
  title: 'Seleção de Pares - TFCI | TalentForge',
  description: 'Selecione seus pares para avaliação 360°',
};

export default async function Page({ 
  params 
}: { 
  params: Promise<{ cycleId: string }> 
}) {
  const { cycleId } = await params;
  return <PeerSelectionPage cycleId={cycleId} />;
}
