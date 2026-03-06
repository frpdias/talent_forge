import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ActivatePhpDto, UpdatePhpSettingsDto } from './dto/activate-php.dto';
import { PhpActivation, PhpActivationStatus } from './entities/php-activation.entity';

@Injectable()
export class PhpService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  async getStatus(orgId: string, userId: string): Promise<PhpActivationStatus> {
    // Verificar se usuário tem permissão (admin ou owner)
    const { data: member } = await this.supabase
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .single();

    if (!member || !['admin', 'owner'].includes(member.role)) {
      throw new BadRequestException('Insufficient permissions');
    }

    const { data: activation } = await this.supabase
      .from('php_module_activations')
      .select('is_active, activation_plan, activated_at')
      .eq('org_id', orgId)
      .single();

    if (!activation) {
      return {
        is_active: false,
        activation_plan: 'full',
        activated_at: null,
      };
    }

    return {
      is_active: activation.is_active,
      activation_plan: activation.activation_plan,
      activated_at: activation.activated_at,
    };
  }

  async activate(
    orgId: string,
    userId: string,
    dto: ActivatePhpDto,
  ): Promise<PhpActivation> {
    // Verificar se usuário tem permissão (admin ou owner)
    const { data: member } = await this.supabase
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .single();

    if (!member || !['admin', 'owner'].includes(member.role)) {
      throw new BadRequestException('Insufficient permissions');
    }

    // Verificar se já existe ativação
    const { data: existing } = await this.supabase
      .from('php_module_activations')
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (existing) {
      // Atualizar ativação existente
      const { data, error } = await this.supabase
        .from('php_module_activations')
        .update({
          is_active: true,
          activated_at: new Date().toISOString(),
          deactivated_at: null,
          activated_by: userId,
          activation_plan: dto.activation_plan,
          settings: dto.settings || existing.settings,
        })
        .eq('org_id', orgId)
        .select()
        .single();

      if (error) {
        throw new BadRequestException(`Failed to activate: ${error.message}`);
      }

      return data;
    }

    // Criar nova ativação
    const { data, error } = await this.supabase
      .from('php_module_activations')
      .insert({
        org_id: orgId,
        is_active: true,
        activated_at: new Date().toISOString(),
        activated_by: userId,
        activation_plan: dto.activation_plan,
        settings: dto.settings || {},
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to activate: ${error.message}`);
    }

    return data;
  }

  async deactivate(orgId: string, userId: string): Promise<PhpActivation> {
    // Verificar se usuário tem permissão (admin ou owner)
    const { data: member } = await this.supabase
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .single();

    if (!member || !['admin', 'owner'].includes(member.role)) {
      throw new BadRequestException('Insufficient permissions');
    }

    const { data, error } = await this.supabase
      .from('php_module_activations')
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      throw new NotFoundException(`Activation not found: ${error.message}`);
    }

    return data;
  }

  async updateSettings(
    orgId: string,
    userId: string,
    dto: UpdatePhpSettingsDto,
  ): Promise<PhpActivation> {
    // Verificar se usuário tem permissão (admin ou owner)
    const { data: member } = await this.supabase
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .single();

    if (!member || !['admin', 'owner'].includes(member.role)) {
      throw new BadRequestException('Insufficient permissions');
    }

    const { data, error } = await this.supabase
      .from('php_module_activations')
      .update({
        settings: dto.settings,
      })
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      throw new NotFoundException(`Activation not found: ${error.message}`);
    }

    return data;
  }
}
