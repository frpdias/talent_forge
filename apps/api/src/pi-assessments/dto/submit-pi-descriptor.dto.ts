import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export enum PiBlock {
  NATURAL = 'natural',
  ADAPTADO = 'adaptado',
}

export class SubmitPiDescriptorDto {
  @IsUUID()
  @IsNotEmpty()
  descriptorId: string;

  @IsEnum(PiBlock)
  block: PiBlock;

  @IsOptional()
  selected?: boolean;
}
