export const metadata = {
  title: 'Termos de Serviço — TalentForge',
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-[#141042] mb-2">Termos de Serviço</h1>
      <p className="text-sm text-gray-500 mb-10">Última atualização: março de 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[#141042] mb-3">1. Aceitação dos termos</h2>
        <p className="text-gray-700 leading-relaxed">
          Ao acessar ou usar o TalentForge, você concorda com estes Termos de Serviço. Se você
          não concordar com qualquer parte destes termos, não utilize a plataforma.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[#141042] mb-3">2. Descrição do serviço</h2>
        <p className="text-gray-700 leading-relaxed">
          O TalentForge é uma plataforma de gestão de recrutamento e seleção que permite às
          organizações gerenciar vagas, candidatos e processos seletivos. Oferecemos integração
          com ferramentas de terceiros, como o Google Calendar, para facilitar o agendamento
          de entrevistas.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[#141042] mb-3">3. Uso aceitável</h2>
        <p className="text-gray-700 leading-relaxed">
          Você concorda em usar a plataforma apenas para fins legítimos de recrutamento e seleção.
          É proibido usar o TalentForge para discriminação ilegal, envio de comunicações não
          solicitadas ou qualquer atividade que viole leis aplicáveis.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[#141042] mb-3">4. Integrações de terceiros</h2>
        <p className="text-gray-700 leading-relaxed">
          A integração com o Google Calendar é opcional e requer sua autorização explícita via
          OAuth 2.0. Você pode revogar essa autorização a qualquer momento nas configurações
          da plataforma. O uso dos serviços do Google está sujeito aos{' '}
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#3B82F6] underline"
          >
            Termos de Serviço do Google
          </a>
          .
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[#141042] mb-3">5. Propriedade intelectual</h2>
        <p className="text-gray-700 leading-relaxed">
          Todo o conteúdo e funcionalidades do TalentForge são de propriedade da empresa
          responsável pela plataforma e protegidos por leis de propriedade intelectual.
          Você não pode copiar, modificar ou distribuir qualquer parte da plataforma sem
          autorização prévia por escrito.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[#141042] mb-3">6. Limitação de responsabilidade</h2>
        <p className="text-gray-700 leading-relaxed">
          O TalentForge é fornecido "como está". Não garantimos disponibilidade ininterrupta
          do serviço e não nos responsabilizamos por danos indiretos decorrentes do uso
          ou impossibilidade de uso da plataforma.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[#141042] mb-3">7. Alterações nos termos</h2>
        <p className="text-gray-700 leading-relaxed">
          Podemos atualizar estes termos periodicamente. Notificaremos sobre mudanças
          significativas por e-mail ou mediante aviso na plataforma. O uso contínuo após
          as alterações constitui aceitação dos novos termos.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[#141042] mb-3">8. Contato</h2>
        <p className="text-gray-700 leading-relaxed">
          Para dúvidas sobre estes termos, entre em contato pelo e-mail{' '}
          <a href="mailto:contato@talentforge.com.br" className="text-[#3B82F6] underline">
            contato@talentforge.com.br
          </a>
          .
        </p>
      </section>
    </div>
  );
}
