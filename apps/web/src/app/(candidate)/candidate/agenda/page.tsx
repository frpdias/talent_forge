import { redirect } from 'next/navigation';

/**
 * A página de agenda foi movida para o modal dentro do widget
 * "Agenda do recrutador" na sidebar do candidato.
 */
export default function CandidateAgendaPage() {
  redirect('/candidate');
}
