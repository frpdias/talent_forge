'use client';

import { AdvancedFilters, FilterConfig } from './AdvancedFilters';

const jobsFilterConfig: FilterConfig[] = [
  {
    id: 'status',
    label: 'Status',
    type: 'multiselect',
    options: [
      { id: '1', label: 'Ativa', value: 'active' },
      { id: '2', label: 'Pausada', value: 'paused' },
      { id: '3', label: 'Fechada', value: 'closed' },
      { id: '4', label: 'Rascunho', value: 'draft' },
    ],
  },
  {
    id: 'location',
    label: 'Localização',
    type: 'select',
    options: [
      { id: '1', label: 'Remoto', value: 'remote' },
      { id: '2', label: 'Híbrido', value: 'hybrid' },
      { id: '3', label: 'Presencial', value: 'onsite' },
    ],
  },
  {
    id: 'department',
    label: 'Departamento',
    type: 'multiselect',
    options: [
      { id: '1', label: 'Tecnologia', value: 'tech' },
      { id: '2', label: 'Vendas', value: 'sales' },
      { id: '3', label: 'Marketing', value: 'marketing' },
      { id: '4', label: 'RH', value: 'hr' },
      { id: '5', label: 'Financeiro', value: 'finance' },
      { id: '6', label: 'Operações', value: 'operations' },
    ],
  },
  {
    id: 'experienceLevel',
    label: 'Nível de Experiência',
    type: 'multiselect',
    options: [
      { id: '1', label: 'Júnior', value: 'junior' },
      { id: '2', label: 'Pleno', value: 'mid' },
      { id: '3', label: 'Sênior', value: 'senior' },
      { id: '4', label: 'Especialista', value: 'expert' },
    ],
  },
  {
    id: 'createdDate',
    label: 'Data de Criação',
    type: 'daterange',
  },
  {
    id: 'skills',
    label: 'Habilidades',
    type: 'tags',
    placeholder: 'Ex: React, Node.js, Python',
  },
  {
    id: 'salary',
    label: 'Faixa Salarial',
    type: 'select',
    options: [
      { id: '1', label: 'Até R$ 3.000', value: '0-3000' },
      { id: '2', label: 'R$ 3.000 - R$ 6.000', value: '3000-6000' },
      { id: '3', label: 'R$ 6.000 - R$ 10.000', value: '6000-10000' },
      { id: '4', label: 'R$ 10.000 - R$ 15.000', value: '10000-15000' },
      { id: '5', label: 'Acima de R$ 15.000', value: '15000+' },
    ],
  },
];

interface JobsFiltersProps {
  onApplyFilters: (filters: Record<string, any>) => void;
  onClearFilters: () => void;
}

export function JobsFilters({ onApplyFilters, onClearFilters }: JobsFiltersProps) {
  return (
    <AdvancedFilters
      filters={jobsFilterConfig}
      onApplyFilters={onApplyFilters}
      onClearFilters={onClearFilters}
    />
  );
}
