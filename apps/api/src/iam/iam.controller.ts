import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.service';
import { IamService } from './iam.service';
import {
  AddTenantUserDto,
  CreateApiKeyDto,
  CreatePermissionDto,
  CreatePolicyDto,
  CreateRoleDto,
  CreateTenantDto,
  UpdateTenantUserDto,
} from './dto';

@ApiTags('IAM')
@ApiBearerAuth()
@Controller()
export class IamController {
  constructor(private readonly iamService: IamService) {}

  @Get('tenants')
  @ApiOperation({ summary: 'List tenants for current user' })
  listTenants(@CurrentUser() user: JwtPayload) {
    return this.iamService.listTenants(user.sub);
  }

  @Post('tenants')
  @ApiOperation({ summary: 'Create tenant' })
  createTenant(@Body() dto: CreateTenantDto, @CurrentUser() user: JwtPayload) {
    return this.iamService.createTenant(dto, user.sub);
  }

  @Get('tenants/:id')
  @ApiOperation({ summary: 'Get tenant by id' })
  getTenant(@Param('id') tenantId: string, @CurrentUser() user: JwtPayload) {
    return this.iamService.getTenant(tenantId, user.sub);
  }

  @Post('tenants/:id/users')
  @ApiOperation({ summary: 'Add user to tenant' })
  addTenantUser(
    @Param('id') tenantId: string,
    @Body() dto: AddTenantUserDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.iamService.addTenantUser(tenantId, dto, user.sub);
  }

  @Patch('tenants/:id/users/:userId')
  @ApiOperation({ summary: 'Update tenant user' })
  updateTenantUser(
    @Param('id') tenantId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateTenantUserDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.iamService.updateTenantUser(tenantId, targetUserId, dto, user.sub);
  }

  @Get('roles')
  @ApiOperation({ summary: 'List roles' })
  listRoles() {
    return this.iamService.listRoles();
  }

  @Post('roles')
  @ApiOperation({ summary: 'Create role' })
  createRole(@Body() dto: CreateRoleDto) {
    return this.iamService.createRole(dto);
  }

  @Get('permissions')
  @ApiOperation({ summary: 'List permissions' })
  listPermissions() {
    return this.iamService.listPermissions();
  }

  @Post('permissions')
  @ApiOperation({ summary: 'Create permission' })
  createPermission(@Body() dto: CreatePermissionDto) {
    return this.iamService.createPermission(dto);
  }

  @Post('policies')
  @ApiOperation({ summary: 'Create policy' })
  createPolicy(@Body() dto: CreatePolicyDto) {
    return this.iamService.createPolicy(dto);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'List audit logs' })
  listAuditLogs(@Query('tenantId') tenantId?: string) {
    return this.iamService.listAuditLogs(tenantId);
  }

  @Get('security-events')
  @ApiOperation({ summary: 'List security events' })
  listSecurityEvents(@Query('tenantId') tenantId?: string) {
    return this.iamService.listSecurityEvents(tenantId);
  }

  @Post('api-keys')
  @ApiOperation({ summary: 'Create API key' })
  createApiKey(@Body() dto: CreateApiKeyDto) {
    return this.iamService.createApiKey(dto);
  }

  @Delete('api-keys/:id')
  @ApiOperation({ summary: 'Delete API key' })
  deleteApiKey(@Param('id') id: string) {
    return this.iamService.deleteApiKey(id);
  }
}
