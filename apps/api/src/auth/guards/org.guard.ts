import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../auth.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class OrgGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const orgId = request.headers['x-org-id'];
    const userId = request.user?.sub;

    if (!orgId) {
      throw new ForbiddenException('x-org-id header is required');
    }

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const isMember = await this.authService.isOrgMember(userId, orgId);

    if (!isMember) {
      throw new ForbiddenException('User is not a member of this organization');
    }

    const role = await this.authService.getOrgMemberRole(userId, orgId);

    request.orgId = orgId;
    request.orgRole = role;

    return true;
  }
}
