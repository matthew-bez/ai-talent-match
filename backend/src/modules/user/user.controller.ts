import {
  Body,
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
import { ImageFileValidator } from '../../common/validators/image-file.validator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { CreateEducationDto } from './dto/create-education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';
import { CreateCertificationDto } from './dto/create-certification.dto';
import { UpdateCertificationDto } from './dto/update-certification.dto';
import { UserService } from './user.service';

const MAX_PICTURE_SIZE = 5 * 1024 * 1024; // 5 MB

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('users/me')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // --- Profile ---------------------------------------------------------------

  @Get()
  @ApiOperation({ summary: 'Get my full profile' })
  getProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.userService.getProfile(user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update my profile details' })
  updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(user.id, dto);
  }

  // --- Profile picture -------------------------------------------------------

  @Post('profile-picture')
  @ApiOperation({ summary: 'Upload / replace my profile picture' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadProfilePicture(
    @CurrentUser() user: CurrentUserPayload,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_PICTURE_SIZE }),
          new ImageFileValidator(),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.userService.updateProfilePicture(user.id, file);
  }

  @Delete('profile-picture')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove my profile picture' })
  removeProfilePicture(@CurrentUser() user: CurrentUserPayload) {
    return this.userService.removeProfilePicture(user.id);
  }

  // --- Experience ------------------------------------------------------------

  @Get('experiences')
  @ApiTags('Profile - Experience')
  @ApiOperation({ summary: 'List my work experience' })
  listExperiences(@CurrentUser() user: CurrentUserPayload) {
    return this.userService.listExperiences(user.id);
  }

  @Post('experiences')
  @ApiTags('Profile - Experience')
  @ApiOperation({ summary: 'Add a work experience entry' })
  createExperience(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateExperienceDto,
  ) {
    return this.userService.createExperience(user.id, dto);
  }

  @Patch('experiences/:id')
  @ApiTags('Profile - Experience')
  @ApiOperation({ summary: 'Update a work experience entry' })
  updateExperience(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExperienceDto,
  ) {
    return this.userService.updateExperience(user.id, id, dto);
  }

  @Delete('experiences/:id')
  @ApiTags('Profile - Experience')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a work experience entry' })
  removeExperience(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.userService.removeExperience(user.id, id);
  }

  // --- Education -------------------------------------------------------------

  @Get('education')
  @ApiTags('Profile - Education')
  @ApiOperation({ summary: 'List my education' })
  listEducation(@CurrentUser() user: CurrentUserPayload) {
    return this.userService.listEducation(user.id);
  }

  @Post('education')
  @ApiTags('Profile - Education')
  @ApiOperation({ summary: 'Add an education entry' })
  createEducation(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateEducationDto,
  ) {
    return this.userService.createEducation(user.id, dto);
  }

  @Patch('education/:id')
  @ApiTags('Profile - Education')
  @ApiOperation({ summary: 'Update an education entry' })
  updateEducation(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEducationDto,
  ) {
    return this.userService.updateEducation(user.id, id, dto);
  }

  @Delete('education/:id')
  @ApiTags('Profile - Education')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an education entry' })
  removeEducation(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.userService.removeEducation(user.id, id);
  }

  // --- Certifications --------------------------------------------------------

  @Get('certifications')
  @ApiTags('Profile - Certifications')
  @ApiOperation({ summary: 'List my certifications' })
  listCertifications(@CurrentUser() user: CurrentUserPayload) {
    return this.userService.listCertifications(user.id);
  }

  @Post('certifications')
  @ApiTags('Profile - Certifications')
  @ApiOperation({ summary: 'Add a certification' })
  createCertification(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateCertificationDto,
  ) {
    return this.userService.createCertification(user.id, dto);
  }

  @Patch('certifications/:id')
  @ApiTags('Profile - Certifications')
  @ApiOperation({ summary: 'Update a certification' })
  updateCertification(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCertificationDto,
  ) {
    return this.userService.updateCertification(user.id, id, dto);
  }

  @Delete('certifications/:id')
  @ApiTags('Profile - Certifications')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a certification' })
  removeCertification(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.userService.removeCertification(user.id, id);
  }
}
