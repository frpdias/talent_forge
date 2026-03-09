import { IsString, IsNotEmpty, IsDateString, IsInt, IsIn, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateInterviewDto {
  @IsUUID()
  @IsNotEmpty()
  candidateId: string;

  @IsUUID()
  @IsNotEmpty()
  applicationId: string;

  @IsUUID()
  @IsNotEmpty()
  jobId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsDateString()
  scheduledAt: string;

  @IsInt()
  @Min(15)
  durationMinutes: number;

  @IsIn(['video', 'presencial', 'phone'])
  type: 'video' | 'presencial' | 'phone';

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  meetLink?: string;

  /**
   * E-mail do candidato para envio de confirmação.
   * Buscado automaticamente da tabela candidates se não informado.
   */
  @IsString()
  @IsOptional()
  candidateEmail?: string;
}
