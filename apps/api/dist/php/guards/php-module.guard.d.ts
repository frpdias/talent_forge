import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class PhpModuleGuard implements CanActivate {
    private supabase;
    canActivate(context: ExecutionContext): Promise<boolean>;
}
