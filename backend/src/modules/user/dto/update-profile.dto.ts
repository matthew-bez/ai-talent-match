import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Jane' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: 'Senior Backend Engineer' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  headline?: string;

  @ApiPropertyOptional({
    example: 'Backend engineer with 15+ years experience...',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional({ example: 'Cape Town, South Africa' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  location?: string;

  @ApiPropertyOptional({ example: '+27 82 000 0000' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['Node.js', 'PostgreSQL', 'NestJS'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];
}
