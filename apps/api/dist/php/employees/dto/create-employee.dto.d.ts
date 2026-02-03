export declare class CreateEmployeeDto {
    organization_id: string;
    full_name: string;
    cpf: string;
    email?: string;
    phone?: string;
    birth_date?: string;
    hire_date: string;
    manager_id?: string;
    position?: string;
    department?: string;
    status?: string;
    user_id?: string;
    metadata?: Record<string, any>;
}
