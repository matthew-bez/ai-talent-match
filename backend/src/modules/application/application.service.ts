import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';

@Injectable()
export class ApplicationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Submit an application. Runs in a transaction so the job/resume validation
   * and the insert see a consistent snapshot. The unique constraint
   * (jobPostingId, applicantUserId) blocks duplicates and surfaces as a 409 via
   * the global Prisma exception filter.
   */
  async apply(userId: string, jobId: string, dto: CreateApplicationDto) {
    return this.prisma.$transaction(async (tx) => {
      const job = await tx.jobPosting.findUnique({
        where: { id: jobId },
        select: { status: true },
      });

      if (!job) {
        throw new NotFoundException('Job posting not found');
      }
      if (job.status !== 'OPEN') {
        throw new ConflictException(
          'This job is no longer accepting applications',
        );
      }

      const resume = await tx.resume.findFirst({
        where: { id: dto.resumeId, userId },
        select: { id: true },
      });

      if (!resume) {
        throw new NotFoundException('Resume not found');
      }

      return tx.application.create({
        data: {
          jobPostingId: jobId,
          applicantUserId: userId,
          resumeId: dto.resumeId,
        },
      });
    });
  }

  list(userId: string) {
    return this.prisma.application.findMany({
      where: { applicantUserId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        jobPosting: {
          select: {
            id: true,
            title: true,
            status: true,
            location: true,
            organization: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async getOne(userId: string, id: string) {
    const application = await this.prisma.application.findFirst({
      where: { id, applicantUserId: userId },
      include: {
        jobPosting: {
          select: {
            id: true,
            title: true,
            status: true,
            location: true,
            organization: { select: { id: true, name: true } },
          },
        },
        resume: { select: { id: true } },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return application;
  }

  async withdraw(userId: string, id: string) {
    // Scoped delete: ownership check and removal happen in a single atomic
    // statement, so there's no race between verifying and deleting.
    const result = await this.prisma.application.deleteMany({
      where: { id, applicantUserId: userId },
    });

    if (result.count === 0) {
      throw new NotFoundException('Application not found');
    }
  }
}
