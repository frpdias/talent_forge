import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateColorAssessmentDto {
  @IsUUID()
  @IsNotEmpty()
  candidateUserId: string;
}
