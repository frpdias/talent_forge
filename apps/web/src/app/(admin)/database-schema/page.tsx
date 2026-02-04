'use client';

import { useState, useEffect } from 'react';
import { Database, Table, Key, Shield, RefreshCw, FileCode } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface TableSchema {
  name: string;
  column_count: number;
  row_count: number;
  policies: PolicyInfo[];
  rls_enabled: boolean;
}

interface PolicyInfo {
  policyname: string;
  cmd: string;
  description?: string;
}

interface FunctionInfo {
  name: string;
  return_type: string;
}

export default function DatabaseSchemaPage() {
  const [tables, setTables] = useState<TableSchema[]>([]);
  const [functions, setFunctions] = useState<FunctionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableColumns, setTableColumns] = useState<any[]>([]);

  useEffect(() => {
    fetchDatabaseSchema();
  }, []);

  const fetchDatabaseSchema = async () => {
    try {
      const supabase = createClient();

      // Buscar tabelas principais do sistema
      const coreTables = [
        'organizations',
        'org_members',
        'employees',
        'tfci_cycles',
        'tfci_assessments',
        'nr1_assessments',
        'copc_metrics',
        'jobs',
        'candidates',
        'applications'
      ];

      const tablesData: TableSchema[] = [];

      for (const tableName of coreTables) {
        // Contar registros
        const { count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        // Buscar policies
        let policies: any[] = [];
        try {
          const { data: policiesData } = await supabase.rpc('exec_sql', {
            query: `
              SELECT policyname, cmd
              FROM pg_policies
              WHERE tablename = '${tableName}'
              ORDER BY cmd, policyname
            `
          });
          policies = policiesData || [];
        } catch {
          policies = [];
        }

        // Verificar RLS status
        let rlsEnabled = false;
        try {
          const { data: rlsData } = await supabase.rpc('exec_sql', {
            query: `
              SELECT relrowsecurity as rls_enabled
              FROM pg_class
              WHERE relname = '${tableName}'
            `
          });
          rlsEnabled = rlsData?.[0]?.rls_enabled || false;
        } catch {
          rlsEnabled = false;
        }

        tablesData.push({
          name: tableName,
          column_count: 0,
          row_count: count || 0,
          policies: policies,
          rls_enabled: rlsEnabled
        });
      }

      setTables(tablesData);

      // Buscar functions
      let functionsData: any[] = [];
      try {
        const { data: funcData } = await supabase.rpc('exec_sql', {
          query: `
            SELECT routine_name as name, data_type as return_type
            FROM information_schema.routines
            WHERE routine_schema = 'public'
            AND routine_type = 'FUNCTION'
            AND routine_name LIKE 'is_%'
            ORDER BY routine_name
          `
        });
        functionsData = funcData || [];
      } catch {
        functionsData = [];
      }

      setFunctions(functionsData);
    } catch (error) {
      console.error('Error fetching schema:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableColumns = async (tableName: string) => {
    const supabase = createClient();
    let columnsData: any[] = [];
    try {
      const { data } = await supabase.rpc('exec_sql', {
        query: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_name = '${tableName}'
          ORDER BY ordinal_position
        `
      });
      columnsData = data || [];
    } catch {
      columnsData = [];
    }

    setTableColumns(columnsData);
  };

  const handleTableClick = (tableName: string) => {
    setSelectedTable(tableName);
    fetchTableColumns(tableName);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const phpTables = tables.filter(t => 
    t.name.startsWith('tfci_') || 
    t.name.startsWith('nr1_') || 
    t.name.startsWith('copc_')
  );
  const coreTables = tables.filter(t => 
    !phpTables.includes(t) && 
    ['organizations', 'org_members', 'employees'].includes(t.name)
  );
  const recruitmentTables = tables.filter(t => 
    ['jobs', 'candidates', 'applications'].includes(t.name)
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Database className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Database Schema</h1>
                <p className="text-sm text-gray-600">TalentForge - Sprint 15</p>
              </div>
            </div>
            <button
              onClick={fetchDatabaseSchema}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <Table className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Tabelas</p>
                <p className="text-2xl font-bold text-gray-900">{tables.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Policies RLS</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tables.reduce((sum, t) => sum + t.policies.length, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <FileCode className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Functions</p>
                <p className="text-2xl font-bold text-gray-900">{functions.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Módulos</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left Sidebar - Tables */}
          <div className="col-span-1 space-y-6">
            {/* Core Tables */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200 px-4 py-3">
                <h3 className="font-semibold text-gray-900">🔐 Core System</h3>
              </div>
              <div className="p-2">
                {coreTables.map(table => (
                  <button
                    key={table.name}
                    onClick={() => handleTableClick(table.name)}
                    className={`w-full text-left px-3 py-2 rounded-md mb-1 transition-colors ${
                      selectedTable === table.name
                        ? 'bg-blue-100 text-blue-900'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Table className="w-4 h-4" />
                        <span className="text-sm font-medium">{table.name}</span>
                      </div>
                      {table.rls_enabled && (
                        <Shield className="w-3 h-3 text-green-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{table.row_count} rows</span>
                      <span>•</span>
                      <span>{table.policies.length} policies</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* PHP Module Tables */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200 px-4 py-3">
                <h3 className="font-semibold text-gray-900">📊 PHP Module</h3>
              </div>
              <div className="p-2">
                {phpTables.map(table => (
                  <button
                    key={table.name}
                    onClick={() => handleTableClick(table.name)}
                    className={`w-full text-left px-3 py-2 rounded-md mb-1 transition-colors ${
                      selectedTable === table.name
                        ? 'bg-blue-100 text-blue-900'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Table className="w-4 h-4" />
                        <span className="text-sm font-medium">{table.name}</span>
                      </div>
                      {table.rls_enabled && (
                        <Shield className="w-3 h-3 text-green-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{table.row_count} rows</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recruitment Tables */}
            {recruitmentTables.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="border-b border-gray-200 px-4 py-3">
                  <h3 className="font-semibold text-gray-900">👥 Recruitment</h3>
                </div>
                <div className="p-2">
                  {recruitmentTables.map(table => (
                    <button
                      key={table.name}
                      onClick={() => handleTableClick(table.name)}
                      className={`w-full text-left px-3 py-2 rounded-md mb-1 transition-colors ${
                        selectedTable === table.name
                          ? 'bg-blue-100 text-blue-900'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Table className="w-4 h-4" />
                          <span className="text-sm font-medium">{table.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>{table.row_count} rows</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Functions */}
            {functions.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="border-b border-gray-200 px-4 py-3">
                  <h3 className="font-semibold text-gray-900">🔧 Functions</h3>
                </div>
                <div className="p-4 space-y-2">
                  {functions.map(func => (
                    <div key={func.name} className="flex items-center gap-2 text-sm">
                      <FileCode className="w-4 h-4 text-purple-600" />
                      <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                        {func.name}() → {func.return_type}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Table Details */}
          <div className="col-span-2">
            {selectedTable ? (
              <div className="space-y-4">
                {/* Table Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedTable}</h2>
                      <p className="text-sm text-gray-600">
                        {tables.find(t => t.name === selectedTable)?.row_count} registros
                      </p>
                    </div>
                    {tables.find(t => t.name === selectedTable)?.rls_enabled && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        <Shield className="w-4 h-4" />
                        RLS Ativado
                      </div>
                    )}
                  </div>
                </div>

                {/* Columns */}
                {tableColumns.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="border-b border-gray-200 px-6 py-3">
                      <h3 className="font-semibold text-gray-900">Colunas ({tableColumns.length})</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Nome
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Tipo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Nullable
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Default
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {tableColumns.map((col, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-6 py-3 text-sm font-mono text-gray-900">
                                {col.column_name}
                              </td>
                              <td className="px-6 py-3 text-sm text-gray-600">
                                {col.data_type}
                              </td>
                              <td className="px-6 py-3 text-sm">
                                {col.is_nullable === 'YES' ? (
                                  <span className="text-gray-500">NULL</span>
                                ) : (
                                  <span className="text-red-600 font-medium">NOT NULL</span>
                                )}
                              </td>
                              <td className="px-6 py-3 text-sm font-mono text-gray-600">
                                {col.column_default || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Policies */}
                {(tables.find(t => t.name === selectedTable)?.policies?.length ?? 0) > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="border-b border-gray-200 px-6 py-3">
                      <h3 className="font-semibold text-gray-900">
                        Policies RLS ({tables.find(t => t.name === selectedTable)?.policies?.length ?? 0})
                      </h3>
                    </div>
                    <div className="p-6 space-y-3">
                      {tables.find(t => t.name === selectedTable)?.policies.map((policy, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-mono text-sm text-gray-900">{policy.policyname}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              Comando: <span className="font-semibold">{policy.cmd}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
                <div className="text-center text-gray-500">
                  <Database className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Selecione uma tabela</p>
                  <p className="text-sm mt-2">Clique em uma tabela à esquerda para ver seus detalhes</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
