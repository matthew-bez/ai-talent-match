import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../../common/decorators/current-user.interface';
import { ApplicationService } from './application.service';
import { CreateApplicationDto } from './dto/create-application.dto';

@ApiTags('Applications')
@ApiBearerAuth()
@Controller()
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post('jobs/:jobId/applications')
  @ApiOperation({ summary: 'Apply for a job' })
  apply(
    @CurrentUser() user: CurrentUserPayload,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.applicationService.apply(user.id, jobId, dto);
  }

  @Get('users/me/applications')
  @ApiOperation({ summary: 'List my applications' })
  list(@CurrentUser() user: CurrentUserPayload) {
    return this.applicationService.list(user.id);
  }

  @Get('users/me/applications/:id')
  @ApiOperation({ summary: 'View one of my applications' })
  getOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.applicationService.getOne(user.id, id);
  }

  @Delete('users/me/applications/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Withdraw an application' })
  withdraw(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.applicationService.withdraw(user.id, id);
  }
}
