import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmploymentType } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateExperienceDto {
  @ApiProperty({ example: 'Senior Backend Engineer' })
  @IsString()
  @MaxLength(150)
  title: string;

  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  @MaxLength(150)
  companyName: string;

  @ApiPropertyOptional({ enum: EmploymentType })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiPropertyOptional({ example: 'Remote' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  location?: string;

  @ApiProperty({ example: '2020-01-01', description: 'ISO 8601 date' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({
    example: '2023-06-01',
    description: 'ISO 8601 date; omit if this is your current role',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @ApiPropertyOptional({ example: 'Led the payments platform rewrite...' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
