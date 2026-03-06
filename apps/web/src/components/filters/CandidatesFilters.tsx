'use client';

import { AdvancedFilters, FilterConfig } from './AdvancedFilters';

const candidatesFilterConfig: FilterConfig[] = [
  {
    id: 'stage',
    label: 'Etapa do Processo',
    type: 'multiselect',
    options: [
      { id: '1', label: 'Novo', value: 'new' },
      { id: '2', label: 'Triagem', value: 'screening' },
      { id: '3', label: 'Entrevista', value: 'interview' },
      { id: '4', label: 'Teste Técnico', value: 'technical' },
      { id: '5', label: 'Proposta', value: 'offer' },
      { id: '6', label: 'Contratado', value: 'hired' },
      { id: '7', label: 'Rejeitado', value: 'rejected' },
    ],
  },
  {
    id: 'source',
    label: 'Origem',
    type: 'multiselect',
    options: [
      { id: '1', label: 'LinkedIn', value: 'linkedin' },
      { id: '2', label: 'Site da Empresa', value: 'website' },
      { id: '3', label: 'Indicação', value: 'referral' },
      { id: '4', label: 'Indeed', value: 'indeed' },
      { id: '5', label: 'Gupy', value: 'gupy' },
      { id: '6', label: 'Outros', value: 'other' },
    ],
  },
  {
    id: 'experienceYears',
    label: 'Anos de Experiência',
    type: 'select',
    options: [
      { id: '1', label: '0-2 anos', value: '0-2' },
      { id: '2', label: '3-5 anos', value: '3-5' },
      { id: '3', label: '6-10 anos', value: '6-10' },
      { id: '4', label: '10+ anos', value: '10+' },
    ],
  },
  {
    id: 'location',
    label: 'Localização',
    type: 'text',
    placeholder: 'Ex: São Paulo, SP',
  },
  {
    id: 'skills',
    label: 'Habilidades',
    type: 'tags',
    placeholder: 'Ex: JavaScript, Python, AWS',
  },
  {
    id: 'assessmentCompleted',
    label: 'Avaliações',
    type: 'multiselect',
    options: [
      { id: '1', label: 'DISC Completo', value: 'disc' },
      { id: '2', label: 'Cores Completo', value: 'colors' },
      { id: '3', label: 'PI Completo', value: 'pi' },
      { id: '4', label: 'Sem Avaliação', value: 'none' },
    ],
  },
  {
    id: 'appliedDate',
    label: 'Data de Candidatura',
    type: 'daterange',
  },
  {
    id: 'rating',
    label: 'Avaliação',
    type: 'multiselect',
    options: [
      { id: '1', label: '5 Estrelas', value: '5' },
      { id: '2', label: '4 Estrelas', value: '4' },
      { id: '3', label: '3 Estrelas', value: '3' },
      { id: '4', label: '2 Estrelas', value: '2' },
      { id: '5', label: '1 Estrela', value: '1' },
      { id: '6', label: 'Sem Avaliação', value: '0' },
    ],
  },
];

interface CandidatesFiltersProps {
  onApplyFilters: (filters: Record<string, any>) => void;
  onClearFilters: () => void;
}

export function CandidatesFilters({ onApplyFilters, onClearFilters }: CandidatesFiltersProps) {
  return (
    <AdvancedFilters
      filters={candidatesFilterConfig}
      onApplyFilters={onApplyFilters}
      onClearFilters={onClearFilters}
    />
  );
}
