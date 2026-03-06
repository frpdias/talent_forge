export type EmployeeStatus = 'active' | 'inactive' | 'terminated';
export interface Employee {
    id: string;
    organization_id: string;
    full_name: string;
    cpf: string;
    birth_date: string | null;
    hire_date: string;
    termination_date: string | null;
    manager_id: string | null;
    position: string | null;
    department: string | null;
    user_id: string | null;
    status: EmployeeStatus;
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
}
export interface EmployeeWithManager extends Employee {
    manager?: Pick<Employee, 'id' | 'full_name' | 'position'> | null;
}
export interface EmployeeWithOrganization extends Employee {
    organization?: {
        id: string;
        name: string;
        org_type: string;
    };
}
export interface CreateEmployeeDto {
    organization_id: string;
    full_name: string;
    cpf: string;
    birth_date?: string;
    hire_date: string;
    manager_id?: string;
    position?: string;
    department?: string;
    user_id?: string;
    metadata?: Record<string, any>;
}
export interface UpdateEmployeeDto {
    full_name?: string;
    birth_date?: string;
    termination_date?: string;
    manager_id?: string;
    position?: string;
    department?: string;
    user_id?: string;
    status?: EmployeeStatus;
    metadata?: Record<string, any>;
}
export interface EmployeeFilters {
    organization_id?: string;
    status?: EmployeeStatus;
    department?: string;
    manager_id?: string;
    search?: string;
}
