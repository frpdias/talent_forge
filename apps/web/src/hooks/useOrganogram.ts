'use client';

import { useState, useCallback } from 'react';
import { Employee, HierarchyNode } from '@/types/tfci';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface UseOrganogramProps {
  organizationId: string;
  accessToken: string;
  orgId: string;
}

export function useOrganogram({
  organizationId,
  accessToken,
  orgId,
}: UseOrganogramProps) {
  const [hierarchy, setHierarchy] = useState<HierarchyNode | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
    'x-org-id': orgId,
  };

  // Buscar hierarquia completa
  const fetchHierarchy = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${API_BASE_URL}/api/v1/php/employees/hierarchy/${organizationId}`,
        { headers }
      );
      
      if (!response.ok) throw new Error('Erro ao buscar hierarquia');
      
      const data = await response.json();
      setHierarchy(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [organizationId, accessToken, orgId]);

  // Buscar todos os funcionários
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${API_BASE_URL}/api/v1/php/employees`,
        { headers }
      );
      
      if (!response.ok) throw new Error('Erro ao buscar funcionários');
      
      const data: Employee[] = await response.json();
      setEmployees(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [accessToken, orgId]);

  // Construir hierarquia filtrada baseada no nível do usuário
  const buildFilteredHierarchy = useCallback(
    (currentUserId: string, allEmployees: Employee[]): HierarchyNode | null => {
      const employeeMap = new Map<string, Employee>();
      allEmployees.forEach(emp => employeeMap.set(emp.id, emp));

      const currentEmployee = employeeMap.get(currentUserId);
      if (!currentEmployee) return null;

      // Função recursiva para construir hierarquia
      const buildNode = (employee: Employee, level: number): HierarchyNode => {
        const subordinates = allEmployees
          .filter(emp => emp.manager_id === employee.id)
          .map(sub => buildNode(sub, level + 1));

        return {
          ...employee,
          subordinates,
          level,
        };
      };

      // Construir a partir do funcionário atual
      return buildNode(currentEmployee, 0);
    },
    []
  );

  return {
    hierarchy,
    employees,
    loading,
    error,
    fetchHierarchy,
    fetchEmployees,
    buildFilteredHierarchy,
  };
}
