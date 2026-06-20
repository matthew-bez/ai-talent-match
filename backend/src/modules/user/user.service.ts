import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../storage/s3.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { CreateEducationDto } from './dto/create-education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';
import { CreateCertificationDto } from './dto/create-certification.dto';
import { UpdateCertificationDto } from './dto/update-certification.dto';

// Sensitive/internal columns we never return to clients.
const PROFILE_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  headline: true,
  bio: true,
  location: true,
  phone: true,
  profilePictureKey: true,
  skills: true,
  createdAt: true,
  updatedAt: true,
  experiences: { orderBy: { startDate: 'desc' as const } },
  education: { orderBy: { startDate: 'desc' as const } },
  certifications: { orderBy: { issueDate: 'desc' as const } },
  resumes: {
    where: { isActive: true },
    select: { id: true, s3ObjectKey: true, isActive: true, createdAt: true },
  },
};

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  // ---------------------------------------------------------------------------
  // Profile
  // ---------------------------------------------------------------------------

  /** Full profile including child collections and a signed picture URL. */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: PROFILE_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { profilePictureKey, ...rest } = user;
    return {
      ...rest,
      profilePictureUrl: profilePictureKey
        ? await this.s3.getSignedDownloadUrl(profilePictureKey)
        : null,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // update surfaces P2025 -> 404 via the global filter if the user is missing.
    await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });

    return this.getProfile(userId);
  }

  // ---------------------------------------------------------------------------
  // Profile picture
  // ---------------------------------------------------------------------------

  async updateProfilePicture(userId: string, file: Express.Multer.File) {
    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profilePictureKey: true },
    });

    if (!current) {
      throw new NotFoundException('User not found');
    }

    const key = this.s3.buildObjectKey(
      `profile-pictures/${userId}`,
      file.originalname,
    );
    await this.s3.uploadFile(key, file.buffer, file.mimetype);

    await this.prisma.user.update({
      where: { id: userId },
      data: { profilePictureKey: key },
    });

    // Remove the previous image only after the new one is safely persisted.
    if (current.profilePictureKey) {
      await this.s3.deleteObject(current.profilePictureKey);
    }

    return { profilePictureUrl: await this.s3.getSignedDownloadUrl(key) };
  }

  async removeProfilePicture(userId: string) {
    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profilePictureKey: true },
    });

    if (!current) {
      throw new NotFoundException('User not found');
    }

    if (current.profilePictureKey) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { profilePictureKey: null },
      });
      await this.s3.deleteObject(current.profilePictureKey);
    }
  }

  // ---------------------------------------------------------------------------
  // Experience
  // ---------------------------------------------------------------------------

  listExperiences(userId: string) {
    return this.prisma.experience.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
    });
  }

  createExperience(userId: string, dto: CreateExperienceDto) {
    return this.prisma.experience.create({
      data: {
        userId,
        title: dto.title,
        companyName: dto.companyName,
        employmentType: dto.employmentType,
        location: dto.location,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        isCurrent: dto.isCurrent ?? false,
        description: dto.description,
      },
    });
  }

  async updateExperience(userId: string, id: string, dto: UpdateExperienceDto) {
    // Scoped update: the ownership check and the write are one atomic statement.
    const result = await this.prisma.experience.updateMany({
      where: { id, userId },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Experience not found');
    }

    return this.prisma.experience.findUniqueOrThrow({ where: { id } });
  }

  async removeExperience(userId: string, id: string) {
    const result = await this.prisma.experience.deleteMany({
      where: { id, userId },
    });

    if (result.count === 0) {
      throw new NotFoundException('Experience not found');
    }
  }

  // ---------------------------------------------------------------------------
  // Education
  // ---------------------------------------------------------------------------

  listEducation(userId: string) {
    return this.prisma.education.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
    });
  }

  createEducation(userId: string, dto: CreateEducationDto) {
    return this.prisma.education.create({
      data: {
        userId,
        school: dto.school,
        degree: dto.degree,
        fieldOfStudy: dto.fieldOfStudy,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        grade: dto.grade,
        description: dto.description,
      },
    });
  }

  async updateEducation(userId: string, id: string, dto: UpdateEducationDto) {
    const result = await this.prisma.education.updateMany({
      where: { id, userId },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Education entry not found');
    }

    return this.prisma.education.findUniqueOrThrow({ where: { id } });
  }

  async removeEducation(userId: string, id: string) {
    const result = await this.prisma.education.deleteMany({
      where: { id, userId },
    });

    if (result.count === 0) {
      throw new NotFoundException('Education entry not found');
    }
  }

  // ---------------------------------------------------------------------------
  // Certifications
  // ---------------------------------------------------------------------------

  listCertifications(userId: string) {
    return this.prisma.certification.findMany({
      where: { userId },
      orderBy: { issueDate: 'desc' },
    });
  }

  createCertification(userId: string, dto: CreateCertificationDto) {
    return this.prisma.certification.create({
      data: {
        userId,
        name: dto.name,
        issuingOrganization: dto.issuingOrganization,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        expirationDate: dto.expirationDate
          ? new Date(dto.expirationDate)
          : undefined,
        credentialId: dto.credentialId,
        credentialUrl: dto.credentialUrl,
      },
    });
  }

  async updateCertification(
    userId: string,
    id: string,
    dto: UpdateCertificationDto,
  ) {
    const result = await this.prisma.certification.updateMany({
      where: { id, userId },
      data: {
        ...dto,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        expirationDate: dto.expirationDate
          ? new Date(dto.expirationDate)
          : undefined,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Certification not found');
    }

    return this.prisma.certification.findUniqueOrThrow({ where: { id } });
  }

  async removeCertification(userId: string, id: string) {
    const result = await this.prisma.certification.deleteMany({
      where: { id, userId },
    });

    if (result.count === 0) {
      throw new NotFoundException('Certification not found');
    }
  }
}
