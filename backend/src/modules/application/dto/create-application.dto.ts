import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateApplicationDto {
  @ApiProperty({
    description: 'The CV to submit with this application',
    format: 'uuid',
  })
  @IsUUID()
  resumeId: string;
}
