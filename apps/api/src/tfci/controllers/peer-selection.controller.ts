import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PeerSelectionService } from '../services/peer-selection.service';
import { SupabaseAuthGuard } from '../../auth/guards/supabase-auth.guard';
import { OrgGuard } from '../../auth/guards/org.guard';
import { OrgId } from '../../auth/decorators/org.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import {
  RegisterPeerSelectionDto,
  PeerSelectionQuotaDto,
  EligiblePeerDto,
  PeerSelectionResultDto,
  GenerateRandomSelectionsDto,
  GenerateAssessmentsResultDto,
} from '../dto/peer-selection.dto';

@ApiTags('TFCI - Seleção de Pares')
@ApiBearerAuth()
// TODO: Reativar guards após corrigir autenticação
// @UseGuards(SupabaseAuthGuard, OrgGuard)
@Controller('tfci/cycles/:cycleId/peer-selection')
export class PeerSelectionController {
  constructor(private readonly peerSelectionService: PeerSelectionService) {}

  @Get('quota')
  @ApiOperation({
    summary: 'Obter quota de seleção de pares',
    description:
      'Calcula quantos pares o funcionário deve escolher baseado na quantidade de colegas elegíveis',
  })
  @ApiParam({ name: 'cycleId', description: 'ID do ciclo TFCI' })
  @ApiResponse({
    status: 200,
    description: 'Quota calculada com sucesso',
    type: PeerSelectionQuotaDto,
  })
  async getQuota(
    @Param('cycleId') cycleId: string,
    @Query('employeeId') employeeId: string,
    @Query('organizationId') organizationId: string,
  ): Promise<PeerSelectionQuotaDto> {
    return this.peerSelectionService.getPeerSelectionQuota(
      cycleId,
      employeeId,
      organizationId,
    );
  }

  @Get('eligible-peers')
  @ApiOperation({
    summary: 'Listar pares elegíveis',
    description:
      'Lista todos os colegas que podem ser escolhidos como pares, com contagem de quantas vezes já foram escolhidos',
  })
  @ApiParam({ name: 'cycleId', description: 'ID do ciclo TFCI' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pares elegíveis',
    type: [EligiblePeerDto],
  })
  async getEligiblePeers(
    @Param('cycleId') cycleId: string,
    @Query('employeeId') employeeId: string,
    @Query('organizationId') organizationId: string,
  ): Promise<EligiblePeerDto[]> {
    return this.peerSelectionService.getEligiblePeers(
      cycleId,
      employeeId,
      organizationId,
    );
  }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar escolha manual de par',
    description:
      'Registra a escolha de um colega como par. Respeitando o limite de 2 escolhas por pessoa no mesmo ciclo',
  })
  @ApiParam({ name: 'cycleId', description: 'ID do ciclo TFCI' })
  @ApiResponse({
    status: 200,
    description: 'Escolha registrada com sucesso',
    type: PeerSelectionResultDto,
  })
  async registerSelection(
    @Param('cycleId') cycleId: string,
    @Query('employeeId') selectorId: string,
    @Body() dto: RegisterPeerSelectionDto,
  ): Promise<PeerSelectionResultDto> {
    return this.peerSelectionService.registerPeerSelection(
      cycleId,
      selectorId,
      dto.selectedPeerId,
    );
  }

  @Post('generate-random')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Gerar sorteios aleatórios',
    description:
      'Completa as escolhas de todos os funcionários com sorteios aleatórios (outra metade não escolhida manualmente)',
  })
  @ApiParam({ name: 'cycleId', description: 'ID do ciclo TFCI' })
  @ApiResponse({
    status: 200,
    description: 'Sorteios gerados com sucesso',
    type: GenerateRandomSelectionsDto,
  })
  async generateRandomSelections(
    @Param('cycleId') cycleId: string,
    @Query('organizationId') organizationId: string,
  ): Promise<GenerateRandomSelectionsDto> {
    return this.peerSelectionService.generateRandomSelections(
      cycleId,
      organizationId,
    );
  }

  @Post('generate-assessments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Gerar todas as avaliações do ciclo',
    description:
      'Gera avaliações hierárquicas (gestor↔subordinados) + avaliações de pares baseadas nas escolhas',
  })
  @ApiParam({ name: 'cycleId', description: 'ID do ciclo TFCI' })
  @ApiResponse({
    status: 200,
    description: 'Avaliações geradas com sucesso',
    type: GenerateAssessmentsResultDto,
  })
  async generateAssessments(
    @Param('cycleId') cycleId: string,
    @Query('organizationId') organizationId: string,
  ): Promise<GenerateAssessmentsResultDto> {
    return this.peerSelectionService.generateCycleAssessments(
      cycleId,
      organizationId,
    );
  }
}
