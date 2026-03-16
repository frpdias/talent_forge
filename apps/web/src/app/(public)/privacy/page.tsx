export const metadata = {
  title: 'Política de Privacidade — TalentForge',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-[#141042] mb-2">Política de Privacidade</h1>
      <p className="text-sm text-gray-500 mb-10">Última atualização: março de 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[#141042] mb-3">1. Informações que coletamos</h2>
        <p className="text-gray-700 leading-relaxed">
          O TalentForge coleta informações fornecidas diretamente por você, como nome, endereço de
          e-mail e dados profissionais necessários para o funcionamento da plataforma de recrutamento.
          Quando você conecta o Google Calendar, coletamos tokens de acesso OAuth para criar e
          gerenciar eventos de entrevista em seu calendário.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[#141042] mb-3">2. Como usamos suas informações</h2>
        <p className="text-gray-700 leading-relaxed">
          Utilizamos suas informações para operar e melhorar a plataforma, enviar notificações
          relacionadas ao processo seletivo e, quando autorizado, criar eventos no Google Calendar
          para agendamento de entrevistas. Não vendemos nem compartilhamos seus dados com
          terceiros para fins comerciais.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[#141042] mb-3">3. Google Calendar</h2>
        <p className="text-gray-700 leading-relaxed">
          A integração com o Google Calendar utiliza o protocolo OAuth 2.0. Você pode revogar
          o acesso a qualquer momento nas configurações da plataforma ou diretamente em{' '}
          <a
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#3B82F6] underline"
          >
            myaccount.google.com/permissions
          </a>
          . Os tokens são armazenados de forma segura e utilizados exclusivamente para
          criar eventos de entrevista em seu nome.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[#141042] mb-3">4. Retenção de dados</h2>
        <p className="text-gray-700 leading-relaxed">
          Mantemos seus dados enquanto sua conta estiver ativa. Você pode solicitar a exclusão
          de seus dados a qualquer momento entrando em contato conosco.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[#141042] mb-3">5. Segurança</h2>
        <p className="text-gray-700 leading-relaxed">
          Adotamos medidas técnicas e organizacionais para proteger suas informações contra
          acesso não autorizado, incluindo criptografia em trânsito (HTTPS) e Row Level Security
          no banco de dados.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[#141042] mb-3">6. Contato</h2>
        <p className="text-gray-700 leading-relaxed">
          Para dúvidas sobre esta política ou solicitações relacionadas aos seus dados,
          entre em contato pelo e-mail{' '}
          <a href="mailto:privacidade@talentforge.com.br" className="text-[#3B82F6] underline">
            privacidade@talentforge.com.br
          </a>
          .
        </p>
      </section>
    </div>
  );
}
