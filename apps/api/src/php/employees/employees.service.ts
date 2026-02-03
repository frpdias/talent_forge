// apps/api/src/php/employees/employees.service.ts
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto';
import type { Employee, EmployeeWithManager, EmployeeFilters } from '@talentforge/types';

@Injectable()
export class EmployeesService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Criar novo funcionário
   */
  async create(userId: string, dto: CreateEmployeeDto): Promise<Employee> {
    const client = this.supabase.getAdminClient();

    // Validar que a organização existe e é do tipo 'company'
    const { data: org, error: orgError } = await client
      .from('organizations')
      .select('id, org_type')
      .eq('id', dto.organization_id)
      .single();

    if (orgError || !org) {
      throw new NotFoundException('Organização não encontrada');
    }

    if (org.org_type !== 'company') {
      throw new BadRequestException('Funcionários só podem ser cadastrados em organizações do tipo "company"');
    }

    // Normalizar CPF (remover caracteres não numéricos)
    const cpfNormalized = dto.cpf.replace(/\D/g, '');

    // Validar CPF duplicado na mesma organização
    const { data: existing } = await client
      .from('employees')
      .select('id')
      .eq('organization_id', dto.organization_id)
      .eq('cpf', cpfNormalized)
      .maybeSingle();

    if (existing) {
      throw new BadRequestException('CPF já cadastrado nesta organização');
    }

    // Se manager_id foi fornecido, validar que existe e pertence à mesma org
    if (dto.manager_id) {
      const { data: manager } = await client
        .from('employees')
        .select('id, organization_id')
        .eq('id', dto.manager_id)
        .maybeSingle();

      if (!manager) {
        throw new NotFoundException('Gestor não encontrado');
      }

      if (manager.organization_id !== dto.organization_id) {
        throw new BadRequestException('Gestor deve pertencer à mesma organização');
      }
    }

    // Criar funcionário
    const { data, error } = await client
      .from('employees')
      .insert({
        ...dto,
        cpf: cpfNormalized,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Erro ao criar funcionário: ${error.message}`);
    }

    return data;
  }

  /**
   * Listar funcionários com filtros
   */
  async findAll(userId: string, filters: EmployeeFilters = {}): Promise<EmployeeWithManager[]> {
    const client = this.supabase.getAdminClient();

    let query = client
      .from('employees')
      .select(`
        *,
        manager:manager_id(id, full_name, position)
      `)
      .order('full_name', { ascending: true });

    if (filters.organization_id) {
      query = query.eq('organization_id', filters.organization_id);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.department) {
      query = query.eq('department', filters.department);
    }

    if (filters.manager_id) {
      query = query.eq('manager_id', filters.manager_id);
    }

    if (filters.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,cpf.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new BadRequestException(`Erro ao listar funcionários: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Buscar funcionário por ID
   */
  async findOne(userId: string, id: string): Promise<EmployeeWithManager> {
    const client = this.supabase.getAdminClient();

    console.log('🔍 [EmployeesService.findOne] Buscando funcionário:', { userId, id });

    const { data, error } = await client
      .from('employees')
      .select(`
        *,
        manager:manager_id(id, full_name, position),
        organization:organizations(id, name, org_type)
      `)
      .eq('id', id)
      .single();

    console.log('🔍 [EmployeesService.findOne] Resultado:', { data: !!data, error });

    if (error || !data) {
      console.error('❌ [EmployeesService.findOne] Erro:', error);
      throw new NotFoundException('Funcionário não encontrado');
    }

    return data;
  }

  /**
   * Atualizar funcionário
   */
  async update(userId: string, id: string, dto: UpdateEmployeeDto): Promise<Employee> {
    const client = this.supabase.getAdminClient();

    // Verificar que funcionário existe
    const { data: existing, error: existingError } = await client
      .from('employees')
      .select('id, organization_id')
      .eq('id', id)
      .single();

    if (existingError || !existing) {
      throw new NotFoundException('Funcionário não encontrado');
    }

    // Se manager_id foi fornecido, validar
    if (dto.manager_id) {
      // Evitar loop (funcionário ser gestor de si mesmo)
      if (dto.manager_id === id) {
        throw new BadRequestException('Funcionário não pode ser gestor de si mesmo');
      }

      const { data: manager } = await client
        .from('employees')
        .select('id, organization_id')
        .eq('id', dto.manager_id)
        .maybeSingle();

      if (!manager) {
        throw new NotFoundException('Gestor não encontrado');
      }

      if (manager.organization_id !== existing.organization_id) {
        throw new BadRequestException('Gestor deve pertencer à mesma organização');
      }
    }

    // Atualizar
    const { data, error } = await client
      .from('employees')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Erro ao atualizar funcionário: ${error.message}`);
    }

    return data;
  }

  /**
   * Deletar funcionário (soft delete preferencial via status='terminated')
   */
  async remove(userId: string, id: string): Promise<void> {
    const client = this.supabase.getAdminClient();

    // Verificar se tem subordinados ativos
    const { data: subordinates } = await client
      .from('employees')
      .select('id')
      .eq('manager_id', id)
      .eq('status', 'active')
      .limit(1);

    if (subordinates && subordinates.length > 0) {
      throw new BadRequestException('Não é possível deletar funcionário com subordinados ativos. Reatribua os subordinados primeiro.');
    }

    const { error } = await client.from('employees').delete().eq('id', id);

    if (error) {
      throw new BadRequestException(`Erro ao deletar funcionário: ${error.message}`);
    }
  }

  /**
   * Obter hierarquia (organograma) da organização
   */
  async getHierarchy(userId: string, organizationId: string): Promise<any[]> {
    const client = this.supabase.getAdminClient();

    // Buscar todos funcionários ativos da organização
    const { data, error } = await client
      .from('employees')
      .select('id, full_name, position, department, manager_id')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('full_name', { ascending: true });

    if (error) {
      throw new BadRequestException(`Erro ao buscar hierarquia: ${error.message}`);
    }

    // Construir árvore hierárquica
    return this.buildTree(data || []);
  }

  /**
   * Construir árvore hierárquica a partir de lista flat
   */
  private buildTree(employees: any[]): any[] {
    const map = new Map();
    const roots: any[] = [];

    // Criar mapa de ID -> employee com children
    employees.forEach(emp => {
      map.set(emp.id, { ...emp, children: [] });
    });

    // Construir árvore
    employees.forEach(emp => {
      const node = map.get(emp.id);
      if (emp.manager_id && map.has(emp.manager_id)) {
        map.get(emp.manager_id).children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  /**
   * Retorna níveis hierárquicos (N1-N11) da organização
   */
  async getHierarchyLevels(organizationId: string) {
    const client = this.supabase.getAdminClient();
    const { data, error } = await client
      .from('hierarchy_config')
      .select('config_data')
      .eq('organization_id', organizationId)
      .eq('config_type', 'hierarchy_levels')
      .single();

    if (error) {
      throw new BadRequestException(`Erro ao buscar níveis hierárquicos: ${error.message}`);
    }

    return data?.config_data?.hierarchy_levels || [];
  }

  /**
   * Retorna gestores válidos para um nível hierárquico
   * Usa função SQL: get_valid_managers(p_employee_level, p_organization_id)
   */
  async getValidManagers(level: string, organizationId: string) {
    const client = this.supabase.getAdminClient();
    const { data, error } = await client.rpc('get_valid_managers', {
      p_employee_level: level,
      p_organization_id: organizationId,
    });

    if (error) {
      throw new BadRequestException(`Erro ao buscar gestores válidos: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Retorna configuração completa de hierarquia (JSONB)
   */
  async getHierarchyConfig(organizationId: string) {
    const client = this.supabase.getAdminClient();
    const { data, error } = await client
      .from('hierarchy_config')
      .select('*')
      .eq('organization_id', organizationId);

    if (error) {
      throw new BadRequestException(`Erro ao buscar configuração de hierarquia: ${error.message}`);
    }

    // Transforma array em objeto { hierarchy_levels: [...], seniority_levels: [...] }
    const config: Record<string, any> = {};
    data?.forEach((row) => {
      config[row.config_type] = row.config_data;
    });

    return config;
  }

  /**
   * Importar funcionários via CSV
   */
  async importFromCSV(
    userId: string,
    organizationId: string,
    fileBuffer: Buffer,
  ): Promise<{
    success: number;
    errors: Array<{ row: number; field?: string; message: string }>;
    total: number;
  }> {
    const client = this.supabase.getAdminClient();
    const errors: Array<{ row: number; field?: string; message: string }> = [];
    let successCount = 0;

    // Validar organização
    const { data: org, error: orgError } = await client
      .from('organizations')
      .select('id, org_type')
      .eq('id', organizationId)
      .single();

    if (orgError || !org || org.org_type !== 'company') {
      throw new BadRequestException('Organização inválida');
    }

    // Parse CSV
    const csvText = fileBuffer.toString('utf-8');
    const lines = csvText.split('\n').filter((line) => line.trim());

    if (lines.length < 2) {
      throw new BadRequestException('Arquivo CSV vazio ou inválido');
    }

    // Verificar header
    const header = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
    const requiredFields = ['full_name', 'cpf', 'hire_date'];
    const missingFields = requiredFields.filter((f) => !header.includes(f));

    if (missingFields.length > 0) {
      throw new BadRequestException(`Campos obrigatórios ausentes: ${missingFields.join(', ')}`);
    }

    // Criar mapa CPF -> ID para resolução de manager_cpf
    const cpfMap = new Map<string, string>();

    // Primeira passagem: criar funcionários sem manager
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = this.parseCSVLine(line);
      const row: Record<string, string> = {};
      header.forEach((key, index) => {
        row[key] = values[index] || '';
      });

      try {
        // Validações
        if (!row.full_name || !row.cpf || !row.hire_date) {
          errors.push({
            row: i + 1,
            message: 'Campos obrigatórios ausentes (full_name, cpf, hire_date)',
          });
          continue;
        }

        const cpfNormalized = row.cpf.replace(/\D/g, '');
        if (cpfNormalized.length !== 11) {
          errors.push({ row: i + 1, field: 'cpf', message: 'CPF deve ter 11 dígitos' });
          continue;
        }

        // Verificar CPF duplicado
        const { data: existing } = await client
          .from('employees')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('cpf', cpfNormalized)
          .maybeSingle();

        if (existing) {
          errors.push({ row: i + 1, field: 'cpf', message: 'CPF já cadastrado' });
          continue;
        }

        // Criar DTO
        const createDto: any = {
          organization_id: organizationId,
          full_name: row.full_name.replace(/"/g, ''),
          cpf: cpfNormalized,
          hire_date: row.hire_date,
          status: row.status || 'active',
        };

        if (row.email) createDto.metadata = { email: row.email.replace(/"/g, '') };
        if (row.phone) {
          createDto.metadata = { ...createDto.metadata, phone: row.phone.replace(/"/g, '') };
        }
        if (row.birth_date) createDto.birth_date = row.birth_date;
        if (row.position) createDto.position = row.position.replace(/"/g, '');
        if (row.department) createDto.department = row.department.replace(/"/g, '');
        if (row.termination_date) createDto.termination_date = row.termination_date;

        // Inserir funcionário
        const { data: newEmployee, error: insertError } = await client
          .from('employees')
          .insert(createDto)
          .select('id, cpf')
          .single();

        if (insertError) {
          errors.push({ row: i + 1, message: insertError.message });
          continue;
        }

        // Mapear CPF -> ID para segunda passagem
        cpfMap.set(cpfNormalized, newEmployee.id);
        successCount++;
      } catch (error) {
        errors.push({ row: i + 1, message: error.message || 'Erro desconhecido' });
      }
    }

    // Segunda passagem: atualizar managers
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = this.parseCSVLine(line);
      const row: Record<string, string> = {};
      header.forEach((key, index) => {
        row[key] = values[index] || '';
      });

      if (row.manager_cpf) {
        const cpfNormalized = row.cpf.replace(/\D/g, '');
        const managerCpfNormalized = row.manager_cpf.replace(/\D/g, '');
        const employeeId = cpfMap.get(cpfNormalized);
        const managerId = cpfMap.get(managerCpfNormalized);

        if (employeeId && managerId) {
          await client
            .from('employees')
            .update({ manager_id: managerId })
            .eq('id', employeeId);
        }
      }
    }

    return {
      success: successCount,
      errors,
      total: lines.length - 1,
    };
  }

  /**
   * Parse linha CSV respeitando aspas
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }
}
