import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class JobQueryDto {
  @ApiPropertyOptional({ description: 'Keyword search on title & description' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: 'Remote' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Filter by required skills (repeat the param for multiple)',
    example: ['Node.js', 'PostgreSQL'],
  })
  @IsOptional()
  // Normalise a single ?skills=x into an array.
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
