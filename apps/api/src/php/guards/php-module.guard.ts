import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class PhpModuleGuard implements CanActivate {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const orgId = request.headers['x-org-id'];

    if (!orgId) {
      throw new ForbiddenException('Organization ID is required');
    }

    // Verificar se módulo PHP está ativo para esta organização
    const { data: org, error } = await this.supabase
      .from('organizations')
      .select('php_module_active')
      .eq('id', orgId)
      .single();

    if (error || !org) {
      throw new ForbiddenException(
        'Organization not found',
      );
    }

    if (!org.php_module_active) {
      throw new ForbiddenException('PHP module is not activated for this organization');
    }

    return true;
  }
}
