import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';

export enum ColorChoice {
  AZUL = 'azul',
  ROSA = 'rosa',
  AMARELO = 'amarelo',
  VERDE = 'verde',
  BRANCO = 'branco',
}

export class SubmitColorResponseDto {
  @IsUUID()
  @IsNotEmpty()
  questionId: string;

  @IsEnum(ColorChoice)
  selectedColor: ColorChoice;
}
