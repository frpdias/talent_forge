import { SupabaseService } from '../../supabase/supabase.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto';
import type { Employee, EmployeeWithManager, EmployeeFilters } from '@talentforge/types';
export declare class EmployeesService {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    create(userId: string, dto: CreateEmployeeDto): Promise<Employee>;
    findAll(userId: string, filters?: EmployeeFilters): Promise<EmployeeWithManager[]>;
    findOne(userId: string, id: string): Promise<EmployeeWithManager>;
    update(userId: string, id: string, dto: UpdateEmployeeDto): Promise<Employee>;
    remove(userId: string, id: string): Promise<void>;
    getHierarchy(userId: string, organizationId: string): Promise<any[]>;
    private buildTree;
    getHierarchyLevels(organizationId: string): Promise<any>;
    getValidManagers(level: string, organizationId: string): Promise<any>;
    getHierarchyConfig(organizationId: string): Promise<Record<string, any>>;
    importFromCSV(userId: string, organizationId: string, fileBuffer: Buffer): Promise<{
        success: number;
        errors: Array<{
            row: number;
            field?: string;
            message: string;
        }>;
        total: number;
    }>;
    private parseCSVLine;
}
