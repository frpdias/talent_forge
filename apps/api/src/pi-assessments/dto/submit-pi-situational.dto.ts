import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { PiBlock } from './submit-pi-descriptor.dto';

export enum PiAxis {
  DIRECAO = 'direcao',
  ENERGIA_SOCIAL = 'energia_social',
  RITMO = 'ritmo',
  ESTRUTURA = 'estrutura',
}

export class SubmitPiSituationalDto {
  @IsUUID()
  @IsNotEmpty()
  questionId: string;

  @IsEnum(PiAxis)
  selectedAxis: PiAxis;

  @IsEnum(PiBlock)
  block: PiBlock;
}
