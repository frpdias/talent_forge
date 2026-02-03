import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto';
export declare class EmployeesController {
    private readonly employeesService;
    constructor(employeesService: EmployeesService);
    create(orgId: string, userId: string, createEmployeeDto: CreateEmployeeDto): Promise<import("@talentforge/types").Employee>;
    importCSV(orgId: string, userId: string, file: any, organizationId: string): Promise<{
        success: number;
        errors: Array<{
            row: number;
            field?: string;
            message: string;
        }>;
        total: number;
    }>;
    findAll(orgId: string, userId: string, organizationId?: string, status?: 'active' | 'inactive' | 'terminated', department?: string, managerId?: string, search?: string): Promise<import("@talentforge/types").EmployeeWithManager[]>;
    getHierarchy(orgId: string, userId: string, organizationId: string): Promise<any[]>;
    getHierarchyLevels(orgId: string, organizationId: string): Promise<any>;
    getValidManagers(orgId: string, organizationId: string, level: string): Promise<any>;
    getHierarchyConfig(orgId: string, organizationId: string): Promise<Record<string, any>>;
    findOne(orgId: string, userId: string, id: string): Promise<import("@talentforge/types").EmployeeWithManager>;
    update(orgId: string, userId: string, id: string, updateEmployeeDto: UpdateEmployeeDto): Promise<import("@talentforge/types").Employee>;
    remove(orgId: string, userId: string, id: string): Promise<void>;
}
