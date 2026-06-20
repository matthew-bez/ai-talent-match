import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateCertificationDto {
  @ApiProperty({ example: 'AWS Certified Solutions Architect' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'Amazon Web Services' })
  @IsString()
  @MaxLength(200)
  issuingOrganization: string;

  @ApiPropertyOptional({ example: '2022-05-01', description: 'ISO 8601 date' })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional({ example: '2025-05-01', description: 'ISO 8601 date' })
  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @ApiPropertyOptional({ example: 'ABC-123-XYZ' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  credentialId?: string;

  @ApiPropertyOptional({ example: 'https://verify.example.com/abc' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  credentialUrl?: string;
}
