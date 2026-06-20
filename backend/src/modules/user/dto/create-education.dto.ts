import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateEducationDto {
  @ApiProperty({ example: 'University of Cape Town' })
  @IsString()
  @MaxLength(200)
  school: string;

  @ApiPropertyOptional({ example: 'BSc' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  degree?: string;

  @ApiPropertyOptional({ example: 'Computer Science' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  fieldOfStudy?: string;

  @ApiPropertyOptional({ example: '2014-02-01', description: 'ISO 8601 date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2017-12-01', description: 'ISO 8601 date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'Cum Laude' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  grade?: string;

  @ApiPropertyOptional({ example: 'Focused on distributed systems...' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
