"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeesService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../../supabase/supabase.service");
let EmployeesService = class EmployeesService {
    constructor(supabase) {
        this.supabase = supabase;
    }
    async create(userId, dto) {
        const client = this.supabase.getAdminClient();
        const { data: org, error: orgError } = await client
            .from('organizations')
            .select('id, org_type')
            .eq('id', dto.organization_id)
            .single();
        if (orgError || !org) {
            throw new common_1.NotFoundException('Organização não encontrada');
        }
        if (org.org_type !== 'company') {
            throw new common_1.BadRequestException('Funcionários só podem ser cadastrados em organizações do tipo "company"');
        }
        const cpfNormalized = dto.cpf.replace(/\D/g, '');
        const { data: existing } = await client
            .from('employees')
            .select('id')
            .eq('organization_id', dto.organization_id)
            .eq('cpf', cpfNormalized)
            .maybeSingle();
        if (existing) {
            throw new common_1.BadRequestException('CPF já cadastrado nesta organização');
        }
        if (dto.manager_id) {
            const { data: manager } = await client
                .from('employees')
                .select('id, organization_id')
                .eq('id', dto.manager_id)
                .maybeSingle();
            if (!manager) {
                throw new common_1.NotFoundException('Gestor não encontrado');
            }
            if (manager.organization_id !== dto.organization_id) {
                throw new common_1.BadRequestException('Gestor deve pertencer à mesma organização');
            }
        }
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
            throw new common_1.BadRequestException(`Erro ao criar funcionário: ${error.message}`);
        }
        return data;
    }
    async findAll(userId, filters = {}) {
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
            throw new common_1.BadRequestException(`Erro ao listar funcionários: ${error.message}`);
        }
        return data || [];
    }
    async findOne(userId, id) {
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
            throw new common_1.NotFoundException('Funcionário não encontrado');
        }
        return data;
    }
    async update(userId, id, dto) {
        const client = this.supabase.getAdminClient();
        const { data: existing, error: existingError } = await client
            .from('employees')
            .select('id, organization_id')
            .eq('id', id)
            .single();
        if (existingError || !existing) {
            throw new common_1.NotFoundException('Funcionário não encontrado');
        }
        if (dto.manager_id) {
            if (dto.manager_id === id) {
                throw new common_1.BadRequestException('Funcionário não pode ser gestor de si mesmo');
            }
            const { data: manager } = await client
                .from('employees')
                .select('id, organization_id')
                .eq('id', dto.manager_id)
                .maybeSingle();
            if (!manager) {
                throw new common_1.NotFoundException('Gestor não encontrado');
            }
            if (manager.organization_id !== existing.organization_id) {
                throw new common_1.BadRequestException('Gestor deve pertencer à mesma organização');
            }
        }
        const { data, error } = await client
            .from('employees')
            .update(dto)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Erro ao atualizar funcionário: ${error.message}`);
        }
        return data;
    }
    async remove(userId, id) {
        const client = this.supabase.getAdminClient();
        const { data: subordinates } = await client
            .from('employees')
            .select('id')
            .eq('manager_id', id)
            .eq('status', 'active')
            .limit(1);
        if (subordinates && subordinates.length > 0) {
            throw new common_1.BadRequestException('Não é possível deletar funcionário com subordinados ativos. Reatribua os subordinados primeiro.');
        }
        const { error } = await client.from('employees').delete().eq('id', id);
        if (error) {
            throw new common_1.BadRequestException(`Erro ao deletar funcionário: ${error.message}`);
        }
    }
    async getHierarchy(userId, organizationId) {
        const client = this.supabase.getAdminClient();
        const { data, error } = await client
            .from('employees')
            .select('id, full_name, position, department, manager_id')
            .eq('organization_id', organizationId)
            .eq('status', 'active')
            .order('full_name', { ascending: true });
        if (error) {
            throw new common_1.BadRequestException(`Erro ao buscar hierarquia: ${error.message}`);
        }
        return this.buildTree(data || []);
    }
    buildTree(employees) {
        const map = new Map();
        const roots = [];
        employees.forEach(emp => {
            map.set(emp.id, { ...emp, children: [] });
        });
        employees.forEach(emp => {
            const node = map.get(emp.id);
            if (emp.manager_id && map.has(emp.manager_id)) {
                map.get(emp.manager_id).children.push(node);
            }
            else {
                roots.push(node);
            }
        });
        return roots;
    }
    async getHierarchyLevels(organizationId) {
        const client = this.supabase.getAdminClient();
        const { data, error } = await client
            .from('hierarchy_config')
            .select('config_data')
            .eq('organization_id', organizationId)
            .eq('config_type', 'hierarchy_levels')
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Erro ao buscar níveis hierárquicos: ${error.message}`);
        }
        return data?.config_data?.hierarchy_levels || [];
    }
    async getValidManagers(level, organizationId) {
        const client = this.supabase.getAdminClient();
        const { data, error } = await client.rpc('get_valid_managers', {
            p_employee_level: level,
            p_organization_id: organizationId,
        });
        if (error) {
            throw new common_1.BadRequestException(`Erro ao buscar gestores válidos: ${error.message}`);
        }
        return data || [];
    }
    async getHierarchyConfig(organizationId) {
        const client = this.supabase.getAdminClient();
        const { data, error } = await client
            .from('hierarchy_config')
            .select('*')
            .eq('organization_id', organizationId);
        if (error) {
            throw new common_1.BadRequestException(`Erro ao buscar configuração de hierarquia: ${error.message}`);
        }
        const config = {};
        data?.forEach((row) => {
            config[row.config_type] = row.config_data;
        });
        return config;
    }
    async importFromCSV(userId, organizationId, fileBuffer) {
        const client = this.supabase.getAdminClient();
        const errors = [];
        let successCount = 0;
        const { data: org, error: orgError } = await client
            .from('organizations')
            .select('id, org_type')
            .eq('id', organizationId)
            .single();
        if (orgError || !org || org.org_type !== 'company') {
            throw new common_1.BadRequestException('Organização inválida');
        }
        const csvText = fileBuffer.toString('utf-8');
        const lines = csvText.split('\n').filter((line) => line.trim());
        if (lines.length < 2) {
            throw new common_1.BadRequestException('Arquivo CSV vazio ou inválido');
        }
        const header = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
        const requiredFields = ['full_name', 'cpf', 'hire_date'];
        const missingFields = requiredFields.filter((f) => !header.includes(f));
        if (missingFields.length > 0) {
            throw new common_1.BadRequestException(`Campos obrigatórios ausentes: ${missingFields.join(', ')}`);
        }
        const cpfMap = new Map();
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line)
                continue;
            const values = this.parseCSVLine(line);
            const row = {};
            header.forEach((key, index) => {
                row[key] = values[index] || '';
            });
            try {
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
                const createDto = {
                    organization_id: organizationId,
                    full_name: row.full_name.replace(/"/g, ''),
                    cpf: cpfNormalized,
                    hire_date: row.hire_date,
                    status: row.status || 'active',
                };
                if (row.email)
                    createDto.metadata = { email: row.email.replace(/"/g, '') };
                if (row.phone) {
                    createDto.metadata = { ...createDto.metadata, phone: row.phone.replace(/"/g, '') };
                }
                if (row.birth_date)
                    createDto.birth_date = row.birth_date;
                if (row.position)
                    createDto.position = row.position.replace(/"/g, '');
                if (row.department)
                    createDto.department = row.department.replace(/"/g, '');
                if (row.termination_date)
                    createDto.termination_date = row.termination_date;
                const { data: newEmployee, error: insertError } = await client
                    .from('employees')
                    .insert(createDto)
                    .select('id, cpf')
                    .single();
                if (insertError) {
                    errors.push({ row: i + 1, message: insertError.message });
                    continue;
                }
                cpfMap.set(cpfNormalized, newEmployee.id);
                successCount++;
            }
            catch (error) {
                errors.push({ row: i + 1, message: error.message || 'Erro desconhecido' });
            }
        }
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line)
                continue;
            const values = this.parseCSVLine(line);
            const row = {};
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
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            }
            else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            }
            else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    }
};
exports.EmployeesService = EmployeesService;
exports.EmployeesService = EmployeesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], EmployeesService);
//# sourceMappingURL=employees.service.js.map