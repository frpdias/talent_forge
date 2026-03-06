import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ApplicationStatus {
  APPLIED = 'applied',
  IN_PROCESS = 'in_process',
  HIRED = 'hired',
  REJECTED = 'rejected',
}

export class UpdateApplicationStatusDto {
  @ApiProperty({
    description: 'New application status',
    enum: ApplicationStatus,
    example: 'in_process',
  })
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @ApiProperty({
    description: 'Optional note about the status change',
    example: 'Candidate passed initial screening',
    required: false,
  })
  @IsOptional()
  @IsString()
  note?: string;
}
