import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../../common/decorators/current-user.interface';
import { DocumentFileValidator } from '../../common/validators/document-file.validator';
import { ResumeService } from './resume.service';

const MAX_RESUME_SIZE = 10 * 1024 * 1024; // 10 MB

@ApiTags('Resumes')
@ApiBearerAuth()
@Controller('users/me/resumes')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Post()
  @ApiOperation({ summary: 'Upload a CV (PDF/DOC/DOCX)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @CurrentUser() user: CurrentUserPayload,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_RESUME_SIZE }),
          new DocumentFileValidator(),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.resumeService.upload(user.id, file);
  }

  @Get()
  @ApiOperation({ summary: 'List my CVs' })
  list(@CurrentUser() user: CurrentUserPayload) {
    return this.resumeService.list(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a CV with a signed download URL' })
  getOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.resumeService.getOne(user.id, id);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Set a CV as my active resume' })
  activate(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.resumeService.activate(user.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a CV' })
  remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.resumeService.remove(user.id, id);
  }
}
