'use client';

import { useState } from 'react';
import { Mail, X, Eye, Send } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

const defaultTemplates: EmailTemplate[] = [
  {
    id: '1',
    name: 'Convite para Entrevista',
    subject: 'Convite para Entrevista - {{jobTitle}}',
    body: `Olá {{candidateName}},

Esperamos que esteja bem!

Temos o prazer de convidá-lo(a) para uma entrevista para a vaga de {{jobTitle}}.

Detalhes da entrevista:
📅 Data: {{interviewDate}}
🕐 Horário: {{interviewTime}}
📍 Local: {{interviewLocation}}
⏱️ Duração: {{interviewDuration}}

Por favor, confirme sua presença respondendo a este e-mail.

Atenciosamente,
Equipe {{companyName}}`,
    variables: ['candidateName', 'jobTitle', 'interviewDate', 'interviewTime', 'interviewLocation', 'interviewDuration', 'companyName'],
  },
  {
    id: '2',
    name: 'Feedback Positivo',
    subject: 'Parabéns! Próxima Etapa - {{jobTitle}}',
    body: `Olá {{candidateName}},

Ótimas notícias!

Ficamos muito impressionados com seu desempenho na {{currentStage}} e gostaríamos de convidá-lo(a) para a próxima etapa do processo seletivo para a vaga de {{jobTitle}}.

A próxima etapa será: {{nextStage}}

Em breve entraremos em contato com mais detalhes.

Parabéns pelo excelente trabalho!

Atenciosamente,
Equipe {{companyName}}`,
    variables: ['candidateName', 'jobTitle', 'currentStage', 'nextStage', 'companyName'],
  },
  {
    id: '3',
    name: 'Feedback Negativo',
    subject: 'Processo Seletivo - {{jobTitle}}',
    body: `Olá {{candidateName}},

Primeiramente, gostaríamos de agradecê-lo(a) pelo interesse em fazer parte da nossa equipe e pelo tempo dedicado ao processo seletivo para a vaga de {{jobTitle}}.

Após cuidadosa análise, decidimos prosseguir com outros candidatos cujos perfis estão mais alinhados com as necessidades atuais da posição.

Gostaríamos de mantê-lo(a) em nosso banco de talentos para futuras oportunidades que possam ser mais adequadas ao seu perfil.

Desejamos muito sucesso em sua carreira!

Atenciosamente,
Equipe {{companyName}}`,
    variables: ['candidateName', 'jobTitle', 'companyName'],
  },
  {
    id: '4',
    name: 'Proposta de Emprego',
    subject: '🎉 Proposta de Emprego - {{jobTitle}}',
    body: `Olá {{candidateName}},

É com grande satisfação que oferecemos a você a posição de {{jobTitle}} em nossa empresa!

Detalhes da proposta:
💼 Cargo: {{jobTitle}}
💰 Salário: {{salary}}
📅 Data de início: {{startDate}}
🏢 Local: {{workLocation}}
⏰ Horário: {{workSchedule}}

Benefícios:
{{benefits}}

Por favor, revise a proposta completa em anexo e nos informe sua decisão até {{deadline}}.

Estamos muito animados com a possibilidade de tê-lo(a) em nossa equipe!

Atenciosamente,
Equipe {{companyName}}`,
    variables: ['candidateName', 'jobTitle', 'salary', 'startDate', 'workLocation', 'workSchedule', 'benefits', 'deadline', 'companyName'],
  },
];

interface EmailTemplateEditorProps {
  onSendEmail?: (template: EmailTemplate, variables: Record<string, string>) => void;
}

export function EmailTemplateEditor({ onSendEmail }: EmailTemplateEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [isPreview, setIsPreview] = useState(false);

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    const initialVars: Record<string, string> = {};
    template.variables.forEach(v => {
      initialVars[v] = '';
    });
    setVariables(initialVars);
  };

  const replaceVariables = (text: string) => {
    let result = text;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || `{{${key}}}`);
    });
    return result;
  };

  const handleSend = () => {
    if (selectedTemplate && onSendEmail) {
      onSendEmail(selectedTemplate, variables);
      setIsOpen(false);
      setSelectedTemplate(null);
      setVariables({});
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Mail className="w-4 h-4" />
        <span>Enviar Email</span>
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {isPreview ? 'Pré-visualização' : 'Selecionar Template'}
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                {!selectedTemplate ? (
                  /* Template Selection */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {defaultTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleSelectTemplate(template)}
                        className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
                      >
                        <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{template.subject}</p>
                        <p className="text-xs text-gray-500 line-clamp-3">{template.body}</p>
                      </button>
                    ))}
                  </div>
                ) : isPreview ? (
                  /* Preview */
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Assunto:</p>
                      <p className="font-semibold text-gray-900">
                        {replaceVariables(selectedTemplate.subject)}
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200 p-6 rounded-lg whitespace-pre-wrap">
                      {replaceVariables(selectedTemplate.body)}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setIsPreview(false)}
                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Voltar
                      </button>
                      <button
                        onClick={handleSend}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Enviar Email
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Variable Input */
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-blue-900 mb-1">
                        {selectedTemplate.name}
                      </h3>
                      <p className="text-sm text-blue-700">{selectedTemplate.subject}</p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Preencha as variáveis:</h4>
                      {selectedTemplate.variables.map((varName) => (
                        <div key={varName}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {varName}
                          </label>
                          <input
                            type="text"
                            value={variables[varName] || ''}
                            onChange={(e) =>
                              setVariables({ ...variables, [varName]: e.target.value })
                            }
                            placeholder={`Digite ${varName}...`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setSelectedTemplate(null);
                          setVariables({});
                        }}
                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Voltar
                      </button>
                      <button
                        onClick={() => setIsPreview(true)}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Pré-visualizar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
