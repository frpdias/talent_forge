export declare class UpdateEmployeeDto {
    full_name?: string;
    birth_date?: string;
    termination_date?: string;
    manager_id?: string;
    position?: string;
    department?: string;
    user_id?: string;
    status?: 'active' | 'inactive' | 'terminated';
    metadata?: Record<string, any>;
}
