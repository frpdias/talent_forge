import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export const statusLabels: Record<string, string> = {
  applied: 'Aplicado',
  in_process: 'Em processo',
  hired: 'Contratado',
  rejected: 'Rejeitado',
  open: 'Aberta',
  on_hold: 'Em espera',
  closed: 'Fechada',
};

export const statusColors: Record<string, string> = {
  applied: 'bg-blue-100 text-blue-800',
  in_process: 'bg-yellow-100 text-yellow-800',
  hired: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  open: 'bg-green-100 text-green-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
  closed: 'bg-gray-100 text-gray-800',
};

export const seniorityLabels: Record<string, string> = {
  junior: 'Júnior',
  mid: 'Pleno',
  senior: 'Sênior',
  lead: 'Lead',
  director: 'Diretor',
  executive: 'Executivo',
};

export const employmentTypeLabels: Record<string, string> = {
  full_time: 'CLT',
  part_time: 'Meio período',
  contract: 'PJ',
  internship: 'Estágio',
  freelance: 'Freelance',
};

export function getJobStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Rascunho',
    open: 'Aberta',
    paused: 'Pausada',
    closed: 'Fechada',
  };
  return labels[status] || status;
}

export function getJobStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'secondary',
    open: 'success',
    paused: 'warning',
    closed: 'danger',
  };
  return colors[status] || 'secondary';
}

export function getApplicationStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    applied: 'Aplicado',
    in_process: 'Em Processo',
    hired: 'Contratado',
    rejected: 'Rejeitado',
    withdrawn: 'Desistente',
  };
  return labels[status] || status;
}

export function getApplicationStatusColor(status: string): string {
  const colors: Record<string, string> = {
    applied: 'primary',
    in_process: 'warning',
    hired: 'success',
    rejected: 'danger',
    withdrawn: 'secondary',
  };
  return colors[status] || 'secondary';
}
