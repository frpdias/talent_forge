import { IsUUID, IsNotEmpty, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterPeerSelectionDto {
  @ApiProperty({ description: 'ID do funcionário selecionado como par' })
  @IsUUID()
  @IsNotEmpty()
  selectedPeerId: string;
}

export class PeerSelectionQuotaDto {
  @ApiProperty({ description: 'Número total de pares elegíveis' })
  peerCount: number;

  @ApiProperty({ description: 'Quantidade de pares que deve escolher' })
  quota: number;

  @ApiProperty({ description: 'Quantos já foram escolhidos manualmente' })
  manualCount: number;

  @ApiProperty({ description: 'Quantos ainda faltam escolher' })
  remaining: number;
}

export class EligiblePeerDto {
  @ApiProperty({ description: 'ID do par' })
  peerId: string;

  @ApiProperty({ description: 'Nome do par' })
  peerName: string;

  @ApiProperty({ description: 'Email do par', required: false })
  peerEmail?: string | null;

  @ApiProperty({ description: 'Cargo do par' })
  peerPosition: string;

  @ApiProperty({ description: 'Departamento do par', required: false })
  department?: string | null;

  @ApiProperty({ description: 'Nível hierárquico do par', required: false })
  hierarchyLevel?: number | null;

  @ApiProperty({ description: 'Quantas vezes foi escolhido neste ciclo' })
  timesChosen: number;

  @ApiProperty({ description: 'Pode ser escolhido (limite < 2)' })
  canBeChosen: boolean;
}

export class PeerSelectionResultDto {
  @ApiProperty({ description: 'Operação bem-sucedida' })
  success: boolean;

  @ApiProperty({ description: 'Mensagem de retorno' })
  message: string;

  @ApiProperty({ description: 'Erro (se houver)', required: false })
  error?: string;
}

export class GenerateRandomSelectionsDto {
  @ApiProperty({ description: 'Total de sorteios gerados' })
  totalGenerated: number;

  @ApiProperty({ description: 'Mensagem de sucesso' })
  message: string;
}

export class GenerateAssessmentsResultDto {
  @ApiProperty({ description: 'Avaliações hierárquicas geradas' })
  hierarchicalAssessments: number;

  @ApiProperty({ description: 'Avaliações de pares geradas' })
  peerAssessments: number;

  @ApiProperty({ description: 'Total de avaliações' })
  totalAssessments: number;

  @ApiProperty({ description: 'Mensagem de sucesso' })
  message: string;
}
