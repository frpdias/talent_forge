'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react';

interface ImportResult {
  success: number;
  errors: Array<{
    row: number;
    field?: string;
    message: string;
  }>;
  total: number;
}

interface ImportCSVDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  companyId: string;
  orgId: string;
  token: string;
}

export default function ImportCSVDialog({ 
  isOpen, 
  onClose, 
  onImportComplete,
  companyId,
  orgId,
  token
}: ImportCSVDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResult(null);
    } else {
      alert('Por favor, selecione um arquivo CSV válido');
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('organization_id', companyId);

      const response = await fetch('http://localhost:3001/api/v1/php/employees/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-org-id': orgId,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        if (data.success > 0) {
          onImportComplete();
        }
      } else {
        alert(`Erro ao importar: ${data.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      alert('Erro ao importar arquivo CSV');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = `full_name,cpf,hire_date,email,phone,birth_date,position,department,manager_cpf,status
"Fernando Roberto Dias",05683517603,2024-01-15,"fernando@empresa.com","(11) 99999-9999",1980-12-21,"CEO (Chief Executive Officer)","Administração",,active
"Maria Silva Santos",12345678900,2024-02-01,"maria@empresa.com","(11) 98888-8888",1985-05-20,"Diretor de Tecnologia (CTO)","Tecnologia",05683517603,active
"João Paulo Costa",98765432100,2024-03-10,"joao@empresa.com","(11) 97777-7777",1990-08-15,"Gerente Executivo","Tecnologia",12345678900,active
"Ana Carolina Souza",55544433322,2024-04-05,"ana@empresa.com","(11) 96666-6666",1992-11-10,"Analista Sênior","Tecnologia",98765432100,active

IMPORTANTE - Leia as instruções abaixo:

CAMPOS OBRIGATÓRIOS:
- full_name: Nome completo do funcionário
- cpf: 11 dígitos numéricos (sem pontos ou traços). Deve ser único na empresa
- hire_date: Data de admissão no formato YYYY-MM-DD

CAMPOS OPCIONAIS:
- email: Email corporativo
- phone: Telefone com DDD (formato livre)
- birth_date: Data de nascimento no formato YYYY-MM-DD
- position: Cargo (ver lista de cargos válidos na documentação)
- department: Departamento/Área
- manager_cpf: CPF do gestor direto (11 dígitos). Use para criar hierarquia
- status: active, inactive ou terminated (padrão: active)

HIERARQUIA:
- O campo manager_cpf cria a relação hierárquica
- O gestor deve estar no mesmo CSV ou já cadastrado no sistema
- Deixe vazio para funcionários sem gestor (ex: CEO, Diretoria)

CARGOS VÁLIDOS (46 opções):
Alta Administração: Membro do Conselho, CEO (Chief Executive Officer), Vice-Presidente
Diretoria: CFO, COO, CTO, CHRO, CMO, CLO, Diretor Comercial, Diretor de Marketing
Gerência: Gerente Executivo, Gerente Sênior, Gerente, Gerente de Área, Gerente de Produto
Coordenação: Coordenador, Coordenador de Equipe
Especialização: Especialista, Especialista Sênior, Consultor, Consultor Sênior
Análise: Analista Sênior, Analista Pleno, Analista Júnior, Analista
Técnico: Técnico Especializado, Técnico, Técnico de Suporte
Assistência: Assistente Sênior, Assistente, Auxiliar Administrativo
Atendimento: Atendente, Operador, Operador de Telemarketing
Estágio: Estagiário

EXEMPLO DE HIERARQUIA NO CSV:
CEO (sem manager_cpf) → CTO (manager_cpf do CEO) → Gerente (manager_cpf do CTO) → Analista (manager_cpf do Gerente)`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `template_funcionarios_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E5E5DC]">
          <div className="flex items-center gap-3">
            <Upload className="w-6 h-6 text-[#141042]" />
            <h2 className="text-xl font-semibold text-[#141042]">
              Importar Funcionários via CSV
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-[#FAFAF8] rounded transition-colors"
          >
            <X className="w-5 h-5 text-[#666666]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Template Download */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 mb-1">
                  Baixar Template CSV
                </h3>
                <p className="text-sm text-blue-700 mb-3">
                  Use nosso template como referência para estruturar seu arquivo CSV corretamente.
                </p>
                <button
                  onClick={downloadTemplate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Baixar Template
                </button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-3">
            <h3 className="font-semibold text-[#141042]">📋 Estrutura da Tabela Employees</h3>
            
            <div className="bg-[#FAFAF8] rounded-lg p-3 space-y-2 text-sm">
              <div>
                <h4 className="font-medium text-[#141042] mb-1">✅ Campos Obrigatórios:</h4>
                <ul className="space-y-1 text-[#666666] ml-4">
                  <li>• <strong>full_name</strong>: Nome completo do funcionário</li>
                  <li>• <strong>cpf</strong>: 11 dígitos (apenas números, sem pontos/traços)</li>
                  <li>• <strong>hire_date</strong>: Data admissão (formato: YYYY-MM-DD)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-[#141042] mb-1">⭕ Campos Opcionais:</h4>
                <ul className="space-y-1 text-[#666666] ml-4">
                  <li>• <strong>email</strong>: Email corporativo</li>
                  <li>• <strong>phone</strong>: Telefone (formato livre)</li>
                  <li>• <strong>birth_date</strong>: Data nascimento (YYYY-MM-DD)</li>
                  <li>• <strong>position</strong>: Cargo (ver lista no template)</li>
                  <li>• <strong>department</strong>: Departamento/Área</li>
                  <li>• <strong>manager_cpf</strong>: CPF do gestor (cria hierarquia)</li>
                  <li>• <strong>status</strong>: active, inactive ou terminated</li>
                </ul>
              </div>

              <div className="border-t border-[#E5E5DC] pt-2 mt-2">
                <h4 className="font-medium text-yellow-700 mb-1">⚠️ Regras Importantes:</h4>
                <ul className="space-y-1 text-[#666666] ml-4">
                  <li>• CPF deve ser <strong>único</strong> na empresa</li>
                  <li>• manager_cpf deve existir no CSV ou no sistema</li>
                  <li>• Todos os funcionários vão para a empresa atual</li>
                  <li>• Template inclui 46 cargos válidos com hierarquia</li>
                </ul>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-file-input"
            />
            <label
              htmlFor="csv-file-input"
              className="block w-full p-8 border-2 border-dashed border-[#E5E5DC] rounded-lg text-center cursor-pointer hover:border-[#141042] hover:bg-[#FAFAF8] transition-colors"
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-8 h-8 text-[#141042]" />
                  <div className="text-left">
                    <p className="font-medium text-[#141042]">{file.name}</p>
                    <p className="text-sm text-[#666666]">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="w-12 h-12 text-[#666666] mx-auto mb-3" />
                  <p className="text-[#141042] font-medium mb-1">
                    Clique para selecionar arquivo CSV
                  </p>
                  <p className="text-sm text-[#666666]">
                    ou arraste e solte aqui
                  </p>
                </div>
              )}
            </label>
          </div>

          {/* Result */}
          {result && (
            <div className={`rounded-lg p-4 ${
              result.errors.length === 0 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <div className="flex items-start gap-3 mb-3">
                {result.errors.length === 0 ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className={`font-medium mb-1 ${
                    result.errors.length === 0 ? 'text-green-900' : 'text-yellow-900'
                  }`}>
                    {result.errors.length === 0 
                      ? 'Importação concluída com sucesso!' 
                      : 'Importação concluída com avisos'}
                  </h3>
                  <div className="text-sm space-y-1">
                    <p className={result.errors.length === 0 ? 'text-green-700' : 'text-yellow-700'}>
                      <strong>{result.success}</strong> de <strong>{result.total}</strong> funcionários importados com sucesso
                    </p>
                    {result.errors.length > 0 && (
                      <p className="text-yellow-700">
                        <strong>{result.errors.length}</strong> erros encontrados
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Error List */}
              {result.errors.length > 0 && (
                <div className="mt-3 max-h-48 overflow-y-auto">
                  <h4 className="text-sm font-medium text-yellow-900 mb-2">Erros:</h4>
                  <div className="space-y-2">
                    {result.errors.map((error, index) => (
                      <div key={index} className="text-sm bg-white rounded p-2 border border-yellow-200">
                        <span className="font-medium text-yellow-900">Linha {error.row}:</span>
                        {error.field && <span className="text-yellow-700"> [{error.field}]</span>}
                        <span className="text-yellow-700"> {error.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-[#E5E5DC]">
          {result ? (
            <>
              <button
                onClick={reset}
                className="px-4 py-2 border border-[#E5E5DC] text-[#141042] rounded-lg hover:bg-[#FAFAF8] transition-colors"
              >
                Importar Novamente
              </button>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-[#141042] text-white rounded-lg hover:bg-[#1a1557] transition-colors"
              >
                Concluir
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-[#E5E5DC] text-[#141042] rounded-lg hover:bg-[#FAFAF8] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleImport}
                disabled={!file || importing}
                className="px-4 py-2 bg-[#141042] text-white rounded-lg hover:bg-[#1a1557] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Importar Arquivo
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
