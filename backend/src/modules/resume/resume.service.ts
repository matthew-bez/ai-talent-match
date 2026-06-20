import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../storage/s3.service';

// Internal storage detail; clients get a signed downloadUrl instead.
const RESUME_SELECT = {
  id: true,
  isActive: true,
  parsedSkills: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class ResumeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  async upload(userId: string, file: Express.Multer.File) {
    const key = this.s3.buildObjectKey(`resumes/${userId}`, file.originalname);
    await this.s3.uploadFile(key, file.buffer, file.mimetype);

    try {
      // The first CV a user uploads becomes their active one automatically.
      // The count + create run in a transaction so concurrent uploads see a
      // consistent view of whether an active resume already exists.
      return await this.prisma.$transaction(async (tx) => {
        const existingCount = await tx.resume.count({ where: { userId } });

        return tx.resume.create({
          data: {
            userId,
            s3ObjectKey: key,
            isActive: existingCount === 0,
          },
          select: RESUME_SELECT,
        });
      });
    } catch (error) {
      // The DB write failed — clean up the object we just uploaded so it
      // doesn't dangle in S3 with no row pointing at it.
      await this.s3.deleteObject(key);
      throw error;
    }
  }

  list(userId: string) {
    return this.prisma.resume.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: RESUME_SELECT,
    });
  }

  async getOne(userId: string, id: string) {
    const resume = await this.prisma.resume.findFirst({
      where: { id, userId },
      select: { ...RESUME_SELECT, s3ObjectKey: true },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    const { s3ObjectKey, ...rest } = resume;
    return {
      ...rest,
      downloadUrl: await this.s3.getSignedDownloadUrl(s3ObjectKey),
    };
  }

  /**
   * Promote a resume to "active". Wrapped in a transaction so a user can never
   * end up with two active resumes (or none) if something fails mid-way.
   */
  async activate(userId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.resume.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });

      // Scoped update doubles as the ownership check.
      const result = await tx.resume.updateMany({
        where: { id, userId },
        data: { isActive: true },
      });

      if (result.count === 0) {
        throw new NotFoundException('Resume not found');
      }

      return tx.resume.findUniqueOrThrow({
        where: { id },
        select: RESUME_SELECT,
      });
    });
  }

  async remove(userId: string, id: string) {
    // Fetch, conflict-check and delete run in one transaction so an application
    // can't be attached between the check and the delete.
    const resume = await this.prisma.$transaction(async (tx) => {
      const found = await tx.resume.findFirst({
        where: { id, userId },
        select: {
          id: true,
          s3ObjectKey: true,
          _count: { select: { applications: true } },
        },
      });

      if (!found) {
        throw new NotFoundException('Resume not found');
      }

      // Deleting a resume cascades to its applications (schema), so block it
      // while the CV is still attached to one — withdraw those first.
      if (found._count.applications > 0) {
        throw new ConflictException(
          'This resume is attached to one or more applications and cannot be deleted',
        );
      }

      await tx.resume.delete({ where: { id } });
      return found;
    });

    // Best-effort S3 cleanup after the DB delete has committed.
    await this.s3.deleteObject(resume.s3ObjectKey);
  }
}
