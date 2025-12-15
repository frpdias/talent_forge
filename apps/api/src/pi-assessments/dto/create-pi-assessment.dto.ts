import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreatePiAssessmentDto {
  @IsUUID()
  @IsNotEmpty()
  candidateUserId: string;
}
