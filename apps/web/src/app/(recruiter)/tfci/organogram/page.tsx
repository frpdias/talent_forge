import { Metadata } from 'next';
import { OrganogramPage } from './OrganogramPage';

export const metadata: Metadata = {
  title: 'Organograma | TalentForge',
  description: 'Visualize a estrutura hierárquica da organização',
};

export default function Page() {
  return <OrganogramPage />;
}
