import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { JobQueryDto } from './dto/job-query.dto';
import { JobService } from './job.service';

@ApiTags('Jobs')
@Public()
@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Get()
  @ApiOperation({ summary: 'Browse / search open job postings' })
  findAll(@Query() query: JobQueryDto) {
    return this.jobService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'View a single job posting' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobService.findOne(id);
  }
}
